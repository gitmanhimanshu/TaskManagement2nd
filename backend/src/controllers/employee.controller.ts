import { Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { sendInvitationEmail, sendWelcomeEmail } from '../services/email.service';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

export const addEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { email, first_name, last_name, password, role } = req.body;
    const companyId = req.user!.companyId;
    const isAdmin = req.user!.isAdmin;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' },
      });
    }

    const existingEmployee = await prisma.employee.findUnique({ where: { email } });
    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_EMAIL', message: 'Email already exists' },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await prisma.employee.create({
      data: {
        companyId,
        email,
        firstName: first_name,
        lastName: last_name,
        password: hashedPassword,
        isAdmin: role === 'admin',
      },
      include: { company: true },
    });

    // Send welcome email
    await sendWelcomeEmail(
      email,
      `${first_name} ${last_name}`,
      employee.company.companyName,
      password
    );

    res.status(201).json({
      success: true,
      employee: {
        id: employee.id,
        email: employee.email,
        first_name: employee.firstName,
        last_name: employee.lastName,
        is_admin: employee.isAdmin,
        created_at: employee.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
};

export const inviteEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { email, first_name, last_name } = req.body;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const isAdmin = req.user!.isAdmin;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' },
      });
    }

    const existingEmployee = await prisma.employee.findUnique({ where: { email } });
    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_EMAIL', message: 'Email already exists' },
      });
    }

    const existingInvite = await prisma.invitedEmployee.findFirst({
      where: { email, companyId, isUsed: false },
    });

    if (existingInvite) {
      return res.status(409).json({
        success: false,
        error: { code: 'INVITATION_EXISTS', message: 'Invitation already sent' },
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const [invitation, inviter, company] = await Promise.all([
      prisma.invitedEmployee.create({
        data: {
          companyId,
          email,
          firstName: first_name,
          lastName: last_name,
          invitedBy: userId,
          token,
          expiresAt,
        },
      }),
      prisma.employee.findUnique({ where: { id: userId } }),
      prisma.company.findUnique({ where: { id: companyId } }),
    ]);

    // Send invitation email
    const emailResult = await sendInvitationEmail(
      email,
      `${first_name} ${last_name}`,
      company!.companyName,
      `${inviter!.firstName} ${inviter!.lastName}`,
      token
    );

    res.status(201).json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        first_name: invitation.firstName,
        last_name: invitation.lastName,
        expires_at: invitation.expiresAt,
        email_sent: emailResult.success,
      },
      message: emailResult.success
        ? 'Invitation sent successfully'
        : 'Invitation created but email failed to send',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
};

export const acceptInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const { token, password } = req.body;

    const invitation = await prisma.invitedEmployee.findUnique({
      where: { token },
      include: { company: true },
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid invitation token' },
      });
    }

    if (invitation.isUsed) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVITATION_USED', message: 'Invitation already used' },
      });
    }

    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVITATION_EXPIRED', message: 'Invitation has expired' },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await prisma.$transaction(async (tx: any) => {
      const emp = await tx.employee.create({
        data: {
          companyId: invitation.companyId,
          email: invitation.email,
          firstName: invitation.firstName,
          lastName: invitation.lastName,
          password: hashedPassword,
          isAdmin: false,
        },
      });

      await tx.invitedEmployee.update({
        where: { id: invitation.id },
        data: { isUsed: true },
      });

      return emp;
    });

    const accessToken = generateAccessToken({
      userId: employee.id,
      email: employee.email,
      companyId: employee.companyId,
      isAdmin: employee.isAdmin,
    });

    const refreshToken = generateRefreshToken(employee.id);

    res.status(201).json({
      success: true,
      user: {
        id: employee.id,
        email: employee.email,
        first_name: employee.firstName,
        last_name: employee.lastName,
        company_id: employee.companyId,
        company_name: invitation.company.companyName,
        is_admin: employee.isAdmin,
      },
      tokens: { access_token: accessToken, refresh_token: refreshToken },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
};

export const getEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const companyId = req.user!.companyId;
    const isAdmin = req.user!.isAdmin;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' },
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where: { companyId, isActive: true },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isAdmin: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.employee.count({ where: { companyId, isActive: true } }),
    ]);

    res.json({
      success: true,
      employees: employees.map((emp: any) => ({
        id: emp.id,
        email: emp.email,
        first_name: emp.firstName,
        last_name: emp.lastName,
        is_admin: emp.isAdmin,
        created_at: emp.createdAt,
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        total_pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
};

export const getPendingInvitations = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const companyId = req.user!.companyId;
    const isAdmin = req.user!.isAdmin;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' },
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [invitations, total] = await Promise.all([
      prisma.invitedEmployee.findMany({
        where: { companyId, isUsed: false },
        include: {
          inviter: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.invitedEmployee.count({ where: { companyId, isUsed: false } }),
    ]);

    res.json({
      success: true,
      invitations: invitations.map((inv: any) => ({
        id: inv.id,
        email: inv.email,
        first_name: inv.firstName,
        last_name: inv.lastName,
        invited_by: `${inv.inviter.firstName} ${inv.inviter.lastName}`,
        expires_at: inv.expiresAt,
        created_at: inv.createdAt,
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        total_pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
};

export const deleteInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const isAdmin = req.user!.isAdmin;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' },
      });
    }

    const invitation = await prisma.invitedEmployee.findFirst({
      where: { id: Number(id), companyId },
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invitation not found' },
      });
    }

    await prisma.invitedEmployee.delete({
      where: { id: Number(id) },
    });

    res.json({
      success: true,
      message: 'Invitation deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
};
