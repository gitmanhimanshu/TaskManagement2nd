import { Router } from 'express';
import { addEmployee, inviteEmployee, acceptInvitation, getEmployees, getPendingInvitations, deleteInvitation } from '../controllers/employee.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/accept-invite', acceptInvitation);
router.use(authenticate);
router.post('/', requireAdmin, addEmployee);
router.post('/invite', requireAdmin, inviteEmployee);
router.get('/', requireAdmin, getEmployees);
router.get('/invitations', requireAdmin, getPendingInvitations);
router.delete('/invitations/:id', requireAdmin, deleteInvitation);

export default router;
