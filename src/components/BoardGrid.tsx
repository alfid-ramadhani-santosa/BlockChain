'use client';
import React, { useCallback, useRef, useEffect } from 'react';
import type { Board } from '@/lib/types';

interface BoardGridProps {
  board: Board;
  onCellChange?: (row: number, col: number, value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'responsive';
}

const COLOR_MAP: Record<number, string> = {
  0: '',
  1: 'bg-gradient-to-br from-violet-400 to-purple-500',
  2: 'bg-gradient-to-br from-orange-500 to-orange-400',
  3: 'bg-gradient-to-br from-pink-400 to-rose-500',
  4: 'bg-gradient-to-br from-green-400 to-emerald-500',
  5: 'bg-gradient-to-br from-yellow-400 to-amber-400',
  6: 'bg-gradient-to-br from-blue-400 to-indigo-500',
};

export default function BoardGrid({ board, onCellChange, readonly = false }: BoardGridProps) {
  const paintModeRef = useRef<number | null>(null);
  const isPaintingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep a ref to board so touch handlers always have fresh data
  const boardRef = useRef(board);
  boardRef.current = board;

  const getCellFromPoint = useCallback((clientX: number, clientY: number): [number, number] | null => {
    const container = containerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const col = Math.floor(((clientX - rect.left) / rect.width) * 8);
    const row = Math.floor(((clientY - rect.top) / rect.height) * 8);
    if (row < 0 || row >= 8 || col < 0 || col >= 8) return null;
    return [row, col];
  }, []);

  const paintCell = useCallback((clientX: number, clientY: number) => {
    if (!isPaintingRef.current || paintModeRef.current === null) return;
    const cell = getCellFromPoint(clientX, clientY);
    if (!cell) return;
    const [row, col] = cell;
    if (boardRef.current[row][col] !== paintModeRef.current) {
      onCellChange?.(row, col, paintModeRef.current);
    }
  }, [getCellFromPoint, onCellChange]);

  // ── Mouse events (desktop) ─────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (readonly) return;
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    const [row, col] = cell;
    const newValue = boardRef.current[row][col] ? 0 : 1;
    paintModeRef.current = newValue;
    isPaintingRef.current = true;
    onCellChange?.(row, col, newValue);
  }, [getCellFromPoint, onCellChange, readonly]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    paintCell(e.clientX, e.clientY);
  }, [paintCell]);

  const stopPainting = useCallback(() => {
    isPaintingRef.current = false;
    paintModeRef.current = null;
  }, []);

  // ── Touch events — registered imperatively with passive:false ──────────
  // This is the fix for Chrome mobile: React's synthetic onTouchMove is passive
  // by default in modern browsers, so e.preventDefault() is ignored and the page
  // scroll interrupts the gesture. We add the listener manually with passive:false.
  useEffect(() => {
    if (readonly) return;
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const cell = getCellFromPoint(touch.clientX, touch.clientY);
      if (!cell) return;
      const [row, col] = cell;
      const newValue = boardRef.current[row][col] ? 0 : 1;
      paintModeRef.current = newValue;
      isPaintingRef.current = true;
      onCellChange?.(row, col, newValue);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // ← works because listener is non-passive
      const touch = e.touches[0];
      paintCell(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
      isPaintingRef.current = false;
      paintModeRef.current = null;
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false }); // KEY FIX
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [getCellFromPoint, onCellChange, paintCell, readonly]);

  return (
    <div
      ref={containerRef}
      className="select-none w-full"
      style={{ cursor: readonly ? 'default' : 'crosshair', touchAction: 'none' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={stopPainting}
      onMouseLeave={stopPainting}
    >
      <div
        className="grid w-full"
        style={{ gridTemplateColumns: 'repeat(8, 1fr)', gap: '2px' }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const colorClass = cell ? (COLOR_MAP[cell] || COLOR_MAP[1]) : '';
            return (
              <div
                key={`${r}-${c}`}
                className={`
                  aspect-square rounded-[4px] border transition-colors duration-75
                  ${cell
                    ? `${colorClass} border-white/20 shadow-sm`
                    : 'bg-[#2a2f4a] border-cyan-400/10'
                  }
                `}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
