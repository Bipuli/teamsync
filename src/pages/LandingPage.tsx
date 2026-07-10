import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { ArrowRight, FileText, BarChart3, Bot, CheckCircle, Users } from "lucide-react";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center flex-grow flex flex-col justify-center">
       

        {/* Title */}
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
          Weekly Progress Reporting <br />
          <span className="bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
            Smarter Team Insights in One Place
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-lg text-slate-500 leading-relaxed mb-10">
          Simplify weekly reporting, extract clear work logs, and empower project managers with beautiful real-time analytics. 
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all hover:scale-[1.02] min-w-[140px] cursor-pointer"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white text-slate-700 border border-slate-200 font-semibold hover:bg-slate-50 transition-all hover:scale-[1.02] min-w-[140px] cursor-pointer"
              >
                Join Team
              </Link>
            </>
          )}
        </div>

        {/* Feature Bento Grid */}
        <div className="grid md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-primary-600 flex items-center justify-center mb-4 border border-blue-100">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-slate-900 mb-2">Structured Reports</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Log completed tasks, future deliverables, project hours, and active blockers in an elegant submission suite.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-slate-900 mb-2">Manager Dashboards</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Track project milestones, pending reviews, timesheet statistics, and activity flows in real time.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-slate-900 mb-2">Gemini AI Analytics</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Interact with a project assistant to query reports, track employee logs, and summarize project blockers.
            </p>
          </div>
        </div>

        {/* Quick Credentials panel for easy login during evaluation */}
        {/* <div className="mt-16 bg-white border border-dashed border-slate-200 rounded-2xl p-6 max-w-lg mx-auto text-left"> */}
          {/* <h4 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            Quick Access Demo Credentials
          </h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="font-semibold text-rose-700 uppercase tracking-wide text-[10px] mb-1">
                Manager Account
              </p>
              <p className="text-slate-600"><strong className="text-slate-800">Email:</strong> sarah@company.com</p>
              <p className="text-slate-600"><strong className="text-slate-800">Password:</strong> admin123</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="font-semibold text-blue-700 uppercase tracking-wide text-[10px] mb-1">
                Team Member Account
              </p>
              <p className="text-slate-600"><strong className="text-slate-800">Email:</strong> john@company.com</p>
              <p className="text-slate-600"><strong className="text-slate-800">Password:</strong> user123</p>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
