import { Router } from 'express';
import { summary } from '../controllers/dashboard.controller.js';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware.js';
const router = Router();
router.use(authenticate);
router.use(authorizeAdmin);
router.get('/', summary);
export default router;
