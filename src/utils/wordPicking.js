const canBeSolvedWithOneMove = (shuffled, original) => {
  const shuffledArray = shuffled.split('');

  for (let i = 0; i < shuffledArray.length; i += 1) {
    const letter = shuffledArray[i];
    const withoutLetter = [
      ...shuffledArray.slice(0, i),
      ...shuffledArray.slice(i + 1),
    ];

    for (let j = 0; j <= withoutLetter.length; j += 1) {
      const newArrangement = [
        ...withoutLetter.slice(0, j),
        letter,
        ...withoutLetter.slice(j),
      ];
      if (newArrangement.join('') === original) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Shuffle a word's letters using Fisher-Yates, ensuring the result is not
 * trivially solvable. Accepts an optional `rng` function (defaults to Math.random).
 */
export const shuffleWord = (word, rng = Math.random) => {
  const letters = word.split('');
  let shuffled = [...letters];
  let attempts = 0;

  do {
    shuffled = [...letters];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const randomIndex = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
    }

    attempts += 1;
    const shuffledWord = shuffled.join('');

    if (shuffledWord === word) {
      continue;
    }

    if (word.length >= 5 && canBeSolvedWithOneMove(shuffledWord, word)) {
      continue;
    }

    break;
  } while (attempts < 100);

  return shuffled;
};

/**
 * Build tile objects from a shuffled word.
 * Accepts an optional `rng` function (defaults to Math.random).
 */
export const buildShuffledTiles = (word, rng = Math.random) => {
  let shuffled = shuffleWord(word, rng);
  let attempts = 1;

  while (shuffled.join('') === word && attempts < 200) {
    shuffled = shuffleWord(word, rng);
    attempts += 1;
  }

  return shuffled.map((letter, index) => ({ letter, id: index }));
};

/**
 * Pick a word from a filtered list, using the large-list bucket strategy
 * when the full list is >= 500 words. Accepts an `rng` function.
 */
export const pickWordFromList = (availableWords, allFilteredWords, rng = Math.random) => {
  if (availableWords.length === 0) {
    return null;
  }

  if (allFilteredWords.length >= 500) {
    const wordsByLength = availableWords.reduce((acc, word) => {
      const len = word.length;
      if (!acc[len]) acc[len] = [];
      acc[len].push(word);
      return acc;
    }, {});

    const availableLengths = Object.keys(wordsByLength).map(Number);
    const chosenLength =
      availableLengths[Math.floor(rng() * availableLengths.length)];
    const bucket = wordsByLength[chosenLength];
    return bucket[Math.floor(rng() * bucket.length)];
  }

  return availableWords[Math.floor(rng() * availableWords.length)];
};

/**
 * Generate a deterministic word sequence from a seed and word list.
 * Returns an array of { word, tiles } entries.
 */
export const generateWordSequence = (words, minLength, maxLength, rng, maxCount = 200) => {
  const filtered = words.filter((w) => w.length >= minLength && w.length <= maxLength);
  const sequence = [];
  const used = new Set();

  for (let i = 0; i < maxCount && used.size < filtered.length; i++) {
    const available = filtered.filter((w) => !used.has(w));
    const word = pickWordFromList(available, filtered, rng);
    if (!word) break;
    used.add(word);
    const tiles = buildShuffledTiles(word, rng);
    sequence.push({ word, tiles });
  }

  return sequence;
};
