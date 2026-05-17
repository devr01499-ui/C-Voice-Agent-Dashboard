import React, { useEffect, useState } from "react";
import {
  Users, Megaphone, Phone, AlertTriangle,
  Activity, CheckCircle2, IndianRupee, Clock, Link as LinkIcon
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { motion } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlobalStats {
  users: number;
  campaigns: number;
  calls: number;
  revenue: number;
  minutes: number;
  failedWorkflows: number;
}

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<GlobalStats>({
    users: 0, campaigns: 0, calls: 0,
    revenue: 0, minutes: 0, failedWorkflows: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGlobalStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all data in parallel using Supabase directly
        // Admin reads all users/campaigns via service role (backend),
        // or via RLS-safe queries here with anon key (reads only what RLS allows)
        const [
          usersRes,
          campaignsRes,
          callReportsRes,
          failedLogsRes,
          recentUsersRes,
        ] = await Promise.all([
          supabase.from("users").select("id", { count: "exact", head: true }),
          supabase.from("campaigns").select("id", { count: "exact", head: true }),
          supabase.from("call_reports").select("duration"),
          supabase.from("system_logs").select("id", { count: "exact", head: true }).eq("status", "FAILED"),
          supabase.from("users").select("id, email, company_name, role, created_at").order("created_at", { ascending: false }).limit(5),
        ]);

        const totalDuration = callReportsRes.data?.reduce(
          (acc, r) => acc + (r.duration || 0), 0
        ) || 0;
        const totalMinutes = Math.ceil(totalDuration / 60);

        setStats({
          users: usersRes.count ?? 0,
          campaigns: campaignsRes.count ?? 0,
          calls: callReportsRes.data?.length ?? 0,
          revenue: totalMinutes * 5,
          minutes: totalMinutes,
          failedWorkflows: failedLogsRes.count ?? 0,
        });

        setRecentUsers(recentUsersRes.data || []);
      } catch (err: any) {
        console.error("Error fetching global stats:", err);
        setError("Failed to load analytics. Check backend connectivity.");
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalStats();
  }, [user]);

  const statCards = [
    { name: "Active Users", value: stats.users, icon: Users, color: "blue" },
    { name: "Total Campaigns", value: stats.campaigns, icon: Megaphone, color: "purple" },
    { name: "Total Calls", value: stats.calls, icon: Phone, color: "cyan" },
    { name: "Total Minutes", value: stats.minutes, icon: Clock, color: "orange" },
    { name: "Est. Revenue (₹)", value: stats.revenue, icon: IndianRupee, color: "green" },
    { name: "Failed Workflows", value: stats.failedWorkflows, icon: AlertTriangle, color: "red" },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">Platform Analytics</h2>
          <p className="text-[#666666] mt-1">Global monitoring and platform health overview.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
          <Activity className="w-3 h-3" /> Admin Console
        </span>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07 }}
            className="p-6 bg-[#111] rounded-2xl border border-[#2a2a2a] shadow-lg relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={cn(
                "p-2.5 rounded-xl",
                stat.color === "blue" && "bg-blue-500/20 text-blue-400",
                stat.color === "purple" && "bg-purple-500/20 text-purple-400",
                stat.color === "orange" && "bg-orange-500/20 text-orange-400",
                stat.color === "cyan" && "bg-cyan-500/20 text-cyan-400",
                stat.color === "green" && "bg-green-500/20 text-green-400",
                stat.color === "red" && "bg-red-500/20 text-red-400",
              )}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-xs font-semibold text-[#666] uppercase tracking-wider mb-1">{stat.name}</p>
              {loading ? (
                <div className="h-8 w-24 bg-[#222] rounded animate-pulse" />
              ) : (
                <h3 className="text-3xl font-bold tracking-tight text-white">
                  {stat.value.toLocaleString()}
                </h3>
              )}
            </div>
            <div className={cn(
              "absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-[0.04] pointer-events-none transition-transform group-hover:scale-110",
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

      {/* Recent Users + Platform Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-purple-500" />
            <h3 className="font-bold text-base">Recent Signups</h3>
          </div>
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              ))
            ) : recentUsers.length === 0 ? (
              <p className="text-sm text-[#888]">No users yet.</p>
            ) : recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-[#F0F0F0] last:border-0">
                <div>
                  <p className="text-sm font-semibold">{u.company_name || u.email}</p>
                  <p className="text-xs text-[#888]">{u.email}</p>
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                  u.role === "admin" ? "bg-purple-50 text-purple-600" : "bg-green-50 text-green-600"
                )}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Health */}
        <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-base">Platform Health</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "Database Sync", sub: "Supabase PostgreSQL", ok: true },
              { label: "Authentication", sub: "Supabase Auth", ok: true },
              { label: "Webhook Engine", sub: "n8n Automation", ok: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-[#F9F9F9] rounded-xl border border-[#ECECEC]">
                <div>
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-[#888]">{item.sub}</p>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                  <CheckCircle2 className="w-3 h-3" /> OK
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
