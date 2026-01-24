import { categories } from "./data.js";
import { Session } from "./state.js";
import { exportToCSV } from "./csv.js";

/* -------------------------
   DOM
-------------------------- */
const imgEl = document.getElementById("action-img");
const wordEl = document.getElementById("action-word");
const card = document.getElementById("card");
const roundText = document.getElementById("round-text");
const breakScreen = document.getElementById("break-screen");
const breakTimerEl = document.getElementById("break-timer");

/* -------------------------
   CONSTANTS
-------------------------- */
const WORD_DELAY = 1500;
const STIMULUS_DURATION = 4000;
const BREAK_DURATION = 45;

/* -------------------------
   STATE
-------------------------- */
let stimuli = [];
let currentIndex = 0;
let clicked = false;
let stimulusStart = 0;
let timer = null;

/* -------------------------
   INITIAL CHOICE
-------------------------- */
const firstChoice = localStorage.getItem("initial_choice");

Session.responses.push({
  sessionId: Session.id,
  round: 0,
  category: "initial",
  action: firstChoice,
  responseTimeMs: null,
  timestamp: Date.now()
});

const params = new URLSearchParams(window.location.search);
const endEarly = params.get("end") === "true";

if (endEarly) {
  finish();
}


/* -------------------------
   BUILD ALL STIMULI (9 total)
-------------------------- */
function buildStimuli() {
  const list = [];

  Object.entries(categories).forEach(([cat, arr]) => {
    arr.forEach(item => {
      list.push({
        category: cat,
        word: item.word,
        img: item.img
      });
    });
  });

  return shuffle(list);
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

stimuli = buildStimuli();

/* -------------------------
   INPUT (tap + click)
-------------------------- */
card.addEventListener("pointerdown", () => {
  if (clicked) return;

  clicked = true;

  const rt = Math.round(performance.now() - stimulusStart);

  const s = stimuli[currentIndex];

  Session.responses.push({
    sessionId: Session.id,
    round: Session.round,
    category: s.category,
    action: s.word,
    responseTimeMs: rt,
    timestamp: Date.now()
  });
});

/* -------------------------
   TRIAL ENGINE
-------------------------- */
function runTrial() {
  if (currentIndex >= stimuli.length) {
    finish();
    return;
  }

  const s = stimuli[currentIndex];

  // round number
  Session.round = Math.floor(currentIndex / 3) + 1;
  roundText.innerText = `Round ${Session.round}`;

  clicked = false;
  wordEl.innerText = "";
  wordEl.style.opacity = 0;

  imgEl.src = `./assets/actions/${s.img}`;
  imgEl.classList.remove("hidden");

  stimulusStart = performance.now();

  // show word later
  setTimeout(() => {
    wordEl.innerText = s.word;
    wordEl.style.opacity = 1;
  }, WORD_DELAY);

  // end stimulus
  timer = setTimeout(() => {
    if (!clicked) {
      Session.responses.push({
        sessionId: Session.id,
        round: Session.round,
        category: s.category,
        action: null,
        responseTimeMs: null,
        timestamp: Date.now()
      });
    }

    currentIndex++;

    // break after every 3 trials
    if (currentIndex % 3 === 0 && currentIndex < stimuli.length) {
      startBreak();
    } else {
      runTrial();
    }

  }, STIMULUS_DURATION);
}

/* -------------------------
   BREAK
-------------------------- */
function startBreak() {
  card.classList.add("hidden");
breakScreen.classList.remove("hidden");
roundText.classList.add("hidden");


let remaining = 45;
breakTimerEl.innerText = remaining;

const interval = setInterval(() => {
  remaining--;
  breakTimerEl.innerText = remaining;

  if (remaining <= 0) {
    clearInterval(interval);

    breakScreen.classList.add("hidden");
    card.classList.remove("hidden");

    runTrial();
  }
}, 1000);

}

/* -------------------------
   FINISH
-------------------------- */
function finish() {
  clearTimeout(timer);

  localStorage.setItem(
    "study_sessions",
    JSON.stringify(Session.responses)
  );

  const game = document.getElementById("game");

  game.innerHTML = `
    <div class="flex flex-col items-center justify-center space-y-8 py-20">

      <div class="text-3xl font-semibold text-slate-700">
        Thank you for playing 🌈
      </div>

      <div class="text-slate-500 text-lg text-center max-w-sm">
        You did a great job.  
        Your answers have been saved.
      </div>

      <button
        id="export-btn"
        class="bg-[#6EC1FF] text-white px-8 py-3 rounded-full
               text-lg font-semibold shadow-md
               active:scale-95 transition">
        Download results
      </button>

    </div>
  `;

  document.getElementById("export-btn").onclick = () => {
    exportToCSV(Session.responses, Session.id);
  };
}


/* -------------------------
   START
-------------------------- */
if (!endEarly) {
  const startBtn = document.getElementById("start-btn");
  const instructionScreen = document.getElementById("instruction-screen");

  startBtn.onclick = () => {
    instructionScreen.classList.add("hidden");
    card.classList.remove("hidden");
    roundText.classList.remove("hidden");

    runTrial();
  };
}

