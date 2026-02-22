'use client';
import React, { useRef, useCallback, useEffect } from 'react';
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
  colorClass,
  onChange,
}: {
  piece: PieceConfig;
  colorClass: string;
  onChange: (grid: number[][]) => void;
}) {
  const paintModeRef = useRef<number | null>(null);
  const isPaintingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef(piece.grid);
  gridRef.current = piece.grid;

  const getCellFromPoint = useCallback((clientX: number, clientY: number): [number, number] | null => {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const col = Math.floor(((clientX - rect.left) / rect.width) * 5);
    const row = Math.floor(((clientY - rect.top) / rect.height) * 5);
    if (row < 0 || row >= 5 || col < 0 || col >= 5) return null;
    return [row, col];
  }, []);

  const paintCell = useCallback((clientX: number, clientY: number) => {
    if (!isPaintingRef.current || paintModeRef.current === null) return;
    const cell = getCellFromPoint(clientX, clientY);
    if (!cell) return;
    const [row, col] = cell;
    if (gridRef.current[row][col] !== paintModeRef.current) {
      const newGrid = gridRef.current.map(r => [...r]);
      newGrid[row][col] = paintModeRef.current!;
      onChange(newGrid);
    }
  }, [getCellFromPoint, onChange]);

  // Mouse
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (Date.now() - lastTouchTimeRef.current < 500) return;
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    const [row, col] = cell;
    const newValue = gridRef.current[row][col] ? 0 : 1;
    paintModeRef.current = newValue;
    isPaintingRef.current = true;
    const newGrid = gridRef.current.map(r => [...r]);
    newGrid[row][col] = newValue;
    onChange(newGrid);
  }, [getCellFromPoint, onChange]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (Date.now() - lastTouchTimeRef.current < 500) return;
    paintCell(e.clientX, e.clientY);
  }, [paintCell]);

  const stopPainting = useCallback(() => {
    isPaintingRef.current = false;
    paintModeRef.current = null;
  }, []);

  // Touch — ALL non-passive to suppress Chrome simulated mouse events
  const lastTouchTimeRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // suppress scroll + simulated mouse events
      lastTouchTimeRef.current = Date.now();
      const touch = e.touches[0];
      const cell = getCellFromPoint(touch.clientX, touch.clientY);
      if (!cell) return;
      const [row, col] = cell;
      const newValue = gridRef.current[row][col] ? 0 : 1;
      paintModeRef.current = newValue;
      isPaintingRef.current = true;
      const newGrid = gridRef.current.map(r => [...r]);
      newGrid[row][col] = newValue;
      onChange(newGrid);
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      lastTouchTimeRef.current = Date.now();
      paintCell(e.touches[0].clientX, e.touches[0].clientY);
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      lastTouchTimeRef.current = Date.now();
      isPaintingRef.current = false;
      paintModeRef.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [getCellFromPoint, onChange, paintCell]);

  return (
    <div
      ref={containerRef}
      className="select-none w-full"
      style={{ cursor: 'crosshair', touchAction: 'none', aspectRatio: '1' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={stopPainting}
      onMouseLeave={stopPainting}
    >
      <div className="grid w-full h-full" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '2px' }}>
        {piece.grid.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={`
                aspect-square rounded-[3px] border transition-colors duration-75
                ${cell
                  ? `${colorClass} border-orange-400/40 shadow-sm`
                  : 'bg-[#1a1f3a] border-[#2a2f4a]'
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
    onChange(pieces.map((p, i) => i === idx ? { ...p, grid } : p));
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

      {/* Mobile: 1 column (vertical). sm+: 2 col. lg+: 3 col */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {pieces.map((piece, pieceIdx) => {
          const colorClass = PIECE_COLORS[pieceIdx % PIECE_COLORS.length];
          const count = piece.grid.flat().filter(Boolean).length;

          return (
            <div key={piece.id} className="panel p-3 border border-orange-400/10 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${colorClass}`} />
                  <span className="text-xs font-medium text-white">Piece {pieceIdx + 1}</span>
                  <span className="text-xs text-[#5a6080]">({count} cells)</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => clearPiece(pieceIdx)}
                    className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 text-[#a0a8d4] hover:border-cyan-400/30 transition-all"
                  >
                    Clear
                  </button>
                  {pieces.length > 1 && (
                    <button
                      onClick={() => removePiece(pieceIdx)}
                      className="text-[10px] px-1.5 py-0.5 rounded border border-red-400/20 text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* On mobile: show grid beside the piece to save height */}
              <div className="flex sm:block gap-3 items-start">
                <div className="w-28 sm:w-full flex-shrink-0">
                  <PieceGrid
                    piece={piece}
                    colorClass={colorClass}
                    onChange={(grid) => updateGrid(pieceIdx, grid)}
                  />
                </div>
                <p className="text-[10px] text-[#5a6080] mt-1 sm:text-center">
                  Slide jari untuk menggambar bentuk
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
