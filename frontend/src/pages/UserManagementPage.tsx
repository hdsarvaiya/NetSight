import { useState } from "react";
import { Search, Plus, MoreVertical, Shield, User, Eye } from "lucide-react";

const users = [
  { id: 1, name: "John Doe", email: "john@acme.com", role: "Admin", status: "active", lastActive: "Just now", createdAt: "2025-06-01" },
  { id: 2, name: "Jane Smith", email: "jane@acme.com", role: "Engineer", status: "active", lastActive: "5 min ago", createdAt: "2025-06-15" },
  { id: 3, name: "Mike Johnson", email: "mike@acme.com", role: "Engineer", status: "active", lastActive: "2 hours ago", createdAt: "2025-07-01" },
  { id: 4, name: "Sarah Williams", email: "sarah@acme.com", role: "Viewer", status: "active", lastActive: "1 day ago", createdAt: "2025-08-10" },
  { id: 5, name: "Tom Brown", email: "tom@acme.com", role: "Engineer", status: "inactive", lastActive: "7 days ago", createdAt: "2025-09-05" },
  { id: 6, name: "Emily Davis", email: "emily@acme.com", role: "Viewer", status: "active", lastActive: "3 hours ago", createdAt: "2025-10-12" },
];

export function UserManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showAddUser, setShowAddUser] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admin: users.filter(u => u.role === "Admin").length,
    engineer: users.filter(u => u.role === "Engineer").length,
    viewer: users.filter(u => u.role === "Viewer").length
  };

  return (
    <div className="p-6 bg-[#0a0a0a] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white mb-1">User & Role Management</h1>
        <p className="text-gray-400">Manage team members and their access permissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard label="Total Users" value={stats.total} icon={<User className="w-5 h-5 text-[#d4af37]" />} />
        <StatCard label="Admins" value={stats.admin} icon={<Shield className="w-5 h-5 text-purple-500" />} />
        <StatCard label="Engineers" value={stats.engineer} icon={<User className="w-5 h-5 text-green-500" />} />
        <StatCard label="Viewers" value={stats.viewer} icon={<Eye className="w-5 h-5 text-gray-400" />} />
      </div>

      {/* Role Permissions Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
        <h4 className="font-medium text-blue-400 mb-2">Role Permissions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium text-blue-300 mb-1">Admin</div>
            <div className="text-gray-400">Full system access, user management, settings configuration</div>
          </div>
          <div>
            <div className="font-medium text-blue-300 mb-1">Engineer</div>
            <div className="text-gray-400">Device management, alerts, analytics, no user management</div>
          </div>
          <div>
            <div className="font-medium text-blue-300 mb-1">Viewer</div>
            <div className="text-gray-400">Read-only access to dashboard, devices, and analytics</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
            >
              <option value="all">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Engineer">Engineer</option>
              <option value="Viewer">Viewer</option>
            </select>

            <button 
              onClick={() => setShowAddUser(true)}
              className="px-4 py-2 bg-[#d4af37] text-black rounded-lg hover:bg-[#f59e0b] transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Last Active</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Joined</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-[#2a2a2a] hover:bg-[#0a0a0a]/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-[#d4af37] to-[#f59e0b] rounded-full flex items-center justify-center text-black text-sm font-medium">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="text-sm font-medium text-white">{user.name}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-400">{user.email}</td>
                  <td className="py-3 px-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-400">{user.lastActive}</td>
                  <td className="py-3 px-4 text-sm text-gray-400">{user.createdAt}</td>
                  <td className="py-3 px-4">
                    <button className="p-1 hover:bg-[#2a2a2a] rounded text-gray-400 hover:text-white">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-[#2a2a2a] px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {filteredUsers.length} of {users.length} users
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-[#2a2a2a] text-gray-400 rounded text-sm hover:bg-[#0a0a0a]">
              Previous
            </button>
            <button className="px-3 py-1 bg-[#d4af37] text-black rounded text-sm font-medium">
              1
            </button>
            <button className="px-3 py-1 border border-[#2a2a2a] text-gray-400 rounded text-sm hover:bg-[#0a0a0a]">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowAddUser(false)}>
          <div 
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Add New User</h2>
                <p className="text-sm text-gray-400">Invite a team member to NetSight</p>
              </div>
              <button 
                onClick={() => setShowAddUser(false)}
                className="p-2 hover:bg-[#2a2a2a] rounded-lg text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="john@acme.com"
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Role</label>
                <select className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37]">
                  <option>Viewer</option>
                  <option>Engineer</option>
                  <option>Admin</option>
                </select>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300">
                  An invitation email will be sent to the user with setup instructions.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 px-4 py-2.5 border border-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#0a0a0a] transition-colors font-medium"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2.5 bg-[#d4af37] text-black rounded-lg hover:bg-[#f59e0b] transition-colors font-medium">
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles = {
    Admin: "bg-purple-500/10 text-purple-500 border-purple-500/30",
    Engineer: "bg-green-500/10 text-green-500 border-green-500/30",
    Viewer: "bg-gray-500/10 text-gray-400 border-gray-500/30"
  };

  const icons = {
    Admin: <Shield className="w-3 h-3" />,
    Engineer: <User className="w-3 h-3" />,
    Viewer: <Eye className="w-3 h-3" />
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[role as keyof typeof styles]}`}>
      {icons[role as keyof typeof icons]}
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/30">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/30">
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
      Inactive
    </span>
  );
}