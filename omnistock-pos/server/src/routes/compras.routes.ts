import { Router } from 'express';
import { createCompra, getPurchaseSuggestions } from '../controllers/compras.controller.js';
import { authGuard, roleGuard } from '../middlewares/authGuard.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createCompraSchema } from '../schemas/compras.schema.js';

const router = Router();

router.use(authGuard);
router.use(roleGuard(['ADMIN']));

router.get('/sugerencias', getPurchaseSuggestions);
router.post('/', validate(createCompraSchema), createCompra);

export default router;
