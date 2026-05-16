import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Play, 
  Pause, 
  Trash2,
  Calendar,
  Link as LinkIcon,
  Bot
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";

export default function Campaigns() {
  const { user, profile } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [agentName, setAgentName] = useState("Professional Recruiter Alex");
  const [scheduleTime, setScheduleTime] = useState("");
  const [sheetLink, setSheetLink] = useState("");

  const fetchCampaigns = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      const { error } = await supabase.from("campaigns").insert({
        user_id: user.id,
        name,
        agent_name: agentName,
        schedule_time: scheduleTime || new Date().toISOString(),
        google_sheet_link: sheetLink,
        status: "pending"
      });
      
      if (error) throw error;

      setIsModalOpen(false);
      fetchCampaigns();
      // Reset form
      setName("");
      setSheetLink("");
    } catch (err) {
      console.error("Error creating campaign:", err);
    }
  };

  const handleStartCampaign = async (campaign: any) => {
    setIsStarting(campaign.id);
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: campaign.name,
          sheetUrl: campaign.google_sheet_link,
          webhookUrl: profile?.webhook_url,
          clientId: user?.id
        })
      });
      
      if (response.ok) {
        await supabase
          .from("campaigns")
          .update({ status: "active" })
          .eq("id", campaign.id);
        
        fetchCampaigns();
        alert("Campaign started successfully! Webhook sent to n8n.");
      }
    } catch (err) {
      alert("Failed to start campaign.");
    } finally {
      setIsStarting(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;
    try {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
      fetchCampaigns();
    } catch (err) {
      console.error("Error deleting campaign:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Campaigns</h2>
          <p className="text-[#666666]">Manage and schedule your calling agents.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          Create Campaign
        </button>
      </div>

      {/* Campaigns List */}
      <div className="bg-white border border-[#E5E5E5] rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E5E5E5] bg-[#FBFCFE] flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
            <input
              type="text"
              placeholder="Search campaigns..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#DDD] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-xs font-bold border border-[#DDD] rounded-lg">All</button>
            <button className="px-3 py-1.5 text-xs font-bold text-[#666] transition-colors hover:text-black">Active</button>
            <button className="px-3 py-1.5 text-xs font-bold text-[#666] transition-colors hover:text-black">Completed</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#FBFCFE] border-b border-[#E5E5E5] text-xs font-bold text-[#888888] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Campaign Name</th>
                <th className="px-6 py-4">AI Agent</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Schedules</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#888888]">Loading campaigns...</td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="space-y-2">
                      <p className="text-[#666666] font-medium">No campaigns found</p>
                      <button onClick={() => setIsModalOpen(true)} className="text-black font-bold text-sm underline">Create your first campaign</button>
                    </div>
                  </td>
                </tr>
              ) : campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold">{campaign.name}</span>
                      <span className="text-xs text-[#888888] flex items-center gap-1 mt-1">
                        <LinkIcon className="w-3 h-3" />
                        Google Sheets Linked
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-purple-600" />
                      {campaign.agent_name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full",
                      campaign.status === "pending" && "bg-orange-50 text-orange-600",
                      campaign.status === "active" && "bg-blue-50 text-blue-600",
                      campaign.status === "completed" && "bg-green-50 text-green-600",
                    )}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#666666]">
                    {format(new Date(campaign.schedule_time), "MMM d, h:mm a")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {campaign.status !== "active" && (
                        <button
                          onClick={() => handleStartCampaign(campaign)}
                          disabled={isStarting === campaign.id}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                          title="Start Campaign"
                        >
                          {isStarting === campaign.id ? <Pause className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(campaign.id)}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl p-8 z-[100] shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-6">New Campaign</h3>
              <form onSubmit={handleCreate} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#888888] uppercase tracking-wider">Campaign Name</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Senior Frontend Batch"
                    className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-2xl focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#888888] uppercase tracking-wider">AI Agent</label>
                  <select 
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-2xl focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option>Professional Recruiter Alex</option>
                    <option>Casual Outreach Sam</option>
                    <option>Technical Screener Dana</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#888888] uppercase tracking-wider">Schedule Time</label>
                  <input
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-2xl focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#888888] uppercase tracking-wider">Google Sheet Link</label>
                  <input
                    required
                    type="url"
                    value={sheetLink}
                    onChange={(e) => setSheetLink(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-2xl focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 font-bold rounded-2xl border border-[#E5E5E5] hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-black text-white font-bold rounded-2xl hover:opacity-90 transition-opacity"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...inputs: any[]) {
  const classes = inputs.filter(Boolean).join(" ");
  return classes;
}
