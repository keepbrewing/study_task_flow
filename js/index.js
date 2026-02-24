document.addEventListener("DOMContentLoaded", () => {

    const helpModal = document.getElementById("help-modal");
    const helpCard = document.getElementById("help-card");
    const closeHelpBtn = document.getElementById("help-close-btn");
    const playHelpAudioBtn = document.getElementById("help-audio-btn");
    const helpModalImage = document.getElementById("help-modal-image");

    const helpAudio = new Audio("./assets/audio/description1.mp3");
    const page = document.getElementById("page");

    let identifyAttempts = 0;
    let identifyHintsShown = 0;

    document.querySelectorAll(".choice-card").forEach(tile => {
        tile.onclick = () => {

            if (imageGrid.classList.contains("disabled-grid")) return;

            const choice = tile.dataset.choice;
            const isTarget = tile.dataset.target;

            // ---------- CORRECT ----------
            if (isTarget) {

                localStorage.setItem("initial_choice", choice);
                localStorage.setItem("pd_completed", "true");
                localStorage.setItem("pd_identify_attempts", identifyAttempts + 1);
                localStorage.setItem("pd_identify_hints", identifyHintsShown);

                zoomToCenter(tile, () => {

                    localStorage.setItem("pd_image_result", "target");

                    location.href = "task.html";

                });

                return;
            }

            // ---------- WRONG SELECTION ----------
            identifyAttempts++;

            blinkTargetHint();
            identifyHintsShown++;

            // FIRST WRONG
            if (identifyAttempts === 1) {
                instructionText.innerHTML =
                    "� Try again.<br>Touch the picture with the problem.";
                return;
            }

            // SECOND WRONG
            if (identifyAttempts === 2) {
                instructionText.innerHTML =
                    "� Look carefully and try again.";
                return;
            }

            // THIRD WRONG → HELP MODAL
            instructionText.innerHTML = "";

            setTimeout(() => {
                showIdentificationHelpModal();
            }, 600);
        };
    });


    const instructionAudio = new Audio();

    const audioBtn = document.getElementById("play-instruction-audio");
    let currentAudio = "instruction1.mp3";

    audioBtn.onclick = () => {
        instructionAudio.pause();
        instructionAudio.currentTime = 0;
        instructionAudio.src = `./assets/audio/${currentAudio}`;
        instructionAudio.play();
    };

    playHelpAudioBtn.onclick = () => {
        helpAudio.currentTime = 0;
        helpAudio.play().catch(() => { });
    };

    let noCount = 0;
    let yesAttempts = 0;
    let hintsShown = 0;
    let pdScore = 0;

    function blinkTargetHint() {
        const targetTile = document.querySelector('[data-target="true"]');
        if (!targetTile) return;

        hintsShown++;

        targetTile.style.transition = "all 0.3s";
        targetTile.style.border = "6px solid #FFD54A";
        targetTile.style.opacity = "0.4";

        setTimeout(() => {
            targetTile.style.opacity = "1";
        }, 300);

        setTimeout(() => {
            targetTile.style.border = "none";
        }, 900);
    }

    function showHelpModal() {
        helpModal.classList.remove("hidden");

        requestAnimationFrame(() => {
            helpModal.classList.add("modal-visible");
        });
    }

    function hideHelpModal() {
        helpModal.classList.remove("modal-visible");

        helpAudio.pause();
        helpAudio.currentTime = 0;
    }

    function showIdentificationHelpModal() {

        helpModalImage.src = "./assets/images/target.png";
        helpModalImage.classList.remove("hidden");
        // change modal content dynamically
        helpCard.querySelector("p").innerHTML =
            "This child's tower fell down.<br>The child feels sad.<br>";

        showHelpModal();

        closeHelpBtn.onclick = () => {

            hideHelpModal();

            localStorage.setItem("initial_choice", "guided");
            localStorage.setItem("pd_completed", "true");
            localStorage.setItem("pd_image_result", "guided");

            const targetTile = document.querySelector('[data-target="true"]');

            zoomToCenter(targetTile, () => {
                location.href = "affect.html";
            });
        };
    }

    function zoomToCenter(tile, onComplete) {

        const img = tile.querySelector("img");
        const rect = img.getBoundingClientRect();

        // clone image
        const clone = img.cloneNode(true);
        clone.classList.add("zoom-clone");

        // starting position
        clone.style.top = rect.top + "px";
        clone.style.left = rect.left + "px";
        clone.style.width = rect.width + "px";
        clone.style.height = rect.height + "px";

        document.body.appendChild(clone);

        // fade background UI
        document.getElementById("page").classList.add("zoom-fade-out");

        // next frame → animate
        requestAnimationFrame(() => {

            const targetWidth = window.innerWidth * 0.5;
            const targetHeight = targetWidth * (rect.height / rect.width);

            clone.style.top =
                (window.innerHeight - targetHeight) / 2 + "px";

            clone.style.left =
                (window.innerWidth - targetWidth) / 2 + "px";

            clone.style.width = targetWidth + "px";
            clone.style.height = targetHeight + "px";

        });

        // finish
        setTimeout(() => {
            clone.remove();
            onComplete();
        }, 650);
    }

    const instructionText = document.getElementById("instruction-text");
    const yesBtn = document.getElementById("yes-btn");
    const noBtn = document.getElementById("no-btn");
    const yesNoButtons = document.getElementById("yes-no-buttons");
    const imageGrid = document.getElementById("image-grid");

    yesBtn.onclick = () => {
        yesAttempts++;
        pdScore = 1;

        if (noCount === 0) {
            localStorage.setItem("pd_first", "yes");
        } else {
            localStorage.setItem("pd_second", "yes");
        }
        localStorage.setItem("pd_result", "detected");
        imageGrid.classList.remove("disabled-grid");


        instructionText.innerHTML =
            "&#128070; Touch or click the picture that shows the child with the problem.";

        yesNoButtons.classList.add("hidden");
        imageGrid.classList.remove("hidden");

        currentAudio = "instruction1_1.mp3";

        localStorage.setItem("pd_score", pdScore);
        localStorage.setItem("pd_yes_attempts", yesAttempts);
        localStorage.setItem("pd_hints_used", hintsShown);
    };

    noBtn.onclick = () => {
        noCount++;

        if (noCount === 1) {
            localStorage.setItem("pd_first", "no");
            blinkTargetHint();
            instructionText.innerHTML =
                "&#128064; Let’s look carefully once more.<br>Is any child having a problem?";

            currentAudio = "instruction2.mp3";
            return;
        }
        if (noCount === 2) {
            localStorage.setItem("pd_second", "no");
            blinkTargetHint();

            instructionText.innerHTML =
                "&#128064; Look again carefully.<br>Is any child having a problem?";

            currentAudio = "instruction2.mp3";

            return;
        }

        pdScore = 0;
        blinkTargetHint();

        // save data
        localStorage.setItem("pd_result", "missed");
        localStorage.setItem("pd_score", pdScore);
        localStorage.setItem("pd_yes_attempts", yesAttempts);
        localStorage.setItem("pd_hints_used", hintsShown);

        // show help modal instead of instruction text
        setTimeout(() => {
            showHelpModal();
        }, 600);

        // unlock images AFTER modal closes
        closeHelpBtn.onclick = () => {
            hideHelpModal();

            imageGrid.classList.remove("disabled-grid");
            yesNoButtons.classList.add("hidden");

            instructionText.innerHTML =
                "&#128070; Touch or click the picture that shows the child with the problem.";
        };
    };


});