import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import "./src/loadEnv";
import { GoogleGenAI } from "@google/genai";
import {
  getDb,
  saveDb,
  User,
  Project,
  WeeklyReport,
  initializeDatabase,
} from "./src/server/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "weekly-report-secret-key-2026";

app.use(express.json());

// ------------------------------------
// MIDDLEWARES
// ------------------------------------

interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: "MEMBER" | "MANAGER";
  };
}

// Authentication middleware
const authenticateToken = (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access denied. No token provided." });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      fullName: string;
      role: "MEMBER" | "MANAGER";
    };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token." });
  }
};

// Role authorization middleware
const authorizeRole = (role: "MEMBER" | "MANAGER") => {
  return (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({ error: "Unauthorized. Insufficient privileges." });
      return;
    }
    next();
  };
};

// ------------------------------------
// VALIDATION SCHEMAS
// ------------------------------------

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["MEMBER", "MANAGER"]),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const projectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  description: z.string().optional().default(""),
});

const reportSchema = z.object({
  weekStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  weekEnd: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  projectId: z.string().min(1, "Project is required"),
  completedTasks: z.string().min(1, "Completed tasks are required"),
  plannedTasks: z.string().min(1, "Planned tasks are required"),
  blockers: z.string().optional().default(""),
  hoursWorked: z
    .number()
    .min(0, "Hours worked cannot be negative")
    .max(168, "Hours worked cannot exceed 168"),
  notes: z.string().optional().default(""),
  status: z.enum(["DRAFT", "SUBMITTED"]),
});

// ------------------------------------
// AUTHENTICATION APIs
// ------------------------------------

app.post("/api/auth/register", (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const db = getDb();

    // Check if user already exists
    const existing = db.users.find(
      (u) => u.email.toLowerCase() === data.email.toLowerCase(),
    );
    if (existing) {
      res.status(400).json({ error: "User with this email already exists" });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(data.password, salt);

    const newUser: User = {
      id: `usr-${Math.random().toString(36).substr(2, 9)}`,
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.role,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDb(db);

    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
    } else {
      res.status(500).json({ error: "Server error during registration" });
    }
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const db = getDb();

    const user = db.users.find(
      (u) => u.email.toLowerCase() === data.email.toLowerCase(),
    );
    if (!user) {
      res.status(400).json({ error: "Invalid email or password" });
      return;
    }

    const isMatch = bcrypt.compareSync(data.password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: "Invalid email or password" });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
    } else {
      res.status(500).json({ error: "Server error during login" });
    }
  }
});

app.get("/api/auth/me", authenticateToken, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Not authorized" });
    return;
  }
  res.json({ user: req.user });
});

app.post("/api/auth/logout", (req, res) => {
  res.json({ message: "Logout successful" });
});

// ------------------------------------
// PROJECTS APIs (CRUD)
// ------------------------------------

app.get("/api/projects", authenticateToken, (req, res) => {
  const db = getDb();
  res.json(db.projects);
});

app.post(
  "/api/projects",
  authenticateToken,
  authorizeRole("MANAGER"),
  (req, res) => {
    try {
      const data = projectSchema.parse(req.body);
      const db = getDb();

      const newProject: Project = {
        id: `prj-${Math.random().toString(36).substr(2, 9)}`,
        name: data.name,
        description: data.description || "",
        createdAt: new Date().toISOString(),
      };

      db.projects.push(newProject);
      saveDb(db);

      res.status(201).json(newProject);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.issues[0].message });
      } else {
        res.status(500).json({ error: "Server error creating project" });
      }
    }
  },
);

app.put(
  "/api/projects/:id",
  authenticateToken,
  authorizeRole("MANAGER"),
  (req, res) => {
    try {
      const { id } = req.params;
      const data = projectSchema.parse(req.body);
      const db = getDb();

      const projIndex = db.projects.findIndex((p) => p.id === id);
      if (projIndex === -1) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      db.projects[projIndex] = {
        ...db.projects[projIndex],
        name: data.name,
        description: data.description || "",
      };

      saveDb(db);
      res.json(db.projects[projIndex]);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.issues[0].message });
      } else {
        res.status(500).json({ error: "Server error updating project" });
      }
    }
  },
);

app.delete(
  "/api/projects/:id",
  authenticateToken,
  authorizeRole("MANAGER"),
  (req, res) => {
    const { id } = req.params;
    const db = getDb();

    const projIndex = db.projects.findIndex((p) => p.id === id);
    if (projIndex === -1) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // Remove project
    db.projects.splice(projIndex, 1);

    // Keep reports, but maybe nullify or handle projectId? For simplicity, we can filter them out or keep with missing project indicator. Let's keep them and we will handle deleted projects gracefully in UI.
    saveDb(db);
    res.json({ success: true, message: "Project deleted successfully" });
  },
);

// ------------------------------------
// REPORTS APIs
// ------------------------------------

// GET /api/reports - Manager gets all, Member gets only their own
app.get("/api/reports", authenticateToken, (req: AuthenticatedRequest, res) => {
  if (!req.user) return;
  const db = getDb();
  let reportsList = [...db.reports];

  // If user is a member, filter by their userId
  if (req.user.role === "MEMBER") {
    reportsList = reportsList.filter((r) => r.userId === req.user?.id);
  }

  // Parse filters
  const { userId, projectId, status, weekStart, weekEnd } = req.query;

  if (userId) {
    reportsList = reportsList.filter((r) => r.userId === userId);
  }
  if (projectId) {
    reportsList = reportsList.filter((r) => r.projectId === projectId);
  }
  if (status) {
    reportsList = reportsList.filter((r) => r.status === status);
  }
  if (weekStart) {
    reportsList = reportsList.filter(
      (r) => r.weekStart >= (weekStart as string),
    );
  }
  if (weekEnd) {
    reportsList = reportsList.filter((r) => r.weekEnd <= (weekEnd as string));
  }

  // Enhance reports with full user details and project name
  const enhancedReports = reportsList.map((r) => {
    const reportUser = db.users.find((u) => u.id === r.userId);
    const reportProj = db.projects.find((p) => p.id === r.projectId);
    return {
      ...r,
      userName: reportUser ? reportUser.fullName : "Deleted User",
      userEmail: reportUser ? reportUser.email : "",
      projectName: reportProj ? reportProj.name : "Deleted Project",
    };
  });

  // Sort by weekStart desc, submittedAt desc, or createdAt desc
  enhancedReports.sort(
    (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime(),
  );

  res.json(enhancedReports);
});

// GET /api/reports/my - Alternative endpoint for Member reports
app.get(
  "/api/reports/my",
  authenticateToken,
  (req: AuthenticatedRequest, res) => {
    if (!req.user) return;
    const db = getDb();
    const reportsList = db.reports.filter((r) => r.userId === req.user?.id);

    const enhancedReports = reportsList.map((r) => {
      const reportProj = db.projects.find((p) => p.id === r.projectId);
      return {
        ...r,
        userName: req.user?.fullName || "Me",
        projectName: reportProj ? reportProj.name : "Deleted Project",
      };
    });

    enhancedReports.sort(
      (a, b) =>
        new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime(),
    );
    res.json(enhancedReports);
  },
);

// POST /api/reports - Create new report (MEMBER or MANAGER)
app.post(
  "/api/reports",
  authenticateToken,
  (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) return;
      const data = reportSchema.parse(req.body);
      const db = getDb();

      const newReport: WeeklyReport = {
        id: `rep-${Math.random().toString(36).substr(2, 9)}`,
        weekStart: data.weekStart,
        weekEnd: data.weekEnd,
        projectId: data.projectId,
        userId: req.user.id, // Members can only submit for themselves
        completedTasks: data.completedTasks,
        plannedTasks: data.plannedTasks,
        blockers: data.blockers || "",
        hoursWorked: data.hoursWorked,
        notes: data.notes || "",
        status: data.status,
        submittedAt:
          data.status === "SUBMITTED" ? new Date().toISOString() : undefined,
        createdAt: new Date().toISOString(),
      };

      db.reports.push(newReport);
      saveDb(db);

      res.status(201).json(newReport);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.issues[0].message });
      } else {
        res.status(500).json({ error: "Server error creating report" });
      }
    }
  },
);

// PUT /api/reports/:id - Edit report draft
app.put(
  "/api/reports/:id",
  authenticateToken,
  (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) return;
      const { id } = req.params;
      const data = reportSchema.parse(req.body);
      const db = getDb();

      const repIndex = db.reports.findIndex((r) => r.id === id);
      if (repIndex === -1) {
        res.status(404).json({ error: "Report not found" });
        return;
      }

      const existingReport = db.reports[repIndex];

      // Access control: Members can only edit their own report
      if (req.user.role === "MEMBER" && existingReport.userId !== req.user.id) {
        res
          .status(403)
          .json({ error: "Access denied. Cannot edit other's report." });
        return;
      }

      // Role-based draft rule: Members cannot edit a submitted report (they can only edit drafts)
      if (req.user.role === "MEMBER" && existingReport.status === "SUBMITTED") {
        res
          .status(400)
          .json({
            error: "Submitted reports cannot be edited by Team Members.",
          });
        return;
      }

      db.reports[repIndex] = {
        ...existingReport,
        weekStart: data.weekStart,
        weekEnd: data.weekEnd,
        projectId: data.projectId,
        completedTasks: data.completedTasks,
        plannedTasks: data.plannedTasks,
        blockers: data.blockers || "",
        hoursWorked: data.hoursWorked,
        notes: data.notes || "",
        status: data.status,
        submittedAt:
          data.status === "SUBMITTED" && existingReport.status === "DRAFT"
            ? new Date().toISOString()
            : existingReport.submittedAt,
      };

      saveDb(db);
      res.json(db.reports[repIndex]);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.issues[0].message });
      } else {
        res.status(500).json({ error: "Server error updating report" });
      }
    }
  },
);

// DELETE /api/reports/:id - Delete a report draft
app.delete(
  "/api/reports/:id",
  authenticateToken,
  (req: AuthenticatedRequest, res) => {
    if (!req.user) return;
    const { id } = req.params;
    const db = getDb();

    const repIndex = db.reports.findIndex((r) => r.id === id);
    if (repIndex === -1) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    const report = db.reports[repIndex];

    // Members can only delete their own reports
    if (req.user.role === "MEMBER" && report.userId !== req.user.id) {
      res
        .status(403)
        .json({ error: "Access denied. Cannot delete other's report." });
      return;
    }

    // Members can only delete DRAFTS
    if (req.user.role === "MEMBER" && report.status === "SUBMITTED") {
      res
        .status(400)
        .json({
          error: "Submitted reports cannot be deleted by Team Members.",
        });
      return;
    }

    db.reports.splice(repIndex, 1);
    saveDb(db);

    res.json({ success: true, message: "Report deleted successfully" });
  },
);

// ------------------------------------
// MANAGER DASHBOARD API
// ------------------------------------

app.get(
  "/api/dashboard",
  authenticateToken,
  authorizeRole("MANAGER"),
  (req, res) => {
    const db = getDb();

    const totalReports = db.reports.length;
    const submittedReports = db.reports.filter(
      (r) => r.status === "SUBMITTED",
    ).length;
    const pendingReports = db.reports.filter(
      (r) => r.status === "DRAFT",
    ).length;

    // Late reports: Submitted after Monday 9 AM, or not submitted for last week's period. Let's do a simple calculation: any report that was created late (or has hours worked under 20) as an example.
    // Or let's say: reports created after weekEnd date are "late".
    const lateReports = db.reports.filter((r) => {
      if (r.status === "DRAFT") return false;
      if (!r.submittedAt) return false;
      const subDate = new Date(r.submittedAt);
      const endDate = new Date(r.weekEnd);
      // Submit date is after end date + 1 day (e.g. after Monday)
      return subDate.getTime() > endDate.getTime() + 24 * 60 * 60 * 1000;
    }).length;

    const openBlockersList = db.reports.filter(
      (r) =>
        r.blockers &&
        r.blockers.toLowerCase() !== "none" &&
        r.blockers.trim() !== "",
    );
    const openBlockers = openBlockersList.length;

    // 1. Chart: Tasks Completed Over Time (Group by weekEnd date)
    const taskCompletionMap: { [weekEnd: string]: number } = {};
    db.reports
      .filter((r) => r.status === "SUBMITTED")
      .forEach((r) => {
        const taskCount = r.completedTasks
          .split("\n")
          .filter((t) => t.trim().length > 0).length;
        taskCompletionMap[r.weekEnd] =
          (taskCompletionMap[r.weekEnd] || 0) + taskCount;
      });
    const tasksCompletedOverTime = Object.keys(taskCompletionMap)
      .sort()
      .map((week) => ({
        week,
        tasks: taskCompletionMap[week],
      }));

    // 2. Chart: Reports by Project
    const reportsByProjectMap: { [projectName: string]: number } = {};
    db.reports.forEach((r) => {
      const proj = db.projects.find((p) => p.id === r.projectId);
      const projName = proj ? proj.name : "Deleted Project";
      reportsByProjectMap[projName] = (reportsByProjectMap[projName] || 0) + 1;
    });
    const reportsByProject = Object.keys(reportsByProjectMap).map((name) => ({
      name,
      value: reportsByProjectMap[name],
    }));

    // 3. Chart: Submission Status
    const submissionStatus = [
      { status: "Submitted", count: submittedReports },
      { status: "Draft/Pending", count: pendingReports },
    ];

    // 4. Activity Feed (Combine user registering, report submissions)
    const activityFeed: {
      id: string;
      user: string;
      text: string;
      time: string;
      type: string;
    }[] = [];

    // Submissions
    db.reports.forEach((r) => {
      const userObj = db.users.find((u) => u.id === r.userId);
      const user = userObj ? userObj.fullName : "Unknown";
      const projObj = db.projects.find((p) => p.id === r.projectId);
      const proj = projObj ? projObj.name : "Project";

      if (r.status === "SUBMITTED" && r.submittedAt) {
        activityFeed.push({
          id: `act-${r.id}-sub`,
          user,
          text: `submitted report for ${proj} (Week ending ${r.weekEnd})`,
          time: r.submittedAt,
          type: "submit",
        });
      } else {
        activityFeed.push({
          id: `act-${r.id}-dr`,
          user,
          text: `saved a draft report for ${proj}`,
          time: r.createdAt,
          type: "draft",
        });
      }
    });

    // User creation
    db.users.forEach((u) => {
      activityFeed.push({
        id: `act-${u.id}-reg`,
        user: u.fullName,
        text: `registered as a new ${u.role === "MANAGER" ? "Manager" : "Team Member"}`,
        time: u.createdAt,
        type: "register",
      });
    });

    // Sort activity feed desc
    activityFeed.sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );

    res.json({
      metrics: {
        totalReports,
        submittedReports,
        pendingReports,
        lateReports,
        openBlockers,
      },
      charts: {
        tasksCompletedOverTime,
        reportsByProject,
        submissionStatus,
      },
      activityFeed: activityFeed.slice(0, 10), // Limit to 10 recent activities
    });
  },
);

// ------------------------------------
// AI ASSISTANT API
// ------------------------------------

app.post(
  "/api/ai/chat",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        res.status(400).json({ error: "Message is required" });
        return;
      }

      const db = getDb();

      // Check if Gemini API key exists
      if (!process.env.GEMINI_API_KEY) {
        res.json({
          reply:
            "The Gemini AI Assistant is currently in configuration mode. Please add your `GEMINI_API_KEY` in **Settings > Secrets** in AI Studio to unlock real AI analytics. \n\nHere is what I can tell you based on current data: \n" +
            `- There are **${db.users.filter((u) => u.role === "MEMBER").length} team members** on board.\n` +
            `- Active projects: **${db.projects.map((p) => p.name).join(", ")}**.\n` +
            `- Total reports logged: **${db.reports.length}** (${db.reports.filter((r) => r.status === "SUBMITTED").length} submitted, ${db.reports.filter((r) => r.status === "DRAFT").length} drafts).\n` +
            `- Blockers currently active: **${db.reports.filter((r) => r.blockers && r.blockers !== "None").length}**.`,
        });
        return;
      }

      // Initialize @google/genai
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Format database context beautifully for Gemini
      const teamMembersContext = db.users
        .filter((u) => u.role === "MEMBER")
        .map((u) => `- Name: ${u.fullName}, Email: ${u.email}, ID: ${u.id}`)
        .join("\n");

      const projectsContext = db.projects
        .map(
          (p) =>
            `- Name: ${p.name}, ID: ${p.id}, Description: ${p.description}`,
        )
        .join("\n");

      const reportsContext = db.reports
        .map((r) => {
          const u = db.users.find((user) => user.id === r.userId);
          const p = db.projects.find((proj) => proj.id === r.projectId);
          return `Report ID: ${r.id}
Employee: ${u ? u.fullName : "Unknown"}
Project: ${p ? p.name : "Unknown"}
Week Start: ${r.weekStart}
Week End: ${r.weekEnd}
Status: ${r.status}
Hours Worked: ${r.hoursWorked}
Completed Tasks:
${r.completedTasks}
Planned Tasks:
${r.plannedTasks}
Blockers: ${r.blockers || "None"}
Notes: ${r.notes || "None"}
Submitted At: ${r.submittedAt || "N/A"}
---`;
        })
        .join("\n\n");

      const systemInstruction = `You are a professional project management AI Assistant integrated into the "Weekly Report Generator & Team Dashboard". 
You have real-time access to the company's team member directory, active projects, and all submitted weekly reports.

Your task is to analyze this data and answer the user's questions in a clear, concise, objective, and professional manner.
Provide rich details, summaries, or structured tables when requested.

Below is the CURRENT state of the database:

### TEAM MEMBERS LIST:
${teamMembersContext}

### ACTIVE PROJECTS LIST:
${projectsContext}

### WEEKLY REPORTS (SUBMITTED & DRAFTS):
${reportsContext}

Guidance rules:
1. Ground your answers 100% in the provided facts.
2. If a project or employee is not found, let the user know politely.
3. Be professional and do not expose user password hashes or sensitive tokens.
4. Speak clearly and use bullet points or simple tables for clarity.`;

      // Construct request contents incorporating short history if any
      const formattedContents = [];
      if (history && Array.isArray(history)) {
        history
          .slice(-6)
          .forEach((h: { sender: "user" | "bot"; text: string }) => {
            formattedContents.push({
              role: h.sender === "user" ? "user" : "model",
              parts: [{ text: h.text }],
            });
          });
      }
      formattedContents.push({
        role: "user",
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      res.json({ reply: response.text });
    } catch (err) {
      console.error("Gemini assistant error:", err);
      res
        .status(500)
        .json({
          error:
            "Failed to query the AI assistant. " +
            (err instanceof Error ? err.message : ""),
        });
    }
  },
);

// ------------------------------------
// VITE DEV SERVER & STATIC MIDDLEWARE
// ------------------------------------

async function startServer() {
  // Initialize the database (creates tables & seeds if PostgreSQL is configured)
  await initializeDatabase();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server mounted as middleware");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production build from /dist");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
