import type jsPDF from "jspdf";
import { Incident } from "./types";
import { formatDate, formatTime } from "./format";

const COLUMNS = [
  "ID",
  "Type",
  "Priority",
  "Status",
  "Vehicle",
  "Driver",
  "Route",
  "Location",
  "Date Created",
  "Last Updated",
  "Closed At",
  "Assignee",
  "Resolution",
  "Description",
  "Comments / History",
] as const;

export function stripHtml(html: string): string {
  if (typeof document === "undefined") return html;
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent ?? "").replace(/\s+/g, " ").trim();
}

function dateTime(iso?: string): string {
  return iso ? `${formatDate(iso)} ${formatTime(iso)}` : "";
}

function formatActivityLog(incident: Incident): string {
  if (!incident.activity.length) return "";
  return incident.activity
    .map((entry) => {
      const who = entry.author ? `${entry.author.name}: ` : "";
      return `[${dateTime(entry.timestamp)}] ${who}${entry.text}`;
    })
    .join("\n");
}

function incidentToRow(incident: Incident): string[] {
  return [
    incident.id,
    incident.type,
    incident.priority,
    incident.status,
    incident.vehicleNumber,
    incident.driverName,
    incident.route,
    incident.location ?? "",
    dateTime(incident.date),
    dateTime(incident.updatedAt),
    dateTime(incident.closedAt),
    incident.assignee?.name ?? "Unassigned",
    incident.resolution ?? "",
    stripHtml(incident.description),
    formatActivityLog(incident),
  ];
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportIncidentsCsv(incidents: Incident[], filename: string) {
  const rows = [COLUMNS.map(csvEscape).join(",")];
  incidents.forEach((incident) => {
    rows.push(incidentToRow(incident).map(csvEscape).join(","));
  });
  const blob = new Blob([rows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(filename, blob);
}

function writeIncidentDetailBlock(doc: jsPDF, incident: Incident) {
  const marginX = 14;
  let y = 18;

  doc.setFontSize(16);
  doc.setTextColor(20);
  doc.text(`Incident ${incident.id} — ${incident.type}`, marginX, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(
    `Status: ${incident.status}   ·   Priority: ${incident.priority}   ·   Generated ${dateTime(new Date().toISOString())}`,
    marginX,
    y
  );
  y += 10;

  const fields: [string, string][] = [
    ["Vehicle", incident.vehicleNumber],
    ["Driver", incident.driverName],
    ["Route", incident.route],
    ["Location", incident.location ?? "—"],
    ["Date Created", dateTime(incident.date)],
    ["Last Updated", dateTime(incident.updatedAt)],
    ["Closed At", incident.closedAt ? dateTime(incident.closedAt) : "—"],
    ["Assignee", incident.assignee?.name ?? "Unassigned"],
    ["Resolution", incident.resolution ?? "—"],
  ];

  doc.setFontSize(11);
  fields.forEach(([label, value]) => {
    doc.setTextColor(90);
    doc.text(`${label}:`, marginX, y);
    doc.setTextColor(20);
    doc.text(value, marginX + 35, y);
    y += 7;
  });

  y += 3;
  doc.setDrawColor(220);
  doc.line(marginX, y, 196, y);
  y += 8;

  doc.setFontSize(12);
  doc.setTextColor(20);
  doc.text("Description", marginX, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(60);
  const descLines = doc.splitTextToSize(stripHtml(incident.description) || "No description provided.", 182);
  doc.text(descLines, marginX, y);
  y += descLines.length * 5 + 8;

  doc.setFontSize(12);
  doc.setTextColor(20);
  doc.text("Comments / History", marginX, y);
  y += 6;

  if (!incident.activity.length) {
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("No activity recorded.", marginX, y);
    return;
  }

  doc.setFontSize(9);
  incident.activity.forEach((entry) => {
    if (y > 280) {
      doc.addPage();
      y = 18;
    }
    const who = entry.author ? `${entry.author.name}: ` : "";
    const line = `${dateTime(entry.timestamp)} — ${who}${entry.text}`;
    const lines = doc.splitTextToSize(line, 182);
    doc.setTextColor(entry.kind === "system" ? 140 : 60);
    doc.text(lines, marginX, y);
    y += lines.length * 4.5 + 2;
  });
}

async function exportIncidentsPdf(incidents: Incident[], title: string, filename: string) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated ${dateTime(new Date().toISOString())} · ${incidents.length} incident(s)`, 14, 21);
  doc.text("Full details, descriptions, and comment history for each incident follow this summary.", 14, 26);

  autoTable(doc, {
    startY: 31,
    head: [["ID", "Type", "Priority", "Status", "Vehicle", "Driver", "Route", "Assignee", "Updated"]],
    body: incidents.map((i) => [
      i.id,
      i.type,
      i.priority,
      i.status,
      i.vehicleNumber,
      i.driverName,
      i.route,
      i.assignee?.name ?? "Unassigned",
      dateTime(i.updatedAt),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [58, 67, 86] },
    alternateRowStyles: { fillColor: [246, 247, 249] },
  });

  incidents.forEach((incident) => {
    doc.addPage("a4", "portrait");
    writeIncidentDetailBlock(doc, incident);
  });

  doc.save(filename);
}

async function exportSingleIncidentPdf(incident: Incident, filename: string) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  writeIncidentDetailBlock(doc, incident);
  doc.save(filename);
}

export type ExportScope = "all" | "open" | "closed";

const SCOPE_LABELS: Record<ExportScope, string> = {
  all: "All Incidents",
  open: "Open Incidents",
  closed: "Closed Incidents",
};

export function filterByScope(incidents: Incident[], scope: ExportScope): Incident[] {
  if (scope === "open") return incidents.filter((i) => i.status !== "Closed");
  if (scope === "closed") return incidents.filter((i) => i.status === "Closed");
  return incidents;
}

export function exportIncidentListCsv(incidents: Incident[], scope: ExportScope) {
  const scoped = filterByScope(incidents, scope);
  const dateKey = new Date().toISOString().slice(0, 10);
  exportIncidentsCsv(scoped, `incidents-${scope}-${dateKey}.csv`);
}

export async function exportIncidentListPdf(incidents: Incident[], scope: ExportScope) {
  const scoped = filterByScope(incidents, scope);
  const dateKey = new Date().toISOString().slice(0, 10);
  await exportIncidentsPdf(scoped, `${SCOPE_LABELS[scope]} Report`, `incidents-${scope}-${dateKey}.pdf`);
}

export function exportSingleIncidentCsv(incident: Incident) {
  exportIncidentsCsv([incident], `incident-${incident.id}.csv`);
}

export async function exportSingleIncidentPdfFile(incident: Incident) {
  await exportSingleIncidentPdf(incident, `incident-${incident.id}.pdf`);
}
