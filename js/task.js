import { categories } from "./data.js";
import { Session } from "./state.js";
import { exportToCSV } from "./csv.js";

// ✅ Merge affect responses into this session
const affectData =
  JSON.parse(localStorage.getItem("affect_responses") || "[]");

if (affectData.length) {
  Session.responses.push(...affectData);
}

const loadingScreen = document.getElementById("loading-screen");
const instructionScreen = document.getElementById("instruction-screen");
const storyScreen = document.getElementById("story-screen");
const storyText = document.getElementById("story-text");
const practiceModal = document.getElementById("practice-modal");
const practiceOkBtn = document.getElementById("practice-ok-btn");

const laughModal = document.getElementById("laugh-modal");
const laughChoices = document.querySelectorAll(".laugh-choice");

let trialPaused = false;

const STORY_LINES = [
  "You and other children were building block towers.",
  "One child’s block tower fell down.",
  "The child feels sad."
];

const instructionAudio = new Audio("./assets/audio/task.mp3");

const audioBtn = document.getElementById("play-instruction-audio");

audioBtn.onclick = () => {
  instructionAudio.currentTime = 0;
  instructionAudio.play();
};

function playStorySequence() {
  instructionScreen.classList.add("hidden");
  storyScreen.classList.remove("hidden");

  let index = 0;

  function showNextLine() {
    if (index >= STORY_LINES.length) {
      // pause 2 seconds after last line
      setTimeout(() => {
        storyScreen.classList.add("hidden");
        instructionScreen.classList.remove("hidden");
      }, 2000);
      return;
    }

    storyText.innerHTML += STORY_LINES[index] + "<br><br>";
    index++;

    setTimeout(showNextLine, 2000);
  }

  storyText.innerHTML = "";
  showNextLine();
}

function getAllImagePaths() {
  const gender = Session.gender;
  const paths = [];

  Object.entries(categories).forEach(([cat, arr]) => {
    arr.forEach(item => {
      paths.push(
        `./assets/actions/${cat}/${gender}/${item.img}`
      );
    });
  });

  return paths;
}

function preloadImages(paths, onProgress, onComplete) {
  let loaded = 0;

  paths.forEach(src => {
    const img = new Image();
    img.src = src;

    img.onload = img.onerror = () => {
      loaded++;
      onProgress(Math.round((loaded / paths.length) * 100));

      if (loaded === paths.length) {
        onComplete();
      }
    };
  });
}

const images = getAllImagePaths();

preloadImages(
  images,
  percent => {
    document.getElementById("loading-bar").style.width = percent + "%";
  },
  () => {
    loadingScreen.classList.add("hidden");
    playStorySequence();
  }
);

const imgEl = document.getElementById("action-img");
const wordEl = document.getElementById("action-word");
const card = document.getElementById("card");
const roundText = document.getElementById("round-text");
const breakScreen = document.getElementById("break-screen");
const breakTimerEl = document.getElementById("break-timer");

const WORD_DELAY = 1500;
const STIMULUS_DURATION = 8000;
const BREAK_DURATION = 45;
const BLOCKS = [
  { name: "practice", count: 4, break: 5, message: "Ready...Steady...Go!" },
  { name: "final1", count: 4, break: 5, message: "Take a short break" },
  { name: "final2", count: 4, break: 5, message: "Take a short break" },
  { name: "final3", count: 4, break: 0 }
];

let stimuli = [];
let currentIndex = 0;
let clicked = false;
let stimulusStart = 0;
let timer = null;
let blockIndex = 0;
let trialInBlock = 0;
let breakInterval = null;

const firstChoice = localStorage.getItem("initial_choice");

Session.responses.push({
  sessionId: Session.id,
  participantId: Session.participantId,
  gender: Session.gender,
  category: "initial",
  pd_first: localStorage.getItem("pd_first"),
  pd_second: localStorage.getItem("pd_second"),
  pd_result: localStorage.getItem("pd_result"),
  action: firstChoice,
  blockType: Session.blockType,
  responseTimeMs: null,
  timestamp: Date.now()
});

const params = new URLSearchParams(window.location.search);
const endEarly = params.get("end") === "true";

if (endEarly) {
  finish();
}

function buildStimuli() {

  const ec = categories.ec;
  const pd = categories.pd;
  const ai = categories.ai;
  const pa = categories.pa;

  // random index for practice trials
  const p = Math.floor(Math.random() * 3);

  const practice = shuffle([
    { category: "ec", word: ec[p].word, img: ec[p].img },
    { category: "pd", word: pd[p].word, img: pd[p].img },
    { category: "ai", word: ai[p].word, img: ai[p].img },
    { category: "pa", word: pa[p].word, img: pa[p].img }
  ]);

  const finals = [

    // Cycle 1
    { category: "ec", word: ec[0].word, img: ec[0].img },
    { category: "pd", word: pd[0].word, img: pd[0].img },
    { category: "ai", word: ai[0].word, img: ai[0].img },
    { category: "pa", word: pa[0].word, img: pa[0].img },

    // Cycle 2
    { category: "pd", word: pd[1].word, img: pd[1].img },
    { category: "ai", word: ai[1].word, img: ai[1].img },
    { category: "pa", word: pa[1].word, img: pa[1].img },
    { category: "ec", word: ec[1].word, img: ec[1].img },

    // Cycle 3
    { category: "ai", word: ai[2].word, img: ai[2].img },
    { category: "pa", word: pa[2].word, img: pa[2].img },
    { category: "ec", word: ec[2].word, img: ec[2].img },
    { category: "pd", word: pd[2].word, img: pd[2].img }

  ];

  return [...practice, ...finals];
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

stimuli = buildStimuli();

card.addEventListener("pointerdown", (e) => {
  card.classList.add("card-tap-feedback");

  setTimeout(() => {
    card.classList.remove("card-tap-feedback");
  }, 180);
  if (clicked) return;

  clicked = true;

  const rt = Math.round(performance.now() - stimulusStart);

  const s = stimuli[currentIndex];

  Session.responses.push({
    sessionId: Session.id,
    participantId: Session.participantId,
    gender: Session.gender,
    category: s.category,
    blockType: Session.blockType,
    action: s.word,
    responseTimeMs: rt,
    timestamp: Date.now()
  });

  if (s.category === "pa" && s.word.includes("Laugh")) {
    trialPaused = true;
    clearTimeout(timer);
    showLaughFollowup();
  }

});

function runTrial() {
  if (currentIndex >= stimuli.length) {
    finish();
    return;
  }

  const s = stimuli[currentIndex];

  // round number
  const block = BLOCKS[blockIndex];
  Session.blockType = block.name;
  roundText.innerText =
    block.name === "practice"
      ? "Practice Trial"
      : block.name === "final1"
        ? "Final Trial Set 1"
        : block.name === "final2"
          ? "Final Trial Set 2"
          : "Final Trial Set 3";

  clicked = false;
  wordEl.innerText = "";
  wordEl.style.opacity = 0;

  imgEl.src = `./assets/actions/${s.category}/${Session.gender}/${s.img}`;
  imgEl.classList.remove("hidden");

  stimulusStart = performance.now();

  // show word later
  setTimeout(() => {
    wordEl.innerText = s.word;
    wordEl.style.opacity = 1;
  }, WORD_DELAY);

  // end stimulus
  timer = setTimeout(() => {
    if (trialPaused) return;
    if (!clicked) {
      Session.responses.push({
        sessionId: Session.id,
        participantId: Session.participantId,
        gender: Session.gender,
        category: s.category,
        blockType: Session.blockType,
        action: null,
        responseTimeMs: null,
        timestamp: Date.now()
      });

    }

    currentIndex++;
    trialInBlock++;

    const block = BLOCKS[blockIndex];

    if (trialInBlock >= block.count) {
      blockIndex++;
      trialInBlock = 0;

      if (block.break > 0 && blockIndex < BLOCKS.length) {
        startBreak(block.break);
      } else {
        runTrial();
      }
    } else {
      runTrial();
    }


  }, STIMULUS_DURATION);
}

function startBreak(seconds) {
  clearInterval(breakInterval);

  card.classList.add("hidden");
  breakScreen.classList.remove("hidden");
  roundText.classList.add("hidden");

  let remaining = seconds;
  breakTimerEl.innerText = remaining;

  breakScreen.querySelector("div").innerText =
    BLOCKS[blockIndex - 1]
      ?.message
    || "";

  breakInterval = setInterval(() => {
    remaining--;
    breakTimerEl.innerText = remaining;

    if (remaining <= 0) {
      clearInterval(breakInterval);

      breakScreen.classList.add("hidden");
      card.classList.remove("hidden");
      roundText.classList.remove("hidden");

      runTrial();
    }
  }, 1000);
}

function finish() {
  clearTimeout(timer);

  localStorage.setItem(
    "study_sessions",
    JSON.stringify(Session.responses)
  );
  localStorage.setItem("study_status", "completed");

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
    clearSession();
  };
}

function clearSession() {
  localStorage.removeItem("participant_id");
  localStorage.removeItem("participant_gender");
  localStorage.removeItem("initial_choice");
  localStorage.removeItem("study_sessions");
  localStorage.removeItem("affect_responses");
}

function showLaughFollowup() {

  laughModal.classList.remove("hidden");

  laughChoices.forEach(btn => {

    btn.onclick = () => {

      const reason = btn.innerText;

      Session.responses.push({
        sessionId: Session.id,
        participantId: Session.participantId,
        gender: Session.gender,
        stage: "5_followup",
        eventType: "laugh_reason",
        value: reason,
        timestamp: Date.now()
      });

      laughModal.classList.add("hidden");

      trialPaused = false;
      // advance trial exactly like timeout does
      currentIndex++;
      trialInBlock++;

      const block = BLOCKS[blockIndex];

      if (trialInBlock >= block.count) {
        blockIndex++;
        trialInBlock = 0;

        if (block.break > 0 && blockIndex < BLOCKS.length) {
          startBreak(block.break);
        } else {
          runTrial();
        }
      } else {
        runTrial();
      }
    };

  });

}

if (!endEarly) {
  const startBtn = document.getElementById("start-btn");
  const instructionScreen = document.getElementById("instruction-screen");

  startBtn.onclick = () => {
    instructionAudio.pause();
    instructionAudio.currentTime = 0;
    instructionScreen.classList.add("hidden");

    // show practice info modal
    practiceModal.classList.remove("hidden");
  };

  practiceOkBtn.onclick = () => {
    practiceModal.classList.add("hidden");

    card.classList.remove("hidden");
    roundText.classList.remove("hidden");

    runTrial();
  };
}