import { Request, Response, NextFunction } from 'express';
import { supabase, logSystemEvent } from './db.js';

// Simple in-memory cache for idempotency (could use Redis or DB table for production scaling)
const idempotencyCache = new Map<string, { timestamp: number, response: any }>();

export const checkIdempotency = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const idempotencyKey = req.headers['x-idempotency-key'] as string;
  
  if (!idempotencyKey) {
    // If no key is provided, we just pass through. 
    // For strict APIs, we could enforce it, but for MVP passthrough is safer.
    return next();
  }

  const cached = idempotencyCache.get(idempotencyKey);
  const now = Date.now();
  
  // Cache valid for 24 hours
  if (cached && (now - cached.timestamp < 24 * 60 * 60 * 1000)) {
    console.log(`[Idempotency] Returning cached response for key: ${idempotencyKey}`);
    return res.json(cached.response);
  }

  // Intercept response to save it
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    idempotencyCache.set(idempotencyKey, { timestamp: now, response: body });
    return originalJson(body);
  };

  next();
};

export const preventDuplicateCampaigns = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.user?.id;
  const { campaignName } = req.body;
  
  if (!userId || !campaignName) return next();

  // Check if a campaign with the exact same name was created by this user in the last 1 minute
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  
  const { data, error } = await supabase
    .from('campaigns')
    .select('id')
    .eq('user_id', userId)
    .eq('campaign_name', campaignName)
    .gte('created_at', oneMinuteAgo);

  if (error) {
    console.error("Error checking duplicate campaigns:", error);
    return next();
  }

  if (data && data.length > 0) {
    await logSystemEvent(userId, 'DUPLICATE_CAMPAIGN_ATTEMPT', 'BLOCKED', `Blocked duplicate creation of campaign: ${campaignName}`);
    return res.status(429).json({ 
      success: false, 
      message: 'A campaign with this name was created very recently. Please wait a moment.' 
    });
  }

  next();
};
