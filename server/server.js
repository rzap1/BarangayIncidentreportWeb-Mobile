const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MySQL connection
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

// ✅ Login route
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

// ✅ Fetch incidents route
app.get("/api/incidents", (req, res) => {
  const sql = "SELECT * FROM incident_report"; // Query to fetch all incidents from the table
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ SQL error:", err);
      return res.status(500).json({ error: "Failed to fetch incidents" });
    }
    res.json(results);  // Return the results from the incident_report table
  });
});


// ✅ Start server
app.listen(3001, () => {
  console.log("✅ Server running on http://localhost:3001");
});
