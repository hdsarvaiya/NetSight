import { useState } from "react";
import { Search, Download, Calendar, Filter } from "lucide-react";

const auditLogs = [
  { id: 1, timestamp: "2026-01-23 14:45:22", user: "John Doe", action: "Modified alert threshold", target: "Settings", result: "Success", ip: "192.168.1.100" },
  { id: 2, timestamp: "2026-01-23 14:32:15", user: "Jane Smith", action: "Added new device", target: "WiFi AP-3", result: "Success", ip: "192.168.1.105" },
  { id: 3, timestamp: "2026-01-23 14:18:44", user: "Mike Johnson", action: "Acknowledged alert", target: "Alert #1247", result: "Success", ip: "192.168.1.110" },
  { id: 4, timestamp: "2026-01-23 13:55:31", user: "John Doe", action: "Updated user role", target: "Sarah Williams", result: "Success", ip: "192.168.1.100" },
  { id: 5, timestamp: "2026-01-23 13:22:10", user: "System", action: "Automatic device scan", target: "Network", result: "Success", ip: "127.0.0.1" },
  { id: 6, timestamp: "2026-01-23 12:45:18", user: "Jane Smith", action: "Deleted device", target: "Old Printer", result: "Success", ip: "192.168.1.105" },
  { id: 7, timestamp: "2026-01-23 12:15:55", user: "Tom Brown", action: "Login attempt", target: "Authentication", result: "Failed", ip: "192.168.1.150" },
  { id: 8, timestamp: "2026-01-23 11:30:22", user: "System", action: "Backup completed", target: "Database", result: "Success", ip: "127.0.0.1" },
  { id: 9, timestamp: "2026-01-23 11:10:15", user: "John Doe", action: "Changed scan interval", target: "Settings", result: "Success", ip: "192.168.1.100" },
  { id: 10, timestamp: "2026-01-23 10:55:42", user: "Sarah Williams", action: "Viewed device details", target: "Web Server", result: "Success", ip: "192.168.1.120" },
  { id: 11, timestamp: "2026-01-23 10:20:33", user: "Mike Johnson", action: "Exported analytics report", target: "Reports", result: "Success", ip: "192.168.1.110" },
  { id: 12, timestamp: "2026-01-23 09:45:18", user: "System", action: "Health check completed", target: "All Devices", result: "Success", ip: "127.0.0.1" },
];

export function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUser = userFilter === "all" || log.user === userFilter;
    const matchesResult = resultFilter === "all" || log.result === resultFilter;
    return matchesSearch && matchesUser && matchesResult;
  });

  const uniqueUsers = Array.from(new Set(auditLogs.map(log => log.user)));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white mb-1">Audit Logs</h1>
        <p className="text-gray-400">Track all system actions and user activities</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard label="Total Events" value={auditLogs.length} />
        <StatCard label="Today" value={auditLogs.length} />
        <StatCard label="Failed Actions" value={auditLogs.filter(l => l.result === "Failed").length} />
        <StatCard label="System Events" value={auditLogs.filter(l => l.user === "System").length} />
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
                placeholder="Search by action, target, or user..."
                className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent text-white placeholder-gray-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm text-white"
            >
              <option value="all">All Users</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>

            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm text-white"
            >
              <option value="all">All Results</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
            </select>

            <button className="px-4 py-2 border border-[#2a2a2a] rounded-lg hover:bg-[#2a2a2a] transition-colors flex items-center gap-2 text-sm font-medium text-gray-300">
              <Calendar className="w-4 h-4" />
              Date Range
            </button>

            <button className="px-4 py-2 bg-[#d4af37] text-black rounded-lg hover:bg-[#f59e0b] transition-colors flex items-center gap-2 text-sm font-medium">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Timestamp</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Action</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Target</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Result</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-[#2a2a2a] hover:bg-[#2a2a2a]/50">
                  <td className="py-3 px-4 text-sm text-gray-400 font-mono text-xs">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4">
                    <UserBadge user={log.user} />
                  </td>
                  <td className="py-3 px-4 text-sm text-white">{log.action}</td>
                  <td className="py-3 px-4 text-sm text-gray-300 font-medium">{log.target}</td>
                  <td className="py-3 px-4">
                    <ResultBadge result={log.result} />
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-400 font-mono text-xs">
                    {log.ip}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-[#2a2a2a] px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {filteredLogs.length} of {auditLogs.length} events
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-[#2a2a2a] rounded text-sm hover:bg-[#2a2a2a] text-gray-300">
              Previous
            </button>
            <button className="px-3 py-1 bg-[#d4af37] text-black rounded text-sm">
              1
            </button>
            <button className="px-3 py-1 border border-[#2a2a2a] rounded text-sm hover:bg-[#2a2a2a] text-gray-300">
              2
            </button>
            <button className="px-3 py-1 border border-[#2a2a2a] rounded text-sm hover:bg-[#2a2a2a] text-gray-300">
              3
            </button>
            <button className="px-3 py-1 border border-[#2a2a2a] rounded text-sm hover:bg-[#2a2a2a] text-gray-300">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Retention Policy */}
      <div className="mt-6 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-[#d4af37]/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Filter className="w-4 h-4 text-[#d4af37]" />
          </div>
          <div>
            <h4 className="font-medium text-[#d4af37] mb-1">Audit Log Retention Policy</h4>
            <p className="text-sm text-gray-300">
              Audit logs are retained for 90 days. Critical security events are retained for 1 year. 
              Export logs regularly for long-term archival.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
      <div className="text-sm text-gray-400 mb-2">{label}</div>
      <div className="text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}

function UserBadge({ user }: { user: string }) {
  const isSystem = user === "System";
  
  return (
    <div className="flex items-center gap-2">
      {isSystem ? (
        <div className="w-7 h-7 bg-[#2a2a2a] rounded-full flex items-center justify-center">
          <span className="text-xs text-gray-400">⚙️</span>
        </div>
      ) : (
        <div className="w-7 h-7 bg-gradient-to-br from-[#d4af37] to-[#f59e0b] rounded-full flex items-center justify-center text-black text-xs font-medium">
          {user.split(' ').map(n => n[0]).join('')}
        </div>
      )}
      <span className="text-sm font-medium text-white">{user}</span>
    </div>
  );
}

function ResultBadge({ result }: { result: string }) {
  if (result === "Success") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
        <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
        Success
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
      <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
      Failed
    </span>
  );
}