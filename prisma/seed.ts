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
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hvacservices.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
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
        companyLogo: 'https://res.cloudinary.com/dginfbjjl/image/upload/v1734567890/company-logos/logo.png',
        companyFavicon: 'https://res.cloudinary.com/dginfbjjl/image/upload/v1734567890/company-logos/favicon.ico',
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
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);
    const threeDays = new Date(now);
    threeDays.setDate(threeDays.getDate() + 3);
    const fourDays = new Date(now);
    fourDays.setDate(fourDays.getDate() + 4);
    const fiveDays = new Date(now);
    fiveDays.setDate(fiveDays.getDate() + 5);

    const appointments = [
      {
        appointmentType: "AC_REJUVENATION",
        fullName: "John Doe",
        email: "john@example.com",
        phoneNumber: "(555) 123-4567",
        address: "123 Main Street, Joliet, IL 60401",
        preferredDate: tomorrow,
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
        preferredDate: dayAfter,
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
        address: "789 Pine Street, Plainfield, IL 60544",
        preferredDate: threeDays,
        preferredTime: "11:00",
        additionalNote: "",
        status: "PENDING",
        serviceType: "COMMERCIAL",
      },
      {
        appointmentType: "INDOOR_AIR_QUALITY",
        fullName: "Sarah Wilson",
        email: "sarah@example.com",
        phoneNumber: "(555) 321-0987",
        address: "321 Elm Blvd, Shorewood, IL 60404",
        preferredDate: fourDays,
        preferredTime: "10:00",
        additionalNote: "Allergies in the family",
        status: "IN_PROGRESS",
        serviceType: "RESIDENTIAL",
      },
      {
        appointmentType: "REPAIR_AND_TUNE_UP",
        fullName: "David Brown",
        email: "david@example.com",
        phoneNumber: "(555) 654-3210",
        address: "654 Maple Dr, Romeoville, IL 60446",
        preferredDate: fiveDays,
        preferredTime: "13:30",
        additionalNote: "Regular maintenance",
        status: "COMPLETED",
        serviceType: "RESIDENTIAL",
      },
      {
        appointmentType: "AC_REJUVENATION",
        fullName: "Emily Davis",
        email: "emily@example.com",
        phoneNumber: "(555) 789-0123",
        address: "789 Cedar Ln, Crest Hill, IL 60403",
        preferredDate: threeDays,
        preferredTime: "16:00",
        additionalNote: "System is 8 years old",
        status: "PENDING",
        serviceType: "RESIDENTIAL",
      },
      {
        appointmentType: "REPAIR_OR_REPLACE",
        fullName: "Robert Martinez",
        email: "robert@example.com",
        phoneNumber: "(555) 234-5678",
        address: "234 Ash Ave, Joliet, IL 60401",
        preferredDate: tomorrow,
        preferredTime: "08:30",
        additionalNote: "Furnace not working",
        status: "CONFIRMED",
        serviceType: "RESIDENTIAL",
      },
      {
        appointmentType: "WATER_QUALITY_SOLUTIONS",
        fullName: "Lisa Thompson",
        email: "lisa@example.com",
        phoneNumber: "(555) 876-5432",
        address: "876 Birch Rd, Plainfield, IL 60544",
        preferredDate: dayAfter,
        preferredTime: "15:00",
        additionalNote: "Hard water issues",
        status: "PENDING",
        serviceType: "RESIDENTIAL",
      },
      {
        appointmentType: "INDOOR_AIR_QUALITY",
        fullName: "Michael Chen",
        email: "michael@example.com",
        phoneNumber: "(555) 432-1098",
        address: "109 Walnut St, Shorewood, IL 60404",
        preferredDate: fourDays,
        preferredTime: "11:30",
        additionalNote: "Dust and humidity issues",
        status: "CONFIRMED",
        serviceType: "COMMERCIAL",
      },
      {
        appointmentType: "REPAIR_AND_TUNE_UP",
        fullName: "Amanda Garcia",
        email: "amanda@example.com",
        phoneNumber: "(555) 567-8901",
        address: "567 Spruce Ave, Romeoville, IL 60446",
        preferredDate: fiveDays,
        preferredTime: "09:30",
        additionalNote: "Annual tune-up",
        status: "COMPLETED",
        serviceType: "RESIDENTIAL",
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

  // ==================== SEED BLOGS ====================
  console.log('\n📋 Seeding Blogs...');
  
  const blogCount = await prisma.blog.count();
  
  if (blogCount === 0) {
    const blogs = [
      {
        slug: "signs-your-ac-needs-repair",
        title: "5 Signs Your AC Unit Needs Repair",
        excerpt: "Learn the warning signs that indicate your air conditioning system needs professional attention before it breaks down completely.",
        content: `
          <h2>Introduction</h2>
          <p>Your air conditioning system is one of the most important appliances in your home, especially during hot Joliet summers. Knowing when your AC needs repair can save you from costly breakdowns and uncomfortable situations.</p>
          <h2>1. Weak Airflow</h2>
          <p>If you notice that the air coming from your vents is weak or inconsistent, it could indicate several problems. This might be due to a clogged filter, ductwork issues, or a failing compressor.</p>
          <h2>2. Warm Air Coming from Vents</h2>
          <p>When your AC is running but blowing warm air, there's definitely a problem. This could mean low refrigerant levels, a broken compressor, or issues with the condenser.</p>
          <h2>3. Strange Noises</h2>
          <p>Unusual sounds like grinding, squealing, or banging from your AC unit shouldn't be ignored. These noises often indicate mechanical problems that require immediate attention.</p>
          <h2>4. Foul Odors</h2>
          <p>Bad smells coming from your AC vents could indicate mold growth, a dead animal in the ductwork, or burnt wire insulation.</p>
          <h2>5. Higher Than Normal Energy Bills</h2>
          <p>If your energy bills have suddenly increased without a change in usage, your AC might be working harder than it should.</p>
        `,
        image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=400&fit=crop",
        author: "Micah K",
        publishedDate: new Date("2024-05-15"),
        category: "HVAC Tips",
        readingTime: 5,
        relatedBlogIds: [],
        isActive: true,
      },
      {
        slug: "ac-rejuvenation-vs-replacement",
        title: "AC Rejuvenation vs Replacement: What's Right for You?",
        excerpt: "Understand the difference between AC rejuvenation and full replacement, and learn which option makes sense for your system.",
        content: `
          <h2>Understanding Your Options</h2>
          <p>When your air conditioning system isn't performing as well as it used to, you have two main options: rejuvenation or replacement.</p>
          <h2>What is AC Rejuvenation?</h2>
          <p>AC Rejuvenation is a process that restores your existing air conditioning system to peak performance. This process includes deep cleaning, lubricant restoration, and refrigerant optimization.</p>
          <h2>Benefits of AC Rejuvenation</h2>
          <ul>
            <li>Lower upfront cost</li>
            <li>Quick process, often completed in one day</li>
            <li>Extends system life by several years</li>
            <li>Improved energy efficiency</li>
          </ul>
          <h2>When Should You Replace Your AC?</h2>
          <p>Full replacement is the better option if your system is over 15 years old, requires frequent repairs, or has a failing compressor.</p>
        `,
        image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=400&fit=crop",
        author: "Micah K",
        publishedDate: new Date("2024-05-10"),
        category: "AC Services",
        readingTime: 6,
        relatedBlogIds: [],
        isActive: true,
      },
      {
        slug: "summer-ac-maintenance-checklist",
        title: "Summer AC Maintenance Checklist",
        excerpt: "Prepare your air conditioning system for summer with this comprehensive maintenance checklist to avoid breakdowns.",
        content: `
          <h2>Get Ready for Summer</h2>
          <p>Before the hot summer months arrive, it's crucial to ensure your AC system is in peak condition.</p>
          <h2>Monthly Tasks</h2>
          <p>Replace your AC filter every 1-2 months during summer. A clean filter improves efficiency and air quality.</p>
          <h2>Quarterly Tasks</h2>
          <p>Remove debris like leaves, grass, and dirt from around the condenser unit. Test your thermostat to ensure it's reading correctly.</p>
          <h2>Annual Professional Maintenance</h2>
          <p>Schedule a professional tune-up before summer begins. This should include refrigerant level check, electrical connection inspection, and compressor performance test.</p>
        `,
        image: "https://images.unsplash.com/photo-1585707572537-34b73d3a4710?w=800&h=400&fit=crop",
        author: "Micah K",
        publishedDate: new Date("2024-05-05"),
        category: "Maintenance",
        readingTime: 5,
        relatedBlogIds: [],
        isActive: true,
      },
      {
        slug: "benefits-of-indoor-air-quality",
        title: "Why Indoor Air Quality Matters for Your Health",
        excerpt: "Discover how poor indoor air quality affects your health and learn solutions to improve the air in your home.",
        content: `
          <h2>The Impact of Indoor Air Quality</h2>
          <p>Most people spend 90% of their time indoors, yet indoor air is often more polluted than outdoor air.</p>
          <h2>Common Indoor Air Pollutants</h2>
          <ul>
            <li>Dust and allergens</li>
            <li>Volatile Organic Compounds (VOCs)</li>
            <li>Mold and mildew</li>
            <li>Carbon monoxide</li>
          </ul>
          <h2>Solutions to Improve Air Quality</h2>
          <ul>
            <li>Install a quality air filtration system</li>
            <li>Use HEPA filters in your AC system</li>
            <li>Install UV purifiers</li>
            <li>Maintain proper humidity levels (30-50%)</li>
          </ul>
        `,
        image: "https://images.unsplash.com/photo-1576091160673-112d4e3f2826?w=800&h=400&fit=crop",
        author: "Micah K",
        publishedDate: new Date("2024-04-28"),
        category: "Health & Comfort",
        readingTime: 5,
        relatedBlogIds: [],
        isActive: true,
      },
      {
        slug: "water-quality-solutions",
        title: "Water Quality Solutions for Your Home",
        excerpt: "Learn about common water quality issues and the solutions available to ensure safe, clean water for your family.",
        content: `
          <h2>Understanding Water Quality</h2>
          <p>The quality of your water affects your health, the lifespan of your appliances, and the effectiveness of your cleaning routines.</p>
          <h2>Common Water Problems</h2>
          <ul>
            <li>Hard water / scale buildup</li>
            <li>Chlorine taste and odor</li>
            <li>Sediment and particles</li>
            <li>Iron and sulfur</li>
          </ul>
          <h2>Water Treatment Solutions</h2>
          <ul>
            <li>Whole-house water filters</li>
            <li>Water softener systems</li>
            <li>UV purification systems</li>
            <li>Reverse osmosis systems for drinking water</li>
          </ul>
        `,
        image: "https://images.unsplash.com/photo-1584622181473-0410f2969603?w=800&h=400&fit=crop",
        author: "Micah K",
        publishedDate: new Date("2024-04-20"),
        category: "Water Quality",
        readingTime: 5,
        relatedBlogIds: [],
        isActive: true,
      },
      {
        slug: "maintaining-your-hvac-system",
        title: "Complete Guide to HVAC System Maintenance",
        excerpt: "A comprehensive guide covering everything you need to know about maintaining your heating and cooling system throughout the year.",
        content: `
          <h2>Year-Round HVAC Maintenance</h2>
          <p>Your HVAC system works hard to keep your home comfortable. Regular maintenance ensures it runs efficiently, lasts longer, and prevents costly repairs.</p>
          <h2>Spring Maintenance</h2>
          <p>Prepare for cooling season by inspecting your AC unit for winter damage. Replace filters, clean the outdoor unit, and schedule a professional tune-up.</p>
          <h2>Fall Maintenance</h2>
          <p>Clean out ductwork, have your heating system inspected, and replace filters before winter.</p>
          <h2>Professional Maintenance Benefits</h2>
          <ul>
            <li>Extended system lifespan</li>
            <li>Improved energy efficiency</li>
            <li>Better air quality</li>
            <li>Lower repair costs</li>
          </ul>
        `,
        image: "https://images.unsplash.com/photo-1585707572537-34b73d3a4710?w=800&h=400&fit=crop",
        author: "Micah K",
        publishedDate: new Date("2024-04-15"),
        category: "Maintenance",
        readingTime: 6,
        relatedBlogIds: [],
        isActive: true,
      },
    ];

    for (const blog of blogs) {
      await prisma.blog.create({
        data: blog,
      });
    }
    console.log(`✅ Created ${blogs.length} blogs`);
  } else {
    console.log(`ℹ️ Blogs already exist (${blogCount} found)`);
  }

  console.log('\n===============================');
  console.log('🎉 Seeding completed successfully!');
  console.log('===============================');
  
  // Summary
  console.log('\n📊 Final Counts:');
  console.log(`   - Admins: ${await prisma.admin.count()}`);
  console.log(`   - Company Settings: ${await prisma.companySettings.count()}`);
  console.log(`   - About Us Story: ${await prisma.aboutUsStory.count()}`);
  console.log(`   - FAQs: ${await prisma.fAQ.count()}`);
  console.log(`   - Appointments: ${await prisma.appointment.count()}`);
  console.log(`   - Blogs: ${await prisma.blog.count()}`);
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