(function () {

  const MAX_SESSION_MINUTES = 15;
  const now = Date.now();

  const startedAt = localStorage.getItem("session_started_at");

  // ------------------------
  // SESSION EXPIRY
  // ------------------------
  if (startedAt) {
    const diffMinutes = (now - Number(startedAt)) / 60000;

    if (diffMinutes > MAX_SESSION_MINUTES) {
      localStorage.clear();
      window.location.replace("participant.html");
      return;
    }
  }

  const pid = localStorage.getItem("participant_id");
  const gender = localStorage.getItem("participant_gender");
  const pdCompleted = localStorage.getItem("pd_completed");
  const status = localStorage.getItem("study_status");

  const page = location.pathname.split("/").pop();

  function go(to) {
    if (page !== to) {
      window.location.replace(to);
    }
  }

  // ------------------------
  // NO PARTICIPANT
  // ------------------------
  if (!pid || !gender) {
    go("participant.html");
    return;
  }

  // ------------------------
  // STUDY FINISHED → RESET
  // ------------------------
  if (status === "completed") {
    localStorage.clear();
    go("participant.html");
    return;
  }

  // ------------------------
  // PD NOT DONE YET
  // ------------------------
  if (!pdCompleted) {
    go("index.html");
    return;
  }

  // ------------------------
  // PD DONE → TASK
  // ------------------------
  go("task.html");

})();
