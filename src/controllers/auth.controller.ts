import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";
import { generateToken } from "../utils/jwt";

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        status: "error",
        message: "Email and password are required",
      });
      return;
    }

    // Find admin user
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      res.status(401).json({
        status: "error",
        message: "Invalid credentials",
      });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);

    if (!isValidPassword) {
      res.status(401).json({
        status: "error",
        message: "Invalid credentials",
      });
      return;
    }

    // Generate token
    const token = generateToken(admin.id, admin.email, admin.role);

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        token,
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

export const getCurrentAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const admin = await prisma.admin.findUnique({
      // @ts-ignore - user is added by middleware
      where: { id: req.user?.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!admin) {
      res.status(404).json({
        status: "error",
        message: "Admin not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: admin,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
