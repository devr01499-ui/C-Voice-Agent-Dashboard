import React, { useState } from "react";
import { 
  Lock,
  Save, 
  ShieldCheck,
  Key,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { motion } from "motion/react";

export default function Settings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      // Step 1: Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Step 2: Update Password
      await updatePassword(user, newPassword);
      
      setSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      if (err.code === "auth/wrong-password") {
        setError("Current password is incorrect.");
      } else {
        setError(err.message || "Failed to update password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Security Settings</h2>
        <p className="text-[#666666]">Update your account security preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <button className="w-full text-left px-4 py-2.5 rounded-xl bg-black text-white text-sm font-bold shadow-lg shadow-black/5">
            Security
          </button>
        </div>

        <div className="md:col-span-3 space-y-6">
          <form onSubmit={handleUpdatePassword} className="bg-white border border-[#E5E5E5] rounded-3xl overflow-hidden shadow-sm">
            <div className="p-8 space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4 text-black">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Change Password</h4>
                    <p className="text-sm text-[#888]">To update your password, please confirm your current one.</p>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 pt-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#888888] uppercase tracking-wider ml-1">Current Password</label>
                    <div className="relative group">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BBB] group-focus-within:text-black transition-colors" />
                      <input 
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#888888] uppercase tracking-wider ml-1">New Password</label>
                      <div className="relative group">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BBB] group-focus-within:text-black transition-colors" />
                        <input 
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-12 pr-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#888888] uppercase tracking-wider ml-1">Confirm New Password</label>
                      <div className="relative group">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BBB] group-focus-within:text-black transition-colors" />
                        <input 
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-12 pr-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-[#F0F0F0] flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600">
                  {saved && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }}
                      className="text-sm font-bold flex items-center gap-1"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Password updated!
                    </motion.span>
                  )}
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-black text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-xl shadow-black/10 active:scale-95 duration-100"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
