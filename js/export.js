/* =========================================================
   MRRHL SURVEY — js/export.js
   Handles: CSV, Excel (SheetJS), and PDF (jsPDF + AutoTable)
   export of the currently loaded responses.
   Reads data from window.MRRHL_RESPONSES, populated by admin.js.
   ========================================================= */

(function () {
  "use strict";

  const EXPORT_COLUMNS = [
    "Date",
    "Staff Availability",
    "Staff Greeting",
    "Staff Friendliness",
    "Answered Questions",
    "Staff Knowledge",
    "Overall",
    "Average",
    "Turnaround Satisfied",
    "Turnaround Comment (if No)",
    "What They Liked",
    "Improvement Suggestion",
    "Interviewer Name",
    "Contact Phone",
    "Contact Email"
  ];

  function getResponses() {
    return window.MRRHL_RESPONSES || [];
  }

  function formatDate(timestamp) {
    if (!timestamp || !timestamp.toDate) return "";
    const d = timestamp.toDate();
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
  }

  function toRow(r) {
    const ratings = r.ratings || {};
    return [
      formatDate(r.submittedAt),
      ratings.staffAvailability != null ? ratings.staffAvailability : "",
      ratings.staffGreeting != null ? ratings.staffGreeting : "",
      ratings.staffFriendliness != null ? ratings.staffFriendliness : "",
      ratings.staffAnsweredQuestions != null ? ratings.staffAnsweredQuestions : "",
      ratings.staffKnowledge != null ? ratings.staffKnowledge : "",
      ratings.overall != null ? ratings.overall : "",
      r.averageRating != null ? r.averageRating : "",
      r.turnaroundSatisfied || "",
      r.turnaroundSpecify || "",
      r.bestLiked || "",
      r.improvementSuggestion || "",
      r.interviewerName || "",
      r.contactPhone || "",
      r.contactEmail || ""
    ];
  }

  function fileTimestamp() {
    const d = new Date();
    const pad = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "_" + pad(d.getHours()) + pad(d.getMinutes());
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ---------------- CSV ---------------- */

  function csvEscape(value) {
    const str = String(value == null ? "" : value);
    if (/[",\n]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function exportCsv() {
    const responses = getResponses();
    if (!responses.length) return alert("There are no responses to export yet.");

    const rows = [EXPORT_COLUMNS].concat(responses.map(toRow));
    const csvContent = rows.map(function (row) {
      return row.map(csvEscape).join(",");
    }).join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, "mrrhl-survey-responses_" + fileTimestamp() + ".csv");
  }

  /* ---------------- Excel ---------------- */

  function exportExcel() {
    const responses = getResponses();
    if (!responses.length) return alert("There are no responses to export yet.");

    const rows = [EXPORT_COLUMNS].concat(responses.map(toRow));
    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // Reasonable column widths
    worksheet["!cols"] = EXPORT_COLUMNS.map(function (col) {
      return { wch: Math.max(12, col.length + 2) };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");
    XLSX.writeFile(workbook, "mrrhl-survey-responses_" + fileTimestamp() + ".xlsx");
  }

  /* ---------------- PDF ---------------- */

  function exportPdf() {
    const responses = getResponses();
    if (!responses.length) return alert("There are no responses to export yet.");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    doc.setFontSize(14);
    doc.setTextColor(15, 61, 62);
    doc.text("Manyara Regional Referral Hospital Laboratory", 40, 36);
    doc.setFontSize(10);
    doc.setTextColor(74, 99, 96);
    doc.text("Patient Satisfaction Survey — Responses Export", 40, 52);
    doc.text("Generated: " + new Date().toLocaleString(), 40, 66);

    doc.autoTable({
      startY: 80,
      head: [EXPORT_COLUMNS],
      body: responses.map(toRow),
      styles: { fontSize: 7.5, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: [27, 107, 112], textColor: 255 },
      alternateRowStyles: { fillColor: [234, 243, 241] },
      margin: { left: 40, right: 40 }
    });

    doc.save("mrrhl-survey-responses_" + fileTimestamp() + ".pdf");
  }

  /* ---------------- Wire up buttons ---------------- */

  document.getElementById("exportCsvBtn").addEventListener("click", exportCsv);
  document.getElementById("exportExcelBtn").addEventListener("click", exportExcel);
  document.getElementById("exportPdfBtn").addEventListener("click", exportPdf);
})();
