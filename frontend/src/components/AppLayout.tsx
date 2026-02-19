import { Outlet, useNavigate, useLocation } from "react-router-dom";
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
  ChevronRight,
  LogOut,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useState } from "react";

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

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

  const handleLogout = () => {
    localStorage.removeItem("user");
    // Also remove token if stored separately
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0a0a]">
      {/* Sidebar */}
      <aside className={`bg-[#1a1a1a] border-r border-[#2a2a2a] flex-shrink-0 relative transition-all duration-300 ${sidebarOpen ? (collapsed ? 'w-16' : 'w-64') : 'w-0 overflow-hidden'
        } lg:block ${collapsed ? 'lg:w-16' : 'lg:w-64'}`}>
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.path)
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

          {/* User Profile with Dropdown */}
          <div className="border-t border-[#2a2a2a] p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`flex items-center gap-3 w-full hover:bg-[#242424] rounded-lg p-2 transition-colors ${collapsed ? 'justify-center' : ''}`}>
                  <div className="w-9 h-9 bg-gradient-to-br from-[#d4af37] to-[#f59e0b] rounded-full flex items-center justify-center text-white font-medium shrink-0">
                    JD
                  </div>
                  {!collapsed && (
                    <>
                      <div className="text-left flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">John Doe</div>
                        <div className="text-xs text-gray-500">Admin</div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#1a1a1a] border-[#2a2a2a] text-white" side={collapsed ? "right" : "top"} align="end" sideOffset={10}>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                <DropdownMenuItem className="focus:bg-[#242424] focus:text-white cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-[#242424] focus:text-white cursor-pointer" onClick={() => navigate('/app/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                <DropdownMenuItem
                  className="focus:bg-red-500/10 focus:text-red-500 text-red-400 cursor-pointer"
                  onSelect={(e) => {
                    // Just set the state, no special timing needed for a custom React conditional render
                    // We can still add a tiny delay to allow the dropdown to close visually if we want,
                    // but it's not strictly required for a custom modal that sits on top.
                    // However, `onSelect` sometimes closes the dropdown immediately.
                    e.preventDefault(); // Keep dropdown open? No, we want it closed.
                    // Actually, for custom modal, we want the dropdown to CLOSE.
                    // So we do NOT call preventDefault().
                    // And we just set state.
                    setShowLogoutDialog(true);
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
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
        <main className="flex-1 overflow-y-auto p-0">
          <Outlet />
        </main>
      </div>

      {/* Custom Logout Confirmation Modal */}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-2">Are you sure you want to logout?</h3>
            <p className="text-gray-400 mb-6">You will be redirected to the login page.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-[#242424] hover:text-white transition-colors"
                autoFocus
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}