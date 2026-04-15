import { ArrowLeft, Network } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans selection:bg-[#d4af37] selection:text-black">
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

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl text-white font-bold mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: October 15, 2026</p>
        
        <div className="space-y-8 text-gray-400 leading-relaxed">
            <section>
                <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
                <p>When you use the NetSight observability platform, we may collect technical metadata regarding the devices on your monitored networks, diagnostic metrics, latency logs, and uptime histories. This data is strictly utilized for the purpose of operating the NetSight predictive failure models and delivering the dashboard service to you.</p>
            </section>
            
            <section>
                <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Information</h2>
                <p>We use collected metadata strictly to provide, maintain, and improve our network analytics and intelligence models. Your network topology configurations, device secrets, and port data are securely siloed. We do not sell tracking data to advertising networks.</p>
            </section>

            <section>
                <h2 className="text-xl font-semibold text-white mb-3">3. Data Retention & Deletion</h2>
                <p>Data retention is configured automatically based on your subscription tier rules. Once metadata ages past the retention period or an account is requested to be terminated, all related telemetry data is permanently purged from our primary and backup databases.</p>
            </section>

            <section>
                <h2 className="text-xl font-semibold text-white mb-3">4. Security</h2>
                <p>We implement enterprise-grade security standards designed to protect your network data from unauthorized access or disclosure. While no system is impenetrable, our architecture enforces extreme isolation of customer data models.</p>
            </section>
        </div>
      </main>
    </div>
  );
}
