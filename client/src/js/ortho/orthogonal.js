/**
 * Orthogonal is a JavaScript library providing:
 *  a) dependency injection,
 *  b) a store,
 *  c) a cache, &
 *  d) a bunch of utility methods
 * 
 * The variable `orthogonal` is added to the global scope (I know! I know!),
 * which exposes the functionality.
 * 
 * Some examples:
 * 
```js
    // onReady is a utility method, which calls a dependency-injected version
    // of the function you pass it either directly, if the DOM is loaded, or
    // on window.load. 
    orthogonal.onReady(($css, $store) => { // inject $css $store
        const menuStore = $store.create('menu') // create a new store
            .state({
                header: {
                    isDetached: false,
                    height: 0
                },
                isMobile: false
            })
            .actions({
                updateHeader: (state, {isDetached, height}) => ({...state, header: { isDetached, height }}),
                updateIsMobile: (state, isMobile) => ({ ...state, isMobile }),
            });

        // $css contains helpers for working with $css, see `./orthogonal.extensions.js`
        const [headerClass, detachedClass] = $css.classNames('header', 'detached'); // => ['header', 'header--detached']
        const header = document.querySelector(`.${headerClass}`);
        // => $css.getVar() parses and returns css variables
        const mobileBreakpoint = +$css.getVar('--breakpoint-mobile').replace('px', '');

        // subscribe to changes of the value at the path `header.isDetached` in the store
        menuStore.select('header.isDetached')
            .subscribe((detached) => header.classList.toggle(detachedClass, detached));
    });
```
 */


((win, doc) => {
    /**
     *  @module se/fivebyfive/ortho
     */

    /**
     * Globally exported instance of Orthogonal 
     * @global 
     * @const {Orthogonal} orthogonal
     */
    const orthogonal = (() => {
        /**
         * Let's start out with some caching stuff
         */
        //#region Internal:
        
        /**
         * Helper function for adding a new getter-method to an object.
         * @param {any} obj 
         * @param {string} name 
         * @param {function} handler 
         */
        const addGetter = (obj, name, handler) => Object.defineProperty(obj, name, { get: handler });

        /**
         * Wrap an value in a Proxy which sets a property, `isDirty` when the property
         * named in `dirtyProperty` is modified.
         * @param {any} baseObj 
         * @param {string} dirtyProperty 
         * @returns {any} Proxied version of `baseObj`
         */
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

        /**
         * @param {string} str 
         * @returns {number}
         */
        const hash = (str) => {
            let h = 0;
            for (let i = 0; i < str.length; i++) {
                const c = str.charCodeAt(i);
                h  = ((h << 5) - h) + c;
                h |= 0; // Convert to 32bit integer
            }
            return h;
        };
        /**
         * @param {string} str 
         * @returns {string}
         */
        const hashString = (str) => hash(str).toString();

        /**
         * @classdesc Exported as `$cache` fron ortho.
         * @class OrthoCache
         */
        class OrthoCache {
            constructor() {
                const self = this;
                const cache = {};

                /**
                 * Convert a bunch of different values into a unique key.
                 * @param  {...any} objects 
                 * @returns {string}
                 */
                this.createKey = (...objects) => {
                    return objects.filter((o) => typeof o !== 'undefined' && o !== 'null').map((o) => typeof o === 'string' 
                        ? hashString(o) 
                            : Array.isArray(o) ? self.createKey(...o)
                                : typeof o === 'object' ? self.createKey(...Object.keys(o))
                                    : hashString(o.toString)
                    ).join(',');
                };

                /**
                 * Get a value from the cache, as identified by `key` or, if it doesn't exist,
                 * call `getter`, store the value as `key` and return it.
                 * @param {string} key 
                 * @param {function} getter 
                 * @returns {any}
                 */
                this.get = (key, getter) => {
                    const cacheKey = typeof key === 'string' ? key : self.createKey(cacheKey);
                    if (!cache[key]) {
                        cache[key] = (typeof getter === 'function' ? getter : (() => getter)).call();
                    }
                    return cache[key];
                };
            }
        }


        /**
         * @classdesc Primarily used for dependency injection. Contains
         * methods for reflection -- parsing functions to see
         * which parameters it has and what they're called
         * Dependency injected as `$expressionParser`
         * @class OrthoExpressionParser
         */
        class OrthoExpressionParser {
            constructor(testVariableFunction = null) {
                const self = this;
                const nameInExpression =  testVariableFunction || ((name, expression) => new RegExp(`\\b${name}\\b`).test(expression));
                const cache = new OrthoCache();

                /**
                 * Find all variable names which have keys in `context` in the JavaScript
                 * code in `expression`.
                 * @param {string} expression 
                 * @param {Map<string, any>} context 
                 * @returns {Map<string, any>[]}
                 */
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

                /**
                 * The javascript code in `expression` and create a new function, whose 
                 * parameters are named the same as all the variables referenced in the code
                 * which have a value in `context`, and all
                 * @param {string} expression 
                 * @param {Map<string, any>} context
                 * @returns {{variables: {key: string, value: any}[], expressFunction: function}} 
                 * @example // returns {variables: [{key: a, value: 3}], expressFunction: (a) => a + 1}; 
                 *  $expressionParser.createFunction('a + 1', { a: 3});  
                 */
                this.createFunction = (expression, context) => {
                    const variables = self.parse(expression, context);
                    const expressionFunction = Function(
                        ...variables.map((v) => v.key),
                        `"use strict"; return (${expression});`
                    );
                    return { variables, expressionFunction };
                };

                /**
                 * Wrap a JavaScript expression in a dependency-injecting function,
                 * injecting the values from `context` whose keys match variable-names
                 * in `expression`.
                 * @param {string} expression 
                 * @param {object} context 
                 * @returns {function}
                 */
                this.createInjectedFunction = (expression, context) => {
                    const { variables, expressionFunction } = self.createFunction(expression, context);

                    return (...args) => expressionFunction.call(context, ...variables.map((v) => v.value), ...args);
                };
    
                /**
                 * Create and run a dependency-injection wrapped function using the code
                 * in `expression`, injecting the values from `context` whose keys match variable-names
                 * in `expression`.
                 * @param {string} expression 
                 * @param {object} context 
                 * @param  {...any} args 
                 * @returns {function}
                 */
                this.run = (expression, context, ...args) => self.createInjectedFunction(expression, context)(...args);
            }
        }

        //#region Dependency injection
        /**
         * @classdesc Dependency injector. Itself injected as `$injector`.
         * @class OrthoInjector
         */
        class OrthoInjector {
            constructor(container = null, lazyload = true) {
                const self = this;
                const injectContainer = container || {};
                const expressionParser = new OrthoExpressionParser();
    
                /**
                 * Get argument names from `func`
                 * @param {function} func 
                 */
                const argumentNames = (func) => {
                    return typeof func !== 'function' ? [] : (func + '')
                        .replace(/[/][/].*$/mg, '') // strip single-line comments
                        .replace(/\s+/g, '') // strip white space
                        .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments  
                        .split('){', 1)[0].replace(/^[^(]*[(]/, '') // extract the parameters  
                        .replace(/=[^,]+/g, '') // strip any ES6 defaults  
                        .split(',').filter(Boolean); // split & filter [""]
                };
    
                /**
                 * Get all dependencies which have names matching keys
                 * in `injectedArgs`. If the dependency is a function, and `lazyload` is `true`,
                 * call the function, replacing it in container with its return value.
                 * @param {string[]} injectedArgs 
                 * @returns {object}
                 * @private
                 * @method
                 */
                const loadInjections = (injectedArgs) => injectedArgs.map((a) => {
                    if (lazyload && typeof injectContainer[a] === 'function') { 
                        injectContainer[a] =  self.callFunction(injectContainer[a]);
                    }
                    return injectContainer[a];
                });
    

                /**
                 * Register a new dependency under the name `name`.
                 * If `dependency` is a function, it is assumed to
                 * be a factory for the dependency, which will be called
                 * once, the first time the dependency is injected, injecting
                 * its return value insted 
                 * @param {string} name 
                 * @param {function|any} dependency 
                 * @returns {OrthoInjector}
                 * @public
                 * @method
                 */
                this.register = (name, dependency) => {
                    injectContainer[name] = dependency;
                    return self;
                };
    
                /**
                 * Register all values in `newContext` with names matching their key.
                 * @param {object} newContext 
                 * @returns {OrthoInjector}
                 * @public
                 * @method
                 */
                this.registerAll = (newContext) => {
                    Object.keys(newContext).forEach((k) => self.register(k, newContext[k], injectContainer));
                    return self;
                };
    
                /**
                 * Create a dependency-injected version of `func`, explicity injecting the
                 * dependencies listed in `injectArgs` only.
                 * @param {function} func 
                 * @param  {...string} injectArgs 
                 * @returns {function}
                 * @public
                 * @method
                 */
                this.injectExplicit = (func, ...injectArgs) => (...args) => func.call(injectContainer, ...loadInjections(injectArgs), ...args);

                /**
                 * Create a dependency-injected version of `func`, automatically injecting all
                 * the dependencies reference in its argument list.
                 * @param {function} func 
                 * @returns {function}
                 * @public
                 * @method
                 */
                this.injectFunction = (func) => {
                    const args = argumentNames(func);
                    const injectArgs = args.filter((a) => a in injectContainer);
                        
                    return self.injectExplicit(func, ...injectArgs);
                };
                
                /**
                 * Create and call a dependency-injected version of `func`, automatically injecting all
                 * the dependencies reference in its argument list.
                 * @param {function} func 
                 * @returns {any}
                 * @public
                 * @method
                 */
                this.callFunction = (func, ...args) => self.injectFunction(func)(...args);
    
                /**
                 * Create a function which wraps the code in `expression`, injecting all
                 * dependencies referenced in the code.
                 * @param {string} expression 
                 * @returns {function}
                 * @public
                 * @method
                 */
                this.injectExpression = (expression) => () => {
                    const { variables, expressionFunction } = expressionParser.parse(expression, injectContainer);
                    return self.injectExplicit(expressionFunction, ...variables.map((v) => v.key));
                };

                /**
                 * Create and call a function which wraps the code in `expression`, injecting all
                 * dependencies referenced in the code.
                 * @param {string} expression 
                 * @returns {any}
                 * @public
                 * @method
                 */
                this.callExpression = (expression) => self.injectExpression(expression)();

                addGetter(this, 'container', () => injectContainer);
            }
        }
        //#endregion

        //#region createOrthoStore
        /**
         * Class representing an action in `OrthoStore`
         * @internal
         */
        class OrthoStoreAction {
            constructor(label, transformCallback = null) {
                addGetter(this, 'label', () => label);
                addGetter(this, 'transform', () => transformCallback);
            }
        }

        /**
         * Class representing a subscriber in `OrthoStore`
         * @internal
         */
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

        /**
         * Class representing a selector in `OrthoStore`
         * @internal
         */
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

        /**
         * @classdesc Dependency-injected as `$store`.
         * @class OrthoStore
         */
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

                /** @public @method */
                this.state = (initialState) => {
                    store.state = { ...store.state, ...initialState };
                    return self;
                };

                /** @public @method */
                this.actions = (actions = {}) => {
                    Object.keys(actions).forEach((label) => addAction(label, actions[label]));
                    return self;
                };

                /** @public @method */
                this.dispatch = (...actions) => {
                    const [ action, ...payload ] = actions;
                    if (typeof action === 'string') {
                        updateStore([ action, payload ]);
                    } else {
                        updateStore(...actions);
                    }
                    return self;
                };

                 /** @public @method */
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
        /**
         * @classdesc The main entry point
         * @class Orthogonal
         * @augments OrthoInjector
         */
        class Orthogonal {
            constructor() {
                /** @const {Orthogonal} injector */
                const self = this;
                /** @const {OrthoInjector} injector */
                const injector = orthoInjectorFactory.create();

                //#region Injector
                /** @inheritdoc OrthoInjector#register */
                this.register = injector.register;

                /**
                 * Wrap `expression` (which can be either a string containing JavaScript or a function)
                 * in a dependency-injecting function.
                 * @param {string|function} expression
                 * @return {function}
                 * @public @method
                 * */
                this.inject = (expression) => typeof expression === 'function' 
                    ? injector.injectFunction(expression) 
                    : injector.injectExpression(expression);

                 /**
                 * Wrap `expression` (which can be either a string containing JavaScript or a function)
                 * in a dependency-injecting function, and call it, passing along `args` as arguments after
                 * the injected dependencies.
                 * @param {string|function} expression
                 * @param {any[]} args
                 * @return {any}
                 * @public @method
                 * */   
                this.call = (expression, ...args) => typeof expression === 'function' 
                    ? injector.callFunction(expression, ...args) 
                    : injector.callExpression(expression);
                //#endregion

                //#region Events
                /**
                 * Inject dependencies into the function `func`, and call it once
                 * the browser window has loaded (or directly if it already has). 
                 * @param {function} func 
                 */
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
                /** @namespace Services */
                const dependencies = {
                    /** @type {OrthoCache} */
                    $cache: () => orthoCacheFactory,
                    /** @type {OrthoExpressionParser} */
                    $expressionParser: () => orthoExpressionParserFactory,
                    /** @type {OrthoInjector} */
                    $injector: () => orthoInjectorFactory,
                    /** @type {OrthoStore} */
                    $store: () => orthoStoreFactory,
                    /** @type {Window}  */
                    $window: win,
                    /** @type {Document} */
                    $document: doc
                }

                injector.registerAll(dependencies);
                //#endregion
            }
        }
        //#endregion

        return new Orthogonal();
    })();

    window.orthogonal = orthogonal;
})(window, document);