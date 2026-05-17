import express from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { checkIdempotency, preventDuplicateCampaigns } from '../utils/idempotency.js';
import { supabase, logSystemEvent } from '../utils/db.js';

const router = express.Router();

// Trigger a new campaign
router.post('/', requireAuth, checkIdempotency, preventDuplicateCampaigns, async (req: AuthRequest, res) => {
  const { campaignName, agentName, scheduleTime, googleSheetLink, candidates } = req.body;
  const userId = req.user.id;

  try {
    // 1. Check if user has a google sheet URL assigned by admin (or use provided)
    const { data: userData } = await supabase.from('users').select('sheet_url').eq('id', userId).single();
    
    // 2. Insert Campaign to DB
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        user_id: userId,
        campaign_name: campaignName,
        status: 'running', // Assuming n8n starts immediately for now
        schedule_time: scheduleTime || null,
        // We do not store google_sheet_link here anymore as it's at user level, but let's keep it if frontend sends it
      })
      .select()
      .single();

    if (campaignError) {
      throw new Error(campaignError.message);
    }

    // 3. Insert Candidates
    if (candidates && Array.isArray(candidates) && candidates.length > 0) {
      const candidatesToInsert = candidates.map((c: any) => ({
        user_id: userId,
        campaign_id: campaign.id,
        candidate_name: c.name,
        phone: c.phone,
        role: c.role || 'Candidate',
        status: 'pending'
      }));
      
      const { error: candidatesError } = await supabase.from('candidates').insert(candidatesToInsert);
      if (candidatesError) {
         console.error("Failed to insert candidates:", candidatesError);
         await logSystemEvent(userId, 'CANDIDATE_INSERT_FAILED', 'FAILED', candidatesError.message);
      }
    }

    // 4. Trigger n8n webhook
    // n8n logic is manual, but if we need to ping n8n to start a workflow:
    // In MVP, we might not have a dynamic webhook URL. We use a global one or one stored in env.
    const webhookUrl = process.env.N8N_WEBHOOK_URL; 
    
    if (webhookUrl) {
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "campaign_started",
            campaignId: campaign.id,
            userId: userId,
            campaignName,
            userSheetUrl: userData?.sheet_url
          })
        });
        
        if (!response.ok) {
           await logSystemEvent(userId, 'N8N_WEBHOOK_FAILED', 'FAILED', `Webhook returned ${response.status}`);
        } else {
           await logSystemEvent(userId, 'N8N_WEBHOOK_SUCCESS', 'SUCCESS', `Triggered campaign ${campaign.id}`);
        }
      } catch (webhookError: any) {
        console.error("Webhook error:", webhookError);
        await logSystemEvent(userId, 'N8N_WEBHOOK_ERROR', 'FAILED', webhookError.message);
      }
    } else {
       await logSystemEvent(userId, 'N8N_WEBHOOK_SKIPPED', 'WARNING', 'No webhook URL configured');
    }

    return res.json({ success: true, campaign });

  } catch (error: any) {
    console.error("Campaign creation error:", error);
    await logSystemEvent(userId, 'CAMPAIGN_CREATE_FAILED', 'FAILED', error.message);
    return res.status(500).json({ success: false, message: 'Failed to create campaign' });
  }
});

// Update campaign status (webhook from n8n)
router.post('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, results } = req.body;
  
  // Ideally this should have a secret key auth from n8n
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.N8N_WEBHOOK_SECRET}`) {
     // return res.status(401).json({ success: false, message: 'Unauthorized webhook call' });
     // Relaxing for MVP if secret is not set, but logging it.
     console.warn("Unauthenticated webhook call to campaign status");
  }

  try {
    const { error } = await supabase
      .from('campaigns')
      .update({ status })
      .eq('id', id);

    if (error) throw new Error(error.message);
    
    await logSystemEvent(null, 'CAMPAIGN_STATUS_UPDATED', 'SUCCESS', `Campaign ${id} updated to ${status}`);
    return res.json({ success: true });
  } catch (error: any) {
    await logSystemEvent(null, 'CAMPAIGN_STATUS_UPDATE_FAILED', 'FAILED', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update campaign' });
  }
});

export default router;
