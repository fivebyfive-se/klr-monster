orthogonal.onReady(($array, $dom) => {
    class ColorHarmony {
        constructor(harmony = 'custom') {
            const harmonies = {
                complementary: [0,180, [0, 10, -30], [180, 20, -30], [0, -20, 30]],
                splitComplementary: [0,150,320, [150,-10,-30], [320,10,-30]],
                splitComplementaryCW: [0,150,300, [150, -10, -30], [300, 10, -30]],
                splitComplementaryCCW: [0,60,210, [60, -10, -30], [210, 10, -30]],
                triadic: [0,120,240, [120, -5, -30], [0, -5, -30]],
                clash: [0,90,270, [90, 20, -30], [270, -20, 30]],
                tetradic: [0,90,180,270, [0, 20, 40]],
                fourToneCW: [0,60,180,240, [0, 25, 60]],
                fourToneCCW: [0,120,180,300, [0, 25, 60]],
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

            this.harmonize = (color) => {
                return harmonies[this.harmony].map((mod) => {
                    let [h, s, l] = $array.ensureArray(mod).concat($array.repeat(0, 3));
                    return {
                        h: (color.h + h) % 361,
                        s: s < 0 ? Math.max(color.s + s, 0) : Math.min(color.s + s, 100),
                        l: l < 0 ? Math.max(color.l + l, 0) : Math.min(color.l + l, 100)
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
    const harmonySelector = document.querySelector('.color__harmonies');
    const colorHarmony = new ColorHarmony('complementary');
    const initColors = colorHarmony.harmonize({h: 199, s: 100, l: 20}).map((c) => `hsl(${c.h}, ${c.s}%, ${c.l}%)`);
    const picker = new iro.ColorPicker('#picker', {
        colors: [...initColors],
        handleRadius: 22,
        layout: [
            { 
              component: iro.ui.Wheel,
            }
        ]
    });
    const sliders = initColors.map((c, i) => {
        console.log(c);
        return new iro.ColorPicker(`#color-${i}`, {
            color: c,
            width: 200,
            sliderSize: 22,
            layout: [
                { component: iro.ui.Slider, options: { sliderType: 'red' } },
                { component: iro.ui.Slider, options: { sliderType: 'green' } },
                { component: iro.ui.Slider, options: { sliderType: 'blue' } }, 
            ]
        })
    });

    const updateColorUI = (color, index) => {
        document.getElementById(`color-hex-${index}`).value = 
            document.getElementById(`color-swatch-${index}`).style.backgroundColor = color.hexString;
    };
    const updateHarmonyUI = (newHarmony) => {
        if (newHarmony !== colorHarmony.harmony) {
            colorHarmony.changeHarmony(newHarmony);
        }

        harmonySelector.querySelectorAll('a').forEach((a) => a.classList.remove('active'));
        harmonySelector.querySelector(`[data-harmony=${colorHarmony.harmony}]`).classList.add('active');

        if (colorHarmony.harmony !== 'custom') {
            document.querySelectorAll('.color__picker__wheel .IroHandle').forEach((h, i) => {
                if (!h.classList.contains('IroHandle--0')) {
                    h.classList.add('IroHandle--readonly');
                }
            });
            document.querySelectorAll('.slider:not([data-color="0"])').forEach((s) => {
                s.classList.add('slider--readonly');
                s.querySelector('input').setAttribute('readonly', 'readonly');
            });
            colorHarmony.harmonize(picker.colors[0].hsl).forEach((c, i) => {
                picker.colors[i].hsl = c;
                sliders[i].color.hsl = c;
                updateColorUI(sliders[i].color, i);
            });    
        } else {
            document.querySelectorAll('.color__picker__wheel .IroHandle').forEach((h, i) => {
                h.classList.remove('IroHandle--readonly');
            });
            document.querySelectorAll('.slider:not([data-color="0"])').forEach((s) => {
                s.classList.remove('slider--readonly');
                s.querySelector('input').removeAttribute('readonly');
            })            
        }
    };

    picker.on('input:change', (c) => {
        sliders[c.index].color.hsv = c.hsv;
        if (colorHarmony.harmony !== 'custom' && c.index === 0) {
            updateHarmonyUI(colorHarmony.harmony);
        } else {
            updateColorUI(c, c.index);
        }
    });
    picker.setActiveColor(0);
    sliders.forEach((s, i) => {
        s.on('input:change', (c) => {
            picker.colors[i].hsv = c.hsv;
            if (i === 0 && colorHarmony.harmony !== 'custom') {
                updateHarmonyUI(colorHarmony.harmony);
            } else {
                updateColorUI(c, i);
            }
        })
    });
    colorHarmony.harmonies().forEach((h) => {
        const hEl = $dom.createTag('a', { 'data-harmony':  h}, document.createTextNode(h));
        $dom.onEventsWithoutDefault(hEl, 'click', (e) => {
            const { harmony } = e.currentTarget.dataset;
            updateHarmonyUI(harmony);
        });
        harmonySelector.appendChild(hEl);
    });

    updateHarmonyUI('analogous');
});