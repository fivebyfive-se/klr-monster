((win, doc) => {
    win.orthogonal = (() => {
        //#region Internal:
        const addGetter = (obj, name, handler) => Object.defineProperty(obj, name, { get: handler });
        const dirtyable = (baseObj = { value: undefined }, dirtyProperty = 'value') => {
            return new Proxy({ ...baseObj, isDirty: false }, {
                set: (obj, propertyName, value) => {
                    if (propertyName === dirtyProperty) {
                        obj.isDirty = true;
                    }
                    obj[propertyName] = value;

                    return true;
                },
                get: (obj, propertyName) => obj[propertyName]
            });
        };
        const hash = (str) => {
            let h = 0;
            for (let i = 0; i < str.length; i++) {
                const c = str.charCodeAt(i);
                h  = ((h << 5) - h) + c;
                h |= 0; // Convert to 32bit integer
            }
            return h;
        };
        const hashString = (str) => hash(str).toString();

        class OrthoCache {
            constructor() {
                const self = this;
                const cache = {};

                this.createKey = (...objects) => {
                    return objects.filter((o) => typeof o !== 'undefined' && o !== 'null').map((o) => typeof o === 'string' 
                        ? hashString(o) 
                            : Array.isArray(o) ? self.createKey(...o)
                                : typeof o === 'object' ? self.createKey(...Object.keys(o))
                                    : hashString(o.toString)
                    ).join(',');
                };

                this.get = (key, getter) => {
                    const cacheKey = typeof key === 'string' ? key : self.createKey(cacheKey);
                    if (!cache[key]) {
                        cache[key] = (typeof getter === 'function' ? getter : (() => getter)).call();
                    }
                    return cache[key];
                };
            }
        }


        class OrthoExpressionParser {
            constructor(testVariableFunction = null) {
                const self = this;
                const nameInExpression =  testVariableFunction || ((name, expression) => new RegExp(`\\b${name}\\b`).test(expression));
                const cache = new OrthoCache();

                this.parse = (expression, context) => {
                    return cache.get([expression, context], () => {
                        return Object.keys(context)
                            .filter((key) => nameInExpression(key, expression))
                            .reduce(
                                (prev, key) => ([ ...prev, { key, value: context[key] } ]),
                                []
                            );
                    });
                };

                this.createFunction = (expression, context) => {
                    const variables = self.parse(expression, context);
                    const expressionFunction = Function(
                        ...variables.map((v) => v.key),
                        `"use strict"; return (${expression});`
                    );
                    return { variables, expressionFunction };
                };

                this.createInjectedFunction = (expression, context) => {
                    const { variables, expressionFunction } = self.createFunction(expression, context);

                    return (...args) => expressionFunction.call(context, ...variables.map((v) => v.value), ...args);
                };
    
                this.run = (expression, context, ...args) => self.createInjectedFunction(expression, context)(...args);
            }
        }

        //#region Dependency injection
        class OrthoInjector {
            constructor(container = null, lazyload = true) {
                const self = this;
                const injectContainer = container || {};
                const expressionParser = new OrthoExpressionParser();
    
                const argumentNames = (func) => {
                    return typeof func !== 'function' ? [] : (func + '')
                        .replace(/[/][/].*$/mg, '') // strip single-line comments
                        .replace(/\s+/g, '') // strip white space
                        .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments  
                        .split('){', 1)[0].replace(/^[^(]*[(]/, '') // extract the parameters  
                        .replace(/=[^,]+/g, '') // strip any ES6 defaults  
                        .split(',').filter(Boolean); // split & filter [""]
                };
    
                const loadInjections = (injectedArgs) => injectedArgs.map((a) => {
                    if (lazyload && typeof injectContainer[a] === 'function') { 
                        injectContainer[a] =  self.callFunction(injectContainer[a]);
                    }
                    return injectContainer[a];
                });
    
                this.register = (name, dependency) => {
                    injectContainer[name] = dependency;
                    return self;
                };
    
                this.registerAll = (newContext,) => {
                    Object.keys(newContext).forEach((k) => self.register(k, newContext[k], injectContainer));
                    return self;
                };
    
                this.injectExplicit = (func, ...injectArgs) => (...args) => func.call(injectContainer, ...loadInjections(injectArgs), ...args);
    
                this.injectFunction = (func) => {
                    const args = argumentNames(func);
                    const injectArgs = args.filter((a) => a in injectContainer);
                        
                    return self.injectExplicit(func, ...injectArgs);
                };
    
                this.callFunction = (func, ...args) => self.injectFunction(func)(...args);
    
                this.injectExpression = (expression) => () => {
                    const { variables, expressionFunction } = expressionParser.parse(expression, injectContainer);
                    return self.injectExplicit(expressionFunction, ...variables.map((v) => v.key));
                };
    
                this.callExpression = (expression) => self.injectExpression(expression)();

                addGetter(this, 'container', () => injectContainer);
            }
        }
        //#endregion

        //#region createOrthoStore
        class OrthoStoreAction {
            constructor(label, transformCallback = null) {
                addGetter(this, 'label', () => label);
                addGetter(this, 'transform', () => transformCallback);
            }
        }

        class OrthoStoreSubscriber {
            constructor(handler, repeat = true) {
                const opts = {
                    handler,
                    repeat: repeat === true ? -1: +repeat
                };

                this.trigger = (context = {}, ...args) => {
                    opts.handler.call(context, ...args);
                    if (opts.repeat >= 0) {
                        opts.repeat--;
                    }
                };
                this.unsubscribe = () => opts.repeat = 0;

                addGetter(this, 'shouldRepeat', () => opts.repeat !== 0);
            }
        }

        class OrthoStoreSelector {
            constructor(valuePath) {
                const self = this;
                const opts = {
                    valuePath,
                    path: valuePath.join('.'),
                    handlers: [],
                    currValue: dirtyable({value: null}, 'value'),
                };
                                    
                const getValueFromState = (state, path) => {
                    const [currKey, ...restOfPath] = path;
                    const currValue = currKey in state ? state[currKey] : null;
                    return restOfPath.length > 0 && currValue ? getValueFromState(currValue, restOfPath) : currValue;
                };
                const addHandler = (subscriber) => {
                    opts.handlers = [...opts.handlers, subscriber];
                    return self;
                };

                this.update = (newState) => {
                    const newValue = getValueFromState(newState, opts.valuePath);
                    if (!opts.currValue.isDirty || newValue !== opts.currValue.value) {
                        opts.currValue.value = newValue;
                        opts.handlers = opts.handlers.filter((h) => h.shouldRepeat);
                        opts.handlers.forEach((h) => h.trigger(self, opts.currValue.value));
                    }
                };

                this.subscribe = (handler) => addHandler(new OrthoStoreSubscriber(handler, true));
                this.then = (handler) => addHandler(new OrthoStoreSubscriber(handler, 1));
                this.once = (handler) => {
                    if (opts.currValue.isDirty) {
                        handler.call(self, opts.currValue.value);
                        return self;
                    }
                    return self.then(handler);
                };

                addGetter(this, 'path', () => opts.path);
                addGetter(this, 'current', () => opts.currValue.value);
            }
        }

        class OrthoStore {
            constructor() {
                const self = this;
                const store = {
                    state: {},
                    actions: [
                        new OrthoStoreAction('$set', (state, {key, value}) => {
                            const newState = { ...state };
                            newState[key] = value;
                            return newState;
                        }),
                        new OrthoStoreAction('$update', (state, update) => ({ ...state, ...update }))
                    ],
                    selectors: []
                };

                //#region Action-helpers
                const addAction = (label, transform) => store.actions.push(new OrthoStoreAction(label, transform));
                const findActions = (label) => store.actions.filter((action) => label === action.label);
                const applyActions = (startState, label, payload) => findActions(label).reduce(
                    (newState, action) => action.transform(newState, payload, self.dispatch),
                    startState
                );
                //#endregion

                const updateStore = (...updates) => {
                    store.state = updates
                        .map(([a, p]) => ({action: a, payload: !p ? null : p.length === 1 ? p[0] : p }))
                        .reduce(
                            (updatedState, { action, payload }) => applyActions(updatedState, action, payload),
                            store.state
                        );
                    store.selectors.forEach((sel) => sel.update(store.state));
                };

                this.state = (initialState) => {
                    store.state = { ...store.state, ...initialState };
                    return self;
                };

                this.actions = (actions = {}) => {
                    Object.keys(actions).forEach((label) => addAction(label, actions[label]));
                    return self;
                };

                this.dispatch = (...actions) => {
                    const [ action, ...payload ] = actions;
                    if (typeof action === 'string') {
                        updateStore([ action, payload ]);
                    } else {
                        updateStore(...actions);
                    }
                    return self;
                };

                this.select = (selectorOrPath) => {
                    const pathSelector = typeof selectorOrPath === 'string' ? selectorOrPath.split('.') : [...selectorOrPath];
                    const path = pathSelector.join('.');
                    let selector = store.selectors.find((s) => s.path === path);
                    if (!selector) {
                        selector = new OrthoStoreSelector(pathSelector);
                        store.selectors.push(selector);
                    }

                    return selector;
                };

                addGetter(this, 'stateProxy', () => new Proxy(store.state, {
                    set: (target, key, value) => {
                        if (['$scope', '$rootScope'].includes(key)) {
                            self.dispatch('$set', { key, value: { ...value }});
                        }
                        self.dispatch('$set', { key, value });
                        return true;
                    }
                }))
            }
        }
        //#endregion

        //#region Factories
        class OrthoFactory {
            constructor(creatorFunc) {
                const instances = {};
                this.create = (name, ...args) => {
                    instances[name] = instances[name] || creatorFunc.call({}, ...args);
                    return instances[name];
                };
            }
        }
        const orthoCacheFactory = new OrthoFactory(() => new OrthoCache());
        const orthoExpressionParserFactory = new OrthoFactory((testFunction = null) => new OrthoExpressionParser(testFunction));
        const orthoInjectorFactory = new OrthoFactory((context = {}) => new OrthoInjector(context));
        const orthoStoreFactory = new OrthoFactory(() => new OrthoStore());
        //#endregio
        //#endregion

        //#region Class-definition:
        class Orthogonal {
            constructor() {
                const self = this;
                const injector = orthoInjectorFactory.create();

                //#region Injector
                this.register = injector.register;
                this.inject = (expression) => typeof expression === 'function' 
                    ? injector.injectFunction(expression) 
                    : injector.injectExpression(expression);
    
                this.call = (expression, ...args) => typeof expression === 'function' 
                    ? injector.callFunction(expression, ...args) 
                    : injector.callExpression(expression);
                //#endregion

                //#region Events
                this.onReady = (func) => {
                    const callback = self.inject(func);
                    if (doc.readyState === 'DOMContentLoaded') {
                        callback();
                    }
                    else {
                        win.addEventListener('load', callback);
                    }
                };
                //#endregion
                
                //#region Registration
                injector.registerAll({
                    $cacheParser: () => orthoCacheFactory,
                    $expressionParser: () => orthoExpressionParserFactory,
                    $injector: () => orthoInjectorFactory,
                    $store: () => orthoStoreFactory,
                    $window: win,
                    $document: doc
                });
                //#endregion
            }
        }
        //#endregion

        return new Orthogonal();
    })();
})(window, document);