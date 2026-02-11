/* ========================================
   MATH ISLAND - UI Manager
   Handles all screen transitions and DOM updates
   ======================================== */

class UIManager {
    constructor(game) {
        this.game = game;
        this.screens = {
            menu: document.getElementById('main-menu'),
            characterSelect: document.getElementById('character-select'),
            levelSelect: document.getElementById('level-select'),
            hud: document.getElementById('game-hud'),
            complete: document.getElementById('level-complete'),
            settings: document.getElementById('settings-screen')
        };

        this.currentScreen = 'menu';
        this.selectedCharIndex = 0;
        this.selectedLevelIndex = 0;
        this.selectedAnswerIndex = 0;
        this.focusableElements = [];

        this._initCharacterGrid();
        this._initEventListeners();
        this._applySettings();
    }

    // ---- Screen Management ----

    showScreen(name) {
        // Hide all
        Object.values(this.screens).forEach(s => {
            s.classList.remove('active');
        });

        // Show target
        if (this.screens[name]) {
            this.screens[name].classList.add('active');
            this.currentScreen = name;
        }
    }

    // ---- Character Select ----

    _initCharacterGrid() {
        const grid = document.getElementById('character-grid');
        grid.innerHTML = '';

        Characters.roster.forEach((char, index) => {
            const card = document.createElement('div');
            card.className = `character-card ${char.unlocked ? '' : 'locked'}`;
            card.style.background = `linear-gradient(180deg, ${char.bgGradient[0]}, ${char.bgGradient[1]})`;
            card.setAttribute('tabindex', '0');
            card.setAttribute('data-char-id', char.id);
            card.setAttribute('data-index', index);

            card.innerHTML = `
                <div class="char-avatar">${char.emoji}</div>
                <div class="char-card-name">${char.name.split(' ')[0]}</div>
            `;

            card.addEventListener('focus', () => this._onCharacterFocus(index));
            card.addEventListener('click', () => this._onCharacterClick(index));

            grid.appendChild(card);
        });
    }

    _onCharacterFocus(index) {
        this.selectedCharIndex = index;
        const char = Characters.roster[index];

        document.getElementById('char-name').textContent = char.name;
        document.getElementById('char-desc').textContent =
            char.unlocked ? char.description : `Unlocked at Level ${char.unlockLevel}`;

        // Update visual selection
        document.querySelectorAll('.character-card').forEach((c, i) => {
            c.classList.toggle('selected', i === index);
        });

        audio.playNavigate();
    }

    _onCharacterClick(index) {
        const char = Characters.roster[index];
        if (!char.unlocked) return;

        this.selectedCharIndex = index;
        this._onCharacterFocus(index);
        audio.playSelect();
    }

    focusCharacter(index) {
        const cards = document.querySelectorAll('.character-card');
        if (cards[index]) {
            cards[index].focus();
        }
    }

    confirmCharacter() {
        const char = Characters.roster[this.selectedCharIndex];
        if (!char || !char.unlocked) return false;

        this.game.selectCharacter(char.id);
        return true;
    }

    // ---- Level Select / Island Map ----

    buildIslandMap() {
        const map = document.getElementById('island-map');
        map.innerHTML = '';

        const progress = this.game.progress;

        // Island shapes for each zone
        const zonePositions = [
            { cx: 250, cy: 550 },   // Beach
            { cx: 550, cy: 350 },   // Jungle
            { cx: 850, cy: 250 },   // Cave
            { cx: 1100, cy: 350 },  // Volcano
            { cx: 1300, cy: 200 },  // Sky
            { cx: 1450, cy: 100 }   // Space
        ];

        // Draw paths between zones
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '1600');
        svg.setAttribute('height', '750');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.zIndex = '0';

        for (let i = 0; i < zonePositions.length - 1; i++) {
            const p1 = zonePositions[i];
            const p2 = zonePositions[i + 1];
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            path.setAttribute('x1', p1.cx);
            path.setAttribute('y1', p1.cy);
            path.setAttribute('x2', p2.cx);
            path.setAttribute('y2', p2.cy);
            path.setAttribute('stroke', 'rgba(255,255,255,0.3)');
            path.setAttribute('stroke-width', '4');
            path.setAttribute('stroke-dasharray', '12,8');
            svg.appendChild(path);
        }

        map.appendChild(svg);

        // Draw island blobs
        Levels.zones.forEach((zone, zi) => {
            const pos = zonePositions[zi];

            // Island background blob
            const blob = document.createElement('div');
            blob.className = 'map-island-bg';
            blob.style.cssText = `
                left: ${pos.cx - 100}px;
                top: ${pos.cy - 60}px;
                width: 200px;
                height: 120px;
                background: radial-gradient(ellipse, ${zone.color}40, ${zone.color}10);
                border-radius: 50%;
            `;
            map.appendChild(blob);

            // Level nodes within zone
            const levelPositions = this._getLevelPositionsInZone(pos, zone.levels.length);

            zone.levels.forEach((levelNum, li) => {
                const lp = levelPositions[li];
                const levelDef = Levels.getLevel(levelNum);
                const isCompleted = progress.completed[levelNum];
                const isUnlocked = levelNum <= progress.highestUnlocked;
                const isAvailable = isUnlocked && !isCompleted;
                const isBoss = levelNum % 5 === 0;

                const node = document.createElement('div');
                node.className = `map-node ${isCompleted ? 'completed' : ''} ${isAvailable ? 'available' : ''} ${!isUnlocked ? 'locked' : ''}`;
                node.setAttribute('tabindex', isUnlocked ? '0' : '-1');
                node.setAttribute('data-level', levelNum);
                node.setAttribute('data-label', levelDef.name);

                const nodeSize = isBoss ? 110 : 90;
                node.style.cssText = `
                    left: ${lp.x - nodeSize / 2}px;
                    top: ${lp.y - nodeSize / 2}px;
                    width: ${nodeSize}px;
                    height: ${nodeSize}px;
                    background: linear-gradient(180deg, ${zone.color}, ${zone.color}cc);
                    font-size: ${isBoss ? '32px' : '28px'};
                `;

                if (isBoss) {
                    node.innerHTML = zone.icon;
                    node.style.border = '4px solid gold';
                } else {
                    node.textContent = levelNum;
                }

                if (isCompleted) {
                    const stars = isCompleted.stars || 0;
                    node.setAttribute('data-label', `${levelDef.name} ${'⭐'.repeat(stars)}`);
                }

                node.addEventListener('focus', () => this._onLevelFocus(levelNum));
                node.addEventListener('click', () => this._onLevelClick(levelNum));

                map.appendChild(node);
            });
        });
    }

    _getLevelPositionsInZone(center, count) {
        const positions = [];
        const spread = 70;
        const angleStep = (Math.PI * 0.8) / (count - 1 || 1);
        const startAngle = -Math.PI * 0.4;

        for (let i = 0; i < count; i++) {
            const angle = startAngle + angleStep * i;
            positions.push({
                x: center.cx + Math.cos(angle) * spread * (i % 2 === 0 ? 1 : 0.6),
                y: center.cy + Math.sin(angle) * spread - i * 15
            });
        }
        return positions;
    }

    _onLevelFocus(levelNum) {
        this.selectedLevelIndex = levelNum;
        const levelDef = Levels.getLevel(levelNum);
        const zone = Levels.getZoneForLevel(levelNum);
        const progress = this.game.progress.completed[levelNum];
        const info = document.getElementById('level-info');

        let text = `${zone.icon} ${levelDef.name} - ${levelDef.description}`;
        if (progress) {
            text += ` | Best: ${progress.score} pts, ${'⭐'.repeat(progress.stars)}`;
        }
        info.textContent = text;
        info.classList.add('visible');

        audio.playNavigate();
    }

    _onLevelClick(levelNum) {
        if (levelNum > this.game.progress.highestUnlocked) return;
        this.startLevel(levelNum);
    }

    focusLevel(index) {
        const nodes = document.querySelectorAll('.map-node[tabindex="0"]');
        const targetNode = document.querySelector(`.map-node[data-level="${index}"]`);
        if (targetNode && targetNode.getAttribute('tabindex') === '0') {
            targetNode.focus();
        }
    }

    // ---- Game HUD ----

    startLevel(levelNum) {
        if (!this.game.startLevel(levelNum)) return;

        this.showScreen('hud');
        this._updateHud();
        this._showProblem();

        audio.resume();
        audio.startMusic();
    }

    _updateHud() {
        document.getElementById('hud-level').textContent = this.game.currentLevel.num;
        document.getElementById('hud-score').textContent = Utils.formatNumber(this.game.score);
        document.getElementById('hud-streak').textContent = this.game.streak;

        // Stars
        const thresholds = this.game.currentLevel.starThresholds;
        for (let i = 1; i <= 3; i++) {
            const star = document.getElementById(`hud-star-${i}`);
            star.classList.toggle('earned', this.game.correctCount >= thresholds[i - 1]);
        }

        // Streak fire
        const fire = document.getElementById('streak-fire');
        fire.classList.toggle('active', this.game.streak >= 3);
    }

    _showProblem() {
        const problem = this.game.getCurrentProblem();
        if (!problem) return;

        const container = document.getElementById('problem-container');
        const problemText = document.getElementById('problem-text');
        const options = document.getElementById('answer-options');
        const charDisplay = document.getElementById('problem-character');

        // Set character
        if (this.game.selectedCharacter) {
            charDisplay.textContent = this.game.selectedCharacter.emoji;
        }

        // Set problem text
        problemText.innerHTML = problem.questionHtml || problem.question;

        // Set answer options
        options.innerHTML = '';
        this.selectedAnswerIndex = 0;

        problem.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'answer-btn';
            btn.textContent = opt;
            btn.setAttribute('tabindex', '0');
            btn.setAttribute('data-answer', opt);
            btn.setAttribute('data-index', i);

            btn.addEventListener('focus', () => {
                this.selectedAnswerIndex = i;
                audio.playNavigate();
            });
            btn.addEventListener('click', () => this._onAnswerClick(opt, btn));

            options.appendChild(btn);
        });

        // Show with animation
        container.classList.remove('visible');
        requestAnimationFrame(() => {
            container.classList.add('visible');
        });

        // Focus first option
        setTimeout(() => {
            const firstBtn = options.querySelector('.answer-btn');
            if (firstBtn) firstBtn.focus();
        }, 300);

        // Start timer
        this.game.startTimer(
            (remaining, max) => this._updateTimer(remaining, max),
            () => this._onTimeExpired()
        );
    }

    _onAnswerClick(answer, btnElement) {
        if (this.game.isAnswering) return;

        const result = this.game.submitAnswer(answer);
        if (!result) return;

        // Visual feedback on button
        if (result.correct) {
            btnElement.classList.add('correct');
            audio.playCorrect();
            audio.playStreak(this.game.streak);

            // Particle celebration
            const rect = btnElement.getBoundingClientRect();
            this.game.particles.correctBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);

            // Streak fire particles
            if (this.game.streak >= 3) {
                this.game.particles.streakFire(960, 60);
            }

            this._showFeedback('correct', this._getCorrectMessage());
        } else {
            btnElement.classList.add('wrong');
            audio.playWrong();

            const rect = btnElement.getBoundingClientRect();
            this.game.particles.wrongShake(rect.left + rect.width / 2, rect.top + rect.height / 2);

            // Highlight correct answer
            document.querySelectorAll('.answer-btn').forEach(b => {
                if (String(b.getAttribute('data-answer')) === String(result.correctAnswer)) {
                    b.classList.add('correct');
                }
            });

            this._showFeedback('wrong', `The answer is ${result.correctAnswer}`);
        }

        this.game.stopTimer();
        this._updateHud();

        // Move to next problem after delay
        setTimeout(() => {
            const nextResult = this.game.nextProblem();
            if (nextResult.done) {
                this._showLevelComplete(nextResult);
            } else {
                this._showProblem();
            }
        }, 1800);
    }

    _onTimeExpired() {
        if (this.game.isAnswering) return;

        // Auto-submit wrong answer
        const problem = this.game.getCurrentProblem();
        const result = this.game.submitAnswer('__TIMEOUT__');

        this._showFeedback('wrong', `Time's up! Answer: ${problem.answer}`);
        audio.playWrong();
        this._updateHud();

        // Highlight correct answer
        document.querySelectorAll('.answer-btn').forEach(b => {
            if (String(b.getAttribute('data-answer')) === String(problem.answer)) {
                b.classList.add('correct');
            }
        });

        setTimeout(() => {
            const nextResult = this.game.nextProblem();
            if (nextResult.done) {
                this._showLevelComplete(nextResult);
            } else {
                this._showProblem();
            }
        }, 2000);
    }

    _updateTimer(remaining, max) {
        const bar = document.getElementById('timer-bar');
        const pct = Math.max(0, (remaining / max) * 100);
        bar.style.width = `${pct}%`;

        // Color change when low
        if (pct < 25) {
            bar.style.background = 'linear-gradient(90deg, #ef476f, #ff6b8a)';
        } else if (pct < 50) {
            bar.style.background = 'linear-gradient(90deg, #ffd166, #ffaa33)';
        } else {
            bar.style.background = 'linear-gradient(90deg, #06d6a0, #ffd166, #ef476f)';
        }
    }

    _showFeedback(type, message) {
        const overlay = document.getElementById('feedback-overlay');
        const content = document.getElementById('feedback-content');

        content.className = `feedback-content ${type}`;
        content.textContent = message;
        overlay.classList.add('visible');

        setTimeout(() => {
            overlay.classList.remove('visible');
        }, 1500);
    }

    _getCorrectMessage() {
        const messages = [
            'Correct!', 'Amazing!', 'Great job!', 'Brilliant!',
            'You got it!', 'Perfect!', 'Awesome!', 'Super!',
            'Fantastic!', 'Wonderful!', 'Math star!', 'Nailed it!'
        ];

        if (this.game.streak >= 5) {
            return `🔥 ${this.game.streak}x STREAK! 🔥`;
        } else if (this.game.streak >= 3) {
            return `${this.game.streak}x Streak! 🔥`;
        }

        return Utils.randomChoice(messages);
    }

    // ---- Level Complete ----

    _showLevelComplete(result) {
        this.showScreen('complete');
        this.game.stopTimer();
        audio.stopMusic();

        // Particles
        if (result.stars >= 2) {
            this.game.particles.confetti(3000);
        }
        if (result.stars === 3) {
            this.game.particles.starExplosion(960, 400);
            audio.playFanfare();
        } else if (result.stars >= 1) {
            audio.playStar();
        }

        // Update display
        document.getElementById('complete-title').textContent =
            result.stars === 3 ? 'Perfect Score!' :
            result.stars >= 1 ? 'Level Complete!' : 'Good Try!';

        document.getElementById('complete-score').textContent = Utils.formatNumber(result.score);
        document.getElementById('complete-correct').textContent = `${result.correct}/${result.total}`;
        document.getElementById('complete-streak').textContent = result.bestStreak;

        // Stars
        const starsContainer = document.getElementById('complete-stars');
        starsContainer.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const star = document.createElement('span');
            star.className = 'big-star';
            star.textContent = i < result.stars ? '⭐' : '☆';
            star.style.color = i < result.stars ? '#ffd700' : '#555';
            starsContainer.appendChild(star);
        }

        // Rewards / Unlocks
        const rewardEl = document.getElementById('complete-reward');
        if (result.newUnlocks && result.newUnlocks.length > 0) {
            rewardEl.innerHTML = result.newUnlocks.map(c =>
                `🎉 New Character Unlocked: ${c.emoji} ${c.name}!`
            ).join('<br>');
        } else {
            rewardEl.textContent = '';
        }

        // Focus next level button
        setTimeout(() => {
            const nextBtn = document.querySelector('.btn-next');
            if (nextBtn) nextBtn.focus();
        }, 500);
    }

    // ---- Settings ----

    _applySettings() {
        const settings = this.game.settings;

        // Audio
        audio.sfxEnabled = settings.sfx;
        audio.musicEnabled = settings.music;

        // UI toggles
        const sfxBtn = document.getElementById('toggle-sfx');
        if (sfxBtn) {
            sfxBtn.classList.toggle('active', settings.sfx);
            sfxBtn.textContent = settings.sfx ? 'ON' : 'OFF';
        }

        const musicBtn = document.getElementById('toggle-music');
        if (musicBtn) {
            musicBtn.classList.toggle('active', settings.music);
            musicBtn.textContent = settings.music ? 'ON' : 'OFF';
        }

        const timerBtn = document.getElementById('toggle-timer');
        if (timerBtn) {
            timerBtn.classList.toggle('active', settings.timer);
            timerBtn.textContent = settings.timer ? 'ON' : 'OFF';
        }

        // Difficulty
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.diff === settings.difficulty);
        });
    }

    toggleSetting(setting) {
        const current = this.game.settings[setting];
        this.game.updateSetting(setting, !current);

        if (setting === 'sfx') audio.toggleSfx();
        if (setting === 'music') audio.toggleMusic();

        this._applySettings();
        audio.playSelect();
    }

    setDifficulty(diff) {
        this.game.updateSetting('difficulty', diff);
        this._applySettings();
        audio.playSelect();
    }

    // ---- Event Listeners ----

    _initEventListeners() {
        // Button clicks via data-action
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;

            const action = btn.dataset.action;
            this._handleAction(action);
        });

        // Settings toggles
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.toggleSetting(btn.dataset.setting);
            });
        });

        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setDifficulty(btn.dataset.diff);
            });
        });
    }

    _handleAction(action) {
        switch (action) {
            case 'play':
                this.game.setState('characterSelect');
                this.showScreen('characterSelect');
                this._initCharacterGrid();
                setTimeout(() => this.focusCharacter(0), 200);
                audio.playSelect();
                break;

            case 'continue':
                this.game.setState('characterSelect');
                this.showScreen('characterSelect');
                this._initCharacterGrid();
                setTimeout(() => this.focusCharacter(0), 200);
                audio.playSelect();
                break;

            case 'settings':
                this.game.setState('settings');
                this.showScreen('settings');
                this._applySettings();
                audio.playSelect();
                break;

            case 'back-to-menu':
                this.game.setState('menu');
                this.showScreen('menu');
                audio.playSelect();
                setTimeout(() => {
                    const playBtn = document.querySelector('.btn-play');
                    if (playBtn) playBtn.focus();
                }, 200);
                break;

            case 'back-to-characters':
                this.game.setState('characterSelect');
                this.showScreen('characterSelect');
                audio.playSelect();
                break;

            case 'confirm-character':
                if (this.confirmCharacter()) {
                    this.game.setState('levelSelect');
                    this.showScreen('levelSelect');
                    this.buildIslandMap();
                    // Focus first available level
                    setTimeout(() => {
                        this.focusLevel(this.game.progress.highestUnlocked);
                    }, 300);
                    audio.playSelect();
                }
                break;

            case 'replay':
                if (this.game.currentLevel) {
                    this.startLevel(this.game.currentLevel.num);
                    this.game.particles.clear();
                }
                audio.playSelect();
                break;

            case 'next-level':
                if (this.game.currentLevel) {
                    const next = this.game.currentLevel.num + 1;
                    if (Levels.getLevel(next)) {
                        this.startLevel(next);
                        this.game.particles.clear();
                    } else {
                        this._handleAction('back-to-map');
                    }
                }
                audio.playSelect();
                break;

            case 'back-to-map':
                this.game.setState('levelSelect');
                this.showScreen('levelSelect');
                this.buildIslandMap();
                this.game.particles.clear();
                audio.stopMusic();
                audio.playSelect();
                break;
        }
    }

    // Get current focusable elements for the active screen
    getCurrentFocusables() {
        const screen = this.screens[this.currentScreen];
        if (!screen) return [];
        return [...screen.querySelectorAll('[tabindex="0"], button, .answer-btn, .character-card, .map-node')].filter(
            el => !el.disabled && el.offsetParent !== null
        );
    }
}
