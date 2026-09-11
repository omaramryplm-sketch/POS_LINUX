import { Router } from 'express';
import { getPendingSugerencias, updateSugerencia } from '../controllers/sugerencias.controller.js';
import { authGuard } from '../middlewares/authGuard.js';
import { roleGuard } from '../middlewares/authGuard.js';

const router = Router();

router.use(authGuard);
router.use(roleGuard(['ADMIN']));

router.get('/pendientes', getPendingSugerencias);
router.patch('/:id', updateSugerencia);

export default router;
