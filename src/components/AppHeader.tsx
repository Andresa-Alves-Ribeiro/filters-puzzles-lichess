import type { DailyProgress, ThemeChoice } from '../types.ts'
import { PieceGlyph } from './pieceGlyphs.tsx'

type AppHeaderProps = {
  goalToday: number
  goalPct: number
  daily: DailyProgress
  theme: ThemeChoice
  onGoal: (goal: number) => void
  onTheme: (theme: ThemeChoice) => void
}

export function AppHeader({ goalToday, goalPct, daily, theme, onGoal, onTheme }: AppHeaderProps) {
  const met = goalToday >= daily.goal
  const streakLabel = `Sequência de ${daily.streak} ${daily.streak === 1 ? 'dia' : 'dias'}`

  return (
    <header className="top">
      <div className="brand">
        <h1>
          <span className="eyebrow" aria-hidden="true">
            <svg viewBox="0 0 45 45">
              <PieceGlyph kind="k" white fill="var(--gold)" stroke="#1a120c" />
            </svg>
          </span>
          Filtro de puzzles
        </h1>
        <p className="s">Monte uma lista a partir do CSV do Lichess e marque os puzzles que já fez.</p>
      </div>
      <div className="top-side">
        <section className={met ? 'goal done' : 'goal'} aria-label="Meta diária">
          <div className="goal-line">
            <span>Meta</span>
            <strong>
              {goalToday}/{daily.goal}
            </strong>
            <span className="streak">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 2c1 4-2 5-2 9a4 4 0 0 0 8 0c0-2-1-3-1-5 3 2 5 6 5 9a8 8 0 1 1-16 0c0-5 4-8 6-13z"
                  fill="currentColor"
                />
              </svg>
              <span aria-hidden="true">{daily.streak}</span>
              <span className="visually-hidden">{streakLabel}</span>
            </span>
            <label className="goal-edit">
              <span className="visually-hidden">Quantidade</span>
              <input
                type="number"
                min={1}
                max={100}
                aria-label="Quantidade da meta"
                value={daily.goal}
                onChange={(event) => onGoal(+event.target.value)}
              />
            </label>
          </div>
          <div
            className="meter"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={daily.goal}
            aria-valuenow={Math.min(goalToday, daily.goal)}
            aria-label="Progresso da meta de hoje"
          >
            <span style={{ width: `${goalPct}%` }} />
          </div>
          {met && <p className="goal-note">Meta cumprida.</p>}
        </section>
        <div className="themeswitch" role="group" aria-label="Aparência">
          <button
            type="button"
            className="ghost"
            aria-pressed={theme === 'light'}
            aria-label="Claro"
            onClick={() => onTheme('light')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
              <path
                d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="ghost"
            aria-pressed={theme === 'dark'}
            aria-label="Escuro"
            onClick={() => onTheme('dark')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
