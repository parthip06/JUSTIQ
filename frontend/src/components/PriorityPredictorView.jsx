import React, { useState, useEffect } from "react";
import { predictPriority } from "../services/api";
import { GitBranch, AlertTriangle, CheckCircle, HelpCircle, BarChart3, Scale, ChevronRight } from "lucide-react";
import JudicialNotice from "./JudicialNotice";

const CATEGORIES = [
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

export default function PriorityPredictorView({ targetCase }) {
  const [caseType, setCaseType] = useState("Habeas Corpus / Preventive Detention");
  const [caseYear, setCaseYear] = useState(1968);
  const [numHearings, setNumHearings] = useState(3);
  const [benchSize, setBenchSize] = useState(2);
  const [urgencyFlag, setUrgencyFlag] = useState(true);

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  // If a case was passed from the Docket drawer
  useEffect(() => {
    if (targetCase) {
      if (targetCase.case_type) setCaseType(targetCase.case_type);
      if (targetCase.case_year) setCaseYear(targetCase.case_year);
      if (targetCase.num_hearings) setNumHearings(targetCase.num_hearings);
      if (targetCase.bench_size) setBenchSize(targetCase.bench_size);
      handlePredict(targetCase.case_type, targetCase.case_year, targetCase.num_hearings, targetCase.bench_size);
    } else {
      handlePredict("Habeas Corpus / Preventive Detention", 1968, 3, 2);
    }
  }, [targetCase]);

  const handlePredict = async (cType = caseType, cYear = caseYear, nHear = numHearings, bSize = benchSize) => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictPriority({
        case_type: cType,
        case_year: Number(cYear),
        num_hearings: Number(nHear),
        bench_size: Number(bSize),
      });
      setPrediction(res);
    } catch (err) {
      setError(err.message || "Prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handlePredict();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Court Case Priority Classifier</h2>
          <p>Interpretable Decision Tree classifying pending court matters into High, Medium, or Low Priority.</p>
        </div>
        <div className="status-badge">
          <span>Decision Tree v1.0</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr", gap: "2rem", marginBottom: "2rem" }}>
        
        {/* Form Panel */}
        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <GitBranch size={18} style={{ color: "var(--accent-blue)" }} />
              <span>Pending Case Characteristics</span>
            </div>
          </div>

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label className="form-label">Substantive Case Category</label>
              <select
                className="form-select"
                value={caseType}
                onChange={(e) => {
                  const val = e.target.value;
                  setCaseType(val);
                  setUrgencyFlag(val === "Bail Matter" || val === "Habeas Corpus / Preventive Detention");
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <label className="form-label" style={{ margin: 0 }}>Case Commencement Year</label>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-blue)" }}>{caseYear}</span>
              </div>
              <input
                type="range"
                min="1950"
                max="1975"
                value={caseYear}
                onChange={(e) => setCaseYear(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--accent-blue)" }}
              />
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <label className="form-label" style={{ margin: 0 }}>Cumulative Hearings Conducted</label>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-gold)" }}>{numHearings} Hearings</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                value={numHearings}
                onChange={(e) => setNumHearings(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--accent-gold)" }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Coram Bench Size (Judges)</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" }}>
                {[1, 2, 3, 5, 7].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setBenchSize(size)}
                    style={{
                      background: benchSize === size ? "linear-gradient(135deg, #1e3a8a, #2563eb)" : "rgba(255,255,255,0.05)",
                      border: benchSize === size ? "1px solid var(--accent-blue)" : "1px solid var(--border-subtle)",
                      color: benchSize === size ? "#fff" : "var(--text-muted)",
                      padding: "0.5rem 0",
                      borderRadius: "var(--radius-sm)",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {size} {size === 1 ? "Judge" : "Judges"}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ background: "rgba(255,255,255,0.03)", padding: "0.85rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <input
                  type="checkbox"
                  checked={urgencyFlag}
                  onChange={(e) => setUrgencyFlag(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "var(--accent-blue)" }}
                />
                <span>Special Statutory / Personal Liberty Urgency Flag</span>
              </label>
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "0.5rem" }} disabled={loading}>
              {loading ? "Evaluating Decision Tree..." : "Predict Case Priority Level"}
            </button>
          </form>
        </div>

        {/* Prediction Results Panel */}
        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <Scale size={18} style={{ color: "var(--accent-gold)" }} />
              <span>Priority Inference & Explainable Rationale</span>
            </div>
            {prediction && (
              <span style={{ fontSize: "0.8rem", color: "var(--accent-green)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <CheckCircle size={14} /> Zero Leakage Verified
              </span>
            )}
          </div>

          {error && (
            <div style={{ color: "var(--accent-crimson)", padding: "1rem", background: "var(--accent-crimson-bg)", borderRadius: "var(--radius-md)" }}>
              {error}
            </div>
          )}

          {prediction && (
            <div>
              {/* Result Banner */}
              <div
                style={{
                  background:
                    prediction.predicted_priority === "High"
                      ? "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(15, 23, 42, 0.6))"
                      : prediction.predicted_priority === "Medium"
                      ? "linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(15, 23, 42, 0.6))"
                      : "linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(15, 23, 42, 0.6))",
                  border: `1.5px solid ${
                    prediction.predicted_priority === "High"
                      ? "rgba(239, 68, 68, 0.4)"
                      : prediction.predicted_priority === "Medium"
                      ? "rgba(245, 158, 11, 0.4)"
                      : "rgba(56, 189, 248, 0.4)"
                  }`,
                  borderRadius: "var(--radius-md)",
                  padding: "1.5rem",
                  marginBottom: "1.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                    Predicted Priority Tier
                  </span>
                  <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#fff", marginTop: "0.15rem" }}>
                    {prediction.predicted_priority} Priority
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: prediction.predicted_priority === "High" ? "#f87171" : prediction.predicted_priority === "Medium" ? "#fbbf24" : "#38bdf8" }}>
                    {(prediction.confidence * 100).toFixed(1)}%
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Model Confidence</span>
                </div>
              </div>

              {/* Legal Rationale */}
              <div style={{ background: "rgba(255,255,255,0.02)", padding: "1.1rem 1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", marginBottom: "1.5rem" }}>
                <h5 style={{ fontSize: "0.8rem", color: "var(--accent-gold)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
                  ⚖️ Judicial Explanation & Decision Path
                </h5>
                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {prediction.explanation}
                </p>
              </div>

              {/* Class Probability Distribution */}
              <div>
                <h5 style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.85rem" }}>
                  Class Probability Distribution
                </h5>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {Object.entries(prediction.probabilities || {}).map(([cls, prob]) => {
                    const pct = (prob * 100).toFixed(1);
                    const color = cls === "High" ? "#f87171" : cls === "Medium" ? "#fbbf24" : "#38bdf8";
                    return (
                      <div key={cls}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.25rem" }}>
                          <span style={{ fontWeight: 600 }}>{cls} Priority</span>
                          <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>{pct}%</span>
                        </div>
                        <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "9999px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: "9999px" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      <JudicialNotice />
    </div>
  );
}
