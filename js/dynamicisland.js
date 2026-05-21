const Island = {
    expanded: null, unlockTimer: null,
    renderIdle: () => {
        document.getElementById('view-idle').innerHTML = '';
    },
    update: () => {
        const island = document.getElementById('dynamic-island');
        const wrapper = document.getElementById('island-wrap');
        const device = document.getElementById('device');
        const views = document.querySelectorAll('.di-view');
        const sec = document.getElementById('dynamic-island-sec');
        const wasMusicExpanded = wrapper.classList.contains('music-expanded');
        const wasTimerExpanded = wrapper.classList.contains('timer-expanded');
        island.className = ''; wrapper.className = '';
        if (State.islandColor) {
            if (State.islandColor.includes('gradient') || State.islandColor === 'rainbow') {
                if (State.islandColor === 'rainbow') island.classList.add('island-rainbow');
                else island.classList.add('island-purple-grad');
            }
        }
        if (device) device.classList.remove('di-expanded-global');
        if (wasMusicExpanded) wrapper.classList.add('music-expanded');
        if (wasTimerExpanded) wrapper.classList.add('timer-expanded');
        if (device) device.classList.remove('di-expanded-global');
        const bgBlur = document.getElementById('di-bg-blur');
        if (bgBlur) bgBlur.style.opacity = '0';
        island.classList.remove('has-aura');
        if (State.musicGradient && Island.expanded === 'music') {
            const track = Music.library[Music.currentIdx];
            if (track && track.art) {
                island.classList.add('has-aura');
                Island.extractAlbumColor(track.art, (color) => {
                    island.style.setProperty('--aura-color', color);
                });
            }
        }
        if (Island.expanded) {
            if (device) device.classList.add('di-expanded-global');
            const isSplit = (Music.active && !Music.audio.paused) && (Timer.running || Timer.finished || (Timer.paused && (Island.expanded === 'timer' || Island.expanded === 'timerDone')));
            const isSplitWithPausedMusic = (Music.active && Music.audio.paused && Island.expanded === 'music') && (Timer.running || Timer.finished);
            if (isSplit || isSplitWithPausedMusic) {
                wrapper.classList.add('split');
                sec.style.display = 'flex';
            } else {
                wrapper.classList.add('main-expanded');
            }
            if (Island.expanded === 'unlocked') {
                if (Music.active || Timer.running || Timer.finished) wrapper.classList.remove('main-expanded'); else island.classList.add('expanded-unlock');
                views.forEach(v => v.classList.remove('active'));
                document.getElementById('view-unlocked').classList.add('active');
            } else {
                views.forEach(v => v.classList.remove('active'));
                if (Island.expanded === 'notify') {
                    island.classList.add('expanded', 'notify');
                    document.getElementById('view-notify').classList.add('active');
                    if ((isSplit || isSplitWithPausedMusic) && sec) {
                        wrapper.classList.add('split');
                        sec.style.display = 'flex';
                    }
                } else if (isSplit || isSplitWithPausedMusic) {
                    if (Island.expanded === 'music') {
                        island.classList.add('expanded');
                        document.getElementById('view-music-exp').classList.add('active');
                    } else if (Island.expanded === 'timer' || Island.expanded === 'timerDone') {
                        document.getElementById('view-music-mini').classList.add('active');
                    }
                } else {
                    island.classList.add('expanded');
                    if (Island.expanded === 'music') document.getElementById('view-music-exp').classList.add('active');
                    else if (Island.expanded === 'timer') { island.classList.add('timer-mode'); document.getElementById('view-timer-exp').classList.add('active'); }
                    else if (Island.expanded === 'timerDone') { island.classList.add('notify'); document.getElementById('view-timer-done').classList.add('active'); }
                }
            }
            return;
        }
        const musicAppOpen = State.activeApp === 'music' && !AppManager.closingApps['music'];
        const clockAppOpen = State.activeApp === 'clock' && !AppManager.closingApps['clock'];
        if ((!Music.active || Music.audio.paused || musicAppOpen) && !Timer.running && !Timer.finished && !Island.expanded) island.classList.add('punch-hole');
        const showMusic = Music.active && !Music.audio.paused && !musicAppOpen;
        const showTimer = (Timer.running || Timer.finished) && !clockAppOpen;
        views.forEach(v => v.classList.remove('active'));
        if (showMusic && showTimer) {
            wrapper.classList.add('split');
            document.getElementById('view-music-mini').classList.add('active');
            document.getElementById('dynamic-island-sec').style.display = 'flex';
        }
        else if (showTimer) {
            document.getElementById('view-timer-mini').classList.add('active');
        }
        else if (Timer.finished && !clockAppOpen) {
            island.classList.add('notify');
            document.getElementById('view-timer-done').classList.add('active');
        }
        else if (showMusic) {
            document.getElementById('view-music-mini').classList.add('active');
        }
        else {
            document.getElementById('view-idle').classList.add('active');
            Island.renderIdle();
        }
    },
    tapMain: (e) => {
        if (Island.isMorphing) return;
        e.stopPropagation();
        const isSplit = (Music.active && !Music.audio.paused) && (Timer.running || Timer.finished || Timer.paused);
        if (Island.expanded) {
            if (Island.expanded === 'unlocked') {
                clearTimeout(Island.unlockTimer);
                Island.collapse();
            } else if (isSplit && (Island.expanded === 'timer' || Island.expanded === 'timerDone')) {
                if (Timer.paused && !Timer.running) {
                    Island.collapse();
                } else {
                    Island.expand('music');
                }
            } else {
                Island.collapse();
            }
        } else if (Music.active && !Music.audio.paused) {
            Island.expand('music');
        } else if (Timer.running) {
            Island.expand('timer');
        }
    },
    tapSec: (e) => {
        if (Island.isMorphing) return;
        e.stopPropagation();
        if (Timer.running || Timer.finished) Island.expand('timer');
    },
    expand: (type) => {
        if (Island.isMorphing) return;
        if (type === 'timer' && Timer.finished) type = 'timerDone';
        const sec = document.getElementById('dynamic-island-sec');
        const wrapper = document.getElementById('island-wrap');
        const isSplit = (Music.active && !Music.audio.paused) && (Timer.running || Timer.finished || Timer.paused);
        wrapper.classList.remove('music-expanded', 'timer-expanded');
        sec.classList.remove('as-pill');
        if (type === 'notify') {
            Island.expanded = type;
            Island.update();
            return;
        }
        if (isSplit) {
            document.querySelectorAll('.di-view-sec').forEach(v => v.classList.remove('active'));
            if (type === 'music') {
                wrapper.classList.add('music-expanded');
                document.getElementById('view-timer-sec-mini').classList.add('active');
            } else if (type === 'timer') {
                wrapper.classList.add('timer-expanded');
                document.getElementById('view-timer-sec-exp').classList.add('active');
            } else if (type === 'timerDone') {
                wrapper.classList.add('timer-expanded');
                document.getElementById('view-timer-sec-done').classList.add('active');
            }
        }
        Island.expanded = type;
        Island.update();
    },
    collapse: () => {
        if (Island.isMorphing) return;
        const island = document.getElementById('dynamic-island');
        const sec = document.getElementById('dynamic-island-sec');
        const wrapper = document.getElementById('island-wrap');
        const inSplit = wrapper.classList.contains('split') || wrapper.classList.contains('music-expanded') || wrapper.classList.contains('timer-expanded');
        const shouldFade = inSplit && (
            (Island.expanded === 'music' && (Music.audio.paused || !Music.active)) ||
            ((Island.expanded === 'timer' || Island.expanded === 'timerDone') && (!Timer.running))
        );
        if (shouldFade) {
            Island.isMorphing = true;
            const isTimerExp = wrapper.classList.contains('timer-expanded');
            const fadeTarget = isTimerExp ? sec : island;
            if (fadeTarget) fadeTarget.classList.add('di-fading');
            setTimeout(() => {
                if (fadeTarget) {
                    fadeTarget.classList.remove('di-fading');
                    fadeTarget.style.transition = 'none';
                }
                wrapper.classList.remove('music-expanded', 'timer-expanded');
                sec.classList.remove('as-pill');
                document.querySelectorAll('.di-view-sec').forEach(v => v.classList.remove('active'));
                Island.expanded = null;
                Island.update();
                if (fadeTarget) {
                    fadeTarget.offsetHeight;
                    fadeTarget.style.transition = '';
                }
                Island.isMorphing = false;
            }, 350);
            return;
        }
        wrapper.classList.remove('music-expanded', 'timer-expanded');
        sec.classList.remove('as-pill');
        document.querySelectorAll('.di-view-sec').forEach(v => v.classList.remove('active'));
        Island.expanded = null;
        Island.update();
    },
    notify: (title, msg, icon) => {
        document.getElementById('notify-title').innerText = title;
        document.getElementById('notify-msg').innerHTML = msg;
        document.getElementById('notify-icon').className = `fas ${icon}`;
        if (Island.notifyTimer) clearTimeout(Island.notifyTimer);
        const wasExpanded = Island.expanded;
        if (wasExpanded !== 'notify') Island._preNotifyState = wasExpanded;
        const wrapper = document.getElementById('island-wrap');
        const wasSplit = wrapper && (wrapper.classList.contains('split') || wrapper.classList.contains('music-expanded') || wrapper.classList.contains('timer-expanded'));
        Island._preNotifySplit = wasSplit;
        Island.expand('notify');
        Island.notifyTimer = setTimeout(() => {
            if (Island.expanded !== 'notify') return;
            const musicPlaying = Music.active && !Music.audio.paused;
            const timerActive = Timer.running || Timer.finished || Timer.paused;
            if (musicPlaying || timerActive) {
                Island.expanded = null;
                Island.update();
            } else {
                Island.collapse();
            }
        }, 3000);
    },
    notifyUnlock: () => {
        if (Island.expanded === 'unlocked') return;
        Island.expand('unlocked');
        Island.unlockTimer = setTimeout(() => { if (Island.expanded === 'unlocked') Island.collapse(); }, 1000);
    },
    extractAlbumColor: (imageUrl, callback) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 50;
            canvas.height = 50;
            ctx.drawImage(img, 0, 0, 50, 50);
            try {
                const imageData = ctx.getImageData(0, 0, 50, 50).data;
                let r = 0, g = 0, b = 0, count = 0;
                for (let i = 0; i < imageData.length; i += 16) {
                    r += imageData[i];
                    g += imageData[i + 1];
                    b += imageData[i + 2];
                    count++;
                }
                r = Math.round(r / count);
                g = Math.round(g / count);
                b = Math.round(b / count);
                const max = Math.max(r, g, b);
                const boost = 1.3;
                r = Math.min(255, Math.round(r * boost));
                g = Math.min(255, Math.round(g * boost));
                b = Math.min(255, Math.round(b * boost));
                callback(`rgba(${r}, ${g}, ${b}, 0.6)`);
            } catch (e) {
                callback('rgba(255, 120, 80, 0.5)');
            }
        };
        img.onerror = () => {
            callback('rgba(255, 120, 80, 0.5)');
        };
        img.src = imageUrl;
    }
};
