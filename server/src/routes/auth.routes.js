import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { changePasswordSchema, fiscalLoginSchema, loginSchema, updateProfileSchema } from '../validators/auth.validator.js';

const router = Router();
router.post('/login', validate(loginSchema), authController.login);
router.get('/fiscais', authController.listFiscais);
router.post('/fiscal/login', validate(fiscalLoginSchema), authController.fiscalLogin);
router.get('/me', authenticate, authController.me);
router.put('/profile', authenticate, authorizeAdmin, validate(updateProfileSchema), authController.updateProfile);
router.put('/password', authenticate, authorizeAdmin, validate(changePasswordSchema), authController.changePassword);
export default router;
