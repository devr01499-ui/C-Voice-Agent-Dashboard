import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Download, 
  User, 
  Phone, 
  Clock, 
  IndianRupee,
  ChevronDown
} from "lucide-react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/AuthContext";
import { format } from "date-fns";

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;
      setLoading(true);
      const q = query(collection(db, "reports"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(docs);
      setLoading(false);
    };
    fetchReports();
  }, [user]);

  const filteredReports = reports.filter(r => 
    r.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.jobRole.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ["Candidate", "Phone", "Role", "Status", "Duration (min)", "Cost (INR)", "Feedback"];
    const rows = filteredReports.map(r => [
      r.candidateName,
      r.phoneNumber,
      r.jobRole,
      r.status,
      r.duration,
      r.cost,
      r.feedback
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clarity_report_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Call Reports</h2>
          <p className="text-[#666666]">Detailed analytics from your AI calling sessions.</p>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-white border border-[#E5E5E5] text-black px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-all"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-[#E5E5E5] bg-[#FBFCFE] flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by candidate or role..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#DDD] rounded-xl text-sm focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-4 py-2 text-sm font-bold border border-[#DDD] rounded-xl flex items-center justify-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#FBFCFE] border-b border-[#E5E5E5] text-xs font-bold text-[#888888] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Cost</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-[#888888]">Loading reports...</td></tr>
              ) : filteredReports.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-[#888888]">No reports found</td></tr>
              ) : filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 group transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#666]">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{report.candidateName}</span>
                        <span className="text-xs text-[#888888]">{report.phoneNumber}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{report.jobRole}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full",
                      report.status === "interested" && "bg-green-50 text-green-600",
                      report.status === "not_interested" && "bg-red-50 text-red-600",
                      report.status === "no_answer" && "bg-gray-50 text-gray-600",
                    )}>
                      {report.status?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-[#666]">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {report.duration}m
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold">
                    <div className="flex items-center gap-0.5">
                      <IndianRupee className="w-3 h-3" />
                      {report.cost}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#888888]">
                    {format(new Date(report.createdAt), "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) { return inputs.filter(Boolean).join(" "); }
