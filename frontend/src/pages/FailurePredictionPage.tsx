import { Brain, AlertTriangle, TrendingUp, Clock, Shield } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const riskDevices = [
  { id: 1, name: "WiFi AP-1", ip: "192.168.1.100", riskScore: 87, prediction: "Failure likely in 3-5 days", factors: ["High packet loss", "Temperature spikes", "Age: 4.2 years"] },
  { id: 2, name: "Web Server", ip: "192.168.1.15", riskScore: 72, prediction: "Disk failure risk in 7-10 days", factors: ["Disk usage 82%", "I/O errors increasing", "High CPU usage"] },
  { id: 3, name: "Main Switch", ip: "192.168.1.10", riskScore: 45, prediction: "Monitor for port failures", factors: ["Port errors on 3/24 ports", "Age: 3.8 years"] },
  { id: 4, name: "Backup Server", ip: "192.168.1.25", riskScore: 38, prediction: "Low risk, routine monitoring", factors: ["Memory usage trending up", "Recent firmware update"] },
];

const predictionTimelineData = [
  { day: "Day 1", confidence: 92 },
  { day: "Day 2", confidence: 89 },
  { day: "Day 3", confidence: 85 },
  { day: "Day 5", confidence: 78 },
  { day: "Day 7", confidence: 71 },
  { day: "Day 10", confidence: 64 },
  { day: "Day 14", confidence: 55 },
];

const failureTypesData = [
  { type: "Hardware", count: 12, color: "#ef4444" },
  { type: "Network", count: 8, color: "#f59e0b" },
  { type: "Disk", count: 5, color: "#3b82f6" },
  { type: "Power", count: 3, color: "#8b5cf6" },
];

export function FailurePredictionPage() {
  return (
    <div className="p-6 bg-[#0a0a0a] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white mb-1">Failure Prediction</h1>
        <p className="text-gray-400">AI-powered predictive analytics for network devices</p>
      </div>

      {/* ML Model Info */}
      <div className="bg-gradient-to-r from-[#d4af37] to-[#f59e0b] rounded-xl p-6 mb-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-black/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-white mb-2">Prediction Model Status</h3>
            <p className="text-white/80 mb-4">
              Machine learning model trained on 500,000+ device hours. Last updated: January 23, 2026
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/10 rounded-lg p-3">
                <div className="text-sm text-white/80 mb-1">Model Accuracy</div>
                <div className="text-2xl font-semibold">94.3%</div>
              </div>
              <div className="bg-black/10 rounded-lg p-3">
                <div className="text-sm text-white/80 mb-1">Predictions Made</div>
                <div className="text-2xl font-semibold">1,247</div>
              </div>
              <div className="bg-black/10 rounded-lg p-3">
                <div className="text-sm text-white/80 mb-1">Failures Prevented</div>
                <div className="text-2xl font-semibold">342</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High Risk Devices */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white">High-Risk Devices</h3>
          <span className="text-sm text-gray-400">{riskDevices.length} devices requiring attention</span>
        </div>
        <div className="space-y-4">
          {riskDevices.map((device) => (
            <RiskDeviceCard key={device.id} device={device} />
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Prediction Confidence Timeline */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <h3 className="text-white mb-4">Prediction Confidence Timeline</h3>
          <p className="text-sm text-gray-400 mb-4">WiFi AP-1 failure probability over time</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={predictionTimelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                labelStyle={{ color: '#ffffff' }}
              />
              <Line type="monotone" dataKey="confidence" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Failure Types Distribution */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <h3 className="text-white mb-4">Predicted Failure Types</h3>
          <p className="text-sm text-gray-400 mb-4">Next 30 days forecast</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={failureTypesData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis dataKey="type" type="category" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                labelStyle={{ color: '#ffffff' }}
                itemStyle={{ color: '#d4af37' }}
                cursor={{ fill: 'rgba(212, 175, 55, 0.1)' }}
              />
              <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                {failureTypesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ML Insights */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
        <h3 className="text-white mb-4">AI-Generated Insights & Recommendations</h3>
        <div className="space-y-4">
          <InsightCard
            icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
            priority="Critical"
            title="WiFi AP-1 Immediate Action Required"
            description="Device shows 87% failure probability within 5 days. Recommend immediate replacement or maintenance."
            action="Schedule Maintenance"
            priorityColor="red"
          />
          <InsightCard
            icon={<TrendingUp className="w-5 h-5 text-amber-500" />}
            priority="High"
            title="Web Server Disk Capacity Alert"
            description="Disk usage at 82% combined with increasing I/O errors indicates potential disk failure in 7-10 days."
            action="Add Storage"
            priorityColor="amber"
          />
          <InsightCard
            icon={<Clock className="w-5 h-5 text-blue-500" />}
            priority="Medium"
            title="Main Switch Port Degradation"
            description="3 out of 24 ports showing error patterns. While not critical, monitor for failure escalation."
            action="Monitor Closely"
            priorityColor="blue"
          />
          <InsightCard
            icon={<Shield className="w-5 h-5 text-green-500" />}
            priority="Low"
            title="Network Health Stable"
            description="12 devices showing optimal performance with low failure risk. Continue routine monitoring."
            action="No Action Needed"
            priorityColor="green"
          />
        </div>
      </div>
    </div>
  );
}

function RiskDeviceCard({ device }: { device: typeof riskDevices[0] }) {
  const getRiskColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-500', badge: 'bg-red-600' };
    if (score >= 60) return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-500', badge: 'bg-amber-600' };
    return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500', badge: 'bg-blue-600' };
  };

  const colors = getRiskColor(device.riskScore);

  return (
    <div className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h4 className="font-medium text-white">{device.name}</h4>
            <span className="text-xs text-gray-400 font-mono">{device.ip}</span>
          </div>
          <p className={`text-sm font-medium ${colors.text}`}>{device.prediction}</p>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${colors.text}`}>{device.riskScore}</div>
          <div className="text-xs text-gray-400">Risk Score</div>
        </div>
      </div>
      
      <div className="mb-3">
        <div className="text-xs font-medium text-gray-400 mb-1.5">Risk Factors:</div>
        <div className="flex flex-wrap gap-2">
          {device.factors.map((factor, index) => (
            <span key={index} className="inline-flex items-center px-2 py-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-xs text-gray-300">
              {factor}
            </span>
          ))}
        </div>
      </div>

      {/* Risk Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Risk Level</span>
          <span>{device.riskScore}%</span>
        </div>
        <div className="w-full bg-[#0a0a0a] rounded-full h-2">
          <div className={`h-2 rounded-full ${colors.badge}`} style={{ width: `${device.riskScore}%` }} />
        </div>
      </div>

      <button className="w-full px-4 py-2 bg-[#d4af37] text-black rounded-lg hover:bg-[#f59e0b] transition-colors text-sm font-medium">
        View Detailed Analysis
      </button>
    </div>
  );
}

function InsightCard({ icon, priority, title, description, action, priorityColor }: {
  icon: React.ReactNode;
  priority: string;
  title: string;
  description: string;
  action: string;
  priorityColor: string;
}) {
  const colors = {
    red: 'bg-red-500/10 text-red-500 border-red-500/30',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    green: 'bg-green-500/10 text-green-500 border-green-500/30'
  };

  return (
    <div className="flex items-start gap-4 p-4 border border-[#2a2a2a] bg-[#0a0a0a]/50 rounded-lg">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colors[priorityColor as keyof typeof colors]}`}>
            {priority}
          </span>
          <h4 className="font-medium text-white">{title}</h4>
        </div>
        <p className="text-sm text-gray-400 mb-3">{description}</p>
        <button className="text-sm text-[#d4af37] hover:text-[#f59e0b] font-medium">
          {action} →
        </button>
      </div>
    </div>
  );
}