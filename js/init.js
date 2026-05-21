document.addEventListener('click', (e) => {
    const overlay = document.getElementById('volume-overlay');
    if (overlay.classList.contains('active') && !overlay.contains(e.target) && !e.target.id.includes('vol-') && !Volume.isDragging) {
        Volume.hide();
    }
});
setTimeout(Volume.init, 100);

document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        document.body.classList.add('is-fullscreen');
        const fsToggle = document.getElementById('fs-toggle');
        if (fsToggle) fsToggle.classList.add('active');
    } else {
        document.body.classList.remove('is-fullscreen');
        const fsToggle = document.getElementById('fs-toggle');
        if (fsToggle) fsToggle.classList.remove('active');
    }
});

const Toast = {
    timer: null,
    show: (msg, duration = 2500) => {
        const el = document.getElementById('os-toast');
        const txt = document.getElementById('os-toast-msg');
        if (!el || !txt) return;
        clearTimeout(Toast.timer);
        txt.innerText = msg;
        el.classList.remove('active');
        void el.offsetHeight;
        el.classList.add('active');
        Toast.timer = setTimeout(() => el.classList.remove('active'), duration);
    }
};

OS.init();
