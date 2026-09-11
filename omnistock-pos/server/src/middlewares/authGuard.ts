import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import prisma from '../lib/prisma.js';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super_secret_omnistock_key_2024_bank_grade_key'
);

export const authGuard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'No token provided' });
    return;
  }

  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    (req as any).user = payload;
    next();
  } catch (error) {
    res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
  }
};

export const roleGuard = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.rol)) {
      res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      return;
    }
    next();
  };
};

export const ensureOwnership = (model: string, ownerField: string = 'id_usuario', idParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const resourceId = req.params[idParam];

    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    // Admins bypass ownership checks
    if (user.rol === 'ADMIN') return next();

    try {
      const resource = await (prisma as any)[model].findUnique({
        where: { id: Number(resourceId) }
      });

      if (!resource) return res.status(404).json({ message: 'Resource not found' });

      if (resource[ownerField] !== user.id) {
        return res.status(403).json({ 
          status: 'error', 
          code: 'FORBIDDEN_OWNERSHIP',
          message: 'Access denied: You are not the owner of this resource' 
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

