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
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Pricing
              </button>
              <button 
                onClick={() => navigate('/docs')}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
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
          </div>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-16">
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

      {/* Pricing Section */}
      <section id="pricing" className="bg-[#111] py-20 border-t border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-white mb-4 text-3xl font-bold">
            Transparent, straight-forward pricing
          </h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Choose the perfect plan for your network size. All plans include auto-discovery and core observability features.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingCard
              title="Starter"
              price="$0"
              period="forever"
              description="Perfect for small home labs or testing."
              features={[
                "Up to 50 devices",
                "Basic topology map",
                "24h data retention",
                "Community support"
              ]}
              buttonText="Get Started"
              isPopular={false}
            />
            <PricingCard
              title="Professional"
              price="$99"
              period="/month"
              description="For medium businesses needing advanced features."
              features={[
                "Up to 500 devices",
                "Advanced topology & alerts",
                "30-day data retention",
                "AI Prediction insights",
                "Email support"
              ]}
              buttonText="Start Free Trial"
              isPopular={true}
            />
            <PricingCard
              title="Enterprise"
              price="Custom"
              period=""
              description="Full-scale observability for large organizations."
              features={[
                "Unlimited devices",
                "Multi-site topology",
                "Unlimited data retention",
                "Custom integrations",
                "24/7 dedicated support"
              ]}
              buttonText="Contact Sales"
              isPopular={false}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2a2a2a] bg-[#0a0a0a]">
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
              <ul className="space-y-2 text-sm text-gray-400 flex flex-col items-start">
                <li><button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Pricing</button></li>
                <li><button onClick={() => navigate('/docs')} className="hover:text-white transition-colors">Documentation</button></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white mb-4 font-semibold">Company</h5>
              <ul className="space-y-2 text-sm text-gray-400 flex flex-col items-start">
                <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors">About</button></li>
                <li><button onClick={() => navigate('/contact')} className="hover:text-white transition-colors">Contact</button></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white mb-4 font-semibold">Legal</h5>
              <ul className="space-y-2 text-sm text-gray-400 flex flex-col items-start">
                <li><button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors">Privacy</button></li>
                <li><button onClick={() => navigate('/terms')} className="hover:text-white transition-colors">Terms</button></li>
                <li><button onClick={() => navigate('/security')} className="hover:text-white transition-colors">Security</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#2a2a2a] mt-8 pt-8 flex items-center justify-center">
            <p className="text-sm text-gray-400">
              © 2026 NetSight. All rights reserved.
            </p>
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

function PricingCard({ title, price, period, description, features, buttonText, isPopular }: { title: string; price: string; period: string; description: string; features: string[]; buttonText: string; isPopular: boolean }) {
  return (
    <div className={`p-8 bg-[#0a0a0a] rounded-2xl relative flex flex-col ${isPopular ? 'border-2 border-[#d4af37]' : 'border border-[#2a2a2a]'}`}>
      {isPopular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#d4af37] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
          Most Popular
        </div>
      )}
      <h3 className="text-xl text-white font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-6">{description}</p>
      <div className="mb-6">
        <span className="text-4xl text-white font-bold">{price}</span>
        {period && <span className="text-gray-500 font-medium text-lg ml-1">{period}</span>}
      </div>
      <button className={`w-full py-3 rounded-lg font-medium transition-colors mb-8 ${isPopular ? 'bg-[#d4af37] text-white hover:bg-[#b8860b]' : 'bg-[#242424] text-white hover:bg-[#333]'}`}>
        {buttonText}
      </button>
      <div className="space-y-4 flex-1">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#d4af37] shrink-0" />
            <span className="text-sm text-gray-300">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
