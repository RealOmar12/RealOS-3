const Lyrics = {
    active: false,
    currentLineIdx: -1,
    parse: (lrcText) => {
        const lines = lrcText.split('\n');
        const lyrics = [];
        const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
        lines.forEach(line => {
            const matches = [...line.matchAll(timeRegex)];
            if (matches.length > 0) {
                const text = line.replace(timeRegex, '').trim();
                if (text) {
                    matches.forEach(match => {
                        const minutes = parseInt(match[1]);
                        const seconds = parseInt(match[2]);
                        const ms = parseInt(match[3]);
                        const time = minutes * 60 + seconds + ms / 1000;
                        lyrics.push({ time, text });
                    });
                }
            }
        });
        lyrics.sort((a, b) => a.time - b.time);
        return lyrics;
    },
    toggleMode: () => {
        const overlay = document.getElementById('music-fs-overlay');
        const track = Music.library[Music.currentIdx];
        if (Lyrics.active) {
            Lyrics.active = false;
            overlay.classList.remove('lyrics-active');
            document.getElementById('lyrics-btn').classList.remove('active');
            document.getElementById('lyrics-container').innerHTML = '';
            return;
        }
        if (!track || !track.lrcData || track.lrcData.length === 0) {
            const footer = document.getElementById('osm-footer');
            document.getElementById('osm-title').innerText = 'No Lyrics';
            document.getElementById('osm-msg').innerText = "You haven't added a .lrc file to this song";
            footer.innerHTML = '';
            const cancelBtn = document.createElement('div');
            cancelBtn.className = 'osm-btn secondary';
            cancelBtn.innerText = 'Cancel';
            cancelBtn.onclick = OS.hidePopup;
            const addBtn = document.createElement('div');
            addBtn.className = 'osm-btn primary';
            addBtn.innerText = 'Add';
            addBtn.onclick = () => {
                OS.hidePopup();
                Lyrics.promptAddLrc();
            };
            footer.appendChild(cancelBtn);
            footer.appendChild(addBtn);
            document.getElementById('modal-overlay').classList.add('active');
            return;
        }
        Lyrics.active = true;
        overlay.classList.add('lyrics-active');
        document.getElementById('lyrics-btn').classList.add('active');
        Lyrics.render();
    },
    render: () => {
        const container = document.getElementById('lyrics-container');
        const track = Music.library[Music.currentIdx];
        if (!track || !track.lrcData) {
            container.innerHTML = '<div class="lyric-line" style="opacity:0.5">No lyrics available</div>';
            return;
        }
        container.innerHTML = track.lrcData.map((line, i) =>
            `<div class="lyric-line" data-idx="${i}" onclick="Lyrics.seekTo(${line.time})">${line.text}</div>`
        ).join('');
        Lyrics.currentLineIdx = -1;
        Lyrics.sync();
    },
    sync: () => {
        if (!Lyrics.active) return;
        const track = Music.library[Music.currentIdx];
        if (!track || !track.lrcData) return;
        const currentTime = Music.audio.currentTime;
        let newIdx = -1;
        for (let i = track.lrcData.length - 1; i >= 0; i--) {
            if (currentTime >= track.lrcData[i].time) {
                newIdx = i;
                break;
            }
        }
        if (newIdx !== Lyrics.currentLineIdx) {
            Lyrics.currentLineIdx = newIdx;
            Lyrics.highlightLine(newIdx);
        }
    },
    highlightLine: (idx) => {
        const container = document.getElementById('lyrics-container');
        const lines = container.querySelectorAll('.lyric-line');
        lines.forEach((line, i) => {
            line.classList.remove('active', 'past');
            if (i === idx) {
                line.classList.add('active');
                line.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (i < idx) {
                line.classList.add('past');
            }
        });
    },
    seekTo: (time) => {
        Music.audio.currentTime = time;
    },
    promptAddLrc: () => {
        const input = document.getElementById('lrc-input');
        input.onclick = null;
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.name.toLowerCase().endsWith('.lrc')) {
                OS.showPopup('Invalid File', 'Only .lrc files are accepted. Please select a valid LRC file.');
                e.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = (evt) => {
                const lrcText = evt.target.result;
                const parsed = Lyrics.parse(lrcText);
                if (parsed.length > 0) {
                    Music.library[Music.currentIdx].lrcData = parsed;
                    Storage.saveSongs(Music.library);
                    Island.notify('Lyrics Added', `${parsed.length} lines loaded`, 'fa-music');
                    if (!Lyrics.active) {
                        Lyrics.toggleMode();
                    } else {
                        Lyrics.render();
                    }
                } else {
                    OS.showPopup('Error', 'Could not parse LRC file');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        };
        input.click();
    },
    confirmRemove: () => {
        const track = Music.library[Music.currentIdx];
        if (!track || !track.lrcData) return;
        const footer = document.getElementById('osm-footer');
        document.getElementById('osm-title').innerText = 'Remove Lyrics';
        document.getElementById('osm-msg').innerText = 'Are you sure you want to remove the .lrc file from this song?';
        footer.innerHTML = '';
        const noBtn = document.createElement('div');
        noBtn.className = 'osm-btn secondary';
        noBtn.innerText = 'No';
        noBtn.onclick = OS.hidePopup;
        const yesBtn = document.createElement('div');
        yesBtn.className = 'osm-btn primary';
        yesBtn.style.background = '#ff3b30';
        yesBtn.innerText = 'Yes';
        yesBtn.onclick = () => {
            delete Music.library[Music.currentIdx].lrcData;
            Storage.saveSongs(Music.library);
            Lyrics.toggleMode();
            OS.hidePopup();
            Island.notify('Lyrics Removed', 'LRC file has been removed', 'fa-trash');
        };
        footer.appendChild(noBtn);
        footer.appendChild(yesBtn);
        document.getElementById('modal-overlay').classList.add('active');
    },
    onSongChange: (prevHadLyrics, currentHasLyrics) => {
        if (Lyrics.active) {
            if (!currentHasLyrics) {
                Lyrics.active = false;
                document.getElementById('music-fs-overlay').classList.remove('lyrics-active');
                document.getElementById('lyrics-btn').classList.remove('active');
                document.getElementById('lyrics-container').innerHTML = '';
            } else {
                Lyrics.render();
            }
        }
    }
};
