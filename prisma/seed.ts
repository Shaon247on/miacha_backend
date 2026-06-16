import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  console.log('===============================');

  // ==================== SEED ADMIN ====================
  console.log('\n📋 Seeding Admin...');
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123';
  const adminName = process.env.ADMIN_NAME || 'Super Admin';
  
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
    console.log(`✅ Admin created: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`ℹ️ Admin already exists: ${adminEmail}`);
  }

  // ==================== SEED COMPANY SETTINGS ====================
  console.log('\n📋 Seeding Company Settings...');
  
  const existingSettings = await prisma.companySettings.findFirst();
  
  if (!existingSettings) {
    await prisma.companySettings.create({
      data: {
        companyName: 'CoolAir HVAC Services',
        companyLogo: null,
        companyFavicon: null,
        contactEmail: 'info@coolairhvac.com',
        contactPhone: '(815) 555-0123',
        contactAddress: '123 Main Street, Joliet, IL 60401',
        facebookUrl: 'https://facebook.com/coolairhvac',
        twitterUrl: 'https://twitter.com/coolairhvac',
        instagramUrl: 'https://instagram.com/coolairhvac',
        linkedinUrl: 'https://linkedin.com/company/coolairhvac',
        businessHours: [
          { day: 'Monday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
          { day: 'Tuesday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
          { day: 'Wednesday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
          { day: 'Thursday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
          { day: 'Friday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
          { day: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '15:00' },
          { day: 'Sunday', isOpen: false, openTime: '09:00', closeTime: '17:00' },
        ],
      },
    });
    console.log('✅ Company settings created');
  } else {
    console.log('ℹ️ Company settings already exist');
  }

  // ==================== SEED ABOUT US STORY ====================
  console.log('\n📋 Seeding About Us Story...');
  
  const existingStory = await prisma.aboutUsStory.findFirst();
  
  if (!existingStory) {
    await prisma.aboutUsStory.create({
      data: {
        title: "ABOUT US",
        subtitle: "",
        storyTitle: "OUR STORY",
        storySubtitle: "Fast, fair HVAC service built for Joliet Area homeowners.",
        cards: [
          {
            cardTitle: "LOCAL FAMILY-OWNED",
            cardSubtitle: "We live and work in the area, not a national call center. Every job gets personal attention."
          },
          {
            cardTitle: "TRANSPARENT PRICING",
            cardSubtitle: "Clear estimates, honest recommendations, and no surprise fees so you can decide with confidence."
          },
          {
            cardTitle: "BUILT FOR COMFORT",
            cardSubtitle: "We focus on reliable performance, improved efficiency, and long-term solutions that keep your home comfortable."
          }
        ],
      },
    });
    console.log('✅ About Us Story created');
  } else {
    console.log('ℹ️ About Us Story already exists');
  }

  // ==================== SEED FAQs ====================
  console.log('\n📋 Seeding FAQs...');
  
  const faqCount = await prisma.fAQ.count();
  
  if (faqCount === 0) {
    const faqs = [
      {
        question: "How often should I service my HVAC system?",
        answer: "It is recommended to service your HVAC system at least twice a year - once before summer for cooling and once before winter for heating. Regular maintenance can prevent breakdowns, improve efficiency, and extend the lifespan of your equipment.",
        order: 1,
        isActive: true,
      },
      {
        question: "What are signs that my AC needs repair?",
        answer: "Common signs include: weak airflow, strange noises, unpleasant odors, warm air blowing, unusual humidity levels, water leaks, and unusually high energy bills. If you notice any of these, contact us immediately.",
        order: 2,
        isActive: true,
      },
      {
        question: "How long does an HVAC system typically last?",
        answer: "With proper maintenance, central AC units last 10-15 years, furnaces last 15-20 years, and heat pumps last 10-15 years. Regular maintenance can extend these lifespans significantly.",
        order: 3,
        isActive: true,
      },
      {
        question: "Do you offer 24/7 emergency services?",
        answer: "Yes, we offer 24/7 emergency repair services. Our team is available nights, weekends, and holidays for urgent HVAC issues. Call our emergency hotline for immediate assistance.",
        order: 4,
        isActive: true,
      },
      {
        question: "How much does an HVAC inspection cost?",
        answer: "Our standard HVAC inspection costs $89 which includes a thorough check of your system, cleaning of components, and a detailed report of any issues found. This fee is waived if you book a repair service with us.",
        order: 5,
        isActive: true,
      },
      {
        question: "What is your service area?",
        answer: "We serve all major cities in the metropolitan area including downtown, suburbs, and surrounding communities up to 50 miles radius. Contact us to verify if we service your specific location.",
        order: 6,
        isActive: true,
      },
      {
        question: "Do you offer maintenance plans?",
        answer: "Yes, we offer annual maintenance plans starting at $15/month. Plans include bi-annual inspections, priority service, and discounts on repairs. Contact us for more details.",
        order: 7,
        isActive: true,
      },
      {
        question: "What brands do you work with?",
        answer: "We work with all major HVAC brands including Carrier, Trane, Lennox, Rheem, Goodman, Bryant, and many others. Our technicians are trained to service all makes and models.",
        order: 8,
        isActive: true,
      },
    ];

    for (const faq of faqs) {
      await prisma.fAQ.create({
        data: faq,
      });
    }
    console.log(`✅ Created ${faqs.length} FAQs`);
  } else {
    console.log(`ℹ️ FAQs already exist (${faqCount} found)`);
  }

  // ==================== SEED SAMPLE APPOINTMENTS ====================
  console.log('\n📋 Seeding Sample Appointments...');
  
  const appointmentCount = await prisma.appointment.count();
  
  if (appointmentCount === 0) {
    const appointments = [
      {
        appointmentType: "AC_REJUVENATION",
        fullName: "John Doe",
        email: "john@example.com",
        phoneNumber: "(555) 123-4567",
        address: "123 Main Street, Joliet, IL 60401",
        preferredDate: new Date(),
        preferredTime: "09:00",
        additionalNote: "Please call 15 minutes before arrival",
        status: "PENDING",
        serviceType: "RESIDENTIAL",
      },
      {
        appointmentType: "REPAIR_OR_REPLACE",
        fullName: "Jane Smith",
        email: "jane@example.com",
        phoneNumber: "(555) 987-6543",
        address: "456 Oak Avenue, Joliet, IL 60402",
        preferredDate: new Date(Date.now() + 86400000),
        preferredTime: "14:30",
        additionalNote: "Emergency - AC not cooling",
        status: "CONFIRMED",
        serviceType: "RESIDENTIAL",
      },
      {
        appointmentType: "WATER_QUALITY_SOLUTIONS",
        fullName: "Mike Johnson",
        email: "mike@example.com",
        phoneNumber: "(555) 456-7890",
        address: "789 Pine Street, Joliet, IL 60403",
        preferredDate: new Date(Date.now() + 172800000),
        preferredTime: "11:00",
        additionalNote: "",
        status: "PENDING",
        serviceType: "COMMERCIAL",
      },
    ];

    for (const appointment of appointments) {
      await prisma.appointment.create({
        data: appointment,
      });
    }
    console.log(`✅ Created ${appointments.length} sample appointments`);
  } else {
    console.log(`ℹ️ Appointments already exist (${appointmentCount} found)`);
  }

  console.log('\n===============================');
  console.log('🎉 Seeding completed successfully!');
  console.log('===============================');
  
  // Summary
  console.log('\n📊 Final Counts:');
  console.log(`   - Admins: ${await prisma.admin.count()}`);
  console.log(`   - Company Settings: ${await prisma.companySettings.count()}`);
  console.log(`   - FAQs: ${await prisma.fAQ.count()}`);
  console.log(`   - Appointments: ${await prisma.appointment.count()}`);
  console.log(`   - About Us Story: ${await prisma.aboutUsStory.count()}`);
}

main()
  .catch((e) => {
    console.error('\n❌ Seeding failed!');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });