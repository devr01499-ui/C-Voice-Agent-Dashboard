import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { User, Link as LinkIcon, Search, Save, Loader2, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Users() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setUsersList(data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateSheetUrl = async (userId: string, newUrl: string) => {
    setSavingId(userId);
    try {
      const { error } = await supabase
        .from("users")
        .update({ sheet_url: newUrl, updated_at: new Date().toISOString() })
        .eq("id", userId);
      
      if (error) throw error;
      
      // Update local state without refetching all
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, sheet_url: newUrl } : u));
    } catch (err: any) {
      alert("Failed to assign Sheet URL: " + err.message);
    } finally {
      setSavingId(null);
    }
  };

  const filteredUsers = usersList.filter(u => 
    (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.company_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-[#666666]">Manage client accounts and assign Google Sheets.</p>
        </div>
        <button
          onClick={fetchUsers}
          className="bg-white border border-[#E5E5E5] text-black px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E5E5E5] bg-[#FBFCFE] flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email or company..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#DDD] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#FBFCFE] border-b border-[#E5E5E5] text-xs font-bold text-[#888888] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Assigned Google Sheet</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-[#888888]">Loading users...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-[#888888]">No users found</td></tr>
              ) : filteredUsers.map((u) => {
                const [tempUrl, setTempUrl] = useState(u.sheet_url || "");
                const isChanged = tempUrl !== (u.sheet_url || "");
                
                return (
                  <tr key={u.id} className="hover:bg-gray-50 group transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#666] shrink-0 overflow-hidden">
                          {u.logo_url ? (
                            <img src={u.logo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{u.company_name || 'No Company'}</span>
                          <span className="text-xs text-[#888888]">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full",
                        u.role === "admin" ? "bg-purple-50 text-purple-600" : "bg-gray-100 text-gray-600"
                      )}>
                        {u.role || "user"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative flex items-center max-w-md">
                        <LinkIcon className="absolute left-3 w-4 h-4 text-[#888]" />
                        <input
                          type="url"
                          value={tempUrl}
                          onChange={(e) => setTempUrl(e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          className="w-full pl-9 pr-4 py-2 bg-white border border-[#DDD] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleUpdateSheetUrl(u.id, tempUrl)}
                        disabled={!isChanged || savingId === u.id}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ml-auto cursor-pointer",
                          isChanged 
                            ? "bg-black text-white hover:opacity-90" 
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        )}
                      >
                        {savingId === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
