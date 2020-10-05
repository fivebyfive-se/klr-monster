orthogonal.onReady(($dom, $colorHarmony, $colorUtil, $colorWheel) => {
    const canvasContainer = document.getElementById('color-wheel-container');
    const canvas = document.getElementById('color-wheel');
    const modeSelector = document.getElementById('color-mode');
    const harmonySelector = document.getElementById('color-harmonies');
    const colorInputs = Array.from(document.querySelectorAll('input.color-theme__text--color'));
    const nameInputs = Array.from(document.querySelectorAll('input.color-theme__text--name'));
    const previews = Array.from(document.querySelectorAll('.color-theme__preview'));

    const handles = [];

    const colorWheel = $colorWheel.create(canvas);
    const colorHarmony = $colorHarmony.create('complementary');

    let currentColors = colorHarmony.harmonize({h: 180, s: 50, l: 25});
    let currentMode = 'hex';


    const moveHandle = (handle, color, x = null, y = null) => {
        let pos = {x, y},
            hsl = typeof color.h !== 'undefined' ? color : 
                typeof color.r !== 'undefined' ? $colorUtil.rgb_to_hsl(color) : {h: 0, s: 0, l: 0};;

        if (pos.x === null || pos.y === null) {
            pos = colorWheel.color_to_pos(hsl);
        }
        handle.style.top = `${pos.y}px`;
        handle.style.left = `${pos.x}px`;
        handle.style.backgroundColor = $colorUtil.hsl_to_hex(hsl);
    };

    const updateColorUI = () => {
        currentColors.forEach((color, index) => {
            const hsl = $colorUtil.any_to_hsl(color);
            colorInputs[index].value = 
                previews[index].style.backgroundColor = 
                    $colorUtil.any_to_string(color, currentMode);
            
            nameInputs[index].style.backgroundColor =
                colorInputs[index].style.backgroundColor = `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, .2)`;

            moveHandle(handles[index], color);
        });
    };

    const updateHarmonyUI = (newHarmony=null) => {
        if (newHarmony && newHarmony !== colorHarmony.harmony) {
            colorHarmony.changeHarmony(newHarmony);
        }

        harmonySelector.querySelectorAll('a').forEach((a) => a.classList.remove('active'));
        harmonySelector.querySelector(`[data-harmony=${colorHarmony.harmony}]`).classList.add('active');

        if (colorHarmony.harmony !== 'custom') {
            colorInputs.filter((i) => +i.dataset.color !== 0).forEach((i) => i.setAttribute('readonly', true));
            previews.filter((p) => +p.dataset.color === 0).forEach((p) => p.classList.add('active'));
            currentColors = colorHarmony.harmonize(currentColors[0]);
            updateColorUI();
        } else {
            colorInputs.forEach((i) => i.removeAttribute('readonly'));
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

        colorInputs.forEach((inp, i) => {
            const handle = $dom.createTag('div', { 'class': `color-wheel__handle color-wheel__handle--${i}` });
            canvasContainer.appendChild(handle);
            handles.push(handle);

            inp.addEventListener('change', (ev) => {
                const input = ev.currentTarget;
                if (!input.getAttribute('readonly')) {
                    const { color } = input.dataset;
                    setColor(color, $colorUtil.any_to_hsl(input.value));
                }
            });
        });

        modeSelector.addEventListener('change', (ev) => {
            currentMode = ev.currentTarget.value;
            updateColorUI();
        });
        updateHarmonyUI();
    };
    init();
});