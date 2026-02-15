import { useState } from "react";
import { Search, Filter, CheckCircle, AlertTriangle, XCircle, Clock, Bell } from "lucide-react";

const alerts = [
  {
    id: 1,
    device: "WiFi AP-1",
    severity: "critical",
    message: "Connection drops detected - packet loss at 0.8%",
    timestamp: "2026-01-23 14:45:22",
    status: "active",
    acknowledged: false
  },
  {
    id: 2,
    device: "Web Server",
    severity: "warning",
    message: "CPU usage above 80% for 15 minutes",
    timestamp: "2026-01-23 14:32:15",
    status: "active",
    acknowledged: true
  },
  {
    id: 3,
    device: "Core Router",
    severity: "critical",
    message: "High memory usage - 92% utilization",
    timestamp: "2026-01-23 14:18:44",
    status: "resolved",
    acknowledged: true
  },
  {
    id: 4,
    device: "Database Server",
    severity: "warning",
    message: "Disk space below 20% - only 15% remaining",
    timestamp: "2026-01-23 13:55:31",
    status: "active",
    acknowledged: true
  },
  {
    id: 5,
    device: "Main Switch",
    severity: "info",
    message: "Firmware update available",
    timestamp: "2026-01-23 13:22:10",
    status: "active",
    acknowledged: false
  },
  {
    id: 6,
    device: "Backup Server",
    severity: "critical",
    message: "Backup job failed - unable to write to disk",
    timestamp: "2026-01-23 12:45:18",
    status: "active",
    acknowledged: true
  },
  {
    id: 7,
    device: "WiFi AP-2",
    severity: "warning",
    message: "High client count - 45 devices connected",
    timestamp: "2026-01-23 12:15:55",
    status: "resolved",
    acknowledged: true
  },
  {
    id: 8,
    device: "Office Printer",
    severity: "info",
    message: "Low toner level detected",
    timestamp: "2026-01-23 11:30:22",
    status: "active",
    acknowledged: false
  },
];

export function AlertsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAlert, setSelectedAlert] = useState<typeof alerts[0] | null>(null);

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const stats = {
    critical: alerts.filter(a => a.severity === "critical" && a.status === "active").length,
    warning: alerts.filter(a => a.severity === "warning" && a.status === "active").length,
    info: alerts.filter(a => a.severity === "info" && a.status === "active").length,
    total: alerts.filter(a => a.status === "active").length
  };

  return (
    <div className="p-6 bg-[#0a0a0a] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white mb-1">Alerts & Notifications</h1>
        <p className="text-gray-400">Monitor and manage network alerts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard
          label="Total Active"
          value={stats.total}
          icon={<Bell className="w-5 h-5 text-[#d4af37]" />}
          color="gold"
        />
        <StatCard
          label="Critical"
          value={stats.critical}
          icon={<XCircle className="w-5 h-5 text-red-500" />}
          color="red"
        />
        <StatCard
          label="Warning"
          value={stats.warning}
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
          color="amber"
        />
        <StatCard
          label="Info"
          value={stats.info}
          icon={<CheckCircle className="w-5 h-5 text-blue-500" />}
          color="blue"
        />
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
                placeholder="Search alerts by device or message..."
                className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>

            <button className="px-4 py-2 bg-[#d4af37] text-black rounded-lg hover:bg-[#f59e0b] transition-colors text-sm font-medium">
              Acknowledge All
            </button>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Severity</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Device</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Message</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Timestamp</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map((alert) => (
                <tr 
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className="border-b border-[#2a2a2a] hover:bg-[#0a0a0a]/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4">
                    <SeverityBadge severity={alert.severity} />
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-white">{alert.device}</td>
                  <td className="py-3 px-4 text-sm text-gray-300">{alert.message}</td>
                  <td className="py-3 px-4 text-sm text-gray-400 font-mono text-xs">{alert.timestamp}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={alert.status} acknowledged={alert.acknowledged} />
                  </td>
                  <td className="py-3 px-4">
                    {!alert.acknowledged && alert.status === "active" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="text-sm text-[#d4af37] hover:text-[#f59e0b] font-medium"
                      >
                        Acknowledge
                      </button>
                    )}
                    {alert.status === "active" && alert.acknowledged && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="text-sm text-green-500 hover:text-green-400 font-medium"
                      >
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-[#2a2a2a] px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {filteredAlerts.length} of {alerts.length} alerts
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-[#2a2a2a] text-gray-400 rounded text-sm hover:bg-[#0a0a0a]">
              Previous
            </button>
            <button className="px-3 py-1 bg-[#d4af37] text-black rounded text-sm font-medium">
              1
            </button>
            <button className="px-3 py-1 border border-[#2a2a2a] text-gray-400 rounded text-sm hover:bg-[#0a0a0a]">
              2
            </button>
            <button className="px-3 py-1 border border-[#2a2a2a] text-gray-400 rounded text-sm hover:bg-[#0a0a0a]">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Alert Details Drawer */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-end z-50" onClick={() => setSelectedAlert(null)}>
          <div 
            className="bg-[#1a1a1a] border-l border-[#2a2a2a] w-full max-w-md h-full overflow-y-auto p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Alert Details</h2>
                <SeverityBadge severity={selectedAlert.severity} />
              </div>
              <button 
                onClick={() => setSelectedAlert(null)}
                className="p-2 hover:bg-[#2a2a2a] rounded-lg text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <div className="text-sm text-gray-400 mb-1">Device</div>
                <div className="text-base font-medium text-white">{selectedAlert.device}</div>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-1">Message</div>
                <div className="text-base text-gray-300">{selectedAlert.message}</div>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-1">Timestamp</div>
                <div className="text-base font-mono text-gray-300">{selectedAlert.timestamp}</div>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-1">Status</div>
                <StatusBadge status={selectedAlert.status} acknowledged={selectedAlert.acknowledged} />
              </div>

              <div className="pt-4 border-t border-[#2a2a2a]">
                <h3 className="font-medium text-white mb-3">Recommended Actions</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-[#d4af37]">•</span>
                    <span>Investigate device logs for additional context</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#d4af37]">•</span>
                    <span>Check device connectivity and network status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#d4af37]">•</span>
                    <span>Review recent configuration changes</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                {!selectedAlert.acknowledged && (
                  <button className="flex-1 px-4 py-2.5 bg-[#d4af37] text-black rounded-lg hover:bg-[#f59e0b] transition-colors font-medium">
                    Acknowledge
                  </button>
                )}
                {selectedAlert.acknowledged && selectedAlert.status === "active" && (
                  <button className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                    Mark as Resolved
                  </button>
                )}
                <button className="px-4 py-2.5 border border-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#0a0a0a] transition-colors font-medium">
                  View Device
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
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

function SeverityBadge({ severity }: { severity: string }) {
  const styles = {
    critical: "bg-red-500/10 text-red-500 border-red-500/30",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    info: "bg-blue-500/10 text-blue-500 border-blue-500/30"
  };

  const icons = {
    critical: <XCircle className="w-3 h-3" />,
    warning: <AlertTriangle className="w-3 h-3" />,
    info: <CheckCircle className="w-3 h-3" />
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[severity as keyof typeof styles]}`}>
      {icons[severity as keyof typeof icons]}
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

function StatusBadge({ status, acknowledged }: { status: string; acknowledged: boolean }) {
  if (status === "resolved") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/30">
        <CheckCircle className="w-3 h-3" />
        Resolved
      </span>
    );
  }

  if (acknowledged) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/30">
        <Clock className="w-3 h-3" />
        Acknowledged
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/30">
      <Bell className="w-3 h-3" />
      New
    </span>
  );
}