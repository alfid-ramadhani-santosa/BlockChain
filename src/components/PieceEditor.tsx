'use client';
import React, { useRef, useCallback } from 'react';
import type { PieceConfig } from '@/lib/types';

const PIECE_COLORS = [
  'bg-gradient-to-br from-orange-400 to-yellow-400',
  'bg-gradient-to-br from-pink-400 to-rose-500',
  'bg-gradient-to-br from-green-400 to-emerald-500',
  'bg-gradient-to-br from-blue-400 to-indigo-500',
  'bg-gradient-to-br from-purple-400 to-violet-500',
];

interface PieceEditorProps {
  pieces: PieceConfig[];
  onChange: (pieces: PieceConfig[]) => void;
}

function PieceGrid({
  piece,
  pieceIdx,
  colorClass,
  onChange,
}: {
  piece: PieceConfig;
  pieceIdx: number;
  colorClass: string;
  onChange: (grid: number[][]) => void;
}) {
  const paintModeRef = useRef<number | null>(null);
  const isPaintingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getCellFromPoint = useCallback((clientX: number, clientY: number): [number, number] | null => {
    const container = containerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const cellW = rect.width / 5;
    const cellH = rect.height / 5;
    const col = Math.floor((clientX - rect.left) / cellW);
    const row = Math.floor((clientY - rect.top) / cellH);
    if (row < 0 || row >= 5 || col < 0 || col >= 5) return null;
    return [row, col];
  }, []);

  const paint = useCallback((clientX: number, clientY: number) => {
    if (!isPaintingRef.current || paintModeRef.current === null) return;
    const cell = getCellFromPoint(clientX, clientY);
    if (!cell) return;
    const [row, col] = cell;
    if (piece.grid[row][col] !== paintModeRef.current) {
      const newGrid = piece.grid.map(r => [...r]);
      newGrid[row][col] = paintModeRef.current!;
      onChange(newGrid);
    }
  }, [piece.grid, getCellFromPoint, onChange]);

  const onMouseDown = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    const newValue = piece.grid[row][col] ? 0 : 1;
    paintModeRef.current = newValue;
    isPaintingRef.current = true;
    const newGrid = piece.grid.map(r => [...r]);
    newGrid[row][col] = newValue;
    onChange(newGrid);
  }, [piece.grid, onChange]);

  const onMouseEnter = useCallback((e: React.MouseEvent) => {
    paint(e.clientX, e.clientY);
  }, [paint]);

  const stopPainting = useCallback(() => {
    isPaintingRef.current = false;
    paintModeRef.current = null;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const cell = getCellFromPoint(touch.clientX, touch.clientY);
    if (!cell) return;
    const [row, col] = cell;
    const newValue = piece.grid[row][col] ? 0 : 1;
    paintModeRef.current = newValue;
    isPaintingRef.current = true;
    const newGrid = piece.grid.map(r => [...r]);
    newGrid[row][col] = newValue;
    onChange(newGrid);
  }, [piece.grid, getCellFromPoint, onChange]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    paint(e.touches[0].clientX, e.touches[0].clientY);
  }, [paint]);

  const count = piece.grid.flat().filter(Boolean).length;

  return (
    <div
      ref={containerRef}
      className="select-none touch-none w-full"
      style={{ cursor: 'crosshair', aspectRatio: '1' }}
      onMouseLeave={stopPainting}
      onMouseUp={stopPainting}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={stopPainting}
    >
      <div className="grid w-full h-full" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '2px' }}>
        {piece.grid.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              onMouseDown={(e) => onMouseDown(e, r, c)}
              onMouseEnter={onMouseEnter}
              className={`
                aspect-square rounded-[3px] border transition-all duration-75
                ${cell
                  ? `${colorClass} border-orange-400/40 shadow-sm`
                  : 'bg-[#1a1f3a] border-[#2a2f4a] hover:border-orange-400/20'
                }
              `}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function PieceEditor({ pieces, onChange }: PieceEditorProps) {
  const addPiece = () => {
    if (pieces.length >= 5) return;
    onChange([...pieces, {
      id: Date.now(),
      name: `Piece ${pieces.length + 1}`,
      grid: Array(5).fill(null).map(() => Array(5).fill(0)),
    }]);
  };

  const removePiece = (idx: number) => onChange(pieces.filter((_, i) => i !== idx));

  const clearPiece = (idx: number) => {
    const updated = [...pieces];
    updated[idx] = { ...updated[idx], grid: Array(5).fill(null).map(() => Array(5).fill(0)) };
    onChange(updated);
  };

  const updateGrid = (idx: number, grid: number[][]) => {
    const updated = pieces.map((p, i) => i === idx ? { ...p, grid } : p);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#a0a8d4] uppercase tracking-wider">
          Pieces ({pieces.length}/5)
        </span>
        {pieces.length < 5 && (
          <button onClick={addPiece} className="btn-secondary text-xs px-2 py-1">+ Add</button>
        )}
      </div>

      {/* Pieces in a responsive row — side by side on mobile */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {pieces.map((piece, pieceIdx) => {
          const colorClass = PIECE_COLORS[pieceIdx % PIECE_COLORS.length];
          const count = piece.grid.flat().filter(Boolean).length;

          return (
            <div key={piece.id} className="panel p-2 sm:p-3 border border-orange-400/10 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${colorClass}`} />
                  <span className="text-xs font-medium text-white">P{pieceIdx + 1}</span>
                  <span className="text-xs text-[#5a6080]">({count})</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => clearPiece(pieceIdx)} className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 text-[#a0a8d4] hover:border-cyan-400/30 transition-all">✕</button>
                  {pieces.length > 1 && (
                    <button onClick={() => removePiece(pieceIdx)} className="text-[10px] px-1.5 py-0.5 rounded border border-red-400/20 text-red-400 hover:bg-red-400/10 transition-all">🗑</button>
                  )}
                </div>
              </div>

              <PieceGrid
                piece={piece}
                pieceIdx={pieceIdx}
                colorClass={colorClass}
                onChange={(grid) => updateGrid(pieceIdx, grid)}
              />

              <p className="text-[10px] text-[#5a6080] mt-1.5 text-center">slide to draw</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
