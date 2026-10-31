import React, { useState, useEffect } from "react";
import { prioritizeCases } from "../services/api";
import { ListOrdered, Sliders, Download, Sparkles, Scale, Clock, AlertTriangle, ShieldCheck, History } from "lucide-react";
import JudicialNotice from "./JudicialNotice";

const POLICY_PRESETS = [
  {
    name: "⚖️ Balanced Policy (Standard)",
    desc: "Even distribution balancing urgency, age, and progress",
    weights: { p: 40, a: 25, h: 15, d: 10, u: 10 },
  },
  {
    name: "🚨 Liberty & Emergency First",
    desc: "Emphasizes fundamental rights, Bail & Habeas Corpus",
    weights: { p: 40, a: 10, h: 10, d: 5, u: 35 },
  },
  {
    name: "⏳ Clear Oldest Backlog",
    desc: "Prioritizes long-pending cases to prevent backlog stagnation",
    weights: { p: 20, a: 50, h: 20, d: 5, u: 5 },
  },
  {
    name: "⚡ Fast-Track Disposals",
    desc: "Disposes quick matters rapidly to free up courtroom benches",
    weights: { p: 25, a: 15, h: 10, d: 40, u: 10 },
  },
];

export default function PrioritizationAgentView({ setActiveTab }) {
  // Configurable Weights
  const [priorityWeight, setPriorityWeight] = useState(40);
  const [ageWeight, setAgeWeight] = useState(25);
  const [hearingsWeight, setHearingsWeight] = useState(15);
  const [durationWeight, setDurationWeight] = useState(10);
  const [urgencyWeight, setUrgencyWeight] = useState(10);
  const [activePreset, setActivePreset] = useState("⚖️ Balanced Policy (Standard)");

  const [cohortSize, setCohortSize] = useState(300);
  const [useML, setUseML] = useState(true);

  const [loading, setLoading] = useState(false);
  const [rankedData, setRankedData] = useState(null);
  const [error, setError] = useState(null);

  // Compute normalized weights
  const totalWeight = priorityWeight + ageWeight + hearingsWeight + durationWeight + urgencyWeight || 1;
  const normWeights = {
    priority_weight: priorityWeight / totalWeight,
    age_weight: ageWeight / totalWeight,
    hearings_weight: hearingsWeight / totalWeight,
    duration_weight: durationWeight / totalWeight,
    urgency_weight: urgencyWeight / totalWeight,
  };

  const applyPreset = (preset) => {
    setActivePreset(preset.name);
    setPriorityWeight(preset.weights.p);
    setAgeWeight(preset.weights.a);
    setHearingsWeight(preset.weights.h);
    setDurationWeight(preset.weights.d);
    setUrgencyWeight(preset.weights.u);
  };

  const handleRank = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await prioritizeCases({
        cohort_size: Number(cohortSize),
        use_ml_predictions: useML,
        weights: normWeights,
      });
      setRankedData(res);
    } catch (err) {
      setError(err.message || "Prioritization calculation failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRank();
  }, []);

  const downloadCSV = () => {
    if (!rankedData || !rankedData.cases) return;
    const headers = ["Rank", "Case ID", "Category", "Priority", "Urgency Score", "Days Pending", "Est Duration Days", "Hearings", "Assigned Judge"];
    const rows = rankedData.cases.map((c) => [
      c.priority_rank,
      c.case_id,
      `"${c.case_type}"`,
      c.effective_priority,
      c.composite_score,
      c.case_age_days,
      c.effective_duration_days,
      c.num_hearings,
      c.assigned_judge,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `court_case_prioritized_cohort_${cohortSize}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Court Case Prioritization Agent (CCPA)</h2>
          <p>Transparent multi-factor ranking balancing legal urgency, case seniority, duration, and statutory protections.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn-primary" onClick={downloadCSV} disabled={!rankedData}>
            <Download size={16} /> Export Prioritized Queue (CSV)
          </button>
        </div>
      </div>

      {/* Policy & Weight Controls Panel */}
      <div className="panel-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        
        {/* Panel Header */}
        <div className="panel-header" style={{ marginBottom: "1rem" }}>
          <div className="panel-title">
            <Sliders size={18} style={{ color: "var(--accent-gold)" }} />
            <span>Prioritization Criteria & Policy Controls</span>
          </div>
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Normalized Total: <strong style={{ color: "var(--accent-green)" }}>100%</strong>
          </span>
        </div>

        {/* 1-Click Policy Presets */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            1-Click Administrative Policy Presets:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.6rem" }}>
            {POLICY_PRESETS.map((preset) => {
              const isSelected = activePreset === preset.name;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  style={{
                    background: isSelected ? "rgba(56, 189, 248, 0.12)" : "rgba(255, 255, 255, 0.03)",
                    border: isSelected ? "1.5px solid var(--accent-blue)" : "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "0.65rem 0.85rem",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: "0.82rem", color: isSelected ? "var(--accent-blue)" : "var(--text-primary)" }}>
                    {preset.name}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "2px", lineHeight: 1.3 }}>
                    {preset.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Individual Factor Cards with Plain-Language Descriptions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          
          {/* Factor 1: Priority Tier */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
              <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Legal Priority Tier
              </span>
              <strong style={{ color: "var(--accent-blue)", fontSize: "0.95rem" }}>
                {((normWeights.priority_weight) * 100).toFixed(0)}%
              </strong>
            </div>
            <p style={{ fontSize: "0.74rem", color: "var(--text-dim)", margin: "0 0 0.75rem 0", lineHeight: 1.35 }}>
              Constitutional importance & legal tier (High, Med, Low).
            </p>
            <input
              type="range"
              min="0"
              max="100"
              value={priorityWeight}
              onChange={(e) => {
                setActivePreset("Custom");
                setPriorityWeight(Number(e.target.value));
              }}
              style={{ width: "100%", accentColor: "var(--accent-blue)" }}
            />
          </div>

          {/* Factor 2: Case Age / Pendency */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
              <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Seniority (Case Age)
              </span>
              <strong style={{ color: "var(--accent-gold)", fontSize: "0.95rem" }}>
                {((normWeights.age_weight) * 100).toFixed(0)}%
              </strong>
            </div>
            <p style={{ fontSize: "0.74rem", color: "var(--text-dim)", margin: "0 0 0.75rem 0", lineHeight: 1.35 }}>
              Days pending since filing — prevents case starvation.
            </p>
            <input
              type="range"
              min="0"
              max="100"
              value={ageWeight}
              onChange={(e) => {
                setActivePreset("Custom");
                setAgeWeight(Number(e.target.value));
              }}
              style={{ width: "100%", accentColor: "var(--accent-gold)" }}
            />
          </div>

          {/* Factor 3: Hearings Progress */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
              <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Hearings Progress
              </span>
              <strong style={{ color: "var(--accent-green)", fontSize: "0.95rem" }}>
                {((normWeights.hearings_weight) * 100).toFixed(0)}%
              </strong>
            </div>
            <p style={{ fontSize: "0.74rem", color: "var(--text-dim)", margin: "0 0 0.75rem 0", lineHeight: 1.35 }}>
              Hearings conducted — cases nearing final resolution.
            </p>
            <input
              type="range"
              min="0"
              max="100"
              value={hearingsWeight}
              onChange={(e) => {
                setActivePreset("Custom");
                setHearingsWeight(Number(e.target.value));
              }}
              style={{ width: "100%", accentColor: "var(--accent-green)" }}
            />
          </div>

          {/* Factor 4: Fast-Track Duration */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
              <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Fast-Track Disposals
              </span>
              <strong style={{ color: "#a855f7", fontSize: "0.95rem" }}>
                {((normWeights.duration_weight) * 100).toFixed(0)}%
              </strong>
            </div>
            <p style={{ fontSize: "0.74rem", color: "var(--text-dim)", margin: "0 0 0.75rem 0", lineHeight: 1.35 }}>
              Shorter estimated duration — disposes swift matters.
            </p>
            <input
              type="range"
              min="0"
              max="100"
              value={durationWeight}
              onChange={(e) => {
                setActivePreset("Custom");
                setDurationWeight(Number(e.target.value));
              }}
              style={{ width: "100%", accentColor: "#a855f7" }}
            />
          </div>

          {/* Factor 5: Statutory Liberty */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
              <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Liberty Protection
              </span>
              <strong style={{ color: "#f87171", fontSize: "0.95rem" }}>
                {((normWeights.urgency_weight) * 100).toFixed(0)}%
              </strong>
            </div>
            <p style={{ fontSize: "0.74rem", color: "var(--text-dim)", margin: "0 0 0.75rem 0", lineHeight: 1.35 }}>
              Fundamental rights bonus (Bail & Habeas Corpus).
            </p>
            <input
              type="range"
              min="0"
              max="100"
              value={urgencyWeight}
              onChange={(e) => {
                setActivePreset("Custom");
                setUrgencyWeight(Number(e.target.value));
              }}
              style={{ width: "100%", accentColor: "#f87171" }}
            />
          </div>

        </div>

        {/* Bottom Actions Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.75rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", cursor: "pointer" }}>
              <input type="checkbox" checked={useML} onChange={(e) => setUseML(e.target.checked)} />
              <span>Auto-Classify Priority with AI</span>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Queue Batch Size:</span>
              <select className="form-select" value={cohortSize} onChange={(e) => setCohortSize(Number(e.target.value))} style={{ padding: "0.35rem 0.65rem", width: "120px" }}>
                <option value={100}>100 Cases</option>
                <option value={250}>250 Cases</option>
                <option value={300}>300 Cases</option>
                <option value={500}>500 Cases</option>
                <option value={1000}>1,000 Cases</option>
              </select>
            </div>
          </div>

          <button className="btn-primary" onClick={handleRank} disabled={loading} style={{ padding: "0.6rem 1.4rem" }}>
            {loading ? "Re-Ranking Queue..." : "Recalculate Priorities"}
          </button>
        </div>
      </div>

      {/* Summary KPI Highlights */}
      {rankedData && rankedData.summary && (
        <div className="kpi-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="kpi-card" style={{ padding: "1rem 1.25rem" }}>
            <span className="kpi-card-title">Active Docket Queue</span>
            <div className="kpi-card-value" style={{ fontSize: "1.6rem" }}>{rankedData.total_ranked}</div>
            <div className="kpi-card-subtitle">Pending Cases Evaluated</div>
          </div>
          <div className="kpi-card" style={{ padding: "1rem 1.25rem" }}>
            <span className="kpi-card-title">High Priority Cases</span>
            <div className="kpi-card-value" style={{ fontSize: "1.6rem", color: "#f87171" }}>{rankedData.summary.high_priority_count}</div>
            <div className="kpi-card-subtitle">{((rankedData.summary.high_priority_count / rankedData.total_ranked) * 100).toFixed(1)}% of Queue</div>
          </div>
          <div className="kpi-card" style={{ padding: "1rem 1.25rem" }}>
            <span className="kpi-card-title">Highest Urgency Score</span>
            <div className="kpi-card-value" style={{ fontSize: "1.6rem", color: "var(--accent-gold)" }}>{rankedData.summary.top_score}</div>
            <div className="kpi-card-subtitle">Peak Urgency in Docket</div>
          </div>
          <div className="kpi-card" style={{ padding: "1rem 1.25rem" }}>
            <span className="kpi-card-title">Average Urgency Score</span>
            <div className="kpi-card-value" style={{ fontSize: "1.6rem" }}>{rankedData.summary.avg_score}</div>
            <div className="kpi-card-subtitle">Docket Mean (0–100 Scale)</div>
          </div>
        </div>
      )}

      {/* Ranked Queue Table */}
      <div className="panel-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-responsive">
          <table className="court-table">
            <thead>
              <tr>
                <th style={{ width: "70px" }}>Rank</th>
                <th>Case ID</th>
                <th>Substantive Category</th>
                <th>Priority</th>
                <th>Urgency Score</th>
                <th>Days Pending</th>
                <th>Est Duration</th>
                <th>Hearings</th>
                <th>Designated Judge</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "3rem" }}>
                    <div style={{ color: "var(--accent-blue)" }}>Synthesizing Multi-Factor Ranking...</div>
                  </td>
                </tr>
              ) : !rankedData || rankedData.cases.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                    No ranked cases. Click Recalculate Priorities above.
                  </td>
                </tr>
              ) : (
                rankedData.cases.map((c) => (
                  <tr key={c.case_id}>
                    <td>
                      <span style={{ fontWeight: 800, color: c.priority_rank <= 10 ? "var(--accent-gold)" : "var(--text-dim)" }}>
                        #{c.priority_rank}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "var(--accent-blue)" }}>{c.case_id}</strong>
                    </td>
                    <td style={{ fontWeight: 600 }}>{c.case_type}</td>
                    <td>
                      <span className={`badge-priority badge-${c.effective_priority.toLowerCase()}`}>
                        {c.effective_priority}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <strong style={{ fontSize: "0.95rem", color: c.composite_score >= 60 ? "#f87171" : c.composite_score >= 40 ? "#fbbf24" : "#38bdf8" }}>
                          {c.composite_score}
                        </strong>
                        <div style={{ width: "45px", height: "5px", background: "rgba(255,255,255,0.05)", borderRadius: "9999px" }}>
                          <div style={{ width: `${c.composite_score}%`, height: "100%", background: c.composite_score >= 60 ? "#f87171" : c.composite_score >= 40 ? "#fbbf24" : "#38bdf8", borderRadius: "9999px" }} />
                        </div>
                      </div>
                    </td>
                    <td>{c.case_age_days.toLocaleString()} Days</td>
                    <td>{c.effective_duration_days} Days</td>
                    <td>{c.num_hearings}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{c.assigned_judge}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <JudicialNotice />
    </div>
  );
}
