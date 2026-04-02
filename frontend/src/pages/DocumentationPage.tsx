import { Terminal, Shield, Eye, ArrowLeft, Network, Activity, Cpu } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function DocumentationPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans selection:bg-[#d4af37] selection:text-black">
      {/* Navbar segment */}
      <nav className="border-b border-[#2a2a2a] bg-[#111] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
            <Network className="w-8 h-8 text-[#d4af37]" />
            <span className="text-xl font-semibold text-white">NetSight</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-[#242424] rounded-lg transition-colors border border-transparent hover:border-[#2a2a2a]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </nav>

      {/* Main Documentation Body */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12 border-b border-[#2a2a2a] pb-8">
          <h1 className="text-5xl text-white font-bold mb-6 tracking-tight">Documentation</h1>
          <p className="text-xl text-gray-400">
            A comprehensive guide configuring and understanding NetSight capabilities.
          </p>
        </div>

        <div className="space-y-16">
          {/* Getting Started */}
          <section>
            <h2 className="text-2xl text-[#d4af37] font-semibold mb-6 flex items-center gap-3">
              <Terminal className="w-7 h-7 bg-[#d4af37]/10 p-1.5 rounded-md" />
              Getting Started
            </h2>
            <div className="bg-[#111] border border-[#2a2a2a] p-8 rounded-2xl space-y-5 text-gray-300 leading-relaxed shadow-xl">
              <p>NetSight maps and tracks your active enterprise network through advanced agentless topology discovery. Using standard discovery protocols, it registers active IPs into its monitoring tables.</p>
              <div className="bg-[#0a0a0a] p-4 rounded-lg my-4 text-sm font-mono text-gray-400 border border-[#2a2a2a]">
                # Typical NetSight Discovery Workflow<br/>
                1. System initializes ARP/ICMP ping sweeps.<br/>
                2. Discovered hosts undergo rapid port footprinting.<br/>
                3. Nodes are populated into the central graph.
              </div>
              <ul className="list-disc list-inside space-y-3 pt-2">
                <li>Log in to your administrator dashboard.</li>
                <li>Navigate to <strong className="text-white">Settings</strong> and authorize a <strong>Network Rescan</strong>.</li>
                <li>Ensure NetSight is deployed on an unfiltered VLAN to correctly aggregate data.</li>
              </ul>
            </div>
          </section>

          {/* Device Observability */}
          <section>
            <h2 className="text-2xl text-[#d4af37] font-semibold mb-6 flex items-center gap-3">
              <Eye className="w-7 h-7 bg-[#d4af37]/10 p-1.5 rounded-md" />
              Device Analytics
            </h2>
            <div className="bg-[#111] border border-[#2a2a2a] p-8 rounded-2xl space-y-5 text-gray-300 leading-relaxed shadow-xl">
              <p>Our core observation engine aggregates ping times, latency, and packet loss persistently.</p>
              <p>In the <strong>Devices</strong> tab, selecting any active host reveals its timeline history. NetSight continuously polls the network dynamically, ensuring we don't saturate your enterprise switches while preserving accurate bandwidth monitoring.</p>
            </div>
          </section>

          {/* Prediction / Analysis */}
          <section>
            <h2 className="text-2xl text-[#d4af37] font-semibold mb-6 flex items-center gap-3">
              <Activity className="w-7 h-7 bg-[#d4af37]/10 p-1.5 rounded-md" />
              Failure Prediction Model
            </h2>
            <div className="bg-[#111] border border-[#2a2a2a] p-8 rounded-2xl space-y-5 text-gray-300 leading-relaxed shadow-xl">
              <p>A flagship component of our platform is the intelligent diagnostic engine.</p>
              <p>Because IT outages are preceded by subtle latency spikes and intermittent packet deterioration, NetSight monitors these behavioral signatures across independent nodes.</p>
              <div className="bg-[#2a2210] border border-[#8a6b1c] text-[#f59e0b] p-4 rounded-lg mt-4 flex items-start gap-4">
                <Cpu className="w-6 h-6 shrink-0 mt-0.5" />
                <p>
                  <strong>Insight:</strong> The system automatically assigns a <strong className="text-red-400">Failure Probability (%)</strong> coefficient to routing elements, giving operators advance notice before hard lockouts occur.
                </p>
              </div>
            </div>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-2xl text-[#d4af37] font-semibold mb-6 flex items-center gap-3">
              <Shield className="w-7 h-7 bg-[#d4af37]/10 p-1.5 rounded-md" />
              Port Security Validation
            </h2>
            <div className="bg-[#111] border border-[#2a2a2a] p-8 rounded-2xl space-y-5 text-gray-300 leading-relaxed shadow-xl">
              <p>During topology scans, NetSight fingerprints responding network devices for inherently unsecure active gateways and control panels.</p>
              <p>Services like Telnet (23), FTP (21), or vulnerable SSH signatures are flagged. This allows your security desk to spot unauthorized device provisioning seamlessly via the central interface.</p>
            </div>
          </section>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-[#2a2a2a] bg-[#111] mt-20">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} NetSight Documentation. Built for modern infrastructure teams.
        </div>
      </footer>
    </div>
  );
}
