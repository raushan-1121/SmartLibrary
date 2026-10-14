import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Navbar } from "./components/layout/Navbar";
import type { NavPage } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { HomePage } from "./pages/HomePage";
import { CatalogPage } from "./pages/CatalogPage";
import { MembershipPage } from "./pages/MembershipPage";
import { RegisterPage } from "./pages/RegisterPage";

const API_URL = "http://localhost:5000";

type Role = "ADMIN" | "STUDENT";

type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  membership_type?: string;
  account_status?: string;
};

type Book = {
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

type DashboardData = {
  total_books: number;
  total_authors: number;
  total_categories: number;
  total_copies: number;
  available_copies: number;
  borrowed_copies: number;
  active_issues: number;
};

type BookCopy = {
  copy_id: number;
  book_id: number;
  accession_number: string;
  barcode: string;
  location: string;
  title: string;
};

type Issue = {
  transaction_id: number;
  user_id: number;
  copy_id: number;
  issue_date: string;
  due_date: string;
  user_name: string;
  user_email: string;
  title: string;
  accession_number: string;
  barcode: string;
};

type NewBook = {
  title: string;
  isbn: string;
  author_id: string;
  category_id: string;
  publisher: string;
  publication_year: string;
  edition: string;
  description: string;
};

const emptyDashboard: DashboardData = {
  total_books: 0,
  total_authors: 0,
  total_categories: 0,
  total_copies: 0,
  available_copies: 0,
  borrowed_copies: 0,
  active_issues: 0,
};

const emptyBook: NewBook = {
  title: "",
  isbn: "",
  author_id: "",
  category_id: "",
  publisher: "",
  publication_year: "",
  edition: "",
  description: "",
};

async function readResponse(response: Response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Backend returned an invalid response.");
  }
}

function App() {
  // Navigation
  const [activePage, setActivePage] = useState<NavPage>("home");

  // Login
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string>("");
  const [loginRole, setLoginRole] = useState<Role>("STUDENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Dashboard data
  const [books, setBooks] = useState<Book[]>([]);
  const [dashboard, setDashboard] =
    useState<DashboardData>(emptyDashboard);
  const [availableCopies, setAvailableCopies] =
    useState<BookCopy[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Search and category filter
  const [bookSearch, setBookSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Issue book
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedCopyId, setSelectedCopyId] = useState("");
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueMessage, setIssueMessage] = useState("");
  const [issueError, setIssueError] = useState("");
  const [returnLoading, setReturnLoading] = useState<number | null>(null);

  // Add book
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [newBook, setNewBook] = useState<NewBook>({ ...emptyBook });
  const [addBookLoading, setAddBookLoading] = useState(false);
  const [addBookMessage, setAddBookMessage] = useState("");
  const [addBookError, setAddBookError] = useState("");

  const isAdmin = user?.role === "ADMIN";

  // Load books and dashboard statistics
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [booksResponse, dashboardResponse] = await Promise.all([
        fetch(`${API_URL}/api/books`),
        fetch(`${API_URL}/api/dashboard`),
      ]);

      const booksData = await readResponse(booksResponse);

      if (!booksResponse.ok) {
        throw new Error(
          booksData.message || "Unable to load books."
        );
      }

      setBooks(
        Array.isArray(booksData.books) ? booksData.books : []
      );

      if (dashboardResponse.ok) {
        const dashboardData = await readResponse(dashboardResponse);

        setDashboard({
          ...emptyDashboard,
          ...(dashboardData.dashboard || {}),
        });
      }
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load library data."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load available physical copies
  const loadAvailableCopies = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/book-copies/available`
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load available copies."
        );
      }

      setAvailableCopies(
        Array.isArray(data.copies) ? data.copies : []
      );
    } catch (err) {
      console.error("Available copies error:", err);
    }
  };

  // Students should only receive their own issues.
  const loadIssues = async (targetUser?: User | null) => {
    const currentUser = targetUser ?? user;

    if (!currentUser) {
      setIssues([]);
      return;
    }

    try {
      const url =
        currentUser.role === "STUDENT"
          ? `${API_URL}/api/issues?user_id=${currentUser.id}`
          : `${API_URL}/api/issues`;

      const headers: Record<string, string> = {};
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch(url, { headers });
      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load book issues."
        );
      }

      setIssues(Array.isArray(data.issues) ? data.issues : []);
    } catch (err) {
      console.error("Issues loading error:", err);
      setIssues([]);
    }
  };

  // Load data after successful login.
  useEffect(() => {
    if (!loggedIn || !user) return;

    void loadDashboardData();
    void loadAvailableCopies();
    void loadIssues(user);

    // Do not add the loader functions as dependencies here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, user]);

  // Login
  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setLoginError("");

    if (!email.trim() || !password) {
      setLoginError("Please enter your email and password.");
      return;
    }

    try {
      setLoginLoading(true);

      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role: loginRole,
        }),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        setLoginError(data.message || "Login failed.");
        return;
      }

      if (!data.user) {
        setLoginError("Login response did not contain user information.");
        return;
      }

      if (data.user.role !== loginRole) {
        setLoginError(
          `This account is not registered as ${loginRole}. Select the correct login type.`
        );
        return;
      }

      setUser(data.user as User);
      if (data.token) {
        setAuthToken(data.token);
      }
      setLoggedIn(true);
      setActivePage("dashboard");
      setPassword("");
    } catch (err) {
      console.error("Login error:", err);
      setLoginError(
        "Cannot connect to the backend. Check that the server is running on port 5000."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    setLoggedIn(false);
    setUser(null);
    setAuthToken("");
    setActivePage("home");
    setEmail("");
    setPassword("");
    setLoginError("");
    setError("");
    setBooks([]);
    setAvailableCopies([]);
    setIssues([]);
    setDashboard({ ...emptyDashboard });
    setBookSearch("");
    setSelectedCategory("ALL");
    setShowIssueModal(false);
    setShowAddBookModal(false);
    setSelectedBook(null);
    setSelectedCopyId("");
    setNewBook({ ...emptyBook });
  };

  // Open issue modal
  const handleOpenIssue = async (book: Book) => {
    if (!isAdmin) return;

    setSelectedBook(book);
    setSelectedCopyId("");
    setIssueError("");
    setIssueMessage("");
    setShowIssueModal(true);

    await loadAvailableCopies();
  };

  const handleCloseIssueModal = () => {
    if (issueLoading) return;

    setShowIssueModal(false);
    setSelectedBook(null);
    setSelectedCopyId("");
    setIssueError("");
    setIssueMessage("");
  };

  // Issue book
  const handleIssueBook = async () => {
    if (!user || user.role !== "ADMIN") {
      setIssueError("Only an admin can issue books.");
      return;
    }

    if (!selectedCopyId) {
      setIssueError("Please select an available book copy.");
      return;
    }

    try {
      setIssueLoading(true);
      setIssueError("");
      setIssueMessage("");

      const response = await fetch(`${API_URL}/api/books/issue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          copy_id: Number(selectedCopyId),
        }),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        setIssueError(data.message || "Failed to issue the book.");
        return;
      }

      setIssueMessage("Book issued successfully!");

      await Promise.all([
        loadDashboardData(),
        loadAvailableCopies(),
        loadIssues(user),
      ]);

      window.setTimeout(() => {
        setShowIssueModal(false);
        setSelectedBook(null);
        setSelectedCopyId("");
        setIssueMessage("");
      }, 1000);
    } catch (err) {
      console.error("Issue book error:", err);
      setIssueError(
        err instanceof Error
          ? err.message
          : "Unable to issue the book."
      );
    } finally {
      setIssueLoading(false);
    }
  };

  // Return book
  const handleReturnBook = async (transactionId: number) => {
    if (!window.confirm("Are you sure you want to return this book?")) {
      return;
    }

    try {
      setReturnLoading(transactionId);

      const response = await fetch(`${API_URL}/api/books/return`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction_id: transactionId,
        }),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        window.alert(data.message || "Failed to return the book.");
        return;
      }

      await Promise.all([
        loadDashboardData(),
        loadAvailableCopies(),
        loadIssues(user),
      ]);

      window.alert("Book returned successfully!");
    } catch (err) {
      console.error("Return book error:", err);
      window.alert("Unable to connect to the backend.");
    } finally {
      setReturnLoading(null);
    }
  };

  // Open Add Book modal
  const handleOpenAddBook = () => {
    if (!isAdmin) return;

    setNewBook({ ...emptyBook });
    setAddBookError("");
    setAddBookMessage("");
    setShowAddBookModal(true);
  };

  const handleCloseAddBook = () => {
    if (addBookLoading) return;

    setShowAddBookModal(false);
    setAddBookError("");
    setAddBookMessage("");
  };

  // Add book
  const handleAddBook = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setAddBookError("");
    setAddBookMessage("");

    if (!user || user.role !== "ADMIN") {
      setAddBookError("Only an admin can add books.");
      return;
    }

    const title = newBook.title.trim();
    const isbn = newBook.isbn.trim();
    const publisher = newBook.publisher.trim();
    const edition = newBook.edition.trim();
    const description = newBook.description.trim();

    const authorId = Number(newBook.author_id);
    const categoryId = Number(newBook.category_id);
    const publicationYear = Number(newBook.publication_year);

    if (
      !title ||
      !isbn ||
      !publisher ||
      !edition ||
      !description ||
      !newBook.author_id ||
      !newBook.category_id ||
      !newBook.publication_year
    ) {
      setAddBookError("Please fill in all required fields.");
      return;
    }

    if (!Number.isInteger(authorId) || authorId <= 0) {
      setAddBookError("Author ID must be a positive whole number.");
      return;
    }

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      setAddBookError("Category ID must be a positive whole number.");
      return;
    }

    if (
      !Number.isInteger(publicationYear) ||
      publicationYear < 1000 ||
      publicationYear > 9999
    ) {
      setAddBookError("Enter a valid publication year.");
      return;
    }

    try {
      setAddBookLoading(true);

      const response = await fetch(`${API_URL}/api/books`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          isbn,
          author_id: authorId,
          category_id: categoryId,
          publisher,
          publication_year: publicationYear,
          edition,
          description,
        }),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        setAddBookError(data.message || "Failed to add the book.");
        return;
      }

      setAddBookMessage("Book added successfully!");

      await loadDashboardData();
      setNewBook({ ...emptyBook });

      window.setTimeout(() => {
        setShowAddBookModal(false);
        setAddBookMessage("");
      }, 1000);
    } catch (err) {
      console.error("Add book error:", err);
      setAddBookError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the backend."
      );
    } finally {
      setAddBookLoading(false);
    }
  };

  // Search and category filtering
  const filteredBooks = books.filter((book) => {
    const search = bookSearch.trim().toLowerCase();

    const matchesSearch =
      !search ||
      book.title?.toLowerCase().includes(search) ||
      book.author_name?.toLowerCase().includes(search) ||
      book.isbn?.toLowerCase().includes(search) ||
      book.category_name?.toLowerCase().includes(search);

    const matchesCategory =
      selectedCategory === "ALL" ||
      book.category_name === selectedCategory;

    return Boolean(matchesSearch && matchesCategory);
  });

  const categories = [
    "ALL",
    ...Array.from(
      new Set(
        books
          .map((book) => book.category_name)
          .filter((category): category is string => Boolean(category))
      )
    ),
  ];

  // Public Views & Navigation Routing
  if (activePage === "home") {
    return (
      <div style={styles.publicPageWrapper}>
        <Navbar
          activePage="home"
          onNavigate={setActivePage}
          loggedIn={loggedIn}
          userName={user?.name}
          userRole={user?.role}
          onLogout={handleLogout}
        />
        <HomePage onNavigate={setActivePage} />
        <Footer onNavigate={setActivePage} />
      </div>
    );
  }

  if (activePage === "catalog") {
    return (
      <div style={styles.publicPageWrapper}>
        <Navbar
          activePage="catalog"
          onNavigate={setActivePage}
          loggedIn={loggedIn}
          userName={user?.name}
          userRole={user?.role}
          onLogout={handleLogout}
        />
        <CatalogPage onNavigate={setActivePage} apiUrl={API_URL} />
        <Footer onNavigate={setActivePage} />
      </div>
    );
  }

  if (activePage === "membership") {
    return (
      <div style={styles.publicPageWrapper}>
        <Navbar
          activePage="membership"
          onNavigate={setActivePage}
          loggedIn={loggedIn}
          userName={user?.name}
          userRole={user?.role}
          onLogout={handleLogout}
        />
        <MembershipPage onNavigate={setActivePage} />
        <Footer onNavigate={setActivePage} />
      </div>
    );
  }

  // Registration screen (must come before the login catch-all)
  if (activePage === "register") {
    return (
      <div style={styles.publicPageWrapper}>
        <Navbar
          activePage="register"
          onNavigate={setActivePage}
          loggedIn={loggedIn}
          userName={user?.name}
          userRole={user?.role}
          onLogout={handleLogout}
        />
        <RegisterPage onNavigate={setActivePage} apiUrl={API_URL} />
        <Footer onNavigate={setActivePage} />
      </div>
    );
  }

  // Login screen
  if (!loggedIn || !user || activePage === "login") {
    return (
      <div style={styles.publicPageWrapper}>
        <Navbar
          activePage="login"
          onNavigate={setActivePage}
          loggedIn={loggedIn}
          userName={user?.name}
          userRole={user?.role}
          onLogout={handleLogout}
        />
        <div style={styles.loginPage}>
          <div style={styles.loginCard}>
            <div style={styles.loginLogo}>📚</div>
            <h1 style={styles.loginTitle}>SmartLib</h1>
            <p style={styles.loginSubtitle}>
              Smart Library Management System
            </p>

            <div style={styles.roleButtons}>
              <button
                type="button"
                onClick={() => {
                  setLoginRole("ADMIN");
                  setLoginError("");
                }}
                style={{
                  ...styles.roleButton,
                  ...(loginRole === "ADMIN"
                    ? styles.roleButtonActive
                    : {}),
                }}
              >
                👨‍💼 Admin
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginRole("STUDENT");
                  setLoginError("");
                }}
                style={{
                  ...styles.roleButton,
                  ...(loginRole === "STUDENT"
                    ? styles.roleButtonActive
                    : {}),
                }}
              >
                🎓 Student
              </button>
            </div>

            <form onSubmit={handleLogin}>
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="login-email">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  autoComplete="username"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="login-password">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={styles.input}
                  required
                />
              </div>

              {loginError && (
                <div style={styles.error}>{loginError}</div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                style={{
                  ...styles.primaryButton,
                  width: "100%",
                  opacity: loginLoading ? 0.7 : 1,
                }}
              >
                {loginLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div style={styles.registerPrompt}>
              <span>New student?</span>
              <button
                type="button"
                onClick={() => setActivePage("register")}
                style={styles.registerLink}
              >
                Register here →
              </button>
            </div>

            <div style={styles.demoBox}>
              <strong>Demo Login Information</strong>
              <p>Student: rahul@smartlib.com</p>
              <p>Admin: admin@smartlib.com</p>
              <small>
                Use the password configured in your database.
              </small>
            </div>

            <p style={styles.loginFooter}>SmartLib © 2026</p>
          </div>
        </div>
        <Footer onNavigate={setActivePage} />
      </div>
    );
  }

  // Dashboard
  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.logo}>SmartLib</h1>
          <p style={styles.subtitle}>
            Smart Library Management System
          </p>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <strong style={styles.userName}>{user.name}</strong>
              <span style={styles.userRole}>{user.role}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActivePage("home")}
            style={styles.publicSiteButton}
          >
            🌐 Public Website
          </button>

          <div style={styles.status}>
            <span style={styles.statusDot} />
            Backend Connected
          </div>

          <button
            onClick={handleLogout}
            style={styles.logoutButton}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={styles.container}>
        <section style={styles.welcome}>
          <h2 style={styles.welcomeTitle}>
            {isAdmin ? "Library Dashboard" : "Student Dashboard"}
          </h2>
          <p style={styles.welcomeText}>
            {isAdmin
              ? `Welcome back, ${user.name}. Manage your library collection.`
              : `Welcome back, ${user.name}. Browse books and check availability.`}
          </p>
        </section>

        {error && <div style={styles.error}>{error}</div>}

        {/* Admin dashboard */}
        {isAdmin && (
          <>
            <section style={styles.stats}>
              <StatCard
                icon="📚"
                label="Total Books"
                value={dashboard.total_books}
              />
              <StatCard
                icon="👨‍💻"
                label="Authors"
                value={dashboard.total_authors}
              />
              <StatCard
                icon="📖"
                label="Categories"
                value={dashboard.total_categories}
              />
              <StatCard
                icon="✅"
                label="System Status"
                value="Online"
              />
            </section>

            <section style={styles.panel}>
              <h2 style={styles.sectionTitle}>Library Inventory</h2>
              <p style={styles.sectionSubtitle}>
                Current status of your physical book copies.
              </p>

              <div style={styles.inventoryGrid}>
                <StatCard
                  icon="📦"
                  label="Total Copies"
                  value={dashboard.total_copies}
                />
                <StatCard
                  icon="🟢"
                  label="Available Copies"
                  value={dashboard.available_copies}
                />
                <StatCard
                  icon="📕"
                  label="Borrowed Copies"
                  value={dashboard.borrowed_copies}
                />
                <StatCard
                  icon="🔄"
                  label="Active Issues"
                  value={dashboard.active_issues}
                />
              </div>
            </section>

            <section style={styles.panel}>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Active Book Issues</h2>
                  <p style={styles.sectionSubtitle}>
                    Books currently issued to library users.
                  </p>
                </div>
                <span style={styles.countBadge}>
                  {issues.length} Active
                </span>
              </div>

              {issues.length === 0 ? (
                <div style={styles.message}>
                  No active book issues.
                </div>
              ) : (
                <div style={styles.issueList}>
                  {issues.map((issue) => (
                    <article
                      key={issue.transaction_id}
                      style={styles.issueCard}
                    >
                      <div>
                        <h3 style={styles.issueBookTitle}>
                          {issue.title}
                        </h3>
                        <p style={styles.issueMeta}>
                          👤 {issue.user_name} ({issue.user_email})
                        </p>
                        <p style={styles.issueMeta}>
                          Copy: {issue.accession_number}
                        </p>
                        <p style={styles.issueMeta}>
                          Issue Date:{" "}
                          {new Date(issue.issue_date).toLocaleDateString("en-IN")}
                        </p>
                        <p style={styles.issueMeta}>
                          Due Date:{" "}
                          {new Date(issue.due_date).toLocaleDateString("en-IN")}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          handleReturnBook(issue.transaction_id)
                        }
                        disabled={
                          returnLoading === issue.transaction_id
                        }
                        style={styles.returnButton}
                      >
                        {returnLoading === issue.transaction_id
                          ? "Returning..."
                          : "↩ Return Book"}
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* Student: Explore books */}
        {!isAdmin && (
          <>
            <section style={styles.panel}>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Explore Books</h2>
                  <p style={styles.sectionSubtitle}>
                    Search the library collection and check book availability.
                  </p>
                </div>
                <span style={styles.countBadge}>
                  {filteredBooks.length} of {books.length} Books
                </span>
              </div>

              <div style={styles.studentFilters}>
                <input
                  type="search"
                  placeholder="Search title, author, ISBN or category..."
                  value={bookSearch}
                  onChange={(event) => setBookSearch(event.target.value)}
                  style={styles.input}
                  aria-label="Search books"
                />

                <select
                  value={selectedCategory}
                  onChange={(event) =>
                    setSelectedCategory(event.target.value)
                  }
                  style={styles.input}
                  aria-label="Filter by category"
                >
                  <option value="ALL">All Categories</option>
                  {categories
                    .filter((category) => category !== "ALL")
                    .map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                </select>
              </div>

              {loading ? (
                <div style={styles.message}>Loading books...</div>
              ) : filteredBooks.length === 0 ? (
                <div style={styles.message}>
                  No books match your search.
                </div>
              ) : (
                <div style={styles.bookGrid}>
                  {filteredBooks.map((book) => {
                    const isAvailable = availableCopies.some(
                      (copy) => copy.book_id === book.id
                    );

                    return (
                      <article
                        key={book.id}
                        style={styles.bookCard}
                      >
                        <div style={styles.bookTop}>
                          <span style={styles.category}>
                            {book.category_name || "Uncategorized"}
                          </span>
                          <span
                            style={{
                              ...styles.availabilityBadge,
                              color: isAvailable
                                ? "#027a48"
                                : "#b42318",
                              background: isAvailable
                                ? "#ecfdf3"
                                : "#fef3f2",
                            }}
                          >
                            {isAvailable ? "Available" : "Unavailable"}
                          </span>
                        </div>

                        <h3 style={styles.bookTitle}>{book.title}</h3>
                        <p style={styles.author}>
                          By {book.author_name || "Unknown author"}
                        </p>
                        <p style={styles.description}>
                          {book.description || "No description available."}
                        </p>

                        <div style={styles.bookDetails}>
                          <span>Publisher: {book.publisher || "N/A"}</span>
                          <span>Year: {book.publication_year || "N/A"}</span>
                          <span>ISBN: {book.isbn || "N/A"}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Student borrowed books */}
            <section style={styles.panel}>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>My Borrowed Books</h2>
                  <p style={styles.sectionSubtitle}>
                    Your issued books and return deadlines.
                  </p>
                </div>

                <span style={styles.countBadge}>
                  {issues.filter((issue) => issue.user_id === user.id).length}
                  {" "}Borrowed
                </span>
              </div>

              {issues.filter((issue) => issue.user_id === user.id).length === 0 ? (
                <div style={styles.message}>
                  You have no currently borrowed books.
                </div>
              ) : (
                <div style={styles.issueList}>
                  {issues
                    .filter((issue) => issue.user_id === user.id)
                    .map((issue) => {
                      const isOverdue =
                        new Date(issue.due_date).getTime() <
                        new Date().setHours(0, 0, 0, 0);

                      return (
                        <article
                          key={issue.transaction_id}
                          style={styles.issueCard}
                        >
                          <div>
                            <h3 style={styles.issueBookTitle}>
                              {issue.title}
                            </h3>
                            <p style={styles.issueMeta}>
                              Accession No: {issue.accession_number}
                            </p>
                            <p style={styles.issueMeta}>
                              Issue Date:{" "}
                              {new Date(issue.issue_date).toLocaleDateString("en-IN")}
                            </p>
                            <p style={styles.issueMeta}>
                              Due Date:{" "}
                              {new Date(issue.due_date).toLocaleDateString("en-IN")}
                            </p>
                          </div>

                          <span
                            style={{
                              ...styles.countBadge,
                              background: isOverdue ? "#fef3f2" : "#ecfdf3",
                              color: isOverdue ? "#b42318" : "#027a48",
                            }}
                          >
                            {isOverdue ? "Overdue" : "Issued"}
                          </span>
                        </article>
                      );
                    })}
                </div>
              )}
            </section>
          </>
        )}

        {/* Books collection */}
        <section style={styles.panel}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Books Collection</h2>
              <p style={styles.sectionSubtitle}>
                {isAdmin
                  ? "Books currently available in the SmartLib database."
                  : "Explore books available in SmartLib."}
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={handleOpenAddBook}
                style={styles.primaryButton}
              >
                + Add New Book
              </button>
            )}
          </div>

          {loading ? (
            <div style={styles.message}>Loading books...</div>
          ) : books.length === 0 ? (
            <div style={styles.message}>No books found.</div>
          ) : (
            <div style={styles.bookGrid}>
              {filteredBooks.map((book) => {
                const hasAvailableCopy = availableCopies.some(
                  (copy) => copy.book_id === book.id
                );

                return (
                  <article
                    key={book.id}
                    style={styles.bookCard}
                  >
                    <div style={styles.bookTop}>
                      <span style={styles.category}>
                        {book.category_name || "Uncategorized"}
                      </span>
                      {isAdmin && (
                        <span style={styles.bookId}>#{book.id}</span>
                      )}
                    </div>

                    <h3 style={styles.bookTitle}>{book.title}</h3>
                    <p style={styles.author}>
                      By {book.author_name || "Unknown author"}
                    </p>
                    <p style={styles.description}>
                      {book.description || "No description available."}
                    </p>

                    {isAdmin && (
                      <div style={styles.bookDetails}>
                        <span>📅 {book.publication_year}</span>
                        <span>🏢 {book.publisher}</span>
                        <span>📘 Edition: {book.edition}</span>
                        <span>ISBN: {book.isbn}</span>
                      </div>
                    )}

                    {isAdmin ? (
                      <button
                        onClick={() => void handleOpenIssue(book)}
                        disabled={!hasAvailableCopy}
                        style={{
                          ...styles.primaryButton,
                          width: "100%",
                          opacity: hasAvailableCopy ? 1 : 0.55,
                          cursor: hasAvailableCopy
                            ? "pointer"
                            : "not-allowed",
                        }}
                      >
                        {hasAvailableCopy
                          ? "📚 Issue Book"
                          : "❌ No Copy Available"}
                      </button>
                    ) : (
                      <p
                        style={{
                          ...styles.availability,
                          color: hasAvailableCopy
                            ? "#027a48"
                            : "#b42318",
                        }}
                      >
                        {hasAvailableCopy
                          ? "Available"
                          : "Currently unavailable"}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Issue Book Modal */}
      {showIssueModal && selectedBook && isAdmin && (
        <div
          style={styles.modalOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseIssueModal();
            }
          }}
        >
          <div style={styles.modal}>
            <button
              onClick={handleCloseIssueModal}
              style={styles.modalClose}
              aria-label="Close"
              type="button"
            >
              ×
            </button>

            <h2 style={styles.modalTitle}>Issue Book</h2>
            <p style={styles.modalSubtitle}>
              Select a physical copy to issue.
            </p>

            <div style={styles.selectedBook}>
              <strong>{selectedBook.title}</strong>
              <span>By {selectedBook.author_name}</span>
            </div>

            <label style={styles.label} htmlFor="copy-select">
              Select Book Copy
            </label>

            <select
              id="copy-select"
              value={selectedCopyId}
              onChange={(event) => setSelectedCopyId(event.target.value)}
              style={styles.input}
              disabled={issueLoading}
            >
              <option value="">Select available copy</option>
              {availableCopies
                .filter((copy) => copy.book_id === selectedBook.id)
                .map((copy) => (
                  <option key={copy.copy_id} value={copy.copy_id}>
                    {copy.accession_number} - {copy.barcode} - {copy.location}
                  </option>
                ))}
            </select>

            {issueError && (
              <div style={styles.error}>{issueError}</div>
            )}
            {issueMessage && (
              <div style={styles.success}>{issueMessage}</div>
            )}

            <div style={styles.modalActions}>
              <button
                onClick={handleCloseIssueModal}
                disabled={issueLoading}
                style={styles.secondaryButton}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleIssueBook()}
                disabled={issueLoading}
                style={styles.primaryButton}
                type="button"
              >
                {issueLoading ? "Issuing..." : "Confirm Issue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Book Modal */}
      {showAddBookModal && isAdmin && (
        <div
          style={styles.modalOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseAddBook();
            }
          }}
        >
          <div style={styles.addBookModal}>
            <button
              onClick={handleCloseAddBook}
              style={styles.modalClose}
              aria-label="Close"
              type="button"
            >
              ×
            </button>

            <h2 style={styles.modalTitle}>Add New Book</h2>
            <p style={styles.modalSubtitle}>
              Enter the book details below.
            </p>

            <form onSubmit={handleAddBook}>
              <div style={styles.formGrid}>
                <FormInput
                  label="Book Title"
                  value={newBook.title}
                  placeholder="Enter book title"
                  onChange={(value) =>
                    setNewBook({ ...newBook, title: value })
                  }
                />

                <FormInput
                  label="ISBN"
                  value={newBook.isbn}
                  placeholder="Enter ISBN"
                  onChange={(value) =>
                    setNewBook({ ...newBook, isbn: value })
                  }
                />

                <FormInput
                  label="Author ID"
                  value={newBook.author_id}
                  placeholder="Example: 1"
                  type="number"
                  onChange={(value) =>
                    setNewBook({ ...newBook, author_id: value })
                  }
                />

                <FormInput
                  label="Category ID"
                  value={newBook.category_id}
                  placeholder="Example: 1"
                  type="number"
                  onChange={(value) =>
                    setNewBook({ ...newBook, category_id: value })
                  }
                />

                <FormInput
                  label="Publisher"
                  value={newBook.publisher}
                  placeholder="Enter publisher"
                  onChange={(value) =>
                    setNewBook({ ...newBook, publisher: value })
                  }
                />

                <FormInput
                  label="Publication Year"
                  value={newBook.publication_year}
                  placeholder="Example: 2025"
                  type="number"
                  onChange={(value) =>
                    setNewBook({
                      ...newBook,
                      publication_year: value,
                    })
                  }
                />

                <FormInput
                  label="Edition"
                  value={newBook.edition}
                  placeholder="Example: 1st Edition"
                  onChange={(value) =>
                    setNewBook({ ...newBook, edition: value })
                  }
                />

                <div
                  style={{
                    ...styles.formGroup,
                    gridColumn: "1 / -1",
                  }}
                >
                  <label style={styles.label} htmlFor="book-description">
                    Description
                  </label>
                  <textarea
                    id="book-description"
                    value={newBook.description}
                    onChange={(event) =>
                      setNewBook({
                        ...newBook,
                        description: event.target.value,
                      })
                    }
                    placeholder="Enter book description"
                    style={styles.textarea}
                    disabled={addBookLoading}
                    required
                  />
                </div>
              </div>

              {addBookError && (
                <div style={styles.error}>{addBookError}</div>
              )}
              {addBookMessage && (
                <div style={styles.success}>{addBookMessage}</div>
              )}

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={handleCloseAddBook}
                  disabled={addBookLoading}
                  style={styles.secondaryButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addBookLoading}
                  style={styles.primaryButton}
                >
                  {addBookLoading ? "Adding..." : "Add Book"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>{icon}</div>
      <p style={styles.statLabel}>{label}</p>
      <h3 style={styles.statValue}>{value}</h3>
    </div>
  );
}

function FormInput({
  label,
  value,
  placeholder,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div style={styles.formGroup}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        min={type === "number" ? 1 : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={styles.input}
        disabled={false}
        required
      />
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  publicPageWrapper: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    width: "100%",
    backgroundColor: "#f8fafc",
  },

  publicSiteButton: {
    padding: "9px 13px",
    border: "1px solid #d0d5dd",
    borderRadius: "9px",
    background: "#f8fafc",
    color: "#344054",
    fontWeight: 600,
    fontSize: "12px",
    cursor: "pointer",
  },

  app: {
    minHeight: "100vh",
    background: "#f5f7fb",
    color: "#172033",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  loginPage: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    background: "linear-gradient(135deg, #eef2ff, #f8fafc, #ecfdf3)",
  },

  loginCard: {
    width: "100%",
    maxWidth: "480px",
    padding: "38px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "22px",
    boxShadow: "0 20px 50px rgba(15, 23, 42, 0.10)",
  },

  loginLogo: {
    width: "70px",
    height: "70px",
    margin: "0 auto 18px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "20px",
    background: "#eef2ff",
    fontSize: "34px",
  },

  loginTitle: {
    margin: 0,
    textAlign: "center",
    fontSize: "34px",
    fontWeight: 800,
    color: "#172033",
  },

  loginSubtitle: {
    margin: "8px 0 28px",
    textAlign: "center",
    color: "#667085",
    fontSize: "14px",
  },

  roleButtons: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "24px",
  },

  roleButton: {
    padding: "13px",
    border: "1px solid #d0d5dd",
    borderRadius: "10px",
    background: "#fff",
    color: "#344054",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },

  roleButtonActive: {
    border: "2px solid #4338ca",
    background: "#eef2ff",
    color: "#4338ca",
  },

  formGroup: {
    minWidth: 0,
    marginBottom: "17px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    color: "#344054",
    fontSize: "13px",
    fontWeight: 600,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #d0d5dd",
    borderRadius: "10px",
    background: "#fff",
    color: "#172033",
    fontSize: "14px",
  },

  textarea: {
    width: "100%",
    minHeight: "110px",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #d0d5dd",
    borderRadius: "10px",
    background: "#fff",
    color: "#172033",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
  },

  demoBox: {
    marginTop: "24px",
    padding: "15px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    background: "#f8fafc",
    color: "#667085",
    fontSize: "12px",
    lineHeight: 1.7,
    overflowWrap: "anywhere",
  },

  loginFooter: {
    margin: "24px 0 0",
    textAlign: "center",
    color: "#98a2b3",
    fontSize: "12px",
  },

  registerPrompt: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginTop: "18px",
    fontSize: "13px",
    color: "#667085",
  },

  registerLink: {
    background: "none",
    border: "none",
    color: "#4338ca",
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "18px",
    padding: "18px 32px",
    borderBottom: "1px solid #e5e7eb",
    background: "#fff",
  },

  logo: {
    margin: 0,
    fontSize: "27px",
    fontWeight: 800,
  },

  subtitle: {
    margin: "4px 0 0",
    color: "#667085",
    fontSize: "13px",
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
  },

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },

  userAvatar: {
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#4338ca",
    color: "#fff",
    fontWeight: 700,
  },

  userName: {
    display: "block",
    fontSize: "13px",
  },

  userRole: {
    display: "block",
    marginTop: "3px",
    color: "#667085",
    fontSize: "11px",
  },

  status: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 13px",
    borderRadius: "20px",
    background: "#ecfdf3",
    color: "#027a48",
    fontSize: "12px",
    fontWeight: 600,
  },

  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#12b76a",
  },

  logoutButton: {
    padding: "10px 15px",
    border: "1px solid #d0d5dd",
    borderRadius: "9px",
    background: "#fff",
    color: "#344054",
    fontWeight: 600,
    cursor: "pointer",
  },

  container: {
    width: "100%",
    maxWidth: "1250px",
    boxSizing: "border-box",
    margin: "0 auto",
    padding: "30px 22px 55px",
  },

  welcome: {
    marginBottom: "25px",
  },

  welcomeTitle: {
    margin: 0,
    fontSize: "27px",
  },

  welcomeText: {
    margin: "8px 0 0",
    color: "#667085",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "15px",
    marginBottom: "24px",
  },

  statCard: {
    minWidth: 0,
    padding: "20px",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    background: "#fff",
    textAlign: "center",
  },

  statIcon: {
    marginBottom: "7px",
    fontSize: "25px",
  },

  statLabel: {
    margin: 0,
    color: "#667085",
    fontSize: "13px",
  },

  statValue: {
    margin: "7px 0 0",
    fontSize: "25px",
    color: "#172033",
  },

  panel: {
    marginBottom: "24px",
    padding: "24px",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    background: "#fff",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
    marginBottom: "22px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "21px",
  },

  sectionSubtitle: {
    margin: "6px 0 0",
    color: "#667085",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  studentFilters: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(180px, 1fr)",
    gap: "12px",
    marginBottom: "20px",
    alignItems: "center",
  },

  inventoryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "13px",
    marginTop: "20px",
  },

  countBadge: {
    padding: "9px 13px",
    borderRadius: "20px",
    background: "#fff7ed",
    color: "#c2410c",
    fontSize: "12px",
    fontWeight: 600,
  },

  issueList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  issueCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "18px",
    padding: "18px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    background: "#fafafa",
  },

  issueBookTitle: {
    margin: "0 0 10px",
    fontSize: "17px",
  },

  issueMeta: {
    margin: "6px 0",
    color: "#667085",
    fontSize: "12px",
    overflowWrap: "anywhere",
  },

  returnButton: {
    padding: "11px 15px",
    border: "none",
    borderRadius: "8px",
    background: "#dc2626",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },

  bookGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))",
    gap: "18px",
  },

  bookCard: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    padding: "20px",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    background: "#fff",
  },

  bookTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "15px",
  },

  category: {
    padding: "6px 9px",
    borderRadius: "6px",
    background: "#f2f4f7",
    color: "#344054",
    fontSize: "12px",
  },

  availabilityBadge: {
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
  },

  bookId: {
    color: "#98a2b3",
    fontSize: "12px",
  },

  bookTitle: {
    margin: "0 0 8px",
    fontSize: "19px",
    lineHeight: 1.4,
    overflowWrap: "anywhere",
  },

  author: {
    margin: "0 0 13px",
    color: "#475467",
    fontSize: "13px",
  },

  description: {
    flex: 1,
    margin: "0 0 16px",
    color: "#667085",
    fontSize: "13px",
    lineHeight: 1.6,
    overflowWrap: "anywhere",
  },

  bookDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "17px",
    paddingTop: "14px",
    borderTop: "1px solid #eaecf0",
    color: "#667085",
    fontSize: "12px",
    overflowWrap: "anywhere",
  },

  availability: {
    margin: "12px 0 0",
    textAlign: "center",
    fontSize: "13px",
    fontWeight: 600,
  },

  primaryButton: {
    padding: "11px 15px",
    border: "none",
    borderRadius: "9px",
    background: "#4338ca",
    color: "#fff",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },

  secondaryButton: {
    padding: "10px 15px",
    border: "1px solid #d0d5dd",
    borderRadius: "9px",
    background: "#fff",
    color: "#344054",
    fontWeight: 600,
    cursor: "pointer",
  },

  message: {
    padding: "30px 15px",
    textAlign: "center",
    color: "#667085",
    fontSize: "14px",
  },

  error: {
    marginTop: "12px",
    marginBottom: "12px",
    padding: "12px",
    border: "1px solid #fecdca",
    borderRadius: "9px",
    background: "#fef3f2",
    color: "#b42318",
    fontSize: "13px",
    overflowWrap: "anywhere",
  },

  success: {
    marginTop: "12px",
    marginBottom: "12px",
    padding: "12px",
    border: "1px solid #abefc6",
    borderRadius: "9px",
    background: "#ecfdf3",
    color: "#027a48",
    fontSize: "13px",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "18px",
    background: "rgba(15, 23, 42, 0.5)",
  },

  modal: {
    position: "relative",
    width: "100%",
    maxWidth: "500px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxSizing: "border-box",
    padding: "28px",
    borderRadius: "16px",
    background: "#fff",
    boxShadow: "0 25px 60px rgba(15, 23, 42, 0.25)",
  },

  addBookModal: {
    position: "relative",
    width: "100%",
    maxWidth: "650px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxSizing: "border-box",
    padding: "28px",
    borderRadius: "16px",
    background: "#fff",
    boxShadow: "0 25px 60px rgba(15, 23, 42, 0.25)",
  },

  modalClose: {
    position: "absolute",
    top: "10px",
    right: "14px",
    border: "none",
    background: "transparent",
    color: "#667085",
    fontSize: "28px",
    cursor: "pointer",
  },

  modalTitle: {
    margin: "0 0 8px",
    fontSize: "23px",
  },

  modalSubtitle: {
    margin: "0 0 20px",
    color: "#667085",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  selectedBook: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    marginBottom: "20px",
    padding: "14px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    background: "#f8fafc",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "0 15px",
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "15px",
  },
};

export default App;