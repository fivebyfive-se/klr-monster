
 ((ortho /* :Orthogonal */) => {

    /** @const {module:se/fivebyfive/ortho.Orthogonal} $o */
    const $o = ortho;

    //#region Helpers
    /**
     * @module se/fivebyfive/ortho/extensions
     */

    //#region $array
    /**
     * @name ArrayExtensions
     * @classdesc Array utilities 
     * @class
     **/
    $o.register('$array',
    /** @constructs */
    () => {
        /**
         * @param {any|any[]} arrOrItem 
         * @return `arrOrItem` if it is an array, or `[arrOrItem]` if not.
         * @memberof ArrayExtensions#
         */
        const ensureArray = (arrOrItem) => !arrOrItem ? [] : Array.isArray(arrOrItem) ? [...arrOrItem] : [arrOrItem];

        /**
         * 
         * @param {any} value 
         * @param {number} length
         * @returns {any[]} An array containing `value` `length` times. 
         * @memberof ArrayExtensions#
         */
        const repeat = (value, length) => {
            const result = [];
            for (let i = 0; i < length; i++) {
                result.push(value);
            }
            return result;
        };

        /** @lends ArrayExtensions.prototype */
        return { 
            ensureArray, 
            repeat 
        };
    });
    //#endregion

    //#region $object
    /**
     * @name ObjectExtensions
     * @class
     */
    $o.register('$object',
    /**
     * @constructs
     * @param {ArrayExtensions} $array
     */ 
    ($array) => {

        /**
         * Copy the keys and values from the objects `sources` into `target`, overwriting
         * existing keys.
         * @param {object} target 
         * @param  {...object} sources 
         * @returns {object} `target`
         * @memberof ObjectExtensions#
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
         * @memberof ObjectExtensions#
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
         * @memberof ObjectExtensions#
         */
        const immutableMerge = (...objects) => merge({}, ...objects);


        /**
         * Get all unique keys from `objects` as an array.
         * @param  {...object} objects 
         * @return {string[]}
         * @memberof ObjectExtensions#
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
         * @memberof ObjectExtensions#
         */
        const diffKeys = (a, b) => allKeys(a, b).filter((k) => a[k] !== b[k]);

        /**
         * Return a shallow copy of `obj`, keeping only the values whose keys
         * are in `keys`
         * @param {object} obj 
         * @param  {...string} keys 
         * @returns {object}
         * @memberof ObjectExtensions#
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
         * @memberof ObjectExtensions#
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
         * @param  {...string|any[]} pairs 
         * @returns {object}
         * @memberof ObjectExtensions#
         */
        const fromKeyValuePairs = (...pairs) => {
            return immutableMerge(...pairs.map((p) => fromKeyValuePair(...p)));
        };

        /**
         * Get all keys and values from `objects`, and return them as an array of key/value pairs
         * @param  {...object} objects 
         * @returns {(string|any)[][]}
         * @memberof ObjectExtensions#
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
         * @memberof ObjectExtensions#
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
         * @lends ObjectExtensions.prototype
         */
        return {
            merge, disjunctMerge, immutableMerge,

            allKeys,
            filterKeys,
            diffKeys,

            fromKeyValuePair, fromKeyValuePairs, toKeyValuePairs,

            split
        };
    });
    //#endregion

    //#region $string
    /**
     * @name StringExtensions
     * @class
     */
    $o.register('$string',
    /**
     * @constructs StringExtensions
     * @param {ObjectExtensions} $object
     */
     ($object) => {
        /**
         * An object representing parts of a color in RGBA colorspace
         * @typedef {{r?: number, g?: number, b?: number, a?:number}} PartialColor
         */
        /**
         * An object representing a color in RGB colorspace
         * @typedef {{r: number, g: number, b: number}} RgbColor
         */

        /**
         * An object representing a color in RGBA colorspace
         * @typedef {RgbColor & {a: number}} RgbaColor
         */

        /**
         * @private @const {RgbaColor}
         * @memberof StringExtensions#
         **/
        const defaultColor = { r: 0, g: 0, b: 0, a: 1.0 };

        /** 
         * @private @function
         * @param {PartialColor} col
         * @returns {RgbaColor}
         * @memberof StringExtensions#
         */
        const colorOrDefault = (col) => $object.immutableMerge(defaultColor, col || {});


        /**
         * Make sure argument is stringy
         * @param {string} str
         * @returns {string}
         * @memberof StringExtensions# 
         */
        const sanitize = (str) => (str || '').trim();

        /**
         * Check if argument is empty, i.e. `undefined`, `null`, `''` &c.
         * @param {string|any} str
         * @returns {boolean}
         * @memberof StringExtensions# 
         */
        const isEmpty = (str) => sanitize(str) === '';

        /**
         * Convert a color in hex format (e.g. `#fff`, `#00ffee`) to RGB.
         * @param {string} hex
         * @returns {RgbColor}
         * @memberof StringExtensions#
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
         * @memberof StringExtensions#
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
         * @memberof StringExtensions#
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
         * @memberof StringExtensions#
         */
        const camelToSnake = (str, sep = '-') => str.split(/(?=[A-Z])/).join(sep).toLowerCase();

        /**
         * @lends StringExtensions.prototype
         */
        return {
            hexToRgb, rgbaToRgb,

            snakeToCamel, camelToSnake,

            sanitize, isEmpty
        };
    });
    //#endregion
    

    //#region $dom
    /**
     * @name DomExtensions
     * @class
     */
    $o.register('$dom', 
    /**
     * @constructs DomExtensions
     * @param {ArrayExtensions} $array
     * @param {Document} $document
     * @param {Window} $window
     * @param {StringExtensions} $string
     */
    ($array, $document, $window, $string) => {
        /**
         * 
         * @param {external:Element} element 
         * @param {string[]} eventNames 
         * @param  {...function} callbacks
         * @memberof DomExtensions#
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

        const onEventsWithoutDefault = (element, events, ...callbacks) => {
            onEvents(element, events, ...callbacks.map((cb) => (ev) => {
                ev.preventDefault();
                cb(ev);
            }));
        };

        const getPosition = (element) => {
            const { top, left } = element.getBoundingClientRect();
            const { scrollY, scrollX } = $window;

            return { x: top + scrollX, y: left + scrollY };
        };
        const getSize = (element) => {
            const [{ height, width }] = element.getClientRects();
            return { height, width };
        };

        const getValue = (element) => $string.sanitize(element.value);
        const setValue = (element, value) => element.value = $string.sanitize(value);

        const createTag = (tagName, attributes, ...children) => {
            const tag = $document.createElement(tagName);
            Object.keys(attributes).forEach((k) => tag.setAttribute(k, attributes[k]));
            children.forEach((c) => typeof c === 'string' ? $document.createTextNode(c) : tag.appendChild(c));

            return tag;
        };

        const ensureElement = (selectorOrElement) => {
            if (typeof selectorOrElement === 'string') {
                return $document.querySelector(selectorOrElement);
            }
            return selectorOrElement;
        };

        /**
         * @lends DomExtensions.prototype
         */
        return {
            createTag,

            ensureElement,

            onEvents, onEventsWithoutDefault,

            getPosition, getSize,

            getValue, setValue,
        };
    }, false);
    //#endregion

    //#region $query
    $o.register('$query', ($object, $string, $document) => {
        const map = (root, selector, callback) => {
            const result = [];
            (root || $document).querySelectorAll(selector).forEach((element, index, all) => result.push(callback(element, index, all)));
            return result;
        };

        const queryByAttribute = (root, attribute) => map(
            root, `[${attribute}]`,
            (element, index, all) => ({ element, attributeName, index, all })
        );

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
        return {
            map,
            dataSelectorAll,
            queryByAttribute
        };
    });
    //#endregion

    //#region $css
    $o.register('$css', ($string, $document) => {
        const getVar = (key, root = null) => getComputedStyle(root || $document.documentElement).getPropertyValue(key);
        const getVarAsColor = (key, root = null) => {
            const value = $string.sanitize(getVar(key, root));

            return $string.isEmpty(value) ? null
                : value.match(/^rgb/i) ? $string.rgbaToRgb(value)
                    : $string.hexToRgb(value);
        };
        const classNames = (element, ...variants) => [element, ...variants.map((v) => `${element}--${v}`)];

        return {
            getVar, getVarAsColor,
            classNames
        };
    });
    //#endregion

    //#region $linear
    /**
     * @name LinearUtils
     * @classdesc Linear interpolation functions
     * @class
     */
    $o.register('$linear', 
    /**
     * @constructs
     */
    () => {
        /**
         * @param x {Number}
         * @param y {Number}
         * @param a {Number} Ratio -- between `0.0` and `1.0` (inclusive)
         * @return {Number} A value between `x` and `y` at the decimal point `a`. 
         * @example $linear->lerp(0, 10, .5); // => 5
         * @memberof LinearUtils#
         */
        const lerp = (x, y, a) => x * (1 - a) + y * a;

        /**
         * @param a {Number}
         * @param min {Number} (default: `0`)
         * @param max {Number} (default: `1`)
         * @return {Number} `a` or `min` if `a < min`, or `max` if `a > max`. 
         * @example $linear->clamp(10, 2, 5); // => 5
         * @memberof LinearUtils#
         */
        const clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a))
        
        /**
         * @param {Number} x 
         * @param {Number} y 
         * @param {Number} a
         * @return {Number} Where `a` falls between `x` and `y` as a ratio
         * between `0.0` and `1.0`. @see lerp
         * @memberof LinearUtils#
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
         * @memberof LinearUtils#
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
         * @memberof LinearUtils#
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
         * @memberof LinearUtils#
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
         * @lends LinearUtils.prototype
         */
        return {
            lerp, clamp, invlerp, range, rangeMap, modLimit
        };
    });
    //#endregion
})(orthogonal);
