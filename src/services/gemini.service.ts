import ai from '../config/gemini.config';
import prisma from '../lib/prisma';

// Types
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export type GeminiResponse = 
  | AsyncIterable<any>
  | { choices: { message: { content: string } }[] };

// Get company settings from database
async function getCompanyContext() {
  try {
    const company = await prisma.companySettings.findFirst();
    const faqs = await prisma.fAQ.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      take: 20,
    });

    const services = [
      'AC Rejuvenation: Full restoration service for aging AC units.',
      'Repair or Replace: Expert diagnosis for repair or replacement.',
      'Repair & Tune Up: Comprehensive maintenance and inspection.',
      'Water Quality Solutions: Professional water testing and treatment.',
      'Indoor Air Quality: Air quality assessment and improvement.',
    ];

    return {
      companyName: company?.companyName || 'HVAC Service',
      companyInfo: `
Company: ${company?.companyName || 'HVAC Service'}
Contact Email: ${company?.contactEmail || 'contact@hvacservices.com'}
Contact Phone: ${company?.contactPhone || '(555) 123-4567'}
Address: ${company?.contactAddress || '123 Main Street, Joliet, IL 60401'}
      `,
      faqs: faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n'),
      services: services.join('\n'),
    };
  } catch (error) {
    console.error('Error getting company context:', error);
    return {
      companyName: 'HVAC Service',
      companyInfo: 'HVAC Service - Professional HVAC solutions',
      faqs: '',
      services: 'Various HVAC services available',
    };
  }
}

// Build system prompt
async function buildSystemPrompt(): Promise<string> {
  const context = await getCompanyContext();
  
  return `
You are "HVAC Helper", a friendly and professional AI assistant for ${context.companyName}, 
an HVAC service provider serving the Joliet, IL area.

Your role is to help customers:
1. Learn about HVAC services offered
2. Understand service pricing and scheduling
3. Answer questions about HVAC maintenance
4. Assist with common HVAC issues
5. Guide users toward booking appointments

Personality: Helpful, professional, warm, and informative.
Tone: Clear, concise, and customer-friendly.

Important: Always stay on topic. If asked about anything not related to HVAC 
or the company, politely redirect to HVAC topics.

Company Information:
${context.companyInfo}

Services Offered:
${context.services}

${context.faqs ? `\nFAQs:\n${context.faqs}` : ''}

Instructions:
- If a user asks about pricing, provide general ranges and suggest contacting the office for exact quotes.
- If a user needs to schedule an appointment, direct them to the appointment booking form.
- For emergency issues, suggest calling the emergency number immediately.
- Be conversational and friendly, use emojis sparingly.
- Keep responses concise (under 150 words when possible).
- Always end with a helpful follow-up question or offer.
- Remember the conversation context. If the user says "yes" to a question, reference your previous question.
`;
}

// ✅ Send message to Gemini with full conversation history
export async function sendGeminiMessage(
  messages: ChatMessage[],
  stream: boolean = false
): Promise<GeminiResponse> {
  try {
    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    console.log('🔑 API Key present');

    // ✅ Create chat with full history
    const chat = ai.chats.create({
      model: 'gemini-3.5-flash',
      config: {
        systemInstruction: await buildSystemPrompt(),
      },
      // ✅ Pass the entire conversation history
      history: messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
    });

    // ✅ Get the last user message
    const lastUserMessage = messages[messages.length - 1]?.content || 'Hello';

    console.log('🤖 Sending request to Gemini with history length:', messages.length);

    if (stream) {
      const streamResponse = await chat.sendMessageStream({
        message: lastUserMessage,
      });
      return streamResponse;
    } else {
      const response = await chat.sendMessage({
        message: lastUserMessage,
      });
      
      console.log('✅ Gemini response received');
      
      return {
        choices: [
          {
            message: {
              content: response.text,
            },
          },
        ],
      };
    }
  } catch (error: any) {
    console.error('❌ Gemini error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      details: error.details,
    });
    throw error;
  }
}