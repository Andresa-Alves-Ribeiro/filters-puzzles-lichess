import { PIECE_KEYS, PieceGlyph } from './pieceGlyphs.tsx'

type Cell = {
  piece: string
  light: boolean
}

function expandRank(rank: string): string[] | null {
  const squares: string[] = []
  for (const char of rank) {
    if (char >= '1' && char <= '8') {
      for (let i = 0; i < Number(char); i++) squares.push('')
    } else if (PIECE_KEYS.has(char.toLowerCase())) {
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
              <svg x={x} y={y} width="1" height="1" viewBox="0 0 45 45">
                <PieceGlyph kind={cell.piece.toLowerCase()} white={white} />
              </svg>
            )}
          </g>
        )
      })}
    </svg>
  )
}
