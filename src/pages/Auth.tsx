import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Chrome, ArrowRight, Loader2 } from "lucide-react";

type AuthMode = "login" | "signup" | "forgot";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else if (mode === "signup") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }

        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: fullName,
              company_name: companyName,
            }
          }
        });
        if (error) throw error;
        
        if (data.user) {
          setMessage("Account created! Please check your email for verification. Or you may be logged in automatically.");
          if (data.session) {
            navigate("/");
          }
        }
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/settings`
        });
        if (error) throw error;
        setMessage("Password reset link sent! Check your inbox.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-[#E5E5E5] space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "login" && "Welcome back"}
              {mode === "signup" && "Create an account"}
              {mode === "forgot" && "Reset Password"}
            </h1>
            <p className="text-[#666666] text-sm">
              {mode === "forgot" ? "Enter your email to receive a reset link." : "The modern AI recruitment calling platform."}
            </p>
          </div>

          {/* Status Messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium"
              >
                {error}
              </motion.div>
            )}
            {message && (
              <motion.div
                key="message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 bg-green-50 border border-green-100 text-green-600 rounded-xl text-sm font-medium"
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          {mode !== "forgot" && (
            <>
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="flex items-center justify-center gap-3 w-full py-3 border border-[#E5E5E5] rounded-2xl hover:bg-gray-50 transition-all font-semibold text-sm disabled:opacity-50 cursor-pointer"
                >
                  <Chrome className="w-5 h-5" />
                  Continue with Google
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#E5E5E5]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-[#888888] font-bold tracking-widest leading-none">Or continue with email</span>
                </div>
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#888888] uppercase tracking-wider ml-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#888888] uppercase tracking-wider ml-1">Company Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all text-sm"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#888888] uppercase tracking-wider ml-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all text-sm"
              />
            </div>
            
            {mode !== "forgot" && (
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-[#888888] uppercase tracking-wider">Password</label>
                  {mode === "login" && (
                    <button 
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-[10px] font-bold text-black hover:underline cursor-pointer"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all text-sm"
                />
              </div>
            )}

            {mode === "signup" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#888888] uppercase tracking-wider ml-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all text-sm"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-black/10 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === "login" && "Sign In"}
                  {mode === "signup" && "Create Account"}
                  {mode === "forgot" && "Send Reset Link"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center space-y-4">
            {mode === "forgot" ? (
              <button
                onClick={() => { setMode("login"); setError(""); setMessage(""); }}
                className="text-sm font-semibold text-[#666666] hover:text-black transition-colors cursor-pointer"
              >
                Back to sign in
              </button>
            ) : (
              <button
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }}
                className="text-sm font-semibold text-[#666666] hover:text-black transition-colors cursor-pointer"
              >
                {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

