import React, { useEffect, useState } from "react";
import { 
  Phone, 
  CheckCircle2, 
  IndianRupee, 
  Clock,
  TrendingUp,
  Download,
  Plus
} from "lucide-react";
import { 
  AreaChart,
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { motion } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useNavigate } from "react-router-dom";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    total: 0,
    completed: 0,
    minutes: 0
  });

  const [dateFilter, setDateFilter] = useState("7days");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch real data from call_reports based on the date filter
        const dateLimit = new Date();
        if (dateFilter === "7days") dateLimit.setDate(dateLimit.getDate() - 7);
        else if (dateFilter === "30days") dateLimit.setDate(dateLimit.getDate() - 30);
        else if (dateFilter === "24hours") dateLimit.setHours(dateLimit.getHours() - 24);

        // Fetching reports through backend or direct supabase query
        // Since call_reports doesn't have user_id, we fetch campaigns first
        const { data: userCampaigns } = await supabase.from('campaigns').select('id').eq('user_id', user.id);
        const campaignIds = userCampaigns?.map(c => c.id) || [];

        if (campaignIds.length === 0) {
          setCounts({ total: 0, completed: 0, minutes: 0 });
          setLoading(false);
          return;
        }

        // Fetch reports for those campaigns
        let query = supabase.from("call_reports").select("result, duration, created_at").in("campaign_id", campaignIds);
        
        if (dateFilter !== "all") {
          query = query.gte("created_at", dateLimit.toISOString());
        }

        const { data: reportsData } = await query;
        
        const totalCalls = reportsData?.length || 0;
        const completedCalls = reportsData?.filter(r => r.result !== "pending" && r.result !== "failed").length || 0;
        const totalDurationSecs = reportsData?.reduce((acc, curr) => acc + (curr.duration || 0), 0) || 0;
        const totalMinutes = Math.ceil(totalDurationSecs / 60);

        setCounts({
          total: totalCalls, 
          completed: completedCalls,
          minutes: totalMinutes
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, dateFilter]);

  const stats = [
    { name: "Total Calls", value: counts.total.toLocaleString(), icon: Phone, color: "blue" },
    { name: "Completed", value: counts.completed.toLocaleString(), icon: CheckCircle2, color: "purple" },
    { name: "Minutes Used", value: counts.minutes.toLocaleString(), icon: Clock, color: "cyan" },
    { name: "Total Cost", value: `₹${(counts.minutes * 5).toLocaleString()}`, icon: IndianRupee, color: "orange" },
  ];

  // Placeholder graph data based on selection
  const mockChartData = dateFilter === "7days" ? [
    { name: "Mon", calls: 12, cost: 60 },
    { name: "Tue", calls: 19, cost: 95 },
    { name: "Wed", calls: 3, cost: 15 },
    { name: "Thu", calls: 5, cost: 25 },
    { name: "Fri", calls: 2, cost: 10 },
    { name: "Sat", calls: 0, cost: 0 },
    { name: "Sun", calls: 4, cost: 20 },
  ] : [
    { name: "Week 1", calls: 45, cost: 225 },
    { name: "Week 2", calls: 30, cost: 150 },
    { name: "Week 3", calls: 60, cost: 300 },
    { name: "Week 4", calls: 80, cost: 400 },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">Operational Overview</h2>
          <p className="text-[#666666] mt-1">Monitor your AI recruitment workflows and usage metrics.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => navigate('/reports')}
            className="px-4 py-2 bg-white border border-[#E5E5E5] rounded-xl text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Reports
          </button>
          <button 
            onClick={() => navigate('/campaigns')}
            className="px-4 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 bg-white rounded-2xl border border-[#E5E5E5] shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={cn(
                "p-2.5 rounded-xl bg-opacity-10",
                stat.color === "blue" && "bg-blue-500 text-blue-600",
                stat.color === "purple" && "bg-purple-500 text-purple-600",
                stat.color === "orange" && "bg-orange-500 text-orange-600",
                stat.color === "cyan" && "bg-cyan-500 text-cyan-600",
              )}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1">{stat.name}</p>
              {loading ? (
                <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
              ) : (
                <h3 className="text-3xl font-bold tracking-tight text-[#111]">{stat.value}</h3>
              )}
            </div>
            {/* Decorative background element */}
            <div className={cn(
              "absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-[0.03] pointer-events-none",
              stat.color === "blue" && "bg-blue-500",
              stat.color === "purple" && "bg-purple-500",
              stat.color === "orange" && "bg-orange-500",
              stat.color === "cyan" && "bg-cyan-500",
            )} />
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="p-6 bg-white rounded-2xl border border-[#E5E5E5] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="font-bold text-lg text-[#111]">Call Volume & Cost</h3>
            <p className="text-sm text-[#666]">Visualizing the number of calls placed over time.</p>
          </div>
          <div className="flex items-center gap-2 bg-[#F5F5F5] p-1 rounded-xl">
            <button 
              onClick={() => setDateFilter("24hours")}
              className={cn("px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors", dateFilter === "24hours" ? "bg-white shadow-sm text-black" : "text-[#666] hover:text-black")}
            >
              24h
            </button>
            <button 
              onClick={() => setDateFilter("7days")}
              className={cn("px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors", dateFilter === "7days" ? "bg-white shadow-sm text-black" : "text-[#666] hover:text-black")}
            >
              7 Days
            </button>
            <button 
              onClick={() => setDateFilter("30days")}
              className={cn("px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors", dateFilter === "30days" ? "bg-white shadow-sm text-black" : "text-[#666] hover:text-black")}
            >
              30 Days
            </button>
          </div>
        </div>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "#666" }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "#666" }} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: "16px", border: "1px solid #E5E5E5", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", padding: "12px" }}
                cursor={{ stroke: '#E5E5E5', strokeWidth: 2, strokeDasharray: '4 4' }}
              />
              <Area 
                type="monotone" 
                dataKey="calls" 
                name="Total Calls"
                stroke="#000" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCalls)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: "#000" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
