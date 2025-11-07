// src/routes/print.routes.ts
import { Router } from 'express';
import { PrintController } from '../controllers/PrintController';

const router = Router();

router.post('/print', PrintController.printOrder);

export default router;