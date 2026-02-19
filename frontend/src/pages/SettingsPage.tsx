import { useState } from "react";
import { Save, Bell, Shield, Activity, Clock } from "lucide-react";

export function SettingsPage() {
  const [settings, setSettings] = useState({
    // Alert Thresholds
    latencyThreshold: 50,
    packetLossThreshold: 1,
    cpuThreshold: 80,
    memoryThreshold: 85,
    diskThreshold: 20,

    // Scan Intervals
    quickScanInterval: 5,
    fullScanInterval: 60,
    healthCheckInterval: 10,

    // Notifications
    emailNotifications: true,
    slackNotifications: false,
    smsNotifications: false,
    criticalAlertsOnly: false,

    // Security
    sessionTimeout: 30,
    mfaEnabled: true,
    ipWhitelisting: false,
    auditLogging: true
  });

  const handleSave = () => {
    // Mock save
    alert("Settings saved successfully!");
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white mb-1">System Settings</h1>
        <p className="text-gray-400">Configure alert thresholds, scan intervals, and system preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Alert Thresholds */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white">Alert Thresholds</h3>
                <p className="text-sm text-gray-400">Configure when alerts are triggered</p>
              </div>
            </div>

            <div className="space-y-5">
              <SettingSlider
                label="Latency Threshold"
                value={settings.latencyThreshold}
                onChange={(value) => setSettings({ ...settings, latencyThreshold: value })}
                min={10}
                max={200}
                unit="ms"
                description="Alert when latency exceeds this value"
              />
              <SettingSlider
                label="Packet Loss Threshold"
                value={settings.packetLossThreshold}
                onChange={(value) => setSettings({ ...settings, packetLossThreshold: value })}
                min={0.1}
                max={5}
                step={0.1}
                unit="%"
                description="Alert when packet loss exceeds this percentage"
              />
              <SettingSlider
                label="CPU Usage Threshold"
                value={settings.cpuThreshold}
                onChange={(value) => setSettings({ ...settings, cpuThreshold: value })}
                min={50}
                max={100}
                unit="%"
                description="Alert when CPU usage exceeds this percentage"
              />
              <SettingSlider
                label="Memory Usage Threshold"
                value={settings.memoryThreshold}
                onChange={(value) => setSettings({ ...settings, memoryThreshold: value })}
                min={50}
                max={100}
                unit="%"
                description="Alert when memory usage exceeds this percentage"
              />
              <SettingSlider
                label="Disk Space Threshold"
                value={settings.diskThreshold}
                onChange={(value) => setSettings({ ...settings, diskThreshold: value })}
                min={10}
                max={50}
                unit="% free"
                description="Alert when free disk space falls below this percentage"
              />
            </div>
          </div>

          {/* Scan Intervals */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white">Scan Intervals</h3>
                <p className="text-sm text-gray-400">Configure how often devices are scanned</p>
              </div>
            </div>

            <div className="space-y-5">
              <SettingSlider
                label="Quick Scan Interval"
                value={settings.quickScanInterval}
                onChange={(value) => setSettings({ ...settings, quickScanInterval: value })}
                min={1}
                max={30}
                unit="minutes"
                description="Ping-based device availability check"
              />
              <SettingSlider
                label="Full Scan Interval"
                value={settings.fullScanInterval}
                onChange={(value) => setSettings({ ...settings, fullScanInterval: value })}
                min={15}
                max={240}
                unit="minutes"
                description="Complete device discovery and metrics collection"
              />
              <SettingSlider
                label="Health Check Interval"
                value={settings.healthCheckInterval}
                onChange={(value) => setSettings({ ...settings, healthCheckInterval: value })}
                min={5}
                max={60}
                unit="minutes"
                description="Device health and performance metrics update"
              />
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-white">Notification Preferences</h3>
                <p className="text-sm text-gray-400">Choose how you receive alerts</p>
              </div>
            </div>

            <div className="space-y-4">
              <SettingToggle
                label="Email Notifications"
                description="Receive alerts via email"
                checked={settings.emailNotifications}
                onChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
              <SettingToggle
                label="Slack Notifications"
                description="Send alerts to Slack channel"
                checked={settings.slackNotifications}
                onChange={(checked) => setSettings({ ...settings, slackNotifications: checked })}
              />
              <SettingToggle
                label="SMS Notifications"
                description="Receive critical alerts via SMS"
                checked={settings.smsNotifications}
                onChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
              />
              <SettingToggle
                label="Critical Alerts Only"
                description="Only receive notifications for critical severity alerts"
                checked={settings.criticalAlertsOnly}
                onChange={(checked) => setSettings({ ...settings, criticalAlertsOnly: checked })}
              />
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white">Security Settings</h3>
                <p className="text-sm text-gray-400">Configure security and access controls</p>
              </div>
            </div>

            <div className="space-y-5">
              <SettingSlider
                label="Session Timeout"
                value={settings.sessionTimeout}
                onChange={(value) => setSettings({ ...settings, sessionTimeout: value })}
                min={15}
                max={120}
                unit="minutes"
                description="Automatically log out inactive users"
              />
              <SettingToggle
                label="Two-Factor Authentication"
                description="Require 2FA for all user logins"
                checked={settings.mfaEnabled}
                onChange={(checked) => setSettings({ ...settings, mfaEnabled: checked })}
              />
              <SettingToggle
                label="IP Whitelisting"
                description="Restrict access to specific IP addresses"
                checked={settings.ipWhitelisting}
                onChange={(checked) => setSettings({ ...settings, ipWhitelisting: checked })}
              />
              <SettingToggle
                label="Audit Logging"
                description="Log all user actions and system events"
                checked={settings.auditLogging}
                onChange={(checked) => setSettings({ ...settings, auditLogging: checked })}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Save Actions */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
            <h4 className="font-medium text-white mb-4">Save Changes</h4>
            <button 
              onClick={handleSave}
              className="w-full px-4 py-2.5 bg-[#d4af37] text-black rounded-lg hover:bg-[#f59e0b] transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
            <p className="text-xs text-gray-400 mt-3">
              Changes will take effect immediately across all monitored devices.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
            <h4 className="font-medium text-white mb-4">Configuration Status</h4>
            <div className="space-y-3">
              <QuickStat label="Total Settings" value="15" />
              <QuickStat label="Last Modified" value="Today" />
              <QuickStat label="Modified By" value="John Doe" />
            </div>
          </div>

          {/* Help */}
          <div className="bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-xl p-6">
            <h4 className="font-medium text-[#d4af37] mb-2">Need Help?</h4>
            <p className="text-sm text-gray-300 mb-4">
              View our documentation for detailed configuration guidelines.
            </p>
            <button className="text-sm text-[#d4af37] hover:text-[#f59e0b] font-medium">
              View Documentation →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingSlider({ label, value, onChange, min, max, step = 1, unit, description }: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit: string;
  description: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-medium text-white">{label}</div>
          <div className="text-xs text-gray-400">{description}</div>
        </div>
        <div className="text-sm font-semibold text-[#d4af37]">
          {value} {unit}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
      />
    </div>
  );
}

function SettingToggle({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-gray-400">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-[#d4af37]' : 'bg-[#2a2a2a]'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-400">{label}</div>
      <div className="text-sm font-medium text-white">{value}</div>
    </div>
  );
}