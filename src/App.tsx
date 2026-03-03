import { useState } from 'react';
import CompetitionGame from './components/CompetitionGame';
import MainMenuScreen from './components/MainMenuScreen';
import MultiplayerGame from './components/MultiplayerGame';
import SoloGame from './components/SoloGame';

export default function App() {
  const [mode, setMode] = useState<'solo' | 'multiplayer' | 'competition' | null>(null);

  if (mode === 'multiplayer') {
    return <MultiplayerGame onBack={() => setMode(null)} />;
  }

  if (mode === 'solo') {
    return (
      <SoloGame
        onBack={() => setMode(null)}
        onOpenMultiplayer={() => setMode('multiplayer')}
      />
    );
  }

  if (mode === 'competition') {
    return <CompetitionGame onBack={() => setMode(null)} />;
  }

  return (
    <MainMenuScreen
      onSelectSolo={() => setMode('solo')}
      onSelectMultiplayer={() => setMode('multiplayer')}
      onSelectCompetition={() => setMode('competition')}
    />
  );
}
