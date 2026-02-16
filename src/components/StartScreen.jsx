import { Play } from 'lucide-react';
import GameActionButton from './GameActionButton';

export default function StartScreen({ onStart }) {
  return (
    <div className="text-center py-12">
      <GameActionButton onClick={onStart} icon={Play}>
        Commencer
      </GameActionButton>
    </div>
  );
}
