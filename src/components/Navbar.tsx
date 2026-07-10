import { useAuth } from "../context/AuthContext.js";
import { Link } from "react-router-dom";
import { LogOut, User, Shield, Bot } from "lucide-react";
import teamsyncLogo from "../assets/images/teamsync_logo_1783418967511.jpg";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo and App Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
            <img
              src={teamsyncLogo}
              alt="TeamSync Logo"
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <Link to="/" className="font-display text-lg font-bold tracking-tight text-slate-900 hover:text-primary-600 transition-colors">
              TeamSync
            </Link>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              v1.0
            </span>
          </div>
        </div>

        {/* User Stats/Profile Controls */}
        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-sm font-semibold text-slate-900">{user.fullName}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {user.role === "MANAGER" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[10px] font-bold text-rose-700">
                    <Shield className="h-2.5 w-2.5" />
                    Manager
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700">
                    <User className="h-2.5 w-2.5" />
                    Team Member
                  </span>
                )}
              </div>
            </div>

            {/* Profile Avatar / Quick Link */}
            <Link
              to="/profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-primary-500 to-primary-600 font-bold text-white text-sm shadow-inner hover:scale-105 transition-transform"
            >
              {user.fullName.charAt(0).toUpperCase()}
            </Link>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Logout"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
