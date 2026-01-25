const app = {
    // --- STATE ---
    state: {
        players: [
            { id: 1, name: "Player 1", score: 0 },
            { id: 2, name: "Player 2", score: 0 }
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
            name: `Player ${this.state.players.length + 1}`,
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
            ? "Winner gets sum of losers. Losers get negative points."
            : "Enter raw score change (+/-) for each player manually.";
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
        if (confirm("Are you sure you want to end this game? History will be cleared.")) {
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
            ? `Target: ${this.state.settings.targetScore}` 
            : "Rummikub Tracker";

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
            card.innerHTML = "
                <div class=\"player-avatar\">${p.name.charAt(0).toUpperCase()}</div>
                <div class=\"player-name\">${p.name}</div>
                <div class=\"player-score\">${p.score}</div>
            ";
            grid.appendChild(card);
        });
    },

    // --- ROUND ENTRY LOGIC ---
    currentWinnerId: null,

    openRoundEntry: function() {
        this.currentWinnerId = null;
        document.getElementById('modal-round').classList.add('open');
        this.renderRoundInputs();
        
        const text = this.state.settings.rule === 'standard' 
            ? "Tap the WINNER, then enter positive tile count for losers." 
            : "Enter the points (+/-) for each player.";
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
                controls = `
                    <button class="winner-toggle ${isWinner ? 'selected' : ''}" onclick="app.toggleWinner(${p.id})">
                        ${isWinner ? 'WINNER' : 'Select'}
                    </button>
                    ${!isWinner ? `<input type="number" id="input-${p.id}" class="score-input" placeholder="Tiles" pattern="\\d*">` : ''}
                `;
            } else {
                controls = `<input type="number" id="input-${p.id}" class="score-input" placeholder="+/-" pattern="[0-9-]*">`;
            }

            div.innerHTML = "
                <span style=\"font-weight:600; font-size:14px;">${p.name}</span>
                <div style=\"display:flex; align-items:center; gap:10px;">${controls}</div>
            ";
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
                alert("Please select a winner.");
                return;
            }

            let winnerSum = 0;
            
            // Calc losers
            this.state.players.forEach(p => {
                if (p.id !== this.currentWinnerId) {
                    const val = parseInt(document.getElementById(`input-${p.id}`).value) || 0;
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
            list.innerHTML = '<p style="text-align:center; color:var(--text-sec);">No history yet.</p>';
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
                const pName = player ? player.name.substring(0, 3) : '???';
                const cls = c.points > 0 ? 'badge-pos' : (c.points < 0 ? 'badge-neg' : '');
                badges += `<div class="score-badge ${cls}">${pName} ${c.points > 0 ? '+' : ''}${c.points}</div>`;
            });

            div.innerHTML = "
                <div class=\"history-round-num\">Round ${actualRoundNum}</div>
                <div class=\"history-badges\">${badges}</div>
            ";
            list.appendChild(div);
        });
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
            div.innerHTML = "
                <input type=\"text\" value=\"${p.name}\" oninput=\"app.updatePlayerName(${index}, this.value)">
                ${this.state.players.length > 2 ? `<button class=\"remove-player\" onclick=\"app.removePlayer(${index})\" >&times;</button>` : ''}
            ";
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
                console.error("Save file corrupted");
            }
        }
    }
};

// Start
app.init();
