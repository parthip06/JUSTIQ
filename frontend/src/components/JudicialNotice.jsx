import React from "react";
import { AlertCircle } from "lucide-react";

export default function JudicialNotice({ customText }) {
  return (
    <div className="judicial-notice">
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
        <AlertCircle size={18} style={{ color: "var(--accent-gold)", flexShrink: 0, marginTop: "2px" }} />
        <div>
          <strong>ACADEMIC DECISION-SUPPORT NOTICE:</strong>{" "}
          {customText || (
            "This platform is an academic machine learning decision-support prototype designed to assist court registrars and registry administrators. It does not replace judges, automate judicial discretion, or represent official court cause lists. All simulated operational fields are preserved strictly for academic algorithmic validation."
          )}
        </div>
      </div>
    </div>
  );
}
