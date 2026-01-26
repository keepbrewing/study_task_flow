(function () {
    const status = localStorage.getItem("study_status");
  const MAX_SESSION_MINUTES = 30;
  const now = Date.now();

  const startedAt = localStorage.getItem("session_started_at");

  // session expired
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
  const choice = localStorage.getItem("initial_choice");

  const page = location.pathname.split("/").pop();

  function go(to) {
    if (page !== to) {
      window.location.replace(to);
    }
  }

  if (!pid || !gender) {
    go("participant.html");
    return;
  }

  if (status === "ended_early" || status === "completed") {
    window.location.replace("task.html?end=true");
    return;
  }

  if (!choice) {
    go("index.html");
    return;
  }

  go("task.html");
})();
