import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { MAX_SYSTEM_PROMPT } from '@/lib/agents';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { messages, toolResults } = await req.json();

    // Build messages array — inject tool results as context if available
    const contextMessages = [...messages];
    if (toolResults && Object.keys(toolResults).length > 0) {
      const toolContext = Object.entries(toolResults)
        .map(([agent, result]) => `[${agent} result]: ${JSON.stringify(result)}`)
        .join('\n\n');
      // Append tool results to the last user message
      const lastMsg = contextMessages[contextMessages.length - 1];
      contextMessages[contextMessages.length - 1] = {
        ...lastMsg,
        content: `${lastMsg.content}\n\n---\nReal-time data from agents:\n${toolContext}\n---\nUse this data in your response.`
      };
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: MAX_SYSTEM_PROMPT },
        ...contextMessages,
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? 'Sorry, I had trouble processing that.';
    return NextResponse.json({ reply });

  } catch (err: unknown) {
    console.error('Chat error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
