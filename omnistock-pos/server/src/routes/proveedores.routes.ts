import { Router } from 'express';
import { getProveedores, createProveedor, updateProveedor, deleteProveedor, getVisitas, createVisita } from '../controllers/proveedores.controller.js';
import { authGuard, roleGuard } from '../middlewares/authGuard.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createProveedorSchema, updateProveedorSchema, createVisitaSchema } from '../schemas/proveedores.schema.js';

const router = Router();

router.use(authGuard);
router.use(roleGuard(['ADMIN']));

router.get('/visitas', getVisitas);
router.post('/visitas', validate(createVisitaSchema), createVisita);

router.get('/', getProveedores);
router.post('/', validate(createProveedorSchema), createProveedor);
router.put('/:id', validate(updateProveedorSchema), updateProveedor);
router.delete('/:id', deleteProveedor);

export default router;
