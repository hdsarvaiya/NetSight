import { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Router as RouterIcon,
  TrendingUp,
  TrendingDown,
  Clock,
  Wifi,
  Server,
  Network as NetworkIcon,
  ArrowUp,
  ArrowDown,
  Monitor,
  Loader2,
  RefreshCw
} from "lucide-react";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

import API_BASE from "../config/api";

function getAuthHeaders(): Record<string, string> {
  try {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      const token = parsed?.token || parsed?.tokens?.accessToken;
      if (token) {
        return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      }
    }
  } catch { }
  return { "Content-Type": "application/json" };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatUptime(seconds: number): string {
  if (!seconds) return "N/A";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  avgLatency: number;
  uptimePercent: number;
  activeAlerts: number;
  criticalAlerts: number;
  totalTrafficIn: number;
  totalTrafficOut: number;
  avgCpu: number;
  avgMemory: number;
}

interface MonitoredDevice {
  _id: string;
  name: string;
  ip: string;
  type: string;
  vendor: string;
  status: string;
  latency: number;
  packetLoss: number;
  cpuUsage: number;
  memoryUsage: number;
  trafficIn: number;
  trafficOut: number;
  uptime: number;
  lastSeen: string;
  isGateway: boolean;
}

interface AlertItem {
  _id: string;
  device: string;
  deviceIp: string;
  message: string;
  severity: string;
  time: string;
  acknowledged: boolean;
}

export function Dashboard() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [devices, setDevices] = useState<MonitoredDevice[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [latencyTrend, setLatencyTrend] = useState<any[]>([]);
  const [performanceTrend, setPerformanceTrend] = useState<any[]>([]);
  const [deviceDistribution, setDeviceDistribution] = useState<any[]>([]);
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const [statsRes, devicesRes, alertsRes, latencyRes, perfRes, distRes, trafficRes] =
        await Promise.all([
          fetch(`${API_BASE}/monitoring/dashboard`, { headers }),
          fetch(`${API_BASE}/monitoring/devices`, { headers }),
          fetch(`${API_BASE}/monitoring/alerts`, { headers }),
          fetch(`${API_BASE}/monitoring/latency-trend`, { headers }),
          fetch(`${API_BASE}/monitoring/performance-trend`, { headers }),
          fetch(`${API_BASE}/monitoring/device-distribution`, { headers }),
          fetch(`${API_BASE}/monitoring/traffic`, { headers }),
        ]);

      const [statsData, devicesData, alertsData, latencyData, perfData, distData, trafficD] =
        await Promise.all([
          statsRes.json(), devicesRes.json(), alertsRes.json(),
          latencyRes.json(), perfRes.json(), distRes.json(), trafficRes.json(),
        ]);

      if (statsData.success) setStats(statsData.stats);
      if (devicesData.success) setDevices(devicesData.devices);
      if (alertsData.success) setAlerts(alertsData.alerts);
      if (latencyData.success) setLatencyTrend(latencyData.trend);
      if (perfData.success) setPerformanceTrend(perfData.trend);
      if (distData.success) setDeviceDistribution(distData.distribution);
      if (trafficD.success) setTrafficData(trafficD.traffic);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + auto-refresh every 3 seconds (matches backend poll interval)
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Draw network topology based on real devices
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || devices.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Create topology from real devices
    const gateway = devices.find(d => d.isGateway);
    const others = devices.filter(d => !d.isGateway);

    const nodes: { x: number; y: number; name: string; type: string; status: string }[] = [];

    if (gateway) {
      nodes.push({
        x: width * 0.5, y: height * 0.18,
        name: gateway.name, type: 'router',
        status: gateway.status === 'Online' ? 'healthy' : 'critical'
      });
    }

    others.forEach((device, i) => {
      const total = others.length;
      const x = total === 1 ? width * 0.5 : width * (0.2 + (0.6 * i / (total - 1)));
      const typeMap: Record<string, string> = { 'Router': 'router', 'Switch': 'switch', 'Server': 'server' };
      nodes.push({
        x, y: height * 0.7,
        name: device.name,
        type: typeMap[device.type] || 'server',
        status: device.status === 'Online' ? 'healthy' : 'critical'
      });
    });

    // Draw links from gateway to all others
    if (gateway && others.length > 0) {
      for (let i = 1; i < nodes.length; i++) {
        ctx.beginPath();
        ctx.moveTo(nodes[0].x, nodes[0].y);
        ctx.lineTo(nodes[i].x, nodes[i].y);
        const linkColor = nodes[i].status === 'healthy' ? 'rgba(100, 200, 150, 0.3)' : 'rgba(255, 100, 100, 0.3)';
        ctx.strokeStyle = linkColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Draw nodes
    nodes.forEach(node => {
      ctx.beginPath();
      const radius = node.type === 'router' ? 14 : 10;
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

      const bgColor = node.status === 'healthy' ? '#10b981' : '#ef4444';
      ctx.fillStyle = bgColor + '33';
      ctx.fill();
      ctx.strokeStyle = bgColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = bgColor;
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const icon = node.type === 'router' ? '⚡' : node.type === 'switch' ? '⚙' : '▪';
      ctx.fillText(icon, node.x, node.y);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '9px Inter';
      ctx.textBaseline = 'top';
      ctx.fillText(node.name, node.x, node.y + radius + 4);
    });
  }, [devices]);

  if (loading && !stats) {
    return (
      <div className="p-6 bg-[#0a0a0a] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#0a0a0a]">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-white mb-1">Network Overview</h1>
          <p className="text-gray-400">Real-time monitoring and analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live — updated {lastUpdate.toLocaleTimeString()}
          </div>
          <button
            onClick={fetchData}
            className="p-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-gray-400 hover:text-[#d4af37] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Devices"
          value={String(stats?.totalDevices || 0)}
          change={`${stats?.onlineDevices || 0} online, ${stats?.offlineDevices || 0} offline`}
          trend="up"
          icon={<RouterIcon className="w-5 h-5 text-[#d4af37]" />}
        />
        <StatCard
          title="Network Uptime"
          value={`${stats?.uptimePercent || 0}%`}
          change={`${stats?.onlineDevices || 0}/${stats?.totalDevices || 0} devices up`}
          trend={stats?.uptimePercent === 100 ? "up" : "neutral"}
          icon={<Wifi className="w-5 h-5 text-green-500" />}
        />
        <StatCard
          title="Avg Latency"
          value={`${stats?.avgLatency || 0}ms`}
          change={`CPU: ${stats?.avgCpu || 0}% | RAM: ${stats?.avgMemory || 0}%`}
          trend={stats?.avgLatency && stats.avgLatency < 50 ? "down" : "neutral"}
          icon={<Activity className="w-5 h-5 text-[#d4af37]" />}
        />
        <StatCard
          title="Active Alerts"
          value={String(stats?.activeAlerts || 0)}
          change={`${stats?.criticalAlerts || 0} critical`}
          trend="neutral"
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Network Map */}
        <div className="lg:col-span-2 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white mb-1">Network Topology</h3>
              <p className="text-sm text-gray-400">
                {devices.length} devices · {devices.filter(d => d.status === 'Online').length} online
              </p>
            </div>
            <button
              onClick={() => navigate('/app/topology')}
              className="text-sm text-[#d4af37] hover:text-[#f59e0b] font-medium"
            >
              View Details →
            </button>
          </div>
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6 h-64">
            <canvas ref={canvasRef} width={800} height={220} className="w-full h-full" />
          </div>

          {/* Device Health Summary */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 text-center">
              <div className="text-2xl font-semibold text-green-500 mb-1">{stats?.onlineDevices || 0}</div>
              <div className="text-xs text-gray-400">Online</div>
            </div>
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 text-center">
              <div className="text-2xl font-semibold text-red-500 mb-1">{stats?.offlineDevices || 0}</div>
              <div className="text-xs text-gray-400">Offline</div>
            </div>
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 text-center">
              <div className="text-2xl font-semibold text-[#d4af37] mb-1">{stats?.avgLatency || 0}ms</div>
              <div className="text-xs text-gray-400">Avg Latency</div>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white">Recent Alerts</h3>
            <button
              onClick={() => navigate('/app/alerts')}
              className="text-sm text-[#d4af37] hover:text-[#f59e0b] font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No active alerts</p>
              </div>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <div key={alert._id} className="p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg hover:border-[#d4af37]/30 cursor-pointer transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${alert.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white mb-0.5">{alert.device}</div>
                      <div className="text-xs text-gray-400 mb-1">{alert.message}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {alert.time}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Latency Chart */}
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
          <div className="mb-4">
            <h3 className="text-white mb-1">Latency Trend</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-white">{stats?.avgLatency || 0}ms</span>
              <span className="inline-flex items-center gap-1 text-sm text-green-500">
                <Activity className="w-4 h-4" />
                avg
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={latencyTrend}>
              <defs>
                <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="time" stroke="#6b7280" style={{ fontSize: '11px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} unit="ms" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                labelStyle={{ color: '#ffffff' }}
                itemStyle={{ color: '#4ade80' }}
                formatter={(val: number) => [`${val}ms`, 'Latency']}
              />
              <Area type="monotone" dataKey="value" stroke="#4ade80" fill="url(#latencyGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Uptime/Performance Chart */}
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
          <div className="mb-4">
            <h3 className="text-white mb-1">Uptime</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-white">{stats?.uptimePercent || 0}%</span>
              <span className="inline-flex items-center gap-1 text-sm text-green-500">
                <TrendingUp className="w-4 h-4" />
                availability
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={performanceTrend}>
              <defs>
                <linearGradient id="uptimeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="time" stroke="#6b7280" style={{ fontSize: '11px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                labelStyle={{ color: '#ffffff' }}
                formatter={(val: number) => [`${val}%`, 'Uptime']}
              />
              <Area type="monotone" dataKey="value" stroke="#60a5fa" fill="url(#uptimeGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Per-Device Health */}
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
          <h3 className="text-white mb-4">Device Health</h3>
          <div className="space-y-3">
            {devices.map((device) => (
              <div key={device._id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${device.status === 'Online' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-400 truncate max-w-[120px]">{device.name}</span>
                  </div>
                  <span className="text-sm text-white font-medium">{device.latency}ms</span>
                </div>
                <div className="w-full bg-[#0a0a0a] rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${device.status === 'Offline' ? 'bg-red-500' :
                      device.latency < 30 ? 'bg-green-500' :
                        device.latency < 80 ? 'bg-[#d4af37]' : 'bg-red-500'
                      }`}
                    style={{ width: `${Math.min(100, device.status === 'Online' ? Math.max(10, 100 - device.latency) : 5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Distribution */}
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
          <h3 className="text-white mb-4">Device Types</h3>
          <div className="flex items-center justify-center mb-4">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={deviceDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {deviceDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                  labelStyle={{ color: '#ffffff' }}
                  itemStyle={{ color: '#d4af37' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {deviceDistribution.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-400">{item.name}</span>
                </div>
                <span className="text-white font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
          <h3 className="text-white mb-4">Quick Metrics</h3>
          <div className="space-y-4">
            <MetricRow
              icon={<ArrowDown className="w-5 h-5 text-[#60a5fa]" />}
              title="Traffic In"
              value={formatBytes(stats?.totalTrafficIn || 0)}
              bgColor="bg-[#60a5fa]/10"
            />
            <MetricRow
              icon={<ArrowUp className="w-5 h-5 text-[#d4af37]" />}
              title="Traffic Out"
              value={formatBytes(stats?.totalTrafficOut || 0)}
              bgColor="bg-[#d4af37]/10"
            />
            <MetricRow
              icon={<Monitor className="w-5 h-5 text-[#4ade80]" />}
              title="Avg CPU"
              value={`${stats?.avgCpu || 0}%`}
              bgColor="bg-[#4ade80]/10"
            />
            <MetricRow
              icon={<Server className="w-5 h-5 text-[#a855f7]" />}
              title="Avg Memory"
              value={`${stats?.avgMemory || 0}%`}
              bgColor="bg-[#a855f7]/10"
            />
          </div>
        </div>
      </div>

      {/* Traffic Chart - Full Width */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white mb-1">Traffic Overview</h3>
            <p className="text-sm text-gray-400">Hourly bandwidth usage</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-white">{formatBytes((stats?.totalTrafficIn || 0) + (stats?.totalTrafficOut || 0))}</div>
            <div className="text-sm text-gray-400">Current total</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={trafficData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="period" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} unit=" MB" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
              labelStyle={{ color: '#ffffff' }}
              itemStyle={{ color: '#d4af37' }}
              formatter={(val: number) => [`${val} MB`, 'Traffic']}
              cursor={{ fill: 'rgba(212, 175, 55, 0.1)' }}
            />
            <Bar dataKey="value" fill="#d4af37" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, trend, icon }: {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">{title}</span>
        {icon}
      </div>
      <div className="text-3xl font-semibold text-white mb-2">{value}</div>
      <div className={`text-sm flex items-center gap-1 ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-green-500' : 'text-gray-400'
        }`}>
        {trend === 'up' && <TrendingUp className="w-4 h-4" />}
        {trend === 'down' && <TrendingDown className="w-4 h-4" />}
        {change}
      </div>
    </div>
  );
}

function MetricRow({ icon, title, value, bgColor }: {
  icon: React.ReactNode;
  title: string;
  value: string;
  bgColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-lg border border-[#2a2a2a] p-3 flex items-center gap-3`}>
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <div className="text-xs text-gray-400 mb-0.5">{title}</div>
        <div className="text-lg font-semibold text-white">{value}</div>
      </div>
    </div>
  );
}