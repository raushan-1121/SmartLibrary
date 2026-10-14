import { useState } from "react";
import type { CSSProperties } from "react";

export type NavPage = "home" | "catalog" | "membership" | "login" | "dashboard" | "register";

interface NavbarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  loggedIn: boolean;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
}

export function Navbar({
  activePage,
  onNavigate,
  loggedIn,
  userName,
  userRole,
  onLogout,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (page: NavPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div
          style={styles.brand}
          onClick={() => handleNavClick("home")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleNavClick("home");
          }}
        >
          <span style={styles.logoIcon}>📚</span>
          <div>
            <span style={styles.brandName}>SmartLib</span>
            <span style={styles.brandTagline}>Library Management</span>
          </div>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="smartlib-mobile-toggle"
          style={styles.mobileToggle}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>

        {/* Navigation links */}
        <nav
          style={{
            ...styles.nav,
            ...(mobileMenuOpen ? styles.navOpen : {}),
          }}
        >
          <button
            type="button"
            onClick={() => handleNavClick("home")}
            style={{
              ...styles.navLink,
              ...(activePage === "home" ? styles.navLinkActive : {}),
            }}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => handleNavClick("catalog")}
            style={{
              ...styles.navLink,
              ...(activePage === "catalog" ? styles.navLinkActive : {}),
            }}
          >
            Catalogue
          </button>
          <button
            type="button"
            onClick={() => handleNavClick("membership")}
            style={{
              ...styles.navLink,
              ...(activePage === "membership" ? styles.navLinkActive : {}),
            }}
          >
            Membership Plans
          </button>

          <div style={styles.authGroup}>
            {loggedIn ? (
              <>
                <div style={styles.userInfo}>
                  <span style={styles.userAvatar}>
                    {userName?.charAt(0).toUpperCase() || "U"}
                  </span>
                  <div style={styles.userText}>
                    <span style={styles.userName}>{userName || "User"}</span>
                    <span style={styles.userRole}>{userRole}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleNavClick("dashboard")}
                  style={{
                    ...styles.dashboardButton,
                    ...(activePage === "dashboard"
                      ? styles.dashboardButtonActive
                      : {}),
                  }}
                >
                  Dashboard
                </button>
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    style={styles.logoutButton}
                  >
                    Logout
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleNavClick("login")}
                style={styles.signInButton}
              >
                Sign In
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

const styles: Record<string, CSSProperties> = {
  header: {
    backgroundColor: "#0f172a",
    borderBottom: "1px solid #1e293b",
    position: "sticky",
    top: 0,
    zIndex: 100,
    width: "100%",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "14px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    userSelect: "none",
  },
  logoIcon: {
    fontSize: "26px",
    display: "flex",
    alignItems: "center",
  },
  brandName: {
    display: "block",
    fontSize: "20px",
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "-0.5px",
    lineHeight: 1.1,
  },
  brandTagline: {
    display: "block",
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: 500,
  },
  mobileToggle: {
    background: "transparent",
    border: "1px solid #334155",
    color: "#f8fafc",
    fontSize: "20px",
    padding: "6px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },
  navOpen: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    paddingTop: "12px",
    borderTop: "1px solid #1e293b",
  },
  navLink: {
    background: "transparent",
    border: "none",
    color: "#cbd5e1",
    fontSize: "14px",
    fontWeight: 500,
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s, color 0.2s",
  },
  navLinkActive: {
    backgroundColor: "#1e293b",
    color: "#ffffff",
    fontWeight: 600,
  },
  authGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginLeft: "12px",
    flexWrap: "wrap",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginRight: "4px",
  },
  userAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "13px",
  },
  userText: {
    display: "flex",
    flexDirection: "column",
    textAlign: "left",
  },
  userName: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#f8fafc",
    lineHeight: 1.2,
  },
  userRole: {
    fontSize: "10px",
    fontWeight: 600,
    color: "#a5b4fc",
    textTransform: "uppercase",
  },
  dashboardButton: {
    backgroundColor: "#312e81",
    color: "#e0e7ff",
    border: "1px solid #4338ca",
    borderRadius: "8px",
    padding: "7px 14px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  dashboardButtonActive: {
    backgroundColor: "#4338ca",
    color: "#ffffff",
  },
  logoutButton: {
    backgroundColor: "transparent",
    color: "#94a3b8",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "7px 12px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
  },
  signInButton: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 18px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(79, 70, 229, 0.35)",
  },
};
