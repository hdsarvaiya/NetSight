import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Network, ArrowRight, ArrowLeft, Check, Loader2, Router, Server, Laptop, Smartphone } from "lucide-react";

const mockDevices = [
  { id: 1, ip: "192.168.1.1", mac: "00:1A:2B:3C:4D:5E", type: "Router", status: "Online", role: "Gateway" },
  { id: 2, ip: "192.168.1.10", mac: "00:1A:2B:3C:4D:5F", type: "Switch", status: "Online", role: "Core Switch" },
  { id: 3, ip: "192.168.1.15", mac: "00:1A:2B:3C:4D:60", type: "Server", status: "Online", role: "Web Server" },
  { id: 4, ip: "192.168.1.20", mac: "00:1A:2B:3C:4D:61", type: "Server", status: "Online", role: "Database Server" },
  { id: 5, ip: "192.168.1.50", mac: "00:1A:2B:3C:4D:62", type: "Workstation", status: "Online", role: "Dev Machine" },
  { id: 6, ip: "192.168.1.51", mac: "00:1A:2B:3C:4D:63", type: "Workstation", status: "Online", role: "Admin Workstation" },
  { id: 7, ip: "192.168.1.100", mac: "00:1A:2B:3C:4D:64", type: "Access Point", status: "Online", role: "WiFi AP-1" },
  { id: 8, ip: "192.168.1.200", mac: "00:1A:2B:3C:4D:65", type: "Printer", status: "Online", role: "Office Printer" },
];

export function SetupWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [scanning, setScanning] = useState(false);
  const [networkConfig, setNetworkConfig] = useState({
    interface: "eth0",
    ipRange: "192.168.1.0/24",
    scanMethod: "icmp"
  });
  const [devices, setDevices] = useState<typeof mockDevices>([]);
  const [excludedDevices, setExcludedDevices] = useState<Set<number>>(new Set());

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setDevices(mockDevices);
      setScanning(false);
      setCurrentStep(2);
    }, 2000);
  };

  const toggleExclude = (id: number) => {
    const newExcluded = new Set(excludedDevices);
    if (newExcluded.has(id)) {
      newExcluded.delete(id);
    } else {
      newExcluded.add(id);
    }
    setExcludedDevices(newExcluded);
  };

  const handleDeviceRoleChange = (id: number, role: string) => {
    setDevices(devices.map(d => d.id === id ? { ...d, role } : d));
  };

  // Simple topology visualization
  useEffect(() => {
    if (currentStep === 3 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const activeDevices = devices.filter(d => !excludedDevices.has(d.id));
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = 180;

      // Draw connections from gateway
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      activeDevices.forEach((device, i) => {
        if (i === 0) return; // Skip gateway itself
        const angle = (i / (activeDevices.length - 1)) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
      });

      // Draw devices
      activeDevices.forEach((device, i) => {
        let x, y;
        if (i === 0) {
          x = centerX;
          y = centerY;
        } else {
          const angle = (i / (activeDevices.length - 1)) * Math.PI * 2;
          x = centerX + Math.cos(angle) * radius;
          y = centerY + Math.sin(angle) * radius;
        }

        // Device circle
        ctx.fillStyle = i === 0 ? '#3b82f6' : '#10b981';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();

        // Device label
        ctx.fillStyle = '#1e293b';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(device.type, x, y + 35);
      });
    }
  }, [currentStep, devices, excludedDevices]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-semibold text-gray-900">NetSight</span>
            </div>
            <div className="text-sm text-gray-600">Setup Wizard</div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <StepIndicator number={1} label="Network Scan" active={currentStep === 1} completed={currentStep > 1} />
            <div className="flex-1 h-px bg-gray-300 mx-4" />
            <StepIndicator number={2} label="Device Discovery" active={currentStep === 2} completed={currentStep > 2} />
            <div className="flex-1 h-px bg-gray-300 mx-4" />
            <StepIndicator number={3} label="Topology Preview" active={currentStep === 3} completed={false} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {currentStep === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-gray-900 mb-2">Network Configuration</h2>
            <p className="text-gray-600 mb-8">Configure your network scanning parameters</p>

            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Network Interface
                </label>
                <select
                  value={networkConfig.interface}
                  onChange={(e) => setNetworkConfig({ ...networkConfig, interface: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="eth0">eth0 - Ethernet</option>
                  <option value="wlan0">wlan0 - Wireless</option>
                  <option value="en0">en0 - Primary Interface</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IP Range (CIDR Notation)
                </label>
                <input
                  type="text"
                  value={networkConfig.ipRange}
                  onChange={(e) => setNetworkConfig({ ...networkConfig, ipRange: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="192.168.1.0/24"
                />
                <p className="text-sm text-gray-500 mt-1">Example: 192.168.1.0/24 or 10.0.0.0/16</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scan Method
                </label>
                <div className="space-y-2">
                  {['icmp', 'arp', 'tcp'].map((method) => (
                    <label key={method} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="scanMethod"
                        value={method}
                        checked={networkConfig.scanMethod === method}
                        onChange={(e) => setNetworkConfig({ ...networkConfig, scanMethod: e.target.value })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900 capitalize">{method.toUpperCase()} Scan</div>
                        <div className="text-sm text-gray-500">
                          {method === 'icmp' && 'Fast ping-based discovery (recommended)'}
                          {method === 'arp' && 'Layer 2 discovery for local networks'}
                          {method === 'tcp' && 'Port-based discovery (slower but thorough)'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleScan}
                disabled={scanning}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Scanning Network...
                  </>
                ) : (
                  <>
                    Start Network Scan
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-gray-900 mb-2">Discovered Devices</h2>
            <p className="text-gray-600 mb-8">{devices.length} devices found on your network</p>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">IP Address</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">MAC Address</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Device Role</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => (
                    <tr
                      key={device.id}
                      className={`border-b border-gray-100 ${excludedDevices.has(device.id) ? 'opacity-50 bg-gray-50' : ''}`}
                    >
                      <td className="py-3 px-4 text-sm text-gray-900">{device.ip}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 font-mono text-xs">{device.mac}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {device.type === 'Router' && <Router className="w-4 h-4 text-blue-600" />}
                          {device.type === 'Server' && <Server className="w-4 h-4 text-green-600" />}
                          {device.type === 'Workstation' && <Laptop className="w-4 h-4 text-purple-600" />}
                          {device.type === 'Access Point' && <Network className="w-4 h-4 text-amber-600" />}
                          <span className="text-sm text-gray-900">{device.type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          {device.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={device.role}
                          onChange={(e) => handleDeviceRoleChange(device.id, e.target.value)}
                          disabled={excludedDevices.has(device.id)}
                          className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleExclude(device.id)}
                          className={`text-sm ${excludedDevices.has(device.id) ? 'text-blue-600' : 'text-red-600'} hover:underline`}
                        >
                          {excludedDevices.has(device.id) ? 'Include' : 'Exclude'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-gray-900 mb-2">Network Topology Preview</h2>
            <p className="text-gray-600 mb-8">Visual representation of your network infrastructure</p>

            <div className="border border-gray-200 rounded-lg p-8 bg-gray-50">
              <canvas
                ref={canvasRef}
                width={800}
                height={500}
                className="w-full"
              />
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> You can drag and rearrange devices in the topology view after setup is complete.
              </p>
            </div>

            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={() => navigate('/app')}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                Complete Setup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ number, label, active, completed }: { number: number; label: string; active: boolean; completed: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${completed ? 'bg-green-600 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
        {completed ? <Check className="w-5 h-5" /> : number}
      </div>
      <div>
        <div className={`text-sm font-medium ${active ? 'text-gray-900' : 'text-gray-500'}`}>
          Step {number}
        </div>
        <div className="text-xs text-gray-600">{label}</div>
      </div>
    </div>
  );
}
