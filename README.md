# Find The Word

`find_the_word` is a React-based word game where players must rebuild a scrambled word before time runs out.

## Game Concept

The game displays one word at a time as shuffled letter tiles.  
The player drags letters into the correct order to recover the original word.

The objective is to find as many words as possible before the timer reaches zero.

## Word Sources

The game supports:

- Built-in word lists (general, animals, colors, emotions, dictionary list).
- Custom `.txt` import (one word per line).

## Controls and Interaction

- Desktop: drag-and-drop letter tiles.
- Mobile: touch drag behavior for tile reordering.
- Immediate validation after drag/touch end.

## Stats Shown During Play

- Time remaining
- Words found
- Score
