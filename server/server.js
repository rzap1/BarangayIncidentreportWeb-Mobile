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
  const sql = "SELECT ID, USER, NAME, EMAIL, ADDRESS, ROLE, STATUS FROM users";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ SQL error:", err);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
    res.json(results);
  });
});


// Update user by ID with image upload support
app.put("/api/users/:id", upload.single("image"), (req, res) => {
  const userId = req.params.id;
  const { username, role, name, email, address, status, password } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!userId || !username || !name) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  // Start building the SQL query and parameters
  let sql = "UPDATE users SET USER = ?, NAME = ?, EMAIL = ?, ADDRESS = ?";
  let params = [username, name, email, address];

  // Add optional fields if provided
  if (role) {
    sql += ", ROLE = ?";
    params.push(role);
  }
  
  if (status) {
    sql += ", STATUS = ?";
    params.push(status);
  }
  
  // Add password update if provided
  if (password) {
    sql += ", PASSWORD = ?";
    params.push(password);
  }
  
  // Add image update if provided
  if (image) {
    sql += ", IMAGE = ?";
    params.push(image);
    
    // Delete old image if exists (optional)
    db.query("SELECT IMAGE FROM users WHERE ID = ?", [userId], (err, results) => {
      if (!err && results.length > 0 && results[0].IMAGE) {
        const oldImage = results[0].IMAGE;
        const imagePath = path.join(__dirname, "uploads", oldImage);
        fs.unlink(imagePath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error("Error deleting old profile image:", err);
          }
        });
      }
    });
  }
  
  // Complete the SQL query
  sql += " WHERE ID = ?";
  params.push(userId);
  
  db.query(sql, params, (err, result) => {
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

    res.json({ 
      success: true, 
      message: "User updated successfully",
      image: image ? image : undefined
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
  const { status } = req.body;

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

  const sql = "UPDATE incident_report SET status = ? WHERE id = ?";
  
  db.query(sql, [status, incidentId], (err, result) => {
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
      status: status
    });
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
  const { user, status, time } = req.body;
  
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
      
      // Insert the new schedule entry with the same ID as the user and include IMAGE
      const insertSQL = `
        INSERT INTO schedules (ID, USER, STATUS, TIME, IMAGE)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      db.query(
        insertSQL, 
        [userId, user, status || 'Off Duty', time || getGMT8Time(), userImage], 
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
    WHERE ROLE = 'Tanod'
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
            // Include the IMAGE from users table
            const insertSQL = `
              INSERT INTO schedules (ID, USER, STATUS, TIME, IMAGE)
              VALUES (?, ?, 'Available', NULL, ?)
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
  const { status, time } = req.body;
  
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
    
    res.json({ 
      success: true, 
      message: "Schedule updated successfully"
    });
  });
});

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

// API endpoint to check user's schedule and log status for current time (UPDATED)
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

    // Determine scheduled time - only use log's TIME if it's from today
    let scheduledTime = schedule.TIME; // Default to schedule's TIME
    
    if (todayLog && todayLog.TIME) {
      // Check if the log's TIME is from today
      const logDate = todayLog.TIME.slice(0, 10); // Get date part from log's TIME
      if (logDate === today) {
        scheduledTime = todayLog.TIME;
      }
    }

    // Check if schedule is set (not null or empty)
    const hasValidSchedule = scheduledTime && scheduledTime.trim() !== '';

    res.json({
      success: true,
      schedule: {
        id: schedule.ID,
        user: schedule.USER,
        status: schedule.STATUS,
        location: schedule.LOCATION || null,
        scheduledTime: scheduledTime
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
      hasValidSchedule: hasValidSchedule // NEW: indicates if schedule is set
    });
  } catch (error) {
    console.error("❌ Error in user-time-status:", error);
    res.status(500).json({ error: "Database error" });
  }
});



// UPDATED TIME-RECORD API - Add schedule validation
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

  // NEW: Check if user has a valid schedule for TIME-IN
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
    // Rest of the existing time-record logic...
    const today = currentTime.slice(0, 10);
    const existingLog = await new Promise((resolve, reject) => {
      const sql = "SELECT * FROM logs WHERE USER = ? AND DATE(TIME) = ? LIMIT 1";
      db.query(sql, [user, today], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });

    if (existingLog) {
      const updateSql = `
        UPDATE logs 
        SET ${action === 'TIME-IN' ? 'TIME_IN = ?' : 'TIME_OUT = ?'}
        WHERE USER = ? AND DATE(TIME) = ?
      `;
      
      await new Promise((resolve, reject) => {
        db.query(
          updateSql, 
          [currentTime, user, today], 
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });
    } else {
      const insertSql = `
        INSERT INTO logs (USER, TIME, ${action === 'TIME-IN' ? 'TIME_IN' : 'TIME_OUT'})
        VALUES (?, ?, ?)
      `;
      
      await new Promise((resolve, reject) => {
        db.query(
          insertSql, 
          [user, currentTime, currentTime], 
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });
    }

    const newStatus = action === 'TIME-IN' ? 'On Duty' : 'Off Duty';
    await new Promise((resolve, reject) => {
      const updateScheduleSql = "UPDATE schedules SET STATUS = ? WHERE USER = ?";
      db.query(updateScheduleSql, [newStatus, user], (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });

    res.json({ 
      success: true, 
      message: `${action} recorded successfully`,
      time: currentTime,
      action: action
    });
  } catch (error) {
    console.error("❌ Error in time-record:", error);
    res.status(500).json({ 
      success: false, 
      message: "Database error" 
    });
  }
});

// Start server
app.listen(3001, () => {
  console.log("✅ Server running on http://localhost:3001");
});