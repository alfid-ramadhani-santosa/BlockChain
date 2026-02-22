'use client';
import React, { useCallback, useRef, useState } from 'react';
import type { Board } from '@/lib/types';

interface BoardGridProps {
  board: Board;
  onCellChange?: (row: number, col: number, value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'responsive';
}

const SIZE_MAP = { sm: 20, md: 28, lg: 36, responsive: 36 };

// value 1 = existing board, 2+ = placed pieces
const COLOR_MAP: Record<number, string> = {
  0: '',
  1: 'bg-gradient-to-br from-violet-400 to-purple-500',
  2: 'bg-gradient-to-br from-orange-500 to-orange-400',
  3: 'bg-gradient-to-br from-pink-400 to-rose-500',
  4: 'bg-gradient-to-br from-green-400 to-emerald-500',
  5: 'bg-gradient-to-br from-yellow-400 to-amber-400',
  6: 'bg-gradient-to-br from-blue-400 to-indigo-500',
};

export default function BoardGrid({
  board,
  onCellChange,
  readonly = false,
  size = 'responsive',
}: BoardGridProps) {
  // paintMode: 1 = drawing filled, 0 = erasing
  const paintModeRef = useRef<number | null>(null);
  const isPaintingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getCellFromPoint = useCallback((clientX: number, clientY: number): [number, number] | null => {
    const container = containerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    // Each cell occupies (cellSize + gap) pixels
    const totalCols = 8;
    const totalRows = 8;
    const cellW = rect.width / totalCols;
    const cellH = rect.height / totalRows;
    const col = Math.floor(x / cellW);
    const row = Math.floor(y / cellH);
    if (row < 0 || row >= 8 || col < 0 || col >= 8) return null;
    return [row, col];
  }, []);

  const paint = useCallback((clientX: number, clientY: number) => {
    if (!isPaintingRef.current || readonly || paintModeRef.current === null) return;
    const cell = getCellFromPoint(clientX, clientY);
    if (!cell) return;
    const [row, col] = cell;
    // Only change if different from current paint mode
    if (board[row][col] !== paintModeRef.current) {
      onCellChange?.(row, col, paintModeRef.current);
    }
  }, [board, getCellFromPoint, onCellChange, readonly]);

  // Mouse events
  const onMouseDown = useCallback((e: React.MouseEvent, row: number, col: number) => {
    if (readonly) return;
    e.preventDefault();
    const newValue = board[row][col] ? 0 : 1;
    paintModeRef.current = newValue;
    isPaintingRef.current = true;
    onCellChange?.(row, col, newValue);
  }, [board, onCellChange, readonly]);

  const onMouseEnter = useCallback((e: React.MouseEvent) => {
    paint(e.clientX, e.clientY);
  }, [paint]);

  const onMouseUp = useCallback(() => {
    isPaintingRef.current = false;
    paintModeRef.current = null;
  }, []);

  // Touch events on container
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (readonly) return;
    const touch = e.touches[0];
    const cell = getCellFromPoint(touch.clientX, touch.clientY);
    if (!cell) return;
    const [row, col] = cell;
    const newValue = board[row][col] ? 0 : 1;
    paintModeRef.current = newValue;
    isPaintingRef.current = true;
    onCellChange?.(row, col, newValue);
  }, [board, getCellFromPoint, onCellChange, readonly]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); // prevent scroll while painting
    const touch = e.touches[0];
    paint(touch.clientX, touch.clientY);
  }, [paint]);

  const onTouchEnd = useCallback(() => {
    isPaintingRef.current = false;
    paintModeRef.current = null;
  }, []);

  return (
    <div
      ref={containerRef}
      className="select-none touch-none w-full"
      onMouseLeave={onMouseUp}
      onMouseUp={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ cursor: readonly ? 'default' : 'crosshair' }}
    >
      <div
        className="grid w-full"
        style={{ gridTemplateColumns: 'repeat(8, 1fr)', gap: '2px' }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const colorClass = cell
              ? (COLOR_MAP[cell] || 'bg-gradient-to-br from-violet-400 to-purple-500')
              : '';
            return (
              <div
                key={`${r}-${c}`}
                onMouseDown={(e) => onMouseDown(e, r, c)}
                onMouseEnter={onMouseEnter}
                className={`
                  aspect-square rounded-[4px] border transition-all duration-75
                  ${cell
                    ? `${colorClass} border-white/20 shadow-sm`
                    : 'bg-[#2a2f4a] border-cyan-400/10'
                  }
                  ${!readonly ? 'hover:brightness-110' : ''}
                `}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
