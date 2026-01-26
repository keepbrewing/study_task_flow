export function exportToCSV(responses, sessionId) {
  if (!responses.length) return;

  const headers = [
    "sessionId",
    "participantId",
    "gender",
    "round",
    "category",
    "blockType",
    "action",
    "responseTimeMs",
    "timestamp"
  ];


  const rows = responses.map(r => [
  r.sessionId,
  r.participantId,
  r.gender,
  r.round,
  r.category,
  r.blockType,
  r.action ?? "",
  r.responseTimeMs ?? "",
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
