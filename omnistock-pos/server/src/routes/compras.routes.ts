import { Router } from 'express';
import { createCompra, getPurchaseSuggestions } from '../controllers/compras.controller.js';
import { authGuard, roleGuard } from '../middlewares/authGuard.js';

const router = Router();

router.use(authGuard);
router.use(roleGuard(['ADMIN']));

router.get('/sugerencias', getPurchaseSuggestions);
router.post('/', createCompra);

export default router;
