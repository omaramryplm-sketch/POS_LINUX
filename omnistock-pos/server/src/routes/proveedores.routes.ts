import { Router } from 'express';
import { getProveedores, createProveedor, updateProveedor, deleteProveedor, getVisitas, createVisita } from '../controllers/proveedores.controller.js';
import { authGuard, roleGuard } from '../middlewares/authGuard.js';

const router = Router();

router.use(authGuard);
router.use(roleGuard(['ADMIN']));

router.get('/visitas', getVisitas);
router.post('/visitas', createVisita);

router.get('/', getProveedores);
router.post('/', createProveedor);
router.put('/:id', updateProveedor);
router.delete('/:id', deleteProveedor);

export default router;
