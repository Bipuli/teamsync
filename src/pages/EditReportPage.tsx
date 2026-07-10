import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { Project, WeeklyReport } from "../types.js";
import { ArrowLeft, AlertCircle, Save, Send, RefreshCw } from "lucide-react";

export default function EditReportPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [completedTasks, setCompletedTasks] = useState("");
  const [plannedTasks, setPlannedTasks] = useState("");
  const [blockers, setBlockers] = useState("");
  const [hoursWorked, setHoursWorked] = useState<number>(40);
  const [notes, setNotes] = useState("");
  
  const [saving, setSaving] = useState(false);

  const fetchReportDetailsAndProjects = async () => {
    if (!token || !id) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch project dropdown list
      const projectsRes = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!projectsRes.ok) throw new Error("Failed to load active projects");
      const projectsData = await projectsRes.json();
      setProjects(projectsData);

      // 2. Fetch all reports to find our matching one (secures route role)
      const reportsRes = await fetch("/api/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!reportsRes.ok) throw new Error("Failed to authenticate report ownership");
      const reportsList: WeeklyReport[] = await reportsRes.json();
      
      const rep = reportsList.find((r) => r.id === id);
      if (!rep) {
        throw new Error("Weekly report not found, or you do not have permission to edit it");
      }

      // Enforce: Members can't edit fully submitted reports
      if (user?.role === "MEMBER" && rep.status === "SUBMITTED") {
        throw new Error("Submitted reports cannot be edited by Team Members.");
      }

      // Populate form states
      setWeekStart(rep.weekStart);
      setWeekEnd(rep.weekEnd);
      setSelectedProjectId(rep.projectId);
      setCompletedTasks(rep.completedTasks);
      setPlannedTasks(rep.plannedTasks);
      setBlockers(rep.blockers);
      setHoursWorked(rep.hoursWorked);
      setNotes(rep.notes);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error preloading report context");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportDetailsAndProjects();
  }, [token, id]);

  const handleSubmit = async (status: "DRAFT" | "SUBMITTED") => {
    if (!token || !id) return;
    setError(null);

    // Manual validations
    if (!selectedProjectId) {
      setError("Please select an active project");
      return;
    }
    if (!weekStart || !weekEnd) {
      setError("Please set a valid week start and end range");
      return;
    }
    if (!completedTasks.trim()) {
      setError("Completed tasks field is required");
      return;
    }
    if (!plannedTasks.trim()) {
      setError("Planned tasks field is required");
      return;
    }
    if (hoursWorked < 0 || hoursWorked > 168) {
      setError("Hours worked must be a valid number between 0 and 168");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          weekStart,
          weekEnd,
          projectId: selectedProjectId,
          completedTasks,
          plannedTasks,
          blockers: blockers || "None",
          hoursWorked: Number(hoursWorked),
          notes,
          status,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to update report");
      }

      navigate("/reports");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server error updating report");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Return link */}
      <button
        onClick={() => navigate("/reports")}
        className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to Reports</span>
      </button>

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Edit Weekly Report
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Make updates to your draft deliverables or fully submit them for manager inspection.
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-sm font-medium text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form content */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Week selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Week Start Date
            </label>
            <input
              type="date"
              required
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Week End Date
            </label>
            <input
              type="date"
              required
              value={weekEnd}
              onChange={(e) => setWeekEnd(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {/* Project drop down */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Select Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 bg-white focus:border-primary-500 focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Hours logged */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Hours Worked
            </label>
            <input
              type="number"
              min={0}
              max={168}
              required
              value={hoursWorked}
              onChange={(e) => setHoursWorked(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 font-mono focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Textareas */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Completed Tasks
          </label>
          <span className="block text-[10px] text-slate-400 mb-1.5">Write each task on a new line. Be precise.</span>
          <textarea
            rows={4}
            required
            value={completedTasks}
            onChange={(e) => setCompletedTasks(e.target.value)}
            placeholder="e.g. Designed landing page layout&#10;Completed Axios auth integration&#10;Fixed routing re-render bugs"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none leading-relaxed"
          ></textarea>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Planned Deliverables (Next Week)
          </label>
          <span className="block text-[10px] text-slate-400 mb-1.5">Write each objective on a new line.</span>
          <textarea
            rows={3}
            required
            value={plannedTasks}
            onChange={(e) => setPlannedTasks(e.target.value)}
            placeholder="e.g. Construct Manager Dashboard graphs&#10;Implement Project CRUD routes&#10;Run Jest automated tests"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none leading-relaxed"
          ></textarea>
        </div>

        {/* Blockers */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Active Blockers & Dependencies
          </label>
          <span className="block text-[10px] text-slate-400 mb-1.5">Are you stuck on anything? If none, type "None".</span>
          <input
            type="text"
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            placeholder="e.g. Waiting on Figma designs / None"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:outline-none"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Personal Notes & Feedback (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any other comments or team observations..."
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none leading-relaxed"
          ></textarea>
        </div>

        {/* Submission buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit("DRAFT")}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Update Draft</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit("SUBMITTED")}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary-600 text-white font-semibold text-xs rounded-xl hover:bg-primary-700 shadow-md shadow-primary-500/10 cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>Submit Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
