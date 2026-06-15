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

// import { PrismaClient } from '@prisma/client';
// import bcrypt from 'bcryptjs';
// import dotenv from 'dotenv';

// dotenv.config();

// const prisma = new PrismaClient();

// async function main() {
//   console.log('🌱 Starting database seeding...');

//   // Seed Admin
//   const adminEmail = process.env.ADMIN_EMAIL || 'admin@hvacservices.com';
//   const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
//   const adminName = process.env.ADMIN_NAME || 'Super Admin';
  
//   try {
//     // Check if admin already exists
//     const existingAdmin = await prisma.admin.findUnique({
//       where: { email: adminEmail }
//     });

//     if (!existingAdmin) {
//       const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
//       await prisma.admin.create({
//         data: {
//           email: adminEmail,
//           password: hashedPassword,
//           name: adminName,
//           role: 'SUPER_ADMIN'
//         }
//       });
//       console.log('✅ Admin user created successfully');
//       console.log(`   Email: ${adminEmail}`);
//       console.log(`   Password: ${adminPassword}`);
//     } else {
//       console.log('ℹ️ Admin user already exists');
//     }

//     // Seed About Us Story
//     const existingStory = await prisma.aboutUsStory.findFirst();
    
//     if (!existingStory) {
//       await prisma.aboutUsStory.create({
//         data: {
//           title: "Our Story",
//           subtitle: "Building trust since 2010",
//           storyTitle: "From Humble Beginnings",
//           storySubtitle: "A journey of dedication and excellence",
//           cards: [
//             {
//               cardTitle: "Expert Technicians",
//               cardSubtitle: "Certified professionals with years of experience"
//             },
//             {
//               cardTitle: "Quality Service",
//               cardSubtitle: "Committed to excellence in every job"
//             },
//             {
//               cardTitle: "Customer First",
//               cardSubtitle: "Your satisfaction is our priority"
//             }
//           ],
//         },
//       });
//       console.log('✅ About Us Story seeded successfully');
//     } else {
//       console.log('ℹ️ About Us Story already exists');
//     }

//     console.log('🎉 Seeding completed successfully!');
//   } catch (error) {
//     console.error('❌ Seeding failed:', error);
//     throw error;
//   }
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

