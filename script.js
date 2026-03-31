const STORAGE_KEY = "dziennik_kierowcy_start_granica_v2";

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
  borderPlace: document.getElementById("borderPlace"),
  startOdometer: document.getElementById("startOdometer"),
  borderOdometer: document.getElementById("borderOdometer"),
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

    if (parsed.report && typeof parsed.report === "object") {
      state.report = {
        driverName: parsed.report.driverName || "",
        vehicleNumber: parsed.report.vehicleNumber || "",
        companyName: parsed.report.companyName || "",
        reportPeriod: parsed.report.reportPeriod || "",
      };
    }

    if (Array.isArray(parsed.entries)) {
      state.entries = parsed.entries.map((entry) => ({
        date: entry.date || "",
        startPlace: entry.startPlace || "",
        borderPlace: entry.borderPlace || "",
        startOdometer: Number(entry.startOdometer) || 0,
        borderOdometer: Number(entry.borderOdometer) || 0,
        countryKm: Number(entry.countryKm) || 0,
        notes: entry.notes || "",
      }));
    }
  } catch (error) {
    console.error("Błąd odczytu localStorage:", error);
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
  const border = Number(els.borderOdometer.value);

  if (!Number.isFinite(start) || !Number.isFinite(border)) {
    els.countryKm.value = "";
    return;
  }

  const diff = border - start;
  els.countryKm.value = diff >= 0 ? diff : "";
}

function getEntryFromForm() {
  const date = els.entryDate.value;
  const startPlace = els.startPlace.value.trim();
  const borderPlace = els.borderPlace.value.trim();
  const startOdometer = Number(els.startOdometer.value);
  const borderOdometer = Number(els.borderOdometer.value);
  const notes = els.notes.value.trim();
  const countryKm = borderOdometer - startOdometer;

  if (!date || !startPlace || !borderPlace) {
    alert("Uzupełnij datę, START i GRANICĘ.");
    return null;
  }

  if (!Number.isFinite(startOdometer) || !Number.isFinite(borderOdometer)) {
    alert("Podaj poprawne stany licznika.");
    return null;
  }

  if (borderOdometer < startOdometer) {
    alert("Licznik GRANICA nie może być mniejszy od licznika START.");
    return null;
  }

  return {
    date,
    startPlace,
    borderPlace,
    startOdometer,
    borderOdometer,
    countryKm,
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
  els.borderPlace.value = entry.borderPlace;
  els.startOdometer.value = entry.startOdometer;
  els.borderOdometer.value = entry.borderOdometer;
  els.countryKm.value = entry.countryKm;
  els.notes.value = entry.notes;

  els.submitBtn.textContent = "Zapisz zmiany";
  els.cancelEditBtn.classList.remove("hidden");
  els.editBadge.classList.remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

function submitEntryForm(event) {
  event.preventDefault();

  const entry = getEntryFromForm();
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

function deleteEntry(index) {
  const entry = state.entries[index];
  if (!entry) return;

  const ok = confirm(`Usunąć wpis z dnia ${entry.date}?`);
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

function renderEntries() {
  const entries = state.entries;

  if (!entries.length) {
    els.entriesTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty">Brak wpisów.</td>
      </tr>
    `;
    els.entriesCount.textContent = "0";
    els.totalKm.textContent = "0";
    return;
  }

  els.entriesTableBody.innerHTML = entries.map((entry, index) => `
    <tr>
      <td>${escapeHtml(entry.date)}</td>
      <td>${escapeHtml(entry.startPlace)}</td>
      <td>${escapeHtml(entry.borderPlace)}</td>
      <td>${formatNumber(entry.startOdometer)}</td>
      <td>${formatNumber(entry.borderOdometer)}</td>
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

  const totalKm = entries.reduce((sum, item) => sum + (Number(item.countryKm) || 0), 0);

  els.entriesCount.textContent = String(entries.length);
  els.totalKm.textContent = formatNumber(totalKm);
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

function exportCsv() {
  if (!state.entries.length) {
    alert("Brak wpisów do eksportu.");
    return;
  }

  const lines = [];

  lines.push(["Kierowca", state.report.driverName]);
  lines.push(["Nr auta", state.report.vehicleNumber]);
  lines.push(["Firma", state.report.companyName]);
  lines.push(["Okres", state.report.reportPeriod]);
  lines.push([]);

  lines.push([
    "Data",
    "START",
    "GRANICA",
    "Licznik START",
    "Licznik GRANICA",
    "Km po kraju",
    "Uwagi"
  ]);

  state.entries.forEach((entry) => {
    lines.push([
      entry.date,
      entry.startPlace,
      entry.borderPlace,
      entry.startOdometer,
      entry.borderOdometer,
      entry.countryKm,
      entry.notes
    ]);
  });

  const csv = lines
    .map((row) =>
      row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(";")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "dziennik-kierowcy-start-granica.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
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
  doc.text("Dziennik Kierowcy — START / GRANICA", 14, 14);

  doc.setFontSize(10);
  doc.text(`Kierowca: ${state.report.driverName || "-"}`, 14, 22);
  doc.text(`Nr auta: ${state.report.vehicleNumber || "-"}`, 14, 28);
  doc.text(`Firma: ${state.report.companyName || "-"}`, 90, 22);
  doc.text(`Okres: ${state.report.reportPeriod || "-"}`, 90, 28);

  const body = state.entries.map((entry) => [
    entry.date,
    entry.startPlace,
    entry.borderPlace,
    String(entry.startOdometer),
    String(entry.borderOdometer),
    String(entry.countryKm),
    entry.notes || "-"
  ]);

  doc.autoTable({
    startY: 34,
    head: [[
      "Data",
      "START",
      "GRANICA",
      "Licznik START",
      "Licznik GRANICA",
      "Km po kraju",
      "Uwagi"
    ]],
    body,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: "linebreak"
    },
    headStyles: {
      fillColor: [37, 99, 235]
    }
  });

  const totalKm = state.entries.reduce((sum, item) => sum + (Number(item.countryKm) || 0), 0);
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 40;

  doc.setFontSize(11);
  doc.text(`Liczba wpisów: ${state.entries.length}`, 14, finalY + 8);
  doc.text(`Suma km po kraju: ${formatNumber(totalKm)}`, 70, finalY + 8);

  doc.save("dziennik-kierowcy-start-granica.pdf");
}

function handleTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const index = Number(button.dataset.index);

  if (!Number.isInteger(index)) return;

  if (action === "edit") {
    setEditMode(index);
  }

  if (action === "delete") {
    deleteEntry(index);
  }
}

function bindEvents() {
  els.saveReportBtn.addEventListener("click", saveReportData);

  els.startOdometer.addEventListener("input", calculateCountryKm);
  els.borderOdometer.addEventListener("input", calculateCountryKm);

  els.entryForm.addEventListener("submit", submitEntryForm);

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
