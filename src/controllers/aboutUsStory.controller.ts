import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../lib/prisma";
import {
  UpdateStoryInput,
  UpdateCardsInput,
  UpdateStoryContentInput,
} from "../validations/aboutUsStory.validation";

// Get story content (public)
export const getStory = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    let story = await prisma.aboutUsStory.findFirst();

    // If no data exists, create default
    if (!story) {
      story = await prisma.aboutUsStory.create({
        data: {
          title: "Our Story",
          subtitle: "",
          storyTitle: "How We Started",
          storySubtitle: "",
          cards: [
            {
              cardTitle: "Expert Technicians",
              cardSubtitle: "Certified professionals with years of experience",
            },
            {
              cardTitle: "Quality Service",
              cardSubtitle: "Committed to excellence in every job",
            },
            {
              cardTitle: "Customer First",
              cardSubtitle: "Your satisfaction is our priority",
            },
          ],
        },
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        title: story.title,
        subtitle: story.subtitle,
        storyTitle: story.storyTitle,
        storySubtitle: story.storySubtitle,
        cards: story.cards,
      },
    });
  } catch (error) {
    console.error("Get story error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get story content",
    });
  }
};

// Update entire story section (admin only)
export const updateStory = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const data = req.body;
    const adminId = req.user?.userId;

    let story = await prisma.aboutUsStory.findFirst();

    if (!story) {
      story = await prisma.aboutUsStory.create({
        data: {
          title: data.title || "About Us",
          subtitle: data.subtitle || "",
          storyTitle: data.storyTitle || "Our Story",
          storySubtitle: data.storySubtitle || "",
          cards: data.cards || [],
          updatedBy: adminId,
        },
      });
    } else {
      const updateData: any = { updatedBy: adminId };
      if (data.title !== undefined) updateData.title = data.title;
      if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
      if (data.storyTitle !== undefined)
        updateData.storyTitle = data.storyTitle;
      if (data.storySubtitle !== undefined)
        updateData.storySubtitle = data.storySubtitle;
      if (data.cards !== undefined) updateData.cards = data.cards;

      story = await prisma.aboutUsStory.update({
        where: { id: story.id },
        data: updateData,
      });
    }

    res.status(200).json({
      status: "success",
      message: "Story content updated successfully",
      data: story,
    });
  } catch (error) {
    console.error("Update story error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update story content",
    });
  }
};
// Update only cards (admin only)
export const updateCards = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { cards } = req.body as UpdateCardsInput;
    const adminId = req.user?.userId;

    // Validate cards length
    if (cards.length < 1 || cards.length > 3) {
      res.status(400).json({
        status: "error",
        message: "Cards must be between 1 and 3",
      });
      return;
    }

    let story = await prisma.aboutUsStory.findFirst();

    if (!story) {
      // Create with default story content and provided cards
      story = await prisma.aboutUsStory.create({
        data: {
          title: "Our Story",
          subtitle: "",
          storyTitle: "How We Started",
          storySubtitle: "",
          cards: cards,
          updatedBy: adminId,
        },
      });
    } else {
      // Update only cards
      story = await prisma.aboutUsStory.update({
        where: { id: story.id },
        data: {
          cards: cards,
          updatedBy: adminId,
        },
      });
    }

    res.status(200).json({
      status: "success",
      message: "Cards updated successfully",
      data: { cards: story.cards },
    });
  } catch (error) {
    console.error("Update cards error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update cards",
    });
  }
};

// Update only story content (without text and image)
export const updateStoryContent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const data = req.body as UpdateStoryContentInput;
    const adminId = req.user?.userId;

    let story = await prisma.aboutUsStory.findFirst();

    if (!story) {
      // Create with default cards and provided story content
      story = await prisma.aboutUsStory.create({
        data: {
          title: data.title || "Our Story",
          subtitle: data.subtitle || "",
          storyTitle: data.storyTitle || "How We Started",
          storySubtitle: data.storySubtitle || "",
          cards: [
            {
              cardTitle: "Expert Technicians",
              cardSubtitle: "Certified professionals with years of experience",
            },
            {
              cardTitle: "Quality Service",
              cardSubtitle: "Committed to excellence in every job",
            },
            {
              cardTitle: "Customer First",
              cardSubtitle: "Your satisfaction is our priority",
            },
          ],
          updatedBy: adminId,
        },
      });
    } else {
      // Update only story content
      const updateData: any = { updatedBy: adminId };
      if (data.title !== undefined) updateData.title = data.title;
      if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
      if (data.storyTitle !== undefined)
        updateData.storyTitle = data.storyTitle;
      if (data.storySubtitle !== undefined)
        updateData.storySubtitle = data.storySubtitle;

      story = await prisma.aboutUsStory.update({
        where: { id: story.id },
        data: updateData,
      });
    }

    res.status(200).json({
      status: "success",
      message: "Story content updated successfully",
      data: {
        title: story.title,
        subtitle: story.subtitle,
        storyTitle: story.storyTitle,
        storySubtitle: story.storySubtitle,
      },
    });
  } catch (error) {
    console.error("Update story content error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update story content",
    });
  }
};

// Get only cards (public)
export const getCards = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    let story = await prisma.aboutUsStory.findFirst();

    if (!story) {
      story = await prisma.aboutUsStory.create({
        data: {
          title: "Our Story",
          subtitle: "",
          storyTitle: "How We Started",
          storySubtitle: "",
          cards: [
            {
              cardTitle: "Expert Technicians",
              cardSubtitle: "Certified professionals with years of experience",
            },
            {
              cardTitle: "Quality Service",
              cardSubtitle: "Committed to excellence in every job",
            },
            {
              cardTitle: "Customer First",
              cardSubtitle: "Your satisfaction is our priority",
            },
          ],
        },
      });
    }

    res.status(200).json({
      status: "success",
      data: story.cards,
    });
  } catch (error) {
    console.error("Get cards error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get cards",
    });
  }
};
