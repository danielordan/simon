import { useEffect } from 'react';
import { AboutScreen } from './components/AboutScreen';
import { InfoIcon } from './components/icons';
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
  const { state, litColor, errorFlash, resultVisible, start, press, openAbout, closeAbout, resume } = useGame(rng);
  const ended = state.phase === 'won' || state.phase === 'lost';

  // Each screen opens at the top.
  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, [state.screen]);

  // Only two screens; navigation is plain React state, without a router.
  if (state.screen === 'about') {
    return (
      <div className="app">
        <AboutScreen score={state.score} sessionBest={state.sessionBest} onBack={closeAbout} />
      </div>
    );
  }

  return (
    <div className="app">
      <TopBar title="SIMON" titleLtr icon={<InfoIcon />} iconLabel="אודות" onIconClick={openAbout} />
      {ended && resultVisible ? (
        // The game-over view is a state of the game screen, not a separate screen.
        <main className="home home--result">
          <ResultCard
            won={state.phase === 'won'}
            stage={reachedStage(state)}
            score={state.score}
            onNewGame={start}
            onAbout={openAbout}
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
          <StatusArea phase={state.phase} awaitingResume={state.awaitingResume} onStart={start} onResume={resume} />
        </main>
      )}
    </div>
  );
}
