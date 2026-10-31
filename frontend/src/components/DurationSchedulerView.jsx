import React, { useState, useEffect } from "react";
import { predictDuration } from "../services/api";
import { Clock, TrendingUp, CheckCircle, HelpCircle, BarChart3, ChevronRight } from "lucide-react";
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

export default function DurationSchedulerView({ targetCase }) {
  const [caseType, setCaseType] = useState("Civil Appeal - Property");
  const [caseYear, setCaseYear] = useState(1968);
  const [numHearings, setNumHearings] = useState(6);
  const [benchSize, setBenchSize] = useState(2);

  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (targetCase) {
      if (targetCase.case_type) setCaseType(targetCase.case_type);
      if (targetCase.case_year) setCaseYear(targetCase.case_year);
      if (targetCase.num_hearings || targetCase.hearings) setNumHearings(targetCase.num_hearings || targetCase.hearings);
      if (targetCase.bench_size) setBenchSize(targetCase.bench_size);
      handleForecast(
        targetCase.case_type,
        targetCase.case_year,
        targetCase.num_hearings || targetCase.hearings,
        targetCase.bench_size
      );
    } else {
      handleForecast("Civil Appeal - Property", 1968, 6, 2);
    }
  }, [targetCase]);

  const handleForecast = async (
    cType = caseType,
    cYear = caseYear,
    nHear = numHearings,
    bSize = benchSize
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictDuration({
        case_type: cType,
        case_year: Number(cYear),
        num_hearings: Number(nHear),
        bench_size: Number(bSize),
      });
      setForecast(res);
    } catch (err) {
      setError(err.message || "Duration forecasting failed.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleForecast();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Court Case Duration Scheduler (CCDS)</h2>
          <p>Linear Regression estimating case disposal timelines in days, months, and years.</p>
        </div>
        <div className="status-badge">
          <span>Linear Regression v1.0</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr", gap: "2rem", marginBottom: "2rem" }}>
        {/* Input Form Panel */}
        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <Clock size={18} style={{ color: "var(--accent-gold)" }} />
              <span>Case Scheduling Parameters</span>
            </div>
          </div>

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label className="form-label">Substantive Case Category</label>
              <select
                className="form-select"
                value={caseType}
                onChange={(e) => setCaseType(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  Estimated Hearing Sessions
                </label>
                <span style={{ fontWeight: 700, color: "var(--accent-blue)" }}>{numHearings}</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                value={numHearings}
                onChange={(e) => setNumHearings(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--accent-blue)" }}
              />
              <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                Expected court hearing sessions prior to final disposal
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Coram (Bench Size)</label>
              <select
                className="form-select"
                value={benchSize}
                onChange={(e) => setBenchSize(Number(e.target.value))}
              >
                <option value={1}>Single Judge Bench (1)</option>
                <option value={2}>Division Bench (2)</option>
                <option value={3}>Full Bench (3)</option>
                <option value={5}>Constitution Bench (5)</option>
                <option value={7}>Larger Bench (7+)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Filing Institution Year</label>
              <input
                type="number"
                className="form-input"
                min="1950"
                max="2026"
                value={caseYear}
                onChange={(e) => setCaseYear(Number(e.target.value))}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: "100%", justifyContent: "center", marginTop: "1rem" }}
            >
              {loading ? "Forecasting Duration..." : "Estimate Disposal Timeline"}
            </button>
          </form>
        </div>

        {/* Prediction Results Panel */}
        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <TrendingUp size={18} style={{ color: "var(--accent-green)" }} />
              <span>Estimated Disposal Timeline</span>
            </div>
            {forecast && (
              <span className="status-badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--accent-green)" }}>
                Calculated
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)" }}>
              <Clock size={36} className="spin-slow" style={{ color: "var(--accent-gold)", marginBottom: "1rem" }} />
              <p>Computing linear regression estimates...</p>
            </div>
          ) : error ? (
            <div style={{ color: "var(--accent-crimson)", padding: "1.5rem", background: "var(--accent-crimson-bg)", borderRadius: "var(--radius-md)" }}>
              {error}
            </div>
          ) : !forecast ? null : (
            <div>
              {/* Big Metric Badges */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "var(--radius-md)", padding: "1.25rem", textAlign: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--accent-blue)", textTransform: "uppercase", fontWeight: 700 }}>
                    Estimated Days
                  </span>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", marginTop: "0.2rem" }}>
                    {forecast.predicted_days.toLocaleString()}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Calendar Days</span>
                </div>

                <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "var(--radius-md)", padding: "1.25rem", textAlign: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--accent-gold)", textTransform: "uppercase", fontWeight: 700 }}>
                    Estimated Months
                  </span>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", marginTop: "0.2rem" }}>
                    {forecast.predicted_months}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Court Months</span>
                </div>

                <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "var(--radius-md)", padding: "1.25rem", textAlign: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--accent-green)", textTransform: "uppercase", fontWeight: 700 }}>
                    Estimated Years
                  </span>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", marginTop: "0.2rem" }}>
                    {forecast.predicted_years}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Disposal Horizon</span>
                </div>
              </div>

              {/* Summary Statement */}
              <div style={{ background: "rgba(255,255,255,0.02)", padding: "1.2rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", marginBottom: "1.5rem" }}>
                <h5 style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Case Assessment Summary:
                </h5>
                <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  A <strong>{forecast.case_type}</strong> requiring <strong>{forecast.num_hearings}</strong> hearings before a <strong>{forecast.bench_size}-judge</strong> bench is forecast to take approximately <strong>{forecast.predicted_days} days</strong> ({forecast.predicted_years} years) from filing to final judgment.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <JudicialNotice />
    </div>
  );
}

