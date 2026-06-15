import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { generateToken } from '../utils/jwt';


export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { email }
    });

    if (!admin) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);

    if (!isValidPassword) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
      return;
    }

    // Generate token
    const token = generateToken(admin.id, admin.email, admin.role);

    // Set HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
      domain: 'localhost',
    });

    // Set user info cookie
    res.cookie('user_info', JSON.stringify({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    }), {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
      domain: 'localhost',
    });

    // ✅ IMPORTANT: Return the token in the response body
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        token, // <-- THIS IS THE KEY FIX
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};


export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('auth_token', { path: '/' });
  res.clearCookie('user_info', { path: '/' });
  
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
};

export const getCurrentAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user from cookie or authorization header
    let userId = req.user?.userId;
    
    if (!userId && req.cookies.user_info) {
      try {
        const userInfo = JSON.parse(req.cookies.user_info);
        userId = userInfo.id;
      } catch (e) {
        // Invalid cookie
      }
    }
    
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Not authenticated'
      });
      return;
    }
    
    const admin = await prisma.admin.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    if (!admin) {
      res.status(404).json({
        status: 'error',
        message: 'Admin not found'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: admin
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};