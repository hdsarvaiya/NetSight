import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Network, ArrowRight } from "lucide-react";
import api from "../services/api";

export function VerifyEmailPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (location.state?.email) {
            setEmail(location.state.email);
        } else {
            // If no email in state, redirect to login or show error
            // navigate('/login');
        }
    }, [location, navigate]);

    const handleChange = (element: HTMLInputElement, index: number) => {
        if (isNaN(Number(element.value))) return false;

        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

        // Focus next input
        if (element.nextSibling && element.value !== "") {
            (element.nextSibling as HTMLInputElement).focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && otp[index] === "" && index > 0) {
            // Focus previous input on backspace
            const prev = (e.target as HTMLInputElement).previousSibling as HTMLInputElement;
            if (prev) prev.focus();
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        const otpCode = otp.join("");
        if (otpCode.length !== 6) {
            setError("Please enter a complete 6-digit code");
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/verify-otp', {
                email,
                otp: otpCode
            });

            const { user, tokens } = response.data;

            // Manually set auth data
            localStorage.setItem('token', tokens.accessToken);
            localStorage.setItem('user', JSON.stringify(user));

            // Force reload or just navigate? Navigation might not update context immediately 
            // if context doesn't listen to storage events. 
            // Safest is to redirect to app and let AuthProvider mount logic handle it, 
            // OR window.location.href to force fresh state.
            window.location.href = '/app';

        } catch (err: any) {
            setError(err.response?.data?.message || "Verification failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 bg-[#d4af37]/10 rounded-full mb-4">
                        <Network className="w-8 h-8 text-[#d4af37]" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Verify your email</h2>
                    <p className="text-gray-400 text-center">
                        We sent a verification code to <span className="text-white font-medium">{email}</span>
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-900/50 text-red-500 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-center gap-2">
                        {otp.map((data, index) => (
                            <input
                                className="w-12 h-12 text-center text-xl font-semibold bg-[#2a2a2a] border border-[#3a3a3a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent transition-all"
                                type="text"
                                name="otp"
                                maxLength={1}
                                key={index}
                                value={data}
                                onChange={(e) => handleChange(e.target, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                onPaste={(e) => {
                                    e.preventDefault();
                                    const text = e.clipboardData.getData('text');
                                    if (!/^\d+$/.test(text)) return;
                                    const digits = text.split('').slice(0, 6);
                                    const newOtp = [...otp];
                                    digits.forEach((d, i) => newOtp[i] = d);
                                    setOtp(newOtp);
                                }}
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-3 bg-[#d4af37] hover:bg-[#f59e0b] text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Verifying..." : "Verify Email"}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        type="button"
                        className="text-sm text-[#d4af37] hover:text-[#f59e0b]"
                        onClick={() => alert("Resend feature not implemented yet, please check console log")}
                    >
                        Resend Code
                    </button>
                </div>
            </div>
        </div>
    );
}
