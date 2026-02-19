import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Download,
  Plus,
  MoreVertical,
  Router,
  Server,
  Laptop,
  Smartphone,
  Printer,
  Network as NetworkIcon,
  ChevronDown
} from "lucide-react";

const devices = [
  { id: "dev-001", name: "Core Router", ip: "192.168.1.1", type: "Router", status: "healthy", uptime: "99.98%", lastSeen: "Just now" },
  { id: "dev-002", name: "Main Switch", ip: "192.168.1.10", type: "Switch", status: "healthy", uptime: "99.95%", lastSeen: "2 min ago" },
  { id: "dev-003", name: "Web Server", ip: "192.168.1.15", type: "Server", status: "warning", uptime: "98.50%", lastSeen: "Just now" },
  { id: "dev-004", name: "Database Server", ip: "192.168.1.20", type: "Server", status: "healthy", uptime: "99.99%", lastSeen: "1 min ago" },
  { id: "dev-005", name: "Dev Workstation", ip: "192.168.1.50", type: "Workstation", status: "healthy", uptime: "97.80%", lastSeen: "5 min ago" },
  { id: "dev-006", name: "Admin Workstation", ip: "192.168.1.51", type: "Workstation", status: "healthy", uptime: "98.20%", lastSeen: "3 min ago" },
  { id: "dev-007", name: "WiFi AP-1", ip: "192.168.1.100", type: "Access Point", status: "critical", uptime: "95.20%", lastSeen: "15 min ago" },
  { id: "dev-008", name: "WiFi AP-2", ip: "192.168.1.101", type: "Access Point", status: "healthy", uptime: "99.50%", lastSeen: "Just now" },
  { id: "dev-009", name: "Office Printer", ip: "192.168.1.200", type: "Printer", status: "healthy", uptime: "96.70%", lastSeen: "8 min ago" },
  { id: "dev-010", name: "Backup Server", ip: "192.168.1.25", type: "Server", status: "healthy", uptime: "99.92%", lastSeen: "1 min ago" },
];

export function DevicesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.ip.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || device.status === statusFilter;
    const matchesType = typeFilter === "all" || device.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="p-6 bg-[#0a0a0a] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white mb-1">Devices</h1>
        <p className="text-gray-400">Manage and monitor all network devices</p>
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
                placeholder="Search by name or IP address..."
                className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
            >
              <option value="all">All Status</option>
              <option value="healthy">Healthy</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
            >
              <option value="all">All Types</option>
              <option value="Router">Router</option>
              <option value="Switch">Switch</option>
              <option value="Server">Server</option>
              <option value="Workstation">Workstation</option>
              <option value="Access Point">Access Point</option>
              <option value="Printer">Printer</option>
            </select>

            <button className="px-4 py-2 border border-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#0a0a0a] transition-colors flex items-center gap-2 text-sm font-medium">
              <Download className="w-4 h-4" />
              Export
            </button>

            <button className="px-4 py-2 bg-[#d4af37] text-black rounded-lg hover:bg-[#f59e0b] transition-colors flex items-center gap-2 text-sm font-medium">
              <Plus className="w-4 h-4" />
              Add Device
            </button>
          </div>
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Device</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">IP Address</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Uptime</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Last Seen</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device) => (
                <tr
                  key={device.id}
                  onClick={() => navigate(`/app/devices/${device.id}`)}
                  className="border-b border-[#2a2a2a] hover:bg-[#0a0a0a]/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(device.type)}
                      <div>
                        <div className="text-sm font-medium text-white">{device.name}</div>
                        <div className="text-xs text-gray-500">{device.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-400 font-mono">{device.ip}</td>
                  <td className="py-3 px-4 text-sm text-white">{device.type}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={device.status} />
                  </td>
                  <td className="py-3 px-4 text-sm text-white">{device.uptime}</td>
                  <td className="py-3 px-4 text-sm text-gray-400">{device.lastSeen}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-1 hover:bg-[#2a2a2a] rounded text-gray-400 hover:text-white"
                    >
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
            Showing {filteredDevices.length} of {devices.length} devices
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
    </div>
  );
}

function getDeviceIcon(type: string) {
  const iconClass = "w-9 h-9 rounded-lg flex items-center justify-center";

  switch (type) {
    case "Router":
      return (
        <div className={`${iconClass} bg-[#d4af37]/10 border border-[#d4af37]/20`}>
          <Router className="w-5 h-5 text-[#d4af37]" />
        </div>
      );
    case "Switch":
      return (
        <div className={`${iconClass} bg-blue-500/10 border border-blue-500/20`}>
          <NetworkIcon className="w-5 h-5 text-blue-500" />
        </div>
      );
    case "Server":
      return (
        <div className={`${iconClass} bg-green-500/10 border border-green-500/20`}>
          <Server className="w-5 h-5 text-green-500" />
        </div>
      );
    case "Workstation":
      return (
        <div className={`${iconClass} bg-purple-500/10 border border-purple-500/20`}>
          <Laptop className="w-5 h-5 text-purple-500" />
        </div>
      );
    case "Access Point":
      return (
        <div className={`${iconClass} bg-amber-500/10 border border-amber-500/20`}>
          <NetworkIcon className="w-5 h-5 text-amber-500" />
        </div>
      );
    case "Printer":
      return (
        <div className={`${iconClass} bg-gray-500/10 border border-gray-500/20`}>
          <Printer className="w-5 h-5 text-gray-400" />
        </div>
      );
    default:
      return (
        <div className={`${iconClass} bg-gray-500/10 border border-gray-500/20`}>
          <Router className="w-5 h-5 text-gray-400" />
        </div>
      );
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    healthy: "bg-green-500/10 text-green-500 border-green-500/30",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    critical: "bg-red-500/10 text-red-500 border-red-500/30"
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'healthy' ? 'bg-green-500' : status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
        }`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}