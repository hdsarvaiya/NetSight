import { ArrowLeft, Network, Mail, MapPin, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ContactPage() {
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
        <h1 className="text-4xl text-white font-bold mb-6">Contact Us</h1>
        <p className="text-lg text-gray-400 mb-12">
            Whether you have questions about our AI capability, need help with licensing, or just want to chat about infrastructure design, we are here for you. We aim to respond to all inquiries within 24 hours.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Leadership Box */}
            <div className="bg-[#111] border border-[#2a2a2a] p-8 rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-[#d4af37]/10 rounded-lg">
                        <Users className="w-6 h-6 text-[#d4af37]" />
                    </div>
                    <h2 className="text-2xl font-semibold text-white">Leadership</h2>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <h4 className="text-white font-medium">Harsh & Vivek</h4>
                        <p className="text-sm text-[#d4af37]">Founder & CEO</p>
                        <p className="text-sm text-gray-400 mt-1">Former Lead Network Engineer focusing on dynamic system observability and automated discovery solutions.</p>
                    </div>
                    <div className="border-t border-[#2a2a2a] pt-6">
                        <h4 className="text-white font-medium">Kenil & Hardik</h4>
                        <p className="text-sm text-[#d4af37]">Co-Founder</p>
                        <p className="text-sm text-gray-400 mt-1">AI researcher specifically applying failure prediction models into scalable enterprise infrastructures.</p>
                    </div>
                </div>
            </div>

            {/* General Contact Info */}
            <div className="space-y-6">
                <div className="bg-[#111] border border-[#2a2a2a] p-6 rounded-2xl flex items-start gap-4 hover:border-[#d4af37]/50 transition-colors">
                    <Mail className="w-6 h-6 text-[#d4af37] shrink-0 mt-1" />
                    <div>
                        <h3 className="text-lg font-medium text-white mb-1">Email Support</h3>
                        <p className="text-gray-400 text-sm mb-3">For enterprise inquiries, license troubleshooting, and general help.</p>
                        <a href="mailto:hkrana992@gmail.com?subject=NetSight%20Enquiry" className="text-[#d4af37] hover:underline font-medium">hkrana992@gmail.com</a>
                    </div>
                </div>

                <div className="bg-[#111] border border-[#2a2a2a] p-6 rounded-2xl flex items-start gap-4 hover:border-[#d4af37]/50 transition-colors">
                    <MapPin className="w-6 h-6 text-[#d4af37] shrink-0 mt-1" />
                    <div>
                        <h3 className="text-lg font-medium text-white mb-1">Global Headquarters</h3>
                        <p className="text-gray-400 text-sm mb-3">If you are sending legal documentation, please use our enterprise address below.</p>
                        <address className="not-italic text-white">
                            NetSight Technologies Inc.<br />
                            Gift City<br />
                            Gandhinagar, Gujarat<br />
                            India
                        </address>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
