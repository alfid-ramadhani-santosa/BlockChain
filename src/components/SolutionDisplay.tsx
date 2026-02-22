'use client';
import React, { useState } from 'react';
import type { Solution, PlacementStep } from '@/lib/types';

const PIECE_COLORS: Record<number, string> = {
  2: '#f97316', // piece 0 - orange
  3: '#ec4899', // piece 1 - pink
  4: '#22c55e', // piece 2 - green
  5: '#eab308', // piece 3 - yellow
  6: '#8b5cf6', // piece 4 - purple
};

interface StepGridProps {
  step: PlacementStep;
  size?: number;
}

function StepGrid({ step, size = 32 }: StepGridProps) {
  const { boardBeforeClear, boardAfter, clearedRows, clearedCols, newPieceValue: _npv, pieceValue } = step as PlacementStep & { newPieceValue?: number };

  // Use boardBeforeClear so cleared cells still visible, then overlay border on cleared lines
  const displayBoard = boardBeforeClear;
  const clearedRowSet = new Set(clearedRows);
  const clearedColSet = new Set(clearedCols);

  const isCleared = (r: number, c: number) => clearedRowSet.has(r) || clearedColSet.has(c);
  const isNew = (r: number, c: number) => displayBoard[r][c] === pieceValue;

  // Outer border logic for new piece
  const borderSide = (r: number, c: number, dir: 'top'|'right'|'bottom'|'left') => {
    if (!isNew(r, c)) return '2px solid transparent';
    const [nr, nc] = dir === 'top' ? [r-1,c] : dir === 'bottom' ? [r+1,c] : dir === 'left' ? [r,c-1] : [r,c+1];
    if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8 || displayBoard[nr][nc] !== pieceValue)
      return '2.5px solid #1e293b';
    return '2px solid transparent';
  };

  const pieceColor = PIECE_COLORS[pieceValue] || '#f97316';

  return (
    <div className="inline-grid" style={{ gridTemplateColumns: `repeat(8, ${size}px)`, gap: '2px' }}>
      {displayBoard.map((row, r) =>
        row.map((cell, c) => {
          const cleared = isCleared(r, c);
          const newCell = isNew(r, c);
          const existing = cell === 1 && !cleared;
          const otherPiece = cell > 1 && !newCell && !cleared;

          let bg = '#dde4f5'; // empty
          if (newCell) bg = pieceColor;
          else if (existing) bg = '#818cf8';
          else if (otherPiece) bg = PIECE_COLORS[cell] || '#a5b4fc';
          else if (cleared && cell !== 0) {
            // cleared cell: show ghost with colored border
            bg = 'transparent';
          }

          return (
            <div
              key={`${r}-${c}`}
              style={{
                width: size,
                height: size,
                backgroundColor: bg,
                borderRadius: 5,
                boxSizing: 'border-box',
                position: 'relative',
                // New piece outer border
                borderTop: borderSide(r, c, 'top'),
                borderRight: borderSide(r, c, 'right'),
                borderBottom: borderSide(r, c, 'bottom'),
                borderLeft: borderSide(r, c, 'left'),
                // Cleared line: dashed outline
                outline: cleared && cell !== 0 ? '2.5px dashed #f97316' : undefined,
                outlineOffset: '-2px',
                boxShadow: newCell ? `0 2px 8px ${pieceColor}80` : undefined,
                opacity: cleared && cell === 0 ? 0.15 : 1,
                transition: 'all 0.2s',
              }}
            />
          );
        })
      )}
    </div>
  );
}

interface SolutionCardProps {
  solution: Solution;
  index: number;
  onApply: (board: number[][]) => void;
}

function SolutionCard({ solution, index, onApply }: SolutionCardProps) {
  const [expanded, setExpanded] = useState(index === 0);
  const [applied, setApplied] = useState(false);
  const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    const lastStep = solution.steps[solution.steps.length - 1];
    const finalBoard = lastStep.boardAfter.map(row => row.map(cell => cell ? 1 : 0));
    onApply(finalBoard);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        animation: `slideUp 0.4s ease-out ${index * 0.08}s both`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 cursor-pointer select-none"
        style={{ borderBottom: expanded ? '1px solid #f1f5f9' : 'none' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{medal}</span>
          <div>
            <div className="font-bold text-slate-800 text-lg" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Solution #{solution.id}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {solution.steps.length} pieces placed
              {solution.pieceOrder && (
                <span className="ml-2 text-indigo-400">
                  order: {solution.pieceOrder.map(i => `P${i+1}`).join('→')}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xl font-bold text-indigo-600" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {solution.totalScore.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400">Score</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-orange-500" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {solution.totalLinesCleared}
            </div>
            <div className="text-xs text-slate-400">Lines</div>
          </div>
          <button
            onClick={handleApply}
            style={{
              background: applied ? '#22c55e' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.5px',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              boxShadow: applied ? '0 2px 8px rgba(34,197,94,0.4)' : '0 2px 8px rgba(99,102,241,0.3)',
            }}
          >
            {applied ? '✅ Diterapkan!' : '⚡ Terapkan'}
          </button>
          <div className={`text-slate-400 text-lg transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
            ▾
          </div>
        </div>
      </div>

      {/* Steps */}
      {expanded && (
        <div className="px-6 py-5" style={{ background: '#f8fafc' }}>
          <h3 className="text-center font-bold text-slate-700 text-base mb-5">
            Placement Steps
          </h3>

          {/* Legend */}
          <div className="flex gap-4 justify-center mb-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded" style={{ background: '#818cf8' }} />
              <span>Existing</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded" style={{ background: '#f97316' }} />
              <span>New piece</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded border-2 border-dashed border-orange-400" style={{ background: 'transparent' }} />
              <span>Cleared line</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 overflow-x-auto pb-2">
            {solution.steps.map((step, si) => (
              <div
                key={si}
                className="flex-shrink-0 rounded-xl px-4 py-4 text-center"
                style={{
                  background: '#ffffff',
                  border: step.linesCleared > 0 ? '2px solid #f97316' : '1px solid #e2e8f0',
                  boxShadow: step.linesCleared > 0
                    ? '0 2px 16px rgba(249,115,22,0.2)'
                    : '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <div className="font-bold text-slate-700 text-sm mb-0.5">
                  Step {step.stepNum}: Piece {step.pieceId + 1}
                </div>
                <div className="text-xs mb-3" style={{ color: step.linesCleared > 0 ? '#f97316' : '#94a3b8' }}>
                  Completed lines: {step.linesCleared}
                  {step.linesCleared > 0 && ' 🎉'}
                </div>
                <StepGrid step={step} size={30} />
                <div className="text-xs text-slate-400 mt-2">
                  Row {step.position.row + 1}, Col {step.position.col + 1}
                  {step.linesCleared > 0 && (
                    <span className="text-orange-500 font-semibold ml-1">
                      +{step.linesCleared} line{step.linesCleared > 1 ? 's' : ''}!
                    </span>
                  )}
                </div>
                {/* Show cleared rows/cols info */}
                {(step.clearedRows.length > 0 || step.clearedCols.length > 0) && (
                  <div className="text-xs mt-1" style={{ color: '#f97316' }}>
                    {step.clearedRows.length > 0 && `Row ${step.clearedRows.map(r => r+1).join(',')} `}
                    {step.clearedCols.length > 0 && `Col ${step.clearedCols.map(c => c+1).join(',')}`}
                    {' cleared'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface SolutionDisplayProps {
  solutions: Solution[];
  loading: boolean;
  onApply: (board: number[][]) => void;
}

export default function SolutionDisplay({ solutions, loading, onApply }: SolutionDisplayProps) {
  if (loading) {
    return (
      <div className="rounded-2xl p-10 text-center"
        style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
        <div className="text-slate-700 font-semibold text-lg animate-pulse">Solving puzzle...</div>
        <div className="text-slate-400 text-sm mt-1">Trying all piece orderings for maximum score</div>
      </div>
    );
  }

  if (solutions.length === 0) {
    return (
      <div className="rounded-2xl p-10 text-center"
        style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div className="text-5xl mb-4">🚫</div>
        <div className="text-slate-800 font-bold text-xl mb-2">No Valid Solution Found</div>
        <div className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
          A valid solution requires{' '}
          <span className="text-indigo-600 font-semibold">all pieces to be placed</span> on the board.
        </div>
        <div className="mt-5 rounded-xl p-4 text-xs text-left max-w-sm mx-auto"
          style={{ background: '#fefce8', border: '1px solid #fde047' }}>
          <div className="font-semibold text-slate-700 mb-1">💡 Tips:</div>
          <div className="text-slate-500">
            <div>• Clear some cells to make room</div>
            <div>• Verify piece shapes are correct</div>
            <div>• Try <strong>Thorough</strong> optimization mode</div>
          </div>
        </div>
      </div>
    );
  }

  const maxLines = Math.max(...solutions.map(s => s.totalLinesCleared));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✨</span>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {solutions.length} Solution{solutions.length !== 1 ? 's' : ''} Found
          </h2>
        </div>
        <div className="text-sm text-cyan-400">
          Best: <span className="font-bold">{maxLines} line{maxLines !== 1 ? 's' : ''} cleared</span>
        </div>
      </div>
      {solutions.map((solution, i) => (
        <SolutionCard key={solution.id} solution={solution} index={i} onApply={onApply} />
      ))}
    </div>
  );
}
