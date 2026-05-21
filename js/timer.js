const Timer = {
    running: false, interval: null, finished: false,
    interruptedMusic: false,
    time: 300,
    ringtone: new Audio('https://dl.dropboxusercontent.com/scl/fi/j9qld9u2xcl0mihv2kuk1/ringtone-024-376907.mp3?rlkey=1tosgk2oyw73eqzczl8yoh1pz&st=pc8cfmrk'),
    init: () => {
        Timer.ringtone.loop = true;
        Timer.ringtone = new Audio('https://dl.dropboxusercontent.com/scl/fi/j9qld9u2xcl0mihv2kuk1/ringtone-024-376907.mp3?rlkey=1tosgk2oyw73eqzczl8yoh1pz&st=pc8cfmrk');
        Timer.ringtone.loop = true;

    },
    toggle: () => {
        if (Timer.running) Timer.stop(true); else Timer.start();
    },
    start: () => {
        if (Timer.running) return;
        let seconds = Timer.time;
        if (Timer.finished) {
            Timer.finished = false;
            Timer.time = 300;
            seconds = 300;
        }
        if (seconds <= 0 && !Timer.finished) seconds = 300;
        Timer.running = true;
        Timer.finished = false;
        Timer.paused = false;
        Island.update();
        Timer.interval = setInterval(() => {
            seconds--;
            Timer.time = seconds;
            if (seconds < 0) {
                if (!Timer.finished) {
                    Timer.finished = true;
                    if (Music.active && !Music.audio.paused) {
                        Music.audio.pause();
                        Timer.interruptedMusic = true;
                    }
                    Timer.ringtone.loop = true;
                    Timer.ringtone.currentTime = 0;
                    Timer.ringtone.play()
                    Island.update();
                    Island.expand('timerDone');
                }
                Timer.updateUI();
            } else {
                Timer.updateUI();
            }
        }, 1000);
    },
    stop: (pause) => {
        clearInterval(Timer.interval);
        Timer.running = false;
        if (!pause) {
            Timer.paused = false;
            Timer.finished = false;
            Timer.ringtone.pause();
            Timer.ringtone.currentTime = 0;
            Timer.time = 300;
            Timer.updateUI();
            let didCollapse = false;
            if (Island.expanded === 'timer' || Island.expanded === 'timerDone') {
                Island.collapse();
                didCollapse = true;
            }
            if (Timer.interruptedMusic) {
                Music.toggle();
                Timer.interruptedMusic = false;
            }
            if (!didCollapse) Island.update();
        } else {
            Timer.paused = true;
            Island.update();
        }
    },
    setCustom: (mins) => {
        Timer.time = mins * 60;
        Timer.finished = false;
        Timer.updateUI();
    },
    updateUI: () => {
        let absTime = Math.abs(Timer.time);
        const m = Math.floor(absTime / 60);
        const s = absTime % 60;
        let txt = `${m}:${s.toString().padStart(2, '0')}`;
        if (Timer.time < 0) txt = txt + "+";
        if (document.getElementById('di-timer-val')) document.getElementById('di-timer-val').innerText = txt;
        if (document.getElementById('di-timer-mini-val')) document.getElementById('di-timer-mini-val').innerText = txt;
        if (document.getElementById('timer-sec-display')) document.getElementById('timer-sec-display').innerText = txt;
        if (document.getElementById('timer-sec-mini-display')) document.getElementById('timer-sec-mini-display').innerText = txt;
        if (document.getElementById('stopwatch-val')) document.getElementById('stopwatch-val').innerText = txt;
        if (Timer.finished && document.querySelector('#view-timer-done span')) {
            document.querySelector('#view-timer-done span').innerText = txt;
        }
    }
};
