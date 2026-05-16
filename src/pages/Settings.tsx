import React, { useState } from "react";
import { 
  Lock,
  Save, 
  ShieldCheck,
  Key,
  AlertCircle,
  Loader2,
  Building2,
  Webhook
} from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";
import { motion } from "motion/react";

export default function Settings() {
  const { user, profile } = useAuth();
  
  // Profile states
  const [companyName, setCompanyName] = useState(profile?.company_name || "");
  const [webhookUrl, setWebhookUrl] = useState(profile?.webhook_url || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Password states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passSaved, setPassSaved] = useState(false);
  const [error, setError] = useState("");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          company_name: companyName,
          webhook_url: webhookUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);
      
      if (error) throw error;
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setPassLoading(true);
    setError("");
    
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      setPassSaved(true);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPassSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-[#666666]">Manage your account preferences and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-2">
          <button className="w-full text-left px-4 py-2.5 rounded-xl bg-black text-white text-sm font-bold shadow-lg shadow-black/5">
            General & Security
          </button>
        </div>

        <div className="md:col-span-3 space-y-8">
          {/* Profile Form */}
          <form onSubmit={handleUpdateProfile} className="bg-white border border-[#E5E5E5] rounded-3xl overflow-hidden shadow-sm">
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4 text-black">
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Company Profile</h4>
                  <p className="text-sm text-[#888]">Update your company details and integrations.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#888888] uppercase tracking-wider ml-1">Company Name</label>
                  <input 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-2xl focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Clarity"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#888888] uppercase tracking-wider ml-1">Webhook URL (n8n)</label>
                  <div className="relative group">
                    <Webhook className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BBB] group-focus-within:text-black transition-colors" />
                    <input 
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://n8n.your-instance.com/webhook/..."
                      className="w-full pl-12 pr-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-2xl focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-[#F0F0F0] flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600">
                  {profileSaved && (
                    <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-sm font-bold flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      Profile saved!
                    </motion.span>
                  )}
                </div>
                <button type="submit" disabled={profileLoading} className="bg-black text-white px-8 py-3 rounded-2xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-xl shadow-black/10">
                  {profileLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Profile"}
                </button>
              </div>
            </div>
          </form>

          {/* Password Form */}
          <form onSubmit={handleUpdatePassword} className="bg-white border border-[#E5E5E5] rounded-3xl overflow-hidden shadow-sm">
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4 text-black">
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Security</h4>
                  <p className="text-sm text-[#888]">Update your login credentials.</p>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

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

              <div className="pt-6 border-t border-[#F0F0F0] flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600">
                  {passSaved && (
                    <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-sm font-bold flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      Password updated!
                    </motion.span>
                  )}
                </div>
                <button type="submit" disabled={passLoading} className="bg-black text-white px-8 py-3 rounded-2xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-xl shadow-black/10">
                  {passLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
