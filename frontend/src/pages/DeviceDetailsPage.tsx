import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Activity,
  HardDrive,
  Cpu,
  Wifi,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  MoreVertical
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const latencyData = [
  { time: "00:00", value: 12 },
  { time: "02:00", value: 15 },
  { time: "04:00", value: 13 },
  { time: "06:00", value: 18 },
  { time: "08:00", value: 23 },
  { time: "10:00", value: 21 },
  { time: "12:00", value: 19 },
  { time: "14:00", value: 22 },
  { time: "16:00", value: 28 },
  { time: "18:00", value: 24 },
  { time: "20:00", value: 16 },
  { time: "22:00", value: 14 },
];

const bandwidthData = [
  { time: "00:00", in: 120, out: 80 },
  { time: "04:00", in: 150, out: 90 },
  { time: "08:00", in: 450, out: 280 },
  { time: "12:00", in: 380, out: 240 },
  { time: "16:00", in: 520, out: 340 },
  { time: "20:00", in: 280, out: 180 },
];

const logs = [
  { id: 1, timestamp: "2026-01-23 14:32:15", level: "warning", message: "High CPU usage detected (85%)" },
  { id: 2, timestamp: "2026-01-23 14:15:42", level: "info", message: "Device health check completed successfully" },
  { id: 3, timestamp: "2026-01-23 13:58:21", level: "error", message: "Failed ping response from 192.168.1.100" },
  { id: 4, timestamp: "2026-01-23 13:45:10", level: "info", message: "Configuration backup completed" },
  { id: 5, timestamp: "2026-01-23 13:30:05", level: "warning", message: "Disk space below 20%" },
  { id: 6, timestamp: "2026-01-23 13:12:33", level: "info", message: "Network scan initiated" },
];

export function DeviceDetailsPage() {
  const navigate = useNavigate();
  const { deviceId } = useParams();
  const [activeTab, setActiveTab] = useState<"overview" | "metrics" | "logs">("overview");

  return (
    <div className="p-6 bg-[#0a0a0a] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/app/devices")}
          className="flex items-center gap-2 text-gray-400 hover:text-[#d4af37] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Devices
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-white mb-1">Web Server</h1>
            <p className="text-gray-400">192.168.1.15 • Server • {deviceId}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Warning
            </span>
            <button className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <QuickStat
          label="Uptime"
          value="98.50%"
          trend="down"
          trendValue="1.5%"
          icon={<Clock className="w-5 h-5 text-[#d4af37]" />}
        />
        <QuickStat
          label="Latency"
          value="18ms"
          trend="up"
          trendValue="3ms"
          icon={<Activity className="w-5 h-5 text-green-500" />}
        />
        <QuickStat
          label="CPU Usage"
          value="85%"
          trend="up"
          trendValue="12%"
          icon={<Cpu className="w-5 h-5 text-amber-500" />}
        />
        <QuickStat
          label="Disk Space"
          value="18%"
          trend="down"
          trendValue="2%"
          icon={<HardDrive className="w-5 h-5 text-red-500" />}
        />
      </div>

      {/* Tabs */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
        <div className="border-b border-[#2a2a2a]">
          <div className="flex gap-1 p-1">
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              label="Overview"
            />
            <TabButton
              active={activeTab === "metrics"}
              onClick={() => setActiveTab("metrics")}
              label="Metrics"
            />
            <TabButton
              active={activeTab === "logs"}
              onClick={() => setActiveTab("logs")}
              label="Logs"
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Device Information */}
              <div>
                <h3 className="text-white mb-4">Device Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoRow label="Device Name" value="Web Server" />
                  <InfoRow label="IP Address" value="192.168.1.15" />
                  <InfoRow label="MAC Address" value="00:1A:2B:3C:4D:60" />
                  <InfoRow label="Device Type" value="Server" />
                  <InfoRow label="Operating System" value="Ubuntu 22.04 LTS" />
                  <InfoRow label="Location" value="Data Center - Rack 3" />
                  <InfoRow label="Last Reboot" value="2026-01-15 03:22:41" />
                  <InfoRow label="Monitoring Since" value="2025-06-01" />
                </div>
              </div>

              {/* Current Status */}
              <div>
                <h3 className="text-white mb-4">Current Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatusCard
                    label="CPU Usage"
                    value="85%"
                    status="warning"
                    description="Above normal threshold"
                  />
                  <StatusCard
                    label="Memory Usage"
                    value="67%"
                    status="healthy"
                    description="Within normal range"
                  />
                  <StatusCard
                    label="Disk Usage"
                    value="82%"
                    status="warning"
                    description="Approaching capacity"
                  />
                </div>
              </div>

              {/* Active Alerts */}
              <div>
                <h3 className="text-white mb-4">Active Alerts</h3>
                <div className="space-y-3">
                  <AlertItem
                    severity="warning"
                    message="CPU usage above 80% for 15 minutes"
                    time="5 minutes ago"
                  />
                  <AlertItem
                    severity="warning"
                    message="Disk space below 20%"
                    time="1 hour ago"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "metrics" && (
            <div className="space-y-6">
              {/* Latency Chart */}
              <div>
                <h3 className="text-white mb-4">Latency (Last 24 Hours)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={latencyData}>
                    <defs>
                      <linearGradient id="latencyGradient2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="time" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      labelStyle={{ color: '#ffffff' }}
                      itemStyle={{ color: '#d4af37' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#d4af37" fill="url(#latencyGradient2)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Bandwidth Chart */}
              <div>
                <h3 className="text-white mb-4">Bandwidth Usage (Last 24 Hours)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={bandwidthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="time" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      labelStyle={{ color: '#ffffff' }}
                      itemStyle={{ color: '#10b981' }}
                    />
                    <Line type="monotone" dataKey="in" stroke="#10b981" strokeWidth={2} name="Inbound" />
                    <Line type="monotone" dataKey="out" stroke="#d4af37" strokeWidth={2} name="Outbound" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Metric Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricSummary label="Avg Latency" value="18ms" change="-2ms" />
                <MetricSummary label="Peak Bandwidth" value="520 Mbps" change="+45 Mbps" />
                <MetricSummary label="Packet Loss" value="0.2%" change="-0.1%" />
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white">Event Logs</h3>
                <div className="flex items-center gap-3">
                  <select className="px-3 py-1.5 border border-[#2a2a2a] bg-[#0a0a0a] text-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#d4af37]">
                    <option>All Levels</option>
                    <option>Error</option>
                    <option>Warning</option>
                    <option>Info</option>
                  </select>
                  <button className="px-3 py-1.5 border border-[#2a2a2a] bg-[#0a0a0a] text-gray-300 rounded-lg text-sm hover:bg-[#1a1a1a] hover:border-[#d4af37] transition-colors">
                    Export Logs
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {logs.map((log) => (
                  <LogEntry key={log.id} log={log} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value, trend, trendValue, icon }: {
  label: string;
  value: string;
  trend: 'up' | 'down';
  trendValue: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-semibold text-white mb-1">{value}</div>
      <div className={`text-sm flex items-center gap-1 ${trend === 'down' ? 'text-green-500' : 'text-red-500'}`}>
        {trend === 'down' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
        {trendValue}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20' : 'text-gray-400 hover:text-[#d4af37] hover:bg-[#0a0a0a]'
        }`}
    >
      {label}
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function StatusCard({ label, value, status, description }: {
  label: string;
  value: string;
  status: 'healthy' | 'warning' | 'critical';
  description: string;
}) {
  const colors = {
    healthy: 'border-green-500/20 bg-green-500/10',
    warning: 'border-amber-500/20 bg-amber-500/10',
    critical: 'border-red-500/20 bg-red-500/10'
  };

  const textColors = {
    healthy: 'text-green-500',
    warning: 'text-amber-500',
    critical: 'text-red-500'
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[status]}`}>
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-semibold mb-1 ${textColors[status]}`}>{value}</div>
      <div className="text-xs text-gray-500">{description}</div>
    </div>
  );
}

function AlertItem({ severity, message, time }: { severity: string; message: string; time: string }) {
  return (
    <div className="flex items-start gap-3 p-3 border border-[#2a2a2a] bg-[#0a0a0a] rounded-lg hover:border-[#d4af37]/30 transition-colors">
      <AlertTriangle className={`w-5 h-5 mt-0.5 ${severity === 'warning' ? 'text-amber-500' : 'text-red-500'}`} />
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{message}</div>
        <div className="text-xs text-gray-500 mt-1">{time}</div>
      </div>
    </div>
  );
}

function MetricSummary({ label, value, change }: { label: string; value: string; change: string }) {
  return (
    <div className="p-4 border border-[#2a2a2a] bg-[#0a0a0a] rounded-lg">
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="text-xl font-semibold text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{change} from avg</div>
    </div>
  );
}

function LogEntry({ log }: { log: typeof logs[0] }) {
  const levelColors = {
    error: 'bg-red-500/10 text-red-500 border border-red-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    info: 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20'
  };

  return (
    <div className="flex items-start gap-3 p-3 border border-[#2a2a2a] bg-[#0a0a0a] rounded-lg hover:border-[#d4af37]/30 transition-colors">
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelColors[log.level as keyof typeof levelColors]}`}>
        {log.level.toUpperCase()}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white">{log.message}</div>
        <div className="text-xs text-gray-500 mt-0.5 font-mono">{log.timestamp}</div>
      </div>
    </div>
  );
}
