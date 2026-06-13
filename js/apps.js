const Apps = {
    placeholder: { render: () => document.getElementById('app-body').innerHTML = `<div style="height:100%; display:flex; justify-content:center; align-items:center; opacity:0.5">Under Construction</div>` },
    notes: {
        render: () => {
            const body = document.getElementById('app-body');
            document.getElementById('app-header').style.display = 'none';
            let notesHTML = '';
            State.notes.forEach((note, i) => {
                notesHTML += `
                    <div class="note-card ${note.color}">
                        <div style="font-weight:600; margin-bottom:5px; white-space:pre-wrap;">${note.text}</div>
                        <div class="note-del" onclick="event.stopPropagation(); Apps.notes.delete(${i})"><i class="fas fa-trash"></i></div>
                    </div>`;
            });
            if (State.notes.length === 0) {
                notesHTML = `<div style="text-align:center; color:#888; margin-top:50px;">No notes yet</div>`;
            }
            body.innerHTML = `
                <div style="padding:20px 20px 80px; overflow-y:auto; height:100%;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h1 style="margin:0; font-size:32px; font-weight:700;">Notes</h1>
                        <div style="display:flex; gap:10px;">
                            <div style="width:35px; height:35px; background:rgba(128,128,128,0.2); border-radius:10px; display:flex; justify-content:center; align-items:center;"><i class="fas fa-search"></i></div>
                            <div style="width:35px; height:35px; background:rgba(128,128,128,0.2); border-radius:10px; display:flex; justify-content:center; align-items:center;"><i class="fas fa-info-circle"></i></div>
                        </div>
                    </div>
                    <div class="notes-grid">
                        ${notesHTML}
                    </div>
                    <div class="notes-add-btn" onclick="Apps.notes.showAdd()"><i class="fas fa-plus"></i></div>
                </div>
            `;
        },
        showAdd: () => {
            document.getElementById('new-note-modal').classList.add('active');
            document.querySelectorAll('.color-opt').forEach(el => {
                el.onclick = function () {
                    document.querySelectorAll('.color-opt').forEach(c => c.classList.remove('selected'));
                    this.classList.add('selected');
                }
            });
        },
        cancelAdd: () => {
            document.getElementById('new-note-modal').classList.remove('active');
            document.getElementById('nn-text').value = '';
        },
        saveAdd: () => {
            const text = document.getElementById('nn-text').value;
            if (!text.trim()) return;
            const colorEl = document.querySelector('.color-opt.selected');
            const color = colorEl ? colorEl.getAttribute('data-c') : 'note-yellow';
            State.notes.push({ text: text, color: color });
            Storage.saveSettings();
            Apps.notes.cancelAdd();
            Apps.notes.render();
        },
        delete: (idx) => {
            State.notes.splice(idx, 1);
            Storage.saveSettings();
            Apps.notes.render();
        }
    },
    camera: {
        _zoom: 1,
        _mode: 'PHOTO',
        _flash: 'auto',
        _timer: 0,
        _frontCam: false,
        render: () => {
            const body = document.getElementById('app-body');
            document.getElementById('app-header').style.display = 'none';
            body.innerHTML = `
                <div id="cam-root" style="height:100%; background:#000; color:#fff; display:flex; flex-direction:column; user-select:none; -webkit-user-select:none; overflow:hidden;">
                    <div id="cam-top-bar" style="padding:40px 16px 8px 16px; display:flex; justify-content:space-between; align-items:center; z-index:20; position:relative;">
                        <div id="cam-flash-btn" style="width:32px; height:32px; display:flex; justify-content:center; align-items:center; cursor:pointer; border-radius:50%; transition:background 0.2s;">
                            <i class="fas fa-bolt" style="font-size:16px; color:#fcd116;"></i>
                        </div>
                        <div id="cam-top-center" style="display:flex; justify-content:center; align-items:center; position:absolute; left:50%; transform:translateX(-50%);">
                            <div id="cam-top-indicators" style="display:flex; gap:16px; align-items:center;">
                                <div id="cam-night-btn" style="font-size:11px; font-weight:600; color:#888; cursor:pointer; padding:4px 8px; border-radius:12px;">NIGHT</div>
                                <div id="cam-live-btn" style="font-size:11px; font-weight:600; color:#fcd116; cursor:pointer; padding:4px 8px; border-radius:12px; border:1px solid rgba(252,209,22,0.4);">LIVE</div>
                            </div>
                            <div id="cam-record-pill" style="display:none; align-items:center; background:rgba(0,0,0,0.6); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); padding:4px 12px; border-radius:14px; gap:8px;">
                                <div id="cam-record-dot" style="width:6px; height:6px; background:#ff3b30; border-radius:50%; transition:opacity 0.2s;"></div>
                                <div id="cam-record-time" style="font-size:12px; font-weight:600; font-family:monospace; color:#fff;">00:00:00</div>
                            </div>
                        </div>
                        <div id="cam-aspect-btn" style="width:32px; height:32px; display:flex; justify-content:center; align-items:center; cursor:pointer; border-radius:50%; font-size:11px; font-weight:700; color:#fff;">
                            <i class="fas fa-chevron-down" style="font-size:12px;"></i>
                        </div>
                    </div>

                    <div id="cam-viewfinder" style="flex:1; background:#0a0a0a; position:relative; overflow:hidden; margin:0 2px; border-radius:14px;">
                        <div id="cam-preview" style="position:absolute; inset:0; background:#000; transition:transform 0.3s cubic-bezier(0.2,0.8,0.2,1); transform-origin:center center;">
                            <div id="cam-focus-ring" style="position:absolute; top:50%; left:50%; width:70px; height:70px; transform:translate(-50%,-50%); border:1.5px solid #fcd116; border-radius:4px; opacity:0; transition:opacity 0.3s, transform 0.3s; pointer-events:none;"></div>
                        </div>
                        <div id="cam-grid" style="position:absolute; inset:0; pointer-events:none; opacity:0.15;">
                            <div style="position:absolute; top:33.33%; left:0; right:0; height:1px; background:#fff;"></div>
                            <div style="position:absolute; top:66.66%; left:0; right:0; height:1px; background:#fff;"></div>
                            <div style="position:absolute; left:33.33%; top:0; bottom:0; width:1px; background:#fff;"></div>
                            <div style="position:absolute; left:66.66%; top:0; bottom:0; width:1px; background:#fff;"></div>
                        </div>
                    </div>

                    <div id="cam-controls" style="background:#000; padding:10px 0 0 0;">
                        <div id="cam-modes" style="display:flex; justify-content:center; gap:16px; font-size:11px; font-weight:700; color:rgba(255,255,255,0.4); margin-bottom:16px; padding:0 20px; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none;">
                            <span class="cam-mode" data-mode="TIMELAPSE" style="white-space:nowrap; cursor:pointer; padding:2px 0; transition:color 0.2s;">TIMELAPSE</span>
                            <span class="cam-mode" data-mode="SLO-MO" style="white-space:nowrap; cursor:pointer; padding:2px 0; transition:color 0.2s;">SLO-MO</span>
                            <span class="cam-mode" data-mode="CINEMATIC" style="white-space:nowrap; cursor:pointer; padding:2px 0; transition:color 0.2s;">CINEMATIC</span>
                            <span class="cam-mode" data-mode="VIDEO" style="white-space:nowrap; cursor:pointer; padding:2px 0; transition:color 0.2s;">VIDEO</span>
                            <span class="cam-mode cam-mode-active" data-mode="PHOTO" style="white-space:nowrap; cursor:pointer; padding:2px 0; color:#fcd116; transition:color 0.2s;">PHOTO</span>
                            <span class="cam-mode" data-mode="PORTRAIT" style="white-space:nowrap; cursor:pointer; padding:2px 0; transition:color 0.2s;">PORTRAIT</span>
                            <span class="cam-mode" data-mode="PANO" style="white-space:nowrap; cursor:pointer; padding:2px 0; transition:color 0.2s;">PANO</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:0 28px 24px 28px;">
                            <div id="cam-gallery-thumb" style="width:42px; height:42px; background:#222; border-radius:8px; overflow:hidden; border:2px solid rgba(255,255,255,0.2); cursor:pointer;">
                                <div style="width:100%; height:100%; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
                            </div>
                            <div id="cam-shutter" style="width:68px; height:68px; border-radius:50%; border:4px solid rgba(255,255,255,0.9); display:flex; justify-content:center; align-items:center; cursor:pointer; transition:transform 0.1s;">
                                <div id="cam-shutter-inner" style="width:58px; height:58px; background:#fff; border-radius:50%; transition:transform 0.15s, background 0.2s;"></div>
                            </div>
                            <div id="cam-flip-btn" style="width:42px; height:42px; background:rgba(255,255,255,0.1); border-radius:50%; display:flex; justify-content:center; align-items:center; font-size:16px; cursor:pointer; transition:transform 0.4s cubic-bezier(0.2,0.8,0.2,1);">
                                <i class="fas fa-sync-alt"></i>
                            </div>
                        </div>
                    </div>
                </div>`;

            const root = document.getElementById('cam-root');
            const preview = document.getElementById('cam-preview');
            const shutter = document.getElementById('cam-shutter');
            const shutterInner = document.getElementById('cam-shutter-inner');
            const flipBtn = document.getElementById('cam-flip-btn');
            const flashBtn = document.getElementById('cam-flash-btn');
            const focusRing = document.getElementById('cam-focus-ring');
            const modes = root.querySelectorAll('.cam-mode');
            const topIndicators = document.getElementById('cam-top-indicators');
            const recordPill = document.getElementById('cam-record-pill');
            const recordTimeEl = document.getElementById('cam-record-time');
            const recordDot = document.getElementById('cam-record-dot');

            if (Apps.camera.recordInterval) clearInterval(Apps.camera.recordInterval);
            let recordTime = 0;

            preview.addEventListener('click', (e) => {
                const rect = preview.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                focusRing.style.left = x + 'px';
                focusRing.style.top = y + 'px';
                focusRing.style.opacity = '1';
                focusRing.style.transform = 'translate(-50%,-50%) scale(1.3)';
                setTimeout(() => { focusRing.style.transform = 'translate(-50%,-50%) scale(1)'; }, 50);
                setTimeout(() => { focusRing.style.opacity = '0'; }, 1200);
            });

            shutter.addEventListener('mousedown', () => {
                if (!Apps.camera._isRecording) shutterInner.style.transform = 'scale(0.88)';
            });
            shutter.addEventListener('mouseup', () => {
                if (Apps.camera._mode === 'VIDEO' || Apps.camera._mode === 'CINEMATIC' || Apps.camera._mode === 'SLO-MO' || Apps.camera._mode === 'TIMELAPSE') {
                    if (Apps.camera._isRecording) {
                        Apps.camera._isRecording = false;
                        shutterInner.style.transform = 'scale(1)';
                        shutterInner.style.borderRadius = '50%';

                        clearInterval(Apps.camera.recordInterval);
                        recordDot.style.opacity = '1';
                        topIndicators.style.display = 'flex';
                        recordPill.style.display = 'none';

                        Toast.show('Video saved');
                    } else {
                        Apps.camera._isRecording = true;
                        shutterInner.style.transform = 'scale(0.45)';
                        shutterInner.style.borderRadius = '8px';

                        topIndicators.style.display = 'none';
                        recordPill.style.display = 'flex';
                        recordTime = 0;
                        recordTimeEl.innerText = '00:00:00';
                        recordDot.style.opacity = '1';

                        Apps.camera.recordInterval = setInterval(() => {
                            recordTime++;
                            const h = Math.floor(recordTime / 3600);
                            const m = Math.floor((recordTime % 3600) / 60);
                            const s = recordTime % 60;
                            recordTimeEl.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                            recordDot.style.opacity = recordTime % 2 === 0 ? '0.3' : '1';
                        }, 1000);
                    }
                } else {
                    shutterInner.style.transform = 'scale(1)';
                    preview.style.transition = 'none';
                    preview.style.opacity = '0';
                    setTimeout(() => { preview.style.transition = 'opacity 0.15s'; preview.style.opacity = '1'; }, 80);
                    Toast.show('Photo captured');
                }
            });
            shutter.addEventListener('mouseleave', () => {
                if (!Apps.camera._isRecording) shutterInner.style.transform = 'scale(1)';
            });

            flipBtn.addEventListener('click', () => {
                Apps.camera._frontCam = !Apps.camera._frontCam;
                flipBtn.style.transform = 'rotate(' + (Apps.camera._frontCam ? '180' : '0') + 'deg)';
                preview.style.transition = 'none';
                preview.style.opacity = '0';
                setTimeout(() => {
                    preview.style.background = '#000';
                    preview.style.transition = 'opacity 0.25s';
                    preview.style.opacity = '1';
                }, 150);
            });

            const flashStates = ['auto', 'on', 'off'];
            const flashIcons = { auto: 'fa-bolt', on: 'fa-bolt', off: 'fa-ban' };
            const flashColors = { auto: '#fcd116', on: '#fff', off: '#888' };
            flashBtn.addEventListener('click', () => {
                const idx = (flashStates.indexOf(Apps.camera._flash) + 1) % flashStates.length;
                Apps.camera._flash = flashStates[idx];
                flashBtn.querySelector('i').className = 'fas ' + flashIcons[Apps.camera._flash];
                flashBtn.querySelector('i').style.color = flashColors[Apps.camera._flash];
                Toast.show('Flash: ' + Apps.camera._flash);
            });

            modes.forEach(m => {
                m.addEventListener('click', () => {
                    if (Apps.camera._isRecording) return;
                    modes.forEach(mm => { mm.style.color = 'rgba(255,255,255,0.4)'; mm.classList.remove('cam-mode-active'); });
                    m.style.color = '#fcd116';
                    m.classList.add('cam-mode-active');
                    Apps.camera._mode = m.dataset.mode;
                    if (m.dataset.mode === 'VIDEO' || m.dataset.mode === 'CINEMATIC' || m.dataset.mode === 'SLO-MO' || m.dataset.mode === 'TIMELAPSE') {
                        shutterInner.style.background = '#ff3b30';
                        shutterInner.style.borderRadius = '50%';
                        shutterInner.style.transition = 'transform 0.25s cubic-bezier(0.2,0.8,0.2,1), border-radius 0.25s cubic-bezier(0.2,0.8,0.2,1), background 0.2s';
                    } else {
                        shutterInner.style.background = '#fff';
                        shutterInner.style.borderRadius = '50%';
                        shutterInner.style.transition = 'transform 0.15s, background 0.2s, border-radius 0.2s';
                    }
                });
            });

            const modesContainer = document.getElementById('cam-modes');
            const activeMode = modesContainer.querySelector('.cam-mode-active');
            if (activeMode) {
                setTimeout(() => {
                    const containerWidth = modesContainer.offsetWidth;
                    const modeLeft = activeMode.offsetLeft;
                    const modeWidth = activeMode.offsetWidth;
                    modesContainer.scrollTo({
                        left: modeLeft - (containerWidth / 2) + (modeWidth / 2),
                        behavior: 'smooth'
                    });
                }, 100);
            }
        }
    },
    phone: {
        num: '',
        render: () => {
            document.getElementById('app-body').innerHTML = `
                <div style="height:100%; display:flex; flex-direction:column;">
                    <div class="phone-display" id="p-disp"></div>
                    <div class="phone-grid">
                        <button class="num-btn" onclick="Apps.phone.add('1',this)"><div class="nb-big">1</div><div class="nb-sm">&nbsp;</div></button>
                        <button class="num-btn" onclick="Apps.phone.add('2',this)"><div class="nb-big">2</div><div class="nb-sm">ABC</div></button>
                        <button class="num-btn" onclick="Apps.phone.add('3',this)"><div class="nb-big">3</div><div class="nb-sm">DEF</div></button>
                        <button class="num-btn" onclick="Apps.phone.add('4',this)"><div class="nb-big">4</div><div class="nb-sm">GHI</div></button>
                        <button class="num-btn" onclick="Apps.phone.add('5',this)"><div class="nb-big">5</div><div class="nb-sm">JKL</div></button>
                        <button class="num-btn" onclick="Apps.phone.add('6',this)"><div class="nb-big">6</div><div class="nb-sm">MNO</div></button>
                        <button class="num-btn" onclick="Apps.phone.add('7',this)"><div class="nb-big">7</div><div class="nb-sm">PQRS</div></button>
                        <button class="num-btn" onclick="Apps.phone.add('8',this)"><div class="nb-big">8</div><div class="nb-sm">TUV</div></button>
                        <button class="num-btn" onclick="Apps.phone.add('9',this)"><div class="nb-big">9</div><div class="nb-sm">WXYZ</div></button>
                        <button class="num-btn" onclick="Apps.phone.add('*',this)"><div class="nb-big" style="font-size:36px; padding-top:10px">*</div></button>
                        <button class="num-btn" onclick="Apps.phone.add('0',this)"><div class="nb-big">0</div><div class="nb-sm">+</div></button>
                        <button class="num-btn" onclick="Apps.phone.add('#',this)"><div class="nb-big">#</div></button>
                        <button class="call-btn" onclick="Apps.phone.call()"><i class="fas fa-phone"></i></button>
                    </div>
                </div>
            `;
            Apps.phone.num = '';
        },
        add: (n, btn) => {
            if (Apps.phone.num.length < 15) {
                Apps.phone.num += n;
                const disp = document.getElementById('p-disp');
                const span = document.createElement('span');
                span.textContent = n;
                span.style.display = 'inline-block';
                span.style.animation = 'digitIn 0.15s ease forwards';
                disp.appendChild(span);
                if (State.glassUI && btn) {
                    btn.classList.add('glass-glow');
                    const parent = btn.parentElement;
                    if (parent) {
                        const siblings = parent.querySelectorAll('.num-btn');
                        const r = btn.getBoundingClientRect();
                        siblings.forEach(s => { if (s !== btn && Math.hypot(s.getBoundingClientRect().left - r.left, s.getBoundingClientRect().top - r.top) < 120) s.classList.add('glass-glow-neighbor'); });
                    }
                    setTimeout(() => { btn.classList.remove('glass-glow'); if (parent) parent.querySelectorAll('.glass-glow-neighbor').forEach(s => s.classList.remove('glass-glow-neighbor')); }, 400);
                }
            }
        },
        call: () => { Toast.show('Sim card unavailable'); }
    },
    clock: {
        selectedHours: 0,
        selectedMinutes: 5,
        selectedSeconds: 0,
        render: () => {
            document.getElementById('app-window').style.background = 'var(--bg-app)';
            const genItems = (max, padLen = 2) => {
                let html = '<div class="timer-digit-item" style="opacity:0"></div>';
                for (let i = 0; i <= max; i++) {
                    html += `<div class="timer-digit-item" data-val="${i}">${i.toString().padStart(padLen, '0')}</div>`;
                }
                html += '<div class="timer-digit-item" style="opacity:0"></div>';
                return html;
            };
            document.getElementById('app-body').innerHTML = `
                <div style="height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--text-main); padding: 20px;">
                    <div style="font-size:18px; color:#888; margin-bottom:20px;">Set Timer Duration</div>
                    <div class="timer-scroll-container">
                        <div>
                            <div class="timer-scroll-digit" id="scroll-hours">${genItems(23)}</div>
                            <div class="timer-scroll-label">Hours</div>
                        </div>
                        <div class="timer-scroll-separator">:</div>
                        <div>
                            <div class="timer-scroll-digit" id="scroll-minutes">${genItems(59)}</div>
                            <div class="timer-scroll-label">Minutes</div>
                        </div>
                        <div class="timer-scroll-separator">:</div>
                        <div>
                            <div class="timer-scroll-digit" id="scroll-seconds">${genItems(59)}</div>
                            <div class="timer-scroll-label">Seconds</div>
                        </div>
                    </div>
                    <div id="stopwatch-val" style="font-size:60px; font-weight:200; font-family:monospace; margin:20px 0">${Math.floor(Timer.time / 60).toString().padStart(2, '0')}:${(Timer.time % 60).toString().padStart(2, '0')}</div>
                    <div style="display:flex; gap:20px; margin-top:20px;">
                        <button class="btn-pill" style="width:80px; background:rgba(128,128,128,0.2); color:var(--text-main); border-radius:50%; height:80px;" onclick="Timer.stop()">Cancel</button>
                        <button class="btn-pill" style="width:80px; background:#34c759; border-radius:50%; height:80px; color:#000;" onclick="Apps.clock.start()">Start</button>
                    </div>
                </div>`;
            Apps.clock.initScroller('scroll-hours', 'selectedHours', 23);
            Apps.clock.initScroller('scroll-minutes', 'selectedMinutes', 59);
            Apps.clock.initScroller('scroll-seconds', 'selectedSeconds', 59);
            setTimeout(() => {
                Apps.clock.scrollToValue('scroll-hours', Apps.clock.selectedHours);
                Apps.clock.scrollToValue('scroll-minutes', Apps.clock.selectedMinutes);
                Apps.clock.scrollToValue('scroll-seconds', Apps.clock.selectedSeconds);
            }, 50);
        },
        initScroller: (id, prop, max) => {
            const el = document.getElementById(id);
            if (!el) return;
            let isDragging = false;
            let startY = 0;
            let startScroll = 0;
            el.addEventListener('mousedown', (e) => {
                isDragging = true;
                startY = e.clientY;
                startScroll = el.scrollTop;
                el.style.cursor = 'grabbing';
                e.preventDefault();
            });
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const deltaY = startY - e.clientY;
                el.scrollTop = startScroll + deltaY;
            });
            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    el.style.cursor = 'grab';
                    const itemHeight = 50;
                    const targetScroll = Math.round(el.scrollTop / itemHeight) * itemHeight;
                    el.scrollTo({ top: targetScroll, behavior: 'smooth' });
                }
            });
            el.addEventListener('touchstart', (e) => {
                isDragging = true;
                startY = e.touches[0].clientY;
                startScroll = el.scrollTop;
            }, { passive: true });
            el.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                const deltaY = startY - e.touches[0].clientY;
                el.scrollTop = startScroll + deltaY;
            }, { passive: true });
            el.addEventListener('touchend', () => {
                if (isDragging) {
                    isDragging = false;
                    const itemHeight = 50;
                    const targetScroll = Math.round(el.scrollTop / itemHeight) * itemHeight;
                    el.scrollTo({ top: targetScroll, behavior: 'smooth' });
                }
            });
            el.addEventListener('scroll', () => {
                const itemHeight = 50;
                const scrollTop = el.scrollTop;
                const selectedIdx = Math.round(scrollTop / itemHeight);
                Apps.clock[prop] = Math.min(max, Math.max(0, selectedIdx));
                const items = el.querySelectorAll('.timer-digit-item[data-val]');
                items.forEach((item, i) => {
                    if (i === Apps.clock[prop]) {
                        item.classList.add('selected');
                    } else {
                        item.classList.remove('selected');
                    }
                });
                Apps.clock.updatePreview();
            });
            el.style.cursor = 'grab';
        },
        scrollToValue: (id, value) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.scrollTop = value * 50;
        },
        updatePreview: () => {
            const totalSeconds = Apps.clock.selectedHours * 3600 + Apps.clock.selectedMinutes * 60 + Apps.clock.selectedSeconds;
            const m = Math.floor(totalSeconds / 60);
            const s = totalSeconds % 60;
            const display = document.getElementById('stopwatch-val');
            if (display) {
                display.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
        },
        start: () => {
            const totalSeconds = Apps.clock.selectedHours * 3600 + Apps.clock.selectedMinutes * 60 + Apps.clock.selectedSeconds;
            Timer.time = totalSeconds > 0 ? totalSeconds : 300;
            Timer.start();
        }
    },
    calc: {
        val: '',
        history: JSON.parse(localStorage.getItem('realos_v3_calc_history') || '[]'),
        render: () => {
            document.getElementById('app-body').innerHTML = `
                <div style="display:flex; flex-direction:column; height:100%;">
                     <div style="position:absolute; top:50px; right:20px; z-index:100; font-size:20px; color:#888; cursor:pointer;" onclick="Apps.calc.showHistory()"><i class="fas fa-history"></i></div>
                    <div class="calc-display" id="c-disp">0</div>
                    <div class="calc-grid">
                        <button class="calc-btn cb-lt" onclick="Apps.calc.clr()">AC</button>
                        <button class="calc-btn cb-lt">+/-</button>
                        <button class="calc-btn cb-lt">%</button>
                        <button class="calc-btn cb-or" onclick="Apps.calc.add('/',this)">&divide;</button>
                        <button class="calc-btn cb-dk" onclick="Apps.calc.add('7',this)">7</button>
                        <button class="calc-btn cb-dk" onclick="Apps.calc.add('8',this)">8</button>
                        <button class="calc-btn cb-dk" onclick="Apps.calc.add('9',this)">9</button>
                        <button class="calc-btn cb-or" onclick="Apps.calc.add('*',this)">&times;</button>
                        <button class="calc-btn cb-dk" onclick="Apps.calc.add('4',this)">4</button>
                        <button class="calc-btn cb-dk" onclick="Apps.calc.add('5',this)">5</button>
                        <button class="calc-btn cb-dk" onclick="Apps.calc.add('6',this)">6</button>
                        <button class="calc-btn cb-or" onclick="Apps.calc.add('-',this)">-</button>
                        <button class="calc-btn cb-dk" onclick="Apps.calc.add('1',this)">1</button>
                        <button class="calc-btn cb-dk" onclick="Apps.calc.add('2',this)">2</button>
                        <button class="calc-btn cb-dk" onclick="Apps.calc.add('3',this)">3</button>
                        <button class="calc-btn cb-or" onclick="Apps.calc.add('+',this)">+</button>
                        <button class="calc-btn cb-dk" style="grid-column:span 2; border-radius:100px; aspect-ratio:auto;" onclick="Apps.calc.add('0',this)">0</button>
                        <button class="calc-btn cb-dk" onclick="Apps.calc.add('.',this)">.</button>
                        <button class="calc-btn cb-or" onclick="Apps.calc.solve()">=</button>
                    </div>
                </div>`;
        },
        add: (n, btn) => {
            Apps.calc.val += n;
            const disp = document.getElementById('c-disp');
            disp.innerHTML = '';
            for (let i = 0; i < Apps.calc.val.length; i++) {
                const span = document.createElement('span');
                span.textContent = Apps.calc.val[i];
                span.style.display = 'inline-block';
                if (i === Apps.calc.val.length - 1) span.style.animation = 'digitIn 0.15s ease forwards';
                disp.appendChild(span);
            }
            if (State.glassUI && btn) {
                btn.classList.add('glass-glow');
                const parent = btn.parentElement;
                if (parent) {
                    const siblings = parent.querySelectorAll('.calc-btn');
                    const r = btn.getBoundingClientRect();
                    siblings.forEach(s => { if (s !== btn && Math.hypot(s.getBoundingClientRect().left - r.left, s.getBoundingClientRect().top - r.top) < 120) s.classList.add('glass-glow-neighbor'); });
                }
                setTimeout(() => { btn.classList.remove('glass-glow'); if (parent) parent.querySelectorAll('.glass-glow-neighbor').forEach(s => s.classList.remove('glass-glow-neighbor')); }, 400);
            }
        },
        clr: () => {
            const disp = document.getElementById('c-disp');
            const spans = disp.querySelectorAll('span');
            if (spans.length > 0) {
                spans.forEach(s => { s.style.animation = 'digitOut 0.15s ease forwards'; });
                setTimeout(() => { Apps.calc.val = ''; disp.innerHTML = '0'; }, 160);
            } else {
                Apps.calc.val = '';
                disp.innerHTML = '0';
            }
        },
        solve: () => {
            try {
                const result = eval(Apps.calc.val);
                if (Apps.calc.val && result !== undefined) {
                    Apps.calc.history.unshift({ eq: Apps.calc.val, res: result });
                    if (Apps.calc.history.length > 20) Apps.calc.history.pop();
                    localStorage.setItem('realos_v3_calc_history', JSON.stringify(Apps.calc.history));
                }
                Apps.calc.val = result;
                document.getElementById('c-disp').innerText = Apps.calc.val;
            } catch (e) { document.getElementById('c-disp').innerText = 'Error'; Apps.calc.val = ''; }
        },
        showHistory: () => {
            const list = Apps.calc.history.map(h => `<div style="padding:10px; border-bottom:1px solid #333; display:flex; justify-content:space-between; color:white;"><span style="opacity:0.6">${h.eq} =</span> <span style="font-weight:bold">${h.res}</span></div>`).join('');
            OS.showPopup('History', `<div style="max-height:300px; overflow-y:auto; text-align:left;">${list || '<div style="text-align:center;color:#888">No history</div>'}</div>`);
        }
    },
    settings: {
        view: 'root', tempPin: '', previousView: null,
        render: (v) => {
            const subSections = { 'aod': 'wallpaper', 'clockconfig': 'wallpaper', 'animconfig': 'customization', 'changelog': 'about', 'fingerprint-icon': 'security', 'bio': 'security', 'pin': 'security', 'navigation': 'additional', 'developer': 'additional' };
            const isSubForward = v && subSections[v] && Apps.settings.view === subSections[v];
            const isSubBack = subSections[Apps.settings.view] && v === subSections[Apps.settings.view];
            const isForward = (v && v !== 'root' && Apps.settings.view === 'root') || isSubForward;
            const isBack = (v === 'root' && Apps.settings.view !== 'root') || isSubBack;
            Apps.settings.previousView = Apps.settings.view;
            if (v) Apps.settings.view = v;
            const view = Apps.settings.view;
            const body = document.getElementById('app-body');
            const headerTitle = document.getElementById('app-title');
            const backBtn = document.getElementById('app-back');
            const win = document.getElementById('app-window');
            const bg = 'var(--bg-app)';
            win.style.background = bg;
            body.style.background = bg;
            const appHeader = document.getElementById('app-header');
            if (view === 'root') { headerTitle.innerText = ''; backBtn.style.display = 'none'; }
            else if (isForward && view === 'about') { backBtn.style.display = 'none'; }
            else if (isForward) { backBtn.style.display = 'none'; }
            else if (isBack) { headerTitle.innerText = ''; backBtn.style.display = 'none'; }
            else { backBtn.style.display = 'none'; }
            if (view === 'about') {
                if (!isForward) {
                    appHeader.style.display = 'flex';
                    appHeader.style.visibility = 'visible';
                    appHeader.style.setProperty('background', 'transparent', 'important');
                    appHeader.style.setProperty('backdrop-filter', 'none', 'important');
                    appHeader.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
                    appHeader.style.position = 'absolute';
                    appHeader.style.top = '0';
                    appHeader.style.left = '0';
                    appHeader.style.right = '0';
                    appHeader.style.zIndex = '100';
                    appHeader.style.pointerEvents = 'none';
                    headerTitle.style.display = 'none';
                }
            } else if (view !== 'root') {
            } else {
                appHeader.style.display = 'flex';
                appHeader.style.visibility = 'visible';
                const isDark = State.darkMode;
                const bgBlur = isDark ? 'rgba(0,0,0,0.7)' : 'rgba(242,242,247,0.7)';
                const useGlass = !State.liteMode && !State.glassUI;
                appHeader.style.background = useGlass ? bgBlur : '';
                appHeader.style.backdropFilter = useGlass ? 'blur(20px)' : '';
                appHeader.style.webkitBackdropFilter = useGlass ? 'blur(20px)' : '';
                appHeader.style.position = '';
                appHeader.style.top = '';
                appHeader.style.left = '';
                appHeader.style.right = '';
                appHeader.style.width = '';
                appHeader.style.zIndex = '';
                appHeader.style.pointerEvents = '';
                body.style.paddingTop = '';
                body.style.boxSizing = '';
                headerTitle.style.display = '';
            }
            let content = '';
            if (view === 'root') {
                content = `
                    <div class="anim-fade" style="padding-bottom:20px;">
                        <div style="padding:30px 24px 20px; font-size:28px; font-weight:700; color:var(--text-main);">Settings</div>
                        <div class="s-section" style="margin:0 16px 12px; overflow:hidden;">
                            <div class="settings-profile-header" onclick="Apps.settings.render('profile')" style="padding:16px 16px; margin:0; background:transparent; border-radius:0; display:flex; align-items:center; gap:16px;">
                                <div class="profile-avatar" id="root-profile-avatar">
                                    ${State.userProfile.image ?
                        `<img src="${State.userProfile.image}">` :
                        `<i class="fas fa-user"></i>`}
                                </div>
                                <div class="profile-info" style="flex:1;">
                                    <div class="profile-greeting" id="root-profile-name" style="font-size:17px; font-weight:600;">${State.userProfile.name}</div>
                                    <div class="profile-subtitle" style="font-size:13px; opacity:0.5;">Tap to edit profile</div>
                                </div>
                                <i class="fas fa-chevron-right" style="color:rgba(128,128,128,0.4); font-size:13px"></i>
                            </div>
                            <div style="height:1px; background:rgba(128,128,128,0.15); margin-left:60px;"></div>
                            <div class="s-row" onclick="Apps.settings.render('about')" style="padding:14px 16px;">
                                <div class="s-row-left"><div class="s-icon-round" style="background:#9396a6"><i class="fa-solid fa-mobile"></i></div><span>About</span></div>
                                <i class="fas fa-chevron-right s-chev"></i>
                            </div>
                        </div>
                        <div class="s-section" style="margin:0 16px 12px;">
                            <div class="s-row" onclick="Apps.settings.render('wallpaper')">
                                <div class="s-row-left"><div class="s-icon-round" style="background:#5856d6"><i class="fa-solid fa-brush"></i></div><span>Wallpaper & personalization</span></div>
                                <i class="fas fa-chevron-right s-chev"></i>
                            </div>
                            <div class="s-row" onclick="Apps.settings.render('customization')">
                                <div class="s-row-left"><div class="s-icon-round" style="background:#2e84fd"><i class="fas fa-home"></i></div><span>Home screen</span></div>
                                <i class="fas fa-chevron-right s-chev"></i>
                            </div>
                        </div>
                        <div class="s-section" style="margin:0 16px 12px;">
                            <div class="s-row" onclick="Apps.settings.render('security')">
                                <div class="s-row-left"><div class="s-icon-round" style="background:#27cb43"><i class="fas fa-lock"></i></div><span>PIN & Fingerprint</span></div>
                                <i class="fas fa-chevron-right s-chev"></i>
                            </div>
                        </div>
                        <div class="s-section" style="margin:0 16px 12px;">
                            <div class="s-row" onclick="Apps.settings.render('display')">
                                <div class="s-row-left"><div class="s-icon-round" style="background:#f2bd1d"><svg style="width:30px; height:30px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path fill="currentColor" d="M320 496C333.3 496 344 506.7 344 520L344 584C344 597.3 333.3 608 320 608C306.7 608 296 597.3 296 584L296 520C296 506.7 306.7 496 320 496zM161.6 444.4C171 435 186.2 435 195.6 444.4C205 453.8 205 469 195.6 478.4L150.3 523.7C140.9 533.1 125.7 533.1 116.4 523.7C107.1 514.3 107 499.1 116.4 489.8L161.6 444.5zM444.4 444.4C453.8 435 469 435 478.4 444.4L523.7 489.7C533.1 499.1 533.1 514.3 523.7 523.6C514.3 532.9 499.1 533 489.8 523.6L444.5 478.3C435.1 468.9 435.1 453.7 444.5 444.3zM320 448C249.3 448 192 390.7 192 320C192 249.3 249.3 192 320 192C390.7 192 448 249.3 448 320C448 390.7 390.7 448 320 448zM120 296C133.3 296 144 306.7 144 320C144 333.3 133.3 344 120 344L56 344C42.7 344 32 333.3 32 320C32 306.7 42.7 296 56 296L120 296zM584 296C597.3 296 608 306.7 608 320C608 333.3 597.3 344 584 344L520 344C506.7 344 496 333.3 496 320C496 306.7 506.7 296 520 296L584 296zM116.3 116.3C125.7 106.9 140.9 106.9 150.2 116.3L195.5 161.5C204.9 170.9 204.9 186.1 195.5 195.5C186.1 204.9 170.9 204.9 161.5 195.5L116.3 150.3C106.9 140.9 106.9 125.7 116.3 116.4zM489.7 116.3C499.1 106.9 514.3 106.9 523.6 116.3C532.9 125.7 533 140.9 523.6 150.2L478.3 195.5C468.9 204.9 453.7 204.9 444.3 195.5C434.9 186.1 434.9 170.9 444.3 161.5L489.6 116.3zM320 32C333.3 32 344 42.7 344 56L344 120C344 133.3 333.3 144 320 144C306.7 144 296 133.3 296 120L296 56C296 42.7 306.7 32 320 32z"/></svg></div><span>Display & brightness</span></div>
                                <i class="fas fa-chevron-right s-chev"></i>
                            </div>
                        </div>
                        <div class="s-section" style="margin:0 16px 12px;">
                            <div class="s-row" onclick="Apps.settings.render('additional')">
                                <div class="s-row-left"><div class="s-icon-round" style="background:#8e8e93"><svg style="width:20px; height:20px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path fill="currentColor" d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM224 288C241.7 288 256 302.3 256 320C256 337.7 241.7 352 224 352C206.3 352 192 337.7 192 320C192 302.3 206.3 288 224 288zM288 320C288 302.3 302.3 288 320 288C337.7 288 352 302.3 352 320C352 337.7 337.7 352 320 352C302.3 352 288 337.7 288 320zM416 288C433.7 288 448 302.3 448 320C448 337.7 433.7 352 416 352C398.3 352 384 337.7 384 320C384 302.3 398.3 288 416 288z"/></svg></div><span>Additional settings</span></div>
                                <i class="fas fa-chevron-right s-chev"></i>
                            </div>
                        </div>
                    </div>`;
            }
            else if (view === 'aod') {
                headerTitle.innerText = 'Always On Display';
                content = `
                    <div class="anim-fade">
                        <div id="aod-preview" style="height:150px; background:#000; margin:0 20px 20px; border-radius:15px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#ccc; border:1px solid #333; position:relative; overflow:hidden;">
                            <div id="aod-preview-wall" style="position:absolute; inset:0; background:var(--wall); background-size:cover; opacity:${State.aod.wallpaper ? '0.5' : '0'}; filter:brightness(0.5); transition: opacity 0.3s ease;"></div>
                            <div style="z-index:2; text-align:center;">
                                <div style="font-size:12px; font-weight:600; opacity:0.7">SATURDAY, JAN 1</div>
                                <div id="aod-preview-clock" style="font-size:40px; font-weight:200; line-height:1; font-family:${State.aod.style == 'serif' ? "'Times New Roman', serif" : State.aod.style == 'science' ? "'Rajdhani', sans-serif" : State.aod.style == 'mono' ? "'Monoton', cursive" : State.aod.style == 'lux' ? "'Luxurious Roman', serif" : "'Inter', sans-serif"}">12:00</div>
                                <div id="aod-preview-text" style="font-size:10px; margin-top:5px; opacity:0.8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${State.aod.text || "Your Text"}</div>
                            </div>
                        </div>
                        <div class="list-group">
                             <div class="list-item" onclick="Apps.settings.toggleAOD()"><span>Always On Display</span><div class="toggle ${State.aod.enabled ? 'active' : ''}"></div></div>
                        </div>
                        <div style="padding:0 20px 5px; font-size:13px; color:var(--text-sec);">TEXT</div>
                        <div style="margin:0 20px 20px;">
                            <input type="text" value="${State.aod.text}" placeholder="Enter custom text..." onkeydown="event.stopPropagation()" oninput="Apps.settings.updateAODTextPreview(this.value)" style="width:100%; padding:12px; border-radius:10px; border:none; background:rgba(128,128,128,0.1); color:var(--text-main); font-size:16px;">
                        </div>
                        <div style="padding:0 20px 5px; font-size:13px; color:var(--text-sec);">BACKGROUND</div>
                        <div class="list-group">
                             <div class="list-item" onclick="Apps.settings.toggleAODWall()"><span>Show Wallpaper</span><div class="toggle ${State.aod.wallpaper ? 'active' : ''}"></div></div>
                             <div class="list-item" onclick="document.getElementById('aod-input').click()"><span>Custom Image</span><i class="fas fa-image"></i></div>
                             <div class="list-item" onclick="Apps.settings.setAODImg(null)"><span>No Image</span>${State.aod.image == null ? '<i class="fas fa-check"></i>' : ''}</div>
                        </div>
                    </div>`;
                document.getElementById('aod-input').onchange = (e) => { const f = e.target.files[0]; if (f) Apps.settings.setAODImg(URL.createObjectURL(f)); };
            }

            else if (view === 'security') {
                headerTitle.innerText = 'PIN and Fingerprint';
                content = `
                    <div class="anim-fade">
                        <div class="list-group">
                            <div class="list-item" onclick="Apps.settings.render('pin')"><span>${State.security.pin ? 'Change PIN' : 'Set PIN'}</span><span style="color:var(--text-sec); margin-right:10px">${State.security.pin ? 'On' : 'Off'}</span></div>
                            <div class="list-item" onclick="${State.security.pin ? "Apps.settings.render('bio')" : "Toast.show('Set a PIN first')"}"><span style="${!State.security.pin ? 'opacity:0.5' : ''}">Fingerprint</span><span style="color:var(--text-sec); margin-right:10px">${State.security.fingerprint ? 'Enrolled' : 'Off'}</span></div>
                        </div>
                        ${State.security.fingerprint ? `
                        <div class="list-group" style="margin: 0 20px 10px;">
                            <div class="list-item" onclick="Apps.settings.render('fingerprint-icon')"><span>Fingerprint Icon</span><span style="color:var(--text-sec); margin-right:10px"><i class="fas fa-chevron-right" style="font-size:12px; opacity:0.4;"></i></span></div>
                        </div>` : ''}
                    </div>`;
            }
            else if (view === 'fingerprint-icon') {
                headerTitle.innerText = 'Fingerprint Icon';
                const icon = State.security.bioIcon || 'default';
                const _fpPreviewHtml = (ic) => {
                    return '<div style="width:48px;height:48px;border:4px solid rgba(145,147,151,0.7);border-radius:50%"></div>';
                };
                Apps.settings._fpPreviewHtml = _fpPreviewHtml;
                content = `
                    <div class="anim-fade">
                        <div style="display:flex; flex-direction:column; align-items:center; padding:20px 16px; margin-top:20px;">
                            <div id="fp-phone-mockup" style="
                                width: 220px; height: 440px; background: #000; border-radius: 36px;
                                border: 3px solid rgba(255,255,255,0.15); position: relative;
                                display: flex; flex-direction: column; align-items: center;
                                overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                                margin-bottom: 24px;
                            ">
                                <div id="fp-mock-time" style="
                                    margin-top: 60px; font-size: 52px; font-weight: 300; color: white;
                                    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
                                    letter-spacing: 1px;
                                "></div>
                                <div id="fp-mock-date" style="
                                    font-size: 15px; color: rgba(255,255,255,0.6); margin-top: 4px;
                                    font-weight: 500;
                                "></div>
                                <div id="fp-mock-icon" style="
                                    position: absolute; bottom: 30px; width: 48px; height: 48px;
                                    display: flex; align-items: center; justify-content: center;
                                ">${_fpPreviewHtml(icon)}</div>
                            </div>
                            <div class="list-group" style="width:100%; margin-bottom:16px;">
                                <div class="list-item" onclick="Apps.settings.toggleSlowFingerprint()"><span>Slow Animation</span><div class="toggle ${State.security.slowFingerprint ? 'active' : ''}"></div></div>
                            </div>
                            <div style="background:var(--bg-card, rgba(128, 128, 128, 0.06)); border-radius:16px; padding:20px; width:100%; box-sizing:border-box;">
                                <div class="fp-grid" style="gap:24px; justify-content:center;">
                                    <div class="fp-opt selected" onclick="Apps.settings.setBioIconLive('default')" style="width:64px;height:64px;"><div style="width:48px;height:48px;border:4px solid rgba(145,147,151,0.7);border-radius:50%"></div></div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                setTimeout(() => {
                    const updateMockClock = () => {
                        const timeEl = document.getElementById('fp-mock-time');
                        const dateEl = document.getElementById('fp-mock-date');
                        if (!timeEl) return;
                        const now = new Date();
                        const h = now.getHours();
                        const m = now.getMinutes().toString().padStart(2, '0');
                        const h12 = State.clockFormat === '24h' ? h : ((h % 12) || 12);
                        timeEl.innerText = `${h12}:${m}`;
                        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                        if (dateEl) dateEl.innerText = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
                    };
                    updateMockClock();
                    Apps.settings._fpClockInterval = setInterval(updateMockClock, 1000);
                }, 50);
            }
            else if (view === 'pin') {
                headerTitle.innerText = 'Set PIN';
                Apps.settings.tempPin = '';
                content = `
                    <div class="anim-fade" style="text-align:center; padding-top:0px;">
                         <div style="margin-bottom:20px; font-size:18px; padding-top:20px;">Enter new 4-digit PIN</div>
                         <div id="set-pin-disp" style="font-size:30px; letter-spacing:10px; margin-bottom:40px; font-weight:bold; min-height:40px;">_ _ _ _</div>
                         <div class="setup-pin-grid">
                            <button class="setup-pin-btn glass-btn" onclick="Apps.settings.handlePinIn('1')">1</button>
                            <button class="setup-pin-btn glass-btn" onclick="Apps.settings.handlePinIn('2')">2</button>
                            <button class="setup-pin-btn glass-btn" onclick="Apps.settings.handlePinIn('3')">3</button>
                            <button class="setup-pin-btn glass-btn" onclick="Apps.settings.handlePinIn('4')">4</button>
                            <button class="setup-pin-btn glass-btn" onclick="Apps.settings.handlePinIn('5')">5</button>
                            <button class="setup-pin-btn glass-btn" onclick="Apps.settings.handlePinIn('6')">6</button>
                            <button class="setup-pin-btn glass-btn" onclick="Apps.settings.handlePinIn('7')">7</button>
                            <button class="setup-pin-btn glass-btn" onclick="Apps.settings.handlePinIn('8')">8</button>
                            <button class="setup-pin-btn glass-btn" onclick="Apps.settings.handlePinIn('9')">9</button>
                            <button class="setup-pin-btn glass-btn" style="visibility:hidden"></button>
                            <button class="setup-pin-btn glass-btn" onclick="Apps.settings.handlePinIn('0')">0</button>
                            <button class="setup-pin-btn glass-btn" onclick="Apps.settings.render('security')"><i class="fas fa-backspace"></i></button>
                         </div>
                    </div>`;
            }
            else if (view === 'bio') {
                headerTitle.innerText = 'Fingerprint enroll';
                content = `
                    <div class="anim-fade">
                        <div style="display:flex; flex-direction:column; align-items:center; height:100%; position:relative; padding-top:60px;">
                            <div style="text-align:center; padding:0 30px;">
                                <div style="font-size:16px; font-weight:600; margin-bottom:8px;">Register your fingerprint</div>
                                <div style="font-size:13px; color:var(--text-sec); line-height:1.5;">Hold your finger on the sensor below until the circle fills completely.</div>
                            </div>
                            <div style="
                                width: 160px; height: 280px; background: #000; border-radius: 30px;
                                border: 3px solid rgba(255,255,255,0.12); position: relative;
                                display: flex; flex-direction: column; align-items: center;
                                margin-top: 24px;
                                box-shadow: 0 6px 24px rgba(0,0,0,0.4);
                            ">
                                <div style="flex:1;"></div>
                                <i class="fas fa-fingerprint" style="font-size:36px; color:rgba(255,255,255,0.3);"></i>
                                <div style="font-size:11px; color:rgba(255,255,255,0.3); margin-top:10px; margin-bottom:30px;">Hold here ↓</div>
                            </div>
                            <div id="enroll-status" style="height:20px; color:var(--accent); font-weight:600; margin-top:16px;"></div>
                            <div style="flex:1;"></div>
                            <div class="enroll-circle" id="enroll-btn" style="
                                position: absolute; bottom: -200px; left: 50%; transform: translateX(-50%);
                                width: 70px; height: 70px; margin: 0;
                                border-width: 3px; z-index: 10;
                            ">
                                <div class="enroll-fill" id="enroll-fill"></div>
                                <i class="fas fa-fingerprint" style="position:relative; z-index:2; font-size:33px;"></i>
                            </div>
                        </div>
                    </div>
                `;
                setTimeout(() => {
                    const btn = document.getElementById('enroll-btn');
                    const fill = document.getElementById('enroll-fill');
                    const stat = document.getElementById('enroll-status');
                    if (!btn || !fill || !stat) return;
                    let progress = 0;
                    let timer = null;
                    const start = (e) => {
                        e.preventDefault();
                        btn.classList.add('active');
                        stat.innerText = "Scanning...";
                        timer = setInterval(() => {
                            progress += 2;
                            fill.style.height = progress + '%';
                            if (progress >= 100) {
                                clearInterval(timer);
                                State.security.fingerprint = true;
                                stat.innerText = "Success!";
                                stat.style.color = "#34c759";
                                btn.style.borderColor = "#34c759";
                                btn.style.color = "#34c759";
                                Storage.saveSettings();
                                setTimeout(() => Apps.settings.render('security'), 1000);
                            }
                        }, 20);
                    };
                    const end = (e) => {
                        e.preventDefault();
                        clearInterval(timer);
                        btn.classList.remove('active');
                        if (progress < 100) {
                            progress = 0;
                            fill.style.height = '0%';
                            stat.innerText = "Hold longer";
                        }
                    };
                    btn.addEventListener('mousedown', start);
                    btn.addEventListener('mouseup', end);
                    btn.addEventListener('mouseleave', end);
                    btn.addEventListener('touchstart', start);
                    btn.addEventListener('touchend', end);
                }, 50);
            }
            else if (view === 'display') {
                headerTitle.innerText = 'Display';
                content = `<div class="anim-fade"><div class="list-group"><div class="list-item" onclick="Apps.settings.toggleDark()"><span>Dark Mode</span><div class="toggle ${State.darkMode ? 'active' : ''}"></div></div><div class="list-item" style="display:block; cursor:default"><div style="margin-bottom:10px; font-size:14px;">Brightness</div><div class="custom-slider" data-min="20" data-max="100" data-step="1" data-value="${State.brightness}" data-oninput="Apps.settings.setBright(value)"><div class="cs-track"><div class="cs-fill"><div class="cs-thumb"></div></div></div></div></div><div class="list-item" onclick="Apps.settings.toggleGlass()"><span>Liquid Glass</span><div class="toggle ${State.glassUI ? 'active' : ''}"></div></div><div class="list-item" onclick="Apps.settings.toggleTap()"><span>Visual Taps</span><div class="toggle ${State.tapIndicators ? 'active' : ''}"></div></div><div class="list-item" onclick="Apps.settings.toggleLiteMode()"><span>Advanced Textures</span><div class="toggle ${!State.liteMode ? 'active' : ''}"></div></div><div class="list-item" onclick="Apps.settings.toggleFullscreen()"><span>Fullscreen Mode</span><div class="toggle ${document.fullscreenElement ? 'active' : ''}" id="fs-toggle"></div></div></div><div style="margin:10px 20px; font-size:12px; color:var(--text-sec);">Liquid Glass applies a translucent glass effect to the Dock, Volume Bar, and Popups. Fullscreen Mode expands the UI to take up your entire monitor.</div></div>`;
            }
            else if (view === 'wallpaper') {
                headerTitle.innerText = 'Personalization';
                const homeWallUrl = State.wallpapers[State.currentWall] || '';
                const lockWallUrl = State.wallpapers[State.lockWall] || homeWallUrl;
                const homeIsVid = isVideoWallpaper(homeWallUrl);
                const lockIsVid = isVideoWallpaper(lockWallUrl);
                const homeBg = homeIsVid ? '' : `background-image:url('${homeWallUrl}');background-size:cover;background-position:center;`;
                const lockBg = lockIsVid ? '' : `background-image:url('${lockWallUrl}');background-size:cover;background-position:center;`;
                const homeVidEl = homeIsVid ? `<video src="${homeWallUrl}" muted autoplay playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;"></video>` : '';
                const lockVidEl = lockIsVid ? `<video src="${lockWallUrl}" muted autoplay playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;"></video>` : '';

                const gridApps = APPS.filter(a => a.area === 'grid').slice(0, 8);
                const dockApps = APPS.filter(a => a.area === 'dock');

                const getMiniIcon = (app) => {
                    const isHyper = State.iconPack === 'hyperos';
                    const isColor = State.iconPack === 'coloros';
                    const isImagePack = isHyper || isColor;
                    const packIcon = isHyper ? app.hyperIcon : (isColor ? app.colorIcon : null);
                    let bg = isImagePack ? 'transparent' : app.color;
                    let iconContent = '';
                    if (isImagePack && packIcon) {
                        iconContent = `<img src="${packIcon}" style="width:100%; height:100%; object-fit:cover; border-radius: inherit;">`;
                    } else {
                        if (app.id === 'settings') {
                            iconContent = `<div class="settings-icon-gear" style="transform: scale(0.40);"><div class="gear-base"></div><div class="gear-teeth"><div class="tooth"></div><div class="tooth"></div><div class="tooth"></div><div class="tooth"></div><div class="tooth"></div><div class="tooth"></div></div><div class="gear-inner-ring"></div><div class="gear-spoke spoke-1"></div><div class="gear-spoke spoke-2"></div><div class="gear-spoke spoke-3"></div><div class="gear-center-dot"></div></div>`;
                        } else if (app.id === 'camera') {
                            iconContent = `<div class="camera-icon-lens" style="transform: scale(0.48);"><div class="camera-base"></div><div class="lens-outer-ring"></div><div class="lens-inner-black"></div><div class="lens-core-glass"></div><div class="lens-glare-1"></div><div class="lens-glare-2"></div><div class="flash-ring"><div class="flash-bulb"></div></div></div>`;
                            bg = 'linear-gradient(135deg, #fbfbfb 0%, #e8e8e8 50%, #d1d1d1 100%)';
                        } else if (app.id === 'photos') {
                            iconContent = `<div class="photos-icon-flower" style="transform: scale(0.35);"><div class="petal-wrap p1"><div class="petal"></div></div><div class="petal-wrap p2"><div class="petal"></div></div><div class="petal-wrap p3"><div class="petal"></div></div><div class="petal-wrap p4"><div class="petal"></div></div><div class="petal-wrap p5"><div class="petal"></div></div><div class="petal-wrap p6"><div class="petal"></div></div><div class="petal-wrap p7"><div class="petal"></div></div><div class="petal-wrap p8"><div class="petal"></div></div></div>`;
                        } else if (app.id === 'music') {
                            iconContent = `<div class="music-icon-note" style="transform: scale(0.38);"><div class="music-note">&#9834;</div><div class="music-sparkles"><div class="sparkle sparkle-lg" style="top:22%; right:2%;"></div><div class="sparkle sparkle-sm sparkle-green" style="top:55%; left:5%;"></div><div class="sparkle sparkle-xs sparkle-yellow" style="bottom:15%; left:22%;"></div><div class="sparkle sparkle-xs sparkle-orange" style="top:12%; right:22%;"></div></div></div>`;
                        } else if (app.id === 'clock') {
                            const now = new Date();
                            const hDeg = (now.getHours() % 12) * 30 + now.getMinutes() * 0.5;
                            const mDeg = now.getMinutes() * 6;
                            iconContent = `<div class="clock-icon-face" style="transform: scale(0.48);"><div class="clock-hand clock-hour" style="transform: rotate(${hDeg}deg);"></div><div class="clock-hand clock-minute" style="transform: rotate(${mDeg}deg);"></div><div class="clock-center-dot"></div></div>`;
                        } else {
                            const lowBg = (bg || "").toLowerCase().trim();
                            const isWhiteBg = app.id === 'photos' || lowBg === '#fff' || lowBg.startsWith('#ffffff') || lowBg === 'white' || lowBg.replace(/\s/g, '') === 'rgb(255,255,255)';
                            const shadeColor = isWhiteBg ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)';
                            const shadeHtml = `<div style="position:absolute; inset:0; background: radial-gradient(circle at top right, ${shadeColor} 0%, transparent 70%); pointer-events:none; border-radius:inherit; z-index:10;"></div>`;
                            iconContent = `${shadeHtml}<i class="fas ${app.icon}" style="font-size:10px; color:${app.text || 'white'}; display:flex; align-items:center; justify-content:center; width:100%; height:100%;"></i>`;
                        }
                    }
                    if (app.id === 'music' && !(isImagePack && packIcon)) {
                        return `<div style="width:22px;height:22px;border-radius:${OS.getShapeRadius()};background:${bg};position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;">${iconContent || '<i class="fas fa-music" style="font-size:10px; color:white;"></i>'}</div>`;
                    }
                    return `<div style="width:22px;height:22px;border-radius:${OS.getShapeRadius()};background:${bg};position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;">${iconContent}</div>`;
                };

                const miniIcons = gridApps.map(getMiniIcon).join('');
                const miniDock = dockApps.map(getMiniIcon).join('');

                const specialUrls = ['https://i.ibb.co/9HGWgS4w/wallpaper3.jpg', 'https://i.ibb.co/FMtRmsm/wallpaper4.png', 'https://i.ibb.co/ymJxLsYz/wallpaper5.png', 'https://i.ibb.co/43v4xw9/wallpaper6.png'];
                const currentSupportsEffects = isVideoWallpaper(homeWallUrl) || specialUrls.includes(homeWallUrl);

                const cc = State.clockConfig || {};
                const now = new Date();
                let h12 = now.getHours() % 12; if (h12 === 0) h12 = 12;
                const h12Padded = h12 < 10 ? '0' + h12 : h12;
                const mins = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes();
                const bOp = cc.boldOpacity !== undefined ? cc.boldOpacity : 0.72;
                const fw = cc.fontWeight || 600;

                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const dateStr = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;

                let clockHtml = '';
                if (cc.style === 'stretched') {
                    clockHtml = `<div id="ls-preview-time" style="font-size:42px;font-weight:${fw};line-height:0.85;letter-spacing:-1px;font-family:'Oswald',sans-serif;text-shadow:0 2px 6px rgba(0,0,0,0.4);color:#fff">${h12}:${mins}</div>`;
                } else {
                    const fonts = { 'default': "'Inter',sans-serif", 'serif': "'Times New Roman',serif", 'science': "'Rajdhani',sans-serif", 'mono': "'Monoton',cursive", 'lux': "'Luxurious Roman',serif" };
                    const f = cc.font || 'default';
                    clockHtml = `<div id="ls-preview-time" style="font-size:32px;font-weight:${fw};line-height:1;font-family:${fonts[f] || fonts['default']};text-shadow:0 2px 6px rgba(0,0,0,0.4);"><span style="color:${cc.hourColor || '#fff'};opacity:${bOp}">${h12}</span><span style="opacity:${bOp}">:</span><span style="color:${cc.minuteColor || '#fff'};opacity:${bOp}">${mins}</span></div>`;
                }

                content = `
                    <div class="anim-fade" style="padding:0;height:100%;box-sizing:border-box; overflow-y:auto;">
                        <div style="padding:20px 20px 0;">
                            <div style="display:flex;gap:16px;justify-content:center;align-items:flex-start;margin-bottom:24px;">
                                <div style="text-align:center;">
                                    <div class="wall-preview-card ${State.homescreenBlur ? 'blurred-preview' : ''}" id="hs-preview" style="${homeBg}">
                                        ${homeVidEl}
                                        <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;padding:12px 8px 8px;z-index:1;">
                                            <div></div>
                                            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:0 4px;">${miniIcons}</div>
                                            <div style="background:rgba(255,255,255,0.15);backdrop-filter:blur(8px);border-radius:16px;padding:4px 6px;display:flex;justify-content:space-around;margin-top:6px;">${miniDock}</div>
                                        </div>
                                    </div>
                                    <div style="margin-top:8px;font-size:13px;color:var(--text-sec);font-weight:600;">Home Screen</div>
                                </div>
                                <div style="text-align:center;">
                                    <div class="wall-preview-card" id="ls-preview" onclick="Apps.settings.expandPreview('lock')" style="${lockBg}">
                                        ${lockVidEl}
                                        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding-top:30px;z-index:1;">
                                            <div id="ls-preview-date" style="font-size:10px;color:white;opacity:0.8;text-shadow:0 1px 3px rgba(0,0,0,0.5);">${dateStr}</div>
                                            ${clockHtml}
                                        </div>
                                    </div>
                                    <div style="margin-top:8px;font-size:13px;color:var(--text-sec);font-weight:600;">Lock Screen</div>
                                </div>
                            </div>
                        </div>
                        <div style="font-size:13px; color:var(--text-sec); margin: 0 20px 5px;">CUSTOMIZATION</div>
                        <div class="list-group">
                            <div class="list-item" onclick="Apps.settings.render('aod')">
                                <div style="display:flex; align-items:center; gap:12px;"><div class="s-icon-round" style="background:#000; position:relative;"><div style="position:absolute; inset:0; margin:11px; transform:scale(1.3)"><div style="position:absolute; width:4px; height:4px; background:#ad565d; border-radius:50%; top:-1px; left:50%; transform:translate(-50%, -50%);"></div><div style="position:absolute; width:4px; height:4px; background:#ad565d; border-radius:50%; bottom:-1px; left:50%; transform:translate(-50%, 50%);"></div><div style="position:absolute; width:4px; height:4px; background:#e1c285; border-radius:50%; left:-1px; top:50%; transform:translate(-50%, -50%);"></div><div style="position:absolute; width:4px; height:4px; background:#e1c285; border-radius:50%; right:-1px; top:50%; transform:translate(50%, -50%);"></div><div style="position:absolute; width:3.5px; height:6px; background:#2596be; border-radius:1.5px; top:2px; left:2px; transform:translate(-50%,-50%) rotate(-45deg);"></div><div style="position:absolute; width:3.5px; height:6px; background:#2596be; border-radius:1.5px; bottom:2px; right:2px; transform:translate(50%,50%) rotate(-45deg);"></div><div style="position:absolute; width:3.5px; height:6px; background:#6cbb81; border-radius:1.5px; top:2px; right:2px; transform:translate(50%,-50%) rotate(45deg);"></div><div style="position:absolute; width:3.5px; height:6px; background:#6cbb81; border-radius:1.5px; bottom:2px; left:2px; transform:translate(-50%,50%) rotate(45deg);"></div></div></div><span>Always On Display</span></div>
                                <i class="fas fa-chevron-right s-chev"></i>
                            </div>
                        </div>
                        <div class="list-group">
                            <div class="list-item" onclick="Apps.settings.toggleHsBlur()">
                                <span>Home Screen Blur</span>
                                <div class="toggle ${State.homescreenBlur ? 'active' : ''}"></div>
                            </div>
                            <div class="list-item" onclick="if(this.style.opacity !== '0.5') Apps.settings.toggleSpecialEffects()" id="main-sfx-toggle" style="${currentSupportsEffects ? '' : 'opacity:0.5; cursor:default;'}">
                                <span>Special Effects</span>
                                <div class="toggle ${State.specialEffects && currentSupportsEffects ? 'active' : ''}"></div>
                            </div>
                        </div>
                    </div>`;
            }
            else if (view === 'customization') {
                headerTitle.innerText = 'Home screen';
                content = `<div class="anim-fade">
                            <div class="icon-preview-row" id="shape-preview-row" style="margin:20px; padding:15px; background:var(--bg-card); border-radius:12px; display:flex; justify-content:center; gap:20px; align-items:center; position:relative; overflow:hidden;">
                                ${isVideoWallpaper(State.wallpapers[State.currentWall] || '') ? `<video src="${State.wallpapers[State.currentWall]}" muted playsinline style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; filter:blur(10px) brightness(0.7); transform:scale(1.2); z-index:0;"></video>` : `<div style="position:absolute; inset:0; background-image:url('${State.wallpapers[State.currentWall] || ''}'); background-size:cover; background-position:center; filter:blur(10px) brightness(0.7); transform:scale(1.2); z-index:0;"></div>`}
                                ${(() => {
                        const isHyper = State.iconPack === 'hyperos';
                        const isColor = State.iconPack === 'coloros';
                        const isImagePack = isHyper || isColor;
                        const sampleApps = ['phone', 'messages', 'settings', 'camera'];
                        return sampleApps.map(id => {
                            const app = APPS.find(a => a.id === id);
                            const packIcon = isHyper ? app.hyperIcon : (isColor ? app.colorIcon : null);
                            let bg = isImagePack ? 'transparent' : app.color;
                            let iconContent = '';
                            if (isImagePack && packIcon) {
                                iconContent = `<img src="${packIcon}" style="width:100%; height:100%; object-fit:cover; border-radius: inherit;">`;
                            } else {
                                if (app.id === 'settings') {
                                    iconContent = `<div class="settings-icon-gear" style="transform: scale(0.85);"><div class="gear-base"></div><div class="gear-teeth"><div class="tooth"></div><div class="tooth"></div><div class="tooth"></div><div class="tooth"></div><div class="tooth"></div><div class="tooth"></div></div><div class="gear-inner-ring"></div><div class="gear-spoke spoke-1"></div><div class="gear-spoke spoke-2"></div><div class="gear-spoke spoke-3"></div><div class="gear-center-dot"></div></div>`;
                                } else if (app.id === 'camera') {
                                    iconContent = `<div class="camera-icon-lens" style="transform: scale(1.05);"><div class="camera-base"></div><div class="lens-outer-ring"></div><div class="lens-inner-black"></div><div class="lens-core-glass"></div><div class="lens-glare-1"></div><div class="lens-glare-2"></div><div class="flash-ring"><div class="flash-bulb"></div></div></div>`;
                                    bg = 'linear-gradient(135deg, #fbfbfb 0%, #e8e8e8 50%, #d1d1d1 100%)';
                                } else {
                                    iconContent = `<i class="fas ${app.icon}" style="font-size:24px; color:${app.text || 'white'};"></i>`;
                                }
                            }
                            return `<div class="preview-icon-box" style="width:48px; height:48px; position:relative; overflow:hidden; display:flex; justify-content:center; align-items:center; background:${bg}; border-radius:${OS.getShapeRadius()}!important; z-index:1; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">${iconContent}</div>`;
                        }).join('');
                    })()}
                            </div>
                            <div style="padding:0 20px 5px; font-size:13px; color:var(--text-sec);">APP SHAPE</div>
                            <div class="list-group">
                                <div class="list-item" style="display:block; cursor:default">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                        <span>Corner Radius</span>
                                        <span id="shape-value" style="color:var(--text-sec)">${(parseInt(State.appShape) || 50) - 27}%</span>
                                    </div>
                                    <div class="custom-slider" data-min="27" data-max="50" data-step="1" data-value="${State.appShape || 50}" data-oninput="Apps.settings.setAppShape(parseInt(value)); document.getElementById('shape-value').innerText = Math.round(value - 27) + '%'"><div class="cs-track"><div class="cs-fill"><div class="cs-thumb"></div></div></div></div>
                                </div>
                            </div>
                            <div style="padding:0 20px 5px; font-size:13px; color:var(--text-sec); margin-top:10px;">ANIMATION</div>
                            <div class="list-group">
                                <div class="list-item" style="display:block; cursor:default">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                        <span>Animation Speed</span>
                                        <span id="speed-value" style="color:var(--text-sec)">${State.animationSpeed}x</span>
                                    </div>
                                    <div class="custom-slider" data-min="0.5" data-max="10" data-step="0.25" data-value="${State.animationSpeed}" data-oninput="Apps.settings.setAnimSpeed(parseFloat(value)); document.getElementById('speed-value').innerText = value + 'x'"><div class="cs-track"><div class="cs-fill"><div class="cs-thumb"></div></div></div></div>
                                </div>
                                ${State.homescreenBlur ? `
                                <div class="list-item" style="opacity:0.6; pointer-events:none; align-items:flex-start;">
                                    <div style="display:flex; flex-direction:column;">
                                        <span>Blur Behind Apps</span>
                                        <span style="font-size:12px; margin-top:4px; opacity:0.8;">Homescreen blur is enabled.</span>
                                    </div>
                                    <div class="toggle"></div>
                                </div>
                                ` : `
                                <div class="list-item" onclick="Apps.settings.toggleBlurBehindApps()">
                                    <span>Blur Behind Apps</span>
                                    <div class="toggle ${State.blurBehindApps ? 'active' : ''}"></div>
                                </div>
                                `}
                            </div>


                            <div style="padding:0 20px 5px; font-size:13px; color:var(--text-sec); margin-top:10px;">HOME SCREEN</div>
                            <div class="list-group">
                                <div class="list-item" onclick="Apps.settings.toggleHideLabels()">
                                    <span>Hide App Labels</span>
                                    <div class="toggle ${State.hideAppLabels ? 'active' : ''}"></div>
                                </div>
                                <div class="list-item">
                                    <span>Icon Pack</span>
                                    <div class="settings-dropdown" id="sd-icon-pack">
                                        <div class="sd-trigger" onclick="Apps.settings.toggleDropdown(this)">
                                            <span class="sd-value" id="sd-icon-pack-val">${(!State.iconPack || State.iconPack === 'hyperos') ? 'HyperOS' : 'ColorOS'}</span>
                                            <i class="fas fa-chevron-down sd-chevron"></i>
                                        </div>
                                        <div class="sd-options">
                                            <div class="sd-option" onclick="Apps.settings.setIconPack('hyperos')"><span>HyperOS</span>${(!State.iconPack || State.iconPack === 'hyperos') ? '<i class="fas fa-check"></i>' : ''}</div>
                                            <div class="sd-option" onclick="Apps.settings.setIconPack('coloros')"><span>ColorOS</span>${State.iconPack === 'coloros' ? '<i class="fas fa-check"></i>' : ''}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="list-group" style="margin-top:10px;">
                                <div class="list-item" style="display:block; cursor:default">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                        <span>Icon Size</span>
                                        <span id="appsize-value" style="color:var(--text-sec)">${State.appSize || 64}px</span>
                                    </div>
                                    <div class="custom-slider" data-min="40" data-max="90" data-step="1" data-value="${State.appSize || 64}" data-oninput="State.appSize = parseInt(value); document.documentElement.style.setProperty('--app-size-num', value); document.documentElement.style.setProperty('--app-size', value + 'px'); document.getElementById('appsize-value').innerText = value + 'px'; Storage.saveSettings();"><div class="cs-track"><div class="cs-fill"><div class="cs-thumb"></div></div></div></div>
                                </div>
                                <div class="list-item" onclick="Apps.settings.render('animconfig')">
                                    <span>Animations Configuration</span>
                                    <i class="fas fa-chevron-right" style="color:#ccc; font-size:14px"></i>
                                </div>
                            </div>`;
            }
            else if (view === 'animconfig') {
                headerTitle.innerText = 'Animations';
                const ac = State.animConfig;
                content = `<div class="anim-fade">
                    <div style="display:flex; justify-content:center; padding:10px 0 5px;">
                        <div class="anim-preview-container" id="anim-preview-box">
                            <div class="ap-wallpaper" id="ap-wall">${isVideoWallpaper(State.wallpapers[State.currentWall] || '') ? `<video id="ap-wall-video" src="${State.wallpapers[State.currentWall]}" muted playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"></video>` : ''}</div>
                            <div class="ap-icon" id="ap-icon" style="background:#8e8e93;">
                                <i class="fas fa-cog" style="font-size:16px; color:white;"></i>
                            </div>
                            <div class="ap-window" id="ap-window" style="opacity:0;">
                                <div class="ap-icon-overlay" id="ap-overlay" style="opacity:1; background:#8e8e93; position:absolute; inset:0; display:flex; justify-content:center; align-items:center; z-index:5; border-radius:inherit;">
                                    <i class="fas fa-cog" style="font-size:16px; color:white;"></i>
                                </div>
                                <div class="ap-win-content" style="position:relative; z-index:1;">Settings</div>
                            </div>
                        </div>
                    </div>
                    <div style="text-align:center; font-size:12px; color:var(--text-sec); margin-bottom:15px;">Animation Preview</div>
                    <div style="padding:0 20px 5px; font-size:13px; color:var(--text-sec);">OPENING ANIMATION</div>
                    <div class="list-group">
                        <div class="list-item anim-config-slider">
                            <div class="ac-label-row"><span>Icon Fade Out</span><span class="ac-value" id="ac-open-icon-val">${(ac.openIconFade * 100).toFixed(0)}%</span></div>
                            <div class="custom-slider" data-min="5" data-max="80" data-step="1" data-value="${ac.openIconFade * 100}" data-oninput="Apps.settings.setAnimConfig('openIconFade', value / 100)"><div class="cs-track"><div class="cs-fill"><div class="cs-thumb"></div></div></div></div>
                            <div class="ac-range-labels"><span>Fast</span><span>Slow</span></div>
                        </div>
                    </div>
                    <div class="list-group" style="margin-top:10px;">

                        <div class="list-item anim-config-slider">
                            <div class="ac-label-row"><span>Zoom Out Scale</span><span class="ac-value" id="ac-zoom-out-val">${((ac.openAppZoomOut !== undefined ? ac.openAppZoomOut : 0.98) * 100).toFixed(0)}%</span></div>
                            <div class="custom-slider" data-min="10" data-max="100" data-step="1" data-value="${(ac.openAppZoomOut !== undefined ? ac.openAppZoomOut : 0.98) * 100}" data-oninput="Apps.settings.setAnimConfig('openAppZoomOut', value / 100)"><div class="cs-track"><div class="cs-fill"><div class="cs-thumb"></div></div></div></div>
                            <div class="ac-range-labels"><span>Far</span><span>Near</span></div>
                        </div>
                    </div>
                    <div style="padding:0 20px 5px; font-size:13px; color:var(--text-sec); margin-top:10px;">WALLPAPER EFFECTS</div>
                    <div class="list-group">
                        <div class="list-item anim-config-slider">
                            <div class="ac-label-row"><span>Wallpaper Zoom</span><span class="ac-value" id="ac-wall-zoom-val">${((ac.openWallZoom !== undefined ? ac.openWallZoom : 1.05) * 100).toFixed(0)}%</span></div>
                            <div class="custom-slider" data-min="100" data-max="150" data-step="1" data-value="${(ac.openWallZoom !== undefined ? ac.openWallZoom : 1.05) * 100}" data-oninput="Apps.settings.setAnimConfig('openWallZoom', value / 100)"><div class="cs-track"><div class="cs-fill"><div class="cs-thumb"></div></div></div></div>
                            <div class="ac-range-labels"><span>Normal</span><span>Deep</span></div>
                        </div>

                    </div>
                    <div style="padding:0 20px 5px; font-size:13px; color:var(--text-sec); margin-top:10px;">CLOSING ANIMATION</div>
                    <div class="list-group">
                        <div class="list-item anim-config-slider">
                            <div class="ac-label-row"><span>Icon Fade</span><span class="ac-value" id="ac-close-icon-val">${(ac.closeIconFade * 100).toFixed(0)}%</span></div>
                            <div class="custom-slider" data-min="50" data-max="300" data-step="5" data-value="${ac.closeIconFade * 100}" data-oninput="Apps.settings.setAnimConfig('closeIconFade', value / 100)"><div class="cs-track"><div class="cs-fill"><div class="cs-thumb"></div></div></div></div>
                            <div class="ac-range-labels"><span>Fast</span><span>Slow</span></div>
                        </div>
                        <div class="list-item anim-config-slider">
                            <div class="ac-label-row"><span>Shape Transform</span><span class="ac-value" id="ac-close-shape-val">${(ac.closeShapeMorph * 100).toFixed(0)}%</span></div>
                            <div class="custom-slider" data-min="10" data-max="60" data-step="1" data-value="${ac.closeShapeMorph * 100}" data-oninput="Apps.settings.setAnimConfig('closeShapeMorph', value / 100)"><div class="cs-track"><div class="cs-fill"><div class="cs-thumb"></div></div></div></div>
                            <div class="ac-range-labels"><span>Early</span><span>Late</span></div>
                        </div>
                    </div>
                    <div style="text-align:center; padding:15px 20px;">
                        <button class="btn-pill" style="background:var(--text-sec); opacity:0.6; margin-bottom:10px;" onclick="State.animConfig = {openIconFade:0.1, closeIconFade:1.5, wallBlurDur:0.12, closeShapeMorph:0.34, openBezier:[0.2,0.85,0.1,1], openScaleBezier:[0.2,0.85,0.1,1], openScaleTime:0.5, closeBezier:[0.15,1.01,0.3,1.02], openAppZoomOut:0.98, openWallZoom:1.03, openWallBlur:State.animConfig.openWallBlur, fadeBoxes:State.animConfig.fadeBoxes}; Storage.saveSettings(); Apps.settings.render('animconfig');">Reset to Defaults</button>
                    </div>
                </div>`;
                setTimeout(() => { Apps.settings.initAnimPreview(); }, 100);
            }
            else if (view === 'profile') {
                headerTitle.innerText = 'Profile';
                content = `<div class="anim-fade">
                            <div class="setup-profile-container" style="margin-top:20px;">
                                <div class="setup-profile-icon" id="settings-profile-avatar" onclick="document.getElementById('profile-input').click()">
                                    ${State.userProfile.image ?
                        `<img src="${State.userProfile.image}">` :
                        `<i class="fas fa-user"></i>`}
                                    <div class="setup-profile-edit"><i class="fas fa-camera"></i></div>
                                </div>
                            </div>
                            <div style="padding:0 20px 5px; font-size:13px; color:var(--text-sec);">NAME</div>
                            <div style="margin:0 20px 20px;">
                                <input type="text" value="${State.userProfile.name}" placeholder="Enter your name"
                                    onkeydown="event.stopPropagation()"
                                    onchange="Apps.settings.updateProfile(this.value, null)"
                                    style="width:100%; padding:12px; border-radius:10px; border:none; background:rgba(128,128,128,0.1); color:var(--text-main); font-size:16px;">
                            </div>
                            <div style="padding:0 20px; color:var(--text-sec); font-size:12px; text-align:center;">
                                Tap the icon to change profile picture
                            </div>
                        </div>`;
                document.getElementById('profile-input').onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                            Apps.settings.updateProfile(State.userProfile.name, evt.target.result);
                        };
                        reader.readAsDataURL(file);
                    }
                };
            }
            else if (view === 'additional') {
                headerTitle.innerText = 'Additional settings';
                const frameColor = State.frameColor || 'black';
                const frameColorLabels = { black: 'Black', grey: 'Grey', white: 'White', pink: 'Light Pink' };
                content = `<div class="anim-fade">
                    <div class="list-group">
                        <div class="list-item" onclick="Apps.settings.render('navigation')"><span>Navigation</span><i class="fas fa-chevron-right s-chev"></i></div>
                        ${State.devOptionsEnabled ? `<div class="list-item" onclick="Apps.settings.render('developer')"><span>Developer options</span><i class="fas fa-chevron-right s-chev"></i></div>` : ''}
                    </div>
                    <div style="padding:0 20px 5px; margin-top:15px; font-size:13px; color:var(--text-sec);">PHONE FRAME COLOR</div>
                    <div class="list-group">
                        <div class="list-item">
                            <span>Frame Color</span>
                            <div class="settings-dropdown" id="sd-frame-color">
                                <div class="sd-trigger" onclick="Apps.settings.toggleDropdown(this)">
                                    <span class="sd-value" id="sd-frame-color-val">${frameColorLabels[frameColor]}</span>
                                    <i class="fas fa-chevron-down sd-chevron"></i>
                                </div>
                                <div class="sd-options">
                                    <div class="sd-option" onclick="Apps.settings.setFrameColor('black')"><span>Black</span>${frameColor === 'black' ? '<i class="fas fa-check"></i>' : ''}</div>
                                    <div class="sd-option" onclick="Apps.settings.setFrameColor('grey')"><span>Grey</span>${frameColor === 'grey' ? '<i class="fas fa-check"></i>' : ''}</div>
                                    <div class="sd-option" onclick="Apps.settings.setFrameColor('white')"><span>White</span>${frameColor === 'white' ? '<i class="fas fa-check"></i>' : ''}</div>
                                    <div class="sd-option" onclick="Apps.settings.setFrameColor('pink')"><span>Light Pink</span>${frameColor === 'pink' ? '<i class="fas fa-check"></i>' : ''}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
            }
            else if (view === 'developer') {
                headerTitle.innerText = 'Developer options';
                content = `<div class="anim-fade">
                    <div style="padding:0 20px 5px; margin-top:5px; font-size:13px; color:var(--text-sec);">DEVICE DIMENSIONS (IGNORED IN FULLSCREEN)</div>
                    <div class="list-group">
                        <div class="list-item" style="display:block; cursor:default">
                            <div style="margin-bottom:10px; font-size:14px; display:flex; justify-content:space-between; align-items:center;">
                                <span>Reset Defaults</span>
                                <button onclick="Apps.settings.resetDevDimensions()" style="padding:6px 16px; border-radius:12px; border:none; background:rgba(255,255,255,0.1); color:var(--text-main); font-weight:600; cursor:pointer;">Reset</button>
                            </div>
                        </div>
                        <div class="list-item" style="display:block; cursor:default">
                            <div style="margin-bottom:10px; font-size:14px; display:flex; justify-content:space-between;">
                                <span>Phone Width (px)</span>
                                <span style="color:var(--text-sec)" id="dev-width-val">${State.devWidth || 400}</span>
                            </div>
                            <div class="custom-slider" data-min="400" data-max="1600" data-step="10" data-value="${State.devWidth || 400}" data-oninput="Apps.settings.setDevWidth(value)">
                                <div class="cs-track"><div class="cs-fill"><div class="cs-thumb"></div></div></div>
                            </div>
                        </div>
                    </div>
                    <div style="padding:0 20px 5px; margin-top:15px; font-size:13px; color:var(--text-sec);">PERFORMANCE</div>
                    <div class="list-group">
                        <div class="list-item" onclick="Apps.settings.toggleFps()">
                            <span>Show Real-time FPS</span>
                            <div class="toggle ${State.showFps ? 'active' : ''}"></div>
                        </div>
                    </div>
                </div>`;

            }
            else if (view === 'navigation') {
                headerTitle.innerText = 'Navigation';
                const isGesture = State.navStyle !== 'buttons';
                content = `<div class="anim-fade">
                    <div style="display:flex; gap:16px; justify-content:center; padding:20px 20px 24px;">
                        <div style="text-align:center;">
                            <div style="width:110px; height:200px; background:#000; border-radius:20px; border:3px solid rgba(128,128,128,0.3); position:relative; overflow:hidden; display:flex; flex-direction:column;">
                                <div style="flex:1; display:flex; align-items:center; justify-content:center;">
                                    <div style="width:60px; height:40px; border-radius:8px; background:rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center;">
                                        <div style="width:36px; height:24px; border-radius:4px; background:rgba(255,255,255,0.15);"></div>
                                    </div>
                                </div>
                                <div style="display:flex; justify-content:center; padding-bottom:8px;">
                                    <div style="width:36px; height:4px; border-radius:2px; background:rgba(255,255,255,0.6);"></div>
                                </div>
                            </div>
                            <div style="margin-top:8px; font-size:12px; color:var(--text-sec); font-weight:400;">Gestures</div>
                        </div>
                        <div style="text-align:center;">
                            <div style="width:110px; height:200px; background:#000; border-radius:20px; border:3px solid rgba(128,128,128,0.3); position:relative; overflow:hidden; display:flex; flex-direction:column;">
                                <div style="flex:1; display:flex; align-items:center; justify-content:center;">
                                    <div style="width:60px; height:40px; border-radius:8px; background:rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center;">
                                        <div style="width:36px; height:24px; border-radius:4px; background:rgba(255,255,255,0.15);"></div>
                                    </div>
                                </div>
                                <div style="display:flex; justify-content:center; gap:12px; padding-bottom:8px; align-items:center;">
                                    <i class="fas fa-caret-left" style="font-size:16px; color:rgba(255,255,255,0.5);"></i>
                                    <i class="fas fa-circle" style="font-size:10px; color:rgba(255,255,255,0.5);"></i>
                                    <i class="fas fa-square" style="font-size:9px; border-radius:2px; color:rgba(255,255,255,0.5);"></i>
                                </div>
                            </div>
                            <div style="margin-top:8px; font-size:12px; color:var(--text-sec); font-weight:400;">3-Button</div>
                        </div>
                    </div>
                    <div style="padding:0 20px 5px; font-size:13px; color:var(--text-sec);">NAVIGATION STYLE</div>
                    <div class="list-group">
                        <div class="list-item">
                            <span>Style</span>
                            <div class="settings-dropdown" id="sd-nav-style">
                                <div class="sd-trigger" onclick="Apps.settings.toggleDropdown(this)">
                                    <span class="sd-value" id="sd-nav-style-val">${isGesture ? 'Swipe Gestures' : '3-Button'}</span>
                                    <i class="fas fa-chevron-down sd-chevron"></i>
                                </div>
                                <div class="sd-options">
                                    <div class="sd-option" onclick="Apps.settings.setNav('swipe')"><span>Swipe Gestures</span>${isGesture ? '<i class="fas fa-check"></i>' : ''}</div>
                                    <div class="sd-option" onclick="Apps.settings.setNav('buttons')"><span>3-Button</span>${!isGesture ? '<i class="fas fa-check"></i>' : ''}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style="margin:10px 20px; font-size:12px; color:var(--text-sec); line-height:1.5;">Swipe Gestures uses a single bar at the bottom. Swipe up to go home. 3-Button Navigation uses traditional back, home, and recents buttons.</div>
                </div>`;
            }
            else if (view === 'about') {
                let storageTxt = '0 KB';
                try {
                    let bs = 0;
                    for (let i = 0; i < localStorage.length; i++) {
                        let k = localStorage.key(i);
                        bs += localStorage.getItem(k).length * 2;
                    }
                    storageTxt = bs > 1024 * 1024 ? (bs / 1024 / 1024).toFixed(2) + ' MB' : (bs / 1024).toFixed(2) + ' KB';
                    storageTxt += ' / 5.00 MB';
                } catch (e) { }
                const auraClass = State.darkMode ? 'aura-dark' : 'aura-light';
                const phoneName = State.phoneName || 'RealPhone 2 Ultra';
                content = `<div class="anim-fade-overlay about-wrapper" style="padding-top:90px; position:relative; min-height:100%; overflow-y:auto;">
                            <div class="aura-container ${auraClass}" style="position:fixed; height:77%; z-index:0;">
                                <div class="aura-circle ac-1"></div>
                                <div class="aura-circle ac-2"></div>
                                <div class="aura-circle ac-3"></div>
                                <div class="aura-circle ac-4"></div>
                            </div>
                            <div id="about-container" style="z-index:1;">
                                <div class="about-hero" style="position:relative;">
                                <div class="realos-text">RealOS</div>
                            </div>
                                <div class="about-ver-text" style="text-align:center; color:var(--text-main); margin-top:16px; margin-bottom: 51px;position: relative;font-size: 18px;bottom: 50px;opacity: 0.6;">3.0.307.0</div>
                            </div>
                            <div style="padding:0; position:relative; z-index:2;">
                                
                                <div class="about-specs-box" style="padding: 15px 20px; min-height: auto;">
                                    <div class="list-item about-list-item" style="cursor:pointer;" onclick="Apps.settings.renamePhone()">
                                        <span style="font-weight:600; color:var(--text-main); font-size:18px;">Name</span>
                                        <span class="val" id="about-phone-name-val">${phoneName}</span>
                                    </div>
                                    <div class="list-item about-list-item" style="cursor:pointer;" onclick="Apps.settings.handleOSClick()">
                                        <span style="font-weight:600; color:var(--text-main); font-size:18px;">OS Version</span>
                                        <span class="val">OS3.0.307.0.WPACNXM</span>
                                    </div>
                                    <div class="list-item about-list-item" style="cursor:default;">
                                        <span style="font-weight:600; color:var(--text-main); font-size:18px;">Browser Storage</span>
                                        <span class="val">${storageTxt}</span>
                                    </div>
                                </div>

                                <div class="about-specs-box">
                                    <div class="about-specs-title" id="about-phone-name-title">RealPhone 2 Ultra</div>
                                    <div class="about-spec-item">
                                        <span class="as-val">RP-G2U</span>
                                        <span class="as-name">Model</span>
                                    </div>
                                    <div class="about-spec-item">
                                        <span class="as-val">RealCPU Gen 2+</span>
                                        <span class="as-name">Chipset</span>
                                    </div>
                                    <div class="about-spec-item">
                                        <span class="as-val">12GB</span>
                                        <span class="as-name">RAM</span>
                                    </div>
                                    <div class="about-spec-item">
                                        <span class="as-val">6500 mAh</span>
                                        <span class="as-name">Battery</span>
                                    </div>
                                    <div class="about-spec-item">
                                        <span class="as-val">512GB</span>
                                        <span class="as-name">Storage</span>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                setTimeout(() => {
                    const overlay = document.getElementById('settings-section-overlay');
                    const aura = overlay ? overlay.querySelector('.aura-container') : null;
                    const aboutContainer = overlay ? overlay.querySelector('#about-container') : null;
                    if (overlay && (aura || aboutContainer)) {
                        overlay.addEventListener('scroll', () => {
                            const scrollTop = overlay.scrollTop;
                            const fadeDistance = 200;
                            const opacity = Math.max(0, 1 - (scrollTop / fadeDistance));
                            if (aura) aura.style.opacity = opacity;
                            if (aboutContainer) {
                                const ver = aboutContainer.querySelector('.realos-ver');
                                if (ver) ver.style.opacity = opacity;
                                Array.from(aboutContainer.children).forEach(child => {
                                    if (!child.classList.contains('about-hero')) {
                                        child.style.opacity = child.classList.contains('about-ver-text') ? opacity * 0.6 : opacity;
                                    }
                                });
                            }
                        });
                    }
                }, 300);
            } else if (view === 'changelog') {
                headerTitle.innerText = 'Changelogs';
                content = `<div class="anim-fade" style="padding: 0; overflow-y:auto; height: 100%; box-sizing: border-box; background: var(--bg-app); color: var(--text-main);">
                    <div style="padding: 0 20px 20px;">
                        <div class="s-section" style="padding: 20px;">
                            <div style="font-weight: 600; font-size: 18px; margin-bottom: 10px; color: var(--text-main);">RealOS 3.0 Inital Release</div>
                            <div id="changelog-content" style="opacity: 0.8; line-height: 1.5;">
                                This new RealOS release brings many customization options, refined UI and better optimization for low end devices<br>

                               <br><strong>What's New</strong><br>

                               <br> &bull; Redesigned Settings app<br>
                               (now with smooother slide animations and UI enhancements)<br>
                               <br> &bull; New Improved and Optimized App animations<br>
                               (runs slightly better on low end devices and improved app animations greatly)<br>
                               <br> &bull; New RealOS animated icons<br>
                               (some icons don't have an animated icon yet, new ones will soon be added)<br>
                               <br> &bull; New Empty apps<br>
                               (added by holding an empty space in homescreen and pressing the + button)<br>
                               <br> &bull; New Clock Customization<br>
                               (Accessed by holding an empty space in the lockscreen and clicking on the clock)<br>
                               <br> &bull; New Control center<br>
                               <br> &bull; New liquid glass effect<br>
                               <br> &bull; Dynamic island improvements & bug fixes<br>
                               <br> &bull; New Fullscreen mode<br>
                               <br> &bull; New Corner/Shape radius slider<br>
                               <br> &bull; New Setup Screen<br>
                               <br> &bull; New Advanced toggles and options for app opening and closing animations<br>
                               <br> &bull; + More 
                            </div>
                        </div>
                    </div>
                </div>`;
            }
            if (view !== 'root' && content) {
                const subSectionParents = { 'aod': 'wallpaper', 'animconfig': 'customization', 'changelog': 'about', 'fingerprint-icon': 'security', 'bio': 'security', 'pin': 'security', 'navigation': 'additional' };
                const parentView = subSectionParents[view];
                const backTarget = parentView || 'root';
                const titleText = headerTitle.innerText || '';
                const isAboutView = view === 'about';
                const isChangelogView = view === 'changelog';
                const headerStyle = isAboutView ? 'background:transparent !important; position:absolute; top:0; left:0; right:0; z-index:100;' : '';
                let inlineHeader = '';
                const backArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" style="width:22px;height:22px;"><path fill="currentColor" d="M71 303C61.6 312.4 61.6 327.6 71 336.9L239 505C248.4 514.4 263.6 514.4 272.9 505C282.2 495.6 282.3 480.4 272.9 471.1L145.9 344L552 344C565.3 344 576 333.3 576 320C576 306.7 565.3 296 552 296L145.9 296L273 169C282.4 159.6 282.4 144.4 273 135.1C263.6 125.8 248.4 125.7 239.1 135.1L71 303z"/></svg>`;
                if (isChangelogView) {
                    inlineHeader = `<div class="settings-inline-header" style="${headerStyle}"><span class="settings-inline-back" onclick="Apps.settings.render('${backTarget}')">${backArrowSvg}</span><span class="settings-inline-title">${titleText}</span><span style="width:40px"></span></div>`;
                } else {
                    inlineHeader = `<div class="settings-inline-header" style="${headerStyle}"><span class="settings-inline-back" onclick="Apps.settings.render('${backTarget}')">${backArrowSvg}</span><span class="settings-inline-title">${isAboutView ? '' : titleText}</span><span style="width:40px"></span></div>`;
                }
                content = content.replace(/(<div class="anim-fade[^>]*>)/, '$1' + inlineHeader);
                headerTitle.innerText = '';
            }
            if (isForward) {
                const screenDimEl = document.getElementById('screen');
                if (screenDimEl) screenDimEl.classList.add('settings-subpage-dim');
                const overlay = document.createElement('div');
                overlay.className = 'settings-section-overlay';
                if (isSubForward) {
                    overlay.id = 'settings-sub-overlay';
                    const parentOverlay = document.getElementById('settings-section-overlay');
                    if (parentOverlay) {
                        const parentFade = parentOverlay.querySelector('.anim-fade');
                        parentOverlay.style.filter = '';
                        parentOverlay.style.transition = '';
                        parentOverlay.style.transform = '';
                        if (parentFade) {
                            parentFade.style.transition = 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)';
                            parentFade.style.transform = 'translateX(-80px)';
                        }
                        let pveil = parentOverlay.querySelector('.settings-parent-dim-veil');
                        if (!pveil) {
                            pveil = document.createElement('div');
                            pveil.className = 'settings-parent-dim-veil';
                            parentOverlay.appendChild(pveil);
                        }
                        pveil.classList.remove('visible');
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => { pveil.classList.add('visible'); });
                        });
                    }
                } else {
                    overlay.id = 'settings-section-overlay';
                    const rootFade = body.querySelector('.anim-fade');
                    body.style.filter = '';
                    body.style.transition = '';
                    body.style.transform = '';
                    if (rootFade) {
                        rootFade.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                        rootFade.style.transform = 'translateX(-80px)';
                    }
                    let mainVeil = document.getElementById('settings-main-dim-veil');
                    if (!mainVeil) {
                        mainVeil = document.createElement('div');
                        mainVeil.id = 'settings-main-dim-veil';
                        const bodyEl = document.getElementById('app-body');
                        if (bodyEl && bodyEl.parentNode) bodyEl.parentNode.insertBefore(mainVeil, bodyEl.nextSibling);
                        else win.appendChild(mainVeil);
                    }
                    mainVeil.classList.remove('settings-dim-veil-visible');
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            mainVeil.classList.add('settings-dim-veil-visible');
                        });
                    });
                    if (view !== 'about') {
                        appHeader.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                        appHeader.style.transform = 'translateX(-80px)';
                        appHeader.style.filter = '';
                        appHeader.classList.remove('settings-header-dim', 'settings-header-dim-visible');
                    }
                }
                overlay.style.background = 'var(--bg-app)';
                overlay.style.color = 'var(--text-main)';
                overlay.innerHTML = content;
                win.appendChild(overlay);
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        overlay.classList.add('active');
                    });
                });

            } else if (isBack) {
                if (isSubBack) {
                    const subOverlay = document.getElementById('settings-sub-overlay');
                    if (subOverlay) {
                        subOverlay.classList.remove('active');
                        subOverlay.classList.add('exiting');
                        setTimeout(() => {
                            if (subOverlay && subOverlay.parentNode) subOverlay.remove();
                        }, 350);
                    }
                    const parentOverlay = document.getElementById('settings-section-overlay');
                    if (parentOverlay) {
                        const pVeil = parentOverlay.querySelector('.settings-parent-dim-veil');
                        if (pVeil) pVeil.remove();
                        const parentFade = parentOverlay.querySelector('.anim-fade');
                        parentOverlay.style.transform = '';
                        const parentItems = parentOverlay.querySelectorAll('.list-item');
                        parentItems.forEach(item => {
                            const span = item.querySelector('span');
                            if (!span) return;
                            const txt = span.textContent.trim();
                            const valSpan = item.querySelectorAll('span')[1];
                            if ((txt === 'Set PIN' || txt === 'Change PIN') && valSpan) {
                                span.textContent = State.security.pin ? 'Change PIN' : 'Set PIN';
                                valSpan.textContent = State.security.pin ? 'On' : 'Off';
                            }
                            if (txt === 'Fingerprint' && valSpan) {
                                valSpan.textContent = State.security.fingerprint ? 'Enrolled' : 'Off';
                                span.style.opacity = State.security.pin ? '' : '0.5';
                                item.setAttribute('onclick', State.security.pin ? "Apps.settings.render('bio')" : "Toast.show('Set a PIN first')");
                            }
                        });
                        if (State.security.fingerprint && Apps.settings.view === 'security') {
                            const existingFpIcon = parentOverlay.querySelector('[onclick*="fingerprint-icon"]');
                            if (!existingFpIcon) {
                                const lastGroup = parentOverlay.querySelector('.anim-fade');
                                if (lastGroup) {
                                    const fpGroup = document.createElement('div');
                                    fpGroup.className = 'list-group';
                                    fpGroup.style.margin = '0 20px 10px';
                                    fpGroup.innerHTML = `<div class="list-item" onclick="Apps.settings.render('fingerprint-icon')"><span>Fingerprint Icon</span><span style="color:var(--text-sec); margin-right:10px"><i class="fas fa-chevron-right" style="font-size:12px; opacity:0.4;"></i></span></div>`;
                                    lastGroup.appendChild(fpGroup);
                                }
                            }
                        }
                        if (parentFade) {
                            parentFade.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                            parentFade.style.transform = '';
                        }
                        setTimeout(() => {
                            parentOverlay.style.transition = '';
                        }, 350);
                        if (view === 'about') {
                            parentOverlay.innerHTML = content;
                        }
                    }
                } else {
                    const subOverlay = document.getElementById('settings-sub-overlay');
                    if (subOverlay) {
                        subOverlay.classList.remove('active');
                        subOverlay.classList.add('exiting');
                        setTimeout(() => {
                            if (subOverlay && subOverlay.parentNode) subOverlay.remove();
                        }, 350);
                    }
                    const overlay = document.getElementById('settings-section-overlay');
                    if (overlay) {
                        overlay.classList.remove('active');
                        overlay.classList.add('exiting');
                        setTimeout(() => {
                            if (overlay && overlay.parentNode) overlay.remove();
                        }, 350);
                    }
                    const rootFadeBack = body.querySelector('.anim-fade');
                    const mainVeilBack = document.getElementById('settings-main-dim-veil');
                    if (mainVeilBack) mainVeilBack.classList.remove('settings-dim-veil-visible');
                    body.style.filter = '';
                    body.style.transition = '';
                    body.style.transform = '';
                    if (rootFadeBack) {
                        rootFadeBack.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                        rootFadeBack.style.transform = '';
                    }
                    appHeader.classList.remove('settings-header-dim', 'settings-header-dim-visible');
                    appHeader.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    appHeader.style.transform = '';
                    appHeader.style.filter = '';
                    const screenUndim = document.getElementById('screen');
                    if (screenUndim) screenUndim.classList.remove('settings-subpage-dim');
                    setTimeout(() => {
                        body.style.transition = '';
                        appHeader.style.transition = '';
                        if (rootFadeBack) rootFadeBack.style.transition = '';
                        appHeader.classList.remove('settings-header-dim', 'settings-header-dim-visible');
                        if (mainVeilBack && mainVeilBack.parentNode) mainVeilBack.remove();
                    }, 350);
                }
            } else {
                const subOverlay = document.getElementById('settings-sub-overlay');
                const overlay = document.getElementById('settings-section-overlay');
                if (['aod', 'clockconfig', 'animconfig'].includes(view) && subOverlay) {
                    subOverlay.innerHTML = content;
                } else if (overlay && view !== 'root') {
                    overlay.innerHTML = content;
                } else {
                    body.style.filter = '';
                    body.style.transform = '';
                    body.style.transition = '';
                    appHeader.classList.remove('settings-header-dim', 'settings-header-dim-visible');
                    const screenRoot = document.getElementById('screen');
                    if (screenRoot) screenRoot.classList.remove('settings-subpage-dim');
                    const rootVeil = document.getElementById('settings-main-dim-veil');
                    if (rootVeil) rootVeil.remove();
                    body.innerHTML = content;
                }
            }
            setTimeout(() => Apps.settings.initSliders(), 50);
        },
        handlePinIn: (n) => {
            if (Apps.settings.tempPin.length < 4) {
                Apps.settings.tempPin += n;
                document.getElementById('set-pin-disp').innerText = Apps.settings.tempPin.padEnd(4, '_').split('').join(' ');
                if (Apps.settings.tempPin.length === 4) {
                    State.security.pin = Apps.settings.tempPin;
                    Storage.saveSettings();
                    const setupActive = document.getElementById('setup-screen').classList.contains('active');
                    if (setupActive) {
                        Setup.next('security', 'finish');
                        document.getElementById('app-window').style.display = 'none';
                        document.getElementById('app-window').style.zIndex = '';
                    } else {
                        setTimeout(() => Apps.settings.render('security'), 300);
                    }
                }
            }
        },
        toggleDark: () => {
            State.darkMode = !State.darkMode;
            OS.applySettings();
            const win = document.getElementById('app-window');
            const body = document.getElementById('app-body');
            const bg = State.darkMode ? '#000' : '#f2f2f7';
            const textColor = State.darkMode ? '#fff' : '#000';
            if (State.activeApp === 'settings' && win) {
                win.style.background = bg;
            }
            const header = document.getElementById('app-header');
            if (header && State.activeApp === 'settings') {
                header.style.background = bg;
            }
            if (body) {
                body.style.background = bg;
                body.style.color = textColor;
            }
            const animFades = body ? body.querySelectorAll('.anim-fade') : [];
            animFades.forEach(el => { el.style.background = bg; });
            const inlineHeaders = body ? body.querySelectorAll('.settings-inline-header') : [];
            inlineHeaders.forEach(el => { el.style.setProperty('background', bg, 'important'); });
            const listItem = event && event.target && event.target.closest ? event.target.closest('.list-item') : null;
            if (listItem) {
                const toggle = listItem.querySelector('.toggle');
                if (toggle) toggle.classList.toggle('active', State.darkMode);
            }
        },
        toggleLiteMode: () => {
            State.liteMode = !State.liteMode;
            localStorage.setItem('realos_v3_litemode', State.liteMode ? 'true' : 'false');
            OS.applySettings();
            document.body.classList.toggle('lite-mode', State.liteMode);
            const listItem = event && event.target && event.target.closest ? event.target.closest('.list-item') : null;
            if (listItem) {
                const toggle = listItem.querySelector('.toggle');
                if (toggle) toggle.classList.toggle('active', !State.liteMode);
            }
        },
        toggleTap: () => {
            State.tapIndicators = !State.tapIndicators;
            OS.applySettings();
            const toggle = event.target.closest('.list-item').querySelector('.toggle');
            if (toggle) toggle.classList.toggle('active', State.tapIndicators);
        },
        toggleFps: () => {
            if (window.event) {
                const toggle = window.event.target.closest('.list-item').querySelector('.toggle');
                OS.toggleFps(!State.showFps);
                if (toggle) toggle.classList.toggle('active', State.showFps);
            } else {
                OS.toggleFps(!State.showFps);
            }
        },
        toggleGlass: () => {
            State.glassUI = !State.glassUI;
            OS.applySettings();
            const toggle = event.target.closest('.list-item').querySelector('.toggle');
            if (toggle) toggle.classList.toggle('active', State.glassUI);
        },
        setBright: (v) => { State.brightness = v; OS.applySettings(); },
        previewWall: (i, el, fromScroll) => {
            document.querySelectorAll('.wall-grid-item').forEach(item => {
                item.classList.remove('active');
                item.style.borderColor = 'transparent';
                item.style.transform = 'scale(1)';
                const btn = item.querySelector('.wall-apply-btn');
                if (btn) {
                    btn.style.opacity = '0';
                    btn.style.pointerEvents = 'none';
                }
            });

            if (el) {
                el.classList.add('active');
                el.style.borderColor = 'var(--accent)';
                el.style.transform = 'scale(1.05)';
                if (!fromScroll) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

                const btn = el.querySelector('.wall-apply-btn');
                if (btn) {
                    btn.innerText = "Apply";
                    btn.style.background = "var(--accent)";
                    btn.style.opacity = '1';
                    btn.style.pointerEvents = 'auto';
                }

                OS.updateWallpaperEffect(i);
            }
        },
        handleWallScroll: (scrollArea) => {
            const rows = scrollArea.querySelectorAll('.wall-category-row');
            if (rows.length === 0) return;
            const sRect = scrollArea.getBoundingClientRect();
            const scrollCenter = sRect.top + (sRect.height / 2);
            const scaleFactor = sRect.height / scrollArea.clientHeight || 1;
            rows.forEach(row => {
                const rect = row.getBoundingClientRect();
                const rowCenter = rect.top + (rect.height / 2);
                const dist = Math.abs(scrollCenter - rowCenter) / scaleFactor;
                if (dist > 180) {
                    row.style.filter = 'brightness(0.35)';
                } else {
                    row.style.filter = 'brightness(1)';
                }
            });
        },
        expandPreview: (type) => {
            if (type === 'home') return;
            const previewEl = document.getElementById('ls-preview');
            if (!previewEl) return;
            const iRect = previewEl.getBoundingClientRect();
            const sRect = document.getElementById('screen').getBoundingClientRect();
            const scaleFactor = document.fullscreenElement ? 1 : document.getElementById('scale-wrapper').getBoundingClientRect().width / (State.devWidth || 400);

            const startLeft = ((iRect.left + iRect.width / 2 - sRect.left) / scaleFactor) - (iRect.width / scaleFactor / 2);
            const startTop = ((iRect.top + iRect.height / 2 - sRect.top) / scaleFactor) - (iRect.height / scaleFactor / 2);
            const startW = iRect.width / scaleFactor;
            const startH = iRect.height / scaleFactor;

            const overlay = document.createElement('div');
            overlay.id = 'wall-expand-overlay';
            overlay.style.cssText = `position:absolute;z-index:1900;overflow:hidden;display:flex;flex-direction:column;`;
            overlay.style.left = startLeft + 'px';
            overlay.style.top = startTop + 'px';
            overlay.style.width = startW + 'px';
            overlay.style.height = startH + 'px';
            overlay.style.borderRadius = '28px';
            overlay.style.transition = 'none';

            const specialUrls = ['https://i.ibb.co/9HGWgS4w/wallpaper3.jpg', 'https://i.ibb.co/FMtRmsm/wallpaper4.png', 'https://i.ibb.co/ymJxLsYz/wallpaper5.png', 'https://i.ibb.co/43v4xw9/wallpaper6.png'];
            const customWalls = [], realosWalls = [], specialWalls = [], xiaomiWalls = [], originWalls = [], colorosWalls = [];
            const seen = new Set();
            State.wallpapers.forEach((url, i) => {
                if (!url || seen.has(url)) return;
                seen.add(url);
                if (url.includes('xiaomi') || url.includes('Xiaomi')) xiaomiWalls.push({ url, i });
                else if (url.includes('origin') || url.includes('OriginOS')) originWalls.push({ url, i });
                else if (url.includes('ColorOS') || url.includes('coloros')) colorosWalls.push({ url, i });
                else if (specialUrls.includes(url)) specialWalls.push({ url, i });
                else if (url.includes('RealOS 3') || url.includes('Oneplus')) realosWalls.push({ url, i });
                else customWalls.push({ url, i });
            });

            const wallCard = (url, idx) => {
                if (url === 'ADD_NEW') {
                    return `<div class="stack-wall-card" style="position:absolute;left:50%;top:0;width:180px;height:320px;margin-left:-90px;border-radius:18px;border:2px dashed rgba(255,255,255,0.15);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;cursor:pointer;transition:transform 0.4s cubic-bezier(0.4,0,0.2,1),opacity 0.4s ease;will-change:transform,opacity;" onclick="document.getElementById('wall-input').click()">
                        <i class="fas fa-plus" style="color:var(--text-sec);font-size:28px;"></i>
                        <span style="color:var(--text-sec);font-size:13px;">Add wallpaper</span>
                    </div>`;
                }
                const isVid = isVideoWallpaper(url);
                const isActive = idx === State.lockWall;
                const thumb = isVid
                    ? `<video src="${url}" muted playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;"></video>`
                    : `<div style="position:absolute;inset:0;background-image:url('${url}');background-size:cover;background-position:center;"></div>`;
                return `<div class="stack-wall-card" data-wall-idx="${idx}" style="position:absolute;left:50%;top:0;width:180px;height:320px;margin-left:-90px;border-radius:18px;overflow:hidden;cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,0.45);border:2.5px solid ${isActive ? 'var(--accent)' : 'rgba(255,255,255,0.08)'};transition:transform 0.4s cubic-bezier(0.4,0,0.2,1),opacity 0.4s ease;will-change:transform,opacity;">${thumb}<div class="wall-apply-btn" style="${isActive ? 'opacity:1;pointer-events:auto;background:#000;' : ''}" onclick="Apps.settings.applyWall(${idx}); event.stopPropagation()">${isActive ? 'Applied' : 'Apply'}</div></div>`;
            };

            const makeStackRow = (title, walls) => {
                if (!walls || walls.length === 0) return '';
                const cards = walls.map(w => wallCard(w.url, w.i)).join('');
                const uid = 'sr-' + Math.random().toString(36).slice(2, 8);
                return `<div class="wall-category-row" style="margin-bottom:60px; transition: filter 0.4s ease; scroll-snap-align: center;">
                    <div style="font-size:20px;font-weight:600;color:var(--text-main);margin-bottom:14px;padding:0 6px;text-align:center;">${title}</div>
                    <div class="stack-row" data-sr-id="${uid}" style="position:relative;width:100%;height:320px;touch-action:pan-y;">
                        ${cards}
                    </div>
                    <div class="stack-scrollbar" data-sr-for="${uid}" style="overflow-x:auto;overflow-y:hidden;height:6px;margin:8px 40px 0;">
                        <div style="width:${walls.length * 200}px;height:1px;"></div>
                    </div>
                </div>`;
            };

            customWalls.unshift({ url: 'ADD_NEW', i: -1 });
            let customContent = makeStackRow('Custom Wallpapers', customWalls);

            overlay.innerHTML = `
                <style>
                    #wallpaper-scroll-container::-webkit-scrollbar { display: none; }
                    #wallpaper-scroll-container { -ms-overflow-style: none; scrollbar-width: none; }
                </style>
                <div style="background:var(--bg-card);height:100%;display:flex;flex-direction:column;overflow:hidden;">
                    <div style="padding:44px 16px 14px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
                        <div onclick="Apps.settings.collapsePreview()" style="cursor:pointer;display:flex;align-items:center;color:var(--text-main);padding:5px;opacity:0.8;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" style="width:22px;height:22px;"><path fill="currentColor" d="M71 303C61.6 312.4 61.6 327.6 71 336.9L239 505C248.4 514.4 263.6 514.4 272.9 505C282.2 495.6 282.3 480.4 272.9 471.1L145.9 344L552 344C565.3 344 576 333.3 576 320C576 306.7 565.3 296 552 296L145.9 296L273 169C282.4 159.6 282.4 144.4 273 135.1C263.6 125.8 248.4 125.7 239.1 135.1L71 303z"/></svg></div>
                        <span style="font-weight:600;font-size:16px;color:var(--text-main);">Wallpapers</span>
                        <div style="width:40px;"></div>
                    </div>
                    <div id="wallpaper-scroll-container" style="flex:1;overflow-y:auto;overflow-x:hidden;padding:15vh 14px; scroll-snap-type: y mandatory;" onscroll="if(Apps.settings.handleWallScroll) Apps.settings.handleWallScroll(this)">
                        <input type="file" id="wall-input" accept="image/*,video/mp4" style="display:none">
                        ${customContent}
                        ${makeStackRow('RealOS 3', realosWalls)}
                        ${makeStackRow('Special Wallpapers', specialWalls)}
                        ${makeStackRow('ColorOS Wallpapers', colorosWalls)}
                        ${makeStackRow('Xiaomi Wallpapers', xiaomiWalls)}
                        ${makeStackRow('OriginOS Wallpapers', originWalls)}
                    </div>
                </div>`;

            document.getElementById('screen').appendChild(overlay);
            setTimeout(() => {
                const sc = overlay.querySelector('#wallpaper-scroll-container');
                if (sc && Apps.settings.handleWallScroll) Apps.settings.handleWallScroll(sc);
            }, 100);

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const totalDur = 0.4;
                    overlay.style.transition = `left ${totalDur}s cubic-bezier(0.2,0,0,1), top ${totalDur}s cubic-bezier(0.2,0,0,1), width ${totalDur}s cubic-bezier(0.2,0,0,1), height ${totalDur}s cubic-bezier(0.2,0,0,1), border-radius ${totalDur}s cubic-bezier(0.2,0,0,1)`;
                    overlay.style.left = '0';
                    overlay.style.top = '0';
                    overlay.style.width = '100%';
                    overlay.style.height = '100%';
                    overlay.style.borderRadius = '60px';
                    previewEl.style.transition = 'opacity 0.2s ease';
                    previewEl.style.opacity = '0';
                });
            });

            setTimeout(() => {
                overlay.querySelectorAll('.stack-row').forEach(row => {
                    const cards = Array.from(row.querySelectorAll('.stack-wall-card'));
                    if (cards.length === 0) return;
                    let current = 0;
                    const activeCard = cards.findIndex(c => parseInt(c.dataset.wallIdx) === State.lockWall);
                    if (activeCard >= 0) current = activeCard;

                    const arrange = (center) => {
                        cards.forEach((card, i) => {
                            const diff = i - center;
                            const absDiff = Math.abs(diff);
                            if (absDiff > 3) {
                                card.style.opacity = '0';
                                card.style.pointerEvents = 'none';
                                card.style.transform = `translateX(${diff > 0 ? 80 : -80}px) scale(0.75)`;
                                card.style.zIndex = '0';
                            } else if (absDiff === 0) {
                                card.style.opacity = '1';
                                card.style.pointerEvents = 'auto';
                                card.style.transform = 'translateX(0) scale(1)';
                                card.style.zIndex = '10';
                            } else {
                                const offsetX = diff * 28;
                                const sc = 1 - (absDiff * 0.05);
                                card.style.opacity = `${1 - (absDiff * 0.2)}`;
                                card.style.pointerEvents = 'none';
                                card.style.transform = `translateX(${offsetX}px) scale(${sc})`;
                                card.style.zIndex = `${10 - absDiff}`;
                            }
                        });

                        cards.forEach(c => {
                            const isA = parseInt(c.dataset.wallIdx) === State.lockWall;
                            c.style.borderColor = isA ? 'var(--accent)' : 'rgba(255,255,255,0.08)';
                            const btn = c.querySelector('.wall-apply-btn');
                            if (btn) {
                                btn.innerText = isA ? 'Applied' : 'Apply';
                                btn.style.opacity = isA ? '1' : '0';
                                btn.style.pointerEvents = isA ? 'auto' : 'none';
                                btn.style.background = isA ? '#000' : 'var(--accent)';
                                btn.style.transform = isA ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(20px)';
                            }
                        });
                        const focused = cards[center];
                        if (focused) {
                            const btn = focused.querySelector('.wall-apply-btn');
                            if (btn) {
                                btn.style.opacity = '1';
                                btn.style.pointerEvents = 'auto';
                                btn.style.transform = 'translateX(-50%) translateY(0)';
                            }
                        }
                    };

                    arrange(current);
                    row._arrange = arrange;
                    row._getCurrent = () => current;

                    const goTo = (idx) => {
                        if (idx < 0 || idx >= cards.length) return;
                        current = idx;
                        arrange(current);
                        const srId = row.dataset.srId;
                        if (srId) {
                            const sb = overlay.querySelector(`.stack-scrollbar[data-sr-for="${srId}"]`);
                            if (sb && cards.length > 1) {
                                const maxScroll = sb.scrollWidth - sb.clientWidth;
                                sb.scrollLeft = (current / (cards.length - 1)) * maxScroll;
                            }
                        }
                    };

                    cards.forEach((card, i) => {
                        card.addEventListener('click', () => { if (i !== current) goTo(i); });
                    });

                    let dragStartX = 0, isDragging = false;
                    row.addEventListener('mousedown', (e) => { dragStartX = e.clientX; isDragging = true; e.preventDefault(); });
                    row.addEventListener('mousemove', (e) => { if (isDragging) e.preventDefault(); });
                    document.addEventListener('mouseup', (e) => {
                        if (!isDragging) return;
                        isDragging = false;
                        const dx = e.clientX - dragStartX;
                        if (Math.abs(dx) > 30) {
                            if (dx < 0) goTo(current + 1);
                            else goTo(current - 1);
                        }
                    });
                    row.addEventListener('touchstart', (e) => { dragStartX = e.touches[0].clientX; }, { passive: true });
                    row.addEventListener('touchend', (e) => {
                        const dx = e.changedTouches[0].clientX - dragStartX;
                        if (Math.abs(dx) > 30) {
                            if (dx < 0) goTo(current + 1);
                            else goTo(current - 1);
                        }
                    }, { passive: true });

                    const srId = row.dataset.srId;
                    if (srId) {
                        const sb = overlay.querySelector(`.stack-scrollbar[data-sr-for="${srId}"]`);
                        if (sb && cards.length > 1) {
                            const maxScroll = sb.scrollWidth - sb.clientWidth;
                            sb.scrollLeft = (current / (cards.length - 1)) * maxScroll;
                            let sbDragging = false;
                            sb.addEventListener('scroll', () => {
                                if (sbDragging) return;
                                sbDragging = true;
                                requestAnimationFrame(() => {
                                    const ms = sb.scrollWidth - sb.clientWidth;
                                    if (ms > 0) {
                                        const ratio = sb.scrollLeft / ms;
                                        const newIdx = Math.round(ratio * (cards.length - 1));
                                        if (newIdx !== current && newIdx >= 0 && newIdx < cards.length) {
                                            current = newIdx;
                                            arrange(current);
                                        }
                                    }
                                    sbDragging = false;
                                });
                            }, { passive: true });
                        }
                    }
                });

                const wallInput = document.getElementById('wall-input');
                if (wallInput) wallInput.onchange = (e) => {
                    const f = e.target.files[0];
                    if (f) {
                        const r = new FileReader();
                        r.onload = (ev) => {
                            State.wallpapers.push(ev.target.result);
                            const newIdx = State.wallpapers.length - 1;
                            State.lockWall = newIdx;
                            Storage.saveSettings();
                            OS.applySettings();
                            if ((State.clockConfig || {}).autoColor) Apps.settings.extractWallpaperColors();
                            Apps.settings.collapsePreview();
                        };
                        r.readAsDataURL(f);
                    }
                };
            }, 100);
        },
        collapsePreview: () => {
            const overlay = document.getElementById('wall-expand-overlay');
            if (!overlay) return;
            const previewEl = document.getElementById('ls-preview');
            const sRect = document.getElementById('screen').getBoundingClientRect();
            const scaleFactor = document.fullscreenElement ? 1 : document.getElementById('scale-wrapper').getBoundingClientRect().width / (State.devWidth || 400);

            const lockWallUrl = State.wallpapers[State.lockWall] || State.wallpapers[State.currentWall] || '';
            const lockIsVid = isVideoWallpaper(lockWallUrl);
            const lockBg = lockIsVid ? '' : `background-image:url('${lockWallUrl}');background-size:cover;background-position:center;`;
            const lockVidEl = lockIsVid ? `<video src="${lockWallUrl}" muted playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;"></video>` : '';

            const cc = State.clockConfig || {};
            const now = new Date();
            let h12 = now.getHours() % 12; if (h12 === 0) h12 = 12;
            const h12Padded = h12 < 10 ? '0' + h12 : h12;
            const mins = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes();
            const bOp = cc.boldOpacity !== undefined ? cc.boldOpacity : 0.72;
            const fw = cc.fontWeight || 600;

            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const dateStr = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;

            let clockHtml = '';
            if (cc.style === 'stretched') {
                clockHtml = `<div style="font-size:42px;font-weight:${fw};line-height:0.85;letter-spacing:-1px;font-family:'Oswald',sans-serif;text-shadow:0 2px 6px rgba(0,0,0,0.4);color:#fff">${h12}:${mins}</div>`;
            } else {
                const fonts = { 'default': "'Inter',sans-serif", 'serif': "'Times New Roman',serif", 'science': "'Rajdhani',sans-serif", 'mono': "'Monoton',cursive", 'lux': "'Luxurious Roman',serif" };
                const f = cc.font || 'default';
                clockHtml = `<div style="font-size:32px;font-weight:${fw};line-height:1;font-family:${fonts[f] || fonts['default']};text-shadow:0 2px 6px rgba(0,0,0,0.4);"><span style="color:${cc.hourColor || '#fff'};opacity:${bOp}">${h12}</span><span style="opacity:${bOp}">:</span><span style="color:${cc.minuteColor || '#fff'};opacity:${bOp}">${mins}</span></div>`;
            }

            overlay.innerHTML = `<div style="position:absolute;inset:0;${lockBg}">${lockVidEl}</div>
                <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding-top:30px;z-index:1;">
                    <div style="font-size:10px;color:white;opacity:0.8;text-shadow:0 1px 3px rgba(0,0,0,0.5);">${dateStr}</div>
                    ${clockHtml}
                </div>`;

            if (previewEl) {
                const iRect = previewEl.getBoundingClientRect();
                const endLeft = ((iRect.left + iRect.width / 2 - sRect.left) / scaleFactor) - (iRect.width / scaleFactor / 2);
                const endTop = ((iRect.top + iRect.height / 2 - sRect.top) / scaleFactor) - (iRect.height / scaleFactor / 2);
                const endW = iRect.width / scaleFactor;
                const endH = iRect.height / scaleFactor;
                const totalDur = 0.35;
                overlay.style.transition = `left ${totalDur}s cubic-bezier(0.2,0,0,1), top ${totalDur}s cubic-bezier(0.2,0,0,1), width ${totalDur}s cubic-bezier(0.2,0,0,1), height ${totalDur}s cubic-bezier(0.2,0,0,1), border-radius ${totalDur}s cubic-bezier(0.2,0,0,1)`;
                overlay.style.left = endLeft + 'px';
                overlay.style.top = endTop + 'px';
                overlay.style.width = endW + 'px';
                overlay.style.height = endH + 'px';
                overlay.style.borderRadius = '28px';
            }
            setTimeout(() => {
                overlay.remove();
                const homeWallUrl = State.wallpapers[State.currentWall] || '';
                const lockWallUrl = State.wallpapers[State.lockWall] || homeWallUrl;
                const hsPreview = document.getElementById('hs-preview');
                const lsPreview = document.getElementById('ls-preview');
                if (hsPreview) {
                    hsPreview.style.backgroundImage = isVideoWallpaper(homeWallUrl) ? 'none' : `url('${homeWallUrl}')`;
                }
                if (lsPreview) {
                    lsPreview.style.backgroundImage = isVideoWallpaper(lockWallUrl) ? 'none' : `url('${lockWallUrl}')`;
                    lsPreview.style.transition = 'none';
                    lsPreview.style.opacity = '1';
                }
            }, 380);
        },
        applyWall: (i) => {
            const url = State.wallpapers[i] || '';
            const specialUrls = ['https://i.ibb.co/9HGWgS4w/wallpaper3.jpg', 'https://i.ibb.co/FMtRmsm/wallpaper4.png', 'https://i.ibb.co/ymJxLsYz/wallpaper5.png', 'https://i.ibb.co/43v4xw9/wallpaper6.png'];
            const isSpecial = isVideoWallpaper(url) || specialUrls.includes(url);
            if (isSpecial) {
                Apps.settings.applyWallTo(i, 'both');
                return;
            }
            const currentHomeUrl = State.wallpapers[State.currentWall] || '';
            const currentLockUrl = State.wallpapers[State.lockWall] || '';
            const homeIsSpecial = isVideoWallpaper(currentHomeUrl) || specialUrls.includes(currentHomeUrl);
            const lockIsSpecial = isVideoWallpaper(currentLockUrl) || specialUrls.includes(currentLockUrl);
            const hasSpecialActive = homeIsSpecial || lockIsSpecial;
            if (hasSpecialActive) {
                Apps.settings.applyWallTo(i, 'both');
                setTimeout(() => {
                    OS.showPopup('Wallpaper Changed', 'A special effects wallpaper was in use. The new wallpaper has been applied to both screens.');
                }, 100);
                return;
            }
            const msg = `<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:8px;">
                <div onclick="Apps.settings.applyWallTo(${i},'home'); OS.hidePopup();" class="osm-btn primary">Home Screen</div>
                <div onclick="Apps.settings.applyWallTo(${i},'lock'); OS.hidePopup();" class="osm-btn primary">Lock Screen</div>
                <div onclick="Apps.settings.applyWallTo(${i},'both'); OS.hidePopup();" class="osm-btn primary">Both</div>
            </div>`;
            OS.showPopup('Set Wallpaper', msg, null, null, 'Cancel');
        },
        applyWallTo: (i, target) => {
            const url = State.wallpapers[i] || '';
            const supportedSpecialUrls = ['https://i.ibb.co/9HGWgS4w/wallpaper3.jpg', 'https://i.ibb.co/FMtRmsm/wallpaper4.png', 'https://i.ibb.co/ymJxLsYz/wallpaper5.png', 'https://i.ibb.co/43v4xw9/wallpaper6.png'];
            const supportsEffects = isVideoWallpaper(url) || supportedSpecialUrls.includes(url);
            if (target === 'home' || target === 'both') {
                State.currentWall = i;
                document.documentElement.style.setProperty('--wall', `url("${url}")`);
                if (!supportsEffects && State.specialEffects) {
                    State.specialEffects = false;
                    localStorage.setItem('realos_v3_special', false);

                    const mainToggle = document.querySelector('#main-sfx-toggle .toggle');
                    if (mainToggle) mainToggle.classList.remove('active');
                }

                const mainSfxToggleItem = document.getElementById('main-sfx-toggle');
                if (mainSfxToggleItem) {
                    mainSfxToggleItem.style.opacity = supportsEffects ? '1' : '0.5';
                    mainSfxToggleItem.style.cursor = supportsEffects ? 'pointer' : 'default';
                }
            }
            if (target === 'lock' || target === 'both') {
                State.lockWall = i;
                if (isVideoWallpaper(url)) {
                    VideoWallpaper.getThumbnail((thumbUrl) => {
                        document.documentElement.style.setProperty('--wall-lock', `url("${thumbUrl}")`);
                    });
                } else {
                    document.documentElement.style.setProperty('--wall-lock', `url("${url}")`);
                }
            }
            Storage.saveSettings();
            OS.applySettings();
            OS.updateWallpaperEffect();
            OS.hidePopup();
            if ((target === 'lock' || target === 'both') && (State.clockConfig || {}).autoColor) {
                Apps.settings.extractWallpaperColors();
            }

            document.querySelectorAll('.wall-grid-item').forEach(item => {
                item.classList.remove('active');
                item.style.borderColor = 'transparent';
                const btn = item.querySelector('.wall-apply-btn');
                if (btn) {
                    btn.innerText = 'Apply';
                    btn.style.background = 'var(--accent)';
                    btn.style.opacity = '0';
                    btn.style.pointerEvents = 'none';
                }
            });
            const appliedEl = document.querySelector(`.wall-grid-item[data-wall-idx="${i}"]`);
            if (appliedEl) {
                appliedEl.classList.add('active');
                appliedEl.style.borderColor = 'var(--accent)';
                const btn = appliedEl.querySelector('.wall-apply-btn');
                if (btn) {
                    btn.innerText = 'Applied';
                    btn.style.background = '#000';
                    btn.style.opacity = '1';
                    btn.style.pointerEvents = 'auto';
                }
            }

            document.querySelectorAll('.stack-wall-card').forEach(card => {
                const isA = parseInt(card.dataset.wallIdx) === i;
                card.style.borderColor = isA ? 'var(--accent)' : 'rgba(255,255,255,0.08)';
                const btn = card.querySelector('.wall-apply-btn');
                if (btn) {
                    btn.innerText = isA ? 'Applied' : 'Apply';
                    btn.style.background = isA ? '#000' : 'var(--accent)';
                }
            });
            document.querySelectorAll('.stack-row').forEach(row => {
                if (row._arrange) row._arrange(row._getCurrent());
            });
        },
        toggleAOD: () => {
            State.aod.enabled = !State.aod.enabled;
            Storage.saveSettings();
            const toggle = event.target.closest('.list-item').querySelector('.toggle');
            if (toggle) toggle.classList.toggle('active', State.aod.enabled);
        },
        toggleAODWall: () => {
            State.aod.wallpaper = !State.aod.wallpaper;
            Storage.saveSettings();
            const toggle = event.target.closest('.list-item').querySelector('.toggle');
            if (toggle) toggle.classList.toggle('active', State.aod.wallpaper);
            const wallEl = document.getElementById('aod-preview-wall');
            if (wallEl) {
                wallEl.style.opacity = State.aod.wallpaper ? '0.5' : '0';
            }
        },
        toggleHsBlur: () => {
            State.homescreenBlur = !State.homescreenBlur;
            Storage.saveSettings();
            if (State.homescreenBlur) {
                document.body.classList.add('hs-blur');
                const hsPreview = document.getElementById('hs-preview');
                if (hsPreview) hsPreview.classList.add('blurred-preview');
            } else {
                document.body.classList.remove('hs-blur');
                const hsPreview = document.getElementById('hs-preview');
                if (hsPreview) hsPreview.classList.remove('blurred-preview');
            }
            const toggle = event.target.closest('.list-item').querySelector('.toggle');
            if (toggle) toggle.classList.toggle('active', State.homescreenBlur);
        },
        toggleHideLabels: () => {
            State.hideAppLabels = !State.hideAppLabels;
            Storage.saveSettings();
            if (State.hideAppLabels) document.body.classList.add('hide-labels');
            else document.body.classList.remove('hide-labels');
            const toggle = event.target.closest('.list-item').querySelector('.toggle');
            if (toggle) toggle.classList.toggle('active', State.hideAppLabels);
        },
        toggleBlurBehindApps: () => {
            State.blurBehindApps = !State.blurBehindApps;
            localStorage.setItem('realos_v3_blur_behind', State.blurBehindApps);
            State.animConfig.openWallBlur = State.blurBehindApps;
            Storage.saveSettings();
            if (State.blurBehindApps) document.body.classList.add('blur-behind');
            else document.body.classList.remove('blur-behind');
            const toggle = event.target.closest('.list-item').querySelector('.toggle');
            if (toggle) toggle.classList.toggle('active', State.blurBehindApps);
        },

        toggleMusicGrad: () => {
            State.musicGradient = !State.musicGradient;
            Storage.saveSettings();
            Island.update();
            localStorage.setItem('realos_v3_music_grad', State.musicGradient);
            const toggle = event.target.closest('.list-item').querySelector('.toggle');
            if (toggle) toggle.classList.toggle('active', State.musicGradient);
        },
        setNav: (style) => {
            State.navStyle = style;
            localStorage.setItem('realos_v3_nav_style', style);
            OS.applySettings();

            const valEl = document.getElementById('sd-nav-style-val');
            if (valEl) {
                valEl.innerText = style === 'swipe' ? 'Swipe Gestures' : '3-Button';
            }
            const dropdown = document.getElementById('sd-nav-style');
            if (dropdown) {
                dropdown.classList.remove('open');
                dropdown.querySelectorAll('.sd-option').forEach(el => {
                    const isSelected = el.getAttribute('onclick').includes(`'${style}'`);
                    el.innerHTML = `<span>${el.innerText}</span>${isSelected ? '<i class="fas fa-check"></i>' : ''}`;
                });
            }
        },
        setFrameColor: (color) => {
            State.frameColor = color;
            localStorage.setItem('realos_v3_frame_color', color);
            const device = document.getElementById('device');
            if (!device) return;
            const colors = {
                black: { a: '#1a1a1a', b: '#3a3a3c', c: '#48484a', d: '#3a3a3c', e: '#2c2c2e', f: '#1a1a1a' },
                grey: { a: '#6e6e73', b: '#8e8e93', c: '#aeaeb2', d: '#8e8e93', e: '#636366', f: '#48484a' },
                white: { a: '#c7c7cc', b: '#d1d1d6', c: '#e5e5ea', d: '#d1d1d6', e: '#c7c7cc', f: '#aeaeb2' },
                pink: { a: '#d4a0a7', b: '#e8b4bc', c: '#f2c6ce', d: '#e8b4bc', e: '#d4a0a7', f: '#c48e96' }
            };
            const c = colors[color] || colors.black;
            device.style.boxShadow = `inset 0 4px 12px rgba(255,255,255,0.1), inset 0 -4px 12px rgba(0,0,0,0.5), 0 0 0 2px ${c.a}, 0 0 0 4px ${c.b}, 0 0 0 6px ${c.c}, 0 0 0 7px ${c.d}, 0 0 0 9px ${c.e}, 0 0 0 11px ${c.f}, 0 20px 60px rgba(0,0,0,0.5), 0 40px 100px rgba(0,0,0,0.3)`;
            const powerBtn = document.getElementById('power-btn');
            const volUp = document.getElementById('vol-up');
            const volDown = document.getElementById('vol-down');
            const btnColor = color === 'black' ? '#ff3b30' : (color === 'white' ? '#c7c7cc' : color === 'pink' ? '#e8b4bc' : '#8e8e93');
            const volColor = color === 'black' ? '#2c2c2e' : (color === 'white' ? '#d1d1d6' : color === 'pink' ? '#d4a0a7' : '#636366');
            if (powerBtn) powerBtn.style.background = btnColor;
            if (volUp) volUp.style.background = volColor;
            if (volDown) volDown.style.background = volColor;

            const valEl = document.getElementById('sd-frame-color-val');
            if (valEl) {
                const labels = { black: 'Black', grey: 'Grey', white: 'White', pink: 'Light Pink' };
                valEl.innerText = labels[color];
            }
            const dropdown = document.getElementById('sd-frame-color');
            if (dropdown) {
                dropdown.classList.remove('open');
                dropdown.querySelectorAll('.sd-option').forEach(el => {
                    const isSelected = el.getAttribute('onclick').includes(`'${color}'`);
                    el.innerHTML = `<span>${el.innerText}</span>${isSelected ? '<i class="fas fa-check"></i>' : ''}`;
                });
            }
        },
        setAppShape: (val) => {
            State.appShape = parseInt(val);
            OS.applySettings();
            localStorage.setItem('realos_v3_shape', val);
            const previewRow = document.getElementById('shape-preview-row');
            if (previewRow) {
                previewRow.querySelectorAll('[style*="border-radius"]').forEach(box => {
                    box.style.borderRadius = OS.getShapeRadius();
                });
            }
            const mainPreview = document.querySelector('.icon-preview-row');
            if (mainPreview) {
                mainPreview.querySelectorAll('.icon-box, [style*="border-radius"]').forEach(box => {
                    box.style.borderRadius = OS.getShapeRadius();
                });
            }
        },
        toggleSpecialEffects: () => {
            State.specialEffects = !State.specialEffects;
            localStorage.setItem('realos_v3_special', State.specialEffects);
            OS.applySettings();
            const toggle = event.target.closest('.list-item').querySelector('.toggle');
            if (toggle) toggle.classList.toggle('active', State.specialEffects);
        },
        setIconPack: (pack) => {
            State.iconPack = pack;
            OS.applySettings();
            OS.renderApps();
            localStorage.setItem('realos_v3_iconpack', pack);
            const packNames = { default: 'RealOS (Default)', hyperos: 'HyperOS', coloros: 'ColorOS' };
            const dd = document.getElementById('sd-icon-pack');
            if (dd) {
                dd.classList.remove('open');
                const val = dd.querySelector('.sd-value');
                if (val) val.innerText = packNames[pack] || packNames['default'];
                dd.querySelectorAll('.fa-check').forEach(c => c.remove());
                dd.querySelectorAll('.sd-option').forEach(opt => {
                    const key = Object.keys(packNames).find(k => packNames[k] === opt.querySelector('span').innerText);
                    if (key === pack) opt.insertAdjacentHTML('beforeend', '<i class="fas fa-check"></i>');
                });
            }
            const previewRow = document.querySelector('#app-window .icon-preview-row');
            if (previewRow) {
                const previewApps = ['phone', 'messages', 'settings', 'camera'];
                const packs = { hyperos: 'hyperIcon', coloros: 'colorIcon' };
                previewRow.querySelectorAll('.icon-box, .preview-icon-box, div[style*="width:48px"]').forEach(b => b.remove());
                const wallDiv = previewRow.querySelector('div[style*="blur"]');
                const wallVid = previewRow.querySelector('video');
                const wallUrl = State.wallpapers[State.currentWall] || '';
                if (!wallDiv && !wallVid) {
                    if (isVideoWallpaper(wallUrl)) {
                        const ve = document.createElement('video');
                        ve.src = wallUrl;
                        ve.muted = true;
                        ve.playsInline = true;
                        ve.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; object-fit:cover; filter:blur(10px) brightness(0.7); transform:scale(1.2); z-index:0;';
                        previewRow.prepend(ve);
                    } else {
                        const wd = document.createElement('div');
                        wd.style.cssText = `position:absolute; inset:0; background-image:url('${wallUrl}'); background-size:cover; background-position:center; filter:blur(10px) brightness(0.7); transform:scale(1.2); z-index:0;`;
                        previewRow.prepend(wd);
                    }
                }
                previewApps.forEach(id => {
                    const app = APPS.find(a => a.id === id);
                    const isImagePack = pack === 'hyperos' || pack === 'coloros';
                    const packIconKey = packs[pack];
                    const packIcon = packIconKey ? app[packIconKey] : null;
                    let iconContent = '';
                    let bg = isImagePack ? 'transparent' : app.color;
                    if (isImagePack && packIcon) {
                        iconContent = `<img src="${packIcon}" style="width:100%; height:100%; object-fit:cover; border-radius: inherit;">`;
                    } else {
                        if (app.id === 'settings') {
                            iconContent = `<div class="settings-icon-gear" style="transform: scale(0.86);"><div class="gear-base"></div><div class="gear-teeth"><div class="tooth"></div><div class="tooth"></div><div class="tooth"></div><div class="tooth"></div><div class="tooth"></div><div class="tooth"></div></div><div class="gear-inner-ring"></div><div class="gear-spoke spoke-1"></div><div class="gear-spoke spoke-2"></div><div class="gear-spoke spoke-3"></div><div class="gear-center-dot"></div></div>`;
                        } else if (app.id === 'camera') {
                            iconContent = `<div class="camera-icon-lens" style="transform: scale(1.04);"><div class="camera-base"></div><div class="lens-outer-ring"></div><div class="lens-inner-black"></div><div class="lens-core-glass"></div><div class="lens-glare-1"></div><div class="lens-glare-2"></div><div class="flash-ring"><div class="flash-bulb"></div></div></div>`;
                            bg = 'linear-gradient(135deg, #fbfbfb 0%, #e8e8e8 50%, #d1d1d1 100%)';
                        } else {
                            const lowBg = (bg || '').toLowerCase().trim();
                            const isWhiteBg = lowBg === '#fff' || lowBg.startsWith('#ffffff') || lowBg === 'white' || lowBg.replace(/\s/g, '') === 'rgb(255,255,255)';
                            const shadeColor = isWhiteBg ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)';
                            const shadeHtml = `<div style="position:absolute; inset:0; background: radial-gradient(circle at top right, ${shadeColor} 0%, transparent 70%); pointer-events:none; border-radius:inherit; z-index:10;"></div>`;
                            iconContent = `${shadeHtml}<i class="fas ${app.icon}" style="font-size:24px; color:${app.text || 'white'}; display:flex; align-items:center; justify-content:center; width:100%; height:100%;"></i>`;
                        }
                    }
                    const div = document.createElement('div');
                    div.className = 'preview-icon-box';
                    div.style.cssText = `width:48px; height:48px; font-size:24px; background:${bg}; border-radius:${OS.getShapeRadius()}!important; z-index:1; position:relative; overflow:hidden; display:flex; justify-content:center; align-items:center; box-shadow: 0 4px 10px rgba(0,0,0,0.1);`;
                    div.innerHTML = iconContent;
                    previewRow.appendChild(div);
                });
            }
        },
        toggleSlowFingerprint: () => {
            State.security.slowFingerprint = !State.security.slowFingerprint;
            Storage.saveSettings();
            const toggle = event.target.closest('.list-item').querySelector('.toggle');
            if (toggle) toggle.classList.toggle('active', State.security.slowFingerprint);
        },
        setAODStyle: (s) => {
            State.aod.style = s;
            Storage.saveSettings();
            const parent = event.target.closest('.list-group');
            if (parent) {
                parent.querySelectorAll('.fa-check').forEach(c => c.remove());
                const clicked = event.target.closest('.list-item');
                if (clicked) clicked.insertAdjacentHTML('beforeend', '<i class="fas fa-check"></i>');
            }
            const clockEl = document.getElementById('aod-preview-clock');
            if (clockEl) {
                const fonts = {
                    'default': "'Inter', sans-serif",
                    'serif': "'Times New Roman', serif",
                    'science': "'Rajdhani', sans-serif",
                    'mono': "'Monoton', cursive",
                    'lux': "'Luxurious Roman', serif"
                };
                clockEl.style.fontFamily = fonts[s] || fonts['default'];
            }
        },
        updateAODTextPreview: (t) => { State.aod.text = t; Storage.saveSettings(); document.getElementById('aod-preview-text').innerText = t || "Your Text"; },
        setAODText: (t) => { State.aod.text = t; Storage.saveSettings(); },
        setAODImg: (src) => { State.aod.image = src; OS.applySettings(); },
        toggleDropdown: (trigger) => {
            const dd = trigger.closest('.settings-dropdown');
            if (!dd) return;
            const isOpen = dd.classList.contains('open');
            document.querySelectorAll('.settings-dropdown.open').forEach(d => d.classList.remove('open'));
            if (!isOpen) {
                const rect = trigger.getBoundingClientRect();
                const appWin = document.getElementById('app-window');
                const bottomSpace = appWin ? (appWin.getBoundingClientRect().bottom - rect.bottom) : (window.innerHeight - rect.bottom);
                if (bottomSpace < 160) dd.classList.add('sd-flip');
                else dd.classList.remove('sd-flip');
                dd.classList.add('open');
            }
        },
        initSliders: () => {
            document.querySelectorAll('.custom-slider').forEach(slider => {
                if (slider._csInit) return;
                slider._csInit = true;
                const min = parseFloat(slider.dataset.min);
                const max = parseFloat(slider.dataset.max);
                const step = parseFloat(slider.dataset.step) || 1;
                const update = (clientX) => {
                    const rect = slider.getBoundingClientRect();
                    let ratio = (clientX - rect.left) / rect.width;
                    ratio = Math.max(0, Math.min(1, ratio));
                    let val = min + ratio * (max - min);
                    val = Math.round(val / step) * step;
                    val = Math.max(min, Math.min(max, val));
                    const pct = ((val - min) / (max - min)) * 100;
                    slider.style.setProperty('--slider-pct', pct);
                    slider.dataset.value = val;
                    if (slider.dataset.oninput) {
                        const fn = new Function('value', slider.dataset.oninput);
                        fn(val);
                    }
                };
                const pct = ((parseFloat(slider.dataset.value) - min) / (max - min)) * 100;
                slider.style.setProperty('--slider-pct', pct);
                const onMove = (e) => {
                    if (!e.touches && e.buttons !== 1) { onUp(); return; }
                    e.preventDefault();
                    update(e.touches ? e.touches[0].clientX : e.clientX);
                };
                const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp); };
                slider.addEventListener('mousedown', (e) => { update(e.clientX); window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp); });
                slider.addEventListener('touchstart', (e) => { update(e.touches[0].clientX); window.addEventListener('touchmove', onMove, { passive: false }); window.addEventListener('touchend', onUp); });
            });
        },
        setClockStyle: (s) => {
            State.clockConfig = State.clockConfig || {};
            State.clockConfig.style = s;
            Storage.saveSettings();
            OS.applySettings();
            OS.updateTime();
            Apps.settings.updateClockPreview();

            const isStretched = s === 'stretched';
            const isTilt = s === 'tilt';
            const dd = document.getElementById('sd-clock-style');
            if (dd) {
                dd.classList.remove('open');
                const val = dd.querySelector('.sd-value');
                if (val) val.innerText = s === 'stretched' ? 'Stretched' : s === 'tilt' ? 'Tilt' : 'Default';
                dd.querySelectorAll('.fa-check').forEach(c => c.remove());
                dd.querySelectorAll('.sd-option').forEach(opt => {
                    const label = opt.querySelector('span').innerText.toLowerCase();
                    if (label === s) opt.insertAdjacentHTML('beforeend', '<i class="fas fa-check"></i>');
                });
            }
            const fontLabel = document.getElementById('clock-font-label');
            const fontItem = document.getElementById('clock-font-item');
            if (fontLabel) fontLabel.innerText = isStretched ? 'Clock Font (disabled)' : 'Clock Font';
            if (fontItem) fontItem.style.cssText = isStretched ? 'opacity:0.4; pointer-events:none;' : '';
        },
        setClockFont: (f) => {
            State.clockConfig = State.clockConfig || {};
            if (State.clockConfig.style === 'stretched') return;
            State.clockConfig.font = f;
            Storage.saveSettings();
            OS.applySettings();
            const fontNames = { default: 'Inter (Default)', serif: 'Serif', science: 'Science Gothic', mono: 'Monoton', lux: 'Luxurious Roman' };
            const dd = document.getElementById('sd-clock-font');
            if (dd) {
                dd.classList.remove('open');
                const val = dd.querySelector('.sd-value');
                if (val) val.innerText = fontNames[f] || fontNames['default'];
                dd.querySelectorAll('.fa-check').forEach(c => c.remove());
                dd.querySelectorAll('.sd-option').forEach(opt => {
                    const key = Object.keys(fontNames).find(k => fontNames[k] === opt.querySelector('span').innerText);
                    if (key === f) opt.insertAdjacentHTML('beforeend', '<i class="fas fa-check"></i>');
                });
            }
            const fonts = {
                'default': "'Inter', sans-serif",
                'serif': "'Times New Roman', serif",
                'science': "'Rajdhani', sans-serif",
                'mono': "'Monoton', cursive",
                'lux': "'Luxurious Roman', serif"
            };
            const previewEl = document.getElementById('clock-preview-time');
            if (previewEl) previewEl.style.fontFamily = fonts[f] || fonts['default'];
            OS.updateTime();
        },
        setClockHourColor: (c) => {
            State.clockConfig = State.clockConfig || {};
            State.clockConfig.hourColor = c;
            State.clockConfig.autoColor = false;
            Storage.saveSettings();
            OS.updateTime();
            const previewEl = document.getElementById('clock-preview-time');
            if (previewEl) {
                const hourDiv = previewEl.querySelector('div:first-child');
                if (hourDiv) hourDiv.style.color = c;
            }
            const autoToggle = document.querySelector('.list-item .toggle.active');
        },
        setClockMinuteColor: (c) => {
            State.clockConfig = State.clockConfig || {};
            State.clockConfig.minuteColor = c;
            State.clockConfig.autoColor = false;
            Storage.saveSettings();
            OS.updateTime();
            const previewEl = document.getElementById('clock-preview-time');
            if (previewEl) {
                const minDiv = previewEl.querySelector('div:last-child');
                if (minDiv) minDiv.style.color = c;
            }
        },

        setBoldOpacity: (v) => {
            State.clockConfig = State.clockConfig || {};
            State.clockConfig.boldOpacity = v;
            Storage.saveSettings();
            OS.updateTime();
            const label = document.getElementById('bold-opacity-val');
            if (label) label.textContent = Math.round(v * 100) + '%';
        },
        toggleStatusBarColor: () => {
            State.clockConfig = State.clockConfig || {};
            State.clockConfig.statusBarColor = !State.clockConfig.statusBarColor;
            const toggle = event && event.target ? event.target.closest('.list-item').querySelector('.toggle') : null;
            if (toggle) toggle.classList.toggle('active', State.clockConfig.statusBarColor);
            Storage.saveSettings();
            OS.updateTime();
        },
        updateClockPreview: () => {
            const previewEl = document.getElementById('clock-preview-time');
            if (!previewEl) return;
            const cc = State.clockConfig || {};
            const now = new Date();
            let h12 = now.getHours() % 12; if (h12 === 0) h12 = 12;
            const h12Padded = h12 < 10 ? '0' + h12 : h12;
            const mins = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes();
            const bOp = cc.boldOpacity !== undefined ? cc.boldOpacity : 0.72;
            const fw = cc.fontWeight || 600;
            const isStretched = cc.style === 'stretched';
            const isTilt = cc.style === 'tilt';
            if (isStretched) {
                previewEl.style.cssText = `font-size:70px;font-weight:${fw};line-height:0.85;letter-spacing:-1px;font-family:Oswald,sans-serif;`;
                previewEl.textContent = h12 + ':' + mins;
            } else if (isTilt) {
                const fonts = { 'default': "'Inter',sans-serif", 'serif': "'Times New Roman',serif", 'science': "'Rajdhani',sans-serif", 'mono': "'Monoton',cursive", 'lux': "'Luxurious Roman',serif" };
                const f = cc.font || 'default';
                previewEl.style.cssText = `font-size:52px;font-weight:${fw};line-height:1;letter-spacing:-1px;font-family:${fonts[f] || fonts['default']};transform:perspective(400px) rotateY(25deg);text-shadow:3px 0 15px rgba(0,0,0,0.3);`;
                previewEl.innerHTML = `<span style="color:${cc.hourColor || '#fff'};opacity:${bOp}">${h12}</span><span style="opacity:${bOp}">:</span><span style="color:${cc.minuteColor || '#fff'};opacity:${bOp}">${mins}</span>`;
            } else {
                const fonts = { 'default': "'Inter',sans-serif", 'serif': "'Times New Roman',serif", 'science': "'Rajdhani',sans-serif", 'mono': "'Monoton',cursive", 'lux': "'Luxurious Roman',serif" };
                const f = cc.font || 'default';
                previewEl.style.cssText = `font-size:48px;font-weight:${fw};line-height:1;font-family:${fonts[f] || fonts['default']};`;
                previewEl.innerHTML = `<span style="color:${cc.hourColor || '#fff'};opacity:${bOp}">${h12}</span><span style="opacity:${bOp}">:</span><span style="color:${cc.minuteColor || '#fff'};opacity:${bOp}">${mins}</span>`;
            }
            const appBody = document.getElementById('app-body');
            const settingsOverlay = document.getElementById('settings-section-overlay');
            const searchRoot = settingsOverlay || appBody;
            if (!searchRoot) return;
            const allGroups = searchRoot.querySelectorAll('.list-group');
            const allSectionHeaders = searchRoot.querySelectorAll('[style*="color:var(--text-sec)"]');
            allGroups.forEach((group, idx) => {
                const items = group.querySelectorAll('.list-item');
                const firstSpan = items[0] ? items[0].querySelector('span') : null;
                const firstText = firstSpan ? firstSpan.textContent.trim() : '';
                if (['Default', 'Stretched', 'Tilt'].includes(firstText)) {
                    items.forEach(item => {
                        const span = item.querySelector('span');
                        const check = item.querySelector('.fa-check');
                        if (!span) return;
                        const text = span.textContent.trim();
                        const styleMap = { 'Default': 'default', 'Stretched': 'stretched', 'Tilt': 'tilt' };
                        if (styleMap[text] !== undefined) {
                            const expected = styleMap[text];
                            const current = cc.style || 'default';
                            if (expected === current && !check) {
                                item.insertAdjacentHTML('beforeend', '<i class="fas fa-check"></i>');
                            } else if (expected !== current && check) {
                                check.remove();
                            }
                        }
                    });
                }
                if (!group.closest('.bold-options-wrapper') && (['Inter (Default)', 'Serif'].includes(firstText) || firstText.includes('Inter'))) {
                    group.style.opacity = isSpecial ? '0.4' : '1';
                    group.style.pointerEvents = isSpecial ? 'none' : 'auto';
                }
            });

            const boldOptionsWrapper = searchRoot.querySelector('.bold-options-wrapper');
            if (boldOptionsWrapper) {
                boldOptionsWrapper.style.transition = 'opacity 0.25s ease';
                boldOptionsWrapper.style.opacity = isBold ? '1' : '0.4';
                boldOptionsWrapper.style.pointerEvents = isBold ? 'auto' : 'none';
                boldOptionsWrapper.querySelectorAll('.list-group').forEach(lg => {
                    lg.style.transition = 'opacity 0.25s ease';
                    lg.style.opacity = '1';
                    lg.style.pointerEvents = 'auto';
                });

                const titleNode = boldOptionsWrapper.previousElementSibling;
                if (titleNode && titleNode.innerText.includes('BOLD CLOCK SETTINGS')) {
                    titleNode.innerText = isBold ? 'BOLD CLOCK SETTINGS' : 'BOLD CLOCK SETTINGS (disabled for this style)';
                }

                const opacityVal = boldOptionsWrapper.querySelector('#bold-opacity-val');
                const opacitySlider = boldOptionsWrapper.querySelector('.bold-opacity-slider');
                if (opacityVal) opacityVal.innerText = Math.round(bOp * 100) + '%';
                if (opacitySlider) opacitySlider.value = Math.round(bOp * 100);
            }
        },

        setBioIcon: (i) => {
            State.security.bioIcon = i;
            Storage.saveSettings();
            LockScreen.updateUI();
            document.querySelectorAll('.fp-opt').forEach(opt => opt.classList.remove('selected'));
            const clicked = event.target.closest('.fp-opt');
            if (clicked) clicked.classList.add('selected');
        },
        setBioIconLive: (i) => {
            State.security.bioIcon = i;
            Storage.saveSettings();
            LockScreen.updateUI();
            document.querySelectorAll('.fp-opt').forEach(opt => opt.classList.remove('selected'));
            const clicked = event.target.closest('.fp-opt');
            if (clicked) clicked.classList.add('selected');
            const preview = document.getElementById('fp-mock-icon');
            if (preview && Apps.settings._fpPreviewHtml) {
                preview.innerHTML = Apps.settings._fpPreviewHtml(i);
            }
        },
        toggleLsBlur: () => {
            State.lsBlur = !State.lsBlur;
            OS.applySettings();
            const toggle = event.target.closest('.list-item').querySelector('.toggle');
            if (toggle) toggle.classList.toggle('active', State.lsBlur);
        },
        _osClickCount: 0,
        handleOSClick: () => {
            if (State.devOptionsEnabled) {
                Toast.show('No need, developer options is already enabled');
                return;
            }
            Apps.settings._osClickCount++;
            const clicksLeft = 7 - Apps.settings._osClickCount;
            if (clicksLeft === 0) {
                State.devOptionsEnabled = true;
                localStorage.setItem('realos_v3_devoptions', 'true');
                Toast.show('Developer options have been enabled!');
            } else if (clicksLeft > 0 && clicksLeft <= 5) {
                Toast.show(`You're ${clicksLeft} clicks away from enabling developer options.`);
            }
        },
        setDevWidth: (val) => {
            State.devWidth = parseInt(val);
            localStorage.setItem('realos_v3_devwidth', State.devWidth);
            document.getElementById('dev-width-val').innerText = State.devWidth;
            OS.applySettings();
        },
        setDevHeight: (val) => {
            State.devHeight = parseInt(val);
            localStorage.setItem('realos_v3_devheight', State.devHeight);
            document.getElementById('dev-height-val').innerText = State.devHeight;
            OS.applySettings();
        },
        resetDevDimensions: () => {
            Apps.settings.setDevWidth(400);
            const wSlider = document.querySelector('[data-oninput="Apps.settings.setDevWidth(value)"]');
            if (wSlider) {
                wSlider.dataset.value = '400';
                wSlider.style.setProperty('--slider-pct', 0);
            }
            Toast.show('Width reset to default');
        },
        setAnimSpeed: (speed) => {
            State.animationSpeed = speed;
            OS.applySettings();
            localStorage.setItem('realos_v3_animspeed', speed);
            Storage.saveSettings();
        },
        toggleFullscreen: () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen()
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        },
        toggleSwipeClose: () => {
            State.swipeToClose = !State.swipeToClose;
            localStorage.setItem('realos_v3_swipe_close', State.swipeToClose);
            Storage.saveSettings();
            OS.setupGestures();
            const toggle = event.target.closest('.list-item').querySelector('.toggle');
            if (toggle) toggle.classList.toggle('active', State.swipeToClose);
        },
        toggleAnimConfigValue: (key) => {
            State.animConfig[key] = !State.animConfig[key];
            if (key === 'openWallBlur' && !State.animConfig[key]) {
                const wallLayer = document.getElementById('wallpaper-layer');
                if (wallLayer) wallLayer.style.filter = '';
            }
            Storage.saveSettings();
            OS.applySettings();
            const toggle = event.target.closest('.list-item').querySelector('.toggle');
            if (toggle) toggle.classList.toggle('active', State.animConfig[key]);
        },
        exportAnimConfig: () => {
            if (!State.animConfig) return;
            let str = '';
            for (const [k, v] of Object.entries(State.animConfig)) {
                if (Array.isArray(v)) str += `${k}: [${v.join(',')}]\n`;
                else str += `${k}: ${v}\n`;
            }
            const blob = new Blob([str], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'animconfig.txt';
            a.click();
            URL.revokeObjectURL(url);
            OS.showNotification('System', 'Animation config exported');
        },
        importAnimConfig: () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.txt';
            input.onchange = e => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = e => {
                    const text = e.target.result;
                    const lines = text.split('\n');
                    let p = false;
                    for (let line of lines) {
                        line = line.trim();
                        if (!line || !line.includes(':')) continue;
                        let [k, v] = line.split(/:(.+)/);
                        k = k.trim(); v = v.trim();
                        if (v.startsWith('[') && v.endsWith(']')) {
                            const arr = v.slice(1, -1).split(',').map(Number);
                            if (arr.length === 4 && !arr.some(isNaN)) { State.animConfig[k] = arr; p = true; }
                        } else {
                            const num = parseFloat(v);
                            if (!isNaN(num)) { State.animConfig[k] = num; p = true; }
                        }
                    }
                    if (p) {
                        Storage.saveSettings();
                        OS.applySettings();
                        if (document.getElementById('ac-open-icon-val')) Apps.settings.render('animconfig');
                        OS.showNotification('System', 'Animation config imported');
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        },
        parseBezierInput: (input, configKey) => {
            let raw = input.value.replace(/cubic-bezier\s*\(/i, '').replace(/\)/g, '').trim();
            const parts = raw.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
            if (parts.length === 4) {
                parts[0] = Math.max(0, Math.min(1, parts[0]));
                parts[2] = Math.max(0, Math.min(1, parts[2]));
                parts[1] = Math.max(-2, Math.min(2, parts[1]));
                parts[3] = Math.max(-2, Math.min(2, parts[3]));
                State.animConfig[configKey] = parts;
                Storage.saveSettings();
                input.value = 'cubic-bezier(' + parts.join(', ') + ')';
                setTimeout(() => {
                    Apps.settings.initAnimPreview();
                    if (Apps.settings.initBezierEditor) {
                        Apps.settings.initBezierEditor(input.id.replace('-vals', ''), configKey);
                    }
                }, 50);
            } else {
                const cur = State.animConfig[configKey] || [0.2, 0.85, 0.1, 1];
                input.value = 'cubic-bezier(' + cur.join(', ') + ')';
            }
        },
        setAnimConfig: (key, val) => {
            State.animConfig[key] = parseFloat(val);
            Storage.saveSettings();
            OS.applySettings();
            const labels = {
                openIconFade: { id: 'ac-open-icon-val', fmt: v => (v * 100).toFixed(0) + '%' },
                closeIconFade: { id: 'ac-close-icon-val', fmt: v => (v * 100).toFixed(0) + '%' },
                closeShapeMorph: { id: 'ac-close-shape-val', fmt: v => (v * 100).toFixed(0) + '%' },
                openScaleTime: { id: 'ac-scale-time-val', fmt: v => v.toFixed(2) + 's' },
                openAppZoomOut: { id: 'ac-zoom-out-val', fmt: v => (v * 100).toFixed(0) + '%' },
                openWallZoom: { id: 'ac-wall-zoom-val', fmt: v => (v * 100).toFixed(0) + '%' }
            };
            if (labels[key]) {
                const el = document.getElementById(labels[key].id);
                if (el) el.innerText = labels[key].fmt(parseFloat(val));
            }
            if (Apps.settings._animPreviewRunning) {
                Apps.settings._animPreviewRunning = false;
                setTimeout(() => Apps.settings.initAnimPreview(), 50);
            }
        },
        initBezierEditor: (canvasId, configKey) => {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const size = 200;
            const pad = 15;
            const area = size - pad * 2;
            let pts = (State.animConfig[configKey] || [0.2, 0.85, 0.1, 1]).slice();
            let dragging = -1;
            function toCanvas(x, y) { return [pad + x * area, pad + (1 - y) * area]; }
            function fromCanvas(cx, cy) { return [Math.max(0, Math.min(1, (cx - pad) / area)), Math.max(-0.5, Math.min(1.5, 1 - (cy - pad) / area))]; }
            function draw() {
                const isDark = State.darkMode;
                ctx.clearRect(0, 0, size, size);
                ctx.fillStyle = isDark ? '#1c1c1e' : '#f2f2f7';
                ctx.beginPath();
                ctx.roundRect(0, 0, size, size, 12);
                ctx.fill();
                ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
                ctx.lineWidth = 1;
                for (let gi = 0; gi <= 4; gi++) { const gp = pad + (area / 4) * gi; ctx.beginPath(); ctx.moveTo(gp, pad); ctx.lineTo(gp, pad + area); ctx.stroke(); ctx.beginPath(); ctx.moveTo(pad, gp); ctx.lineTo(pad + area, gp); ctx.stroke(); }
                ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
                ctx.setLineDash([4, 4]);
                const [p1x, p1y] = toCanvas(pts[0], pts[1]);
                const [p2x, p2y] = toCanvas(pts[2], pts[3]);
                const [sx, sy] = toCanvas(0, 0);
                const [ex, ey] = toCanvas(1, 1);
                ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(p1x, p1y); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(p2x, p2y); ctx.stroke();
                ctx.setLineDash([]);
                ctx.strokeStyle = isDark ? '#0a84ff' : '#007AFF';
                ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.moveTo(sx, sy); ctx.bezierCurveTo(p1x, p1y, p2x, p2y, ex, ey); ctx.stroke();
                [[sx, sy], [ex, ey]].forEach(([x, y]) => { ctx.fillStyle = isDark ? '#555' : '#999'; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); });
                ctx.fillStyle = '#ff9500'; ctx.beginPath(); ctx.arc(p1x, p1y, 7, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ff375f'; ctx.beginPath(); ctx.arc(p2x, p2y, 7, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('P1', p1x, p1y + 3); ctx.fillText('P2', p2x, p2y + 3);
            }
            function getPos(e) {
                const rect = canvas.getBoundingClientRect();
                const scaleX = size / rect.width;
                const scaleY = size / rect.height;
                const t = e.touches ? e.touches[0] : e;
                return [(t.clientX - rect.left) * scaleX, (t.clientY - rect.top) * scaleY];
            }
            function onDown(e) {
                e.preventDefault();
                const [mx, my] = getPos(e);
                const [p1x, p1y] = toCanvas(pts[0], pts[1]);
                const [p2x, p2y] = toCanvas(pts[2], pts[3]);
                const d1 = Math.hypot(mx - p1x, my - p1y);
                const d2 = Math.hypot(mx - p2x, my - p2y);
                if (d1 < 20 && d1 <= d2) dragging = 0;
                else if (d2 < 20) dragging = 1;
                else dragging = -1;
            }
            function onMove(e) {
                if (dragging < 0) return;
                e.preventDefault();
                const [mx, my] = getPos(e);
                const [nx, ny] = fromCanvas(mx, my);
                if (dragging === 0) { pts[0] = parseFloat(nx.toFixed(2)); pts[1] = parseFloat(ny.toFixed(2)); }
                else { pts[2] = parseFloat(nx.toFixed(2)); pts[3] = parseFloat(ny.toFixed(2)); }
                draw();
                const valEl = document.getElementById(canvasId + '-vals');
                if (valEl) valEl.value = 'cubic-bezier(' + pts.join(', ') + ')';
            }
            function onUp() {
                if (dragging >= 0) {
                    dragging = -1;
                    State.animConfig[configKey] = pts.slice();
                    Storage.saveSettings();
                    if (Apps.settings._animPreviewRunning) { Apps.settings._animPreviewRunning = false; setTimeout(() => Apps.settings.initAnimPreview(), 50); }
                }
            }
            canvas.addEventListener('mousedown', onDown); canvas.addEventListener('mousemove', onMove); canvas.addEventListener('mouseup', onUp); canvas.addEventListener('mouseleave', onUp);
            canvas.addEventListener('touchstart', onDown, { passive: false }); canvas.addEventListener('touchmove', onMove, { passive: false }); canvas.addEventListener('touchend', onUp);
            draw();
        },
        initAnimPreview: () => {
            const box = document.getElementById('anim-preview-box');
            if (!box) return;
            Apps.settings._animPreviewGen = (Apps.settings._animPreviewGen || 0) + 1;
            const gen = Apps.settings._animPreviewGen;
            Apps.settings._animPreviewRunning = true;
            const wall = document.getElementById('ap-wall');
            const icon = document.getElementById('ap-icon');
            const win = document.getElementById('ap-window');
            const overlay = document.getElementById('ap-overlay');
            const wallUrl = State.wallpapers[State.currentWall] || '';
            if (isVideoWallpaper(wallUrl)) {
                wall.style.backgroundImage = 'none';
                let vid = wall.querySelector('video');
                if (!vid) {
                    vid = document.createElement('video');
                    vid.muted = true;
                    vid.playsInline = true;
                    vid.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
                    wall.appendChild(vid);
                }
                vid.src = wallUrl;
                vid.currentTime = 1e6;
                vid.pause();
            } else {
                wall.style.backgroundImage = "url('" + wallUrl + "')";
                const existingVid = wall.querySelector('video');
                if (existingVid) existingVid.remove();
            }
            const iconW = 32, iconH = 32;
            const iconLeft = (180 - iconW) / 2;
            const iconTop = 320 - 60 - iconH;
            const spd = State.animationSpeed;
            const ac = State.animConfig;
            const totalDur = 0.5 * spd;
            const ob = ac.openBezier || [0.2, 0.85, 0.1, 1];
            const cb = ac.closeBezier || [0.15, 1.01, 0.3, 1.02];
            const openEase = 'cubic-bezier(' + ob.join(',') + ')';
            const osb = ac.openScaleBezier || [0.2, 0.85, 0.1, 1];
            const openScaleEase = 'cubic-bezier(' + osb.join(',') + ')';
            const scaleDur = (ac.openScaleTime || 0.5) * spd;
            const closeEase = 'cubic-bezier(' + cb.join(',') + ')';
            function alive() { return Apps.settings._animPreviewGen === gen && Apps.settings._animPreviewRunning && document.getElementById('anim-preview-box'); }
            function resetState() {
                win.style.transition = 'none'; win.style.left = iconLeft + 'px'; win.style.top = iconTop + 'px';
                win.style.width = iconW + 'px'; win.style.height = iconH + 'px'; win.style.borderRadius = '8px'; win.style.opacity = '0';
                overlay.style.transition = 'none'; overlay.style.opacity = '1';
                icon.style.transition = 'none'; icon.style.opacity = '1';
                wall.style.transition = 'none'; wall.style.filter = 'none'; wall.style.transform = 'scale(1)';
                void win.offsetWidth;
            }
            function openAnim() {
                if (!alive()) return;
                resetState(); void win.offsetWidth;
                icon.style.opacity = '0'; win.style.opacity = '1';
                win.style.transition = 'top ' + totalDur + 's ' + openEase + ', left ' + totalDur + 's ' + openEase + ', width ' + scaleDur + 's ' + openScaleEase + ', height ' + scaleDur + 's ' + openScaleEase + ', border-radius ' + scaleDur + 's ' + openScaleEase;
                wall.style.transition = 'filter ' + (ac.wallBlurDur * spd) + 's ease-out, transform 0.5s ' + openEase;
                overlay.style.transition = 'opacity ' + (totalDur * ac.openIconFade) + 's ease';
                requestAnimationFrame(function () {
                    if (!alive()) return;
                    win.style.left = '0px'; win.style.top = '0px'; win.style.width = '180px'; win.style.height = '320px'; win.style.borderRadius = '24px';
                    wall.style.filter = 'blur(8px) brightness(0.8)'; wall.style.transform = 'scale(1.1)';
                    overlay.style.opacity = '0';
                });
                setTimeout(function () { if (alive()) closeAnim(); }, totalDur * 1000 + 800);
            }
            function closeAnim() {
                if (!alive()) return;
                var morphDur = totalDur * ac.closeShapeMorph;
                overlay.style.transition = 'opacity ' + (morphDur * ac.closeIconFade) + 's ease'; overlay.style.opacity = '1';
                win.style.transition = 'top ' + (totalDur * 0.55) + 's ' + closeEase + ', left ' + (totalDur * 0.55) + 's ' + closeEase + ', width ' + morphDur + 's ' + closeEase + ', height ' + morphDur + 's ' + closeEase + ', border-radius ' + morphDur + 's ' + closeEase;
                wall.style.transition = 'filter ' + (ac.wallBlurDur * spd) + 's ease-out, transform 0.5s ' + closeEase;
                requestAnimationFrame(function () {
                    if (!alive()) return;
                    win.style.left = iconLeft + 'px'; win.style.top = iconTop + 'px'; win.style.width = iconW + 'px'; win.style.height = iconH + 'px'; win.style.borderRadius = '8px';
                    wall.style.filter = 'none'; wall.style.transform = 'scale(1)';
                });
                setTimeout(function () {
                    if (!alive()) return;
                    win.style.transition = 'opacity 0.15s ease'; win.style.opacity = '0';
                    icon.style.transition = 'opacity 0.15s ease'; icon.style.opacity = '1';
                    setTimeout(function () { if (alive()) openAnim(); }, 800);
                }, totalDur * 0.55 * 1000 + 100);
            }
            openAnim();
        },
        toggleAnimStyle: () => {
            State.animStyle = State.animStyle === 'new' ? 'old' : 'new';
            localStorage.setItem('realos_v3_anim_style', State.animStyle);
            Storage.saveSettings();
            const toggle = event.target.closest('.list-item').querySelector('.toggle');
            if (toggle) toggle.classList.toggle('active', State.animStyle === 'new');
        },

        updateProfile: (name, image) => {
            State.userProfile.name = name || 'Guest';
            if (image) State.userProfile.image = image;
            Storage.saveSettings();

            const rootName = document.getElementById('root-profile-name');
            if (rootName) rootName.innerText = State.userProfile.name;

            const rootAvatar = document.getElementById('root-profile-avatar');
            if (rootAvatar) {
                rootAvatar.innerHTML = State.userProfile.image ? `<img src="${State.userProfile.image}">` : `<i class="fas fa-user"></i>`;
            }

            const settingsAvatar = document.getElementById('settings-profile-avatar');
            if (settingsAvatar) {
                settingsAvatar.innerHTML = State.userProfile.image ? `<img src="${State.userProfile.image}">` : `<i class="fas fa-user"></i>`;
                settingsAvatar.innerHTML += `<div class="setup-profile-edit"><i class="fas fa-camera"></i></div>`;
            }
        },
        renamePhone: () => {
            const footer = document.getElementById('osm-footer');
            const overlay = document.getElementById('modal-overlay');
            const msgContainer = document.getElementById('osm-msg');

            document.getElementById('osm-title').innerText = 'Rename Phone';

            msgContainer.innerHTML = '';
            const inputEl = document.createElement('input');
            inputEl.type = 'text';
            inputEl.id = 'rename-phone-input';
            inputEl.placeholder = 'RealPhone 2 Ultra';
            inputEl.style.width = '100%';
            inputEl.style.padding = '10px';
            inputEl.style.borderRadius = '8px';
            inputEl.style.border = State.darkMode ? '1px solid #555' : '1px solid #ccc';
            inputEl.style.background = 'transparent';
            inputEl.style.color = 'inherit';
            inputEl.style.fontSize = '16px';
            inputEl.style.outline = 'none';
            inputEl.style.marginTop = '10px';
            inputEl.autocomplete = 'off';
            msgContainer.appendChild(inputEl);

            footer.innerHTML = '';

            const cancelBtn = document.createElement('div');
            cancelBtn.className = 'osm-btn secondary';
            cancelBtn.innerText = 'Cancel';
            cancelBtn.onclick = () => {
                OS.hidePopup();
            };

            const addBtn = document.createElement('div');
            addBtn.className = 'osm-btn primary';
            addBtn.innerText = 'Apply';
            addBtn.onclick = () => {
                let val = document.getElementById('rename-phone-input').value.trim();
                State.phoneName = val || 'RealPhone 2 Ultra';
                Storage.saveSettings();

                const nameEl = document.getElementById('about-phone-name-val');
                if (nameEl) nameEl.innerText = State.phoneName;

                OS.hidePopup();
            };

            footer.appendChild(cancelBtn);
            footer.appendChild(addBtn);

            overlay.classList.add('active');

            setTimeout(() => inputEl.focus(), 100);
        },
    },
    music: {
        render: () => {
            document.getElementById('app-window').style.background = 'var(--bg-app)';
            const body = document.getElementById('app-body');
            document.getElementById('app-header').style.display = 'none';
            let listHTML = '';
            Music.library.forEach((track, i) => {
                const artStyle = track.art ? `background-image:url('${track.art}')` : `background:linear-gradient(45deg, #333, #666)`;
                const isPlaying = Music.currentIdx === i && Music.active;
                listHTML += `
                    <div class="song-item" data-song-idx="${i}" onclick="Music.playTrack(${i})">
                        <div class="song-art" style="${artStyle}"></div>
                        <div class="song-info">
                            <div class="song-title">${track.title}</div>
                            <div class="song-artist">${track.artist}</div>
                        </div>
                        <div style="display:flex; align-items:center; gap:10px">
                            <span class="song-playing-indicator ${isPlaying ? 'active' : ''}"><i class="fas fa-volume-up" style="color:var(--accent)"></i></span>
                            <div style="padding:10px; color:#666; cursor:pointer;" onclick="event.stopPropagation(); Music.removeTrack(${i})"><i class="fas fa-times"></i></div>
                        </div>
                    </div>
                `;
            });
            const current = Music.library[Music.currentIdx] || { title: 'No Song', artist: '-', art: null };
            const curArt = current.art ? `background-image:url('${current.art}')` : `background:linear-gradient(45deg, #333, #666)`;
            const blurArt = current.art ? `background-image:url('${current.art}')` : `background:#333`;
            body.innerHTML = `
                <div class="music-app">
                    <div class="music-header">
                        <button class="add-song-btn" onclick="document.getElementById('file-input').click()"><i class="fas fa-plus"></i></button>
                        <h2 style="margin:0">Music</h2>
                    </div>
                    <div class="song-list">
                        ${Music.library.length ? listHTML : '<div style="padding:20px; color:#666; text-align:center;">No songs added. Tap + to add MP3.</div>'}
                    </div>
                    <div class="mini-player" onclick="Music.expand()">
                        <div class="mini-player-bg" style="${blurArt}; background-size:cover; filter: blur(30px); opacity: var(--glass-opacity, 0.4);"></div>
                        <div class="mini-player-content">
                            <div id="mp-art" style="width:50px; height:50px; border-radius:8px; flex-shrink:0; margin-right:15px; ${curArt}; background-size:cover;"></div>
                            <div style="flex:1; overflow:hidden;">
                                <div id="mp-title" style="font-weight:600; white-space:nowrap;">${current.title}</div>
                                <div id="mp-artist" style="font-size:12px; color:#aaa;">${current.artist}</div>
                                <div class="prog-bar-container" style="height:4px; margin-top:5px; cursor:default;" onclick="event.stopPropagation()">
                                    <div class="prog-bar-bg" style="background:rgba(128,128,128,0.3)"><div class="prog-bar-fill" id="app-prog-fill"></div></div>
                                </div>
                            </div>
                            <div style="font-size:24px; margin-left:15px;">
                                <i id="mp-play-icon" class="fas ${Music.audio.paused ? 'fa-play' : 'fa-pause'}" onclick="event.stopPropagation(); Music.toggle()"></i>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('file-input').onchange = Music.handleFile;
        }
    }
};
