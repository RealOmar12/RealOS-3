const Volume = {
    timer: null,
    silent: false,
    level: 50,
    isDragging: false,
    init: () => {
        const bar = document.getElementById('volume-bar');
        if (!bar) return;
        bar.addEventListener('pointerdown', Volume.startDrag);
        bar.addEventListener('touchstart', Volume.startDrag, { passive: false });
        window.addEventListener('pointermove', Volume.handleDrag, { passive: false });
        window.addEventListener('pointerup', Volume.endDrag);
        window.addEventListener('pointercancel', Volume.endDrag);
        window.addEventListener('touchmove', Volume.handleDrag, { passive: false });
        window.addEventListener('touchend', Volume.endDrag);
        window.addEventListener('touchcancel', Volume.endDrag);
        Volume.setLevel(50);
    },
    show: () => {
        const overlay = document.getElementById('volume-overlay');
        overlay.classList.add('active');
        const silentBtn = document.getElementById('silent-btn');
        if (silentBtn) {

        }
        if (Volume.timer) clearTimeout(Volume.timer);
        Volume.timer = setTimeout(Volume.hide, 3000);
    },
    hide: () => {
        if (Volume.isDragging) return;
        document.getElementById('volume-overlay').classList.remove('active');
    },
    handlePress: (type) => {
        Volume.show();
        let change = 10;
        if (type === 'down') change = -10;
        Volume.setLevel(Volume.level + change);
        const btn = type === 'up' ? document.getElementById('vol-up') : document.getElementById('vol-down');
        if (btn) {
            btn.style.transform = 'scale(0.9)';
            setTimeout(() => btn.style.transform = 'scale(1)', 100);
        }
    },
    setLevel: (val) => {
        if (val < 0) val = 0;
        if (val > 100) val = 100;
        Volume.level = val;
        const fill = document.querySelector('.vol-fill');
        const icon = document.getElementById('vol-icon');
        if (!fill || !icon) return;
        fill.style.height = `${val}%`;
        if (val <= 1) icon.className = 'fas fa-volume-mute vol-icon';
        else if (val < 50) icon.className = 'fas fa-volume-down vol-icon';
        else icon.className = 'fas fa-volume-up vol-icon';
        if (val > 12) icon.classList.add('dark');
        else icon.classList.remove('dark');
    },
    startDrag: (e) => {
        Volume.isDragging = true;
        Volume.show();
        const fill = document.querySelector('.vol-fill');
        if (fill) fill.style.transition = 'none';
        Volume.handleDrag(e);
        if (Volume.timer) clearTimeout(Volume.timer);
    },
    handleDrag: (e) => {
        if (!Volume.isDragging) return;
        if (e.cancelable !== false) e.preventDefault();

        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientY = e.touches[0].clientY;
        }

        const bar = document.getElementById('volume-bar');
        const rect = bar.getBoundingClientRect();
        let dist = rect.bottom - clientY;
        let pct = (dist / rect.height) * 100;
        Volume.setLevel(pct);
    },
    endDrag: () => {
        if (Volume.isDragging) {
            Volume.isDragging = false;
            document.getElementById('volume-bar').classList.remove('pulse');
            const fill = document.querySelector('.vol-fill');
            if (fill) fill.style.transition = 'height 0.1s linear';
            Volume.timer = setTimeout(Volume.hide, 3000);
            document.getElementById('volume-bar').style.transform = 'none';
        }
    },
    toggleSilent: () => {
        Volume.silent = !Volume.silent;
        const btn = document.getElementById('silent-btn');
        Volume.show();
        if (Volume.silent) {
            btn.classList.add('silent-active');
            if (typeof Island !== 'undefined' && Island.notify) {
                Island.notify('Silent Mode', 'On', 'fa-bell-slash');
            }
        } else {
            btn.classList.remove('silent-active');
            if (typeof Island !== 'undefined' && Island.notify) {
                Island.notify('Ring', 'On', 'fa-bell');
            }
        }
    }
};
