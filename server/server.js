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

// Helper function to get GMT+8 time
function getGMT8Time() {
  const now = new Date();
  // Convert to GMT+8 (8 hours ahead of UTC)
  const gmt8Time = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  return gmt8Time.toISOString().slice(0, 19).replace('T', ' ');
}

// Updated Login route with client-based role restrictions
app.post("/login", (req, res) => {
  const { username, password, clientType } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  // Validate clientType parameter
  if (!clientType || !['web', 'mobile'].includes(clientType)) {
    return res.status(400).json({ 
      error: "Client type is required and must be 'web' or 'mobile'" 
    });
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

    // Check if user status allows login
    if (user.STATUS !== "Verified") {
      if (user.STATUS === "Pending") {
        return res.status(403).json({ 
          error: "Account status is Pending. Please verify your account." 
        });
      } else {
        return res.status(403).json({ 
          error: `Account status "${user.STATUS}" does not allow login.` 
        });
      }
    }

    // Apply role restrictions based on client type
    let allowedRoles = [];
    let clientName = "";

    if (clientType === 'web') {
      // ReactJS - Only Admin allowed
      allowedRoles = ['Admin'];
      clientName = "web application";
    } else if (clientType === 'mobile') {
      // React Native - Only Tanod and Resident allowed
      allowedRoles = ['Tanod', 'Resident'];
      clientName = "mobile application";
    }

    // Check if user role is allowed for this client
    if (!allowedRoles.includes(user.ROLE)) {
      return res.status(403).json({ 
        error: `Access denied. Only ${allowedRoles.join(' and ')} users are allowed to access the ${clientName}.` 
      });
    }

    // Return success with user data (excluding password for security)
    return res.json({ 
      success: true, 
      message: "Login successful",
      user: {
        id: user.ID,
        username: user.USER,
        name: user.NAME,
        email: user.EMAIL,
        address: user.ADDRESS,
        role: user.ROLE,
        status: user.STATUS,
        image: user.IMAGE
      }
    });
  });
});

// API endpoint to fetch all users
app.get("/api/users", (req, res) => {
  const sql = "SELECT ID, USER, NAME, EMAIL, ADDRESS, ROLE, STATUS, IMAGE FROM users";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ SQL error:", err);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
    res.json(results);
  });
});

// Update user by ID with image upload support (for accounts management)
app.put("/api/users/:id", upload.single("image"), (req, res) => {
  const userId = req.params.id;
  const { username, role, name, email, address, status, password } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID is required" });
  }

  console.log('Updating user by ID:', {
    userId,
    data: { username, role, name, email, address, status, password: password ? '[PROVIDED]' : '[NOT PROVIDED]' },
    hasImage: !!image
  });

  // Get current user data first
  const getUserSql = "SELECT USER, NAME, EMAIL, ADDRESS, ROLE, STATUS, IMAGE FROM users WHERE ID = ?";
  
  db.query(getUserSql, [userId], (err, userResults) => {
    if (err) {
      console.error("❌ SQL error fetching user:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const currentUser = userResults[0];
    
    // Build dynamic SQL query - only update provided fields
    let sql = "UPDATE users SET ";
    let params = [];
    let updateFields = [];

    // Add fields to update only if they are provided
    if (username && username.trim()) {
      updateFields.push("USER = ?");
      params.push(username.trim());
    }

    if (name && name.trim()) {
      updateFields.push("NAME = ?");
      params.push(name.trim());
    }

    if (email && email.trim()) {
      updateFields.push("EMAIL = ?");
      params.push(email.trim());
    }

    if (address !== undefined) { // Allow empty string to clear address
      updateFields.push("ADDRESS = ?");
      params.push(address.trim());
    }

    if (role && role.trim()) {
      updateFields.push("ROLE = ?");
      params.push(role.trim());
    }
    
    if (status && status.trim()) {
      updateFields.push("STATUS = ?");
      params.push(status.trim());
    }
    
    if (password && password.trim()) {
      updateFields.push("PASSWORD = ?");
      params.push(password.trim());
    }
    
    if (image) {
      updateFields.push("IMAGE = ?");
      params.push(image);
      
      // Delete old image if it exists
      if (currentUser.IMAGE && currentUser.IMAGE.trim() !== '') {
        const oldImagePath = path.join(__dirname, "uploads", currentUser.IMAGE);
        fs.unlink(oldImagePath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error("Error deleting old profile image:", err);
          } else {
            console.log("Old profile image deleted:", currentUser.IMAGE);
          }
        });
      }
    }

    // Check if there are fields to update
    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    // Complete the SQL query
    sql += updateFields.join(", ");
    sql += " WHERE ID = ?";
    params.push(userId);

    console.log('SQL Query:', sql);
    console.log('Parameters (excluding password):', params.map((p, i) => 
      updateFields[i] && updateFields[i].includes('PASSWORD') ? '[HIDDEN]' : p
    ));

    // Execute the update
    db.query(sql, params, (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ success: false, message: "Username already exists" });
        }
        console.error("❌ SQL update error:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "User not found or no changes made" });
      }

      console.log(`✅ User updated successfully. ID: ${userId}`);
      
      // Return success response with updated image filename if applicable
      const response = { 
        success: true, 
        message: "User updated successfully"
      };
      
      if (image) {
        response.image = image;
      }
      
      res.json(response);
    });
  });
});

// Get user by username
app.get("/api/user/:username", (req, res) => {
  const username = req.params.username;
  
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }
  
  const sql = "SELECT ID, USER, NAME, EMAIL, ADDRESS, ROLE, STATUS, IMAGE FROM users WHERE USER = ?";
  
  db.query(sql, [username], (err, results) => {
    if (err) {
      console.error("❌ SQL error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(results[0]);
  });
});

// Update user profile by username (for navbar profile modal)
app.put("/api/user/:username", upload.single("image"), (req, res) => {
  const username = req.params.username;
  const { name, username: newUsername, password, address, email } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!username) {
    return res.status(400).json({ success: false, message: "Username is required" });
  }

  console.log('Updating user profile:', {
    originalUsername: username,
    newData: { name, newUsername, password: password ? '[PROVIDED]' : '[NOT PROVIDED]', address, email },
    hasImage: !!image
  });

  // First, get the current user data to check what exists
  const getUserSql = "SELECT ID, USER, NAME, EMAIL, ADDRESS, IMAGE FROM users WHERE USER = ?";
  
  db.query(getUserSql, [username], (err, userResults) => {
    if (err) {
      console.error("❌ SQL error fetching user:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const currentUser = userResults[0];
    
    // Build dynamic SQL query - only update provided fields
    let sql = "UPDATE users SET ";
    let params = [];
    let updateFields = [];

    // Add fields to update only if they are provided
    if (name && name.trim()) {
      updateFields.push("NAME = ?");
      params.push(name.trim());
    }

    if (newUsername && newUsername.trim()) {
      updateFields.push("USER = ?");
      params.push(newUsername.trim());
    }

    if (password && password.trim()) {
      updateFields.push("PASSWORD = ?");
      params.push(password.trim());
    }

    if (address !== undefined) { // Allow empty string to clear address
      updateFields.push("ADDRESS = ?");
      params.push(address.trim());
    }

    if (email && email.trim()) {
      updateFields.push("EMAIL = ?");
      params.push(email.trim());
    }

    if (image) {
      updateFields.push("IMAGE = ?");
      params.push(image);
      
      // Delete old image if it exists
      if (currentUser.IMAGE && currentUser.IMAGE.trim() !== '') {
        const oldImagePath = path.join(__dirname, "uploads", currentUser.IMAGE);
        fs.unlink(oldImagePath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error("Error deleting old profile image:", err);
          } else {
            console.log("Old profile image deleted:", currentUser.IMAGE);
          }
        });
      }
    }

    // Check if there are fields to update
    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    // Complete the SQL query
    sql += updateFields.join(", ");
    sql += " WHERE USER = ?";
    params.push(username);

    console.log('SQL Query:', sql);
    console.log('Parameters:', params);

    // Execute the update
    db.query(sql, params, (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ success: false, message: "Username already exists" });
        }
        console.error("❌ SQL update error:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "User not found or no changes made" });
      }

      console.log(`✅ User profile updated successfully for: ${username}`);
      
      // Return success response with updated image filename if applicable
      const response = { 
        success: true, 
        message: "User profile updated successfully"
      };
      
      if (image) {
        response.image = image;
      }
      
      // If username was changed, include the new username
      if (newUsername && newUsername.trim()) {
        response.newUsername = newUsername.trim();
      }
      
      res.json(response);
    });
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
    SELECT id, incident_type, location, status, datetime, image, reported_by, latitude, longitude
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

// Update incident status by ID
app.put("/api/incidents/:id/status", (req, res) => {
  const incidentId = req.params.id;
  const { status, assigned_tanod } = req.body;

  if (!incidentId || !status) {
    return res.status(400).json({ success: false, message: "Incident ID and status are required" });
  }

  // Validate status value
  const validStatuses = ["Under Review", "In Progress", "Resolved"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid status. Must be one of: Under Review, In Progress, Resolved" 
    });
  }

  // Build SQL query dynamically
  let sql = "UPDATE incident_report SET status = ?";
  let params = [status, incidentId];

  // Add assigned to query if provided
  if (assigned_tanod) {
    sql = "UPDATE incident_report SET status = ?, assigned = ? WHERE id = ?";
    params = [status, assigned_tanod, incidentId];
  } else {
    sql += " WHERE id = ?";
  }
  
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("❌ SQL update error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Incident not found" });
    }

    res.json({ 
      success: true, 
      message: "Incident status updated successfully",
      status: status,
      assigned_tanod: assigned_tanod || null
    });
  });
});

// API endpoint to fetch incidents assigned to a specific user
app.get("/api/incidents/assigned/:username", (req, res) => {
  const username = req.params.username;
  
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }
  
  // Fetch non-resolved incidents AND resolved incidents from the last 7 days
  const sql = `
    SELECT id, incident_type as type, location, status, datetime as created_at, 
           image, reported_by, latitude, longitude, assigned, resolved_by, resolved_at
    FROM incident_report 
    WHERE assigned = ? 
    AND (
      status != 'Resolved' 
      OR (status = 'Resolved' AND resolved_at >= DATE_SUB(NOW(), INTERVAL 7 DAY))
    )
    ORDER BY datetime DESC
  `;
  
  db.query(sql, [username], (err, results) => {
    if (err) {
      console.error("❌ SQL error fetching assigned incidents:", err);
      return res.status(500).json({ error: "Failed to fetch assigned incidents" });
    }
    
    console.log(`Fetched ${results.length} assigned incidents for ${username} (including resolved within 7 days)`);
    res.json(results);
  });
});

// API endpoint to mark incident as resolved (FIXED VERSION)
app.put("/api/incidents/:id/resolve", (req, res) => {
  const incidentId = req.params.id;
  const { resolved_by } = req.body; // Optional: track who resolved it
  
  if (!incidentId) {
    return res.status(400).json({ 
      success: false, 
      message: "Incident ID is required" 
    });
  }
  
  // Update with current GMT+8 timestamp for resolved_at
  const resolvedAt = getGMT8Time();
  const sql = `UPDATE incident_report SET status = 'Resolved', resolved_at = ?, resolved_by = ? WHERE id = ?`;
  
  db.query(sql, [resolvedAt, resolved_by || null, incidentId], (err, result) => {
    if (err) {
      console.error("❌ SQL update error:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Database error" 
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Incident not found" 
      });
    }
    
    // Log the resolution action
    if (resolved_by) {
      const logSql = `
        INSERT INTO logs_patrol (USER, TIME, ACTION, LOCATION)
        VALUES (?, ?, ?, ?)
      `;
      
      // Get incident details for logging
      const getIncidentSql = "SELECT incident_type, location FROM incident_report WHERE id = ?";
      db.query(getIncidentSql, [incidentId], (err, incidentResults) => {
        if (!err && incidentResults.length > 0) {
          const incident = incidentResults[0];
          db.query(logSql, [
            resolved_by, 
            getGMT8Time(), 
            `Resolved Incident: ${incident.incident_type}`,
            incident.location
          ], (logErr) => {
            if (logErr) {
              console.error("Error logging incident resolution:", logErr);
            }
          });
        }
      });
    }
    
    res.json({ 
      success: true, 
      message: "Incident marked as resolved successfully",
      incident_id: incidentId,
      status: 'Resolved',
      resolved_at: resolvedAt,
      resolved_by: resolved_by || null
    });
  });
});

// API endpoint to get incident details by ID
app.get("/api/incidents/:id", (req, res) => {
  const incidentId = req.params.id;
  
  if (!incidentId) {
    return res.status(400).json({ error: "Incident ID is required" });
  }
  
  const sql = `
    SELECT id, incident_type as type, location, status, datetime as created_at,
           image, reported_by, latitude, longitude, assigned, resolved_by, resolved_at
    FROM incident_report 
    WHERE id = ?
  `;
  
  db.query(sql, [incidentId], (err, results) => {
    if (err) {
      console.error("❌ SQL error fetching incident:", err);
      return res.status(500).json({ error: "Failed to fetch incident details" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: "Incident not found" });
    }
    
    res.json(results[0]);
  });
});

// API endpoint to check for new incident assignments for a user
app.get("/api/incidents/new-assignments/:username", (req, res) => {
  const username = req.params.username;
  const { last_check } = req.query; // Optional timestamp for checking new assignments
  
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }
  
  let sql = `
    SELECT id, incident_type as type, location, status, datetime as created_at,
           reported_by, assigned
    FROM incident_report 
    WHERE assigned = ? AND status != 'Resolved'
  `;
  
  const params = [username];
  
  // If last_check timestamp is provided, only get assignments after that time
  if (last_check) {
    sql += ` AND datetime > ?`;
    params.push(last_check);
  }
  
  sql += ` ORDER BY datetime DESC`;
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ SQL error fetching new assignments:", err);
      return res.status(500).json({ error: "Failed to fetch new assignments" });
    }
    
    res.json({
      success: true,
      new_assignments: results,
      count: results.length
    });
  });
});

// NEW: API endpoint to get all incidents (including resolved) for history view
app.get("/api/incidents/history/:username", (req, res) => {
  const username = req.params.username;
  
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }
  
  // Fetch all incidents assigned to user, including resolved ones
  const sql = `
    SELECT id, incident_type as type, location, status, datetime as created_at, 
           image, reported_by, latitude, longitude, assigned, resolved_by, resolved_at
    FROM incident_report 
    WHERE assigned = ?
    ORDER BY datetime DESC
  `;
  
  db.query(sql, [username], (err, results) => {
    if (err) {
      console.error("❌ SQL error fetching incident history:", err);
      return res.status(500).json({ error: "Failed to fetch incident history" });
    }
    
    console.log(`Fetched ${results.length} total incidents (including resolved) for ${username}`);
    res.json(results);
  });
});

// API endpoint to fetch incidents reported by a specific user
app.get("/api/incidents/reported/:username", (req, res) => {
  const username = req.params.username;
  
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }
  
  // Fetch all incidents reported by this user, including resolved ones from the last 7 days
  const sql = `
    SELECT id, incident_type as type, location, status, datetime as created_at, 
           image, reported_by, latitude, longitude, assigned, resolved_by, resolved_at
    FROM incident_report 
    WHERE reported_by = ? 
    AND (
      status != 'Resolved' 
      OR (status = 'Resolved' AND resolved_at >= DATE_SUB(NOW(), INTERVAL 7 DAY))
    )
    ORDER BY datetime DESC
  `;
  
  db.query(sql, [username], (err, results) => {
    if (err) {
      console.error("❌ SQL error fetching user reports:", err);
      return res.status(500).json({ error: "Failed to fetch user reports" });
    }
    
    console.log(`Fetched ${results.length} reports made by ${username} (including resolved within 7 days)`);
    res.json(results);
  });
});

// API endpoint to get all user reports (including resolved) for history view
app.get("/api/incidents/reports-history/:username", (req, res) => {
  const username = req.params.username;
  
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }
  
  // Fetch all incidents reported by user, including resolved ones
  const sql = `
    SELECT id, incident_type as type, location, status, datetime as created_at, 
           image, reported_by, latitude, longitude, assigned, resolved_by, resolved_at
    FROM incident_report 
    WHERE reported_by = ?
    ORDER BY datetime DESC
  `;
  
  db.query(sql, [username], (err, results) => {
    if (err) {
      console.error("❌ SQL error fetching user report history:", err);
      return res.status(500).json({ error: "Failed to fetch user report history" });
    }
    
    console.log(`Fetched ${results.length} total reports (including resolved) made by ${username}`);
    res.json(results);
  });
});

// Register route
app.post("/register", (req, res) => {
  const { username, password, role, name, email, address } = req.body;
  const status = "Pending";

  if (!username || !password || !role || !name || !email || !address) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  // Updated SQL query to include NAME and EMAIL fields
  const sql = "INSERT INTO users (USER, PASSWORD, ROLE, STATUS, NAME, EMAIL, ADDRESS) VALUES (?, ?, ?, ?, ?, ?, ?)";
  
  db.query(sql, [username, password, role, status, name, email, address], (err, result) => {
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

// API endpoint to create a new schedule entry
app.post("/api/schedules", (req, res) => {
  const { user, time } = req.body; // Removed status from destructuring
  
  if (!user) {
    return res.status(400).json({ success: false, message: "User is required" });
  }
  
  // Get the user's ID and IMAGE first to keep it consistent
  const getUserSQL = "SELECT ID, IMAGE FROM users WHERE USER = ?";
  
  db.query(getUserSQL, [user], (userErr, userResults) => {
    if (userErr) {
      console.error("❌ SQL error fetching user:", userErr);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    if (userResults.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const userId = userResults[0].ID;
    const userImage = userResults[0].IMAGE;
    
    // Check if this user already has a schedule entry
    const checkExistsSQL = "SELECT ID FROM schedules WHERE USER = ?";
    
    db.query(checkExistsSQL, [user], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("❌ SQL error checking schedule:", checkErr);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      
      if (checkResults.length > 0) {
        return res.status(409).json({ success: false, message: "User already has a schedule entry" });
      }
      
      // Insert the new schedule entry WITHOUT STATUS
      const insertSQL = `
        INSERT INTO schedules (ID, USER, TIME, IMAGE)
        VALUES (?, ?, ?, ?)
      `;
      
      db.query(
        insertSQL, 
        [userId, user, time || getGMT8Time(), userImage], 
        (insertErr, result) => {
          if (insertErr) {
            console.error("❌ SQL insert error:", insertErr);
            return res.status(500).json({ success: false, message: "Failed to insert schedule entry" });
          }
          
          res.json({ 
            success: true, 
            message: "Schedule entry created successfully",
            id: result.insertId
          });
        }
      );
    });
  });
});

// API endpoint to sync tanods from users table to schedules table
app.post("/api/sync-tanods", (req, res) => {
  // First, get all users with ROLE=Tanod including their IMAGE
  const getUsersSQL = `
    SELECT ID, USER, NAME, IMAGE 
    FROM users 
    WHERE ROLE = 'Tanod' AND STATUS = 'Verified'
  `;
  
  db.query(getUsersSQL, (err, users) => {
    if (err) {
      console.error("❌ SQL error fetching tanods:", err);
      return res.status(500).json({ error: "Failed to fetch tanods" });
    }
    
    if (users.length === 0) {
      return res.json({ success: true, message: "No tanods found to sync", count: 0 });
    }
    
    // For each user, check if they exist in schedules table
    let syncCount = 0;
    let errorCount = 0;
    let processedCount = 0;
    
    users.forEach(user => {
      // Log the user data to verify what we're working with
      console.log(`Processing user: ID=${user.ID}, USER=${user.USER}, IMAGE=${user.IMAGE}`);
      
      const checkExistsSQL = "SELECT ID FROM schedules WHERE ID = ? OR USER = ?";
      
      db.query(checkExistsSQL, [user.ID, user.USER], (err, exists) => {
        if (err) {
          console.error(`❌ Error checking if user ${user.USER} exists in schedules:`, err);
          errorCount++;
          processedCount++;
          checkCompleted();
        } else {
          if (exists.length === 0) {
            // User doesn't exist in schedules, add them with SAME ID as users table
            // Include the IMAGE from users table - NO LOGS INSERTION
            const insertSQL = `
              INSERT INTO schedules (ID, USER, STATUS, TIME, IMAGE)
              VALUES (?, ?, 'OFF DUTY', NULL, ?)
            `;
            
            // Ensure the ID is properly passed as a number if needed
            const userId = parseInt(user.ID, 10);
            
            // Log the values being inserted
            console.log(`Inserting schedule: ID=${userId}, USER=${user.USER}, IMAGE=${user.IMAGE}, TIME=NULL`);
            
            db.query(insertSQL, [userId, user.USER, user.IMAGE], (err, result) => {
              if (err) {
                console.error(`❌ Error adding user ${user.USER} to schedules:`, err);
                console.error(err);
                errorCount++;
              } else {
                console.log(`✅ Successfully added user ${user.USER} with ID=${userId} to schedules with IMAGE=${user.IMAGE}`);
                syncCount++;
              }
              processedCount++;
              checkCompleted();
            });
          } else {
            console.log(`User ${user.USER} already exists in schedules, skipping`);
            processedCount++;
            checkCompleted();
          }
        }
      });
    });
    
    // Helper function to check if all users have been processed
    function checkCompleted() {
      if (processedCount === users.length) {
        res.json({
          success: true,
          message: `Sync completed. Added ${syncCount} new tanods. Errors: ${errorCount}`,
          count: syncCount
        });
      }
    }
  });
});

// API endpoint to insert log entry
app.post("/api/logs", (req, res) => {
  const { user, action } = req.body;
  
  if (!user || !action) {
    return res.status(400).json({ 
      success: false, 
      message: "User and action are required" 
    });
  }
  
  const currentTime = getGMT8Time();
  
  const sql = `
    INSERT INTO logs (USER, TIME, ACTION)
    VALUES (?, ?, ?)
  `;
  
  db.query(sql, [user, currentTime, action], (err, result) => {
    if (err) {
      console.error("❌ SQL insert error for logs:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to insert log entry" 
      });
    }
    
    res.json({ 
      success: true, 
      message: "Log entry created successfully",
      id: result.insertId
    });
  });
});

// API endpoint to fetch all logs
app.get("/api/logs", (req, res) => {
  const sql = "SELECT * FROM logs ORDER BY TIME DESC";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ SQL error fetching logs:", err);
      return res.status(500).json({ error: "Failed to fetch logs" });
    }
    res.json(results);
  });
});

// API endpoint to fetch logs by user
app.get("/api/logs/:user", (req, res) => {
  const username = req.params.user;
  
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }
  
  const sql = "SELECT * FROM logs WHERE USER = ? ORDER BY TIME DESC";
  
  db.query(sql, [username], (err, results) => {
    if (err) {
      console.error("❌ SQL error fetching user logs:", err);
      return res.status(500).json({ error: "Failed to fetch user logs" });
    }
    res.json(results);
  });
});

// Schedule update endpoint
app.put("/api/schedules/:id", (req, res) => {
  const scheduleId = req.params.id;
  const { status, time, location } = req.body;
  
  if (!scheduleId) {
    return res.status(400).json({ success: false, message: "Schedule ID is required" });
  }
  
  // Build the SQL query for updating schedule
  let sql = "UPDATE schedules SET";
  const params = [];
  
  // Add fields if they are provided
  const updates = [];
  
  if (status !== undefined) {
    updates.push(" STATUS = ?");
    params.push(status);
  }
  
  if (time !== undefined) {
    updates.push(" TIME = ?");
    params.push(time);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ success: false, message: "No fields to update" });
  }
  
  sql += updates.join(",");
  sql += " WHERE ID = ?";
  params.push(scheduleId);
  
  // Update the schedule
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("❌ SQL update error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Schedule entry not found" });
    }
    
    // If time is being updated, also save to logs table with the SELECTED time (not current time)
    if (time !== undefined) {
      const logSql = `
        INSERT INTO logs (USER, TIME, LOCATION, ACTION)
        SELECT USER, ?, ?, 'NEW SCHEDULE'
        FROM schedules 
        WHERE ID = ?
      `;
      
      db.query(logSql, [time, location || 'Not specified', scheduleId], (logErr) => {
        if (logErr) {
          console.error("❌ Error saving to logs:", logErr);
          // Don't fail the main update, just log the error
        }
      });
    }
    
    res.json({ 
      success: true, 
      message: "Schedule updated successfully"
    });
  });
});

// Helper function to calculate status based on time logs
function calculateStatusFromLogs(logs, currentTime) {
  if (!logs || logs.length === 0) {
    return 'OFF DUTY';
  }
  
  const now = new Date(currentTime);
  const today = now.toISOString().slice(0, 10);
  
  // Find today's log entry
  const todayLog = logs.find(log => {
    const logDate = new Date(log.TIME).toISOString().slice(0, 10);
    return logDate === today;
  });
  
  if (!todayLog) {
    return 'OFF DUTY'; // No TIME entries today = "Off Duty"
  }
  
  // If there's both TIME_IN and TIME_OUT today = "Off Duty"
  if (todayLog.TIME_IN && todayLog.TIME_OUT) {
    return 'OFF DUTY';
  }
  
  // If there's a recent TIME_IN but no TIME_OUT today
  if (todayLog.TIME_IN && !todayLog.TIME_OUT) {
    const timeInDate = new Date(todayLog.TIME_IN);
    const hoursDiff = (now - timeInDate) / (1000 * 60 * 60); // Hours difference
    
    if (hoursDiff >= 8) {
      return 'OFF DUTY'; // Past 8 hours or more = "Off Duty"
    } else {
      return 'ON DUTY'; // Recent TIME_IN but no TIME_OUT today = "On Duty"
    }
  }
  
  return 'OFF DUTY';
}

// API endpoint to delete schedule entry
app.delete("/api/schedules/:id", (req, res) => {
  const scheduleId = req.params.id;
  
  if (!scheduleId) {
    return res.status(400).json({ success: false, message: "Schedule ID is required" });
  }
  
  const sql = "DELETE FROM schedules WHERE ID = ?";
  
  db.query(sql, [scheduleId], (err, result) => {
    if (err) {
      console.error("❌ SQL delete error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Schedule entry not found" });
    }
    
    res.json({ 
      success: true, 
      message: "Schedule entry deleted successfully" 
    });
  });
});

// API endpoint to fetch all schedules with IMAGE included
app.get("/api/schedules", (req, res) => {
  const sql = "SELECT * FROM schedules";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ SQL error:", err);
      return res.status(500).json({ error: "Failed to fetch schedules" });
    }
    res.json(results);
  });
});

// Updated API endpoint to check user's schedule and log status for current time
app.get("/api/user-time-status/:username", async (req, res) => {
  const username = req.params.username;
  
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }
  
  try {
    // Get current GMT+8 time
    const currentTime = getGMT8Time();
    const today = currentTime.slice(0, 10); // Get date part (YYYY-MM-DD)
    // Get user's schedule information
    const schedule = await new Promise((resolve, reject) => {
      const sql = "SELECT * FROM schedules WHERE USER = ?";
      db.query(sql, [username], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });

    if (!schedule) {
      return res.status(404).json({ error: "No schedule found for user" });
    }
    // Get today's log entry
    const todayLog = await new Promise((resolve, reject) => {
      const sql = "SELECT * FROM logs WHERE USER = ? AND DATE(TIME) = ? LIMIT 1";
      db.query(sql, [username, today], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });

    // Calculate hardcoded status based on today's log TIME_IN and TIME_OUT
    let calculatedStatus = 'Off Duty'; // Default status
    
    if (todayLog) {
      if (todayLog.TIME_IN && !todayLog.TIME_OUT) {
        // Has TIME_IN but no TIME_OUT = On Duty
        calculatedStatus = 'On Duty';
      } else if (todayLog.TIME_IN && todayLog.TIME_OUT) {
        // Has both TIME_IN and TIME_OUT = Off Duty
        calculatedStatus = 'Off Duty';
      }
    }

    // Use logs TIME instead of schedule TIME for scheduledTime
    let formattedScheduledTime = null;
    if (todayLog && todayLog.TIME) {
      // Use the TIME from logs table instead of schedules table
      formattedScheduledTime = todayLog.TIME;
    }

    res.json({
      success: true,
      schedule: {
        id: schedule.ID,
        user: schedule.USER,
        status: calculatedStatus, // Hardcoded status based on logs
        location: schedule.LOCATION || null,
        scheduledTime: formattedScheduledTime // Using logs TIME instead of schedules TIME
      },
      logs: {
        timeIn: todayLog?.TIME_IN ? {
          time: todayLog.TIME_IN,
          location: todayLog.LOCATION || 'Unknown Location',
          action: 'TIME-IN'
        } : null,
        timeOut: todayLog?.TIME_OUT ? {
          time: todayLog.TIME_OUT,
          location: todayLog.LOCATION || 'Unknown Location',
          action: 'TIME-OUT'
        } : null
      },
      currentTime: currentTime,
      hasTimeInToday: !!todayLog?.TIME_IN,
      hasTimeOutToday: !!todayLog?.TIME_OUT,
      hasValidTime: !!schedule.TIME, // Check if schedule has valid time
      mostRecentLogTime: todayLog?.TIME_OUT || todayLog?.TIME_IN || null, // From logs
      calculatedStatus: calculatedStatus // Hardcoded based on TIME_IN/TIME_OUT
    });
  } catch (error) {
    console.error("❌ Error in user-time-status:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Also modify the endpoint to not update schedule STATUS:
app.post("/api/time-record", async (req, res) => {
  const { user, action } = req.body;
  
  if (!user || !action) {
    return res.status(400).json({ 
      success: false, 
      message: "User and action are required" 
    });
  }
  
  if (!['TIME-IN', 'TIME-OUT'].includes(action)) {
    return res.status(400).json({ 
      success: false, 
      message: "Action must be either 'TIME-IN' or 'TIME-OUT'" 
    });
  }
  // Check if user has a valid schedule for TIME-IN
  if (action === 'TIME-IN') {
    try {
      const schedule = await new Promise((resolve, reject) => {
        const sql = "SELECT TIME FROM schedules WHERE USER = ?";
        db.query(sql, [user], (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        });
      });

      if (!schedule || !schedule.TIME || schedule.TIME.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: "Cannot time in without a valid schedule. Please contact your administrator." 
        });
      }
    } catch (error) {
      console.error("❌ Error checking schedule:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Database error while checking schedule" 
      });
    }
  }
  const currentTime = getGMT8Time();
  try {
    const today = currentTime.slice(0, 10);
    
    // Determine the new status and action based on the time record action
    const newStatus = action === 'TIME-IN' ? 'On Duty' : 'Off Duty';
    const logAction = action === 'TIME-IN' ? 'On Duty' : 'COMPLETED'; // Set logs ACTION to COMPLETED for TIME-OUT
    
    const existingLog = await new Promise((resolve, reject) => {
      const sql = "SELECT * FROM logs WHERE USER = ? AND DATE(TIME) = ? LIMIT 1";
      db.query(sql, [user, today], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });

    if (existingLog) {
      // Update existing log with ACTION matching the new status
      const updateSql = `
        UPDATE logs 
        SET ${action === 'TIME-IN' ? 'TIME_IN = ?' : 'TIME_OUT = ?'}, ACTION = ?
        WHERE USER = ? AND DATE(TIME) = ?
      `;
      
      await new Promise((resolve, reject) => {
        db.query(
          updateSql, 
          [currentTime, logAction, user, today], 
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });
    } else {
      // Insert new log with ACTION matching the new status
      const insertSql = `
        INSERT INTO logs (USER, TIME, ${action === 'TIME-IN' ? 'TIME_IN' : 'TIME_OUT'}, ACTION)
        VALUES (?, ?, ?, ?)
      `;
      
      await new Promise((resolve, reject) => {
        db.query(
          insertSql, 
          [user, currentTime, currentTime, logAction], 
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });
    }
    // Update schedule STATUS to match the log ACTION
    try {
      await new Promise((resolve, reject) => {
        const updateScheduleSql = "UPDATE schedules SET STATUS = ? WHERE USER = ?";
        db.query(updateScheduleSql, [newStatus, user], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    } catch (error) {
      console.error("❌ Error updating schedule status:", error);
      // Don't fail the entire request if schedule update fails
    }
    res.json({ 
      success: true, 
      message: `${action} recorded successfully`,
      time: currentTime,
      action: logAction, // Return the ACTION that matches STATUS
      status: newStatus
    });
  } catch (error) {
    console.error("❌ Error in time-record:", error);
    res.status(500).json({ 
      success: false, 
      message: "Database error" 
    });
  }
});

// Add this API endpoint to your backend (paste.txt)
app.get("/api/logs_patrol", (req, res) => {
  const sql = "SELECT * FROM logs_patrol ORDER BY TIME DESC";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ SQL error fetching logs_patrol:", err);
      return res.status(500).json({ error: "Failed to fetch patrol logs" });
    }
    res.json(results);
  });
});

// Start server
app.listen(3001, () => {
  console.log("✅ Server running on http://localhost:3001");
});