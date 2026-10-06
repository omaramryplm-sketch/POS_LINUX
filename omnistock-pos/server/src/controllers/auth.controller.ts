import { Request, Response } from 'express';
import * as argon2 from 'argon2';
import * as jose from 'jose';
import prisma from '../lib/prisma.js';
import { JWT_SECRET } from '../lib/config.js';

export const login = async (req: Request, res: Response): Promise<void> => {
  const errorId = `ERR-AUTH-${Date.now()}`;
  try {
    const { username, password } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    const user = await prisma.usuario.findUnique({
      where: { username },
      include: { security: true }
    });

    if (!user) {
      // Blind Error Handling & Timing-Attack Mitigation:
      // Verify against a dummy hash so invalid usernames take the exact same compute time (~150ms)
      await argon2.verify('$argon2id$v=19$m=65536,t=3,p=4$IXPxy5FaSA8+WmwgZZGJQA$e85C9SO91j9to9+THnd8XnOlIUO8OLUPCp8MKtgkzu8', password).catch(() => false);
      res.status(401).json({ status: 'error', code: 'INVALID_CREDENTIALS' });
      return;
    }

    // Verify Password with Argon2 (uniform timing with dummy hash branch)
    const isValidPassword = await argon2.verify(user.password, password);

    if (!isValidPassword) {
      // Track failed attempts and IP for auditing without locking account globally
      // (Brute force protection is enforced per-IP by authLimiter to prevent denial of service)
      await prisma.userSecurity.upsert({
        where: { id_usuario: user.id },
        update: { 
          failedAttempts: { increment: 1 },
          lastIp: clientIp
        },
        create: {
          id_usuario: user.id,
          failedAttempts: 1,
          lastIp: clientIp
        }
      });

      res.status(401).json({ status: 'error', code: 'INVALID_CREDENTIALS' });
      return;
    }

    // Reset Security on Success
    await prisma.userSecurity.upsert({
      where: { id_usuario: user.id },
      update: { 
        failedAttempts: 0,
        lockedUntil: null,
        lastIp: clientIp,
        lastLogin: new Date()
      },
      create: {
        id_usuario: user.id,
        failedAttempts: 0,
        lastIp: clientIp,
        lastLogin: new Date()
      }
    });

    // Generate JWT with jose (asynchronous)
    const token = await new jose.SignJWT({ 
      id: user.id, 
      username: user.username, 
      rol: user.rol 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(JWT_SECRET);

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nombre_completo: user.nombre_completo,
          rol: user.rol
        }
      }
    });
  } catch (error) {
    // Blind Error Handling
    console.error(`[${errorId}] Login error:`, error);
    res.status(500).json({ status: 'error', code: 'INTERNAL_ERROR', error_id: errorId });
  }
};
