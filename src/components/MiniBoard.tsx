const PATHS: Record<string, string> = {
  k: 'M46 8h8v8h10v8H54v8h18l8 30H20l8-30h18v-8H36v-8h10V8zM18 66h64v8H18z',
  q: 'M18 30l10 8 10-16 12 20 12-20 10 16 10-8-6 36H24zM16 70h68v8H16z',
  r: 'M24 14h10v8h8v-8h16v8h8v-8h10v16H24zm-2 20h56v28H22zm-4 32h64v8H18z',
  b: 'M50 10a9 9 0 1 1 0 18a9 9 0 0 1 0-18M46 28l4 8 4-8c8 6 14 16 10 28H36c-4-12 2-22 10-28zM28 66h44l4 8H24zM22 78h56v7H22z',
  n: 'M66 80H34l3-12c-16-2-24-18-18-32 4-10 14-16 18-28 2 12 10 16 16 16 8 6 14 16 12 28-2 12-10 20-18 24z',
  p: 'M50 16a11 11 0 1 1 0 22a11 11 0 0 1 0-22M36 42h28l8 28H28zM26 74h48v8H26z',
}

type Cell = {
  piece: string
  light: boolean
}

function expandRank(rank: string): string[] | null {
  const squares: string[] = []
  for (const char of rank) {
    if (char >= '1' && char <= '8') {
      for (let i = 0; i < Number(char); i++) squares.push('')
    } else if (PATHS[char.toLowerCase()]) {
      squares.push(char)
    } else {
      return null
    }
  }
  return squares.length === 8 ? squares : null
}

function readBoard(fen: string, flipped: boolean): { cells: Cell[]; side: string } | null {
  const parts = fen.trim().split(/\s+/)
  const ranks = parts[0]?.split('/') ?? []
  if (ranks.length !== 8) return null
  const rows = ranks.map(expandRank)
  if (rows.some((row) => !row)) return null
  const rankOrder = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]
  const fileOrder = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7]
  const cells: Cell[] = []
  for (const rank of rankOrder) {
    const row = rows[8 - rank]
    if (!row) return null
    for (const file of fileOrder) {
      cells.push({ piece: row[file] ?? '', light: (file + rank) % 2 === 0 })
    }
  }
  const side = parts[1] === 'b' ? 'pretas' : 'brancas'
  return { cells, side }
}

type MiniBoardProps = {
  fen?: string
  flipped: boolean
}

export function MiniBoard({ fen, flipped }: MiniBoardProps) {
  const board = fen ? readBoard(fen, flipped) : null
  if (!board) {
    return (
      <div className="mini empty" role="img" aria-label="Posição indisponível. Filtre de novo para carregar o FEN." />
    )
  }

  return (
    <svg className="mini" viewBox="0 0 8 8" role="img" aria-label={`Posição inicial do CSV, vez das ${board.side}`}>
      {board.cells.map((cell, index) => {
        const x = index % 8
        const y = Math.floor(index / 8)
        const white = cell.piece !== '' && cell.piece === cell.piece.toUpperCase()
        return (
          <g key={`${x}-${y}`}>
            <rect x={x} y={y} width="1" height="1" fill={cell.light ? 'var(--sq-l)' : 'var(--sq-d)'} />
            {cell.piece && (
              <svg x={x} y={y} width="1" height="1" viewBox="0 0 100 100">
                <path
                  d={PATHS[cell.piece.toLowerCase()]}
                  fill={white ? 'var(--piece-w)' : 'var(--piece-b)'}
                  stroke={white ? 'var(--piece-b)' : 'var(--piece-w)'}
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </g>
        )
      })}
    </svg>
  )
}
