import { SimonBoard } from './components/SimonBoard';
import { StatBoxes } from './components/StatBoxes';
import { StatusArea } from './components/StatusArea';
import { TopBar } from './components/TopBar';
import { currentStage } from './game/rules';
import type { Rng } from './game/types';
import { useGame } from './hooks/useGame';

type Props = { rng?: Rng };

export default function App({ rng }: Props) {
  const { state, litColor, start, press } = useGame(rng);

  return (
    <div className="app">
      <TopBar />
      <main className="home">
        <StatBoxes stage={currentStage(state)} score={state.score} />
        <SimonBoard litColor={litColor} inputEnabled={state.phase === 'input'} onPress={press} />
        <StatusArea phase={state.phase} onStart={start} />
      </main>
    </div>
  );
}
