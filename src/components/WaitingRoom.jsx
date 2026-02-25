import { useState, useEffect } from 'react';
import { Copy, Check, Play, ArrowLeft } from 'lucide-react';
import { WORD_LISTS } from '../constants/wordLists';
import GameActionButton from './GameActionButton';
import IconButton from './IconButton';
import SettingsNumberField from './SettingsNumberField';
import { useClampedInput } from '../hooks/useClampedInput';

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
    <div className="py-6 space-y-6">
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-1">Code de la salle</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-4xl font-mono font-bold tracking-widest text-emerald-700">
            {roomCode}
          </span>
          <IconButton
            type="button"
            label={copied ? 'Code copié' : 'Copier le code'}
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <Copy className="w-5 h-5 text-gray-500" />
            )}
          </IconButton>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Joueurs</h3>
        <div className="space-y-2">
          {players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center gap-2 bg-white rounded-lg px-3 py-2 ${
                player.connected === false ? 'opacity-50' : ''
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  player.connected === false
                    ? 'bg-gray-400'
                    : player.number === 1
                      ? 'bg-blue-500'
                      : 'bg-red-500'
                }`}
              />
              <span className="font-medium">{player.name}</span>
              {player.id === state.hostId && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                  Hôte
                </span>
              )}
              {player.connected === false && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  Déconnecté
                </span>
              )}
            </div>
          ))}
          {players.length < 2 && (
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 opacity-50">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="text-gray-400 italic">En attente...</span>
            </div>
          )}
        </div>
      </div>

      {isHost && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Paramètres</h3>

          <SettingsNumberField
            label="Durée de la partie (s)"
            value={gameTime.inputValue}
            min={30}
            max={600}
            onChange={gameTime.onChange}
            onBlur={gameTime.onBlur}
          />
          <SettingsNumberField
            label="Temps par mot (s)"
            value={wordTime.inputValue}
            min={10}
            max={120}
            onChange={wordTime.onChange}
            onBlur={wordTime.onBlur}
          />
          <SettingsNumberField
            label="Longueur min"
            value={minWordLength.inputValue}
            min={2}
            max={15}
            onChange={minWordLength.onChange}
            onBlur={minWordLength.onBlur}
          />
          <SettingsNumberField
            label="Longueur max"
            value={maxWordLength.inputValue}
            min={2}
            max={15}
            onChange={maxWordLength.onChange}
            onBlur={maxWordLength.onBlur}
          />

          <div>
            <p className="text-sm text-gray-600 mb-1">Liste de mots</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(WORD_LISTS).map(([key, list]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPreset(key)}
                  aria-pressed={selectedPreset === key}
                  className="btn btn-choice btn-sm"
                >
                  {list.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isHost && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Paramètres</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Durée : {config.gameTime}s | Temps par mot : {config.wordTime}s</p>
            <p>Longueur : {config.minWordLength}-{config.maxWordLength} lettres</p>
            <p>Liste : {WORD_LISTS[config.wordListKey]?.name || WORD_LISTS[wordListKey]?.name || wordListKey}</p>
          </div>
        </div>
      )}

      <div className="text-center space-y-3">
        {isHost && (
          <div>
            <GameActionButton onClick={startGame} disabled={!canStart} icon={Play}>
              Commencer
            </GameActionButton>
          </div>
        )}
        {!isHost && players.length < 2 && (
          <p className="text-gray-500">En attente d&apos;un autre joueur...</p>
        )}
        {!isHost && players.length === 2 && (
          <p className="text-gray-500">En attente du lancement par l&apos;hôte...</p>
        )}
        <div>
          <button
            onClick={goBackToLobby}
            className="btn btn-link"
          >
            <ArrowLeft className="w-4 h-4" />
            Quitter la salle
          </button>
        </div>
      </div>
    </div>
  );
}
