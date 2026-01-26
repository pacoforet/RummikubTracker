const app = {
    // --- UTILS ---
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // --- STATE ---
    state: {
        players: [
            { id: 1, name: "Jugador 1", score: 0 },
            { id: 2, name: "Jugador 2", score: 0 }
        ],
        rounds: [],
        settings: {
            targetScore: null,
            rule: 'standard' // 'standard' | 'simple'
        },
        gameActive: false
    },

    // --- INIT ---
    init: function() {
        this.loadGame();
        
        // If game is active, show scoreboard. Else setup.
        if (this.state.gameActive) {
            this.showView('view-scoreboard');
            this.renderScoreboard();
        } else {
            this.showView('view-setup');
            this.renderSetupList();
        }

        // Restore UI settings
        document.getElementById('target-score').value = this.state.settings.targetScore || '';
        this.updateRuleUI(this.state.settings.rule);
    },

    // --- SETUP LOGIC ---
    addPlayer: function() {
        if (this.state.players.length >= 4) return;
        const newId = Date.now();
        this.state.players.push({
            id: newId,
            name: `Jugador ${this.state.players.length + 1}`,
            score: 0
        });
        this.renderSetupList();
        this.saveGame();
    },

    removePlayer: function(index) {
        if (this.state.players.length <= 2) return;
        this.state.players.splice(index, 1);
        this.renderSetupList();
        this.saveGame();
    },

    updatePlayerName: function(index, newName) {
        this.state.players[index].name = newName;
        this.saveGame();
    },

    setRule: function(rule) {
        this.state.settings.rule = rule;
        this.updateRuleUI(rule);
        this.saveGame();
    },

    updateRuleUI: function(rule) {
        document.querySelectorAll('.segment').forEach(el => {
            el.classList.toggle('active', el.dataset.value === rule);
        });
        const desc = document.getElementById('rule-desc');
        desc.textContent = rule === 'standard'
            ? "El ganador suma los puntos de los perdedores. Los perdedores restan sus puntos."
            : "Introduce el cambio de puntuación (+/-) para cada jugador manualmente.";
    },

    startGame: function() {
        const targetInput = document.getElementById('target-score').value;
        this.state.settings.targetScore = targetInput ? parseInt(targetInput) : null;
        this.state.gameActive = true;
        this.state.rounds = [];
        // Reset scores
        this.state.players.forEach(p => p.score = 0);
        
        this.saveGame();
        this.showView('view-scoreboard');
        this.renderScoreboard();
    },

    confirmEndGame: function() {
        if (confirm("¿Estás seguro de que quieres terminar esta partida? Se borrará el historial.")) {
            this.state.gameActive = false;
            this.state.players.forEach(p => p.score = 0);
            this.state.rounds = [];
            this.saveGame();
            this.showView('view-setup');
        }
    },

    // --- SCOREBOARD LOGIC ---
    renderScoreboard: function() {
        // Stats
        document.getElementById('round-display').textContent = this.state.rounds.length + 1;
        document.getElementById('goal-display').textContent = this.state.settings.targetScore || '-';
        document.getElementById('header-title').textContent = this.state.settings.targetScore
            ? `Meta: ${this.state.settings.targetScore}`
            : "Rummikub";

        // Show history button only in scoreboard
        document.getElementById('history-btn').classList.remove('hidden');

        // Leaderboard
        const grid = document.getElementById('leaderboard');
        grid.innerHTML = '';
        
        // Find leader score
        const maxScore = Math.max(...this.state.players.map(p => p.score));
        // Sort players by score for display (optional, but good for leaderboard feel)
        // Let's keep input order but highlight leader.
        
        this.state.players.forEach(p => {
            const isLeader = this.state.rounds.length > 0 && p.score === maxScore && p.score !== 0; // Only leader if score > 0? Or just max.
            
            const card = document.createElement('div');
            card.className = `score-card ${isLeader ? 'leader' : ''}`;
            const safeName = this.escapeHtml(p.name);
            card.innerHTML = `
                <div class="player-avatar">${safeName.charAt(0).toUpperCase()}</div>
                <div class="player-name">${safeName}</div>
                <div class="player-score">${p.score}</div>
            `;
            grid.appendChild(card);
        });
    },

    // --- ROUND ENTRY LOGIC ---
    currentWinnerId: null,
    tileSelections: {}, // {playerId: {1: count, 2: count, ..., 30: count}}
    useManualInput: {}, // {playerId: boolean}

    // Tile grid methods
    initTileSelection: function(playerId) {
        if (!this.tileSelections[playerId]) {
            this.tileSelections[playerId] = {};
        }
        if (this.useManualInput[playerId] === undefined) {
            this.useManualInput[playerId] = false;
        }
    },

    tapTile: function(playerId, value) {
        this.initTileSelection(playerId);
        this.tileSelections[playerId][value] = (this.tileSelections[playerId][value] || 0) + 1;
        this.updateTileDisplay(playerId);
    },

    removeTile: function(playerId, value) {
        this.initTileSelection(playerId);
        if (this.tileSelections[playerId][value] > 0) {
            this.tileSelections[playerId][value]--;
        }
        this.updateTileDisplay(playerId);
    },

    clearTiles: function(playerId) {
        this.tileSelections[playerId] = {};
        this.updateTileDisplay(playerId);
    },

    getTileTotal: function(playerId) {
        const sel = this.tileSelections[playerId] || {};
        let total = 0;
        for (const val in sel) {
            total += parseInt(val) * sel[val];
        }
        return total;
    },

    getTileCount: function(playerId) {
        const sel = this.tileSelections[playerId] || {};
        let count = 0;
        for (const val in sel) {
            count += sel[val];
        }
        return count;
    },

    toggleInputMode: function(playerId) {
        this.useManualInput[playerId] = !this.useManualInput[playerId];
        this.renderRoundInputs();
    },

    updateTileDisplay: function(playerId) {
        const totalEl = document.getElementById(`tile-total-${playerId}`);
        const countEl = document.getElementById(`tile-count-${playerId}`);
        if (totalEl) totalEl.textContent = this.getTileTotal(playerId);
        if (countEl) countEl.textContent = this.getTileCount(playerId);

        // Update tile badges
        for (let v = 1; v <= 13; v++) {
            const badge = document.getElementById(`tile-badge-${playerId}-${v}`);
            const count = (this.tileSelections[playerId] || {})[v] || 0;
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'flex' : 'none';
            }
        }
        // Joker (value 30)
        const jokerBadge = document.getElementById(`tile-badge-${playerId}-30`);
        const jokerCount = (this.tileSelections[playerId] || {})[30] || 0;
        if (jokerBadge) {
            jokerBadge.textContent = jokerCount;
            jokerBadge.style.display = jokerCount > 0 ? 'flex' : 'none';
        }
    },

    renderTileGrid: function(playerId) {
        this.initTileSelection(playerId);
        const sel = this.tileSelections[playerId] || {};

        let tilesHtml = '';
        for (let v = 1; v <= 13; v++) {
            const count = sel[v] || 0;
            tilesHtml += `
                <button class="tile" onclick="app.tapTile(${playerId}, ${v})" oncontextmenu="event.preventDefault(); app.removeTile(${playerId}, ${v})">
                    ${v}
                    <span class="tile-badge" id="tile-badge-${playerId}-${v}" style="display:${count > 0 ? 'flex' : 'none'}">${count}</span>
                </button>
            `;
        }
        // Joker tile (value 30 in Rummikub)
        const jokerCount = sel[30] || 0;
        tilesHtml += `
            <button class="tile tile-joker" onclick="app.tapTile(${playerId}, 30)" oncontextmenu="event.preventDefault(); app.removeTile(${playerId}, 30)">
                J
                <span class="tile-badge" id="tile-badge-${playerId}-30" style="display:${jokerCount > 0 ? 'flex' : 'none'}">${jokerCount}</span>
            </button>
        `;

        return `
            <div class="tile-picker">
                <div class="tile-picker-header">
                    <span class="tile-total-display"><span id="tile-count-${playerId}">${this.getTileCount(playerId)}</span> fichas = <strong id="tile-total-${playerId}">${this.getTileTotal(playerId)}</strong> pts</span>
                    <button class="btn-small" onclick="app.clearTiles(${playerId})">Limpiar</button>
                </div>
                <div class="tile-grid">
                    ${tilesHtml}
                </div>
                <button class="btn-text" onclick="app.toggleInputMode(${playerId})">Usar entrada numérica</button>
            </div>
        `;
    },

    openRoundEntry: function() {
        this.currentWinnerId = null;
        // Reset tile selections for all players
        this.tileSelections = {};
        this.useManualInput = {};
        document.getElementById('modal-round').classList.add('open');
        this.renderRoundInputs();

        const text = this.state.settings.rule === 'standard'
            ? "Selecciona el GANADOR, luego marca las fichas de los perdedores."
            : "Introduce los puntos (+/-) para cada jugador.";
        document.getElementById('round-instruction').textContent = text;
    },

    closeRoundEntry: function() {
        document.getElementById('modal-round').classList.remove('open');
    },

    renderRoundInputs: function() {
        const list = document.getElementById('round-entry-list');
        list.innerHTML = '';

        this.state.players.forEach(p => {
            const div = document.createElement('div');
            div.className = 'round-entry-row';

            let controls = '';

            if (this.state.settings.rule === 'standard') {
                const isWinner = this.currentWinnerId === p.id;
                const useManual = this.useManualInput[p.id];

                if (isWinner) {
                    controls = `
                        <button class="winner-toggle selected" onclick="app.toggleWinner(${p.id})">
                            GANADOR
                        </button>
                    `;
                } else {
                    controls = `
                        <button class="winner-toggle" onclick="app.toggleWinner(${p.id})">
                            Elegir
                        </button>
                    `;
                }

                div.innerHTML = `
                    <div class="round-entry-player">
                        <span class="player-label">${this.escapeHtml(p.name)}</span>
                        ${controls}
                    </div>
                    ${!isWinner ? (useManual
                        ? `<div class="manual-input-row">
                               <input type="number" id="input-${p.id}" class="score-input" placeholder="Puntos" pattern="\\d*">
                               <button class="btn-text" onclick="app.toggleInputMode(${p.id})">Usar fichas</button>
                           </div>`
                        : this.renderTileGrid(p.id)
                    ) : ''}
                `;
            } else {
                div.innerHTML = `
                    <div class="round-entry-player">
                        <span class="player-label">${this.escapeHtml(p.name)}</span>
                    </div>
                    <input type="number" id="input-${p.id}" class="score-input" placeholder="+/-" pattern="[0-9-]*">
                `;
            }

            list.appendChild(div);
        });
    },

    toggleWinner: function(id) {
        this.currentWinnerId = (this.currentWinnerId === id) ? null : id;
        this.renderRoundInputs();
    },

    submitRound: function() {
        const changes = [];

        if (this.state.settings.rule === 'standard') {
            if (!this.currentWinnerId) {
                alert("Por favor, selecciona un ganador.");
                return;
            }

            let winnerSum = 0;

            // Calc losers
            this.state.players.forEach(p => {
                if (p.id !== this.currentWinnerId) {
                    let val;
                    if (this.useManualInput[p.id]) {
                        val = parseInt(document.getElementById(`input-${p.id}`).value) || 0;
                    } else {
                        val = this.getTileTotal(p.id);
                    }
                    const points = -Math.abs(val); // Always negative
                    changes.push({playerId: p.id, points: points });
                    winnerSum += Math.abs(val);
                }
            });
            // Add winner
            changes.push({playerId: this.currentWinnerId, points: winnerSum });

        } else {
            // Simple
            this.state.players.forEach(p => {
                const val = parseInt(document.getElementById(`input-${p.id}`).value) || 0;
                changes.push({playerId: p.id, points: val });
            });
        }

        // Apply changes
        changes.forEach(c => {
            const player = this.state.players.find(p => p.id === c.playerId);
            if (player) player.score += c.points;
        });

        // Save round history
        this.state.rounds.push({
            id: Date.now(),
            changes: changes
        });

        this.saveGame();
        this.closeRoundEntry();
        this.renderScoreboard();

        // Check for winner
        this.checkForWinner();
    },

    checkForWinner: function() {
        if (!this.state.settings.targetScore) return;

        const winner = this.state.players.find(p => p.score >= this.state.settings.targetScore);
        if (winner) {
            this.showWinnerCelebration(winner);
        }
    },

    showWinnerCelebration: function(winner) {
        document.getElementById('winner-name').textContent = this.escapeHtml(winner.name);
        document.getElementById('winner-score').textContent = winner.score;

        // Populate final scores
        const scoresList = document.getElementById('final-scores-list');
        scoresList.innerHTML = '';
        [...this.state.players]
            .sort((a, b) => b.score - a.score)
            .forEach(p => {
                const div = document.createElement('div');
                div.className = 'final-score-row';
                div.innerHTML = `
                    <span>${this.escapeHtml(p.name)}</span>
                    <span>${p.score}</span>
                `;
                scoresList.appendChild(div);
            });

        document.getElementById('modal-winner').classList.add('open');
    },

    closeWinnerModal: function() {
        document.getElementById('modal-winner').classList.remove('open');
    },

    newGameFromWinner: function() {
        this.closeWinnerModal();
        this.confirmEndGame();
    },

    // --- UNDO ---
    undoLastRound: function() {
        if (this.state.rounds.length === 0) {
            alert("No hay rondas para deshacer.");
            return;
        }
        if (!confirm("¿Deshacer la última ronda?")) return;

        const lastRound = this.state.rounds.pop();
        lastRound.changes.forEach(c => {
            const player = this.state.players.find(p => p.id === c.playerId);
            if (player) player.score -= c.points;
        });

        this.saveGame();
        this.renderScoreboard();
    },

    // --- HISTORY ---
    toggleHistory: function() {
        const modal = document.getElementById('modal-history');
        if (modal.classList.contains('open')) {
            modal.classList.remove('open');
        } else {
            modal.classList.add('open');
            this.renderHistoryList();
        }
    },

    renderHistoryList: function() {
        const list = document.getElementById('history-list');
        list.innerHTML = '';
        if (this.state.rounds.length === 0) {
            list.innerHTML = '<p style="text-align:center; color:var(--text-sec);">Sin historial todavía.</p>';
            return;
        }

        // Clone and reverse to show newest first
        [...this.state.rounds].reverse().forEach((round, idx) => {
            const actualRoundNum = this.state.rounds.length - idx;
            const div = document.createElement('div');
            div.className = 'history-item';
            
            let badges = '';
            round.changes.forEach(c => {
                const player = this.state.players.find(p => p.id === c.playerId);
                const pName = player ? this.escapeHtml(player.name.substring(0, 3)) : '???';
                const cls = c.points > 0 ? 'badge-pos' : (c.points < 0 ? 'badge-neg' : '');
                badges += `<div class="score-badge ${cls}">${pName} ${c.points > 0 ? '+' : ''}${c.points}</div>`;
            });

            div.innerHTML = `
                <div class="history-round-num">Ronda ${actualRoundNum}</div>
                <div class="history-badges">${badges}</div>
                <button class="delete-round-btn" onclick="app.deleteRound(${round.id})">&times;</button>
            `;
            list.appendChild(div);
        });
    },

    deleteRound: function(roundId) {
        if (!confirm("¿Eliminar esta ronda? Las puntuaciones se recalcularán.")) return;

        const roundIndex = this.state.rounds.findIndex(r => r.id === roundId);
        if (roundIndex === -1) return;

        // Remove the round
        this.state.rounds.splice(roundIndex, 1);

        // Recalculate all scores from scratch
        this.state.players.forEach(p => p.score = 0);
        this.state.rounds.forEach(round => {
            round.changes.forEach(c => {
                const player = this.state.players.find(p => p.id === c.playerId);
                if (player) player.score += c.points;
            });
        });

        this.saveGame();
        this.renderHistoryList();
        this.renderScoreboard();
    },

    // --- UTILS ---
    renderSetupList: function() {
        const list = document.getElementById('player-setup-list');
        list.innerHTML = '';
        document.getElementById('player-count').textContent = `${this.state.players.length}/4`;
        
        // Disable add button if 4
        const addBtn = document.getElementById('add-player-btn');
        if (this.state.players.length >= 4) addBtn.style.display = 'none';
        else addBtn.style.display = 'block';

        this.state.players.forEach((p, index) => {
            const div = document.createElement('div');
            div.className = 'player-setup-row';
            div.innerHTML = `
                <input type="text" value="${this.escapeHtml(p.name)}" oninput="app.updatePlayerName(${index}, this.value)">
                ${this.state.players.length > 2 ? `<button class="remove-player" onclick="app.removePlayer(${index})">&times;</button>` : ''}
            `;
            list.appendChild(div);
        });
    },

    showView: function(viewId) {
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        
        // Hide history button if in setup
        if (viewId === 'view-setup') {
            document.getElementById('history-btn').classList.add('hidden');
        }
    },

    saveGame: function() {
        localStorage.setItem('rummikub_data', JSON.stringify(this.state));
    },

    loadGame: function() {
        const data = localStorage.getItem('rummikub_data');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                // Merge logic to avoid crashes if structure changed
                this.state = { ...this.state, ...parsed };
            } catch(e) {
                console.error("Archivo de guardado corrupto");
            }
        }
    }
};

// Start
app.init();
