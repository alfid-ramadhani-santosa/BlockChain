import { NextRequest, NextResponse } from 'next/server';
import { solve } from '@/lib/solver';
import type { SolverOptions } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { board, pieces, options } = await req.json();

    if (!board || !pieces || !Array.isArray(board) || !Array.isArray(pieces)) {
      return NextResponse.json({ error: 'Invalid input: board and pieces required' }, { status: 400 });
    }

    const solverOptions: SolverOptions = {
      maxSolutions: options?.maxSolutions ?? 5,
      strategy: options?.strategy ?? 'maxScore',
      optimization: options?.optimization ?? 'balanced',
    };

    const solutions = solve(board, pieces, solverOptions);

    return NextResponse.json({ solutions, count: solutions.length });
  } catch (error) {
    console.error('Solver error:', error);
    return NextResponse.json({ error: 'Internal solver error' }, { status: 500 });
  }
}
