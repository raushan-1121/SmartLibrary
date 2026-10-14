import type { CSSProperties } from "react";
import type { NavPage } from "./Navbar";

interface FooterProps {
  onNavigate: (page: NavPage) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.grid}>
          {/* Brand Info */}
          <div style={styles.column}>
            <div style={styles.brand}>
              <span style={styles.logoIcon}>📚</span>
              <span style={styles.brandTitle}>SmartLib</span>
            </div>
            <p style={styles.brandDesc}>
              A modern library system dedicated to fostering learning, academic
              research, and literature discovery through seamless catalog
              access and dedicated reading room spaces.
            </p>
          </div>

          {/* Quick Links */}
          <div style={styles.column}>
            <h4 style={styles.columnTitle}>Quick Navigation</h4>
            <ul style={styles.linkList}>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("home")}
                  style={styles.linkButton}
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("catalog")}
                  style={styles.linkButton}
                >
                  Book Catalogue
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("membership")}
                  style={styles.linkButton}
                >
                  Membership Plans
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("login")}
                  style={styles.linkButton}
                >
                  Member Sign In
                </button>
              </li>
            </ul>
          </div>

          {/* Membership Highlights */}
          <div style={styles.column}>
            <h4 style={styles.columnTitle}>Membership Options</h4>
            <div style={styles.planHighlight}>
              <strong>1. Book Borrowing Only</strong>
              <p>Borrow physical book copies for personal reading.</p>
            </div>
            <div style={styles.planHighlight}>
              <strong>2. Combo: Borrowing + Reading Room</strong>
              <p>Full book borrowing privileges plus quiet study desk access.</p>
            </div>
          </div>
        </div>

        <div style={styles.bottomBar}>
          <p style={styles.copyright}>
            SmartLib © 2026. For library hours, inquiries, and registration
            assistance, please consult the library administration desk.
          </p>
        </div>
      </div>
    </footer>
  );
}

const styles: Record<string, CSSProperties> = {
  footer: {
    backgroundColor: "#0f172a",
    color: "#94a3b8",
    borderTop: "1px solid #1e293b",
    marginTop: "auto",
    width: "100%",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "48px 20px 24px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "36px",
    marginBottom: "40px",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  logoIcon: {
    fontSize: "22px",
  },
  brandTitle: {
    fontSize: "19px",
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "-0.3px",
  },
  brandDesc: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.6,
    color: "#94a3b8",
  },
  columnTitle: {
    margin: "0 0 4px",
    fontSize: "14px",
    fontWeight: 700,
    color: "#f8fafc",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  linkList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  linkButton: {
    background: "transparent",
    border: "none",
    padding: 0,
    color: "#cbd5e1",
    fontSize: "13px",
    cursor: "pointer",
    textAlign: "left",
    transition: "color 0.2s",
  },
  planHighlight: {
    backgroundColor: "#1e293b",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #334155",
    fontSize: "12px",
    color: "#e2e8f0",
  },
  bottomBar: {
    borderTop: "1px solid #1e293b",
    paddingTop: "20px",
    textAlign: "center",
  },
  copyright: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b",
    lineHeight: 1.5,
  },
};
