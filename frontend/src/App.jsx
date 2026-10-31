import React, { useState } from "react";
import Navbar from "./components/Navbar";
import DashboardView from "./components/DashboardView";
import CaseDocketView from "./components/CaseDocketView";
import PriorityPredictorView from "./components/PriorityPredictorView";
import DurationSchedulerView from "./components/DurationSchedulerView";
import PrioritizationAgentView from "./components/PrioritizationAgentView";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [targetCase, setTargetCase] = useState(null);

  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        {activeTab === "dashboard" && <DashboardView setActiveTab={setActiveTab} />}
        {activeTab === "docket" && (
          <CaseDocketView
            setActiveTab={setActiveTab}
            setTargetCaseForInference={setTargetCase}
          />
        )}
        {activeTab === "priority" && <PriorityPredictorView targetCase={targetCase} />}
        {activeTab === "duration" && <DurationSchedulerView targetCase={targetCase} />}
        {activeTab === "prioritization" && <PrioritizationAgentView setActiveTab={setActiveTab} />}
      </main>
    </div>
  );
}
