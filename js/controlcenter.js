const ControlCenter = {
    isOpen: false,
    _closeTimer: null,
    _openTimer: null,
    init: () => {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'e' || e.key === 'E') {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                if (!State.poweredOn || State.locked) return;
                e.preventDefault();
                ControlCenter.toggle();
            }
        });
        const screen = document.getElementById('screen');
        let ccStartY = 0;
        let ccTracking = false;
        let ccStartIsOpen = false;
        let ccHasMoved = false;

        const updateCCProgress = (diff, isRelease = false) => {
            let progress = 0;
            if (ccStartIsOpen) {
                progress = 1 + (diff / 300);
            } else {
                const maxPull = 300;
                progress = diff / maxPull;
            }
            progress = Math.max(0, Math.min(1, progress));

            const overlay = document.getElementById('cc-overlay');
            const panel = document.getElementById('cc-panel');
            const statusBar = document.querySelector('.status-bar');
            const clock = statusBar ? statusBar.querySelector('#clock') : null;
            const globalClock = document.getElementById('global-clock');

            if (!isRelease) {
                if (!document.body.classList.contains('cc-open')) {
                    if (ControlCenter._closeTimer) { clearTimeout(ControlCenter._closeTimer); ControlCenter._closeTimer = null; }
                    document.body.classList.add('cc-open');
                }

                overlay.style.transition = 'none';
                if (statusBar) statusBar.style.transition = 'none';
                if (globalClock) globalClock.style.transition = 'none';
                if (clock) clock.style.transition = 'none';

                if (progress > 0.96 && !ControlCenter.isOpen) {
                    ControlCenter.isOpen = true;
                    ControlCenter._animVersion = (ControlCenter._animVersion || 0) + 1;
                    if (ControlCenter._closeTimer) { clearTimeout(ControlCenter._closeTimer); ControlCenter._closeTimer = null; }
                    if (panel) { panel.classList.remove('cc-closing'); panel.classList.add('cc-visible'); }
                    overlay.classList.add('cc-visible');
                }

                if (progress < 0.97 && ControlCenter.isOpen) {
                    ControlCenter.isOpen = false;
                    ControlCenter._animVersion = (ControlCenter._animVersion || 0) + 1;
                    if (panel) { panel.classList.add('cc-closing'); }
                    overlay.classList.remove('cc-visible');
                }

                if (document.body.classList.contains('lite-mode')) {
                    overlay.style.backdropFilter = 'none';
                    overlay.style.webkitBackdropFilter = 'none';
                    overlay.style.backgroundColor = `rgba(111, 111, 111, ${progress})`;
                } else {
                    overlay.style.backdropFilter = `blur(${progress * 45}px)`;
                    overlay.style.webkitBackdropFilter = `blur(${progress * 45}px)`;
                    overlay.style.backgroundColor = `rgba(0, 0, 0, ${progress * 0.55})`;
                }
                if (globalClock) globalClock.style.opacity = '0';
                if (statusBar) {
                    statusBar.style.transform = `translateY(${progress * 40}px)`;
                    statusBar.style.zIndex = '2500';
                }
                if (clock) clock.style.opacity = '1';
            } else {
                const ease = '0.45s cubic-bezier(0.2, 0.85, 0.1, 1)';
                overlay.style.transition = '';
                if (statusBar) {
                    statusBar.style.transition = `transform ${ease}`;
                    void statusBar.offsetHeight;
                }
                if (globalClock) globalClock.style.transition = 'opacity 0.2s ease';
                if (clock) clock.style.transition = 'opacity 0.2s ease';

                if (ControlCenter.isOpen) {
                    overlay.style.backdropFilter = '';
                    overlay.style.webkitBackdropFilter = '';
                    overlay.style.backgroundColor = '';
                    if (globalClock) globalClock.style.opacity = '0';
                    if (statusBar) {
                        statusBar.style.transform = 'translateY(40px)';
                        statusBar.style.pointerEvents = 'none';
                    }
                    if (clock) clock.style.opacity = '1';
                    ControlCenter.syncState();
                } else {
                    overlay.style.transition = 'backdrop-filter 0.35s ease, background-color 0.35s ease, -webkit-backdrop-filter 0.35s ease';
                    void overlay.offsetHeight;
                    overlay.style.backdropFilter = '';
                    overlay.style.webkitBackdropFilter = '';
                    overlay.style.backgroundColor = '';
                    if (globalClock) globalClock.style.opacity = '';
                    if (statusBar) {
                        statusBar.style.transform = '';
                        statusBar.style.pointerEvents = '';
                        const ver = ControlCenter._animVersion;
                        const onDone = (e) => {
                            if (e.propertyName !== 'transform') return;
                            statusBar.removeEventListener('transitionend', onDone);
                            if (ver !== ControlCenter._animVersion) return;
                            if (clock) { clock.style.transition = 'none'; clock.style.opacity = ''; }
                            if (globalClock) { globalClock.style.transition = 'none'; globalClock.style.opacity = ''; }
                            statusBar.style.transition = '';
                            statusBar.style.zIndex = '';
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    if (ver !== ControlCenter._animVersion) return;
                                    if (clock) clock.style.transition = '';
                                    if (globalClock) globalClock.style.transition = '';
                                });
                            });
                        };
                        statusBar.addEventListener('transitionend', onDone);
                    }
                    if (clock) clock.style.opacity = '';
                    document.body.classList.remove('cc-open');
                    ControlCenter._closeTimer = setTimeout(() => {
                        if (panel) { panel.classList.remove('cc-visible', 'cc-closing'); }
                        overlay.style.backdropFilter = '';
                        overlay.style.webkitBackdropFilter = '';
                        overlay.style.backgroundColor = '';
                        overlay.style.transition = '';
                        ControlCenter._closeTimer = null;
                    }, 550);
                }
            }
        };

        screen.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const rect = screen.getBoundingClientRect();
            const scaleFactor = document.fullscreenElement ? 1 : rect.width / (State.devWidth || 400);
            const localX = (touch.clientX - rect.left) / scaleFactor;
            const localY = (touch.clientY - rect.top) / scaleFactor;
            
            if (!State.locked && State.poweredOn) {
                if (!ControlCenter.isOpen && localX > 200 && localY < 50) {
                    ccStartY = touch.clientY;
                    ccTracking = true;
                    ccStartIsOpen = false;
                    ccHasMoved = false;
                } else if (ControlCenter.isOpen) {
                    if (e.target.closest('.cc-slider-tile')) return;
                    ccStartY = touch.clientY;
                    ccTracking = true;
                    ccStartIsOpen = true;
                    ccHasMoved = false;
                }
            }
        }, { passive: true });

        screen.addEventListener('touchmove', (e) => {
            if (!ccTracking) return;
            let diff = e.touches[0].clientY - ccStartY;
            if (ccStartIsOpen) {
                if (!ccHasMoved && Math.abs(diff) < 10) return;
                ccHasMoved = true;
                if (e.cancelable) e.preventDefault();
                updateCCProgress(diff);
            } else if (diff > 0) {
                if (e.cancelable) e.preventDefault();
                updateCCProgress(diff);
            }
        }, { passive: false });

        screen.addEventListener('touchend', (e) => {
            if (!ccTracking) return;
            const diff = e.changedTouches[0].clientY - ccStartY;
            if (ccStartIsOpen && !ccHasMoved) {
                ccTracking = false;
                return;
            }
            updateCCProgress(diff, true);
            ccTracking = false;
        });

        const ccPanel = document.getElementById('cc-panel');
        if (ccPanel) {
            let panelDragStartY = 0;
            let panelDragging = false;
            let panelHasMoved = false;
            
            ccPanel.addEventListener('mousedown', (e) => {
                if (!State.locked && State.poweredOn && ControlCenter.isOpen) {
                    if (e.target.closest('.cc-slider-tile')) return;
                    panelDragStartY = e.clientY;
                    panelDragging = true;
                    panelHasMoved = false;
                    ccStartIsOpen = true;
                }
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!panelDragging) return;
                let diff = e.clientY - panelDragStartY;
                if (!panelHasMoved && Math.abs(diff) < 10) return;
                panelHasMoved = true;
                if (e.buttons !== 1) {
                    panelDragging = false;
                    updateCCProgress(diff, true);
                    return;
                }
                updateCCProgress(diff);
            });
            
            document.addEventListener('mouseup', (e) => {
                if (panelDragging) {
                    panelDragging = false;
                    if (!panelHasMoved) return;
                    const diff = e.clientY - panelDragStartY;
                    updateCCProgress(diff, true);
                }
            });
        }

        const statusBar = document.querySelector('.status-bar');
        if (statusBar) {
            const rightArea = statusBar.querySelector('div');
            if (rightArea) {
                rightArea.style.pointerEvents = 'auto';
                rightArea.style.cursor = 'grab';
                let dragStartY = 0;
                let dragging = false;
                rightArea.addEventListener('mousedown', (e) => {
                    if (!State.locked && State.poweredOn && (!ControlCenter.isOpen || (ControlCenter.isOpen && e.clientY < 90))) {
                        dragStartY = e.clientY;
                        dragging = true;
                        ccStartIsOpen = ControlCenter.isOpen;
                        rightArea.style.cursor = 'grabbing';
                        e.preventDefault();
                        e.stopPropagation();
                    }
                });
                document.addEventListener('mousemove', (e) => {
                    if (!dragging) return;
                    if (e.buttons !== 1) {
                        dragging = false;
                        rightArea.style.cursor = 'grab';
                        const diff = e.clientY - dragStartY;
                        updateCCProgress(diff, true);
                        return;
                    }
                    let diff = e.clientY - dragStartY;
                    updateCCProgress(diff);
                });
                document.addEventListener('mouseup', (e) => {
                    if (dragging) {
                        const diff = e.clientY - dragStartY;
                        updateCCProgress(diff, true);
                        dragging = false;
                        rightArea.style.cursor = 'grab';
                    }
                });
                rightArea.addEventListener('wheel', (e) => {
                    if (!State.locked && State.poweredOn && e.deltaY > 0 && !ControlCenter.isOpen) {
                        e.preventDefault();
                        e.stopPropagation();
                        ControlCenter.open();
                    }
                }, { passive: false });
            }
        }
        ControlCenter.bindVerticalSliders();
    },
    bindVerticalSliders: () => {
        document.querySelectorAll('.cc-slider-tile').forEach((tile) => {
            if (tile.dataset.ccBound) return;
            tile.dataset.ccBound = '1';
            const input = tile.querySelector('.cc-vslider');
            if (!input) return;
            let dragging = false;
            const syncFromY = (clientY) => {
                const r = tile.getBoundingClientRect();
                const h = r.height || 1;
                const min = parseInt(input.min, 10);
                const max = parseInt(input.max, 10);
                const ratio = 1 - (clientY - r.top) / h;
                const v = Math.round(min + Math.max(0, Math.min(1, ratio)) * (max - min));
                input.value = String(v);
                if (input.id === 'cc-brightness') ControlCenter.setBrightness(v);
                else if (input.id === 'cc-volume') ControlCenter.setVolume(v);
            };
            tile.addEventListener('pointerdown', (e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                e.stopPropagation();
                dragging = true;
                tile.setPointerCapture(e.pointerId);
                tile.classList.add('cc-slider-dragging');
                const panel = document.getElementById('cc-panel');
                if (panel) panel.style.overflowY = 'hidden';
                syncFromY(e.clientY);
            });
            tile.addEventListener('pointermove', (e) => {
                if (!dragging) return;
                e.preventDefault();
                syncFromY(e.clientY);
            });
            const endDrag = (e) => {
                if (!dragging) return;
                dragging = false;
                tile.classList.remove('cc-slider-dragging');
                const panel = document.getElementById('cc-panel');
                if (panel) panel.style.overflowY = '';
            };
            tile.addEventListener('pointerup', endDrag);
            tile.addEventListener('pointercancel', endDrag);
        });
    },
    toggle: () => {
        if (ControlCenter.isOpen) ControlCenter.close();
        else ControlCenter.open();
    },
    open: (fromDrag = false) => {
        if (!State.poweredOn || State.locked) return;
        if (ControlCenter._closeTimer) { clearTimeout(ControlCenter._closeTimer); ControlCenter._closeTimer = null; }
        ControlCenter._animVersion = (ControlCenter._animVersion || 0) + 1;
        ControlCenter.isOpen = true;
        ControlCenter.syncState();
        const overlay = document.getElementById('cc-overlay');
        const panel = document.getElementById('cc-panel');
        const statusBar = document.querySelector('.status-bar');
        const clock = statusBar ? statusBar.querySelector('#clock') : null;
        const globalClock = document.getElementById('global-clock');
        document.body.classList.add('cc-open');
        panel.classList.remove('cc-closing');
        overlay.classList.add('cc-visible');
        panel.classList.add('cc-visible');
        if (!fromDrag) {
            if (globalClock) { globalClock.style.transition = 'none'; globalClock.style.opacity = '0'; }
            if (statusBar) {
                statusBar.style.transition = 'transform 0.45s cubic-bezier(0.2, 0.85, 0.1, 1)';
                void statusBar.offsetHeight;
                statusBar.style.transform = 'translateY(40px)';
                statusBar.style.zIndex = '2500';
                statusBar.style.pointerEvents = 'none';
            }
            if (clock) { clock.style.transition = 'none'; clock.style.opacity = '1'; }
        } else {
            if (statusBar) {
                statusBar.style.zIndex = '2500';
                statusBar.style.pointerEvents = 'none';
            }
        }
    },
    close: (fromDrag = false) => {
        if (!ControlCenter.isOpen) return;
        ControlCenter.isOpen = false;
        ControlCenter._animVersion = (ControlCenter._animVersion || 0) + 1;
        const ver = ControlCenter._animVersion;
        const overlay = document.getElementById('cc-overlay');
        const panel = document.getElementById('cc-panel');
        const statusBar = document.querySelector('.status-bar');
        const clock = statusBar ? statusBar.querySelector('#clock') : null;
        const globalClock = document.getElementById('global-clock');
        panel.classList.add('cc-closing');
        overlay.classList.remove('cc-visible');
        document.body.classList.remove('cc-open');
        if (statusBar) {
            if (!fromDrag) {
                statusBar.style.transition = 'transform 0.45s cubic-bezier(0.2, 0.85, 0.1, 1)';
                void statusBar.offsetHeight;
                statusBar.style.transform = '';
            }
            statusBar.style.pointerEvents = '';
            const onDone = (e) => {
                if (e.propertyName !== 'transform') return;
                statusBar.removeEventListener('transitionend', onDone);
                if (ver !== ControlCenter._animVersion) return;
                statusBar.style.transition = '';
                statusBar.style.zIndex = '';
                if (clock) { clock.style.transition = ''; clock.style.opacity = ''; }
                if (globalClock) { globalClock.style.transition = ''; globalClock.style.opacity = ''; }
            };
            statusBar.addEventListener('transitionend', onDone);
        }
        ControlCenter._closeTimer = setTimeout(() => {
            if (ver !== ControlCenter._animVersion) return;
            panel.classList.remove('cc-visible');
            panel.classList.remove('cc-closing');
            ControlCenter._closeTimer = null;
        }, 550);
    },
    forceClose: () => {
        ControlCenter.isOpen = false;
        ControlCenter._animVersion = (ControlCenter._animVersion || 0) + 1;
        if (ControlCenter._closeTimer) { clearTimeout(ControlCenter._closeTimer); ControlCenter._closeTimer = null; }
        const overlay = document.getElementById('cc-overlay');
        const panel = document.getElementById('cc-panel');
        const statusBar = document.querySelector('.status-bar');
        const clock = statusBar ? statusBar.querySelector('#clock') : null;
        const globalClock = document.getElementById('global-clock');
        document.body.classList.remove('cc-open');
        overlay.classList.remove('cc-visible');
        panel.classList.remove('cc-visible');
        panel.classList.remove('cc-closing');
        if (statusBar) { statusBar.style.transition = ''; statusBar.style.transform = ''; statusBar.style.zIndex = ''; statusBar.style.pointerEvents = ''; }
        if (clock) { clock.style.transition = ''; clock.style.opacity = ''; }
        if (globalClock) { globalClock.style.transition = ''; globalClock.style.opacity = ''; }
    },
    syncState: () => {
        const ccBright = document.getElementById('cc-brightness');
        if (ccBright) {
            ccBright.value = State.brightness || 100;
            const bMin = parseInt(ccBright.min), bMax = parseInt(ccBright.max);
            const bPct = ((ccBright.value - bMin) / (bMax - bMin)) * 100;
            ccBright.closest('.cc-slider-tile').style.setProperty('--fill', bPct + '%');
        }
        const ccVol = document.getElementById('cc-volume');
        if (ccVol && typeof Music !== 'undefined' && Music.audio) {
            ccVol.value = Math.round(Music.audio.volume * 100);
            const vMin = parseInt(ccVol.min), vMax = parseInt(ccVol.max);
            const vPct = ((ccVol.value - vMin) / (vMax - vMin)) * 100;
            ccVol.closest('.cc-slider-tile').style.setProperty('--fill', vPct + '%');
        }
        const ccTitle = document.getElementById('cc-media-title');
        const ccArtist = document.getElementById('cc-media-artist');
        const ccArt = document.getElementById('cc-media-art');
        const ccPlayBtn = document.getElementById('cc-play-btn');
        if (typeof Music !== 'undefined' && Music.active && Music.library && Music.library.length > 0) {
            const current = Music.library[Music.currentIdx] || {};
            if (ccTitle) ccTitle.textContent = current.title || 'Unknown';
            if (ccArtist) ccArtist.textContent = current.artist || 'Unknown Artist';
            if (ccArt) ccArt.style.backgroundImage = current.art ? `url('${current.art}')` : '';
            if (ccPlayBtn) ccPlayBtn.className = Music.audio && !Music.audio.paused ? 'fas fa-pause' : 'fas fa-play';
        } else {
            if (ccTitle) ccTitle.textContent = 'Not Playing';
            if (ccArtist) ccArtist.textContent = '';
            if (ccArt) ccArt.style.backgroundImage = '';
            if (ccPlayBtn) ccPlayBtn.className = 'fas fa-play';
        }
    },
    setBrightness: (v) => {
        State.brightness = parseInt(v);
        document.getElementById('brightness-layer').style.opacity = (100 - State.brightness) / 100;
        const el = document.getElementById('cc-brightness');
        if (el) {
            const min = parseInt(el.min), max = parseInt(el.max);
            el.closest('.cc-slider-tile').style.setProperty('--fill', (((v - min) / (max - min)) * 100) + '%');
        }
        const sun = document.getElementById('cc-sun-icon');
        if (sun) {
            sun.style.transform = `rotate(${v * 2}deg)`;
        }
        Storage.saveSettings();
    },
    setVolume: (v) => {
        if (typeof Music !== 'undefined' && Music.audio) {
            Music.audio.volume = parseInt(v) / 100;
        }
        const el = document.getElementById('cc-volume');
        if (el) {
            const min = parseInt(el.min), max = parseInt(el.max);
            el.closest('.cc-slider-tile').style.setProperty('--fill', (((v - min) / (max - min)) * 100) + '%');
        }
    },
    toggleVisual: (el) => {
        el.classList.toggle('active');
        const circles = Array.from(document.querySelectorAll('.cc-circle'));
        State.ccToggles = State.ccToggles || {};
        State.ccToggles.circles = circles.map(e => e.classList.contains('active'));
        Storage.saveSettings();
    },
    toggleTile: (el) => {
        el.classList.toggle('active');
        const tiles = Array.from(document.querySelectorAll('.cc-tile[onclick^="ControlCenter.toggleTile"]'));
        State.ccToggles = State.ccToggles || {};
        State.ccToggles.tiles = tiles.map(e => e.classList.contains('active'));
        Storage.saveSettings();
    }
};
