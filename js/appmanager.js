const AppManager = {
    origin: null,
    closingApps: {},
    currentZIndex: 100,
    open: (id) => {
        if (typeof IconDrag !== 'undefined' && IconDrag.lastDropTime && Date.now() - IconDrag.lastDropTime < 350) return;
        if (document.body.classList.contains('home-edit-mode') && typeof OS !== 'undefined' && OS.exitEditMode) {
            OS.exitEditMode();
        }
        if (ControlCenter.isOpen) ControlCenter.close();
        clearTimeout(AppManager._blurTimeout);
        if (State.blurBehindApps) {
            document.querySelectorAll('.app-window-closing-clone').forEach(clone => {
                const cloneAppId = clone.dataset.appId;
                if (cloneAppId && cloneAppId !== id && clone.animate) {
                    const currentFilter = window.getComputedStyle(clone).filter;
                    const startFilter = (currentFilter && currentFilter !== 'none') ? currentFilter : 'blur(0px) brightness(1)';

                    if (clone.getAnimations) {
                        clone.getAnimations().forEach(a => {
                            if (a.effect && a.effect.getKeyframes && a.effect.getKeyframes().some(k => k.filter)) {
                                a.cancel();
                            }
                        });
                    }

                    clone.animate([
                        { filter: startFilter },
                        { filter: `blur(25px) brightness(0.5)` }
                    ], {
                        duration: 250 * State.animationSpeed,
                        easing: 'ease-out',
                        fill: 'forwards'
                    });
                }
            });
        }
        AppManager.closingApps = AppManager.closingApps || {};
        const oldClosingInfo = AppManager.closingApps[id];
        if (oldClosingInfo && oldClosingInfo.clone) {
            clearTimeout(oldClosingInfo.closeTimeout);
            clearTimeout(oldClosingInfo.iconFadeTimeout);
            const closeClone = oldClosingInfo.clone;
            if (closeClone && closeClone.isConnected) {
                if (closeClone._syncZoomState) { closeClone._syncZoomState.active = false; }
                const computed = window.getComputedStyle(closeClone);
                const rect = closeClone.getBoundingClientRect();
                const screenRect = document.getElementById('screen').getBoundingClientRect();
                const scale = document.fullscreenElement ? 1 : document.getElementById('scale-wrapper').getBoundingClientRect().width / (State.devWidth || 400);
                const curTop = (rect.top - screenRect.top) / scale;
                const curLeft = (rect.left - screenRect.left) / scale;
                const curW = parseFloat(computed.width) || rect.width / scale;
                const curH = parseFloat(computed.height) || rect.height / scale;
                const curRadius = computed.borderRadius;
                const startOpacity = computed.opacity || '1';
                let startZoom = curW / document.getElementById('screen').offsetWidth;
                const cloneHeader = closeClone.querySelector('#app-header') || closeClone.querySelector('.app-header');
                const cloneBody = closeClone.querySelector('.app-content') || closeClone.querySelector('#app-body');
                const headerOp = cloneHeader ? window.getComputedStyle(cloneHeader).opacity : '1';
                const bodyOp = cloneBody ? window.getComputedStyle(cloneBody).opacity : '1';

                delete AppManager.closingApps[id];
                if (Object.keys(AppManager.closingApps).length === 0) {
                    document.body.classList.remove('closing-active');
                }
                document.body.classList.add('app-open');

                if (State.animConfig.openAppFade) {
                    document.body.classList.add('fade-app-boxes');
                }
                if (State.homescreenBlur) {
                    if (State.animConfig.openWallBlur === false) {
                        document.body.classList.remove('hs-blur');
                    } else {
                        document.body.classList.add('hs-blur');
                    }
                }

                const homeScreenEl = document.getElementById('home-screen');
                if (State.animStyle === 'new' && homeScreenEl) {
                    const cmpScale = window.getComputedStyle(homeScreenEl).transform;
                    let mScale = 1;
                    if (cmpScale && cmpScale !== 'none') {
                        const v = cmpScale.match(/matrix\((.+)\)/);
                        if (v) mScale = parseFloat(v[1].split(',')[0]);
                    }
                    if (homeScreenEl._zoomAnim) homeScreenEl._zoomAnim.cancel();
                    const targetScale = (State.animConfig.openAppZoomOut !== undefined) ? State.animConfig.openAppZoomOut : 0.95;
                    homeScreenEl._zoomAnim = homeScreenEl.animate([
                        { transform: `scale(${mScale})` },
                        { transform: `scale(${targetScale})` }
                    ], {
                        duration: 500,
                        easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
                        fill: 'forwards'
                    });
                }

                const win = document.getElementById('app-window');
                State.activeApp = id;
                State.isAnimating = true;
                const isDarkApp = ['camera'].includes(id) || State.darkMode;
                OS.updateStatusBarColors(true, isDarkApp);
                win.classList.remove('closing', 'closing-custom');
                win.style.display = 'flex';
                win.style.transition = 'none';
                win.style.transformOrigin = 'top left';
                win.style.willChange = 'transform, width, height, border-radius, opacity';
                const header = document.getElementById('app-header');
                const appBody = document.getElementById('app-body');
                const appInfo = APPS.find(a => a.id === id) || (State.emptyApps ? State.emptyApps.find(a => a.id === id) : null) || { colorColor: '#888', hyperColor: '#888', color: '#888', name: id };
                if (header) {
                    header.style.color = isDarkApp ? '#fff' : '#000';
                    document.getElementById('app-title').innerText = id === 'settings' ? '' : (appInfo.name || id);
                    header.classList.remove('calc-header');
                    header.style.background = '';
                    header.style.backdropFilter = '';
                    header.style.webkitBackdropFilter = '';
                    header.style.position = '';
                    header.style.top = '';
                    header.style.left = '';
                    header.style.right = '';
                    header.style.width = '';
                    header.style.zIndex = '';
                    header.style.pointerEvents = '';
                    header.style.display = 'flex';
                    header.style.visibility = 'visible';
                }
                win.classList.remove('calc-app-bg');
                const appBack = document.getElementById('app-back');
                if (appBack) {
                    appBack.style.display = 'none';
                    appBack.onclick = AppManager.close;
                }
                if (typeof Apps !== 'undefined' && Apps[id] && Apps[id].render) {
                    Apps[id].render();
                } else if (appBody) {
                    appBody.innerHTML = '';
                    if (header) header.style.display = 'none';
                }

                if (State.glassUI && appBody) {
                    appBody.style.background = 'transparent';
                } else if ((State.iconPack === 'hyperos' || State.iconPack === 'coloros') && appBody) {
                    appBody.style.background = isDarkApp ? '#000' : '#f2f2f7';
                } else if (appBody) {
                    appBody.style.background = '';
                }

                if (header) { header.style.transition = 'none'; header.style.opacity = headerOp; }
                if (appBody) { appBody.style.transition = 'none'; appBody.style.opacity = bodyOp; }
                if (header) header.style.zoom = startZoom;
                if (appBody) appBody.style.zoom = startZoom;
                win.style.transform = 'translate(0,0) scale(1)';
                win.style.top = `${curTop}px`;
                win.style.left = `${curLeft}px`;
                win.style.width = `${curW}px`;
                win.style.height = `${curH}px`;
                win.style.borderRadius = curRadius;
                win.style.opacity = startOpacity;
                win.style.zIndex = 10000;
                win.style.overflow = 'hidden';
                const iconEl = document.getElementById(`icon-${id}`);
                if (iconEl) iconEl.classList.add('app-current');

                const staleOverlays = win.querySelectorAll('#app-open-icon-overlay');
                staleOverlays.forEach(el => el.remove());

                const salvagedIconLayer = closeClone.querySelector('#close-icon-layer');
                if (salvagedIconLayer) {
                    const iconOp = window.getComputedStyle(salvagedIconLayer).opacity;
                    salvagedIconLayer.id = 'app-open-icon-overlay';
                    salvagedIconLayer.style.transition = 'none';
                    salvagedIconLayer.style.opacity = iconOp;
                    win.appendChild(salvagedIconLayer);
                }

                closeClone.remove();
                void win.offsetHeight;

                win.style.zIndex = AppManager.currentZIndex;
                if (State.homescreenBlur) document.body.classList.add('hs-blur');
                const totalDur = 0.5 * State.animationSpeed;
                win.style.transition = 'none';
                const openEase = 'cubic-bezier(' + (State.animConfig.openBezier || [0.2, 0.85, 0.1, 1]).join(', ') + ')';
                const openScaleEase = 'cubic-bezier(' + (State.animConfig.openScaleBezier || [0.2, 0.85, 0.1, 1]).join(', ') + ')';
                const scaleDur = (State.animConfig.openScaleTime || 0.5) * State.animationSpeed;

                if (AppManager._currentOpenAnim) { try { AppManager._currentOpenAnim.cancel(); } catch (e) { } }
                if (AppManager._currentScaleAnim) { try { AppManager._currentScaleAnim.cancel(); } catch (e) { } }

                if (header) {
                    header.style.transition = 'opacity 0.35s ease';
                    header.style.opacity = '1';
                }
                if (appBody) {
                    appBody.style.transition = 'opacity 0.35s ease';
                    appBody.style.opacity = '1';
                }

                if (iconEl) {
                    const ib = iconEl.querySelector('.icon-box');
                    if (ib) ib.style.opacity = '0';
                }
                const posAnim = win.animate([
                    { top: `${curTop}px`, left: `${curLeft}px`, opacity: startOpacity },
                    { top: '0px', left: '0px', opacity: '1' }
                ], { duration: totalDur * 1000, easing: openEase, fill: 'forwards' });

                const reScreenW = document.getElementById('screen').offsetWidth;
                const reScreenH = document.getElementById('screen').offsetHeight;
                const scaleAnim = win.animate([
                    { width: `${curW}px`, height: `${curH}px`, borderRadius: curRadius, offset: 0 },
                    { width: `${curW + (reScreenW - curW) * 0.3}px`, height: `${curH + (reScreenH - curH) * 0.3}px`, borderRadius: curRadius, offset: 0.3 },
                    { width: reScreenW + 'px', height: reScreenH + 'px', borderRadius: '60px', offset: 1 }
                ], { duration: scaleDur * 1000, easing: openScaleEase, fill: 'forwards' });

                win._syncZoomState = { active: true };
                const scrW = document.getElementById('screen').offsetWidth;
                const sEl = document.getElementById('scale-wrapper');
                const updateZ = () => {
                    if (!win._syncZoomState.active) return;
                    const cS = document.fullscreenElement ? 1 : sEl.getBoundingClientRect().width / (State.devWidth || 400);
                    const bW = win.getBoundingClientRect().width / cS;
                    const z = bW / scrW;
                    if (header) header.style.zoom = z;
                    if (appBody) appBody.style.zoom = z;
                    requestAnimationFrame(updateZ);
                };
                requestAnimationFrame(updateZ);

                AppManager._currentOpenAnim = posAnim;
                AppManager._currentScaleAnim = scaleAnim;

                posAnim.onfinish = () => {
                    if (win._syncZoomState) { win._syncZoomState.active = false; }
                    try { posAnim.cancel(); } catch (e) { }
                    try { scaleAnim.cancel(); } catch (e) { }
                    win.style.top = '0px';
                    win.style.left = '0px';
                    win.style.width = '100%';
                    win.style.height = '100%';
                    win.style.borderRadius = '60px';
                    win.style.opacity = '1';
                    win.classList.remove('app-animating');
                    win.style.overflow = '';
                    win.style.willChange = '';
                    if (header) header.style.zoom = '';
                    if (appBody) appBody.style.zoom = '';
                    State.isAnimating = false;
                    Island.update();
                };
                let iconOverlay = win.querySelector('#app-open-icon-overlay');
                if (iconOverlay) {
                    iconOverlay.style.transition = 'none';
                    iconOverlay.animate([{ opacity: window.getComputedStyle(iconOverlay).opacity || '1' }, { opacity: '0' }], {
                        duration: totalDur * 1000 * (State.animConfig.openIconFade || 1),
                        easing: 'ease',
                        fill: 'forwards'
                    });
                    const fIcon = iconOverlay.querySelector('.photos-icon-flower') || iconOverlay.querySelector('.settings-icon-gear') || iconOverlay.querySelector('.camera-icon-lens');
                    if (fIcon) {
                        fIcon.style.transition = `transform ${totalDur}s cubic-bezier(0.2, 0.85, 0.1, 1)`;
                        if (fIcon.classList.contains('settings-icon-gear')) {
                            fIcon.style.transform = 'scale(2.05)';
                        } else if (fIcon.classList.contains('camera-icon-lens')) {
                            fIcon.style.transform = 'scale(2.5)';
                        } else {
                            fIcon.style.transform = 'scale(1.8)';
                        }
                    }
                }
                if (header) { header.style.opacity = '1'; }
                if (appBody) { appBody.style.opacity = '1'; }
                setTimeout(() => {
                    if (iconOverlay && iconOverlay.parentNode) iconOverlay.remove();
                }, 200 * State.animationSpeed);
                return;
            }
        } else {
            delete AppManager.closingApps[id];
            if (Object.keys(AppManager.closingApps).length === 0) {
                document.body.classList.remove('closing-active');
            }
        }
        if (State.activeApp === id && !AppManager.closingApps[id]) return;
        if (State.activeApp && State.activeApp !== id) {
            if (AppManager._switchCooldown && Date.now() - AppManager._switchCooldown < 150) return;
            AppManager._switchCooldown = Date.now();
            const oldId = State.activeApp;
            const win = document.getElementById('app-window');
            if (AppManager._currentOpenAnim) { try { AppManager._currentOpenAnim.cancel(); } catch (e) { } AppManager._currentOpenAnim = null; }
            if (AppManager._currentScaleAnim) { try { AppManager._currentScaleAnim.cancel(); } catch (e) { } AppManager._currentScaleAnim = null; }
            const liveComp = window.getComputedStyle(win);
            const liveOpacity = parseFloat(liveComp.opacity);
            const liveRect = win.getBoundingClientRect();
            if (win.getAnimations) { win.getAnimations().forEach(a => { try { a.cancel(); } catch (e) { } }); }
            AppManager._openAnimGen = (AppManager._openAnimGen || 0) + 1;
            if (liveOpacity > 0.01 && liveRect.width > 10 && liveRect.height > 10) {
                const screenEl = document.getElementById('screen');
                const scaleWrapper = document.getElementById('scale-wrapper');
                const scaleFactor = document.fullscreenElement ? 1 : scaleWrapper.getBoundingClientRect().width / (State.devWidth || 400);
                const sRect = screenEl.getBoundingClientRect();
                const curTop = (liveRect.top - sRect.top) / scaleFactor;
                const curLeft = (liveRect.left - sRect.left) / scaleFactor;
                const curW = liveRect.width / scaleFactor;
                const curH = liveRect.height / scaleFactor;
                win.style.transition = 'none';
                win.style.top = `${curTop}px`;
                win.style.left = `${curLeft}px`;
                win.style.width = `${curW}px`;
                win.style.height = `${curH}px`;
                win.style.borderRadius = liveComp.borderRadius;
                win.style.background = liveComp.backgroundColor;
                win.style.transform = 'translate(0,0) scale(1)';
                win.style.opacity = liveOpacity;
                win.style.filter = 'none';
                AppManager.close();
            } else {
                win.style.transition = 'none';
                win.style.display = 'none';
                win.style.transform = '';
                win.style.top = '';
                win.style.left = '';
                win.style.width = '';
                win.style.height = '';
                win.style.borderRadius = '';
                win.style.opacity = '';
                win.style.overflow = '';
                win.style.filter = '';
                win.classList.remove('app-animating', 'closing', 'closing-custom', 'hyperos-anim');
                const oldOverlay = win.querySelector('#app-open-icon-overlay');
                if (oldOverlay) oldOverlay.remove();
                const oldIconEl = document.getElementById(`icon-${oldId}`);
                if (oldIconEl) {
                    oldIconEl.classList.remove('app-current');
                    const oldIconBox = oldIconEl.querySelector('.icon-box') || oldIconEl;
                    oldIconBox.style.opacity = '1';
                    oldIconBox.style.visibility = 'visible';
                }
                document.body.classList.remove('app-open');
                document.body.classList.remove('fade-app-boxes');
                if (State.homescreenBlur) document.body.classList.add('hs-blur');
                document.body.classList.remove('closing-active');
                State.activeApp = null;
                State.isAnimating = false;
            }
        }
        let inheritedIconOpacity = null;
        const existingClones = document.querySelectorAll(`.app-window-closing-clone[data-app-id="${id}"]`);
        existingClones.forEach(existingClone => {
            const staleCloseLayer = existingClone.querySelector('#close-icon-layer');
            if (staleCloseLayer && inheritedIconOpacity === null) {
                inheritedIconOpacity = parseFloat(window.getComputedStyle(staleCloseLayer).opacity);
            }
            existingClone.remove();
        });
        if (AppManager.closingApps && AppManager.closingApps[id]) {
            clearTimeout(AppManager.closingApps[id].closeTimeout);
            clearTimeout(AppManager.closingApps[id].iconFadeTimeout);
            delete AppManager.closingApps[id];
        }
        if (Object.keys(AppManager.closingApps || {}).length === 0) {
            document.body.classList.remove('closing-active');
        }
        const staleIcon = document.getElementById(`icon-${id}`);
        if (staleIcon) {
            staleIcon.classList.remove('app-current');
            const staleBox = staleIcon.querySelector('.icon-box') || staleIcon;
            staleBox.style.opacity = '1';
            staleBox.style.visibility = 'visible';
        }
        State.activeApp = id;
        State.isAnimating = true;
        AppManager._openAnimGen = (AppManager._openAnimGen || 0) + 1;
        const _openGen = AppManager._openAnimGen;
        const win = document.getElementById('app-window');
        const extraOverlays = win.querySelectorAll('.settings-section-overlay');
        extraOverlays.forEach(el => el.remove());
        const launchMainVeil = document.getElementById('settings-main-dim-veil');
        if (launchMainVeil) launchMainVeil.remove();
        const staleIconOverlay = win.querySelector('#app-open-icon-overlay');
        if (staleIconOverlay) staleIconOverlay.remove();
        const staleCloseLayer = win.querySelector('#close-icon-layer');
        if (staleCloseLayer) staleCloseLayer.remove();

        AppManager.currentZIndex += 10;
        win.style.zIndex = AppManager.currentZIndex;
        const iconEl = document.getElementById(`icon-${id}`);
        const icon = iconEl.querySelector('.icon-box');
        iconEl.classList.add('app-current');
        icon.classList.remove('fade-in-anim');
        icon.style.transition = '';
        icon.style.opacity = '';
        icon.style.visibility = '';
        const iRect = icon.getBoundingClientRect();
        const sRect = document.getElementById('screen').getBoundingClientRect();
        const scaleFactor = document.fullscreenElement ? 1 : document.getElementById('scale-wrapper').getBoundingClientRect().width / (State.devWidth || 400);
        const startWidth = icon.offsetWidth;
        const startHeight = icon.offsetHeight;
        const cx = iRect.left + (iRect.width / 2);
        const cy = iRect.top + (iRect.height / 2);
        const startLeft = ((cx - sRect.left) / scaleFactor) - (startWidth / 2);
        const startTop = ((cy - sRect.top) / scaleFactor) - (startHeight / 2);
        AppManager.origin = { top: startTop, left: startLeft, w: startWidth, h: startHeight };
        win.style.top = `${startTop}px`;
        win.style.left = `${startLeft}px`;
        win.style.width = `${startWidth}px`;
        win.style.height = `${startHeight}px`;
        let shapePct = parseFloat(OS.getShapeRadius()) / 100;
        let startRadiusForAnim = (startWidth * shapePct) + 'px';
        if (parseInt(State.appShape) >= 45) {
            startRadiusForAnim = (Math.min(startWidth, startHeight) / 2) + 'px';
        }
        win.style.borderRadius = startRadiusForAnim;
        win.style.opacity = '0';
        win.style.display = 'flex';
        void win.offsetWidth;
        win.style.transition = 'none';
        win.style.transformOrigin = 'top left';
        win.style.transform = 'translate(0,0) scale(1)';
        win.style.willChange = 'transform, width, height, border-radius, opacity';
        const appInfo = APPS.find(a => a.id === id) || (State.emptyApps ? State.emptyApps.find(a => a.id === id) : null) || { colorColor: '#888', hyperColor: '#888', color: '#888' };
        win.classList.add('app-animating');

        const packColorNorm = State.iconPack === 'hyperos' ? appInfo.hyperColor : (State.iconPack === 'coloros' ? appInfo.colorColor : null);
        let overlayBg = 'transparent';
        if ((State.iconPack === 'hyperos' || State.iconPack === 'coloros') && packColorNorm) {
            overlayBg = 'transparent';
        } else if (appInfo.id === 'settings') {
            overlayBg = appInfo.color || '#8e8e93';
        } else if (appInfo.id === 'camera') {
            overlayBg = 'linear-gradient(135deg, #fbfbfb 0%, #e8e8e8 50%, #d1d1d1 100%)';
        } else if (appInfo.id === 'music') {
            overlayBg = '#fa2d48';
        } else if (appInfo.id === 'clock') {
            overlayBg = '#fff';
        } else if (id.startsWith('empty_')) {
            overlayBg = '#888';
        } else {
            overlayBg = icon.style.background || appInfo.color || '#000';
        }
        win.style.background = overlayBg;

        const isDarkApp = ['camera'].includes(id) || State.darkMode;
        const iconOverlay = document.createElement('div');
        iconOverlay.id = 'app-open-icon-overlay';

        let startOp = 1;
        if (inheritedIconOpacity !== null && !isNaN(inheritedIconOpacity)) {
            startOp = inheritedIconOpacity;
        }

        iconOverlay.style.cssText = `
                    position: absolute;
                    inset: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    pointer-events: none;
                    border-radius: inherit;
                    opacity: ${startOp};
                    transition: opacity ${State.animConfig.openIconFade * State.animationSpeed}s ease;
                `;

        const packIconNorm = State.iconPack === 'hyperos' ? appInfo.hyperIcon : (State.iconPack === 'coloros' ? appInfo.colorIcon : null);
        const isImagePackNorm = (State.iconPack === 'hyperos' || State.iconPack === 'coloros') && packIconNorm;
        if (isImagePackNorm) {
            let packColor = State.iconPack === 'hyperos' ? appInfo.hyperColor : appInfo.colorColor;
            iconOverlay.style.background = packColor;
            iconOverlay.style.flexDirection = 'column';
            iconOverlay.style.alignItems = 'center';
            iconOverlay.style.justifyContent = 'flex-start';
            iconOverlay.innerHTML = `<img src="${packIconNorm}" style="width: 100%; height: auto; border-top-left-radius: inherit; border-top-right-radius: inherit; transform: scale(1.0); flex-shrink: 0; outline: none; border: none;">`;
        } else if (appInfo.id === 'photos') {
            iconOverlay.innerHTML = `<div style="width:100%; height:100%; border-radius:inherit; display:flex; justify-content:center; align-items:center; background:${overlayBg}; position:relative; overflow:hidden;"><div class="photos-icon-flower" style="transform: scale(1.0); scale: var(--icon-scale-factor); transition: transform ${0.5 * State.animationSpeed}s cubic-bezier(0.2, 0.85, 0.1, 1);"><div class="petal-wrap p1"><div class="petal"></div></div><div class="petal-wrap p2"><div class="petal"></div></div><div class="petal-wrap p3"><div class="petal"></div></div><div class="petal-wrap p4"><div class="petal"></div></div><div class="petal-wrap p5"><div class="petal"></div></div><div class="petal-wrap p6"><div class="petal"></div></div><div class="petal-wrap p7"><div class="petal"></div></div><div class="petal-wrap p8"><div class="petal"></div></div></div></div>`;
        } else if (appInfo.id === 'settings') {
            iconOverlay.innerHTML = `<div style="width:100%; height:100%; border-radius:inherit; display:flex; justify-content:center; align-items:center; background:${overlayBg}; position:relative; overflow:hidden;"><div class="settings-icon-gear" style="transform: scale(1.15); scale: var(--icon-scale-factor); transition: transform ${0.5 * State.animationSpeed}s cubic-bezier(0.2, 0.85, 0.1, 1);">
                <div class="gear-base"></div>
                <div class="gear-teeth">
                    <div class="tooth"></div><div class="tooth"></div><div class="tooth"></div>
                    <div class="tooth"></div><div class="tooth"></div><div class="tooth"></div>
                </div>
                <div class="gear-inner-ring"></div>
                <div class="gear-spoke spoke-1"></div><div class="gear-spoke spoke-2"></div><div class="gear-spoke spoke-3"></div>
                <div class="gear-center-dot"></div>
            </div></div>`;
        } else if (appInfo.id === 'camera') {
            iconOverlay.innerHTML = `<div style="width:100%; height:100%; border-radius:inherit; display:flex; justify-content:center; align-items:center; background:${overlayBg}; position:relative; overflow:hidden;"><div class="camera-icon-lens" style="transform: scale(1.39); scale: var(--icon-scale-factor); transition: transform ${0.5 * State.animationSpeed}s cubic-bezier(0.2, 0.85, 0.1, 1);">
                <div class="camera-base"></div>
                <div class="lens-outer-ring"></div>
                <div class="lens-inner-black"></div>
                <div class="lens-core-glass"></div>
                <div class="lens-glare-1"></div>
                <div class="lens-glare-2"></div>
                <div class="flash-ring"><div class="flash-bulb"></div></div>
            </div></div>`;
        } else if (appInfo.id === 'music') {
            iconOverlay.innerHTML = `<div style="width:100%; height:100%; border-radius:inherit; display:flex; justify-content:center; align-items:center; background:${overlayBg}; position:relative; overflow:hidden;"><div class="music-icon-note" style="transform: scale(1.0); scale: var(--icon-scale-factor); transition: transform ${0.5 * State.animationSpeed}s cubic-bezier(0.2, 0.85, 0.1, 1);">
                <div class="music-note">&#9834;</div>
                <div class="music-sparkles">
                    <div class="sparkle sparkle-lg" style="top:22%; right:2%;"></div>
                    <div class="sparkle sparkle-sm sparkle-green" style="top:55%; left:5%;"></div>
                    <div class="sparkle sparkle-xs sparkle-yellow" style="bottom:15%; left:22%;"></div>
                    <div class="sparkle sparkle-xs sparkle-orange" style="top:12%; right:22%;"></div>
                </div>
            </div></div>`;
        } else if (appInfo.id === 'clock') {
            const now = new Date();
            const hDeg = (now.getHours() % 12) * 30 + now.getMinutes() * 0.5;
            const mDeg = now.getMinutes() * 6;
            iconOverlay.innerHTML = `<div style="width:100%; height:100%; border-radius:inherit; display:flex; justify-content:center; align-items:center; background:${overlayBg}; position:relative; overflow:hidden;"><div class="clock-icon-face" style="transform: scale(1.0); scale: var(--icon-scale-factor); transition: transform ${0.5 * State.animationSpeed}s cubic-bezier(0.2, 0.85, 0.1, 1);">
                <div class="clock-dial"></div>
                <div class="clock-hand clock-hour" style="transform: rotate(${hDeg}deg);"></div>
                <div class="clock-hand clock-minute" style="transform: rotate(${mDeg}deg);"></div>
                <div class="clock-center-dot"></div>
            </div></div>`;
        } else {
            const bg = appInfo.color || '#000';
            const lowBg = (bg || "").toLowerCase().trim();
            const isWhiteBg = lowBg === '#fff' || lowBg.startsWith('#ffffff') || lowBg === 'white' || lowBg.replace(/\s/g, '') === 'rgb(255,255,255)';
            const shadeColor = isWhiteBg ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)';
            const shadeHtml = `<div style="position:absolute; inset:0; background: radial-gradient(circle at top right, ${shadeColor} 0%, transparent 70%); pointer-events:none; border-radius:inherit; z-index:10;"></div>`;
            iconOverlay.innerHTML = `<div style="width:100%; height:100%; border-radius:inherit; display:flex; justify-content:center; align-items:center; background:${overlayBg || bg}; position:relative; overflow:hidden;">${shadeHtml}<i class="fas ${appInfo.icon}" style="font-size: 28px; scale: var(--icon-scale-factor); color: ${appInfo.text || 'white'}; z-index: 2;"></i></div>`;
        }
        win.appendChild(iconOverlay);
        const header = document.getElementById('app-header');
        const appBody = document.getElementById('app-body');
        header.style.transition = 'none';
        header.style.opacity = '0';
        appBody.style.transition = 'none';
        appBody.style.opacity = '0';
        appBody.scrollTop = 0;
        win.scrollTop = 0;
        if (State.glassUI) {
            appBody.style.background = 'transparent';
        } else if (State.iconPack === 'hyperos' || State.iconPack === 'coloros') {
            const bgCol = isDarkApp ? '#000' : '#f2f2f7';
            appBody.style.background = bgCol;
        } else {
            appBody.style.background = '';
        }
        header.style.color = isDarkApp ? '#fff' : '#000';
        document.getElementById('app-title').innerText = id === 'settings' ? '' : appInfo.name;
        header.classList.remove('calc-header');
        win.classList.remove('calc-app-bg');
        document.getElementById('app-back').style.display = 'none';
        document.getElementById('app-back').onclick = AppManager.close;
        if (Apps[id] && Apps[id].render) {
            Apps[id].render();
        } else {
            if (appBody) {
                appBody.innerHTML = '';
                if (header) header.style.display = 'none';
            }
        }
        OS.updateStatusBarColors(true, isDarkApp);
        requestAnimationFrame(() => {
            if (AppManager._openAnimGen !== _openGen) return;
            requestAnimationFrame(() => {
                if (AppManager._openAnimGen !== _openGen) return;
                appBody.scrollTop = 0;
                win.scrollTop = 0;
                document.body.classList.remove('closing-active');
                if (AppManager._homeZoomTimeout) {
                    clearTimeout(AppManager._homeZoomTimeout);
                    AppManager._homeZoomTimeout = null;
                }
                const homeScreenEl = document.getElementById('home-screen');
                if (State.animStyle === 'new' && homeScreenEl) {
                    const cmpScale = window.getComputedStyle(homeScreenEl).transform;
                    let mScale = 1;
                    if (cmpScale && cmpScale !== 'none') {
                        const v = cmpScale.match(/matrix\((.+)\)/);
                        if (v) mScale = parseFloat(v[1].split(',')[0]);
                    }
                    if (homeScreenEl._zoomAnim) homeScreenEl._zoomAnim.cancel();

                    document.body.classList.add('app-open');

                    const targetScale = (State.animConfig.openAppZoomOut !== undefined) ? State.animConfig.openAppZoomOut : 0.95;
                    homeScreenEl._zoomAnim = homeScreenEl.animate([
                        { transform: `scale(${mScale})` },
                        { transform: `scale(${targetScale})` }
                    ], {
                        duration: 500,
                        easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
                        fill: 'forwards'
                    });
                } else {
                    document.body.classList.add('app-open');
                }

                const wallLayer = document.getElementById('wallpaper-layer');
                if (wallLayer) {
                    if (State.animConfig.wallBlurDur !== undefined) {
                        wallLayer.style.setProperty('--wall-blur-dur', `${State.animConfig.wallBlurDur}s`);
                    }
                }

                if (State.homescreenBlur) {
                    if (State.animConfig.openWallBlur === false) {
                        document.body.classList.remove('hs-blur');
                    } else {
                        document.body.classList.add('hs-blur');
                    }
                }
                if (State.animConfig.openAppFade) {
                    document.body.classList.add('fade-app-boxes');
                }
                const totalDur = 0.5 * State.animationSpeed;
                const startBg = win.style.background;
                let endBg = appInfo.color || (isDarkApp ? '#000' : '#f2f2f7');
                if (State.glassUI) endBg = State.darkMode ? 'rgba(30,30,30,0.65)' : 'rgba(243,243,243,0.65)';
                if (appInfo.id === 'clock') endBg = State.darkMode ? '#000' : '#fff';

                OS.updateStatusBarColors(true, isDarkApp);

                if (header) { header.style.transition = 'none'; header.style.opacity = '1'; }
                if (appBody) { appBody.style.transition = 'none'; appBody.style.opacity = '1'; }
                if (iconOverlay) {
                    void iconOverlay.offsetWidth;
                    iconOverlay.style.transition = `opacity ${totalDur * State.animConfig.openIconFade}s ease`;
                    iconOverlay.style.opacity = '0';
                }
                win.style.transition = 'none';
                win.style.overflow = 'hidden';
                const contentZoom = startWidth / document.getElementById('screen').offsetWidth;
                if (header) header.style.zoom = contentZoom;
                if (appBody) appBody.style.zoom = contentZoom;
                let startRadius = startRadiusForAnim;
                if (State.animStyle === 'new') {
                    win.style.transition = 'none';
                    const openEase = 'cubic-bezier(' + (State.animConfig.openBezier || [0.2, 0.85, 0.1, 1]).join(', ') + ')';
                    const openScaleEase = 'cubic-bezier(' + (State.animConfig.openScaleBezier || [0.2, 0.85, 0.1, 1]).join(', ') + ')';
                    const scaleDur = (State.animConfig.openScaleTime || 0.5) * State.animationSpeed;
                    const zoomStart = (State.animConfig.openAppZoomOut !== undefined) ? State.animConfig.openAppZoomOut : 0.95;
                    const homeScreen = document.getElementById('home-screen');
                    const topWallLayer = document.getElementById('wallpaper-layer');

                    const wallZoom = State.animConfig.openWallZoom !== undefined ? State.animConfig.openWallZoom : 1.05;

                    document.body.style.setProperty('--app-open-scale', zoomStart);
                    document.body.style.setProperty('--app-open-wall-scale', wallZoom);
                    if (State.animConfig.openWallBlur === false && !State.homescreenBlur) {
                        document.body.style.setProperty('--wall-blur-amt', '0px');
                    } else {
                        document.body.style.setProperty('--wall-blur-amt', '25px');
                    }

                    if (AppManager._currentOpenAnim) { try { AppManager._currentOpenAnim.cancel(); } catch (e) { } }
                    if (AppManager._currentScaleAnim) { try { AppManager._currentScaleAnim.cancel(); } catch (e) { } }

                    if (icon) icon.style.opacity = '0';
                    const posAnim = win.animate([
                        { top: startTop + 'px', left: startLeft + 'px', backgroundColor: startBg, opacity: 0 },
                        { top: startTop + 'px', left: startLeft + 'px', backgroundColor: startBg, opacity: 1, offset: 0.01 },
                        { backgroundColor: startBg, opacity: 1, offset: 0.2 },
                        { backgroundColor: endBg, opacity: 1, offset: 0.5 },
                        { top: '0px', left: '0px', backgroundColor: endBg, opacity: 1 }
                    ], {
                        duration: totalDur * 1000,
                        easing: openEase,
                        fill: 'forwards'
                    });
                    const screenWNum = document.getElementById('screen').offsetWidth;
                    const screenHNum = document.getElementById('screen').offsetHeight;
                    const scaleAnim = win.animate([
                        { width: startWidth + 'px', height: startHeight + 'px', borderRadius: startRadius, offset: 0 },
                        { width: (startWidth + (screenWNum - startWidth) * 0.3) + 'px', height: (startHeight + (screenHNum - startHeight) * 0.3) + 'px', borderRadius: startRadius, offset: 0.3 },
                        { width: screenWNum + 'px', height: screenHNum + 'px', borderRadius: '60px', offset: 1 }
                    ], {
                        duration: scaleDur * 1000,
                        easing: openScaleEase,
                        fill: 'forwards'
                    });
                    win._syncZoomState = { active: true };
                    const scrW = document.getElementById('screen').offsetWidth;
                    const sEl = document.getElementById('scale-wrapper');
                    const updateOpenZ = () => {
                        if (!win._syncZoomState.active) return;
                        const z = win.offsetWidth / scrW;
                        if (header) header.style.zoom = z;
                        if (appBody) appBody.style.zoom = z;
                        requestAnimationFrame(updateOpenZ);
                    };
                    requestAnimationFrame(updateOpenZ);

                    AppManager._currentOpenAnim = posAnim;
                    AppManager._currentScaleAnim = scaleAnim;

                    posAnim.onfinish = () => {
                        if (win._syncZoomState) { win._syncZoomState.active = false; }
                        try { posAnim.cancel(); } catch (e) { }
                        try { scaleAnim.cancel(); } catch (e) { }
                        AppManager._currentOpenAnim = null;
                        AppManager._currentScaleAnim = null;
                        finalizeAnimation(win, endBg);
                    };
                }
                function finalizeAnimation(element, finalBg) {
                    element.style.transition = 'none';
                    element.style.top = '0px';
                    element.style.left = '0px';
                    element.style.width = '100%';
                    element.style.height = '100%';
                    element.style.borderRadius = '60px';
                    element.style.background = finalBg;
                    element.style.opacity = '1';
                    element.style.overflow = '';
                    if (header) header.style.zoom = '';
                    if (appBody) appBody.style.zoom = '';

                    if (iconOverlay && iconOverlay.parentNode) iconOverlay.remove();
                    State.isAnimating = false;
                    Island.update();
                }
                if (iconOverlay) {
                    const fIcon = iconOverlay.querySelector('.photos-icon-flower') || iconOverlay.querySelector('.settings-icon-gear') || iconOverlay.querySelector('.camera-icon-lens') || iconOverlay.querySelector('.music-icon-note') || iconOverlay.querySelector('.clock-icon-face');
                    if (fIcon) {
                        fIcon.style.transition = `transform ${totalDur}s cubic-bezier(0.2, 0.85, 0.1, 1)`;
                        if (fIcon.classList.contains('settings-icon-gear')) {
                            fIcon.style.transform = 'scale(2.05)';
                        } else if (fIcon.classList.contains('camera-icon-lens')) {
                            fIcon.style.transform = 'scale(2.5)';
                        } else if (fIcon.classList.contains('music-icon-note')) {
                            fIcon.style.transform = 'scale(2.0)';
                            const sparklesEl = fIcon.querySelector('.music-sparkles');
                            if (sparklesEl) {
                                sparklesEl.style.transition = `transform ${totalDur}s cubic-bezier(0.2, 0.85, 0.1, 1)`;
                                sparklesEl.style.transform = 'rotate(360deg)';
                            }
                        } else if (fIcon.classList.contains('clock-icon-face')) {
                            fIcon.style.transform = 'scale(2.0)';
                            const hourH = fIcon.querySelector('.clock-hour');
                            const minH = fIcon.querySelector('.clock-minute');
                            if (hourH) { hourH.style.transition = `transform ${totalDur}s cubic-bezier(0.2, 0.85, 0.1, 1)`; hourH.style.transform = `rotate(${parseFloat(hourH.style.transform.replace(/[^0-9.-]/g, '')) + 180}deg)`; }
                            if (minH) { minH.style.transition = `transform ${totalDur}s cubic-bezier(0.2, 0.85, 0.1, 1)`; minH.style.transform = `rotate(${parseFloat(minH.style.transform.replace(/[^0-9.-]/g, '')) + 360}deg)`; }
                        } else {
                            fIcon.style.transform = 'scale(1.8)';
                        }
                    }
                }
                setTimeout(() => {
                    if (AppManager._openAnimGen !== _openGen) return;
                    win.classList.remove('app-animating');
                    if (iconOverlay && iconOverlay.parentNode) iconOverlay.remove();
                    appBody.style.background = '';
                    if (State.glassUI) {
                        win.style.background = State.darkMode ? 'rgba(30,30,30,0.65)' : 'rgba(243,243,243,0.65)';
                    } else {
                        win.style.background = isDarkApp ? '#000' : '#f2f2f7';
                    }
                }, 200 * State.animationSpeed);
                setTimeout(() => {
                    if (AppManager._openAnimGen !== _openGen) return;
                    State.isAnimating = false; Island.update();
                    win.style.willChange = '';
                }, totalDur * 1000);
            });
        });
    },
    close: () => {
        const totalDurCalc = document.getElementById('app-window').classList.contains('app-animating') ? 0.70 * State.animationSpeed : 0.60 * State.animationSpeed;
        const morphDurCalc = totalDurCalc * (State.animConfig.closeShapeMorph || 0.34);

        document.querySelectorAll('.app-window-closing-clone').forEach(clone => {
            if (clone.getAnimations && clone.getAnimations().some(a => a.effect && a.effect.getKeyframes && a.effect.getKeyframes().some(k => k.filter))) {
                const currentFilter = window.getComputedStyle(clone).filter;
                const startFilter = (currentFilter && currentFilter !== 'none') ? currentFilter : `blur(25px) brightness(0.5)`;

                clone.getAnimations().forEach(a => {
                    if (a.effect && a.effect.getKeyframes && a.effect.getKeyframes().some(k => k.filter)) {
                        a.cancel();
                    }
                });

                clone.animate([
                    { filter: startFilter },
                    { filter: 'blur(0px) brightness(1)' }
                ], {
                    duration: morphDurCalc * 1000,
                    delay: 0,
                    easing: 'ease-out',
                    fill: 'forwards'
                });
            }
        });
        const wallOverlay = document.getElementById('wall-expand-overlay');
        if (wallOverlay) {
            wallOverlay.style.opacity = '0';
            wallOverlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => wallOverlay.remove(), 300);
        }
        if (!State.activeApp) return;
        const win = document.getElementById('app-window');
        const id = State.activeApp;
        if (!State.poweredOn) {
            win.style.display = 'none';
            win.classList.remove('active', 'closing', 'app-open');
            document.body.classList.remove('app-open', 'fade-app-boxes');
            if (State.homescreenBlur) document.body.classList.add('hs-blur');

            if (State.animStyle === 'new') {
                const homeScreen = document.getElementById('home-screen');
                if (homeScreen) {
                    if (homeScreen._zoomAnim) homeScreen._zoomAnim.cancel();
                    homeScreen.style.transform = '';
                }
            }

            State.activeApp = null;
            State.isAnimating = false;
            document.getElementById('app-body').innerHTML = '';
            const nnModal = document.getElementById('new-note-modal');
            if (nnModal) nnModal.classList.remove('active');
            const icon = document.getElementById(`icon-${id}`);
            if (icon) {
                const iconBox = icon.querySelector('.icon-box') || icon;
                iconBox.style.opacity = '1';
                iconBox.style.visibility = 'visible';
            }
            return;
        }
        State.activeApp = null;
        State.isAnimating = true;
        AppManager._openAnimGen = (AppManager._openAnimGen || 0) + 1;
        AppManager.closingApps = AppManager.closingApps || {};
        document.body.classList.add('closing-active');
        Music.collapse();
        const nnModalActive = document.getElementById('new-note-modal');
        if (nnModalActive) nnModalActive.classList.remove('active');
        let appInfo = APPS.find(a => a.id === id) || (State.emptyApps ? State.emptyApps.find(a => a.id === id) : null) || { colorIcon: '', hyperIcon: '', color: '#888' };
        const homeScreen = document.getElementById('home-screen');
        const screenEl = document.getElementById('screen');
        const screenRect = screenEl.getBoundingClientRect();
        const homeRect = homeScreen.getBoundingClientRect();
        const scale = (homeRect.width > 10 && homeScreen.offsetWidth > 0) ? (homeRect.width / homeScreen.offsetWidth) : 1;
        const winRect = win.getBoundingClientRect();
        const comp = window.getComputedStyle(win);
        const curRadius = comp.borderRadius;
        const startTopScreen = (winRect.top - screenRect.top) / scale;
        const startLeftScreen = (winRect.left - screenRect.left) / scale;
        const startTopHome = (winRect.top - homeRect.top) / scale;
        const startLeftHome = (winRect.left - homeRect.left) / scale;
        const startW = winRect.width / scale;
        const startH = winRect.height / scale;
        const iconEl = document.getElementById(`icon-${id}`);
        let endTop = 0, endLeft = 0, endW = 0, endH = 0;
        if (iconEl) {
            const iconBox = iconEl.querySelector('.icon-box') || iconEl;

            let topAcc = 0;
            let leftAcc = 0;
            let curr = iconBox;
            while (curr && curr !== homeScreen) {
                topAcc += curr.offsetTop;
                leftAcc += curr.offsetLeft;
                curr = curr.offsetParent;
            }

            endTop = topAcc;
            endLeft = leftAcc;
            endW = iconBox.offsetWidth;
            endH = iconBox.offsetHeight;
        }
        const musicPlaying = Music.active && !Music.audio.paused;
        const timerActive = Timer.running || Timer.finished;
        const isSplit = musicPlaying && timerActive;
        const morphToIsland = false
        let islandMorphTarget = null;
        let islandTargetEl = null;
        if (morphToIsland) {
            const screenEl = document.getElementById('screen');
            const screenRect = screenEl.getBoundingClientRect();
            const scaleFactor = document.fullscreenElement ? 1 : screenRect.width / screenEl.offsetWidth;
            const island = document.getElementById('dynamic-island');
            const islandSec = document.getElementById('dynamic-island-sec');
            document.body.classList.remove('app-open');
            const islandWrap = document.getElementById('island-wrap');
            const savedTransitions = {
                island: island.style.transition,
                sec: islandSec.style.transition,
                wrap: islandWrap ? islandWrap.style.transition : ''
            };
            island.style.transition = 'none';
            islandSec.style.transition = 'none';
            if (islandWrap) islandWrap.style.transition = 'none';
            Island.update();
            void island.offsetWidth;
            void islandSec.offsetWidth;
            if (id === 'clock' && isSplit) {
                islandTargetEl = islandSec;
                islandSec.style.transition = 'opacity 0.1s ease';
                islandSec.style.opacity = '0';
                const secRect = islandSec.getBoundingClientRect();
                islandMorphTarget = {
                    top: (secRect.top - screenRect.top) / scaleFactor,
                    left: (secRect.left - screenRect.left) / scaleFactor,
                    w: secRect.width / scaleFactor,
                    h: secRect.height / scaleFactor,
                    radius: '50%'
                };
            } else if (id === 'music' && isSplit) {
                islandTargetEl = island;
                island.style.transition = 'opacity 0.1s ease';
                island.style.opacity = '0';
                const pillRect = island.getBoundingClientRect();
                islandMorphTarget = {
                    top: (pillRect.top - screenRect.top) / scaleFactor,
                    left: (pillRect.left - screenRect.left) / scaleFactor,
                    w: pillRect.width / scaleFactor,
                    h: pillRect.height / scaleFactor,
                    radius: '20px'
                };
            } else {
                islandTargetEl = island;
                island.style.transition = 'opacity 0.1s ease';
                island.style.opacity = '0';
                const islandRect = island.getBoundingClientRect();
                islandMorphTarget = {
                    top: (islandRect.top - screenRect.top) / scaleFactor,
                    left: (islandRect.left - screenRect.left) / scaleFactor,
                    w: islandRect.width / scaleFactor,
                    h: islandRect.height / scaleFactor,
                    radius: '20px'
                };
            }
            Island.isMorphing = true;
            island.style.transition = savedTransitions.island;
            islandSec.style.transition = savedTransitions.sec;
            if (islandWrap) islandWrap.style.transition = savedTransitions.wrap;
        }
        const appBodyEl = document.getElementById('app-body');
        const appHeaderEl = document.getElementById('app-header');
        const liveBodyOp = appBodyEl ? window.getComputedStyle(appBodyEl).opacity : '1';
        const liveHeaderOp = appHeaderEl ? window.getComputedStyle(appHeaderEl).opacity : '1';
        const liveBodyZoom = startW / document.getElementById('screen').offsetWidth;
        const liveHeaderZoom = liveBodyZoom;

        const closeClone = win.cloneNode(true);
        const settingsOverlay = document.getElementById('settings-section-overlay');
        if (settingsOverlay) settingsOverlay.remove();
        const settingsSubOverlay = document.getElementById('settings-sub-overlay');
        if (settingsSubOverlay) settingsSubOverlay.remove();
        const closeMainVeil = document.getElementById('settings-main-dim-veil');
        if (closeMainVeil) closeMainVeil.remove();
        if (appBodyEl) {
            const closeFade = appBodyEl.querySelector('.anim-fade');
            if (closeFade) { closeFade.style.transform = ''; closeFade.style.transition = ''; }
            appBodyEl.style.transform = ''; appBodyEl.style.filter = ''; appBodyEl.style.transition = '';
        }
        const appHeaderReset = document.getElementById('app-header');
        if (appHeaderReset) {
            appHeaderReset.classList.remove('settings-header-dim', 'settings-header-dim-visible');
            appHeaderReset.style.transform = ''; appHeaderReset.style.filter = ''; appHeaderReset.style.transition = ''; appHeaderReset.style.position = ''; appHeaderReset.style.top = ''; appHeaderReset.style.left = ''; appHeaderReset.style.right = ''; appHeaderReset.style.zIndex = '';
        }
        const screenAc = document.getElementById('screen');
        if (screenAc) screenAc.classList.remove('settings-subpage-dim');
        if (Apps.settings && Apps.settings.view) Apps.settings.view = 'root';
        if (morphToIsland) {
            closeClone.id = `app-window-morphing-${id}`;
            closeClone.classList.add('app-window-morphing-clone');
        } else {
            closeClone.id = `app-window-closing-${id}`;
            closeClone.classList.add('app-window-closing-clone');
            closeClone.dataset.appId = id;
        }
        const staleOpenLayer = closeClone.querySelector('#app-open-icon-overlay');
        if (staleOpenLayer) staleOpenLayer.remove();
        const staleCloseLayer = closeClone.querySelector('#close-icon-layer');
        if (staleCloseLayer) staleCloseLayer.remove();

        closeClone.querySelector('#new-note-modal')?.remove();
        closeClone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
        const computedBg = window.getComputedStyle(win).backgroundColor;
        closeClone.style.cssText = win.style.cssText;
        closeClone.style.background = computedBg;
        closeClone.style.position = 'absolute';
        closeClone.style.top = '0';
        closeClone.style.left = '0';
        closeClone.style.width = `${startW}px`;
        closeClone.style.height = `${startH}px`;
        closeClone.style.transform = `translate(${morphToIsland ? startLeftScreen : startLeftHome}px, ${morphToIsland ? startTopScreen : startTopHome}px)`;
        closeClone.style.zIndex = '100';
        closeClone.style.overflow = 'hidden';
        closeClone.style.transformOrigin = 'top left';
        closeClone.style.borderRadius = curRadius;
        closeClone.style.margin = '0';
        closeClone.style.transition = 'none';
        closeClone.style.pointerEvents = 'none';
        closeClone.style.flexDirection = 'column';
        closeClone.style.willChange = 'transform, width, height, border-radius, opacity';
        closeClone.style.backfaceVisibility = 'hidden';
        closeClone.style.webkitBackfaceVisibility = 'hidden';
        closeClone.style.outline = '1px solid transparent';
        closeClone.style.isolation = 'isolate';
        const contentEl = closeClone.querySelector('.app-content') || closeClone.querySelector('#app-body');
        if (contentEl) {
            contentEl.style.opacity = liveBodyOp;
            contentEl.style.zoom = liveBodyZoom;
        }
        const headerElClone = closeClone.querySelector('#app-header') || closeClone.querySelector('.app-header');
        if (headerElClone) {
            headerElClone.style.opacity = liveHeaderOp;
            headerElClone.style.zoom = liveHeaderZoom;
        }
        const openIconOverlay = win.querySelector('#app-open-icon-overlay');
        const startIconOpacity = openIconOverlay ? parseFloat(window.getComputedStyle(openIconOverlay).opacity) : 0;
        const iconLayer = document.createElement('div');
        iconLayer.id = 'close-icon-layer';
        iconLayer.style.position = 'absolute';
        iconLayer.style.inset = '0';
        iconLayer.style.display = 'flex';
        iconLayer.style.justifyContent = 'center';
        iconLayer.style.alignItems = 'center';
        iconLayer.style.opacity = `${startIconOpacity}`;
        iconLayer.style.transition = 'none';
        iconLayer.style.zIndex = '9999';
        const packIconClose = State.iconPack === 'hyperos' ? appInfo.hyperIcon : (State.iconPack === 'coloros' ? appInfo.colorIcon : null);
        const isImagePackClose = (State.iconPack === 'hyperos' || State.iconPack === 'coloros') && packIconClose;
        let iconInner;
        if (isImagePackClose) {
            let packColorClose = State.iconPack === 'hyperos' ? appInfo.hyperColor : appInfo.colorColor;
            iconLayer.style.background = packColorClose;
            iconLayer.style.flexDirection = 'column';
            iconLayer.style.alignItems = 'center';
            iconLayer.style.justifyContent = 'flex-start';
            iconInner = document.createElement('img');
            iconInner.src = packIconClose;
            iconInner.style.cssText = `width: 100%; height: auto; border-top-left-radius: inherit; border-top-right-radius: inherit; transform: scale(1.0); flex-shrink: 0; transition: transform ${0.50 * State.animationSpeed}s cubic-bezier(0.32, 0.72, 0, 1); outline:none; border:none; box-shadow:none;`;
            iconLayer.style.outline = 'none';
            iconLayer.style.border = 'none';
            iconLayer.appendChild(iconInner);
        } else if (appInfo.id === 'photos') {
            const bg = appInfo.color || comp.backgroundColor;
            iconLayer.style.background = bg || '#fff';
            iconLayer.innerHTML = `<div class="photos-icon-flower" style="transform: scale(1.8); scale: var(--icon-scale-factor); transition: transform ${0.50 * State.animationSpeed}s cubic-bezier(0.34, 1.15, 0.64, 1);"><div class="petal-wrap p1"><div class="petal"></div></div><div class="petal-wrap p2"><div class="petal"></div></div><div class="petal-wrap p3"><div class="petal"></div></div><div class="petal-wrap p4"><div class="petal"></div></div><div class="petal-wrap p5"><div class="petal"></div></div><div class="petal-wrap p6"><div class="petal"></div></div><div class="petal-wrap p7"><div class="petal"></div></div><div class="petal-wrap p8"><div class="petal"></div></div></div>`;
            iconLayer.style.outline = 'none';
            iconLayer.style.border = 'none';
        } else if (id.startsWith('empty_')) {
            iconLayer.style.background = '#888';
            iconLayer.style.outline = 'none';
            iconLayer.style.border = 'none';
        } else if (appInfo.id === 'settings') {
            const bg = appInfo.color || comp.backgroundColor;
            iconLayer.style.background = bg || '#8e8e93';
            iconLayer.innerHTML = `<div class="settings-icon-gear" style="transform: scale(2.05); scale: var(--icon-scale-factor); transition: transform ${0.50 * State.animationSpeed}s cubic-bezier(0.34, 1.15, 0.64, 1);">
                <div class="gear-base"></div>
                <div class="gear-teeth">
                    <div class="tooth"></div><div class="tooth"></div><div class="tooth"></div>
                    <div class="tooth"></div><div class="tooth"></div><div class="tooth"></div>
                </div>
                <div class="gear-inner-ring"></div>
                <div class="gear-spoke spoke-1"></div><div class="gear-spoke spoke-2"></div><div class="gear-spoke spoke-3"></div>
                <div class="gear-center-dot"></div>
            </div>`;
            iconLayer.style.outline = 'none';
            iconLayer.style.border = 'none';
        } else if (appInfo.id === 'camera') {
            iconLayer.style.background = 'linear-gradient(135deg, #fbfbfb 0%, #e8e8e8 50%, #d1d1d1 100%)';
            iconLayer.innerHTML = `<div class="camera-icon-lens" style="transform: scale(2.5); scale: var(--icon-scale-factor); transition: transform ${0.50 * State.animationSpeed}s cubic-bezier(0.34, 1.15, 0.64, 1);">
                <div class="camera-base"></div>
                <div class="lens-outer-ring"></div>
                <div class="lens-inner-black"></div>
                <div class="lens-core-glass"></div>
                <div class="lens-glare-1"></div>
                <div class="lens-glare-2"></div>
                <div class="flash-ring"><div class="flash-bulb"></div></div>
            </div>`;
            iconLayer.style.outline = 'none';
            iconLayer.style.border = 'none';
        } else if (appInfo.id === 'music') {
            iconLayer.style.background = '#fa2d48';
            iconLayer.innerHTML = `<div class="music-icon-note" style="transform: scale(2.0); scale: var(--icon-scale-factor); transition: transform ${0.50 * State.animationSpeed}s cubic-bezier(0.34, 1.15, 0.64, 1);">
                <div class="music-note">&#9834;</div>
                <div class="music-sparkles">
                    <div class="sparkle sparkle-lg" style="top:22%; right:2%;"></div>
                    <div class="sparkle sparkle-sm sparkle-green" style="top:55%; left:5%;"></div>
                    <div class="sparkle sparkle-xs sparkle-yellow" style="bottom:15%; left:22%;"></div>
                    <div class="sparkle sparkle-xs sparkle-orange" style="top:12%; right:22%;"></div>
                </div>
            </div>`;
            iconLayer.style.outline = 'none';
            iconLayer.style.border = 'none';
        } else if (appInfo.id === 'clock') {
            iconLayer.style.background = '#fff';
            const now = new Date();
            const hDeg = (now.getHours() % 12) * 30 + now.getMinutes() * 0.5 + now.getSeconds() * (0.5 / 60);
            const mDeg = now.getMinutes() * 6 + now.getSeconds() * 0.1;
            iconLayer.innerHTML = `<div class="clock-icon-face" style="transform: scale(2.0); scale: var(--icon-scale-factor); transition: transform ${0.50 * State.animationSpeed}s cubic-bezier(0.34, 1.15, 0.64, 1);">
                <div class="clock-dial"></div>
                <div class="clock-hand clock-hour" style="transform: rotate(${hDeg}deg);"></div>
                <div class="clock-hand clock-minute" style="transform: rotate(${mDeg}deg);"></div>
                <div class="clock-center-dot"></div>
            </div>`;
            iconLayer.style.outline = 'none';
            iconLayer.style.border = 'none';
        } else {
            const bg = appInfo.color || comp.backgroundColor;
            iconLayer.style.background = bg || '#000';
            iconInner = document.createElement('i');
            iconInner.className = `fas ${appInfo.icon}`;
            iconInner.style.cssText = `font-size: 28px; scale: var(--icon-scale-factor); color: ${appInfo.text || 'white'}; display: flex; align-items: center; justify-content: center; line-height: 1; width: 100%; height: 100%; transition: font-size ${0.50 * State.animationSpeed}s cubic-bezier(0.32, 0.72, 0, 1);`;

            const lowBg = (bg || "").toString().toLowerCase().trim();
            const isWhiteBg = lowBg === '#fff' || lowBg.startsWith('#ffffff') || lowBg === 'white' || lowBg.replace(/\s/g, '') === 'rgb(255,255,255)';
            const shadeColor = isWhiteBg ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)';
            const shade = document.createElement('div');
            shade.style.cssText = `position:absolute; inset:0; background: radial-gradient(circle at top right, ${shadeColor} 0%, transparent 70%); pointer-events:none; border-radius:inherit; z-index:10;`;
            iconLayer.appendChild(shade);
            iconLayer.style.outline = 'none';
            iconLayer.style.border = 'none';
            iconLayer.appendChild(iconInner);
        }
        iconLayer.style.outline = 'none';

        if (!morphToIsland) {
            closeClone.appendChild(iconLayer);
            closeClone.style.pointerEvents = 'none';
            homeScreen.appendChild(closeClone);
        } else {
            closeClone.style.pointerEvents = 'none';
            const screenEl = document.getElementById('screen');
            const screenRect = screenEl.getBoundingClientRect();
            const scaleFactor = document.fullscreenElement ? 1 : screenRect.width / screenEl.offsetWidth;
            closeClone.style.transform = `translate(${(winRect.left - screenRect.left) / scaleFactor}px, ${(winRect.top - screenRect.top) / scaleFactor}px)`;
            closeClone.style.width = `${winRect.width / scaleFactor}px`;
            closeClone.style.height = `${winRect.height / scaleFactor}px`;
            closeClone.style.zIndex = '3001';
            let miniContentHtml = '';
            if (id === 'music') {
                const track = Music.library[Music.currentIdx];
                const artStyle = track && track.art ? `background-image:url('${track.art}'); background-size:cover;` : 'background:#333;';
                miniContentHtml = `<div style="display:flex; align-items:center; width:100%; height:100%; padding:0 10px;">
                    <div style="width:24px; height:24px; border-radius:6px; flex-shrink:0; margin-right:10px; ${artStyle}"></div>
                    <div class="di-wave" style="margin-left:auto;">
                        <div class="bar"></div>
                        <div class="bar"></div>
                        <div class="bar"></div>
                    </div>
                </div>`;
            } else if (id === 'clock') {
                if (isSplit) {
                    miniContentHtml = `<div style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; color:#ff9f0a;">
                        <i class="fas fa-stopwatch" style="font-size:18px;"></i>
                    </div>`;
                } else {
                    const mins = Math.floor(Math.abs(Timer.time) / 60).toString();
                    const secs = (Math.abs(Timer.time) % 60).toString().padStart(2, '0');
                    miniContentHtml = `<div style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; color:#ff9f0a; gap:6px; font-size:12px;">
                        <i class="fas fa-stopwatch" style="font-size:11px;"></i>
                        <span id="di-morph-timer-val" style="font-family:monospace; font-weight:bold;">${mins}:${secs}</span>
                    </div>`;
                    if (AppManager.morphInterval) clearInterval(AppManager.morphInterval);
                    AppManager.morphInterval = setInterval(() => {
                        const el = document.getElementById('di-morph-timer-val');
                        if (el) {
                            const m = Math.floor(Math.abs(Timer.time) / 60);
                            const s = Math.abs(Timer.time) % 60;
                            el.innerText = `${m}:${s.toString().padStart(2, '0')}`;
                        }
                    }, 500);
                }
            }
            const miniOverlay = document.createElement('div');
            miniOverlay.className = 'di-mini-overlay';
            miniOverlay.style.cssText = 'position:absolute; inset:0; display:flex; align-items:center; justify-content:center; opacity:0; z-index:10002; pointer-events:none; transition:none;';
            miniOverlay.innerHTML = miniContentHtml;
            closeClone.appendChild(miniOverlay);
            screenEl.appendChild(closeClone);
        }


        win.style.display = 'none';
        win.classList.remove('closing', 'calc-app-bg');
        if (!morphToIsland) {
            AppManager.closingApps[id] = {
                clone: closeClone,
                iconFadeTimeout: null,
                closeTimeout: null
            };
        }
        void closeClone.offsetWidth;
        const totalDur = win.classList.contains('app-animating') ? 0.70 * State.animationSpeed : 0.60 * State.animationSpeed;
        const morphDur = totalDur * State.animConfig.closeShapeMorph;
        const iconFadeDur = morphDur * State.animConfig.closeIconFade;
        if (morphToIsland && islandMorphTarget) {
            const moveDur = 0.45;
            const startW = parseFloat(closeClone.style.width);
            const startH = parseFloat(closeClone.style.height);
            const startRadius = closeClone.style.borderRadius || '16px';
            const pillW = islandMorphTarget.w;
            const pillH = islandMorphTarget.h;
            const tMatch = closeClone.style.transform.match(/translate\(([\d.-]+)px,\s*([\d.-]+)px\)/);
            const startX = tMatch ? parseFloat(tMatch[1]) : 0;
            const startY = tMatch ? parseFloat(tMatch[2]) : 0;
            closeClone.style.outline = '0.5px solid rgba(149, 149, 149, 0.3)';
            closeClone.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
            closeClone.style.background = '#000';
            closeClone.style.overflow = 'hidden';
            const s = 0.35;
            const midX = startX + s * (islandMorphTarget.left - startX);
            const midY = startY + s * (islandMorphTarget.top - startY);
            const midW = startW + 0.95 * (pillW - startW);
            const midH = startH + 0.95 * (pillH - startH);

            closeClone.animate([
                {
                    transform: `translate(${startX}px, ${startY}px)`,
                    width: `${startW}px`, height: `${startH}px`,
                    borderRadius: startRadius,
                    offset: 0
                },
                {
                    transform: `translate(${midX}px, ${midY}px)`,
                    width: `${midW}px`, height: `${midH}px`,
                    borderRadius: islandMorphTarget.radius,
                    offset: s
                },
                {
                    transform: `translate(${islandMorphTarget.left}px, ${islandMorphTarget.top}px)`,
                    width: `${pillW}px`, height: `${pillH}px`,
                    borderRadius: islandMorphTarget.radius,
                    offset: 1
                }
            ], {
                duration: moveDur * 1000,
                easing: 'ease-in-out',
                fill: 'forwards'
            });

            if (State.animStyle === 'new' && homeScreen) {
                if (AppManager._currentOpenAnim) { try { AppManager._currentOpenAnim.cancel(); } catch (e) { } }
                if (AppManager._currentScaleAnim) { try { AppManager._currentScaleAnim.cancel(); } catch (e) { } }
            }


            if (contentEl) {
                contentEl.style.transition = `opacity 0.2s ease`;
                contentEl.style.opacity = '0';
                contentEl.style.width = '';
            }
            const headerEl = closeClone.querySelector('.app-header');
            const originalHeaderEl = win.querySelector('.app-header');

            if (headerEl) {
                headerEl.style.transition = `opacity 0.2s ease`;
                headerEl.style.opacity = '0';
            }
            const miniOverlay = closeClone.querySelector('.di-mini-overlay');
            if (miniOverlay) {
                setTimeout(() => {
                    miniOverlay.style.transition = `opacity 0.2s ease`;
                    miniOverlay.style.opacity = '1';
                }, 50);
            }
            if (iconEl) {
                if (State.activeApp !== id) {
                    iconEl.classList.remove('app-current');
                    const iconBox = iconEl.querySelector('.icon-box') || iconEl;
                    iconBox.style.transition = 'none';
                    iconBox.style.opacity = '';
                    iconBox.style.visibility = 'visible';
                }
            }
            const revealTime = moveDur * 900;
            setTimeout(() => {
                if (islandTargetEl) {
                    islandTargetEl.style.transition = '';
                    islandTargetEl.style.opacity = '';
                }
                const secEl = document.getElementById('dynamic-island-sec');
                if (isSplit && secEl) {
                    secEl.style.transition = 'none';
                    secEl.style.transform = 'translateX(-50%) scale(0.8)';
                    secEl.style.opacity = '0';
                    void secEl.offsetWidth;
                    secEl.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease';
                    secEl.style.transform = '';
                    secEl.style.opacity = '1';
                    setTimeout(() => {
                        secEl.style.transition = '';
                    }, 400);
                }
                Island.isMorphing = false;
                closeClone.style.transition = 'opacity 0.1s';
                closeClone.style.pointerEvents = 'none';
                closeClone.style.opacity = '0';
                setTimeout(() => {
                    closeClone.remove();
                }, 150);
                if (AppManager.morphInterval) {
                    clearInterval(AppManager.morphInterval);
                    AppManager.morphInterval = null;
                }
            }, revealTime);

            setTimeout(() => {
                Island.isMorphing = false;
            }, revealTime + 300);
        } else {
            const ease = 'cubic-bezier(' + (State.animConfig.closeBezier || [0.15, 1.01, 0.3, 1.02]).join(', ') + ')';
            if (iconLayer) {
                iconLayer.style.transition = 'none';
                iconLayer.animate([
                    { opacity: startIconOpacity !== null && startIconOpacity !== undefined ? startIconOpacity : 0 },
                    { opacity: 1 }
                ], { duration: morphDur * State.animConfig.closeIconFade * 1000, easing: 'ease', fill: 'forwards' });
                const fIcon = iconLayer.querySelector('.photos-icon-flower') || iconLayer.querySelector('.settings-icon-gear') || iconLayer.querySelector('.camera-icon-lens') || iconLayer.querySelector('.music-icon-note') || iconLayer.querySelector('.clock-icon-face');
                if (fIcon) {
                    if (fIcon.classList.contains('settings-icon-gear')) {
                        fIcon.style.transition = `transform ${totalDur * 0.7}s cubic-bezier(0.2, 0.6, 0.1, 1)`;
                        fIcon.style.transform = 'scale(1.15) rotate(360deg)';
                    } else if (fIcon.classList.contains('camera-icon-lens')) {
                        fIcon.style.transform = 'scale(1.39)';
                    } else if (fIcon.classList.contains('photos-icon-flower')) {
                        fIcon.style.transition = `transform ${totalDur * 0.7}s cubic-bezier(0.2, 0.6, 0.1, 1)`;
                        fIcon.style.transform = 'scale(1) rotate(360deg)';
                    } else if (fIcon.classList.contains('music-icon-note')) {
                        fIcon.style.transition = `transform ${totalDur * 0.7}s cubic-bezier(0.2, 0.6, 0.1, 1)`;
                        fIcon.style.transform = 'scale(1.0)';
                        const noteEl = fIcon.querySelector('.music-note');
                        if (noteEl) {
                            noteEl.style.transition = `transform ${totalDur * 0.5}s cubic-bezier(0.34, 1.56, 0.64, 1)`;
                            noteEl.style.transform = 'scale(1.15)';
                            setTimeout(() => { noteEl.style.transform = 'scale(1.0)'; }, totalDur * 500);
                        }
                        const sparklesEl = fIcon.querySelector('.music-sparkles');
                        if (sparklesEl) {
                            sparklesEl.style.transition = `transform ${totalDur * 0.7}s cubic-bezier(0.2, 0.6, 0.1, 1)`;
                            sparklesEl.style.transform = 'rotate(360deg)';
                        }
                    } else if (fIcon.classList.contains('clock-icon-face')) {
                        fIcon.style.transition = `transform ${totalDur * 0.7}s cubic-bezier(0.2, 0.6, 0.1, 1)`;
                        fIcon.style.transform = 'scale(1.0)';
                        const hourHand = fIcon.querySelector('.clock-hour');
                        const minHand = fIcon.querySelector('.clock-minute');
                        if (hourHand) { hourHand.style.transition = `transform ${totalDur * 0.7}s cubic-bezier(0.2, 0.6, 0.1, 1)`; hourHand.style.transform = `rotate(${parseFloat(hourHand.style.transform.replace(/[^0-9.-]/g, '')) + 360}deg)`; }
                        if (minHand) { minHand.style.transition = `transform ${totalDur * 0.7}s cubic-bezier(0.2, 0.6, 0.1, 1)`; minHand.style.transform = `rotate(${parseFloat(minHand.style.transform.replace(/[^0-9.-]/g, '')) + 720}deg)`; }
                    } else {
                        fIcon.style.transform = 'scale(0.96)';
                    }
                }
            }
            const contentFadeDur = totalDur * 0.15;

            const closeAnimEase = 'cubic-bezier(' + (State.animConfig.closeBezier || [0.15, 1.01, 0.3, 1.02]).join(', ') + ')';

            closeClone.style.transition = 'none';
            closeClone.style.backgroundColor = computedBg;
            const currentOp = window.getComputedStyle(closeClone).opacity || 1;

            const posAnimClose = closeClone.animate([
                { transform: `translate(${startLeftHome}px, ${startTopHome}px)`, opacity: currentOp },
                { transform: `translate(${endLeft}px, ${endTop}px)`, opacity: currentOp }
            ], {
                duration: totalDur * 0.70 * 1000,
                easing: closeAnimEase,
                fill: 'forwards'
            });

            let finalRadius = (endW * (parseFloat(OS.getShapeRadius()) / 100)) + 'px';
            if (parseInt(State.appShape) >= 45) {
                finalRadius = (Math.min(endW, endH) / 2) + 'px';
            }

            const shapeAnimClose = closeClone.animate([
                { width: `${startW}px`, height: `${startH}px`, borderRadius: curRadius },
                { width: `${endW}px`, height: `${endH}px`, borderRadius: finalRadius }
            ], {
                duration: morphDur * 1000,
                easing: ease,
                fill: 'forwards'
            });

            const bgAnimClose = closeClone.animate([
                { backgroundColor: computedBg },
                { backgroundColor: 'transparent' }
            ], {
                duration: 0,
                delay: iconFadeDur * 1000,
                fill: 'forwards'
            });

            closeClone._posAnim = posAnimClose;
            closeClone._shapeAnim = shapeAnimClose;

            const closeTargetZoom = endW / document.getElementById('screen').offsetWidth;

            const contentElClone = closeClone.querySelector('.app-content') || closeClone.querySelector('#app-body');
            if (contentElClone) {
                contentElClone.style.transition = 'none';
                contentElClone.animate([
                    { opacity: 1 },
                    { opacity: 0 }
                ], { duration: contentFadeDur * 1000, easing: 'ease', fill: 'forwards' });
            }
            const headerElClone2 = closeClone.querySelector('#app-header') || closeClone.querySelector('.app-header');
            if (headerElClone2) {
                headerElClone2.style.transition = 'none';
                headerElClone2.animate([
                    { opacity: 1 },
                    { opacity: 0 }
                ], { duration: contentFadeDur * 1000, easing: 'ease', fill: 'forwards' });
            }

            closeClone._syncZoomState = { active: true };
            const scrWNum = document.getElementById('screen').offsetWidth;
            const scrScaleEl = document.getElementById('scale-wrapper');
            const updateCloseZ = () => {
                if (!closeClone._syncZoomState.active) return;
                const z = closeClone.offsetWidth / scrWNum;
                if (contentElClone) contentElClone.style.zoom = z;
                if (headerElClone2) headerElClone2.style.zoom = z;
                requestAnimationFrame(updateCloseZ);
            };
            requestAnimationFrame(updateCloseZ);

            setTimeout(() => {
                if (closeClone._syncZoomState) { closeClone._syncZoomState.active = false; }
            }, morphDur * 1000 + 50);

            OS.updateStatusBarColors(false, false, false);

            if (State.animStyle === 'new' && homeScreen) {
                if (win._syncZoomState) { win._syncZoomState.active = false; }
                if (AppManager._currentOpenAnim) { try { AppManager._currentOpenAnim.cancel(); } catch (e) { } }
                if (AppManager._currentScaleAnim) { try { AppManager._currentScaleAnim.cancel(); } catch (e) { } }
                if (AppManager._cloneReopenWinAnim) { try { AppManager._cloneReopenWinAnim.cancel(); } catch (e) { } AppManager._cloneReopenWinAnim = null; }
                if (win.getAnimations) { win.getAnimations().forEach(function (a) { try { a.cancel(); } catch (e) { } }); }
                const ahClear = document.getElementById('app-header');
                const abClear = document.getElementById('app-body');
                if (ahClear) ahClear.style.zoom = '';
                if (abClear) abClear.style.zoom = '';
            }


        }
        if (!morphToIsland && isImagePackClose && iconInner) {
            let shapePctClip = parseFloat(OS.getShapeRadius()) / 100;
            let clipRadius = (endW * shapePctClip) + 'px';
            if (parseInt(State.appShape) >= 45) {
                clipRadius = (Math.min(endW, endH) / 2) + 'px';
            }
            let clipPath = `inset(0 round ${clipRadius})`;

            closeClone.style.clipPath = clipPath;
            closeClone.style.webkitClipPath = clipPath;
        }
        setTimeout(() => {
            if (!State.activeApp) {
                document.body.classList.remove('app-open');
                document.body.classList.remove('fade-app-boxes');
                if (State.homescreenBlur) document.body.classList.add('hs-blur');
            }
            if (typeof Island !== 'undefined' && !morphToIsland) Island.update();
        }, 50);
        if (State.animStyle === 'new' && homeScreen) {
            const currentScale = window.getComputedStyle(homeScreen).transform;
            let matrixScale = 1;
            if (currentScale && currentScale !== 'none') {
                const vals = currentScale.match(/matrix\((.+)\)/);
                if (vals) matrixScale = parseFloat(vals[1].split(',')[0]);
            }
            if (homeScreen._zoomAnim) homeScreen._zoomAnim.cancel();

            homeScreen._zoomAnim = homeScreen.animate([
                { transform: `scale(${matrixScale})` },
                { transform: `scale(1)` }
            ], {
                duration: 500,
                easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
                fill: 'forwards'
            });
        }
        if (iconEl && !morphToIsland) {
            const timeoutDur = Math.max(0, totalDur * 900 * 0.70);
            if (AppManager.closingApps[id]) {
                AppManager.closingApps[id].iconFadeTimeout = setTimeout(() => {
                    iconEl.classList.remove('app-current');
                    const iconBox = iconEl.querySelector('.icon-box') || iconEl;
                    iconBox.style.transition = '';
                    iconBox.style.opacity = '';
                    iconBox.style.visibility = '';
                    if (id === 'clock') {
                        const clockFace = iconEl.querySelector('.clock-icon-face');
                        if (clockFace) {
                            const n = new Date();
                            const h = (n.getHours() % 12) * 30 + n.getMinutes() * 0.5 + n.getSeconds() * (0.5 / 60);
                            const m = n.getMinutes() * 6 + n.getSeconds() * 0.1;
                            const hh = clockFace.querySelector('.clock-hour');
                            const mm = clockFace.querySelector('.clock-minute');
                            if (hh) hh.style.transform = `rotate(${h}deg)`;
                            if (mm) mm.style.transform = `rotate(${m}deg)`;
                        }
                    }
                }, timeoutDur);
            }
        }
        if (AppManager.closingApps[id]) {
            AppManager.closingApps[id].closeTimeout = setTimeout(() => {
                if (closeClone && closeClone.parentNode) closeClone.remove();
                if (AppManager.closingApps[id]) delete AppManager.closingApps[id];
                if (Object.keys(AppManager.closingApps).length === 0) {
                    document.body.classList.remove('closing-active');
                }
                if (typeof Island !== 'undefined') Island.update();
                State.isAnimating = false;
                document.body.classList.remove('dark-bar');
                if (State.darkMode) {
                    document.querySelector('.home-bar').style.backgroundColor = 'rgba(255,255,255,0.4)';
                } else {
                    document.querySelector('.home-bar').style.backgroundColor = '#000';
                }
                document.querySelector('.home-bar').style.backgroundColor = '';

                if (morphToIsland && iconEl) {
                    const iconBox = iconEl.querySelector('.icon-box') || iconEl;
                    iconBox.style.transition = '';
                    iconBox.style.opacity = '';
                    iconBox.style.visibility = '';
                }
            }, Math.max(500 * State.animationSpeed, iconFadeDur * 1000 + 100));
        }
    }
};
