'use client';
import React, { useState, useRef, useCallback } from 'react';
import BoardGrid from '@/components/BoardGrid';
import PieceEditor from '@/components/PieceEditor';
import ImageUpload from '@/components/ImageUpload';
import SolutionDisplay from '@/components/SolutionDisplay';
import type { Board, PieceConfig, Solution, SolverOptions, AnalyzeImageResult } from '@/lib/types';

const EMPTY_BOARD: Board = Array(8).fill(null).map(() => Array(8).fill(0));

const DEFAULT_PIECES: PieceConfig[] = [
  {
    id: 1, name: 'Piece 1',
    grid: [
      [0,0,0,0,0],[0,1,0,0,0],[0,1,0,0,0],[0,1,1,0,0],[0,0,0,0,0],
    ],
  },
  {
    id: 2, name: 'Piece 2',
    grid: [
      [0,0,0,0,0],[0,1,1,1,0],[0,0,1,0,0],[0,0,0,0,0],[0,0,0,0,0],
    ],
  },
  {
    id: 3, name: 'Piece 3',
    grid: [
      [0,0,0,0,0],[0,1,1,0,0],[0,1,1,0,0],[0,0,0,0,0],[0,0,0,0,0],
    ],
  },
];

type Tab = 'image' | 'manual';

export default function Home() {
  const [tab, setTab] = useState<Tab>('image');
  const [board, setBoard] = useState<Board>(EMPTY_BOARD);
  const [pieces, setPieces] = useState<PieceConfig[]>(DEFAULT_PIECES);
  const [options, setOptions] = useState<SolverOptions>({
    maxSolutions: 5,
    strategy: 'maxScore',
    optimization: 'balanced',
  });
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [solving, setSolving] = useState(false);
  const [solved, setSolved] = useState(false);
  const solutionsRef = useRef<HTMLDivElement>(null);

  const handleCellChange = useCallback((row: number, col: number, value: number) => {
    setBoard(prev => {
      const next = prev.map(r => [...r]);
      next[row][col] = value;
      return next;
    });
  }, []);

  const clearBoard = () => {
    setBoard(EMPTY_BOARD);
    setSolved(false);
    setSolutions([]);
  };

  const randomFill = () => {
    setBoard(Array(8).fill(null).map(() =>
      Array(8).fill(0).map(() => (Math.random() > 0.65 ? 1 : 0))
    ));
    setSolved(false);
  };

  const handleImageAnalyzed = (result: AnalyzeImageResult) => {
    setBoard(result.board);
    if (result.pieces.length > 0) {
      const paddedPieces = result.pieces.map((p, i) => {
        const grid = Array(5).fill(null).map((_, r) =>
          Array(5).fill(0).map((_, c) =>
            r < p.grid.length && c < p.grid[r].length ? p.grid[r][c] : 0
          )
        );
        return { ...p, id: i + 1, grid };
      });
      setPieces(paddedPieces);
    }
    setSolved(false);
    // Auto switch to manual to review
    setTab('manual');
  };

  const handleSolve = async () => {
    setSolving(true);
    setSolved(false);
    setSolutions([]);
    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board, pieces, options }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSolutions(data.solutions || []);
      setSolved(true);
      setTimeout(() => {
        solutionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } catch (err) {
      console.error(err);
      setSolutions([]);
      setSolved(true);
    } finally {
      setSolving(false);
    }
  };

  const handleApply = (newBoard: number[][]) => {
    setBoard(newBoard);
    setTab('manual');
    setSolutions([]);
    setSolved(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filledCells = board.flat().filter(Boolean).length;

  return (
    <div className="min-h-screen relative z-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">

        {/* Header */}
        <header className="text-center mb-6 sm:mb-10">
          <h1
            className="neon-text text-3xl sm:text-5xl font-black mb-1 sm:mb-2 tracking-tight"
            style={{ fontFamily: 'Orbitron' }}
          >
            BLOCK BLAST
          </h1>
          <h2
            className="neon-text text-2xl sm:text-4xl font-black mb-2 tracking-tight"
            style={{ fontFamily: 'Orbitron' }}
          >
            SOLVER
          </h2>
          <p className="text-[#a0a8d4] text-xs sm:text-sm uppercase tracking-widest">
            AI-Powered Puzzle Strategy Engine
          </p>
        </header>

        {/* Main grid: stacked on mobile, side-by-side on desktop */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6 mb-6">

          {/* Left: Input */}
          <div className="panel p-4 sm:p-6 space-y-4">
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-widest" style={{ fontFamily: 'Orbitron' }}>
              📥 Input Method
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button className={`tab flex-1 text-xs sm:text-sm ${tab === 'image' ? 'active' : ''}`} onClick={() => setTab('image')}>
                🖼️ Image (AI)
              </button>
              <button className={`tab flex-1 text-xs sm:text-sm ${tab === 'manual' ? 'active' : ''}`} onClick={() => setTab('manual')}>
                ✏️ Manual
              </button>
            </div>

            {tab === 'image' && (
              <ImageUpload onAnalyzed={handleImageAnalyzed} />
            )}

            {tab === 'manual' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-[#a0a8d4]">
                    Grid 8×8 · <span className="text-cyan-400 font-semibold">{filledCells}</span> cells filled
                  </div>
                  <div className="flex gap-2">
                    <button onClick={clearBoard} className="btn-secondary text-xs px-2 py-1">Clear</button>
                    <button onClick={randomFill} className="btn-secondary text-xs px-2 py-1">Random</button>
                  </div>
                </div>

                {/* Hint */}
                <div className="text-xs text-[#5a6080] bg-cyan-400/5 border border-cyan-400/10 rounded-lg px-3 py-2">
                  👆 <strong className="text-[#a0a8d4]">Slide</strong> jari/kursor untuk isi cepat · tap untuk toggle
                </div>

                {/* Board - full width on mobile */}
                <div className="w-full">
                  <BoardGrid
                    board={board}
                    onCellChange={handleCellChange}
                    size="responsive"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: Piece editor + options */}
          <div className="space-y-4">
            {/* Piece Editor */}
            <div className="panel p-4 sm:p-6">
              <div className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-3" style={{ fontFamily: 'Orbitron' }}>
                🎮 Configure Pieces
              </div>
              <PieceEditor pieces={pieces} onChange={setPieces} />
            </div>

            {/* Solver Options */}
            <div className="panel p-4 sm:p-6 space-y-3">
              <div className="text-xs font-semibold text-cyan-400 uppercase tracking-widest" style={{ fontFamily: 'Orbitron' }}>
                ⚙️ Solver Options
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#a0a8d4] uppercase tracking-wider block mb-1">Max Solutions</label>
                  <input
                    type="number" min={1} max={10} value={options.maxSolutions}
                    onChange={e => setOptions(o => ({ ...o, maxSolutions: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-cyan-400/20 text-white text-sm focus:outline-none focus:border-cyan-400/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#a0a8d4] uppercase tracking-wider block mb-1">Strategy</label>
                  <select
                    value={options.strategy}
                    onChange={e => setOptions(o => ({ ...o, strategy: e.target.value as SolverOptions['strategy'] }))}
                    className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-cyan-400/20 text-white text-sm focus:outline-none focus:border-cyan-400/50"
                  >
                    <option value="maxScore">Max Score</option>
                    <option value="maxClears">Max Lines</option>
                    <option value="compact">Compact</option>
                    <option value="balanced">Balanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#a0a8d4] uppercase tracking-wider block mb-1">Optimization</label>
                <div className="flex gap-2">
                  {(['fast', 'balanced', 'thorough'] as const).map(opt => (
                    <button
                      key={opt}
                      onClick={() => setOptions(o => ({ ...o, optimization: opt }))}
                      className={`flex-1 py-2 rounded-lg text-xs border capitalize transition-all ${
                        options.optimization === opt
                          ? 'bg-cyan-400/10 border-cyan-400/50 text-cyan-400'
                          : 'bg-transparent border-white/10 text-[#a0a8d4] hover:border-white/20'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSolve}
                disabled={solving}
                className="btn-primary w-full py-3 text-sm"
              >
                {solving ? '⏳ Solving...' : '🚀 SOLVE PUZZLE'}
              </button>

              <div className="bg-cyan-400/5 border-l-2 border-cyan-400 rounded-r-lg p-3">
                <div className="text-[#a0a8d4] text-xs">
                  🎯 Semua urutan piece dicoba untuk hasil <span className="text-cyan-400 font-semibold">maksimal</span>.
                  Semua piece <span className="text-cyan-400 font-semibold">harus</span> berhasil dipasang.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Solutions */}
        {(solved || solving) && (
          <div ref={solutionsRef}>
            <SolutionDisplay solutions={solutions} loading={solving} onApply={handleApply} />
          </div>
        )}
      </div>
    </div>
  );
}
