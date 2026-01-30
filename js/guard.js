(function () {

  const MAX_SESSION_MINUTES = 15;
  const now = Date.now();

  const page = location.pathname.split("/").pop() || "index.html";

  const startedAt = localStorage.getItem("session_started_at");
  const pid = localStorage.getItem("participant_id");
  const gender = localStorage.getItem("participant_gender");
  const pdCompleted = localStorage.getItem("pd_completed");
  const status = localStorage.getItem("study_status");

  function resetSession() {
    localStorage.clear();
    if (page !== "participant.html") {
      window.location.replace("participant.html");
    }
  }

  // ------------------------
  // NO SESSION AT ALL
  // ------------------------
  if (!startedAt || !pid || !gender) {
    if (page !== "participant.html") {
      resetSession();
    }
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
  // STUDY COMPLETED
  // ------------------------
  if (status === "completed") {
    resetSession();
    return;
  }

  // ------------------------
  // PD NOT DONE
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
