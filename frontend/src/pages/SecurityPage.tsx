import { ArrowLeft, Network, Shield, Lock, Server } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function SecurityPage() {
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
        <h1 className="text-4xl text-white font-bold mb-6">Security & Trust</h1>
        <p className="text-lg text-gray-400 mb-12 border-b border-[#2a2a2a] pb-6">
            We understand network observability depends on the root of trust. NetSight was built with an enterprise-first security approach ensuring all network monitoring metadata is continuously secured against data exfiltration.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-[#111] border border-[#2a2a2a] p-6 rounded-2xl">
                <Shield className="w-8 h-8 text-[#d4af37] mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">SOC 2 Type II Certified</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Our infrastructure complies with global privacy architectures, with external auditing guarantees measuring our security boundaries, availability, and procedural integrity.</p>
            </div>
            
            <div className="bg-[#111] border border-[#2a2a2a] p-6 rounded-2xl">
                <Lock className="w-8 h-8 text-[#d4af37] mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">TLS 1.3 & AES-256</h3>
                <p className="text-gray-400 text-sm leading-relaxed">We mandate encryption everywhere. All API communications are guarded by mandatory TLS 1.3 tunnels, while dormant database configurations are preserved via AES-256 block ciphers.</p>
            </div>

            <div className="bg-[#111] border border-[#2a2a2a] p-6 rounded-2xl md:col-span-2 flex flex-col md:flex-row items-center gap-6">
                <Server className="w-12 h-12 text-[#d4af37] shrink-0" />
                <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Tenant Sandboxing</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">Our execution topology employs hardened, isolated virtual clusters. Multi-tenancy logic prevents any risk of parallel metadata traversal by locking telemetry data exclusively to verified internal networks and tokens.</p>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
