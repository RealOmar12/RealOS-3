const Setup = {
    helloInterval: null,
    pinEntry: '',
    pinFirst: '',
    pinConfirming: false,
    helloWords: ['Hello!', 'Hola!', 'مرحبًا!', 'Hallo!', 'Bonjour!', 'Ciao!', '你好!', 'Olá!', 'こんにちは!', 'Привет!'],
    helloIndex: 0,
    check: () => {
        const status = localStorage.getItem('realos_v3_setup_status');
        if (!status) {
            document.getElementById('setup-screen').classList.add('active');
            window.addEventListener('realos_loaded', () => {
                Setup.startHelloCycle();
                const title = document.getElementById('setup-realos-title');
                const goBtn = document.getElementById('setup-go-btn');
                if (title) title.classList.add('animate');
                if (goBtn) goBtn.classList.add('animate');
            }, { once: true });
        } else if (status === 'notice_only' || status === 'done') {
            const setupScreen = document.getElementById('setup-screen');
            setupScreen.classList.add('active');
            const welcomeSlide = document.getElementById('slide-welcome');
            welcomeSlide.classList.remove('current');
            welcomeSlide.style.display = 'none';
            const noticeSlide = document.getElementById('slide-notice');
            noticeSlide.style.transform = 'translateX(0)';
            noticeSlide.style.opacity = '1';
            noticeSlide.classList.add('current');
        }
    },
    startHelloCycle: () => {
        const el = document.getElementById('setup-hello');
        if (!el) return;
        Setup.helloInterval = setInterval(() => {
            el.classList.add('fading');
            setTimeout(() => {
                Setup.helloIndex = (Setup.helloIndex + 1) % Setup.helloWords.length;
                el.textContent = Setup.helloWords[Setup.helloIndex];
                el.classList.remove('fading');
            }, 300);
        }, 1500);
    },
    startWelcome: () => {
        if (Setup.helloInterval) clearInterval(Setup.helloInterval);
        const btn = document.getElementById('setup-go-btn');
        const setupScreen = document.getElementById('setup-screen');
        const noticeSlide = document.getElementById('slide-notice');
        const welcomeSlide = document.getElementById('slide-welcome');
        const btnRect = btn.getBoundingClientRect();
        const sRect = document.getElementById('screen').getBoundingClientRect();
        const scaleFactor = document.fullscreenElement ? 1 : document.getElementById('scale-wrapper').getBoundingClientRect().width / (State.devWidth || 400);
        const startTop = (btnRect.top - sRect.top) / scaleFactor;
        const startLeft = (btnRect.left - sRect.left) / scaleFactor;
        const startW = btnRect.width / scaleFactor;
        const startH = btnRect.height / scaleFactor;
        btn.style.display = 'none';
        const expandWin = document.createElement('div');
        expandWin.className = 'setup-expand-window';
        expandWin.id = 'setup-expand-win';
        expandWin.style.top = (startTop + startH / 2) + 'px';
        expandWin.style.left = (startLeft + startW / 2) + 'px';
        expandWin.style.width = startW + 'px';
        expandWin.style.height = startH + 'px';
        expandWin.style.borderRadius = (startW / 2) + 'px';
        expandWin.style.transform = 'translate(-50%, -50%)';
        noticeSlide.style.transform = 'translateX(0)';
        noticeSlide.style.opacity = '1';
        noticeSlide.classList.add('current');
        expandWin.appendChild(noticeSlide);
        setupScreen.appendChild(expandWin);
        requestAnimationFrame(() => {
            const screenEl = document.getElementById('screen');
            const screenW = screenEl.offsetWidth;
            const screenH = screenEl.offsetHeight;
            const startCX = startLeft + startW / 2;
            const startCY = startTop + startH / 2;
            const endCX = screenW / 2;
            const endCY = screenH / 2;
            const anim = expandWin.animate([
                { top: startCY + 'px', left: startCX + 'px', width: startW + 'px', height: startH + 'px', borderRadius: (startW / 2) + 'px', transform: 'translate(-50%, -50%)' },
                { top: endCY + 'px', left: endCX + 'px', width: (screenW * 0.6) + 'px', height: (screenH * 0.4) + 'px', borderRadius: '40px', transform: 'translate(-50%, -50%)' },
                { top: endCY + 'px', left: endCX + 'px', width: screenW + 'px', height: screenH + 'px', borderRadius: '60px', transform: 'translate(-50%, -50%)' }
            ], {
                duration: 799,
                easing: 'cubic-bezier(' + (State.animConfig.openBezier || [0.2, 0.85, 0.1, 1]).join(', ') + ')',
                fill: 'forwards'
            });
            anim.onfinish = () => {
                expandWin.style.top = '0';
                expandWin.style.left = '0';
                expandWin.style.width = '100%';
                expandWin.style.height = '100%';
                expandWin.style.borderRadius = '60px';
                expandWin.style.transform = '';
                welcomeSlide.classList.remove('current');
                welcomeSlide.style.display = 'none';
            };
        });
    },
    next: (curr, nextId) => {
        const currEl = document.getElementById(`slide-${curr}`);
        const nextEl = document.getElementById(`slide-${nextId}`);
        if (currEl) {
            currEl.classList.add('prev');
            currEl.classList.remove('current');
        }
        if (nextEl) {
            nextEl.classList.add('current');
            const titles = nextEl.querySelectorAll('.setup-title-center');
            const btns = nextEl.querySelectorAll('.setup-circle-btn');
            titles.forEach(t => t.classList.add('animate'));
            btns.forEach(b => b.classList.add('animate'));
        }
    },
    handleNoticeNext: () => {
        const expandWin = document.getElementById('setup-expand-win');
        const noticeSlide = document.getElementById('slide-notice');
        if (expandWin) {
            const setupScreen = document.getElementById('setup-screen');
            setupScreen.insertBefore(noticeSlide, expandWin);
            expandWin.remove();
        }
        noticeSlide.style.transform = '';
        noticeSlide.style.opacity = '';
        const status = localStorage.getItem('realos_v3_setup_status');
        if (status === 'notice_only' || status === 'done') {
            const el = document.getElementById('setup-screen');
            el.classList.add('fade-out');
            setTimeout(() => {
                el.classList.remove('active', 'fade-out');
            }, 500);
        } else {
            Setup.next('notice', 'theme');
        }
    },
    setTheme: (theme) => {
        const lightP = document.getElementById('tp-light');
        const darkP = document.getElementById('tp-dark');
        if (theme === 'dark' && !State.darkMode) {
            Apps.settings.toggleDark();
            lightP.classList.remove('active');
            darkP.classList.add('active');
        } else if (theme === 'light' && State.darkMode) {
            Apps.settings.toggleDark();
            darkP.classList.remove('active');
            lightP.classList.add('active');
        }
    },
    pinDigit: (n) => {
        if (Setup.pinEntry.length >= 4) return;
        Setup.pinEntry += n;
        Setup.updatePinDots();
        if (Setup.pinEntry.length === 4) {
            setTimeout(() => {
                if (!Setup.pinConfirming) {
                    Setup.pinFirst = Setup.pinEntry;
                    Setup.pinEntry = '';
                    Setup.pinConfirming = true;
                    document.getElementById('setup-pin-status').textContent = 'Confirm PIN';
                    document.getElementById('setup-pin-back').style.visibility = 'visible';
                    Setup.updatePinDots();
                } else {
                    if (Setup.pinEntry === Setup.pinFirst) {
                        State.security.pin = Setup.pinEntry;
                        State.security.lockEnabled = true;
                        Storage.saveSettings();
                        document.getElementById('setup-pin-status').textContent = 'PIN Set!';
                        setTimeout(() => Setup.next('security', 'finish'), 500);
                    } else {
                        document.getElementById('setup-pin-status').textContent = 'PINs don\'t match. Try again.';
                        Setup.pinEntry = '';
                        Setup.updatePinDots();
                        const area = document.getElementById('setup-pin-area');
                        area.style.animation = 'none';
                        void area.offsetWidth;
                        area.style.animation = 'shake 0.3s ease';
                        setTimeout(() => {
                            document.getElementById('setup-pin-status').textContent = 'Confirm PIN';
                        }, 1000);
                    }
                }
            }, 200);
        }
    },
    pinDelete: () => {
        if (Setup.pinEntry.length > 0) {
            Setup.pinEntry = Setup.pinEntry.slice(0, -1);
            Setup.updatePinDots();
        }
    },
    pinBack: () => {
        Setup.pinConfirming = false;
        Setup.pinFirst = '';
        Setup.pinEntry = '';
        document.getElementById('setup-pin-status').textContent = 'Enter a PIN';
        document.getElementById('setup-pin-back').style.visibility = 'hidden';
        Setup.updatePinDots();
    },
    updatePinDots: () => {
        const container = document.getElementById('setup-pin-dots');
        let html = '';
        for (let i = 0; i < 4; i++) {
            html += `<div class="setup-pin-dot ${i < Setup.pinEntry.length ? 'filled' : ''}"></div>`;
        }
        container.innerHTML = html;
    },
    finish: () => {
        const el = document.getElementById('setup-screen');
        el.classList.add('fade-out');
        if (Setup.helloInterval) clearInterval(Setup.helloInterval);
        setTimeout(() => {
            el.classList.remove('active', 'fade-out');
            localStorage.setItem('realos_v3_setup_status', 'done');
            LockScreen.unlock(true);
        }, 500);
    }
};
