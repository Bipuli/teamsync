import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { Project } from "../types.js";
import { FileText, ArrowLeft, AlertCircle, Save, Send, RefreshCw } from "lucide-react";

export default function CreateReportPage() {
  const { token } = useAuth();
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

  // Helper to auto-calculate current week range (Monday to Sunday)
  useEffect(() => {
    const today = new Date();
    const day = today.getDay();
    // Monday is 1, Sunday is 0. Calculate difference
    const mondayDiff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(mondayDiff));
    const sunday = new Date(today.setDate(mondayDiff + 6));

    setWeekStart(monday.toISOString().split("T")[0]);
    setWeekEnd(sunday.toISOString().split("T")[0]);
  }, []);

  const fetchProjects = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to load active projects");
      const data = await response.json();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error initializing projects dropdown");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  const handleSubmit = async (status: "DRAFT" | "SUBMITTED") => {
    if (!token) return;
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
      const response = await fetch("/api/reports", {
        method: "POST",
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
        throw new Error(resData.error || "Failed to save weekly report");
      }

      navigate("/reports");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server error saving report");
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
          Create Weekly Report
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Document your deliverables, upcoming plans, logged hours, and active obstacles.
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
            {projects.length === 0 ? (
              <div className="text-xs text-rose-500 bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
                No active projects found. Please ask Sarah Connor to create a project first.
              </div>
            ) : (
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
            )}
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
            <span>Save Draft</span>
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
