import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.js";
import ProtectedRoute from "./components/ProtectedRoute.js";
import RoleGuard from "./components/RoleGuard.js";
import Navbar from "./components/Navbar.js";
import Sidebar from "./components/Sidebar.js";
import Footer from "./components/Footer.js";

// Pages
import LandingPage from "./pages/LandingPage.js";
import Login from "./pages/Login.js";
import Register from "./pages/Register.js";
import Dashboard from "./pages/Dashboard.js";
import ReportsPage from "./pages/ReportsPage.js";
import CreateReportPage from "./pages/CreateReportPage.js";
import EditReportPage from "./pages/EditReportPage.js";
import ProjectsPage from "./pages/ProjectsPage.js";
import ProfilePage from "./pages/ProfilePage.js";
import AIAssistant from "./pages/AIAssistant.js";
import UnauthorizedPage from "./pages/UnauthorizedPage.js";
import NotFoundPage from "./pages/NotFoundPage.js";

// Main layout wrapper for authenticated routes
function MainLayout() {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex flex-row">
        {isAuthenticated && <Sidebar />}
        <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-4rem)] flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

// Redirect authenticated users trying to access login/register
function UnauthenticatedRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public & Landing Pages */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            
            {/* Guest Only Routes (Login/Register) */}
            <Route element={<UnauthenticatedRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Protected Routes (All roles) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/new" element={<CreateReportPage />} />
              <Route path="/reports/edit/:id" element={<EditReportPage />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Manager Only Routes */}
              <Route element={<RoleGuard allowedRoles={["MANAGER"]} />}>
                <Route path="/projects" element={<ProjectsPage />} />
              </Route>
            </Route>

            {/* Error Pages */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
