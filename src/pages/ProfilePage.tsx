import { useAuth } from "../context/AuthContext.js";
import { User, Shield, Key, Mail, Calendar, LogOut } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Account Profile
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Review your credentials, permissions, and registration stats.
        </p>
      </div>

      {/* Profile Details Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-primary-600 to-indigo-600 flex items-end p-6">
          <div className="flex items-center gap-4 translate-y-10">
            <div className="h-20 w-20 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-3xl font-extrabold text-primary-600 font-display">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="pb-1 text-white md:text-slate-900">
              <h2 className="font-display text-lg font-bold text-white md:text-slate-900">{user.fullName}</h2>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                user.role === "MANAGER" ? "bg-rose-100 text-rose-800" : "bg-blue-100 text-blue-800"
              }`}>
                {user.role}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-16 p-6 sm:p-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Mail className="h-4 w-4 text-slate-400" />
                Email Address
              </span>
              <p className="text-sm font-semibold text-slate-800">{user.email}</p>
            </div>

            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Shield className="h-4 w-4 text-slate-400" />
                Security Access Role
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {user.role === "MANAGER" ? "Full Manager Authority" : "Team Member Operations"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Key className="h-4 w-4 text-slate-400" />
                User Unique ID
              </span>
              <p className="text-xs font-mono font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md inline-block">
                {user.id}
              </p>
            </div>

            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Calendar className="h-4 w-4 text-slate-400" />
                Account Created
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
            <div className="text-[11px] text-slate-400 font-medium">
              * To modify your email or name, please contact HR/Administration.
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-rose-200 text-rose-600 bg-rose-50/50 rounded-xl text-xs font-bold hover:bg-rose-50 hover:border-rose-300 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
