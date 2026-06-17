import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Get admin credentials from .env or use defaults
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hvacservices.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const adminName = process.env.ADMIN_NAME || 'Super Admin';

  // Check if admin already exists
  const existingAdmin = await prisma.admin.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await prisma.admin.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: 'SUPER_ADMIN'
      }
    });
    console.log(`✅ Admin created: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
  } else {
    console.log(`ℹ️ Admin already exists: ${adminEmail}`);
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });