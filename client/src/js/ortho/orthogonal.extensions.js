/**
 * @module se/fivebyfive/ortho/extensions
 */
(($o /* :Orthogonal */) => {
    const $array = 
    /**
     * Array utilities. Injectable as `$array` from {@link module:se/fivebyfive/ortho~Orthogonal}
     * @function
     * @constructs module:se/fivebyfive/ortho/extensions~ArrayHelper
     * @hideconstructor
     **/
    () => {
        /**
         * @param {any|any[]} arrOrItem 
         * @return {any[]} `arrOrItem` if it is an array, or `[arrOrItem]` if not.
         * @memberof! module:se/fivebyfive/ortho/extensions~ArrayHelper#
         */
        const ensureArray = (arrOrItem) => !arrOrItem ? [] : Array.isArray(arrOrItem) ? [...arrOrItem] : [arrOrItem];

        /**
         * 
         * @param {any} value 
         * @param {number} length
         * @returns {any[]} An array containing `value` `length` times. 
         * @memberof! module:se/fivebyfive/ortho/extensions~ArrayHelper#
         */
        const repeat = (value, length) => {
            const result = [];
            for (let i = 0; i < length; i++) {
                result.push(value);
            }
            return result;
        };

        /** @lends module:se/fivebyfive/ortho/extensions~ArrayHelper.prototype */
        return { 
            ensureArray, 
            repeat 
        };
    };

    

    const $object =
    /**
     * @classdesc Helper for `object`s. Injectable as `$object` from {@link module:se/fivebyfive/ortho~Orthogonal}
     * @class
     * @constructs module:se/fivebyfive/ortho/extensions~ObjectHelper
     * @hideconstructor
     * @param {module:se/fivebyfive/ortho/extensions~ArrayHelper} $array
     */ 
    ($array) => {

        /**
         * Copy the keys and values from the objects `sources` into `target`, overwriting
         * existing keys.
         * @param {object} target 
         * @param  {...object} sources 
         * @returns {object} `target`
         * @memberof! module:se/fivebyfive/ortho/extensions~ObjectHelper#
         */
        const merge = (target, ...sources) => {
            sources.forEach((source) => Object.keys(source).forEach((k) => target[k] = source[k]));
            return target;
        };

        /**
         * Copy the keys and values from the objects `sources` into `target`.
         * Skip keys that already exist.
         * @param {object} target
         * @param  {...object} sources
         * @returns {object} `target`
         * @memberof! module:se/fivebyfive/ortho/extensions~ObjectHelper#
         */
        const disjunctMerge = (target, ...sources) => {
            sources.forEach((source) => {
                Object.keys(source).forEach((k) => {
                    if (!target.hasOwnProperty(k)) {
                        target[k] = source[k];
                    }
                });
            });

            return target;
        };

        /**
         * Combine `objects` into a new `object` -- returning the result 
         * @param  {...object} objects 
         * @returns {object}
         * @memberof! module:se/fivebyfive/ortho/extensions~ObjectHelper#
         */
        const immutableMerge = (...objects) => merge({}, ...objects);


        /**
         * Get all unique keys from `objects` as an array.
         * @param  {...object} objects 
         * @return {string[]}
         * @memberof! module:se/fivebyfive/ortho/extensions~ObjectHelper#
         */
        const allKeys = (...objects) => {
            return objects.reduce((keys, obj) => {
                return [
                    ...keys,
                    ...Object.keys(obj).filter((k) => !keys.includes(k))
                ]
            }, []);
        };

        /**
         * Get all keys that are only in `a` or only in `b`
         * @param {object} a 
         * @param {object} b 
         * @returns {string[]}
         * @memberof! module:se/fivebyfive/ortho/extensions~ObjectHelper#
         */
        const diffKeys = (a, b) => allKeys(a, b).filter((k) => a[k] !== b[k]);

        /**
         * Return a shallow copy of `obj`, keeping only the values whose keys
         * are in `keys`
         * @param {object} obj 
         * @param  {...string} keys 
         * @returns {object}
         * @memberof! module:se/fivebyfive/ortho/extensions~ObjectHelper#
         */
        const filterKeys = (obj, ...keys) => {
            const result = {};

            keys.filter((k) => k in obj)
                .forEach((k) => result[k] = obj[k]);

            return result;
        };

        /**
         * 
         * @param {string} key 
         * @param {any} value
         * @returns {object}
         * @memberof! module:se/fivebyfive/ortho/extensions~ObjectHelper#
         * @example const obj = fromKeyValuePair('foo', 10); // => obj === {foo: 10} 
         */
        const fromKeyValuePair = (key, value) => {
            const result = {};
            result[key] = value;
            return result;
        };

        /**
         * Give an array of arrays, `pairs` representing a list of keys and values,
         * create a new object containing those keys and values. 
         * @param  {...(string|any)} pairs 
         * @returns {object}
         * @memberof! module:se/fivebyfive/ortho/extensions~ObjectHelper#
         */
        const fromKeyValuePairs = (...pairs) => {
            return immutableMerge(...pairs.map((p) => fromKeyValuePair(...p)));
        };

        /**
         * Get all keys and values from `objects`, and return them as an array of key/value pairs
         * @param  {...object} objects 
         * @returns {any}
         * @memberof! module:se/fivebyfive/ortho/extensions~ObjectHelper#
         */
        const toKeyValuePairs = (...objects) => {
            const pairs = [];
            objects.forEach((o) => Object.keys(o).forEach((k) => pairs.push[k, o[k]]));
            return pairs;
        };

        /**
         * Split an object into as many parts as the most number of items in any array-value
         * contained in the object 
         * @param {object} obj
         * @returns {object[]}
         * @memberof! module:se/fivebyfive/ortho/extensions~ObjectHelper#
         * @example split({a: [0, 1, 2]}); // => [{a: 0}, {a: 1}, {a: 2}] 
         */
        const split = (obj) => {
            const result = [{}];

            Object.keys(obj).forEach((k) => {
                $array.ensureArray(obj[k]).forEach((v, i) => {
                    if (result.length < i) {
                        result.push({});
                    }
                    result[i][k] = v;
                });
            });

            return result;
        };

        /**
         * @lends module:se/fivebyfive/ortho/extensions~ObjectHelper.prototype
         */
        return {
            merge, disjunctMerge, immutableMerge,

            allKeys,
            filterKeys,
            diffKeys,

            fromKeyValuePair, fromKeyValuePairs, toKeyValuePairs,

            split
        };
    };

    
    const $string =
    /**
     * @classdesc Helper functions for handling strings. Injectable as `$string` from {@link module:se/fivebyfive/ortho~Orthogonal}
     * @class
     * @constructs module:se/fivebyfive/ortho/extensions~StringHelper
     * @hideconstructor
     * @param {module:se/fivebyfive/ortho/extensions~ObjectHelper} $object
     */ 
    ($object) => {
        /**
         * An object representing parts of a color in RGBA colorspace
         * @typedef {Object} PartialColor
         * @property {?number} r  Red
         * @property {?number} g  Green
         * @property {?number} b  Blue
         * @property {?number} a  Alpha
         */
        /**
         * An object representing a color in RGB colorspace
         * @typedef {Object} RgbColor
         * @property {number} r  Red
         * @property {number} g  Green
         * @property {number} b  Blue
         */

        /**
         * An object representing a color in RGBA colorspace
         * @typedef {Object} RgbaColor
         * @property {number} r  Red
         * @property {number} g  Green
         * @property {number} b  Blue
         * @property {number} a  Alpha
         */

        /**
         * @private 
         * @memberof! module:se/fivebyfive/ortho/extensions~StringHelper#
         * @const {RgbaColor}
         **/
        const defaultColor = { r: 0, g: 0, b: 0, a: 1.0 };

        /** 
         * @param {PartialColor} col
         * @returns {RgbaColor}
         * @memberof! module:se/fivebyfive/ortho/extensions~StringHelper#
         * @private
         */
        const colorOrDefault = (col) => $object.immutableMerge(defaultColor, col || {});


        /**
         * Make sure argument is stringy
         * @param {string} str
         * @returns {string}
         * @memberof! module:se/fivebyfive/ortho/extensions~StringHelper# 
         */
        const sanitize = (str) => (str || '').trim();

        /**
         * Check if argument is empty, i.e. `undefined`, `null`, `''` &c.
         * @param {string|any} str
         * @returns {boolean}
         * @memberof! module:se/fivebyfive/ortho/extensions~StringHelper# 
         */
        const isEmpty = (str) => sanitize(str) === '';

        /**
         * Convert a color in hex format (e.g. `#fff`, `#00ffee`) to RGB.
         * @param {string} hex
         * @returns {RgbColor}
         * @memberof! module:se/fivebyfive/ortho/extensions~StringHelper#
         */
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{1,2})([a-f\d]{1,2})([a-f\d]{1,2}$)/i.exec(hex),
                factor = hex.length < 6 ? 0x11 : 1;
            return colorOrDefault(result ? {
                r: parseInt(result[1], 16) * factor,
                g: parseInt(result[2], 16) * factor,
                b: parseInt(result[3], 16) * factor
            } : null);
        };

        /**
         * Parse a color in RGBA string format.
         * @param {string} rgba
         * @returns {RgbaColor}
         * @memberof! module:se/fivebyfive/ortho/extensions~StringHelper#
         */
        const rgbaToRgb = (rgba) => {
            const result = /^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(\s*,\s*((\d+)?(\.\d+)?))?\s*\)$/i.exec(rgba);

            return colorOrDefault(result ? {
                r: parseInt(result[1]),
                g: parseInt(result[2]),
                b: parseInt(result[3]),
                a: result.length > 5 ? parseFloat(result[5], 16) : 1.0
            } : null);
        };

        /**
         * Convert a string from `snake-case` to `camelCase`.
         * @param {string} str
         * @returns {string} 
         * @memberof! module:se/fivebyfive/ortho/extensions~StringHelper#
         */
        const snakeToCamel = (str) => str.replace(
            /([-_][a-z])/g,
            (group) => group.toUpperCase()
                .replace('-', '')
                .replace('_', '')
        );

        /**
         * Convert a string from `camelCase` to `snake-case`.
         * @param {string} str
         * @returns {string} 
         * @memberof! module:se/fivebyfive/ortho/extensions~StringHelper#
         */
        const camelToSnake = (str, sep = '-') => str.split(/(?=[A-Z])/).join(sep).toLowerCase();

        /**
         * @lends module:se/fivebyfive/ortho/extensions~StringHelper.prototype
         */
        return {
            hexToRgb, rgbaToRgb,

            snakeToCamel, camelToSnake,

            sanitize, isEmpty
        };
    };

    
    const $dom = 
    /**
     * @classdesc Helpers for traversing DOM. Injectable as `$dom` from {@link module:se/fivebyfive/ortho~Orthogonal}
     * @class
     * @constructs module:se/fivebyfive/ortho/extensions~DomHelper
     * @hideconstructor
     */
    ($array, $document, $window, $string) => {
        /**
         * Connect `callbacks` to the list of events in `eventNames` on `element`.
         * @param {external:Element} element 
         * @param {string[]} eventNames 
         * @param  {...function} callbacks
         * @memberof! module:se/fivebyfive/ortho/extensions~DomHelper#
         */
        const onEvents = (element, eventNames, ...callbacks) => {
            $array.ensureArray(eventNames).forEach((eventName) => {
                if (eventName === 'now') {
                    callbacks.forEach((c) => c.call(element));
                } else {
                    callbacks.forEach((c) => element.addEventListener(eventName, c));
                }
            });
        };

        /**
         * Connect `callbacks` to the list of events in `eventNames` on `element`.
         * Also wraps all callbacks in a function that calls `e.preventDefault()' on
         * all trigger events.
         * @param {external:Element} element 
         * @param {string[]} eventNames 
         * @param  {...function} callbacks
         * @memberof! module:se/fivebyfive/ortho/extensions~DomHelper#
         */
        const onEventsWithoutDefault = (element, eventNames, ...callbacks) => {
            onEvents(element, eventNames, ...callbacks.map((cb) => (ev) => {
                ev.preventDefault();
                cb(ev);
            }));
        };

        /**
         * Dispatch `action` on `store` when the given `eventNames` occur.
         * `payloadSelector` is a callback-function, which transforms an element into a payload.
         * @param {external:Node} element 
         * @param {(string|string[])} eventNames 
         * @param {modules:se/fivebyfive/ortho/OrthoStore} store 
         * @param {string} action 
         * @param {function} payloadSelector 
         */
        const dispatchOnEvent = (element, eventNames, store, action, payloadSelector) => {
            onEventsWithoutDefault(element, eventNames, (ev) => store.dispatch(action, payloadSelector(ev)));
        };

        /**
         * Get x and y coordinates of `element`
         * @param {external:Element} element 
         * @returns {{x: number, y: number}}
         * @memberof! module:se/fivebyfive/ortho/extensions~DomHelper#
         */
        const getPosition = (element) => {
            const { top, left } = element.getBoundingClientRect();
            const { scrollY, scrollX } = $window;

            return { x: top + scrollX, y: left + scrollY };
        };

        /**
         * Get dimensions of `element`
         * @param {external:Element} element
         * @returns {{height: number, height: number}}
         * @memberof! module:se/fivebyfive/ortho/extensions~DomHelper# 
         */
        const getSize = (element) => {
            const [{ height, width }] = element.getClientRects();
            return { height, width };
        };

        /**
         * Get sanitized value from `element` (assumed to be an input element),
         * or empty string if there is no value.
         * @param {external:Element} element 
         * @returns {string}
         * @memberof! module:se/fivebyfive/ortho/extensions~DomHelper#
         */
        const getValue = (element) => $string.sanitize(element.value);

        /**
         * Set sanitized `value` on `element` (assumed to be an input element),
         * or empty string if there is no value.
         * @param {external:Element} element
         * @param {string} value 
         * @returns {string}
         * @memberof! module:se/fivebyfive/ortho/extensions~DomHelper#
         */
        const setValue = (element, value) => element.value = $string.sanitize(value);

        /**
         * Create an HTML element.
         * @param {string} tagName 
         * @param {Object} attributes 
         * @param  {...any} children 
         * @returns {external:HTMLElement}
         * @memberof! module:se/fivebyfive/ortho/extensions~DomHelper#
         */
        const createTag = (tagName, attributes, ...children) => {
            const tag = $document.createElement(tagName);
            Object.keys(attributes).forEach((k) => tag.setAttribute(k, attributes[k]));
            children.forEach((c) => typeof c === 'string' ? $document.createTextNode(c) : tag.appendChild(c));

            return tag;
        };

        /**
         * If `selectOrElement` is an `Element`, return it, otherwise try to find it
         * treating `selectOrElement` as a dom query.
         * @param {string|exernal:Element} selectorOrElement 
         * @returns {external:Element}
         * @memberof! module:se/fivebyfive/ortho/extensions~DomHelper#
         */
        const ensureElement = (selectorOrElement) => {
            if (typeof selectorOrElement === 'string') {
                return $document.querySelector(selectorOrElement);
            }
            return selectorOrElement;
        };

        /**
         * @lends module:se/fivebyfive/ortho/extensions~DomHelper.prototype
         */
        return {
            createTag,

            ensureElement,

            onEvents, onEventsWithoutDefault,
            dispatchOnEvent,

            getPosition, getSize,

            getValue, setValue,
        };
    };


    const $query = 
    /**
     * @classdesc Helper for handling dom querys. Injectable from {@link module:se/fivebyfive/ortho~Orthogonal} as `$query`.
     * @class
     * @constructs module:se/fivebyfive/ortho/extensions~QueryHelper
     * @hideconstructor
     */
    ($object, $string, $document) => {
        /**
         * Wrapper around `querySelectorAll` allowing you to pass along a callback to call on all elements found
         * @param {external:HTMLElement} root 
         * @param {string} selector 
         * @param {function} callback 
         * @returns {any[]} The mapped list
         * @memberof! module:se/fivebyfive/ortho/extensions~QueryHelper#
         */
        const map = (root, selector, callback) => {
            const result = [];
            (root || $document).querySelectorAll(selector).forEach((element, index, all) => result.push(callback(element, index, all)));
            return result;
        };

        /**
         * Query by attribute name.
         * @param {external:HTMLElement} root 
         * @param {string} attribute 
         * @returns {Object} all matching elements, plus metadata.
         * @memberof module:se/fivebyfive/ortho/extensions~QueryHelper#
         */
        const queryByAttribute = (root, attribute) => map(
            root, `[${attribute}]`,
            (element, index, all) => ({ element, attributeName, index, all })
        );

        /**
         * Query by data-attribute. Optionally adds other attributes to result
         * @param {external:HTMLElement} root 
         * @param {string} attribute 
         * @param  {...any} otherAttributes 
         * @returns {any[]} List of elements, along with index, and attribute values.
         * @memberof module:se/fivebyfive/ortho/extensions~QueryHelper#
         */
        const dataSelectorAll = (root, attribute, ...otherAttributes) => {
            const attributeName = $string.camelToSnake(attribute).replace('data-'),
                attributeKey = $string.snakeToCamel(attributeName),
                otherAttributeKeys = [attributeKey, ...otherAttributes.map($string.snakeToCamel)];

            return map(root, `[data-${attributeName}]`, (element, index, all) => {
                return $object.merge(
                    { element, index, all, attributeValue: element.dataset[attributeKey] },
                    $object.filterKeys(element.dataset, ...otherAttributeKeys)
                );
            });
        };

        /**
         * @lends module:se/fivebyfive/ortho/extensions~QueryHelper.prototype
         */
        return {
            map,
            dataSelectorAll,
            queryByAttribute
        };
    };

    
    const $css =
    /**
     * @classdesc Helper for getting css-vars and creating classnames. Injected as `$css` from {@link module:se/fivebyfive/ortho~Orthogonal}.
     * @class
     * @constructs module:se/fivebyfive/ortho/extensions~CssHelper
     * @hideconstructor
     */ 
    ($string, $document) => {
        /**
         * Get CSS variable with name `key`, if it exists under `root`
         * @param {string} key 
         * @param {external:HTMLELement} root 
         * @returns {string}
         * @memberof! module:se/fivebyfive/ortho/extensions~CssHelper#
         */
        const getVar = (key, root = null) => getComputedStyle(root || $document.documentElement).getPropertyValue(key);

        /**
         * Get CSS variable with name `key`, if it exists under `root`, converted to RGB.
         * @param {string} key 
         * @param {external:HTMLELement} root 
         * @returns {ColorRgb}
         * @memberof! module:se/fivebyfive/ortho/extensions~CssHelper#
         */
        const getVarAsColor = (key, root = null) => {
            const value = $string.sanitize(getVar(key, root));

            return $string.isEmpty(value) ? null
                : value.match(/^rgb/i) ? $string.rgbaToRgb(value)
                    : $string.hexToRgb(value);
        };

        /**
         * Create a list of classnames, consisting of `element` + `element--variant` for every `variants`
         * @param {string} element 
         * @param  {...string} variants 
         * @returns {string[]}
         * @memberof! module:se/fivebyfive/ortho/extensions~CssHelper#
         */
        const classNames = (element, ...variants) => [element, ...variants.map((v) => `${element}--${v}`)];

        return {
            getVar, getVarAsColor,
            classNames
        };
    };


    /** @module se/fivebyfive/ortho/extensions */
    const $linear = 
    /**
     * @classdesc Linear interpolation functions. Injected as `$linear` from {@link module:se/fivebyfive/ortho~Orthogonal}.
     * @class
     * @constructs module:se/fivebyfive/ortho/extensions~LinearUtils
     * @hideconstructor
     */
    () => 
    {
        /**
         * @param x {Number}
         * @param y {Number}
         * @param a {Number} Ratio -- between `0.0` and `1.0` (inclusive)
         * @return {Number} A value between `x` and `y` at the decimal point `a`. 
         * @example $linear->lerp(0, 10, .5); // => 5
         * @memberof! module:se/fivebyfive/ortho/extensions~LinearUtils#
         */
        const lerp = (x, y, a) => x * (1 - a) + y * a;

        /**
         * @param a {Number}
         * @param min {Number} (default: `0`)
         * @param max {Number} (default: `1`)
         * @return {Number} `a` or `min` if `a < min`, or `max` if `a > max`. 
         * @example $linear->clamp(10, 2, 5); // => 5
         * @memberof! module:se/fivebyfive/ortho/extensions~LinearUtils#
         */
        const clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a))
        
        /**
         * @param {Number} x 
         * @param {Number} y 
         * @param {Number} a
         * @return {Number} Where `a` falls between `x` and `y` as a ratio
         * between `0.0` and `1.0`. @see lerp
         * @memberof! module:se/fivebyfive/ortho/extensions~LinearUtils#
         */
        const invlerp = (x, y, a) => clamp((a - x) / (y - x));
        
        /**
         * Converts a number from one range to another
         * @param {Number} x1 
         * @param {Number} y1 
         * @param {Number} x2 
         * @param {Number} y2 
         * @param {Number} a 
         * @return {Number} The value `a` converted to the value at the same place in `[x2 ... y2]`
         * as `a` has in `[x1 ... y1]`
         * @memberof! module:se/fivebyfive/ortho/extensions~LinearUtils#
         */
        const range = (x1, y1, x2, y2, a) => lerp(x2, y2, invlerp(x1, y1, a));

        /**
         * 
         * @param {Array<Map<string,Number[]>>} map s
         * @param {string} from 
         * @param {string} to 
         * @param {Number} val 
         * @return {Number} If `maps` is an array of maps containing at least the keys
         * from the string `from` and `to`, representing corresponding values in two ranges,
         * return `val` from range `from` fitted to the range `b`.
         * @memberof! module:se/fivebyfive/ortho/extensions~LinearUtils#
         */
        const rangeMap = (maps, from, to, val) => {
            const min = maps[0][from];
            if (val < min) {
                val += maps[maps.length - 1][from] - min;
            }
            for (let i = 0; i < maps.length - 1; i++) {
                const fromA = maps[i][from],
                    fromB = maps[i+1][from],
                    toA = maps[i][to],
                    toB = maps[i+1][to];
                if (val >= fromA && val < fromB) {
                    return range(fromA, fromB, toA, toB, val);
                }
            }
            return maps[0][to];
        };

        /**
         * Return `num` limited to between `0` and `max`, using modulo
         * logic
         * @param {number} num 
         * @param {number} max 
         * @returns {number}
         * @memberof! module:se/fivebyfive/ortho/extensions~LinearUtils#
         */
        const modLimit = (num, max) => {
            if (num > max) {
                return num % max;
            }
            let res = max;
            while (num < 0) {
                res = res - num;
            }
            return res;
        }

        /**
         * @lends module:se/fivebyfive/ortho/extensions~LinearUtils.prototype
         */
        return {
            lerp, clamp, invlerp, range, rangeMap, modLimit
        };
    };


    /**
     * All injectable services from {@link module:se/fivebyfive/ortho/extensions}
     * @module se/fivebyfive/ortho/extensions/services
     */
    const services = {
        /** 
         * @name $array
         * @static
         * @type {module:se/fivebyfive/ortho/extensions~ArrayHelper}
         **/
        $array,

        /** 
         * @name $object
         * @static
         * @type {module:se/fivebyfive/ortho/extensions~ObjectHelper}
         **/
        $object,

        /** 
         * @name $string
         * @static
         * @type {module:se/fivebyfive/ortho/extensions~StringHelper}
         **/   
        $string,

        /**
         * @name $dom
         * @static
         * @type {module:se/fivebyfive/ortho/extensions~DomHelper}
         */
        $dom,

        /**
         * @name $query
         * @static
         * @type {module:se/fivebyfive/ortho/extensions~QueryHelper}
         */
        $query,

        /**
         * @name $css
         * @static
         * @type {module:se/fivebyfive/ortho/extensions~CssHelper}
         */
        $css,

        /**
         * @name $linear
         * @static
         * @type {module:se/fivebyfive/ortho/extensions~LinearUtils}
         */
        $linear
    };
    $o.registerAll(services);
})(orthogonal);
