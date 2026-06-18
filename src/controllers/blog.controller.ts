import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../lib/prisma";
import {
  createBlogSchema,
  updateBlogSchema,
  getBlogsQuerySchema,
  bulkDeleteSchema,
  generateSlug,
  calculateReadingTime,
} from "../validations/blog.validation";
import { uploadToCloudinary } from "../config/cloudinary";


export const getActiveBlogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const search = req.query.search as string;

    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));

    const where: any = {
      isActive: true, // ✅ Only active blogs
    };

    if (category) {
      where.category = category;
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
  } catch (error) {
    console.error('Get active blogs error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get blogs',
    });
  }
};

// Get blog by slug (public - only if active)
export const getBlogBySlug = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const blog = await prisma.blog.findFirst({
      where: {
        slug,
        isActive: true, // ✅ Only if active
      },
    });

    if (!blog) {
      res.status(404).json({
        status: 'error',
        message: 'Blog not found',
      });
      return;
    }

    // Get related blogs (slim version)
    let relatedBlogs: any[] = [];
    if (blog.relatedBlogIds && blog.relatedBlogIds.length > 0) {
      relatedBlogs = await prisma.blog.findMany({
        where: {
          id: { in: blog.relatedBlogIds },
          isActive: true,
        },
        select: {
          id: true,
          slug: true,
          title: true,
          image: true,
          category: true,
          publishedDate: true,
          readingTime: true,
        },
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        ...blog,
        relatedBlogs,
      },
    });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get blog',
    });
  }
};

export const getAllBlogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const search = req.query.search as string;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));

    const where: any = {};

    if (category) {
      where.category = category;
    }

    // ✅ If isActive is provided, filter by it; otherwise return ALL blogs
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
  } catch (error) {
    console.error('Get all blogs error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get blogs',
    });
  }
};

// Get blog by ID (admin only - includes inactive)
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
    console.error('Get blog by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get blog',
    });
  }
};

// Toggle blog status (active/inactive) - admin only
export const toggleBlogStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const adminId = req.user?.userId;

    // ✅ Check if blog exists
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

    // ✅ Update the status
    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: {
        isActive: isActive !== undefined ? isActive : !existingBlog.isActive,
        updatedBy: adminId,
      },
    });

    res.status(200).json({
      status: 'success',
      message: `Blog ${updatedBlog.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedBlog,
    });
  } catch (error) {
    console.error('Toggle blog status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to toggle blog status',
    });
  }
};

// Get all blogs
export const getBlogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('🔍 GET /api/blogs - Request received');
    console.log('📊 Query params:', req.query);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const search = req.query.search as string;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

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

    console.log('📊 Where clause:', JSON.stringify(where));

    // ✅ First, get total count without any filters to verify data exists
    const totalAll = await prisma.blog.count();
    console.log(`📊 Total blogs in DB: ${totalAll}`);

    // ✅ Then get count with filters
    const total = await prisma.blog.count({ where });
    console.log(`📊 Blogs matching filters: ${total}`);

    const blogs = await prisma.blog.findMany({
      where,
      skip,
      take,
      orderBy: { publishedDate: 'desc' },
    });

    console.log(`📊 Retrieved blogs: ${blogs.length}`);

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
    console.error('❌ Get blogs error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get blogs',
      error: error.message,
    });
  }
};

// photo upload
export const uploadBlogImage = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const adminId = req.user?.userId;

    if (!adminId) {
      res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        status: "error",
        message: "No image file provided",
      });
      return;
    }

    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(req.file.buffer, "blog-images");

    res.status(200).json({
      status: "success",
      message: "Image uploaded successfully",
      imageUrl: imageUrl,
    });
  } catch (error) {
    console.error("Upload blog image error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to upload image",
    });
  }
};


// Get categories
export const getCategories = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const categories = await prisma.blog.findMany({
      where: { isActive: true },
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    });

    res.status(200).json({
      status: "success",
      data: categories.map((c) => c.category),
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get categories",
    });
  }
};

// Create blog
export const createBlog = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    // Validate request body
    const validatedData = createBlogSchema.parse(req.body);
    const adminId = req.user?.userId;

    const {
      title,
      excerpt,
      content,
      image,
      author,
      category,
      readingTime,
      relatedBlogIds,
      isActive,
    } = validatedData;

    const slug = generateSlug(title);
    const readingTimeValue = readingTime || calculateReadingTime(content);

    // Check if slug already exists
    const existingBlog = await prisma.blog.findUnique({
      where: { slug },
    });

    if (existingBlog) {
      res.status(400).json({
        status: "error",
        message: "A blog with this title already exists",
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
      status: "success",
      message: "Blog created successfully",
      data: blog,
    });
  } catch (error: any) {
    console.error("Create blog error:", error);

    // Handle Zod validation errors
    if (error.name === "ZodError") {
      res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: error.errors,
      });
      return;
    }

    res.status(500).json({
      status: "error",
      message: "Failed to create blog",
    });
  }
};

// Update blog
export const updateBlog = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate request body
    const validatedData = updateBlogSchema.parse({ id, ...req.body });
    const adminId = req.user?.userId;

    const {
      title,
      excerpt,
      content,
      image,
      author,
      category,
      readingTime,
      relatedBlogIds,
      isActive,
    } = validatedData;

    const existingBlog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!existingBlog) {
      res.status(404).json({
        status: "error",
        message: "Blog not found",
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
    if (relatedBlogIds !== undefined)
      updateData.relatedBlogIds = relatedBlogIds;
    if (isActive !== undefined) updateData.isActive = isActive;

    const blog = await prisma.blog.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      status: "success",
      message: "Blog updated successfully",
      data: blog,
    });
  } catch (error: any) {
    console.error("Update blog error:", error);

    // Handle Zod validation errors
    if (error.name === "ZodError") {
      res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: error.errors,
      });
      return;
    }

    res.status(500).json({
      status: "error",
      message: "Failed to update blog",
    });
  }
};

// Delete blog
export const deleteBlog = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const existingBlog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!existingBlog) {
      res.status(404).json({
        status: "error",
        message: "Blog not found",
      });
      return;
    }

    await prisma.blog.delete({
      where: { id },
    });

    res.status(200).json({
      status: "success",
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.error("Delete blog error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete blog",
    });
  }
};

// Bulk delete blogs
export const bulkDeleteBlogs = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
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
      status: "success",
      message: "Blogs deleted successfully",
    });
  } catch (error: any) {
    console.error("Bulk delete blogs error:", error);

    // Handle Zod validation errors
    if (error.name === "ZodError") {
      res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: error.errors,
      });
      return;
    }

    res.status(500).json({
      status: "error",
      message: "Failed to delete blogs",
    });
  }
};
