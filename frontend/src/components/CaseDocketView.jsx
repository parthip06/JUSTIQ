import React, { useEffect, useState } from "react";
import { fetchCases, fetchCaseDossier } from "../services/api";
import { Search, Filter, RotateCcw, ChevronLeft, ChevronRight, X, ExternalLink, Calendar, Users, Scale, FileText } from "lucide-react";
import JudicialNotice from "./JudicialNotice";

const CASE_CATEGORIES = [
  "All Categories",
  "Constitutional / Writ Petition",
  "Civil Appeal - Property",
  "Criminal Appeal",
  "Income Tax / Revenue",
  "Civil Appeal - General",
  "Company / Commercial",
  "Habeas Corpus / Preventive Detention",
  "Labour / Industrial Dispute",
  "Election Petition",
  "Bail Matter",
];

export default function CaseDocketView({ setActiveTab, setTargetCaseForInference }) {
  const [cases, setCases] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedPriority, setSelectedPriority] = useState("All Priorities");
  const [yearMin, setYearMin] = useState(1950);
  const [yearMax, setYearMax] = useState(1975);

  // Modal Dossier state
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [dossierLoading, setDossierLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    fetchCases({
      page,
      pageSize,
      search: search.trim(),
      caseType: selectedCategory === "All Categories" ? "" : selectedCategory,
      priority: selectedPriority === "All Priorities" ? "" : selectedPriority,
      yearMin,
      yearMax,
    })
      .then((data) => {
        setCases(data.cases);
        setTotal(data.total);
        setTotalPages(data.total_pages);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [page, selectedCategory, selectedPriority, yearMin, yearMax]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("All Categories");
    setSelectedPriority("All Priorities");
    setYearMin(1950);
    setYearMax(1975);
    setPage(1);
  };

  const openDossier = (caseId) => {
    setDossierLoading(true);
    fetchCaseDossier(caseId)
      .then((data) => {
        setSelectedDossier(data);
        setDossierLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setDossierLoading(false);
      });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Court Case Docket & Registry</h2>
          <p>Search, filter, and inspect complete dossiers across the 7,378 historical cases.</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--accent-blue)" }}>
            {total.toLocaleString()}
          </span>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Matching Cases</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="panel-card" style={{ padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "grid", gridTemplateColumns: "1.5fr 1.2fr 1fr 1fr auto auto", gap: "0.85rem", alignItems: "flex-end" }}>
          <div>
            <label className="form-label">Search Case ID or Parties</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. SC-00012 or Singh"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: "2.2rem" }}
              />
              <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
            </div>
          </div>

          <div>
            <label className="form-label">Substantive Category</label>
            <select className="form-select" value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}>
              {CASE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Priority Tier</label>
            <select className="form-select" value={selectedPriority} onChange={(e) => { setSelectedPriority(e.target.value); setPage(1); }}>
              <option value="All Priorities">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>

          <div>
            <label className="form-label">Year Range: {yearMin} - {yearMax}</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="number"
                className="form-input"
                min="1950"
                max={yearMax}
                value={yearMin}
                onChange={(e) => setYearMin(Number(e.target.value))}
                style={{ width: "80px", padding: "0.5rem" }}
              />
              <input
                type="number"
                className="form-input"
                min={yearMin}
                max="1975"
                value={yearMax}
                onChange={(e) => setYearMax(Number(e.target.value))}
                style={{ width: "80px", padding: "0.5rem" }}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ padding: "0.65rem 1.1rem" }}>
            <Search size={16} /> Filter
          </button>

          <button type="button" className="btn-secondary" onClick={handleResetFilters} style={{ padding: "0.65rem 0.95rem" }} title="Reset Filters">
            <RotateCcw size={16} />
          </button>
        </form>
      </div>

      {/* Case Table */}
      <div className="panel-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-responsive">
          <table className="court-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Year</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Duration (Days)</th>
                <th>Hearings</th>
                <th>Coram Bench</th>
                <th>Assigned Judge</th>
                <th>Parties Involved</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "3rem" }}>
                    <div style={{ color: "var(--accent-blue)" }}>Loading Case Records...</div>
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                    No case records found matching your filters.
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr key={c.case_id}>
                    <td>
                      <span
                        style={{ color: "var(--accent-blue)", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                        onClick={() => openDossier(c.case_id)}
                      >
                        {c.case_id}
                      </span>
                    </td>
                    <td>{c.case_year}</td>
                    <td style={{ fontWeight: 600 }}>{c.case_type}</td>
                    <td>
                      <span className={`badge-priority badge-${c.priority.toLowerCase()}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{c.duration_days}</span>{" "}
                      <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>({(c.duration_days / 30.44).toFixed(1)}m)</span>
                    </td>
                    <td>{c.hearings}</td>
                    <td>{c.bench_size} Judge(s)</td>
                    <td>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>{c.assigned_judge}</span>
                    </td>
                    <td style={{ maxWidth: "260px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={`${c.petitioner} vs ${c.respondent}`}>
                      <span style={{ color: "var(--text-primary)" }}>{c.petitioner}</span>
                      <span style={{ color: "var(--text-dim)" }}> vs </span>
                      <span style={{ color: "var(--text-muted)" }}>{c.respondent}</span>
                    </td>
                    <td>
                      <button
                        className="btn-secondary"
                        style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}
                        onClick={() => openDossier(c.case_id)}
                      >
                        Dossier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", borderTop: "1px solid var(--border-subtle)", background: "rgba(15, 23, 42, 0.4)" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total.toLocaleString()} total cases)
          </span>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ padding: "0.4rem 0.85rem", opacity: page <= 1 ? 0.4 : 1 }}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              className="btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{ padding: "0.4rem 0.85rem", opacity: page >= totalPages ? 0.4 : 1 }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-over Drawer Modal for Case Dossier */}
      {selectedDossier && (
        <div className="modal-overlay" onClick={() => setSelectedDossier(null)}>
          <div className="modal-drawer" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <Scale size={24} style={{ color: "var(--accent-gold)" }} />
                <h3 style={{ margin: 0, fontSize: "1.3rem" }}>{selectedDossier.case_id} Dossier</h3>
              </div>
              <button
                onClick={() => setSelectedDossier(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Priority & Category Header */}
              <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span className={`badge-priority badge-${selectedDossier.priority.toLowerCase()}`} style={{ fontSize: "0.85rem" }}>
                    {selectedDossier.priority} Priority
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Year {selectedDossier.case_year}</span>
                </div>
                <h4 style={{ color: "var(--text-primary)", fontSize: "1.1rem", marginTop: "0.25rem" }}>
                  {selectedDossier.case_type}
                </h4>
              </div>

              {/* Litigating Parties */}
              <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <h5 style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.65rem" }}>
                  Litigating Parties
                </h5>
                <div style={{ marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--accent-blue)", display: "block" }}>Petitioner / Appellant</span>
                  <strong style={{ fontSize: "0.95rem" }}>{selectedDossier.petitioner}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--accent-gold)", display: "block" }}>Respondent / State</span>
                  <strong style={{ fontSize: "0.95rem" }}>{selectedDossier.respondent}</strong>
                </div>
              </div>

              {/* Timeline & Durations */}
              <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <h5 style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.65rem" }}>
                  Timeline & Disposal Profile
                </h5>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.85rem" }}>
                  <div>
                    <span style={{ color: "var(--text-dim)", display: "block" }}>Filing Date</span>
                    <strong>{selectedDossier.filing_date}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-dim)", display: "block" }}>Judgment Date</span>
                    <strong>{selectedDossier.judgment_date}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-dim)", display: "block" }}>Disposal Duration</span>
                    <strong style={{ color: "var(--accent-blue)" }}>{selectedDossier.case_duration_days} Days</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-dim)", display: "block" }}>Days Pending</span>
                    <strong>{selectedDossier.case_age_days} Days</strong>
                  </div>
                </div>
              </div>

              {/* Coram & Judicial Bench */}
              <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <h5 style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.65rem" }}>
                  Bench & Administrative Coram
                </h5>
                <div style={{ marginBottom: "0.5rem", fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--text-dim)", display: "block" }}>Assigned Administrative Judge</span>
                  <strong>{selectedDossier.assigned_judge}</strong>
                </div>
                <div style={{ marginBottom: "0.5rem", fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--text-dim)", display: "block" }}>Bench Coram Size</span>
                  <strong>{selectedDossier.bench_size} Judge(s)</strong>
                </div>
                <div style={{ fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--text-dim)", display: "block" }}>Sitting Judges (Coram)</span>
                  <span style={{ color: "var(--text-secondary)" }}>{selectedDossier.bench_judges}</span>
                </div>
              </div>

              {/* Source Reference */}
              <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", wordBreak: "break-all" }}>
                Source Document: <code>{selectedDossier.source_file}</code>
              </div>

              {/* Quick Actions */}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1, padding: "0.65rem" }}
                  onClick={() => {
                    if (setTargetCaseForInference) setTargetCaseForInference(selectedDossier);
                    setSelectedDossier(null);
                    setActiveTab("priority");
                  }}
                >
                  Predict Priority
                </button>
                <button
                  className="btn-secondary"
                  style={{ flex: 1, padding: "0.65rem" }}
                  onClick={() => {
                    if (setTargetCaseForInference) setTargetCaseForInference(selectedDossier);
                    setSelectedDossier(null);
                    setActiveTab("duration");
                  }}
                >
                  Duration Scheduler (CCDS)
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      <JudicialNotice />
    </div>
  );
}
