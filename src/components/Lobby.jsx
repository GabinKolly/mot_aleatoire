import { useLayoutEffect, useRef, useState } from 'react';
import { getSavedPlayerName } from '../hooks/useMultiplayerGame';

export default function Lobby({ onCreateRoom, onJoinRoom, error }) {
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState(() => getSavedPlayerName());
  const [mode, setMode] = useState(null);
  const actionsRef = useRef(null);
  const createBtnRef = useRef(null);
  const joinBtnRef = useRef(null);
  const [menuBandStyle, setMenuBandStyle] = useState(null);

  useLayoutEffect(() => {
    if (mode !== null) {
      return undefined;
    }

    const container = actionsRef.current;
    const startNode = createBtnRef.current;
    const endNode = joinBtnRef.current;
    if (!container || !startNode || !endNode) {
      return undefined;
    }

    let rafId = null;
    let observer = null;

    const measure = () => {
      const containerRect = container.getBoundingClientRect();
      const startRect = startNode.getBoundingClientRect();
      const endRect = endNode.getBoundingClientRect();
      const top = Math.max(
        0,
        Math.round(startRect.top + startRect.height / 2 - containerRect.top)
      );
      const bottom = Math.max(
        top,
        Math.round(endRect.top + endRect.height / 2 - containerRect.top)
      );
      setMenuBandStyle({
        top: `${top}px`,
        height: `${Math.max(0, bottom - top)}px`,
      });
    };

    const scheduleMeasure = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        measure();
      });
    };

    scheduleMeasure();
    window.addEventListener('resize', scheduleMeasure);
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(scheduleMeasure);
      observer.observe(container);
      observer.observe(startNode);
      observer.observe(endNode);
    }

    return () => {
      window.removeEventListener('resize', scheduleMeasure);
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
  }, [mode]);

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
                ref={createBtnRef}
                type="button"
                onClick={handleCreate}
                className="mm-pill-button mm-pill-button--beige mm-pill-button--title"
              >
                Créer une partie
              </button>
              <button
                ref={joinBtnRef}
                type="button"
                onClick={() => setMode('join')}
                className="mm-pill-button mm-pill-button--beige mm-pill-button--title"
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
