import { Router } from 'express';
import { pdf, report } from '../controllers/relatorio.controller.js';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { relatorioSchema } from '../validators/relatorio.validator.js';

const router = Router();
router.use(authenticate);
router.use(authorizeAdmin);
router.get('/pdf', validate(relatorioSchema), pdf);
router.get('/chamadas', validate(relatorioSchema), report);
router.get('/', validate(relatorioSchema), report);

export default router;
