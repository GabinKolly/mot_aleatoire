import { useState, useEffect } from 'react';
import { Copy, Check, ArrowLeft } from 'lucide-react';
import { WORD_LISTS } from '../constants/wordLists';
import IconButton from './IconButton';
import SettingsNumberField from './SettingsNumberField';
import { useClampedInput } from '../hooks/useClampedInput';
import { countWordsMatchingLength } from '../utils/wordPicking';

async function copyText(text) {
  if (!text) return false;

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') {
    return false;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

export default function WaitingRoom({ state, actions }) {
  const { roomCode, players, isHost, config, wordListKey } = state;
  const { updateConfig, startGame, goBackToLobby } = actions;

  const [copied, setCopied] = useState(false);

  const gameTime = useClampedInput({ initialValue: config.gameTime, min: 30, max: 600 });
  const wordTime = useClampedInput({ initialValue: config.wordTime, min: 10, max: 120 });
  const minWordLength = useClampedInput({ initialValue: config.minWordLength, min: 2, max: 15 });
  const maxWordLength = useClampedInput({ initialValue: config.maxWordLength, min: 2, max: 15 });
  const [selectedPreset, setSelectedPreset] = useState(wordListKey);
  const selectedWordList =
    WORD_LISTS[selectedPreset] || WORD_LISTS[wordListKey] || WORD_LISTS.default;
  const selectedMinWordLength = minWordLength.committedValue;
  const selectedMaxWordLength = Math.max(
    maxWordLength.committedValue,
    selectedMinWordLength
  );
  const selectedWordCount = countWordsMatchingLength(
    selectedWordList.words,
    selectedMinWordLength,
    selectedMaxWordLength
  );
  const readonlyWordListKey = config.wordListKey || wordListKey || 'default';
  const readonlyWordList = WORD_LISTS[readonlyWordListKey] || WORD_LISTS.default;
  const readonlyMinWordLength = Number.isInteger(config.minWordLength)
    ? config.minWordLength
    : 2;
  const readonlyMaxWordLength = Number.isInteger(config.maxWordLength)
    ? Math.max(config.maxWordLength, readonlyMinWordLength)
    : readonlyMinWordLength;
  const readonlyWordCount = countWordsMatchingLength(
    readonlyWordList.words,
    readonlyMinWordLength,
    readonlyMaxWordLength
  );

  useEffect(() => {
    if (!isHost) return;
    updateConfig(
      {
        gameTime: gameTime.committedValue,
        wordTime: wordTime.committedValue,
        minWordLength: minWordLength.committedValue,
        maxWordLength: Math.max(maxWordLength.committedValue, minWordLength.committedValue),
      },
      selectedPreset
    );
  }, [
    isHost,
    gameTime.committedValue,
    wordTime.committedValue,
    minWordLength.committedValue,
    maxWordLength.committedValue,
    selectedPreset,
    updateConfig,
  ]);

  const handleCopy = async () => {
    if (!roomCode) return;

    const success = await copyText(roomCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const allConnected = players.every((p) => p.connected !== false);
  const canStart = players.length === 2 && isHost && allConnected;

  return (
    <div className="mm-waiting-layout">
      <section className="mm-mp-card mm-waiting-code">
        <p className="mm-waiting-code__label">Code de la salle</p>
        <div className="mm-waiting-code__value-row">
          <span className="mm-waiting-code__value">{roomCode}</span>
          <IconButton
            type="button"
            label={copied ? 'Code copié' : 'Copier le code'}
            className="mm-waiting-copy-btn"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <Copy className="w-5 h-5 text-gray-500" />
            )}
          </IconButton>
        </div>
      </section>

      <section
        className="mm-mp-card mm-waiting-players"
        data-mm-band-start-anchor="mp-waiting"
      >
        <h3 className="mm-mp-card__title">Joueurs</h3>
        <div className="mm-waiting-players__list">
          {players.map((player) => (
            <div
              key={player.id}
              className={`mm-waiting-player-row ${
                player.connected === false ? 'is-disconnected' : ''
              }`}
            >
              <div
                className={`mm-waiting-player-row__dot ${
                  player.connected === false
                    ? 'is-gray'
                    : player.number === 1
                      ? 'is-blue'
                      : 'is-red'
                }`}
              />
              <span className="mm-waiting-player-row__name">{player.name}</span>
              {player.id === state.hostId && (
                <span className="mm-waiting-badge mm-waiting-badge--host">Hôte</span>
              )}
              {player.connected === false && (
                <span className="mm-waiting-badge mm-waiting-badge--muted">
                  Déconnecté
                </span>
              )}
            </div>
          ))}
          {players.length < 2 && (
            <div className="mm-waiting-player-row is-disconnected">
              <div className="mm-waiting-player-row__dot is-gray" />
              <span className="mm-waiting-player-row__name">En attente...</span>
            </div>
          )}
        </div>
      </section>

      {isHost ? (
        <section className="mm-mp-card">
          <h3 className="mm-mp-card__title">Paramètres</h3>
          <div className="mm-waiting-config-grid">
            <SettingsNumberField
              variant="mockup"
              label="Durée de la partie (s)"
              value={gameTime.inputValue}
              min={30}
              max={600}
              onChange={gameTime.onChange}
              onBlur={gameTime.onBlur}
            />
            <SettingsNumberField
              variant="mockup"
              label="Temps par mot (s)"
              value={wordTime.inputValue}
              min={10}
              max={120}
              onChange={wordTime.onChange}
              onBlur={wordTime.onBlur}
            />
            <SettingsNumberField
              variant="mockup"
              label="Longueur min"
              value={minWordLength.inputValue}
              min={2}
              max={15}
              onChange={minWordLength.onChange}
              onBlur={minWordLength.onBlur}
            />
            <SettingsNumberField
              variant="mockup"
              label="Longueur max"
              value={maxWordLength.inputValue}
              min={2}
              max={15}
              onChange={maxWordLength.onChange}
              onBlur={maxWordLength.onBlur}
            />
          </div>

          <div className="mm-waiting-word-list">
            <p className="mm-form-field__label">Liste de mots</p>
            <div className="mm-choice-chip-grid">
              {Object.entries(WORD_LISTS).map(([key, list]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPreset(key)}
                  aria-pressed={selectedPreset === key}
                  className={`mm-choice-chip ${
                    selectedPreset === key ? 'is-selected' : ''
                  }`}
                >
                  {list.name}
                </button>
              ))}
            </div>
          </div>

          <p className="mm-waiting-config-footnote">
            {`Nombre de mots : ${selectedWordCount}`}
          </p>
        </section>
      ) : (
        <section className="mm-mp-card">
          <h3 className="mm-mp-card__title">Paramètres</h3>
          <div className="mm-waiting-config-readonly">
            <p>Durée : {config.gameTime}s | Temps par mot : {config.wordTime}s</p>
            <p>
              Longueur : {config.minWordLength}-{config.maxWordLength} lettres
            </p>
            <p>
              Liste :{' '}
              {WORD_LISTS[config.wordListKey]?.name ||
                WORD_LISTS[wordListKey]?.name ||
                wordListKey}
            </p>
            <p>{`Nombre de mots : ${readonlyWordCount}`}</p>
          </div>
        </section>
      )}

      <div className="mm-waiting-actions">
        {isHost && (
          <button
            type="button"
            onClick={startGame}
            disabled={!canStart}
            className="mm-pill-button mm-pill-button--beige mm-pill-button--title"
            data-mm-band-end-anchor="mp-waiting"
          >
            Commencer
          </button>
        )}
        {!isHost && players.length < 2 && (
          <p className="mm-waiting-info" data-mm-band-end-anchor="mp-waiting">
            En attente d&apos;un autre joueur...
          </p>
        )}
        {!isHost && players.length === 2 && (
          <p className="mm-waiting-info" data-mm-band-end-anchor="mp-waiting">
            En attente du lancement par l&apos;hôte...
          </p>
        )}
        <button
          type="button"
          onClick={goBackToLobby}
          className="btn btn-link"
        >
          <ArrowLeft className="w-4 h-4" />
          Quitter la salle
        </button>
      </div>
    </div>
  );
}
