import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getSavedPlayerName } from '../hooks/useMultiplayerGame';

export default function Lobby({ onCreateRoom, onJoinRoom, onBack, error }) {
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState(() => getSavedPlayerName());
  const [mode, setMode] = useState(null);

  const handleCreate = () => {
    onCreateRoom(playerName.trim() || 'Joueur 1');
  };

  const handleJoin = () => {
    if (joinCode.trim().length < 4) return;
    onJoinRoom(joinCode.trim(), playerName.trim() || 'Joueur 2');
  };

  return (
    <div className="text-center py-8 space-y-6">
      <div className="max-w-xs mx-auto">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Votre nom
        </label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Entrez votre nom"
          maxLength={20}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {error && (
        <p className="text-red-600 font-medium">{error}</p>
      )}

      {mode === null && (
        <div className="space-y-3">
          <div>
            <button
              onClick={handleCreate}
              className="btn btn-primary btn-lg"
            >
              Créer une partie
            </button>
          </div>
          <div>
            <button
              onClick={() => setMode('join')}
              className="btn btn-primary btn-lg"
            >
              Rejoindre une partie
            </button>
          </div>
        </div>
      )}

      {mode === 'join' && (
        <div className="space-y-3">
          <div className="max-w-xs mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code de la salle
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABCD"
              maxLength={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleJoin}
            disabled={joinCode.trim().length < 4}
            className="btn btn-primary btn-lg"
          >
            Rejoindre
          </button>
        </div>
      )}

      <div>
        <button
          onClick={mode ? () => setMode(null) : onBack}
          className="btn btn-link"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
      </div>
    </div>
  );
}
