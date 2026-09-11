import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/users.controller.js';
import { authGuard, roleGuard } from '../middlewares/authGuard.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema.js';

const router = Router();

router.use(authGuard);
router.use(roleGuard(['ADMIN']));

router.get('/', getUsers);
router.post('/', validate(createUserSchema), createUser);
router.put('/:id', validate(updateUserSchema), updateUser);
router.delete('/:id', deleteUser);

export default router;
