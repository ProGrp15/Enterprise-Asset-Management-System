// ==========================================
// IMPORTS
// ==========================================
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ==========================================
// APP CONFIGURATION
// ==========================================
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "assetflow_dev_secret";

app.use(cors());
app.use(express.json());

// ==========================================
// MYSQL CONNECTION
// ==========================================
const db = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 5000,
});

db.getConnection((err, connection) => {
  if (err) {
    console.log("❌ MySQL Connection Failed!");
    console.log(err.message);
  } else {
    console.log("✅ MySQL Connected Successfully!");
  }
});

// ==========================================
// TEST ROUTES
// ==========================================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Enterprise Asset Management API is Running!",
  });
});

app.get("/api/test-db", (req, res) => {
  db.query("SELECT NOW() AS serverTime", (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database Query Failed",
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      message: "Database Connected Successfully!",
      serverTime: result[0].serverTime,
    });
  });
});

// ==========================================
// REGISTER COMPANY API (FIXED)
// ==========================================
app.post("/api/auth/register-company", (req, res) => {
  const {
    companyName,
    industry,
    companySize,
    officialEmail,
    mobileNumber,
    adminName,
    password,
  } = req.body;

  // Validation FIXED
  if (
    !companyName ||
    !officialEmail ||
    !adminName ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message: "Please fill all required fields.",
    });
  }

  // Check duplicate company
  db.query(
    "SELECT * FROM companies WHERE official_email = ?",
    [officialEmail],
    (err, companyResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database Error",
          error: err.message,
        });
      }

      if (companyResult.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Company already registered.",
        });
      }

      // PASSWORD (unchanged as requested)
      const hashedPassword = password;

      // Insert Company
      const companySql = `
        INSERT INTO companies
        (company_name, industry, company_size, official_email, mobile_number)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(
        companySql,
        [
          companyName,
          industry,
          companySize,
          officialEmail,
          mobileNumber,
        ],
        (err, companyInsertResult) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Company Registration Failed",
              error: err.message,
            });
          }

          const companyId = companyInsertResult.insertId;

          // Insert Admin User (FIXED)
          const userSql = `
            INSERT INTO users
            (company_id, full_name, email, password, role)
            VALUES (?, ?, ?, ?, 'COMPANY_ADMIN')
          `;

          db.query(
            userSql,
            [
              companyId,
              adminName,
              officialEmail,
              hashedPassword,
            ],
            (err, userResult) => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  message: "Admin User Creation Failed",
                  error: err.message,
                });
              }

              const token = jwt.sign(
                {
                  userId: userResult.insertId,
                  companyId,
                  role: "COMPANY_ADMIN",
                },
                JWT_SECRET,
                { expiresIn: "24h" }
              );

              res.status(201).json({
                success: true,
                message: "Company Registered Successfully!",
                companyId,
                adminUserId: userResult.insertId,
                token,
                user: {
                  userId: userResult.insertId,
                  companyId,
                  fullName: adminName,
                  email: officialEmail,
                  role: "COMPANY_ADMIN",
                },
              });
            }
          );
        }
      );
    }
  );
});

// ==========================================
// LOGIN API
// ==========================================
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and Password are required."
    });
  }

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database Error",
          error: err.message
        });
      }

      if (result.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid Email or Password."
        });
      }

      const user = result[0];

      if (password !== user.password) {
        return res.status(401).json({
          success: false,
          message: "Invalid Email or Password."
        });
      }

      const token = jwt.sign(
        {
          userId: user.user_id,
          companyId: user.company_id,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.status(200).json({
        success: true,
        message: "Login Successful!",
        token,
        user: {
          userId: user.user_id,
          companyId: user.company_id,
          fullName: user.full_name,
          email: user.email,
          role: user.role
        }
      });
    }
  );
});

// ==========================================
// JWT MIDDLEWARE
// ==========================================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Access Denied. No token provided."
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or Expired Token."
    });
  }
};

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(result);
    });
  });

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

const requireRoles = (...allowedRoles) => (req, res, next) => {
  const userRole = normalizeRole(req.user?.role);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  if (!normalizedAllowedRoles.includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to access this resource.",
    });
  }

  next();
};

const asyncHandler = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ==========================================
// DASHBOARD APIS
// ==========================================
app.get(
  "/api/dashboard/company-admin",
  verifyToken,
  requireRoles("COMPANY_ADMIN", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { companyId } = req.user;

    const companies = await query(
      `SELECT company_id, company_name, industry, company_size, official_email, mobile_number
       FROM companies
       WHERE company_id = ?`,
      [companyId]
    );

    const employeeCount = await query(
      `SELECT COUNT(*) AS total FROM users WHERE company_id = ? AND role = 'EMPLOYEE'`,
      [companyId]
    );

    const adminCount = await query(
      `SELECT COUNT(*) AS total FROM users WHERE company_id = ? AND role <> 'EMPLOYEE'`,
      [companyId]
    );

    res.status(200).json({
      success: true,
      company: companies[0] || null,
      stats: {
        employees: employeeCount[0].total,
        admins: adminCount[0].total,
        assets: 0,
        requests: 0,
      },
    });
  })
);

app.get(
  "/api/dashboard/super-admin",
  verifyToken,
  requireRoles("SUPER_ADMIN", "SUPERADMIN"),
  asyncHandler(async (req, res) => {
    const companies = await query(`SELECT COUNT(*) AS total FROM companies`);
    const users = await query(`SELECT COUNT(*) AS total FROM users`);
    const companyList = await query(
      `SELECT company_id, company_name, industry, official_email, company_size
       FROM companies
       ORDER BY company_id DESC
       LIMIT 10`
    );

    res.status(200).json({
      success: true,
      stats: {
        companies: companies[0].total,
        users: users[0].total,
        assets: 0,
        subscriptions: 0,
      },
      companies: companyList,
    });
  })
);

app.get(
  "/api/dashboard/employee",
  verifyToken,
  requireRoles("EMPLOYEE", "EMPLOYEES"),
  asyncHandler(async (req, res) => {
    const { userId, companyId } = req.user;

    const users = await query(
      `SELECT user_id, company_id, full_name, email, role FROM users WHERE user_id = ?`,
      [userId]
    );

    const companies = await query(
      `SELECT company_id, company_name, industry, official_email FROM companies WHERE company_id = ?`,
      [companyId]
    );

    res.status(200).json({
      success: true,
      employee: users[0] || null,
      company: companies[0] || null,
      stats: {
        assignedAssets: 0,
        openRequests: 0,
        notifications: 0,
      },
    });
  })
);

// ==========================================
// EMPLOYEE APIS
// ==========================================
app.get(
  "/api/employees",
  verifyToken,
  requireRoles("COMPANY_ADMIN", "ADMIN"),
  asyncHandler(async (req, res) => {
    const employees = await query(
      `SELECT user_id, company_id, full_name, email, role
       FROM users
       WHERE company_id = ? AND role = 'EMPLOYEE'
       ORDER BY user_id DESC`,
      [req.user.companyId]
    );

    res.status(200).json({
      success: true,
      employees,
    });
  })
);

app.post(
  "/api/employees",
  verifyToken,
  requireRoles("COMPANY_ADMIN", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email and password are required.",
      });
    }

    const existingUsers = await query(
      `SELECT user_id FROM users WHERE email = ? LIMIT 1`,
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An employee with this email already exists.",
      });
    }

    const result = await query(
      `INSERT INTO users (company_id, full_name, email, password, role)
       VALUES (?, ?, ?, ?, 'EMPLOYEE')`,
      [req.user.companyId, fullName, email, password]
    );

    res.status(201).json({
      success: true,
      message: "Employee created successfully.",
      employee: {
        user_id: result.insertId,
        company_id: req.user.companyId,
        full_name: fullName,
        email,
        role: "EMPLOYEE",
      },
    });
  })
);

// ==========================================
// PROFILE API
// ==========================================
app.get("/api/auth/profile", verifyToken, (req, res) => {
  const { userId } = req.user;

  db.query(
    `SELECT user_id, company_id, full_name, email, role FROM users WHERE user_id = ?`,
    [userId],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database Error",
          error: err.message
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found."
        });
      }

      res.status(200).json({
        success: true,
        user: result[0]
      });
    }
  );
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// // ==========================================
// // IMPORTS
// // ==========================================
// const express = require("express");
// const mysql = require("mysql2");
// const cors = require("cors");
// require("dotenv").config();
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");

// // ==========================================
// // APP CONFIGURATION
// // ==========================================
// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());

// // ==========================================
// // MYSQL CONNECTION
// // ==========================================
// const db = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// });

// db.connect((err) => {
//   if (err) {
//     console.log("❌ MySQL Connection Failed!");
//     console.log(err.message);
//   } else {
//     console.log("✅ MySQL Connected Successfully!");
//   }
// });

// // ==========================================
// // TEST ROUTES
// // ==========================================

// // Root Route
// app.get("/", (req, res) => {
//   res.json({
//     success: true,
//     message: "Enterprise Asset Management API is Running!",
//   });
// });

// // Database Test Route
// app.get("/api/test-db", (req, res) => {
//   db.query("SELECT NOW() AS serverTime", (err, result) => {
//     if (err) {
//       return res.status(500).json({
//         success: false,
//         message: "Database Query Failed",
//         error: err.message,
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Database Connected Successfully!",
//       serverTime: result[0].serverTime,
//     });
//   });
// });

// // ==========================================
// // REGISTER COMPANY API
// // ==========================================

// app.post("/api/auth/register-company", async (req, res) => {
//   try {
//     const {
//       companyName,
//       industry,
//       companySize,
//       officialEmail,
//       mobileNumber,
//       adminName,
      
//       password,
//     } = req.body;

//     // Basic Validation
//     if (
//       !companyName ||
//       !officialEmail ||
//       !adminName ||
//       !adminEmail ||
//       !password
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Please fill all required fields.",
//       });
//     }

//     // Check if company email already exists
//     db.query(
//       "SELECT * FROM companies WHERE official_email = ?",
//       [officialEmail],
//       async (err, companyResult) => {
//         if (err) {
//           return res.status(500).json({
//             success: false,
//             message: "Database Error",
//             error: err.message,
//           });
//         }

//         if (companyResult.length > 0) {
//           return res.status(409).json({
//             success: false,
//             message: "Company already registered.",
//           });
//         }

//         // Hash Password
//        const hashedPassword = password;

//         // Insert Company
//         const companySql = `
//           INSERT INTO companies
//           (company_name, industry, company_size, official_email, mobile_number)
//           VALUES (?, ?, ?, ?, ?)
//         `;

//         db.query(
//           companySql,
//           [
//             companyName,
//             industry,
//             companySize,
//             officialEmail,
//             mobileNumber,
//           ],
//           (err, companyInsertResult) => {
//             if (err) {
//               return res.status(500).json({
//                 success: false,
//                 message: "Company Registration Failed",
//                 error: err.message,
//               });
//             }

//             const companyId = companyInsertResult.insertId;

//             // Insert Company Admin
//             const userSql = `
//               INSERT INTO users
//               (company_id, full_name, email, password, role)
//               VALUES (?, ?, ?, ?, 'COMPANY_ADMIN')
//             `;

//             db.query(
//               userSql,
//               [
//                 companyId,
//                 adminName,
//                 adminEmail,
//                 hashedPassword,
//               ],
//               (err, userResult) => {
//                 if (err) {
//                   return res.status(500).json({
//                     success: false,
//                     message: "Admin User Creation Failed",
//                     error: err.message,
//                   });
//                 }

//                 res.status(201).json({
//                   success: true,
//                   message: "Company Registered Successfully!",
//                   companyId: companyId,
//                   adminUserId: userResult.insertId,
//                 });
//               }
//             );
//           }
//         );
//       }
//     );
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// });

// // ==========================================
// // LOGIN API
// // ==========================================

// app.post("/api/auth/login", (req, res) => {
//   const { email, password } = req.body;

//   // Basic Validation
//   if (!email || !password) {
//     return res.status(400).json({
//       success: false,
//       message: "Email and Password are required."
//     });
//   }

//   // Find User
//   db.query(
//     "SELECT * FROM users WHERE email = ?",
//     [email],
//     async (err, result) => {
//       if (err) {
//         return res.status(500).json({
//           success: false,
//           message: "Database Error",
//           error: err.message
//         });
//       }

//       if (result.length === 0) {
//         return res.status(401).json({
//           success: false,
//           message: "Invalid Email or Password."
//         });
//       }

//       const user = result[0];

//       // Compare Password
//       // Temporary plain-text password check
// if (password !== user.password) {
//   return res.status(401).json({
//     success: false,
//     message: "Invalid Email or Password."
//   });
// }

//       // Generate JWT
//       const token = jwt.sign(
//         {
//           userId: user.user_id,
//           companyId: user.company_id,
//           role: user.role
//         },
//         process.env.JWT_SECRET,
//         { expiresIn: "24h" }
//       );

//       // Success Response
//       res.status(200).json({
//         success: true,
//         message: "Login Successful!",
//         token: token,
//         user: {
//           userId: user.user_id,
//           companyId: user.company_id,
//           fullName: user.full_name,
//           email: user.email,
//           role: user.role
//         }
//       });
//     }
//   );
// });

// // ==========================================
// // JWT AUTH MIDDLEWARE
// // ==========================================

// const verifyToken = (req, res, next) => {
//   const authHeader = req.headers["authorization"];

//   if (!authHeader) {
//     return res.status(401).json({
//       success: false,
//       message: "Access Denied. No token provided."
//     });
//   }

//   // Format: Bearer <token>
//   const token = authHeader.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({
//       success: false,
//       message: "Invalid Token Format."
//     });
//   }

//   try {
//     const decoded = jwt.verify(
//       token,
//       process.env.JWT_SECRET
//     );

//     req.user = decoded;
//     next();
//   } catch (error) {
//     return res.status(401).json({
//       success: false,
//       message: "Invalid or Expired Token."
//     });
//   }
// };


// // ==========================================
// // GET LOGGED IN USER PROFILE
// // ==========================================

// app.get("/api/auth/profile", verifyToken, (req, res) => {
//   const { userId } = req.user;

//   db.query(
//     `SELECT
//         user_id,
//         company_id,
//         full_name,
//         email,
//         role
//      FROM users
//      WHERE user_id = ?`,
//     [userId],
//     (err, result) => {
//       if (err) {
//         return res.status(500).json({
//           success: false,
//           message: "Database Error",
//           error: err.message
//         });
//       }

//       if (result.length === 0) {
//         return res.status(404).json({
//           success: false,
//           message: "User not found."
//         });
//       }

//       res.status(200).json({
//         success: true,
//         user: result[0]
//       });
//     }
//   );
// });




// // ==========================================
// // START SERVER
// // ==========================================
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });
