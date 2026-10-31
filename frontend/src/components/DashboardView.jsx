import React, { useEffect, useState } from "react";
import { fetchRegistryStats } from "../services/api";
import { Scale, Clock, Users, AlertTriangle, Layers, TrendingUp, CheckCircle2, ChevronRight, BarChart2 } from "lucide-react";
import JudicialNotice from "./JudicialNotice";

export default function DashboardView({ setActiveTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRegistryStats()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "6rem 2rem", color: "var(--text-muted)" }}>
        <Scale size={42} className="spin-slow" style={{ color: "var(--accent-blue)", marginBottom: "1rem" }} />
        <h3>Loading Judicial Registry Demographics...</h3>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="panel-card" style={{ borderColor: "var(--accent-crimson)" }}>
        <h3 style={{ color: "var(--accent-crimson)", marginBottom: "0.5rem" }}>Failed to Load Dashboard Stats</h3>
        <p style={{ color: "var(--text-muted)" }}>{error || "Make sure the FastAPI backend is running on port 8000."}</p>
      </div>
    );
  }

  const { summary, case_type_distribution, priority_distribution, duration_by_type, model_metrics } = stats;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>Judicial Registry Analytics Dashboard</h2>
          <p>Real-time analytics for 7,378 case records, machine learning performance metrics, and multi-factor prioritization.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn-secondary" onClick={() => setActiveTab("docket")}>
            Case Docket
          </button>
          <button className="btn-primary" onClick={() => setActiveTab("prioritization")}>
            Prioritization Agent <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Total Case Records</span>
            <div className="kpi-card-icon" style={{ background: "rgba(56, 189, 248, 0.15)", color: "var(--accent-blue)" }}>
              <Scale size={18} />
            </div>
          </div>
          <div className="kpi-card-value">{summary.total_records.toLocaleString()}</div>
          <div className="kpi-card-subtitle">{summary.case_categories_count} Substantive Case Categories</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Average Case Duration</span>
            <div className="kpi-card-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--accent-gold)" }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="kpi-card-value">{summary.avg_duration_days} <span style={{ fontSize: "1rem", fontWeight: 500, color: "var(--text-muted)" }}>Days</span></div>
          <div className="kpi-card-subtitle">≈ {summary.avg_duration_years} Years Disposal Cycle</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Average Hearings</span>
            <div className="kpi-card-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--accent-green)" }}>
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-card-value">{summary.avg_hearings}</div>
          <div className="kpi-card-subtitle">Proceedings Conducted Per Matter</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">High Priority Share</span>
            <div className="kpi-card-icon" style={{ background: "rgba(239, 68, 68, 0.15)", color: "var(--accent-crimson)" }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-card-value">{summary.high_priority_pct}%</div>
          <div className="kpi-card-subtitle">{summary.high_priority_count.toLocaleString()} Fundamental / Urgent Matters</div>
        </div>
      </div>

      {/* Row 1: Charts - Case Type Breakdown & Priority Tiers */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        
        {/* Case Type Distribution */}
        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <Layers size={18} style={{ color: "var(--accent-blue)" }} />
              <span>Substantive Case Category Inflow</span>
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Total: {summary.total_records.toLocaleString()}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {case_type_distribution.map((item) => {
              const pct = ((item.count / summary.total_records) * 100).toFixed(1);
              return (
                <div key={item.case_type}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{item.case_type}</span>
                    <span style={{ color: "var(--text-muted)" }}>{item.count.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div style={{ height: "7px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "9999px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, #1e3a8a 0%, #38bdf8 100%)",
                        borderRadius: "9999px",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Level Breakdown */}
        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <Scale size={18} style={{ color: "var(--accent-gold)" }} />
              <span>Priority Level Distribution</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1rem" }}>
            {priority_distribution.map((p) => {
              const colors = {
                High: { color: "#f87171", bg: "var(--accent-crimson-bg)", bar: "#ef4444" },
                Medium: { color: "#fbbf24", bg: "var(--accent-amber-bg)", bar: "#f59e0b" },
                Low: { color: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)", bar: "#38bdf8" },
              }[p.priority] || { color: "#cbd5e1", bg: "rgba(255,255,255,0.1)", bar: "#94a3b8" };

              const pct = ((p.count / summary.total_records) * 100).toFixed(1);

              return (
                <div key={p.priority} style={{ background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span className={`badge-priority badge-${p.priority.toLowerCase()}`}>
                      {p.priority} Priority
                    </span>
                    <span style={{ fontSize: "1.2rem", fontWeight: 700, color: colors.color }}>
                      {p.count.toLocaleString()} <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>({pct}%)</span>
                    </span>
                  </div>
                  <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, backgroundColor: colors.bar, borderRadius: "9999px" }} />
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* Row 2: Machine Learning Models Overview */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="panel-title">
            <TrendingUp size={18} style={{ color: "var(--accent-green)" }} />
            <span>Deployed Machine Learning Decision-Support Models</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          
          {/* Model 1 Card */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h4 style={{ color: "#38bdf8", fontSize: "1.05rem" }}>Model 1: Priority Classifier</h4>
              <span className="status-badge" style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}>Active</span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Interpretable Decision Tree classifying pending cases into High, Medium, and Low Priority without post-judgment leakage.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.85rem" }}>
              <div style={{ background: "rgba(0,0,0,0.2)", padding: "0.6rem 0.85rem", borderRadius: "var(--radius-sm)" }}>
                <span style={{ color: "var(--text-dim)", display: "block", fontSize: "0.75rem" }}>Algorithm</span>
                <strong>DecisionTree</strong>
              </div>
              <div style={{ background: "rgba(0,0,0,0.2)", padding: "0.6rem 0.85rem", borderRadius: "var(--radius-sm)" }}>
                <span style={{ color: "var(--text-dim)", display: "block", fontSize: "0.75rem" }}>Test Accuracy</span>
                <strong style={{ color: "var(--accent-green)" }}>{model_metrics?.priority?.accuracy ? `${(model_metrics.priority.accuracy * 100).toFixed(1)}%` : "59.6%"}</strong>
              </div>
              <div style={{ background: "rgba(0,0,0,0.2)", padding: "0.6rem 0.85rem", borderRadius: "var(--radius-sm)" }}>
                <span style={{ color: "var(--text-dim)", display: "block", fontSize: "0.75rem" }}>Weighted F1</span>
                <strong>{model_metrics?.priority?.f1_score || "0.5799"}</strong>
              </div>
              <div style={{ background: "rgba(0,0,0,0.2)", padding: "0.6rem 0.85rem", borderRadius: "var(--radius-sm)" }}>
                <span style={{ color: "var(--text-dim)", display: "block", fontSize: "0.75rem" }}>Tree Architecture</span>
                <strong>Max Depth 5</strong>
              </div>
            </div>
          </div>

          {/* Model 2 Card */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h4 style={{ color: "#f59e0b", fontSize: "1.05rem" }}>Model 2: Duration Predictor</h4>
              <span className="status-badge" style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}>Active</span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Linear Regression ONLY estimating case disposal timeline in days, months, and years from pre-judgment features.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.85rem" }}>
              <div style={{ background: "rgba(0,0,0,0.2)", padding: "0.6rem 0.85rem", borderRadius: "var(--radius-sm)" }}>
                <span style={{ color: "var(--text-dim)", display: "block", fontSize: "0.75rem" }}>Algorithm</span>
                <strong>LinearRegression</strong>
              </div>
              <div style={{ background: "rgba(0,0,0,0.2)", padding: "0.6rem 0.85rem", borderRadius: "var(--radius-sm)" }}>
                <span style={{ color: "var(--text-dim)", display: "block", fontSize: "0.75rem" }}>MAE (Mean Error)</span>
                <strong style={{ color: "var(--accent-gold)" }}>{model_metrics?.duration?.mae_days || "364.7"} Days</strong>
              </div>
              <div style={{ background: "rgba(0,0,0,0.2)", padding: "0.6rem 0.85rem", borderRadius: "var(--radius-sm)" }}>
                <span style={{ color: "var(--text-dim)", display: "block", fontSize: "0.75rem" }}>RMSE</span>
                <strong>{model_metrics?.duration?.rmse_days || "448.3"} Days</strong>
              </div>
              <div style={{ background: "rgba(0,0,0,0.2)", padding: "0.6rem 0.85rem", borderRadius: "var(--radius-sm)" }}>
                <span style={{ color: "var(--text-dim)", display: "block", fontSize: "0.75rem" }}>R² Goodness-of-Fit</span>
                <strong>{model_metrics?.duration?.r2_score || "0.4284"}</strong>
              </div>
            </div>
          </div>

        </div>
      </div>

      <JudicialNotice />
    </div>
  );
}
