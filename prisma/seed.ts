import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
  
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(
        process.env.ADMIN_PASSWORD || 'Admin123',
        10
      );
      
      await prisma.admin.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: process.env.ADMIN_NAME || 'Super Admin',
          role: 'SUPER_ADMIN'
        }
      });
      console.log('✅ Admin user created successfully');
      console.log(`   Email: ${adminEmail}`);
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });