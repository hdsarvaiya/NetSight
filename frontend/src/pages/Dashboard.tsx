import { useRef, useEffect, useState } from "react";
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
  Monitor
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import api from "../services/api";

const monthlyTraffic = [
  { month: "Jan", value: 850 },
  { month: "Feb", value: 720 },
  { month: "Mar", value: 920 },
  { month: "Apr", value: 880 },
  { month: "May", value: 950 },
  { month: "Jun", value: 890 },
  { month: "Jul", value: 1000 },
  { month: "Aug", value: 920 },
  { month: "Sep", value: 880 },
  { month: "Oct", value: 950 },
  { month: "Nov", value: 1020 },
  { month: "Dec", value: 980 },
];

const latencyTrend = [
  { time: "00:00", value: 12 },
  { time: "04:00", value: 15 },
  { time: "08:00", value: 23 },
  { time: "12:00", value: 19 },
  { time: "16:00", value: 28 },
  { time: "20:00", value: 16 },
  { time: "23:59", value: 14 },
];

const uptimeTrend = [
  { time: "00:00", value: 98 },
  { time: "04:00", value: 99 },
  { time: "08:00", value: 97 },
  { time: "12:00", value: 99.5 },
  { time: "16:00", value: 99.8 },
  { time: "20:00", value: 99.9 },
  { time: "23:59", value: 99.7 },
];

const regionData = [
  { name: "North America", percentage: 87 },
  { name: "Europe", percentage: 76 },
  { name: "Asia Pacific", percentage: 94 },
  { name: "South America", percentage: 61 },
  { name: "Middle East", percentage: 82 },
  { name: "Africa", percentage: 54 },
];

export function Dashboard() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stats, setStats] = useState<any>({
    total: 0,
    healthy: 0,
    warning: 0,
    critical: 0,
    down: 0
  });
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [healthRes, alertsRes] = await Promise.all([
          api.get('/metrics/health'),
          api.get('/alerts/active')
        ]);

        if (healthRes.data?.stats) {
          setStats(healthRes.data.stats);
        }
        if (Array.isArray(alertsRes.data)) {
          setActiveAlerts(alertsRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const deviceDistribution = [
    { name: "Healthy", value: stats.healthy, color: "#22c55e" },
    { name: "Warning", value: stats.warning, color: "#f59e0b" },
    { name: "Critical/Down", value: stats.critical + stats.down, color: "#ef4444" },
  ];

  // Draw network topology map (simplified/static for now as topology API returns graph data)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ... (Canvas drawing logic kept largely same but could use real topologyNodes if fetched)
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    // ... (rest of canvas setup)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Define topology nodes (simplified version)
    const topologyNodes = [
      { id: 'edge', x: width * 0.5, y: height * 0.15, name: 'Edge Router', type: 'router', status: 'healthy' },
      // ... (keeping static nodes for visual demo unless we fetch topology)
      { id: 'dist', x: width * 0.5, y: height * 0.4, name: 'Dist. Switch', type: 'switch', status: 'healthy' },
      { id: 'core-a', x: width * 0.3, y: height * 0.65, name: 'Core A', type: 'router', status: 'healthy' },
      { id: 'core-b', x: width * 0.7, y: height * 0.65, name: 'Core B', type: 'router', status: 'warning' },
      { id: 'server-1', x: width * 0.2, y: height * 0.85, name: 'Server 1', type: 'server', status: 'healthy' },
      { id: 'server-2', x: width * 0.4, y: height * 0.85, name: 'Server 2', type: 'server', status: 'healthy' },
      { id: 'server-3', x: width * 0.6, y: height * 0.85, name: 'Server 3', type: 'server', status: 'warning' },
      { id: 'server-4', x: width * 0.8, y: height * 0.85, name: 'Server 4', type: 'server', status: 'healthy' },
    ];
    // ... (rest of draw logic)
    const links = [
      { source: 'edge', target: 'dist' },
      { source: 'dist', target: 'core-a' },
      { source: 'dist', target: 'core-b' },
      { source: 'core-a', target: 'server-1' },
      { source: 'core-a', target: 'server-2' },
      { source: 'core-b', target: 'server-3' },
      { source: 'core-b', target: 'server-4' },
    ];

    links.forEach(link => {
      const sourceNode = topologyNodes.find(n => n.id === link.source);
      const targetNode = topologyNodes.find(n => n.id === link.target);

      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.strokeStyle = 'rgba(100, 150, 200, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    topologyNodes.forEach(node => {
      // Node circle background
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.type === 'router' ? 14 : node.type === 'switch' ? 12 : 10, 0, Math.PI * 2);

      const bgColor = node.status === 'healthy' ? '#10b981' :
        node.status === 'warning' ? '#f59e0b' : '#ef4444';
      ctx.fillStyle = bgColor + '33';
      ctx.fill();
      ctx.strokeStyle = bgColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Icon representation (simplified)
      ctx.fillStyle = bgColor;
      ctx.font = node.type === 'router' ? '12px Inter' : '10px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const icon = node.type === 'router' ? '⚡' : node.type === 'switch' ? '⚙' : '▪';
      ctx.fillText(icon, node.x, node.y);

      // Node label
      ctx.fillStyle = '#9ca3af';
      ctx.font = '9px Inter';
      ctx.textBaseline = 'top';
      ctx.fillText(node.name, node.x, node.y + (node.type === 'router' ? 18 : node.type === 'switch' ? 16 : 14));
    });
  }, []);

  return (
    <div className="p-6 bg-[#0a0a0a]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white mb-1">Network Overview</h1>
        <p className="text-gray-400">Real-time monitoring and analytics</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Devices"
          value={stats.total.toString()}
          change={loading ? "Loading..." : `${stats.healthy} healthy`}
          trend="up"
          icon={<RouterIcon className="w-5 h-5 text-[#d4af37]" />}
        />
        <StatCard
          title="Network Health"
          value={stats.critical > 0 ? "Critical" : stats.warning > 0 ? "Warning" : "Healthy"}
          change={stats.down > 0 ? `${stats.down} devices down` : "All systems operational"}
          trend={stats.critical > 0 || stats.down > 0 ? "down" : "up"}
          icon={<Wifi className="w-5 h-5 text-green-500" />}
        />
        <StatCard
          title="Avg Latency"
          value="18ms"
          change="-12% improvement"
          trend="down"
          icon={<Activity className="w-5 h-5 text-[#d4af37]" />}
        />
        <StatCard
          title="Active Alerts"
          value={activeAlerts.length.toString()}
          change={`${activeAlerts.filter(a => a.severity === 'CRITICAL').length} critical`}
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
              <h3 className="text-white mb-1">Global Network Map</h3>
              <p className="text-sm text-gray-400">Geographic distribution of network nodes</p>
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

          {/* Map Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 text-center">
              <div className="text-2xl font-semibold text-[#d4af37] mb-1">{stats.total}</div>
              <div className="text-xs text-gray-400">Total Devices</div>
            </div>
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 text-center">
              <div className="text-2xl font-semibold text-[#d4af37] mb-1">{stats.healthy}</div>
              <div className="text-xs text-gray-400">Healthy</div>
            </div>
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 text-center">
              <div className="text-2xl font-semibold text-[#d4af37] mb-1">{stats.critical + stats.warning}</div>
              <div className="text-xs text-gray-400">Issues</div>
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
            {activeAlerts.length === 0 ? (
              <div className="text-gray-500 text-sm text-center py-4">No active alerts</div>
            ) : (
              activeAlerts.slice(0, 5).map((alert) => (
                <div key={alert._id} className="p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg hover:border-[#d4af37]/30 cursor-pointer transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${alert.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'
                      }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white mb-0.5">{alert.message}</div>
                      <div className="text-xs text-gray-400 mb-1">Device ID: {alert.deviceId}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Charts Row - Latency & Performance Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Latency Chart */}
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
          <div className="mb-4">
            <h3 className="text-white mb-1">Latency</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-white">$ 8,000</span>
              <span className="inline-flex items-center gap-1 text-sm text-green-500">
                <TrendingDown className="w-4 h-4" />
                12%
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={latencyTrend}>
              <defs>
                <linearGradient id="latencyGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="time" stroke="#6b7280" style={{ fontSize: '11px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                labelStyle={{ color: '#ffffff' }}
                itemStyle={{ color: '#d4af37' }}
              />
              <Area type="monotone" dataKey="value" stroke="#4ade80" fill="url(#latencyGold)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Chart */}
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
          <div className="mb-4">
            <h3 className="text-white mb-1">Performance</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-white">$ 5,000</span>
              <span className="inline-flex items-center gap-1 text-sm text-green-500">
                <TrendingUp className="w-4 h-4" />
                8%
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={uptimeTrend}>
              <defs>
                <linearGradient id="uptimeGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="time" stroke="#6b7280" style={{ fontSize: '11px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                labelStyle={{ color: '#ffffff' }}
              />
              <Area type="monotone" dataKey="value" stroke="#60a5fa" fill="url(#uptimeGold)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Region Performance */}
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
          <h3 className="text-white mb-4">Performance by Region</h3>
          <div className="space-y-3">
            {regionData.map((region, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">{region.name}</span>
                  <span className="text-sm text-white font-medium">{region.percentage}%</span>
                </div>
                <div className="w-full bg-[#0a0a0a] rounded-full h-2">
                  <div
                    className="bg-[#d4af37] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${region.percentage}%` }}
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
                  {deviceDistribution.map((entry, index) => (
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
            {deviceDistribution.map((item, index) => (
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
              icon={<NetworkIcon className="w-5 h-5 text-[#60a5fa]" />}
              title="Total Distance"
              value="713 km"
              bgColor="bg-[#60a5fa]/10"
            />
            <MetricRow
              icon={<ArrowUp className="w-5 h-5 text-[#d4af37]" />}
              title="Return Trips"
              value="9 trips"
              bgColor="bg-[#d4af37]/10"
            />
            <MetricRow
              icon={<ArrowDown className="w-5 h-5 text-[#4ade80]" />}
              title="One-Way Trips"
              value="8 trips"
              bgColor="bg-[#4ade80]/10"
            />
            <MetricRow
              icon={<Server className="w-5 h-5 text-[#a855f7]" />}
              title="Bandwidth Usage"
              value="1.2 TB"
              bgColor="bg-[#a855f7]/10"
            />
          </div>
        </div>
      </div>

      {/* Traffic by Month - Full Width at Bottom */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white mb-1">Traffic By Month</h3>
            <p className="text-sm text-gray-400">Monthly network traffic overview</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-white">920 GB</div>
            <div className="text-sm text-gray-400">Avg per month</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyTraffic}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
              labelStyle={{ color: '#ffffff' }}
              itemStyle={{ color: '#d4af37' }}
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