import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (userId: string, email: string, role: string): string => {
  const payload: JWTPayload = { userId, email, role };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN 
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    // Throw the error instead of returning null
    throw error;
  }
};