const Music = {
    active: false, currentIdx: 0, library: [], audio: document.getElementById('audio-player'), scrubbing: false,
    init: () => {
        Music.audio.onended = () => {
            if (Music.repeat || Music.shuffle) {
                Music.next();
            } else {
                Music.audio.pause();
                Music.audio.currentTime = 0;
                Music.active = false;
                Music.updateUI();
            }
        };
        Music.audio.ontimeupdate = () => Music.updateProgress();
    },
    loadFromDB: async () => {
        const songs = await Storage.loadSongs();
        if (songs.length > 0) Music.library = songs;
    },
    playTrack: (index) => {
        if (!Music.library[index]) return;
        const prevTrack = Music.library[Music.currentIdx];
        const prevHadLyrics = prevTrack && prevTrack.lrcData && prevTrack.lrcData.length > 0;
        Music.currentIdx = index;
        const track = Music.library[index];
        const currentHasLyrics = track && track.lrcData && track.lrcData.length > 0;
        let src = track.url;
        if (track.blob && !src) src = URL.createObjectURL(track.blob);
        Music.audio.src = src;
        Music.active = true;
        Music.audio.play()
        Music.updateUI();
        Island.update();
        if (typeof Lyrics !== 'undefined') {
            Lyrics.onSongChange(prevHadLyrics, currentHasLyrics);
        }
    },
    toggle: () => {
        if (!Music.active && Music.library.length > 0) { Music.playTrack(0); return; }
        if (Music.audio.paused) { Music.audio.play(); Music.active = true; } else { Music.audio.pause(); }
        Music.updateUI();
        if (typeof Island !== 'undefined') Island.update();
        if (typeof ControlCenter !== 'undefined') ControlCenter.updateUI();
    },
    next: () => {
        if (Music.repeat) {
            Music.playTrack(Music.currentIdx);
            return;
        }
        let nextIdx;
        if (Music.shuffle) {
            if (Music.library.length > 1) {
                let newIdx = Music.currentIdx;
                let attempts = 0;
                while (newIdx === Music.currentIdx && attempts < 5) {
                    newIdx = Math.floor(Math.random() * Music.library.length);
                    attempts++;
                }
                nextIdx = newIdx;
            } else {
                nextIdx = 0;
            }
        } else {
            nextIdx = Music.currentIdx + 1;
            if (nextIdx >= Music.library.length) nextIdx = 0;
        }
        Music.playTrack(nextIdx);
    },
    prev: () => {
        let prev = Music.currentIdx - 1;
        if (prev < 0) prev = Music.library.length - 1;
        Music.playTrack(prev);
    },
    startScrub: (e, elem) => { Music.scrubbing = true; Music.seek(e, elem); },
    handleScrub: (e, elem) => { if (Music.scrubbing) Music.seek(e, elem); },
    endScrub: () => { Music.scrubbing = false; },
    seek: (e, elem) => {
        const rect = elem.getBoundingClientRect();
        let percent = (e.clientX - rect.left) / rect.width;
        if (percent < 0) percent = 0; if (percent > 1) percent = 1;
        if (Music.audio.duration) { Music.audio.currentTime = percent * Music.audio.duration; Music.updateProgress(); }
    },
    updateProgress: () => {
        if (!Music.active && !Music.scrubbing) return;
        const curr = Music.audio.currentTime;
        const dur = Music.audio.duration || 0;
        const pct = (curr / dur) * 100;
        const fmt = (t) => { const m = Math.floor(t / 60); const s = Math.floor(t % 60).toString().padStart(2, '0'); return `${m}:${s}`; };
        ['exp', 'fs'].forEach(p => {
            const f = document.getElementById(`${p}-prog-fill`); if (f) f.style.width = `${pct}%`;
            const c = document.getElementById(`${p}-curr-time`); if (c) c.innerText = fmt(curr);
            const t = document.getElementById(`${p}-tot-time`); if (t) t.innerText = fmt(dur);
        });
        if (typeof Lyrics !== 'undefined') {
            Lyrics.sync();
        }
    },
    handleFile: (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const blob = new Blob([evt.target.result], { type: f.type });
            const newTrack = { id: Date.now(), title: f.name, artist: "Unknown Artist", blob: blob, art: null };
            jsmediatags.read(blob, {
                onSuccess: (tag) => {
                    newTrack.title = tag.tags.title || f.name;
                    newTrack.artist = tag.tags.artist || "Unknown Artist";
                    if (tag.tags.picture) {
                        const data = tag.tags.picture.data;
                        let base64 = "";
                        for (let i = 0; i < data.length; i++) base64 += String.fromCharCode(data[i]);
                        newTrack.art = `data:${tag.tags.picture.format};base64,${window.btoa(base64)}`;
                    }
                    Storage.saveSong(newTrack);
                    Music.library.unshift(newTrack);
                    Apps.music.render();
                    Music.playTrack(0);
                },
                onError: (err) => {
                    Storage.saveSong(newTrack);
                    Music.library.unshift(newTrack);
                    Apps.music.render();
                    Music.playTrack(0);
                }
            });
        };
        reader.readAsArrayBuffer(f);
        e.target.value = '';
    },
    removeTrack: (idx) => {
        const track = Music.library[idx];
        OS.showPopup('Remove Song', `Are you sure you want to remove ${track.title}?`, () => {
            if (track.id) Storage.removeSong(track.id);
            Music.library.splice(idx, 1);
            if (Music.currentIdx === idx) Music.audio.pause();
            Apps.music.render();
        });
    },
    expand: () => {
        document.getElementById('music-fs-overlay').classList.add('active');
        Music.updateUI();
    },
    collapse: () => {
        const overlay = document.getElementById('music-fs-overlay');
        if (Lyrics && Lyrics.active) {
            Lyrics.active = false;
            overlay.classList.remove('lyrics-active');
            document.getElementById('lyrics-btn').classList.remove('active');
            document.getElementById('lyrics-container').innerHTML = '';
        }
        overlay.classList.remove('active');
    },
    updateUI: () => {
        const track = Music.library[Music.currentIdx];
        if (!track) return;
        const artUrl = track.art || 'linear-gradient(45deg, #333, #666)';
        const artStyle = track.art ? `background-image:url('${track.art}')` : `background:${artUrl}`;
        const blurStyle = track.art ? `background-image:url('${track.art}')` : `background:#333`;
        document.getElementById('mini-art').style = `width:24px; height:24px; margin-right:10px; border-radius:4px; ${artStyle}; background-size:cover;`;
        document.getElementById('exp-art').style = `width:55px; height:55px; border-radius:12px; ${artStyle}; background-size:cover;`;
        document.getElementById('exp-title').innerText = track.title;
        document.getElementById('exp-artist').innerText = track.artist;
        document.getElementById('exp-play').className = Music.audio.paused ? 'fas fa-play' : 'fas fa-pause';
        const wave = document.querySelector('.di-wave');
        if (wave) {
            if (Music.audio.paused) wave.classList.add('paused');
            else wave.classList.remove('paused');
        }
        if (document.querySelector('.mini-player-bg')) {
            document.querySelector('.mini-player-bg').style = `${blurStyle}; background-size:cover; filter: blur(30px); opacity: 0.6;`;
            document.getElementById('mp-title').innerText = track.title;
            document.getElementById('mp-artist').innerText = track.artist;
            document.getElementById('mp-art').style = `width:50px; height:50px; border-radius:8px; flex-shrink:0; margin-right:15px; ${artStyle}; background-size:cover;`;
            document.getElementById('mp-play-icon').className = Music.audio.paused ? 'fas fa-play' : 'fas fa-pause';
        }
        document.getElementById('fs-bg').style = `${blurStyle}; background-size:cover; filter: blur(60px); opacity: 0.5;`;
        document.getElementById('fs-art').style = `${artStyle}; background-size:cover;`;
        document.getElementById('fs-title').innerText = track.title;
        document.getElementById('fs-artist').innerText = track.artist;
        document.getElementById('fs-play').className = Music.audio.paused ? 'fas fa-play' : 'fas fa-pause';
        Music.updatePlayingIndicators();
        const shuffleBtn = document.getElementById('fs-shuffle');
        const repeatBtn = document.getElementById('fs-repeat');
        if (shuffleBtn) shuffleBtn.classList.toggle('active', Music.shuffle);
        if (repeatBtn) repeatBtn.classList.toggle('active', Music.repeat);
    },
    shuffle: false,
    repeat: false,
    toggleShuffle: () => {
        Music.shuffle = !Music.shuffle;
        const btn = document.getElementById('fs-shuffle');
        if (btn) btn.classList.toggle('active', Music.shuffle);
        Island.notify(Music.shuffle ? 'Shuffle On' : 'Shuffle Off', '', 'fa-random');
    },
    toggleRepeat: () => {
        Music.repeat = !Music.repeat;
        const btn = document.getElementById('fs-repeat');
        if (btn) btn.classList.toggle('active', Music.repeat);
        Island.notify(Music.repeat ? 'Repeat On' : 'Repeat Off', '', 'fa-redo');
    },
    updatePlayingIndicators: () => {
        const indicators = document.querySelectorAll('.song-playing-indicator');
        indicators.forEach(ind => {
            const songItem = ind.closest('.song-item');
            if (songItem) {
                const idx = parseInt(songItem.dataset.songIdx);
                const isPlaying = Music.currentIdx === idx && Music.active;
                ind.classList.toggle('active', isPlaying);
            }
        });
    }
};
Music.init();
