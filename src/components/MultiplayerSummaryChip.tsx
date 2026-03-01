import { WORD_LISTS } from '../constants/wordLists';
import type { MultiplayerConfig } from '../types/multiplayer';
import { countWordsMatchingLength } from '../utils/wordPicking';

interface MultiplayerSummaryChipProps {
  config: MultiplayerConfig;
  wordListKey: string;
}

export default function MultiplayerSummaryChip({
  config,
  wordListKey,
}: MultiplayerSummaryChipProps) {
  const activeWordListKey = config.wordListKey || wordListKey || 'default';
  const activeWordList = WORD_LISTS[activeWordListKey] || WORD_LISTS.default;
  const wordListName = activeWordList.name || activeWordListKey;
  const minWordLength = Number.isInteger(config.minWordLength) ? config.minWordLength : 2;
  const maxWordLength = Number.isInteger(config.maxWordLength)
    ? Math.max(config.maxWordLength, minWordLength)
    : minWordLength;
  const wordCount = countWordsMatchingLength(
    activeWordList.words,
    minWordLength,
    maxWordLength
  );

  return (
    <div className="mm-summary-chip" aria-label="Résumé de la partie multijoueur">
      <span>{`${config.gameTime} s, ${config.wordTime} s par mot`}</span>
      <span>{`${config.minWordLength} à ${config.maxWordLength} lettres`}</span>
      <span>{`${wordListName} • ${wordCount} mots`}</span>
    </div>
  );
}
