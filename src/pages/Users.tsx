import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  User, Link as LinkIcon, Search, Save,
  Loader2, RefreshCw, CheckCircle2, ExternalLink, X
} from "lucide-react";
import { motion } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Isolated UserRow component so useState/hooks work correctly inside a list ──
const UserRow = ({
  u,
  onSaved,
}: {
  u: any;
  onSaved: (id: string, url: string) => void;
}) => {
  const [tempUrl, setTempUrl] = useState<string>(u.sheet_url || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isChanged = tempUrl !== (u.sheet_url || "");

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ sheet_url: tempUrl })
        .eq("id", u.id);

      if (error) throw error;

      onSaved(u.id, tempUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setTempUrl("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* User info row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#666] shrink-0">
            {u.logo_url ? (
              <img src={u.logo_url} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className="font-bold text-sm text-[#111]">{u.company_name || "No Company"}</p>
            <p className="text-xs text-[#888]">{u.email || "No email"}</p>
          </div>
        </div>
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0",
          u.role === "admin"
            ? "bg-purple-50 text-purple-600 border border-purple-100"
            : "bg-green-50 text-green-600 border border-green-100"
        )}>
          {u.role || "user"}
        </span>
      </div>

      {/* Google Sheet Assignment */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#888] uppercase tracking-wider">
          Assigned Google Sheet URL
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAA]" />
            <input
              type="url"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full pl-9 pr-8 py-2.5 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
            />
            {tempUrl && (
              <button
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#AAA] hover:text-[#555] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Open in new tab if URL exists */}
          {u.sheet_url && !isChanged && (
            <a
              href={u.sheet_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl text-[#666] hover:text-black hover:bg-gray-100 transition-colors"
              title="Open sheet"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <button
            onClick={handleSave}
            disabled={!isChanged || saving}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 cursor-pointer",
              saved
                ? "bg-green-500 text-white"
                : isChanged
                  ? "bg-black text-white hover:opacity-90"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <><CheckCircle2 className="w-4 h-4" /> Saved</>
            ) : (
              <><Save className="w-4 h-4" /> Save</>
            )}
          </button>
        </div>

        {/* Current assignment indicator */}
        {u.sheet_url && !isChanged && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Sheet assigned and active
          </p>
        )}
        {!u.sheet_url && !isChanged && (
          <p className="text-xs text-orange-500">
            ⚠ No sheet assigned yet — user cannot start campaigns
          </p>
        )}
      </div>
    </motion.div>
  );
};

// ── Main Users page ──
export default function Users() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsersList(data || []);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaved = (userId: string, newUrl: string) => {
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, sheet_url: newUrl } : u))
    );
  };

  const filteredUsers = usersList.filter(
    (u) =>
      (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.company_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const assignedCount = usersList.filter((u) => !!u.sheet_url).length;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-[#666666] mt-0.5">
            Assign Google Sheets to clients and manage account access.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="bg-white border border-[#E5E5E5] text-black px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Users", value: usersList.length },
          { label: "Sheets Assigned", value: assignedCount },
          { label: "Pending Setup", value: usersList.length - assignedCount },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#E5E5E5] rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-[#888] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by email or company..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black shadow-sm"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* User Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white border border-[#E5E5E5] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 text-[#888888]">
          <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No users found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((u) => (
            <UserRow key={u.id} u={u} onSaved={handleSaved} />
          ))}
        </div>
      )}
    </div>
  );
}
