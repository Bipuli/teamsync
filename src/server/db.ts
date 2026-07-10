import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { db, isDbConfigured } from "../db/index.ts";
import { users as usersTable, projects as projectsTable, reports as reportsTable } from "../db/schema.ts";
import { notInArray } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "db.json");

export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: "MEMBER" | "MANAGER";
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface WeeklyReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  projectId: string;
  userId: string;
  completedTasks: string; // List of tasks, newline separated
  plannedTasks: string; // List of planned tasks, newline separated
  blockers: string; // Text field
  hoursWorked: number;
  notes: string;
  status: "DRAFT" | "SUBMITTED";
  submittedAt?: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  projects: Project[];
  reports: WeeklyReport[];
}

let cachedDb: DatabaseSchema | null = null;

// Initial seed data
const getInitialData = (): DatabaseSchema => {
  const salt = bcrypt.genSaltSync(10);
  const managerPasswordHash = bcrypt.hashSync("admin123", salt);
  const memberPasswordHash = bcrypt.hashSync("user123", salt);
  const member2PasswordHash = bcrypt.hashSync("user456", salt);

  return {
    users: [
      {
        id: "usr-manager-1",
        fullName: "Sarah Connor (Manager)",
        email: "sarah@company.com",
        passwordHash: managerPasswordHash,
        role: "MANAGER",
        createdAt: new Date("2026-06-01T08:00:00Z").toISOString(),
      },
      {
        id: "usr-member-1",
        fullName: "John Doe",
        email: "john@company.com",
        passwordHash: memberPasswordHash,
        role: "MEMBER",
        createdAt: new Date("2026-06-01T09:00:00Z").toISOString(),
      },
      {
        id: "usr-member-2",
        fullName: "Jane Smith",
        email: "jane@company.com",
        passwordHash: member2PasswordHash,
        role: "MEMBER",
        createdAt: new Date("2026-06-02T10:00:00Z").toISOString(),
      },
    ],
    projects: [
      {
        id: "prj-alpha",
        name: "Project Alpha",
        description: "The core product revamp with modern UI components and design systems.",
        createdAt: new Date("2026-06-01T08:30:00Z").toISOString(),
      },
      {
        id: "prj-beta",
        name: "Project Beta",
        description: "Next-gen machine learning data pipelines and telemetry extraction.",
        createdAt: new Date("2026-06-05T09:00:00Z").toISOString(),
      },
      {
        id: "prj-omega",
        name: "Project Omega",
        description: "Migration of legacy databases to secure Cloud SQL relational instances.",
        createdAt: new Date("2026-06-10T11:15:00Z").toISOString(),
      },
    ],
    reports: [
      {
        id: "rep-1",
        weekStart: "2026-06-22",
        weekEnd: "2026-06-28",
        projectId: "prj-alpha",
        userId: "usr-member-1",
        completedTasks: "Designed the landing page mockup\nCreated initial Tailwind components\nSet up React Router DOM routing",
        plannedTasks: "Integrate with the Express API server\nImplement user auth context\nAdd mock reports",
        blockers: "Waiting on final feedback on styling guide.",
        hoursWorked: 38,
        notes: "Solid progress. Landing page looks extremely clean.",
        status: "SUBMITTED",
        submittedAt: new Date("2026-06-28T18:30:00Z").toISOString(),
        createdAt: new Date("2026-06-28T18:00:00Z").toISOString(),
      },
      {
        id: "rep-2",
        weekStart: "2026-06-22",
        weekEnd: "2026-06-28",
        projectId: "prj-beta",
        userId: "usr-member-2",
        completedTasks: "Set up Docker development containers\nConfigured FastAPI endpoint routes\nOptimized database indexing queries",
        plannedTasks: "Deploy preview image to Cloud Run\nRun integration tests suite",
        blockers: "AWS credential configuration pending manager approval.",
        hoursWorked: 42,
        notes: "Database queries are 40% faster after adding indices.",
        status: "SUBMITTED",
        submittedAt: new Date("2026-06-27T17:00:00Z").toISOString(),
        createdAt: new Date("2026-06-27T16:45:00Z").toISOString(),
      },
      {
        id: "rep-3",
        weekStart: "2026-06-29",
        weekEnd: "2026-07-05",
        projectId: "prj-alpha",
        userId: "usr-member-1",
        completedTasks: "Implemented Axios interceptors for JWT\nBuilt the Register and Login page forms\nCreated Dashboard navigation sidebar",
        plannedTasks: "Build manager dashboard charts\nAdd Project CRUD interfaces",
        blockers: "None",
        hoursWorked: 40,
        notes: "Auth state is fully persisted. Ready for the next phase.",
        status: "SUBMITTED",
        submittedAt: new Date("2026-07-05T19:20:00Z").toISOString(),
        createdAt: new Date("2026-07-05T19:00:00Z").toISOString(),
      },
      {
        id: "rep-4",
        weekStart: "2026-06-29",
        weekEnd: "2026-07-05",
        projectId: "prj-omega",
        userId: "usr-member-2",
        completedTasks: "Initiated data schema mapping mapping sheets\nDrafted firestore security rules blueprint",
        plannedTasks: "Coordinate database migration timelines\nTest export procedures",
        blockers: "Need team list for permission assignment.",
        hoursWorked: 35,
        notes: "Database export scripts verified on staging server. Still refining the migration timelines.",
        status: "DRAFT",
        createdAt: new Date("2026-07-04T12:00:00Z").toISOString(),
      },
    ],
  };
};

// Create tables if they don't exist
async function createTablesIfNotExist() {
  const { sql } = await import("drizzle-orm");
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      week_start TEXT NOT NULL,
      week_end TEXT NOT NULL,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      completed_tasks TEXT NOT NULL,
      planned_tasks TEXT NOT NULL,
      blockers TEXT NOT NULL DEFAULT '',
      hours_worked REAL NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      submitted_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

// Load database from Postgres to in-memory cache
async function loadFromPostgres() {
  const pgUsers = await db.select().from(usersTable);
  const pgProjects = await db.select().from(projectsTable);
  const pgReports = await db.select().from(reportsTable);

  cachedDb = {
    users: pgUsers.map((u: any) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      passwordHash: u.passwordHash,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    })),
    projects: pgProjects.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt.toISOString(),
    })),
    reports: pgReports.map((r: any) => ({
      id: r.id,
      weekStart: r.weekStart,
      weekEnd: r.weekEnd,
      projectId: r.projectId,
      userId: r.userId,
      completedTasks: r.completedTasks,
      plannedTasks: r.plannedTasks,
      blockers: r.blockers,
      hoursWorked: r.hoursWorked,
      notes: r.notes,
      status: r.status,
      submittedAt: r.submittedAt ? r.submittedAt.toISOString() : undefined,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

// Load database from JSON file fallback
function loadFromJson() {
  if (!fs.existsSync(DB_PATH)) {
    const initialData = getInitialData();
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    cachedDb = initialData;
    return;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    cachedDb = JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database, resetting to seed...", err);
    const initialData = getInitialData();
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    cachedDb = initialData;
  }
}

// Background Sync to PostgreSQL
async function syncToPostgres(data: DatabaseSchema) {
  // Sync Users
  for (const u of data.users) {
    await db.insert(usersTable).values({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      passwordHash: u.passwordHash,
      role: u.role,
      createdAt: new Date(u.createdAt),
    }).onConflictDoUpdate({
      target: usersTable.id,
      set: {
        fullName: u.fullName,
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role,
      }
    });
  }
  const userIds = data.users.map(u => u.id);
  if (userIds.length > 0) {
    await db.delete(usersTable).where(notInArray(usersTable.id, userIds));
  }

  // Sync Projects
  for (const p of data.projects) {
    await db.insert(projectsTable).values({
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: new Date(p.createdAt),
    }).onConflictDoUpdate({
      target: projectsTable.id,
      set: {
        name: p.name,
        description: p.description,
      }
    });
  }
  const projectIds = data.projects.map(p => p.id);
  if (projectIds.length > 0) {
    await db.delete(projectsTable).where(notInArray(projectsTable.id, projectIds));
  }

  // Sync Reports
  for (const r of data.reports) {
    await db.insert(reportsTable).values({
      id: r.id,
      weekStart: r.weekStart,
      weekEnd: r.weekEnd,
      projectId: r.projectId,
      userId: r.userId,
      completedTasks: r.completedTasks,
      plannedTasks: r.plannedTasks,
      blockers: r.blockers,
      hoursWorked: r.hoursWorked,
      notes: r.notes,
      status: r.status,
      submittedAt: r.submittedAt ? new Date(r.submittedAt) : null,
      createdAt: new Date(r.createdAt),
    }).onConflictDoUpdate({
      target: reportsTable.id,
      set: {
        weekStart: r.weekStart,
        weekEnd: r.weekEnd,
        projectId: r.projectId,
        userId: r.userId,
        completedTasks: r.completedTasks,
        plannedTasks: r.plannedTasks,
        blockers: r.blockers,
        hoursWorked: r.hoursWorked,
        notes: r.notes,
        status: r.status,
        submittedAt: r.submittedAt ? new Date(r.submittedAt) : null,
      }
    });
  }
  const reportIds = data.reports.map(r => r.id);
  if (reportIds.length > 0) {
    await db.delete(reportsTable).where(notInArray(reportsTable.id, reportIds));
  }

  console.log("PostgreSQL sync successful.");
}

// Export initialization function
export async function initializeDatabase() {
  if (isDbConfigured && db) {
    console.log("Initializing PostgreSQL (Neon) Database...");
    try {
      await createTablesIfNotExist();
      const existingUsers = await db.select().from(usersTable);
      if (existingUsers.length === 0) {
        console.log("PostgreSQL database is empty. Seeding initial data...");
        const initialData = getInitialData();
        
        for (const u of initialData.users) {
          await db.insert(usersTable).values({
            id: u.id,
            fullName: u.fullName,
            email: u.email,
            passwordHash: u.passwordHash,
            role: u.role,
            createdAt: new Date(u.createdAt),
          });
        }

        for (const p of initialData.projects) {
          await db.insert(projectsTable).values({
            id: p.id,
            name: p.name,
            description: p.description,
            createdAt: new Date(p.createdAt),
          });
        }

        for (const r of initialData.reports) {
          await db.insert(reportsTable).values({
            id: r.id,
            weekStart: r.weekStart,
            weekEnd: r.weekEnd,
            projectId: r.projectId,
            userId: r.userId,
            completedTasks: r.completedTasks,
            plannedTasks: r.plannedTasks,
            blockers: r.blockers,
            hoursWorked: r.hoursWorked,
            notes: r.notes,
            status: r.status,
            submittedAt: r.submittedAt ? new Date(r.submittedAt) : null,
            createdAt: new Date(r.createdAt),
          });
        }
        console.log("PostgreSQL seeding complete.");
      }

      await loadFromPostgres();
      console.log("PostgreSQL initialization complete and cache loaded.");
    } catch (err) {
      console.error("Failed to initialize PostgreSQL. Falling back to local JSON file:", err);
      loadFromJson();
    }
  } else {
    loadFromJson();
  }
}

export function getDb(): DatabaseSchema {
  if (!cachedDb) {
    loadFromJson();
  }
  return cachedDb!;
}

export function saveDb(data: DatabaseSchema) {
  cachedDb = data;
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error saving database to JSON file", err);
  }

  if (isDbConfigured && db) {
    syncToPostgres(data).catch((err) => {
      console.error("Background sync to PostgreSQL failed:", err);
    });
  }
}
