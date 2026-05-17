import express from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { supabase } from '../utils/db.js';

const router = express.Router();

// Get reports for the authenticated user
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    // If admin, maybe fetch all reports? 
    // Requirement: "Admin dashboard should access all reports. Normal users should only access their own reports"
    let query = supabase.from('call_reports').select('*, campaigns(campaign_name)').order('created_at', { ascending: false });

    if (req.user.role !== 'admin') {
      // Need to filter by user's campaigns
      // Since call_reports doesn't have user_id, we join with campaigns
      // Supabase PostgREST allows filtering on joined tables:
      query = query.eq('campaigns.user_id', req.user.id);
      
      // Note: In Supabase, if RLS is strict, this will automatically filter.
      // Assuming RLS might be tricky with joins, we can manually fetch campaign IDs first
      const { data: userCampaigns } = await supabase.from('campaigns').select('id').eq('user_id', req.user.id);
      const campaignIds = userCampaigns?.map(c => c.id) || [];
      
      if (campaignIds.length === 0) {
        return res.json({ success: true, reports: [] });
      }
      query = supabase.from('call_reports').select('*, campaigns(campaign_name)').in('campaign_id', campaignIds).order('created_at', { ascending: false });
    }

    const { data: reports, error } = await query;

    if (error) throw new Error(error.message);

    // Cost logic: 1 minute = 5 INR. If duration is in seconds, calculate minutes.
    const enrichedReports = reports?.map((report: any) => {
      const durationSeconds = report.duration || 0;
      const durationMinutes = Math.ceil(durationSeconds / 60);
      const calculatedCost = durationMinutes * 5;

      return {
        ...report,
        cost: calculatedCost
      };
    });

    return res.json({ success: true, reports: enrichedReports });
  } catch (error: any) {
    console.error("Failed to fetch reports:", error);
    return res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
});

// Audit log report exports
router.post('/log-export', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { supabase, logSystemEvent } = await import('../utils/db.js');
    await logSystemEvent(req.user.id, 'REPORT_EXPORTED', 'SUCCESS', `User exported reports to CSV`);
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Failed to log export:", err);
    return res.status(500).json({ success: false });
  }
});

export default router;
