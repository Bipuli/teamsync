import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import { Project } from "../types.js";
import {
  FolderOpen,
  PlusCircle,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

export default function ProjectsPage() {
  const { token, user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to load active projects");
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loaded projects list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  const handleEdit = (proj: Project) => {
    setEditingId(proj.id);
    setName(proj.name);
    setDescription(proj.description);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to delete this project? Depended weekly reports will remain intact but project headers will lose association.")) return;

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to delete project");
      }

      setProjects((prev) => prev.filter((p) => p.id !== id));
      setSuccess("Project deleted successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting project");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      let url = "/api/projects";
      let method = "POST";

      if (editingId) {
        url = `/api/projects/${editingId}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to save project config");
      }

      if (editingId) {
        setProjects((prev) => prev.map((p) => (p.id === editingId ? resData : p)));
        setSuccess("Project details updated successfully");
      } else {
        setProjects((prev) => [...prev, resData]);
        setSuccess("New Project registered successfully");
      }

      // Reset form
      setEditingId(null);
      setName("");
      setDescription("");
      setShowForm(false);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server error saving project configuration");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Project Configurations
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Create, update, and manage global system projects logged in team timesheets.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 shadow-md shadow-primary-500/15 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Project</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-sm font-medium text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-sm font-medium text-emerald-700">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Form Card (Create or Edit) */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-md space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-display text-sm font-bold text-slate-900">
              {editingId ? "Edit Project Details" : "Register New Project"}
            </h3>
            <button onClick={handleCancel} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Project Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Project Alpha"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Project Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details about core purpose, repository hooks, and design objectives..."
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:outline-none leading-relaxed"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-primary-600 text-white font-semibold text-xs rounded-xl hover:bg-primary-700 shadow-md shadow-primary-500/10 cursor-pointer flex items-center gap-1"
              >
                {submitting ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  "Save Project"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects List GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100 shrink-0">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div className="flex gap-1 opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(proj)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-50 cursor-pointer"
                    title="Edit Details"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(proj.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    title="Delete Project"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                  {proj.name}
                </h3>
                <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 inline-block mt-0.5">
                  ID: {proj.id}
                </span>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3">
                  {proj.description || "No project summary provided yet."}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Registered</span>
              <span>{new Date(proj.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10 text-center col-span-full">
            <FolderOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800">No Projects Configured</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Active projects must be configured so that Team Members can log weekly progress against them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
