import dicoEasy from '../word-lists/dico_facile.txt?raw';
import animauxWordsText from '../word-lists/animaux.txt?raw';
import animauxFacileWordsText from '../word-lists/animaux_facile.txt?raw';
import couleursWordsText from '../word-lists/couleurs.txt?raw';
import emotionsWordsText from '../word-lists/emotions.txt?raw';
import paysFacileWordsText from '../word-lists/pays_facile.txt?raw';
import paysWordsText from '../word-lists/pays.txt?raw';
import motsAvecWWordsText from '../word-lists/mots_avec_w.txt?raw';
import dicoHard from '../word-lists/dico_difficile.txt?raw';
import hardBonusCheckWordsText from '../word-lists/dico.txt?raw';
import dicoAvecAccents from '../word-lists/dico_avec_accents.txt?raw';

export interface WordListDefinition {
  name: string;
  words: string[];
  bonusCheckWords: string[];
}

export const parseWordsText = (text: string): string[] =>
  text
    .split('\n')
    .map((word) => word.trim().toUpperCase())
    .filter((word) => word.length > 1);

const hardBonusCheckWords = parseWordsText(hardBonusCheckWordsText);
const wordsWithAccents = parseWordsText(dicoAvecAccents);
const easyWords = parseWordsText(dicoEasy);
const hardWords = parseWordsText(dicoHard);
const animauxWords = parseWordsText(animauxWordsText);
const animauxFacileWords = parseWordsText(animauxFacileWordsText);
const couleursWords = parseWordsText(couleursWordsText);
const emotionsWords = parseWordsText(emotionsWordsText);
const paysFacileWords = parseWordsText(paysFacileWordsText);
const paysWords = parseWordsText(paysWordsText);
const motsAvecWWords = parseWordsText(motsAvecWWordsText);

export const WORD_LISTS: Record<string, WordListDefinition> = {
  default: {
    name: 'Général (facile)',
    words: easyWords,
    bonusCheckWords: wordsWithAccents,
  },
  hard: {
    name: 'Général (difficile)',
    words: hardWords,
    bonusCheckWords: hardBonusCheckWords,
  },
  animauxFacile: {
    name: 'Animaux (facile)',
    words: animauxFacileWords,
    bonusCheckWords: animauxFacileWords,
  },
  animaux: {
    name: 'Animaux (difficile)',
    words: animauxWords,
    bonusCheckWords: animauxWords,
  },
  couleurs: {
    name: 'Couleurs',
    words: couleursWords,
    bonusCheckWords: couleursWords,
  },
  emotions: {
    name: 'Émotions',
    words: emotionsWords,
    bonusCheckWords: emotionsWords,
  },
  paysFacile: {
    name: 'Pays (facile)',
    words: paysFacileWords,
    bonusCheckWords: paysFacileWords,
  },
  pays: {
    name: 'Pays (difficile)',
    words: paysWords,
    bonusCheckWords: paysWords,
  },
  motsAvecW: {
    name: 'Mots avec W',
    words: motsAvecWWords,
    bonusCheckWords: motsAvecWWords,
  },
};
