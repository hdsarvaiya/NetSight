import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Network,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Router,
  Server,
  Laptop,
  Wifi,
  Shield,
  Printer,
  Monitor,
  Search,
  Pencil,
  X,
  AlertCircle,
} from "lucide-react";

interface ScannedDevice {
  ip: string;
  mac: string;
  type: string;
  vendor: string;
  status: string;
  name: string;
  hostname: string;
  openPorts: { port: number; service: string }[];
  isGateway: boolean;
  isSelf: boolean;
  excluded: boolean;
}

interface NetworkInterface {
  name: string;
  ip: string;
  netmask: string;
  cidr: string;
  isVirtual: boolean;
}

const API_BASE = "http://localhost:5000/api/v1";

function getAuthHeaders(): Record<string, string> {
  const userData = localStorage.getItem("user");
  if (!userData) return {};
  try {
    const parsed = JSON.parse(userData);
    const token = parsed?.tokens?.accessToken;
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {
    // ignore
  }
  return {};
}

const deviceIcons: Record<string, React.ReactNode> = {
  Router: <Router className="w-5 h-5" />,
  Switch: <Network className="w-5 h-5" />,
  Server: <Server className="w-5 h-5" />,
  Workstation: <Laptop className="w-5 h-5" />,
  "Access Point": <Wifi className="w-5 h-5" />,
  Firewall: <Shield className="w-5 h-5" />,
  Printer: <Printer className="w-5 h-5" />,
  Other: <Monitor className="w-5 h-5" />,
};

const deviceColors: Record<string, string> = {
  Router: "text-blue-400",
  Switch: "text-cyan-400",
  Server: "text-green-400",
  Workstation: "text-purple-400",
  "Access Point": "text-amber-400",
  Firewall: "text-red-400",
  Printer: "text-gray-400",
  Other: "text-gray-400",
};

export function SetupWizard() {
  const navigate = useNavigate();
  const location = useLocation();
  const isRescan = location.state?.isRescan || false;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [scanProgress, setScanProgress] = useState(0);
  const [networkInterfaces, setNetworkInterfaces] = useState<NetworkInterface[]>([]);
  const [loadingInterfaces, setLoadingInterfaces] = useState(true);
  const [networkConfig, setNetworkConfig] = useState({
    interface: "",
    ipRange: "",
    scanMethod: "icmp",
  });
  const [devices, setDevices] = useState<ScannedDevice[]>([]);
  const [editingDevice, setEditingDevice] = useState<number | null>(null);

  // Auto-detect network interfaces on mount
  useEffect(() => {
    const fetchInterfaces = async () => {
      try {
        const response = await fetch(`${API_BASE}/devices/interfaces`, {
          headers: getAuthHeaders(),
        });
        const data = await response.json();
        if (data.success && data.interfaces.length > 0) {
          setNetworkInterfaces(data.interfaces);
          // Auto-select first non-virtual interface
          const primary = data.interfaces.find((i: NetworkInterface) => !i.isVirtual) || data.interfaces[0];
          setNetworkConfig((prev) => ({
            ...prev,
            interface: primary.name,
            ipRange: primary.cidr,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch interfaces:', err);
      } finally {
        setLoadingInterfaces(false);
      }
    };
    fetchInterfaces();
  }, []);

  const handleScan = async () => {
    setScanning(true);
    setError("");
    setScanProgress(0);

    // Animate progress bar (real scans take 10-30s)
    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return prev + Math.random() * 5;
      });
    }, 500);

    try {
      const response = await fetch(`${API_BASE}/devices/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          ipRange: networkConfig.ipRange,
          scanMethod: networkConfig.scanMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Network scan failed");
      }

      clearInterval(progressInterval);
      setScanProgress(100);

      // Map the API response to our frontend format
      const scannedDevices: ScannedDevice[] = data.devices.map(
        (d: any) => ({
          ip: d.ip,
          mac: d.mac,
          type: d.type,
          vendor: d.vendor || "Unknown",
          status: d.status || "Online",
          name: d.hostname || "",
          hostname: d.hostname || "",
          openPorts: d.openPorts || [],
          isGateway: d.isGateway || false,
          isSelf: d.isSelf || false,
          excluded: false,
        })
      );

      setTimeout(() => {
        setDevices(scannedDevices);
        setScanning(false);
        setCurrentStep(2);
      }, 500);
    } catch (err: any) {
      clearInterval(progressInterval);
      setScanning(false);
      setScanProgress(0);
      setError(err.message || "Failed to scan network");
    }
  };

  const toggleExclude = (index: number) => {
    setDevices(
      devices.map((d, i) =>
        i === index ? { ...d, excluded: !d.excluded } : d
      )
    );
  };

  const handleDeviceNameChange = (index: number, name: string) => {
    setDevices(devices.map((d, i) => (i === index ? { ...d, name } : d)));
  };

  const activeDevices = devices.filter((d) => !d.excluded);
  const excludedCount = devices.filter((d) => d.excluded).length;

  const handleCompleteSetup = async () => {
    setSaving(true);
    setError("");

    try {
      const devicesToSave = activeDevices.map((d) => ({
        ip: d.ip,
        mac: d.mac,
        type: d.type,
        status: d.status,
        name: d.name,
        hostname: d.hostname,
        vendor: d.vendor,
        openPorts: d.openPorts,
        isGateway: d.isGateway,
      }));

      const response = await fetch(`${API_BASE}/devices/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ devices: devicesToSave }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save devices");
      }

      // Update local storage to reflect setup completion
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsed = JSON.parse(userData);
        parsed.user = { ...parsed.user, setupCompleted: true };
        localStorage.setItem("user", JSON.stringify(parsed));
      }

      navigate("/app");
    } catch (err: any) {
      setSaving(false);
      setError(err.message || "Failed to complete setup");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-[#2a2a2a]">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="w-8 h-8 text-[#d4af37]" />
              <span className="text-xl font-semibold text-white">
                NetSight
              </span>
            </div>
            <div className="text-sm text-gray-400">{isRescan ? "Network Rescan" : "Setup Wizard"}</div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="border-b border-[#2a2a2a]">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <StepIndicator
              number={1}
              label="Network Scan"
              active={currentStep === 1}
              completed={currentStep > 1}
            />
            <div
              className={`flex-1 h-px mx-4 ${currentStep > 1 ? "bg-[#d4af37]" : "bg-[#2a2a2a]"
                }`}
            />
            <StepIndicator
              number={2}
              label="Verify Devices"
              active={currentStep === 2}
              completed={currentStep > 2}
            />
            <div
              className={`flex-1 h-px mx-4 ${currentStep > 2 ? "bg-[#d4af37]" : "bg-[#2a2a2a]"
                }`}
            />
            <StepIndicator
              number={3}
              label="Confirm & Finish"
              active={currentStep === 3}
              completed={false}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* ── STEP 1: Network Scan ── */}
        {currentStep === 1 && (
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-8">
            <h2 className="text-white text-xl font-semibold mb-2">
              Network Configuration
            </h2>
            <p className="text-gray-400 mb-8">
              Configure your network parameters to auto-discover all
              connected devices
            </p>

            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Network Interface
                </label>
                {loadingInterfaces ? (
                  <div className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] text-gray-500 rounded-lg flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Detecting network interfaces...
                  </div>
                ) : (
                  <select
                    value={networkConfig.interface}
                    onChange={(e) => {
                      const selected = networkInterfaces.find((i) => i.name === e.target.value);
                      setNetworkConfig({
                        ...networkConfig,
                        interface: e.target.value,
                        ipRange: selected?.cidr || networkConfig.ipRange,
                      });
                    }}
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                  >
                    {networkInterfaces.map((iface) => (
                      <option key={iface.name} value={iface.name}>
                        {iface.name} – {iface.ip}{iface.isVirtual ? ' (virtual)' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  IP Range (CIDR Notation)
                </label>
                <input
                  type="text"
                  value={networkConfig.ipRange}
                  onChange={(e) =>
                    setNetworkConfig({
                      ...networkConfig,
                      ipRange: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] placeholder-gray-600"
                  placeholder="192.168.1.0/24"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Example: 192.168.1.0/24 or 10.0.0.0/16
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Scan Method
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: "icmp",
                      label: "ICMP Scan",
                      desc: "Fast ping-based discovery (recommended)",
                    },
                    {
                      id: "arp",
                      label: "ARP Scan",
                      desc: "Layer 2 discovery for local networks",
                    },
                    {
                      id: "tcp",
                      label: "TCP Scan",
                      desc: "Port-based discovery (slower but thorough)",
                    },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${networkConfig.scanMethod === method.id
                        ? "border-[#d4af37] bg-[#d4af37]/5"
                        : "border-[#2a2a2a] hover:border-[#3a3a3a]"
                        }`}
                    >
                      <input
                        type="radio"
                        name="scanMethod"
                        value={method.id}
                        checked={networkConfig.scanMethod === method.id}
                        onChange={(e) =>
                          setNetworkConfig({
                            ...networkConfig,
                            scanMethod: e.target.value,
                          })
                        }
                        className="w-4 h-4 text-[#d4af37] accent-[#d4af37]"
                      />
                      <div>
                        <div className="font-medium text-white">
                          {method.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {method.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Scan Progress */}
              {scanning && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">
                      {scanProgress < 30
                        ? "Pinging devices on your network..."
                        : scanProgress < 50
                          ? "Reading ARP table..."
                          : scanProgress < 70
                            ? "Resolving hostnames & scanning ports..."
                            : "Identifying device vendors..."}
                    </span>
                    <span className="text-sm text-[#d4af37]">
                      {Math.round(scanProgress)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#0a0a0a] rounded-full h-2">
                    <div
                      className="bg-[#d4af37] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleScan}
                disabled={scanning}
                className="w-full px-6 py-3 bg-[#d4af37] text-white rounded-lg hover:bg-[#f59e0b] transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Scanning Network...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Start Network Scan
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Verify Devices ── */}
        {currentStep === 2 && (
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white text-xl font-semibold">
                Discovered Devices
              </h2>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-400">
                  {activeDevices.length} active
                </span>
                {excludedCount > 0 && (
                  <span className="text-gray-500">
                    {excludedCount} excluded
                  </span>
                )}
              </div>
            </div>
            <p className="text-gray-400 mb-8">
              Review discovered devices, give them names (optional), and
              exclude any you don't want to monitor
            </p>

            <div className="space-y-3">
              {devices.map((device, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 transition-all ${device.excluded
                    ? "border-[#2a2a2a] bg-[#0a0a0a] opacity-50"
                    : "border-[#2a2a2a] bg-[#0a0a0a]/50 hover:border-[#3a3a3a]"
                    }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Device Icon */}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${device.excluded
                        ? "bg-[#1a1a1a] text-gray-600"
                        : `bg-[#1a1a1a] ${deviceColors[device.type] ||
                        "text-gray-400"
                        }`
                        }`}
                    >
                      {deviceIcons[device.type] || (
                        <Monitor className="w-5 h-5" />
                      )}
                    </div>

                    {/* Device Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {editingDevice === index ? (
                          <input
                            type="text"
                            value={device.name}
                            onChange={(e) =>
                              handleDeviceNameChange(
                                index,
                                e.target.value
                              )
                            }
                            onBlur={() => setEditingDevice(null)}
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              setEditingDevice(null)
                            }
                            autoFocus
                            className="px-2 py-1 bg-[#1a1a1a] border border-[#d4af37] text-white rounded text-sm focus:outline-none w-48"
                            placeholder="Enter device name..."
                          />
                        ) : (
                          <>
                            <span className="text-sm font-medium text-white">
                              {device.name || device.hostname || device.type}
                            </span>
                            {device.isGateway && (
                              <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-semibold uppercase">
                                Gateway
                              </span>
                            )}
                            {device.isSelf && (
                              <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-semibold uppercase">
                                This Device
                              </span>
                            )}
                            {!device.excluded && (
                              <button
                                onClick={() =>
                                  setEditingDevice(index)
                                }
                                className="text-gray-500 hover:text-[#d4af37] transition-colors"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{device.ip}</span>
                        <span className="font-mono">{device.mac}</span>
                        <span>{device.vendor}</span>
                      </div>
                      {device.openPorts && device.openPorts.length > 0 && !device.excluded && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {device.openPorts.map((p) => (
                            <span
                              key={p.port}
                              className="px-1.5 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 rounded text-[10px]"
                            >
                              {p.service}:{p.port}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Type Badge */}
                    <div className="hidden md:block">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${device.excluded
                          ? "bg-[#1a1a1a] text-gray-600"
                          : "bg-[#1a1a1a] text-gray-300"
                          }`}
                      >
                        {device.type}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="hidden md:flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${device.excluded
                          ? "bg-gray-600"
                          : "bg-green-500"
                          }`}
                      />
                      <span
                        className={`text-xs ${device.excluded
                          ? "text-gray-600"
                          : "text-green-400"
                          }`}
                      >
                        {device.status}
                      </span>
                    </div>

                    {/* Exclude/Include Button */}
                    <button
                      onClick={() => toggleExclude(index)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${device.excluded
                        ? "bg-[#d4af37]/10 text-[#d4af37] hover:bg-[#d4af37]/20"
                        : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        }`}
                    >
                      {device.excluded ? "Include" : "Exclude"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2.5 border border-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#1a1a1a] transition-colors font-medium flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Re-scan
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 bg-[#d4af37] text-white rounded-lg hover:bg-[#f59e0b] transition-colors font-medium flex items-center gap-2"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Confirm & Finish ── */}
        {currentStep === 3 && (
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-8">
            <h2 className="text-white text-xl font-semibold mb-2">
              Setup Summary
            </h2>
            <p className="text-gray-400 mb-8">
              Review and confirm your network configuration
            </p>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-5 text-center">
                <div className="text-3xl font-semibold text-[#d4af37] mb-1">
                  {activeDevices.length}
                </div>
                <div className="text-sm text-gray-400">
                  Devices to Monitor
                </div>
              </div>
              <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-5 text-center">
                <div className="text-3xl font-semibold text-green-400 mb-1">
                  {
                    activeDevices.filter((d) => d.status === "Online")
                      .length
                  }
                </div>
                <div className="text-sm text-gray-400">
                  Online
                </div>
              </div>
              <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-5 text-center">
                <div className="text-3xl font-semibold text-blue-400 mb-1">
                  {new Set(activeDevices.map((d) => d.type)).size}
                </div>
                <div className="text-sm text-gray-400">
                  Device Types
                </div>
              </div>
            </div>

            {/* Device List Summary */}
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg overflow-hidden mb-6">
              <div className="px-4 py-3 border-b border-[#2a2a2a]">
                <span className="text-sm font-medium text-gray-300">
                  Devices to be monitored
                </span>
              </div>
              <div className="divide-y divide-[#2a2a2a]">
                {activeDevices.map((device, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 flex items-center gap-3"
                  >
                    <span
                      className={
                        deviceColors[device.type] || "text-gray-400"
                      }
                    >
                      {deviceIcons[device.type] || (
                        <Monitor className="w-4 h-4" />
                      )}
                    </span>
                    <span className="text-sm text-white flex-1">
                      {device.name || device.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {device.ip}
                    </span>
                    <span className="text-xs text-gray-600">
                      {device.vendor}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Note */}
            <div className="p-4 bg-[#d4af37]/5 border border-[#d4af37]/20 rounded-lg mb-8">
              <p className="text-sm text-[#d4af37]">
                <strong>Ready to go!</strong> After completing the {isRescan ? "rescan" : "setup"},
                all dashboard features, topology maps, alerts, and
                analytics will work based on these devices. You can
                always add or remove devices later from Settings.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 border border-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#1a1a1a] transition-colors font-medium flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={handleCompleteSetup}
                disabled={saving}
                className="px-8 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Complete Setup
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepIndicator({
  number,
  label,
  active,
  completed,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${completed
          ? "bg-[#d4af37] text-white"
          : active
            ? "bg-[#d4af37]/20 text-[#d4af37] border-2 border-[#d4af37]"
            : "bg-[#1a1a1a] text-gray-500 border border-[#2a2a2a]"
          }`}
      >
        {completed ? <Check className="w-5 h-5" /> : number}
      </div>
      <div>
        <div
          className={`text-sm font-medium ${active || completed ? "text-white" : "text-gray-500"
            }`}
        >
          Step {number}
        </div>
        <div
          className={`text-xs ${active ? "text-[#d4af37]" : "text-gray-600"
            }`}
        >
          {label}
        </div>
      </div>
    </div>
  );
}
