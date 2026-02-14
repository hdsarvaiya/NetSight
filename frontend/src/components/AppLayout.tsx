import { Outlet, useNavigate, useLocation } from "react-router";
import { 
  Network, 
  LayoutDashboard, 
  Router, 
  BarChart3, 
  TrendingUp, 
  Bell, 
  Users, 
  Settings, 
  FileText,
  Menu,
  X,
  Search,
  ChevronDown,
  GitBranch,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { path: "/app", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: "/app/topology", label: "Topology", icon: <GitBranch className="w-5 h-5" /> },
    { path: "/app/devices", label: "Devices", icon: <Router className="w-5 h-5" /> },
    { path: "/app/analytics", label: "Analytics", icon: <BarChart3 className="w-5 h-5" /> },
    { path: "/app/prediction", label: "Prediction", icon: <TrendingUp className="w-5 h-5" /> },
    { path: "/app/alerts", label: "Alerts", icon: <Bell className="w-5 h-5" /> },
    { path: "/app/users", label: "Users", icon: <Users className="w-5 h-5" /> },
    { path: "/app/settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
    { path: "/app/audit", label: "Audit Logs", icon: <FileText className="w-5 h-5" /> },
  ];

  const isActive = (path: string) => {
    if (path === "/app") {
      return location.pathname === "/app";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar */}
      <aside className={`bg-[#1a1a1a] border-r border-[#2a2a2a] flex-shrink-0 transition-all duration-300 ${
        sidebarOpen ? (collapsed ? 'w-16' : 'w-64') : 'w-0 -ml-64'
      } lg:ml-0 ${collapsed ? 'lg:w-16' : 'lg:w-64'}`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 border-b border-[#2a2a2a] flex items-center justify-between px-4">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#d4af37] to-[#f59e0b] rounded-lg flex items-center justify-center">
                  <Network className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-white">NetSight</span>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`p-1.5 rounded-lg hover:bg-[#0a0a0a] transition-colors text-gray-400 hover:text-[#d4af37] ${collapsed ? 'mx-auto' : ''}`}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6">
            <div className="px-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20'
                      : 'text-gray-400 hover:bg-[#242424] hover:text-gray-200'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!collapsed && item.label}
                </button>
              ))}
            </div>
          </nav>

          {/* User Profile */}
          {!collapsed && (
            <div className="border-t border-[#2a2a2a] p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-[#d4af37] to-[#f59e0b] rounded-full flex items-center justify-center text-white font-medium">
                  JD
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">John Doe</div>
                  <div className="text-xs text-gray-500">Admin</div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          )}
          {collapsed && (
            <div className="border-t border-[#2a2a2a] p-4 flex justify-center">
              <div className="w-9 h-9 bg-gradient-to-br from-[#d4af37] to-[#f59e0b] rounded-full flex items-center justify-center text-white font-medium" title="John Doe">
                JD
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <header className="h-16 bg-[#1a1a1a] border-b border-[#2a2a2a] flex items-center px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden mr-4 p-2 hover:bg-[#242424] rounded-lg text-gray-400"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Search */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search devices, alerts, logs..."
                className="w-full pl-10 pr-4 py-2 bg-[#242424] border border-[#2a2a2a] text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3 ml-6">
            <button className="relative p-2 hover:bg-[#242424] rounded-lg text-gray-400">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}