import { Upload } from 'lucide-react';
import { useRef } from 'react';
import SettingsNumberField from './SettingsNumberField';
import type { SettingsBindings } from '../hooks/useSettingsBindings';

interface SettingsProps extends SettingsBindings {
  onClose: () => void;
}

export default function Settings({
  wordListName,
  wordsCount,
  selectedPreset,
  selectedAddedListId,
  addedWordLists,
  wordLists,
  highScoresByPreset,
  highScoresByAddedListId,
  currentListHighScore,
  isUsingStandardSettings,
  onPresetChange,
  onSelectAddedList,
  onRenameAddedList,
  onRemoveAddedList,
  onFileUpload,
  onResetToStandardForCurrentList,
  onClearCurrentListHighScore,
  startTimeInput,
  onStartTimeChange,
  onStartTimeBlur,
  bonusTimeInput,
  onBonusTimeChange,
  onBonusTimeBlur,
  alternativeWordBonusTimeInput,
  onAlternativeWordBonusTimeChange,
  onAlternativeWordBonusTimeBlur,
  answerValidationMode,
  onAnswerValidationModeChange,
  minWordLength,
  minWordLengthInput,
  onMinWordLengthChange,
  onMinWordLengthBlur,
  maxWordLengthInput,
  onMaxWordLengthChange,
  onMaxWordLengthBlur,
  onClose,
}: SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasCurrentListHighScore = Number.isInteger(currentListHighScore);
  const formatHighScore = (value: number | null) =>
    Number.isInteger(value) ? `Meilleur score : ${value}` : 'Meilleur score : -';
  const gameTimeFields = [
    {
      key: 'startTime',
      label: 'Temps de départ (secondes)',
      min: 1,
      max: 9999,
      value: startTimeInput,
      onChange: onStartTimeChange,
      onBlur: onStartTimeBlur,
    },
    {
      key: 'bonusTime',
      label: 'Bonus par mot (secondes)',
      min: 0,
      max: 9999,
      value: bonusTimeInput,
      onChange: onBonusTimeChange,
      onBlur: onBonusTimeBlur,
    },
    {
      key: 'alternativeBonusTime',
      label: 'Bonus mot alternatif (secondes)',
      min: 0,
      max: 9999,
      value: alternativeWordBonusTimeInput,
      onChange: onAlternativeWordBonusTimeChange,
      onBlur: onAlternativeWordBonusTimeBlur,
    },
  ];

  const wordLengthFields = [
    {
      key: 'minWordLength',
      label: 'Longueur minimale',
      min: 2,
      max: 100,
      value: minWordLengthInput,
      onChange: onMinWordLengthChange,
      onBlur: onMinWordLengthBlur,
    },
    {
      key: 'maxWordLength',
      label: 'Longueur maximale',
      min: minWordLength,
      max: 100,
      value: maxWordLengthInput,
      onChange: onMaxWordLengthChange,
      onBlur: onMaxWordLengthBlur,
    },
  ];

  const answerValidationOptions = [
    {
      key: 'loose',
      label: 'Souple',
      description: 'Les anagrammes de la même liste sont acceptés.',
    },
    {
      key: 'strict',
      label: 'Strict',
      description: 'Seul le mot choisi est validé.',
    },
  ] as const;

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg text-black">
      <h2 className="text-lg font-semibold mb-4 text-black">Paramètres</h2>

      <div className="mb-6 pb-6">
        <h3 className="text-md font-medium mb-3 text-black">Temps de jeu</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {gameTimeFields.map((field) => (
            <SettingsNumberField
              key={field.key}
              label={field.label}
              value={field.value}
              min={field.min}
              max={field.max}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          ))}
        </div>
      </div>

      <div className="mb-6 pb-6">
        <h3 className="text-md font-medium mb-3 text-black">Longueur des mots</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wordLengthFields.map((field) => (
            <SettingsNumberField
              key={field.key}
              label={field.label}
              value={field.value}
              min={field.min}
              max={field.max}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          ))}
        </div>
      </div>

      <div className="mb-6 pb-6">
        <h3 className="text-md font-medium mb-3 text-black">Validation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {answerValidationOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onAnswerValidationModeChange(option.key)}
              aria-pressed={answerValidationMode === option.key}
              className="btn btn-choice btn-sm w-full flex-col items-start text-left"
            >
              <span className="block">{option.label}</span>
              <span className="block text-xs opacity-90">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 pb-6 space-y-2">
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <button
            onClick={onResetToStandardForCurrentList}
            className="btn btn-secondary btn-sm"
          >
            Paramètres standards pour la liste choisie
          </button>
        </div>
        {!isUsingStandardSettings && (
          <p className="text-xs text-amber-700 mt-2">
            Paramètres non standards : le score ne comptera pas pour le meilleur score.
          </p>
        )}
      </div>

      <h3 className="text-md font-medium mb-3 text-black">Liste de mots</h3>
      <p className="text-sm text-black mb-4">
        Liste actuelle : {wordListName} ({wordsCount} mots disponibles)
        {` • ${formatHighScore(currentListHighScore)}`}
      </p>

      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(wordLists).map(([key, list]) => (
            <button
              key={key}
              onClick={() => onPresetChange(key)}
              aria-pressed={selectedAddedListId === null && selectedPreset === key}
              className="btn btn-choice btn-sm w-full flex-col items-start text-left"
            >
                  <span className="block">{list.name}</span>
              <span className="block text-xs opacity-90">
                {formatHighScore(highScoresByPreset?.[key] ?? null)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 pb-6">
        <h3 className="text-md font-medium mb-3 text-black">Listes ajoutées</h3>
        {addedWordLists.length === 0 ? (
          <p className="text-sm text-gray-600">Aucune liste ajoutée pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {addedWordLists.map((list) => (
              <div
                key={`${list.id}-${list.name}`}
                className="flex flex-col md:flex-row gap-2 md:items-center"
              >
                <button
                  onClick={() => onSelectAddedList(list.id)}
                  aria-pressed={selectedAddedListId === list.id}
                  className="btn btn-choice btn-sm"
                >
                  Utiliser
                </button>
                <input
                  type="text"
                  defaultValue={list.name}
                  onBlur={(event) => {
                    const input = event.currentTarget;
                    const proposedName = input.value;
                    onRenameAddedList(list.id, proposedName);
                    input.value =
                      proposedName.trim().length === 0 ? list.name : proposedName.trim();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.currentTarget.blur();
                    }
                  }}
                  className="px-3 py-2 border rounded-lg text-sm"
                />
                <button
                  onClick={() => onRemoveAddedList(list.id)}
                  className="btn btn-danger-outline btn-sm"
                >
                  Supprimer
                </button>
                <span className="text-xs text-gray-600 md:ml-2">
                  {formatHighScore(highScoresByAddedListId?.[list.id] ?? null)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          onChange={onFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-secondary btn-sm"
        >
          <Upload className="w-4 h-4" />
          Importer un fichier .txt
        </button>
        <p className="text-xs text-black mt-2">Format : un mot par ligne</p>
      </div>

      <div className="pt-4 mt-4 border-t border-gray-200">
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <button
            type="button"
            onClick={onClearCurrentListHighScore}
            disabled={!hasCurrentListHighScore}
            className="btn btn-danger-outline btn-xs"
          >
            Effacer le meilleur score
          </button>
          {!hasCurrentListHighScore && (
            <span className="text-xs text-gray-600">
              Aucun meilleur score enregistré pour cette liste.
            </span>
          )}
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-secondary btn-sm"
        >
          Fermer les paramètres
        </button>
      </div>
    </div>
  );
}
