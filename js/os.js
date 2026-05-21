const OS = {
    getShapeRadius: () => {
        let v = parseInt(State.appShape);
        if (isNaN(v)) v = 50;
        if (v < 27) v = 27;
        if (v > 50) v = 50;
        return v + '%';
    },
    updateWallpaperEffect: (idx) => {
        const wallLayer = document.getElementById('wallpaper-layer');
        const powerLayer = document.getElementById('power-layer');
        const aodBg = document.getElementById('aod-bg-layer');
        const bio = document.getElementById('ls-biometric');

        if (!wallLayer) return;

        const i = idx !== undefined ? idx : State.currentWall;

        const currentUrl = State.wallpapers[State.currentWall];
        const isSpecial = !isVideoWallpaper(currentUrl) && State.specialEffects;

        const lsHideElements = [
            document.getElementById('ls-date'),
            document.getElementById('ls-pin-pad'),
            document.querySelector('.ls-hint')
        ];

        const statusBar = document.querySelector('.status-bar');
        const island = document.getElementById('island-wrap');
        const lsDate = document.getElementById('ls-date');
        const lsHint = document.querySelector('.ls-hint');
        const gestureBar = document.querySelector('.home-bar');

        const lockScreen = document.getElementById('lock-screen');
        const gestureArea = document.getElementById('gesture-area');

        if (lsDate) lsDate.style.transition = 'opacity 0.5s ease';

        if (gestureBar) {
            if (State.swipeToClose === false) {
                gestureBar.classList.add('no-animation');
            } else {
                gestureBar.classList.remove('no-animation');
            }
        }

        if (bio) {
            if (State.security.fingerprint) {
                bio.style.display = 'flex';
                bio.style.opacity = '0';
                bio.style.pointerEvents = 'none';
            } else {
                bio.style.display = 'none';
            }
        }

        if (!State.poweredOn) {
            if (!State.aod.enabled) {
                if (lockScreen) {
                    lockScreen.style.opacity = '0';
                    lockScreen.style.pointerEvents = 'none';
                }
                if (gestureArea) {
                    gestureArea.style.opacity = '0';
                    gestureArea.style.pointerEvents = 'none';
                }
            } else {
                if (lockScreen) {
                    lockScreen.style.opacity = '';
                    lockScreen.style.pointerEvents = '';
                }

                if (gestureArea) {
                    gestureArea.style.opacity = '0';
                    gestureArea.style.pointerEvents = 'none';
                }

                lsHideElements.forEach(el => { if (el) { el.style.opacity = '0'; el.style.pointerEvents = 'none'; } });
                if (lsHint) { lsHint.style.opacity = '0'; lsHint.style.visibility = ''; }

                if (bio && State.security.fingerprint) {
                    bio.style.opacity = '1';
                    bio.style.pointerEvents = 'auto';
                }

                if (statusBar) {
                    statusBar.style.zIndex = '10002';
                    statusBar.style.opacity = '0.5';
                    statusBar.style.filter = 'grayscale(1)';
                    statusBar.style.transition = 'none';
                }
                if (island) {
                    island.style.zIndex = '10002';
                    island.style.opacity = '0.6';
                    island.style.filter = '';
                    island.style.transition = 'none';
                }
            }
        } else if (State.locked) {
            if (lockScreen) {
                lockScreen.style.opacity = '';
                lockScreen.style.pointerEvents = '';
            }
            if (gestureArea) {
                gestureArea.style.opacity = '';
                gestureArea.style.pointerEvents = '';
            }

            lsHideElements.forEach(el => { if (el) { el.style.opacity = ''; el.style.pointerEvents = ''; } });
            if (lsHint) { lsHint.style.opacity = ''; lsHint.style.visibility = ''; }

            if (statusBar) {
                statusBar.style.zIndex = '';
                statusBar.style.opacity = '';
                statusBar.style.filter = '';
                statusBar.style.transition = 'none';
            }
            if (island) {
                island.style.zIndex = '';
                island.style.opacity = '';
                island.style.filter = '';
                island.style.transition = 'none';
            }
            if (bio && State.security.fingerprint) {
                bio.style.opacity = '1';
                bio.style.pointerEvents = 'auto';
            }
        } else {
            if (lockScreen) {
                lockScreen.style.opacity = '';
                lockScreen.style.pointerEvents = '';
            }
            if (gestureArea) {
                gestureArea.style.opacity = '';
                gestureArea.style.pointerEvents = '';
            }

            lsHideElements.forEach(el => { if (el) { el.style.opacity = ''; el.style.pointerEvents = ''; } });
            if (lsHint) { lsHint.style.visibility = ''; lsHint.style.opacity = ''; }

            if (bio) {
                bio.style.opacity = '0';
                bio.style.pointerEvents = 'none';
            }

            if (statusBar) {
                statusBar.style.zIndex = '';
                statusBar.style.opacity = '';
                statusBar.style.filter = '';
                statusBar.style.transition = '';
            }
            if (island) {
                island.style.zIndex = '';
                island.style.opacity = '';
                island.style.filter = '';
                island.style.transition = '';
            }
        }

        if (isSpecial) {
            wallLayer.style.transition = 'background-position 1s cubic-bezier(0.2, 0.85, 0.1, 1), transform 1s cubic-bezier(0.2, 0.85, 0.1, 1)';
            wallLayer.style.transformOrigin = 'top center';

            if (powerLayer) powerLayer.style.background = 'transparent';
            if (aodBg) aodBg.style.display = 'none';
            const lockLayer = document.getElementById('lock-wallpaper-layer');
            if (lockLayer) lockLayer.style.opacity = '0';

            if (!State.poweredOn && State.aod.enabled) {
                wallLayer.style.backgroundPosition = 'top center';
                wallLayer.style.transform = 'scale(1.1)';
            } else if (State.locked) {
                wallLayer.style.backgroundPosition = 'top center';
                wallLayer.style.transform = 'scale(1.2)';
            } else {
                wallLayer.style.backgroundPosition = 'center center';
                wallLayer.style.transform = '';
                setTimeout(() => {
                    if (!State.locked && !isVideoWallpaper(currentUrl)) {
                        wallLayer.style.transition = '';
                    }
                }, 1000);
            }


        } else {
            wallLayer.style.transition = '';
            wallLayer.style.backgroundPosition = '';
            wallLayer.style.transform = '';
            wallLayer.style.transformOrigin = '';
            if (powerLayer) powerLayer.style.background = '';
            if (aodBg) aodBg.style.display = '';
            const lockLayer = document.getElementById('lock-wallpaper-layer');
            if (lockLayer) lockLayer.style.opacity = '';
        }

        const isVideoUrl = isVideoWallpaper(currentUrl);
        const isVideoSpecial = isVideoUrl && State.specialEffects;
        const videoEl = VideoWallpaper.videoEl;

        if (isVideoUrl) {
            if (!videoEl) VideoWallpaper.load(currentUrl);
            else if (VideoWallpaper.currentSrc !== currentUrl) VideoWallpaper.load(currentUrl);
            VideoWallpaper.show();
            wallLayer.style.backgroundImage = 'none';

            if (VideoWallpaper.videoEl) {
                const v = VideoWallpaper.videoEl;
                v.style.transition = 'transform 1s cubic-bezier(0.2, 0.85, 0.1, 1)';
                v.style.transformOrigin = 'top center';

                if (isVideoSpecial) {
                    if (!State.poweredOn && State.aod.enabled) {
                        v.style.transform = 'scale(1.1)';
                    } else if (State.locked) {
                        v.style.transform = 'scale(1.2)';
                    } else {
                        v.style.transform = '';
                    }
                } else {
                    v.style.transform = '';
                }
            }



        } else {
            VideoWallpaper.hide();
            wallLayer.style.backgroundImage = '';
        }

        const shouldHideAodOverlay = (State.aod.enabled && State.aod.wallpaper && (isSpecial || isVideoSpecial)) || (isVideoUrl && State.aod.wallpaper);

        if (shouldHideAodOverlay) {
            if (powerLayer) powerLayer.style.background = 'rgba(0, 0, 0, 0.55)';
            if (aodBg) aodBg.style.display = 'none';
        } else {
            if (powerLayer) powerLayer.style.background = '';
            if (aodBg) aodBg.style.display = '';
        }
    },
    init: async () => {
        resize();
        Storage.loadSettings();
        await Storage.init();
        await Music.loadFromDB();
        if (OS.loaded) return;
        OS.loaded = true;
        OS.renderApps();
        OS.setupHomeEdit();
        IconDrag.init();
        OS.updateTime();
        OS.applySettings();
        if (State.liteMode) document.body.classList.add('lite-mode');
        setInterval(OS.updateTime, 1000);
        const updateBattery = (level) => {
            const pct = Math.round(level * 100);
            const fill = document.getElementById('battery-fill');
            const text = document.getElementById('battery-text');
            if (fill) {
                fill.style.width = pct + '%';
                if (pct <= 20) fill.classList.add('low');
                else fill.classList.remove('low');
            }
            if (text) text.innerText = pct;
        };
        if (navigator.getBattery) {
            navigator.getBattery().then(bat => {
                updateBattery(bat.level);
                bat.addEventListener('levelchange', () => updateBattery(bat.level));
            });
        } else {
            updateBattery(1);
        }
        OS.setupGestures();
        ControlCenter.init();
        Island.renderIdle();
        Setup.check();
        document.body.addEventListener('click', (e) => {
            if (State.tapIndicators && State.poweredOn) OS.createRipple(e);
        });

        window.addEventListener('mouseup', () => Music.endScrub());
        window.addEventListener('touchend', () => Music.endScrub());
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') AppManager.close();
            if (e.code === 'KeyQ' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                OS.togglePower();
            }
        });
        const wallInput = document.getElementById('wall-input');
        if (wallInput) {
            wallInput.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const processWallpaper = (dataUrl) => {
                    State.wallpapers.push(dataUrl);
                    const newIndex = State.wallpapers.length - 1;
                    if (Apps.settings && Apps.settings.view === 'wallpaper') Apps.settings.render('wallpaper');
                    if (Apps.settings && Apps.settings.applyWall) {
                        Apps.settings.applyWall(newIndex);
                    } else {
                        State.currentWall = newIndex;
                        OS.applySettings();
                    }
                };

                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            let width = img.width;
                            let height = img.height;

                            const MAX_WIDTH = 1080;
                            const MAX_HEIGHT = 1920;

                            if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                                const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
                                width = Math.round(width * ratio);
                                height = Math.round(height * ratio);
                            }

                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);

                            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                            processWallpaper(compressedDataUrl);
                        };
                        img.src = evt.target.result;
                    };
                    reader.readAsDataURL(file);
                } else {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        processWallpaper(evt.target.result);
                    };
                    reader.readAsDataURL(file);
                }
                e.target.value = '';
            };
        }
        LockScreen.init();
    },
    togglePower: (isUnlocking = false) => {
        if (document.getElementById('setup-screen').classList.contains('active')) return;
        if (State.poweredOn && Island.expanded) {
            Island.collapse();
            setTimeout(OS.togglePower, 50);
            return;
        }
        State.poweredOn = !State.poweredOn;
        const layer = document.getElementById('power-layer');
        const gClock = document.getElementById('global-clock');
        const aodTxt = document.getElementById('aod-user-text');
        if (!State.poweredOn) {
            ControlCenter.forceClose();
            document.querySelectorAll('.app-window-closing-clone').forEach(clone => clone.remove());
            if (AppManager.closingApps) {
                Object.keys(AppManager.closingApps).forEach(appId => {
                    clearTimeout(AppManager.closingApps[appId].closeTimeout);
                    clearTimeout(AppManager.closingApps[appId].iconFadeTimeout);
                    const icon = document.getElementById(`icon-${appId}`);
                    if (icon) {
                        icon.classList.remove('app-current');
                        const box = icon.querySelector('.icon-box') || icon;
                        box.style.opacity = '1';
                        box.style.visibility = 'visible';
                    }
                });
                AppManager.closingApps = {};
            }
            document.body.classList.remove('closing-active');
            if (State.activeApp) AppManager.close();
            const settingsOverlay = document.getElementById('settings-section-overlay');
            if (settingsOverlay) settingsOverlay.remove();
            const settingsSubOverlay = document.getElementById('settings-sub-overlay');
            if (settingsSubOverlay) settingsSubOverlay.remove();
            const settingsMainVeilPw = document.getElementById('settings-main-dim-veil');
            if (settingsMainVeilPw) settingsMainVeilPw.remove();
            const appBody = document.getElementById('app-body');
            if (appBody) {
                const settingsFade = appBody.querySelector('.anim-fade');
                if (settingsFade) { settingsFade.style.transform = ''; settingsFade.style.transition = ''; }
                appBody.style.transform = ''; appBody.style.filter = ''; appBody.style.transition = '';
            }
            const appHeaderEl = document.getElementById('app-header');
            if (appHeaderEl) {
                appHeaderEl.classList.remove('settings-header-dim', 'settings-header-dim-visible');
                appHeaderEl.style.transform = ''; appHeaderEl.style.filter = ''; appHeaderEl.style.transition = ''; appHeaderEl.style.position = ''; appHeaderEl.style.top = ''; appHeaderEl.style.left = ''; appHeaderEl.style.right = ''; appHeaderEl.style.zIndex = '';
            }
            const screenClose = document.getElementById('screen');
            if (screenClose) screenClose.classList.remove('settings-subpage-dim');
            if (Apps.settings && Apps.settings.view) Apps.settings.view = 'root';

            const wallLayer = document.getElementById('wallpaper-layer');
            if (wallLayer && State.homescreenBlur) {
                wallLayer.style.transition = 'filter 0.4s ease-out';
                wallLayer.style.filter = 'blur(0px)';
            }

            layer.classList.add('off');
            document.body.classList.add('button-fade');
            const homeContents = document.getElementById('home-contents');
            if (homeContents) {
                homeContents.style.transition = 'opacity 0.15s ease';
                homeContents.style.opacity = '0';
            }
            LockScreen.lock();
            if (State.lsCustomizing) LockScreen.exitCustomization();
            document.body.classList.remove('ls-blurred');
            gClock.classList.remove('hidden');
            const sbClock = document.getElementById('clock');
            if (sbClock) { sbClock.style.transition = 'opacity 0.15s ease'; sbClock.style.opacity = '0'; }
            OS.updateTime();

            if (typeof Island !== 'undefined') {
                Island.isMorphing = false;
                Island.expanded = null;
                Island.update();
            }

            if (State.aod.enabled) {
                layer.classList.add('aod-active');
                gClock.classList.add('aod-mode');
                const cf = ((State.clockConfig || {}).style === 'stretched') ? 'default' : ((State.clockConfig || {}).font || 'default');
                let cfFam = "'Inter', sans-serif";
                if (cf === 'serif') cfFam = "'Times New Roman', serif";
                else if (cf === 'science') cfFam = "'Rajdhani', sans-serif";
                else if (cf === 'mono') cfFam = "'Monoton', cursive";
                else if (cf === 'lux') cfFam = "'Luxurious Roman', serif";
                gClock.style.fontFamily = cfFam;
                aodTxt.innerText = State.aod.text || "";
                if (State.aod.wallpaper) {
                    const wallUrl = State.wallpapers[State.currentWall] || '';
                    const specialUrls = ['https://i.ibb.co/9HGWgS4w/wallpaper3.jpg', 'https://i.ibb.co/FMtRmsm/wallpaper4.png', 'https://i.ibb.co/ymJxLsYz/wallpaper5.png', 'https://i.ibb.co/43v4xw9/wallpaper6.png'];
                    const isSpecial = State.specialEffects && (isVideoWallpaper(wallUrl) || specialUrls.includes(wallUrl));
                    if (isSpecial) {
                        layer.classList.remove('aod-wall-on');
                        layer.classList.add('aod-special-wall');
                    } else {
                        layer.classList.add('aod-wall-on');
                        layer.classList.remove('aod-special-wall');
                    }
                }
                else {
                    layer.classList.remove('aod-wall-on');
                    layer.classList.remove('aod-special-wall');
                }

                if (!State.aod.wallpaper) {
                    gClock.style.setProperty('--clock-op', '1');
                }

            } else {
                layer.classList.remove('aod-active');
                gClock.classList.add('hidden');
            }
            const currentUrl = State.wallpapers[State.currentWall];
            if (Music && typeof Music.collapse === 'function') Music.collapse();
            if (State.specialEffects) {
                OS.updateWallpaperEffect();
            }
            if (isVideoWallpaper(currentUrl)) {
                VideoWallpaper.reverseToStart();
            }
        } else {
            layer.classList.remove('off');
            layer.classList.remove('aod-active');
            layer.classList.remove('aod-wall-on');
            layer.classList.remove('aod-special-wall');
            document.body.classList.remove('button-fade');
            if (!isUnlocking) gClock.classList.remove('aod-mode');
            gClock.classList.remove('hidden');
            gClock.style.fontFamily = 'inherit';
            const ccRestore = State.clockConfig || {};
            const bOpRestore = ccRestore.boldOpacity !== undefined ? ccRestore.boldOpacity : 0.72;
            gClock.style.setProperty('--clock-op', bOpRestore);
            OS._timeCache.configStr = null;
            const homeContents = document.getElementById('home-contents');
            if (homeContents && !State.locked) {
                homeContents.style.transition = '';
                homeContents.style.opacity = '';
            }
            OS.applySettings();
            OS.updateWallpaperEffect();
            const currentUrl = State.wallpapers[State.currentWall];
            if (isVideoWallpaper(currentUrl)) {
                VideoWallpaper.playForward();
            }
        }
    },
    showPopup: (title, msg, onYes, onNo, okText = 'OK') => {
        document.getElementById('osm-title').innerText = title;
        document.getElementById('osm-msg').innerHTML = msg;
        const footer = document.getElementById('osm-footer');
        footer.innerHTML = '';
        if (onYes) {
            const yes = document.createElement('div');
            yes.className = 'osm-btn primary';
            yes.innerText = 'Yes';
            yes.onclick = () => { onYes(); OS.hidePopup(); };
            const no = document.createElement('div');
            no.className = 'osm-btn secondary';
            no.innerText = 'No';
            no.onclick = () => { if (onNo) onNo(); OS.hidePopup(); };
            footer.appendChild(no);
            footer.appendChild(yes);
        } else {
            const ok = document.createElement('div');
            ok.className = 'osm-btn ' + (okText === 'Cancel' ? 'secondary' : 'primary');
            ok.innerText = okText;
            ok.onclick = OS.hidePopup;
            footer.appendChild(ok);
        }
        document.getElementById('modal-overlay').classList.add('active');
        if (!State.liteMode) {
            const box = document.querySelector('.os-modal');
            if (box) {
                box.classList.add('motion-in');
                setTimeout(() => box.classList.remove('motion-in'), 250);
            }
        }
    },
    hidePopup: () => {
        document.getElementById('modal-overlay').classList.remove('active');
    },
    createRipple: (e) => {
        const ripple = document.createElement('div');
        ripple.className = 'touch-ripple';
        ripple.style.left = e.clientX - 10 + 'px';
        ripple.style.top = e.clientY - 10 + 'px';
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 400);
    },
    renderApps: () => {
        const grid = document.getElementById('app-grid');
        const dock = document.getElementById('dock');
        grid.innerHTML = ''; dock.innerHTML = '';
        const isHyper = State.iconPack === 'hyperos';
        const isColor = State.iconPack === 'coloros';
        const isImagePack = isHyper || isColor;
        let gridIdx = 0;
        const occupiedCells = {};
        const gridAppsData = [];
        APPS.forEach((app, idx) => {
            if (app.hidden || app.area !== 'grid') return;
            if (State.iconPositions && State.iconPositions[app.id]) {
                const pos = State.iconPositions[app.id];
                occupiedCells[`${pos.row},${pos.col}`] = true;
            }
        });
        if (State.emptyApps) {
            State.emptyApps.forEach(ea => {
                if (State.iconPositions && State.iconPositions[ea.id]) {
                    const pos = State.iconPositions[ea.id];
                    occupiedCells[`${pos.row},${pos.col}`] = true;
                }
            });
        }
        APPS.forEach((app, idx) => {
            if (app.hidden) return;
            const el = document.createElement('div');
            el.className = 'app-icon';
            el.id = `icon-${app.id}`;
            el.onclick = () => AppManager.open(app.id);
            if (app.area === 'grid') {
                if (State.iconPositions && State.iconPositions[app.id]) {
                    const pos = State.iconPositions[app.id];
                    el.style.gridRow = pos.row + 1;
                    el.style.gridColumn = pos.col + 1;
                } else {
                    let r = Math.floor(gridIdx / 4);
                    let c = gridIdx % 4;
                    while (occupiedCells[`${r},${c}`]) {
                        gridIdx++;
                        r = Math.floor(gridIdx / 4);
                        c = gridIdx % 4;
                    }
                    el.style.gridRow = r + 1;
                    el.style.gridColumn = c + 1;
                    if (!State.iconPositions) State.iconPositions = {};
                    State.iconPositions[app.id] = { row: r, col: c };
                    occupiedCells[`${r},${c}`] = true;
                    gridIdx++;
                }
            }
            let iconContent, bg;
            const packIcon = isHyper ? app.hyperIcon : (isColor ? app.colorIcon : null);
            if (isImagePack && packIcon) {
                iconContent = `<img src="${packIcon}" class="app-img-icon" alt="${app.name}">`;
                bg = 'transparent';
            } else {
                bg = app.color;
                if (app.id === 'photos') {
                    iconContent = `<div class="photos-icon-flower">
                        <div class="petal-wrap p1"><div class="petal"></div></div>
                        <div class="petal-wrap p2"><div class="petal"></div></div>
                        <div class="petal-wrap p3"><div class="petal"></div></div>
                        <div class="petal-wrap p4"><div class="petal"></div></div>
                        <div class="petal-wrap p5"><div class="petal"></div></div>
                        <div class="petal-wrap p6"><div class="petal"></div></div>
                        <div class="petal-wrap p7"><div class="petal"></div></div>
                        <div class="petal-wrap p8"><div class="petal"></div></div>
                    </div>`;
                } else if (app.id === 'settings') {
                    iconContent = `<div class="settings-icon-gear" style="transform: scale(1.15);">
                        <div class="gear-base"></div>
                        <div class="gear-teeth">
                            <div class="tooth"></div><div class="tooth"></div><div class="tooth"></div>
                            <div class="tooth"></div><div class="tooth"></div><div class="tooth"></div>
                        </div>
                        <div class="gear-inner-ring"></div>
                        <div class="gear-spoke spoke-1"></div><div class="gear-spoke spoke-2"></div><div class="gear-spoke spoke-3"></div>
                        <div class="gear-center-dot"></div>
                    </div>`;
                } else if (app.id === 'camera') {
                    bg = 'linear-gradient(135deg, #fbfbfb 0%, #e8e8e8 50%, #d1d1d1 100%)';
                    iconContent = `<div class="camera-icon-lens" style="transform: scale(1.39);">
                        <div class="camera-base"></div>
                        <div class="lens-outer-ring"></div>
                        <div class="lens-inner-black"></div>
                        <div class="lens-core-glass"></div>
                        <div class="lens-glare-1"></div>
                        <div class="lens-glare-2"></div>
                        <div class="flash-ring"><div class="flash-bulb"></div></div>
                    </div>`;
                } else if (app.id === 'music') {
                    bg = '#fa2d48';
                    iconContent = `<div class="music-icon-note" style="transform: scale(1.0);">
                        <div class="music-note">&#9834;</div>
                        <div class="music-sparkles">
                            <div class="sparkle sparkle-lg" style="top:22%; right:2%;"></div>
                            <div class="sparkle sparkle-sm sparkle-green" style="top:55%; left:5%;"></div>
                            <div class="sparkle sparkle-xs sparkle-yellow" style="bottom:15%; left:22%;"></div>
                            <div class="sparkle sparkle-xs sparkle-orange" style="top:12%; right:22%;"></div>
                        </div>
                    </div>`;
                } else if (app.id === 'clock') {
                    bg = '#fff';
                    const now = new Date();
                    const hDeg = (now.getHours() % 12) * 30 + now.getMinutes() * 0.5 + now.getSeconds() * (0.5 / 60);
                    const mDeg = now.getMinutes() * 6 + now.getSeconds() * 0.1;
                    iconContent = `<div class="clock-icon-face">
                        <div class="clock-dial"></div>
                        <div class="clock-hand clock-hour" style="transform: rotate(${hDeg}deg);"></div>
                        <div class="clock-hand clock-minute" style="transform: rotate(${mDeg}deg);"></div>
                        <div class="clock-center-dot"></div>
                    </div>`;
                } else {
                    const lowBg = (bg || "").toLowerCase().trim();
                    const isWhiteBg = app.id === 'photos' || lowBg === '#fff' || lowBg.startsWith('#ffffff') || lowBg === 'white' || lowBg.replace(/\s/g, '') === 'rgb(255,255,255)';
                    const shadeColor = isWhiteBg ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)';
                    const shadeHtml = `<div style="position:absolute; inset:0; background: radial-gradient(circle at top right, ${shadeColor} 0%, transparent 70%); pointer-events:none; border-radius:inherit; z-index:10;"></div>`;
                    iconContent = `${shadeHtml}<i class="fas ${app.icon}"></i>`;
                }
            }
            el.innerHTML = `
                <div class="icon-box" style="overflow:hidden; background:${bg}; color:${app.text || 'white'}; ${app.border ? 'border:1px solid #333' : ''}">
                    ${iconContent}
                </div>
                <div class="icon-label">${app.name}</div>
            `;
            (app.area === 'dock' ? dock : grid).appendChild(el);
        });
        if (State.emptyApps) {
            State.emptyApps.forEach(ea => {
                const el = document.createElement('div');
                el.className = 'app-icon';
                el.id = `icon-${ea.id}`;
                el.onclick = () => AppManager.open(ea.id);
                if (State.iconPositions && State.iconPositions[ea.id]) {
                    const pos = State.iconPositions[ea.id];
                    el.style.gridRow = pos.row + 1;
                    el.style.gridColumn = pos.col + 1;
                } else {
                    let r = Math.floor(gridIdx / 4);
                    let c = gridIdx % 4;
                    while (occupiedCells[`${r},${c}`]) {
                        gridIdx++;
                        r = Math.floor(gridIdx / 4);
                        c = gridIdx % 4;
                    }
                    el.style.gridRow = r + 1;
                    el.style.gridColumn = c + 1;
                    if (!State.iconPositions) State.iconPositions = {};
                    State.iconPositions[ea.id] = { row: r, col: c };
                    occupiedCells[`${r},${c}`] = true;
                    gridIdx++;
                }
                el.innerHTML = `
                    <div class="icon-box" style="overflow:hidden; background:#888; color:white;">
                    </div>
                    <div class="icon-label">None</div>
                `;
                grid.appendChild(el);
            });
        }
    },
    setupHomeEdit: () => {
        let longPressTimer = null;
        const homeContents = document.getElementById('home-contents');
        const grid = document.getElementById('app-grid');
        if (!grid || !homeContents) return;
        grid.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.app-icon') || document.body.classList.contains('home-edit-mode')) return;
            longPressTimer = setTimeout(() => {
                OS.enterEditMode();
            }, 600);
        });
        grid.addEventListener('pointerup', () => clearTimeout(longPressTimer));
        grid.addEventListener('pointermove', () => clearTimeout(longPressTimer));
        grid.addEventListener('pointercancel', () => clearTimeout(longPressTimer));
    },
    enterEditMode: () => {
        if (document.body.classList.contains('home-edit-mode')) return;
        document.body.classList.add('home-edit-mode');
        const homeContents = document.getElementById('home-contents');
        document.querySelectorAll('.app-window-closing-clone').forEach(clone => {
            const appId = clone.dataset.appId;
            if (appId && AppManager.closingApps && AppManager.closingApps[appId]) {
                clearTimeout(AppManager.closingApps[appId].closeTimeout);
                clearTimeout(AppManager.closingApps[appId].iconFadeTimeout);
                const icon = document.getElementById(`icon-${appId}`);
                if (icon) {
                    icon.classList.remove('app-current');
                    const box = icon.querySelector('.icon-box') || icon;
                    box.style.transition = 'none';
                    box.style.opacity = '1';
                    box.style.visibility = 'visible';
                }
                delete AppManager.closingApps[appId];
            }
            if (clone._syncZoomState) { clone._syncZoomState.active = false; }
            clone.remove();
        });
        if (Object.keys(AppManager.closingApps || {}).length === 0) {
            document.body.classList.remove('closing-active');
        }
        let addBtn = document.getElementById('home-add-btn');
        if (!addBtn) {
            addBtn = document.createElement('div');
            addBtn.id = 'home-add-btn';
            addBtn.innerHTML = '<i class="fas fa-plus"></i>';
            addBtn.onclick = (e) => {
                e.stopPropagation();
                OS.addEmptyApp();
            };
            homeContents.parentElement.appendChild(addBtn);
        }
        addBtn.style.display = 'flex';
        let trashBtn = document.getElementById('home-trash-btn');
        if (!trashBtn) {
            trashBtn = document.createElement('div');
            trashBtn.id = 'home-trash-btn';
            trashBtn.innerHTML = '<i class="fas fa-trash"></i>';
            homeContents.parentElement.appendChild(trashBtn);
        }
        const screen = document.getElementById('screen');
        const exitHandler = (e) => {
            if (e.target.closest('#home-add-btn') || e.target.closest('.app-icon')) return;
            OS.exitEditMode();
            screen.removeEventListener('click', exitHandler, true);
        };
        setTimeout(() => screen.addEventListener('click', exitHandler, true), 300);
    },
    exitEditMode: () => {
        document.body.classList.remove('home-edit-mode');
        const addBtn = document.getElementById('home-add-btn');
        if (addBtn) addBtn.style.display = 'none';
    },
    addEmptyApp: () => {
        State.emptyApps = State.emptyApps || [];
        const maxIcons = 6 * 4;
        const gridEls = Array.from(document.getElementById('app-grid').children)
            .filter(el => el.classList.contains('app-icon') && el.id !== 'home-add-btn');
        if (State.emptyApps.length >= 16 || gridEls.length >= maxIcons) {
            return;
        }
        const id = 'empty_' + Date.now();
        State.emptyApps.push({ id, name: 'None' });
        Storage.saveSettings();
        OS.renderApps();
        OS.enterEditMode();
    },
    _timeCache: { time: '', date: '', els: null },
    _getTimeEls: () => {
        if (!OS._timeCache.els) {
            OS._timeCache.els = {
                clock: document.getElementById('clock'),
                globalTime: document.getElementById('global-time'),
                gClock: document.getElementById('global-clock'),
                gcDate: document.getElementById('gc-date'),
                lsDate: document.getElementById('ls-date'),
                aodDate: document.getElementById('aod-date'),
            };
        }
        return OS._timeCache.els;
    },
    updateTime: () => {
        const d = new Date();
        const hours = d.getHours();
        let hours12 = hours % 12;
        if (hours12 === 0) hours12 = 12;
        const hoursPadded = hours12 < 10 ? '0' + hours12 : hours12;
        const minutes = d.getMinutes();
        const minutesPadded = minutes < 10 ? '0' + minutes : minutes;
        const time = hours12 + ':' + minutesPadded;
        const timeKey = hoursPadded + ':' + minutesPadded;

        const els = OS._getTimeEls();
        const cc = State.clockConfig || {};
        const cf = cc.font || 'default';

        const configStr = JSON.stringify(cc);

        if (timeKey !== OS._timeCache.time || configStr !== OS._timeCache.configStr) {
            OS._timeCache.time = timeKey;
            OS._timeCache.configStr = configStr;
            els.clock.innerHTML = `<span class="c-hour">${hours12}</span>:<span class="c-min">${minutesPadded}</span>`;

            const fontClasses = ['font-default', 'font-serif', 'font-science', 'font-mono', 'font-lux'];
            els.globalTime.classList.remove(...fontClasses);
            els.globalTime.classList.add(`font-${cf}`);

            if (els.gClock) {
                if (cc.style === 'stretched' || cc.style === 'tilt') {
                    cc.style = 'default';
                    if (typeof Storage !== 'undefined' && Storage.saveSettings) Storage.saveSettings();
                }
                els.gClock.dataset.clockStyle = cc.style || 'default';
                if (cc.align && cc.align !== 'top') {
                    els.gClock.dataset.align = cc.align;
                } else {
                    els.gClock.removeAttribute('data-align');
                }
            }

            const fw = cc.fontWeight || 600;
            const bOp = cc.boldOpacity !== undefined ? cc.boldOpacity : 0.72;
            els.gClock.style.setProperty('--clock-hc', cc.hourColor || '#ffffff');
            els.gClock.style.setProperty('--clock-mc', cc.minuteColor || '#ffffff');
            els.gClock.style.setProperty('--clock-op', bOp);
            els.gClock.style.setProperty('--clock-fw', fw);

            els.globalTime.innerHTML = `<span class="gc-hour">${hoursPadded}</span><span class="gc-colon">:</span><span class="gc-minute">${minutesPadded}</span>`;
            els.globalTime.classList.remove('bold-clock', 'stretched-clock', 'tilt-clock');

            if (cc.statusBarColor) {
                els.gClock.classList.add('sb-custom-color');
                const cHour = els.clock.querySelector('.c-hour');
                const cMin = els.clock.querySelector('.c-min');
                if (cHour) cHour.style.color = cc.hourColor || '#ffffff';
                if (cMin) cMin.style.color = cc.minuteColor || '#ffffff';
                els.clock.style.color = 'inherit';
            } else {
                els.gClock.classList.remove('sb-custom-color');
                const cHour = els.clock.querySelector('.c-hour');
                const cMin = els.clock.querySelector('.c-min');
                if (cHour) cHour.style.color = 'inherit';
                if (cMin) cMin.style.color = 'inherit';
                els.clock.style.color = '';
            }

            if (State.islandMode === 'clock') {
                const iText = document.getElementById('di-idle-text');
                if (iText) iText.innerText = time;
            }

            const lsPreviewTimeEl = document.getElementById('ls-preview-time');
            if (lsPreviewTimeEl) {
                const fontClasses2 = ['font-default', 'font-serif', 'font-science', 'font-mono', 'font-lux'];
                lsPreviewTimeEl.classList.remove(...fontClasses2);
                lsPreviewTimeEl.classList.add(`font-${cf}`);
                if (cc.style === 'stretched') {
                    lsPreviewTimeEl.textContent = hoursPadded + ':' + minutesPadded;
                } else {
                    lsPreviewTimeEl.innerHTML = `<span style="color:${cc.hourColor || '#fff'};opacity:${bOp}">${hoursPadded}</span><span style="opacity:${bOp}">:</span><span style="color:${cc.minuteColor || '#fff'};opacity:${bOp}">${minutesPadded}</span>`;
                }
            }
        }

        const opts = { weekday: 'long', month: 'short', day: 'numeric' };
        const dateStr = d.toLocaleDateString('en-US', opts);
        if (dateStr !== OS._timeCache.date) {
            OS._timeCache.date = dateStr;
            els.lsDate.innerText = dateStr;
            els.gcDate.innerText = dateStr;
            if (els.aodDate) els.aodDate.innerText = dateStr;
            const lsPreviewDateEl = document.getElementById('ls-preview-date');
            if (lsPreviewDateEl) lsPreviewDateEl.innerText = dateStr;
        }
    },
    updateStatusBarColors: (isOpen, isDarkApp, immediate = false) => {
        const sb = document.querySelector('.status-bar');
        const hb = document.querySelector('.home-bar');
        const dur = immediate ? '0s' : `${0.5 * State.animationSpeed * 0.7}s`;

        if (sb) {
            sb.style.transition = `color ${dur} ease`;
            sb.style.color = '';
            const sbIcons = sb.querySelectorAll('.fas, .fab');
            sbIcons.forEach(i => {
                i.style.transition = `color ${dur} ease`;
                i.style.color = '';
            });
            if (isOpen && !isDarkApp && !State.darkMode) {
                sb.classList.add('sb-app-overlay');
            } else {
                sb.classList.remove('sb-app-overlay');
            }
        }
        if (hb) {
            const targetBgColor = isOpen ? (isDarkApp ? '#fff' : '#000') : '#fff';
            let existingTransitions = [];
            if (hb.style.transition) {
                existingTransitions = hb.style.transition.split(',').map(s => s.trim()).filter(s => s && !s.startsWith('background-color') && !s.startsWith('background '));
            }
            existingTransitions.push(`background-color ${dur} ease`);
            hb.style.transition = existingTransitions.join(', ');
            hb.style.backgroundColor = targetBgColor;
        }
    },
    setupGestures: () => {
        const bar = document.querySelector('.home-bar');
        const gestureArea = document.getElementById('gesture-area');
        if (gestureArea) {
            gestureArea.style.zIndex = '100000';
            gestureArea.style.position = 'absolute';
        }
        const handleClose = () => {
            if (!State.swipeToClose) AppManager.close();
        };
        const newBar = bar.cloneNode(true);
        bar.parentNode.replaceChild(newBar, bar);
        newBar.style.setProperty('cursor', 'grab', 'important');
        if (!State.swipeToClose) {
            newBar.classList.add('no-animation');
        } else {
            newBar.classList.remove('no-animation');
        }
        Array.from(newBar.children).forEach(c => c.style.pointerEvents = 'none');
        let startY = 0;
        let startX = 0;
        let isSwipe = false;
        const onStart = (x, y) => {
            startY = y;
            startX = x;
            isSwipe = false;
            newBar.style.transition = 'transform 0.1s ease';
            newBar.style.transform = 'scale(0.9)';
            newBar.style.setProperty('cursor', 'grabbing', 'important');
            document.body.style.cursor = 'grabbing';
            if (State.swipeToClose && State.activeApp && State.activeApp !== 'home') {
                const win = document.getElementById('app-window');
                if (win) {
                    win.style.transition = 'none';
                }
            }
            setTimeout(() => newBar.style.transition = 'none', 50);
        };
        const onMove = (x, y) => {
            if (!startY) return;
            const diff = y - startY;
            if (diff < 0) {
                isSwipe = true;
                const visualDiff = Math.max(diff, -20);
                const atMax = diff <= -20;
                newBar.style.transform = `translateY(${visualDiff}px) scale(0.9)`;
                if (State.swipeToClose && State.activeApp && State.activeApp !== 'home') {
                    const win = document.getElementById('app-window');
                    if (win) {
                        const scale = Math.max(0.96, 1 + (diff / 2000));
                        const winDiff = atMax ? visualDiff - 2 : visualDiff;
                        let hDiff = 0;
                        if (atMax) {
                            hDiff = Math.max(-50, Math.min(50, x - startX));
                        }
                        win.style.transform = `translate(${hDiff}px, ${winDiff}px) scale(${scale})`;
                        win.style.borderRadius = '60px';
                    }
                }
            }
        };
        const onEnd = (y) => {
            newBar.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.85, 0.1, 1)';
            newBar.style.transform = 'translateY(0px) scale(1)';
            newBar.style.setProperty('cursor', 'grab', 'important');
            document.body.style.cursor = '';
            if (State.swipeToClose) {
                if (startY && (y - startY < -5)) {
                    requestAnimationFrame(() => AppManager.close());
                } else {
                    if (State.activeApp && State.activeApp !== 'home') {
                        const win = document.getElementById('app-window');
                        if (win) {
                            win.style.transition = 'all 0.3s cubic-bezier(0.2, 0.85, 0.1, 1)';
                            win.style.transform = '';
                            win.style.borderRadius = '';
                        }
                    }
                }
            } else {
                if (!isSwipe && Math.abs(y - startY) < 3) {
                }
            }
            startY = 0;
            startX = 0;
        };
        newBar.addEventListener('touchstart', e => onStart(e.touches[0].clientX, e.touches[0].clientY), { passive: false });
        newBar.addEventListener('touchmove', e => onMove(e.touches[0].clientX, e.touches[0].clientY), { passive: false });
        newBar.addEventListener('touchend', e => onEnd(e.changedTouches[0].clientY));
        if (gestureArea) {
            gestureArea.addEventListener('touchstart', e => onStart(e.touches[0].clientX, e.touches[0].clientY), { passive: false });
            gestureArea.addEventListener('touchmove', e => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
            gestureArea.addEventListener('touchend', e => onEnd(e.changedTouches[0].clientY));
        }
        const mouseMoveHandler = (e) => {
            if (startY) onMove(e.clientX, e.clientY);
        };
        const mouseUpHandler = (e) => {
            if (startY) {
                onEnd(e.clientY);
                document.removeEventListener('mousemove', mouseMoveHandler);
                document.removeEventListener('mouseup', mouseUpHandler);
            }
        };
        newBar.addEventListener('mousedown', e => {
            onStart(e.clientX, e.clientY);
            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
        });
        if (gestureArea) {
            gestureArea.addEventListener('mousedown', e => {
                onStart(e.clientX, e.clientY);
                document.addEventListener('mousemove', mouseMoveHandler);
                document.addEventListener('mouseup', mouseUpHandler);
            });
        }
        document.getElementById('device').addEventListener('click', (e) => {
            if (!e.target.closest('#island-wrap') && !e.target.closest('.app-icon') && Island.expanded !== 'unlocked' && Island.expanded !== 'notify') {
                Island.collapse();
            }
        });
    },

    applySettings: () => {
        OS.updateWallpaperEffect();
        document.documentElement.style.setProperty('--accent', State.accentColor);
        const island = document.getElementById('dynamic-island');
        if (State.islandColor.includes('gradient') || State.islandColor === 'rainbow') {
            document.documentElement.style.setProperty('--island-bg', '#000');
        } else {
            document.documentElement.style.setProperty('--island-bg', State.islandColor);
        }
        const bar = document.querySelector('.home-bar');
        if (State.darkMode) {
            document.body.classList.add('dark-mode');
            bar.style.backgroundColor = '#fff';
        } else {
            document.body.classList.remove('dark-mode');
            bar.style.backgroundColor = '#000';
        }

        if (State.glassUI) document.body.classList.add('glass-ui');
        else document.body.classList.remove('glass-ui');
        const animDur = 0.5 * State.animationSpeed;
        document.documentElement.style.setProperty('--home-anim-dur', `${animDur}s`);

        const closeMorphDur = (0.45 * State.animationSpeed) * (State.animConfig.closeShapeMorph || 0.34);
        document.documentElement.style.setProperty('--blur-behind-open-dur', `${0.25 * State.animationSpeed}s`);
        document.documentElement.style.setProperty('--blur-behind-close-dur', `${closeMorphDur}s`);

        document.documentElement.style.setProperty('--dev-width', `${State.devWidth || 400}px`);
        document.documentElement.style.setProperty('--dev-height', `${State.devHeight || 860}px`);

        if (State.devWidth >= 600) document.body.classList.add('wide-mode');
        else document.body.classList.remove('wide-mode');

        document.documentElement.style.setProperty('--wall-blur-dur', (State.animConfig.wallBlurDur * State.animationSpeed) + 's');
        document.getElementById('brightness-layer').style.opacity = (100 - State.brightness) / 100;
        Island.renderIdle();
        const aodImg = document.getElementById('aod-img');
        if (State.aod.image) {
            aodImg.src = State.aod.image;
            aodImg.style.display = 'block';
        } else {
            aodImg.style.display = 'none';
        }
        const gClock = document.getElementById('global-clock');
        const cc = State.clockConfig || {};

        if (cc.style === 'stretched') document.body.classList.add('has-stretched-clock');
        else document.body.classList.remove('has-stretched-clock');
        document.documentElement.style.setProperty('--home-anim-dur', (0.5 * State.animationSpeed) + 's');
        const currentWallUrl = State.wallpapers[State.currentWall];
        if (isVideoWallpaper(currentWallUrl)) {
            VideoWallpaper.load(currentWallUrl);
            VideoWallpaper.show();
            VideoWallpaper.getThumbnail((url) => {
                document.documentElement.style.setProperty('--wall', `url('${url}')`);
            });
        } else {
            document.documentElement.style.setProperty('--wall', `url('${currentWallUrl}')`);
            VideoWallpaper.hide();
        }
        const lockWallUrl = State.wallpapers[State.lockWall] || currentWallUrl;
        const lockLayer = document.getElementById('lock-wallpaper-layer');
        const existingLockVid = lockLayer ? lockLayer.querySelector('video') : null;

        if (State.specialEffects && State.currentWall === State.lockWall) {
            document.body.classList.add('vid-special-effects');
        } else {
            document.body.classList.remove('vid-special-effects');
        }

        if (isVideoWallpaper(lockWallUrl)) {
            if (lockLayer) {
                lockLayer.style.backgroundImage = 'none';
                lockLayer.style.backgroundColor = 'transparent';
            }
            const rawSrc = existingLockVid ? existingLockVid.getAttribute('data-raw-src') : null;
            if (!existingLockVid || rawSrc !== lockWallUrl) {
                if (existingLockVid) existingLockVid.remove();
                const vid = document.createElement('video');
                vid.src = lockWallUrl;
                vid.setAttribute('data-raw-src', lockWallUrl);
                vid.muted = true;
                vid.playsInline = true;
                vid.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;';
                vid.addEventListener('loadedmetadata', () => {
                    if (!State.specialEffects) {
                        vid.currentTime = vid.duration || 9999;
                        vid.pause();
                    }
                });
                if (lockLayer) lockLayer.appendChild(vid);
            }
            VideoWallpaper.getThumbnail((thumbUrl) => {
                document.documentElement.style.setProperty('--wall-lock', `url('${thumbUrl}')`);
            });
        } else {
            if (existingLockVid) existingLockVid.remove();
            if (lockLayer) {
                lockLayer.style.backgroundImage = '';
                lockLayer.style.backgroundColor = '';
            }
            document.documentElement.style.setProperty('--wall-lock', `url('${lockWallUrl}')`);
        }
        if (State.locked && State.lsBlur) document.body.classList.add('ls-blurred');
        else document.body.classList.remove('ls-blurred');
        if (State.blurBehindApps) document.body.classList.add('blur-behind');
        else document.body.classList.remove('blur-behind');
        if (State.homescreenBlur) document.body.classList.add('hs-blur');
        else document.body.classList.remove('hs-blur');
        if (State.hideAppLabels) document.body.classList.add('hide-labels');
        else document.body.classList.remove('hide-labels');
        if (State.locked) document.body.classList.add('ls-active');
        else document.body.classList.remove('ls-active');
        LockScreen.updateUI();
        document.body.setAttribute('data-app-shape', State.appShape || 50);
        document.documentElement.style.setProperty('--app-radius', OS.getShapeRadius());
        document.documentElement.style.setProperty('--app-size-num', State.appSize || 64);
        document.documentElement.style.setProperty('--app-size', (State.appSize || 64) + 'px');
        if (typeof Island !== 'undefined') Island.update();
        if (State.navStyle === 'buttons') document.body.classList.add('nav-buttons-mode');
        else document.body.classList.remove('nav-buttons-mode');
        const fc = State.frameColor || 'black';
        const fcMap = {
            black: { a: '#1a1a1a', b: '#3a3a3c', c: '#48484a', d: '#3a3a3c', e: '#2c2c2e', f: '#1a1a1a' },
            grey: { a: '#6e6e73', b: '#8e8e93', c: '#aeaeb2', d: '#8e8e93', e: '#636366', f: '#48484a' },
            white: { a: '#c7c7cc', b: '#d1d1d6', c: '#e5e5ea', d: '#d1d1d6', e: '#c7c7cc', f: '#aeaeb2' },
            pink: { a: '#d4a0a7', b: '#e8b4bc', c: '#f2c6ce', d: '#e8b4bc', e: '#d4a0a7', f: '#c48e96' }
        };
        const fcC = fcMap[fc] || fcMap.black;
        const deviceEl = document.getElementById('device');
        if (deviceEl) deviceEl.style.boxShadow = `inset 0 4px 12px rgba(255,255,255,0.1), inset 0 -4px 12px rgba(0,0,0,0.5), 0 0 0 2px ${fcC.a}, 0 0 0 4px ${fcC.b}, 0 0 0 6px ${fcC.c}, 0 0 0 7px ${fcC.d}, 0 0 0 9px ${fcC.e}, 0 0 0 11px ${fcC.f}, 0 20px 60px rgba(0,0,0,0.5), 0 40px 100px rgba(0,0,0,0.3)`;
        const pwrBtn = document.getElementById('power-btn');
        const vUp = document.getElementById('vol-up');
        const vDn = document.getElementById('vol-down');
        const bClr = fc === 'black' ? '#ff3b30' : (fc === 'white' ? '#c7c7cc' : fc === 'pink' ? '#e8b4bc' : '#8e8e93');
        const vClr = fc === 'black' ? '#2c2c2e' : (fc === 'white' ? '#d1d1d6' : fc === 'pink' ? '#d4a0a7' : '#636366');
        if (pwrBtn) pwrBtn.style.background = bClr;
        if (vUp) vUp.style.background = vClr;
        if (vDn) vDn.style.background = vClr;
        Storage.saveSettings();
    }
};
