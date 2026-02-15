import { useState } from "react";
import { Calendar, Download, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const latencyTrendData = [
  { date: "Jan 17", avg: 14, p95: 28, p99: 42 },
  { date: "Jan 18", avg: 16, p95: 31, p99: 45 },
  { date: "Jan 19", avg: 13, p95: 26, p99: 39 },
  { date: "Jan 20", avg: 18, p95: 34, p99: 48 },
  { date: "Jan 21", avg: 15, p95: 29, p99: 43 },
  { date: "Jan 22", avg: 17, p95: 32, p99: 46 },
  { date: "Jan 23", avg: 14, p95: 27, p99: 41 },
];

const packetLossTrendData = [
  { date: "Jan 17", loss: 0.2 },
  { date: "Jan 18", loss: 0.3 },
  { date: "Jan 19", loss: 0.1 },
  { date: "Jan 20", loss: 0.5 },
  { date: "Jan 21", loss: 0.3 },
  { date: "Jan 22", loss: 0.6 },
  { date: "Jan 23", loss: 0.2 },
];

const bandwidthData = [
  { hour: "00:00", inbound: 120, outbound: 80 },
  { hour: "03:00", inbound: 90, outbound: 60 },
  { hour: "06:00", inbound: 200, outbound: 140 },
  { hour: "09:00", inbound: 450, outbound: 310 },
  { hour: "12:00", inbound: 520, outbound: 380 },
  { hour: "15:00", inbound: 480, outbound: 350 },
  { hour: "18:00", inbound: 380, outbound: 280 },
  { hour: "21:00", inbound: 240, outbound: 170 },
];

const devicePerformanceData = [
  { device: "Core Router", avgLatency: 12, packetLoss: 0.1, uptime: 99.98 },
  { device: "Main Switch", avgLatency: 14, packetLoss: 0.2, uptime: 99.95 },
  { device: "Web Server", avgLatency: 18, packetLoss: 0.3, uptime: 98.50 },
  { device: "DB Server", avgLatency: 15, packetLoss: 0.1, uptime: 99.99 },
  { device: "WiFi AP-1", avgLatency: 28, packetLoss: 0.8, uptime: 95.20 },
];

export function NetworkAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d");

  return (
    <div className="p-6 bg-[#0a0a0a] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white mb-1">Network Analytics</h1>
            <p className="text-gray-400">Performance insights and trends</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button className="px-4 py-2 border border-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#1a1a1a] transition-colors flex items-center gap-2 text-sm font-medium">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <MetricCard
          label="Avg Network Latency"
          value="15.2ms"
          change="-8.3%"
          trend="down"
          subtitle="vs last period"
        />
        <MetricCard
          label="Total Bandwidth"
          value="2.4 TB"
          change="+12.5%"
          trend="up"
          subtitle="this week"
        />
        <MetricCard
          label="Packet Loss Rate"
          value="0.3%"
          change="-0.2%"
          trend="down"
          subtitle="7-day average"
        />
        <MetricCard
          label="Network Uptime"
          value="99.94%"
          change="+0.04%"
          trend="up"
          subtitle="last 30 days"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Latency Trends */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <h3 className="text-white mb-4">Latency Trends</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={latencyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                labelStyle={{ color: '#ffffff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="avg" stroke="#3b82f6" strokeWidth={2} name="Average" />
              <Line type="monotone" dataKey="p95" stroke="#8b5cf6" strokeWidth={2} name="P95" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={2} name="P99" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Packet Loss */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <h3 className="text-white mb-4">Packet Loss Rate</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={packetLossTrendData}>
              <defs>
                <linearGradient id="packetLossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                labelStyle={{ color: '#ffffff' }}
              />
              <Area type="monotone" dataKey="loss" stroke="#ef4444" fill="url(#packetLossGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bandwidth Usage */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-6">
        <h3 className="text-white mb-4">Bandwidth Usage (Last 24 Hours)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={bandwidthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="hour" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
              labelStyle={{ color: '#ffffff' }}
              itemStyle={{ color: '#d4af37' }}
              cursor={{ fill: 'rgba(212, 175, 55, 0.1)' }}
            />
            <Legend 
              wrapperStyle={{ color: '#9ca3af' }}
              iconType="circle"
            />
            <Bar dataKey="inbound" fill="#10b981" name="Inbound (Mbps)" />
            <Bar dataKey="outbound" fill="#d4af37" name="Outbound (Mbps)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Insights */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-6">
        <h3 className="text-white mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InsightCard
            icon={<TrendingUp className="w-5 h-5 text-green-500" />}
            title="Network Performance"
            description="Overall latency improved by 8.3% compared to last week"
            sentiment="positive"
          />
          <InsightCard
            icon={<Activity className="w-5 h-5 text-blue-500" />}
            title="Peak Usage Time"
            description="Highest bandwidth usage occurs between 12:00-15:00 daily"
            sentiment="neutral"
          />
          <InsightCard
            icon={<TrendingDown className="w-5 h-5 text-amber-500" />}
            title="WiFi AP-1 Issue"
            description="Packet loss rate increased by 0.5% - requires attention"
            sentiment="warning"
          />
        </div>
      </div>

      {/* Device Performance Table */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[#2a2a2a]">
          <h3 className="text-white">Device Performance Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Device</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Avg Latency</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Packet Loss</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Uptime</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Health</th>
              </tr>
            </thead>
            <tbody>
              {devicePerformanceData.map((device, index) => (
                <tr key={index} className="border-b border-[#2a2a2a]">
                  <td className="py-3 px-4 text-sm font-medium text-white">{device.device}</td>
                  <td className="py-3 px-4 text-sm text-gray-300">{device.avgLatency}ms</td>
                  <td className="py-3 px-4 text-sm text-gray-300">{device.packetLoss}%</td>
                  <td className="py-3 px-4 text-sm text-gray-300">{device.uptime}%</td>
                  <td className="py-3 px-4">
                    <HealthBar uptime={device.uptime} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, change, trend, subtitle }: {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  subtitle: string;
}) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
      <div className="text-sm text-gray-400 mb-2">{label}</div>
      <div className="text-3xl font-semibold text-white mb-2">{value}</div>
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 text-sm font-medium ${
          trend === 'down' ? 'text-green-500' : 'text-blue-500'
        }`}>
          {trend === 'down' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
          {change}
        </span>
        <span className="text-sm text-gray-500">{subtitle}</span>
      </div>
    </div>
  );
}

function InsightCard({ icon, title, description, sentiment }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  sentiment: 'positive' | 'neutral' | 'warning';
}) {
  const colors = {
    positive: 'border-green-500/30 bg-green-500/10',
    neutral: 'border-blue-500/30 bg-blue-500/10',
    warning: 'border-amber-500/30 bg-amber-500/10'
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[sentiment]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="font-medium text-white">{title}</h4>
      </div>
      <p className="text-sm text-gray-300">{description}</p>
    </div>
  );
}

function HealthBar({ uptime }: { uptime: number }) {
  let color = 'bg-green-500';
  if (uptime < 98) color = 'bg-red-500';
  else if (uptime < 99) color = 'bg-amber-500';

  return (
    <div className="w-full bg-[#0a0a0a] rounded-full h-2">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${uptime}%` }} />
    </div>
  );
}