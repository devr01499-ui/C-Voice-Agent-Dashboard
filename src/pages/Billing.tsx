import React from "react";
import { 
  CreditCard, 
  IndianRupee, 
  Clock, 
  Calendar,
  History,
  Zap,
  CheckCircle2
} from "lucide-react";

export default function Billing() {
  const currentUsage = {
    totalMinutes: 2543,
    totalCost: 12715,
    plan: "Pro Starter",
    nextBilling: "June 1, 2026"
  };

  const pricingFeatures = [
    "Unlimited AI Agent access",
    "Real-time Google Sheet Sync",
    "Global calling support",
    "n8n & Zapier Webhooks",
    "Custom training models",
    "Role-based access control"
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Billing & Usage</h2>
        <p className="text-[#666666]">Track your credits and plan details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Usage Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-white border border-[#E5E5E5] rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-[#888] tracking-widest leading-none">Usage</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#888888]">Total Minutes Consumed</p>
                <h3 className="text-3xl font-bold">{currentUsage.totalMinutes.toLocaleString()}</h3>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-[65%]" />
              </div>
            </div>

            <div className="p-6 bg-black text-white rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-white/10 text-white rounded-xl">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest leading-none">Cost</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-400">Total Accrued Cost</p>
                <h3 className="text-3xl font-bold">₹{currentUsage.totalCost.toLocaleString()}</h3>
              </div>
              <p className="text-xs text-gray-400">Next billing on {currentUsage.nextBilling}</p>
            </div>
          </div>

          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <History className="w-5 h-5" />
              Transaction History
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-[#F0F0F0] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Plan Renewal - {currentUsage.plan}</p>
                      <p className="text-xs text-[#888]">May {i}, 2026</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">₹2,499.00</p>
                    <p className="text-[10px] font-bold text-green-600 uppercase">Paid</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="lg:col-span-1">
          <div className="p-8 bg-white border-2 border-black rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-black text-white px-6 py-1 rounded-bl-3xl text-[10px] font-bold uppercase tracking-widest">
              Current Plan
            </div>
            <div className="mb-8">
              <span className="text-[#888] font-bold uppercase text-xs tracking-widest">{currentUsage.plan}</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-black">₹2,499</span>
                <span className="text-[#888] font-semibold text-sm">/mo</span>
              </div>
              <p className="text-sm text-[#666] mt-4">For fast-growing startups need high volume recruitment.</p>
            </div>
            
            <div className="space-y-4 mb-8">
              {pricingFeatures.map(feat => (
                <div key={feat} className="flex items-center gap-3 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  {feat}
                </div>
              ))}
            </div>

            <button className="w-full py-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
              <Zap className="w-5 h-5 fill-white" />
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
