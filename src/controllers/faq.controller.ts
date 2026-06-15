import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import { CreateFAQInput, UpdateFAQInput } from '../validations/faq.validation';

// Helper function to check if order exists
const isOrderExists = async (order: number, excludeId?: string): Promise<boolean> => {
  const existing = await prisma.fAQ.findFirst({
    where: {
      order: order,
      ...(excludeId && { id: { not: excludeId } })
    }
  });
  return !!existing;
};

// Helper function to reorder FAQs when inserting or deleting
const reorderFAQs = async (startOrder: number, shiftUp: boolean = true): Promise<void> => {
  const faqs = await prisma.fAQ.findMany({
    where: {
      order: shiftUp ? { gte: startOrder } : { gt: startOrder }
    },
    orderBy: { order: 'asc' }
  });

  for (const faq of faqs) {
    await prisma.fAQ.update({
      where: { id: faq.id },
      data: { order: shiftUp ? faq.order + 1 : faq.order - 1 }
    });
  }
};



export const getAllFAQs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = typeof req.query.page === 'string' ? parseInt(req.query.page) : 1;
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit) : 10;
    const isActive = typeof req.query.isActive === 'string' ? req.query.isActive === 'true' : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));

    // Build where clause
    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { question: { contains: search, mode: 'insensitive' } },
        { answer: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [faqs, total] = await Promise.all([
      prisma.fAQ.findMany({
        where,
        skip,
        take,
        orderBy: [
          { order: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.fAQ.count({ where }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        faqs,
        pagination: {
          page,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get FAQs',
    });
  }
};

export const getFAQById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const faq = await prisma.fAQ.findUnique({
      where: { id },
    });

    if (!faq) {
      res.status(404).json({
        status: 'error',
        message: 'FAQ not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: faq,
    });
  } catch (error) {
    console.error('Get FAQ error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get FAQ',
    });
  }
};


export const createFAQ = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body as CreateFAQInput;
    const adminId = req.user?.userId;

    // Check if order is provided and exists
    if (data.order !== undefined) {
      const orderExists = await isOrderExists(data.order);
      if (orderExists) {
        // Shift existing FAQs to make room
        await reorderFAQs(data.order, true);
      }
    } else {
      // Auto-assign next available order number
      const lastFAQ = await prisma.fAQ.findFirst({
        orderBy: { order: 'desc' }
      });
      data.order = (lastFAQ?.order ?? -1) + 1;
    }

    const faq = await prisma.fAQ.create({
      data: {
        question: data.question,
        answer: data.answer,
        order: data.order,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdBy: adminId,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'FAQ created successfully',
      data: faq,
    });
  } catch (error) {
    console.error('Create FAQ error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create FAQ',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updateFAQ = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body as UpdateFAQInput;
    const adminId = req.user?.userId;

    // Check if FAQ exists
    const existingFAQ = await prisma.fAQ.findUnique({
      where: { id },
    });

    if (!existingFAQ) {
      res.status(404).json({
        status: 'error',
        message: 'FAQ not found',
      });
      return;
    }

    // If order is being updated, check for conflicts
    if (data.order !== undefined && data.order !== existingFAQ.order) {
      const orderExists = await isOrderExists(data.order, id);
      if (orderExists) {
        // Handle order conflict by shifting
        const currentOrder = existingFAQ.order;
        
        if (data.order > currentOrder) {
          // Moving down: shift items between current+1 and new order up
          const faqsToShift = await prisma.fAQ.findMany({
            where: {
              order: {
                gt: currentOrder,
                lte: data.order
              },
              id: { not: id }
            }
          });
          
          for (const faq of faqsToShift) {
            await prisma.fAQ.update({
              where: { id: faq.id },
              data: { order: faq.order - 1 }
            });
          }
        } else if (data.order < currentOrder) {
          // Moving up: shift items between new order and current-1 down
          const faqsToShift = await prisma.fAQ.findMany({
            where: {
              order: {
                gte: data.order,
                lt: currentOrder
              },
              id: { not: id }
            }
          });
          
          for (const faq of faqsToShift) {
            await prisma.fAQ.update({
              where: { id: faq.id },
              data: { order: faq.order + 1 }
            });
          }
        }
        
        data.order = data.order;
      }
    }

    const updatedFAQ = await prisma.fAQ.update({
      where: { id },
      data: {
        ...data,
        updatedBy: adminId,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'FAQ updated successfully',
      data: updatedFAQ,
    });
  } catch (error) {
    console.error('Update FAQ error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update FAQ',
    });
  }
};

export const deleteFAQ = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if FAQ exists
    const existingFAQ = await prisma.fAQ.findUnique({
      where: { id },
    });

    if (!existingFAQ) {
      res.status(404).json({
        status: 'error',
        message: 'FAQ not found',
      });
      return;
    }

    // Delete the FAQ
    await prisma.fAQ.delete({
      where: { id },
    });

    // Reorder remaining FAQs to fill the gap
    await reorderFAQs(existingFAQ.order, false);

    res.status(200).json({
      status: 'success',
      message: 'FAQ deleted successfully',
    });
  } catch (error) {
    console.error('Delete FAQ error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete FAQ',
    });
  }
};

export const bulkUpdateOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { faqs } = req.body as { faqs: { id: string; order: number }[] };

    if (!faqs || !Array.isArray(faqs)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid request body',
      });
      return;
    }

    // Check for duplicate orders in the request
    const orders = faqs.map(f => f.order);
    const hasDuplicates = orders.length !== new Set(orders).size;
    
    if (hasDuplicates) {
      res.status(400).json({
        status: 'error',
        message: 'Duplicate order numbers are not allowed',
      });
      return;
    }

    // Check if any order conflicts with existing FAQs not in the update list
    const faqIds = faqs.map(f => f.id);
    const existingFAQs = await prisma.fAQ.findMany({
      where: {
        id: { notIn: faqIds },
        order: { in: orders }
      }
    });

    if (existingFAQs.length > 0) {
      res.status(400).json({
        status: 'error',
        message: 'Order numbers conflict with existing FAQs',
        conflicts: existingFAQs.map(f => ({ id: f.id, order: f.order, question: f.question })),
      });
      return;
    }

    // Update each FAQ's order in a transaction
    await prisma.$transaction(
      faqs.map((faq) =>
        prisma.fAQ.update({
          where: { id: faq.id },
          data: { order: faq.order },
        })
      )
    );

    res.status(200).json({
      status: 'success',
      message: 'FAQ order updated successfully',
    });
  } catch (error) {
    console.error('Bulk update order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update FAQ order',
    });
  }
};

// Optional: Add endpoint to get next available order number
export const getNextOrderNumber = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lastFAQ = await prisma.fAQ.findFirst({
      orderBy: { order: 'desc' }
    });
    
    const nextOrder = (lastFAQ?.order ?? -1) + 1;
    
    res.status(200).json({
      status: 'success',
      data: { nextOrder },
    });
  } catch (error) {
    console.error('Get next order number error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get next order number',
    });
  }
};