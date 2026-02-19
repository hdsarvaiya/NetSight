import { useNavigate } from "react-router-dom";
import {
  Network,
  Activity,
  Bell,
  TrendingUp,
  Shield,
  Zap,
  Eye,
  CheckCircle,
  ArrowRight,
  Github,
  Twitter,
  Linkedin
} from "lucide-react";

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation */}
      <nav className="border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="w-8 h-8 text-[#d4af37]" />
              <span className="text-xl font-semibold text-white">NetSight</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
                Features
              </button>
              <button className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
                Pricing
              </button>
              <button className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
                Documentation
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-5 py-2 bg-[#d4af37] text-white rounded-lg hover:bg-[#b8860b] transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#d4af37]/10 text-[#d4af37] rounded-full mb-6">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Network Observability</span>
          </div>
          <h1 className="text-white mb-6 text-5xl font-bold">
            Complete Network Visibility.<br />Intelligent Insights.
          </h1>
          <p className="text-xl text-gray-400 mb-8 leading-relaxed">
            NetSight automatically discovers your network devices, visualizes topology in real-time,
            monitors health metrics, and predicts failures before they impact your business.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-3 bg-[#d4af37] text-white rounded-lg hover:bg-[#b8860b] transition-colors font-medium flex items-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-3 border border-[#333] text-gray-300 rounded-lg hover:border-gray-400 transition-colors font-medium">
              Watch Demo
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-center text-white mb-12 text-3xl font-bold">
          Everything you need for network observability
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<Network className="w-6 h-6 text-[#d4af37]" />}
            title="Auto Discovery"
            description="Automatically detect and map all devices on your network in seconds"
          />
          <FeatureCard
            icon={<Activity className="w-6 h-6 text-[#d4af37]" />}
            title="Topology Map"
            description="Interactive visual representation of your entire network infrastructure"
          />
          <FeatureCard
            icon={<Bell className="w-6 h-6 text-[#d4af37]" />}
            title="Smart Alerts"
            description="Real-time notifications for critical network events and anomalies"
          />
          <FeatureCard
            icon={<TrendingUp className="w-6 h-6 text-[#d4af37]" />}
            title="AI Prediction"
            description="Machine learning models predict device failures before they occur"
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-[#111] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-white mb-12 text-3xl font-bold">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Connect & Scan"
              description="Define your network range and let NetSight discover all connected devices automatically"
            />
            <StepCard
              number="2"
              title="Visualize & Monitor"
              description="View your network topology, track performance metrics, and receive real-time alerts"
            />
            <StepCard
              number="3"
              title="Predict & Optimize"
              description="Leverage AI insights to predict failures and optimize network performance proactively"
            />
          </div>
        </div>
      </section>

      {/* Security & Tech Stack */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h3 className="text-center text-white mb-8 text-2xl font-bold">
          Enterprise-Grade Security & Technology
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SecurityCard
            icon={<Shield className="w-6 h-6 text-[#d4af37]" />}
            title="SOC 2 Compliant"
            description="Enterprise-grade security and compliance standards"
          />
          <SecurityCard
            icon={<Eye className="w-6 h-6 text-[#d4af37]" />}
            title="End-to-End Encryption"
            description="All data encrypted in transit and at rest"
          />
          <SecurityCard
            icon={<CheckCircle className="w-6 h-6 text-[#d4af37]" />}
            title="99.9% Uptime SLA"
            description="Reliable monitoring you can count on"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2a2a2a] bg-[#111]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Network className="w-6 h-6 text-[#d4af37]" />
                <span className="font-semibold text-white">NetSight</span>
              </div>
              <p className="text-sm text-gray-400">
                Professional network monitoring and observability platform for modern IT teams.
              </p>
            </div>
            <div>
              <h5 className="text-white mb-4 font-semibold">Product</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white mb-4 font-semibold">Company</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white mb-4 font-semibold">Legal</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#2a2a2a] mt-8 pt-8 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              © 2026 NetSight. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 bg-[#111] border border-[#2a2a2a] rounded-xl hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h4 className="text-white mb-2 font-semibold">{title}</h4>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-[#d4af37] text-white rounded-full flex items-center justify-center font-semibold text-lg mx-auto mb-4">
        {number}
      </div>
      <h4 className="text-white mb-2 font-semibold">{title}</h4>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function SecurityCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 bg-[#111] border border-[#2a2a2a] rounded-xl text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <h5 className="text-white mb-2 font-semibold">{title}</h5>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
