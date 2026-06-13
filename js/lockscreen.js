const LockScreen = {
    currentPin: '',
    init: () => {
        const ls = document.getElementById('lock-screen');
        let startY = 0;
        let lsSwipeActive = false;
        const SWIPE_THRESHOLD = 80;
        const MAX_SWIPE = 150;

        const updateSwipeProgress = (deltaY) => {
            const progress = Math.min(Math.max(-deltaY / MAX_SWIPE, 0), 1);
            const gClock = document.getElementById('global-clock');
            const flashlight = document.getElementById('ls-flashlight');
            const camera = document.getElementById('ls-camera');
            const scale = 1 - (progress * 0.15);
            const opacity = 1 - progress;
            if (gClock) {
                let baseTransform = 'translateX(-50%)';
                if (gClock.dataset.align === 'left') baseTransform = 'translateX(0)';
                else if (gClock.dataset.align === 'center') baseTransform = 'translate(-50%, -50%)';

                gClock.style.transition = 'none';
                gClock.style.opacity = opacity;
                gClock.style.transform = `${baseTransform} scale(${scale})`;
            }
            if (flashlight) {
                flashlight.style.transition = 'none';
                flashlight.style.opacity = opacity;
                flashlight.style.transform = `scale(${scale})`;
            }
            if (camera) {
                camera.style.transition = 'none';
                camera.style.opacity = opacity;
                camera.style.transform = `scale(${scale})`;
            }
        };

        const resetSwipeProgress = () => {
            const gClock = document.getElementById('global-clock');
            const flashlight = document.getElementById('ls-flashlight');
            const camera = document.getElementById('ls-camera');
            if (gClock) {
                gClock.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                gClock.style.opacity = '';
                gClock.style.transform = '';
            }
            if (flashlight) {
                flashlight.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                flashlight.style.opacity = '';
                flashlight.style.transform = '';
            }
            if (camera) {
                camera.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                camera.style.opacity = '';
                camera.style.transform = '';
            }
            setTimeout(() => {
                if (gClock) gClock.style.transition = '';
                if (flashlight) flashlight.style.transition = '';
                if (camera) camera.style.transition = '';
            }, 350);
        };

        const completeSwipe = () => {
            const gClock = document.getElementById('global-clock');
            const flashlight = document.getElementById('ls-flashlight');
            const camera = document.getElementById('ls-camera');
            if (gClock) {
                let baseTransform = 'translateX(-50%)';
                if (gClock.dataset.align === 'left') baseTransform = 'translateX(0)';
                else if (gClock.dataset.align === 'center') baseTransform = 'translate(-50%, -50%)';

                gClock.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                gClock.style.opacity = '0';
                gClock.style.transform = `${baseTransform} scale(0.85)`;
            }
            if (flashlight) {
                flashlight.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                flashlight.style.opacity = '0';
                flashlight.style.transform = 'scale(0.85)';
            }
            if (camera) {
                camera.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                camera.style.opacity = '0';
                camera.style.transform = 'scale(0.85)';
            }
            setTimeout(() => {
                LockScreen.attemptUnlock();
            }, 25);
        };

        ls.addEventListener('touchstart', e => {
            if (!State.poweredOn) return;
            if (e.target.closest('#ls-biometric') || e.target.closest('#ls-pin-pad')) return;
            startY = e.touches[0].clientY;
            lsSwipeActive = true;
        }, { passive: true });
        ls.addEventListener('touchmove', e => {
            if (!State.poweredOn) return;
            if (!lsSwipeActive || !startY) return;
            const deltaY = e.touches[0].clientY - startY;
            if (deltaY < 0) updateSwipeProgress(deltaY);
        }, { passive: true });
        ls.addEventListener('touchend', e => {
            if (!lsSwipeActive) return;
            if (!State.poweredOn) { startY = 0; lsSwipeActive = false; return; }
            const deltaY = e.changedTouches[0].clientY - startY;
            if (deltaY < -SWIPE_THRESHOLD) {
                completeSwipe();
            } else {
                resetSwipeProgress();
            }
            startY = 0;
            lsSwipeActive = false;
        }, { passive: true });
        ls.addEventListener('mousedown', e => {
            if (!State.poweredOn) return;
            if (e.target.closest('#ls-biometric') || e.target.closest('#ls-pin-pad')) return;
            startY = e.clientY;
            lsSwipeActive = true;
        });
        window.addEventListener('mousemove', e => {
            if (!State.poweredOn) return;
            if (!lsSwipeActive || !startY || e.buttons !== 1) return;
            if (!e.target.closest('#lock-screen') && !State.locked) return;
            const deltaY = e.clientY - startY;
            if (deltaY < 0) updateSwipeProgress(deltaY);
        });
        window.addEventListener('mouseup', e => {
            if (!lsSwipeActive) return;
            if (!State.poweredOn) { startY = 0; lsSwipeActive = false; return; }
            if (startY && State.locked && e.clientY - startY < -SWIPE_THRESHOLD) {
                completeSwipe();
            } else {
                resetSwipeProgress();
            }
            startY = 0;
            lsSwipeActive = false;
        });
        const bioBtn = document.getElementById('ls-biometric');
        let holdTimer = null;
        let isHolding = false;
        const startScan = (e) => {
            e.stopPropagation(); e.preventDefault();
            if (!State.security.fingerprint) return;
            isHolding = true;
            bioBtn.classList.add('scanning');
            holdTimer = setTimeout(() => {
                if (isHolding) {
                    LockScreen.unlock();
                    bioBtn.classList.remove('scanning');
                    isHolding = false;
                }
            }, State.security.slowFingerprint ? 1250 : 250);
        };
        const endScan = (e) => {
            e.stopPropagation(); e.preventDefault();
            clearTimeout(holdTimer);
            isHolding = false;
            bioBtn.classList.remove('scanning');
        };
        bioBtn.addEventListener('mousedown', startScan);
        bioBtn.addEventListener('mouseup', endScan);
        bioBtn.addEventListener('mouseleave', endScan);
        bioBtn.addEventListener('touchstart', startScan);
        bioBtn.addEventListener('touchend', endScan);

        const pinPad = document.getElementById('ls-pin-pad');
        let pinStartY = 0;
        pinPad.addEventListener('touchstart', (e) => { pinStartY = e.touches[0].clientY; }, { passive: true });
        pinPad.addEventListener('touchmove', (e) => {
            if (!pinStartY) return;
            const deltaY = e.touches[0].clientY - pinStartY;
            if (deltaY > 60) {
                LockScreen.cancelPin();
                pinStartY = 0;
            }
        }, { passive: true });
        pinPad.addEventListener('mousedown', (e) => { pinStartY = e.clientY; });
        window.addEventListener('mousemove', (e) => {
            if (pinStartY && e.buttons === 1) {
                const deltaY = e.clientY - pinStartY;
                if (deltaY > 60) {
                    LockScreen.cancelPin();
                    pinStartY = 0;
                }
            }
        });
        window.addEventListener('mouseup', () => { pinStartY = 0; });

        let _lastLsTapTime = 0;
        let _lastLsTapY = 0;
        const handleLsDoubleTap = (clientY) => {
            const now = Date.now();
            if (now - _lastLsTapTime < 300 && Math.abs(clientY - _lastLsTapY) < 15) {
                _lastLsTapTime = 0;
                if (!State.lsCustomizing) {
                    OS.togglePower();
                }
            } else {
                _lastLsTapTime = now;
                _lastLsTapY = clientY;
            }
        };
        ls.addEventListener('touchend', (e) => {
            if (e.target.closest('#ls-biometric') || e.target.closest('#ls-pin-pad')) return;
            handleLsDoubleTap(e.changedTouches[0].clientY);
        });
        ls.addEventListener('click', (e) => {
            if (e.target.closest('#ls-biometric') || e.target.closest('#ls-pin-pad')) return;
            handleLsDoubleTap(e.clientY);
        });

        const powerLayer = document.getElementById('power-layer');
        let _lastPowerTapTime = 0;
        powerLayer.addEventListener('touchend', (e) => {
            if (e.target.closest('#ls-biometric')) return;
            const now = Date.now();
            if (now - _lastPowerTapTime < 300) {
                _lastPowerTapTime = 0;
                if (!State.poweredOn) OS.togglePower();
            } else {
                _lastPowerTapTime = now;
            }
        });
        powerLayer.addEventListener('click', (e) => {
            if (e.target.closest('#ls-biometric')) return;
            const now = Date.now();
            if (now - _lastPowerTapTime < 300) {
                _lastPowerTapTime = 0;
                if (!State.poweredOn) OS.togglePower();
            } else {
                _lastPowerTapTime = now;
            }
        });

        let _lsHoldTimer = null;
        let _lsHoldStartX = 0;
        let _lsHoldStartY = 0;
        const startLsHold = (x, y) => {
            _lsHoldStartX = x;
            _lsHoldStartY = y;
            _lsHoldTimer = setTimeout(() => {
                if (State.poweredOn && State.locked && !State.lsCustomizing) {
                    LockScreen.enterCustomization();
                }
            }, 500);
        };
        const cancelLsHold = () => { clearTimeout(_lsHoldTimer); _lsHoldTimer = null; };
        const moveLsHold = (x, y) => {
            if (_lsHoldTimer && (Math.abs(x - _lsHoldStartX) > 10 || Math.abs(y - _lsHoldStartY) > 10)) cancelLsHold();
        };
        ls.addEventListener('touchstart', (e) => {
            if (e.target.closest('#ls-biometric') || e.target.closest('#ls-pin-pad')) return;
            startLsHold(e.touches[0].clientX, e.touches[0].clientY);
        });
        ls.addEventListener('touchmove', (e) => moveLsHold(e.touches[0].clientX, e.touches[0].clientY));
        ls.addEventListener('touchend', cancelLsHold);
        ls.addEventListener('mousedown', (e) => {
            if (e.target.closest('#ls-biometric') || e.target.closest('#ls-pin-pad')) return;
            startLsHold(e.clientX, e.clientY);
        });
        ls.addEventListener('mousemove', (e) => moveLsHold(e.clientX, e.clientY));
        ls.addEventListener('mouseup', cancelLsHold);

        LockScreen.updateUI();
    },
    shake: () => {

        const pinPad = document.getElementById('ls-pin-pad');
        if (!pinPad) return;

        const title = pinPad.querySelector('div:first-child');
        const dots = document.getElementById('ls-dots');
        const grid = pinPad.querySelector('.setup-pin-grid');
        const forgot = pinPad.querySelector('div:last-child');
        const buttons = grid ? Array.from(grid.querySelectorAll('.setup-pin-btn')) : [];

        const btnRows = [];
        for (let i = 0; i < buttons.length; i += 3) {
            btnRows.push(buttons.slice(i, i + 3));
        }

        const groups = [];
        if (title && dots) groups.push([title, dots]);
        btnRows.forEach(row => groups.push(row));
        if (forgot) groups.push([forgot]);

        const shakeKeyframes = [
            { transform: 'translateX(0)', offset: 0 },
            { transform: 'translateX(-10px)', offset: 0.25 },
            { transform: 'translateX(10px)', offset: 0.75 },
            { transform: 'translateX(0)', offset: 1 }
        ];

        groups.forEach((els, gi) => {
            const delay = gi * 30;
            els.forEach(el => {
                if (el) {
                    el.animate(shakeKeyframes, { duration: 400, delay, easing: 'ease-in-out' });
                }
            });
        });
    },
    lock: () => {
        State.locked = true;
        const wallLayer = document.getElementById('wallpaper-layer');
        if (wallLayer && State.homescreenBlur) {
            wallLayer.style.transition = 'filter 0.4s ease-out';
            wallLayer.style.filter = 'blur(0px)';
        }

        const pinPad = document.getElementById('ls-pin-pad');
        if (pinPad && pinPad.classList.contains('active')) {
            pinPad.style.transition = 'none';
            pinPad.classList.remove('active');
            void pinPad.offsetWidth;
            pinPad.style.transition = '';
        }

        setTimeout(() => {
            ControlCenter.forceClose();
            const lockWallLayer = document.getElementById('lock-wallpaper-layer');
            if (lockWallLayer) lockWallLayer.style.transition = 'none';
            document.body.classList.add('ls-active');
            document.getElementById('lock-screen').classList.remove('hidden');
            document.getElementById('home-screen').classList.add('hidden-locked');
            requestAnimationFrame(() => {
                if (lockWallLayer) lockWallLayer.style.transition = '';
            });
            const gClockLock = document.getElementById('global-clock');
            if (State.poweredOn || State.aod.enabled) {
                gClockLock.classList.remove('hidden');
            }
            const flashlight = document.getElementById('ls-flashlight');
            const camera = document.getElementById('ls-camera');
            if (gClockLock) { gClockLock.style.transition = ''; gClockLock.style.opacity = ''; gClockLock.style.transform = ''; }
            if (flashlight) { flashlight.style.transition = ''; flashlight.style.opacity = ''; flashlight.style.transform = ''; }
            if (camera) { camera.style.transition = ''; camera.style.opacity = ''; camera.style.transform = ''; }
            OS.applySettings();
            LockScreen.currentPin = '';
            const bioBtn = document.getElementById('ls-biometric');
            if (bioBtn) { bioBtn.style.transition = ''; bioBtn.style.opacity = ''; }
            LockScreen.updateUI();
            if (wallLayer) {
                wallLayer.style.transition = '';
                wallLayer.style.filter = '';
            }
        }, 300);
    },
    unlock: () => {
        const flashlight = document.getElementById('ls-flashlight');
        const camera = document.getElementById('ls-camera');

                if (!State.poweredOn && State.aod.enabled) {
            if (flashlight) { flashlight.style.transition = 'none'; flashlight.style.opacity = '0'; }
            if (camera) { camera.style.transition = 'none'; camera.style.opacity = '0'; }
        }

        if (!State.poweredOn) OS.togglePower(true);
        State.locked = false;
        document.getElementById('ls-pin-pad').classList.remove('active');
        LockScreen.currentPin = '';
        LockScreen.renderDots();
        const bioBtn = document.getElementById('ls-biometric');
        if (bioBtn) {
            bioBtn.style.transition = 'opacity 0.01s ease';
            bioBtn.style.opacity = '0';
        }
        const gClockUnlock = document.getElementById('global-clock');
        if (gClockUnlock) { gClockUnlock.style.transition = ''; gClockUnlock.style.opacity = ''; gClockUnlock.style.transform = ''; }
        document.getElementById('lock-screen').classList.add('hidden');
        document.getElementById('home-screen').classList.remove('hidden-locked');

                const homeContents = document.getElementById('home-contents');
        if (homeContents) {
            homeContents.style.transition = '';
            homeContents.style.opacity = '';
        }

                if (gClockUnlock) {
            gClockUnlock.classList.add('hidden');
            gClockUnlock.classList.remove('ls-clock-box');
            if (LockScreen._clockBoxHandler) {
                gClockUnlock.removeEventListener('click', LockScreen._clockBoxHandler);
                LockScreen._clockBoxHandler = null;
            }
        }
        document.body.classList.remove('ls-customizing-active');
        State.lsCustomizing = false;
        const sbClock = document.getElementById('clock');
        if (sbClock) { sbClock.style.transition = ''; sbClock.style.opacity = ''; }
        document.body.classList.remove('ls-blurred');
        const homeUrl = State.wallpapers[State.currentWall] || '';
        const lockUrl = State.wallpapers[State.lockWall] || '';
        if (homeUrl !== lockUrl) {
            const lockLayer = document.getElementById('lock-wallpaper-layer');
            const wallLayer = document.getElementById('wallpaper-layer');
            if (lockLayer) {
                lockLayer.style.transition = 'opacity 0.15s ease';
                lockLayer.style.filter = 'blur(20px)';
            }
            if (wallLayer) {
                wallLayer.style.filter = 'blur(20px)';
                wallLayer.style.transition = 'filter 0.15s ease';
            }
            document.body.classList.remove('ls-active');
            setTimeout(() => {
                if (wallLayer) {
                    wallLayer.style.filter = '';
                    wallLayer.style.transition = '';
                }
                if (lockLayer) {
                    lockLayer.style.filter = '';
                    lockLayer.style.transition = '';
                }
            }, 150);
        } else {
            document.body.classList.remove('ls-active');
        }
        Island.notifyUnlock();
        OS.updateWallpaperEffect();
        const grid = document.getElementById('app-grid');
        const dock = document.getElementById('dock');
        if (grid) {
            const screenEl = document.getElementById('screen');
            const phoneW = screenEl.offsetWidth;
            const phoneH = screenEl.offsetHeight;
            const gridIcons = Array.from(grid.querySelectorAll('.app-icon'));
            const dockIcons = dock ? Array.from(dock.querySelectorAll('.app-icon')) : [];
            const cols = 4;
            const colFracs = [-0.7, -0.2333333, 0.2333333, 0.7];
            const rowYStart = -0.44;
            const rowYStep = 0.24;
            const iconCells = gridIcons.map((icon, idx) => {
                const gr = parseInt(icon.style.gridRow) || 0;
                const gc = parseInt(icon.style.gridColumn) || 0;
                const r = gr > 0 ? gr - 1 : Math.floor(idx / cols);
                const c = gc > 0 ? gc - 1 : idx % cols;
                return { r, c, idx };
            });
            const maxRow = iconCells.reduce((m, ic) => Math.max(m, ic.r), 0);
            const gridRows = maxRow + 1;
            const unlockTransforms = {};
            iconCells.forEach(({ r, c, idx }) => {
                const clampC = Math.max(0, Math.min(cols - 1, c));
                const tx = colFracs[clampC] * phoneW;
                const ty = (rowYStart + r * rowYStep) * phoneH;
                unlockTransforms[idx] = `translate(${tx}px, ${ty}px) scale(3)`;
            });
            const groups = [];
            if (gridRows >= 4) {
                groups.push([]);
                iconCells.forEach(({ r, c, idx }) => {
                    if (r >= 1 && r < gridRows - 1 && c >= 1 && c <= 2) groups[0].push(idx);
                });
                groups.push([]);
                iconCells.forEach(({ r, c, idx }) => {
                    if (r >= 1 && r < gridRows - 1 && (c === 0 || c === 3)) groups[1].push(idx);
                });
                groups.push([]);
                iconCells.forEach(({ r, c, idx }) => {
                    if ((r === 0 || r === gridRows - 1) && c >= 1 && c <= 2) groups[2].push(idx);
                });
                groups.push([]);
                iconCells.forEach(({ r, c, idx }) => {
                    if ((r === 0 || r === gridRows - 1) && (c === 0 || c === 3)) groups[3].push(idx);
                });
            } else {
                for (let r = 0; r < gridRows; r++) {
                    const rowGroup = [];
                    iconCells.forEach(({ r: ir, idx }) => {
                        if (ir === r) rowGroup.push(idx);
                    });
                    groups.push(rowGroup);
                }
            }
            const delayPerGroup = 60;
            const duration = 520;
            const easing = 'cubic-bezier(.38, 1.22, .27, 1)';
            groups.forEach((idxGroup, gi) => {
                const delay = gi * delayPerGroup;
                idxGroup.forEach(idx => {
                    const icon = gridIcons[idx];
                    if (!icon) return;
                    icon.animate(
                        [
                            { opacity: 0, transform: unlockTransforms[idx], filter: State.liteMode ? 'none' : 'blur(10px)', offset: 0 },
                            { opacity: 1, filter: 'blur(0px)', offset: 0.3 },
                            { opacity: 1, transform: 'none', filter: 'blur(0px)', offset: 1 }
                        ],
                        { duration, delay, easing, fill: 'backwards' }
                    );
                });
            });
            const dockDelay = ((groups.length - 1) * delayPerGroup) + (duration * 0.25);
            const dockEl = document.getElementById('dock');
            if (dockEl) {
                dockEl.animate(
                    [
                        { opacity: 0, transform: 'translateY(100px)' },
                        { opacity: 1, transform: 'translateY(0)' }
                    ],
                    { duration: 400, delay: dockDelay, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' }
                );
            }
        }
    },
    attemptUnlock: () => {
        if (State.security.pin) {
            document.getElementById('ls-pin-pad').classList.add('active');
            LockScreen.renderDots();
        } else {
            LockScreen.unlock();
        }
    },
    updateUI: () => {
        const bioBtn = document.getElementById('ls-biometric');
        if (State.security.fingerprint) {
            bioBtn.style.display = 'flex';

            const icon = State.security.bioIcon;
            if (bioBtn.dataset.currentIcon === icon) return;

            bioBtn.dataset.currentIcon = icon;
            bioBtn.className = '';
            bioBtn.innerHTML = '';
            if (icon === 'glow-circle') {
                bioBtn.style.border = 'none';
                bioBtn.style.background = 'transparent';
                bioBtn.style.backdropFilter = 'none';
                bioBtn.innerHTML = '<div class="bio-glow-circle"></div><div class="bio-blur-wave"></div>';
            } else if (icon === 'blur-ring') {
                bioBtn.style.border = 'none';
                bioBtn.style.background = 'transparent';
                bioBtn.style.backdropFilter = 'none';
                bioBtn.innerHTML = '<div class="bio-blur-ring"></div><div class="bio-ocean-wave"></div>';
            } else if (icon === 'pulse-dot') {
                bioBtn.style.border = 'none';
                bioBtn.style.background = 'transparent';
                bioBtn.style.backdropFilter = 'none';
                bioBtn.innerHTML = '<div class="bio-pulse-dot"></div><div class="bio-pulse-rings"></div>';
            } else if (icon === 'frost-ring') {
                bioBtn.style.border = 'none';
                bioBtn.style.background = 'transparent';
                bioBtn.style.backdropFilter = 'none';
                bioBtn.innerHTML = '<div class="bio-frost-ring"></div><div class="bio-frost-wave"></div>';
            } else if (icon === 'diamond') {
                bioBtn.style.border = 'none';
                bioBtn.style.background = 'transparent';
                bioBtn.style.backdropFilter = 'none';
                bioBtn.innerHTML = '<div class="bio-ripple-ring"></div><div class="bio-ripple-wave"></div>';
            } else if (icon === 'fingerprint') {
                bioBtn.style.border = 'none';
                bioBtn.style.background = 'transparent';
                bioBtn.style.backdropFilter = 'none';
                bioBtn.innerHTML = '<i class="fas fa-fingerprint" style="font-size:35px;color:white"></i><div class="bio-print-wave"></div>';
            } else {
                bioBtn.style.border = '4px solid rgba(145,147,151,0.7)';
                bioBtn.style.background = 'transparent';
                bioBtn.style.backdropFilter = 'none';
                bioBtn.innerHTML = '<div class="bio-default-glow"></div>';
            }
        }
        else bioBtn.style.display = 'none';
    },
    addPin: (n) => {
        if (LockScreen.currentPin.length < 4) {
            LockScreen.currentPin += n;
            LockScreen.renderDots();
            if (LockScreen.currentPin.length === 4) LockScreen.verifyPin();
        }
    },
    cancelPin: () => {
        document.getElementById('ls-pin-pad').classList.remove('active');
        LockScreen.currentPin = '';
        LockScreen.renderDots();
        const gClock = document.getElementById('global-clock');
        const flashlight = document.getElementById('ls-flashlight');
        const camera = document.getElementById('ls-camera');
        if (gClock) { gClock.style.transition = ''; gClock.style.opacity = ''; gClock.style.transform = ''; }
        if (flashlight) { flashlight.style.transition = ''; flashlight.style.opacity = ''; flashlight.style.transform = ''; }
        if (camera) { camera.style.transition = ''; camera.style.opacity = ''; camera.style.transform = ''; }
    },
    renderDots: () => {
        const dots = document.getElementById('ls-dots').children;
        for (let i = 0; i < 4; i++) {
            if (i < LockScreen.currentPin.length) dots[i].classList.add('filled');
            else dots[i].classList.remove('filled');
        }
    },
    verifyPin: () => {
        setTimeout(() => {
            if (LockScreen.currentPin === State.security.pin) {
                const pinPad = document.getElementById('ls-pin-pad');
                if (!pinPad) { LockScreen.unlock(); return; }

                const title = pinPad.querySelector('div:first-child');
                const dots = pinPad.querySelector('.ls-dots');
                const grid = pinPad.querySelector('.setup-pin-grid');
                const forgot = pinPad.querySelector('div:last-child');
                const buttons = grid ? Array.from(grid.querySelectorAll('.setup-pin-btn')) : [];

                const btnRows = [];
                for (let i = 0; i < buttons.length; i += 3) {
                    btnRows.push(buttons.slice(i, i + 3));
                }

                const groups = [];
                if (forgot) groups.push([forgot]);

                for (let i = btnRows.length - 1; i >= 0; i--) {
                    groups.push(btnRows[i]);
                }
                if (title && dots) groups.push([title, dots]);

                const stagger = 20;
                const duration = 150;
                const easing = 'cubic-bezier(0.4, 0, 1, 1)';

                groups.forEach((els, gi) => {
                    const delay = gi * stagger;
                    els.forEach(el => {
                        el.animate([
                            { opacity: 1, transform: 'translateY(0)' },
                            { opacity: 0, transform: 'translateY(-30px)' }
                        ], { duration, delay, easing, fill: 'forwards' });
                    });
                });

                const totalAnimTime = (groups.length - 1) * stagger + duration;
                const blurStart = totalAnimTime * 0.3;
                const blurDur = totalAnimTime - blurStart + 100;

                if (State.liteMode) {
                    pinPad.style.transition = `opacity 0.4s ease-out, background ${blurDur}ms ease ${blurStart}ms`;
                    pinPad.style.background = 'transparent';
                } else {
                    pinPad.style.transition = `opacity 0.4s ease-out, backdrop-filter ${blurDur}ms ease ${blurStart}ms, -webkit-backdrop-filter ${blurDur}ms ease ${blurStart}ms, background ${blurDur}ms ease ${blurStart}ms`;
                    pinPad.style.backdropFilter = 'blur(0px)';
                    pinPad.style.webkitBackdropFilter = 'blur(0px)';
                    pinPad.style.background = 'rgba(0,0,0,0)';
                }

                setTimeout(() => {
                    LockScreen.unlock();
                }, totalAnimTime * 0.6);

                setTimeout(() => {
                    pinPad.style.transition = 'none';
                    pinPad.classList.remove('active');
                    void pinPad.offsetWidth;

                    pinPad.style.backdropFilter = '';
                    pinPad.style.webkitBackdropFilter = '';
                    pinPad.style.background = '';
                    pinPad.style.opacity = '';
                    groups.forEach(els => {
                        els.forEach(el => {
                            el.getAnimations().forEach(a => a.cancel());
                        });
                    });
                    pinPad.style.transition = '';
                }, totalAnimTime + 80);
            } else {
                LockScreen.shake();
                LockScreen.currentPin = '';
                LockScreen.renderDots();
            }
        }, 200);
    },
    enterCustomization: () => {
        if (State.lsCustomizing) return;
        State.lsCustomizing = true;
        LockScreen._customizeEnteredAt = Date.now();
        const ls = document.getElementById('lock-screen');
        const bio = document.getElementById('ls-biometric');
        const gClock = document.getElementById('global-clock');
        const device = document.getElementById('device');

        document.body.classList.add('ls-customizing-active');

        let backdrop = document.getElementById('ls-custom-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'ls-custom-backdrop';
            backdrop.className = 'ls-custom-backdrop';
            backdrop.addEventListener('click', (e) => {
                LockScreen.exitCustomization();
            });
            device.appendChild(backdrop);
        }
        requestAnimationFrame(() => backdrop.classList.add('active'));

        const scr = document.getElementById('screen');
        if (scr && scr.animate) {
            scr.animate(
                [{ transform: 'scale(1)', borderRadius: '48px' }, { transform: 'scale(0.85)', borderRadius: '60px' }],
                { duration: 400, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' }
            );
        }

        LockScreen._screenEmptyClickHandler = (e) => {
            if (!State.lsCustomizing) return;
            if (Date.now() - (LockScreen._customizeEnteredAt || 0) < 600) return;
            if (e.target.closest('#global-clock') || e.target.closest('#ls-custom-sheet') || e.target.closest('.ls-widget')) return;
            LockScreen.exitCustomization();
        };
        if (scr) scr.addEventListener('click', LockScreen._screenEmptyClickHandler);

        ls.classList.add('ls-customizing');

        if (bio) { bio.style.transition = 'opacity 0.3s ease'; bio.style.opacity = '0'; bio.style.pointerEvents = 'none'; }

        if (gClock) gClock.classList.add('ls-clock-box');
        LockScreen._clockBoxHandler = (e) => {
            e.stopPropagation();
            e.preventDefault();
            LockScreen.showClockSheet();
        };
        if (gClock) gClock.addEventListener('click', LockScreen._clockBoxHandler);
    },
    exitCustomization: () => {
        if (!State.lsCustomizing) return;
        State.lsCustomizing = false;
        const ls = document.getElementById('lock-screen');
        const bio = document.getElementById('ls-biometric');
        const gClock = document.getElementById('global-clock');

        const sheet = document.getElementById('ls-custom-sheet');
        if (sheet) { sheet.classList.remove('active'); setTimeout(() => sheet.remove(), 550); }

        const backdrop = document.getElementById('ls-custom-backdrop');
        if (backdrop) { backdrop.classList.remove('active'); setTimeout(() => backdrop.remove(), 350); }

        ls.classList.remove('ls-customizing');
        document.body.classList.remove('ls-customizing-active');

        const scr = document.getElementById('screen');
        if (scr && scr.animate) {
            const anim = scr.animate(
                [{ transform: 'scale(0.85)', borderRadius: '60px' }, { transform: 'scale(1)', borderRadius: '48px' }],
                { duration: 400, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' }
            );
            anim.onfinish = () => {
                scr.style.borderRadius = '';
                scr.style.transform = '';
            };
        }
        if (scr && LockScreen._screenEmptyClickHandler) {
            scr.removeEventListener('click', LockScreen._screenEmptyClickHandler);
            LockScreen._screenEmptyClickHandler = null;
        }

        if (bio && State.security.fingerprint) {
            bio.style.transition = 'opacity 0.3s ease';
            bio.style.opacity = '1';
            bio.style.pointerEvents = 'auto';
        }

        if (gClock) {
            gClock.classList.remove('ls-clock-box');
            if (LockScreen._clockBoxHandler) gClock.removeEventListener('click', LockScreen._clockBoxHandler);
        }
    },
    showClockSheet: () => {
        if (document.getElementById('ls-custom-sheet')) return;
        const device = document.getElementById('device');
        const cc = State.clockConfig || {};
        const fw = cc.fontWeight || 600;
        const bOp = cc.boldOpacity !== undefined ? cc.boldOpacity : 0.72;
        const cf = cc.font || 'default';
        const fontNames = { default: 'Inter', serif: 'Serif', science: 'Science Gothic', mono: 'Monoton', lux: 'Luxurious Roman' };
        const isStretched = cc.style === 'stretched';

        const sheet = document.createElement('div');
        sheet.id = 'ls-custom-sheet';
        sheet.className = 'ls-custom-sheet';
        sheet.addEventListener('click', (e) => e.stopPropagation());
        sheet.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <span style="font-size:18px; font-weight:600; color:#fff;">Clock</span>
                <button id="ls-sheet-done" style="background:none; border:none; color:#0a84ff; font-size:16px; font-weight:600; cursor:pointer; padding:6px 12px;">Done</button>
            </div>
            <div style="display:flex; flex-direction:column; gap:14px;">

                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:#fff; font-size:15px;">Alignment</span>
                    <div class="settings-dropdown" id="ls-clock-align">
                        <div class="sd-trigger" onclick="Apps.settings.toggleDropdown(this)">
                            <span class="sd-value" id="ls-align-val">${cc.align === 'left' ? 'Left' : (cc.align === 'center' ? 'Center' : 'Top')}</span>
                            <i class="fas fa-chevron-down sd-chevron"></i>
                        </div>
                        <div class="sd-options">
                            <div class="sd-option" data-val="top"><span>Top</span>${!cc.align || cc.align === 'top' ? '<i class="fas fa-check"></i>' : ''}</div>
                            <div class="sd-option" data-val="center"><span>Center</span>${cc.align === 'center' ? '<i class="fas fa-check"></i>' : ''}</div>
                            <div class="sd-option" data-val="left"><span>Left</span>${cc.align === 'left' ? '<i class="fas fa-check"></i>' : ''}</div>
                        </div>
                    </div>
                </div>
                <div id="ls-sheet-font-row" style="display:flex; justify-content:space-between; align-items:center; ${isStretched ? 'opacity:0.4; pointer-events:none;' : ''}">
                    <span style="color:#fff; font-size:15px;" id="ls-font-label">${isStretched ? 'Font (disabled)' : 'Font'}</span>
                    <div class="settings-dropdown" id="ls-clock-font">
                        <div class="sd-trigger" onclick="Apps.settings.toggleDropdown(this)">
                            <span class="sd-value" id="ls-font-val">${fontNames[cf] || 'Inter'}</span>
                            <i class="fas fa-chevron-down sd-chevron"></i>
                        </div>
                        <div class="sd-options">
                            <div class="sd-option" data-val="default"><span>Inter</span>${cf == 'default' ? '<i class="fas fa-check"></i>' : ''}</div>
                            <div class="sd-option" data-val="serif"><span style="font-family:'Times New Roman', serif">Serif</span>${cf == 'serif' ? '<i class="fas fa-check"></i>' : ''}</div>
                            <div class="sd-option" data-val="science"><span style="font-family:'Rajdhani', sans-serif">Science Gothic</span>${cf == 'science' ? '<i class="fas fa-check"></i>' : ''}</div>
                            <div class="sd-option" data-val="mono"><span style="font-family:'Monoton', cursive">Monoton</span>${cf == 'mono' ? '<i class="fas fa-check"></i>' : ''}</div>
                            <div class="sd-option" data-val="lux"><span style="font-family:'Luxurious Roman', serif">Luxurious Roman</span>${cf == 'lux' ? '<i class="fas fa-check"></i>' : ''}</div>
                        </div>
                    </div>
                </div>
                <div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#fff; font-size:15px;">Font Weight</span><span id="ls-fw-val" style="color:rgba(255,255,255,0.6); font-size:14px;">${fw}</span></div>
                    <div class="custom-slider" data-min="100" data-max="900" data-step="100" data-value="${fw}" data-oninput="State.clockConfig = State.clockConfig || {}; State.clockConfig.fontWeight = value; document.getElementById('ls-fw-val').innerText = value; Storage.saveSettings(); OS.updateTime();"><div class="cs-track"><div class="cs-fill"><div class="cs-thumb"></div></div></div></div>
                </div>
                <div style="display:flex; gap:16px; align-items:center;">
                    <span style="color:#fff; font-size:15px; flex:1;">Hour Color</span>
                    <input type="color" id="ls-sheet-hc" value="${cc.hourColor && cc.hourColor.startsWith('#') ? cc.hourColor : '#ffffff'}" style="border:none; background:none; width:36px; height:36px; cursor:pointer; padding:0;" />
                </div>
                <div style="display:flex; gap:16px; align-items:center;">
                    <span style="color:#fff; font-size:15px; flex:1;">Minute Color</span>
                    <input type="color" id="ls-sheet-mc" value="${cc.minuteColor && cc.minuteColor.startsWith('#') ? cc.minuteColor : '#ffffff'}" style="border:none; background:none; width:36px; height:36px; cursor:pointer; padding:0;" />
                </div>
                <div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#fff; font-size:15px;">Opacity</span><span id="ls-op-val" style="color:rgba(255,255,255,0.6); font-size:14px;">${Math.round(bOp * 100)}%</span></div>
                    <div class="custom-slider" data-min="20" data-max="100" data-step="1" data-value="${Math.round(bOp * 100)}" data-oninput="State.clockConfig = State.clockConfig || {}; State.clockConfig.boldOpacity = value / 100; document.getElementById('ls-op-val').innerText = Math.round(value) + '%'; Storage.saveSettings(); OS.updateTime();"><div class="cs-track"><div class="cs-fill"><div class="cs-thumb"></div></div></div></div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:#fff; font-size:15px;">Apply colors to status bar</span>
                    <div id="ls-sheet-sb-color" class="toggle ${cc.statusBarColor ? 'active' : ''}"></div>
                </div>
            </div>
        `;
        device.appendChild(sheet);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => sheet.classList.add('active'));
            if (Apps.settings && Apps.settings.initSliders) {
                const sheetSliders = sheet.querySelectorAll('.custom-slider');
                sheetSliders.forEach(slider => {
                    slider._csInit = false;
                });
                Apps.settings.initSliders();
            }
        });

        document.getElementById('ls-sheet-done').addEventListener('click', () => {
            const sheet = document.getElementById('ls-custom-sheet');
            if (sheet) {
                sheet.classList.remove('active');
                setTimeout(() => sheet.remove(), 550);
            }
        });

        document.getElementById('ls-sheet-sb-color').addEventListener('click', (e) => {
            State.clockConfig = State.clockConfig || {};
            State.clockConfig.statusBarColor = !State.clockConfig.statusBarColor;
            e.target.classList.toggle('active', State.clockConfig.statusBarColor);
            Storage.saveSettings();
            OS.updateTime();
        });

        sheet.querySelectorAll('#ls-clock-style .sd-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                const val = opt.getAttribute('data-val');
                const isS = val === 'stretched';
                State.clockConfig = State.clockConfig || {};
                State.clockConfig.style = val;
                Storage.saveSettings();
                OS.applySettings();
                OS.updateTime();

                const fRow = document.getElementById('ls-sheet-font-row');
                if (fRow) fRow.style.cssText = 'display:flex; justify-content:space-between; align-items:center;';
                const fLabel = document.getElementById('ls-font-label');
                if (fLabel) fLabel.innerText = 'Font';

                const dd = document.getElementById('ls-clock-style');
                dd.classList.remove('open');
                dd.querySelector('.sd-value').innerText = opt.querySelector('span').innerText;
                dd.querySelectorAll('.fa-check').forEach(i => i.remove());
                opt.insertAdjacentHTML('beforeend', '<i class="fas fa-check"></i>');
            });
        });

        sheet.querySelectorAll('#ls-clock-align .sd-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                const val = opt.getAttribute('data-val');
                State.clockConfig = State.clockConfig || {};
                State.clockConfig.align = val;
                Storage.saveSettings();
                OS.applySettings();
                OS.updateTime();

                const dd = document.getElementById('ls-clock-align');
                dd.classList.remove('open');
                dd.querySelector('.sd-value').innerText = opt.querySelector('span').innerText;
                dd.querySelectorAll('.fa-check').forEach(i => i.remove());
                opt.insertAdjacentHTML('beforeend', '<i class="fas fa-check"></i>');
            });
        });

        sheet.querySelectorAll('#ls-clock-font .sd-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                const val = opt.getAttribute('data-val');
                State.clockConfig = State.clockConfig || {};
                State.clockConfig.font = val;
                Storage.saveSettings();
                OS.applySettings();
                OS.updateTime();

                const dd = document.getElementById('ls-clock-font');
                dd.classList.remove('open');
                dd.querySelector('.sd-value').innerText = opt.querySelector('span').innerText;
                dd.querySelectorAll('.fa-check').forEach(i => i.remove());
                opt.insertAdjacentHTML('beforeend', '<i class="fas fa-check"></i>');
            });
        });

        document.getElementById('ls-sheet-hc').addEventListener('input', (e) => {
            State.clockConfig = State.clockConfig || {};
            State.clockConfig.hourColor = e.target.value;
            State.clockConfig.autoColor = false;
            Storage.saveSettings(); OS.updateTime();
        });

        document.getElementById('ls-sheet-mc').addEventListener('input', (e) => {
            State.clockConfig = State.clockConfig || {};
            State.clockConfig.minuteColor = e.target.value;
            State.clockConfig.autoColor = false;
            Storage.saveSettings(); OS.updateTime();
        });
    }
};
