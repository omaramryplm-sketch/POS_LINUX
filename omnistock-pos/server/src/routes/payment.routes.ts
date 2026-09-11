import { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authGuard } from '../middlewares/authGuard.js';

const prisma = new PrismaClient();
const router = Router();

// --- Crear Orden de Pago (PoC / Simulador) ---
router.post('/create-order', authGuard, async (req: Request, res: Response) => {
  const { amount, description } = req.body;

  try {
    // Aquí es donde en el futuro llamaríamos a:
    // https://api.mercadopago.com/point/integrate/post-payment
    
    console.log(`[PAYMENT] Iniciando cobro de $${amount} para: ${description}`);

    // SIMULADOR: Esperamos 3 segundos para simular al cliente pasando la tarjeta
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Devolvemos un éxito simulado
    res.json({
      status: 'success',
      data: {
        status: 'SUCCESS',
        id: 'SIM-' + Math.random().toString(36).substr(2, 9),
        message: 'Pago aprobado en terminal simulada',
        details: {
          card_type: 'VISA',
          last_four: '4242',
          auth_code: '123456'
        }
      }
    });

  } catch (err) {
    const errorId = `ERR-PAYMENT-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Error en la terminal de pago', errorId });
  }
});

export default router;
