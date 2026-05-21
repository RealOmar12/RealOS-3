const Storage = {
    db: null,
    init: async () => {
        return new Promise((resolve) => {
            const request = indexedDB.open("RealOS_MusicDB", 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('songs')) db.createObjectStore('songs', { keyPath: 'id', autoIncrement: true });
            };
            request.onsuccess = (e) => { Storage.db = e.target.result; resolve(); };
        });
    },
    saveSong: (song) => {
        if (!Storage.db) return;
        const tx = Storage.db.transaction(['songs'], 'readwrite');
        tx.objectStore('songs').add(song);
    },
    removeSong: (id) => {
        if (!Storage.db) return;
        const tx = Storage.db.transaction(['songs'], 'readwrite');
        tx.objectStore('songs').delete(id);
    },
    loadSongs: () => {
        return new Promise((resolve) => {
            if (!Storage.db) resolve([]);
            const tx = Storage.db.transaction(['songs'], 'readonly');
            const req = tx.objectStore('songs').getAll();
            req.onsuccess = () => resolve(req.result);
        });
    },
    saveSongs: (songs) => {
        if (!Storage.db) return Promise.resolve();
        return new Promise((resolve) => {
            const tx = Storage.db.transaction(['songs'], 'readwrite');
            const store = tx.objectStore('songs');
            store.clear();
            songs.forEach(song => {
                store.add(song);
            });
            tx.oncomplete = () => resolve();
        });
    },
    updateSong: (song) => {
        if (!Storage.db) return;
        const tx = Storage.db.transaction(['songs'], 'readwrite');
        tx.objectStore('songs').put(song);
    },
    saveSettings: () => {
        const data = {
            darkMode: State.darkMode,
            islandMode: State.islandMode,
            islandColor: State.islandColor,
            tapIndicators: State.tapIndicators,
            brightness: State.brightness,
            currentWall: State.currentWall,
            wallpapers: State.wallpapers,
            security: State.security,
            aod: State.aod,
            lsBlur: State.lsBlur,
            glassUI: State.glassUI,
            iconPositions: State.iconPositions,
            punchHole: State.punchHole,
            musicGradient: State.musicGradient,
            notes: State.notes,
            animationSpeed: State.animationSpeed,
            userProfile: State.userProfile,
            appShape: State.appShape,
            appSize: State.appSize,
            iconPack: State.iconPack,
            swipeToClose: State.swipeToClose,
            homescreenBlur: State.homescreenBlur,
            hideAppLabels: State.hideAppLabels,
            phoneName: State.phoneName,
            lockWall: State.lockWall,
            animConfig: State.animConfig,
            ccToggles: State.ccToggles,
            clockConfig: State.clockConfig,
            emptyApps: State.emptyApps
        };
        localStorage.setItem('realos_v3_settings', JSON.stringify(data));
    },
    loadSettings: () => {
        const data = localStorage.getItem('realos_v3_settings');
        if (data) {
            const parsed = JSON.parse(data);

            const defaultWallpapers = [
                'wallpapers/ColorOS/coloros15.jpg',
                'wallpapers/RealOS 3/wallpaper.png',
                'wallpapers/Oneplus/oneplus wallpaper.jpg',
                'wallpapers/Xiaomi/k80 wallpaper.jpg',
                'wallpapers/Xiaomi/k80 wallpaper2.jpg',
                'wallpapers/Xiaomi/k80 wallpaper3.jpg',
                'wallpapers/Xiaomi/k80 wallpaper 4.jpg',
                'wallpapers/Xiaomi/xiaomi 15 wallpaper.jpg',
                'wallpapers/Xiaomi/xiaomi blue.mp4',
                'wallpapers/Xiaomi/xiaomi orange.mp4',
                'wallpapers/Xiaomi/xiaomi purple.mp4',
                'wallpapers/Xiaomi/xiaomi ultra blue.png',
                'wallpapers/Xiaomi/xiaomi ultra green.png',
                'wallpapers/Xiaomi/xiaomi ultra orange.png',
                'wallpapers/Xiaomi/xiaomi ultra purple.png',
                'wallpapers/OriginOS/origin wallpaper dark.png',
                'wallpapers/OriginOS/origin wallpaper.png',
                'wallpapers/OriginOS/origin wallpaper2.png',
                'wallpapers/OriginOS/origin wallpaper3.png',
                'wallpapers/ColorOS/coloros15_1.jpg',
                'wallpapers/ColorOS/coloros15_2.jpg',
                'wallpapers/ColorOS/coloros15_3.jpg',
                'wallpapers/ColorOS/coloros15_4.jpg',
                'wallpapers/ColorOS/coloros15_breeze.jpg',
                'wallpapers/ColorOS/coloros15_breeze2.jpg',
                'wallpapers/ColorOS/coloros15_flower.jpg',
                'wallpapers/ColorOS/coloros15_flower2.jpg',
                'wallpapers/ColorOS/coloros15_flower3.jpg',
                'wallpapers/ColorOS/coloros15_flower4.jpg',
                'https://i.ibb.co/9HGWgS4w/wallpaper3.jpg',
                'https://i.ibb.co/FMtRmsm/wallpaper4.png',
                'https://i.ibb.co/ymJxLsYz/wallpaper5.png',
                'https://i.ibb.co/43v4xw9/wallpaper6.png'
            ];

            if (parsed.wallpapers) {
                let savedUrl = null;
                if (typeof parsed.currentWall === 'number' && parsed.wallpapers.length > 0) {

                    if (parsed.currentWall >= 0 && parsed.currentWall < parsed.wallpapers.length) {
                        savedUrl = parsed.wallpapers[parsed.currentWall];
                    }
                }

                parsed.wallpapers = parsed.wallpapers.filter(w => !defaultWallpapers.includes(w));
                parsed.wallpapers.unshift(...defaultWallpapers);

                if (savedUrl) {
                    if (savedUrl === 'wallpapers/RealOS 3/wallpaper.png') {
                        savedUrl = 'wallpapers/ColorOS/coloros15.jpg';
                    }
                    const newIdx = parsed.wallpapers.indexOf(savedUrl);
                    if (newIdx !== -1) {
                        parsed.currentWall = newIdx;
                    } else {
                        parsed.currentWall = 0;
                    }
                } else {
                    parsed.currentWall = 0;
                }
            }

            if (typeof parsed.lockWall === 'number' && parsed.wallpapers && parsed.wallpapers.length > 0) {
                let savedLockUrl = null;
                if (parsed.lockWall >= 0 && parsed.lockWall < parsed.wallpapers.length) {
                    savedLockUrl = parsed.wallpapers[parsed.lockWall];
                }
                if (savedLockUrl) {
                    if (savedLockUrl === 'wallpapers/RealOS 3/wallpaper.png') {
                        savedLockUrl = 'wallpapers/ColorOS/coloros15.jpg';
                    }
                    const newLockIdx = parsed.wallpapers.indexOf(savedLockUrl);
                    parsed.lockWall = newLockIdx !== -1 ? newLockIdx : parsed.currentWall;
                } else {
                    parsed.lockWall = parsed.currentWall;
                }
            } else if (parsed.wallpapers) {
                parsed.lockWall = parsed.currentWall || 0;
            }

            if (parsed.iconPositions) {
                const firstKey = Object.keys(parsed.iconPositions)[0];
                if (firstKey && parsed.iconPositions[firstKey].left !== undefined) {
                    parsed.iconPositions = {};
                }
            }

            Object.assign(State, parsed);
            if (State.ccToggles) {
                setTimeout(() => {
                    if (State.ccToggles.circles) {
                        document.querySelectorAll('.cc-circle').forEach((el, i) => {
                            if (State.ccToggles.circles[i]) el.classList.add('active');
                            else el.classList.remove('active');
                        });
                    }
                    if (State.ccToggles.tiles) {
                        document.querySelectorAll('.cc-tile[onclick^="ControlCenter.toggleTile"]').forEach((el, i) => {
                            if (State.ccToggles.tiles[i]) el.classList.add('active');
                            else el.classList.remove('active');
                        });
                    }
                }, 10);
            }
            const acDefaults = {
                openIconFade: 0.1, closeIconFade: 1.5, wallBlurDur: 0.12, closeShapeMorph: 0.34, openBezier: [0.2, 0.85, 0.1, 1],
                openScaleBezier: [0.2, 0.85, 0.1, 1], openScaleTime: 0.5, closeBezier: [0.15, 1.01, 0.3, 1.02], openAppZoomOut: 0.98,
                openWallZoom: 1.03, openWallBlur: true, fadeBoxes: false
            };
            if (!State.animConfig) State.animConfig = {};
            Object.keys(acDefaults).forEach(k => { if (State.animConfig[k] === undefined) State.animConfig[k] = acDefaults[k]; });
        }
    }
};
