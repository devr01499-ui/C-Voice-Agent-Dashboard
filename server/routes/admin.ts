import express from 'express';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { supabase, logSystemEvent } from '../utils/db.js';

const router = express.Router();

// Get all users
router.get('/users', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, company_name, role, sheet_url, created_at')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return res.json({ success: true, users });
  } catch (error: any) {
    console.error("Failed to fetch users:", error);
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// Update user's Google Sheet URL
router.put('/users/:id/sheet', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { sheetUrl } = req.body;

  try {
    const { error } = await supabase
      .from('users')
      .update({ sheet_url: sheetUrl })
      .eq('id', id);

    if (error) throw new Error(error.message);

    await logSystemEvent(req.user.id, 'ADMIN_UPDATED_SHEET_URL', 'SUCCESS', `Updated sheet URL for user ${id}`);
    return res.json({ success: true, message: 'Sheet URL updated successfully' });
  } catch (error: any) {
    console.error("Failed to update sheet URL:", error);
    await logSystemEvent(req.user.id, 'ADMIN_UPDATE_SHEET_URL_FAILED', 'FAILED', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update sheet URL' });
  }
});

// Get system logs
router.get('/logs', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { data: logs, error } = await supabase
      .from('system_logs')
      .select('*, users(email)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);

    return res.json({ success: true, logs });
  } catch (error: any) {
    console.error("Failed to fetch logs:", error);
    return res.status(500).json({ success: false, message: 'Failed to fetch system logs' });
  }
});

export default router;
