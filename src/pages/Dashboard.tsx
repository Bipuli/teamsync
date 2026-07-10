import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { DashboardData } from "../types.js";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertOctagon,
  Users,
  TrendingUp,
  Activity,
  PlusCircle,
  Sparkles,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#ec4899"];

export default function Dashboard() {
  const { user, token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For members, we can fetch their personal statistics
  const [myReportsCount, setMyReportsCount] = useState({ total: 0, drafts: 0, submitted: 0, hours: 0 });

  const fetchData = async () => {
    if (!user || !token) return;
    setLoading(true);
    setError(null);
    try {
      if (user.role === "MANAGER") {
        const response = await fetch("/api/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to load dashboard data");
        }
        const dashboardData = await response.json();
        setData(dashboardData);
      } else {
        // Fetch personal reports for Member quick stats
        const response = await fetch("/api/reports/my", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to load your report stats");
        }
        const reports = await response.json();
        const submitted = reports.filter((r: any) => r.status === "SUBMITTED");
        const drafts = reports.filter((r: any) => r.status === "DRAFT");
        const totalHours = reports.reduce((acc: number, r: any) => acc + Number(r.hoursWorked), 0);
        
        setMyReportsCount({
          total: reports.length,
          drafts: drafts.length,
          submitted: submitted.length,
          hours: totalHours,
        });

        // Set top 3 drafts as actionable
        setData({
          metrics: { totalReports: reports.length, submittedReports: submitted.length, pendingReports: drafts.length, lateReports: 0, openBlockers: 0 },
          charts: { tasksCompletedOverTime: [], reportsByProject: [], submissionStatus: [] },
          activityFeed: reports.slice(0, 5).map((r: any) => ({
            id: r.id,
            user: "You",
            text: `${r.status === "SUBMITTED" ? "submitted" : "saved a draft of"} report for week ending ${r.weekEnd}`,
            time: r.submittedAt || r.createdAt,
            type: r.status === "SUBMITTED" ? "submit" : "draft",
          })),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error syncing dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, token]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm font-medium text-slate-500">Loading your statistics dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
          <AlertOctagon className="h-10 w-10 text-rose-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">Failed to Synchronize Dashboard</h3>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------
  // MANAGER VIEW
  // ------------------------------------
  if (user?.role === "MANAGER" && data) {
    return (
      <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Manager Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Real-time submission tracker, blocker identification, and AI project support.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </button>
            <Link
              to="/ai-assistant"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/10 hover:opacity-95 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ask AI Assistant</span>
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 text-primary-600 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Logs</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5 font-mono">{data.metrics.totalReports}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Submitted</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5 font-mono">{data.metrics.submittedReports}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Draft/Pending</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5 font-mono">{data.metrics.pendingReports}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertOctagon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Late Reports</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5 font-mono">{data.metrics.lateReports}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm col-span-2 lg:col-span-1 flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Blockers Raised</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5 font-mono">{data.metrics.openBlockers}</p>
            </div>
          </div>
        </div>

        {/* Charts & Graphs */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Chart 1: Line Chart (Tasks Completed over time) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="font-display text-sm font-bold text-slate-900">Task Completion Over Time</h3>
              <p className="text-xs text-slate-400 mt-0.5">Sum of finished deliverables logged per week ending.</p>
            </div>
            <div className="h-64 w-full">
              {data.charts.tasksCompletedOverTime.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs font-semibold text-slate-400">
                  No submissions yet to plot task progression.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.charts.tasksCompletedOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                    <Legend iconType="circle" fontSize={12} />
                    <Line type="monotone" dataKey="tasks" name="Completed Tasks" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 2: Pie Chart (Reports by Project) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="font-display text-sm font-bold text-slate-900">Reports by Project</h3>
              <p className="text-xs text-slate-400 mt-0.5">Distribution of reports among active developments.</p>
            </div>
            <div className="h-64 w-full flex items-center justify-center relative">
              {data.charts.reportsByProject.length === 0 ? (
                <div className="text-xs font-semibold text-slate-400">No project logs available.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.charts.reportsByProject}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {data.charts.reportsByProject.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                    <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 3: Bar Chart (Submission statuses) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-1 flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="font-display text-sm font-bold text-slate-900">Submission Proportions</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ratio of drafted logs versus fully submitted reports.</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.submissionStatus} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="status" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="count" name="Reports" radius={[8, 8, 0, 0]}>
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Activity className="h-4.5 w-4.5 text-primary-600" />
                  Recent Team Activity
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">Live Stream</span>
              </div>
              <div className="flow-root">
                <ul className="-mb-8">
                  {data.activityFeed.map((activity, idx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {idx !== data.activityFeed.length - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100" aria-hidden="true" />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white ${
                              activity.type === "submit" ? "bg-emerald-50 text-emerald-600" :
                              activity.type === "register" ? "bg-blue-50 text-primary-600" :
                              "bg-amber-50 text-amber-600"
                            }`}>
                              {activity.type === "submit" ? <CheckCircle className="h-4 w-4" /> :
                               activity.type === "register" ? <Users className="h-4 w-4" /> :
                               <Clock className="h-4 w-4" />}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5 flex justify-between items-start gap-4">
                            <p className="text-xs text-slate-600 leading-normal">
                              <strong className="font-semibold text-slate-900">{activity.user}</strong> {activity.text}
                            </p>
                            <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                              {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4 mt-4 text-center">
              <Link to="/reports" className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700">
                <span>View all system reports</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------
  // TEAM MEMBER VIEW
  // ------------------------------------
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hello, {user?.fullName}!
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track your logs, prepare weekly summaries, and collaborate seamlessly with your manager Sarah Connor.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/reports/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 hover:bg-primary-700 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Weekly Report</span>
          </Link>
          <Link
            to="/ai-assistant"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            <Sparkles className="h-4 w-4 text-primary-500" />
            <span>Ask AI</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 text-primary-600 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Reports</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5 font-mono">{myReportsCount.total}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Submitted</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5 font-mono">{myReportsCount.submitted}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">My Drafts</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5 font-mono">{myReportsCount.drafts}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hours Logged</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5 font-mono">{myReportsCount.hours}h</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Actionable Drafts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900">Your Action Items</h3>
            <p className="text-xs text-slate-400 mt-0.5">Edit pending reports to submit them for approval.</p>
          </div>

          {/* Render list of drafts or show helper state */}
          {myReportsCount.drafts === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50">
              <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2.5" />
              <h4 className="text-xs font-bold text-slate-900">All submissions are up to date!</h4>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                No draft logs pending. You can log a new report whenever you have fresh updates.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pending Drafts</p>
              {/* Note: List drafts dynamically */}
              <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden bg-slate-50/20">
                <Link
                  to="/reports"
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900">Weekly Progress (Draft state)</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Please go to the reports tab to edit and submit your weekly drafts.
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* AI quick suggestions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
              <h3 className="font-display text-sm font-bold text-slate-900">AI Assistant Prompt Ideas</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Get direct analysis of logged data. Sarah Connor has full access to query the whole team. Here are queries you can run in your assistant page:
            </p>
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 font-medium">
                "What did I focus on in Project Alpha last week?"
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 font-medium">
                "Summarize my hours worked compared to John Doe."
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 font-medium">
                "What blockers were listed across Project Beta?"
              </div>
            </div>
          </div>
          <Link
            to="/ai-assistant"
            className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:opacity-95 transition-opacity text-center"
          >
            Go to AI Room
          </Link>
        </div>
      </div>
    </div>
  );
}
