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
        const btnVisual = document.createElement('div');
        btnVisual.style.position = 'absolute';
        btnVisual.style.inset = '0';
        btnVisual.style.borderRadius = 'inherit';
        btnVisual.style.backdropFilter = 'blur(20px) saturate(180%)';
        btnVisual.style.webkitBackdropFilter = 'blur(20px) saturate(180%)';
        btnVisual.style.background = State.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)';
        btnVisual.style.border = State.darkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.3)';
        btnVisual.style.boxShadow = State.darkMode ? '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' : '0 4px 20px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
        btnVisual.style.display = 'flex';
        btnVisual.style.alignItems = 'center';
        btnVisual.style.justifyContent = 'center';
        btnVisual.style.color = State.darkMode ? '#fff' : '#000';
        btnVisual.innerHTML = '<i class="fas fa-arrow-right" id="setup-arrow-icon" style="font-size:22px;"></i>';

        expandWin.style.background = 'transparent';

        noticeSlide.style.transform = 'translateX(0)';
        noticeSlide.style.opacity = '0';
        noticeSlide.classList.add('current');

        expandWin.appendChild(noticeSlide);
        expandWin.appendChild(btnVisual);
        setupScreen.appendChild(expandWin);

        requestAnimationFrame(() => {
            const screenEl = document.getElementById('screen');
            const screenW = screenEl.offsetWidth;
            const screenH = screenEl.offsetHeight;
            const startCX = startLeft + startW / 2;
            const startCY = startTop + startH / 2;
            const endCX = screenW / 2;
            const endCY = screenH / 2;
            const duration = 400 * (State.animationSpeed || 1);

            welcomeSlide.animate([
                { filter: 'blur(0px) brightness(1)', offset: 0 },
                { filter: 'blur(25px) brightness(0.3)', offset: 0.3 },
                { filter: 'blur(25px) brightness(0.3)', offset: 1 }
            ], { duration, fill: 'forwards' });

            const arrowIcon = document.getElementById('setup-arrow-icon');
            if (arrowIcon) {
                arrowIcon.animate([
                    { transform: 'scale(1)', offset: 0 },
                    { transform: `scale(${screenW / startW * 0.5})`, offset: 0.5 },
                    { transform: `scale(${screenW / startW})`, offset: 1 }
                ], { duration, fill: 'forwards' });
            }

            btnVisual.animate([
                { opacity: 1, offset: 0 },
                { opacity: 1, offset: 0.05 },
                { opacity: 0, offset: 0.25 },
                { opacity: 0, offset: 1 }
            ], { duration, fill: 'forwards' });

            noticeSlide.animate([
                { opacity: 0, offset: 0 },
                { opacity: 0, offset: 0.05 },
                { opacity: 1, offset: 0.25 },
                { opacity: 1, offset: 1 }
            ], { duration, fill: 'forwards' });

            const finalBg = State.darkMode ? '#000' : '#fff';

            expandWin.animate([
                { backgroundColor: 'transparent', offset: 0 },
                { backgroundColor: 'transparent', offset: 0.05 },
                { backgroundColor: finalBg, offset: 0.25 },
                { backgroundColor: finalBg, offset: 1 }
            ], { duration, fill: 'forwards' });

            const anim = expandWin.animate([
                {
                    top: startCY + 'px', left: startCX + 'px',
                    width: startW + 'px', height: startH + 'px',
                    borderRadius: (startW / 2) + 'px',
                    transform: 'translate(-50%, -50%)',
                    offset: 0
                },
                {
                    top: (startCY * 0.7 + endCY * 0.3) + 'px',
                    left: (startCX * 0.7 + endCX * 0.3) + 'px',
                    width: (screenW * 0.5) + 'px',
                    height: (screenW * 0.5) + 'px',
                    borderRadius: (screenW * 0.25) + 'px',
                    transform: 'translate(-50%, -50%)',
                    offset: 0.35
                },
                {
                    top: (startCY * 0.4 + endCY * 0.6) + 'px',
                    left: (startCX * 0.4 + endCX * 0.6) + 'px',
                    width: (screenW * 0.7) + 'px',
                    height: (screenH * 0.7) + 'px',
                    borderRadius: (screenW * 0.35) + 'px',
                    transform: 'translate(-50%, -50%)',
                    offset: 0.65
                },
                {
                    top: (startCY * 0.2 + endCY * 0.8) + 'px',
                    left: (startCX * 0.2 + endCX * 0.8) + 'px',
                    width: (screenW * 0.85) + 'px',
                    height: (screenH * 0.85) + 'px',
                    borderRadius: '60px',
                    transform: 'translate(-50%, -50%)',
                    offset: 0.85
                },
                {
                    top: endCY + 'px', left: endCX + 'px',
                    width: screenW + 'px', height: screenH + 'px',
                    borderRadius: '60px',
                    transform: 'translate(-50%, -50%)',
                    offset: 1
                }
            ], {
                duration: duration,
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
                expandWin.style.background = '';
                btnVisual.remove();
                noticeSlide.style.opacity = '';
                welcomeSlide.classList.remove('current');
                welcomeSlide.style.display = 'none';
                welcomeSlide.style.filter = '';
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
