import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image data required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const prompt = `You are analyzing a Block Blast puzzle game screenshot.

Please analyze this image and extract:
1. The 8x8 game board state - which cells are filled (1) and which are empty (0)
2. The available pieces shown at the bottom (usually 3 pieces)

For each piece, describe its shape as a 2D grid where 1=filled, 0=empty.

Return ONLY a valid JSON object in this exact format:
{
  "board": [
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    ... (8 rows total, each with 8 values)
  ],
  "pieces": [
    {
      "id": 0,
      "name": "L-shape",
      "grid": [
        [1,0],
        [1,0],
        [1,1]
      ]
    },
    ... (for each piece shown)
  ],
  "confidence": 0.9
}

Be as accurate as possible reading the grid. Filled cells are colored blocks, empty cells are dark/transparent spaces.
Do not include any text outside the JSON object.`;

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType || 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'No response from Claude' }, { status: 500 });
    }

    // Parse JSON from response
    let raw = textContent.text.trim();
    // Remove markdown code blocks if present
    raw = raw.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');

    try {
      const parsed = JSON.parse(raw);

      // Validate board is 8x8
      if (!parsed.board || parsed.board.length !== 8 || parsed.board[0].length !== 8) {
        // Fix board dimensions
        while (parsed.board.length < 8) parsed.board.push(new Array(8).fill(0));
        parsed.board = parsed.board.slice(0, 8).map((row: number[]) => {
          while (row.length < 8) row.push(0);
          return row.slice(0, 8);
        });
      }

      // Ensure pieces have proper structure
      if (!parsed.pieces) parsed.pieces = [];
      parsed.pieces = parsed.pieces.map((p: { id?: number; name?: string; grid: number[][] }, i: number) => ({
        id: p.id ?? i,
        name: p.name ?? `Piece ${i + 1}`,
        grid: p.grid || [[1]],
      }));

      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({
        error: 'Failed to parse Claude response',
        raw: textContent.text.slice(0, 500),
      }, { status: 422 });
    }
  } catch (error) {
    console.error('Image analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 });
  }
}
