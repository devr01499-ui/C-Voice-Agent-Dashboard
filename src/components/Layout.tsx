import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Megaphone, 
  Table, 
  FileText, 
  CreditCard, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronRight,
  Users,
  Activity
} from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const userMenuItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Campaigns", path: "/campaigns", icon: Megaphone },
  { name: "Google Sheet", path: "/sheet", icon: Table },
  { name: "Reports", path: "/reports", icon: FileText },
  { name: "Settings", path: "/settings", icon: Settings },
];

const adminMenuItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "All Users", path: "/users", icon: Users },
  { name: "All Campaigns", path: "/campaigns", icon: Megaphone },
  { name: "All Reports", path: "/reports", icon: FileText },
  { name: "System Logs", path: "/logs", icon: Activity },
  { name: "Settings", path: "/settings", icon: Settings },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { profile, signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const isAdmin = profile?.role === 'admin';
  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E5E5E5] transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-[#E5E5E5]">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">C</span>
              </div>
              <span className="font-bold text-xl tracking-tight">Clarity</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                    isActive 
                      ? "bg-black text-white" 
                      : "text-[#666666] hover:bg-[#F0F0F0] hover:text-black"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "group-hover:text-black")} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="ml-auto"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </motion.div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Profile & Sign Out */}
          <div className="p-4 border-t border-[#E5E5E5]">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[#F9F9F9] mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 border border-gray-300 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Settings className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{profile?.company_name || "Company"}</p>
                <p className="text-xs text-[#888888] truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-[#666666] hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-[#E5E5E5] px-4 flex items-center justify-between lg:px-8">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 lg:hidden text-[#666666] hover:bg-[#F0F0F0] rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 lg:flex-none">
            <h1 className="text-sm font-semibold text-[#888888] uppercase tracking-wider">
              {menuItems.find(i => i.path === location.pathname)?.name || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full border",
                isAdmin ? "text-purple-600 bg-purple-50 border-purple-100" : "text-green-600 bg-green-50 border-green-100"
              )}>
                {isAdmin ? "Admin Console" : "Active Client"}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
