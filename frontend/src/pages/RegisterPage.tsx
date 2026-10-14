import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import type { NavPage } from "../components/layout/Navbar";

interface RegisterPageProps {
  onNavigate: (page: NavPage) => void;
  apiUrl?: string;
}

type MembershipOption = "BOOK_ONLY" | "COMBO";

export function RegisterPage({
  onNavigate,
  apiUrl = "http://localhost:5000",
}: RegisterPageProps) {
  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [membershipType, setMembershipType] =
    useState<MembershipOption>("BOOK_ONLY");

  // Interaction states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setErrorMessage("");

    // Client-side validations
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanEmail || !password || !confirmPassword) {
      setErrorMessage("All fields are required. Please fill out the entire form.");
      return;
    }

    if (cleanName.length < 2) {
      setErrorMessage("Please enter your full name (minimum 2 characters).");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters in length.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify your password entry.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${apiUrl}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password,
          confirmPassword,
          membership_type: membershipType,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 409) {
          setErrorMessage(
            data.message || "An account with this email already exists."
          );
        } else {
          setErrorMessage(
            data.message || "Registration failed. Please check your details."
          );
        }
        return;
      }

      // Successful 201 Created
      setRegisteredEmail(cleanEmail);
      setIsSuccess(true);
    } catch (err) {
      console.error("Registration request error:", err);
      setErrorMessage(
        "Unable to connect to the library server. Please ensure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // Confirmation screen when account is successfully created and awaiting approval
  if (isSuccess) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.successIconWrapper}>
              <span style={styles.successIcon}>✓</span>
            </div>
            <h1 style={styles.title}>Registration Submitted</h1>
            <p style={styles.subtitle}>
              Your student membership request has been registered in the system.
            </p>

            <div style={styles.statusBanner}>
              <div style={styles.statusDotYellow} />
              <div style={styles.statusBannerText}>
                <strong>Account Status: PENDING APPROVAL</strong>
                <span>
                  Library administrator review is required before login access is
                  granted.
                </span>
              </div>
            </div>

            <div style={styles.infoSummary}>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Applicant Name:</span>
                <span style={styles.summaryValue}>{name.trim()}</span>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Email Address:</span>
                <span style={styles.summaryValue}>{registeredEmail}</span>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Selected Plan:</span>
                <span style={styles.summaryValue}>
                  {membershipType === "BOOK_ONLY"
                    ? "Book Borrowing Only"
                    : "Combo: Book Borrowing + Reading Room"}
                </span>
              </div>
            </div>

            <div style={styles.instructionBox}>
              <h4 style={styles.instructionHeading}>Next Steps:</h4>
              <p style={styles.instructionText}>
                An administrator will verify your credentials and approve your
                account. Once approved, you can sign in with your email and password
                to access the student catalog and borrowing privileges.
              </p>
            </div>

            <div style={styles.actionButtonGroup}>
              <button
                type="button"
                onClick={() => onNavigate("login")}
                style={styles.primaryButton}
              >
                Go to Sign In →
              </button>
              <button
                type="button"
                onClick={() => onNavigate("home")}
                style={styles.secondaryButton}
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration Form
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.headerArea}>
            <span style={styles.badge}>Student Enrollment</span>
            <h1 style={styles.title}>Create Your Account</h1>
            <p style={styles.subtitle}>
              Register for a SmartLib student membership to borrow library books
              and access reading facilities.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            {/* Full Name */}
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="reg-name">
                Full Name <span style={styles.requiredAsterisk}>*</span>
              </label>
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                autoComplete="name"
                disabled={loading}
                style={styles.input}
                required
              />
            </div>

            {/* Email Address */}
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="reg-email">
                Email Address <span style={styles.requiredAsterisk}>*</span>
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                autoComplete="email"
                disabled={loading}
                style={styles.input}
                required
              />
            </div>

            {/* Password Grid */}
            <div style={styles.twoColumnGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="reg-password">
                  Password <span style={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  disabled={loading}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="reg-confirm-password">
                  Confirm Password <span style={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  id="reg-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  disabled={loading}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            {/* Membership Selection Section */}
            <div style={styles.membershipSection}>
              <label style={styles.membershipSectionLabel}>
                Select Membership Plan <span style={styles.requiredAsterisk}>*</span>
              </label>
              <p style={styles.membershipSectionHint}>
                Choose the membership privileges suited to your study and borrowing needs.
              </p>

              <div style={styles.cardsGrid}>
                {/* Option 1: Book Borrowing Only */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => !loading && setMembershipType("BOOK_ONLY")}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && !loading) {
                      setMembershipType("BOOK_ONLY");
                    }
                  }}
                  style={{
                    ...styles.selectionCard,
                    ...(membershipType === "BOOK_ONLY"
                      ? styles.selectionCardActive
                      : {}),
                    ...(loading ? styles.cardDisabled : {}),
                  }}
                >
                  <div style={styles.cardHeaderRow}>
                    <div style={styles.radioIndicator}>
                      {membershipType === "BOOK_ONLY" && (
                        <div style={styles.radioInnerDot} />
                      )}
                    </div>
                    <div>
                      <span style={styles.cardTierTag}>Standard</span>
                      <h3 style={styles.cardOptionTitle}>Book Borrowing Only</h3>
                    </div>
                  </div>
                  <p style={styles.cardDescription}>
                    Circulation privileges to borrow physical titles from our curated catalog
                    with standard return and renewal windows.
                  </p>
                  <ul style={styles.cardBulletList}>
                    <li style={styles.cardBulletItem}>✓ Physical book borrowing privileges</li>
                    <li style={styles.cardBulletItem}>✓ Online book reservation & renewals</li>
                    <li style={styles.cardBulletItem}>✓ Standard loan durations</li>
                  </ul>
                </div>

                {/* Option 2: Combo */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => !loading && setMembershipType("COMBO")}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && !loading) {
                      setMembershipType("COMBO");
                    }
                  }}
                  style={{
                    ...styles.selectionCard,
                    ...styles.comboCardBorder,
                    ...(membershipType === "COMBO"
                      ? styles.selectionCardComboActive
                      : {}),
                    ...(loading ? styles.cardDisabled : {}),
                  }}
                >
                  <div style={styles.cardHeaderRow}>
                    <div style={styles.radioIndicator}>
                      {membershipType === "COMBO" && (
                        <div style={styles.radioInnerDotCombo} />
                      )}
                    </div>
                    <div>
                      <span style={styles.comboTierTag}>Recommended</span>
                      <h3 style={styles.cardOptionTitle}>
                        Combo: Books + Reading Room
                      </h3>
                    </div>
                  </div>
                  <p style={styles.cardDescription}>
                    Combines home book borrowing privileges with guaranteed entry to
                    our silent, climate-controlled reading rooms.
                  </p>
                  <ul style={styles.cardBulletList}>
                    <li style={styles.cardBulletItem}>✓ Full book borrowing rights</li>
                    <li style={styles.cardBulletItem}>✓ Dedicated reading room & quiet desks</li>
                    <li style={styles.cardBulletItem}>✓ On-site reference collection access</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div style={styles.errorAlert} role="alert">
                <span style={styles.errorIcon}>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Approval Notice */}
            <div style={styles.noticeNotice}>
              <span style={styles.noticeNoticeIcon}>ℹ️</span>
              <span style={styles.noticeNoticeText}>
                <strong>Administrator Approval Required:</strong> All student accounts
                are created in <em>Pending Approval</em> status. An administrator must
                approve your profile before you can log in.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.primaryButton,
                width: "100%",
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Submitting Registration..." : "Complete Registration"}
            </button>
          </form>

          {/* Footer Navigation Link */}
          <div style={styles.footerRow}>
            <span>Already have an approved account?</span>
            <button
              type="button"
              onClick={() => onNavigate("login")}
              style={styles.inlineLinkButton}
            >
              Sign In here →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    backgroundColor: "#f8fafc",
    minHeight: "calc(100vh - 140px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },
  container: {
    width: "100%",
    maxWidth: "680px",
    margin: "0 auto",
  },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "36px 32px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
  },
  headerArea: {
    textAlign: "center",
    marginBottom: "28px",
  },
  badge: {
    display: "inline-block",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    color: "#6366f1",
    fontSize: "12px",
    fontWeight: 700,
    padding: "4px 12px",
    borderRadius: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "10px",
  },
  title: {
    fontSize: "26px",
    fontWeight: 800,
    color: "#0f172a",
    margin: "0 0 8px",
    letterSpacing: "-0.5px",
    textAlign: "center",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.5,
    margin: "0 auto",
    maxWidth: "500px",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#334155",
  },
  requiredAsterisk: {
    color: "#ef4444",
  },
  input: {
    padding: "11px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#1e293b",
    backgroundColor: "#ffffff",
    outline: "none",
    transition: "border-color 0.15s ease",
    boxSizing: "border-box",
    width: "100%",
  },
  membershipSection: {
    marginTop: "8px",
    marginBottom: "6px",
  },
  membershipSectionLabel: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#1e293b",
    display: "block",
    marginBottom: "4px",
  },
  membershipSectionHint: {
    fontSize: "12px",
    color: "#64748b",
    margin: "0 0 12px",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "14px",
  },
  selectionCard: {
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    padding: "16px",
    backgroundColor: "#ffffff",
    cursor: "pointer",
    transition: "all 0.15s ease",
    display: "flex",
    flexDirection: "column",
  },
  selectionCardActive: {
    borderColor: "#4f46e5",
    backgroundColor: "#f5f3ff",
    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.08)",
  },
  selectionCardComboActive: {
    borderColor: "#7c3aed",
    backgroundColor: "#faf5ff",
    boxShadow: "0 4px 12px rgba(124, 58, 237, 0.12)",
  },
  comboCardBorder: {
    position: "relative",
  },
  cardDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  cardHeaderRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    marginBottom: "10px",
  },
  radioIndicator: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    border: "2px solid #cbd5e1",
    marginTop: "2px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor: "#ffffff",
  },
  radioInnerDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    backgroundColor: "#4f46e5",
  },
  radioInnerDotCombo: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    backgroundColor: "#7c3aed",
  },
  cardTierTag: {
    display: "inline-block",
    fontSize: "10px",
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    padding: "2px 6px",
    borderRadius: "6px",
    marginBottom: "2px",
  },
  comboTierTag: {
    display: "inline-block",
    fontSize: "10px",
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#7c3aed",
    backgroundColor: "#ede9fe",
    padding: "2px 6px",
    borderRadius: "6px",
    marginBottom: "2px",
  },
  cardOptionTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
  },
  cardDescription: {
    fontSize: "12px",
    color: "#475569",
    lineHeight: 1.4,
    margin: "0 0 10px",
  },
  cardBulletList: {
    margin: 0,
    padding: 0,
    listStyle: "none",
    fontSize: "11px",
    color: "#334155",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  cardBulletItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  errorAlert: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  errorIcon: {
    flexShrink: 0,
  },
  noticeNotice: {
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "12px",
    color: "#1e40af",
    lineHeight: 1.45,
    display: "flex",
    gap: "8px",
    alignItems: "flex-start",
  },
  noticeNoticeIcon: {
    fontSize: "14px",
    flexShrink: 0,
  },
  noticeNoticeText: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 20px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.15s ease",
  },
  secondaryButton: {
    backgroundColor: "#f1f5f9",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "12px 20px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  footerRow: {
    marginTop: "24px",
    textAlign: "center",
    fontSize: "13px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  inlineLinkButton: {
    background: "none",
    border: "none",
    color: "#4f46e5",
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
  },
  // Success Confirmation Styles
  successIconWrapper: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    backgroundColor: "#dcfce7",
    color: "#16a34a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
  successIcon: {
    fontSize: "30px",
    fontWeight: "bold",
  },
  statusBanner: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "#fefce8",
    border: "1px solid #fef08a",
    borderRadius: "8px",
    padding: "12px 16px",
    margin: "20px 0",
  },
  statusDotYellow: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: "#eab308",
    flexShrink: 0,
  },
  statusBannerText: {
    display: "flex",
    flexDirection: "column",
    fontSize: "13px",
    color: "#854d0e",
    gap: "2px",
  },
  infoSummary: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "14px 18px",
    marginBottom: "20px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
    fontSize: "13px",
    borderBottom: "1px solid #f1f5f9",
  },
  summaryLabel: {
    color: "#64748b",
    fontWeight: 500,
  },
  summaryValue: {
    color: "#0f172a",
    fontWeight: 600,
  },
  instructionBox: {
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "8px",
    padding: "14px 16px",
    marginBottom: "24px",
  },
  instructionHeading: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#166534",
    margin: "0 0 6px",
  },
  instructionText: {
    fontSize: "12px",
    color: "#15803d",
    lineHeight: 1.5,
    margin: 0,
  },
  actionButtonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
};
