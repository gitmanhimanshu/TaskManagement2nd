import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../config/database';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import type { PrismaClient } from '@prisma/client';

export const register = async (req: Request, res: Response) => {
  try {
    const { company_name, email, password, first_name, last_name } = req.body;

    const existingUser = await prisma.employee.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_EMAIL', message: 'Email already exists' },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
      const company = await tx.company.create({
        data: { companyName: company_name },
      });

      const employee = await tx.employee.create({
        data: {
          companyId: company.id,
          email,
          password: hashedPassword,
          firstName: first_name,
          lastName: last_name,
          isAdmin: true,
        },
      });

      return { company, employee };
    });

    const accessToken = generateAccessToken({
      userId: result.employee.id,
      email: result.employee.email,
      companyId: result.company.id,
      isAdmin: true,
    });

    const refreshToken = generateRefreshToken(result.employee.id);

    res.status(201).json({
      success: true,
      user: {
        id: result.employee.id,
        email: result.employee.email,
        first_name: result.employee.firstName,
        last_name: result.employee.lastName,
        company_id: result.company.id,
        company_name: result.company.companyName,
        is_admin: result.employee.isAdmin,
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

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const employee = await prisma.employee.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!employee || !employee.isActive) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    const accessToken = generateAccessToken({
      userId: employee.id,
      email: employee.email,
      companyId: employee.companyId,
      isAdmin: employee.isAdmin,
    });

    const refreshToken = generateRefreshToken(employee.id);

    res.json({
      success: true,
      user: {
        id: employee.id,
        email: employee.email,
        first_name: employee.firstName,
        last_name: employee.lastName,
        company_id: employee.companyId,
        company_name: employee.company.companyName,
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

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;

    const payload = verifyRefreshToken(refresh_token);
    
    const employee = await prisma.employee.findUnique({
      where: { id: payload.userId },
    });

    if (!employee || !employee.isActive) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' },
      });
    }

    const accessToken = generateAccessToken({
      userId: employee.id,
      email: employee.email,
      companyId: employee.companyId,
      isAdmin: employee.isAdmin,
    });

    const refreshToken = generateRefreshToken(employee.id);

    res.json({
      success: true,
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' },
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
};
