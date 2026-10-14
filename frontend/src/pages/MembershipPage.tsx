import type { CSSProperties } from "react";
import type { NavPage } from "../components/layout/Navbar";

interface MembershipPageProps {
  onNavigate: (page: NavPage) => void;
}

export function MembershipPage({ onNavigate }: MembershipPageProps) {
  return (
    <div style={styles.page}>
      {/* Header Banner */}
      <section style={styles.headerSection}>
        <div style={styles.container}>
          <div style={styles.headerContent}>
            <span style={styles.headerBadge}>Patron Memberships</span>
            <h1 style={styles.title}>Library Membership Plans</h1>
            <p style={styles.subtitle}>
              SmartLib offers two dedicated membership options designed to
              support your reading habits and research requirements. Choose the
              tier that best aligns with your academic journey.
            </p>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section style={styles.plansSection}>
        <div style={styles.container}>
          <div style={styles.plansGrid}>
            {/* Plan 1: Book Borrowing Only */}
            <article style={styles.planCard}>
              <div style={styles.cardTop}>
                <span style={styles.planBadgeStandard}>Standard Plan</span>
                <h2 style={styles.planTitle}>Book Borrowing Only</h2>
                <p style={styles.planDescription}>
                  Tailored for active readers and students seeking physical book
                  circulation from our catalogued library collection.
                </p>
              </div>

              <div style={styles.featuresBlock}>
                <h3 style={styles.featuresHeading}>Included Privileges:</h3>
                <ul style={styles.featureList}>
                  <li style={styles.featureItem}>
                    <span style={styles.checkIcon}>✓</span>
                    <span>
                      <strong>Physical Book Loans:</strong> Borrow books from the
                      general and academic catalogue.
                    </span>
                  </li>
                  <li style={styles.featureItem}>
                    <span style={styles.checkIcon}>✓</span>
                    <span>
                      <strong>14-Day Lending Period:</strong> Standard loan
                      duration with renewal eligibility.
                    </span>
                  </li>
                  <li style={styles.featureItem}>
                    <span style={styles.checkIcon}>✓</span>
                    <span>
                      <strong>Online Catalogue Search:</strong> Real-time access
                      to catalogued titles, authors, and categories.
                    </span>
                  </li>
                  <li style={styles.featureItem}>
                    <span style={styles.checkIcon}>✓</span>
                    <span>
                      <strong>Student Dashboard:</strong> Monitor borrowed
                      copies, return deadlines, and issue history.
                    </span>
                  </li>
                </ul>
              </div>

              <div style={styles.cardAction}>
                <button
                  type="button"
                  onClick={() => onNavigate("register")}
                  style={styles.standardButton}
                >
                  Get Started with Borrowing →
                </button>
              </div>
            </article>

            {/* Plan 2: Combo: Book Borrowing + Reading Room Access */}
            <article style={{ ...styles.planCard, ...styles.featuredCard }}>
              <div style={styles.cardTop}>
                <span style={styles.planBadgeCombo}>
                  Recommended • Full Access
                </span>
                <h2 style={styles.planTitle}>
                  Combo: Book Borrowing + Reading Room Access
                </h2>
                <p style={styles.planDescription}>
                  Our premier option combining physical book circulation with
                  dedicated quiet reading room facilities for in-depth focus.
                </p>
              </div>

              <div style={styles.featuresBlock}>
                <h3 style={styles.featuresHeading}>
                  Everything in Book Borrowing, plus:
                </h3>
                <ul style={styles.featureList}>
                  <li style={styles.featureItem}>
                    <span style={styles.checkIconPurple}>✓</span>
                    <span>
                      <strong>Reading Room Access:</strong> Guaranteed entry to
                      dedicated silent reading rooms and study zones.
                    </span>
                  </li>
                  <li style={styles.featureItem}>
                    <span style={styles.checkIconPurple}>✓</span>
                    <span>
                      <strong>Individual Study Desks:</strong> Comfortable,
                      equipped desk space for long study and research blocks.
                    </span>
                  </li>
                  <li style={styles.featureItem}>
                    <span style={styles.checkIconPurple}>✓</span>
                    <span>
                      <strong>On-Site Reference Material:</strong> Immediate
                      access to non-circulating reference volumes.
                    </span>
                  </li>
                  <li style={styles.featureItem}>
                    <span style={styles.checkIconPurple}>✓</span>
                    <span>
                      <strong>Full Circulation Rights:</strong> Home book
                      borrowing privileges with digital tracking.
                    </span>
                  </li>
                  <li style={styles.featureItem}>
                    <span style={styles.checkIconPurple}>✓</span>
                    <span>
                      <strong>Priority Assistance:</strong> Circulation desk
                      support for research inquiries.
                    </span>
                  </li>
                </ul>
              </div>

              <div style={styles.cardAction}>
                <button
                  type="button"
                  onClick={() => onNavigate("register")}
                  style={styles.comboButton}
                >
                  Select Combo Plan →
                </button>
              </div>
            </article>
          </div>

          {/* Verification and Administration Notice */}
          <div style={styles.noticeBox}>
            <div style={styles.noticeIcon}>ℹ️</div>
            <div>
              <h4 style={styles.noticeHeading}>
                Membership Guidelines & Enrollment
              </h4>
              <p style={styles.noticeText}>
                Membership activation and plan allocation are managed in
                accordance with library administration regulations. To sign up,
                create a student account or visit the circulation desk for
                patron verification.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  headerSection: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    padding: "50px 20px",
    borderBottom: "1px solid #1e293b",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  headerContent: {
    maxWidth: "760px",
  },
  headerBadge: {
    display: "inline-block",
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    color: "#a5b4fc",
    border: "1px solid rgba(165, 180, 252, 0.3)",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
    marginBottom: "14px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  title: {
    fontSize: "34px",
    fontWeight: 800,
    color: "#ffffff",
    margin: "0 0 12px",
    letterSpacing: "-0.6px",
  },
  subtitle: {
    fontSize: "15px",
    color: "#94a3b8",
    lineHeight: 1.6,
    margin: 0,
  },
  plansSection: {
    backgroundColor: "#f8fafc",
    padding: "50px 20px 80px",
  },
  plansGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "30px",
    marginBottom: "40px",
    alignItems: "stretch",
  },
  planCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "36px 30px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
  },
  featuredCard: {
    border: "2px solid #6366f1",
    boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.15)",
    position: "relative",
  },
  cardTop: {
    marginBottom: "24px",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "20px",
  },
  planBadgeStandard: {
    display: "inline-block",
    backgroundColor: "#f1f5f9",
    color: "#475467",
    padding: "4px 12px",
    borderRadius: "14px",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "14px",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },
  planBadgeCombo: {
    display: "inline-block",
    backgroundColor: "#eef2ff",
    color: "#4f46e5",
    border: "1px solid #c7d2fe",
    padding: "4px 12px",
    borderRadius: "14px",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "14px",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },
  planTitle: {
    fontSize: "22px",
    fontWeight: 800,
    color: "#0f172a",
    margin: "0 0 10px",
    lineHeight: 1.3,
  },
  planDescription: {
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.6,
    margin: 0,
  },
  featuresBlock: {
    flex: "1 0 auto",
    marginBottom: "32px",
  },
  featuresHeading: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#1e293b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    margin: "0 0 16px",
  },
  featureList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  featureItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    fontSize: "14px",
    color: "#334155",
    lineHeight: 1.5,
  },
  checkIcon: {
    color: "#059669",
    fontWeight: 800,
    fontSize: "16px",
    flexShrink: 0,
    marginTop: "1px",
  },
  checkIconPurple: {
    color: "#4f46e5",
    fontWeight: 800,
    fontSize: "16px",
    flexShrink: 0,
    marginTop: "1px",
  },
  cardAction: {
    marginTop: "auto",
  },
  standardButton: {
    width: "100%",
    backgroundColor: "#f8fafc",
    color: "#1e293b",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "13px 20px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "background-color 0.15s",
  },
  comboButton: {
    width: "100%",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "13px 20px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.35)",
    transition: "background-color 0.15s",
  },
  noticeBox: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "24px 28px",
    display: "flex",
    gap: "18px",
    alignItems: "flex-start",
  },
  noticeIcon: {
    fontSize: "24px",
    flexShrink: 0,
  },
  noticeHeading: {
    margin: "0 0 6px",
    fontSize: "15px",
    fontWeight: 700,
    color: "#0f172a",
  },
  noticeText: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b",
    lineHeight: 1.6,
  },
};
