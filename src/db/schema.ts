import { pgTable, text, timestamp, real } from "drizzle-orm/pg-core";

// Users Table
export const users = pgTable("users", {
  id: text("id").primaryKey(), // e.g., usr-xxxxxxxxx
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<"MEMBER" | "MANAGER">().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Projects Table
export const projects = pgTable("projects", {
  id: text("id").primaryKey(), // e.g., prj-xxxxxxxxx
  name: text("name").notNull(),
  description: text("description").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Weekly Reports Table
export const reports = pgTable("reports", {
  id: text("id").primaryKey(), // e.g., rep-xxxxxxxxx
  weekStart: text("week_start").notNull(), // YYYY-MM-DD
  weekEnd: text("week_end").notNull(), // YYYY-MM-DD
  projectId: text("project_id").notNull(),
  userId: text("user_id").notNull(),
  completedTasks: text("completed_tasks").notNull(),
  plannedTasks: text("planned_tasks").notNull(),
  blockers: text("blockers").default("").notNull(),
  hoursWorked: real("hours_worked").notNull(),
  notes: text("notes").default("").notNull(),
  status: text("status").$type<"DRAFT" | "SUBMITTED">().notNull(),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
