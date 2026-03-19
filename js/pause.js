let isPaused = false;
let timers = [];

export function registerTimer(id) {
    timers.push(id);
}

export function clearAllTimers() {
    timers.forEach(t => clearTimeout(t));
    timers = [];
}

export function pauseGame() {
    isPaused = true;
    clearAllTimers();
    
    window.currentTimer = null;

    document.body.classList.add("paused");
}

export function resumeGame() {
    isPaused = false;

    document.body.classList.remove("paused");
}

export function getPauseState() {
    return isPaused;
}