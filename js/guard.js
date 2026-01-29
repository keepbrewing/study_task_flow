(function () {
  const MAX_SESSION_MINUTES = 15;
  const now = Date.now();

  const startedAtRaw = localStorage.getItem("session_started_at");

  // ---------- HARD SESSION EXPIRY ----------
  if (!startedAtRaw) {
    // no valid session
    localStorage.clear();
    if (!location.pathname.endsWith("participant.html")) {
      window.location.replace("participant.html");
    }
    return;
  }

  const startedAt = Number(startedAtRaw);

  if (isNaN(startedAt)) {
    localStorage.clear();
    window.location.replace("participant.html");
    return;
  }

  const diffMinutes = (now - startedAt) / 60000;

  if (diffMinutes > MAX_SESSION_MINUTES) {
    localStorage.clear();
    window.location.replace("participant.html");
    return;
  }

  // ---------- SESSION IS VALID ----------
  const pid = localStorage.getItem("participant_id");
  const gender = localStorage.getItem("participant_gender");

  if (!pid || !gender) {
    localStorage.clear();
    window.location.replace("participant.html");
    return;
  }

  const pdCompleted = localStorage.getItem("pd_completed");
  const status = localStorage.getItem("study_status");

  const page = location.pathname.split("/").pop();

  function go(to) {
    if (page !== to) window.location.replace(to);
  }

  // finished or early end
  if (status === "completed" || status === "ended_early") {
    go("task.html?end=true");
    return;
  }

  // problem detection not done yet
  if (!pdCompleted) {
    go("index.html");
    return;
  }

  // otherwise → task
  go("task.html");
})();
