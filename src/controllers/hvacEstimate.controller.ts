import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import { hvacEstimateSettingsSchema, hvacQuoteSchema } from '../validations/hvacEstimate.validation';

// ============================================================
// ADMIN SETTINGS
// ============================================================

// Get HVAC estimate settings (admin only)
export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let settings = await prisma.hvacEstimateSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.hvacEstimateSettings.create({
        data: {
          baseRatePerSqFt: 5.00,
          laborRatePerHour: 75.00,
          markupPercentage: 25.00,
          tier1Multiplier: 1.0,
          tier2Multiplier: 1.3,
          tier3Multiplier: 1.7,
          installationBaseFee: 1500.00,
          permitFee: 200.00,
          disposalFee: 150.00,
          monthlyPaymentRate: 0.02,
        },
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: settings,
    });
  } catch (error) {
    console.error('Get HVAC estimate settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get settings',
    });
  }
};

// Update HVAC estimate settings (admin only)
export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.userId;
    
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });
    
    if (!admin || admin.role !== 'SUPER_ADMIN') {
      res.status(403).json({
        status: 'error',
        message: 'Only super admin can update HVAC estimate settings',
      });
      return;
    }
    
    const validatedData = hvacEstimateSettingsSchema.parse(req.body);
    
    let settings = await prisma.hvacEstimateSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.hvacEstimateSettings.create({
        data: {
          ...validatedData,
          updatedBy: adminId,
        },
      });
    } else {
      settings = await prisma.hvacEstimateSettings.update({
        where: { id: settings.id },
        data: {
          ...validatedData,
          updatedBy: adminId,
        },
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Settings updated successfully',
      data: settings,
    });
  } catch (error: any) {
    console.error('Update HVAC estimate settings error:', error);
    
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
      message: 'Failed to update settings',
    });
  }
};

// ============================================================
// CALCULATE PRICES (Public)
// ============================================================

export const calculatePrices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { squareFootage, stories, bedrooms, heatingSource } = req.body;
    
    console.log('📊 Calculating prices for:', { squareFootage, stories, bedrooms, heatingSource });
    
    // Get settings
    let settings = await prisma.hvacEstimateSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.hvacEstimateSettings.create({
        data: {
          baseRatePerSqFt: 5.00,
          laborRatePerHour: 75.00,
          markupPercentage: 25.00,
          tier1Multiplier: 1.0,
          tier2Multiplier: 1.3,
          tier3Multiplier: 1.7,
          installationBaseFee: 1500.00,
          permitFee: 200.00,
          disposalFee: 150.00,
          monthlyPaymentRate: 0.02,
        },
      });
    }
    
    // ✅ Base price calculation
    const basePrice = squareFootage * settings.baseRatePerSqFt;
    console.log('💰 Base price:', basePrice);
    
    // ✅ Adjustments
    const storyAdjustment = 1 + (stories - 1) * 0.05;
    const bedroomAdjustment = 1 + (bedrooms - 2) * 0.03;
    
    const heatingAdjustments: Record<string, number> = {
      'natural gas': 1.0,
      'electric': 1.15,
      'propane': 1.10,
      'oil': 1.05,
    };
    const heatingAdjustment = heatingAdjustments[heatingSource] || 1.0;
    
    const markup = 1 + (settings.markupPercentage / 100);
    console.log('📈 Markup:', markup);
    
    // ✅ Calculate for each tier
    const tiers = [
      { 
        id: 1, 
        label: 'Economy', 
        multiplier: settings.tier1Multiplier, 
        brand: 'Ameristar', 
        name: 'Classic',
        seer2: '14.3 SEER2',
        laborWarranty: '2 Year',
        laborStars: 3,
      },
      { 
        id: 2, 
        label: 'Standard', 
        multiplier: settings.tier2Multiplier, 
        brand: 'Friedrich', 
        name: 'Signature',
        seer2: '15.2 SEER2',
        laborWarranty: '5 Year',
        laborStars: 4,
      },
      { 
        id: 3, 
        label: 'Premium', 
        multiplier: settings.tier3Multiplier, 
        brand: 'American Standard', 
        name: 'Premium',
        seer2: '15.2 SEER2',
        laborWarranty: '5 Year',
        laborStars: 4,
      },
    ];
    
    const systems = tiers.map(tier => {
      // ✅ Calculate raw price with all multipliers
      const rawPrice = basePrice 
        * tier.multiplier 
        * storyAdjustment 
        * bedroomAdjustment 
        * heatingAdjustment 
        * markup;
      
      // ✅ Round to nearest 100
      const retailPrice = Math.round(rawPrice / 100) * 100;
      const onlineSavings = Math.round(retailPrice * 0.15 / 100) * 100;
      const cashPrice = retailPrice - onlineSavings;
      const monthlyPrice = Math.round((cashPrice * (settings.monthlyPaymentRate || 0.02)) / 10) * 10;
      
      console.log(`💰 ${tier.label} price:`, {
        rawPrice,
        retailPrice,
        cashPrice,
        monthlyPrice,
      });
      
      return {
        id: tier.id.toString(),
        tier: tier.label,
        brand: tier.brand,
        name: tier.name,
        type: 'A/C & Gas Furnace',
        fuel: 'Gas',
        seer2: tier.seer2,
        dehumidification: 3,
        noiseLevel: 'Standard',
        noiseStars: 3,
        partsWarranty: '10 Year',
        partsStars: 5,
        laborWarranty: tier.laborWarranty,
        laborStars: tier.laborStars,
        retailPrice,
        cashPrice,
        onlineSavings,
        monthlyPrice,
      };
    });
    
    res.status(200).json({
      status: 'success',
      data: systems,
    });
  } catch (error) {
    console.error('Calculate prices error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to calculate prices',
    });
  }
};

// ============================================================
// SUBMIT QUOTE (Public)
// ============================================================

export const submitQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📝 Received quote submission:', JSON.stringify(req.body, null, 2));
    
    // ✅ Validate with more flexible schema
    const validatedData = hvacQuoteSchema.parse(req.body);
    
    console.log('✅ Validation passed:', JSON.stringify(validatedData, null, 2));
    
    // Generate order number
    const prefix = 'HVAC';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const orderNumber = `${prefix}-${timestamp}-${random}`;
    
    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        appointmentType: 'HVAC_ESTIMATE',
        fullName: validatedData.fullName,
        email: validatedData.email,
        phoneNumber: validatedData.phoneNumber,
        address: validatedData.address,
        preferredDate: validatedData.preferredDate ? new Date(validatedData.preferredDate) : new Date(),
        preferredTime: validatedData.preferredTime || '09:00',
        additionalNote: `HVAC Estimate Quote #${orderNumber}\nSystem: ${validatedData.systemBrand} ${validatedData.systemName}\nTier: ${validatedData.selectedTier}\n\nNotes: ${validatedData.notes || 'N/A'}`,
        serviceType: 'RESIDENTIAL',
        status: 'PENDING',
      },
    });
    
    // Create quote
    const quote = await prisma.hvacQuote.create({
      data: {
        fullName: validatedData.fullName,
        email: validatedData.email,
        phoneNumber: validatedData.phoneNumber,
        address: validatedData.address,
        squareFootage: validatedData.squareFootage,
        stories: validatedData.stories,
        bedrooms: validatedData.bedrooms,
        heatingSource: validatedData.heatingSource,
        selectedTier: validatedData.selectedTier,
        systemBrand: validatedData.systemBrand,
        systemName: validatedData.systemName,
        systemPrice: validatedData.systemPrice,
        retailPrice: validatedData.retailPrice,
        cashPrice: validatedData.cashPrice,
        onlineSavings: validatedData.onlineSavings,
        monthlyPayment: validatedData.monthlyPayment,
        preferredDate: validatedData.preferredDate ? new Date(validatedData.preferredDate) : null,
        preferredTime: validatedData.preferredTime || null,
        notes: validatedData.notes || null,
        orderNumber: orderNumber,
        appointmentId: appointment.id,
      },
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Quote submitted successfully!',
      data: {
        quote,
        appointment,
        orderNumber,
      },
    });
  } catch (error: any) {
    console.error('❌ Submit quote error:', error);
    
    if (error.name === 'ZodError') {
      console.error('❌ Validation errors:', JSON.stringify(error.errors, null, 2));
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.errors.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit quote',
      error: error.message,
    });
  }
};

// ============================================================
// GET QUOTES (Admin only)
// ============================================================

export const getQuotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;
    
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));
    
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { orderNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    const [quotes, total] = await Promise.all([
      prisma.hvacQuote.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          appointment: {
            select: {
              id: true,
              status: true,
              preferredDate: true,
            },
          },
        },
      }),
      prisma.hvacQuote.count({ where }),
    ]);
    
    res.status(200).json({
      status: 'success',
      data: {
        quotes,
        pagination: {
          page,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get quotes',
    });
  }
};

// Get single quote (Admin only)
export const getQuoteById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const quote = await prisma.hvacQuote.findUnique({
      where: { id },
      include: {
        appointment: true,
      },
    });
    
    if (!quote) {
      res.status(404).json({
        status: 'error',
        message: 'Quote not found',
      });
      return;
    }
    
    res.status(200).json({
      status: 'success',
      data: quote,
    });
  } catch (error) {
    console.error('Get quote error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get quote',
    });
  }
};

// Update quote status (Admin only)
export const updateQuoteStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const quote = await prisma.hvacQuote.update({
      where: { id },
      data: { status },
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Quote status updated successfully',
      data: quote,
    });
  } catch (error) {
    console.error('Update quote status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update quote status',
    });
  }
};