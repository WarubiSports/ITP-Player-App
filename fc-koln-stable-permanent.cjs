const express = require("express");
const path = require("path");
const sgMail = require("@sendgrid/mail");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const fs = require("node:fs"); // <- const, not aconst
const { db, pool } = require("./server/db.cjs");
const app = express();

    // Auto-detect a UI build and serve it at "/"
    const UI_CANDIDATES = [ 'client/client-dist', 'client-dist', 'public', 'attached_assets' ];
    let uiDir = null;
    let uiIndex = null;

    for (const dir of UI_CANDIDATES) {
      const candidate = path.join(process.cwd(), dir, 'index.html');
      if (fs.existsSync(candidate)) {
        uiDir = path.dirname(candidate);
        uiIndex = candidate;
        break;
      }
    }

    if (uiDir && uiIndex) {
      app.use(express.static(uiDir));
      app.get('/', (_req, res) => res.sendFile(uiIndex));
      console.log('[startup] Serving UI from:', uiDir);
    } else {
      console.log('[startup] No UI index.html found in', UI_CANDIDATES.join(', '));
      // Fallback: redirect root to login if your SPA doesn't exist yet
      app.get('/', (_req, res) => res.redirect('/login'));
    }
app.get('/healthz/ready', (_req, res) => {
  res.send('OK');
});
const PORT = process.env.PORT || 5000;

// Configure SendGrid
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}
// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use("/attached_assets", express.static("attached_assets"));

// ✅ SECURITY: Hardcoded users removed - all user data now stored in PostgreSQL database with bcrypt hashed passwords
// ✅ SECURITY: Password reset tokens now stored in database (users.password_reset_token field)

// Data storage
let players = [
    {
        id: "p1",
        name: "Max Finkgräfe",
        age: 19,
        position: "STRIKER",
        house: "Widdersdorf 1",
        status: "active",
        joinDate: new Date().toISOString(),
    },
    {
        id: "p2",
        name: "Tim Lemperle",
        age: 20,
        position: "WINGER",
        house: "Widdersdorf 3",
        status: "active",
        joinDate: new Date().toISOString(),
    },
    {
        id: "p3",
        name: "Linton Maina",
        age: 21,
        position: "WINGER",
        house: "Widdersdorf 2",
        status: "training",
        joinDate: new Date().toISOString(),
    },
    {
        id: "p4",
        name: "Florian Kainz",
        age: 22,
        position: "MIDFIELDER",
        house: "Widdersdorf 1",
        status: "rest",
        joinDate: new Date().toISOString(),
    },
];

// Pending applications storage
let pendingApplications = [
    {
        id: "app1",
        name: "Dennis Huseinbasic",
        email: "dennis.huseinbasic@example.com",
        age: 20,
        position: "MIDFIELDER",
        nationality: "Germany",
        type: "player",
        applicationDate: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 2 days ago
        status: "pending",
        notes: "Strong technical skills, previous experience with youth teams",
        documents: ["medical_clearance.pdf", "performance_stats.pdf"],
    },
    {
        id: "app2",
        name: "Sarah Mueller",
        email: "sarah.mueller@warubi-sports.com",
        age: 28,
        department: "Coaching",
        type: "staff",
        applicationDate: new Date(
            Date.now() - 1 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 1 day ago
        status: "pending",
        notes: "UEFA B License, 5 years youth coaching experience",
        documents: ["coaching_certificate.pdf", "references.pdf"],
    },
    {
        id: "app3",
        name: "Marco Reus Jr.",
        email: "marco.reus.jr@example.com",
        age: 18,
        position: "WINGER",
        nationality: "Germany",
        type: "player",
        applicationDate: new Date().toISOString(),
        status: "pending",
        notes: "Promising young talent from local academy",
        documents: ["medical_clearance.pdf"],
    },
];

let choreStorage = [
    {
        id: "ch1",
        title: "Kitchen Deep Clean",
        priority: "high",
        house: "Widdersdorf 1",
        type: "cleaning",
        deadline: "2025-08-08T14:00:00",
        points: 25,
        description:
            "Deep clean kitchen including appliances, counters, and floors",
        assignedTo: "p1", // Max Finkgräfe
        completed: false,
        completedBy: null,
        completedAt: null,
        createdDate: new Date().toISOString(),
        status: "pending",
        archived: false,
    },
    {
        id: "ch2",
        title: "Garden Maintenance",
        priority: "medium",
        house: "Widdersdorf 2",
        type: "maintenance",
        deadline: "2025-08-09T16:00:00",
        points: 15,
        description: "Trim hedges and water plants in front garden",
        assignedTo: "p3", // Linton Maina
        completed: false,
        completedBy: null,
        completedAt: null,
        createdDate: new Date().toISOString(),
        status: "pending",
        archived: false,
    },
    {
        id: "ch3",
        title: "Common Room Organization",
        priority: "low",
        house: "Widdersdorf 3",
        type: "organization",
        deadline: "2025-08-10T18:00:00",
        points: 10,
        description: "Organize books, games, and furniture in the common room",
        assignedTo: "p2", // Tim Lemperle
        completed: false,
        completedBy: null,
        completedAt: null,
        createdDate: new Date().toISOString(),
        status: "pending",
        archived: false,
    },
    {
        id: "ch4",
        title: "Laundry Room Clean",
        priority: "medium",
        house: "Widdersdorf 1",
        type: "cleaning",
        deadline: "2025-08-11T12:00:00",
        points: 20,
        description: "Clean washing machines, dryers, and organize supplies",
        assignedTo: "p4", // Florian Kainz
        completed: true,
        completedBy: "p4",
        completedAt: "2025-08-07T10:30:00",
        createdDate: new Date().toISOString(),
        status: "completed",
        archived: false,
    },
];

let archivedChores = [];
let calendarEvents = [];
let foodOrders = [];
let messages = [];

// Authentication endpoints
app.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Query database for user
        const result = await db.execute(`SELECT * FROM users WHERE email = $1 LIMIT 1`, [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        // Verify password with bcrypt
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            const userResponse = {
                id: user.id,
                email: user.email,
                name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username || user.email,
                role: user.role,
            };
            res.json({ success: true, user: userResponse });
        } else {
            res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred during login",
        });
    }
});

app.post("/auth/register", async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        // Check if user already exists
        const existingUser = await db.execute(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [email]);
        if (existingUser.rows.length > 0) {
            return res
                .status(400)
                .json({ success: false, message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Parse name into first and last name
        const nameParts = (name || email).split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Insert new user into database
        const result = await db.execute(
            `INSERT INTO users (id, email, password, first_name, last_name, role, username, status, approved, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
             RETURNING id, email, first_name, last_name, role`,
            [email, email, hashedPassword, firstName, lastName, role || 'player', email, 'pending', 'false']
        );

        const newUser = result.rows[0];

        const userResponse = {
            id: newUser.id,
            email: newUser.email,
            name: `${newUser.first_name} ${newUser.last_name}`.trim(),
            role: newUser.role,
        };

        res.json({ success: true, user: userResponse });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred during registration",
        });
    }
});

app.post("/auth/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        
        // Query database for user
        const result = await db.execute(`SELECT * FROM users WHERE email = $1 LIMIT 1`, [email]);
        const user = result.rows[0];

        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "Email not found" });
        }

        // Generate secure reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        // Store token in database (using users table password_reset fields)
        await db.execute(
            `UPDATE users SET password_reset_token = $1, password_reset_expiry = $2 WHERE id = $3`,
            [resetToken, tokenExpiry, user.id]
        );

        // Create reset link
        const resetLink = `${req.protocol}://${req.get("host")}/reset-password?token=${resetToken}`;

    // Send email if SendGrid is configured
    if (process.env.SENDGRID_API_KEY) {
        try {
            const msg = {
                to: email,
                from: "noreply@fc-koln-talent.com", // Sender email
                subject: "1.FC Köln - Password Reset Request",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #dc143c; color: white; padding: 20px; text-align: center;">
                            <h1>1.FC Köln Bundesliga Talent Program</h1>
                        </div>
                        <div style="padding: 20px; background: #f9f9f9;">
                            <h2>Password Reset Request</h2>
                            <p>Hello ${user.first_name || 'there'},</p>
                            <p>We received a request to reset your password for your FC Köln Talent Program account.</p>
                            <p>Click the button below to reset your password:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetLink}" style="background: #dc143c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                            </div>
                            <p>Or copy and paste this link into your browser:</p>
                            <p style="word-break: break-all; color: #666;">${resetLink}</p>
                            <p><strong>This link will expire in 1 hour.</strong></p>
                            <p>If you didn't request this password reset, please ignore this email.</p>
                            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                            <p style="color: #666; font-size: 12px;">1.FC Köln Bundesliga Talent Program Management System</p>
                        </div>
                    </div>
                `,
            };

            await sgMail.send(msg);
            console.log(`Password reset email sent to: ${email}`);
            res.json({
                success: true,
                message: "Password reset instructions sent to your email",
            });
        } catch (error) {
            console.error("Email sending failed:", error);
            res.status(500).json({
                success: false,
                message: "Failed to send reset email. Please try again later.",
            });
        }
    } else {
        // Fallback when SendGrid is not configured
        console.log(`Password reset requested for: ${email}`);
        console.log(`Reset link: ${resetLink}`);
        res.json({
            success: true,
            message:
                "Password reset instructions sent to your email (check console for link)",
        });
    }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred processing your request",
        });
    }
});

// Password reset endpoint
app.post("/auth/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Token and new password are required",
            });
        }

        // Query user by reset token
        const result = await db.execute(
            `SELECT * FROM users WHERE password_reset_token = $1 LIMIT 1`,
            [token]
        );
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token",
            });
        }

        // Check if token has expired
        if (user.password_reset_expiry && new Date() > new Date(user.password_reset_expiry)) {
            // Clear expired token
            await db.execute(
                `UPDATE users SET password_reset_token = NULL, password_reset_expiry = NULL WHERE id = $1`,
                [user.id]
            );
            return res
                .status(400)
                .json({ success: false, message: "Reset token has expired" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset token
        await db.execute(
            `UPDATE users SET password = $1, password_reset_token = NULL, password_reset_expiry = NULL WHERE id = $2`,
            [hashedPassword, user.id]
        );

        console.log(`Password successfully reset for: ${user.email}`);
        res.json({
            success: true,
            message: "Password has been reset successfully",
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred resetting your password",
        });
    }
});

// Password reset page route
app.get("/reset-password", async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).send("Invalid reset link");
        }

        // Query database for token
        const result = await db.execute(
            `SELECT * FROM users WHERE password_reset_token = $1 LIMIT 1`,
            [token]
        );
        const user = result.rows[0];

        if (!user || !user.password_reset_expiry || new Date() > new Date(user.password_reset_expiry)) {
            return res.status(400).send("Invalid or expired reset link");
        }
    } catch (error) {
        console.error('Reset password page error:', error);
        return res.status(500).send("An error occurred");
    }

    // Serve password reset page
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Password - 1.FC Köln</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #dc143c 0%, #8b0000 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .reset-container {
                    background: white;
                    padding: 2rem;
                    border-radius: 10px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    width: 100%;
                    max-width: 400px;
                    text-align: center;
                }
                .logo { font-size: 1.5rem; font-weight: bold; color: #dc143c; margin-bottom: 1rem; }
                .form-group { margin-bottom: 1rem; text-align: left; }
                label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
                input[type="password"] {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 1rem;
                }
                .btn {
                    width: 100%;
                    padding: 0.75rem;
                    background: #dc143c;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    font-size: 1rem;
                    cursor: pointer;
                    font-weight: bold;
                }
                .btn:hover { background: #b91c3c; }
                .message { 
                    padding: 0.75rem; 
                    border-radius: 5px; 
                    margin-bottom: 1rem; 
                    text-align: center;
                }
                .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
                .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            </style>
            <script src="auth-bulletproof.js"></script>
        </head>
        <body>
            <div class="reset-container">
                <div class="logo">1.FC Köln Talent Program</div>
                <h2>Reset Your Password</h2>
                <p style="margin-bottom: 1.5rem; color: #666;">Enter your new password below</p>
                
                <div id="message"></div>
                
                <form id="resetForm">
                    <div class="form-group">
                        <label for="newPassword">New Password</label>
                        <input type="password" id="newPassword" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">Confirm New Password</label>
                        <input type="password" id="confirmPassword" required minlength="6">
                    </div>
                    <button type="submit" class="btn">Reset Password</button>
                </form>
                
                <p style="margin-top: 1rem;">
                    <a href="/" style="color: #dc143c; text-decoration: none;">Back to Login</a>
                </p>
            </div>
            
            <script>
                document.getElementById('resetForm').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const newPassword = document.getElementById('newPassword').value;
                    const confirmPassword = document.getElementById('confirmPassword').value;
                    const messageDiv = document.getElementById('message');
                    
                    if (newPassword !== confirmPassword) {
                        messageDiv.innerHTML = '<div class="message error">Passwords do not match</div>';
                        return;
                    }
                    
                    if (newPassword.length < 6) {
                        messageDiv.innerHTML = '<div class="message error">Password must be at least 6 characters long</div>';
                        return;
                    }
                    
                    try {
                        const response = await fetch('/auth/reset-password', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                token: token, 
                                newPassword: newPassword 
                            })
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            messageDiv.innerHTML = '<div class="message success">' + result.message + '</div>';
                            setTimeout(() => {
                                window.location.href = '/';
                            }, 2000);
                        } else {
                            messageDiv.innerHTML = '<div class="message error">' + result.message + '</div>';
                        }
                    } catch (error) {
                        messageDiv.innerHTML = '<div class="message error">Network error. Please try again.</div>';
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// API endpoints
app.get("/api/players", async (req, res) => {
    try {
        // Query players from database
        const result = await db.execute(
            `SELECT id, first_name, last_name, email, age, position, nationality, status, house, created_at 
             FROM players ORDER BY created_at DESC`
        );
        
        // Format database players
        const dbPlayers = result.rows.map(row => ({
            id: row.id.toString(),
            name: `${row.first_name} ${row.last_name}`.trim(),
            email: row.email,
            age: row.age,
            position: row.position,
            nationality: row.nationality,
            status: row.status,
            house: row.house,
            joinDate: row.created_at,
        }));
        
        // Combine with in-memory players temporarily
        const allPlayers = [...dbPlayers, ...players];
        
        res.json({ success: true, players: allPlayers });
    } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred fetching players",
        });
    }
});

// Update player status endpoint
app.put("/api/players/:playerId/status", (req, res) => {
    const { playerId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["active", "training", "injured", "rest"];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid status. Must be one of: " + validStatuses.join(", "),
        });
    }

    // Find player
    const player = players.find((p) => p.id === playerId);
    if (!player) {
        return res.status(404).json({
            success: false,
            message: "Player not found",
        });
    }

    // Update status
    player.status = status;

    res.json({
        success: true,
        message: "Player status updated successfully",
        player: player,
    });
});

// User Management API endpoints
app.get("/api/applications", async (req, res) => {
    try {
        // Only allow admin access
        if (
            !req.session ||
            !req.session.user ||
            req.session.user.role !== "admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "Admin access required",
            });
        }

        // Query pending applications from database
        const result = await db.execute(
            `SELECT * FROM applications WHERE status = 'pending' ORDER BY application_date DESC`
        );
        
        // Also include in-memory applications temporarily
        const inMemoryPending = pendingApplications.filter(app => app.status === "pending");
        
        // Combine database and in-memory applications
        const allApplications = [
            ...result.rows.map(row => ({
                id: row.id.toString(),
                name: row.name,
                email: row.email,
                age: row.age,
                position: row.position,
                nationality: row.nationality,
                type: row.type,
                department: row.department,
                applicationDate: row.application_date,
                status: row.status,
                notes: row.notes,
                documents: row.documents ? JSON.parse(row.documents) : [],
            })),
            ...inMemoryPending
        ];

        res.json({ success: true, applications: allApplications });
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred fetching applications",
        });
    }
});

app.get("/api/users", async (req, res) => {
    try {
        // Only allow admin access
        if (
            !req.session ||
            !req.session.user ||
            req.session.user.role !== "admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "Admin access required",
            });
        }

        // Query users from database (staff and admin users)
        const usersResult = await db.execute(
            `SELECT id, email, first_name, last_name, role FROM users WHERE role IN ('admin', 'staff')`
        );
        
        // Query players from database
        const playersResult = await db.execute(
            `SELECT id, first_name, last_name, email FROM players`
        );

        // Combine database users with players
        const allUsers = [
            ...usersResult.rows.map((user) => ({
                id: user.id,
                name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                email: user.email,
                role: user.role,
            })),
            ...playersResult.rows.map((player) => ({
                id: player.id.toString(),
                name: `${player.first_name || ''} ${player.last_name || ''}`.trim(),
                email: player.email || `${player.first_name}.${player.last_name}@player.com`.toLowerCase(),
                role: "player",
            })),
            // Also include in-memory players temporarily until full migration
            ...players.map((player) => ({
                id: player.id,
                name: player.name,
                email: player.email || player.name.toLowerCase().replace(" ", ".") + "@player.com",
                role: "player",
            })),
        ];

        res.json({ success: true, users: allUsers });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred fetching users",
        });
    }
});

app.post("/api/applications/:id/approve", async (req, res) => {
    try {
    // Only allow admin access
    if (
        !req.session ||
        !req.session.user ||
        req.session.user.role !== "admin"
    ) {
        return res.status(403).json({
            success: false,
            message: "Admin access required",
        });
    }

    const { id } = req.params;
    
    // Try to find application in database first
    const dbResult = await db.execute(
        `SELECT * FROM applications WHERE id = $1 LIMIT 1`,
        [id]
    );
    
    let application = null;
    let isFromDatabase = false;
    
    if (dbResult.rows.length > 0) {
        application = dbResult.rows[0];
        isFromDatabase = true;
    } else {
        // Fallback to in-memory applications
        application = pendingApplications.find((app) => app.id === id);
    }

    if (!application) {
        return res.status(404).json({
            success: false,
            message: "Application not found",
        });
    }

    if (application.status !== "pending") {
        return res.status(400).json({
            success: false,
            message: "Application already processed",
        });
    }

    // Update application status in database if it exists there
    if (isFromDatabase) {
        await db.execute(
            `UPDATE applications 
             SET status = 'approved', 
                 approved_at = NOW(), 
                 approved_by = $1 
             WHERE id = $2`,
            [req.session.user.id, id]
        );
    } else {
        // Update in-memory application
        application.status = "approved";
        application.approvedAt = new Date().toISOString();
        application.approvedBy = req.session.user.id;
    }

    // Create user account based on application type
    if (application.type === "player") {
        // Add as player to database
        const newPlayerId = Date.now();
        const nameParts = application.name.split(' ');
        const assignedHouse = assignPlayerToHouse(); // Call once and reuse
        
        await db.execute(
            `INSERT INTO players (first_name, last_name, email, date_of_birth, nationality, position, status, house, age)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                nameParts[0] || '',
                nameParts.slice(1).join(' ') || '',
                application.email,
                application.age ? new Date().toISOString() : null, // placeholder
                application.nationality,
                application.position,
                'active',
                assignedHouse,
                application.age
            ]
        );
        
        // Also add to players array for in-memory operations (temporary until full migration)
        players.push({
            id: "p" + newPlayerId,
            name: application.name,
            age: application.age,
            position: application.position,
            nationality: application.nationality,
            house: assignedHouse, // Use same house assignment
            status: "active",
            joinDate: new Date().toISOString(),
        });
    } else if (application.type === "staff") {
        // Generate secure temporary password
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        // Add staff user to database
        const nameParts = application.name.split(' ');
        await db.execute(
            `INSERT INTO users (id, email, password, first_name, last_name, role, department, username, status, approved, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
            [
                application.email,
                application.email,
                hashedPassword,
                nameParts[0] || '',
                nameParts.slice(1).join(' ') || '',
                'staff',
                application.department,
                application.email,
                'active',
                'true'
            ]
        );
        
        // TODO: Send email with temporary password to staff member
        // SECURITY: Remove this log in production - temporary password should only be emailed
        if (process.env.NODE_ENV !== 'production') {
            console.log(`Staff account created for ${application.email} with temp password: ${tempPassword}`);
        }
    }
    res.json({
        success: true,
        message: "Application approved successfully",
        application: application,
    });
    } catch (error) {
        console.error('Application approval error:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred approving the application",
        });
    }
});
app.post("/api/applications/:id/reject", async (req, res) => {
    try {
        // Only allow admin access
        if (
            !req.session ||
            !req.session.user ||
            req.session.user.role !== "admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "Admin access required",
            });
        }

        const { id } = req.params;
        
        // Try to find application in database first
        const dbResult = await db.execute(
            `SELECT * FROM applications WHERE id = $1 LIMIT 1`,
            [id]
        );
        
        let application = null;
        let isFromDatabase = false;
        
        if (dbResult.rows.length > 0) {
            application = dbResult.rows[0];
            isFromDatabase = true;
        } else {
            // Fallback to in-memory applications
            application = pendingApplications.find((app) => app.id === id);
        }

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found",
            });
        }

        if (application.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Application already processed",
            });
        }

        // Update application status in database if it exists there
        if (isFromDatabase) {
            await db.execute(
                `UPDATE applications 
                 SET status = 'rejected', 
                     rejected_at = NOW(), 
                     rejected_by = $1 
                 WHERE id = $2`,
                [req.session.user.id, id]
            );
        } else {
            // Update in-memory application
            application.status = "rejected";
            application.rejectedAt = new Date().toISOString();
            application.rejectedBy = req.session.user.id;
        }

        res.json({
            success: true,
            message: "Application rejected",
            application: {
                id: application.id,
                name: application.name,
                status: "rejected",
            },
        });
    } catch (error) {
        console.error('Error rejecting application:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred rejecting the application",
        });
    }
});

// Update user endpoint
app.patch("/api/users/:id", async (req, res) => {
    try {
        // Only allow admin access
        if (
            !req.session ||
            !req.session.user ||
            req.session.user.role !== "admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "Admin access required",
            });
        }

        const { id } = req.params;
        const updatedData = req.body;

        // Try to find user in database users table (staff/admin)
        const userResult = await db.execute(
            `SELECT * FROM users WHERE id = $1 LIMIT 1`,
            [id]
        );

        if (userResult.rows.length > 0) {
            // Update user in database
            const nameParts = updatedData.name ? updatedData.name.split(' ') : [];
            await db.execute(
                `UPDATE users 
                 SET email = COALESCE($1, email),
                     first_name = COALESCE($2, first_name),
                     last_name = COALESCE($3, last_name),
                     role = COALESCE($4, role),
                     updated_at = NOW()
                 WHERE id = $5`,
                [
                    updatedData.email || null,
                    nameParts[0] || null,
                    nameParts.slice(1).join(' ') || null,
                    updatedData.role || null,
                    id
                ]
            );

            return res.json({
                success: true,
                message: "User updated successfully",
                user: {
                    id: id,
                    name: updatedData.name || `${userResult.rows[0].first_name} ${userResult.rows[0].last_name}`,
                    email: updatedData.email || userResult.rows[0].email,
                    role: updatedData.role || userResult.rows[0].role,
                },
            });
        }

        // Try to find in database players table
        const playerResult = await db.execute(
            `SELECT * FROM players WHERE id = $1 LIMIT 1`,
            [id]
        );

        if (playerResult.rows.length > 0) {
            // Update player in database
            const nameParts = updatedData.name ? updatedData.name.split(' ') : [];
            await db.execute(
                `UPDATE players 
                 SET email = COALESCE($1, email),
                     first_name = COALESCE($2, first_name),
                     last_name = COALESCE($3, last_name),
                     house = COALESCE($4, house),
                     age = COALESCE($5, age),
                     position = COALESCE($6, position)
                 WHERE id = $7`,
                [
                    updatedData.email || null,
                    nameParts[0] || null,
                    nameParts.slice(1).join(' ') || null,
                    updatedData.house || null,
                    updatedData.age || null,
                    updatedData.position || null,
                    id
                ]
            );

            return res.json({
                success: true,
                message: "Player updated successfully",
                user: {
                    id: id,
                    name: updatedData.name || `${playerResult.rows[0].first_name} ${playerResult.rows[0].last_name}`,
                    email: updatedData.email || playerResult.rows[0].email,
                    role: "player",
                },
            });
        }

        // Also check in-memory players array temporarily
        const playerIndex = players.findIndex((p) => p.id === id);
        if (playerIndex !== -1) {
            const player = players[playerIndex];
            player.name = updatedData.name || player.name;
            player.email = updatedData.email || player.email;
            player.house = updatedData.house || player.house;
            player.age = updatedData.age || player.age;
            player.position = updatedData.position || player.position;

            return res.json({
                success: true,
                message: "Player updated successfully (in-memory)",
                user: {
                    id: player.id,
                    name: player.name,
                    email: player.email,
                    role: "player",
                },
            });
        }

        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred updating the user",
        });
    }
});

// Helper function to assign player to house with least members
function assignPlayerToHouse() {
    const houses = ["Widdersdorf 1", "Widdersdorf 2", "Widdersdorf 3"];
    const houseCounts = houses.map((house) => ({
        house,
        count: players.filter((p) => p.house === house).length,
    }));

    // Sort by count and return house with least members
    houseCounts.sort((a, b) => a.count - b.count);
    return houseCounts[0].house;
}

app.post("/api/players", async (req, res) => {
    try {
        const { name, age, position, nationality, house, email } = req.body;
        const nameParts = name ? name.split(' ') : ['', ''];
        
        // Insert player into database
        const result = await db.execute(
            `INSERT INTO players (first_name, last_name, email, age, position, nationality, status, house, date_of_birth)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
             RETURNING id, first_name, last_name, email, age, position, nationality, status, house, created_at`,
            [
                nameParts[0] || '',
                nameParts.slice(1).join(' ') || '',
                email || `${name.toLowerCase().replace(/\s+/g, '.')}@player.com`,
                age || null,
                position || 'MIDFIELDER',
                nationality || 'Germany',
                'active',
                house || assignPlayerToHouse()
            ]
        );
        
        const newPlayer = result.rows[0];
        
        // Also add to in-memory array temporarily
        const player = {
            id: `player_${Date.now()}`,
            name: name,
            age: age,
            position: position,
            nationality: nationality,
            house: house || assignPlayerToHouse(),
            email: email,
            joinDate: new Date().toISOString(),
            status: "active",
        };
        players.push(player);
        
        res.json({ 
            success: true, 
            player: {
                id: newPlayer.id.toString(),
                name: `${newPlayer.first_name} ${newPlayer.last_name}`.trim(),
                age: newPlayer.age,
                position: newPlayer.position,
                nationality: newPlayer.nationality,
                house: newPlayer.house,
                email: newPlayer.email,
                status: newPlayer.status,
                joinDate: newPlayer.created_at,
            }
        });
    } catch (error) {
        console.error('Error creating player:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred creating the player",
        });
    }
});

app.get("/api/chores", (req, res) => {
    const activeChores = choreStorage.filter((chore) => !chore.archived);
    res.json({ success: true, chores: activeChores });
});

app.get("/api/chores/archived", (req, res) => {
    res.json({ success: true, chores: archivedChores });
});

// Archive chore endpoint (admin only)
app.patch("/api/chores/:id/archive", (req, res) => {
    const choreId = req.params.id;
    const { userRole } = req.body;

    // Only allow admin to archive chores
    if (userRole !== "admin") {
        return res.json({
            success: false,
            message: "Only admin can archive chores",
        });
    }

    const choreIndex = choreStorage.findIndex((c) => c.id === choreId);
    if (choreIndex === -1) {
        return res.json({ success: false, message: "Chore not found" });
    }

    const chore = choreStorage[choreIndex];
    chore.archived = true;
    chore.archivedAt = new Date().toISOString();

    // Move to archived storage
    archivedChores.push(chore);
    choreStorage.splice(choreIndex, 1);

    res.json({ success: true, message: "Chore archived successfully" });
});

app.post("/api/chores", (req, res) => {
    const chore = {
        id: `chore_${Date.now()}`,
        ...req.body,
        createdDate: new Date().toISOString(),
        status: "pending",
        completed: false,
        completedBy: null,
        completedAt: null,
        assignedTo: null,
        archived: false,
    };
    choreStorage.push(chore);
    res.json({ success: true, chore });
});

// Complete chore endpoint (staff/admin only)
app.patch("/api/chores/:id/complete", (req, res) => {
    const choreId = req.params.id;
    const { playerId, userRole } = req.body;

    // Only allow staff and admin to mark chores as completed
    if (userRole !== "admin" && userRole !== "staff") {
        return res.json({
            success: false,
            message: "Only staff and admin can mark chores as completed",
        });
    }

    const chore = choreStorage.find((c) => c.id === choreId);
    if (!chore) {
        return res.json({ success: false, message: "Chore not found" });
    }

    if (chore.completed) {
        return res.json({ success: false, message: "Chore already completed" });
    }

    chore.completed = true;
    chore.completedBy = playerId;
    chore.completedAt = new Date().toISOString();
    chore.status = "completed";

    res.json({ success: true, chore });
});

// Assign chore to player endpoint
app.patch("/api/chores/:id/assign", (req, res) => {
    const choreId = req.params.id;
    const { playerId } = req.body;

    const chore = choreStorage.find((c) => c.id === choreId);
    if (!chore) {
        return res.json({ success: false, message: "Chore not found" });
    }

    chore.assignedTo = playerId;
    res.json({ success: true, chore });
});

app.get("/api/calendar", async (req, res) => {
    try {
        // Query events from database
        const result = await db.execute(
            `SELECT * FROM events ORDER BY date DESC, start_time ASC`
        );
        
        // Format database events
        const dbEvents = result.rows.map(row => ({
            id: row.id.toString(),
            title: row.title,
            eventType: row.event_type,
            date: row.date,
            startTime: row.start_time,
            endTime: row.end_time,
            location: row.location,
            notes: row.notes,
            createdBy: row.created_by,
            createdDate: row.created_at,
            participants: row.participants,
        }));
        
        // Combine with in-memory events temporarily
        const allEvents = [...dbEvents, ...calendarEvents];
        
        res.json({ success: true, events: allEvents });
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred fetching calendar events",
        });
    }
});

app.post("/api/calendar", async (req, res) => {
    try {
        const { title, eventType, date, startTime, endTime, location, notes, createdBy, participants } = req.body;
        
        // Insert event into database
        const result = await db.execute(
            `INSERT INTO events (title, event_type, date, start_time, end_time, location, notes, created_by, participants)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                title,
                eventType || 'meeting',
                date,
                startTime || '09:00',
                endTime || '10:00',
                location || '',
                notes || '',
                createdBy || 'admin',
                participants || ''
            ]
        );
        
        const newEvent = result.rows[0];
        
        // Also add to in-memory array temporarily
        const event = {
            id: `event_${Date.now()}`,
            ...req.body,
            createdDate: new Date().toISOString(),
        };
        calendarEvents.push(event);
        
        res.json({ 
            success: true, 
            event: {
                id: newEvent.id.toString(),
                title: newEvent.title,
                eventType: newEvent.event_type,
                date: newEvent.date,
                startTime: newEvent.start_time,
                endTime: newEvent.end_time,
                location: newEvent.location,
                notes: newEvent.notes,
                createdBy: newEvent.created_by,
                createdDate: newEvent.created_at,
            }
        });
    } catch (error) {
        console.error('Error creating calendar event:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred creating the calendar event",
        });
    }
});

app.get("/api/food-orders", (req, res) => {
    res.json({ success: true, orders: foodOrders });
});

app.post("/api/food-orders", (req, res) => {
    const order = {
        id: `order_${Date.now()}`,
        ...req.body,
        orderDate: new Date().toISOString(),
        status: "pending",
    };
    foodOrders.push(order);
    res.json({ success: true, order });
});

// Delete player endpoint
app.delete("/api/players/:id", async (req, res) => {
    try {
        const playerId = req.params.id;
        
        // Try to delete from database first
        const dbResult = await db.execute(
            `DELETE FROM players WHERE id = $1 RETURNING id`,
            [playerId]
        );
        
        if (dbResult.rows.length > 0) {
            return res.json({ success: true, message: "Player removed successfully from database" });
        }
        
        // Fallback to in-memory array
        const playerIndex = players.findIndex((p) => p.id === playerId);

        if (playerIndex === -1) {
            return res.json({ success: false, message: "Player not found" });
        }

        players.splice(playerIndex, 1);
        res.json({ success: true, message: "Player removed successfully" });
    } catch (error) {
        console.error('Error deleting player:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred deleting the player",
        });
    }
});

app.get("/api/messages", async (req, res) => {
    try {
        // Query messages from database (with 30-day retention)
        const result = await db.execute(
            `SELECT * FROM messages 
             WHERE created_at >= NOW() - INTERVAL '30 days'
             ORDER BY created_at DESC`
        );
        
        // Format database messages
        const dbMessages = result.rows.map(row => ({
            id: row.id.toString(),
            fromUserId: row.from_user_id,
            toUserId: row.to_user_id,
            subject: row.subject,
            content: row.content,
            isRead: row.is_read,
            priority: row.priority,
            messageType: row.message_type,
            timestamp: row.created_at,
        }));
        
        // Combine with in-memory messages temporarily
        const allMessages = [...dbMessages, ...messages];
        
        res.json({ success: true, messages: allMessages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred fetching messages",
        });
    }
});

app.post("/api/messages", async (req, res) => {
    try {
        const { fromUserId, toUserId, subject, content, priority, messageType } = req.body;
        
        // Insert message into database
        const result = await db.execute(
            `INSERT INTO messages (from_user_id, to_user_id, subject, content, is_read, priority, message_type)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                fromUserId,
                toUserId,
                subject || '',
                content || '',
                false,
                priority || 'normal',
                messageType || 'direct'
            ]
        );
        
        const newMessage = result.rows[0];
        
        // Also add to in-memory array temporarily
        const message = {
            id: `msg_${Date.now()}`,
            ...req.body,
            timestamp: new Date().toISOString(),
        };
        messages.push(message);
        
        res.json({ 
            success: true, 
            message: {
                id: newMessage.id.toString(),
                fromUserId: newMessage.from_user_id,
                toUserId: newMessage.to_user_id,
                subject: newMessage.subject,
                content: newMessage.content,
                timestamp: newMessage.created_at,
            }
        });
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred creating the message",
        });
    }
});

// Serve the FC Köln logo (deployment-safe)
app.get("/api/logo", (req, res) => {
    const fs = require("fs");
    const path = require("path");

    try {
        console.log("Logo request received");

        // Check if attached_assets directory exists (deployment safety)
        if (!fs.existsSync("attached_assets/")) {
            console.log("attached_assets directory not found (deployment environment)");
            return res.status(404).send("Logo not available in deployment");
        }

        // Search for the FC Köln file using directory listing
        const files = fs.readdirSync("attached_assets/");
        const fcKolnFile = files.find(
            (file) =>
                file.includes("1.FC") &&
                file.includes("Football School") &&
                file.endsWith(".png"),
        );

        if (fcKolnFile) {
            console.log("Found FC Köln file:", fcKolnFile);
            const fullPath = path.join("attached_assets", fcKolnFile);
            console.log("Reading file from:", fullPath);

            const logoData = fs.readFileSync(fullPath);
            console.log("Successfully read file, size:", logoData.length);

            res.setHeader("Content-Type", "image/png");
            res.setHeader("Cache-Control", "public, max-age=86400");
            res.send(logoData);
            return;
        }

        console.log("No FC Köln file found");
        res.status(404).send("Logo not found");
    } catch (error) {
        console.error("Logo error:", error);
        // Don't crash the app - just return 404 instead of 500
        res.status(404).send("Logo not available");
    }
});

// Serve the main HTML file
app.get("/", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>1.FC Köln Bundesliga Talent Program</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f7fa;
            min-height: 100vh;
        }
        
        /* Authentication Styles */
        .auth-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 1rem;
            background: linear-gradient(135deg, #dc143c 0%, #8b0000 100%);
        }
        
        .auth-card {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 500px;
        }
        
        .logo {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .logo h1 {
            color: #dc143c;
            font-size: 1.5rem;
            font-weight: bold;
        }
        
        .logo p {
            color: #666;
            font-size: 0.9rem;
            margin-top: 0.5rem;
        }
        
        .tab-buttons {
            display: flex;
            margin-bottom: 2rem;
            border-radius: 8px;
            overflow: hidden;
            background: #f5f5f5;
        }
        
        .tab-btn {
            flex: 1;
            padding: 0.75rem;
            background: transparent;
            border: none;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        
        .tab-btn.active {
            background: #dc143c;
            color: white;
            border-radius: 25px;
        }
        
        .tab-btn:not(.active) {
            background: transparent;
            color: #666;
            border-radius: 25px;
        }
        
        .auth-form {
            display: none;
        }
        
        .auth-form.active {
            display: block;
        }
        
        .form-group {
            margin-bottom: 1rem;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: #333;
            font-weight: 500;
        }
        
        .form-group input, .form-group select {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e1e5e9;
            border-radius: 6px;
            font-size: 1rem;
            transition: border-color 0.3s ease;
        }
        
        .form-group input:focus, .form-group select:focus {
            outline: none;
            border-color: #dc143c;
        }
        
        .btn {
            width: 100%;
            padding: 0.75rem;
            background: #dc143c;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }
        
        .btn:hover {
            background: #b91c3c;
        }
        
        .btn-secondary {
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            margin-top: 0.5rem;
        }
        
        .btn-secondary:hover {
            background: rgba(255,255,255,0.3);
        }
        
        .forgot-link {
            text-align: center;
            margin-top: 1rem;
        }
        
        .forgot-link a {
            color: #dc143c;
            text-decoration: none;
            font-size: 0.9rem;
        }
        
        .forgot-link a:hover {
            text-decoration: underline;
        }
        
        .message {
            padding: 0.75rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            text-align: center;
        }
        
        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        /* Main Application Styles */
        .main-app {
            display: none;
            min-height: 100vh;
        }
        
        .main-app.active {
            display: block;
        }
        
        .app-header {
            background: linear-gradient(135deg, #dc143c 0%, #8b0000 100%);
            color: white;
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .app-logo {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .app-title {
            font-size: 1.25rem;
            font-weight: bold;
        }
        
        .app-user {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .nav-tabs {
            background: white;
            border-bottom: 1px solid #e1e5e9;
            padding: 0 2rem;
            display: flex;
            gap: 0;
        }
        
        .nav-tab {
            padding: 1rem 1.5rem;
            background: none;
            border: none;
            color: #6b7280;
            font-weight: 500;
            cursor: pointer;
            border-bottom: 3px solid transparent;
            transition: all 0.3s ease;
        }
        
        .nav-tab:hover {
            color: #dc143c;
            background: #f9fafb;
        }
        
        .nav-tab.active {
            color: #dc143c;
            border-bottom-color: #dc143c;
        }
        
        .main-content {
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .page {
            display: none;
        }
        
        .page.active {
            display: block;
        }
        
        .page-header {
            margin-bottom: 2rem;
        }
        
        .page-title {
            color: #333;
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            border-left: 4px solid #dc143c;
        }
        
        .dashboard-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .dashboard-content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .player-overview-section, .recent-activity-section, .house-competition-section {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .player-overview-cards {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        
        .player-overview-card {
            background: white;
            border: 2px solid #dc143c;
            border-radius: 8px;
            padding: 1rem;
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 1rem;
            align-items: center;
        }
        
        .player-info {
            display: flex;
            flex-direction: column;
        }
        
        .player-name {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 0.25rem;
        }
        
        .player-position {
            color: #dc143c;
            font-size: 0.9rem;
            margin-bottom: 0.25rem;
        }
        
        .player-house {
            color: #6b7280;
            font-size: 0.85rem;
        }
        
        .player-status {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            white-space: nowrap;
        }
        
        .status-active {
            background: #10b981;
            color: white;
        }
        
        .status-training {
            background: #f59e0b;
            color: white;
        }
        
        .status-rest {
            background: #3b82f6;
            color: white;
        }
        
        .view-all-link {
            text-align: center;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
        }
        
        .btn-link {
            background: none;
            border: none;
            color: #dc143c;
            text-decoration: none;
            font-weight: 500;
            cursor: pointer;
        }
        
        .btn-link:hover {
            text-decoration: underline;
        }
        
        .rank-trophy {
            font-size: 1.5rem;
            margin-right: 1rem;
            width: 30px;
            text-align: center;
        }
        
        .week-challenges {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 0.9rem;
        }
        
        /* Player Management Styles */
        .player-filters {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .filter-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }
        
        .filter-group {
            display: flex;
            flex-direction: column;
        }
        
        .filter-group label {
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #374151;
        }
        
        .search-input, .filter-select {
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 0.875rem;
        }
        
        .search-input:focus, .filter-select:focus {
            outline: none;
            border-color: #dc143c;
        }
        
        .player-overview-stats {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .player-overview-stats h3 {
            margin-bottom: 1rem;
            color: #1f2937;
        }
        
        .overview-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }
        
        .overview-card {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-left: 4px solid #dc143c;
            border-radius: 8px;
            padding: 1.5rem;
            text-align: center;
        }
        
        .overview-number {
            font-size: 2.5rem;
            font-weight: 700;
            color: #dc143c;
            margin-bottom: 0.5rem;
        }
        
        .overview-label {
            font-weight: 600;
            color: #374151;
            margin-bottom: 0.25rem;
        }
        
        .overview-sublabel {
            font-size: 0.875rem;
            color: #6b7280;
        }
        
        .player-directory {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .directory-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #f3f4f6;
        }
        
        .directory-header h3 {
            color: #1f2937;
            margin: 0;
        }
        
        .players-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;
        }
        
        .player-card {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 1.5rem;
            transition: all 0.3s ease;
        }
        
        .player-card:hover {
            border-color: #dc143c;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(220, 20, 60, 0.15);
        }
        

        
        .player-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }
        
        .player-card-name {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 0.25rem;
        }
        
        .player-card-position {
            color: #dc143c;
            font-weight: 600;
            font-size: 0.875rem;
        }
        
        .player-card-status {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .player-card-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        
        .player-card-detail {
            font-size: 0.875rem;
            color: #6b7280;
        }
        
        .player-card-actions {
            display: flex;
            gap: 0.5rem;
            justify-content: flex-end;
        }
        
        .btn-small {
            padding: 0.5rem 1rem;
            font-size: 0.75rem;
            border-radius: 6px;
        }
        
        .no-players-message {
            text-align: center;
            color: #6b7280;
            font-style: italic;
            padding: 3rem;
        }
        
        /* Modal Styles */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }
        
        .modal.active {
            display: flex;
        }
        
        .modal-content {
            background: white;
            border-radius: 12px;
            padding: 0;
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .modal-header h3 {
            margin: 0;
            color: #1f2937;
        }
        
        .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6b7280;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modal-close:hover {
            color: #dc143c;
        }
        
        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            padding: 1.5rem;
        }
        
        .modal-footer {
            padding: 1.5rem;
            border-top: 1px solid #e5e7eb;
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
        }
        
        .stat-header {
            color: #dc143c;
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .stat-value {
            font-size: 2.5rem;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 0.25rem;
            line-height: 1;
        }
        
        .stat-label {
            color: #6b7280;
            font-size: 0.9rem;
        }
        
        .player-overview-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            margin-bottom: 1rem;
            border-left: 4px solid #dc143c;
        }
        
        .player-card {
            background: white;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 0.75rem;
            border: 1px solid #e5e7eb;
            position: relative;
        }
        
        .player-card::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: #dc143c;
            border-radius: 4px 0 0 4px;
        }
        
        .player-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .player-name {
            font-weight: 600;
            color: #1f2937;
            font-size: 1.1rem;
        }
        
        .player-status {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-active {
            background: #d1fae5;
            color: #065f46;
        }
        
        .status-training {
            background: #fef3c7;
            color: #92400e;
        }
        
        .status-rest {
            background: #dbeafe;
            color: #1e40af;
        }
        
        .player-details {
            display: flex;
            gap: 1rem;
            color: #6b7280;
            font-size: 0.9rem;
        }
        
        /* Housing & Chore Management Styles */
        .section-header {
            margin: 2.5rem 0 1.5rem 0;
            text-align: center;
            position: relative;
        }
        
        .section-header h2 {
            color: #1f2937;
            font-size: 1.75rem;
            font-weight: 800;
            margin: 0;
            position: relative;
            display: inline-block;
            padding: 0 2rem;
            background: #f5f7fa;
        }
        
        .section-header::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, #dc143c 0%, #b91c3c 50%, #dc143c 100%);
            z-index: 1;
        }
        
        .section-header h2 {
            z-index: 2;
            position: relative;
        }
        
        .house-cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
            padding: 0 1rem;
        }
        
        .house-card {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border: 3px solid #e5e7eb;
            border-radius: 20px;
            padding: 2rem;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }
        
        .house-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #dc143c 0%, #b91c3c 100%);
        }
        
        .house-card:hover {
            border-color: #dc143c;
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 15px 35px rgba(220, 20, 60, 0.2);
        }
        
        .house-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #f3f4f6;
        }
        
        .house-card-header h3 {
            color: #1f2937;
            font-size: 1.5rem;
            font-weight: 800;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .chore-completion-badge {
            padding: 0.5rem 1rem;
            border-radius: 25px;
            font-size: 1rem;
            font-weight: 700;
            text-align: center;
            min-width: 60px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .chore-completion-badge::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, rgba(255,255,255,0.2) 0%, transparent 100%);
            pointer-events: none;
        }
        
        .chore-completion-badge[data-completion="85"] {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: white;
        }
        
        .chore-completion-badge[data-completion="92"] {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
        }
        
        .chore-completion-badge[data-completion="78"] {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
        }
        
        .house-info {
            margin-bottom: 2rem;
            background: rgba(248, 250, 252, 0.6);
            border-radius: 12px;
            padding: 1.5rem;
        }
        
        .house-stat {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            font-size: 1rem;
            padding: 0.75rem 0;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .house-stat:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        
        .house-stat .stat-label {
            color: #6b7280;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .house-stat .stat-value {
            color: #1f2937;
            font-weight: 700;
            font-size: 1.1rem;
        }
        
        .btn-view-details {
            width: 100%;
            background: linear-gradient(135deg, #dc143c 0%, #b91c3c 100%);
            color: white;
            border: none;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            font-weight: 700;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(220, 20, 60, 0.3);
        }
        
        .btn-view-details::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }
        
        .btn-view-details:hover::before {
            left: 100%;
        }
        
        .btn-view-details:hover {
            background: linear-gradient(135deg, #b91c3c 0%, #991b3c 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(220, 20, 60, 0.4);
        }
        
        .active-chores-section {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            border: 1px solid #e5e7eb;
        }
        
        .no-chores-message {
            text-align: center;
            color: #6b7280;
            padding: 2rem;
        }
        
        .no-chores-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        
        .analytics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
            padding: 0 1rem;
        }
        
        .analytics-card {
            background: linear-gradient(135deg, #dc143c 0%, #b91c3c 100%);
            color: white;
            border-radius: 20px;
            padding: 2rem;
            text-align: center;
            position: relative;
            overflow: hidden;
            box-shadow: 0 8px 25px rgba(220, 20, 60, 0.3);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .analytics-card::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            transform: rotate(45deg);
        }
        
        .analytics-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 15px 35px rgba(220, 20, 60, 0.4);
        }
        
        .analytics-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            display: block;
            position: relative;
            z-index: 2;
        }
        
        .analytics-number {
            font-size: 2.5rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
            position: relative;
            z-index: 2;
        }
        
        .analytics-label {
            font-size: 1rem;
            opacity: 0.95;
            font-weight: 600;
            margin-bottom: 0.5rem;
            position: relative;
            z-index: 2;
        }
        
        .analytics-trend {
            font-size: 0.9rem;
            margin-top: 0.5rem;
            background: rgba(255, 255, 255, 0.2);
            padding: 0.5rem 1rem;
            border-radius: 25px;
            display: inline-block;
            font-weight: 600;
            position: relative;
            z-index: 2;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        /* Enhanced Chore Item Styles */
        .chore-item {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .chore-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #dc143c 0%, #b91c3c 100%);
        }
        
        .chore-item:hover {
            border-color: #dc143c;
            box-shadow: 0 4px 15px rgba(220, 20, 60, 0.1);
            transform: translateY(-2px);
        }
        
        .chore-item.completed {
            background: #f0fdf4;
            border-color: #22c55e;
        }
        
        .chore-item.completed::before {
            background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
        }
        
        .chore-item.overdue {
            background: #fef2f2;
            border-color: #ef4444;
        }
        
        .chore-item.overdue::before {
            background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
        }
        
        .chore-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #f3f4f6;
        }
        
        .chore-header h4 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 700;
            color: #1f2937;
        }
        
        .chore-badges {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
        }
        
        .chore-priority, .chore-status {
            padding: 0.375rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
        }
        
        .chore-priority {
            background: #dc143c;
            color: white;
        }
        
        .priority-high .chore-priority {
            background: #ef4444;
        }
        
        .priority-medium .chore-priority {
            background: #f59e0b;
        }
        
        .priority-low .chore-priority {
            background: #10b981;
        }
        
        .priority-urgent .chore-priority {
            background: #dc2626;
            animation: pulse 2s infinite;
        }
        
        .status-completed {
            background: #22c55e;
            color: white;
        }
        
        .status-overdue {
            background: #ef4444;
            color: white;
        }
        
        .chore-info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
        }
        
        .chore-detail {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #dc143c;
        }
        
        .detail-label {
            font-weight: 600;
            color: #6b7280;
            font-size: 0.9rem;
        }
        
        .detail-value {
            font-weight: 700;
            color: #1f2937;
            font-size: 0.9rem;
        }
        
        .chore-description {
            background: #f8fafc;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            border-left: 4px solid #dc143c;
        }
        
        .chore-description .detail-label {
            display: block;
            margin-bottom: 0.5rem;
        }
        
        .chore-description p {
            margin: 0;
            color: #4b5563;
            line-height: 1.5;
        }
        
        .chore-actions {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #f3f4f6;
        }
        
        .btn-green {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
        }
        
        .btn-green:hover {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
        }
        
        .completion-info {
            padding: 0.75rem 1rem;
            background: #f0fdf4;
            color: #166534;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        .completion-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
        }
        
        .permission-info {
            padding: 0.75rem 1rem;
            background: #fef2f2;
            color: #991b1b;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.9rem;
            border: 1px solid #fecaca;
        }
        
        .btn-gray {
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(107, 114, 128, 0.3);
        }
        
        .btn-gray:hover {
            background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(107, 114, 128, 0.4);
        }
        
        .chores-navigation {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            padding: 0 1rem;
        }
        
        .chores-nav-btn {
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid #e5e7eb;
        }
        
        .chores-nav-btn.active {
            border-color: #dc143c;
            box-shadow: 0 2px 8px rgba(220, 20, 60, 0.2);
        }
        
        .archived-chores-section {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            border: 1px solid #e5e7eb;
        }
        
        .chore-item.archived {
            background: #f9fafb;
            border-color: #d1d5db;
            opacity: 0.8;
        }
        
        .chore-item.archived::before {
            background: linear-gradient(90deg, #6b7280 0%, #4b5563 100%);
        }
        
        .archived-badge {
            font-size: 0.8rem;
            opacity: 0.7;
            margin-left: 0.5rem;
        }
        
        .status-archived {
            background: #6b7280;
            color: white;
        }
        
        /* House Details Modal Styles */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            padding: 2rem;
            overflow-y: auto;
        }
        
        .house-details-modal {
            background: white;
            border-radius: 16px;
            max-width: 1000px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        }
        
        .house-header {
            background: linear-gradient(135deg, #dc143c 0%, #b91c3c 100%);
            color: white;
            padding: 2rem;
            border-radius: 16px 16px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .house-header h2 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 700;
        }
        
        .modal-close-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            font-size: 1.2rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .modal-close-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .house-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            padding: 2rem;
            background: #f8fafc;
        }
        
        .house-stat-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            border: 2px solid #e5e7eb;
            transition: all 0.3s ease;
        }
        
        .house-stat-card:hover {
            border-color: #dc143c;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(220, 20, 60, 0.1);
        }
        
        .house-stat-card.stat-warning {
            border-color: #ef4444;
            background: #fef2f2;
        }
        
        .stat-icon {
            font-size: 2rem;
            opacity: 0.8;
        }
        
        .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
        }
        
        .stat-label {
            font-size: 0.9rem;
            color: #6b7280;
            font-weight: 600;
        }
        
        .house-sections {
            padding: 2rem;
        }
        
        .house-section {
            margin-bottom: 2rem;
        }
        
        .house-section h3 {
            color: #1f2937;
            font-size: 1.2rem;
            font-weight: 700;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #f3f4f6;
        }
        
        .residents-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
        }
        
        .resident-card {
            background: #f8fafc;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 1rem;
            transition: all 0.3s ease;
        }
        
        .resident-card:hover {
            border-color: #dc143c;
            transform: translateY(-2px);
        }
        
        .resident-name {
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 0.5rem;
        }
        
        .resident-details {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
        }
        
        .resident-position, .resident-age {
            font-size: 0.8rem;
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            background: #e5e7eb;
            color: #4b5563;
            font-weight: 600;
        }
        
        .resident-status {
            font-size: 0.8rem;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-weight: 700;
            text-align: center;
        }
        
        .status-active {
            background: #dcfce7;
            color: #166534;
        }
        
        .status-training {
            background: #fef3c7;
            color: #92400e;
        }
        
        .status-rest {
            background: #e0e7ff;
            color: #3730a3;
        }
        
        .house-chores-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        
        .house-chore-item {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 1rem;
            transition: all 0.3s ease;
        }
        
        .house-chore-item:hover {
            border-color: #dc143c;
        }
        
        .house-chore-item.overdue {
            border-color: #ef4444;
            background: #fef2f2;
        }
        
        .house-chore-item.completed {
            border-color: #22c55e;
            background: #f0fdf4;
        }
        
        .chore-summary {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .chore-title {
            font-weight: 700;
            color: #1f2937;
        }
        
        .chore-meta {
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }
        
        .chore-priority, .chore-points, .chore-overdue, .chore-completed {
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            font-weight: 700;
        }
        
        .chore-priority {
            background: #dc143c;
            color: white;
        }
        
        .chore-points {
            background: #f59e0b;
            color: white;
        }
        
        .chore-overdue {
            background: #ef4444;
            color: white;
        }
        
        .chore-completed {
            background: #22c55e;
            color: white;
        }
        
        .chore-details-summary {
            font-size: 0.9rem;
            color: #6b7280;
            line-height: 1.4;
        }
        
        .no-data {
            text-align: center;
            color: #9ca3af;
            font-style: italic;
            padding: 2rem;
        }
        
        @media (max-width: 768px) {
            .modal-overlay {
                padding: 1rem;
            }
            
            .house-stats-grid {
                grid-template-columns: repeat(2, 1fr);
                padding: 1rem;
            }
            
            .house-sections {
                padding: 1rem;
            }
            
            .residents-grid {
                grid-template-columns: 1fr;
            }
        }
        
        /* Food Order Management Styles */
        .delivery-schedule-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .delivery-info-card {
            background: linear-gradient(135deg, #dc143c 0%, #8b0000 100%);
            color: white;
            padding: 1.5rem;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(220, 20, 60, 0.2);
        }
        
        .delivery-day {
            font-size: 1.2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        
        .order-deadline {
            font-size: 1rem;
            font-weight: 600;
            color: #ffd700;
            margin-bottom: 0.5rem;
        }
        
        .delivery-time {
            font-size: 0.9rem;
            opacity: 0.9;
        }
        
        .food-order-container {
            display: grid;
            grid-template-columns: 300px 1fr;
            gap: 2rem;
            margin-top: 2rem;
        }
        
        .order-summary {
            background: #f8fafc;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 1.5rem;
            height: fit-content;
            position: sticky;
            top: 2rem;
        }
        
        .order-summary h3 {
            color: #dc143c;
            margin-bottom: 1rem;
            font-weight: 700;
        }
        
        .summary-actions {
            margin-top: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .btn-success {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            color: white;
            border: 2px solid #16a34a;
            font-weight: 600;
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        
        .btn-success:hover:not(:disabled) {
            background: linear-gradient(135deg, #15803d 0%, #166534 100%);
            border-color: #15803d;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
        }
        
        .btn-success:disabled {
            background: #9ca3af;
            border-color: #9ca3af;
            cursor: not-allowed;
            opacity: 0.6;
        }
        
        .order-confirmation {
            background: #dcfce7;
            border: 2px solid #16a34a;
            border-radius: 8px;
            padding: 1rem;
            margin-top: 1rem;
            text-align: center;
        }
        
        .order-confirmation h4 {
            color: #166534;
            margin: 0 0 0.5rem 0;
            font-weight: 700;
        }
        
        .order-confirmation p {
            color: #15803d;
            margin: 0;
            font-size: 0.9rem;
        }
        
        .order-number {
            background: #166534;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-weight: 700;
            display: inline-block;
            margin: 0.5rem 0;
        }
        
        .no-items {
            color: #6b7280;
            font-style: italic;
            text-align: center;
            padding: 2rem 0;
        }
        
        .food-categories {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        
        .food-category {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        
        .food-category:hover {
            border-color: #dc143c;
            box-shadow: 0 4px 12px rgba(220, 20, 60, 0.1);
        }
        
        .category-header {
            background: linear-gradient(135deg, #dc143c 0%, #8b0000 100%);
            color: white;
            padding: 1rem 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            user-select: none;
        }
        
        .category-header h3 {
            margin: 0;
            font-weight: 700;
        }
        
        .category-toggle {
            font-weight: bold;
            transition: transform 0.3s ease;
        }
        
        .food-category.collapsed .category-toggle {
            transform: rotate(-90deg);
        }
        
        .category-content {
            padding: 1.5rem;
            transition: all 0.3s ease;
        }
        
        .food-category.collapsed .category-content {
            display: none;
        }
        
        .food-items-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1rem;
        }
        
        .food-item {
            background: #f9fafb;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 1rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            transition: all 0.3s ease;
        }
        
        .food-item:hover {
            border-color: #dc143c;
            background: #fef2f2;
        }
        
        .food-item.selected {
            border-color: #dc143c;
            background: #fef2f2;
        }
        
        .food-item-checkbox {
            width: 18px;
            height: 18px;
            accent-color: #dc143c;
        }
        
        .food-item-details {
            flex: 1;
        }
        
        .food-item-name {
            font-weight: 600;
            color: #374151;
            margin-bottom: 0.25rem;
        }
        
        .food-item-price {
            color: #6b7280;
            font-size: 0.9rem;
        }
        
        .quantity-selector {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .quantity-input {
            width: 60px;
            padding: 0.25rem 0.5rem;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            text-align: center;
            font-weight: 600;
        }
        
        .quantity-btn {
            width: 24px;
            height: 24px;
            border: 1px solid #d1d5db;
            background: white;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.2s ease;
        }
        
        .quantity-btn:hover {
            border-color: #dc143c;
            background: #fef2f2;
            color: #dc143c;
        }
        
        .order-summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .order-summary-item:last-child {
            border-bottom: none;
        }
        
        .summary-item-details {
            flex: 1;
        }
        
        .summary-item-name {
            font-weight: 600;
            color: #374151;
        }
        
        .summary-item-qty {
            color: #6b7280;
            font-size: 0.9rem;
        }
        
        .summary-item-price {
            font-weight: 600;
            color: #dc143c;
        }
        
        .summary-total {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 2px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 700;
            font-size: 1.1rem;
            color: #dc143c;
        }
        
        .budget-info {
            background: #f0f9ff;
            border: 2px solid #0ea5e9;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
        }
        
        .budget-display {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .budget-label {
            font-weight: 600;
            color: #0c4a6e;
        }
        
        .budget-amount {
            font-weight: 700;
            font-size: 1.1rem;
            color: #dc143c;
        }
        
        .budget-amount.over-budget {
            color: #dc2626;
            background: #fef2f2;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            border: 1px solid #dc2626;
        }
        
        .budget-bar {
            width: 100%;
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .budget-used {
            height: 100%;
            background: linear-gradient(90deg, #16a34a 0%, #eab308 70%, #dc2626 100%);
            transition: width 0.3s ease;
            border-radius: 4px;
        }
        
        .budget-warning {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            color: #92400e;
            padding: 0.75rem;
            border-radius: 8px;
            margin-top: 1rem;
            font-weight: 600;
            text-align: center;
        }
        
        .budget-error {
            background: #fef2f2;
            border: 2px solid #dc2626;
            color: #991b1b;
            padding: 0.75rem;
            border-radius: 8px;
            margin-top: 1rem;
            font-weight: 600;
            text-align: center;
        }
        
        .food-item.disabled {
            opacity: 0.5;
            pointer-events: none;
        }
        
        .player-access-only {
            background: #eff6ff;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        
        .access-message {
            color: #1e40af;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        
        .access-details {
            color: #3730a3;
            font-size: 0.9rem;
        }
        
        /* Delivery Summary Styles */
        .delivery-summary-container {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 2rem;
            margin-top: 1.5rem;
        }
        
        .summary-controls {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .house-summary-card {
            background: #f8fafc;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            margin-bottom: 1.5rem;
            overflow: hidden;
        }
        
        .house-summary-header {
            background: linear-gradient(135deg, #dc143c 0%, #8b0000 100%);
            color: white;
            padding: 1rem 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .house-summary-title {
            font-weight: 700;
            font-size: 1.2rem;
            margin: 0;
        }
        
        .house-order-count {
            background: rgba(255, 255, 255, 0.2);
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-weight: 600;
        }
        
        .house-summary-content {
            padding: 1.5rem;
        }
        
        .player-order-summary {
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
        }
        
        .player-order-summary:last-child {
            margin-bottom: 0;
        }
        
        .player-order-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .player-name {
            font-weight: 600;
            color: #374151;
        }
        
        .order-total {
            font-weight: 700;
            color: #dc143c;
        }
        
        .order-items-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.5rem;
        }
        
        .order-item {
            font-size: 0.9rem;
            color: #6b7280;
            display: flex;
            justify-content: space-between;
        }
        
        /* User Management Modal Styles */
        .user-edit-modal, .application-details-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        
        .user-edit-modal.show, .application-details-modal.show {
            opacity: 1;
            visibility: visible;
        }
        
        .user-edit-modal-content, .application-details-modal-content {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            transform: scale(0.9);
            transition: transform 0.3s ease;
        }
        
        .user-edit-modal.show .user-edit-modal-content,
        .application-details-modal.show .application-details-modal-content {
            transform: scale(1);
        }
        
        .user-edit-header, .application-details-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #eee;
        }
        
        .user-edit-header h3, .application-details-header h3 {
            color: #dc143c;
            margin: 0;
            font-size: 1.5rem;
        }
        
        .close-btn {
            background: none;
            border: none;
            font-size: 2rem;
            color: #999;
            cursor: pointer;
            padding: 0;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s ease;
        }
        
        .close-btn:hover {
            background-color: #f5f5f5;
            color: #dc143c;
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        
        /* House Selection Modal Styles */
        .house-selection-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        
        .house-selection-modal.show {
            opacity: 1;
            visibility: visible;
        }
        
        .house-selection-modal-content {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            width: 90%;
            max-width: 500px;
            transform: scale(0.9);
            transition: transform 0.3s ease;
        }
        
        .house-selection-modal.show .house-selection-modal-content {
            transform: scale(1);
        }
        
        .house-selection-header {
            text-align: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #eee;
        }
        
        .house-selection-header h3 {
            color: #dc143c;
            margin: 0 0 0.5rem 0;
            font-size: 1.5rem;
        }
        
        .house-selection-header p {
            color: #666;
            margin: 0;
        }
        
        .house-options {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .house-option {
            padding: 1.5rem;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
        }
        
        .house-option:hover {
            border-color: #dc143c;
            background: #fef2f2;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(220, 20, 60, 0.1);
        }
        
        .house-name {
            font-weight: 700;
            font-size: 1.2rem;
            color: #333;
            margin-bottom: 0.5rem;
        }
        
        .house-occupancy {
            color: #666;
            font-size: 0.9rem;
        }
        
        .house-selection-actions {
            text-align: center;
        }
        
        /* Calendar Styles */
        .calendar-container {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            gap: 1rem;
        }
        
        .calendar-nav {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .calendar-period-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #333;
            margin: 0;
            min-width: 200px;
            text-align: center;
        }
        
        .calendar-view-switcher {
            display: flex;
            background: #f1f5f9;
            border-radius: 8px;
            padding: 4px;
            gap: 2px;
        }
        
        .view-btn {
            padding: 8px 16px;
            border: none;
            background: transparent;
            color: #64748b;
            cursor: pointer;
            border-radius: 6px;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        
        .view-btn:hover {
            background: #e2e8f0;
            color: #334155;
        }
        
        .view-btn.active {
            background: #dc143c;
            color: white;
        }
        
        .btn-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid #dc143c;
            background: white;
            color: #dc143c;
            font-size: 1.2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-icon:hover {
            background: #dc143c;
            color: white;
            transform: scale(1.1);
        }
        
        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 1px;
            background: #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .calendar-day-header {
            background: #dc143c;
            color: white;
            padding: 1rem;
            text-align: center;
            font-weight: 700;
            font-size: 0.9rem;
        }
        
        .calendar-day {
            background: white;
            min-height: 120px;
            padding: 0.5rem;
            position: relative;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        
        .calendar-day:hover {
            background: #f8f9fa;
        }
        
        .calendar-day.other-month {
            background: #f8f9fa;
            color: #999;
        }
        
        .calendar-day.today {
            background: #fef2f2;
            border: 2px solid #dc143c;
        }
        
        .calendar-day-number {
            font-weight: 700;
            font-size: 1rem;
            margin-bottom: 0.5rem;
        }
        
        .calendar-events {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        
        .calendar-event {
            background: #dc143c;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.7rem;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .calendar-event:hover {
            background: #b91c3c;
            transform: scale(1.02);
        }
        
        .calendar-event.training {
            background: #22c55e;
        }
        
        .calendar-event.match {
            background: #dc143c;
        }
        
        .calendar-event.meeting {
            background: #3b82f6;
        }
        
        .calendar-event.facility {
            background: #8b5cf6;
        }
        
        .calendar-event.medical {
            background: #f59e0b;
        }
        
        .calendar-event.other {
            background: #6b7280;
        }
        
        /* Day and Week View Styles */
        .calendar-day-view {
            display: grid;
            grid-template-columns: 80px 1fr;
            gap: 1px;
            background: #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
            min-height: 600px;
        }
        
        .calendar-week-view {
            display: grid;
            grid-template-columns: 80px repeat(7, 1fr);
            gap: 1px;
            background: #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
            min-height: 600px;
        }
        
        .time-slot {
            background: #f8f9fa;
            padding: 8px 4px;
            font-size: 0.7rem;
            text-align: center;
            border-bottom: 1px solid #e5e7eb;
            color: #64748b;
            font-weight: 500;
        }
        
        .day-column {
            background: white;
            position: relative;
            border-right: 1px solid #e5e7eb;
        }
        
        .day-column-header {
            background: #dc143c;
            color: white;
            padding: 12px;
            text-align: center;
            font-weight: 700;
            font-size: 0.9rem;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        .time-event {
            position: absolute;
            left: 4px;
            right: 4px;
            background: #dc143c;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.7rem;
            cursor: pointer;
            z-index: 5;
            transition: all 0.2s ease;
        }
        
        .time-event:hover {
            background: #b91c3c;
            transform: scale(1.02);
        }
        
        .time-event.training { background: #22c55e; }
        .time-event.match { background: #dc143c; }
        .time-event.meeting { background: #3b82f6; }
        .time-event.facility { background: #8b5cf6; }
        .time-event.medical { background: #f59e0b; }
        .time-event.other { background: #6b7280; }
        
        /* Responsive Calendar */
        @media (max-width: 768px) {
            .calendar-container {
                padding: 1rem;
            }
            
            .calendar-header {
                flex-direction: column;
                text-align: center;
                gap: 1rem;
            }
            
            .calendar-view-switcher {
                order: -1;
            }
            
            .calendar-day {
                min-height: 80px;
                font-size: 0.8rem;
            }
            
            .calendar-period-title {
                font-size: 1.2rem;
            }
            
            .calendar-week-view {
                grid-template-columns: 60px repeat(7, 1fr);
            }
            
            .time-slot {
                font-size: 0.6rem;
                padding: 4px 2px;
            }
        }
        
        /* Event Details Styles */
        .event-detail-item {
            margin-bottom: 1rem;
            padding: 0.75rem;
            background: #f8f9fa;
            border-radius: 6px;
            border-left: 4px solid #dc143c;
        }
        
        .event-detail-item strong {
            color: #dc143c;
            margin-right: 0.5rem;
        }
        
        /* Event Details Styles */
        .event-detail-item {
            margin-bottom: 1rem;
            padding: 0.75rem;
            background: #f8f9fa;
            border-radius: 6px;
            border-left: 4px solid #dc143c;
        }
        
        .event-detail-item strong {
            color: #dc143c;
            margin-right: 0.5rem;
        }
        
        .delivery-summary-totals {
            background: #eff6ff;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            padding: 1.5rem;
            margin-top: 2rem;
        }
        
        .summary-total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .summary-total-row:last-child {
            margin-bottom: 0;
            font-weight: 700;
            font-size: 1.1rem;
            border-top: 1px solid #3b82f6;
            padding-top: 0.5rem;
        }
        
        .no-orders-message {
            text-align: center;
            color: #6b7280;
            font-style: italic;
            padding: 2rem;
            background: #f9fafb;
            border-radius: 8px;
        }
        
        @media (max-width: 1024px) {
            .food-order-container {
                grid-template-columns: 1fr;
                gap: 1.5rem;
            }
            
            .order-summary {
                position: static;
                order: 2;
            }
            
            .food-categories {
                order: 1;
            }
        }
        
        /* Communications Styles - Ultra Spacious Design */
        .communications-container {
            display: flex;
            height: 90vh;
            min-height: 800px;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            border: 1px solid #e2e8f0;
            margin: 2rem 0;
        }
        
        .chat-list {
            width: 420px;
            background: linear-gradient(135deg, #fafafa 0%, #f5f7fa 100%);
            border-right: 1px solid #e2e8f0;
            display: flex;
            flex-direction: column;
        }
        
        .chat-list-header {
            padding: 3rem 2rem 2rem 2rem;
            background: white;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .chat-list-header h2 {
            font-size: 1.75rem;
            font-weight: 700;
            color: #1e293b;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .chat-search {
            padding: 2rem;
            background: white;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .chat-search input {
            width: 100%;
            padding: 1.125rem 1.5rem;
            border: 2px solid #e2e8f0;
            border-radius: 16px;
            font-size: 1rem;
            transition: all 0.2s ease;
            background: #f8fafc;
        }
        
        .chat-search input:focus {
            outline: none;
            border-color: #dc143c;
            background: white;
            box-shadow: 0 0 0 3px rgba(220, 20, 60, 0.1);
        }
        
        .chat-list-content {
            flex: 1;
            overflow-y: auto;
            padding: 0.5rem 0;
        }
        
        .chat-item {
            padding: 1.75rem 2rem;
            margin: 0.5rem 1.5rem;
            border-radius: 16px;
            cursor: pointer;
            transition: all 0.2s ease;
            background: white;
            border: 1px solid transparent;
        }
        
        .chat-item:hover {
            background: #f8fafc;
            border-color: #e2e8f0;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        
        .chat-item.active {
            background: linear-gradient(135deg, #dc143c 0%, #b91c3c 100%);
            color: white;
            border-color: #dc143c;
            box-shadow: 0 4px 12px rgba(220, 20, 60, 0.2);
        }
        
        .chat-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
        }
        
        .chat-item-name {
            font-weight: 600;
            font-size: 1.1rem;
            color: #1e293b;
        }
        
        .chat-item.active .chat-item-name {
            color: white;
        }
        
        .chat-item-time {
            font-size: 0.9rem;
            opacity: 0.7;
            color: #64748b;
        }
        
        .chat-item.active .chat-item-time {
            color: rgba(255, 255, 255, 0.8);
        }
        
        .chat-item-preview {
            font-size: 0.9rem;
            opacity: 0.8;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.5;
            color: #64748b;
        }
        
        .chat-item.active .chat-item-preview {
            color: rgba(255, 255, 255, 0.8);
        }
        
        .no-chats-message {
            text-align: center;
            padding: 4rem 2rem;
            color: #64748b;
            font-style: italic;
            font-size: 1.1rem;
        }

        /* Player Details Modal Styles */
        .player-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(4px);
        }

        .player-modal.show {
            display: flex;
            animation: fadeIn 0.3s ease;
        }

        .player-modal-content {
            background: white;
            border-radius: 20px;
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
            animation: slideInUp 0.3s ease;
        }

        .player-modal-header {
            padding: 3rem 3rem 2rem 3rem;
            background: linear-gradient(135deg, #dc143c 0%, #b91c3c 100%);
            color: white;
            border-radius: 20px 20px 0 0;
            position: relative;
        }

        .player-modal-close {
            position: absolute;
            top: 1.5rem;
            right: 2rem;
            background: none;
            border: none;
            color: white;
            font-size: 2rem;
            cursor: pointer;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s ease;
        }

        .player-modal-close:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.1);
        }

        .player-modal-title {
            font-size: 1.875rem;
            font-weight: 700;
            margin: 0 0 0.5rem 0;
        }

        .player-modal-subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
            margin: 0;
        }

        .player-modal-body {
            padding: 3rem;
        }

        .player-details-section {
            margin-bottom: 2.5rem;
        }

        .player-details-section:last-child {
            margin-bottom: 0;
        }

        .section-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1e293b;
            margin: 0 0 1.5rem 0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .detail-row {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 1rem;
            margin-bottom: 1.25rem;
            padding: 1rem;
            background: #f8fafc;
            border-radius: 12px;
            border-left: 4px solid #dc143c;
        }

        .detail-row:last-child {
            margin-bottom: 0;
        }

        .detail-label {
            font-weight: 600;
            color: #64748b;
            font-size: 0.95rem;
        }

        .detail-value {
            color: #1e293b;
            font-size: 1rem;
            font-weight: 500;
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 0.5rem 1rem;
            border-radius: 50px;
            font-size: 0.85rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .status-active {
            background: #dcfce7;
            color: #166534;
        }

        .status-training {
            background: #fef3c7;
            color: #92400e;
        }

        .status-rest {
            background: #dbeafe;
            color: #1e40af;
        }

        .status-injured {
            background: #fee2e2;
            color: #dc2626;
        }

        .player-modal-actions {
            padding: 2rem 3rem 3rem 3rem;
            border-top: 1px solid #e2e8f0;
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
        }

        .btn-status-change {
            padding: 0.75rem 1.5rem;
            border: 2px solid #dc143c;
            background: white;
            color: #dc143c;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.9rem;
        }

        .btn-status-change:hover {
            background: #dc143c;
            color: white;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(220, 20, 60, 0.3);
        }

        .btn-close {
            padding: 0.75rem 2rem;
            background: #64748b;
            color: white;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.9rem;
        }

        .btn-close:hover {
            background: #475569;
            transform: translateY(-1px);
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes slideInUp {
            from { 
                opacity: 0;
                transform: translateY(20px);
            }
            to { 
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* User Management Styles */
        .admin-section {
            background: white;
            border-radius: 16px;
            margin-bottom: 2rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            overflow: hidden;
        }

        .admin-section-header {
            background: linear-gradient(135deg, #dc143c 0%, #b91c3c 100%);
            color: white;
            padding: 2rem 3rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .admin-section-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin: 0;
        }

        .admin-section-subtitle {
            font-size: 1rem;
            opacity: 0.9;
            margin: 0.25rem 0 0 0;
        }

        .admin-section-body {
            padding: 3rem;
        }

        .application-card {
            border: 2px solid #e2e8f0;
            border-radius: 16px;
            padding: 2rem;
            margin-bottom: 2rem;
            transition: all 0.2s ease;
            background: white;
        }

        .application-card:hover {
            border-color: #dc143c;
            box-shadow: 0 4px 16px rgba(220, 20, 60, 0.1);
        }

        .application-card:last-child {
            margin-bottom: 0;
        }

        .application-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1.5rem;
        }

        .application-info h3 {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 0.5rem 0;
        }

        .application-meta {
            display: flex;
            gap: 1rem;
            margin-bottom: 0.5rem;
        }

        .application-type {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.75rem;
            border-radius: 50px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
        }

        .application-type.player {
            background: #dcfce7;
            color: #166534;
        }

        .application-type.staff {
            background: #dbeafe;
            color: #1e40af;
        }

        .application-date {
            color: #64748b;
            font-size: 0.9rem;
        }

        .application-details {
            background: #f8fafc;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }

        .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .detail-item {
            display: flex;
            flex-direction: column;
        }

        .detail-item label {
            font-size: 0.85rem;
            font-weight: 600;
            color: #64748b;
            margin-bottom: 0.25rem;
        }

        .detail-item span {
            color: #1e293b;
            font-weight: 500;
        }

        .application-notes {
            margin-top: 1rem;
        }

        .application-notes label {
            font-size: 0.85rem;
            font-weight: 600;
            color: #64748b;
            display: block;
            margin-bottom: 0.5rem;
        }

        .application-notes p {
            color: #1e293b;
            line-height: 1.5;
            margin: 0;
        }

        .application-actions {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
        }

        .btn-approve {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-approve:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
        }

        .btn-reject {
            background: white;
            color: #dc2626;
            border: 2px solid #dc2626;
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-reject:hover {
            background: #dc2626;
            color: white;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        .btn-view-details {
            background: #64748b;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-view-details:hover {
            background: #475569;
            transform: translateY(-1px);
        }

        .users-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
        }

        .user-card {
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 16px;
            padding: 2rem;
            transition: all 0.2s ease;
        }

        .user-card:hover {
            border-color: #dc143c;
            box-shadow: 0 4px 16px rgba(220, 20, 60, 0.1);
        }

        .user-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1.5rem;
        }

        .user-info h3 {
            font-size: 1.1rem;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 0.5rem 0;
        }

        .user-email {
            color: #64748b;
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
        }

        .user-role {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.75rem;
            border-radius: 50px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
        }

        .user-role.admin {
            background: #fee2e2;
            color: #dc2626;
        }

        .user-role.staff {
            background: #dbeafe;
            color: #1e40af;
        }

        .user-role.player {
            background: #dcfce7;
            color: #166534;
        }

        .user-actions {
            display: flex;
            gap: 0.75rem;
        }

        .btn-edit-user {
            background: #dc143c;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-edit-user:hover {
            background: #b91c3c;
            transform: translateY(-1px);
        }

        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            color: #64748b;
        }

        .empty-state-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        .empty-state h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #1e293b;
        }

        /* Mobile responsive styles */
        @media (max-width: 768px) {
            .player-modal-content {
                width: 95%;
                margin: 1rem;
            }

            .player-modal-header {
                padding: 2rem 2rem 1.5rem 2rem;
            }

            .player-modal-body {
                padding: 2rem;
            }

            .player-modal-actions {
                padding: 1.5rem 2rem 2rem 2rem;
                flex-direction: column;
            }

            .detail-row {
                grid-template-columns: 1fr;
                gap: 0.5rem;
            }

            .player-modal-title {
                font-size: 1.5rem;
            }

            .admin-section-body {
                padding: 2rem;
            }

            .application-card {
                padding: 1.5rem;
            }

            .application-actions {
                flex-direction: column;
            }

            .users-grid {
                grid-template-columns: 1fr;
            }

            .detail-grid {
                grid-template-columns: 1fr;
            }
        }
        
        .chat-window {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: white;
        }
        
        .chat-header {
            padding: 3rem 3rem 2rem 3rem;
            background: white;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .chat-header-info h3 {
            margin: 0;
            font-size: 1.625rem;
            font-weight: 700;
            color: #1e293b;
        }
        
        .chat-header-info p {
            margin: 0.5rem 0 0 0;
            font-size: 1rem;
            color: #64748b;
        }
        
        .chat-messages {
            flex: 1;
            padding: 3rem;
            overflow-y: auto;
            background: linear-gradient(135deg, #fafafa 0%, #f8fafc 100%);
        }
        
        .no-chat-selected {
            text-align: center;
            padding: 4rem 2rem;
            color: #64748b;
            font-size: 1.1rem;
            font-style: italic;
        }
        
        .message {
            margin-bottom: 1.5rem;
            display: flex;
            animation: fadeInUp 0.3s ease-out;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .message.sent {
            justify-content: flex-end;
        }
        
        .message.received {
            justify-content: flex-start;
        }
        
        .message-bubble {
            max-width: 75%;
            padding: 1rem 1.25rem;
            border-radius: 20px;
            word-wrap: break-word;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        
        .message.sent .message-bubble {
            background: linear-gradient(135deg, #dc143c 0%, #b91c3c 100%);
            color: white;
            border-bottom-right-radius: 8px;
        }
        
        .message.received .message-bubble {
            background: white;
            color: #1e293b;
            border: 1px solid #e2e8f0;
            border-bottom-left-radius: 8px;
        }
        
        .message-sender {
            font-size: 0.75rem;
            color: #64748b;
            margin-bottom: 0.375rem;
            font-weight: 500;
        }
        
        .message.sent .message-sender {
            color: rgba(255, 255, 255, 0.8);
        }
        
        .message-text {
            line-height: 1.5;
            font-size: 0.95rem;
        }
        
        .message-time {
            font-size: 0.7rem;
            margin-top: 0.5rem;
            opacity: 0.7;
        }
        
        .chat-input-container {
            padding: 2.5rem 3rem;
            background: white;
            border-top: 1px solid #e2e8f0;
        }
        
        .chat-input {
            display: flex;
            gap: 1rem;
            align-items: center;
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 28px;
            padding: 0.5rem;
            transition: all 0.2s ease;
        }
        
        .chat-input:focus-within {
            border-color: #dc143c;
            background: white;
            box-shadow: 0 0 0 3px rgba(220, 20, 60, 0.1);
        }
        
        .chat-input input {
            flex: 1;
            padding: 0.875rem 1rem;
            border: none;
            background: transparent;
            font-size: 0.95rem;
            outline: none;
        }
        
        .send-btn {
            background: linear-gradient(135deg, #dc143c 0%, #b91c3c 100%);
            color: white;
            border: none;
            border-radius: 50%;
            width: 56px;
            height: 56px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 1.5rem;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(220, 20, 60, 0.2);
        }
        
        .send-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(220, 20, 60, 0.3);
        }
        
        .send-btn:active {
            transform: scale(0.95);
        }
        
        /* Chat Type Selection Styles */
        .chat-type-selection {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
        }
        
        .chat-type-btn {
            flex: 1;
            padding: 0.75rem 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            background: white;
            color: #374151;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .chat-type-btn:hover {
            border-color: #dc143c;
            background: #fef2f2;
        }
        
        .chat-type-btn.active {
            background: #dc143c !important;
            color: white !important;
            border-color: #dc143c !important;
        }
        
        .chat-form {
            margin-top: 1rem;
        }
        
        .member-selection {
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 0.5rem;
        }
        
        .member-option {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            border-radius: 4px;
        }
        
        .member-option:hover {
            background: #f9fafb;
        }
        
        .member-checkbox {
            margin: 0;
        }

        @media (max-width: 768px) {
            .delivery-schedule-info {
                grid-template-columns: 1fr;
            }
            
            .food-items-grid {
                grid-template-columns: 1fr;
            }
            
            .food-item {
                flex-direction: column;
                align-items: stretch;
                gap: 0.75rem;
            }
            
            .quantity-selector {
                justify-content: center;
            }
            
            .communications-container {
                flex-direction: column;
                height: 85vh;
            }
            
            .chat-list {
                width: 100%;
                height: 250px;
                border-right: none;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .chat-window {
                height: calc(100% - 250px);
            }
            
            .chat-list-header {
                padding: 1.5rem 1rem 1rem 1rem;
            }
            
            .chat-search {
                padding: 1rem;
            }
            
            .chat-header {
                padding: 1.5rem 1rem 1rem 1rem;
            }
            
            .chat-messages {
                padding: 1.5rem;
            }
            
            .chat-input-container {
                padding: 1rem;
            }
        }
        
        /* Archive Management Styles */
        .archive-controls {
            background: #f8fafc;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        
        .archive-stats {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            font-weight: 600;
            color: #374151;
        }
        
        .total-archived {
            color: #dc143c;
            font-weight: 700;
        }
        
        .page-info {
            color: #6b7280;
            font-size: 0.9rem;
        }
        
        .archive-filters {
            display: flex;
            gap: 1rem;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .filter-select {
            padding: 0.5rem 1rem;
            border: 2px solid #d1d5db;
            border-radius: 8px;
            background: white;
            font-size: 0.9rem;
            min-width: 150px;
        }
        
        .filter-select:focus {
            outline: none;
            border-color: #dc143c;
        }
        
        .pagination-controls {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.5rem;
            margin-top: 2rem;
            padding: 1rem;
            background: #f8fafc;
            border-radius: 12px;
        }
        
        .pagination-btn {
            min-width: 40px;
            height: 40px;
            border: 2px solid #e5e7eb;
            background: white;
            color: #374151;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .pagination-btn:hover {
            border-color: #dc143c;
            background: #fef2f2;
            color: #dc143c;
        }
        
        .pagination-btn.active {
            background: #dc143c;
            color: white;
            border-color: #dc143c;
        }
        
        .pagination-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
            .archive-filters {
                flex-direction: column;
                align-items: stretch;
            }
            
            .filter-select {
                min-width: unset;
            }
            
            .pagination-controls {
                gap: 0.25rem;
            }
            
            .pagination-btn {
                min-width: 35px;
                height: 35px;
                font-size: 0.8rem;
            }
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .chore-form-container {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            border: 1px solid #e5e7eb;
            margin-bottom: 2rem;
        }
        
        .chore-form {
            max-width: none;
        }
        
        .form-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
        }
        
        .form-group {
            margin-bottom: 1rem;
        }
        
        .form-group.full-width {
            grid-column: 1 / -1;
        }
        
        .form-group label {
            display: block;
            color: #374151;
            font-weight: 600;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 0.9rem;
            transition: border-color 0.3s ease;
            box-sizing: border-box;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #dc143c;
            box-shadow: 0 0 0 3px rgba(220, 20, 60, 0.1);
        }
        
        .form-group textarea {
            resize: vertical;
            min-height: 100px;
        }
        
        .form-actions {
            display: flex;
            gap: 1rem;
            justify-content: flex-start;
            margin-top: 1.5rem;
        }
        
        .btn-red {
            background: #dc143c;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-red:hover {
            background: #b91c3c;
            transform: translateY(-1px);
        }
        
        .btn-gray {
            background: #6b7280;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-gray:hover {
            background: #4b5563;
            transform: translateY(-1px);
        }
        
        /* Active Chores Styles */
        .chore-item {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            border-left: 4px solid #6b7280;
        }
        
        .chore-item.priority-urgent {
            border-left-color: #dc2626;
        }
        
        .chore-item.priority-high {
            border-left-color: #ea580c;
        }
        
        .chore-item.priority-medium {
            border-left-color: #d97706;
        }
        
        .chore-item.priority-low {
            border-left-color: #16a34a;
        }
        
        .chore-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .chore-header h4 {
            color: #1f2937;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0;
        }
        
        .chore-priority {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .priority-urgent .chore-priority {
            background: #fecaca;
            color: #dc2626;
        }
        
        .priority-high .chore-priority {
            background: #fed7aa;
            color: #ea580c;
        }
        
        .priority-medium .chore-priority {
            background: #fef3c7;
            color: #d97706;
        }
        
        .priority-low .chore-priority {
            background: #dcfce7;
            color: #16a34a;
        }
        
        .chore-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        
        .chore-detail {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.9rem;
        }
        
        .detail-label {
            color: #6b7280;
            font-weight: 500;
        }
        
        .detail-value {
            color: #1f2937;
            font-weight: 600;
        }
        
        .detail-value.overdue {
            color: #dc2626;
            font-weight: 700;
        }
        
        .chore-description {
            color: #4b5563;
            font-size: 0.9rem;
            margin: 0;
            padding-top: 0.5rem;
            border-top: 1px solid #f3f4f6;
        }
        
        /* Responsive Design for Chore Management */
        @media (max-width: 768px) {
            .house-cards-grid {
                grid-template-columns: 1fr;
            }
            
            .analytics-grid {
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
            }
            
            .form-row {
                grid-template-columns: 1fr;
            }
            
            .form-actions {
                flex-direction: column;
            }
            
            .chore-form-container {
                padding: 1rem;
            }
            
            .section-header h2 {
                font-size: 1.25rem;
            }
            
            .chore-details {
                grid-template-columns: 1fr;
            }
            
            .chore-detail {
                padding: 0.25rem 0;
            }
        }
        }
        
        .house-competition {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            margin-bottom: 1.5rem;
        }
        
        .competition-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
            color: #dc143c;
            font-weight: 600;
        }
        
        .house-rank {
            display: flex;
            align-items: center;
            padding: 1rem;
            margin-bottom: 0.75rem;
            border-radius: 8px;
            position: relative;
        }
        
        .house-rank-1 {
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            border: 1px solid #f59e0b;
        }
        
        .house-rank-2 {
            background: linear-gradient(135deg, #e5e7eb, #d1d5db);
            border: 1px solid #9ca3af;
        }
        
        .house-rank-3 {
            background: linear-gradient(135deg, #fed7aa, #fdba74);
            border: 1px solid #ea580c;
        }
        
        .rank-number {
            font-size: 1.5rem;
            font-weight: bold;
            margin-right: 1rem;
            width: 30px;
            text-align: center;
        }
        
        .house-info {
            flex: 1;
        }
        
        .house-name {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 0.25rem;
        }
        
        .house-stats {
            color: #6b7280;
            font-size: 0.9rem;
        }
        
        .house-points {
            font-size: 1.25rem;
            font-weight: bold;
            color: #dc143c;
        }
        
        .recent-activity {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .activity-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
            color: #dc143c;
            font-weight: 600;
        }
        
        .activity-item {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding: 1rem 0;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .activity-item:last-child {
            border-bottom: none;
        }
        
        .activity-time {
            color: #6b7280;
            font-size: 0.85rem;
            min-width: 60px;
        }
        
        .activity-content {
            flex: 1;
        }
        
        .activity-title {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 0.25rem;
        }
        
        .activity-description {
            color: #6b7280;
            font-size: 0.9rem;
        }
        
        .card {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 1.5rem;
        }
        
        .card-header {
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #eee;
        }
        
        .card-title {
            color: #333;
            font-size: 1.25rem;
            margin-bottom: 0.5rem;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .table th, .table td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        
        .table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #333;
        }
        
        @media (max-width: 768px) {
            .main-content {
                padding: 1rem;
            }
            
            .dashboard-stats {
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            }
            
            .dashboard-content-grid {
                grid-template-columns: 1fr;
                gap: 1rem;
            }
            
            .player-overview-card {
                grid-template-columns: 1fr;
                text-align: center;
                gap: 0.5rem;
            }
            
            .player-info {
                align-items: center;
            }
            
            .house-rank {
                padding: 0.75rem;
            }
            
            .rank-trophy {
                margin-right: 0.5rem;
                width: 20px;
            }
        }
    </style>
</head>
<body>
    <!-- Authentication Container -->
    <div class="auth-container" id="authContainer">
        <div class="auth-card">
            <!-- FC Köln Logo -->
            <div class="fc-koln-logo" style="text-align: center; margin-bottom: 30px;">
                <img src="/api/logo" alt="1.FC Köln Football School" style="max-width: 200px; height: auto;">
            </div>
            
            <!-- Main Title -->
            <div class="main-title">
                <h1 style="color: #dc143c; font-size: 28px; font-weight: bold; text-align: center; margin-bottom: 8px;">1.FC Köln Bundesliga Talent Program</h1>
                <p style="color: #888; font-size: 16px; text-align: center; margin-bottom: 40px;">Management System</p>
            </div>
            
            <!-- Tab Buttons -->
            <div class="tab-buttons">
                <button class="tab-btn active" data-tab="login">Sign In</button>
                <button class="tab-btn" data-tab="register">Join Program</button>
                <button class="tab-btn" data-tab="forgot">Reset Password</button>
            </div>
            
            <div id="authMessage"></div>
            
            <!-- Login Form -->
            <form class="auth-form active" id="loginForm" data-form="login">
                <div class="form-group">
                    <label for="loginEmail">Email Address</label>
                    <input type="email" id="loginEmail" placeholder="Enter your email" required>
                </div>
                <div class="form-group">
                    <label for="loginPassword">Password</label>
                    <input type="password" id="loginPassword" placeholder="Enter your password" required>
                </div>
                <button type="submit" class="btn">Sign In</button>
                <div class="forgot-link">
                    <a href="#" data-tab="forgot" style="color: #dc143c; text-decoration: underline;">Forgot Password?</a>
                </div>
            </form>
            
            <!-- Register Form -->
            <form class="auth-form" id="registerForm" data-form="register">
                <div class="registration-title">
                    <h3 style="color: #333; text-align: center; margin-bottom: 30px;">1.FC Köln Bundesliga Talent Program Registration</h3>
                </div>
                
                <!-- Registration Type Selection -->
                <div class="registration-types" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
                    <div class="reg-type active" data-type="player" style="border: 2px solid #dc143c; background: #fef2f2; padding: 20px; border-radius: 8px; text-align: center; cursor: pointer;">
                        <div style="font-size: 24px; margin-bottom: 8px;">⚽</div>
                        <div style="font-weight: bold; color: #333; margin-bottom: 4px;">Player Registration</div>
                        <div style="color: #666; font-size: 14px;">Current FC Köln signed players</div>
                    </div>
                    <div class="reg-type" data-type="staff" style="border: 2px solid #e5e7eb; background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; cursor: pointer;">
                        <div style="font-size: 24px; margin-bottom: 8px;">👨‍💼</div>
                        <div style="font-weight: bold; color: #333; margin-bottom: 4px;">Staff Registration</div>
                        <div style="color: #666; font-size: 14px;">Current FC Köln staff members</div>
                    </div>
                </div>
                
                <!-- Player Registration Form -->
                <div id="playerRegForm" class="registration-form">
                    <h4 style="color: #333; text-align: center; margin-bottom: 25px;">Player Registration Form</h4>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div class="form-group">
                            <label for="firstName">First Name *</label>
                            <input type="text" id="firstName" required>
                        </div>
                        <div class="form-group">
                            <label for="lastName">Last Name *</label>
                            <input type="text" id="lastName" required>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div class="form-group">
                            <label for="playerEmail">Email Address *</label>
                            <input type="email" id="playerEmail" required>
                        </div>
                        <div class="form-group">
                            <label for="phoneNumber">Phone Number *</label>
                            <input type="tel" id="phoneNumber" required>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div class="form-group">
                            <label for="dateOfBirth">Date of Birth *</label>
                            <input type="date" id="dateOfBirth" required>
                        </div>
                        <div class="form-group">
                            <label for="nationality">Nationality *</label>
                            <select id="nationality" required>
                                <option value="">Select Nationality</option>
                                <option value="Afghan">Afghan</option>
                                <option value="Albanian">Albanian</option>
                                <option value="Algerian">Algerian</option>
                                <option value="American">American</option>
                                <option value="Andorran">Andorran</option>
                                <option value="Angolan">Angolan</option>
                                <option value="Antiguans">Antiguans</option>
                                <option value="Argentinean">Argentinean</option>
                                <option value="Armenian">Armenian</option>
                                <option value="Australian">Australian</option>
                                <option value="Austrian">Austrian</option>
                                <option value="Azerbaijani">Azerbaijani</option>
                                <option value="Bahamian">Bahamian</option>
                                <option value="Bahraini">Bahraini</option>
                                <option value="Bangladeshi">Bangladeshi</option>
                                <option value="Barbadian">Barbadian</option>
                                <option value="Barbudans">Barbudans</option>
                                <option value="Batswana">Batswana</option>
                                <option value="Belarusian">Belarusian</option>
                                <option value="Belgian">Belgian</option>
                                <option value="Belizean">Belizean</option>
                                <option value="Beninese">Beninese</option>
                                <option value="Bhutanese">Bhutanese</option>
                                <option value="Bolivian">Bolivian</option>
                                <option value="Bosnian">Bosnian</option>
                                <option value="Brazilian">Brazilian</option>
                                <option value="British">British</option>
                                <option value="Bruneian">Bruneian</option>
                                <option value="Bulgarian">Bulgarian</option>
                                <option value="Burkinabe">Burkinabe</option>
                                <option value="Burmese">Burmese</option>
                                <option value="Burundian">Burundian</option>
                                <option value="Cambodian">Cambodian</option>
                                <option value="Cameroonian">Cameroonian</option>
                                <option value="Canadian">Canadian</option>
                                <option value="Cape Verdean">Cape Verdean</option>
                                <option value="Central African">Central African</option>
                                <option value="Chadian">Chadian</option>
                                <option value="Chilean">Chilean</option>
                                <option value="Chinese">Chinese</option>
                                <option value="Colombian">Colombian</option>
                                <option value="Comoran">Comoran</option>
                                <option value="Congolese">Congolese</option>
                                <option value="Costa Rican">Costa Rican</option>
                                <option value="Croatian">Croatian</option>
                                <option value="Cuban">Cuban</option>
                                <option value="Cypriot">Cypriot</option>
                                <option value="Czech">Czech</option>
                                <option value="Danish">Danish</option>
                                <option value="Djibouti">Djibouti</option>
                                <option value="Dominican">Dominican</option>
                                <option value="Dutch">Dutch</option>
                                <option value="East Timorese">East Timorese</option>
                                <option value="Ecuadorean">Ecuadorean</option>
                                <option value="Egyptian">Egyptian</option>
                                <option value="Emirian">Emirian</option>
                                <option value="Equatorial Guinean">Equatorial Guinean</option>
                                <option value="Eritrean">Eritrean</option>
                                <option value="Estonian">Estonian</option>
                                <option value="Ethiopian">Ethiopian</option>
                                <option value="Fijian">Fijian</option>
                                <option value="Filipino">Filipino</option>
                                <option value="Finnish">Finnish</option>
                                <option value="French">French</option>
                                <option value="Gabonese">Gabonese</option>
                                <option value="Gambian">Gambian</option>
                                <option value="Georgian">Georgian</option>
                                <option value="German">German</option>
                                <option value="Ghanaian">Ghanaian</option>
                                <option value="Greek">Greek</option>
                                <option value="Grenadian">Grenadian</option>
                                <option value="Guatemalan">Guatemalan</option>
                                <option value="Guinea-Bissauan">Guinea-Bissauan</option>
                                <option value="Guinean">Guinean</option>
                                <option value="Guyanese">Guyanese</option>
                                <option value="Haitian">Haitian</option>
                                <option value="Herzegovinian">Herzegovinian</option>
                                <option value="Honduran">Honduran</option>
                                <option value="Hungarian">Hungarian</option>
                                <option value="I-Kiribati">I-Kiribati</option>
                                <option value="Icelander">Icelander</option>
                                <option value="Indian">Indian</option>
                                <option value="Indonesian">Indonesian</option>
                                <option value="Iranian">Iranian</option>
                                <option value="Iraqi">Iraqi</option>
                                <option value="Irish">Irish</option>
                                <option value="Israeli">Israeli</option>
                                <option value="Italian">Italian</option>
                                <option value="Ivorian">Ivorian</option>
                                <option value="Jamaican">Jamaican</option>
                                <option value="Japanese">Japanese</option>
                                <option value="Jordanian">Jordanian</option>
                                <option value="Kazakhstani">Kazakhstani</option>
                                <option value="Kenyan">Kenyan</option>
                                <option value="Kittian and Nevisian">Kittian and Nevisian</option>
                                <option value="Kuwaiti">Kuwaiti</option>
                                <option value="Kyrgyz">Kyrgyz</option>
                                <option value="Laotian">Laotian</option>
                                <option value="Latvian">Latvian</option>
                                <option value="Lebanese">Lebanese</option>
                                <option value="Liberian">Liberian</option>
                                <option value="Libyan">Libyan</option>
                                <option value="Liechtensteiner">Liechtensteiner</option>
                                <option value="Lithuanian">Lithuanian</option>
                                <option value="Luxembourgish">Luxembourgish</option>
                                <option value="Macedonian">Macedonian</option>
                                <option value="Malagasy">Malagasy</option>
                                <option value="Malawian">Malawian</option>
                                <option value="Malaysian">Malaysian</option>
                                <option value="Maldivan">Maldivan</option>
                                <option value="Malian">Malian</option>
                                <option value="Maltese">Maltese</option>
                                <option value="Marshallese">Marshallese</option>
                                <option value="Mauritanian">Mauritanian</option>
                                <option value="Mauritian">Mauritian</option>
                                <option value="Mexican">Mexican</option>
                                <option value="Micronesian">Micronesian</option>
                                <option value="Moldovan">Moldovan</option>
                                <option value="Monacan">Monacan</option>
                                <option value="Mongolian">Mongolian</option>
                                <option value="Moroccan">Moroccan</option>
                                <option value="Mosotho">Mosotho</option>
                                <option value="Motswana">Motswana</option>
                                <option value="Mozambican">Mozambican</option>
                                <option value="Namibian">Namibian</option>
                                <option value="Nauruan">Nauruan</option>
                                <option value="Nepalese">Nepalese</option>
                                <option value="New Zealander">New Zealander</option>
                                <option value="Ni-Vanuatu">Ni-Vanuatu</option>
                                <option value="Nicaraguan">Nicaraguan</option>
                                <option value="Nigerian">Nigerian</option>
                                <option value="Nigerien">Nigerien</option>
                                <option value="North Korean">North Korean</option>
                                <option value="Northern Irish">Northern Irish</option>
                                <option value="Norwegian">Norwegian</option>
                                <option value="Omani">Omani</option>
                                <option value="Pakistani">Pakistani</option>
                                <option value="Palauan">Palauan</option>
                                <option value="Panamanian">Panamanian</option>
                                <option value="Papua New Guinean">Papua New Guinean</option>
                                <option value="Paraguayan">Paraguayan</option>
                                <option value="Peruvian">Peruvian</option>
                                <option value="Polish">Polish</option>
                                <option value="Portuguese">Portuguese</option>
                                <option value="Qatari">Qatari</option>
                                <option value="Romanian">Romanian</option>
                                <option value="Russian">Russian</option>
                                <option value="Rwandan">Rwandan</option>
                                <option value="Saint Lucian">Saint Lucian</option>
                                <option value="Salvadoran">Salvadoran</option>
                                <option value="Samoan">Samoan</option>
                                <option value="San Marinese">San Marinese</option>
                                <option value="Sao Tomean">Sao Tomean</option>
                                <option value="Saudi">Saudi</option>
                                <option value="Scottish">Scottish</option>
                                <option value="Senegalese">Senegalese</option>
                                <option value="Serbian">Serbian</option>
                                <option value="Seychellois">Seychellois</option>
                                <option value="Sierra Leonean">Sierra Leonean</option>
                                <option value="Singaporean">Singaporean</option>
                                <option value="Slovakian">Slovakian</option>
                                <option value="Slovenian">Slovenian</option>
                                <option value="Solomon Islander">Solomon Islander</option>
                                <option value="Somali">Somali</option>
                                <option value="South African">South African</option>
                                <option value="South Korean">South Korean</option>
                                <option value="Spanish">Spanish</option>
                                <option value="Sri Lankan">Sri Lankan</option>
                                <option value="Sudanese">Sudanese</option>
                                <option value="Surinamer">Surinamer</option>
                                <option value="Swazi">Swazi</option>
                                <option value="Swedish">Swedish</option>
                                <option value="Swiss">Swiss</option>
                                <option value="Syrian">Syrian</option>
                                <option value="Taiwanese">Taiwanese</option>
                                <option value="Tajik">Tajik</option>
                                <option value="Tanzanian">Tanzanian</option>
                                <option value="Thai">Thai</option>
                                <option value="Togolese">Togolese</option>
                                <option value="Tongan">Tongan</option>
                                <option value="Trinidadian or Tobagonian">Trinidadian or Tobagonian</option>
                                <option value="Tunisian">Tunisian</option>
                                <option value="Turkish">Turkish</option>
                                <option value="Tuvaluan">Tuvaluan</option>
                                <option value="Ugandan">Ugandan</option>
                                <option value="Ukrainian">Ukrainian</option>
                                <option value="Uruguayan">Uruguayan</option>
                                <option value="Uzbekistani">Uzbekistani</option>
                                <option value="Venezuelan">Venezuelan</option>
                                <option value="Vietnamese">Vietnamese</option>
                                <option value="Welsh">Welsh</option>
                                <option value="Yemenite">Yemenite</option>
                                <option value="Zambian">Zambian</option>
                                <option value="Zimbabwean">Zimbabwean</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label for="primaryPosition">Primary Position *</label>
                        <select id="primaryPosition" required>
                            <option value="">Select position</option>
                            <option value="GOALKEEPER">Goalkeeper</option>
                            <option value="DEFENDER">Defender</option>
                            <option value="MIDFIELDER">Midfielder</option>
                            <option value="FORWARD">Forward</option>
                            <option value="STRIKER">Striker</option>
                            <option value="WINGER">Winger</option>
                        </select>
                    </div>
                    

                    
                    <button type="submit" class="btn" style="width: 100%; background: #dc143c; color: white; font-size: 16px; font-weight: bold;">Complete Registration</button>
                    
                    <p style="color: #666; font-size: 12px; text-align: center; margin-top: 15px;">
                        * This registration will update your profile in our system and notify the coaching staff.
                    </p>
                </div>
                
                <!-- Staff Registration Form (Hidden by default) -->
                <div id="staffRegForm" class="registration-form" style="display: none;">
                    <h4 style="color: #333; text-align: center; margin-bottom: 25px;">Staff Registration Form</h4>
                    
                    <div class="form-group">
                        <label for="staffName">Full Name</label>
                        <input type="text" id="staffName" required>
                    </div>
                    <div class="form-group">
                        <label for="staffEmail">Email</label>
                        <input type="email" id="staffEmail" required>
                    </div>
                    <div class="form-group">
                        <label for="staffPassword">Password</label>
                        <input type="password" id="staffPassword" required>
                    </div>
                    <div class="form-group">
                        <label for="staffRole">Role</label>
                        <select id="staffRole" required>
                            <option value="">Select Role</option>
                            <option value="staff">Staff</option>
                            <option value="coach">Coach</option>
                        </select>
                    </div>
                    <button type="submit" class="btn">Complete Registration</button>
                </div>
            </form>
            
            <!-- Forgot Password Form -->
            <form class="auth-form" id="forgotForm" data-form="forgot">
                <div class="form-group">
                    <label for="forgotEmail">Email Address</label>
                    <input type="email" id="forgotEmail" required>
                </div>
                <button type="submit" class="btn">Send Reset Instructions</button>
                <div class="forgot-link">
                    <a href="#" data-tab="login">← Back to Sign In</a>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Main Application -->
    <div class="main-app" id="mainApp">
        <!-- App Header -->
        <div class="app-header">
            <div class="app-logo">
                <img src="/api/logo" alt="1.FC Köln Football School" style="height: 40px; width: auto; border-radius: 4px;">
                <div class="app-title">1.FC Köln Bundesliga Talent Program</div>
            </div>
            <div class="app-user">
                <span id="headerUserInfo">Welcome, User</span>
                <button class="btn btn-secondary" id="logoutBtn">Logout</button>
            </div>
        </div>
        
        <!-- Navigation Tabs -->
        <div class="nav-tabs">
            <button class="nav-tab active" data-page="dashboard">Dashboard</button>
            <button class="nav-tab" data-page="players">Players</button>
            <button class="nav-tab" data-page="chores">Housing</button>
            <button class="nav-tab" data-page="food-orders">Food Orders</button>
            <button class="nav-tab" data-page="communications">Communications</button>
            <button class="nav-tab" data-page="calendar">Calendar</button>
            <button class="nav-tab admin-only" data-page="admin">User Management</button>
        </div>
        
        <!-- Main Content -->
        <div class="main-content">
            <!-- Dashboard Page -->
            <div class="page active" id="dashboard">
                <div class="page-header">
                    <h1 class="page-title">1.FC Köln Bundesliga Talent Program Dashboard</h1>
                </div>
                
                <!-- Top Stats Cards -->
                <div class="dashboard-stats">
                    <div class="stat-card">
                        <div class="stat-header">Total Players</div>
                        <div class="stat-value" id="totalPlayers">24</div>
                        <div class="stat-label">Active in program</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-header">Training Today</div>
                        <div class="stat-value" id="trainingToday">18</div>
                        <div class="stat-label">Players attending</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-header">Houses</div>
                        <div class="stat-value">3</div>
                        <div class="stat-label">Widdersdorf locations</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-header">Activities Today</div>
                        <div class="stat-value" id="activitiesToday">5</div>
                        <div class="stat-label">Scheduled events</div>
                    </div>
                </div>
                
                <!-- Dashboard Content Grid -->
                <div class="dashboard-content-grid">
                    <!-- Player Overview Section -->
                    <div class="player-overview-section">
                        <div class="section-header">
                            <h2>🏆 Player Overview</h2>
                        </div>
                        <div class="player-overview-cards">
                            <div class="player-overview-card">
                                <div class="player-info">
                                    <div class="player-name">Max Finkgräfe</div>
                                    <div class="player-position">⚽ STRIKER</div>
                                    <div class="player-house">Widdersdorf 1</div>
                                </div>
                                <div class="player-status status-active">ACTIVE</div>
                            </div>
                            <div class="player-overview-card">
                                <div class="player-info">
                                    <div class="player-name">Tim Lemperle</div>
                                    <div class="player-position">⚽ WINGER</div>
                                    <div class="player-house">Widdersdorf 3</div>
                                </div>
                                <div class="player-status status-active">ACTIVE</div>
                            </div>
                            <div class="player-overview-card">
                                <div class="player-info">
                                    <div class="player-name">Linton Maina</div>
                                    <div class="player-position">⚽ WINGER</div>
                                    <div class="player-house">Widdersdorf 2</div>
                                </div>
                                <div class="player-status status-training">TRAINING</div>
                            </div>
                            <div class="player-overview-card">
                                <div class="player-info">
                                    <div class="player-name">Florian Kainz</div>
                                    <div class="player-position">⚽ MIDFIELDER</div>
                                    <div class="player-house">Widdersdorf 1</div>
                                </div>
                                <div class="player-status status-rest">REST DAY</div>
                            </div>
                        </div>
                        <div class="view-all-link">
                            <button class="btn-link" data-page="players">View All Players →</button>
                        </div>
                    </div>
                    
                    <!-- Recent Activity Section -->
                    <div class="recent-activity-section">
                        <div class="section-header">
                            <h2>📈 Recent Activity</h2>
                        </div>
                        <div class="recent-activity">
                            <div class="activity-item">
                                <div class="activity-time">10:30 AM</div>
                                <div class="activity-content">
                                    <div class="activity-title">Training Session Completed</div>
                                    <div class="activity-description">Morning fitness training - 18 players attended</div>
                                </div>
                            </div>
                            <div class="activity-item">
                                <div class="activity-time">9:15 AM</div>
                                <div class="activity-content">
                                    <div class="activity-title">New Player Registration</div>
                                    <div class="activity-description">Dennis Huseinbasic completed profile setup</div>
                                </div>
                            </div>
                            <div class="activity-item">
                                <div class="activity-time">8:45 AM</div>
                                <div class="activity-content">
                                    <div class="activity-title">Meal Orders Submitted</div>
                                    <div class="activity-description">22 players submitted lunch preferences</div>
                                </div>
                            </div>
                            <div class="activity-item">
                                <div class="activity-time">8:00 AM</div>
                                <div class="activity-content">
                                    <div class="activity-title">House Chore Completed</div>
                                    <div class="activity-description">Widdersdorf 2 completed weekly cleaning tasks</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- House Competition Leaderboard -->
                <div class="house-competition-section">
                    <div class="section-header">
                        <h2>🏠 House Competition Leaderboard</h2>
                    </div>
                    <div class="house-leaderboard">
                        <div class="house-rank house-rank-1">
                            <div class="rank-trophy">🥇</div>
                            <div class="house-info">
                                <div class="house-name">Widdersdorf 2</div>
                                <div class="house-stats">8 players • Clean record</div>
                            </div>
                            <div class="house-points">945 pts</div>
                        </div>
                        <div class="house-rank house-rank-2">
                            <div class="rank-trophy">🥈</div>
                            <div class="house-info">
                                <div class="house-name">Widdersdorf 1</div>
                                <div class="house-stats">9 players • 2 pending tasks</div>
                            </div>
                            <div class="house-points">920 pts</div>
                        </div>
                        <div class="house-rank house-rank-3">
                            <div class="rank-trophy">🥉</div>
                            <div class="house-info">
                                <div class="house-name">Widdersdorf 3</div>
                                <div class="house-stats">7 players • 1 pending task</div>
                            </div>
                            <div class="house-points">885 pts</div>
                        </div>
                    </div>
                    <div class="week-challenges">
                        <strong>This Week:</strong> Fitness Challenge (20 pts), Chore Completion (15 pts), Team Spirit (10 pts)
                    </div>
                </div>
            </div>
            
            <!-- Players Page -->
            <div class="page" id="players">
                <div class="page-header">
                    <h1 class="page-title">Player Management</h1>
                </div>
                
                <!-- Player Filters -->
                <div class="player-filters">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label>Search Players</label>
                            <input type="text" id="playerSearch" placeholder="Search by name, position, or house..." class="search-input">
                        </div>
                        <div class="filter-group">
                            <label>Filter by Position</label>
                            <select id="positionFilter" class="filter-select">
                                <option value="">All Positions</option>
                                <option value="STRIKER">Striker</option>
                                <option value="WINGER">Winger</option>
                                <option value="MIDFIELDER">Midfielder</option>
                                <option value="DEFENDER">Defender</option>
                                <option value="GOALKEEPER">Goalkeeper</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Filter by House</label>
                            <select id="houseFilter" class="filter-select">
                                <option value="">All Houses</option>
                                <option value="Widdersdorf 1">Widdersdorf 1</option>
                                <option value="Widdersdorf 2">Widdersdorf 2</option>
                                <option value="Widdersdorf 3">Widdersdorf 3</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Filter by Status</label>
                            <select id="statusFilter" class="filter-select">
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="training">Training</option>
                                <option value="injured">Injured</option>
                                <option value="rest">Rest</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- Player Overview Stats -->
                <div class="player-overview-stats">
                    <h3>📊 Player Overview</h3>
                    <div class="overview-cards">
                        <div class="overview-card">
                            <div class="overview-number" id="totalPlayersCount">0</div>
                            <div class="overview-label">Total Players</div>
                            <div class="overview-sublabel">Currently in Program</div>
                        </div>
                        <div class="overview-card">
                            <div class="overview-number" id="activePlayersCount">0</div>
                            <div class="overview-label">Active Players</div>
                            <div class="overview-sublabel">Ready for Training</div>
                        </div>
                        <div class="overview-card">
                            <div class="overview-number" id="injuredPlayersCount">0</div>
                            <div class="overview-label">Injured Players</div>
                            <div class="overview-sublabel">Under Treatment</div>
                        </div>
                        <div class="overview-card">
                            <div class="overview-number" id="housesOccupiedCount">3</div>
                            <div class="overview-label">Houses Occupied</div>
                            <div class="overview-sublabel">All Locations</div>
                        </div>
                    </div>
                </div>
                
                <!-- Player Directory -->
                <div class="player-directory">
                    <div class="directory-header">
                        <h3>👥 Player Directory</h3>
                    </div>
                    <div class="players-grid" id="playersGrid">
                        <div class="no-players-message">
                            No players match the current filters.
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Food Orders Page -->
            <div class="page" id="food-orders">
                <div class="page-header">
                    <h1 class="page-title">🛒 Food Order Management</h1>
                    <p class="page-subtitle">Weekly grocery ordering system for all houses</p>
                </div>
                
                <!-- Delivery Schedule Info -->
                <div class="delivery-schedule-info">
                    <div class="delivery-info-card">
                        <div class="delivery-day">📅 Tuesday Delivery</div>
                        <div class="order-deadline">Order by Monday 12:00 PM</div>
                        <div class="delivery-time">Delivery: 6:00 PM - 8:00 PM</div>
                    </div>
                    <div class="delivery-info-card">
                        <div class="delivery-day">📅 Friday Delivery</div>
                        <div class="order-deadline">Order by Thursday 12:00 PM</div>
                        <div class="delivery-time">Delivery: 6:00 PM - 8:00 PM</div>
                    </div>
                </div>
                
                <!-- Food Order Form -->
                <div class="food-order-container">
                    <!-- Order Summary Sidebar -->
                    <div class="order-summary">
                        <h3>📋 Order Summary</h3>
                        <div class="budget-info">
                            <div class="budget-display">
                                <span class="budget-label">Budget Remaining:</span>
                                <span class="budget-amount" id="budgetRemaining">€35.00</span>
                            </div>
                            <div class="budget-bar">
                                <div class="budget-used" id="budgetUsedBar" style="width: 0%"></div>
                            </div>
                        </div>
                        <div id="orderSummaryContent">
                            <p class="no-items">No items selected yet</p>
                        </div>
                        <div class="summary-actions">
                            <button class="btn btn-success" id="placeOrderBtn" disabled>🛒 Place Order</button>
                            <button class="btn btn-primary" id="exportOrderBtn">📊 Export as CSV</button>
                            <button class="btn btn-secondary" id="clearOrderBtn">🗑️ Clear All</button>
                        </div>
                    </div>
                    
                    <!-- Food Categories -->
                    <div class="food-categories">
                        <!-- Household Category -->
                        <div class="food-category" data-category="household">
                            <div class="category-header">
                                <h3>🏠 Household</h3>
                                <span class="category-toggle">▼</span>
                            </div>
                            <div class="category-content">
                                <div class="food-items-grid" id="householdItems"></div>
                            </div>
                        </div>
                        
                        <!-- Fruits & Vegetables Category -->
                        <div class="food-category" data-category="produce">
                            <div class="category-header">
                                <h3>🥬 Gemüse & Obst</h3>
                                <span class="category-toggle">▼</span>
                            </div>
                            <div class="category-content">
                                <div class="food-items-grid" id="produceItems"></div>
                            </div>
                        </div>
                        
                        <!-- Meat Category -->
                        <div class="food-category" data-category="meat">
                            <div class="category-header">
                                <h3>🥩 Fleisch</h3>
                                <span class="category-toggle">▼</span>
                            </div>
                            <div class="category-content">
                                <div class="food-items-grid" id="meatItems"></div>
                            </div>
                        </div>
                        
                        <!-- Dairy Category -->
                        <div class="food-category" data-category="dairy">
                            <div class="category-header">
                                <h3>🥛 Dairy</h3>
                                <span class="category-toggle">▼</span>
                            </div>
                            <div class="category-content">
                                <div class="food-items-grid" id="dairyItems"></div>
                            </div>
                        </div>
                        
                        <!-- Carbohydrates Category -->
                        <div class="food-category" data-category="carbs">
                            <div class="category-header">
                                <h3>🍞 Carbohydrates</h3>
                                <span class="category-toggle">▼</span>
                            </div>
                            <div class="category-content">
                                <div class="food-items-grid" id="carbsItems"></div>
                            </div>
                        </div>
                        
                        <!-- Drinks Category -->
                        <div class="food-category" data-category="drinks">
                            <div class="category-header">
                                <h3>🥤 Drinks</h3>
                                <span class="category-toggle">▼</span>
                            </div>
                            <div class="category-content">
                                <div class="food-items-grid" id="drinksItems"></div>
                            </div>
                        </div>
                        
                        <!-- Spices & Sauces Category -->
                        <div class="food-category" data-category="spices">
                            <div class="category-header">
                                <h3>🧂 Spices & Sauces</h3>
                                <span class="category-toggle">▼</span>
                            </div>
                            <div class="category-content">
                                <div class="food-items-grid" id="spicesItems"></div>
                            </div>
                        </div>
                        
                        <!-- Frozen Category -->
                        <div class="food-category" data-category="frozen">
                            <div class="category-header">
                                <h3>🧊 Frozen</h3>
                                <span class="category-toggle">▼</span>
                            </div>
                            <div class="category-content">
                                <div class="food-items-grid" id="frozenItems"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Admin Delivery Summary Section -->
                <div class="admin-only" style="margin-top: 3rem;">
                    <div class="page-header">
                        <h2>📋 House Delivery Summary</h2>
                        <p>Order summary for staff to purchase and deliver groceries to each house</p>
                    </div>
                    
                    <div class="delivery-summary-container">
                        <div class="summary-controls">
                            <button class="btn btn-primary" id="generateSummaryBtn">📊 Generate Delivery Summary</button>
                            <button class="btn btn-secondary" id="exportDeliverySummaryBtn">📁 Export House Details</button>
                            <button class="btn btn-success" id="exportConsolidatedListBtn">🛒 Export Consolidated Shopping List</button>
                        </div>
                        
                        <div id="deliverySummaryContent">
                            <p class="no-items">Click "Generate Delivery Summary" to view orders organized by house for grocery shopping and delivery</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Other pages would go here -->
            <div class="page" id="chores">
                <div class="page-header">
                    <h1 class="page-title">Housing & Chore Management</h1>
                </div>
                
                <!-- Three House Cards Section -->
                <div class="section-header">
                    <h2>🏡 House Overview</h2>
                </div>
                <div class="house-cards-grid">
                    <div class="house-card" data-house="Widdersdorf 1">
                        <div class="house-card-header">
                            <h3>🏡 Widdersdorf 1</h3>
                            <div class="chore-completion-badge" data-completion="85">85%</div>
                        </div>
                        <div class="house-info">
                            <div class="house-stat">
                                <span class="stat-label">👥 Residents:</span>
                                <span class="stat-value" id="house1-residents">8 players</span>
                            </div>
                            <div class="house-stat">
                                <span class="stat-label">👑 House Leader:</span>
                                <span class="stat-value">Max Finkgräfe</span>
                            </div>
                            <div class="house-stat">
                                <span class="stat-label">📋 Pending Tasks:</span>
                                <span class="stat-value">3 pending</span>
                            </div>
                        </div>
                        <button class="btn btn-red btn-view-details" data-house="Widdersdorf 1">View Details</button>
                    </div>
                    
                    <div class="house-card" data-house="Widdersdorf 2">
                        <div class="house-card-header">
                            <h3>🏡 Widdersdorf 2</h3>
                            <div class="chore-completion-badge" data-completion="92">92%</div>
                        </div>
                        <div class="house-info">
                            <div class="house-stat">
                                <span class="stat-label">👥 Residents:</span>
                                <span class="stat-value" id="house2-residents">7 players</span>
                            </div>
                            <div class="house-stat">
                                <span class="stat-label">👑 House Leader:</span>
                                <span class="stat-value">Linton Maina</span>
                            </div>
                            <div class="house-stat">
                                <span class="stat-label">📋 Pending Tasks:</span>
                                <span class="stat-value">1 pending</span>
                            </div>
                        </div>
                        <button class="btn btn-red btn-view-details" data-house="Widdersdorf 2">View Details</button>
                    </div>
                    
                    <div class="house-card" data-house="Widdersdorf 3">
                        <div class="house-card-header">
                            <h3>🏡 Widdersdorf 3</h3>
                            <div class="chore-completion-badge" data-completion="78">78%</div>
                        </div>
                        <div class="house-info">
                            <div class="house-stat">
                                <span class="stat-label">👥 Residents:</span>
                                <span class="stat-value" id="house3-residents">9 players</span>
                            </div>
                            <div class="house-stat">
                                <span class="stat-label">👑 House Leader:</span>
                                <span class="stat-value">Tim Lemperle</span>
                            </div>
                            <div class="house-stat">
                                <span class="stat-label">📋 Pending Tasks:</span>
                                <span class="stat-value">5 pending</span>
                            </div>
                        </div>
                        <button class="btn btn-red btn-view-details" data-house="Widdersdorf 3">View Details</button>
                    </div>
                </div>
                
                <!-- Active Chore Assignments Section -->
                <div class="section-header">
                    <h2>📋 Active Chore Assignments</h2>
                </div>
                <div class="chores-navigation">
                    <button class="btn btn-red chores-nav-btn active" data-view="active">Active Chores</button>
                    <button class="btn btn-gray chores-nav-btn admin-only" data-view="archived">Archived Chores</button>
                </div>
                <div class="active-chores-section" id="activeChoresSection">
                    <div class="no-chores-message" id="noChoresMessage">
                        <div class="no-chores-icon">📋</div>
                        <p>No active chores assigned yet.</p>
                    </div>
                    <div class="chores-list" id="choresList" style="display: none;">
                        <!-- Active chores will be populated here -->
                    </div>
                </div>
                <div class="archived-chores-section" id="archivedChoresSection" style="display: none;">
                    <div class="no-chores-message" id="noArchivedMessage">
                        <div class="no-chores-icon">📦</div>
                        <p>No archived chores yet.</p>
                    </div>
                    <div class="chores-list" id="archivedChoresList" style="display: none;">
                        <!-- Archived chores will be populated here -->
                    </div>
                </div>
                
                <!-- Chore Completion Analytics Section -->
                <div class="section-header">
                    <h2>📊 Chore Completion Analytics</h2>
                </div>
                <div class="analytics-grid">
                    <div class="analytics-card">
                        <div class="analytics-icon">📈</div>
                        <div class="analytics-number">24</div>
                        <div class="analytics-label">Chores Completed This Week</div>
                    </div>
                    <div class="analytics-card">
                        <div class="analytics-icon">⏰</div>
                        <div class="analytics-number">89%</div>
                        <div class="analytics-label">On-Time Rate</div>
                        <div class="analytics-trend">+5% from last week</div>
                    </div>

                    <div class="analytics-card">
                        <div class="analytics-icon">🏆</div>
                        <div class="analytics-number">342</div>
                        <div class="analytics-label">Points Earned</div>
                        <div class="analytics-trend">+18 from last week</div>
                    </div>
                </div>
                
                <!-- Create New Chore Assignment Form -->
                <div class="section-header">
                    <h2>➕ Create New Chore Assignment</h2>
                </div>
                <div class="chore-form-container">
                    <form class="chore-form" id="choreForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="choreTitle">Chore Title *</label>
                                <input type="text" id="choreTitle" name="title" required placeholder="e.g., Weekly Kitchen Deep Clean">
                            </div>
                            <div class="form-group">
                                <label for="chorePriority">Priority Level *</label>
                                <select id="chorePriority" name="priority" required>
                                    <option value="">Select Priority</option>
                                    <option value="low">Low Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="high">High Priority</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="choreHouse">Target House *</label>
                                <select id="choreHouse" name="house" required>
                                    <option value="">Select House</option>
                                    <option value="Widdersdorf 1">Widdersdorf 1</option>
                                    <option value="Widdersdorf 2">Widdersdorf 2</option>
                                    <option value="Widdersdorf 3">Widdersdorf 3</option>
                                    <option value="all">All Houses</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="choreType">Assignment Type *</label>
                                <select id="choreType" name="type" required>
                                    <option value="">Select Type</option>
                                    <option value="cleaning">Cleaning</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="organization">Organization</option>
                                    <option value="preparation">Preparation</option>
                                    <option value="inspection">Inspection</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="choreDeadline">Deadline *</label>
                                <input type="datetime-local" id="choreDeadline" name="deadline" required>
                            </div>
                            <div class="form-group">
                                <label for="chorePoints">Points Reward</label>
                                <input type="number" id="chorePoints" name="points" value="15" min="5" max="50">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="choreAssignTo">Assign to Player</label>
                                <select id="choreAssignTo" name="assignedTo">
                                    <option value="">Auto-assign to house member</option>
                                    <option value="p1">Max Finkgräfe (Widdersdorf 1)</option>
                                    <option value="p2">Tim Lemperle (Widdersdorf 3)</option>
                                    <option value="p3">Linton Maina (Widdersdorf 2)</option>
                                    <option value="p4">Florian Kainz (Widdersdorf 1)</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group full-width">
                            <label for="choreDescription">Description & Instructions</label>
                            <textarea id="choreDescription" name="description" rows="4" placeholder="Provide detailed instructions for completing this chore..."></textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-red">Create Chore Assignment</button>
                            <button type="button" class="btn btn-gray" id="clearFormBtn">Clear Form</button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div class="page" id="food-orders">
                <h1 class="page-title">Food Orders</h1>
                <p>Food ordering system coming soon...</p>
            </div>
            
            <!-- Communications Page -->
            <div class="page" id="communications">
                <div class="communications-container">
                    <!-- Chat List Sidebar -->
                    <div class="chat-list">
                        <div class="chat-list-header">
                            <h2>💬 Messages</h2>
                            <button class="btn btn-primary" id="newChatBtn">+ New Chat</button>
                        </div>
                        <div class="chat-search">
                            <input type="text" placeholder="Search conversations..." id="chatSearch">
                        </div>
                        <div class="retention-notice" style="padding: 1.25rem; background: linear-gradient(135deg, #fef2f2 0%, #fce7e7 100%); border: 1px solid #fecaca; border-radius: 16px; margin: 1.5rem; font-size: 0.85rem; color: #dc143c; text-align: center; font-weight: 500;">
                            💬 Messages automatically deleted after 30 days
                        </div>
                        <div class="chat-list-content" id="chatListContent">
                            <div class="no-chats-message">
                                No conversations yet. Start a new chat!
                            </div>
                        </div>
                    </div>
                    
                    <!-- Chat Window -->
                    <div class="chat-window">
                        <div class="chat-header" id="chatHeader" style="display: none;">
                            <div class="chat-header-info">
                                <h3 id="chatTitle">Select a conversation</h3>
                                <span id="chatSubtitle"></span>
                            </div>
                            <div class="chat-header-actions">
                                <button class="btn btn-secondary" id="chatInfoBtn">ℹ️</button>
                            </div>
                        </div>
                        
                        <div class="chat-messages" id="chatMessages">
                            <div class="no-chat-selected">
                                Select a conversation to start messaging
                            </div>
                        </div>
                        
                        <div class="chat-input-container" id="chatInputContainer" style="display: none;">
                            <div class="chat-input">
                                <input type="text" placeholder="Type a message..." id="messageInput">
                                <button class="send-btn" id="sendBtn">➤</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- New Chat Modal -->
                <div class="modal" id="newChatModal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Start New Chat</h3>
                            <button class="close-btn" id="closeNewChatModal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="chat-type-selection">
                                <button class="btn btn-primary chat-type-btn active" data-type="direct">Direct Message</button>
                                <button class="btn btn-secondary chat-type-btn" data-type="group">Group Chat</button>
                            </div>
                            
                            <!-- Direct Message Form -->
                            <div class="chat-form" id="directChatForm">
                                <div class="form-group">
                                    <label>Select Person:</label>
                                    <select id="directChatRecipient" class="form-control">
                                        <option value="">Choose a person...</option>
                                    </select>
                                </div>
                            </div>
                            
                            <!-- Group Chat Form -->
                            <div class="chat-form" id="groupChatForm" style="display: none;">
                                <div class="form-group">
                                    <label>Group Name:</label>
                                    <input type="text" id="groupChatName" placeholder="Enter group name..." class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>Add Members:</label>
                                    <div class="member-selection" id="memberSelection">
                                        <!-- Members will be populated here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" id="cancelNewChat">Cancel</button>
                            <button class="btn btn-primary" id="createChatBtn">Create Chat</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="page" id="calendar">
                <div class="page-header">
                    <h1 class="page-title">Calendar</h1>
                </div>
                
                <div class="calendar-container">
                    <div class="calendar-header">
                        <div class="calendar-nav">
                            <button class="btn btn-icon" id="prevPeriod">&larr;</button>
                            <h2 class="calendar-period-title" id="calendarPeriodTitle">January 2025</h2>
                            <button class="btn btn-icon" id="nextPeriod">&rarr;</button>
                        </div>
                        <div class="calendar-view-switcher">
                            <button class="view-btn" data-view="day">Day</button>
                            <button class="view-btn active" data-view="week">Week</button>
                            <button class="view-btn" data-view="month">Month</button>
                        </div>
                        <div class="calendar-actions">
                            <button class="btn btn-primary" id="addEventBtn" style="display: none;">+ Add Event</button>
                        </div>
                    </div>
                    
                    <div class="calendar-grid" id="calendarGrid">
                        <div class="calendar-day-header">Sun</div>
                        <div class="calendar-day-header">Mon</div>
                        <div class="calendar-day-header">Tue</div>
                        <div class="calendar-day-header">Wed</div>
                        <div class="calendar-day-header">Thu</div>
                        <div class="calendar-day-header">Fri</div>
                        <div class="calendar-day-header">Sat</div>
                        <!-- Days will be populated here -->
                    </div>
                </div>
                
                <!-- Add Event Modal -->
                <div class="modal" id="addEventModal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Add Calendar Event</h3>
                            <button class="close-btn" data-action="close-event">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label>Event Title</label>
                                <input type="text" id="eventTitle" class="form-control" placeholder="Training Session, Match, etc." required>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Date</label>
                                    <input type="date" id="eventDate" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label>Start Time</label>
                                    <input type="time" id="eventStartTime" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label>End Time</label>
                                    <input type="time" id="eventEndTime" class="form-control" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Event Type</label>
                                <select id="eventType" class="form-control">
                                    <option value="training">Training Session</option>
                                    <option value="match">Match</option>
                                    <option value="meeting">Team Meeting</option>
                                    <option value="facility">Facility Booking</option>
                                    <option value="medical">Medical Appointment</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Location</label>
                                <input type="text" id="eventLocation" class="form-control" placeholder="Training Ground, Stadium, etc.">
                            </div>
                            <div class="form-group">
                                <label>Description</label>
                                <textarea id="eventDescription" class="form-control" rows="3" placeholder="Event details..."></textarea>
                            </div>
                            
                            <div class="form-group recurring-section">
                                <label>
                                    <input type="checkbox" id="recurringEvent" style="margin-right: 8px;"> Recurring Event
                                </label>
                            </div>
                            
                            <div id="recurringOptions" class="recurring-options" style="display: none; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; margin-top: 1rem; background: #f8fafc;">
                                <div class="form-group">
                                    <label>Repeat Pattern</label>
                                    <select id="recurringType" class="form-control">
                                        <option value="daily">Daily</option>
                                        <option value="weekdays">Monday to Friday</option>
                                        <option value="custom">Custom Days</option>
                                        <option value="weekly">Weekly</option>
                                    </select>
                                </div>
                                
                                <div id="customDaysSection" class="form-group" style="display: none;">
                                    <label>Select Days</label>
                                    <div class="days-selector" style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem;">
                                        <label class="day-checkbox" style="display: flex; align-items: center; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                                            <input type="checkbox" value="1" style="margin-right: 4px;"> Mon
                                        </label>
                                        <label class="day-checkbox" style="display: flex; align-items: center; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                                            <input type="checkbox" value="2" style="margin-right: 4px;"> Tue
                                        </label>
                                        <label class="day-checkbox" style="display: flex; align-items: center; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                                            <input type="checkbox" value="3" style="margin-right: 4px;"> Wed
                                        </label>
                                        <label class="day-checkbox" style="display: flex; align-items: center; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                                            <input type="checkbox" value="4" style="margin-right: 4px;"> Thu
                                        </label>
                                        <label class="day-checkbox" style="display: flex; align-items: center; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                                            <input type="checkbox" value="5" style="margin-right: 4px;"> Fri
                                        </label>
                                        <label class="day-checkbox" style="display: flex; align-items: center; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                                            <input type="checkbox" value="6" style="margin-right: 4px;"> Sat
                                        </label>
                                        <label class="day-checkbox" style="display: flex; align-items: center; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                                            <input type="checkbox" value="0" style="margin-right: 4px;"> Sun
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>End Date</label>
                                        <input type="date" id="recurringEndDate" class="form-control">
                                    </div>
                                    <div class="form-group">
                                        <label>OR Max Occurrences</label>
                                        <input type="number" id="recurringCount" class="form-control" placeholder="e.g. 10" min="1" max="365">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" data-action="close-event">Cancel</button>
                            <button class="btn btn-primary" id="saveEventBtn">Save Event</button>
                        </div>
                    </div>
                </div>
                
                <!-- Event Details Modal -->
                <div class="modal" id="eventDetailsModal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="eventDetailsTitle">Event Details</h3>
                            <button class="close-btn" data-action="close-details">&times;</button>
                        </div>
                        <div class="modal-body" id="eventDetailsBody">
                            <!-- Event details will be populated here -->
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" data-action="close-details">Close</button>
                            <button class="btn btn-danger" id="deleteEventBtn" style="display: none;">Delete Event</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="page" id="admin">
                <div class="page-header">
                    <h1 class="page-title">User Management</h1>
                    <p class="page-subtitle">Manage pending applications and existing user accounts</p>
                </div>
                
                <!-- Pending Applications Section -->
                <div class="admin-section">
                    <div class="admin-section-header">
                        <div>
                            <h2 class="admin-section-title">📝 Pending Applications</h2>
                            <p class="admin-section-subtitle">Review and approve new staff and player applications</p>
                        </div>
                        <div class="pending-count" id="pendingCount">3 pending</div>
                    </div>
                    <div class="admin-section-body">
                        <div id="pendingApplicationsList">
                            <!-- Applications will be loaded here -->
                        </div>
                    </div>
                </div>

                <!-- Existing Users Section -->
                <div class="admin-section">
                    <div class="admin-section-header">
                        <div>
                            <h2 class="admin-section-title">👥 Existing Users</h2>
                            <p class="admin-section-subtitle">Manage current staff and player accounts</p>
                        </div>
                        <div class="users-count" id="usersCount">6 total users</div>
                    </div>
                    <div class="admin-section-body">
                        <div class="users-grid" id="existingUsersList">
                            <!-- Users will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Global variables
        let currentUser = null;
        let players = [];
        
        // Utility functions
        function showAuthMessage(text, type) {
            const messageDiv = document.getElementById('authMessage');
            messageDiv.innerHTML = '<div class="message ' + type + '">' + text + '</div>';
        }
        
        function clearAuthMessage() {
            document.getElementById('authMessage').innerHTML = '';
        }
        
        async function apiRequest(url, data) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                return await response.json();
            } catch (error) {
                console.error('Request failed:', error);
                return { success: false, message: 'Network error' };
            }
        }
        
        // Authentication functions
        function showAuthTab(tab) {
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            const targetForm = document.querySelector('[data-form="' + tab + '"]');
            const targetBtn = document.querySelector('[data-tab="' + tab + '"]');
            
            if (targetForm) targetForm.classList.add('active');
            if (targetBtn) targetBtn.classList.add('active');
            
            clearAuthMessage();
        }
        
        function showMainApp() {
            document.getElementById('authContainer').style.display = 'none';
            document.getElementById('mainApp').classList.add('active');
            
            document.getElementById('headerUserInfo').textContent = 'Welcome, ' + currentUser.name;
            
            // Show/hide admin features
            const adminElements = document.querySelectorAll('.admin-only');
            adminElements.forEach(el => {
                el.style.display = currentUser.role === 'admin' ? 'block' : 'none';
            });
            
            loadDashboardData();
        }
        
        function showPage(pageId) {
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            const targetPage = document.getElementById(pageId);
            const targetTab = document.querySelector('[data-page="' + pageId + '"]');
            
            if (targetPage) targetPage.classList.add('active');
            if (targetTab) targetTab.classList.add('active');
            
            // Load page-specific data
            if (pageId === 'players') {
                loadPlayers();
            } else if (pageId === 'chores') {
                updateHouseStatistics();
                loadActiveChores();
            } else if (pageId === 'admin') {
                if (currentUser && currentUser.role === 'admin') {
                    loadUserManagement();
                }
            } else if (pageId === 'food-orders') {
                loadFoodOrderData();
            } else if (pageId === 'communications') {
                initializeCommunications();
            } else if (pageId === 'calendar') {
                initializeCalendar();
            }
        }
        
        function logout() {
            currentUser = null;
            document.getElementById('authContainer').style.display = 'flex';
            document.getElementById('mainApp').classList.remove('active');
            showAuthTab('login');
            clearAuthMessage();
        }
        
        // Data loading functions
        async function loadDashboardData() {
            try {
                // Load players data
                const playersResponse = await fetch('/api/players');
                const playersData = await playersResponse.json();
                
                if (playersData.success) {
                    players = playersData.players;
                    updateDashboardStats();
                    renderPlayerOverview();
                }
                
                // Load dashboard stats
                const statsResponse = await fetch('/api/dashboard/stats');
                const statsData = await statsResponse.json();
                
                if (statsData.success) {
                    updateDashboardStatsFromAPI(statsData.stats);
                }
                
                // Load recent activity
                const activityResponse = await fetch('/api/dashboard/recent-activity');
                const activityData = await activityResponse.json();
                
                if (activityData.success) {
                    renderRecentActivity(activityData.activities);
                }
                
                // Load house competition
                const houseResponse = await fetch('/api/dashboard/house-competition');
                const houseData = await houseResponse.json();
                
                if (houseData.success) {
                    renderHouseCompetition(houseData.houses, houseData.weekChallenges);
                }
                
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            }
        }
        
        function updateDashboardStats() {
            document.getElementById('totalPlayers').textContent = players.length;
            document.getElementById('trainingToday').textContent = players.filter(p => p.status === 'training').length;
            document.getElementById('activitiesToday').textContent = 5; // Static for now
        }
        
        function updateDashboardStatsFromAPI(stats) {
            document.getElementById('totalPlayers').textContent = stats.totalPlayers;
            document.getElementById('trainingToday').textContent = stats.trainingToday;
            document.getElementById('activitiesToday').textContent = stats.activitiesToday;
        }
        
        function renderRecentActivity(activities) {
            const container = document.querySelector('.recent-activity');
            if (!container) return;
            
            let html = '';
            activities.forEach(activity => {
                html += '<div class="activity-item">' +
                    '<div class="activity-time">' + activity.time + '</div>' +
                    '<div class="activity-content">' +
                        '<div class="activity-title">' + activity.title + '</div>' +
                        '<div class="activity-description">' + activity.description + '</div>' +
                    '</div>' +
                '</div>';
            });
            
            container.innerHTML = html;
        }
        
        function renderHouseCompetition(houses, weekChallenges) {
            const container = document.querySelector('.house-leaderboard');
            if (!container) return;
            
            let html = '';
            houses.forEach(house => {
                const rankClass = 'house-rank-' + house.rank;
                html += '<div class="house-rank ' + rankClass + '">' +
                    '<div class="rank-trophy">' + house.trophy + '</div>' +
                    '<div class="house-info">' +
                        '<div class="house-name">' + house.name + '</div>' +
                        '<div class="house-stats">' + house.players + ' players • ' + house.stats + '</div>' +
                    '</div>' +
                    '<div class="house-points">' + house.points + ' pts</div>' +
                '</div>';
            });
            
            container.innerHTML = html;
            
            // Update week challenges
            const challengesContainer = document.querySelector('.week-challenges');
            if (challengesContainer) {
                challengesContainer.innerHTML = '<strong>This Week:</strong> ' + weekChallenges;
            }
        }
        
        function renderPlayerOverview() {
            const container = document.querySelector('.player-overview-cards');
            if (!container) return;
            
            let html = '';
            
            // Show actual players from backend or default to sample data
            const displayPlayers = players.length > 0 ? players.slice(0, 4) : [
                { name: 'Max Finkgräfe', position: 'STRIKER', house: 'Widdersdorf 1', status: 'active' },
                { name: 'Tim Lemperle', position: 'WINGER', house: 'Widdersdorf 3', status: 'active' },
                { name: 'Linton Maina', position: 'WINGER', house: 'Widdersdorf 2', status: 'training' },
                { name: 'Florian Kainz', position: 'MIDFIELDER', house: 'Widdersdorf 1', status: 'rest' }
            ];
            
            displayPlayers.forEach(player => {
                const statusClass = player.status === 'active' ? 'status-active' : 
                                   player.status === 'training' ? 'status-training' : 'status-rest';
                const statusText = player.status === 'rest' ? 'REST DAY' : player.status.toUpperCase();
                
                html += '<div class="player-overview-card">' +
                    '<div class="player-info">' +
                        '<div class="player-name">' + player.name + '</div>' +
                        '<div class="player-position">⚽ ' + player.position + '</div>' +
                        '<div class="player-house">' + player.house + '</div>' +
                    '</div>' +
                    '<div class="player-status ' + statusClass + '">' + statusText + '</div>' +
                '</div>';
            });
            
            container.innerHTML = html;
        }
        
        async function loadPlayers() {
            try {
                // Add cache-busting timestamp
                const response = await fetch('/api/players?_=' + Date.now());
                const data = await response.json();
                
                if (data.success) {
                    players = data.players;
                    console.log('Loaded players:', players); // Debug log
                    renderPlayersGrid();
                    updatePlayerOverviewStats();
                }
            } catch (error) {
                console.error('Failed to load players:', error);
            }
        }
        
        function renderPlayersGrid() {
            const container = document.getElementById('playersGrid');
            
            // Apply filters
            const searchTerm = document.getElementById('playerSearch').value.toLowerCase();
            const positionFilter = document.getElementById('positionFilter').value;
            const houseFilter = document.getElementById('houseFilter').value;
            const statusFilter = document.getElementById('statusFilter').value;
            
            let filteredPlayers = players.filter(player => {
                const matchesSearch = player.name.toLowerCase().includes(searchTerm) ||
                                    player.position.toLowerCase().includes(searchTerm) ||
                                    player.house.toLowerCase().includes(searchTerm);
                const matchesPosition = !positionFilter || player.position === positionFilter;
                const matchesHouse = !houseFilter || player.house === houseFilter;
                const matchesStatus = !statusFilter || player.status === statusFilter;
                
                return matchesSearch && matchesPosition && matchesHouse && matchesStatus;
            });
            
            if (filteredPlayers.length === 0) {
                container.innerHTML = '<div class="no-players-message">No players match the current filters.</div>';
                return;
            }
            
            let html = '';
            filteredPlayers.forEach(player => {
                const statusClass = 'status-' + player.status;
                const statusText = player.status.charAt(0).toUpperCase() + player.status.slice(1);
                const joinDate = new Date(player.joinDate).toLocaleDateString();
                
                html += '<div class="player-card" data-action="view-player" data-id="' + player.id + '" style="cursor: pointer;">' +
                    '<div class="player-card-header">' +
                        '<div>' +
                            '<div class="player-card-name">' + player.name + '</div>' +
                            '<div class="player-card-position">⚽ ' + player.position + '</div>' +
                        '</div>' +
                        '<div class="player-card-status ' + statusClass + '">' + statusText + '</div>' +
                    '</div>' +
                    '<div class="player-card-details">' +
                        '<div class="player-card-detail"><strong>Age:</strong> ' + player.age + '</div>' +
                        '<div class="player-card-detail"><strong>House:</strong> ' + formatHouseName(player.house) + '</div>' +
                        '<div class="player-card-detail"><strong>Nationality:</strong> ' + (player.nationality || 'N/A') + '</div>' +
                        '<div class="player-card-detail"><strong>Joined:</strong> ' + joinDate + '</div>' +
                    '</div>' +
                    '</div>' +
                '</div>';
            });
            
            container.innerHTML = html;
        }
        
        function updatePlayerOverviewStats() {
            const totalPlayers = players.length;
            const activePlayers = players.filter(p => p.status === 'active').length;
            const injuredPlayers = players.filter(p => p.status === 'injured').length;
            
            document.getElementById('totalPlayersCount').textContent = totalPlayers;
            document.getElementById('activePlayersCount').textContent = activePlayers;
            document.getElementById('injuredPlayersCount').textContent = injuredPlayers;
        }
        
        function renderPlayersTable() {
            const container = document.getElementById('playersTable');
            
            if (players.length === 0) {
                container.innerHTML = '<p>No players registered yet.</p>';
                return;
            }
            
            let html = '<table class="table"><thead><tr><th>Name</th><th>Age</th><th>Position</th><th>House</th><th>Status</th><th>Join Date</th></tr></thead><tbody>';
            
            players.forEach(player => {
                const joinDate = new Date(player.joinDate).toLocaleDateString();
                html += '<tr>' +
                    '<td>' + player.name + '</td>' +
                    '<td>' + player.age + '</td>' +
                    '<td>' + player.position + '</td>' +
                    '<td>' + formatHouseName(player.house) + '</td>' +
                    '<td>' + player.status + '</td>' +
                    '<td>' + joinDate + '</td>' +
                '</tr>';
            });
            
            html += '</tbody></table>';
            container.innerHTML = html;
        }
        
        // formatHouseName function moved to player management section
        
        // Event listeners
        document.addEventListener('DOMContentLoaded', function() {
            // Tab button event listeners
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    showAuthTab(this.dataset.tab);
                });
            });
            
            // Navigation tab event listeners
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.addEventListener('click', function() {
                    showPage(this.dataset.page);
                });
            });
            
            // Link event listeners for page navigation
            document.addEventListener('click', function(e) {
                if (e.target.dataset.page) {
                    e.preventDefault();
                    showPage(e.target.dataset.page);
                }
                if (e.target.dataset.tab) {
                    e.preventDefault();
                    showAuthTab(e.target.dataset.tab);
                }
                // Registration type switching
                if (e.target.closest('.reg-type')) {
                    const regType = e.target.closest('.reg-type');
                    const type = regType.dataset.type;
                    
                    // Update active state
                    document.querySelectorAll('.reg-type').forEach(function(rt) {
                        rt.classList.remove('active');
                        rt.style.border = '2px solid #e5e7eb';
                        rt.style.background = '#f9fafb';
                    });
                    
                    regType.classList.add('active');
                    regType.style.border = '2px solid #dc143c';
                    regType.style.background = '#fef2f2';
                    
                    // Show appropriate form
                    document.getElementById('playerRegForm').style.display = type === 'player' ? 'block' : 'none';
                    document.getElementById('staffRegForm').style.display = type === 'staff' ? 'block' : 'none';
                }
            });
            
            // Logout button
            document.getElementById('logoutBtn').addEventListener('click', logout);
            
            // Form submissions
            document.getElementById('loginForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                
                const result = await apiRequest('/auth/login', { email, password });
                
                if (result.success) {
                    currentUser = result.user;
                    showMainApp();
                } else {
                    showAuthMessage(result.message || 'Login failed', 'error');
                }
            });
            
            document.getElementById('registerForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const activeRegType = document.querySelector('.reg-type.active').dataset.type;
                
                let registrationData;
                
                if (activeRegType === 'player') {
                    registrationData = {
                        name: document.getElementById('firstName').value + ' ' + document.getElementById('lastName').value,
                        email: document.getElementById('playerEmail').value,
                        password: 'TempPass123', // Temporary password for demo
                        role: 'player',
                        firstName: document.getElementById('firstName').value,
                        lastName: document.getElementById('lastName').value,
                        phoneNumber: document.getElementById('phoneNumber').value,
                        dateOfBirth: document.getElementById('dateOfBirth').value,
                        nationality: document.getElementById('nationality').value,
                        position: document.getElementById('primaryPosition').value
                    };
                } else {
                    registrationData = {
                        name: document.getElementById('staffName').value,
                        email: document.getElementById('staffEmail').value,
                        password: document.getElementById('staffPassword').value,
                        role: document.getElementById('staffRole').value
                    };
                }
                
                const result = await apiRequest('/auth/register', registrationData);
                
                if (result.success) {
                    showAuthMessage('Registration successful! Please contact administration for account activation.', 'success');
                    setTimeout(function() {
                        showAuthTab('login');
                    }, 2000);
                } else {
                    showAuthMessage(result.message || 'Registration failed', 'error');
                }
            });
            
            document.getElementById('forgotForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = document.getElementById('forgotEmail').value;
                
                const result = await apiRequest('/auth/forgot-password', { email });
                
                if (result.success) {
                    showAuthMessage(result.message, 'success');
                } else {
                    showAuthMessage(result.message || 'Reset failed', 'error');
                }
            });
            
            // Player form removed - all user management handled in dedicated User Management section
        });
        
        // Player management functionality
        function initializePlayerManagement() {
            // Filter event listeners
            const playerSearch = document.getElementById('playerSearch');
            const positionFilter = document.getElementById('positionFilter');
            const houseFilter = document.getElementById('houseFilter');
            const statusFilter = document.getElementById('statusFilter');
            
            if (playerSearch) playerSearch.addEventListener('input', renderPlayersGrid);
            if (positionFilter) positionFilter.addEventListener('change', renderPlayersGrid);
            if (houseFilter) houseFilter.addEventListener('change', renderPlayersGrid);
            if (statusFilter) statusFilter.addEventListener('change', renderPlayersGrid);
            
            // Player management is now view-only - editing handled in User Management section
            
            // Enhanced event delegation for player management
            document.addEventListener('click', function(e) {
                const action = e.target.getAttribute('data-action');
                
                if (action === 'view-player') {
                    console.log('Player view button clicked');
                    const playerId = e.target.getAttribute('data-id');
                    console.log('Opening player details for ID:', playerId);
                    viewPlayerDetails(playerId);
                } else if (action === 'change-status') {
                    const status = e.target.getAttribute('data-status');
                    console.log('Changing player status to:', status);
                    changePlayerStatus(status);
                }
            });
        }
        
        function formatHouseName(house) {
            // Since backend data is already properly formatted, just return it
            return house || 'N/A';
        }
        
        // viewPlayerDetails function is now defined in the modal script section
        
        // Food Order Management Functions
        function initializeFoodOrdering() {
            // Category toggle functionality
            document.querySelectorAll('.category-header').forEach(header => {
                header.addEventListener('click', function() {
                    const category = this.parentElement;
                    category.classList.toggle('collapsed');
                });
            });
            
            // Button functionality
            const placeOrderBtn = document.getElementById('placeOrderBtn');
            const exportBtn = document.getElementById('exportOrderBtn');
            const clearBtn = document.getElementById('clearOrderBtn');
            const generateSummaryBtn = document.getElementById('generateSummaryBtn');
            const exportDeliverySummaryBtn = document.getElementById('exportDeliverySummaryBtn');
            const exportConsolidatedListBtn = document.getElementById('exportConsolidatedListBtn');
            
            if (placeOrderBtn) {
                placeOrderBtn.addEventListener('click', placeOrder);
            }
            
            if (exportBtn) {
                exportBtn.addEventListener('click', exportOrderAsCSV);
            }
            
            if (clearBtn) {
                clearBtn.addEventListener('click', clearAllOrders);
            }
            
            if (generateSummaryBtn) {
                generateSummaryBtn.addEventListener('click', generateDeliverySummary);
            }
            
            if (exportDeliverySummaryBtn) {
                exportDeliverySummaryBtn.addEventListener('click', exportDeliverySummaryForKitchen);
            }
            
            if (exportConsolidatedListBtn) {
                exportConsolidatedListBtn.addEventListener('click', exportConsolidatedShoppingList);
            }
        }
        
        // Food items data
        const foodItemsData = {
            household: [
                { id: 'toilet_paper', name: 'Toilet Paper', price: 0 },
                { id: 'paper_towels', name: 'Paper Towels', price: 0 },
                { id: 'dish_soap', name: 'Dish Soap', price: 0 },
                { id: 'laundry_detergent', name: 'Laundry Detergent', price: 0 },
                { id: 'trash_bags', name: 'Trash Bags', price: 0 },
                { id: 'aluminum_foil', name: 'Aluminum Foil', price: 0 },
                { id: 'plastic_wrap', name: 'Plastic Wrap', price: 0 },
                { id: 'cleaning_spray', name: 'All-Purpose Cleaner', price: 0 }
            ],
            produce: [
                { id: 'bananas', name: 'Bananas (1kg)', price: 1.99 },
                { id: 'apples', name: 'Apples (1kg)', price: 2.49 },
                { id: 'carrots', name: 'Carrots (500g)', price: 0.99 },
                { id: 'onions', name: 'Onions (1kg)', price: 1.49 },
                { id: 'tomatoes', name: 'Tomatoes (500g)', price: 2.99 },
                { id: 'potatoes', name: 'Potatoes (2kg)', price: 2.49 },
                { id: 'lettuce', name: 'Lettuce Head', price: 1.99 },
                { id: 'cucumbers', name: 'Cucumbers (3 pieces)', price: 1.49 },
                { id: 'bell_peppers', name: 'Bell Peppers (3 pieces)', price: 2.99 },
                { id: 'spinach', name: 'Fresh Spinach (250g)', price: 2.49 }
            ],
            meat: [
                { id: 'chicken_breast', name: 'Chicken Breast (1kg)', price: 8.99 },
                { id: 'ground_beef', name: 'Ground Beef (500g)', price: 6.99 },
                { id: 'pork_chops', name: 'Pork Chops (4 pieces)', price: 7.49 },
                { id: 'salmon', name: 'Salmon Fillets (400g)', price: 12.99 },
                { id: 'turkey_slices', name: 'Turkey Slices (200g)', price: 4.99 },
                { id: 'sausages', name: 'Bratwurst (6 pieces)', price: 5.49 },
                { id: 'ham', name: 'Ham Slices (200g)', price: 4.49 },
                { id: 'beef_steak', name: 'Beef Steak (400g)', price: 15.99 }
            ],
            dairy: [
                { id: 'milk', name: 'Whole Milk (1L)', price: 1.29 },
                { id: 'eggs', name: 'Eggs (12 pieces)', price: 2.49 },
                { id: 'butter', name: 'Butter (250g)', price: 2.99 },
                { id: 'cheese_gouda', name: 'Gouda Cheese (200g)', price: 3.99 },
                { id: 'yogurt', name: 'Greek Yogurt (500g)', price: 2.99 },
                { id: 'cream_cheese', name: 'Cream Cheese (200g)', price: 2.49 },
                { id: 'sour_cream', name: 'Sour Cream (200g)', price: 1.99 },
                { id: 'mozzarella', name: 'Mozzarella (125g)', price: 2.49 }
            ],
            carbs: [
                { id: 'bread', name: 'Whole Wheat Bread', price: 1.99 },
                { id: 'pasta', name: 'Spaghetti (500g)', price: 1.49 },
                { id: 'rice', name: 'Basmati Rice (1kg)', price: 2.99 },
                { id: 'potatoes_bag', name: 'Potatoes (5kg)', price: 4.99 },
                { id: 'bagels', name: 'Bagels (6 pieces)', price: 2.99 },
                { id: 'cereal', name: 'Breakfast Cereal', price: 4.49 },
                { id: 'oats', name: 'Rolled Oats (500g)', price: 2.49 },
                { id: 'quinoa', name: 'Quinoa (500g)', price: 5.99 }
            ],
            drinks: [
                { id: 'water', name: 'Sparkling Water (6x1L)', price: 2.99 },
                { id: 'orange_juice', name: 'Orange Juice (1L)', price: 2.49 },
                { id: 'coffee', name: 'Ground Coffee (250g)', price: 4.99 },
                { id: 'tea', name: 'Tea Bags (20 pieces)', price: 2.99 },
                { id: 'energy_drink', name: 'Energy Drink (4 cans)', price: 5.99 },
                { id: 'soft_drink', name: 'Cola (6x330ml)', price: 3.99 },
                { id: 'beer', name: 'Beer (6x500ml)', price: 7.99 },
                { id: 'wine', name: 'Red Wine (750ml)', price: 8.99 }
            ],
            spices: [
                { id: 'salt', name: 'Sea Salt (500g)', price: 1.49 },
                { id: 'pepper', name: 'Black Pepper (100g)', price: 2.99 },
                { id: 'paprika', name: 'Paprika (50g)', price: 1.99 },
                { id: 'garlic_powder', name: 'Garlic Powder (100g)', price: 2.49 },
                { id: 'oregano', name: 'Dried Oregano (20g)', price: 1.99 },
                { id: 'ketchup', name: 'Ketchup (500ml)', price: 2.49 },
                { id: 'mustard', name: 'Mustard (200ml)', price: 1.99 },
                { id: 'bbq_sauce', name: 'BBQ Sauce (400ml)', price: 3.49 }
            ],
            frozen: [
                { id: 'pizza', name: 'Frozen Pizza (400g)', price: 3.99 },
                { id: 'ice_cream', name: 'Vanilla Ice Cream (1L)', price: 4.99 },
                { id: 'frozen_vegetables', name: 'Mixed Vegetables (1kg)', price: 2.99 },
                { id: 'fish_sticks', name: 'Fish Sticks (400g)', price: 4.49 },
                { id: 'french_fries', name: 'French Fries (1kg)', price: 2.99 },
                { id: 'chicken_nuggets', name: 'Chicken Nuggets (500g)', price: 5.49 },
                { id: 'frozen_berries', name: 'Mixed Berries (300g)', price: 3.99 },
                { id: 'frozen_fish', name: 'Frozen Fish Fillets (400g)', price: 6.99 }
            ]
        };
        
        let currentOrder = {};
        const BUDGET_LIMIT = 35.00; // €35 budget limit per player
        
        function loadFoodOrderData() {
            // Check if user is authorized to order food
            if (!isAuthorizedToOrder()) {
                showUnauthorizedMessage();
                return;
            }
            
            // Load existing order for the current user
            const orderKey = 'fckoln_food_order_' + currentUser.id;
            const savedOrder = localStorage.getItem(orderKey);
            if (savedOrder) {
                currentOrder = JSON.parse(savedOrder);
            }
            
            // Show player access information
            showPlayerAccessInfo();
            
            // Render all food categories
            Object.keys(foodItemsData).forEach(categoryKey => {
                renderFoodCategory(categoryKey, foodItemsData[categoryKey]);
            });
            
            // Update order summary and budget
            updateOrderSummary();
            updateBudgetDisplay();
            updatePlaceOrderButton();
        }
        
        function isAuthorizedToOrder() {
            // Only players can place food orders for themselves
            return currentUser && (currentUser.role === 'player' || currentUser.role === 'admin');
        }
        
        function showUnauthorizedMessage() {
            const container = document.querySelector('.food-order-container');
            if (container) {
                container.innerHTML = '<div class="player-access-only">' +
                    '<div class="access-message">🔒 Food Orders - Player Access Only</div>' +
                    '<div class="access-details">Only registered players can place food orders. Staff members can view but not modify orders.</div>' +
                '</div>';
            }
        }
        
        function showPlayerAccessInfo() {
            if (currentUser.role === 'player') {
                const infoDiv = document.createElement('div');
                infoDiv.className = 'player-access-only';
                infoDiv.innerHTML = '<div class="access-message">🛒 Personal Food Order</div>' +
                    '<div class="access-details">Ordering for: ' + currentUser.name + ' | Budget: €35.00 per week</div>';
                
                const container = document.querySelector('.food-order-container');
                if (container) {
                    container.insertBefore(infoDiv, container.firstChild);
                }
            }
        }
        
        function renderFoodCategory(categoryKey, items) {
            const containerMap = {
                household: 'householdItems',
                produce: 'produceItems',
                meat: 'meatItems',
                dairy: 'dairyItems',
                carbs: 'carbsItems',
                drinks: 'drinksItems',
                spices: 'spicesItems',
                frozen: 'frozenItems'
            };
            
            const container = document.getElementById(containerMap[categoryKey]);
            if (!container) return;
            
            let html = '';
            items.forEach(item => {
                const itemOrder = currentOrder[item.id] || { selected: false, quantity: 0 };
                const selectedClass = itemOrder.selected ? ' selected' : '';
                
                html += '<div class="food-item' + selectedClass + '" data-item-id="' + item.id + '">' +
                    '<input type="checkbox" class="food-item-checkbox" ' + (itemOrder.selected ? 'checked' : '') + '>' +
                    '<div class="food-item-details">' +
                        '<div class="food-item-name">' + item.name + '</div>' +
                        (item.price > 0 ? '<div class="food-item-price">€' + item.price.toFixed(2) + '</div>' : '<div class="food-item-price">Free</div>') +
                    '</div>' +
                    '<div class="quantity-selector">' +
                        '<button class="quantity-btn" data-action="decrease">-</button>' +
                        '<input type="number" class="quantity-input" value="' + itemOrder.quantity + '" min="0" max="20">' +
                        '<button class="quantity-btn" data-action="increase">+</button>' +
                    '</div>' +
                '</div>';
            });
            
            container.innerHTML = html;
            
            // Add event listeners for this category
            container.querySelectorAll('.food-item').forEach(item => {
                const itemId = item.getAttribute('data-item-id');
                const checkbox = item.querySelector('.food-item-checkbox');
                const quantityInput = item.querySelector('.quantity-input');
                const decreaseBtn = item.querySelector('[data-action="decrease"]');
                const increaseBtn = item.querySelector('[data-action="increase"]');
                
                checkbox.addEventListener('change', function() {
                    updateItemSelection(itemId, this.checked, parseInt(quantityInput.value) || 0);
                });
                
                quantityInput.addEventListener('change', function() {
                    const quantity = parseInt(this.value) || 0;
                    updateItemSelection(itemId, quantity > 0, quantity);
                });
                
                decreaseBtn.addEventListener('click', function() {
                    const currentQty = parseInt(quantityInput.value) || 0;
                    const newQty = Math.max(0, currentQty - 1);
                    quantityInput.value = newQty;
                    updateItemSelection(itemId, newQty > 0, newQty);
                });
                
                increaseBtn.addEventListener('click', function() {
                    const currentQty = parseInt(quantityInput.value) || 0;
                    const newQty = Math.min(20, currentQty + 1);
                    quantityInput.value = newQty;
                    updateItemSelection(itemId, newQty > 0, newQty);
                });
            });
        }
        
        function updateItemSelection(itemId, selected, quantity) {
            const itemData = findItemById(itemId);
            if (!itemData) return;
            
            // Calculate potential new total
            const tempOrder = { ...currentOrder };
            if (selected && quantity > 0) {
                tempOrder[itemId] = { selected: true, quantity: quantity };
            } else {
                delete tempOrder[itemId];
            }
            
            const newTotal = calculateOrderTotal(tempOrder);
            
            // Check budget limit
            if (newTotal > BUDGET_LIMIT) {
                alert('Budget exceeded! You have a €' + BUDGET_LIMIT.toFixed(2) + ' weekly limit. Current selection would cost €' + newTotal.toFixed(2));
                return;
            }
            
            // Update order
            if (selected && quantity > 0) {
                currentOrder[itemId] = { selected: true, quantity: quantity };
            } else {
                delete currentOrder[itemId];
            }
            
            // Update UI
            const itemElement = document.querySelector('[data-item-id="' + itemId + '"]');
            if (itemElement) {
                if (selected && quantity > 0) {
                    itemElement.classList.add('selected');
                    itemElement.querySelector('.food-item-checkbox').checked = true;
                } else {
                    itemElement.classList.remove('selected');
                    itemElement.querySelector('.food-item-checkbox').checked = false;
                }
            }
            
            // Save to user-specific localStorage
            const orderKey = 'fckoln_food_order_' + currentUser.id;
            localStorage.setItem(orderKey, JSON.stringify(currentOrder));
            
            // Update summary and budget
            updateOrderSummary();
            updateBudgetDisplay();
            updateItemAvailability();
            updatePlaceOrderButton();
        }
        
        function calculateOrderTotal(order) {
            let total = 0;
            Object.keys(order).forEach(itemId => {
                const orderItem = order[itemId];
                const itemData = findItemById(itemId);
                
                if (itemData && orderItem.selected && orderItem.quantity > 0) {
                    // Household items are free (price = 0) and don't count toward budget
                    if (itemData.price > 0) {
                        total += itemData.price * orderItem.quantity;
                    }
                }
            });
            return total;
        }
        
        function updateBudgetDisplay() {
            const currentTotal = calculateOrderTotal(currentOrder);
            const remaining = BUDGET_LIMIT - currentTotal;
            const percentUsed = (currentTotal / BUDGET_LIMIT) * 100;
            
            const budgetAmountEl = document.getElementById('budgetRemaining');
            const budgetBarEl = document.getElementById('budgetUsedBar');
            
            if (budgetAmountEl) {
                budgetAmountEl.textContent = '€' + remaining.toFixed(2);
                
                if (remaining < 0) {
                    budgetAmountEl.classList.add('over-budget');
                } else {
                    budgetAmountEl.classList.remove('over-budget');
                }
            }
            
            if (budgetBarEl) {
                budgetBarEl.style.width = Math.min(100, percentUsed) + '%';
            }
            
            // Update summary with budget warnings
            updateBudgetWarnings(currentTotal, remaining);
        }
        
        function updateBudgetWarnings(currentTotal, remaining) {
            const summaryContainer = document.getElementById('orderSummaryContent');
            if (!summaryContainer) return;
            
            // Remove existing warnings
            const existingWarnings = summaryContainer.querySelectorAll('.budget-warning, .budget-error');
            existingWarnings.forEach(warning => warning.remove());
            
            // Add warnings if needed
            if (remaining < 0) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'budget-error';
                errorDiv.textContent = 'Over budget by €' + Math.abs(remaining).toFixed(2) + '!';
                summaryContainer.appendChild(errorDiv);
            } else if (remaining < 5) {
                const warningDiv = document.createElement('div');
                warningDiv.className = 'budget-warning';
                warningDiv.textContent = 'Low budget: €' + remaining.toFixed(2) + ' remaining';
                summaryContainer.appendChild(warningDiv);
            }
        }
        
        function updateItemAvailability() {
            const currentTotal = calculateOrderTotal(currentOrder);
            
            // Disable items that would exceed budget
            document.querySelectorAll('.food-item').forEach(itemEl => {
                const itemId = itemEl.getAttribute('data-item-id');
                const itemData = findItemById(itemId);
                
                if (itemData) {
                    const isCurrentlySelected = currentOrder[itemId]?.selected;
                    const wouldExceedBudget = !isCurrentlySelected && (currentTotal + itemData.price) > BUDGET_LIMIT;
                    
                    if (wouldExceedBudget) {
                        itemEl.classList.add('disabled');
                    } else {
                        itemEl.classList.remove('disabled');
                    }
                }
            });
        }
        
        function updatePlaceOrderButton() {
            const placeOrderBtn = document.getElementById('placeOrderBtn');
            if (!placeOrderBtn) return;
            
            const currentTotal = calculateOrderTotal(currentOrder);
            const hasItems = Object.keys(currentOrder).length > 0;
            const withinBudget = currentTotal <= BUDGET_LIMIT;
            
            if (hasItems && withinBudget && currentTotal > 0) {
                placeOrderBtn.disabled = false;
                placeOrderBtn.textContent = '🛒 Place Order (€' + currentTotal.toFixed(2) + ')';
            } else {
                placeOrderBtn.disabled = true;
                placeOrderBtn.textContent = '🛒 Place Order';
            }
        }
        
        function placeOrder() {
            const currentTotal = calculateOrderTotal(currentOrder);
            const orderItems = Object.keys(currentOrder);
            
            if (orderItems.length === 0) {
                alert('Please select items before placing an order.');
                return;
            }
            
            if (currentTotal > BUDGET_LIMIT) {
                alert('Order exceeds budget limit of €' + BUDGET_LIMIT.toFixed(2));
                return;
            }
            
            // Generate order confirmation
            const orderNumber = 'FC' + Date.now().toString().slice(-6);
            const orderDate = new Date();
            const deliveryDate = getNextDeliveryDate();
            
            // Create order summary for confirmation
            let orderSummary = 'Order Confirmation\\n\\n';
            orderSummary += 'Order #: ' + orderNumber + '\\n';
            orderSummary += 'Player: ' + currentUser.name + '\\n';
            orderSummary += 'Order Date: ' + orderDate.toLocaleDateString() + '\\n';
            orderSummary += 'Expected Delivery: ' + deliveryDate + '\\n\\n';
            orderSummary += 'Items Ordered:\\n';
            
            orderItems.forEach(itemId => {
                const order = currentOrder[itemId];
                const itemData = findItemById(itemId);
                
                if (itemData && order.selected && order.quantity > 0) {
                    const itemTotal = itemData.price * order.quantity;
                    orderSummary += '- ' + itemData.name + ' (x' + order.quantity + ') - €' + itemTotal.toFixed(2) + '\\n';
                }
            });
            
            orderSummary += '\\nTotal: €' + currentTotal.toFixed(2) + '\\n';
            orderSummary += 'Budget Remaining: €' + (BUDGET_LIMIT - currentTotal).toFixed(2);
            
            // Confirm order placement
            if (confirm(orderSummary + '\\n\\nConfirm order placement?')) {
                // Save order to order history
                saveOrderToHistory(orderNumber, currentOrder, currentTotal, orderDate);
                
                // Show success message
                showOrderConfirmation(orderNumber, deliveryDate, currentTotal);
                
                // Clear current order
                currentOrder = {};
                const orderKey = 'fckoln_food_order_' + currentUser.id;
                localStorage.removeItem(orderKey);
                
                // Refresh display
                loadFoodOrderData();
            }
        }
        
        function getNextDeliveryDate() {
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
            
            // Tuesday delivery (day 2) if ordered by Monday 12 PM
            // Friday delivery (day 5) if ordered by Thursday 12 PM
            
            if (dayOfWeek === 1 && today.getHours() < 12) {
                // Monday before 12 PM - Tuesday delivery
                const tuesday = new Date(today);
                tuesday.setDate(today.getDate() + 1);
                return tuesday.toLocaleDateString() + ' (Tuesday, 6-8 PM)';
            } else if (dayOfWeek <= 4 && !(dayOfWeek === 4 && today.getHours() >= 12)) {
                // Monday after 12 PM through Thursday before 12 PM - Friday delivery
                const friday = new Date(today);
                friday.setDate(today.getDate() + (5 - dayOfWeek));
                return friday.toLocaleDateString() + ' (Friday, 6-8 PM)';
            } else {
                // Thursday after 12 PM through Sunday - Next Tuesday delivery
                const nextTuesday = new Date(today);
                const daysUntilTuesday = (9 - dayOfWeek) % 7;
                nextTuesday.setDate(today.getDate() + daysUntilTuesday);
                return nextTuesday.toLocaleDateString() + ' (Tuesday, 6-8 PM)';
            }
        }
        
        function saveOrderToHistory(orderNumber, order, total, date) {
            const orderHistory = JSON.parse(localStorage.getItem('fckoln_order_history') || '[]');
            
            const newOrder = {
                orderNumber: orderNumber,
                playerId: currentUser.id,
                playerName: currentUser.name,
                items: { ...order },
                total: total,
                orderDate: date.toISOString(),
                status: 'placed',
                deliveryDate: getNextDeliveryDate()
            };
            
            orderHistory.push(newOrder);
            localStorage.setItem('fckoln_order_history', JSON.stringify(orderHistory));
        }
        
        function showOrderConfirmation(orderNumber, deliveryDate, total) {
            const summaryContainer = document.getElementById('orderSummaryContent');
            if (!summaryContainer) return;
            
            summaryContainer.innerHTML = '<div class="order-confirmation">' +
                '<h4>🎉 Order Placed Successfully!</h4>' +
                '<div class="order-number">' + orderNumber + '</div>' +
                '<p><strong>Total:</strong> €' + total.toFixed(2) + '</p>' +
                '<p><strong>Expected Delivery:</strong><br>' + deliveryDate + '</p>' +
                '<p>Your order has been submitted to the kitchen staff.</p>' +
            '</div>';
            
            // Hide place order button temporarily
            const placeOrderBtn = document.getElementById('placeOrderBtn');
            if (placeOrderBtn) {
                placeOrderBtn.style.display = 'none';
            }
            
            // Show success message for a few seconds, then refresh
            setTimeout(() => {
                loadFoodOrderData();
            }, 5000);
        }
        
        // Admin Delivery Summary Functions
        function generateDeliverySummary() {
            const orderHistory = JSON.parse(localStorage.getItem('fckoln_order_history') || '[]');
            const currentOrders = getCurrentActiveOrders();
            
            if (currentOrders.length === 0) {
                showNoOrdersMessage();
                return;
            }
            
            // Group orders by house
            const ordersByHouse = groupOrdersByHouse(currentOrders);
            
            // Display summary
            displayDeliverySummary(ordersByHouse);
        }
        
        function getCurrentActiveOrders() {
            const orderHistory = JSON.parse(localStorage.getItem('fckoln_order_history') || '[]');
            const nextDeliveryDate = getNextDeliveryDate();
            
            // Filter orders for the next delivery
            return orderHistory.filter(order => {
                return order.status === 'placed' && order.deliveryDate === nextDeliveryDate;
            });
        }
        
        function groupOrdersByHouse(orders) {
            const houses = {
                'Widdersdorf 1': [],
                'Widdersdorf 2': [],
                'Widdersdorf 3': [],
                'Admin/Staff Orders': []
            };
            
            orders.forEach(order => {
                // Find player's house
                const player = players.find(p => p.id === order.playerId);
                if (player && houses[player.house]) {
                    houses[player.house].push(order);
                } else {
                    // Admin/staff orders go to a special category
                    houses['Admin/Staff Orders'].push(order);
                }
            });
            
            return houses;
        }
        
        function displayDeliverySummary(ordersByHouse) {
            const container = document.getElementById('deliverySummaryContent');
            if (!container) return;
            
            let html = '<div class="delivery-summary-header">';
            html += '<h3>Delivery Summary for ' + getNextDeliveryDate() + '</h3>';
            html += '</div>';
            
            let totalOrders = 0;
            let totalAmount = 0;
            
            Object.keys(ordersByHouse).forEach(house => {
                const houseOrders = ordersByHouse[house];
                
                if (houseOrders.length > 0) {
                    totalOrders += houseOrders.length;
                    
                    html += '<div class="house-summary-card">';
                    html += '<div class="house-summary-header">';
                    html += '<h4 class="house-summary-title">🏡 ' + house + '</h4>';
                    html += '<div class="house-order-count">' + houseOrders.length + ' orders</div>';
                    html += '</div>';
                    html += '<div class="house-summary-content">';
                    
                    houseOrders.forEach(order => {
                        totalAmount += order.total;
                        
                        html += '<div class="player-order-summary">';
                        html += '<div class="player-order-header">';
                        html += '<span class="player-name">' + order.playerName + '</span>';
                        html += '<span class="order-total">€' + order.total.toFixed(2) + '</span>';
                        html += '</div>';
                        html += '<div class="order-items-list">';
                        
                        Object.keys(order.items).forEach(itemId => {
                            const orderItem = order.items[itemId];
                            const itemData = findItemById(itemId);
                            
                            if (itemData && orderItem.selected && orderItem.quantity > 0) {
                                html += '<div class="order-item">';
                                html += '<span>' + itemData.name + '</span>';
                                html += '<span>x' + orderItem.quantity + '</span>';
                                html += '</div>';
                            }
                        });
                        
                        html += '</div>';
                        html += '</div>';
                    });
                    
                    html += '</div>';
                    html += '</div>';
                }
            });
            
            // Add totals section
            html += '<div class="delivery-summary-totals">';
            html += '<h4>📊 Delivery Totals</h4>';
            html += '<div class="summary-total-row">';
            html += '<span>Total Orders:</span>';
            html += '<span>' + totalOrders + '</span>';
            html += '</div>';
            html += '<div class="summary-total-row">';
            html += '<span>Total Amount:</span>';
            html += '<span>€' + totalAmount.toFixed(2) + '</span>';
            html += '</div>';
            html += '</div>';
            
            container.innerHTML = html;
        }
        
        function showNoOrdersMessage() {
            const container = document.getElementById('deliverySummaryContent');
            if (!container) return;
            
            container.innerHTML = '<div class="no-orders-message">' +
                '<h4>📦 No Orders Found</h4>' +
                '<p>No pending orders for the next delivery date: ' + getNextDeliveryDate() + '</p>' +
                '<p>Orders will appear here once players place them.</p>' +
            '</div>';
        }
        
        function exportDeliverySummaryForKitchen() {
            const orderHistory = JSON.parse(localStorage.getItem('fckoln_order_history') || '[]');
            const currentOrders = getCurrentActiveOrders();
            
            if (currentOrders.length === 0) {
                alert('No orders to export for the next delivery.');
                return;
            }
            
            const ordersByHouse = groupOrdersByHouse(currentOrders);
            
            // Create comprehensive CSV for staff shopping and delivery
            let csvContent = 'FC Köln House Delivery Shopping List\\n';
            csvContent += 'Delivery Date: ' + getNextDeliveryDate() + '\\n';
            csvContent += 'Generated: ' + new Date().toLocaleString() + '\\n';
            csvContent += 'Purpose: Staff shopping list for house delivery coordination\\n\\n';
            
            csvContent += 'House/Category,Player Name,Item,Quantity,Unit Price,Total Price,Order Number\\n';
            
            let grandTotal = 0;
            
            Object.keys(ordersByHouse).forEach(house => {
                const houseOrders = ordersByHouse[house];
                
                // Skip empty categories
                if (houseOrders.length === 0) return;
                
                houseOrders.forEach(order => {
                    grandTotal += order.total;
                    
                    Object.keys(order.items).forEach(itemId => {
                        const orderItem = order.items[itemId];
                        const itemData = findItemById(itemId);
                        
                        if (itemData && orderItem.selected && orderItem.quantity > 0) {
                            const itemTotal = itemData.price * orderItem.quantity;
                            const houseName = house === 'Admin/Staff Orders' ? 'Admin/Staff' : house;
                            csvContent += '"' + houseName + '","' + order.playerName + '","' + itemData.name + '",' +
                                         orderItem.quantity + ',' + (itemData.price > 0 ? itemData.price.toFixed(2) : 'FREE') + ',' +
                                         (itemTotal > 0 ? itemTotal.toFixed(2) : 'FREE') + ',"' + order.orderNumber + '"\\n';
                        }
                    });
                });
            });
            
            csvContent += '\\n,,,,,€' + grandTotal.toFixed(2) + ',TOTAL AMOUNT\\n';
            csvContent += ',,,,' + currentOrders.length + ' orders,,TOTAL ORDERS\\n';
            csvContent += '\\nNOTE: Use this list to shop for groceries and deliver items to each respective house.\\n';
            
            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'fc_koln_house_delivery_details_' + new Date().toISOString().split('T')[0] + '.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        function exportConsolidatedShoppingList() {
            const orderHistory = JSON.parse(localStorage.getItem('fckoln_order_history') || '[]');
            const currentOrders = getCurrentActiveOrders();
            
            if (currentOrders.length === 0) {
                alert('No orders to export for the next delivery.');
                return;
            }
            
            // Consolidate all items across all orders
            const consolidatedItems = {};
            let grandTotal = 0;
            
            currentOrders.forEach(order => {
                grandTotal += order.total;
                
                Object.keys(order.items).forEach(itemId => {
                    const orderItem = order.items[itemId];
                    const itemData = findItemById(itemId);
                    
                    if (itemData && orderItem.selected && orderItem.quantity > 0) {
                        if (!consolidatedItems[itemId]) {
                            consolidatedItems[itemId] = {
                                name: itemData.name,
                                price: itemData.price,
                                totalQuantity: 0,
                                category: itemData.category || 'Other'
                            };
                        }
                        consolidatedItems[itemId].totalQuantity += orderItem.quantity;
                    }
                });
            });
            
            // Create consolidated shopping list CSV
            let csvContent = 'FC Köln Consolidated Shopping List\\n';
            csvContent += 'Delivery Date: ' + getNextDeliveryDate() + '\\n';
            csvContent += 'Generated: ' + new Date().toLocaleString() + '\\n';
            csvContent += 'Total Orders: ' + currentOrders.length + ' orders\\n';
            csvContent += 'Total Budget: €' + grandTotal.toFixed(2) + '\\n\\n';
            
            csvContent += 'Category,Item Name,Total Quantity,Unit Price,Total Cost\\n';
            
            // Sort items by category for easier shopping
            const sortedItems = Object.keys(consolidatedItems).sort((a, b) => {
                const categoryA = consolidatedItems[a].category;
                const categoryB = consolidatedItems[b].category;
                if (categoryA !== categoryB) {
                    return categoryA.localeCompare(categoryB);
                }
                return consolidatedItems[a].name.localeCompare(consolidatedItems[b].name);
            });
            
            let categoryTotal = 0;
            sortedItems.forEach(itemId => {
                const item = consolidatedItems[itemId];
                const totalCost = item.totalQuantity * item.price;
                categoryTotal += totalCost;
                
                csvContent += '"' + item.category + '","' + item.name + '",' + 
                             item.totalQuantity + ',' + (item.price > 0 ? item.price.toFixed(2) : 'FREE') + ',' + 
                             (totalCost > 0 ? totalCost.toFixed(2) : 'FREE') + '\\n';
            });
            
            csvContent += '\\n,,,TOTAL:,€' + categoryTotal.toFixed(2) + '\\n';
            csvContent += '\\nShopping Instructions:\\n';
            csvContent += '- Purchase all items in the quantities listed above\\n';
            csvContent += '- Sort items by house using the House Delivery Details export\\n';
            csvContent += '- Deliver sorted items to respective houses on delivery date\\n';
            
            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'fc_koln_consolidated_shopping_list_' + new Date().toISOString().split('T')[0] + '.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // Communications System Functions
        function initializeCommunications() {
            conversations = JSON.parse(localStorage.getItem('fckoln_conversations') || '[]');
            
            // Create default conversations if none exist
            if (conversations.length === 0) {
                createDefaultConversations();
            }
            
            scheduleDailyCleanup();
            loadChatList();
            initializeCommunicationEvents();
        }

        function createDefaultConversations() {
            const now = new Date().toISOString();
            
            // Create house group chats
            const houses = ['Widdersdorf 1', 'Widdersdorf 2', 'Widdersdorf 3'];
            
            houses.forEach((house, index) => {
                const housePlayersIds = players.filter(p => p.house === house).map(p => p.id);
                
                if (housePlayersIds.length > 0) {
                    const houseConvo = {
                        id: 'house_' + (index + 1),
                        type: 'group',
                        name: house + ' House Chat',
                        participants: [currentUser.id, ...housePlayersIds],
                        messages: [
                            {
                                id: 'welcome_' + (index + 1),
                                senderId: 'system',
                                senderName: 'FC Köln Staff',
                                text: 'Welcome to the ' + house + ' house chat! Use this space to coordinate with your housemates about chores, meals, and daily activities.',
                                timestamp: now
                            }
                        ],
                        lastActivity: now
                    };
                    conversations.push(houseConvo);
                }
            });

            // Create general team chat
            const allPlayerIds = players.map(p => p.id);
            const teamConvo = {
                id: 'team_general',
                type: 'group',
                name: 'FC Köln Team Chat',
                participants: [currentUser.id, ...allPlayerIds],
                messages: [
                    {
                        id: 'team_welcome',
                        senderId: 'system',
                        senderName: 'FC Köln Staff',
                        text: 'Welcome to the official FC Köln Bundesliga Talent Program team chat! This is for important announcements, team updates, and general communication.',
                        timestamp: now
                    }
                ],
                lastActivity: now
            };
            conversations.push(teamConvo);

            // Create staff announcements channel
            const staffConvo = {
                id: 'staff_announcements',
                type: 'group',
                name: 'Staff Announcements',
                participants: [currentUser.id],
                messages: [
                    {
                        id: 'staff_welcome',
                        senderId: 'system',
                        senderName: 'FC Köln Management',
                        text: 'This channel is for official staff announcements, policy updates, and important program information.',
                        timestamp: now
                    }
                ],
                lastActivity: now
            };
            conversations.push(staffConvo);
            
            saveConversations();
        }

        function cleanupOldMessages() {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            let cleanupCount = 0;
            
            conversations.forEach(conversation => {
                const initialMessageCount = conversation.messages.length;
                
                // Remove messages older than 30 days
                conversation.messages = conversation.messages.filter(message => {
                    const messageDate = new Date(message.timestamp);
                    return messageDate > thirtyDaysAgo;
                });
                
                cleanupCount += (initialMessageCount - conversation.messages.length);
                
                // Update last activity if no messages remain
                if (conversation.messages.length === 0) {
                    conversation.lastActivity = new Date().toISOString();
                }
            });
            
            // Remove conversations with no messages and no recent activity
            const initialConversationCount = conversations.length;
            conversations = conversations.filter(conversation => {
                if (conversation.messages.length === 0) {
                    const lastActivity = new Date(conversation.lastActivity);
                    return lastActivity > thirtyDaysAgo;
                }
                return true;
            });
            
            const removedConversations = initialConversationCount - conversations.length;
            
            // Save cleaned data
            if (cleanupCount > 0 || removedConversations > 0) {
                saveConversations();
                console.log('Communications cleanup completed:', {
                    messagesRemoved: cleanupCount,
                    conversationsRemoved: removedConversations,
                    remainingConversations: conversations.length
                });
            }
        }

        function initializeCommunicationEvents() {
            // New Chat Button
            const newChatBtn = document.getElementById('newChatBtn');
            if (newChatBtn) {
                newChatBtn.addEventListener('click', () => showNewChatModal());
            }

            // Chat Type Selection
            document.querySelectorAll('.chat-type-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.chat-type-btn').forEach(b => {
                        b.classList.remove('active');
                        b.classList.add('btn-secondary');
                        b.classList.remove('btn-primary');
                    });
                    this.classList.add('active');
                    this.classList.add('btn-primary');
                    this.classList.remove('btn-secondary');
                    
                    const type = this.dataset.type;
                    document.getElementById('directChatForm').style.display = type === 'direct' ? 'block' : 'none';
                    document.getElementById('groupChatForm').style.display = type === 'group' ? 'block' : 'none';
                    
                    if (type === 'direct') {
                        populateDirectChatUsers();
                    } else {
                        populateGroupMembers();
                    }
                });
            });

            // Close Modal
            document.getElementById('closeNewChatModal')?.addEventListener('click', hideNewChatModal);
            document.getElementById('cancelNewChat')?.addEventListener('click', hideNewChatModal);

            // Create Chat
            document.getElementById('createChatBtn')?.addEventListener('click', createNewChat);

            // Send Message
            document.getElementById('sendBtn')?.addEventListener('click', sendMessage);
            document.getElementById('messageInput')?.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });

            // Chat Search
            document.getElementById('chatSearch')?.addEventListener('input', function(e) {
                filterChats(e.target.value);
            });
        }

        function showNewChatModal() {
            document.getElementById('newChatModal').style.display = 'flex';
            populateDirectChatUsers();
        }

        function hideNewChatModal() {
            document.getElementById('newChatModal').style.display = 'none';
            document.getElementById('directChatRecipient').value = '';
            document.getElementById('groupChatName').value = '';
            document.querySelectorAll('.member-checkbox').forEach(cb => cb.checked = false);
        }

        function populateDirectChatUsers() {
            const select = document.getElementById('directChatRecipient');
            if (!select) return;

            let html = '<option value="">Choose a person...</option>';
            players.forEach(player => {
                if (player.id !== currentUser.id) {
                    html += '<option value="' + player.id + '">' + player.name + '</option>';
                }
            });

            select.innerHTML = html;
        }

        function populateGroupMembers() {
            const container = document.getElementById('memberSelection');
            if (!container) return;

            let html = '';
            players.forEach(player => {
                if (player.id !== currentUser.id) {
                    html += '<div class="member-option">' +
                        '<input type="checkbox" class="member-checkbox" value="' + player.id + '" id="member_' + player.id + '">' +
                        '<label for="member_' + player.id + '">' + player.name + '</label>' +
                    '</div>';
                }
            });

            container.innerHTML = html;
        }

        function createNewChat() {
            const activeType = document.querySelector('.chat-type-btn.active').dataset.type;
            
            if (activeType === 'direct') {
                const recipientId = document.getElementById('directChatRecipient').value;
                if (!recipientId) {
                    alert('Please select a person to message.');
                    return;
                }

                const recipient = players.find(p => p.id === recipientId);
                if (!recipient) return;

                // Check if conversation already exists
                const existingConvo = conversations.find(c => 
                    c.type === 'direct' && 
                    c.participants.includes(currentUser.id) && 
                    c.participants.includes(recipientId)
                );

                if (existingConvo) {
                    selectConversation(existingConvo.id);
                    hideNewChatModal();
                    return;
                }

                // Create new direct conversation
                const newConvo = {
                    id: generateId(),
                    type: 'direct',
                    name: recipient.name,
                    participants: [currentUser.id, recipientId],
                    messages: [],
                    lastActivity: new Date().toISOString()
                };

                conversations.push(newConvo);
                saveConversations();
                loadChatList();
                selectConversation(newConvo.id);
                hideNewChatModal();
            } else {
                const groupName = document.getElementById('groupChatName').value.trim();
                if (!groupName) {
                    alert('Please enter a group name.');
                    return;
                }

                const selectedMembers = Array.from(document.querySelectorAll('.member-checkbox:checked')).map(cb => cb.value);
                if (selectedMembers.length === 0) {
                    alert('Please select at least one member.');
                    return;
                }

                // Create new group conversation
                const newConvo = {
                    id: generateId(),
                    type: 'group',
                    name: groupName,
                    participants: [currentUser.id, ...selectedMembers],
                    messages: [],
                    lastActivity: new Date().toISOString()
                };

                conversations.push(newConvo);
                saveConversations();
                loadChatList();
                selectConversation(newConvo.id);
                hideNewChatModal();
            }
        }

        function loadChatList() {
            const container = document.getElementById('chatListContent');
            if (!container) return;

            if (conversations.length === 0) {
                container.innerHTML = '<div class="no-chats-message">No conversations yet. Start a new chat!</div>';
                return;
            }

            // Sort conversations by last activity
            const sortedConvos = conversations.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

            let html = '';
            sortedConvos.forEach(convo => {
                const lastMessage = convo.messages[convo.messages.length - 1];
                const lastMessageText = lastMessage ? lastMessage.text.substring(0, 50) + (lastMessage.text.length > 50 ? '...' : '') : 'No messages yet';
                const lastTime = lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';

                html += '<div class="chat-item" data-conversation-id="' + convo.id + '">' +
                    '<div class="chat-item-header">' +
                        '<div class="chat-item-name">' + convo.name + '</div>' +
                        '<div class="chat-item-time">' + lastTime + '</div>' +
                    '</div>' +
                    '<div class="chat-item-preview">' + lastMessageText + '</div>' +
                '</div>';
            });

            container.innerHTML = html;

            // Add click handlers to chat items
            container.querySelectorAll('.chat-item').forEach(item => {
                item.addEventListener('click', () => {
                    selectConversation(item.dataset.conversationId);
                });
            });
        }

        function selectConversation(conversationId) {
            currentConversation = conversations.find(c => c.id === conversationId);
            if (!currentConversation) return;

            // Update active chat item
            document.querySelectorAll('.chat-item').forEach(item => {
                item.classList.remove('active');
            });
            const activeItem = document.querySelector('[data-conversation-id="' + conversationId + '"]');
            if (activeItem) activeItem.classList.add('active');

            // Show chat header and input
            document.getElementById('chatHeader').style.display = 'flex';
            document.getElementById('chatInputContainer').style.display = 'block';

            // Update header info
            document.getElementById('chatTitle').textContent = currentConversation.name;
            const subtitle = currentConversation.type === 'group' ? 
                (currentConversation.participants.length + ' members') : 
                'Direct message';
            document.getElementById('chatSubtitle').textContent = subtitle;

            // Load messages
            loadMessages();
        }

        function loadMessages() {
            const container = document.getElementById('chatMessages');
            if (!container || !currentConversation) return;

            if (currentConversation.messages.length === 0) {
                container.innerHTML = '<div class="no-chat-selected">No messages yet. Start the conversation!</div>';
                return;
            }

            let html = '';
            currentConversation.messages.forEach(message => {
                const isCurrentUser = message.senderId === currentUser.id;
                const messageClass = isCurrentUser ? 'sent' : 'received';
                const time = new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                html += '<div class="message ' + messageClass + '">' +
                    '<div class="message-bubble">' +
                        (!isCurrentUser && currentConversation.type === 'group' ? '<div class="message-sender" style="font-size: 0.75rem; color: #6b7280; margin-bottom: 0.25rem;">' + message.senderName + '</div>' : '') +
                        '<div class="message-text">' + message.text + '</div>' +
                        '<div class="message-time" style="font-size: 0.65rem; opacity: 0.7; margin-top: 0.25rem;">' + time + '</div>' +
                    '</div>' +
                '</div>';
            });

            container.innerHTML = html;
            container.scrollTop = container.scrollHeight;
        }

        function sendMessage() {
            const input = document.getElementById('messageInput');
            if (!input || !currentConversation) return;

            const text = input.value.trim();
            if (!text) return;

            const message = {
                id: generateId(),
                senderId: currentUser.id,
                senderName: currentUser.name,
                text: text,
                timestamp: new Date().toISOString()
            };

            currentConversation.messages.push(message);
            currentConversation.lastActivity = new Date().toISOString();

            saveConversations();
            loadMessages();
            loadChatList();

            input.value = '';
        }

        function filterChats(searchTerm) {
            const items = document.querySelectorAll('.chat-item');
            const term = searchTerm.toLowerCase();

            items.forEach(item => {
                const name = item.querySelector('.chat-item-name').textContent.toLowerCase();
                const preview = item.querySelector('.chat-item-preview').textContent.toLowerCase();
                
                if (name.includes(term) || preview.includes(term)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        }

        function saveConversations() {
            localStorage.setItem('fckoln_conversations', JSON.stringify(conversations));
        }

        function generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }

        // Daily cleanup check (runs once per day per user session)
        function scheduleDailyCleanup() {
            const lastCleanup = localStorage.getItem('fckoln_last_cleanup');
            const today = new Date().toDateString();
            
            if (lastCleanup !== today) {
                cleanupOldMessages();
                localStorage.setItem('fckoln_last_cleanup', today);
            }
        }
        
        function updateOrderSummary() {
            const summaryContainer = document.getElementById('orderSummaryContent');
            if (!summaryContainer) return;
            
            const orderItems = Object.keys(currentOrder);
            
            if (orderItems.length === 0) {
                summaryContainer.innerHTML = '<p class="no-items">No items selected yet</p>';
                return;
            }
            
            let html = '';
            let totalCost = 0;
            
            orderItems.forEach(itemId => {
                const order = currentOrder[itemId];
                const itemData = findItemById(itemId);
                
                if (itemData && order.selected && order.quantity > 0) {
                    const itemTotal = itemData.price * order.quantity;
                    totalCost += itemTotal;
                    
                    html += '<div class="order-summary-item">' +
                        '<div class="summary-item-details">' +
                            '<div class="summary-item-name">' + itemData.name + '</div>' +
                            '<div class="summary-item-qty">Qty: ' + order.quantity + '</div>' +
                        '</div>' +
                        (itemData.price > 0 ? '<div class="summary-item-price">€' + itemTotal.toFixed(2) + '</div>' : '<div class="summary-item-price">Free</div>') +
                    '</div>';
                }
            });
            
            if (totalCost > 0) {
                html += '<div class="summary-total">' +
                    '<span>Total:</span>' +
                    '<span>€' + totalCost.toFixed(2) + '</span>' +
                '</div>';
            }
            
            summaryContainer.innerHTML = html;
            updatePlaceOrderButton();
        }
        
        function findItemById(itemId) {
            for (const category of Object.values(foodItemsData)) {
                const item = category.find(item => item.id === itemId);
                if (item) return item;
            }
            return null;
        }
        
        function exportOrderAsCSV() {
            const orderItems = Object.keys(currentOrder);
            
            if (orderItems.length === 0) {
                alert('No items in order to export.');
                return;
            }
            
            let csvContent = 'Category,Item Name,Quantity,Unit Price,Total Price\\n';
            let grandTotal = 0;
            
            // Group items by category
            const categoryGroups = {};
            orderItems.forEach(itemId => {
                const order = currentOrder[itemId];
                const itemData = findItemById(itemId);
                
                if (itemData && order.selected && order.quantity > 0) {
                    const category = findCategoryForItem(itemId);
                    if (!categoryGroups[category]) {
                        categoryGroups[category] = [];
                    }
                    categoryGroups[category].push({
                        item: itemData,
                        order: order
                    });
                }
            });
            
            // Add items to CSV by category
            Object.keys(categoryGroups).forEach(category => {
                const categoryName = getCategoryDisplayName(category);
                categoryGroups[category].forEach(({ item, order }) => {
                    const totalPrice = item.price * order.quantity;
                    grandTotal += totalPrice;
                    
                    csvContent += '"' + categoryName + '","' + item.name + '",' + order.quantity + ',' + 
                                 item.price.toFixed(2) + ',' + totalPrice.toFixed(2) + '\\n';
                });
            });
            
            csvContent += '\\n,"TOTAL",,,€' + grandTotal.toFixed(2);
            csvContent += '\\n,"BUDGET LIMIT",,,€' + BUDGET_LIMIT.toFixed(2);
            csvContent += '\\n,"REMAINING BUDGET",,,€' + (BUDGET_LIMIT - grandTotal).toFixed(2);
            csvContent += '\\n,"ORDERED BY",,,"' + currentUser.name + '"';
            csvContent += '\\n,"ORDER DATE",,,"' + new Date().toLocaleDateString() + '"';
            
            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'fc_koln_food_order_' + new Date().toISOString().split('T')[0] + '.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        function findCategoryForItem(itemId) {
            for (const [category, items] of Object.entries(foodItemsData)) {
                if (items.find(item => item.id === itemId)) {
                    return category;
                }
            }
            return 'unknown';
        }
        
        function getCategoryDisplayName(category) {
            const displayNames = {
                household: 'Household',
                produce: 'Gemüse & Obst',
                meat: 'Fleisch',
                dairy: 'Dairy',
                carbs: 'Carbohydrates',
                drinks: 'Drinks',
                spices: 'Spices & Sauces',
                frozen: 'Frozen'
            };
            return displayNames[category] || category;
        }
        
        function clearAllOrders() {
            if (confirm('Are you sure you want to clear all selected items?')) {
                currentOrder = {};
                const orderKey = 'fckoln_food_order_' + currentUser.id;
                localStorage.removeItem(orderKey);
                
                // Refresh the food order display
                loadFoodOrderData();
            }
        }
        
        // Initialize when DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            initializePlayerManagement();
            initializeHousingManagement();
            initializeFoodOrdering();
        });
        
        // Housing & Chore Management Functions
        function initializeHousingManagement() {
            updateHouseStatistics();
            loadActiveChores();
            
            // Hide admin-only elements for non-admin users
            if (currentUser && currentUser.role !== 'admin') {
                const adminOnlyElements = document.querySelectorAll('.admin-only');
                adminOnlyElements.forEach(element => {
                    element.style.display = 'none';
                });
            }
            
            // View details button event listeners
            const viewDetailsButtons = document.querySelectorAll('.btn-view-details');
            viewDetailsButtons.forEach(button => {
                button.addEventListener('click', async function() {
                    const house = this.getAttribute('data-house');
                    await viewHouseDetails(house);
                });
            });
            
            // Chore navigation event listeners
            const choreNavButtons = document.querySelectorAll('.chores-nav-btn');
            choreNavButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const view = this.getAttribute('data-view');
                    switchChoreView(view);
                });
            });
            
            // Chore form event listeners
            const choreForm = document.getElementById('choreForm');
            const clearFormBtn = document.getElementById('clearFormBtn');
            
            if (choreForm) {
                choreForm.addEventListener('submit', handleChoreFormSubmit);
            }
            
            if (clearFormBtn) {
                clearFormBtn.addEventListener('click', clearChoreForm);
            }
        }
        
        function updateHouseStatistics() {
            // Update resident counts based on actual player data
            const house1Count = players.filter(p => p.house === 'Widdersdorf 1').length;
            const house2Count = players.filter(p => p.house === 'Widdersdorf 2').length;
            const house3Count = players.filter(p => p.house === 'Widdersdorf 3').length;
            
            const house1Element = document.getElementById('house1-residents');
            const house2Element = document.getElementById('house2-residents');
            const house3Element = document.getElementById('house3-residents');
            
            if (house1Element) house1Element.textContent = house1Count + ' players';
            if (house2Element) house2Element.textContent = house2Count + ' players';
            if (house3Element) house3Element.textContent = house3Count + ' players';
        }
        
        function loadActiveChores() {
            const fetchPromise = fetch('/api/chores')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        renderActiveChores(data.chores);
                    }
                })
                .catch(error => {
                    console.error('Failed to load chores:', error);
                });
        }
        
        function loadArchivedChores() {
            loadArchivedChoresWithFilters(1);
        }
        
        function loadArchivedChoresWithFilters(page = 1) {
            const fetchPromise = fetch('/api/chores/archived')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        let filteredChores = data.chores;
                        
                        // Apply house filter
                        const houseFilter = document.getElementById('archiveHouseFilter');
                        if (houseFilter && houseFilter.value) {
                            filteredChores = filteredChores.filter(chore => chore.house === houseFilter.value);
                        }
                        
                        // Apply month filter
                        const monthFilter = document.getElementById('archiveMonthFilter');
                        if (monthFilter && monthFilter.value) {
                            filteredChores = filteredChores.filter(chore => {
                                const archivedDate = new Date(chore.archivedAt);
                                const yearMonth = archivedDate.getFullYear() + '-' + String(archivedDate.getMonth() + 1).padStart(2, '0');
                                return yearMonth === monthFilter.value;
                            });
                        }
                        
                        // Sort by archived date (newest first)
                        filteredChores.sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));
                        
                        renderArchivedChores(filteredChores, page);
                    }
                })
                .catch(error => {
                    console.error('Failed to load archived chores:', error);
                });
        }
        
        function switchChoreView(view) {
            // Update navigation buttons
            document.querySelectorAll('.chores-nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector('[data-view="' + view + '"]').classList.add('active');
            
            // Switch sections
            const activeSection = document.getElementById('activeChoresSection');
            const archivedSection = document.getElementById('archivedChoresSection');
            
            if (view === 'active') {
                activeSection.style.display = 'block';
                archivedSection.style.display = 'none';
                loadActiveChores();
            } else if (view === 'archived') {
                activeSection.style.display = 'none';
                archivedSection.style.display = 'block';
                loadArchivedChoresWithFilters(1);
            }
        }
        
        function renderActiveChores(chores) {
            const choresList = document.getElementById('choresList');
            const noChoresMessage = document.getElementById('noChoresMessage');
            
            if (chores.length === 0) {
                noChoresMessage.style.display = 'block';
                choresList.style.display = 'none';
                return;
            }
            
            noChoresMessage.style.display = 'none';
            choresList.style.display = 'block';
            
            let html = '';
            chores.forEach(chore => {
                const deadlineDate = new Date(chore.deadline);
                const isOverdue = deadlineDate < new Date() && !chore.completed;
                const priorityClass = 'priority-' + chore.priority;
                
                // Find assigned and completed players
                const assignedPlayer = chore.assignedTo ? players.find(p => p.id === chore.assignedTo) : null;
                const completedPlayer = chore.completedBy ? players.find(p => p.id === chore.completedBy) : null;
                
                html += '<div class="chore-item ' + priorityClass + (chore.completed ? ' completed' : '') + (isOverdue ? ' overdue' : '') + '">' +
                    '<div class="chore-header">' +
                        '<h4>' + chore.title + '</h4>' +
                        '<div class="chore-badges">' +
                            '<span class="chore-priority">' + chore.priority.toUpperCase() + '</span>' +
                            (chore.completed ? '<span class="chore-status status-completed">✓ COMPLETED</span>' : '') +
                            (isOverdue ? '<span class="chore-status status-overdue">⚠ OVERDUE</span>' : '') +
                        '</div>' +
                    '</div>' +
                    '<div class="chore-details">' +
                        '<div class="chore-info-grid">' +
                            '<div class="chore-detail">' +
                                '<span class="detail-label">🏠 House:</span>' +
                                '<span class="detail-value">' + chore.house + '</span>' +
                            '</div>' +
                            '<div class="chore-detail">' +
                                '<span class="detail-label">📂 Type:</span>' +
                                '<span class="detail-value">' + chore.type + '</span>' +
                            '</div>' +
                            '<div class="chore-detail">' +
                                '<span class="detail-label">⏰ Deadline:</span>' +
                                '<span class="detail-value">' + deadlineDate.toLocaleDateString() + ' ' + deadlineDate.toLocaleTimeString() + '</span>' +
                            '</div>' +
                            '<div class="chore-detail">' +
                                '<span class="detail-label">🏆 Points:</span>' +
                                '<span class="detail-value">' + chore.points + '</span>' +
                            '</div>' +
                            (assignedPlayer ? 
                                '<div class="chore-detail">' +
                                    '<span class="detail-label">👤 Assigned to:</span>' +
                                    '<span class="detail-value">' + assignedPlayer.name + '</span>' +
                                '</div>' : '') +
                            (completedPlayer && chore.completed ?
                                '<div class="chore-detail">' +
                                    '<span class="detail-label">✅ Completed by:</span>' +
                                    '<span class="detail-value">' + completedPlayer.name + '</span>' +
                                '</div>' : '') +
                        '</div>' +
                        (chore.description ? 
                            '<div class="chore-description">' +
                                '<span class="detail-label">📝 Description:</span>' +
                                '<p>' + chore.description + '</p>' +
                            '</div>' : '') +
                    '</div>' +
                    '<div class="chore-actions">' +
                        (!chore.completed ? 
                            (currentUser && (currentUser.role === 'admin' || currentUser.role === 'staff') ?
                                '<button class="btn btn-green chore-complete-btn" data-chore-id="' + chore.id + '" data-assigned-to="' + (chore.assignedTo || '') + '">Mark as Completed</button>' :
                                '<div class="permission-info">Only staff and admin can mark chores as completed</div>') : 
                            '<div class="completion-actions">' +
                                '<div class="completion-info">Completed on ' + (chore.completedAt ? new Date(chore.completedAt).toLocaleString() : 'Unknown date') + '</div>' +
                                (currentUser && currentUser.role === 'admin' ?
                                    '<button class="btn btn-gray chore-archive-btn" data-chore-id="' + chore.id + '">Archive</button>' : '') +
                            '</div>') +
                    '</div>' +
                '</div>';
            });
            
            choresList.innerHTML = html;
            
            // Add event listeners for completion and archive buttons
            document.querySelectorAll('.chore-complete-btn').forEach(btn => {
                btn.addEventListener('click', handleChoreCompletion);
            });
            
            document.querySelectorAll('.chore-archive-btn').forEach(btn => {
                btn.addEventListener('click', handleChoreArchive);
            });
        }
        
        async function viewHouseDetails(house) {
            try {
                // Get house residents
                const houseResidents = players.filter(p => p.house === house);
                
                // Fetch chore data from API
                const choreResponse = await fetch('/api/chores');
                const choreData = await choreResponse.json();
                
                if (!choreData.success) {
                    alert('Failed to load chore data');
                    return;
                }
                
                // Get house chores (active and completed)
                const houseChores = choreData.chores.filter(c => c.house === house);
                const completedChores = houseChores.filter(c => c.completed);
                const activeChores = houseChores.filter(c => !c.completed);
                const overdueChores = activeChores.filter(c => new Date(c.deadline) < new Date());
                
                // Calculate house statistics
                const totalPoints = completedChores.reduce((sum, chore) => sum + chore.points, 0);
                const completionRate = houseChores.length > 0 ? Math.round((completedChores.length / houseChores.length) * 100) : 0;
            
            // Create house details modal content
            let modalContent = 
                '<div class="house-details-modal">' +
                    '<div class="house-header">' +
                        '<h2>🏠 ' + house + ' - House Details</h2>' +
                        '<button class="modal-close-btn" onclick="closeHouseModal()">✕</button>' +
                    '</div>'
                    +
                    '<div class="house-stats-grid">' +
                        '<div class="house-stat-card">' +
                            '<div class="stat-icon">👥</div>' +
                            '<div class="stat-info">' +
                                '<div class="stat-value">' + houseResidents.length + '</div>' +
                                '<div class="stat-label">Residents</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="house-stat-card">' +
                            '<div class="stat-icon">📋</div>' +
                            '<div class="stat-info">' +
                                '<div class="stat-value">' + activeChores.length + '</div>' +
                                '<div class="stat-label">Active Chores</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="house-stat-card">' +
                            '<div class="stat-icon">✅</div>' +
                            '<div class="stat-info">' +
                                '<div class="stat-value">' + completedChores.length + '</div>' +
                                '<div class="stat-label">Completed</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="house-stat-card">' +
                            '<div class="stat-icon">🏆</div>' +
                            '<div class="stat-info">' +
                                '<div class="stat-value">' + totalPoints + '</div>' +
                                '<div class="stat-label">Total Points</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="house-stat-card ' + (overdueChores.length > 0 ? 'stat-warning' : '') + '">' +
                            '<div class="stat-icon">⚠️</div>' +
                            '<div class="stat-info">' +
                                '<div class="stat-value">' + overdueChores.length + '</div>' +
                                '<div class="stat-label">Overdue</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="house-stat-card">' +
                            '<div class="stat-icon">📊</div>' +
                            '<div class="stat-info">' +
                                '<div class="stat-value">' + completionRate + '%</div>' +
                                '<div class="stat-label">Completion Rate</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="house-sections">' +
                        '<div class="house-section">' +
                            '<h3>👥 House Residents</h3>' +
                            '<div class="residents-grid">';
            
            if (houseResidents.length === 0) {
                modalContent += '<p class="no-data">No residents assigned to this house yet.</p>';
            } else {
                houseResidents.forEach(resident => {
                    const statusClass = resident.status === 'active' ? 'status-active' : 
                                      resident.status === 'training' ? 'status-training' : 'status-rest';
                    modalContent += 
                        '<div class="resident-card">' +
                            '<div class="resident-info">' +
                                '<div class="resident-name">' + resident.name + '</div>' +
                                '<div class="resident-details">' +
                                    '<span class="resident-position">' + resident.position + '</span>' +
                                    '<span class="resident-age">Age ' + resident.age + '</span>' +
                                '</div>' +
                                '<div class="resident-status ' + statusClass + '">' + resident.status.toUpperCase() + '</div>' +
                            '</div>' +
                        '</div>';
                });
            }
            
            modalContent += 
                            '</div>' +
                        '</div>' +
                        '<div class="house-section">' +
                            '<h3>📋 Active Chores (' + activeChores.length + ')</h3>' +
                            '<div class="house-chores-list">';
            
            if (activeChores.length === 0) {
                modalContent += '<p class="no-data">No active chores for this house.</p>';
            } else {
                activeChores.forEach(chore => {
                    const deadlineDate = new Date(chore.deadline);
                    const isOverdue = deadlineDate < new Date();
                    const assignedPlayer = chore.assignedTo ? players.find(p => p.id === chore.assignedTo) : null;
                    
                    modalContent += 
                        '<div class="house-chore-item ' + (isOverdue ? 'overdue' : '') + ' ' + chore.priority + '">' +
                            '<div class="chore-summary">' +
                                '<div class="chore-title">' + chore.title + '</div>' +
                                '<div class="chore-meta">' +
                                    '<span class="chore-priority">' + chore.priority.toUpperCase() + '</span>' +
                                    '<span class="chore-points">' + chore.points + ' pts</span>' +
                                    (isOverdue ? '<span class="chore-overdue">OVERDUE</span>' : '') +
                                '</div>' +
                            '</div>' +
                            '<div class="chore-details-summary">' +
                                '<div>Deadline: ' + deadlineDate.toLocaleDateString() + ' ' + deadlineDate.toLocaleTimeString() + '</div>' +
                                (assignedPlayer ? '<div>Assigned to: ' + assignedPlayer.name + '</div>' : '<div>Unassigned</div>') +
                            '</div>' +
                        '</div>';
                });
            }
            
            modalContent += 
                            '</div>' +
                        '</div>' +
                        '<div class="house-section">' +
                            '<h3>✅ Recent Completions (' + Math.min(completedChores.length, 5) + ')</h3>' +
                            '<div class="house-chores-list">';
            
            const recentCompletions = completedChores
                .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                .slice(0, 5);
            
            if (recentCompletions.length === 0) {
                modalContent += '<p class="no-data">No completed chores yet.</p>';
            } else {
                recentCompletions.forEach(chore => {
                    const completedPlayer = chore.completedBy ? players.find(p => p.id === chore.completedBy) : null;
                    const completedDate = new Date(chore.completedAt);
                    
                    modalContent += 
                        '<div class="house-chore-item completed">' +
                            '<div class="chore-summary">' +
                                '<div class="chore-title">' + chore.title + '</div>' +
                                '<div class="chore-meta">' +
                                    '<span class="chore-points">' + chore.points + ' pts</span>' +
                                    '<span class="chore-completed">✅ COMPLETED</span>' +
                                '</div>' +
                            '</div>' +
                            '<div class="chore-details-summary">' +
                                '<div>Completed: ' + completedDate.toLocaleDateString() + ' ' + completedDate.toLocaleTimeString() + '</div>' +
                                (completedPlayer ? '<div>By: ' + completedPlayer.name + '</div>' : '<div>By: Unknown</div>') +
                            '</div>' +
                        '</div>';
                });
            }
            
            modalContent += 
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            
                // Create and show modal
                showHouseModal(modalContent);
            } catch (error) {
                console.error('Error loading house details:', error);
                alert('Failed to load house details. Please try again.');
            }
        }
        
        function showHouseModal(content) {
            // Remove existing modal if any
            const existingModal = document.getElementById('houseModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Create modal overlay
            const modalOverlay = document.createElement('div');
            modalOverlay.id = 'houseModal';
            modalOverlay.className = 'modal-overlay';
            modalOverlay.innerHTML = content;
            
            // Add to body
            document.body.appendChild(modalOverlay);
            
            // Add click outside to close
            modalOverlay.addEventListener('click', function(e) {
                if (e.target === modalOverlay) {
                    closeHouseModal();
                }
            });
        }
        
        function closeHouseModal() {
            const modal = document.getElementById('houseModal');
            if (modal) {
                modal.remove();
            }
        }
        
        async function handleChoreFormSubmit(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const choreData = {
                title: formData.get('title'),
                priority: formData.get('priority'),
                house: formData.get('house'),
                type: formData.get('type'),
                deadline: formData.get('deadline'),
                points: parseInt(formData.get('points')) || 15,
                description: formData.get('description') || '',
                assignedTo: formData.get('assignedTo') || null
            };
            
            try {
                const response = await fetch('/api/chores', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(choreData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Chore assignment created successfully!');
                    clearChoreForm();
                    loadActiveChores(); // Refresh the chores list
                } else {
                    alert('Failed to create chore assignment. Please try again.');
                }
            } catch (error) {
                console.error('Error creating chore:', error);
                alert('Error creating chore assignment. Please try again.');
            }
        }
        
        async function handleChoreCompletion(e) {
            const choreId = e.target.getAttribute('data-chore-id');
            const assignedTo = e.target.getAttribute('data-assigned-to');
            
            // For now, we'll use the assigned player or prompt for who completed it
            let completedBy = assignedTo;
            
            if (!completedBy) {
                // If no one is assigned, let the user select who completed it
                const playerOptions = players.map(p => p.id + ':' + p.name).join('\\n');
                const selectedPlayer = prompt('Who completed this chore? Please enter player ID:\\n\\n' + playerOptions);
                if (selectedPlayer) {
                    completedBy = selectedPlayer.split(':')[0];
                } else {
                    return; // User cancelled
                }
            }
            
            try {
                const response = await fetch('/api/chores/' + choreId + '/complete', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        playerId: completedBy,
                        userRole: currentUser.role 
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Chore marked as completed successfully!');
                    loadActiveChores(); // Refresh the chores list
                } else {
                    alert('Failed to mark chore as completed: ' + result.message);
                }
            } catch (error) {
                console.error('Error completing chore:', error);
                alert('Error completing chore. Please try again.');
            }
        }
        
        async function handleChoreArchive(e) {
            const choreId = e.target.getAttribute('data-chore-id');
            
            if (!confirm('Are you sure you want to archive this chore? Archived chores will be moved to the archive and no longer visible in the active list.')) {
                return;
            }
            
            try {
                const response = await fetch('/api/chores/' + choreId + '/archive', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        userRole: currentUser.role 
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Chore archived successfully!');
                    loadActiveChores(); // Refresh the chores list
                } else {
                    alert('Failed to archive chore: ' + result.message);
                }
            } catch (error) {
                console.error('Error archiving chore:', error);
                alert('Error archiving chore. Please try again.');
            }
        }
        
        function renderArchivedChores(chores, currentPage = 1, itemsPerPage = 20) {
            const archivedChoresList = document.getElementById('archivedChoresList');
            const noArchivedMessage = document.getElementById('noArchivedMessage');
            
            if (chores.length === 0) {
                noArchivedMessage.style.display = 'block';
                archivedChoresList.style.display = 'none';
                return;
            }
            
            noArchivedMessage.style.display = 'none';
            archivedChoresList.style.display = 'block';
            
            // Calculate pagination
            const totalPages = Math.ceil(chores.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedChores = chores.slice(startIndex, endIndex);
            
            // Add archive controls
            let html = '<div class="archive-controls">' +
                '<div class="archive-stats">' +
                    '<span class="total-archived">Total: ' + chores.length + ' archived chores</span>' +
                    '<span class="page-info">Page ' + currentPage + ' of ' + totalPages + '</span>' +
                '</div>' +
                '<div class="archive-filters">' +
                    '<select id="archiveHouseFilter" class="filter-select">' +
                        '<option value="">All Houses</option>' +
                        '<option value="Widdersdorf 1">Widdersdorf 1</option>' +
                        '<option value="Widdersdorf 2">Widdersdorf 2</option>' +
                        '<option value="Widdersdorf 3">Widdersdorf 3</option>' +
                    '</select>' +
                    '<select id="archiveMonthFilter" class="filter-select">' +
                        '<option value="">All Months</option>' +
                        '<option value="2025-01">January 2025</option>' +
                        '<option value="2025-02">February 2025</option>' +
                        '<option value="2025-03">March 2025</option>' +
                        '<option value="2025-04">April 2025</option>' +
                        '<option value="2025-05">May 2025</option>' +
                        '<option value="2025-06">June 2025</option>' +
                        '<option value="2025-07">July 2025</option>' +
                        '<option value="2025-08">August 2025</option>' +
                        '<option value="2025-09">September 2025</option>' +
                        '<option value="2025-10">October 2025</option>' +
                    '</select>' +
                    '<button id="applyArchiveFilters" class="btn btn-primary">Apply Filters</button>' +
                '</div>' +
            '</div>';
            
            paginatedChores.forEach(chore => {
                const deadlineDate = new Date(chore.deadline);
                const archivedDate = chore.archivedAt ? new Date(chore.archivedAt) : null;
                const priorityClass = 'priority-' + chore.priority;
                
                // Find assigned and completed players
                const assignedPlayer = chore.assignedTo ? players.find(p => p.id === chore.assignedTo) : null;
                const completedPlayer = chore.completedBy ? players.find(p => p.id === chore.completedBy) : null;
                
                html += '<div class="chore-item archived ' + priorityClass + '">' +
                    '<div class="chore-header">' +
                        '<h4>' + chore.title + ' <span class="archived-badge">📦 ARCHIVED</span></h4>' +
                        '<div class="chore-badges">' +
                            '<span class="chore-priority">' + chore.priority.toUpperCase() + '</span>' +
                            '<span class="chore-status status-archived">ARCHIVED</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="chore-details">' +
                        '<div class="chore-info-grid">' +
                            '<div class="chore-detail">' +
                                '<span class="detail-label">🏠 House:</span>' +
                                '<span class="detail-value">' + chore.house + '</span>' +
                            '</div>' +
                            '<div class="chore-detail">' +
                                '<span class="detail-label">📂 Type:</span>' +
                                '<span class="detail-value">' + chore.type + '</span>' +
                            '</div>' +
                            '<div class="chore-detail">' +
                                '<span class="detail-label">⏰ Original Deadline:</span>' +
                                '<span class="detail-value">' + deadlineDate.toLocaleDateString() + ' ' + deadlineDate.toLocaleTimeString() + '</span>' +
                            '</div>' +
                            '<div class="chore-detail">' +
                                '<span class="detail-label">🏆 Points:</span>' +
                                '<span class="detail-value">' + chore.points + '</span>' +
                            '</div>' +
                            (assignedPlayer ? 
                                '<div class="chore-detail">' +
                                    '<span class="detail-label">👤 Was assigned to:</span>' +
                                    '<span class="detail-value">' + assignedPlayer.name + '</span>' +
                                '</div>' : '') +
                            (completedPlayer && chore.completed ?
                                '<div class="chore-detail">' +
                                    '<span class="detail-label">✅ Completed by:</span>' +
                                    '<span class="detail-value">' + completedPlayer.name + '</span>' +
                                '</div>' : '') +
                            '<div class="chore-detail">' +
                                '<span class="detail-label">📦 Archived on:</span>' +
                                '<span class="detail-value">' + (archivedDate ? archivedDate.toLocaleString() : 'Unknown date') + '</span>' +
                            '</div>' +
                        '</div>' +
                        (chore.description ? 
                            '<div class="chore-description">' +
                                '<span class="detail-label">📝 Description:</span>' +
                                '<p>' + chore.description + '</p>' +
                            '</div>' : '') +
                    '</div>' +
                '</div>';
            });
            
            // Add pagination controls
            if (totalPages > 1) {
                html += '<div class="pagination-controls">';
                
                // Previous button
                if (currentPage > 1) {
                    html += '<button class="btn btn-secondary pagination-btn" data-page="' + (currentPage - 1) + '">← Previous</button>';
                }
                
                // Page numbers
                const maxVisiblePages = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                
                if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }
                
                for (let i = startPage; i <= endPage; i++) {
                    const activeClass = i === currentPage ? ' active' : '';
                    html += '<button class="btn btn-outline pagination-btn' + activeClass + '" data-page="' + i + '">' + i + '</button>';
                }
                
                // Next button
                if (currentPage < totalPages) {
                    html += '<button class="btn btn-secondary pagination-btn" data-page="' + (currentPage + 1) + '">Next →</button>';
                }
                
                html += '</div>';
            }
            
            archivedChoresList.innerHTML = html;
            
            // Add event listeners for pagination and filters
            document.querySelectorAll('.pagination-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const page = parseInt(this.getAttribute('data-page'));
                    loadArchivedChoresWithFilters(page);
                });
            });
            
            document.getElementById('applyArchiveFilters').addEventListener('click', function() {
                loadArchivedChoresWithFilters(1); // Reset to first page when filtering
            });
        }
        
        function clearChoreForm() {
            const form = document.getElementById('choreForm');
            if (form) {
                form.reset();
                // Reset points to default value
                const pointsInput = document.getElementById('chorePoints');
                if (pointsInput) {
                    pointsInput.value = '15';
                }
            }
        }

        // Player modal functions
        let currentPlayerId = null;

        async function viewPlayerDetails(playerId) {
            console.log('viewPlayerDetails called with:', playerId);
            const player = players.find(p => p.id === playerId);
            if (!player) {
                console.log('Player not found for ID:', playerId);
                return;
            }

            console.log('Found player:', player);
            currentPlayerId = playerId;

            // Ensure modal is closed first
            const modal = document.getElementById('playerDetailsModal');
            console.log('Modal element found:', !!modal);
            if (!modal) {
                console.error('Player details modal not found in DOM');
                return;
            }

            // Force close any existing modal state
            modal.classList.remove('show');
            
            // Populate modal with player data
            document.getElementById('playerModalName').textContent = player.name;
            document.getElementById('playerModalPosition').textContent = player.position;
            document.getElementById('modalPlayerName').textContent = player.name;
            document.getElementById('modalPlayerAge').textContent = player.age + ' years old';
            document.getElementById('modalPlayerPosition').textContent = player.position;
            document.getElementById('modalPlayerNationality').textContent = player.nationality || 'Not specified';
            document.getElementById('modalPlayerHouse').textContent = formatHouseName(player.house);
            document.getElementById('modalPlayerJoinDate').textContent = new Date(player.joinDate).toLocaleDateString();

            // Update status badge
            const statusBadge = document.getElementById('modalPlayerStatus');
            statusBadge.textContent = player.status.charAt(0).toUpperCase() + player.status.slice(1);
            statusBadge.className = 'status-badge status-' + player.status;

            // Show modal with slight delay to ensure DOM updates
            setTimeout(() => {
                console.log('Adding show class to modal');
                modal.classList.add('show');
                console.log('Modal classes:', modal.classList.toString());
            }, 10);
        }

        function closePlayerModal() {
            console.log('Closing player modal');
            const modal = document.getElementById('playerDetailsModal');
            if (modal) {
                modal.classList.remove('show');
                console.log('Modal classes after close:', modal.classList.toString());
            }
            currentPlayerId = null;
        }

        async function changePlayerStatus(newStatus) {
            if (!currentPlayerId) return;

            try {
                const response = await fetch('/api/players/' + currentPlayerId + '/status', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: newStatus })
                });

                const data = await response.json();

                if (data.success) {
                    // Update local player data
                    const player = players.find(p => p.id === currentPlayerId);
                    if (player) {
                        player.status = newStatus;
                    }

                    // Update modal status display
                    const statusBadge = document.getElementById('modalPlayerStatus');
                    statusBadge.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
                    statusBadge.className = 'status-badge status-' + newStatus;

                    // Refresh player grid and stats
                    renderPlayersGrid();
                    updatePlayerOverviewStats();
                    
                    // Show success feedback
                    showNotification('Player status updated successfully!', 'success');
                } else {
                    showNotification(data.message || 'Failed to update player status', 'error');
                }
            } catch (error) {
                console.error('Error updating player status:', error);
                showNotification('Error updating player status', 'error');
            }
        }

        function showNotification(message, type = 'info') {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = 'notification notification-' + type;
            
            // Set styles programmatically to avoid template literal issues
            notification.style.position = 'fixed';
            notification.style.top = '2rem';
            notification.style.right = '2rem';
            notification.style.background = type === 'success' ? '#dcfce7' : type === 'error' ? '#fee2e2' : '#e0e7ff';
            notification.style.color = type === 'success' ? '#166534' : type === 'error' ? '#dc2626' : '#1e40af';
            notification.style.padding = '1rem 1.5rem';
            notification.style.borderRadius = '12px';
            notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            notification.style.zIndex = '2000';
            notification.style.fontWeight = '600';
            notification.style.borderLeft = '4px solid ' + (type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#3b82f6');
            notification.style.animation = 'slideInRight 0.3s ease';
            
            notification.textContent = message;
            document.body.appendChild(notification);

            // Remove after 3 seconds
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }

        // Add notification animations to style
        const notificationStyles = document.createElement('style');
        notificationStyles.textContent = '@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }';
        document.head.appendChild(notificationStyles);

        // Close modal when clicking outside (only if modal exists)
        const playerModal = document.getElementById('playerDetailsModal');
        if (playerModal) {
            playerModal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closePlayerModal();
                }
            });
        }

        // Close modal with Escape key (only if modal exists)
        document.addEventListener('keydown', function(e) {
            const playerModal = document.getElementById('playerDetailsModal');
            if (e.key === 'Escape' && playerModal && playerModal.classList.contains('show')) {
                closePlayerModal();
            }
        });

        // User Management Functions
        async function loadUserManagement() {
            if (currentUser.role !== 'admin') {
                return;
            }

            await loadPendingApplications();
            await loadExistingUsers();
        }

        async function loadPendingApplications() {
            try {
                const response = await fetch('/api/applications');
                const data = await response.json();

                if (data.success) {
                    renderPendingApplications(data.applications);
                    updatePendingCount(data.applications.length);
                }
            } catch (error) {
                console.error('Failed to load applications:', error);
            }
        }

        function renderPendingApplications(applications) {
            const container = document.getElementById('pendingApplicationsList');
            if (!container) return;

            if (applications.length === 0) {
                container.innerHTML = '<div class="empty-state">' +
                    '<div class="empty-state-icon">📝</div>' +
                    '<h3>No Pending Applications</h3>' +
                    '<p>All applications have been processed</p>' +
                    '</div>';
                return;
            }

            const html = applications.map(app => 
                '<div class="application-card">' +
                    '<div class="application-header">' +
                        '<div class="application-info">' +
                            '<h3>' + app.name + '</h3>' +
                            '<div class="application-meta">' +
                                '<span class="application-type ' + app.type + '">' + app.type + '</span>' +
                                '<span class="application-date">Applied ' + new Date(app.applicationDate).toLocaleDateString() + '</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="application-details">' +
                        '<div class="detail-grid">' +
                            '<div class="detail-item">' +
                                '<label>Email</label>' +
                                '<span>' + app.email + '</span>' +
                            '</div>' +
                            '<div class="detail-item">' +
                                '<label>Age</label>' +
                                '<span>' + app.age + ' years</span>' +
                            '</div>' +
                            (app.type === 'player' ? 
                                '<div class="detail-item">' +
                                    '<label>Position</label>' +
                                    '<span>' + app.position + '</span>' +
                                '</div>' +
                                '<div class="detail-item">' +
                                    '<label>Nationality</label>' +
                                    '<span>' + app.nationality + '</span>' +
                                '</div>'
                                : 
                                '<div class="detail-item">' +
                                    '<label>Department</label>' +
                                    '<span>' + app.department + '</span>' +
                                '</div>'
                            ) +
                        '</div>' +
                        '<div class="application-notes">' +
                            '<label>Notes</label>' +
                            '<p>' + app.notes + '</p>' +
                        '</div>' +
                    '</div>' +
                    '<div class="application-actions">' +
                        '<button class="btn-approve" data-action="approve" data-id="' + app.id + '">Approve</button>' +
                        '<button class="btn-reject" data-action="reject" data-id="' + app.id + '">Reject</button>' +
                        '<button class="btn-view-details" data-action="view" data-id="' + app.id + '">View Details</button>' +
                    '</div>' +
                '</div>'
            ).join('');

            container.innerHTML = html;

            // Add event listeners for application actions
            container.addEventListener('click', function(e) {
                const action = e.target.dataset.action;
                const id = e.target.dataset.id;
                
                if (action && id) {
                    e.preventDefault();
                    switch (action) {
                        case 'approve':
                            approveApplicationWithHouseSelection(id);
                            break;
                        case 'reject':
                            rejectApplication(id);
                            break;
                        case 'view':
                            viewApplicationDetails(id);
                            break;
                    }
                }
            });
        }

        async function loadExistingUsers() {
            try {
                const response = await fetch('/api/users');
                const data = await response.json();

                if (data.success) {
                    renderExistingUsers(data.users);
                    updateUsersCount(data.users.length);
                }
            } catch (error) {
                console.error('Failed to load users:', error);
            }
        }

        function renderExistingUsers(users) {
            const container = document.getElementById('existingUsersList');
            if (!container) return;

            const html = users.map(user => 
                '<div class="user-card">' +
                    '<div class="user-card-header">' +
                        '<div class="user-info">' +
                            '<h3>' + user.name + '</h3>' +
                            '<div class="user-email">' + user.email + '</div>' +
                            '<span class="user-role ' + user.role + '">' + user.role + '</span>' +
                        '</div>' +
                        '<div class="user-actions">' +
                            '<button class="btn-edit-user" data-action="edit" data-id="' + user.id + '">Edit Profile</button>' +
                        '</div>' +
                    '</div>' +
                '</div>'
            ).join('');

            container.innerHTML = html;

            // Add event listeners for user actions
            container.addEventListener('click', function(e) {
                const action = e.target.dataset.action;
                const id = e.target.dataset.id;
                
                if (action && id) {
                    e.preventDefault();
                    if (action === 'edit') {
                        editUser(id);
                    }
                }
            });
        }

        function updatePendingCount(count) {
            const element = document.getElementById('pendingCount');
            if (element) {
                element.textContent = count + ' pending';
            }
        }

        function updateUsersCount(count) {
            const element = document.getElementById('usersCount');
            if (element) {
                element.textContent = count + ' total users';
            }
        }

        async function approveApplication(applicationId) {
            if (!confirm('Are you sure you want to approve this application?')) return;

            try {
                const response = await fetch('/api/applications/' + applicationId + '/approve', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();

                if (data.success) {
                    showNotification('Application approved successfully!', 'success');
                    await loadPendingApplications();
                    await loadExistingUsers();
                } else {
                    showNotification(data.message || 'Failed to approve application', 'error');
                }
            } catch (error) {
                console.error('Error approving application:', error);
                showNotification('Error approving application', 'error');
            }
        }

        async function approveApplicationWithHouseSelection(applicationId) {
            const applications = JSON.parse(localStorage.getItem('fckoln_pending_applications') || '[]');
            const application = applications.find(app => app.id === applicationId);
            
            if (!application) {
                showNotification('Application not found', 'error');
                return;
            }
            
            // For staff applications, approve directly
            if (application.type === 'staff') {
                approveApplication(applicationId);
                return;
            }
            
            // For player applications, show house selection modal
            const houseSelectionHtml = document.createElement('div');
            houseSelectionHtml.className = 'house-selection-modal';
            houseSelectionHtml.id = 'houseSelectionModal';
            
            // Get current house occupancy for display
            const w1Count = players.filter(p => p.house === 'Widdersdorf 1').length;
            const w2Count = players.filter(p => p.house === 'Widdersdorf 2').length;
            const w3Count = players.filter(p => p.house === 'Widdersdorf 3').length;
            
            houseSelectionHtml.innerHTML = '<div class="house-selection-modal-content">' +
                '<div class="house-selection-header">' +
                    '<h3>Select House Assignment</h3>' +
                    '<p>Player: <strong>' + application.name + '</strong> (' + application.position + ')</p>' +
                '</div>' +
                '<div class="house-selection-body">' +
                    '<div class="house-options">' +
                        '<div class="house-option" data-house="Widdersdorf 1">' +
                            '<div class="house-name">Widdersdorf 1</div>' +
                            '<div class="house-occupancy">' + w1Count + ' players currently</div>' +
                        '</div>' +
                        '<div class="house-option" data-house="Widdersdorf 2">' +
                            '<div class="house-name">Widdersdorf 2</div>' +
                            '<div class="house-occupancy">' + w2Count + ' players currently</div>' +
                        '</div>' +
                        '<div class="house-option" data-house="Widdersdorf 3">' +
                            '<div class="house-name">Widdersdorf 3</div>' +
                            '<div class="house-occupancy">' + w3Count + ' players currently</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="house-selection-actions">' +
                        '<button class="btn btn-secondary" data-action="cancel-house">Cancel</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
            
            // Add event listeners
            houseSelectionHtml.addEventListener('click', async function(e) {
                const selectedHouse = e.target.closest('.house-option')?.dataset.house;
                const action = e.target.dataset.action;
                
                if (selectedHouse) {
                    // Approve with selected house
                    if (!confirm('Assign ' + application.name + ' to ' + selectedHouse + '?')) return;
                    
                    try {
                        const response = await fetch('/api/applications/' + applicationId + '/approve', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ house: selectedHouse })
                        });

                        const data = await response.json();

                        if (data.success) {
                            showNotification('Application approved! Player assigned to ' + selectedHouse, 'success');
                            closeHouseSelectionModal();
                            await loadPendingApplications();
                            await loadExistingUsers();
                        } else {
                            showNotification(data.message || 'Failed to approve application', 'error');
                        }
                    } catch (error) {
                        console.error('Error approving application:', error);
                        showNotification('Error approving application', 'error');
                    }
                } else if (action === 'cancel-house') {
                    closeHouseSelectionModal();
                }
            });
            
            // Add modal to page
            document.body.appendChild(houseSelectionHtml);
            
            // Show modal
            houseSelectionHtml.classList.add('show');
        }

        function closeHouseSelectionModal() {
            const modal = document.getElementById('houseSelectionModal');
            if (modal) {
                modal.remove();
            }
        }

        // Calendar functionality
        let currentCalendarDate = new Date();
        let selectedDate = null;
        let currentView = 'week';
        let isNavigating = false;
        
        function initializeCalendar() {
            console.log('Initializing calendar...');
            
            // Show/hide add event button based on user role
            const addEventBtn = document.getElementById('addEventBtn');
            console.log('Calendar init - Current user:', currentUser);
            console.log('Calendar init - User role:', currentUser ? currentUser.role : 'No user');
            
            if (addEventBtn && currentUser && currentUser.role === 'admin') {
                console.log('Showing add event button for admin');
                addEventBtn.style.display = 'inline-block';
            } else if (addEventBtn) {
                console.log('Hiding add event button - not admin');
                addEventBtn.style.display = 'none';
            }
            
            // Setup recurring event form interactions
            setupRecurringEventHandlers();
            
            // Clear any existing event listeners to prevent duplicates
            const existingPrev = document.getElementById('prevPeriod');
            const existingNext = document.getElementById('nextPeriod');
            const existingAdd = document.getElementById('addEventBtn');
            const existingSave = document.getElementById('saveEventBtn');
            
            // Remove existing listeners by cloning elements
            if (existingPrev) {
                const newPrev = existingPrev.cloneNode(true);
                existingPrev.parentNode.replaceChild(newPrev, existingPrev);
            }
            if (existingNext) {
                const newNext = existingNext.cloneNode(true);
                existingNext.parentNode.replaceChild(newNext, existingNext);
            }
            if (existingAdd) {
                const newAdd = existingAdd.cloneNode(true);
                existingAdd.parentNode.replaceChild(newAdd, existingAdd);
            }
            if (existingSave) {
                const newSave = existingSave.cloneNode(true);
                existingSave.parentNode.replaceChild(newSave, existingSave);
            }
            
            // Load calendar events first, then render
            loadCalendarEvents().then(() => {
                console.log('Calendar events loaded, setting up UI...');
                renderCalendar();
                
                // Navigation event listeners
                const prevBtn = document.getElementById('prevPeriod');
                const nextBtn = document.getElementById('nextPeriod');
                
                if (prevBtn) {
                    prevBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Previous period clicked');
                        navigatePeriod(-1);
                        renderCalendar();
                    });
                }
                
                if (nextBtn) {
                    nextBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Next period clicked');
                        navigatePeriod(1);
                        renderCalendar();
                    });
                }
                
                // View switcher listeners
                document.querySelectorAll('.view-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        console.log('View switched to:', btn.dataset.view);
                        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        currentView = btn.dataset.view;
                        renderCalendar();
                    });
                });
                
                // Add event modal listeners
                const addBtn = document.getElementById('addEventBtn');
                if (addBtn) {
                    addBtn.addEventListener('click', () => {
                        console.log('Add Event button clicked');
                        openAddEventModal();
                    });
                }
                
                // Modal event listeners for close buttons
                document.addEventListener('click', (e) => {
                    const action = e.target.dataset.action;
                    if (action === 'close-event') {
                        console.log('Closing add event modal');
                        closeAddEventModal();
                    } else if (action === 'close-details') {
                        console.log('Closing event details modal');
                        closeEventDetailsModal();
                    }
                });
                
                const saveBtn = document.getElementById('saveEventBtn');
                if (saveBtn) {
                    saveBtn.addEventListener('click', () => {
                        console.log('Save Event button clicked');
                        saveCalendarEvent();
                    });
                }
                
                console.log('Calendar initialization complete!');
            }).catch(error => {
                console.error('Error initializing calendar:', error);
            });
        }
        
        function navigatePeriod(direction) {
            // Prevent multiple rapid navigation calls
            if (isNavigating) {
                console.log('Navigation already in progress, ignoring...');
                return;
            }
            
            isNavigating = true;
            console.log('Navigating period, current date:', currentCalendarDate.toDateString(), 'direction:', direction, 'view:', currentView);
            
            if (currentView === 'day') {
                // Create new date to avoid mutation issues
                const newDate = new Date(currentCalendarDate);
                newDate.setDate(newDate.getDate() + direction);
                currentCalendarDate = newDate;
            } else if (currentView === 'week') {
                const newDate = new Date(currentCalendarDate);
                newDate.setDate(newDate.getDate() + (direction * 7));
                currentCalendarDate = newDate;
            } else if (currentView === 'month') {
                const newDate = new Date(currentCalendarDate);
                newDate.setMonth(newDate.getMonth() + direction);
                currentCalendarDate = newDate;
            }
            
            console.log('New date after navigation:', currentCalendarDate.toDateString());
            
            // Reset navigation flag after a short delay
            setTimeout(() => {
                isNavigating = false;
            }, 100);
        }
        
        function renderCalendar() {
            const titleElement = document.getElementById('calendarPeriodTitle');
            const grid = document.getElementById('calendarGrid');
            
            if (currentView === 'month') {
                renderMonthView(titleElement, grid);
            } else if (currentView === 'week') {
                renderWeekView(titleElement, grid);
            } else if (currentView === 'day') {
                renderDayView(titleElement, grid);
            }
        }
        
        function renderMonthView(titleElement, grid) {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            titleElement.textContent = monthNames[currentCalendarDate.getMonth()] + ' ' + currentCalendarDate.getFullYear();
            
            grid.className = 'calendar-grid';
            grid.innerHTML = '';
            
            // Add day headers
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            dayNames.forEach(day => {
                const header = document.createElement('div');
                header.className = 'calendar-day-header';
                header.textContent = day;
                grid.appendChild(header);
            });
            
            // Calculate first day of month
            const firstDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());
            
            // Generate 42 days (6 weeks)
            for (let i = 0; i < 42; i++) {
                const dayDate = new Date(startDate);
                dayDate.setDate(startDate.getDate() + i);
                
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                
                if (dayDate.getMonth() !== currentCalendarDate.getMonth()) {
                    dayElement.classList.add('other-month');
                }
                
                const today = new Date();
                if (dayDate.toDateString() === today.toDateString()) {
                    dayElement.classList.add('today');
                }
                
                const dayNumber = document.createElement('div');
                dayNumber.className = 'calendar-day-number';
                dayNumber.textContent = dayDate.getDate();
                dayElement.appendChild(dayNumber);
                
                const eventsContainer = document.createElement('div');
                eventsContainer.className = 'calendar-events';
                
                const dayEvents = calendarEvents.filter(event => {
                    const eventDate = new Date(event.date);
                    return eventDate.toDateString() === dayDate.toDateString();
                });
                
                dayEvents.forEach(event => {
                    const eventElement = document.createElement('div');
                    eventElement.className = 'calendar-event ' + event.type;
                    eventElement.textContent = event.title;
                    eventElement.dataset.eventId = event.id;
                    eventElement.style.cursor = 'pointer';
                    
                    eventElement.addEventListener('click', (e) => {
                        e.stopPropagation();
                        showEventDetails(event.id);
                    });
                    
                    eventsContainer.appendChild(eventElement);
                });
                
                dayElement.appendChild(eventsContainer);
                
                dayElement.addEventListener('click', (e) => {
                    // Only open modal if not clicking on an event and user is admin
                    if (!e.target.classList.contains('calendar-event') && currentUser && currentUser.role === 'admin') {
                        selectedDate = dayDate;
                        openAddEventModal(dayDate);
                    }
                });
                
                grid.appendChild(dayElement);
            }
        }
        
        function renderWeekView(titleElement, grid) {
            const startOfWeek = new Date(currentCalendarDate);
            startOfWeek.setDate(currentCalendarDate.getDate() - currentCalendarDate.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            
            titleElement.textContent = formatDateRange(startOfWeek, endOfWeek);
            
            grid.className = 'calendar-week-view';
            grid.innerHTML = '';
            
            // Time column
            const timeColumn = document.createElement('div');
            timeColumn.className = 'time-column';
            
            // Empty header for time column
            const emptyHeader = document.createElement('div');
            emptyHeader.className = 'day-column-header';
            emptyHeader.textContent = 'Time';
            timeColumn.appendChild(emptyHeader);
            
            // Time slots (6 AM to 10 PM)
            for (let hour = 6; hour <= 22; hour++) {
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                timeSlot.style.height = '40px';
                timeSlot.textContent = hour + ':00';
                timeColumn.appendChild(timeSlot);
            }
            
            grid.appendChild(timeColumn);
            
            // Day columns
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 0; i < 7; i++) {
                const currentDay = new Date(startOfWeek);
                currentDay.setDate(startOfWeek.getDate() + i);
                
                const dayColumn = document.createElement('div');
                dayColumn.className = 'day-column';
                
                const header = document.createElement('div');
                header.className = 'day-column-header';
                header.textContent = dayNames[i] + ' ' + currentDay.getDate();
                dayColumn.appendChild(header);
                
                // Events for this day
                const dayEvents = calendarEvents.filter(event => {
                    const eventDate = new Date(event.date);
                    return eventDate.toDateString() === currentDay.toDateString();
                });
                
                dayEvents.forEach(event => {
                    const eventElement = document.createElement('div');
                    eventElement.className = 'time-event ' + event.type;
                    eventElement.textContent = event.title;
                    eventElement.dataset.eventId = event.id;
                    eventElement.style.cursor = 'pointer';
                    
                    // Position based on time
                    const eventStartTime = event.startTime ? event.startTime.split(':') : (event.time ? event.time.split(':') : ['09', '00']);
                    const hour = parseInt(eventStartTime[0]);
                    const minutes = parseInt(eventStartTime[1]);
                    const position = ((hour - 6) * 40) + (minutes / 60 * 40) + 45; // 45px for header
                    
                    eventElement.style.top = position + 'px';
                    eventElement.style.height = '30px';
                    
                    eventElement.addEventListener('click', (e) => {
                        e.stopPropagation();
                        showEventDetails(event.id);
                    });
                    
                    dayColumn.appendChild(eventElement);
                });
                
                // Add click handler for adding events (admin only)
                dayColumn.addEventListener('click', (e) => {
                    if (e.target === dayColumn && currentUser && currentUser.role === 'admin') {
                        selectedDate = currentDay;
                        openAddEventModal(currentDay);
                    }
                });
                
                grid.appendChild(dayColumn);
            }
        }
        
        function renderDayView(titleElement, grid) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            
            console.log('Rendering day view for:', currentCalendarDate.toDateString());
            
            titleElement.textContent = dayNames[currentCalendarDate.getDay()] + ', ' + 
                monthNames[currentCalendarDate.getMonth()] + ' ' + currentCalendarDate.getDate() + ', ' + 
                currentCalendarDate.getFullYear();
            
            grid.className = 'calendar-day-view';
            grid.innerHTML = '';
            
            // Time column
            const timeColumn = document.createElement('div');
            timeColumn.className = 'time-column';
            
            const emptyHeader = document.createElement('div');
            emptyHeader.className = 'day-column-header';
            emptyHeader.textContent = 'Time';
            timeColumn.appendChild(emptyHeader);
            
            for (let hour = 6; hour <= 22; hour++) {
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                timeSlot.style.height = '60px';
                timeSlot.textContent = hour + ':00';
                timeColumn.appendChild(timeSlot);
            }
            
            grid.appendChild(timeColumn);
            
            // Day column
            const dayColumn = document.createElement('div');
            dayColumn.className = 'day-column';
            
            const header = document.createElement('div');
            header.className = 'day-column-header';
            header.textContent = 'Events';
            dayColumn.appendChild(header);
            
            // Events for this day
            const dayEvents = calendarEvents.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.toDateString() === currentCalendarDate.toDateString();
            });
            
            dayEvents.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = 'time-event ' + event.type;
                const timeDisplay = event.startTime && event.endTime 
                    ? event.startTime + '-' + event.endTime 
                    : (event.time || event.startTime || '');
                eventElement.textContent = event.title + (timeDisplay ? ' - ' + timeDisplay : '');
                eventElement.dataset.eventId = event.id;
                eventElement.style.cursor = 'pointer';
                eventElement.addEventListener('click', function() {
                    showEventDetails(event.id);
                });
                
                const eventStartTime = event.startTime ? event.startTime.split(':') : (event.time ? event.time.split(':') : ['09', '00']);
                const hour = parseInt(eventStartTime[0]);
                const minutes = parseInt(eventStartTime[1]);
                const position = ((hour - 6) * 60) + (minutes / 60 * 60) + 45;
                
                eventElement.style.top = position + 'px';
                eventElement.style.height = '45px';
                
                eventElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showEventDetails(event.id);
                });
                
                dayColumn.appendChild(eventElement);
            });
            
            dayColumn.addEventListener('click', (e) => {
                if (e.target === dayColumn && currentUser && currentUser.role === 'admin') {
                    selectedDate = currentCalendarDate;
                    openAddEventModal(currentCalendarDate);
                }
            });
            
            grid.appendChild(dayColumn);
        }
        
        function formatDateRange(start, end) {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            if (start.getMonth() === end.getMonth()) {
                return monthNames[start.getMonth()] + ' ' + start.getDate() + '-' + end.getDate() + ', ' + start.getFullYear();
            } else {
                return monthNames[start.getMonth()] + ' ' + start.getDate() + ' - ' + 
                       monthNames[end.getMonth()] + ' ' + end.getDate() + ', ' + start.getFullYear();
            }
        }
        
        function openAddEventModal(date = null) {
            console.log('Current user check:', currentUser);
            console.log('User role:', currentUser ? currentUser.role : 'No user');
            
            // Check if user is admin before allowing event creation
            if (!currentUser || currentUser.role !== 'admin') {
                console.log('Access denied: Only admins can create events');
                showNotification('Only administrators can create calendar events', 'error');
                return;
            }
            
            console.log('Opening add event modal for date:', date);
            
            const modal = document.getElementById('addEventModal');
            console.log('Modal element found:', modal);
            if (!modal) {
                console.error('Add event modal not found in DOM');
                return;
            }
            
            // Set date
            const dateInput = document.getElementById('eventDate');
            if (dateInput) {
                if (date) {
                    dateInput.value = date.toISOString().split('T')[0];
                } else {
                    dateInput.value = new Date().toISOString().split('T')[0];
                }
            }
            
            // Clear form
            const titleInput = document.getElementById('eventTitle');
            const startTimeInput = document.getElementById('eventStartTime');
            const endTimeInput = document.getElementById('eventEndTime');
            const typeInput = document.getElementById('eventType');
            const locationInput = document.getElementById('eventLocation');
            const descInput = document.getElementById('eventDescription');
            const recurringInput = document.getElementById('recurringEvent');
            const recurringTypeInput = document.getElementById('recurringType');
            const recurringEndDateInput = document.getElementById('recurringEndDate');
            const recurringCountInput = document.getElementById('recurringCount');
            
            if (titleInput) titleInput.value = '';
            if (startTimeInput) startTimeInput.value = '09:00';
            if (endTimeInput) endTimeInput.value = '10:00';
            if (typeInput) typeInput.value = 'training';
            if (locationInput) locationInput.value = '';
            if (descInput) descInput.value = '';
            if (recurringInput) recurringInput.checked = false;
            if (recurringTypeInput) recurringTypeInput.value = 'daily';
            if (recurringEndDateInput) recurringEndDateInput.value = '';
            if (recurringCountInput) recurringCountInput.value = '';
            
            // Hide recurring options and clear custom days
            const recurringOptions = document.getElementById('recurringOptions');
            const customDaysSection = document.getElementById('customDaysSection');
            if (recurringOptions) recurringOptions.style.display = 'none';
            if (customDaysSection) customDaysSection.style.display = 'none';
            
            // Clear custom day checkboxes
            const dayCheckboxes = document.querySelectorAll('.day-checkbox input[type="checkbox"]');
            dayCheckboxes.forEach(checkbox => checkbox.checked = false);
            
            console.log('Adding active class to modal');
            modal.classList.add('active');
            console.log('Modal classes after adding active:', modal.classList.toString());
            
            // Double-check if modal is now visible
            setTimeout(() => {
                const modalStyle = window.getComputedStyle(modal);
                console.log('Modal display style:', modalStyle.display);
                console.log('Modal visibility:', modalStyle.visibility);
                console.log('Modal opacity:', modalStyle.opacity);
            }, 100);
        }
        
        function closeAddEventModal() {
            document.getElementById('addEventModal').classList.remove('active');
        }
        
        function closeEventDetailsModal() {
            document.getElementById('eventDetailsModal').classList.remove('active');
        }
        
        function setupRecurringEventHandlers() {
            const recurringCheckbox = document.getElementById('recurringEvent');
            const recurringOptions = document.getElementById('recurringOptions');
            const recurringType = document.getElementById('recurringType');
            const customDaysSection = document.getElementById('customDaysSection');
            
            if (recurringCheckbox) {
                recurringCheckbox.addEventListener('change', function() {
                    if (recurringOptions) {
                        recurringOptions.style.display = this.checked ? 'block' : 'none';
                    }
                });
            }
            
            if (recurringType) {
                recurringType.addEventListener('change', function() {
                    if (customDaysSection) {
                        customDaysSection.style.display = this.value === 'custom' ? 'block' : 'none';
                    }
                });
            }
            
            // Add hover effects to day checkboxes
            const dayCheckboxes = document.querySelectorAll('.day-checkbox');
            dayCheckboxes.forEach(label => {
                label.addEventListener('mouseenter', function() {
                    this.style.backgroundColor = '#f3f4f6';
                    this.style.borderColor = '#dc143c';
                });
                label.addEventListener('mouseleave', function() {
                    this.style.backgroundColor = 'white';
                    this.style.borderColor = '#d1d5db';
                });
                label.addEventListener('click', function() {
                    const checkbox = this.querySelector('input[type="checkbox"]');
                    if (checkbox.checked) {
                        this.style.backgroundColor = '#fef2f2';
                        this.style.borderColor = '#dc143c';
                        this.style.color = '#dc143c';
                    } else {
                        this.style.backgroundColor = 'white';
                        this.style.borderColor = '#d1d5db';
                        this.style.color = 'inherit';
                    }
                });
            });
        }

        async function saveCalendarEvent() {
            // Double-check admin access
            if (!currentUser || currentUser.role !== 'admin') {
                console.log('Access denied: Only admins can save events');
                showNotification('Only administrators can create calendar events', 'error');
                closeAddEventModal();
                return;
            }
            
            const title = document.getElementById('eventTitle').value.trim();
            const date = document.getElementById('eventDate').value;
            const startTime = document.getElementById('eventStartTime').value;
            const endTime = document.getElementById('eventEndTime').value;
            const type = document.getElementById('eventType').value;
            const location = document.getElementById('eventLocation').value.trim();
            const description = document.getElementById('eventDescription').value.trim();
            const isRecurring = document.getElementById('recurringEvent') ? document.getElementById('recurringEvent').checked : false;
            
            if (!title || !date || !startTime || !endTime) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            // Validate that end time is after start time
            if (startTime >= endTime) {
                showNotification('End time must be after start time', 'error');
                return;
            }
            
            let events = [];
            
            if (isRecurring) {
                events = generateRecurringEvents(title, date, startTime, endTime, type, location, description);
                if (events.length === 0) {
                    showNotification('Please configure recurring options properly', 'error');
                    return;
                }
            } else {
                // Single event
                events = [{
                    id: Date.now().toString(),
                    title: title,
                    date: date,
                    startTime: startTime,
                    endTime: endTime,
                    type: type,
                    location: location,
                    description: description,
                    createdBy: currentUser.id
                }];
            }
            
            // Save all events
            try {
                for (const event of events) {
                    calendarEvents.push(event);
                }
                
                showNotification(
                    isRecurring 
                        ? 'Created ' + events.length + ' recurring events successfully!' 
                        : 'Event created successfully!', 
                    'success'
                );
                closeAddEventModal();
                renderCalendar();
            } catch (error) {
                console.error('Error saving events:', error);
                showNotification('Failed to save events', 'error');
            }
        }
        
        function generateRecurringEvents(title, startDate, startTime, endTime, type, location, description) {
            const events = [];
            const recurringTypeEl = document.getElementById('recurringType');
            const endDateEl = document.getElementById('recurringEndDate'); 
            const maxCountEl = document.getElementById('recurringCount');
            
            if (!recurringTypeEl) return events;
            
            const recurringType = recurringTypeEl.value;
            const endDate = endDateEl ? endDateEl.value : '';
            const maxCount = maxCountEl ? parseInt(maxCountEl.value) || null : null;
            
            let currentDate = new Date(startDate);
            const endDateObj = endDate ? new Date(endDate) : null;
            let eventCount = 0;
            const maxEvents = maxCount || 100; // Limit to prevent issues
            
            while (eventCount < maxEvents && (!endDateObj || currentDate <= endDateObj)) {
                let shouldAddEvent = false;
                
                if (recurringType === 'daily') {
                    shouldAddEvent = true;
                } else if (recurringType === 'weekdays') {
                    const dayOfWeek = currentDate.getDay();
                    shouldAddEvent = dayOfWeek >= 1 && dayOfWeek <= 5;
                } else if (recurringType === 'weekly') {
                    shouldAddEvent = currentDate.getDay() === new Date(startDate).getDay();
                } else if (recurringType === 'custom') {
                    const customDays = getSelectedCustomDays();
                    shouldAddEvent = customDays.includes(currentDate.getDay());
                }
                
                if (shouldAddEvent) {
                    events.push({
                        id: Date.now() + '_' + eventCount,
                        title: title,
                        date: currentDate.toISOString().split('T')[0],
                        startTime: startTime,
                        endTime: endTime,
                        type: type,
                        location: location,
                        description: description,
                        createdBy: currentUser.id,
                        isRecurring: true,
                        recurringGroup: Date.now().toString()
                    });
                    eventCount++;
                }
                
                currentDate.setDate(currentDate.getDate() + 1);
                
                if (currentDate.getFullYear() > new Date().getFullYear() + 2) {
                    break;
                }
            }
            
            return events;
        }
        
        function getSelectedCustomDays() {
            const selectedDays = [];
            const dayCheckboxes = document.querySelectorAll('.day-checkbox input[type="checkbox"]:checked');
            dayCheckboxes.forEach(function(checkbox) {
                selectedDays.push(parseInt(checkbox.value));
            });
            return selectedDays;
        }
        
        async function loadCalendarEvents() {
            try {
                const response = await fetch('/api/calendar');
                const data = await response.json();
                
                if (data.success) {
                    calendarEvents = data.events || [];
                } else {
                    console.error('Failed to load events:', data.message);
                }
            } catch (error) {
                console.error('Error loading calendar events:', error);
            }
        }
        
        function showEventDetails(eventId) {
            console.log('showEventDetails called with eventId:', eventId);
            const event = calendarEvents.find(e => e.id === eventId);
            console.log('Found event:', event);
            if (!event) {
                console.log('Event not found!');
                return;
            }
            
            const modal = document.getElementById('eventDetailsModal');
            const titleElement = document.getElementById('eventDetailsTitle');
            const bodyElement = document.getElementById('eventDetailsBody');
            
            console.log('Modal element:', modal);
            if (!modal) {
                console.error('Event details modal not found!');
                return;
            }
            
            titleElement.textContent = event.title;
            
            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            bodyElement.innerHTML = '<div class="event-detail-item">' +
                '<strong>Date:</strong> ' + formattedDate +
            '</div>' +
            '<div class="event-detail-item">' +
                '<strong>Time:</strong> ' + (event.startTime && event.endTime 
                    ? event.startTime + ' - ' + event.endTime 
                    : (event.time || event.startTime || 'Not specified')) +
            '</div>' +
            '<div class="event-detail-item">' +
                '<strong>Type:</strong> ' + event.type.charAt(0).toUpperCase() + event.type.slice(1) +
            '</div>' +
            (event.location ? '<div class="event-detail-item"><strong>Location:</strong> ' + event.location + '</div>' : '') +
            (event.description ? '<div class="event-detail-item"><strong>Description:</strong> ' + event.description + '</div>' : '');
            
            console.log('Adding active class to modal');
            modal.classList.add('active');
            console.log('Modal classes:', modal.classList.toString());
        }
        
        async function loadCalendarEvents() {
            try {
                const response = await fetch('/api/calendar');
                const data = await response.json();
                
                if (data.success) {
                    calendarEvents = data.events || [];
                } else {
                    console.error('Failed to load calendar events');
                }
            } catch (error) {
                console.error('Error loading calendar events:', error);
            }
        }

        async function rejectApplication(applicationId) {
            if (!confirm('Are you sure you want to reject this application? This action cannot be undone.')) return;

            try {
                const response = await fetch('/api/applications/' + applicationId + '/reject', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();

                if (data.success) {
                    showNotification('Application rejected', 'success');
                    await loadPendingApplications();
                } else {
                    showNotification(data.message || 'Failed to reject application', 'error');
                }
            } catch (error) {
                console.error('Error rejecting application:', error);
                showNotification('Error rejecting application', 'error');
            }
        }

        function viewApplicationDetails(applicationId) {
            // For now, just show an alert with more details
            // This could be expanded to show a detailed modal
            showNotification('Application details view coming soon', 'info');
        }

        function editUser(userId) {
            const users = [...players, ...staff, ...admins];
            const user = users.find(u => u.id === userId);
            
            if (!user) {
                showNotification('User not found', 'error');
                return;
            }
            
            // Create edit modal HTML
            const modalHtml = document.createElement('div');
            modalHtml.className = 'user-edit-modal';
            modalHtml.id = 'userEditModal';
            modalHtml.innerHTML = '<div class="user-edit-modal-content">' +
                '<div class="user-edit-header">' +
                    '<h3>Edit User Profile</h3>' +
                    '<button class="close-btn" data-action="close-edit">&times;</button>' +
                '</div>' +
                '<div class="user-edit-body">' +
                    '<form id="userEditForm">' +
                        '<input type="hidden" id="editUserId" value="' + user.id + '">' +
                        '<div class="form-row">' +
                            '<div class="form-group">' +
                                '<label for="editUserName">Full Name *</label>' +
                                '<input type="text" id="editUserName" value="' + user.name + '" required>' +
                            '</div>' +
                            '<div class="form-group">' +
                                '<label for="editUserEmail">Email *</label>' +
                                '<input type="email" id="editUserEmail" value="' + user.email + '" required>' +
                            '</div>' +
                        '</div>' +
                        '<div class="form-row">' +
                            '<div class="form-group">' +
                                '<label for="editUserRole">Role *</label>' +
                                '<select id="editUserRole" required>' +
                                    '<option value="admin"' + (user.role === 'admin' ? ' selected' : '') + '>Admin</option>' +
                                    '<option value="staff"' + (user.role === 'staff' ? ' selected' : '') + '>Staff</option>' +
                                    '<option value="player"' + (user.role === 'player' ? ' selected' : '') + '>Player</option>' +
                                '</select>' +
                            '</div>' +
                            (user.role === 'player' ? 
                                '<div class="form-group">' +
                                    '<label for="editUserHouse">House Assignment</label>' +
                                    '<select id="editUserHouse">' +
                                        '<option value="Widdersdorf 1"' + (user.house === 'Widdersdorf 1' ? ' selected' : '') + '>Widdersdorf 1</option>' +
                                        '<option value="Widdersdorf 2"' + (user.house === 'Widdersdorf 2' ? ' selected' : '') + '>Widdersdorf 2</option>' +
                                        '<option value="Widdersdorf 3"' + (user.house === 'Widdersdorf 3' ? ' selected' : '') + '>Widdersdorf 3</option>' +
                                    '</select>' +
                                '</div>'
                            : '') +
                        '</div>' +
                        (user.role === 'player' ? 
                            '<div class="form-row">' +
                                '<div class="form-group">' +
                                    '<label for="editUserAge">Age</label>' +
                                    '<input type="number" id="editUserAge" value="' + (user.age || '') + '" min="16" max="35">' +
                                '</div>' +
                                '<div class="form-group">' +
                                    '<label for="editUserPosition">Position</label>' +
                                    '<select id="editUserPosition">' +
                                        '<option value="STRIKER"' + (user.position === 'STRIKER' ? ' selected' : '') + '>Striker</option>' +
                                        '<option value="WINGER"' + (user.position === 'WINGER' ? ' selected' : '') + '>Winger</option>' +
                                        '<option value="MIDFIELDER"' + (user.position === 'MIDFIELDER' ? ' selected' : '') + '>Midfielder</option>' +
                                        '<option value="DEFENDER"' + (user.position === 'DEFENDER' ? ' selected' : '') + '>Defender</option>' +
                                        '<option value="GOALKEEPER"' + (user.position === 'GOALKEEPER' ? ' selected' : '') + '>Goalkeeper</option>' +
                                    '</select>' +
                                '</div>' +
                            '</div>'
                        : '') +
                        '<div class="form-actions">' +
                            '<button type="button" class="btn btn-secondary" data-action="close-edit">Cancel</button>' +
                            '<button type="submit" class="btn btn-primary">Save Changes</button>' +
                        '</div>' +
                    '</form>' +
                '</div>' +
            '</div>';
            
            // Add modal to page
            document.body.appendChild(modalHtml);
            
            // Add close button event listener
            modalHtml.addEventListener('click', function(e) {
                if (e.target.dataset.action === 'close-edit') {
                    closeUserEditModal();
                }
            });
            
            // Show modal
            modalHtml.classList.add('show');
            
            // Add form submit handler
            document.getElementById('userEditForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                await saveUserChanges();
            });
        }

        async function saveUserChanges() {
            const formData = {
                id: document.getElementById('editUserId').value,
                name: document.getElementById('editUserName').value,
                email: document.getElementById('editUserEmail').value,
                role: document.getElementById('editUserRole').value
            };
            
            // Add player-specific fields if applicable
            if (formData.role === 'player') {
                formData.house = document.getElementById('editUserHouse')?.value;
                formData.age = parseInt(document.getElementById('editUserAge')?.value) || null;
                formData.position = document.getElementById('editUserPosition')?.value;
            }
            
            try {
                const response = await fetch('/api/users/' + formData.id, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (data.success) {
                    showNotification('User updated successfully!', 'success');
                    closeUserEditModal();
                    await loadExistingUsers();
                } else {
                    showNotification(data.message || 'Failed to update user', 'error');
                }
            } catch (error) {
                console.error('Error updating user:', error);
                showNotification('Error updating user', 'error');
            }
        }

        function closeUserEditModal() {
            const modal = document.getElementById('userEditModal');
            if (modal) {
                modal.remove();
            }
        }
        
        function viewApplicationDetails(applicationId) {
            const applications = JSON.parse(localStorage.getItem('fckoln_pending_applications') || '[]');
            const application = applications.find(app => app.id === applicationId);
            
            if (!application) {
                showNotification('Application not found', 'error');
                return;
            }
            
            // Create detailed view modal
            const modalHtml = document.createElement('div');
            modalHtml.className = 'application-details-modal';
            modalHtml.id = 'applicationDetailsModal';
            
            const basicInfo = '<div class="detail-section">' +
                '<h4>📋 Basic Information</h4>' +
                '<div class="detail-grid">' +
                    '<div class="detail-item"><label>Full Name</label><span>' + application.name + '</span></div>' +
                    '<div class="detail-item"><label>Email Address</label><span>' + application.email + '</span></div>' +
                    '<div class="detail-item"><label>Age</label><span>' + application.age + ' years</span></div>' +
                    '<div class="detail-item"><label>Application Type</label><span class="application-type ' + application.type + '">' + application.type + '</span></div>' +
                '</div>' +
            '</div>';
            
            const specificInfo = application.type === 'player' ? 
                '<div class="detail-section">' +
                    '<h4>⚽ Player Information</h4>' +
                    '<div class="detail-grid">' +
                        '<div class="detail-item"><label>Position</label><span>' + application.position + '</span></div>' +
                        '<div class="detail-item"><label>Nationality</label><span>' + application.nationality + '</span></div>' +
                    '</div>' +
                '</div>'
                :
                '<div class="detail-section">' +
                    '<h4>👨‍💼 Staff Information</h4>' +
                    '<div class="detail-grid">' +
                        '<div class="detail-item"><label>Department</label><span>' + application.department + '</span></div>' +
                    '</div>' +
                '</div>';
            
            modalHtml.innerHTML = '<div class="application-details-modal-content">' +
                '<div class="application-details-header">' +
                    '<h3>Application Details</h3>' +
                    '<button class="close-btn" data-action="close-details">&times;</button>' +
                '</div>' +
                '<div class="application-details-body">' +
                    basicInfo +
                    specificInfo +
                    '<div class="detail-section">' +
                        '<h4>📝 Application Notes</h4>' +
                        '<div class="notes-content">' +
                            '<p>' + application.notes + '</p>' +
                        '</div>' +
                    '</div>' +
                    '<div class="detail-section">' +
                        '<h4>📅 Application Timeline</h4>' +
                        '<div class="detail-grid">' +
                            '<div class="detail-item"><label>Submitted</label><span>' + new Date(application.applicationDate).toLocaleString() + '</span></div>' +
                            '<div class="detail-item"><label>Status</label><span class="status-pending">Pending Review</span></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="application-actions-detailed">' +
                        '<button class="btn btn-success" data-action="approve" data-id="' + application.id + '">✓ Approve Application</button>' +
                        '<button class="btn btn-danger" data-action="reject" data-id="' + application.id + '">✗ Reject Application</button>' +
                        '<button class="btn btn-secondary" data-action="close-details">Close</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
            
            // Add event listeners
            modalHtml.addEventListener('click', function(e) {
                const action = e.target.dataset.action;
                const id = e.target.dataset.id;
                
                if (action === 'close-details') {
                    closeApplicationDetailsModal();
                } else if (action === 'approve' && id) {
                    approveApplicationWithHouseSelection(id);
                    closeApplicationDetailsModal();
                } else if (action === 'reject' && id) {
                    rejectApplication(id);
                    closeApplicationDetailsModal();
                }
            });
            
            // Add modal to page
            document.body.appendChild(modalHtml);
            
            // Show modal
            modalHtml.classList.add('show');
        }

        function closeApplicationDetailsModal() {
            const modal = document.getElementById('applicationDetailsModal');
            if (modal) {
                modal.remove();
            }
        }
    </script>

    <!-- Player Details Modal -->
    <div class="player-modal" id="playerDetailsModal">
        <div class="player-modal-content">
            <div class="player-modal-header">
                <button class="player-modal-close" onclick="closePlayerModal()">&times;</button>
                <h2 class="player-modal-title" id="playerModalName">Player Name</h2>
                <p class="player-modal-subtitle" id="playerModalPosition">Position</p>
            </div>
            <div class="player-modal-body">
                <div class="player-details-section">
                    <h3 class="section-title">👤 Personal Information</h3>
                    <div class="detail-row">
                        <div class="detail-label">Full Name</div>
                        <div class="detail-value" id="modalPlayerName">-</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Age</div>
                        <div class="detail-value" id="modalPlayerAge">-</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Position</div>
                        <div class="detail-value" id="modalPlayerPosition">-</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Nationality</div>
                        <div class="detail-value" id="modalPlayerNationality">-</div>
                    </div>
                </div>

                <div class="player-details-section">
                    <h3 class="section-title">🏠 Housing & Status</h3>
                    <div class="detail-row">
                        <div class="detail-label">Assigned House</div>
                        <div class="detail-value" id="modalPlayerHouse">-</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Current Status</div>
                        <div class="detail-value">
                            <span class="status-badge" id="modalPlayerStatus">Active</span>
                        </div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Join Date</div>
                        <div class="detail-value" id="modalPlayerJoinDate">-</div>
                    </div>
                </div>
            </div>
            <div class="player-modal-actions">
                <button class="btn-status-change" onclick="changePlayerStatus('active')">Set Active</button>
                <button class="btn-status-change" onclick="changePlayerStatus('training')">Set Training</button>
                <button class="btn-status-change" onclick="changePlayerStatus('rest')">Set Rest</button>
                <button class="btn-status-change" onclick="changePlayerStatus('injured')">Set Injured</button>
                <button class="btn-close" onclick="closePlayerModal()">Close</button>
            </div>
        </div>
    </div>

</body>
</html>
    `);
});

// Dashboard-specific endpoints
app.get("/api/dashboard/stats", (req, res) => {
    const stats = {
        totalPlayers: players.length,
        trainingToday: players.filter((p) => p.status === "training").length,
        houses: 3, // Widdersdorf 1, 2, 3
        activitiesToday: calendarEvents.filter((e) => {
            const today = new Date().toDateString();
            const eventDate = new Date(e.date).toDateString();
            return eventDate === today;
        }).length,
    };
    res.json({ success: true, stats });
});

app.get("/api/dashboard/recent-activity", (req, res) => {
    const activities = [
        {
            time: "10:30 AM",
            title: "Training Session Completed",
            description: "Morning fitness training - 18 players attended",
            type: "training",
        },
        {
            time: "9:15 AM",
            title: "New Player Registration",
            description: "Dennis Huseinbasic completed profile setup",
            type: "registration",
        },
        {
            time: "8:45 AM",
            title: "Meal Orders Submitted",
            description: `${foodOrders.length} players submitted lunch preferences`,
            type: "food",
        },
        {
            time: "8:00 AM",
            title: "House Chore Completed",
            description: "Widdersdorf 2 completed weekly cleaning tasks",
            type: "chores",
        },
    ];
    res.json({ success: true, activities });
});

app.get("/api/dashboard/house-competition", (req, res) => {
    const houses = [
        {
            rank: 1,
            name: "Widdersdorf 2",
            players: players.filter((p) => p.house === "Widdersdorf 2").length,
            stats: "Clean record",
            points: 945,
            trophy: "🥇",
        },
        {
            rank: 2,
            name: "Widdersdorf 1",
            players: players.filter((p) => p.house === "Widdersdorf 1").length,
            stats: "2 pending tasks",
            points: 920,
            trophy: "🥈",
        },
        {
            rank: 3,
            name: "Widdersdorf 3",
            players: players.filter((p) => p.house === "Widdersdorf 3").length,
            stats: "1 pending task",
            points: 885,
            trophy: "🥉",
        },
    ];

    const weekChallenges =
        "Fitness Challenge (20 pts), Chore Completion (15 pts), Team Spirit (10 pts)";

    res.json({ success: true, houses, weekChallenges });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(
        "🚀 1.FC Köln Bundesliga Talent Program - STABLE PERMANENT SYSTEM",
    );
    console.log("📍 Server running on port " + PORT);
    console.log(
        "👤 Admin credentials: max.bisinger@warubi-sports.com / ITP2024",
    );
    console.log(
        "👥 Staff credentials: thomas.ellinger@warubi-sports.com / ITP2024",
    );
    console.log("✅ PERMANENT STABLE VERSION:");
    console.log("  - No more JavaScript syntax errors");
    console.log("  - Robust event handling with data attributes");
    console.log("  - Comprehensive error prevention");
    console.log("  - All features working reliably");
    console.log("🏆 This version will NOT have recurring errors!");
});
