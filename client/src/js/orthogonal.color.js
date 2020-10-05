(($o) => {
//#region $colorHarmony
$o.register('$colorHarmony', ($array, $colorUtil) => {
    class ColorHarmony {
        constructor(harmony = 'custom') {
            const harmonies = {
                complementary: [0,180, [0, 0, .9], [180, 0, .9], [0, 0, .7]],
                splitComplementary: [0,150,320, [150, 0, .5], [320, 0, .5]],
                splitComplementaryCW: [0,150,300, [150, 0, .5], [300, 0, .5]],
                splitComplementaryCCW: [0,60,210, [60, 0, .5], [210, 0, .5]],
                triadic: [0,120,240, [120, 0, .7], [0, 0, .7]],
                clash: [0,90,270, [90, 0, .7], [270, 0, .7]],
                tetradic: [0,90,180,270, [0, 0, .5]],
                fourToneCW: [0,60,180,240, [0, 0, .5]],
                fourToneCCW: [0,120,180,300, [0, 0, .5]],
                fiveToneA: [0,115,155,205,245],
                fiveToneB: [0,40,90,130,245],
                fiveToneC: [0,50,90,205,320],
                fiveToneD: [0,40,155,270,310],
                fiveToneE: [0,115,230,270,320],
                neutral: [0,15,30,45,60],
                analogous: [0,30,60,90,120],
                custom: [0, 0, 0, 0, 0]
            };
            this.harmony = harmony;

            const modvalue = (old, change, max = 100) => {
                if (!change) {
                    return old;
                }
                let newVal = old;
                if (Math.abs(change) < 3) {
                    newVal *= change;
                } else {
                    newVal += change;
                }
                while (newVal < 0) {
                    newVal += max;
                }
                return newVal % (max + 1);
            }

            this.harmonize = (color) => {
                return harmonies[this.harmony].map((mod) => {
                    let [h, s, l] = $array.ensureArray(mod).concat($array.repeat(0, 3));
                    return {
                        h: $colorUtil.rybhue_to_hslhue(modvalue($colorUtil.hslhue_to_rybhue(color.h), h, 360)),
                        s: modvalue(color.s, s, 100),
                        l: modvalue(color.l, l, 100)
                    };
                });
            };

            this.changeHarmony = (newHarmony) => {
                if (harmonies.hasOwnProperty(newHarmony)) {
                    this.harmony = newHarmony;
                }
            };

            this.harmonies = () => Object.keys(harmonies);
        }
    }

    return {
        create: (harmony = 'complementary') => new ColorHarmony(harmony)
    };
});
//#endregion

//#region $colorUtil
$o.register('$colorUtil', ($linear) => {
    class ColorUtil {
        constructor() {
            this.hex_to_rgb = (hex) => {
                let r = 0, g = 0, b = 0;
              
                if (hex.length == 4) {
                  r =  "0x" + hex[1] + hex[1];
                  g = "0x" + hex[2] + hex[2];
                  b = "0x" + hex[3] + hex[3];                
                } else if (hex.length == 7) {
                  r = "0x" + hex[1] + hex[2];
                  g = "0x" + hex[3] + hex[4];
                  b = "0x" + hex[5] + hex[6];
                }
                return { r, g, b };
            };

            this.hex_to_hsl = (hex) => this.rgb_to_hsl(this.hex_to_rgb(hex));

            this.hsl_to_rgb = ({h, s, l}) => {
                  // Must be fractions of 1
                const sNorm = s / 100;
                const lNorm = l / 100;

                let c = (1 - Math.abs(2 * lNorm - 1)) * sNorm,
                    x = c * (1 - Math.abs((h / 60) % 2 - 1)),
                    m = lNorm - c/2,
                    r = 0,
                    g = 0,
                    b = 0;
                if (0 <= h && h < 60) {
                    r = c; g = x; b = 0;
                } else if (60 <= h && h < 120) {
                    r = x; g = c; b = 0;
                } else if (120 <= h && h < 180) {
                    r = 0; g = c; b = x;
                } else if (180 <= h && h < 240) {
                    r = 0; g = x; b = c;
                } else if (240 <= h && h < 300) {
                    r = x; g = 0; b = c;
                } else if (300 <= h && h < 360) {
                    r = c; g = 0; b = x;
                }
                r = Math.round((r + m) * 255);
                g = Math.round((g + m) * 255);
                b = Math.round((b + m) * 255);

                return {r, g, b};
            };

            this.hsl_to_hex = ({h, s, l}) => this.rgb_to_hex(this.hsl_to_rgb({h, s, l}));

            this.rgb_to_hex = ({r, g, b}) => {
                let hexR = (r < 0x10 ? '0' : '') + r.toString(16),
                    hexG = (g < 0x10 ? '0' : '') + g.toString(16),
                    hexB = (b < 0x10 ? '0' : '') + b.toString(16);              
                return `#${hexR}${hexG}${hexB}`;
            };

            this.rgb_to_hsl = ({r, g, b}) => {
                const rNorm = r / 255,
                    gNorm = g / 255,
                    bNorm = b / 255;
                
                const cmin = Math.min(rNorm, gNorm, bNorm),
                    cmax = Math.max(rNorm, gNorm, bNorm),
                    delta = cmax - cmin;
                let h = 0,
                    s = 0,
                    l = 0;

                if (delta === 0) {
                    h = 0;
                } else if (cmax == rNorm) {
                    h = ((gNorm - bNorm) / delta) % 6;
                } else if (cmax == gNorm) {
                    h = (bNorm - rNorm) / delta + 2;
                } else {
                    h = (rNorm - gNorm) / delta + 4;
                }
                h = Math.round(h * 60);
                
                if (h < 0) {
                    h += 360;
                }
                l = (cmax + cmin) / 2;

                s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
                    
                s = +(s * 100).toFixed(1);
                l = +(l * 100).toFixed(1);

                return { h, s, l };
            };

            const ryb_to_hsl_map = [
                {ryb: 60, hsl: 35},
                {ryb: 122, hsl: 60},
                {ryb: 165, hsl: 120},
                {ryb: 218, hsl: 180},
                {ryb: 275, hsl: 240},
                {ryb: 330, hsl: 300},
                {ryb: 420, hsl: 395},
            ];

            const doMap = (map, from, to, val) => {
                const min = map[0][from];
                if (val < min) {
                    val += map[map.length - 1][from] - min;
                }
                for (let i = 0; i < map.length - 1; i++) {
                    const fromA = map[i][from],
                        fromB = map[i+1][from],
                        toA = map[i][to],
                        toB = map[i+1][to];
                    if (val >= fromA && val < fromB) {
                        return $linear.range(fromA, fromB, toA, toB, val) % 361;
                    }
                }
                return 0;
            }

            this.rybhue_to_hslhue = (hue) => doMap(ryb_to_hsl_map, 'ryb', 'hsl', hue);
            this.hslhue_to_rybhue = (hue) => doMap(ryb_to_hsl_map, 'hsl', 'ryb', hue);
        }
    };

    return new ColorUtil();
});
//#endregion

//#region $colorWheel
$o.register('$colorWheel', ($colorUtil) => {
    class ColorWheel {
        constructor(canvas) {
            const context = canvas.getContext('2d');
            const middle = { x: canvas.width/2, y: canvas.height/2};
            const radius = Math.min(middle.x, middle.y);
            const canvasData = {
                pixels: null
            };

            this.get_pixel = (x, y) => {
                const i = (y * canvas.width + x) * 4;

                const r = canvasData.pixels[i];
                const g = canvasData.pixels[i + 1];
                const b = canvasData.pixels[i + 2];
                const a = canvasData.pixels[i + 3] / 255;
                const iA = 1 - a;

                const wR = (r * a + 255 * iA) | 0;
                const wG = (g * a + 255 * iA) | 0;
                const wB = (b * a + 255 * iA) | 0;

                return { r, g, b, a, wR, wG, wB };
            }
            this.color_at = (mouseEvent) => {
                const x = mouseEvent.offsetX,
                    y = mouseEvent.offsetY;

                const pixel = this.get_pixel(x, y);

                return $colorUtil.rgb_to_hsl({ r: pixel.wR, g: pixel.wG, b: pixel.wB });
            };

            const distance = (a, b) => {
                return Math.pow(a.r - b.r, 2) + Math.pow(a.b - b.b, 2) + Math.pow(a.g - b.g, 2);
            };
                
            this.color_to_pos = ({r, g, b}) => {
                const closest = {
                    dist: -1,
                    pos: null
                };
                for (let x = 0; x < canvas.width; x++) {
                    for (let y = 0; y < canvas.height; y++) {
                        const { wR, wG, wB } = this.get_pixel(x, y);
                        const dist = distance({r, g, b}, {r: wR, g: wG, b: wB});
                        if (!closest.pos || closest.dist > dist) {
                            closest.dist = dist;
                            closest.pos = { x, y };
                        }
                    }
                }
                return closest.pos;
            };

            this.draw = () => {
                for(let angle = 0; angle <= 360; angle++) {
                    const startAngle = (angle-2)*Math.PI/180;
                    const endAngle = angle * Math.PI/180;
                    context.beginPath();
                    context.moveTo(middle.x, middle.y);
                    context.arc(middle.x, middle.y, radius, startAngle, endAngle, false);
                    context.closePath();

                    const hue = $colorUtil.rybhue_to_hslhue(angle);
                    const gradient = context.createRadialGradient(middle.x, middle.y, 0, middle.x, middle.y, radius);
                    gradient.addColorStop(0,`hsl(${hue}, 0%, 100%)`);
                    gradient.addColorStop(0.1,`hsl(${hue}, 10%, 80%)`);
                    gradient.addColorStop(0.5,`hsl(${hue}, 50%, 40%)`);
                    gradient.addColorStop(0.9,`hsl(${hue}, 90%, 15%)`);
                    gradient.addColorStop(1,`hsl(${hue}, 100%, 0%)`);
                    context.fillStyle = gradient;
                    context.fill();
                }
                canvasData.pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
            };
        }
    }

    return {
        create: (canvas) => new ColorWheel(canvas)
    };
});
//#endregion
})(orthogonal);