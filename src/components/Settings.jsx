import { Upload } from 'lucide-react';
import { useRef } from 'react';
import BlackButton from './BlackButton';
import SettingsNumberField from './SettingsNumberField';

export default function Settings({
  wordListName,
  wordsCount,
  selectedPreset,
  wordLists,
  onPresetChange,
  onFileUpload,
  startTimeInput,
  onStartTimeChange,
  onStartTimeBlur,
  bonusTimeInput,
  onBonusTimeChange,
  onBonusTimeBlur,
  alternativeWordBonusTimeInput,
  onAlternativeWordBonusTimeChange,
  onAlternativeWordBonusTimeBlur,
  minWordLength,
  minWordLengthInput,
  onMinWordLengthChange,
  onMinWordLengthBlur,
  maxWordLengthInput,
  onMaxWordLengthChange,
  onMaxWordLengthBlur,
}) {
  const fileInputRef = useRef(null);
  const gameTimeFields = [
    {
      key: 'startTime',
      label: 'Temps de départ (secondes)',
      min: 30,
      max: 300,
      value: startTimeInput,
      onChange: onStartTimeChange,
      onBlur: onStartTimeBlur,
    },
    {
      key: 'bonusTime',
      label: 'Bonus par mot (secondes)',
      min: 5,
      max: 60,
      value: bonusTimeInput,
      onChange: onBonusTimeChange,
      onBlur: onBonusTimeBlur,
    },
    {
      key: 'alternativeBonusTime',
      label: 'Bonus mot alternatif (secondes)',
      min: 0,
      max: 30,
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
      value: minWordLengthInput,
      onChange: onMinWordLengthChange,
      onBlur: onMinWordLengthBlur,
    },
    {
      key: 'maxWordLength',
      label: 'Longueur maximale',
      min: minWordLength,
      value: maxWordLengthInput,
      onChange: onMaxWordLengthChange,
      onBlur: onMaxWordLengthBlur,
    },
  ];

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
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          ))}
        </div>
      </div>

      <h3 className="text-md font-medium mb-3 text-black">Liste de mots</h3>
      <p className="text-sm text-black mb-4">
        Liste actuelle: {wordListName} ({wordsCount} mots disponibles)
      </p>

      <div className="space-y-3 mb-4">
        <p className="text-sm font-medium text-black">Listes prédéfinies:</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(wordLists).map(([key, list]) => (
            <button
              key={key}
              onClick={() => onPresetChange(key)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{
                backgroundColor: selectedPreset === key ? '#059669' : '#6b7280',
                borderColor: selectedPreset === key ? '#059669' : '#6b7280',
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
            >
              {list.name}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4">
        <p className="text-sm font-medium text-black mb-2">Ou importez votre liste:</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          onChange={onFileUpload}
          className="hidden"
        />
        <BlackButton
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Importer un fichier .txt
        </BlackButton>
        <p className="text-xs text-black mt-2">Format: un mot par ligne</p>
      </div>
    </div>
  );
}
