import React, { useState } from "react";
import { 
  FileSpreadsheet, 
  ExternalLink, 
  HelpCircle,
  Copy,
  Check
} from "lucide-react";
import { motion } from "motion/react";

export default function GoogleSheetPage() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [showIframe, setShowIframe] = useState(false);
  const [copied, setCopied] = useState(false);

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
          <h2 className="text-2xl font-bold tracking-tight">Google Sheets</h2>
          <p className="text-[#666666]">Connect and manage your candidate data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Instructions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 bg-black text-white rounded-3xl shadow-xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-gray-400" />
              Setup Guide
            </h3>
            <ol className="space-y-4 text-sm text-gray-300 list-decimal list-inside">
              <li>Create a new Google Sheet.</li>
              <li>Add the following columns to the first row:</li>
              <div className="bg-white/10 rounded-xl p-3 my-2 border border-white/10 relative group">
                <button 
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-1.5 hover:bg-white/20 rounded-md transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
                </button>
                <div className="flex flex-wrap gap-2 pr-6">
                  {columns.map(col => (
                    <span key={col} className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-mono">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
              <li>Set sharing to "Anyone with the link can edit" (for n8n writing).</li>
              <li>Copy the URL and paste it when creating a campaign.</li>
            </ol>
          </div>

          <div className="p-6 bg-white border border-[#E5E5E5] rounded-3xl">
            <h3 className="font-bold text-lg mb-4">Preview Sheet</h3>
            <p className="text-sm text-[#666666] mb-4">Paste a sheet URL to preview it here.</p>
            <div className="space-y-4">
              <input 
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/..."
                className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-2xl text-sm focus:outline-none"
              />
              <button 
                onClick={() => setShowIframe(true)}
                className="w-full py-3 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                <FileSpreadsheet className="w-5 h-5" />
                Load Preview
              </button>
            </div>
          </div>
        </div>

        {/* Viewport */}
        <div className="lg:col-span-2">
          <div className="h-[600px] bg-white border border-[#E5E5E5] rounded-3xl overflow-hidden relative shadow-inner">
            {!showIframe || !sheetUrl ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-[#888888]">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <FileSpreadsheet className="w-10 h-10 text-gray-300" />
                </div>
                <h4 className="text-xl font-bold text-black mb-2">No active sheet preview</h4>
                <p className="max-w-xs">Enter a Google Sheet URL on the left to see your data live.</p>
              </div>
            ) : (
              <iframe 
                src={sheetUrl.replace("/edit", "/preview")}
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
