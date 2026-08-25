import { Router } from 'express';
import { findPublicByCpf } from '../controllers/aluno.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { publicAlunoCpfSchema } from '../validators/aluno.validator.js';

const router = Router();
router.post('/alunos', validate(publicAlunoCpfSchema), findPublicByCpf);

export default router;
