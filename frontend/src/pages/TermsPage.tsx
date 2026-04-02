import { ArrowLeft, Network } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function TermsPage() {
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
        <h1 className="text-4xl text-white font-bold mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: October 15, 2026</p>
        
        <div className="space-y-8 text-gray-400 leading-relaxed">
            <section>
                <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
                <p>By accessing and using NetSight ("the Service"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
            </section>
            
            <section>
                <h2 className="text-xl font-semibold text-white mb-3">2. Service Provision</h2>
                <p>NetSight provides an enterprise software-as-a-service solution for network observability, diagnostic pings, and AI-assisted predictions. Our platform relies on continuous availability formulas, subject to scheduled maintenance windows.</p>
            </section>

            <section>
                <h2 className="text-xl font-semibold text-white mb-3">3. User Responsibilities</h2>
                <p>You agree to only utilize NetSight on networks, devices, and servers you are legally authorized to monitor and scan. Running network discovery profiles on unowned external networks is strictly prohibited and constitutes grounds for immediate account termination without refund.</p>
            </section>

            <section>
                <h2 className="text-xl font-semibold text-white mb-3">4. Disclaimer of Warranties</h2>
                <p>The Service is provided "as is". We make no warranty that our service will meet your requirements, be uninterrupted, timely, secure, or error-free. Predictive network warnings are estimations based on heuristic models.</p>
            </section>
        </div>
      </main>
    </div>
  );
}
