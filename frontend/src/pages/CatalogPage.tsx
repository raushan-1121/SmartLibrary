import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { NavPage } from "../components/layout/Navbar";

export type CatalogBook = {
  id: number;
  title: string;
  isbn: string;
  publisher: string;
  publication_year: number;
  edition: string;
  description: string;
  author_name: string;
  category_name: string;
};

interface CatalogPageProps {
  onNavigate: (page: NavPage) => void;
  apiUrl?: string;
}

export function CatalogPage({
  onNavigate,
  apiUrl = "http://localhost:5000",
}: CatalogPageProps) {
  const [books, setBooks] = useState<CatalogBook[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  useEffect(() => {
    let isMounted = true;

    async function fetchBooks() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`${apiUrl}/api/books`);
        if (!response.ok) {
          throw new Error(`Failed to load books (HTTP ${response.status})`);
        }
        const data = await response.json();
        if (isMounted) {
          setBooks(Array.isArray(data.books) ? data.books : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to connect to the library catalog service."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void fetchBooks();

    return () => {
      isMounted = false;
    };
  }, [apiUrl]);

  // Derive categories from available book data
  const availableCategories = [
    "ALL",
    ...Array.from(
      new Set(
        books
          .map((b) => b.category_name)
          .filter((cat): cat is string => Boolean(cat))
      )
    ).sort(),
  ];

  // Client-side search and category filtering
  const filteredBooks = books.filter((book) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      book.title?.toLowerCase().includes(query) ||
      book.author_name?.toLowerCase().includes(query) ||
      book.isbn?.toLowerCase().includes(query) ||
      book.category_name?.toLowerCase().includes(query) ||
      book.publisher?.toLowerCase().includes(query);

    const matchesCategory =
      selectedCategory === "ALL" || book.category_name === selectedCategory;

    return Boolean(matchesQuery && matchesCategory);
  });

  return (
    <div style={styles.page}>
      <section style={styles.headerSection}>
        <div style={styles.container}>
          <div style={styles.headerContent}>
            <span style={styles.headerBadge}>Public Library Catalog</span>
            <h1 style={styles.title}>Browse Our Book Collection</h1>
            <p style={styles.subtitle}>
              Explore available volumes across multiple academic and literary
              fields. Sign in to your student account to request loans and track
              borrowed items.
            </p>
          </div>
        </div>
      </section>

      <section style={styles.mainSection}>
        <div style={styles.container}>
          {/* Controls Bar */}
          <div style={styles.controlsBar}>
            <div style={styles.searchWrapper}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, author, category, or ISBN..."
                style={styles.searchInput}
                aria-label="Search books"
              />
            </div>

            <div style={styles.filterWrapper}>
              <label htmlFor="category-filter" style={styles.filterLabel}>
                Category:
              </label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={styles.categorySelect}
                aria-label="Filter by category"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "ALL" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Catalog Count Indicator */}
          <div style={styles.metaBar}>
            <span style={styles.metaCount}>
              Showing <strong>{filteredBooks.length}</strong> of{" "}
              <strong>{books.length}</strong> catalogued books
            </span>
          </div>

          {/* Loading and Error States */}
          {loading && (
            <div style={styles.statusBox}>
              <span style={styles.loadingSpinner}>⏳</span>
              <p>Loading the library collection...</p>
            </div>
          )}

          {error && !loading && (
            <div style={styles.errorBox}>
              <p>⚠️ {error}</p>
              <small>
                Ensure the backend server is running at {apiUrl}.
              </small>
            </div>
          )}

          {/* Empty Search Result */}
          {!loading && !error && filteredBooks.length === 0 && (
            <div style={styles.emptyBox}>
              <div style={styles.emptyIcon}>📚</div>
              <h3 style={styles.emptyTitle}>No matching books found</h3>
              <p style={styles.emptyDesc}>
                Try adjusting your search query or reset the category filter to
                discover available titles.
              </p>
              {(searchQuery || selectedCategory !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("ALL");
                  }}
                  style={styles.resetButton}
                >
                  Reset Filters
                </button>
              )}
            </div>
          )}

          {/* Book Cards Grid */}
          {!loading && !error && filteredBooks.length > 0 && (
            <div style={styles.grid}>
              {filteredBooks.map((book) => (
                <article key={book.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={styles.categoryBadge}>
                      {book.category_name || "General"}
                    </span>
                    {book.publication_year ? (
                      <span style={styles.yearBadge}>
                        {book.publication_year}
                      </span>
                    ) : null}
                  </div>

                  <h3 style={styles.bookTitle}>{book.title}</h3>
                  <p style={styles.authorName}>
                    By {book.author_name || "Unknown Author"}
                  </p>

                  <p style={styles.description}>
                    {book.description ||
                      "No synopsis available for this title."}
                  </p>

                  <div style={styles.metaDetails}>
                    {book.publisher && (
                      <div style={styles.metaRow}>
                        <span style={styles.metaLabel}>Publisher:</span>
                        <span style={styles.metaValue}>{book.publisher}</span>
                      </div>
                    )}
                    {book.edition && (
                      <div style={styles.metaRow}>
                        <span style={styles.metaLabel}>Edition:</span>
                        <span style={styles.metaValue}>{book.edition}</span>
                      </div>
                    )}
                    {book.isbn && (
                      <div style={styles.metaRow}>
                        <span style={styles.metaLabel}>ISBN:</span>
                        <span style={styles.metaValue}>{book.isbn}</span>
                      </div>
                    )}
                  </div>

                  <div style={styles.cardFooter}>
                    <button
                      type="button"
                      onClick={() => onNavigate("login")}
                      style={styles.borrowButton}
                    >
                      Sign In to Borrow →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
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
  mainSection: {
    backgroundColor: "#f8fafc",
    padding: "40px 20px 70px",
    minHeight: "60vh",
  },
  controlsBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "20px",
    alignItems: "center",
    justifyContent: "space-between",
  },
  searchWrapper: {
    position: "relative",
    flex: "1 1 320px",
  },
  searchIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "14px",
    color: "#94a3b8",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px 12px 38px",
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#0f172a",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
  },
  filterWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: "0 0 auto",
  },
  filterLabel: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#475467",
  },
  categorySelect: {
    padding: "11px 16px",
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#0f172a",
    fontWeight: 500,
    cursor: "pointer",
  },
  metaBar: {
    marginBottom: "24px",
    paddingBottom: "12px",
    borderBottom: "1px solid #e2e8f0",
  },
  metaCount: {
    fontSize: "13px",
    color: "#64748b",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
    gap: "24px",
  },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
    transition: "box-shadow 0.2s, transform 0.2s",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
    gap: "8px",
  },
  categoryBadge: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: "6px",
  },
  yearBadge: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: 500,
  },
  bookTitle: {
    fontSize: "19px",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 6px",
    lineHeight: 1.3,
  },
  authorName: {
    fontSize: "14px",
    color: "#4f46e5",
    fontWeight: 600,
    margin: "0 0 14px",
  },
  description: {
    fontSize: "13px",
    color: "#64748b",
    lineHeight: 1.6,
    margin: "0 0 18px",
    flex: "1 0 auto",
  },
  metaDetails: {
    borderTop: "1px solid #f1f5f9",
    paddingTop: "12px",
    marginBottom: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    gap: "8px",
  },
  metaLabel: {
    color: "#94a3b8",
  },
  metaValue: {
    color: "#334155",
    fontWeight: 500,
    textAlign: "right",
  },
  cardFooter: {
    marginTop: "auto",
    paddingTop: "12px",
  },
  borrowButton: {
    width: "100%",
    backgroundColor: "#f8fafc",
    color: "#4f46e5",
    border: "1px solid #e0e7ff",
    borderRadius: "8px",
    padding: "10px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "background-color 0.15s",
  },
  statusBox: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#64748b",
    fontSize: "15px",
  },
  loadingSpinner: {
    fontSize: "32px",
    display: "block",
    marginBottom: "10px",
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "24px",
    textAlign: "center",
    color: "#b91c1c",
    fontSize: "14px",
    maxWidth: "500px",
    margin: "40px auto",
  },
  emptyBox: {
    backgroundColor: "#ffffff",
    border: "1px dashed #cbd5e1",
    borderRadius: "16px",
    padding: "60px 20px",
    textAlign: "center",
    maxWidth: "500px",
    margin: "40px auto",
  },
  emptyIcon: {
    fontSize: "40px",
    marginBottom: "14px",
  },
  emptyTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 8px",
  },
  emptyDesc: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 20px",
    lineHeight: 1.5,
  },
  resetButton: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "9px 18px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
};
