import { Session } from "./state.js";

document.addEventListener("DOMContentLoaded", () => {

    let recordingStarted = false;
    let stageFinished = false;
    let recordingStopHandler = null;
    let recordingSaveHandler = null;

    let stageTimers = [];

    const promptEl = document.getElementById("affect-prompt");
    const inputEl = document.getElementById("affect-input");
    const promptAudio = new Audio("./assets/audio/affect2a.mp3");
    const retryAudio = new Audio("./assets/audio/affect2a.mp3");
    const stage2BAudio = new Audio("./assets/audio/affect2b.mp3");
    const stage2BRetryAudio = new Audio("./assets/audio/affect2b.mp3");
    const stage2CAudio = new Audio("./assets/audio/affect2c.mp3");
    const stage2CRetryAudio = new Audio("./assets/audio/affect2c.mp3");
    const stage3Audio = new Audio("./assets/audio/stage3.mp3");
    const stage3PromptAudio = new Audio("./assets/audio/stage3.mp3");
    const stage4Audio = new Audio("./assets/audio/stage4.mp3");
    const stage4Audio_1 = new Audio("./assets/audio/stage4_1.mp3");


    const hearAgainBtn = document.getElementById("affect-audio-btn");

    let currentInstructionAudio = promptAudio;

    hearAgainBtn.onclick = () => {
        if (!currentInstructionAudio) return;
        currentInstructionAudio.pause();
        currentInstructionAudio.currentTime = 0;
        currentInstructionAudio.play().catch(() => { });
    };

    function stageTimeout(fn, delay) {
        const id = setTimeout(fn, delay);
        stageTimers.push(id);
        return id;
    }

    function clearStageTimers() {
        stageTimers.forEach(clearTimeout);
        stageTimers = [];
    }

    const STAGES = {
        STEP_2A: "2A",
        STEP_2B: "2B",
        STEP_2C: "2C",
        STEP_3: "3",
        STEP_4: "4"
    };

    let currentStage = STAGES.STEP_2A;

    startStage(currentStage);

    // ------------------------

    function startStage(stage) {

        console.log("Affect Stage:", stage);
        clearStageTimers();
        stageFinished = false;

        switch (stage) {

            case STAGES.STEP_2A:
                start2A();
                break;

            case STAGES.STEP_2B:
                start2B();
                break;

            case STAGES.STEP_2C:
                start2C();
                break;

            case STAGES.STEP_3:
                start3();
                break;

            case STAGES.STEP_4:
                start4();
                break;
        }
    }

    function start2A() {

        recordingStarted = false;

        promptEl.innerHTML =
            "How is this child feeling?";

        currentInstructionAudio = promptAudio;
        promptAudio.currentTime = 0;
        promptAudio.play().catch(() => { });

        setupRecording();

        recordingStopHandler = () => {
            finishStage(STAGES.STEP_3, saveStage2AData);
        };

        const stageStart = performance.now();

        // ---- 10s retry ----
        stageTimeout(() => {

            if (recordingStarted) return;

            promptEl.innerHTML =
                "Let’s try once more.<br>How is this child feeling?";

            retryAudio.currentTime = 0;
            retryAudio.play().catch(() => { });

        }, 10000);


        // ---- 20s advance ----
        stageTimeout(() => {

            saveStage2AData();

            startStage(STAGES.STEP_2B);

        }, 20000);
    }

    function start2B() {

        promptEl.innerHTML =
            "Can you show how the child is feeling?";

        const controls = document.getElementById("affect-input");

        controls.innerHTML = `
        <div id="emoji-options"
            class="flex justify-center gap-10 text-6xl cursor-pointer select-none">

            <div class="affect-choice" data-score="1">&#128546</div>
            <div class="affect-choice" data-score="0">&#128529</div>
            <div class="affect-choice" data-score="0">&#128522</div>

        </div>

        <div id="emoji-status" class="text-slate-500 text-sm"></div>
    `;

        currentInstructionAudio = stage2BAudio;
        stage2BAudio.currentTime = 0;
        stage2BAudio.play().catch(() => { });

        const status = document.getElementById("emoji-status");
        const options = controls.querySelectorAll("#emoji-options div");

        let responded = false;

        options.forEach(btn => {

            btn.onclick = () => {

                if (responded) return;

                const score = btn.dataset.score;

                // visual tap feedback
                btn.style.transform = "scale(1.25)";
                btn.style.transition = "0.2s";

                // ✅ CORRECT
                if (score === "1") {

                    responded = true;

                    options.forEach(o => o.classList.remove("affect-choice-selected"));
                    btn.classList.add("affect-choice-selected");

                    stageTimeout(() => {
                        finishStage(
                            STAGES.STEP_3,
                            () => saveStage2BData(1)
                        );
                    }, 150);

                    return;
                }

                // ❌ WRONG → allow retry
                status.innerText = "Let’s try again.";

                stageTimeout(() => {
                    options.forEach(o => o.classList.remove("affect-choice-selected"));
                    btn.classList.add("affect-choice-selected");
                }, 300);
            };
        });

        // retry reminder
        stageTimeout(() => {

            if (responded) return;

            status.innerText = "Let’s try once more.";

            stage2BRetryAudio.currentTime = 0;
            stage2BRetryAudio.play().catch(() => { });

        }, 10000);

        // auto advance
        stageTimeout(() => {

            if (!responded) {
                saveStage2BData(0, true);
                startStage(STAGES.STEP_2C);
            }

        }, 20000);
    }

    function start2C() {

        promptEl.innerHTML =
            "Which one shows how the child is feeling?";

        const controls = document.getElementById("affect-input");

        controls.innerHTML = `
        <div id="emoji-word-options"
            class="flex justify-center gap-8 text-center select-none">

            <div class="cursor-pointer option affect-choice" data-score="2">
                <div class="text-6xl">&#128546</div>
                <div class="text-lg mt-2">Sad</div>
            </div>

            <div class="cursor-pointer option affect-choice" data-score="0">
                <div class="text-6xl">&#128529</div>
                <div class="text-lg mt-2">Okay</div>
            </div>

            <div class="cursor-pointer option affect-choice" data-score="0">
                <div class="text-6xl">&#128522</div>
                <div class="text-lg mt-2">Happy</div>
            </div>

        </div>

        <div id="emoji-word-status"
            class="text-slate-500 text-sm mt-3"></div>
    `;

        currentInstructionAudio = stage2CAudio;
        stage2CAudio.currentTime = 0;
        stage2CAudio.play().catch(() => { });

        const status = document.getElementById("emoji-word-status");
        const options =
            controls.querySelectorAll(".option");

        let responded = false;

        // ---------- CLICK ----------
        options.forEach(opt => {

            opt.onclick = () => {

                if (responded) return;
                responded = true;

                const score = opt.dataset.score;

                options.forEach(o => o.classList.remove("affect-choice-selected"));
                opt.classList.add("affect-choice-selected");

                stageTimeout(() => {

                    saveStage2CData(score);

                    document
                        .getElementById("affect-container")
                        .classList.add("fade-out");

                    startStage(STAGES.STEP_3);

                }, 150);
            };
        });

        // ---------- RETRY @10s ----------
        stageTimeout(() => {

            if (responded) return;

            status.innerText = "Let’s try once more.";

            stage2CRetryAudio.currentTime = 0;
            stage2CRetryAudio.play().catch(() => { });

        }, 10000);

        // ---------- AUTO ADVANCE @20s ----------
        stageTimeout(() => {

            if (!responded) {
                saveStage2CData("no_response");
                startStage(STAGES.STEP_3);
            }

        }, 20000);
    }

    function start3() {

        recordingStarted = false;

        promptEl.innerHTML =
            "How do you know the child feels like that?";

        const controls = document.getElementById("affect-input");

        controls.innerHTML = `
        <button id="record-btn"
            class="bg-[#FF9EC7] text-white px-8 py-3 rounded-full font-semibold">
            🔴 Start Recording
        </button>

        <button id="stop-btn"
            class="bg-slate-400 text-white px-8 py-3 rounded-full font-semibold hidden">
            ⏹ Stop Recording
        </button>

        <div id="record-status"
            class="text-slate-500 text-sm"></div>
    `;

        setupRecording();

        recordingStopHandler = () => {
            finishStage(STAGES.STEP_4, () =>
                saveStage3Data(recordingStarted)
            );
        };

        currentInstructionAudio = stage3Audio;
        stage3Audio.currentTime = 0;
        stage3Audio.play().catch(() => { });

        // ✅ timers stored so we can cancel them
        const retryTimer = stageTimeout(() => {

            if (recordingStarted) return;

            promptEl.innerHTML =
                "You can tell me anything you think.";

            stage3PromptAudio.currentTime = 0;
            stage3PromptAudio.play().catch(() => { });

        }, 10000);


        const finishTimer = stageTimeout(() => {

            finishStage(STAGES.STEP_4, () =>
                saveStage3Data(recordingStarted)
            );
        }, 20000);


        // ✅ STOP timers if child actually records
        const recordBtn = document.getElementById("record-btn");

        recordBtn.addEventListener("click", () => {
            recordingStarted = true;
            clearTimeout(retryTimer);
            clearTimeout(finishTimer);
        });
    }

    function start4() {

        promptEl.innerHTML =
            "How did you feel for the child?";

        currentInstructionAudio = stage4Audio;
        stage4Audio.currentTime = 0;
        stage4Audio.play().catch(() => { });

        const controls = document.getElementById("affect-input");

        controls.innerHTML = `
        <div id="emotion-options"
            class="flex flex-wrap justify-center gap-6 text-center">

            <div class="emotion option affect-choice" data-value="happy">
                <div class="text-6xl">😊</div>
                <div>Happy</div>
            </div>

            <div class="emotion option affect-choice" data-value="sad">
                <div class="text-6xl">😢</div>
                <div>Sad</div>
            </div>

            <div class="emotion option affect-choice" data-value="afraid">
                <div class="text-6xl">😨</div>
                <div>Afraid</div>
            </div>

            <div class="emotion option affect-choice" data-value="none">
                <div class="text-6xl">😐</div>
                <div>Did not feel anything</div>
            </div>

        </div>

        <div id="resonance-status"
            class="text-slate-500 text-sm mt-3"></div>
    `;

        const options = controls.querySelectorAll(".emotion");

        options.forEach(opt => {

            opt.onclick = () => {

                const emotion = opt.dataset.value;

                options.forEach(o => o.classList.remove("affect-choice-selected"));
                opt.classList.add("affect-choice-selected");

                stageTimeout(() => {

                    saveStage4Emotion(emotion);

                    if (emotion === "none") {
                        finishAffectStage();
                        return;
                    }

                    showIntensityScale();

                }, 150);
            };
        });
    }


    function showIntensityScale() {

        promptEl.innerHTML =
            "How much did you feel?";

        currentInstructionAudio = stage4Audio_1;
        stage4Audio_1.currentTime = 0;
        stage4Audio_1.play().catch(() => { });

        const controls = document.getElementById("affect-input");

        controls.innerHTML = `
        <div id="intensity-options"
            class="flex justify-center gap-8 text-center">

            <div class="intensity option affect-choice" data-value="not_much">
                <div class="text-5xl">🙂</div>
                <div>Not much</div>
            </div>

            <div class="intensity option affect-choice" data-value="a_little">
                <div class="text-5xl">😟</div>
                <div>A little</div>
            </div>

            <div class="intensity option affect-choice" data-value="a_lot">
                <div class="text-5xl">😭</div>
                <div>A lot</div>
            </div>

        </div>
    `;

        const options = controls.querySelectorAll(".intensity");

        options.forEach(opt => {

            opt.onclick = () => {

                const value = opt.dataset.value;
                options.forEach(o => o.classList.remove("affect-choice-selected"));
                opt.classList.add("affect-choice-selected");

                saveStage4Intensity(value);

                finishAffectStage();
            };
        });
    }

    let mediaRecorder;
    let audioChunks = [];
    let audioBlob = null;

    function setupRecording() {

        const recordBtn = document.getElementById("record-btn");
        const stopBtn = document.getElementById("stop-btn");
        const status = document.getElementById("record-status");

        recordBtn.onclick = async () => {

            // create recorder fresh if needed
            if (!mediaRecorder || mediaRecorder.state === "inactive") {

                const stream =
                    await navigator.mediaDevices.getUserMedia({ audio: true });

                mediaRecorder = new MediaRecorder(stream);

                mediaRecorder.ondataavailable = e => {
                    audioChunks.push(e.data);
                };

                mediaRecorder.onstop = () => {
                    audioBlob = new Blob(audioChunks, { type: "audio/webm" });

                    status.innerText = "Recording saved ✓";

                    // restore buttons safely
                    stopBtn.classList.add("hidden");
                    recordBtn.classList.remove("hidden");
                };
            }

            recordingStarted = true;
            audioChunks = [];

            mediaRecorder.start();

            recordBtn.classList.add("hidden");
            stopBtn.classList.remove("hidden");

            status.innerText = "Recording...";
        };

        stopBtn.onclick = () => {

            if (mediaRecorder && mediaRecorder.state === "recording") {
                mediaRecorder.stop();
            }

            if (recordingStopHandler) {
                recordingStopHandler();
            }
        };
    }


    function showThankYouAndContinue() {

        promptEl.innerHTML =
            "Thank you! Let's continue.";

        stageTimeout(() => {
            startStage(STAGES.STEP_2B);
        }, 2000);
    }

    function saveStage2AData() {

        let fileName = "";

        if (audioBlob) {

            fileName =
                `${Session.id}_stage2a.webm`;

            const url = URL.createObjectURL(audioBlob);

            // temporary local download (dev version)
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            a.click();
        }

        Session.responses.push({
            sessionId: Session.id,
            participantId: Session.participantId,
            gender: Session.gender,

            stage: "2A",
            eventType: "verbal_response",

            action: "audio_recorded",
            value: recordingStarted ? "speech_detected" : "no_response",

            timestamp: Date.now()
        });
    }

    function saveStage2BData(score, noResponse = false) {

        Session.responses.push({
            sessionId: Session.id,
            participantId: Session.participantId,
            gender: Session.gender,

            stage: "2B",
            eventType: "emoji_selection",

            action: "emoji_choice",
            value: noResponse ? "no_response" : score,

            timestamp: Date.now()
        });
    }

    function saveStage2CData(value) {

        Session.responses.push({
            sessionId: Session.id,
            participantId: Session.participantId,
            gender: Session.gender,

            stage: "2C",
            eventType: "emoji_word_selection",

            action: "choice",
            value: value,

            timestamp: Date.now()
        });
    }

    function saveStage3Data(recordingStarted) {

        Session.responses.push({
            sessionId: Session.id,
            participantId: Session.participantId,
            gender: Session.gender,

            stage: "3",
            eventType: "affect_decoding",

            action: "audio_record_attempt",
            value: recordingStarted ? "recorded" : "no_recording",

            timestamp: Date.now()
        });
    }

    function saveStage4Emotion(value) {

        Session.responses.push({
            sessionId: Session.id,
            participantId: Session.participantId,
            gender: Session.gender,

            stage: "4",
            eventType: "affect_resonance_emotion",
            action: "emotion_selected",
            value: value,

            timestamp: Date.now()
        });
    }


    function saveStage4Intensity(value) {

        Session.responses.push({
            sessionId: Session.id,
            participantId: Session.participantId,
            gender: Session.gender,

            stage: "4",
            eventType: "affect_resonance_intensity",
            action: "intensity_selected",
            value: value,

            timestamp: Date.now()
        });
    }

    function finishAffectStage() {

        promptEl.innerHTML = "Thank you!";

        localStorage.setItem(
            "affect_responses",
            JSON.stringify(Session.responses)
        );

        setTimeout(() => {

            localStorage.setItem("affect_completed", "true");
            location.href = "task.html";

        }, 1500);
    }

    function finishStage(nextStage, saveFn) {

        if (stageFinished) return;
        stageFinished = true;

        saveFn();

        document
            .getElementById("affect-container")
            .classList.add("fade-out");

        stageTimeout(() => {
            startStage(nextStage);
        }, 400);
    }

});