import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Component, ReactNode } from "react";
import { LangProvider } from "./lib/i18n";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#f3f4f6", padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "24px", maxWidth: "320px", width: "100%", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚠️</div>
            <h2 style={{ color: "#1f2937", fontWeight: "bold", marginBottom: "8px" }}>Une erreur s'est produite</h2>
            <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "20px" }}>Veuillez rafraîchir la page.</p>
            <button
              onClick={() => window.location.reload()}
              style={{ background: "#3db51d", color: "white", border: "none", borderRadius: "999px", padding: "12px 32px", fontWeight: "bold", cursor: "pointer", width: "100%" }}
            >
              Rafraîchir
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

document.addEventListener("contextmenu", (e) => {
  if ((e.target as HTMLElement).tagName === "IMG") {
    e.preventDefault();
  }
});

document.addEventListener("dragstart", (e) => {
  if ((e.target as HTMLElement).tagName === "IMG") {
    e.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <LangProvider>
      <App />
    </LangProvider>
  </ErrorBoundary>
);
