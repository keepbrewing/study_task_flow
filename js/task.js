import { categories } from "./data.js";
import { Session } from "./state.js";
import { exportToCSV } from "./csv.js";

const loadingScreen = document.getElementById("loading-screen");
const instructionScreen = document.getElementById("instruction-screen");
const storyScreen = document.getElementById("story-screen");
const storyText = document.getElementById("story-text");
const practiceModal = document.getElementById("practice-modal");
const practiceOkBtn = document.getElementById("practice-ok-btn");

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

    setTimeout(showNextLine, 1800);
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
const STIMULUS_DURATION = 4000;
const BREAK_DURATION = 45;
const BLOCKS = [
  { name: "practice", count: 3, break: 5 },
  { name: "final1", count: 3, break: 10 },
  { name: "final2", count: 3, break: 10 },
  { name: "final3", count: 3, break: 0 }
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
  const help = shuffle([...categories.help]);
  const avoid = shuffle([...categories.avoid]);
  const distress = shuffle([...categories.distress]);

  // PRACTICE: 1 from each
  const practice = shuffle([
    { category: "help", word: help[0].word, img: help[0].img },
    { category: "avoid", word: avoid[0].word, img: avoid[0].img },
    { category: "distress", word: distress[0].word, img: distress[0].img }
  ]);

  // FINAL: all 9 (including those used in practice)
  const finals = [];

  for (let i = 0; i < 3; i++) {
    finals.push(
      ...shuffle([
        { category: "help", word: help[i].word, img: help[i].img },
        { category: "avoid", word: avoid[i].word, img: avoid[i].img },
        { category: "distress", word: distress[i].word, img: distress[i].img }
      ])
    );
  }

  return [...practice, ...finals];
}


function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

stimuli = buildStimuli();

card.addEventListener("pointerdown", () => {
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
    seconds === 5
      ? "Ready… Steady… Go!"
      : "Take a short break";

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