import { Router } from 'express';
import * as alunoController from '../controllers/aluno.controller.js';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { alunoHistorySchema, alunoIdSchema, createAlunoSchema, listAlunosSchema, updateAlunoSchema, updateAlunoStatusSchema } from '../validators/aluno.validator.js';

const router = Router();
router.use(authenticate);
router.get('/', validate(listAlunosSchema), alunoController.list);
router.post('/', authorizeAdmin, validate(createAlunoSchema), alunoController.create);
router.get('/arquivados', authorizeAdmin, validate(listAlunosSchema), alunoController.listArchived);
router.get('/:id', validate(alunoIdSchema), alunoController.findById);
router.put('/:id', authorizeAdmin, validate(updateAlunoSchema), alunoController.update);
router.patch('/:id/status', authorizeAdmin, validate(updateAlunoStatusSchema), alunoController.updateStatus);
router.delete('/:id', authorizeAdmin, validate(alunoIdSchema), alunoController.remove);
router.get('/:id/historico/presencas', validate(alunoHistorySchema), alunoController.listPresencas);
router.get('/:id/historico/ocorrencias', validate(alunoHistorySchema), alunoController.listOcorrencias);
export default router;
