import type { Board, Piece, PieceConfig, Solution, PlacementStep, SolverOptions } from './types';

// Trim piece to minimal bounding box
export function trimPiece(grid: Piece): Piece {
  let minRow = grid.length, maxRow = -1, minCol = grid[0].length, maxCol = -1;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c]) {
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
      }
    }
  }
  if (maxRow === -1) return [];
  const trimmed: Piece = [];
  for (let r = minRow; r <= maxRow; r++) {
    trimmed.push(grid[r].slice(minCol, maxCol + 1));
  }
  return trimmed;
}

// Check if piece can be placed at position
function canPlace(board: Board, piece: Piece, row: number, col: number): boolean {
  for (let r = 0; r < piece.length; r++) {
    for (let c = 0; c < piece[r].length; c++) {
      if (piece[r][c]) {
        const br = row + r;
        const bc = col + c;
        if (br < 0 || br >= 8 || bc < 0 || bc >= 8) return false;
        if (board[br][bc]) return false;
      }
    }
  }
  return true;
}

// board=1, piece0=2, piece1=3, piece2=4...
const PIECE_VALUE_OFFSET = 2;

// Place piece on board, return new board
function placePiece(board: Board, piece: Piece, row: number, col: number, pieceId: number): Board {
  const newBoard = board.map(r => [...r]);
  for (let r = 0; r < piece.length; r++) {
    for (let c = 0; c < piece[r].length; c++) {
      if (piece[r][c]) {
        newBoard[row + r][col + c] = pieceId + PIECE_VALUE_OFFSET;
      }
    }
  }
  return newBoard;
}

// Clear completed rows and columns
// Returns: newBoard (cleared), clearedRows, clearedCols
function clearLines(board: Board): {
  newBoard: Board;
  clearedRows: number[];
  clearedCols: number[];
} {
  const newBoard = board.map(r => [...r]);

  const clearedRows: number[] = [];
  for (let r = 0; r < 8; r++) {
    if (newBoard[r].every(cell => cell !== 0)) clearedRows.push(r);
  }

  const clearedCols: number[] = [];
  for (let c = 0; c < 8; c++) {
    if (newBoard.every(row => row[c] !== 0)) clearedCols.push(c);
  }

  for (const r of clearedRows) {
    for (let c = 0; c < 8; c++) newBoard[r][c] = 0;
  }
  for (const c of clearedCols) {
    for (let r = 0; r < 8; r++) newBoard[r][c] = 0;
  }

  return { newBoard, clearedRows, clearedCols };
}

// Score a board state
function scoreBoard(board: Board, linesCleared: number): number {
  // Line clears are weighted VERY heavily — this is what gives points in the game
  let score = linesCleared * 2000;

  let emptyCells = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (!board[r][c]) emptyCells++;
    }
  }
  score += emptyCells * 10;

  // Reward rows/cols that are close to complete (one step away)
  for (let r = 0; r < 8; r++) {
    const filled = board[r].filter(Boolean).length;
    if (filled >= 6) score += (filled - 5) * 50;
  }
  for (let c = 0; c < 8; c++) {
    const filled = board.map(row => row[c]).filter(Boolean).length;
    if (filled >= 6) score += (filled - 5) * 50;
  }

  return score;
}

// Generate all permutations of an array
function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

export function solve(
  initialBoard: Board,
  pieces: PieceConfig[],
  options: SolverOptions
): Solution[] {
  const trimmedPieces = pieces
    .map(p => ({ ...p, grid: trimPiece(p.grid) }))
    .filter(p => p.grid.length > 0);

  if (trimmedPieces.length === 0) return [];

  const allSolutions: Solution[] = [];
  const maxSolutions = options.maxSolutions;

  // Try ALL permutations of piece order — this is how we find more line clears
  const pieceIndices = trimmedPieces.map((_, i) => i);
  const allPerms = permutations(pieceIndices);

  function dfs(
    board: Board,
    steps: PlacementStep[],
    remaining: number[],
    totalScore: number,
    totalLinesCleared: number
  ) {
    if (remaining.length === 0) {
      if (steps.length === trimmedPieces.length) {
        allSolutions.push({
          id: allSolutions.length + 1,
          totalScore,
          totalLinesCleared,
          steps: [...steps],
          efficiency: totalScore / Math.max(steps.length, 1),
          pieceOrder: steps.map(s => s.pieceId),
        });
      }
      return;
    }

    // Stop collecting once we have plenty of raw candidates
    if (allSolutions.length >= maxSolutions * 30) return;

    const pieceIdx = remaining[0];
    const piece = trimmedPieces[pieceIdx];

    if (!piece || !piece.grid || piece.grid.length === 0) return;

    const candidates: Array<{
      row: number; col: number; score: number;
      board: Board; boardBeforeClear: Board;
      lines: number; clearedRows: number[]; clearedCols: number[];
    }> = [];

    for (let r = 0; r <= 8 - piece.grid.length; r++) {
      for (let c = 0; c <= 8 - (piece.grid[0]?.length ?? 1); c++) {
        if (canPlace(board, piece.grid, r, c)) {
          const boardWithPiece = placePiece(board, piece.grid, r, c, pieceIdx);
          const { newBoard: clearedBoard, clearedRows, clearedCols } = clearLines(boardWithPiece);
          const linesCleared = clearedRows.length + clearedCols.length;
          const score = scoreBoard(clearedBoard, linesCleared);
          candidates.push({
            row: r, col: c, score,
            board: clearedBoard,
            boardBeforeClear: boardWithPiece,
            lines: linesCleared,
            clearedRows,
            clearedCols,
          });
        }
      }
    }

    if (candidates.length === 0) return;

    candidates.sort((a, b) => b.score - a.score);

    const limit = options.optimization === 'fast' ? 8
      : options.optimization === 'balanced' ? 20
      : candidates.length;

    for (const cand of candidates.slice(0, limit)) {
      if (allSolutions.length >= maxSolutions * 30) break;

      const step: PlacementStep = {
        stepNum: steps.length + 1,
        pieceId: pieceIdx,
        pieceGrid: piece.grid,
        position: { row: cand.row, col: cand.col },
        boardAfter: cand.board,
        boardBeforeClear: cand.boardBeforeClear,
        clearedRows: cand.clearedRows,
        clearedCols: cand.clearedCols,
        linesCleared: cand.lines,
        stepScore: cand.score,
        pieceValue: pieceIdx + PIECE_VALUE_OFFSET,
      };

      dfs(cand.board, [...steps, step], remaining.slice(1),
        totalScore + cand.score, totalLinesCleared + cand.lines);
    }
  }

  // Run DFS for EVERY permutation of piece order
  for (const perm of allPerms) {
    if (allSolutions.length >= maxSolutions * 30) break;
    dfs(initialBoard, [], perm, 0, 0);
  }

  // Deduplicate: same total score + same lines = likely same solution
  const seen = new Set<string>();
  const unique = allSolutions.filter(s => {
    const key = `${s.totalLinesCleared}-${s.totalScore}-${s.steps.map(st => `${st.pieceId}@${st.position.row},${st.position.col}`).join('|')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by strategy
  unique.sort((a, b) => {
    if (options.strategy === 'maxClears') {
      if (b.totalLinesCleared !== a.totalLinesCleared) return b.totalLinesCleared - a.totalLinesCleared;
      return b.totalScore - a.totalScore;
    }
    if (options.strategy === 'compact') return a.totalScore - b.totalScore;
    if (options.strategy === 'maxScore') return b.totalScore - a.totalScore;
    // balanced: weight lines heavily
    return (b.totalLinesCleared * 3000 + b.totalScore) - (a.totalLinesCleared * 3000 + a.totalScore);
  });

  return unique.slice(0, maxSolutions).map((s, i) => ({ ...s, id: i + 1 }));
}
