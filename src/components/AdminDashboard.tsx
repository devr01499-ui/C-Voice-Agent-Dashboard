import React, { useEffect, useState } from "react";
import { Users, Megaphone, Phone, AlertTriangle, Activity, Database, CheckCircle2, TrendingUp, IndianRupee, Clock } from "lucide-react";
import { supabase } from "../lib/supabase";
import { motion } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    campaigns: 0,
    calls: 0,
    revenue: 0,
    minutes: 0,
    failedWorkflows: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGlobalStats = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/global-stats`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        const data = await res.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error("Error fetching global stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGlobalStats();
  }, []);

  const statCards = [
    { name: "Active Users", value: stats.users, icon: Users, color: "blue" },
    { name: "Total Campaigns", value: stats.campaigns, icon: Megaphone, color: "purple" },
    { name: "Total Calls", value: stats.calls, icon: Phone, color: "cyan" },
    { name: "Total Minutes", value: stats.minutes, icon: Clock, color: "orange" },
    { name: "Est. Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: IndianRupee, color: "green" },
    { name: "Failed Workflows", value: stats.failedWorkflows, icon: AlertTriangle, color: "red" },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">Platform Analytics</h2>
          <p className="text-[#666666] mt-1">Global monitoring and platform health overview.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 bg-[#111] rounded-2xl border border-[#333] shadow-lg relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={cn(
                "p-2.5 rounded-xl bg-opacity-20",
                stat.color === "blue" && "bg-blue-500 text-blue-400",
                stat.color === "purple" && "bg-purple-500 text-purple-400",
                stat.color === "orange" && "bg-orange-500 text-orange-400",
                stat.color === "cyan" && "bg-cyan-500 text-cyan-400",
                stat.color === "green" && "bg-green-500 text-green-400",
                stat.color === "red" && "bg-red-500 text-red-400",
              )}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1">{stat.name}</p>
              {loading ? (
                <div className="h-8 w-24 bg-[#222] rounded animate-pulse" />
              ) : (
                <h3 className="text-3xl font-bold tracking-tight text-white">{stat.value.toLocaleString()}</h3>
              )}
            </div>
            {/* Decorative background element */}
            <div className={cn(
              "absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-[0.05] pointer-events-none transition-transform group-hover:scale-110",
              stat.color === "blue" && "bg-blue-500",
              stat.color === "purple" && "bg-purple-500",
              stat.color === "orange" && "bg-orange-500",
              stat.color === "cyan" && "bg-cyan-500",
              stat.color === "green" && "bg-green-500",
              stat.color === "red" && "bg-red-500",
            )} />
          </motion.div>
        ))}
      </div>

      {/* Recent Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-[#E5E5E5] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-lg text-black">Platform Health</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-[#F9F9F9] rounded-xl border border-[#E5E5E5] flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">Database Sync</p>
                <p className="text-xs text-[#888]">Supabase Connection</p>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                <CheckCircle2 className="w-3 h-3" /> Operational
              </span>
            </div>
            <div className="p-4 bg-[#F9F9F9] rounded-xl border border-[#E5E5E5] flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">Webhook Listeners</p>
                <p className="text-xs text-[#888]">n8n Automation Engine</p>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                <CheckCircle2 className="w-3 h-3" /> Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
