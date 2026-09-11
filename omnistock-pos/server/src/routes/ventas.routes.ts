import { Router } from 'express';
import { createVenta, getProducts, getTopProducts, getVentaDetail } from '../controllers/ventas.controller.js';
import { authGuard, ensureOwnership } from '../middlewares/authGuard.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createVentaSchema } from '../schemas/auth.schema.js';

const router = Router();

router.use(authGuard);

router.get('/top-productos', getTopProducts);
router.get('/productos', getProducts);
router.get('/:id', ensureOwnership('venta'), getVentaDetail);
router.post('/', validate(createVentaSchema), createVenta);

export default router;
