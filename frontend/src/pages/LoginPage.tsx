import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Network, ArrowRight } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Verify credentials (mock for now)
    // In a real app, you would call your backend API here

    // Set user session
    localStorage.setItem("user", JSON.stringify({
      email: formData.email,
      name: "John Doe",
      role: "admin"
    }));

    // Mock login - navigate to dashboard
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#d4af37] to-[#b8860b] p-12 flex-col justify-between">
        <div className="flex items-center gap-2 text-white">
          <Network className="w-8 h-8" />
          <span className="text-xl font-semibold">NetSight</span>
        </div>
        <div>
          <h2 className="text-white mb-4">
            Welcome back to NetSight
          </h2>
          <p className="text-yellow-100 text-lg leading-relaxed">
            Continue monitoring your network infrastructure with real-time insights and intelligent analytics.
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-yellow-700 rounded-lg flex items-center justify-center">✓</div>
            <div>
              <div className="font-medium">Real-time Monitoring</div>
              <div className="text-sm text-yellow-100">Track every device 24/7</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-yellow-700 rounded-lg flex items-center justify-center">✓</div>
            <div>
              <div className="font-medium">Predictive Analytics</div>
              <div className="text-sm text-yellow-100">AI-powered failure prediction</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-yellow-700 rounded-lg flex items-center justify-center">✓</div>
            <div>
              <div className="font-medium">Enterprise Security</div>
              <div className="text-sm text-yellow-100">SOC 2 compliant infrastructure</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="lg:hidden flex items-center gap-2 text-white mb-6">
              <Network className="w-8 h-8 text-[#d4af37]" />
              <span className="text-xl font-semibold">NetSight</span>
            </div>
            <h2 className="text-white mb-2">Sign in to your account</h2>
            <p className="text-gray-400">Enter your credentials to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <a href="#" className="text-sm text-[#d4af37] hover:text-[#f59e0b]">
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 text-[#d4af37] bg-[#1a1a1a] border-[#2a2a2a] rounded focus:ring-[#d4af37]"
                />
                <span className="text-sm text-gray-400">Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2.5 bg-[#d4af37] hover:bg-[#f59e0b] text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center">
              <span className="text-sm text-gray-400">Don't have an account? </span>
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="text-[#d4af37] hover:text-[#f59e0b] font-medium"
              >
                Sign up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}