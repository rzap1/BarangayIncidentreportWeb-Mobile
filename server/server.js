const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Create uploads folder if it doesn't exist
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer config for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "db",
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL");
  }
});

// Login route
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const sql = "SELECT * FROM users WHERE USER = ? AND PASSWORD = ?";
  db.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error("❌ SQL error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = results[0];

    if (user.STATUS === "Verified") {
      return res.json({ success: true, message: "Login successful" });
    } else if (user.STATUS === "Pending") {
      return res.status(403).json({ error: "Account status is Pending. Please verify your account." });
    } else {
      return res.status(403).json({ error: `Account status "${user.STATUS}" does not allow login.` });
    }
  });
});

// API endpoint to fetch all users
app.get("/api/users", (req, res) => {
  const sql = "SELECT ID, USER, NAME, EMAIL,ADDRESS, ROLE, STATUS FROM users";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ SQL error:", err);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
    res.json(results);
  });
});

// Update user by ID
app.put("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  const { username, role, name, email,address, status } = req.body;

  if (!userId || !username || !role || !name) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const sql = "UPDATE users SET USER = ?, ROLE = ?, NAME = ?, EMAIL = ?, ADDRESS = ?, STATUS = ? WHERE ID = ?";
  
  db.query(sql, [username, role, name, email,address, status, userId], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ success: false, message: "Username already exists" });
      }
      console.error("❌ SQL update error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User updated successfully" });
  });
});

// Delete user by ID
app.delete("/api/users/:id", (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID is required" });
  }

  const sql = "DELETE FROM users WHERE ID = ?";
  
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("❌ SQL delete error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  });
});

// Fetch incidents
app.get("/api/incidents", (req, res) => {
  const sql = `
    SELECT id, incident_type, location, status, datetime, image, reported_by
    FROM incident_report
    ORDER BY datetime DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ SQL error:", err);
      return res.status(500).json({ error: "Failed to fetch incidents" });
    }
    res.json(results);
  });
});

// Insert incident with image file upload
app.post("/api/incidents", upload.single("image"), (req, res) => {
  const { incidentType, latitude, longitude, datetime, address, reported_by } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!incidentType || !latitude || !longitude || !datetime || !address || !reported_by) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const latNum = parseFloat(latitude);
  const lonNum = parseFloat(longitude);
  if (isNaN(latNum) || isNaN(lonNum)) {
    return res.status(400).json({ error: "Invalid coordinates" });
  }

  const status = "Under Review";

  console.log("Received incident report:", {
    incidentType,
    latitude: latNum,
    longitude: lonNum,
    datetime,
    address,
    reported_by,
    image,
  });

  const sql = `
    INSERT INTO incident_report (incident_type, latitude, longitude, datetime, image, location, status, reported_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [incidentType, latNum, lonNum, datetime, image, address, status, reported_by],
    (err, result) => {
      if (err) {
        console.error("❌ SQL insert error:", err);
        return res.status(500).json({ error: "Failed to insert incident" });
      }

      res.json({ success: true, message: "Incident reported", id: result.insertId });
    }
  );
});

// Register route
app.post("/register", (req, res) => {
  const { username, password, role, name, email,address } = req.body;
  const status = "Pending";

  if (!username || !password || !role || !name || !email|| !address) {
  return res.status(400).json({ success: false, message: "Missing required fields" });
}

  // Updated SQL query to include NAME and EMAIL fields
  const sql = "INSERT INTO users (USER, PASSWORD, ROLE, STATUS, NAME, EMAIL,ADDRESS) VALUES (?, ?, ?, ?, ?, ?,?)";
  
  db.query(sql, [username, password, role, status, name, email,address], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ success: false, message: "Username already exists" });
      }
      console.error("❌ SQL insert error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    res.json({ success: true, message: "User registered successfully" });
  });
});

// Start server
app.listen(3001, () => {
  console.log("✅ Server running on http://localhost:3001");
});