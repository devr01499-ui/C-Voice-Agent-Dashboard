import React, { useEffect, useState } from "react";
import { 
  Phone, 
  UserCheck, 
  CheckCircle2, 
  IndianRupee, 
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area 
} from "recharts";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { motion } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Dashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    total: 0,
    completed: 0,
    minutes: 0
  });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        // Fetch real stats from Supabase
        const { count: totalCalls } = await supabase
          .from("calls")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        
        const { count: completedCalls } = await supabase
          .from("calls")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "completed");
        
        const { data: minutesData } = await supabase
          .from("calls")
          .select("duration")
          .eq("user_id", user.id);
        
        const totalMinutes = minutesData?.reduce((acc, curr) => acc + (curr.duration || 0), 0) || 0;

        setCounts({
          total: totalCalls || 2543, // Fallback to mock for demo if empty
          completed: completedCalls || 2100,
          minutes: totalMinutes || 2543
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    fetchStats();
  }, [user]);

  const stats = [
    { name: "Total Calls", value: counts.total.toLocaleString(), icon: Phone, trend: "+12.5%", color: "blue" },
    { name: "Completed", value: counts.completed.toLocaleString(), icon: CheckCircle2, trend: "+23.1%", color: "purple" },
    { name: "Minutes Used", value: counts.minutes.toLocaleString(), icon: Clock, trend: "+10.1%", color: "cyan" },
  ];

const mockChartData = [
  { name: "Mon", calls: 400, cost: 2000 },
  { name: "Tue", calls: 300, cost: 1500 },
  { name: "Wed", calls: 600, cost: 3000 },
  { name: "Thu", calls: 800, cost: 4000 },
  { name: "Fri", calls: 500, cost: 2500 },
  { name: "Sat", calls: 200, cost: 1000 },
  { name: "Sun", calls: 100, cost: 500 },
];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
          <p className="text-[#666666]">Monitor your AI recruitment campaigns and performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-[#E5E5E5] rounded-xl text-sm font-semibold hover:bg-gray-50 flex items-center gap-2">
            Download Report
          </button>
          <button className="px-4 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
            Create Campaign
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 bg-white rounded-2xl border border-[#E5E5E5] shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn(
                "p-2 rounded-xl bg-opacity-10",
                stat.color === "blue" && "bg-blue-500 text-blue-600",
                stat.color === "green" && "bg-green-500 text-green-600",
                stat.color === "purple" && "bg-purple-500 text-purple-600",
                stat.color === "orange" && "bg-orange-500 text-orange-600",
                stat.color === "cyan" && "bg-cyan-500 text-cyan-600",
              )}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-green-600">
                {stat.trend}
                <TrendingUp className="w-3 h-3" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1">{stat.name}</p>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-8">
        {/* Main Chart */}
        <div className="p-6 bg-white rounded-2xl border border-[#E5E5E5]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg">Call Performance</h3>
            <select className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-medium">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "#888" }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "#888" }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="calls" 
                  stroke="#000" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCalls)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
