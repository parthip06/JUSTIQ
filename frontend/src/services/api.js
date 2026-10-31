/**
 * API Service Client connecting React frontend to the FastAPI backend.
 */

const API_BASE = "http://localhost:8000/api";

export async function fetchRegistryStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error("Failed to load registry statistics.");
  return res.json();
}

export async function fetchCases({ page = 1, pageSize = 25, search = "", caseType = "", priority = "", yearMin = null, yearMax = null }) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (search) params.append("search", search);
  if (caseType) params.append("case_type", caseType);
  if (priority) params.append("priority", priority);
  if (yearMin) params.append("year_min", String(yearMin));
  if (yearMax) params.append("year_max", String(yearMax));

  const res = await fetch(`${API_BASE}/cases?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to query cases.");
  return res.json();
}

export async function fetchCaseDossier(caseId) {
  const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}`);
  if (!res.ok) throw new Error("Failed to load case dossier.");
  return res.json();
}

export async function predictPriority(payload) {
  const res = await fetch(`${API_BASE}/predict/priority`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Priority prediction failed.");
  return res.json();
}

export async function predictDuration(payload) {
  const res = await fetch(`${API_BASE}/predict/duration`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Duration forecast failed.");
  return res.json();
}

export async function prioritizeCases(payload) {
  const res = await fetch(`${API_BASE}/prioritize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Case prioritization failed.");
  return res.json();
}

export async function fetchJudges() {
  const res = await fetch(`${API_BASE}/judges`);
  if (!res.ok) throw new Error("Failed to fetch judge roster.");
  return res.json();
}
