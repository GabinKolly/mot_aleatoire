import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Upload, Play, RotateCcw, Settings } from 'lucide-react';
import defaultWordsText from './word-lists/default.txt?raw';
import animauxWordsText from './word-lists/animaux.txt?raw';
import couleursWordsText from './word-lists/couleurs.txt?raw';
import emotionsWordsText from './word-lists/emotions.txt?raw';
import paysWordsText from './word-lists/pays.txt?raw';
import dicoFilteredText from './word-lists/dico_filtered.txt?raw';
import ODS from './word-lists/dico.txt?raw';

// ============================================================================
// WORD LISTS CONFIGURATION
// ============================================================================
// Parse text files where each line is a word.
const parseWordsText = (text) =>
  text
    .split('\n')
    .map((word) => word.trim().toUpperCase())
    .filter((word) => word.length > 1);

// To add a new list: create a .txt file and reference it here.
const WORD_LISTS = {
  default: {
    name: 'Liste générale',
    words: parseWordsText(defaultWordsText)
  },
  animaux: {
    name: 'Animaux',
    words: parseWordsText(animauxWordsText)
  },
  couleurs: {
    name: 'Couleurs',
    words: parseWordsText(couleursWordsText)
  },
  emotions: {
    name: 'Émotions',
    words: parseWordsText(emotionsWordsText)
  },
  ODS9: {
    name: 'Dictionnaire',
    words: parseWordsText(dicoFilteredText)
  },
  pays: {
    name: 'Pays du monde',
    words: parseWordsText(paysWordsText)
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Check if a scrambled word can be solved by moving just one letter
const canBeSolvedWithOneMove = (shuffled, original) => {
  const shuffledArray = shuffled.split('');
  
  for (let i = 0; i < shuffledArray.length; i++) {
    const letter = shuffledArray[i];
    const withoutLetter = [...shuffledArray.slice(0, i), ...shuffledArray.slice(i + 1)];
    
    for (let j = 0; j <= withoutLetter.length; j++) {
      const newArrangement = [...withoutLetter.slice(0, j), letter, ...withoutLetter.slice(j)];
      if (newArrangement.join('') === original) {
        return true;
      }
    }
  }
  return false;
};

// Calculate tile size based on screen width and number of letters
const calculateTileSize = (screenWidth, numLetters) => {
  const usableWidth = screenWidth;
  const calculatedSize = Math.min(100, Math.floor((usableWidth / numLetters) / 1.2));
  return {
    size: calculatedSize,
    fontSize: Math.max(10, Math.floor(calculatedSize * 0.42))
  };
};

// Shuffle letters with validation
const shuffleWord = (word) => {
  const letters = word.split('');
  let shuffled = [...letters];
  let attempts = 0;
  do {
    for (let i = 0; i < 10; i++){
      shuffled.sort(() => Math.random() - 0.5);
    }
    attempts++;
    
    const shuffledWord = shuffled.join('');
    
    if (shuffledWord === word) continue;
    
    if (word.length >= 5 && canBeSolvedWithOneMove(shuffledWord, word)) {
      continue;
    }
    
    break;
  } while (attempts < 100);
  
  return shuffled;
};

const BLACK_BUTTON_STYLE = Object.freeze({
  backgroundColor: '#000000',
  color: '#ffffff',
  border: '1px solid #000000'
});

const BlackButton = ({ className = '', style = {}, children, ...props }) => (
  <button
    {...props}
    className={className}
    style={{ ...BLACK_BUTTON_STYLE, ...style }}
  >
    {children}
  </button>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ScrabbleTrainer() {
  // Game state
  const [allWords, setAllWords] = useState(WORD_LISTS.default.words);
  const [currentWord, setCurrentWord] = useState('');
  const [tiles, setTiles] = useState([]);
  const [usedWords, setUsedWords] = useState([]);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isBonusWord, setIsBonusWord] = useState(false);
  
  // Game stats
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [wordsFound, setWordsFound] = useState(0);
  
  // Game status
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [allWordsCompleted, setAllWordsCompleted] = useState(false);
  
  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [wordListName, setWordListName] = useState(WORD_LISTS.default.name);
  const [selectedPreset, setSelectedPreset] = useState('default');
  const [startTime, setStartTime] = useState(45);
  const [startTimeInput, setStartTimeInput] = useState('45');
  const [bonusTime, setBonusTime] = useState(30);
  const [bonusTimeInput, setBonusTimeInput] = useState('30');
  const [alternativeWordBonusTime, setAlternativeWordBonusTime] = useState(5);
  const [alternativeWordBonusTimeInput, setAlternativeWordBonusTimeInput] = useState('5');
  const [minWordLength, setMinWordLength] = useState(3);
  const [minWordLengthInput, setMinWordLengthInput] = useState('3');
  const [maxWordLength, setMaxWordLength] = useState(9);
  const [maxWordLengthInput, setMaxWordLengthInput] = useState('9');
  
  // UI state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [touchDragPosition, setTouchDragPosition] = useState(null);
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 400);
  
  const fileInputRef = useRef(null);
  const bonusAwardedWordsRef = useRef(new Set());
  const words = useMemo(
    () => allWords.filter((word) => word.length >= minWordLength && word.length <= maxWordLength),
    [allWords, minWordLength, maxWordLength]
  );
  const wordsSet = useMemo(() => new Set(words), [words]);
  const clearDragState = () => {
    setDraggedIndex(null);
    setTouchDragPosition(null);
  };

  // ============================================================================
  // GAME LOGIC
  // ============================================================================

  const resetGameState = () => {
    clearDragState();
    setIsPlaying(false);
    setGameOver(false);
    setAllWordsCompleted(false);
    setUsedWords([]);
    setScore(0);
    setWordsFound(0);
    setTimeLeft(0);
    setCurrentWord('');
    setIsCorrect(false);
    setIsBonusWord(false);
    bonusAwardedWordsRef.current = new Set();
  };

  const startGame = () => {
    clearDragState();
    setTimeLeft(startTime);
    setScore(0);
    setWordsFound(0);
    setIsPlaying(true);
    setUsedWords([]);
    setGameOver(false);
    setAllWordsCompleted(false);
    setCurrentWord('');
    setIsCorrect(false);
    setIsBonusWord(false);
    bonusAwardedWordsRef.current = new Set();
  };

  const giveUp = () => {
    clearDragState();
    setIsPlaying(false);
    setGameOver(true);
  };

  const pickNewWord = () => {
    const availableWords = words.filter(w => !usedWords.includes(w));
    
    if (availableWords.length === 0) {
      clearDragState();
      setIsPlaying(false);
      setAllWordsCompleted(true);
      return;
    }

    let word;
    if (words.length >= 500) {
      // Pick a word length uniformly (among lengths that still have words),
      // then pick a random word within that length bucket.
      const wordsByLength = availableWords.reduce((acc, candidate) => {
        const len = candidate.length;
        if (!acc[len]) acc[len] = [];
        acc[len].push(candidate);
        return acc;
      }, {});

      const availableLengths = Object.keys(wordsByLength).map(Number);
      const chosenLength = availableLengths[Math.floor(Math.random() * availableLengths.length)];
      const lengthBucket = wordsByLength[chosenLength];
      word = lengthBucket[Math.floor(Math.random() * lengthBucket.length)];
    } else {
      word = availableWords[Math.floor(Math.random() * availableWords.length)];
    }

    setCurrentWord(word);
    setUsedWords(prev => [...prev, word]);
    bonusAwardedWordsRef.current = new Set();
    
    const shuffled = shuffleWord(word);
    setTiles(shuffled.map((letter, index) => ({ letter, id: index })));
    setIsCorrect(false);
    setIsBonusWord(false);
  };

  const checkWord = () => {
    const currentTileWord = tiles.map(t => t.letter).join('');
    if (currentTileWord === currentWord && currentWord.length > 0) {
      setIsCorrect(true);
      setIsBonusWord(false);
      setWordsFound(prev => prev + 1);
      setScore(prev => prev + currentWord.length);
      setTimeLeft(prev => prev + bonusTime);
      setTimeout(() => pickNewWord(), 800);
      return;
    }

    if (
      currentWord.length > 0 &&
      currentTileWord !== currentWord &&
      wordsSet.has(currentTileWord) &&
      !bonusAwardedWordsRef.current.has(currentTileWord)
    ) {
      setIsBonusWord(true);
      setTimeLeft(prev => prev + alternativeWordBonusTime);
      bonusAwardedWordsRef.current.add(currentTileWord);
      setTimeout(() => setIsBonusWord(false), 450);
    }
  };

  // ============================================================================
  // WORD LIST MANAGEMENT
  // ============================================================================

  const changeWordList = (newWords, newName, newPreset = 'custom') => {
    setAllWords(newWords);
    setWordListName(newName);
    setSelectedPreset(newPreset);
    resetGameState();
  };

  const handlePresetChange = (presetKey) => {
    const list = WORD_LISTS[presetKey];
    changeWordList(list.words, list.name, presetKey);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const wordList = text
        .split('\n')
        .map(w => w.trim().toUpperCase())
        .filter(w => w.length > 0);
      
      if (wordList.length > 0) {
        changeWordList(wordList, file.name, 'custom');
      }
    };
    reader.readAsText(file);
  };

  const handleMinWordLengthChange = (value) => {
    setMinWordLengthInput(value);
    if (value === '') return;

    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return;

    const nextMin = Math.max(2, parsed);
    setMinWordLength(nextMin);
    setMinWordLengthInput(String(nextMin));
    setMaxWordLength((prevMax) => {
      const nextMax = Math.max(prevMax, nextMin);
      setMaxWordLengthInput(String(nextMax));
      return nextMax;
    });
    resetGameState();
  };

  const handleMaxWordLengthChange = (value) => {
    setMaxWordLengthInput(value);
    if (value === '') return;

    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return;

    const nextMax = Math.max(2, parsed, minWordLength);
    setMaxWordLength(nextMax);
    setMaxWordLengthInput(String(nextMax));
    resetGameState();
  };

  // ============================================================================
  // DRAG AND DROP HANDLERS
  // ============================================================================

  const handleDragStart = (index) => setDraggedIndex(index);

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newTiles = [...tiles];
    const draggedTile = newTiles[draggedIndex];
    newTiles.splice(draggedIndex, 1);
    newTiles.splice(index, 0, draggedTile);
    
    setTiles(newTiles);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    clearDragState();
    checkWord();
  };

  const handleTouchStart = (e, index) => {
    const touch = e.touches[0];
    if (!touch) return;

    setDraggedIndex(index);
    setTouchDragPosition({
      x: touch.clientX,
      y: touch.clientY
    });
  };

  const handleTouchMove = (e) => {
    if (draggedIndex === null) return;

    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;

    setTouchDragPosition((prev) =>
      prev
        ? {
            ...prev,
            x: touch.clientX,
            y: touch.clientY
          }
        : null
    );

    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    const tileElement = elements.find(el => el.dataset.tileIndex);
    
    if (tileElement) {
      const targetIndex = parseInt(tileElement.dataset.tileIndex);
      if (targetIndex !== draggedIndex) {
        const newTiles = [...tiles];
        const draggedTile = newTiles[draggedIndex];
        newTiles.splice(draggedIndex, 1);
        newTiles.splice(targetIndex, 0, draggedTile);
        
        setTiles(newTiles);
        setDraggedIndex(targetIndex);
      }
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isPlaying) {
      clearDragState();
      setIsPlaying(false);
      setGameOver(true);
    }
  }, [timeLeft, isPlaying]);

  useEffect(() => {
    if (isPlaying && usedWords.length === 0 && currentWord === '') {
      pickNewWord();
    }
  }, [isPlaying, usedWords]);

  useEffect(() => {
    const updateWidth = () => setScreenWidth(window.innerWidth);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderStatsPanel = () => (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-emerald-50 p-4 rounded-lg text-center">
        <div className="text-3xl font-bold text-emerald-700">
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
        <div className="text-sm text-gray-600 mt-1">Temps restant</div>
      </div>
      <div className="bg-blue-50 p-4 rounded-lg text-center">
        <div className="text-3xl font-bold text-blue-700">{wordsFound}</div>
        <div className="text-sm text-gray-600 mt-1">Mots trouvés</div>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg text-center">
        <div className="text-3xl font-bold text-purple-700">{score}</div>
        <div className="text-sm text-gray-600 mt-1">Score</div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg text-black">
      <h2 className="text-lg font-semibold mb-4 text-black">Paramètres</h2>
      
      <div className="mb-6 pb-6">
        <h3 className="text-md font-medium mb-3 text-black">Temps de jeu</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-black mb-1">
              Temps de départ (secondes)
            </label>
            <input
              type="number"
              min="30"
              max="300"
              value={startTimeInput}
              onChange={(e) => {
                const { value } = e.target;
                setStartTimeInput(value);
                if (value === '') return;
                const parsed = parseInt(value, 10);
                if (Number.isNaN(parsed)) return;
                const next = Math.min(300, Math.max(30, parsed));
                setStartTime(next);
              }}
              onBlur={() => {
                if (startTimeInput === '') {
                  setStartTimeInput(String(startTime));
                  return;
                }
                const parsed = parseInt(startTimeInput, 10);
                if (Number.isNaN(parsed)) {
                  setStartTimeInput(String(startTime));
                  return;
                }
                const next = Math.min(300, Math.max(30, parsed));
                setStartTime(next);
                setStartTimeInput(String(next));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-black mb-1">
              Bonus par mot (secondes)
            </label>
            <input
              type="number"
              min="5"
              max="60"
              value={bonusTimeInput}
              onChange={(e) => {
                const { value } = e.target;
                setBonusTimeInput(value);
                if (value === '') return;
                const parsed = parseInt(value, 10);
                if (Number.isNaN(parsed)) return;
                const next = Math.min(60, Math.max(5, parsed));
                setBonusTime(next);
              }}
              onBlur={() => {
                if (bonusTimeInput === '') {
                  setBonusTimeInput(String(bonusTime));
                  return;
                }
                const parsed = parseInt(bonusTimeInput, 10);
                if (Number.isNaN(parsed)) {
                  setBonusTimeInput(String(bonusTime));
                  return;
                }
                const next = Math.min(60, Math.max(5, parsed));
                setBonusTime(next);
                setBonusTimeInput(String(next));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-black mb-1">
              Bonus mot alternatif (secondes)
            </label>
            <input
              type="number"
              min="0"
              max="30"
              value={alternativeWordBonusTimeInput}
              onChange={(e) => {
                const { value } = e.target;
                setAlternativeWordBonusTimeInput(value);
                if (value === '') return;
                const parsed = parseInt(value, 10);
                if (Number.isNaN(parsed)) return;
                const next = Math.min(30, Math.max(0, parsed));
                setAlternativeWordBonusTime(next);
              }}
              onBlur={() => {
                if (alternativeWordBonusTimeInput === '') {
                  setAlternativeWordBonusTimeInput(String(alternativeWordBonusTime));
                  return;
                }
                const parsed = parseInt(alternativeWordBonusTimeInput, 10);
                if (Number.isNaN(parsed)) {
                  setAlternativeWordBonusTimeInput(String(alternativeWordBonusTime));
                  return;
                }
                const next = Math.min(30, Math.max(0, parsed));
                setAlternativeWordBonusTime(next);
                setAlternativeWordBonusTimeInput(String(next));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="mb-6 pb-6">
        <h3 className="text-md font-medium mb-3 text-black">Longueur des mots</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-black mb-1">
              Longueur minimale
            </label>
            <input
              type="number"
              min="2"
              value={minWordLengthInput}
              onChange={(e) => handleMinWordLengthChange(e.target.value)}
              onBlur={() => {
                if (minWordLengthInput === '') {
                  setMinWordLengthInput(String(minWordLength));
                } else {
                  setMinWordLengthInput(String(minWordLength));
                  setMaxWordLengthInput(String(maxWordLength));
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-black mb-1">
              Longueur maximale
            </label>
            <input
              type="number"
              min={minWordLength}
              value={maxWordLengthInput}
              onChange={(e) => handleMaxWordLengthChange(e.target.value)}
              onBlur={() => setMaxWordLengthInput(String(maxWordLength))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <h3 className="text-md font-medium mb-3 text-black">Liste de mots</h3>
      <p className="text-sm text-black mb-4">
        Liste actuelle: {wordListName} ({words.length} mots disponibles)
      </p>
      
      <div className="space-y-3 mb-4">
        <p className="text-sm font-medium text-black">Listes prédéfinies:</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(WORD_LISTS).map(([key, list]) => (
            <button
              key={key}
              onClick={() => handlePresetChange(key)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{
                backgroundColor: selectedPreset === key ? '#059669' : '#6b7280',
                borderColor: selectedPreset === key ? '#059669' : '#6b7280',
                borderWidth: '1px',
                borderStyle: 'solid'
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
          onChange={handleFileUpload}
          className="hidden"
        />
        <BlackButton
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Importer un fichier .txt
        </BlackButton>
        <p className="text-xs text-black mt-2">
          Format: un mot par ligne
        </p>
      </div>
    </div>
  );

  const renderGameplay = () => {
    const { size: tileSize, fontSize } = calculateTileSize(screenWidth, tiles.length);

    return (
      <div className="space-y-6">
        <div className="relative left-1/2 w-screen -translate-x-1/2 bg-amber-50 py-4 text-center">
          <div className="flex justify-center gap-1 overflow-x-auto pb-2">
            {tiles.map((tile, index) => (
              <div
                key={tile.id}
                data-tile-index={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onTouchStart={(e) => handleTouchStart(e, index)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleDragEnd}
                onTouchCancel={handleDragEnd}
                className={`border-2 rounded-lg flex items-center justify-center font-bold cursor-move select-none shadow-md hover:shadow-lg transition-all flex-shrink-0 ${
                  isCorrect 
                    ? 'bg-green-400 border-green-500 text-white scale-110' 
                    : isBonusWord
                      ? 'bg-yellow-300 border-yellow-500 text-yellow-900 scale-105'
                      : 'bg-amber-100 border-amber-300 text-amber-900'
                } ${
                  draggedIndex === index && touchDragPosition ? 'opacity-0' : draggedIndex === index ? 'opacity-50' : ''
                }`}
                style={{
                  width: `${tileSize}px`,
                  height: `${tileSize}px`,
                  fontSize: `${fontSize}px`,
                  touchAction: 'none'
                }}
              >
                {tile.letter}
              </div>
            ))}
          </div>
          {touchDragPosition &&
            draggedIndex !== null &&
            tiles[draggedIndex] &&
            typeof document !== 'undefined' &&
            createPortal(
              <div
                className={`fixed border-2 rounded-lg flex items-center justify-center font-bold select-none shadow-xl z-50 pointer-events-none ${
                  isCorrect
                    ? 'bg-green-400 border-green-500 text-white scale-110'
                    : isBonusWord
                      ? 'bg-yellow-300 border-yellow-500 text-yellow-900 scale-105'
                      : 'bg-amber-100 border-amber-300 text-amber-900'
                }`}
                style={{
                  width: `${tileSize}px`,
                  height: `${tileSize}px`,
                  fontSize: `${fontSize}px`,
                  left: `${touchDragPosition.x - tileSize / 2}px`,
                  top: `${touchDragPosition.y - tileSize / 2}px`
                }}
              >
                {tiles[draggedIndex].letter}
              </div>,
              document.body
            )}
        </div>
        <div className="text-center">
          <BlackButton
            onClick={giveUp}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Abandonner
          </BlackButton>
        </div>
      </div>
    );
  };

  const renderGameOverScreen = () => (
    <div className="text-center py-12">
      <div className="mb-6">
        <p className="text-xl text-gray-700 mb-2">
          Le mot était <span className="font-bold text-emerald-700">{currentWord}</span>
        </p>
        <p className="text-2xl font-bold text-purple-700">
          Vous avez obtenu un score de {score} !
        </p>
      </div>
      <BlackButton
        onClick={startGame}
        className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white text-xl font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg"
      >
        <RotateCcw className="w-6 h-6" />
        Recommencer
      </BlackButton>
    </div>
  );

  const renderVictoryScreen = () => (
    <div className="text-center py-12">
      <div className="mb-6">
        <p className="text-2xl text-emerald-700 font-bold mb-4">
          Vous avez trouvé tous les mots !
        </p>
        <p className="text-2xl font-bold text-purple-700">
          Votre score est {score} !
        </p>
      </div>
      <BlackButton
        onClick={startGame}
        className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white text-xl font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg"
      >
        <Play className="w-6 h-6" />
        Nouvelle partie
      </BlackButton>
    </div>
  );

  const renderStartScreen = () => (
    <div className="text-center py-12">
      <BlackButton
        onClick={startGame}
        className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white text-xl font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg"
      >
        <Play className="w-6 h-6" />
        Commencer
      </BlackButton>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="w-full">
        <div className="bg-white rounded-b-xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-emerald-800">Mot mélangé</h1>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {showSettings && renderSettings()}
          {renderStatsPanel()}

          {!isPlaying && !gameOver && !allWordsCompleted && renderStartScreen()}
          {!isPlaying && gameOver && renderGameOverScreen()}
          {!isPlaying && allWordsCompleted && renderVictoryScreen()}
          {isPlaying && renderGameplay()}
        </div>
      </div>
    </div>
  );
}
