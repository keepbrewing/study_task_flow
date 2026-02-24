export function exportToCSV(responses, sessionId) {
  if (!responses.length) return;

  const headers = [
    "sessionId",
    "participantId",
    "gender",
    "stage",
    "eventType",
    "pd_first",
    "pd_second",
    "pd_result",
    "category",
    "blockType",
    "action",
    "responseTimeMs",
    "value",
    "timestamp"
  ];


  const rows = responses.map(r => [
    r.sessionId,
    r.participantId,
    r.gender,
    r.stage ?? "",
    r.eventType ?? "",
    r.pd_first ?? "",
    r.pd_second ?? "",
    r.pd_result ?? "",
    r.category,
    r.blockType,
    r.action ?? "",
    r.responseTimeMs ?? "",
    r.value ?? "",
    new Date(r.timestamp).toISOString()
  ]);



  const csvContent = [
    headers.join(","),
    ...rows.map(row =>
      row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
    )
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `study_session_${sessionId}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}
