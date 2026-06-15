import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;
    
    console.log('=== AUTH DEBUG ===');
    console.log('Cookies:', req.cookies);
    console.log('Authorization header:', req.headers.authorization);
    
    // First try to get token from cookie
    if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
      console.log('Token found in cookies');
    }
    
    // Fallback to Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
        console.log('Token found in Authorization header');
      }
    }
    
    if (!token) {
      console.log('No token found');
      res.status(401).json({
        status: 'error',
        message: 'No token provided'
      });
      return;
    }

    console.log('Token length:', token.length);
    
    // This will throw an error if invalid
    const decoded = verifyToken(token);
    
    console.log('Token verified for:', decoded.email);
    
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error: any) {
    console.error('Authentication error details:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Send specific error messages based on the error type
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        status: 'error',
        message: 'Invalid token format or signature'
      });
    } else if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        status: 'error',
        message: 'Token has expired. Please login again.'
      });
    } else {
      res.status(401).json({
        status: 'error',
        message: 'Authentication failed: ' + error.message
      });
    }
  }
};