orthogonal.onReady(($o) => {
    class ColorHarmony {
        constructor(harmony = 'analogous') {
            const harmonies = {
                complementary: [0,180],
                splitComplementary: [0,150,320],
                splitComplementaryCW: [0,150,300],
                splitComplementaryCCW: [0,60,210],
                triadic: [0,120,240],
                clash: [0,90,270],
                tetradic: [0,90,180,270],
                fourToneCW: [0,60,180,240],
                fourToneCCW: [0,120,180,300],
                fiveToneA: [0,115,155,205,245],
                fiveToneB: [0,40,90,130,245],
                fiveToneC: [0,50,90,205,320],
                fiveToneD: [0,40,155,270,310],
                fiveToneE: [0,115,230,270,320],
                neutral: [0,15,30,45,60],
                analogous: [0,30,60,90,120]
            };
            this.harmony = harmony;

            this.harmonize = (color) => {
                return harmonies[this.harmony].map((h) => ({...color, h: color.h + h % 361}));
            };

            this.changeHarmony = (newHarmony) => {
                if (harmonies.hasOwnProperty(newHarmony)) {
                    this.harmony = newHarmony;
                }
            };

            this.harmonies = () => Object.keys(harmonies);
        }
    }
    const randomInt = (max) => Math.ceil(Math.random() * max);
    const harmony = new ColorHarmony();
    const colors = harmony.harmonize({h: randomInt(360), s: randomInt(100), l: randomInt(100) });
    const sliders = [...colors.map((c, i) => {
        return new iro.ColorPicker(`#color-${i}`, {
            color: c,
            width: 200,
            layout: [
                { component: iro.ui.Slider, options: { sliderType: 'hue' } },
                { component: iro.ui.Slider, options: { sliderType: 'saturation' } },
                { component: iro.ui.Slider, options: { sliderType: 'value' } }, 
            ]
        })
    })];
    const picker = new iro.ColorPicker('#picker', {
        colors: [...colors],
        layout: [
            { 
              component: iro.ui.Wheel,
            }
        ]
    });
    picker.on('input:change', (c) => {
        sliders[c.index].color.hsl = c.hsl;
        document.getElementById(`color-hex-${c.index}`).value = c.hexString;
        document.getElementById(`color-swatch-${c.index}`).style.backgroundColor = c.hexString;
    });
    sliders.forEach((s, i) => {
        document.getElementById(`color-hex-${i}`).value = s.color.hexString;
        document.getElementById(`color-swatch-${i}`).style.backgroundColor = s.color.hexString;
        s.on('input:change', (c) => {
            picker.colors[i].hsl = c.hsl;
            document.getElementById(`color-hex-${i}`).value = c.hexString;
            document.getElementById(`color-swatch-${i}`).style.backgroundColor = c.hexString;
        })
    });
    picker.setActiveColor(0);
});