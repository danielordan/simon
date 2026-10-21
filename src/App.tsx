import { ResultCard } from './components/ResultCard';
import { SimonBoard } from './components/SimonBoard';
import { StatBoxes } from './components/StatBoxes';
import { StatusArea } from './components/StatusArea';
import { TopBar } from './components/TopBar';
import { currentStage, reachedStage } from './game/rules';
import type { Rng } from './game/types';
import { useGame } from './hooks/useGame';

type Props = { rng?: Rng };

export default function App({ rng }: Props) {
  const { state, litColor, errorFlash, resultVisible, start, press } = useGame(rng);
  const ended = state.phase === 'won' || state.phase === 'lost';

  return (
    <div className="app">
      <TopBar />
      {ended && resultVisible ? (
        // The game-over view is a state of the game screen, not a separate screen.
        <main className="home home--result">
          <ResultCard
            won={state.phase === 'won'}
            stage={reachedStage(state)}
            score={state.score}
            onNewGame={start}
          />
        </main>
      ) : (
        <main className="home">
          <StatBoxes stage={currentStage(state)} score={state.score} />
          <SimonBoard
            litColor={litColor}
            errorFlash={errorFlash}
            inputEnabled={state.phase === 'input'}
            onPress={press}
          />
          <StatusArea phase={state.phase} onStart={start} />
        </main>
      )}
    </div>
  );
}
