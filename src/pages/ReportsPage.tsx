import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { WeeklyReport, Project, User } from "../types.js";
import {
  Search,
  Filter,
  PlusCircle,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertOctagon,
  Trash2,
  Edit3,
  X,
  ChevronDown,
  Info,
  ChevronRight,
} from "lucide-react";

export default function ReportsPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]); // For Manager dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Selected report details for modal/drawer view
  const [activeReport, setActiveReport] = useState<WeeklyReport | null>(null);

  const fetchReportsAndMetadata = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch reports
      const reportsRes = await fetch("/api/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!reportsRes.ok) throw new Error("Failed to load reports");
      const reportsData = await reportsRes.json();
      setReports(reportsData);

      // 2. Fetch projects (for filter dropdown)
      const projectsRes = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData);
      }

      // 3. Fetch users if manager (to support Employee filtering)
      if (user?.role === "MANAGER") {
        // We can get users list or derive unique ones from reports, but we can also fetch unique users from reports. Let's extract them from reports for maximum stability
        const uniqueUsers: User[] = [];
        reportsData.forEach((rep: any) => {
          if (rep.userId && !uniqueUsers.some((u) => u.id === rep.userId)) {
            uniqueUsers.push({
              id: rep.userId,
              fullName: rep.userName || "Unknown",
              email: rep.userEmail || "",
              role: "MEMBER",
              createdAt: "",
            });
          }
        });
        setUsers(uniqueUsers);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading reports center");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsAndMetadata();
  }, [token, user]);

  const handleDeleteReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening drawer
    if (!token) return;
    if (!window.confirm("Are you sure you want to delete this report draft?")) return;

    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to delete report");
      }

      // Remove from list
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (activeReport?.id === id) {
        setActiveReport(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deleting report");
    }
  };

  // Filter application
  const filteredReports = reports.filter((report) => {
    // Search query matches completed/planned tasks or notes
    const matchesSearch =
      report.completedTasks.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.plannedTasks.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.userName && report.userName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesProject = !selectedProject || report.projectId === selectedProject;
    const matchesUser = !selectedUser || report.userId === selectedUser;
    const matchesStatus = !selectedStatus || report.status === selectedStatus;

    return matchesSearch && matchesProject && matchesUser && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Weekly Reports
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {user?.role === "MANAGER"
              ? "Inspect and analyze report submissions across all projects and staff."
              : "Review your submitted reports or manage pending logs."}
          </p>
        </div>
        {user?.role === "MEMBER" && (
          <Link
            to="/reports/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 hover:bg-primary-700 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Report</span>
          </Link>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks, content, or employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:flex gap-3">
            {/* Filter by Project */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 bg-white focus:outline-none focus:border-primary-500"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Filter by Employee (Manager only) */}
            {user?.role === "MANAGER" && (
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 bg-white focus:outline-none focus:border-primary-500"
              >
                <option value="">All Employees</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </select>
            )}

            {/* Filter by Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 bg-white focus:outline-none focus:border-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="DRAFT">Drafts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Reports Workspace */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Reports List/Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {filteredReports.length === 0 ? (
            <div className="p-16 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900">No Weekly Reports Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Try loosening your filter parameters or search queries.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Employee / Period</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Project</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Hours</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.map((rep) => (
                    <tr
                      key={rep.id}
                      onClick={() => setActiveReport(rep)}
                      className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${
                        activeReport?.id === rep.id ? "bg-primary-50/35" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-900">
                            {user?.role === "MANAGER" ? rep.userName : "My Progress Report"}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {rep.weekStart} to {rep.weekEnd}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-slate-600">
                          {rep.projectName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-700 font-mono">
                          {rep.hoursWorked}h
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {rep.status === "SUBMITTED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                            Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-[10px] font-bold text-amber-700 border border-amber-100">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {rep.status === "DRAFT" && (
                            <>
                              <button
                                onClick={() => navigate(`/reports/edit/${rep.id}`)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                                title="Edit Draft"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteReport(rep.id, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Draft"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Report Inspect Pane (Side-drawer style layout) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          {activeReport ? (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      activeReport.status === "SUBMITTED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {activeReport.status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">ID: {activeReport.id}</span>
                  </div>
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    {activeReport.userName || "Progress Log"}
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-400 font-mono">
                    Period: {activeReport.weekStart} to {activeReport.weekEnd}
                  </p>
                </div>
                <button
                  onClick={() => setActiveReport(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Details List */}
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Project</h4>
                  <p className="font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {activeReport.projectName}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Hours Logged</h4>
                    <p className="font-bold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono text-center">
                      {activeReport.hoursWorked} hours
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Submission Date</h4>
                    <p className="text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center truncate">
                      {activeReport.submittedAt 
                        ? new Date(activeReport.submittedAt).toLocaleDateString() 
                        : "Not submitted yet"}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Tasks Completed This Week</h4>
                  <div className="bg-emerald-50/20 text-slate-700 p-3 rounded-xl border border-emerald-100/60 leading-relaxed font-sans whitespace-pre-line">
                    {activeReport.completedTasks}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Planned Tasks For Next Week</h4>
                  <div className="bg-blue-50/20 text-slate-700 p-3 rounded-xl border border-blue-100/60 leading-relaxed font-sans whitespace-pre-line">
                    {activeReport.plannedTasks}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Active Blockers / Risks</h4>
                  <div className={`p-3 rounded-xl border leading-relaxed font-semibold whitespace-pre-line ${
                    activeReport.blockers && activeReport.blockers.toLowerCase() !== "none" && activeReport.blockers.trim() !== ""
                      ? "bg-rose-50/30 text-rose-700 border-rose-100"
                      : "bg-slate-50 text-slate-500 border-slate-100"
                  }`}>
                    {activeReport.blockers || "No active blockers logged."}
                  </div>
                </div>

                {activeReport.notes && (
                  <div>
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Personal Notes</h4>
                    <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed text-slate-600">
                      {activeReport.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons inside Inspect block */}
              {activeReport.status === "DRAFT" && (
                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <Link
                    to={`/reports/edit/${activeReport.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Resume Draft</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <Info className="h-8 w-8 text-slate-300 mx-auto" />
              <h4 className="text-xs font-bold text-slate-800">No Report Selected</h4>
              <p className="text-[11px] max-w-xs mx-auto">
                Click on any weekly report in the table to view completed deliverables, upcoming tasks, hours worked, and blockers in full detail.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
