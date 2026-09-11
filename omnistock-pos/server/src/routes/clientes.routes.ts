import { Router } from 'express';
import { 
  getClientes, 
  createCliente, 
  getClienteDetail, 
  registrarAbono,
  updateCliente
} from '../controllers/clientes.controller.js';
import { authGuard, roleGuard } from '../middlewares/authGuard.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createClienteSchema, updateClienteSchema, abonoSchema } from '../schemas/cliente.schema.js';

const router = Router();

router.get('/', authGuard, getClientes);
router.post('/', authGuard, roleGuard(['ADMIN']), validate(createClienteSchema), createCliente);
router.get('/:id', authGuard, roleGuard(['ADMIN']), getClienteDetail);
router.post('/abono', authGuard, roleGuard(['ADMIN']), validate(abonoSchema), registrarAbono);
router.put('/:id', authGuard, roleGuard(['ADMIN']), validate(updateClienteSchema), updateCliente);

export default router;
