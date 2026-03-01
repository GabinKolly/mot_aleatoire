import { useRef, useState } from 'react';
import { getSavedPlayerName } from '../hooks/useMultiplayerGame';
import { useBandHighlightStyle } from '../hooks/useBandHighlightStyle';
import { bandStartSelector, bandEndSelector } from '../constants/dom';

interface LobbyProps {
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomId: string, playerName: string) => void;
  error: string | null;
}

export default function Lobby({ onCreateRoom, onJoinRoom, error }: LobbyProps) {
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState(() => getSavedPlayerName());
  const [mode, setMode] = useState<'join' | null>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const menuBandStyle = useBandHighlightStyle(
    actionsRef,
    bandStartSelector('mp-lobby'),
    bandEndSelector('mp-lobby'),
    [mode]
  );

  const handleCreate = () => {
    onCreateRoom(playerName.trim() || 'Joueur 1');
  };

  const handleJoin = () => {
    if (joinCode.trim().length < 4) return;
    onJoinRoom(joinCode.trim(), playerName.trim() || 'Joueur 2');
  };

  return (
    <div className="mm-mp-lobby">
      <div className="mm-mp-card">
        <label className="mm-form-field__label" htmlFor="mp-player-name">
          Votre nom
        </label>
        <input
          id="mp-player-name"
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Entrez votre nom"
          maxLength={20}
          className="mm-input"
        />
      </div>

      {error && (
        <p className="mm-mp-error-text" role="alert">
          {error}
        </p>
      )}

      <div className="mm-mp-lobby-actions" ref={actionsRef}>
        {mode === null && menuBandStyle && (
          <div
            className="mm-mp-lobby-actions__band"
            aria-hidden="true"
            style={menuBandStyle}
          />
        )}
        <div className="mm-mp-lobby-actions__stack">
          {mode === null && (
            <>
              <button
                type="button"
                onClick={handleCreate}
                className="mm-pill-button mm-pill-button--beige mm-pill-button--title"
                data-mm-band-start-anchor="mp-lobby"
              >
                Créer une partie
              </button>
              <button
                type="button"
                onClick={() => setMode('join')}
                className="mm-pill-button mm-pill-button--beige mm-pill-button--title"
                data-mm-band-end-anchor="mp-lobby"
              >
                Rejoindre une partie
              </button>
            </>
          )}

          {mode === 'join' && (
            <div className="mm-mp-card mm-mp-card--join">
              <label className="mm-form-field__label" htmlFor="mp-join-code">
                Code de la salle
              </label>
              <input
                id="mp-join-code"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABCD"
                maxLength={4}
                className="mm-input mm-input--room-code"
              />
              <button
                type="button"
                onClick={handleJoin}
                disabled={joinCode.trim().length < 4}
                className="mm-pill-button mm-pill-button--beige mm-pill-button--title"
              >
                Rejoindre
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
