import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

// Mock Email Notification Service
const sendEmail = async (to: string, subject: string, body: string) => {
  console.log(`[EMAIL SENDING] To: ${to} | Subject: ${subject}`);
  console.log(`[EMAIL BODY]: ${body}`);
  // In production, integrate with SendGrid, Resend, or Mailgun here
  return true;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Trigger notification for new lead
  app.post("/api/notifications/new-lead", async (req, res) => {
    const { email, candidateName, campaignName, status } = req.body;
    
    if (email) {
      await sendEmail(
        email, 
        "New Interested Candidate Found!", 
        `Great news! ${candidateName} has expressed interest in the "${campaignName}" campaign. \nStatus: ${status}`
      );
    }
    res.json({ success: true });
  });

  // API Route: Trigger notification for campaign completion
  app.post("/api/notifications/campaign-complete", async (req, res) => {
    const { email, campaignName, totalCalls } = req.body;
    
    if (email) {
      await sendEmail(
        email, 
        "Campaign Completed!", 
        `Your campaign "${campaignName}" has finished calling all ${totalCalls} candidates. View your reports in the dashboard.`
      );
    }
    res.json({ success: true });
  });

  // API Route: Webhook proxy for n8n
  app.post("/api/campaigns/:id/start", async (req, res) => {
    const { id } = req.params;
    const campaignData = req.body;

    console.log(`Starting campaign ${id} and sending webhook to n8n...`);
    
    // In a real app, you'd fetch the user's webhookUrl from Firestore
    // For this MVP, we'll use a placeholder or check if it exists in req.body
    const webhookUrl = campaignData.webhookUrl || process.env.N8N_WEBHOOK_URL;

    if (webhookUrl) {
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "campaign_started",
            campaignId: id,
            ...campaignData
          })
        });
        
        if (response.ok) {
          return res.json({ success: true, message: "Webhook sent to n8n" });
        } else {
          return res.status(500).json({ success: false, message: "n8n webhook failed" });
        }
      } catch (error) {
        console.error("Webhook error:", error);
        return res.status(500).json({ success: false, message: "Webhook connection error" });
      }
    }

    res.json({ success: true, message: "Campaign data received (no webhook url configured)" });
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
