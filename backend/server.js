const express = require("express");
const cors = require("cors");
const crypto = require("node:crypto");
require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

// ===============================
// STARTUP CONFIGURATION GUARD
// ===============================
if (
  !process.env.SESSION_SECRET ||
  typeof process.env.SESSION_SECRET !== "string" ||
  process.env.SESSION_SECRET.trim().length === 0
) {
  console.error("FATAL: SESSION_SECRET environment variable is missing or empty. Server cannot start.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// ===============================
// DATABASE CONNECTION
// ===============================

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());

// ===============================
// AUTH UTILITIES & MIDDLEWARE
// ===============================

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function issueToken(userId, role) {
  const issuedAt = Date.now();
  const payload = `${userId}:${role}:${issuedAt}`;
  const hmac = crypto
    .createHmac("sha256", process.env.SESSION_SECRET)
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

function verifyToken(token) {
  if (!token || typeof token !== "string") {
    throw new Error("Missing token");
  }
  let raw;
  try {
    raw = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    throw new Error("Malformed token encoding");
  }
  const parts = raw.split(":");
  if (parts.length !== 4) {
    throw new Error("Malformed token structure");
  }
  const [userId, role, issuedAt, clientHmac] = parts;
  const numUserId = Number(userId);
  const numIssuedAt = Number(issuedAt);

  if (!Number.isInteger(numUserId) || numUserId <= 0) {
    throw new Error("Invalid user ID in token");
  }
  if (!Number.isFinite(numIssuedAt) || numIssuedAt <= 0) {
    throw new Error("Invalid timestamp in token");
  }

  // Re-compute expected HMAC
  const payload = `${userId}:${role}:${issuedAt}`;
  const expectedHmac = crypto
    .createHmac("sha256", process.env.SESSION_SECRET)
    .update(payload)
    .digest("hex");

  const clientBuf = Buffer.from(clientHmac, "hex");
  const expectedBuf = Buffer.from(expectedHmac, "hex");

  if (
    clientBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(clientBuf, expectedBuf)
  ) {
    throw new Error("Invalid token signature");
  }

  // Check 8-hour expiry
  if (Date.now() - numIssuedAt > TOKEN_TTL_MS) {
    throw new Error("Token expired");
  }

  return { userId: numUserId, role };
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "ERROR",
      message: "Authentication required",
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      status: "ERROR",
      message: "Authentication token missing",
    });
  }

  try {
    req.auth = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({
      status: "ERROR",
      message: "Invalid or expired session",
    });
  }
}

function requireAdmin(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.auth.role !== "ADMIN") {
      return res.status(403).json({
        status: "ERROR",
        message: "Admin access required",
      });
    }
    next();
  });
}

// ===============================
// HOME API
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "SmartLib Backend is running successfully!"
  });
});

// ===============================
// HEALTH API
// ===============================

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "SmartLib API is healthy"
  });
});

// ===============================
// DATABASE TEST API
// ===============================

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "OK",
      message: "PostgreSQL connected successfully",
      time: result.rows[0].now
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Database connection failed"
    });
  }
});

// ===============================
// BOOKS API
// ===============================

// GET all books
app.get("/api/books", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        books.id,
        books.title,
        books.isbn,
        books.publisher,
        books.publication_year,
        books.edition,
        books.description,
        authors.name AS author_name,
        categories.name AS category_name
      FROM books
      LEFT JOIN authors
        ON books.author_id = authors.id
      LEFT JOIN categories
        ON books.category_id = categories.id
      ORDER BY books.id DESC
    `);

    res.json({
      status: "OK",
      books: result.rows
    });

  } catch (error) {
    console.error("Books fetch error:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch books"
    });
  }
});


/* =========================================
   GET ALL AUTHORS
========================================= */
app.get("/api/authors", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, bio
      FROM authors
      ORDER BY name ASC
    `);

    res.json({
      status: "OK",
      authors: result.rows,
    });
  } catch (error) {
    console.error("Authors fetch error:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch authors",
    });
  }
});

/* =========================================
   GET ALL CATEGORIES
========================================= */
app.get("/api/categories", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, description
      FROM categories
      ORDER BY name ASC
    `);

    res.json({
      status: "OK",
      categories: result.rows,
    });
  } catch (error) {
    console.error("Categories fetch error:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch categories",
    });
  }
});


// ===============================
// DASHBOARD API
// ===============================

app.get("/api/dashboard", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM books) AS total_books,
        (SELECT COUNT(*) FROM authors) AS total_authors,
        (SELECT COUNT(*) FROM categories) AS total_categories,
        (SELECT COUNT(*) FROM book_copies) AS total_copies,
        (SELECT COUNT(*) FROM book_copies WHERE status = 'AVAILABLE') AS available_copies,
        (SELECT COUNT(*) FROM book_copies WHERE status = 'BORROWED') AS borrowed_copies,
        (SELECT COUNT(*) FROM borrow_transactions WHERE status = 'ISSUED') AS active_issues
    `);

    res.json({
      status: "OK",
      dashboard: result.rows[0]
    });

  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch dashboard statistics"
    });
  }
});

// ===============================
// START SERVER
// ===============================

// ===============================
// LOGIN API
// ===============================

app.post("/api/login", async (req, res) => {
  const { email, password, role } = req.body;

  try {
    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({
        status: "ERROR",
        message: "Email and password are required",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 2. Find user by email including membership_type and account_status
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        password_hash,
        role,
        membership_type,
        account_status
      FROM users
      WHERE LOWER(email) = $1
      `,
      [cleanEmail]
    );

    // 3. User not found
    if (result.rows.length === 0) {
      return res.status(401).json({
        status: "ERROR",
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    // Optional role check from client request
    if (role && user.role !== role) {
      return res.status(403).json({
        status: "ERROR",
        message: "You are not authorized to log in with this role",
      });
    }

    // 4. Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        status: "ERROR",
        message: "Invalid email or password",
      });
    }

    // 5. Account approval status check
    if (user.account_status !== "ACTIVE") {
      if (user.account_status === "PENDING_APPROVAL") {
        return res.status(403).json({
          status: "ERROR",
          message: "Your account is awaiting administrator approval.",
        });
      }
      if (user.account_status === "REJECTED") {
        return res.status(403).json({
          status: "ERROR",
          message: "Your registration has been rejected. Please contact the library administrator.",
        });
      }
      return res.status(403).json({
        status: "ERROR",
        message: "Your account is not active. Please contact the library administrator.",
      });
    }

    // 6. Issue signed HMAC session token
    const token = issueToken(user.id, user.role);

    // 7. Login successful (never return password_hash)
    res.json({
      status: "OK",
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        membership_type: user.membership_type,
        account_status: user.account_status,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Login failed",
    });
  }
});

// ===============================
// STUDENT REGISTRATION API
// ===============================

app.post("/api/register", async (req, res) => {
  const { name, email, password, confirmPassword, membership_type } = req.body;

  try {
    // 1. Validate required fields
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        status: "ERROR",
        message: "Name, email, password and confirm password are required",
      });
    }

    // 2. Clean input
    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    // 3. Validate name
    if (cleanName.length < 2) {
      return res.status(400).json({
        status: "ERROR",
        message: "Please enter a valid name",
      });
    }

    // 4. Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        status: "ERROR",
        message: "Please enter a valid email address",
      });
    }

    // 5. Validate password
    if (password.length < 8) {
      return res.status(400).json({
        status: "ERROR",
        message: "Password must be at least 8 characters",
      });
    }

    // 6. Confirm password
    if (password !== confirmPassword) {
      return res.status(400).json({
        status: "ERROR",
        message: "Passwords do not match",
      });
    }

    // 7. Validate membership_type (accept only 'BOOK_ONLY' or 'COMBO', default 'BOOK_ONLY')
    const allowedMemberships = ["BOOK_ONLY", "COMBO"];
    const cleanMembership = allowedMemberships.includes(membership_type)
      ? membership_type
      : "BOOK_ONLY";

    // 8. Check whether email already exists
    const existingUser = await pool.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(email) = $1
      `,
      [cleanEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        status: "ERROR",
        message: "An account with this email already exists",
      });
    }

    // 9. Hash password securely using existing bcrypt dependency
    const passwordHash = await bcrypt.hash(password, 12);

    // 10. Create STUDENT account with PENDING_APPROVAL status
    // Role is strictly fixed as 'STUDENT'
    // Status is strictly set to 'PENDING_APPROVAL'
    const result = await pool.query(
      `
      INSERT INTO users
        (name, email, password_hash, role, membership_type, account_status)
      VALUES
        ($1, $2, $3, 'STUDENT', $4, 'PENDING_APPROVAL')
      RETURNING id, name, email, role, membership_type, account_status, created_at
      `,
      [cleanName, cleanEmail, passwordHash, cleanMembership]
    );

    // 11. Registration successful (never return password_hash)
    res.status(201).json({
      status: "OK",
      message: "Student account created successfully. Awaiting administrator approval.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Student registration error:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Registration failed",
    });
  }
});

// ===============================
// ADMIN USER APPROVAL API
// ===============================

// GET all pending student registrations (ADMIN ONLY)
app.get("/api/admin/pending-users", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        role,
        membership_type,
        account_status,
        created_at
      FROM users
      WHERE account_status = 'PENDING_APPROVAL'
      ORDER BY created_at ASC
      `
    );

    res.json({
      status: "OK",
      users: result.rows,
    });
  } catch (error) {
    console.error("Fetch pending users error:", error);
    res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch pending user registrations",
    });
  }
});

// Approve a student registration (ADMIN ONLY)
app.post("/api/admin/users/:id/approve", requireAdmin, async (req, res) => {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      status: "ERROR",
      message: "Invalid user ID",
    });
  }

  try {
    const result = await pool.query(
      `
      UPDATE users
      SET account_status = 'ACTIVE'
      WHERE id = $1
      RETURNING id, name, email, role, membership_type, account_status
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "ERROR",
        message: "User not found",
      });
    }

    res.json({
      status: "OK",
      message: "User account approved successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Approve user error:", error);
    res.status(500).json({
      status: "ERROR",
      message: "Failed to approve user account",
    });
  }
});

// Reject a student registration (ADMIN ONLY)
app.post("/api/admin/users/:id/reject", requireAdmin, async (req, res) => {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      status: "ERROR",
      message: "Invalid user ID",
    });
  }

  try {
    const result = await pool.query(
      `
      UPDATE users
      SET account_status = 'REJECTED'
      WHERE id = $1
      RETURNING id, name, email, role, membership_type, account_status
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "ERROR",
        message: "User not found",
      });
    }

    res.json({
      status: "OK",
      message: "User account rejected successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Reject user error:", error);
    res.status(500).json({
      status: "ERROR",
      message: "Failed to reject user account",
    });
  }
});

// ===============================
// ADD BOOK API
// ===============================

app.post("/api/books", requireAdmin, async (req, res) => {
  const {
    title,
    isbn,
    author_id,
    category_id,
    publisher,
    publication_year,
    edition,
    description
  } = req.body;

  try {
    // 1. Required fields check
    if (!title || !isbn) {
      return res.status(400).json({
        status: "ERROR",
        message: "Title and ISBN are required"
      });
    }

    // 2. Check whether ISBN already exists
    const existingBook = await pool.query(
      `
      SELECT id
      FROM books
      WHERE isbn = $1
      `,
      [isbn]
    );

    if (existingBook.rows.length > 0) {
      return res.status(400).json({
        status: "ERROR",
        message: "A book with this ISBN already exists"
      });
    }

    // 3. Check author if provided
    if (author_id) {
      const authorResult = await pool.query(
        `
        SELECT id
        FROM authors
        WHERE id = $1
        `,
        [author_id]
      );

      if (authorResult.rows.length === 0) {
        return res.status(404).json({
          status: "ERROR",
          message: "Author not found"
        });
      }
    }

    // 4. Check category if provided
    if (category_id) {
      const categoryResult = await pool.query(
        `
        SELECT id
        FROM categories
        WHERE id = $1
        `,
        [category_id]
      );

      if (categoryResult.rows.length === 0) {
        return res.status(404).json({
          status: "ERROR",
          message: "Category not found"
        });
      }
    }

    // 5. Insert new book
    const result = await pool.query(
      `
      INSERT INTO books
        (
          title,
          isbn,
          author_id,
          category_id,
          publisher,
          publication_year,
          edition,
          description
        )
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        title,
        isbn,
        author_id || null,
        category_id || null,
        publisher || null,
        publication_year || null,
        edition || null,
        description || null
      ]
    );

    res.status(201).json({
      status: "OK",
      message: "Book added successfully",
      book: result.rows[0]
    });

  } catch (error) {
    console.error("Add book error:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Failed to add book"
    });
  }
});

// ===============================
// ISSUE BOOK API
// ===============================

// ===============================
// AVAILABLE BOOK COPIES API
// ===============================

app.get("/api/book-copies/available", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        book_copies.id AS copy_id,
        book_copies.book_id,
        book_copies.accession_number,
        book_copies.barcode,
        book_copies.location,
        books.title
      FROM book_copies
      INNER JOIN books
        ON book_copies.book_id = books.id
      WHERE book_copies.status = 'AVAILABLE'
      ORDER BY books.title
    `);

    res.json({
      status: "OK",
      copies: result.rows
    });

  } catch (error) {
    console.error("Available copies error:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch available book copies"
    });
  }
});


// ===============================
// ACTIVE ISSUES API
// ===============================


app.get("/api/issues", authMiddleware, async (req, res) => {
  try {
    let targetUserId = null;

    if (req.auth.role === "ADMIN") {
      // Admin can view all active issues or filter by specific user_id
      if (req.query.user_id !== undefined) {
        const parsedId = Number(req.query.user_id);
        if (!Number.isInteger(parsedId) || parsedId <= 0) {
          return res.status(400).json({
            status: "ERROR",
            message: "Invalid user ID",
          });
        }
        targetUserId = parsedId;
      }
    } else {
      // Student is strictly bound to their verified token identity
      targetUserId = req.auth.userId;
    }

    const query = `
      SELECT
        borrow_transactions.id AS transaction_id,
        borrow_transactions.user_id,
        borrow_transactions.copy_id,
        borrow_transactions.issue_date,
        borrow_transactions.due_date,
        users.name AS user_name,
        users.email AS user_email,
        books.title,
        book_copies.accession_number,
        book_copies.barcode
      FROM borrow_transactions
      INNER JOIN users
        ON borrow_transactions.user_id = users.id
      INNER JOIN book_copies
        ON borrow_transactions.copy_id = book_copies.id
      INNER JOIN books
        ON book_copies.book_id = books.id
      WHERE borrow_transactions.status = 'ISSUED'
        AND ($1::integer IS NULL OR borrow_transactions.user_id = $1)
      ORDER BY borrow_transactions.issue_date DESC
    `;

    const result = await pool.query(query, [targetUserId]);

    res.json({
      status: "OK",
      issues: result.rows,
    });
  } catch (error) {
    console.error("Issues fetch error:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch active issues",
    });
  }
});


app.post("/api/books/issue", requireAdmin, async (req, res) => {
  const { user_id, copy_id } = req.body;

  try {
    // 1. Check whether user exists
    const userResult = await pool.query(
      `
      SELECT id
      FROM users
      WHERE id = $1
      `,
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        status: "ERROR",
        message: "User not found"
      });
    }

    // 2. Check whether book copy exists and is available
    const copyResult = await pool.query(
      `
      SELECT id, book_id, status
      FROM book_copies
      WHERE id = $1
      `,
      [copy_id]
    );

    if (copyResult.rows.length === 0) {
      return res.status(404).json({
        status: "ERROR",
        message: "Book copy not found"
      });
    }

    if (copyResult.rows[0].status !== "AVAILABLE") {
      return res.status(400).json({
        status: "ERROR",
        message: "Book copy is not available"
      });
    }

    // 3. Set due date = 14 days from today
    const transactionResult = await pool.query(
      `
      INSERT INTO borrow_transactions
        (user_id, copy_id, due_date, status)
      VALUES
        ($1, $2, CURRENT_TIMESTAMP + INTERVAL '14 days', 'ISSUED')
      RETURNING *
      `,
      [user_id, copy_id]
    );

    // 4. Mark book copy as borrowed
    await pool.query(
      `
      UPDATE book_copies
      SET status = 'BORROWED'
      WHERE id = $1
      `,
      [copy_id]
    );

    res.json({
      status: "OK",
      message: "Book issued successfully",
      transaction: transactionResult.rows[0]
    });

  } catch (error) {
    console.error("Issue book error:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Failed to issue book"
    });
  }
});

// ===============================
// RETURN BOOK API
// ===============================

app.post("/api/books/return", requireAdmin, async (req, res) => {
  const { transaction_id } = req.body;

  try {
    // 1. Find active transaction
    const transactionResult = await pool.query(
      `
      SELECT copy_id
      FROM borrow_transactions
      WHERE id = $1
        AND status = 'ISSUED'
      `,
      [transaction_id]
    );

    if (transactionResult.rows.length === 0) {
      return res.status(404).json({
        status: "ERROR",
        message: "Active borrow transaction not found"
      });
    }

    const copyId = transactionResult.rows[0].copy_id;

    // 2. Mark transaction as returned
    await pool.query(
      `
      UPDATE borrow_transactions
      SET
        status = 'RETURNED',
        return_date = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [transaction_id]
    );

    // 3. Make book copy available again
    await pool.query(
      `
      UPDATE book_copies
      SET status = 'AVAILABLE'
      WHERE id = $1
      `,
      [copyId]
    );

    res.json({
      status: "OK",
      message: "Book returned successfully"
    });

  } catch (error) {
    console.error("Return book error:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Failed to return book"
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `SmartLib Backend running at http://localhost:${PORT}`
  );
});