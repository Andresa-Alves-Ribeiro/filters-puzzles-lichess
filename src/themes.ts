export const TRAINING_URL = 'https://lichess.org/training/'

export type Theme = {
  key: string
  label: string
}

export type ThemeGroup = {
  id: string
  label: string
  themes: readonly Theme[]
}

export const THEME_GROUPS: readonly ThemeGroup[] = [
  {
    id: 'phases',
    label: 'Fases',
    themes: [
      { key: 'opening', label: 'Abertura' },
      { key: 'middlegame', label: 'Meio-jogo' },
      { key: 'endgame', label: 'Finais' },
      { key: 'rookEndgame', label: 'Finais de Torres' },
      { key: 'bishopEndgame', label: 'Finais de bispo' },
      { key: 'pawnEndgame', label: 'Finais de peões' },
      { key: 'knightEndgame', label: 'Finais de Cavalo' },
      { key: 'queenEndgame', label: 'Finais de Dama' },
      { key: 'queenRookEndgame', label: 'Finais de Dama e Torre' },
    ],
  },
  {
    id: 'motifs',
    label: 'Motivos táticos',
    themes: [
      { key: 'advancedPawn', label: 'Peão avançado' },
      { key: 'attackingF2F7', label: 'Atacando f2 ou f7' },
      { key: 'capturingDefender', label: 'Capture o defensor' },
      { key: 'discoveredAttack', label: 'Ataque descoberto' },
      { key: 'doubleCheck', label: 'Xeque duplo' },
      { key: 'exposedKing', label: 'Rei exposto' },
      { key: 'fork', label: 'Garfo (ou duplo)' },
      { key: 'hangingPiece', label: 'Peça pendurada' },
      { key: 'kingsideAttack', label: 'Ataque na ala do Rei' },
      { key: 'pin', label: 'Cravada' },
      { key: 'queensideAttack', label: 'Ataque na ala da dama' },
      { key: 'sacrifice', label: 'Sacrifício' },
      { key: 'skewer', label: 'Raio X' },
      { key: 'trappedPiece', label: 'Peça presa' },
    ],
  },
  {
    id: 'advanced',
    label: 'Avançado',
    themes: [
      { key: 'attraction', label: 'Atração' },
      { key: 'clearance', label: 'Lance útil' },
      { key: 'collinearMove', label: 'Lance colinear' },
      { key: 'discoveredCheck', label: 'Xeque Descoberto' },
      { key: 'defensiveMove', label: 'Movimento defensivo' },
      { key: 'deflection', label: 'Desvio' },
      { key: 'interference', label: 'Interferência' },
      { key: 'intermezzo', label: 'Lance intermediário' },
      { key: 'quietMove', label: 'Lance de preparação' },
      { key: 'xRayAttack', label: 'Ataque em raio X' },
      { key: 'zugzwang', label: 'Zugzwang' },
    ],
  },
  {
    id: 'mates',
    label: 'Xeque-mates',
    themes: [
      { key: 'mate', label: 'Xeque-mate' },
      { key: 'mateIn1', label: 'Mate em 1' },
      { key: 'mateIn2', label: 'Mate em 2' },
      { key: 'mateIn3', label: 'Mate em 3' },
      { key: 'mateIn4', label: 'Mate em 4' },
      { key: 'mateIn5', label: 'Mate em 5 ou mais' },
    ],
  },
  {
    id: 'mateThemes',
    label: 'Temas de mate',
    themes: [
      { key: 'anastasiaMate', label: 'Mate Anastasia' },
      { key: 'arabianMate', label: 'Mate árabe' },
      { key: 'backRankMate', label: 'Mate do corredor' },
      { key: 'balestraMate', label: 'Mate da besta' },
      { key: 'blindSwineMate', label: 'Mate do porco cego' },
      { key: 'bodenMate', label: 'Mate de Boden' },
      { key: 'cornerMate', label: 'Mate de canto' },
      { key: 'doubleBishopMate', label: 'Mate de dois bispos' },
      { key: 'dovetailMate', label: 'Mate de Cozio' },
      { key: 'epauletteMate', label: 'Mate epaulette' },
      { key: 'hookMate', label: 'Mate gancho' },
      { key: 'killBoxMate', label: 'Mate de torre e dama' },
      { key: 'pillsburysMate', label: 'Mate de Pillsbury' },
      { key: 'morphysMate', label: 'Mate de Morphy' },
      { key: 'operaMate', label: 'Mate da ópera' },
      { key: 'swallowstailMate', label: 'Mate gueridon' },
      { key: 'triangleMate', label: 'Mate do triângulo' },
      { key: 'vukovicMate', label: 'Mate de Vukovic' },
      { key: 'smotheredMate', label: 'Mate de Philidor (mate sufocado)' },
    ],
  },
  {
    id: 'specialMoves',
    label: 'Movimentos especiais',
    themes: [
      { key: 'castling', label: 'Roque' },
      { key: 'enPassant', label: 'En passant' },
      { key: 'promotion', label: 'Promoção' },
      { key: 'underPromotion', label: 'Subpromoção' },
    ],
  },
  {
    id: 'goals',
    label: 'Objetivos',
    themes: [
      { key: 'equality', label: 'Igualdade' },
      { key: 'advantage', label: 'Vantagem' },
      { key: 'crushing', label: 'Punindo' },
    ],
  },
  {
    id: 'lengths',
    label: 'Distância',
    themes: [
      { key: 'oneMove', label: 'Problema de um lance' },
      { key: 'short', label: 'Problema curto' },
      { key: 'long', label: 'Problema longo' },
      { key: 'veryLong', label: 'Problema muito longo' },
    ],
  },
  {
    id: 'origin',
    label: 'Origem',
    themes: [
      { key: 'master', label: 'Partidas de mestres' },
      { key: 'masterVsMaster', label: 'Partidas de Mestre vs Mestre' },
      { key: 'superGM', label: 'Super partidas de GMs' },
    ],
  },
]

export const THEMES: readonly Theme[] = THEME_GROUPS.flatMap((group) => group.themes)

const LABELS = new Map(THEMES.map((theme) => [theme.key, theme.label]))

export function themeLabel(key: string): string {
  return LABELS.get(key) ?? key
}

export const DEFAULT_THEME = 'fork'
