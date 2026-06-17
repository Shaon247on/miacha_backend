import { Request, Response } from 'express';
import { sendGeminiMessage, ChatMessage } from '../services/gemini.service';

export const chat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages } = req.body;

    console.log('📩 Chat request received:', messages?.length || 0, 'messages');

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid messages format',
      });
      return;
    }

    // ✅ Convert messages to Gemini format - KEEP ALL HISTORY
    const validMessages = messages
      .filter((m: any) => m.role && m.content && ['user', 'assistant', 'system'].includes(m.role))
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        content: m.content,
      })) as ChatMessage[];

    if (validMessages.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'No valid messages provided',
      });
      return;
    }

    // ✅ Log the conversation history for debugging
    console.log('📝 Conversation history:', validMessages.map(m => `${m.role}: ${m.content.substring(0, 50)}...`));

    // Check if streaming is requested
    const shouldStream = req.query.stream === 'true';

    const result = await sendGeminiMessage(validMessages, shouldStream);

    if (shouldStream) {
      if (isAsyncIterable(result)) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        try {
          for await (const chunk of result) {
            const text = chunk.text;
            if (text) {
              res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
            }
          }
          res.write('data: [DONE]\n\n');
          res.end();
        } catch (streamError) {
          console.error('❌ Stream error:', streamError);
          res.write(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`);
          res.end();
        }
      } else {
        console.warn('⚠️ Streaming requested but response is not a stream');
        res.status(500).json({
          status: 'error',
          message: 'Streaming not available for this response',
        });
      }
    } else {
      if (isNonStreamingResponse(result)) {
        const content = result.choices[0]?.message?.content || '';
        console.log('✅ Chat response sent');
        res.status(200).json({
          status: 'success',
          data: { content },
        });
      } else {
        console.error('❌ Invalid response format:', result);
        res.status(500).json({
          status: 'error',
          message: 'Invalid response format from AI service',
        });
      }
    }
  } catch (error: any) {
    console.error('❌ Chat error:', error);
    
    if (error.message && error.message.includes('429')) {
      res.status(429).json({
        status: 'error',
        message: 'Rate limit exceeded. Please try again in a moment.',
      });
      return;
    }
    
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to process chat request',
    });
  }
};

// Type guards
function isAsyncIterable(obj: any): obj is AsyncIterable<any> {
  return obj && typeof obj[Symbol.asyncIterator] === 'function';
}

function isNonStreamingResponse(obj: any): obj is { choices: { message: { content: string } }[] } {
  return obj && 'choices' in obj && Array.isArray(obj.choices);
}