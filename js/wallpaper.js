function isVideoWallpaper(url) {
    return url && url.endsWith('.mp4');
}
const VideoWallpaper = {
    videoEl: null,
    isPlaying: false,
    isReversing: false,
    animFrameId: null,
    lastFrameTime: 0,
    currentSrc: '',
    init: () => {
        if (VideoWallpaper.videoEl) return;
        const video = document.createElement('video');
        video.id = 'wallpaper-video';
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        const wallLayer = document.getElementById('wallpaper-layer');
        if (wallLayer) wallLayer.appendChild(video);
        VideoWallpaper.videoEl = video;
        video.addEventListener('ended', () => {
            VideoWallpaper.isPlaying = false;
        });
    },
    load: (src) => {
        VideoWallpaper.init();
        const video = VideoWallpaper.videoEl;
        if (!video) return;

        const setEndState = () => {
            if (!State.specialEffects && video.duration) {
                video.currentTime = video.duration;
                video.pause();
            } else if (!State.specialEffects) {
                video.currentTime = 0;
                video.pause();
            }
        };

        if (VideoWallpaper.currentSrc !== src) {
            VideoWallpaper.cancelAll();
            video.src = src;
            video.currentTime = 0;
            video.load();
            VideoWallpaper.currentSrc = src;
            video.onloadedmetadata = setEndState;
        } else {
            setEndState();
        }
    },
    getThumbnail: (callback) => {
        const video = VideoWallpaper.videoEl;
        if (!video) return;
        const capture = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || 1920;
                canvas.height = video.videoHeight || 1080;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                callback(canvas.toDataURL('image/jpeg', 0.8));
            } catch (e) {
            }
        };

        if (video.seeking) {
            video.addEventListener('seeked', capture, { once: true });
        } else if (video.readyState >= 2) {
            capture();
        } else {
            video.addEventListener('loadeddata', capture, { once: true });
        }
    },
    show: () => {
        VideoWallpaper.init();
        const video = VideoWallpaper.videoEl;
        if (video) video.style.display = 'block';
    },
    hide: () => {
        if (VideoWallpaper.videoEl) {
            VideoWallpaper.videoEl.style.display = 'none';
            VideoWallpaper.cancelAll();
        }
    },
    cancelAll: () => {
        const video = VideoWallpaper.videoEl;
        if (video && !video.paused) video.pause();
        if (video) video.onseeked = null;
        if (VideoWallpaper.animFrameId) {
            cancelAnimationFrame(VideoWallpaper.animFrameId);
            VideoWallpaper.animFrameId = null;
        }
        VideoWallpaper.isPlaying = false;
        VideoWallpaper.isReversing = false;
    },
    playForward: () => {
        const homeVideo = VideoWallpaper.videoEl;
        const lockLayer = document.getElementById('lock-wallpaper-layer');
        let lockVideo = null;
        if (lockLayer) lockVideo = lockLayer.querySelector('video');

        if ((!homeVideo || !homeVideo.src) && (!lockVideo || !lockVideo.src)) return;
        VideoWallpaper.cancelAll();
        if (!State.specialEffects) {
            if (homeVideo && homeVideo.duration) homeVideo.currentTime = homeVideo.duration;
            if (homeVideo) homeVideo.pause();
            if (lockVideo && lockVideo.duration) lockVideo.currentTime = lockVideo.duration;
            if (lockVideo) lockVideo.pause();
            return;
        }
        VideoWallpaper.isPlaying = true;
        if (homeVideo) homeVideo.play().catch(e => { });
        if (lockVideo) lockVideo.play().catch(e => { });
        const checkEnd = () => {
            if (!VideoWallpaper.isPlaying) return;
            let ended = true;
            if (homeVideo && !(homeVideo.ended || homeVideo.currentTime >= homeVideo.duration)) ended = false;
            if (lockVideo && !(lockVideo.ended || lockVideo.currentTime >= lockVideo.duration)) ended = false;

            if (ended) {
                VideoWallpaper.isPlaying = false;
            } else {
                VideoWallpaper.animFrameId = requestAnimationFrame(checkEnd);
            }
        };
        VideoWallpaper.animFrameId = requestAnimationFrame(checkEnd);
    },
    reverseToStart: () => {
        const homeVideo = VideoWallpaper.videoEl;
        const lockLayer = document.getElementById('lock-wallpaper-layer');
        let lockVideo = null;
        if (lockLayer) lockVideo = lockLayer.querySelector('video');

        if ((!homeVideo || !homeVideo.src) && (!lockVideo || !lockVideo.src)) return;
        VideoWallpaper.cancelAll();
        if (!State.specialEffects) {
            if (homeVideo && homeVideo.duration) homeVideo.currentTime = homeVideo.duration;
            if (homeVideo) homeVideo.pause();
            if (lockVideo && lockVideo.duration) lockVideo.currentTime = lockVideo.duration;
            if (lockVideo) lockVideo.pause();
            return;
        }
        if (homeVideo && homeVideo.currentTime <= 0 && lockVideo && lockVideo.currentTime <= 0) {
            if (homeVideo) homeVideo.currentTime = 0;
            if (lockVideo) lockVideo.currentTime = 0;
            return;
        }
        VideoWallpaper.isReversing = true;
        let seekStart = performance.now();
        const stepBack = () => {
            if (!VideoWallpaper.isReversing) return;
            const now = performance.now();
            const delta = (now - seekStart) / 1000;
            seekStart = now;
            let finished = true;

            const calcNewTime = (vid) => {
                if (!vid) return 0;
                const newTime = vid.currentTime - Math.max(delta, 1 / 30);
                if (newTime <= 0) {
                    vid.currentTime = 0;
                    return 0;
                }
                vid.currentTime = newTime;
                finished = false;
                return newTime;
            };

            calcNewTime(homeVideo);
            calcNewTime(lockVideo);

            if (finished) {
                VideoWallpaper.isReversing = false;
                return;
            }
        };
        if (homeVideo) {
            homeVideo.onseeked = () => {
                if (!VideoWallpaper.isReversing) {
                    homeVideo.onseeked = null;
                    if (lockVideo) lockVideo.onseeked = null;
                    return;
                }
                VideoWallpaper.animFrameId = requestAnimationFrame(stepBack);
            };
        } else if (lockVideo) {
            lockVideo.onseeked = () => {
                if (!VideoWallpaper.isReversing) {
                    lockVideo.onseeked = null;
                    return;
                }
                VideoWallpaper.animFrameId = requestAnimationFrame(stepBack);
            };
        }
        VideoWallpaper.animFrameId = requestAnimationFrame(stepBack);
    },
    reset: () => {
        const video = VideoWallpaper.videoEl;
        if (!video) return;
        VideoWallpaper.cancelAll();
        video.currentTime = 0;
    }
};
