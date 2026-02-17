import dicoEasy from '../word-lists/dico_facile.txt?raw';
import dicoMedium from '../word-lists/dico_moyen.txt?raw';
import animauxWordsText from '../word-lists/animaux.txt?raw';
import couleursWordsText from '../word-lists/couleurs.txt?raw';
import emotionsWordsText from '../word-lists/emotions.txt?raw';
import paysWordsText from '../word-lists/pays.txt?raw';
import motsAvecWWordsText from '../word-lists/mots_avec_w.txt?raw';
import dicoHard from '../word-lists/dico_difficile.txt?raw';
import ODS from '../word-lists/dico.txt?raw';

export const parseWordsText = (text) =>
  text
    .split('\n')
    .map((word) => word.trim().toUpperCase())
    .filter((word) => word.length > 1);

const odsWords = parseWordsText(ODS);
const easyWords = parseWordsText(dicoEasy);
const mediumWords = parseWordsText(dicoMedium);
const hardWords = parseWordsText(dicoHard);
const animauxWords = parseWordsText(animauxWordsText);
const couleursWords = parseWordsText(couleursWordsText);
const emotionsWords = parseWordsText(emotionsWordsText);
const paysWords = parseWordsText(paysWordsText);
const motsAvecWWords = parseWordsText(motsAvecWWordsText);

export const WORD_LISTS = {
  default: {
    name: 'Dictionnaire facile',
    words: easyWords,
    bonusCheckWords: odsWords,
  },
  medium: {
    name: 'Dictionnaire moyen',
    words: mediumWords,
    bonusCheckWords: odsWords,
  },
  ODS9: {
    name: 'Dictionnaire difficile (sans accents)',
    words: hardWords,
    bonusCheckWords: odsWords,
  },
  animaux: {
    name: 'Animaux',
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
  pays: {
    name: 'Pays du monde',
    words: paysWords,
    bonusCheckWords: paysWords,
  },
  motsAvecW: {
    name: 'Mots avec W',
    words: motsAvecWWords,
    bonusCheckWords: motsAvecWWords,
  },
};
