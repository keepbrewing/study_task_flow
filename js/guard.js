(function () {
  const page = location.pathname.split("/").pop();
  if(page === "" || page === "participant.html"){
    return;
  }

  const MAX_SESSION_MINUTES = 15;
  const now = Date.now();

  const startedAt = localStorage.getItem("session_started_at");
  const pid = localStorage.getItem("participant_id");
  const gender = localStorage.getItem("participant_gender");
  const pdCompleted = localStorage.getItem("pd_completed");
  const status = localStorage.getItem("study_status");

  function resetSession() {
    localStorage.clear();
    window.location.replace("participant.html");
  }

  // ------------------------
  // NO SESSION TIMESTAMP → INVALID SESSION
  // ------------------------
  if (!startedAt) {
    resetSession();
    return;
  }

  // ------------------------
  // SESSION EXPIRY CHECK
  // ------------------------
  const diffMinutes = (now - Number(startedAt)) / 60000;

  if (diffMinutes > MAX_SESSION_MINUTES) {
    resetSession();
    return;
  }

  // ------------------------
  // NO PARTICIPANT DATA
  // ------------------------
  if (!pid || !gender) {
    resetSession();
    return;
  }

  // ------------------------
  // STUDY COMPLETED → RESET
  // ------------------------
  if (status === "completed") {
    resetSession();
    return;
  }

  // ------------------------
  // PD NOT DONE YET
  // ------------------------
  if (!pdCompleted) {
    if (page !== "index.html") {
      window.location.replace("index.html");
    }
    return;
  }

  // ------------------------
  // PD DONE → TASK
  // ------------------------
  if (page !== "task.html") {
    window.location.replace("task.html");
  }

})();
