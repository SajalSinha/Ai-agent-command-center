import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { MAX_SYSTEM_PROMPT } from '@/lib/agents';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CONTEXT_MESSAGE_LIMIT = 10;
const MAX_TOKENS = 2048;

export async function POST(req: NextRequest) {
  try {
    const { messages, toolResults } = await req.json();

    // Last N messages for context (10-message memory)
    const recentMessages = Array.isArray(messages)
      ? messages.slice(-CONTEXT_MESSAGE_LIMIT)
      : [];

    const contextMessages = [...recentMessages];

    // Inject tool results as structured context when available
    if (toolResults && typeof toolResults === 'object' && Object.keys(toolResults).length > 0) {
      const toolContext = Object.entries(toolResults)
        .map(([agent, result]) => `[${agent}]: ${JSON.stringify(result)}`)
        .join('\n\n');
      const lastMsg = contextMessages[contextMessages.length - 1];
      if (lastMsg?.content) {
        contextMessages[contextMessages.length - 1] = {
          ...lastMsg,
          content: `${lastMsg.content}\n\n---\nAgent results (use for accurate response):\n${toolContext}\n---`,
        };
      }
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: MAX_SYSTEM_PROMPT },
        ...contextMessages,
      ],
      max_tokens: MAX_TOKENS,
      temperature: 0.6,
    });

    const reply = completion.choices[0]?.message?.content ?? 'Sorry, I had trouble processing that.';
    return NextResponse.json({ reply });
  } catch (err: unknown) {
    console.error('Chat error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
