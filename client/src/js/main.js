orthogonal.onReady(($dom, $colorHarmony, $colorUtil, $colorWheel) => {
    const canvasContainer = document.querySelector('.color__picker__wheel');
    const canvas = document.querySelector('.wheel__canvas');
    const harmonySelector = document.querySelector('.color__harmonies');
    const handles = [];

    const colorWheel = $colorWheel.create(canvas);
    const colorHarmony = $colorHarmony.create('complementary');

    let currentColors = colorHarmony.harmonize({h: 180, s: 50, l: 25});


    const moveHandle = (handle, color, x = null, y = null) => {
        let pos = {x, y},
            rgb = typeof color.r !== 'undefined' ? color : 
                typeof color.h !== 'undefined' ? $colorUtil.hsl_to_rgb(color) : {r: 0, g: 0, b: 0};;

        if (pos.x === null || pos.y === null) {
            pos = colorWheel.color_to_pos(rgb);
        }
        handle.style.top = `${pos.y}px`;
        handle.style.left = `${pos.x}px`;
        handle.style.backgroundColor = $colorUtil.rgb_to_hex(rgb);
    };

    const updateColorUI = () => {
        currentColors.forEach((color, index) => {
            document.getElementById(`color-hex-${index}`).value = 
            document.getElementById(`color-swatch-${index}`).style.backgroundColor = $colorUtil.hsl_to_hex(color);
            moveHandle(handles[index], color);
        });
    };

    const updateHarmonyUI = (newHarmony) => {
        if (newHarmony !== colorHarmony.harmony) {
            colorHarmony.changeHarmony(newHarmony);
        }

        harmonySelector.querySelectorAll('a').forEach((a) => a.classList.remove('active'));
        harmonySelector.querySelector(`[data-harmony=${colorHarmony.harmony}]`).classList.add('active');

        if (colorHarmony.harmony !== 'custom') {
            document.querySelectorAll('input.slider__text:not([data-color="0"])').forEach((i) => i.setAttribute('readonly', true));
            currentColors = colorHarmony.harmonize(currentColors[0]);
            updateColorUI();
        } else {
            document.querySelectorAll('input.slider__text').forEach((i) => i.removeAttribute('readonly'));
        }

    };
    const setColor = (index, color) => {
        currentColors[index] = color;
        updateHarmonyUI();
    };

    const init = () => {
        colorWheel.draw();
        colorHarmony.harmonies().forEach((harmony) => {
            const btn = $dom.createTag('a', { 'data-harmony': harmony}, document.createTextNode(harmony));
            $dom.onEventsWithoutDefault(btn, 'click', (ev) => {
                updateHarmonyUI(ev.currentTarget.dataset.harmony);
            });
            harmonySelector.appendChild(btn);
        });
    
        canvas.addEventListener('click', (ev) => setColor(0, colorWheel.color_at(ev)));

        document.querySelectorAll('input.slider__text').forEach((inp, i) => {
            const handle = $dom.createTag('div', { 'class': `wheel__handle wheel__handle--${i}` });
            canvasContainer.appendChild(handle);
            handles.push(handle);

            inp.addEventListener('change', (ev) => {
                const input = ev.currentTarget;
                if (!input.getAttribute('readonly')) {
                    const { color } = input.dataset;
                    setColor(color, $colorUtil.hex_to_hsl(input.value));
                }
            });
        });
        updateHarmonyUI('analogous');
    };
    init();
});