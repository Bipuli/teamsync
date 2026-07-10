import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Bot,
  User,
  LogOut,
  ChevronRight,
} from "lucide-react";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      roles: ["MEMBER", "MANAGER"],
    },
    {
      name: user.role === "MANAGER" ? "All Weekly Reports" : "My Weekly Reports",
      path: "/reports",
      icon: FileText,
      roles: ["MEMBER", "MANAGER"],
    },
    {
      name: "Project Management",
      path: "/projects",
      icon: FolderOpen,
      roles: ["MANAGER"],
    },
    {
      name: "AI Team Assistant",
      path: "/ai-assistant",
      icon: Bot,
      roles: ["MEMBER", "MANAGER"],
      badge: "Beta",
    },
    {
      name: "My Profile",
      path: "/profile",
      icon: User,
      roles: ["MEMBER", "MANAGER"],
    },
  ];

  const filteredItems = menuItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white h-[calc(100vh-4rem)] sticky top-16 p-4 justify-between shrink-0">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Main Navigation
          </p>
          <ul className="mt-3 space-y-1">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                      isActive
                        ? "bg-primary-50 text-primary-600 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`h-4.5 w-4.5 transition-colors ${
                          isActive
                            ? "text-primary-600"
                            : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-700">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <LogOut className="h-4.5 w-4.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
