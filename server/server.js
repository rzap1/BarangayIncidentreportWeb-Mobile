const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",        // replace with your MySQL user
  password: "",        // replace with your MySQL password
  database: "db"       // replace with your database name
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL");
  }
});

// Login route (your existing code)
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

    if (results.length > 0) {
      res.json({ success: true, message: "Login successful" });
    } else {
      res.status(401).json({ error: "Invalid username or password" });
    }
  });
});

// Fetch incidents route
app.get("/api/incidents", (req, res) => {
  const sql = "SELECT * FROM incident_report";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ SQL error:", err);
      return res.status(500).json({ error: "Failed to fetch incidents" });
    }
    res.json(results);
  });
});

// ** ADD POST route for incident insertion **
app.post("/api/incidents", (req, res) => {
  const { incidentType, pinLocation, datetime, image } = req.body;

  // Basic validation
  if (!incidentType || !pinLocation || !datetime) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Example insert query - adjust column names and table name as needed
  const sql = `
    INSERT INTO incident_report (incident_type, latitude, longitude, datetime, image)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      incidentType,
      pinLocation.latitude,
      pinLocation.longitude,
      datetime,
      image || null, // allow null if no image
    ],
    (err, result) => {
      if (err) {
        console.error("❌ SQL insert error:", err);
        return res.status(500).json({ error: "Failed to insert incident" });
      }

      res.json({ success: true, message: "Incident reported", id: result.insertId });
    }
  );
});

// Start server
app.listen(3001, () => {
  console.log("✅ Server running on http://localhost:3001");
});
