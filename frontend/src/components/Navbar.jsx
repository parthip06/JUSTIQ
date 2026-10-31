import React from "react";
import { Scale, BarChart3, Database, GitBranch, Clock, ListOrdered } from "lucide-react";

export default function Navbar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "docket", label: "Case Docket", icon: Database },
    { id: "priority", label: "Priority Classifier", icon: GitBranch },
    { id: "duration", label: "Duration Scheduler", icon: Clock },
    { id: "prioritization", label: "Prioritization Agent", icon: ListOrdered },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="brand-section" onClick={() => setActiveTab("dashboard")}>
          <div className="brand-crest">
            <Scale size={24} />
          </div>
          <div className="brand-titles">
            <h1 style={{ letterSpacing: "-0.01em", fontSize: "1.2rem", fontWeight: 800 }}>justiq</h1>
            <p style={{ textTransform: "none", letterSpacing: "normal", fontSize: "0.74rem", fontStyle: "italic" }}>
              Justice delayed is justice denied
            </p>
          </div>
        </div>

        <div className="nav-links">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`nav-tab ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </nav>
  );
}
