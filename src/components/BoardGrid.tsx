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
  const boardRef = useRef(board);
  boardRef.current = board;

  // Track last touch time to suppress Chrome's simulated mouse events
  const lastTouchTimeRef = useRef(0);
  const TOUCH_MOUSE_DELAY = 500; // ms — ignore mouse events within this window after touch

  const getCellFromPoint = useCallback((clientX: number, clientY: number): [number, number] | null => {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
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

  // ── Mouse events (desktop only — ignored if recently touched) ───────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (readonly) return;
    // Suppress simulated mouse events from touch
    if (Date.now() - lastTouchTimeRef.current < TOUCH_MOUSE_DELAY) return;
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    const [row, col] = cell;
    const newValue = boardRef.current[row][col] ? 0 : 1;
    paintModeRef.current = newValue;
    isPaintingRef.current = true;
    onCellChange?.(row, col, newValue);
  }, [getCellFromPoint, onCellChange, readonly]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (Date.now() - lastTouchTimeRef.current < TOUCH_MOUSE_DELAY) return;
    paintCell(e.clientX, e.clientY);
  }, [paintCell]);

  const stopMouse = useCallback(() => {
    isPaintingRef.current = false;
    paintModeRef.current = null;
  }, []);

  // ── Touch events — non-passive so preventDefault() actually works ────────
  useEffect(() => {
    if (readonly) return;
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // prevent BOTH scroll AND simulated mouse events
      lastTouchTimeRef.current = Date.now();
      const touch = e.touches[0];
      const cell = getCellFromPoint(touch.clientX, touch.clientY);
      if (!cell) return;
      const [row, col] = cell;
      const newValue = boardRef.current[row][col] ? 0 : 1;
      paintModeRef.current = newValue;
      isPaintingRef.current = true;
      onCellChange?.(row, col, newValue);
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

    // ALL touch listeners non-passive to fully suppress mouse simulation
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [getCellFromPoint, onCellChange, paintCell, readonly]);

  return (
    <div
      ref={containerRef}
      className="select-none w-full"
      style={{ cursor: readonly ? 'default' : 'crosshair', touchAction: 'none' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={stopMouse}
      onMouseLeave={stopMouse}
    >
      <div className="grid w-full" style={{ gridTemplateColumns: 'repeat(8, 1fr)', gap: '2px' }}>
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
