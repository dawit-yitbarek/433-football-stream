import { Router } from 'express';
import { matchController } from '../controllers/matchController.js';

const router = Router();

router.get('/matches', matchController.getMatches);

export default router;