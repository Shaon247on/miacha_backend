-- CreateTable
CREATE TABLE "about_us_story" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Our Story',
    "subtitle" TEXT NOT NULL DEFAULT '',
    "storyTitle" TEXT NOT NULL DEFAULT 'How We Started',
    "storySubtitle" TEXT NOT NULL DEFAULT '',
    "cards" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "about_us_story_pkey" PRIMARY KEY ("id")
);
