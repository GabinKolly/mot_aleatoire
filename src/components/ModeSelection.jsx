import { Play, Users } from 'lucide-react';
import GameActionButton from './GameActionButton';

export default function ModeSelection({ onSelectSolo, onSelectMultiplayer }) {
  return (
    <div className="text-center py-12 space-y-4">
      <GameActionButton onClick={onSelectSolo} icon={Play}>
        Solo
      </GameActionButton>
      <div>
        <GameActionButton onClick={onSelectMultiplayer} icon={Users}>
          Deux joueurs
        </GameActionButton>
      </div>
    </div>
  );
}
