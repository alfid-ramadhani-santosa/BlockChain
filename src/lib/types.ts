export type Board = number[][];
export type Piece = number[][];

export interface PieceConfig {
  id: number;
  grid: Piece; // 5x5 grid
  name?: string;
  color?: string;
}

export interface SolverOptions {
  maxSolutions: number;
  strategy: 'maxScore' | 'maxClears' | 'compact' | 'balanced';
  optimization: 'fast' | 'balanced' | 'thorough';
}

export interface PlacementStep {
  stepNum: number;
  pieceId: number;
  pieceGrid: Piece;
  position: { row: number; col: number };
  boardAfter: Board;           // board AFTER placing piece + AFTER clearing lines
  boardBeforeClear: Board;     // board AFTER placing piece, BEFORE clearing (shows cleared cells)
  clearedRows: number[];       // which rows were cleared
  clearedCols: number[];       // which cols were cleared
  linesCleared: number;
  stepScore: number;
  pieceValue: number;          // board value for this piece (pieceId + 2)
}

export interface Solution {
  id: number;
  totalScore: number;
  totalLinesCleared: number;
  steps: PlacementStep[];
  efficiency: number;
  pieceOrder: number[];        // order pieces were placed (for display)
}

export interface AnalyzeImageResult {
  board: Board;
  pieces: PieceConfig[];
  confidence: number;
  rawDescription?: string;
}
