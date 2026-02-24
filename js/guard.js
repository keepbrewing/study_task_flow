(function () {

  const MAX_SESSION_MINUTES = 15;
  const now = Date.now();

  const page = location.pathname.split("/").pop() || "index.html";

  const startedAt = localStorage.getItem("session_started_at");
  const pid = localStorage.getItem("participant_id");
  const gender = localStorage.getItem("participant_gender");

  const pdCompleted = localStorage.getItem("pd_completed");
  const affectCompleted = localStorage.getItem("affect_completed");
  const studyCompleted = localStorage.getItem("study_status");

  function resetSession() {
    localStorage.clear();
    if (page !== "participant.html") {
      window.location.replace("participant.html");
    }
  }

  // ------------------------
  // NO SESSION
  // ------------------------
  if (!startedAt || !pid || !gender) {
    if (page !== "participant.html") resetSession();
    return;
  }

  // ------------------------
  // SESSION EXPIRED
  // ------------------------
  const diffMinutes = (now - Number(startedAt)) / 60000;

  if (diffMinutes > MAX_SESSION_MINUTES) {
    resetSession();
    return;
  }

  // ------------------------
  // STUDY FINISHED
  // ------------------------
  if (studyCompleted === "completed") {
    resetSession();
    return;
  }

  // =====================================================
  // FLOW CONTROL
  // =====================================================

  // ---- BEFORE PD ----
  if (!pdCompleted) {
    if (page !== "index.html") {
      window.location.replace("index.html");
    }
    return;
  }

  // ---- AFTER PD, BEFORE AFFECT ----
  if (pdCompleted && !affectCompleted) {
    if (page !== "affect.html") {
      window.location.replace("affect.html");
    }
    return;
  }

  // ---- AFTER AFFECT ----
  if (affectCompleted) {
    if (page !== "task.html") {
      window.location.replace("task.html");
    }
    return;
  }

})();