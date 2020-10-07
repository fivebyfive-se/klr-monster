orthogonal.registerAll(extensionsServices);
orthogonal.registerAll(colorServices);

orthogonal.onReady(($store, $dom, $colorHarmony, $colorHelper, $colorWheel) => {
    const canvas = document.getElementById('color-wheel');
    const modeSelector = document.getElementById('color-mode');
    const harmonySelector = document.getElementById('color-harmonies');
    const colorWheel = $colorWheel.create(canvas);

    const colorInputs = [];
    const nameInputs = [];
    const previews = [];
    const handles = [];


    for (let i = 0; i < 5; i++) {
        colorInputs.push(document.getElementById(`color-hex-${i}`));
        nameInputs.push(document.getElementById(`color-name-${i}`));
        previews.push(document.getElementById(`color-preview-${i}`));
        handles.push(document.getElementById(`color-handle-${i}`));
    }

    const klrStore = $store
        .state({
            colorMode: 'hex',
            baseColor: {h: 180, s: 50, l: 50},
            colors: [],
            colorStrings: [],
            handlePositions: [],
            harmony: '',
        })
        .actions({
            setColor: (state, {index, color}) => {
                return {
                    ...state,
                    baseColor: index === 0 ? color : state.baseColor,
                    colors: state.colors.map((c, i) => i === index ? color : c)
                };
            },
            setColors: (state, colors) => ({ ...state, colors }),
            setHandlePositions: (state, handlePositions) => ({...state, handlePositions}),
            setHarmony: (state, harmony) => ({...state, harmony}),
            setColorMode: (state, colorMode) => ({...state, colorMode}),
            updateColors: (state) => ({
                ...state,
                colors: $colorHarmony.harmonize(state.harmony, state.baseColor)
            }),
            updateColorStrings: (state) => ({
                ...state,
                colorStrings: state.colors.map((c) => $colorHelper.any_to_string(c, state.colorMode))
            }),
            updateHandles: (state) => ({
                ...state,
                handlePositions: state.colors.map((c) => colorWheel.color_to_pos(c))
            })
        });

    klrStore.select('handlePositions').subscribe((handlePositions) => {
        handlePositions.forEach((pos, i) => {
            handles[i].style.left = `${pos.x}px`;
            handles[i].style.top = `${pos.y}px`;
        });
    });
    klrStore.select('colorStrings')
        .subscribe((colorStrings) => colorStrings.forEach((s, i) => colorInputs[i].value = s));
    klrStore.select('colorMode')
        .subscribe(() => klrStore.dispatch('updateColorStrings'));

    klrStore.select('colors').subscribe((colors) => {
        colors.forEach((c, i) => handles[i].style.backgroundColor = previews[i].style.backgroundColor = $colorHelper.hsl_to_hex(c));

        klrStore.dispatch('updateColorStrings');
        klrStore.dispatch('updateHandles');
    });


    klrStore.select('harmony').subscribe((harmony) => {
        harmonySelector.querySelectorAll('[data-harmony]')
            .forEach((btn) => btn.classList.toggle('active', btn.dataset.harmony === harmony));

        const readonlyFields = colorInputs.slice(1);
        if (harmony !== 'custom') {
            readonlyFields.forEach((inp) => inp.setAttribute('readonly', ''));
            klrStore.dispatch('updateColors');
        } else {
            readonlyFields.forEach((inp) => inp.removeAttribute('readonly'));
        }
    });

    klrStore.select('baseColor').subscribe(() => klrStore.dispatch('updateColors'));

    const init = () => {
        const availableHarmonies = $colorHarmony.harmonyNames(),
            defaultHarmony = availableHarmonies[0];

        colorWheel.draw();

        availableHarmonies.forEach((harmony) => {
            const btn = $dom.createTag('a', { 
                'data-harmony': harmony, 
                'class': harmony === defaultHarmony ? 'active': ''
            }, document.createTextNode(harmony));

            $dom.dispatchOnEvent(btn, 'click', klrStore, 'setHarmony', (ev) => ev.currentTarget.dataset.harmony);

            harmonySelector.appendChild(btn);
        });
        $dom.dispatchOnEvent(canvas, 'click', klrStore, 'setColor', (ev) => ({index: 0, color: colorWheel.color_at(ev)}));
        colorInputs.forEach((inp) => {
            $dom.dispatchOnEvent(inp, 'change', klrStore, 'setColor', (ev) => ({
                index: ev.currentTarget.dataset.color,
                color: $colorHelper.any_to_hsl(ev.currentTarget.value)
            }));
        });
        $dom.dispatchOnEvent(modeSelector, 'change', klrStore, 'setColorMode', (ev) => ev.currentTarget.value);

        klrStore.dispatch('setHarmony', defaultHarmony);
    };

    init();
});