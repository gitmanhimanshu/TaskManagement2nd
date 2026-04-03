import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';

type TaskWhereInput = {
  companyId: number;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  OR?: Array<{
    title?: { contains: string; mode: 'insensitive' };
    description?: { contains: string; mode: 'insensitive' };
  }>;
  assignments?: { some: { userId: number } };
  createdBy?: number;
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, status, priority, due_date, allocated_time, assigned_users } = req.body;
    const userId = req.user!.userId;
    const companyId = req.user!.companyId;

    const task = await prisma.task.create({
      data: {
        companyId,
        title,
        description,
        status: status || 'PENDING',
        priority: priority || 'MEDIUM',
        dueDate: due_date ? new Date(due_date) : null,
        allocatedTime: allocated_time,
        createdBy: userId,
        assignments: assigned_users && Array.isArray(assigned_users)
          ? { create: assigned_users.map((uid: number) => ({ userId: uid })) }
          : undefined,
      },
      include: {
        assignments: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
      },
    });

    res.status(201).json({
      success: true,
      task: {
        ...task,
        assigned_users: task.assignments.map((a: any) => ({
          id: a.user.id,
          name: `${a.user.firstName} ${a.user.lastName}`,
          email: a.user.email,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, status, search, assigned_to_me, created_by_me } = req.query;
    const userId = req.user!.userId;
    const companyId = req.user!.companyId;
    const isAdmin = req.user!.isAdmin;

    const skip = (Number(page) - 1) * Number(limit);
    const where: TaskWhereInput = { companyId };

    // Non-admin users can only see tasks assigned to them
    if (!isAdmin) {
      where.assignments = { some: { userId } };
    } else {
      // Admin can filter by assigned_to_me or created_by_me
      if (assigned_to_me === 'true') where.assignments = { some: { userId } };
      if (created_by_me === 'true') where.createdBy = userId;
    }

    if (status) where.status = (status as string).toUpperCase() as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    if (search) where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
    ];

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          creator: { select: { id: true, firstName: true, lastName: true } },
          assignments: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      success: true,
      tasks: tasks.map((t: any) => ({
        ...t,
        created_by: { id: t.creator.id, name: `${t.creator.firstName} ${t.creator.lastName}` },
        assigned_users: t.assignments.map((a: any) => ({ id: a.user.id, name: `${a.user.firstName} ${a.user.lastName}` })),
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        total_pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

export const getTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const task = await prisma.task.findFirst({
      where: { id: Number(id), companyId },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true } },
        assignments: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
      },
    });

    if (!task) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } });
    }

    res.json({ success: true, task });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, due_date, allocated_time, assigned_users } = req.body;
    const companyId = req.user!.companyId;

    const task = await prisma.task.findFirst({ where: { id: Number(id), companyId } });
    if (!task) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } });
    }

    const updated = await prisma.task.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        status: status?.toUpperCase(),
        priority: priority?.toUpperCase(),
        dueDate: due_date ? new Date(due_date) : undefined,
        allocatedTime: allocated_time,
        assignments: assigned_users && Array.isArray(assigned_users)
          ? {
              deleteMany: {},
              create: assigned_users.map((uid: number) => ({ userId: uid })),
            }
          : undefined,
      },
      include: { assignments: { include: { user: true } } },
    });

    res.json({ success: true, task: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const task = await prisma.task.findFirst({ where: { id: Number(id), companyId } });
    if (!task) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } });
    }

    await prisma.task.delete({ where: { id: Number(id) } });
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

export const toggleTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const task = await prisma.task.findFirst({ where: { id: Number(id), companyId } });
    if (!task) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } });
    }

    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    const updated = await prisma.task.update({
      where: { id: Number(id) },
      data: {
        status: newStatus,
        completedAt: newStatus === 'COMPLETED' ? new Date() : null,
      },
    });

    res.json({ success: true, task: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};
