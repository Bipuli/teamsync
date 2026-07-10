export type UserRole = "MEMBER" | "MANAGER";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
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
  completedTasks: string; // List of completed tasks, separated by newline
  plannedTasks: string; // List of planned tasks, separated by newline
  blockers: string;
  hoursWorked: number;
  notes: string;
  status: "DRAFT" | "SUBMITTED";
  submittedAt?: string;
  createdAt: string;
  
  // Enhanced properties populated by API
  userName?: string;
  userEmail?: string;
  projectName?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface DashboardMetrics {
  totalReports: number;
  submittedReports: number;
  pendingReports: number;
  lateReports: number;
  openBlockers: number;
}

export interface DashboardCharts {
  tasksCompletedOverTime: { week: string; tasks: number }[];
  reportsByProject: { name: string; value: number }[];
  submissionStatus: { status: string; count: number }[];
}

export interface DashboardActivity {
  id: string;
  user: string;
  text: string;
  time: string;
  type: "submit" | "draft" | "register";
}

export interface DashboardData {
  metrics: DashboardMetrics;
  charts: DashboardCharts;
  activityFeed: DashboardActivity[];
}
