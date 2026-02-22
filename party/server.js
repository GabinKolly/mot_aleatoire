const DEFAULT_CONFIG = {
  gameTime: 180,
  wordTime: 30,
  minWordLength: 4,
  maxWordLength: 7,
};

export default class GameRoom {
  constructor(room) {
    this.room = room;
    this.players = new Map();
    this.hostId = null;
    this.status = 'waiting';
    this.config = { ...DEFAULT_CONFIG };
    this.wordListKey = 'default';
    this.seed = 0;
    this.currentWordIndex = 0;
    this.claimedWords = new Set();
    this.gameTimeLeft = 0;
    this.wordTimeLeft = 0;
    this.timerInterval = null;
    this.transitioning = false;
    this.transitionTimeout = null;
  }

  broadcast(message) {
    const data = JSON.stringify(message);
    for (const conn of this.room.getConnections()) {
      conn.send(data);
    }
  }

  sendTo(connectionId, message) {
    const conn = this.room.getConnection(connectionId);
    if (conn) {
      conn.send(JSON.stringify(message));
    }
  }

  getPlayerList() {
    return Array.from(this.players.entries()).map(([id, player]) => ({
      id,
      name: player.name,
      number: player.number,
      score: player.score,
      wordsFound: player.wordsFound,
    }));
  }

  broadcastRoomState() {
    this.broadcast({
      type: 'ROOM_STATE',
      players: this.getPlayerList(),
      hostId: this.hostId,
      config: this.config,
      wordListKey: this.wordListKey,
      status: this.status,
    });
  }

  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => this.tick(), 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }
    this.transitioning = false;
  }

  tick() {
    if (this.status !== 'playing') {
      this.stopTimer();
      return;
    }

    this.gameTimeLeft -= 1;

    if (!this.transitioning) {
      this.wordTimeLeft -= 1;
    }

    if (this.gameTimeLeft <= 0) {
      this.endGame();
      return;
    }

    if (this.wordTimeLeft <= 0 && !this.transitioning) {
      this.transitioning = true;
      this.broadcast({
        type: 'WORD_SKIPPED',
        wordIndex: this.currentWordIndex,
      });
      this.transitionTimeout = setTimeout(() => {
        this.transitioning = false;
        this.transitionTimeout = null;
        if (this.status === 'playing') {
          this.advanceWord(null);
          this.broadcast({
            type: 'TIMER_SYNC',
            gameTimeLeft: this.gameTimeLeft,
            wordTimeLeft: this.wordTimeLeft,
          });
        }
      }, 1500);
    }

    this.broadcast({
      type: 'TIMER_SYNC',
      gameTimeLeft: this.gameTimeLeft,
      wordTimeLeft: this.wordTimeLeft,
    });
  }

  advanceWord(claimedByPlayerNumber) {
    this.currentWordIndex += 1;
    this.wordTimeLeft = this.config.wordTime;

    this.broadcast({
      type: 'NEXT_WORD',
      wordIndex: this.currentWordIndex,
      gameTimeLeft: this.gameTimeLeft,
      wordTimeLeft: this.wordTimeLeft,
      skipped: claimedByPlayerNumber === null,
    });
  }

  endGame({ winnerOverride = null, endReason = 'score', forfeitedBy = null } = {}) {
    this.status = 'gameOver';
    this.stopTimer();

    const players = this.getPlayerList();
    let winner = winnerOverride;
    if (winner === null) {
      if (players.length === 2) {
        if (players[0].score > players[1].score) {
          winner = players[0].number;
        } else if (players[1].score > players[0].score) {
          winner = players[1].number;
        }
      } else if (players.length === 1) {
        winner = players[0].number;
      }
    }

    this.broadcast({
      type: 'GAME_OVER',
      scores: Object.fromEntries(
        players.map((p) => [p.number, { score: p.score, wordsFound: p.wordsFound, name: p.name }])
      ),
      winner,
      endReason,
      forfeitedBy,
    });
  }

  onConnect(connection) {
    if (this.players.size >= 2) {
      connection.send(JSON.stringify({ type: 'ROOM_FULL' }));
      connection.close();
      return;
    }

    const playerNumber = this.players.size === 0 ? 1 : 2;
    this.players.set(connection.id, {
      name: `Joueur ${playerNumber}`,
      number: playerNumber,
      score: 0,
      wordsFound: 0,
    });

    if (playerNumber === 1) {
      this.hostId = connection.id;
    }

    this.sendTo(connection.id, {
      type: 'WELCOME',
      playerNumber,
      roomId: this.room.id,
    });

    this.broadcastRoomState();
  }

  onClose(connection) {
    const player = this.players.get(connection.id);
    this.players.delete(connection.id);

    if (this.status === 'playing' && player) {
      const remainingPlayer = Array.from(this.players.values())[0];
      this.endGame({
        winnerOverride: remainingPlayer?.number ?? null,
        endReason: 'forfeit',
        forfeitedBy: player.number,
      });
      return;
    }

    if (this.players.size > 0 && connection.id === this.hostId) {
      const [newHostId] = this.players.keys();
      this.hostId = newHostId;
    }

    this.broadcast({
      type: 'PLAYER_DISCONNECTED',
      playerNumber: player?.number,
    });
    this.broadcastRoomState();
  }

  onMessage(message, sender) {
    let data;
    try {
      data = JSON.parse(typeof message === 'string' ? message : message.toString());
    } catch {
      return;
    }

    const player = this.players.get(sender.id);
    if (!player) return;

    switch (data.type) {
      case 'JOIN':
        player.name = (data.playerName || `Joueur ${player.number}`).slice(0, 20);
        this.broadcastRoomState();
        break;

      case 'UPDATE_CONFIG':
        if (sender.id !== this.hostId || this.status !== 'waiting') break;
        if (data.config) {
          this.config = {
            gameTime: Math.max(30, Math.min(600, data.config.gameTime ?? this.config.gameTime)),
            wordTime: Math.max(10, Math.min(120, data.config.wordTime ?? this.config.wordTime)),
            minWordLength: Math.max(2, Math.min(15, data.config.minWordLength ?? this.config.minWordLength)),
            maxWordLength: Math.max(2, Math.min(15, data.config.maxWordLength ?? this.config.maxWordLength)),
          };
        }
        if (data.wordListKey) {
          this.wordListKey = data.wordListKey;
        }
        this.broadcastRoomState();
        break;

      case 'START_GAME':
        if (sender.id !== this.hostId) break;
        if (this.players.size < 2 || this.status !== 'waiting') break;

        this.status = 'playing';
        this.seed = Math.floor(Math.random() * 2147483647);
        this.currentWordIndex = 0;
        this.claimedWords = new Set();
        this.gameTimeLeft = this.config.gameTime;
        this.wordTimeLeft = this.config.wordTime;

        for (const p of this.players.values()) {
          p.score = 0;
          p.wordsFound = 0;
        }

        this.broadcast({
          type: 'GAME_STARTED',
          seed: this.seed,
          config: this.config,
          wordListKey: this.wordListKey,
        });

        this.startTimer();
        break;

      case 'WORD_FOUND': {
        if (this.status !== 'playing') break;
        if (this.transitioning) break;

        const wordIndex = data.wordIndex;
        if (typeof wordIndex !== 'number' || wordIndex !== this.currentWordIndex) break;
        if (this.claimedWords.has(wordIndex)) break;

        this.claimedWords.add(wordIndex);
        player.score += data.wordLength || 0;
        player.wordsFound += 1;
        this.transitioning = true;

        this.broadcast({
          type: 'WORD_CLAIMED',
          wordIndex,
          playerNumber: player.number,
          scores: Object.fromEntries(
            Array.from(this.players.values()).map((p) => [
              p.number,
              { score: p.score, wordsFound: p.wordsFound, name: p.name },
            ])
          ),
        });

        this.transitionTimeout = setTimeout(() => {
          this.transitioning = false;
          this.transitionTimeout = null;
          if (this.status === 'playing') {
            this.advanceWord(player.number);
            this.broadcast({
              type: 'TIMER_SYNC',
              gameTimeLeft: this.gameTimeLeft,
              wordTimeLeft: this.wordTimeLeft,
            });
          }
        }, 1500);
        break;
      }

      case 'FORFEIT':
        if (this.status !== 'playing') break;
        this.endGame({
          winnerOverride:
            Array.from(this.players.values()).find((p) => p.number !== player.number)?.number ?? null,
          endReason: 'forfeit',
          forfeitedBy: player.number,
        });
        break;

      case 'PLAY_AGAIN':
        if (this.status !== 'gameOver') break;
        this.status = 'waiting';
        this.currentWordIndex = 0;
        this.claimedWords = new Set();
        this.gameTimeLeft = 0;
        this.wordTimeLeft = 0;
        for (const p of this.players.values()) {
          p.score = 0;
          p.wordsFound = 0;
        }
        this.broadcastRoomState();
        break;
    }
  }
}
