import { Router } from 'express';
import { createTask, getTasks, getTask, updateTask, deleteTask, toggleTask } from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createTask);
router.get('/', getTasks);
router.get('/:id', getTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/toggle', toggleTask);

export default router;
