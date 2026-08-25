import { Router } from 'express';
import { summary } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
const router = Router();
router.use(authenticate);
router.get('/', summary);
export default router;
