import React, { useState, useEffect } from "react";
import { 
  FileSpreadsheet, 
  ExternalLink, 
  HelpCircle,
  Copy,
  Check,
  AlertCircle
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../lib/AuthContext";

export default function GoogleSheetPage() {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const sheetUrl = profile?.sheet_url || "";

  const columns = [
    "Candidate Name",
    "Phone Number",
    "Job Role",
    "Status",
    "Call Result",
    "Feedback",
    "Call Duration",
    "Cost"
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(columns.join("\t"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Google Sheets Data</h2>
          <p className="text-[#666666]">Manage candidate data directly from your assigned Google Sheet.</p>
        </div>
        {sheetUrl && (
          <a
            href={sheetUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-black text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-sm w-max"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Google Sheets
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Instructions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 bg-white border border-[#E5E5E5] rounded-3xl shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-gray-400" />
              How to use this sheet
            </h3>
            <div className="space-y-4 text-sm text-[#666666]">
              <p>Your administrator has assigned this dedicated Google Sheet for your AI calling campaigns.</p>
              
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-800">
                <p className="font-semibold mb-1">To run a campaign:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Open the sheet and navigate to an empty row.</li>
                  <li>Enter the Candidate Name, Phone Number, and Job Role.</li>
                  <li>Leave Status, Call Result, and Feedback blank (our AI fills these).</li>
                  <li>Go to the Campaigns tab and click "Start" on your active campaign!</li>
                </ol>
              </div>

              <div className="mt-4">
                <p className="font-semibold text-black mb-2">Required Columns Format:</p>
                <div className="bg-[#F9F9F9] rounded-xl p-3 border border-[#E5E5E5] relative group">
                  <button 
                    onClick={handleCopy}
                    className="absolute top-2 right-2 p-1.5 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                    title="Copy column headers"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-gray-500" />}
                  </button>
                  <div className="flex flex-wrap gap-2 pr-6">
                    {columns.map(col => (
                      <span key={col} className="bg-white border border-[#E5E5E5] px-2 py-0.5 rounded text-[10px] font-mono text-black">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Viewport */}
        <div className="lg:col-span-2">
          <div className="h-[600px] bg-white border border-[#E5E5E5] rounded-3xl overflow-hidden relative shadow-sm">
            {!sheetUrl ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-[#888888] bg-[#F9F9F9]">
                <div className="w-20 h-20 bg-white shadow-sm border border-[#E5E5E5] rounded-full flex items-center justify-center mb-6">
                  <AlertCircle className="w-10 h-10 text-orange-400" />
                </div>
                <h4 className="text-xl font-bold text-black mb-2">No Google Sheet Assigned</h4>
                <p className="max-w-xs">You don't have a Google Sheet assigned to your profile yet. Please contact the administrator to set this up.</p>
              </div>
            ) : (
              <iframe 
                src={sheetUrl.includes('/edit') ? sheetUrl.replace("/edit", "/preview") : sheetUrl}
                className="w-full h-full border-none"
                title="Google Sheet Preview"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
