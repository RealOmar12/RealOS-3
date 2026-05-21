document.addEventListener('DOMContentLoaded', () => {
    const gls = document.getElementById('global-loading-screen');
    const aura = document.getElementById('gls-aura');
    const title = document.getElementById('gls-title');
    const version = document.getElementById('gls-version');
    const spinner = document.getElementById('gls-spinner');
    const scaleWrapper = document.getElementById('scale-wrapper');

    if (!gls) return;

    setTimeout(() => {
        if (aura) aura.style.opacity = '1';
    }, 100);

    setTimeout(() => {
        if (title) {
            title.style.opacity = '1';
            title.style.transform = 'translateY(0)';
        }
    }, 600);

    setTimeout(() => {
        if (version) version.style.opacity = '1';
        if (spinner) spinner.style.opacity = '1';
    }, 1400);

    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();

    const windowLoaded = new Promise((resolve) => {
        if (document.readyState === 'complete') {
            resolve();
        } else {
            window.addEventListener('load', resolve);
        }
    });

    const minTime = new Promise(resolve => setTimeout(resolve, 3800));

    Promise.all([fontsReady, windowLoaded, minTime]).then(() => {
        if (gls) gls.style.opacity = '0';
        if (scaleWrapper) scaleWrapper.style.opacity = '1';
        
        setTimeout(() => {
            window.dispatchEvent(new Event('realos_loaded'));
            if (gls) gls.remove();
        }, 1500);
    });
});
