import { Router } from 'express';
import * as alunoController from '../controllers/aluno.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { alunoHistorySchema, alunoIdSchema, createAlunoSchema, listAlunosSchema, updateAlunoSchema, updateAlunoStatusSchema } from '../validators/aluno.validator.js';

const router = Router();
router.use(authenticate);
router.get('/', validate(listAlunosSchema), alunoController.list);
router.post('/', validate(createAlunoSchema), alunoController.create);
router.get('/arquivados', validate(listAlunosSchema), alunoController.listArchived);
router.get('/:id', validate(alunoIdSchema), alunoController.findById);
router.put('/:id', validate(updateAlunoSchema), alunoController.update);
router.patch('/:id/status', validate(updateAlunoStatusSchema), alunoController.updateStatus);
router.delete('/:id', validate(alunoIdSchema), alunoController.remove);
router.get('/:id/historico/presencas', validate(alunoHistorySchema), alunoController.listPresencas);
router.get('/:id/historico/ocorrencias', validate(alunoHistorySchema), alunoController.listOcorrencias);
export default router;
