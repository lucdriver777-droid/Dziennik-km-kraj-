const STORAGE_KEY = "dziennik_kierowcy_km_kraj_v6";

const state = {
  report: {
    driverName: "",
    vehicleNumber: "",
    companyName: "",
    reportPeriod: "",
  },
  entries: [],
  editIndex: null,
};

const els = {
  driverName: document.getElementById("driverName"),
  vehicleNumber: document.getElementById("vehicleNumber"),
  companyName: document.getElementById("companyName"),
  reportPeriod: document.getElementById("reportPeriod"),
  saveReportBtn: document.getElementById("saveReportBtn"),

  entryForm: document.getElementById("entryForm"),
  entryDate: document.getElementById("entryDate"),
  startPlace: document.getElementById("startPlace"),
  endPlace: document.getElementById("endPlace"),
  startOdometer: document.getElementById("startOdometer"),
  endOdometer: document.getElementById("endOdometer"),
  countryKm: document.getElementById("countryKm"),
  notes: document.getElementById("notes"),
  submitBtn: document.getElementById("submitBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  editBadge: document.getElementById("editBadge"),

  entriesTableBody: document.getElementById("entriesTableBody"),
  entriesCount: document.getElementById("entriesCount"),
  totalKm: document.getElementById("totalKm"),

  exportCsvBtn: document.getElementById("exportCsvBtn"),
  exportPdfBtn: document.getElementById("exportPdfBtn"),
  clearAllBtn: document.getElementById("clearAllBtn"),
};

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    report: state.report,
    entries: state.entries,
  }));
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);

    if (parsed.report) {
      state.report.driverName = parsed.report.driverName || "";
      state.report.vehicleNumber = parsed.report.vehicleNumber || "";
      state.report.companyName = parsed.report.companyName || "";
      state.report.reportPeriod = parsed.report.reportPeriod || "";
    }

    if (Array.isArray(parsed.entries)) {
      state.entries = parsed.entries.map((entry) => ({
        date: entry.date || "",
        startPlace: entry.startPlace || "",
        endPlace: entry.endPlace || "",
        startOdometer: Number(entry.startOdometer) || 0,
        endOdometer: Number(entry.endOdometer) || 0,
        countryKm: Number(entry.countryKm) || 0,
        notes: entry.notes || "",
      }));
    }
  } catch (error) {
    console.error("Błąd odczytu danych:", error);
  }
}

function fillReportForm() {
  els.driverName.value = state.report.driverName;
  els.vehicleNumber.value = state.report.vehicleNumber;
  els.companyName.value = state.report.companyName;
  els.reportPeriod.value = state.report.reportPeriod;
}

function saveReportData() {
  state.report.driverName = els.driverName.value.trim();
  state.report.vehicleNumber = els.vehicleNumber.value.trim();
  state.report.companyName = els.companyName.value.trim();
  state.report.reportPeriod = els.reportPeriod.value.trim();

  saveToStorage();
  alert("Dane raportu zapisane.");
}

function calculateCountryKm() {
  const start = Number(els.startOdometer.value);
  const end = Number(els.endOdometer.value);

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    els.countryKm.value = "";
    return;
  }

  const diff = end - start;
  els.countryKm.value = diff >= 0 ? diff : "";
}

function getFormEntry() {
  const date = els.entryDate.value;
  const startPlace = els.startPlace.value.trim();
  const endPlace = els.endPlace.value.trim();
  const startOdometer = Number(els.startOdometer.value);
  const endOdometer = Number(els.endOdometer.value);
  const notes = els.notes.value.trim();

  if (!date || !startPlace || !endPlace) {
    alert("Uzupełnij datę, miejsce początkowe i miejsce końcowe.");
    return null;
  }

  if (!Number.isFinite(startOdometer) || !Number.isFinite(endOdometer)) {
    alert("Podaj poprawne stany licznika.");
    return null;
  }

  if (endOdometer < startOdometer) {
    alert("Licznik końcowy nie może być mniejszy od początkowego.");
    return null;
  }

  return {
    date,
    startPlace,
    endPlace,
    startOdometer,
    endOdometer,
    countryKm: endOdometer - startOdometer,
    notes,
  };
}

function resetEntryForm() {
  els.entryForm.reset();
  els.countryKm.value = "";
  state.editIndex = null;
  els.submitBtn.textContent = "Dodaj wpis";
  els.cancelEditBtn.classList.add("hidden");
  els.editBadge.classList.add("hidden");
}

function setEditMode(index) {
  const entry = state.entries[index];
  if (!entry) return;

  state.editIndex = index;

  els.entryDate.value = entry.date;
  els.startPlace.value = entry.startPlace;
  els.endPlace.value = entry.endPlace;
  els.startOdometer.value = entry.startOdometer;
  els.endOdometer.value = entry.endOdometer;
  els.countryKm.value = entry.countryKm;
  els.notes.value = entry.notes;

  els.submitBtn.textContent = "Zapisz zmiany";
  els.cancelEditBtn.classList.remove("hidden");
  els.editBadge.classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteEntry(index) {
  if (!state.entries[index]) return;

  const ok = confirm(`Usunąć wpis z dnia ${state.entries[index].date}?`);
  if (!ok) return;

  state.entries.splice(index, 1);

  if (state.editIndex === index) {
    resetEntryForm();
  } else if (state.editIndex !== null && index < state.editIndex) {
    state.editIndex -= 1;
  }

  saveToStorage();
  renderEntries();
}

function formatNumber(value) {
  return new Intl.NumberFormat("pl-PL").format(Number(value) || 0);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSortedEntriesWithIndex() {
  return state.entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => b.entry.date.localeCompare(a.entry.date));
}

function renderEntries() {
  const sorted = getSortedEntriesWithIndex();

  if (!sorted.length) {
    els.entriesTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty">Brak wpisów.</td>
      </tr>
    `;
    els.entriesCount.textContent = "0";
    els.totalKm.textContent = "0";
    return;
  }

  els.entriesTableBody.innerHTML = sorted.map(({ entry, index }) => `
    <tr>
      <td>${escapeHtml(entry.date)}</td>
      <td>${escapeHtml(entry.startPlace)}</td>
      <td>${escapeHtml(entry.endPlace)}</td>
      <td>${formatNumber(entry.startOdometer)}</td>
      <td>${formatNumber(entry.endOdometer)}</td>
      <td class="km-cell">${formatNumber(entry.countryKm)}</td>
      <td>${escapeHtml(entry.notes || "-")}</td>
      <td>
        <div class="row-actions">
          <button type="button" class="btn btn-secondary btn-sm" data-action="edit" data-index="${index}">Edytuj</button>
          <button type="button" class="btn btn-danger btn-sm" data-action="delete" data-index="${index}">Usuń</button>
        </div>
      </td>
    </tr>
  `).join("");

  const totalKm = state.entries.reduce((sum, item) => sum + (Number(item.countryKm) || 0), 0);
  els.entriesCount.textContent = String(state.entries.length);
  els.totalKm.textContent = formatNumber(totalKm);
}

function exportCsv() {
  if (!state.entries.length) {
    alert("Brak wpisów do eksportu.");
    return;
  }

  const rows = [
    ["Kierowca", state.report.driverName],
    ["Nr auta", state.report.vehicleNumber],
    ["Firma", state.report.companyName],
    ["Okres", state.report.reportPeriod],
    [],
    ["Data", "Miejsce początkowe", "Miejsce końcowe", "Licznik początkowy", "Licznik końcowy", "Km po kraju", "Uwagi"]
  ];

  getSortedEntriesWithIndex().forEach(({ entry }) => {
    rows.push([
      entry.date,
      entry.startPlace,
      entry.endPlace,
      entry.startOdometer,
      entry.endOdometer,
      entry.countryKm,
      entry.notes
    ]);
  });

  const csv = rows
    .map(row => row.map(cell => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(";"))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "dziennik-kierowcy-km-po-kraju.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportPdf() {
  if (!state.entries.length) {
    alert("Brak wpisów do eksportu.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("l", "mm", "a4");

  doc.setFontSize(16);
  doc.text("Dziennik Kierowcy — Kilometry po kraju", 14, 14);

  doc.setFontSize(10);
  doc.text(`Kierowca: ${state.report.driverName || "-"}`, 14, 22);
  doc.text(`Nr auta: ${state.report.vehicleNumber || "-"}`, 14, 28);
  doc.text(`Firma: ${state.report.companyName || "-"}`, 90, 22);
  doc.text(`Okres: ${state.report.reportPeriod || "-"}`, 90, 28);

  const body = getSortedEntriesWithIndex().map(({ entry }) => [
    entry.date,
    entry.startPlace,
    entry.endPlace,
    String(entry.startOdometer),
    String(entry.endOdometer),
    String(entry.countryKm),
    entry.notes || "-"
  ]);

  doc.autoTable({
    startY: 34,
    head: [[
      "Data",
      "Miejsce początkowe",
      "Miejsce końcowe",
      "Licznik początkowy",
      "Licznik końcowy",
      "Km po kraju",
      "Uwagi"
    ]],
    body,
    styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [37, 99, 235] }
  });

  const totalKm = state.entries.reduce((sum, item) => sum + (Number(item.countryKm) || 0), 0);
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 40;

  doc.setFontSize(11);
  doc.text(`Liczba wpisów: ${state.entries.length}`, 14, finalY + 8);
  doc.text(`Suma km po kraju: ${formatNumber(totalKm)}`, 70, finalY + 8);

  doc.save("dziennik-kierowcy-km-po-kraju.pdf");
}

function clearAllData() {
  const ok = confirm("Na pewno usunąć cały raport i wszystkie wpisy?");
  if (!ok) return;

  state.report = {
    driverName: "",
    vehicleNumber: "",
    companyName: "",
    reportPeriod: "",
  };
  state.entries = [];
  state.editIndex = null;

  localStorage.removeItem(STORAGE_KEY);
  fillReportForm();
  resetEntryForm();
  renderEntries();
}

function handleSubmit(event) {
  event.preventDefault();

  const entry = getFormEntry();
  if (!entry) return;

  if (state.editIndex === null) {
    state.entries.push(entry);
  } else {
    state.entries[state.editIndex] = entry;
  }

  saveToStorage();
  renderEntries();
  resetEntryForm();
}

function handleTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const index = Number(button.dataset.index);
  const action = button.dataset.action;

  if (!Number.isInteger(index)) return;

  if (action === "edit") {
    setEditMode(index);
  } else if (action === "delete") {
    deleteEntry(index);
  }
}

function bindEvents() {
  els.saveReportBtn.addEventListener("click", saveReportData);
  els.startOdometer.addEventListener("input", calculateCountryKm);
  els.endOdometer.addEventListener("input", calculateCountryKm);
  els.entryForm.addEventListener("submit", handleSubmit);
  els.cancelEditBtn.addEventListener("click", resetEntryForm);
  els.entriesTableBody.addEventListener("click", handleTableClick);
  els.exportCsvBtn.addEventListener("click", exportCsv);
  els.exportPdfBtn.addEventListener("click", exportPdf);
  els.clearAllBtn.addEventListener("click", clearAllData);
}

function init() {
  loadFromStorage();
  fillReportForm();
  renderEntries();
  bindEvents();
}

init();
