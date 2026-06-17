import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import { 
  createBlogSchema, 
  updateBlogSchema, 
  getBlogsQuerySchema,
  bulkDeleteSchema,
  generateSlug, 
  calculateReadingTime 
} from '../validations/blog.validation';

// Get all blogs
export const getBlogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate query params
    const query = getBlogsQuerySchema.parse({
      page: req.query.page,
      limit: req.query.limit,
      category: req.query.category,
      search: req.query.search,
      isActive: req.query.isActive,
    });

    const page = query.page;
    const limit = query.limit;
    const category = query.category;
    const search = query.search;
    const isActive = query.isActive;

    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        skip,
        take,
        orderBy: { publishedDate: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          image: true,
          author: true,
          publishedDate: true,
          category: true,
          readingTime: true,
          relatedBlogIds: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.blog.count({ where }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        blogs,
        pagination: {
          page,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (error: any) {
    console.error('Get blogs error:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      res.status(400).json({
        status: 'error',
        message: 'Invalid query parameters',
        errors: error.errors,
      });
      return;
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to get blogs',
    });
  }
};

// Get blog by slug
export const getBlogBySlug = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const blog = await prisma.blog.findUnique({
      where: { slug },
    });

    if (!blog) {
      res.status(404).json({
        status: 'error',
        message: 'Blog not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: blog,
    });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get blog',
    });
  }
};

// Get blog by ID
export const getBlogById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const blog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!blog) {
      res.status(404).json({
        status: 'error',
        message: 'Blog not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: blog,
    });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get blog',
    });
  }
};

// Get categories
export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await prisma.blog.findMany({
      where: { isActive: true },
      distinct: ['category'],
      select: { category: true },
      orderBy: { category: 'asc' },
    });

    res.status(200).json({
      status: 'success',
      data: categories.map(c => c.category),
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get categories',
    });
  }
};

// Create blog
export const createBlog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = createBlogSchema.parse(req.body);
    const adminId = req.user?.userId;

    const { title, excerpt, content, image, author, category, readingTime, relatedBlogIds, isActive } = validatedData;

    const slug = generateSlug(title);
    const readingTimeValue = readingTime || calculateReadingTime(content);

    // Check if slug already exists
    const existingBlog = await prisma.blog.findUnique({
      where: { slug },
    });

    if (existingBlog) {
      res.status(400).json({
        status: 'error',
        message: 'A blog with this title already exists',
      });
      return;
    }

    const blog = await prisma.blog.create({
      data: {
        slug,
        title,
        excerpt,
        content,
        image: image || null,
        author,
        category,
        readingTime: readingTimeValue,
        relatedBlogIds: relatedBlogIds || [],
        isActive: isActive !== undefined ? isActive : true,
        createdBy: adminId,
        updatedBy: adminId,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Blog created successfully',
      data: blog,
    });
  } catch (error: any) {
    console.error('Create blog error:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.errors,
      });
      return;
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to create blog',
    });
  }
};

// Update blog
export const updateBlog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Validate request body
    const validatedData = updateBlogSchema.parse({ id, ...req.body });
    const adminId = req.user?.userId;

    const { title, excerpt, content, image, author, category, readingTime, relatedBlogIds, isActive } = validatedData;

    const existingBlog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!existingBlog) {
      res.status(404).json({
        status: 'error',
        message: 'Blog not found',
      });
      return;
    }

    const updateData: any = { updatedBy: adminId };

    if (title !== undefined) {
      updateData.title = title;
      updateData.slug = generateSlug(title);
    }
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) {
      updateData.content = content;
      updateData.readingTime = calculateReadingTime(content);
    }
    if (image !== undefined) updateData.image = image;
    if (author !== undefined) updateData.author = author;
    if (category !== undefined) updateData.category = category;
    if (readingTime !== undefined) updateData.readingTime = readingTime;
    if (relatedBlogIds !== undefined) updateData.relatedBlogIds = relatedBlogIds;
    if (isActive !== undefined) updateData.isActive = isActive;

    const blog = await prisma.blog.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      status: 'success',
      message: 'Blog updated successfully',
      data: blog,
    });
  } catch (error: any) {
    console.error('Update blog error:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.errors,
      });
      return;
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to update blog',
    });
  }
};

// Delete blog
export const deleteBlog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingBlog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!existingBlog) {
      res.status(404).json({
        status: 'error',
        message: 'Blog not found',
      });
      return;
    }

    await prisma.blog.delete({
      where: { id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Blog deleted successfully',
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete blog',
    });
  }
};

// Bulk delete blogs
export const bulkDeleteBlogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = bulkDeleteSchema.parse(req.body);
    const { ids } = validatedData;

    await prisma.blog.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Blogs deleted successfully',
    });
  } catch (error: any) {
    console.error('Bulk delete blogs error:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.errors,
      });
      return;
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete blogs',
    });
  }
};