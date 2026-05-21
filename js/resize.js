function resize() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    document.body.style.height = `${window.innerHeight}px`;
    const wrap = document.getElementById('scale-wrapper');
    const targetWidth = 400;
    const targetHeight = 860;
    const availW = window.innerWidth - 20;
    const availH = window.innerHeight - 20;
    const scale = Math.min(availW / targetWidth, availH / targetHeight);
    wrap.style.transform = `scale(${scale})`;
}
window.onresize = resize;
setTimeout(resize, 0);
