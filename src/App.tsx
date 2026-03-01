import { useState } from 'react';
import MainMenuScreen from './components/MainMenuScreen';
import MultiplayerGame from './components/MultiplayerGame';
import SoloGame from './components/SoloGame';

export default function App() {
  const [mode, setMode] = useState<'solo' | 'multiplayer' | null>(null);

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

  return (
    <MainMenuScreen
      onSelectSolo={() => setMode('solo')}
      onSelectMultiplayer={() => setMode('multiplayer')}
    />
  );
}
