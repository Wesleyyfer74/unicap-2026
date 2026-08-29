import { Router } from 'express';
import * as fiscalController from '../controllers/fiscal.controller.js';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createFiscalSchema, fiscalIdSchema, listFiscaisSchema, updateFiscalSchema, updateFiscalStatusSchema } from '../validators/fiscal.validator.js';

const router = Router();
router.use(authenticate);
router.use(authorizeAdmin);
router.get('/', validate(listFiscaisSchema), fiscalController.list);
router.post('/', validate(createFiscalSchema), fiscalController.create);
router.get('/arquivados', validate(listFiscaisSchema), fiscalController.listArchived);
router.put('/:id', validate(updateFiscalSchema), fiscalController.update);
router.patch('/:id/status', validate(updateFiscalStatusSchema), fiscalController.updateStatus);
router.delete('/:id', validate(fiscalIdSchema), fiscalController.remove);
export default router;
