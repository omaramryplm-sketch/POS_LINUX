import { Request, Response } from 'express';
import * as argon2 from 'argon2';
import * as jose from 'jose';
import prisma from '../lib/prisma.js';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super_secret_omnistock_key_2024_bank_grade_key'
);

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
      // Blind Error Handling: Use same generic message for non-existent users
      res.status(401).json({ status: 'error', code: 'INVALID_CREDENTIALS' });
      return;
    }

    // Check Lockout Status
    if (user.security?.lockedUntil && user.security.lockedUntil > new Date()) {
      res.status(423).json({ 
        status: 'error',
        code: 'ACCOUNT_LOCKED',
        message: 'Account temporarily locked. Please try again later.' 
      });
      return;
    }

    // Verify Password with Argon2
    const isValidPassword = await argon2.verify(user.password, password);

    if (!isValidPassword) {
      // Update Failed Attempts
      await prisma.userSecurity.upsert({
        where: { id_usuario: user.id },
        update: { 
          failedAttempts: { increment: 1 },
          lockedUntil: (user.security?.failedAttempts || 0) + 1 >= 5 
            ? new Date(Date.now() + 15 * 60 * 1000) // 15 min lockout
            : null
        },
        create: {
          id_usuario: user.id,
          failedAttempts: 1
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
