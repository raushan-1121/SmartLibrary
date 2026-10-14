import type { CSSProperties } from "react";
import type { NavPage } from "../components/layout/Navbar";

interface HomePageProps {
  onNavigate: (page: NavPage) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div style={styles.page}>
      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroContent}>
          <div style={styles.badge}>📚 Smart Library Management</div>
          <h1 style={styles.heroTitle}>
            Discover, Learn, and Grow with SmartLib
          </h1>
          <p style={styles.heroSubtitle}>
            Your modern gateway to academic and literary knowledge. Explore
            our curated book catalogue, track active copies, and choose the
            membership plan designed for your study goals.
          </p>

          <div style={styles.heroActions}>
            <button
              type="button"
              onClick={() => onNavigate("catalog")}
              style={styles.primaryCta}
            >
              📖 Explore Catalogue
            </button>
            <button
              type="button"
              onClick={() => onNavigate("membership")}
              style={styles.secondaryCta}
            >
              💳 View Membership Plans
            </button>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section style={styles.section}>
        <div style={styles.container}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Why Choose SmartLib</h2>
            <p style={styles.sectionSubtitle}>
              Built to provide an accessible, streamlined library experience for
              students, researchers, and avid readers.
            </p>
          </div>

          <div style={styles.featureGrid}>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🔍</div>
              <h3 style={styles.featureHeading}>Curated Catalogue</h3>
              <p style={styles.featureText}>
                Search through our catalogued volumes spanning fiction, science,
                literature, and academic texts with complete author and category
                indexing.
              </p>
            </div>

            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🏛️</div>
              <h3 style={styles.featureHeading}>Quiet Reading Rooms</h3>
              <p style={styles.featureText}>
                Experience dedicated, quiet study spaces designed for deep
                academic concentration, individual research, and peaceful
                reading sessions.
              </p>
            </div>

            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>⚡</div>
              <h3 style={styles.featureHeading}>Digital Circulation</h3>
              <p style={styles.featureText}>
                Check copy availability, manage borrowed books, and monitor due
                dates through your dedicated student and patron dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Preview Banner */}
      <section style={styles.membershipBannerSection}>
        <div style={styles.container}>
          <div style={styles.membershipBanner}>
            <div style={styles.bannerLeft}>
              <span style={styles.bannerPill}>Two Tailored Plans</span>
              <h2 style={styles.bannerTitle}>
                Find the Membership That Fits Your Routine
              </h2>
              <p style={styles.bannerDesc}>
                Whether you need book borrowing for home reading or a combo
                plan with quiet reading room desk access, SmartLib provides
                structured options.
              </p>
            </div>
            <div style={styles.bannerRight}>
              <button
                type="button"
                onClick={() => onNavigate("membership")}
                style={styles.bannerButton}
              >
                Compare Both Plans →
              </button>
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
  heroSection: {
    backgroundColor: "#0f172a",
    backgroundImage:
      "radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 70%)",
    color: "#ffffff",
    padding: "70px 20px 80px",
    textAlign: "center",
  },
  heroContent: {
    maxWidth: "840px",
    margin: "0 auto",
  },
  badge: {
    display: "inline-block",
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    color: "#a5b4fc",
    border: "1px solid rgba(165, 180, 252, 0.3)",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
    marginBottom: "20px",
    letterSpacing: "0.4px",
  },
  heroTitle: {
    fontSize: "42px",
    fontWeight: 800,
    lineHeight: 1.2,
    margin: "0 0 18px",
    letterSpacing: "-1px",
    color: "#ffffff",
  },
  heroSubtitle: {
    fontSize: "17px",
    lineHeight: 1.6,
    color: "#94a3b8",
    margin: "0 0 34px",
  },
  heroActions: {
    display: "flex",
    justifyContent: "center",
    gap: "14px",
    flexWrap: "wrap",
  },
  primaryCta: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "13px 26px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4)",
    transition: "transform 0.15s ease",
  },
  secondaryCta: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    color: "#f8fafc",
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "13px 24px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
  },
  section: {
    padding: "60px 20px",
    backgroundColor: "#f8fafc",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  sectionHeader: {
    textAlign: "center",
    maxWidth: "680px",
    margin: "0 auto 40px",
  },
  sectionTitle: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#0f172a",
    margin: "0 0 10px",
    letterSpacing: "-0.5px",
  },
  sectionSubtitle: {
    fontSize: "15px",
    color: "#64748b",
    lineHeight: 1.6,
    margin: 0,
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
  },
  featureCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "30px 24px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.04)",
  },
  featureIcon: {
    fontSize: "32px",
    marginBottom: "16px",
  },
  featureHeading: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 10px",
  },
  featureText: {
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.6,
    margin: 0,
  },
  membershipBannerSection: {
    padding: "0 20px 60px",
    backgroundColor: "#f8fafc",
  },
  membershipBanner: {
    backgroundColor: "#1e1b4b",
    borderRadius: "20px",
    padding: "36px 36px",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "24px",
    border: "1px solid #312e81",
  },
  bannerLeft: {
    maxWidth: "640px",
  },
  bannerPill: {
    display: "inline-block",
    backgroundColor: "rgba(129, 140, 248, 0.2)",
    color: "#c7d2fe",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    marginBottom: "12px",
    letterSpacing: "0.5px",
  },
  bannerTitle: {
    fontSize: "24px",
    fontWeight: 800,
    color: "#ffffff",
    margin: "0 0 10px",
    letterSpacing: "-0.4px",
  },
  bannerDesc: {
    fontSize: "14px",
    color: "#c7d2fe",
    lineHeight: 1.6,
    margin: 0,
  },
  bannerRight: {
    display: "flex",
    alignItems: "center",
  },
  bannerButton: {
    backgroundColor: "#ffffff",
    color: "#312e81",
    border: "none",
    borderRadius: "10px",
    padding: "13px 22px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  },
};
