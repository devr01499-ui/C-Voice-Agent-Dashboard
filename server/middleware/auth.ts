import { Request, Response, NextFunction } from 'express';
import { supabase, logSystemEvent } from '../utils/db.js';

export interface AuthRequest extends Request {
  user?: any;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      await logSystemEvent(null, 'API_AUTH_FAILURE', 'FAILED', error?.message || 'Invalid token');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Fetch user role from DB
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    req.user = {
      ...user,
      role: userData?.role || 'user'
    };

    next();
  } catch (error: any) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ success: false, message: 'Internal server error during authentication' });
  }
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (req.user.role !== 'admin') {
    await logSystemEvent(req.user.id, 'API_ADMIN_ACCESS_DENIED', 'FAILED', `User attempted to access admin route: ${req.originalUrl}`);
    return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
  }

  next();
};
