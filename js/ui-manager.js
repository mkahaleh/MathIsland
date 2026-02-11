/* ========================================
   MATH ISLAND - UI Manager
   Handles all screen transitions and DOM updates
   ======================================== */

class UIManager {
    constructor(game) {
        this.game = game;
        this.screens = {
            menu: document.getElementById('main-menu'),
            tutorial: document.getElementById('tutorial-screen'),
            characterSelect: document.getElementById('character-select'),
            levelSelect: document.getElementById('level-select'),
            hud: document.getElementById('game-hud'),
            pause: document.getElementById('pause-menu'),
            complete: document.getElementById('level-complete'),
            achievements: document.getElementById('achievements-screen'),
            settings: document.getElementById('settings-screen')
        };

        this.currentScreen = 'menu';
        this.selectedCharIndex = 0;
        this.selectedLevelIndex = 0;
        this.selectedAnswerIndex = 0;
        this.focusableElements = [];

        // Tutorial state
        this.tutorialPages = [
            { emoji: '\u{1F3DD}\uFE0F', title: 'Welcome to Math Island!', text: 'Explore magical islands while solving math puzzles. Each island has unique challenges!' },
            { emoji: '\u{1F9D9}\u200D\u2640\uFE0F', title: 'Choose Your Explorer!', text: 'Each character has a special power! Luna gives extra time, Captain Finn boosts streaks, and more!' },
            { emoji: '\u{1F3AF}', title: 'Solve Math Problems', text: 'Pick the right answer from 4 choices. Use number keys 1-4 or arrow keys to select!' },
            { emoji: '\u2B50', title: 'Earn Stars', text: 'Get 1, 2, or 3 stars based on how many you get right. Stars unlock new zones!' },
            { emoji: '\u{1F525}', title: 'Build Streaks!', text: 'Answer correctly in a row to build combos. Higher streaks = more points!' }
        ];
        this.currentTutorialPage = 0;

        // Pause state tracking
        this._cameFromPause = false;

        // Achievement toast queue
        this._toastQueue = [];
        this._isShowingToast = false;

        // Track previously unlocked achievements for diffing
        this._previouslyUnlocked = new Set();

        this._initCharacterGrid();
        this._initEventListeners();
        this._applySettings();
    }

    // ---- Screen Management ----

    showScreen(name) {
        // Hide all
        Object.values(this.screens).forEach(s => {
            if (s) s.classList.remove('active');
        });

        // Show target
        if (this.screens[name]) {
            this.screens[name].classList.add('active');
            this.currentScreen = name;
        }

        // Update menu stats when showing menu
        if (name === 'menu') {
            this._updateMenuStats();
        }
    }

    // ---- Menu Stats ----

    _updateMenuStats() {
        const progress = this.game.progress;
        const totalStars = progress.totalStars || 0;
        const levelsDone = Object.keys(progress.completed).length;

        const starsEl = document.getElementById('menu-total-stars');
        if (starsEl) starsEl.textContent = totalStars;

        const levelsEl = document.getElementById('menu-levels-done');
        if (levelsEl) levelsEl.textContent = levelsDone;
    }

    // ---- Tutorial System ----

    showTutorial() {
        this.currentTutorialPage = 0;
        this.showScreen('tutorial');
        this._updateTutorialDisplay();

        // Focus the next button
        setTimeout(() => {
            const nextBtn = document.querySelector('.tutorial-next');
            if (nextBtn) nextBtn.focus();
        }, 300);
    }

    nextTutorialPage() {
        this.currentTutorialPage++;
        if (this.currentTutorialPage >= this.tutorialPages.length) {
            // Tutorial finished, go to character select
            this.game.setState('characterSelect');
            this.showScreen('characterSelect');
            this._initCharacterGrid();
            setTimeout(() => this.focusCharacter(0), 200);
            audio.playSelect();
            return;
        }
        this._updateTutorialDisplay();
        audio.playNavigate();
    }

    _updateTutorialDisplay() {
        const page = this.tutorialPages[this.currentTutorialPage];
        if (!page) return;

        const emojiEl = document.getElementById('tutorial-emoji');
        const titleEl = document.getElementById('tutorial-title');
        const textEl = document.getElementById('tutorial-text');
        const dotsEl = document.getElementById('tutorial-dots');

        if (emojiEl) emojiEl.textContent = page.emoji;
        if (titleEl) titleEl.textContent = page.title;
        if (textEl) textEl.textContent = page.text;

        // Build dots
        if (dotsEl) {
            dotsEl.innerHTML = '';
            for (let i = 0; i < this.tutorialPages.length; i++) {
                const dot = document.createElement('span');
                dot.className = 'tutorial-dot';
                if (i === this.currentTutorialPage) {
                    dot.classList.add('active');
                } else if (i < this.currentTutorialPage) {
                    dot.classList.add('completed');
                }
                dotsEl.appendChild(dot);
            }
        }

        // Update next button text on last page
        const nextBtn = document.querySelector('.tutorial-next');
        if (nextBtn) {
            const btnText = nextBtn.querySelector('.btn-text') || nextBtn;
            if (this.currentTutorialPage === this.tutorialPages.length - 1) {
                btnText.textContent = "Let's Go!";
            } else {
                btnText.textContent = 'Next';
            }
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
            card.setAttribute('tabindex', char.unlocked ? '0' : '-1');
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
        const char = Characters.roster[index];
        if (!char) return;

        // Only update selection for unlocked characters
        if (char.unlocked) {
            this.selectedCharIndex = index;
        }

        document.getElementById('char-name').textContent = char.name;
        document.getElementById('char-desc').textContent =
            char.unlocked ? char.description : `Unlocked at Level ${char.unlockLevel}`;

        // Show bonus info
        const bonusEl = document.getElementById('char-bonus');
        if (bonusEl) {
            bonusEl.textContent = char.unlocked ? char.bonus : '';
        }

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
        let char = Characters.roster[this.selectedCharIndex];

        // Fallback: if selected character is locked or invalid, pick first unlocked
        if (!char || !char.unlocked) {
            const fallbackIndex = Characters.roster.findIndex(c => c.unlocked);
            if (fallbackIndex === -1) return false;
            this.selectedCharIndex = fallbackIndex;
            char = Characters.roster[fallbackIndex];
        }

        this.game.selectCharacter(char.id);
        return true;
    }

    // ---- Level Select / Island Map ----

    buildIslandMap() {
        const map = document.getElementById('island-map');
        map.innerHTML = '';

        const progress = this.game.progress;

        // Update star count in map header
        const mapStars = document.getElementById('map-stars');
        if (mapStars) {
            mapStars.textContent = progress.totalStars || 0;
        }

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
        const targetNode = document.querySelector(`.map-node[data-level="${index}"]`);
        if (targetNode && targetNode.getAttribute('tabindex') === '0') {
            targetNode.focus();
        }
    }

    // ---- Game HUD ----

    startLevel(levelNum) {
        if (!this.game.startLevel(levelNum)) return;

        // Snapshot current achievements before playing
        this._snapshotAchievements();

        this.showScreen('hud');
        this._updateHud();
        this._updateProgress();
        this._showHintButton();
        this._hideComboDisplay();
        this._hidePowerIndicator();
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

    _updateProgress() {
        const current = this.game.currentProblemIndex + 1;
        const total = this.game.problems.length;

        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');

        if (progressBar) {
            const pct = (current / total) * 100;
            progressBar.style.width = `${pct}%`;
        }

        if (progressText) {
            progressText.textContent = `Question ${current} of ${total}`;
        }

        // Update problem number display
        const problemNumber = document.getElementById('problem-number');
        if (problemNumber) {
            problemNumber.textContent = `Question ${current}`;
        }
    }

    _showHintButton() {
        const hintBtn = document.getElementById('hud-hint');
        if (!hintBtn) return;

        const char = this.game.selectedCharacter;
        if (char && char.bonusType === 'hint') {
            const hintsRemaining = char.bonusValue - (this.game.hintsUsed || 0);
            if (hintsRemaining > 0) {
                hintBtn.style.display = 'flex';
                return;
            }
        }
        hintBtn.style.display = 'none';
    }

    _useHint() {
        const char = this.game.selectedCharacter;
        if (!char || char.bonusType !== 'hint') return;

        const hintsRemaining = char.bonusValue - (this.game.hintsUsed || 0);
        if (hintsRemaining <= 0) return;

        // Call game.useHint() if it exists, otherwise handle locally
        if (typeof this.game.useHint === 'function') {
            this.game.useHint();
        } else {
            this.game.hintsUsed = (this.game.hintsUsed || 0) + 1;
        }

        // Get the current problem's correct answer
        const problem = this.game.getCurrentProblem();
        if (!problem) return;

        const correctAnswer = String(problem.answer);
        const answerBtns = document.querySelectorAll('.answer-btn');
        const wrongBtns = [];

        answerBtns.forEach(btn => {
            if (String(btn.getAttribute('data-answer')) !== correctAnswer) {
                wrongBtns.push(btn);
            }
        });

        // Eliminate 2 random wrong answers
        const shuffledWrong = Utils.shuffle(wrongBtns);
        const toEliminate = shuffledWrong.slice(0, 2);

        toEliminate.forEach(btn => {
            btn.classList.add('hint-eliminated');
            btn.style.opacity = '0.3';
            btn.disabled = true;
            btn.setAttribute('tabindex', '-1');

            // Play hint particles on eliminated buttons
            const rect = btn.getBoundingClientRect();
            this.game.particles.emit(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
                8,
                {
                    vx: Utils.randomFloat(-3, 3),
                    vy: Utils.randomFloat(-3, 3),
                    size: Utils.randomFloat(3, 6),
                    color: '#48cae4',
                    life: 0.8,
                    shape: 'circle',
                    gravity: 0
                }
            );
        });

        // Hide hint button after use
        const hintBtn = document.getElementById('hud-hint');
        if (hintBtn) hintBtn.style.display = 'none';

        audio.playSelect();
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

        // Hide proximity bar by default
        const proximityBar = document.getElementById('proximity-bar');
        if (proximityBar) proximityBar.style.display = 'none';

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

                // Proximity feedback for Byte character
                this._updateProximityFeedback(opt);
            });
            btn.addEventListener('click', () => this._onAnswerClick(opt, btn));

            options.appendChild(btn);
        });

        // Show with animation
        container.classList.remove('visible');
        requestAnimationFrame(() => {
            container.classList.add('visible');
        });

        // Update progress
        this._updateProgress();

        // Show hint button if applicable
        this._showHintButton();

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

        const previousStreak = this.game.streak;
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

            // Show points popup
            this._showPointsPopup(result.points || 0);

            // Show combo display
            this._updateComboDisplay();

            // Character reaction - happy
            this._showCharacterReaction('happy');

            // Check for character power activation
            this._checkPowerActivation(result);

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

            // Character reaction - sad
            this._showCharacterReaction('sad');

            // Check if shield protected the streak
            if (this.game.selectedCharacter &&
                this.game.selectedCharacter.bonusType === 'shield' &&
                previousStreak > 0 &&
                this.game.streak === previousStreak) {
                this._showPowerActivation('\u{1F6E1}\uFE0F', 'Streak Protected!');
            }

            // Hide combo on streak break
            if (this.game.streak < 3) {
                this._hideComboDisplay();
            }
        }

        this.game.stopTimer();
        this._updateHud();
        this._updateProgress();

        // Check achievements after answer
        this._checkNewAchievements();

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

        // Character reaction - sad
        this._showCharacterReaction('sad');

        // Hide combo on streak break
        if (this.game.streak < 3) {
            this._hideComboDisplay();
        }

        // Highlight correct answer
        document.querySelectorAll('.answer-btn').forEach(b => {
            if (String(b.getAttribute('data-answer')) === String(problem.answer)) {
                b.classList.add('correct');
            }
        });

        // Check achievements
        this._checkNewAchievements();

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
            return `\u{1F525} ${this.game.streak}x STREAK! \u{1F525}`;
        } else if (this.game.streak >= 3) {
            return `${this.game.streak}x Streak! \u{1F525}`;
        }

        return Utils.randomChoice(messages);
    }

    // ---- Points Popup ----

    _showPointsPopup(points) {
        const feedbackPoints = document.getElementById('feedback-points');
        if (!feedbackPoints) return;

        feedbackPoints.textContent = `+${Utils.formatNumber(points)} pts`;
        feedbackPoints.classList.remove('animate');

        // Force reflow to restart animation
        void feedbackPoints.offsetWidth;

        feedbackPoints.classList.add('animate');
        feedbackPoints.style.display = 'block';

        setTimeout(() => {
            feedbackPoints.classList.remove('animate');
            feedbackPoints.style.display = 'none';
        }, 1200);
    }

    // ---- Combo Display ----

    _updateComboDisplay() {
        const comboDisplay = document.getElementById('combo-display');
        const comboCount = document.getElementById('combo-count');
        if (!comboDisplay || !comboCount) return;

        if (this.game.streak >= 3) {
            comboCount.textContent = this.game.streak;
            comboDisplay.style.display = 'flex';

            // Animate bigger at higher streaks
            const scale = Math.min(1 + (this.game.streak - 3) * 0.1, 2.0);
            comboDisplay.style.transform = `scale(${scale})`;

            // Pulse animation
            comboDisplay.classList.remove('combo-pulse');
            void comboDisplay.offsetWidth;
            comboDisplay.classList.add('combo-pulse');
        }
    }

    _hideComboDisplay() {
        const comboDisplay = document.getElementById('combo-display');
        if (comboDisplay) {
            comboDisplay.style.display = 'none';
            comboDisplay.style.transform = 'scale(1)';
        }
    }

    // ---- Character Reactions ----

    _showCharacterReaction(reactionType) {
        const charDisplay = document.getElementById('problem-character');
        if (!charDisplay || !this.game.selectedCharacter) return;

        const char = this.game.selectedCharacter;
        const anim = char.animations[reactionType];
        if (!anim || anim.length === 0) return;

        // Show reaction emoji(s)
        charDisplay.textContent = anim.join('');

        // Return to idle after 1.5s
        setTimeout(() => {
            const idle = char.animations.idle;
            if (idle && idle.length > 0) {
                charDisplay.textContent = idle.join('');
            } else {
                charDisplay.textContent = char.emoji;
            }
        }, 1500);
    }

    // ---- Power Activation Indicator ----

    _checkPowerActivation(result) {
        const char = this.game.selectedCharacter;
        if (!char) return;

        switch (char.bonusType) {
            case 'time':
                // Luna's time bonus activates each problem
                this._showPowerActivation('\u23F1\uFE0F', `+${char.bonusValue} Seconds!`);
                break;
            case 'streak':
                if (this.game.streak >= 2) {
                    this._showPowerActivation('\u{1F4CE}', `${char.bonusValue}x Streak Bonus!`);
                }
                break;
            case 'doubleStart':
                if (this.game.currentProblemIndex < char.bonusValue) {
                    this._showPowerActivation('\u2728', 'Double Points!');
                }
                break;
            case 'doubleAll':
                this._showPowerActivation('\u{1F525}', `${char.bonusValue}x All Points!`);
                break;
            case 'tripleAll':
                this._showPowerActivation('\u{1F451}', `${char.bonusValue}x All Points!`);
                break;
        }
    }

    _showPowerActivation(icon, text) {
        const indicator = document.getElementById('power-indicator');
        const iconEl = document.getElementById('power-icon');
        const textEl = document.getElementById('power-text');

        if (!indicator || !iconEl || !textEl) return;

        iconEl.textContent = icon;
        textEl.textContent = text;
        indicator.style.display = 'flex';
        indicator.classList.remove('power-show');
        void indicator.offsetWidth;
        indicator.classList.add('power-show');

        setTimeout(() => {
            indicator.classList.remove('power-show');
            indicator.style.display = 'none';
        }, 2000);
    }

    _hidePowerIndicator() {
        const indicator = document.getElementById('power-indicator');
        if (indicator) {
            indicator.style.display = 'none';
            indicator.classList.remove('power-show');
        }
    }

    // ---- Proximity Feedback (Byte character) ----

    _updateProximityFeedback(answerValue) {
        const char = this.game.selectedCharacter;
        if (!char || char.bonusType !== 'proximity') return;

        const proximityBar = document.getElementById('proximity-bar');
        const proximityFill = document.getElementById('proximity-fill');
        if (!proximityBar || !proximityFill) return;

        // Show proximity bar
        proximityBar.style.display = 'block';

        let proximity = 0;

        // Use game.getProximity() if available, otherwise calculate locally
        if (typeof this.game.getProximity === 'function') {
            proximity = this.game.getProximity(answerValue);
        } else {
            // Calculate proximity locally
            const problem = this.game.getCurrentProblem();
            if (problem) {
                const correct = parseFloat(problem.answer);
                const given = parseFloat(answerValue);
                if (!isNaN(correct) && !isNaN(given)) {
                    const maxDiff = Math.max(Math.abs(correct) * 2, 10);
                    const diff = Math.abs(correct - given);
                    proximity = Math.max(0, Math.min(1, 1 - (diff / maxDiff)));
                }
            }
        }

        // Update fill width and color
        const pct = Math.max(0, Math.min(100, proximity * 100));
        proximityFill.style.width = `${pct}%`;

        // Color gradient from blue (cold) to red (hot)
        const hue = proximity * 0; // 0 = red
        const coldHue = 220; // blue
        const hotHue = 0; // red
        const currentHue = coldHue + (hotHue - coldHue) * proximity;
        const saturation = 80;
        const lightness = 50;
        proximityFill.style.background = `hsl(${currentHue}, ${saturation}%, ${lightness}%)`;

        // Update label
        const label = proximityBar.querySelector('.proximity-label');
        if (label) {
            if (proximity > 0.8) {
                label.textContent = 'Very hot!';
            } else if (proximity > 0.6) {
                label.textContent = 'Getting warmer...';
            } else if (proximity > 0.3) {
                label.textContent = 'Warm';
            } else {
                label.textContent = 'Cold...';
            }
        }
    }

    // ---- Pause Menu ----

    showPause() {
        // Update pause stats
        const pauseScore = document.getElementById('pause-score');
        const pauseStreak = document.getElementById('pause-streak');
        if (pauseScore) pauseScore.textContent = Utils.formatNumber(this.game.score);
        if (pauseStreak) pauseStreak.textContent = this.game.streak;

        // Pause game timer
        if (typeof this.game.pauseGame === 'function') {
            this.game.pauseGame();
        } else {
            this.game.stopTimer();
        }

        this.showScreen('pause');

        // Focus resume button
        setTimeout(() => {
            const resumeBtn = document.querySelector('[data-action="resume-game"]');
            if (resumeBtn) resumeBtn.focus();
        }, 200);
    }

    hidePause() {
        if (typeof this.game.resumeGame === 'function') {
            this.game.resumeGame();
        }

        this.showScreen('hud');

        // Restart the timer for the current problem
        this.game.startTimer(
            (remaining, max) => this._updateTimer(remaining, max),
            () => this._onTimeExpired()
        );

        // Re-focus an answer button
        setTimeout(() => {
            const answerBtns = document.querySelectorAll('.answer-btn:not([disabled])');
            if (answerBtns.length > 0) {
                answerBtns[this.selectedAnswerIndex] ?
                    answerBtns[this.selectedAnswerIndex].focus() :
                    answerBtns[0].focus();
            }
        }, 200);
    }

    // ---- Achievement Display ----

    showAchievements() {
        const container = document.getElementById('achievements-container');
        const countEl = document.getElementById('achievements-count');
        if (!container) return;

        container.innerHTML = '';

        // Get achievements data from game
        const achievements = (this.game.achievements && this.game.achievements.list)
            ? this.game.achievements.list
            : this._getDefaultAchievements();

        let unlockedCount = 0;

        achievements.forEach(ach => {
            const card = document.createElement('div');
            card.className = `achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`;

            card.innerHTML = `
                <div class="achievement-icon">${ach.unlocked ? ach.icon : '\u{1F512}'}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${ach.name}</div>
                    <div class="achievement-desc">${ach.unlocked ? ach.description : '???'}</div>
                </div>
            `;

            container.appendChild(card);

            if (ach.unlocked) unlockedCount++;
        });

        if (countEl) {
            countEl.textContent = `${unlockedCount}/${achievements.length}`;
        }

        this.showScreen('achievements');

        // Focus back button
        setTimeout(() => {
            const backBtn = this.screens.achievements.querySelector('.btn-back');
            if (backBtn) backBtn.focus();
        }, 200);
    }

    _getDefaultAchievements() {
        // Fallback achievement definitions if game.achievements is not yet implemented
        const progress = this.game.progress;
        const completedCount = Object.keys(progress.completed).length;
        const totalStars = progress.totalStars || 0;

        return [
            { id: 'first-step', icon: '\u{1F463}', name: 'First Steps', description: 'Complete your first level', unlocked: completedCount >= 1 },
            { id: 'five-clear', icon: '\u{1F3D6}\uFE0F', name: 'Beach Master', description: 'Complete all Beach levels', unlocked: completedCount >= 5 },
            { id: 'ten-clear', icon: '\u{1F334}', name: 'Jungle Explorer', description: 'Complete 10 levels', unlocked: completedCount >= 10 },
            { id: 'fifteen-clear', icon: '\u{1F48E}', name: 'Crystal Collector', description: 'Complete 15 levels', unlocked: completedCount >= 15 },
            { id: 'twenty-clear', icon: '\u{1F30B}', name: 'Volcano Victor', description: 'Complete 20 levels', unlocked: completedCount >= 20 },
            { id: 'all-clear', icon: '\u{1F451}', name: 'Math Master', description: 'Complete all 30 levels', unlocked: completedCount >= 30 },
            { id: 'star-10', icon: '\u2B50', name: 'Star Collector', description: 'Earn 10 stars', unlocked: totalStars >= 10 },
            { id: 'star-30', icon: '\u{1F31F}', name: 'Star Hoarder', description: 'Earn 30 stars', unlocked: totalStars >= 30 },
            { id: 'star-60', icon: '\u{1F4AB}', name: 'Constellation', description: 'Earn 60 stars', unlocked: totalStars >= 60 },
            { id: 'star-90', icon: '\u{1F320}', name: 'Perfect Galaxy', description: 'Earn all 90 stars', unlocked: totalStars >= 90 },
            { id: 'streak-5', icon: '\u{1F525}', name: 'On Fire', description: 'Get a 5x streak', unlocked: (this.game.bestStreak || 0) >= 5 },
            { id: 'streak-10', icon: '\u{1F4A5}', name: 'Unstoppable', description: 'Get a 10x streak', unlocked: (this.game.bestStreak || 0) >= 10 }
        ];
    }

    // ---- Achievement Tracking ----

    _snapshotAchievements() {
        const achievements = (this.game.achievements && this.game.achievements.list)
            ? this.game.achievements.list
            : this._getDefaultAchievements();

        this._previouslyUnlocked = new Set();
        achievements.forEach(ach => {
            if (ach.unlocked) {
                this._previouslyUnlocked.add(ach.id);
            }
        });
    }

    _checkNewAchievements() {
        const achievements = (this.game.achievements && this.game.achievements.list)
            ? this.game.achievements.list
            : this._getDefaultAchievements();

        achievements.forEach(ach => {
            if (ach.unlocked && !this._previouslyUnlocked.has(ach.id)) {
                this._previouslyUnlocked.add(ach.id);
                this.showAchievementToast(ach);
            }
        });
    }

    // ---- Achievement Toast ----

    showAchievementToast(achievement) {
        this._toastQueue.push(achievement);
        if (!this._isShowingToast) {
            this._processToastQueue();
        }
    }

    _processToastQueue() {
        if (this._toastQueue.length === 0) {
            this._isShowingToast = false;
            return;
        }

        this._isShowingToast = true;
        const achievement = this._toastQueue.shift();

        const toast = document.getElementById('achievement-toast');
        const toastIcon = document.getElementById('toast-icon');
        const toastTitle = document.getElementById('toast-title');
        const toastDesc = document.getElementById('toast-desc');

        if (!toast) {
            this._processToastQueue();
            return;
        }

        if (toastIcon) toastIcon.textContent = achievement.icon || '\u{1F3C6}';
        if (toastTitle) toastTitle.textContent = 'Achievement Unlocked!';
        if (toastDesc) toastDesc.textContent = achievement.name || '';

        // Show toast - slide in
        toast.style.display = 'flex';
        toast.classList.remove('toast-hide');
        toast.classList.add('toast-show');

        // Play achievement sound
        audio.playStar();

        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('toast-show');
            toast.classList.add('toast-hide');

            // After slide-out animation, process next toast
            setTimeout(() => {
                toast.style.display = 'none';
                toast.classList.remove('toast-hide');
                this._processToastQueue();
            }, 500);
        }, 3000);
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

        // Average answer time
        const completeTime = document.getElementById('complete-time');
        if (completeTime) {
            if (result.avgTime !== undefined) {
                completeTime.textContent = `${result.avgTime.toFixed(1)}s`;
            } else if (this.game.answerTimes && this.game.answerTimes.length > 0) {
                const avg = this.game.answerTimes.reduce((a, b) => a + b, 0) / this.game.answerTimes.length;
                completeTime.textContent = `${avg.toFixed(1)}s`;
            } else {
                // Estimate from time per problem and remaining time
                const tpp = this.game.currentLevel.timePerProblem || 25;
                completeTime.textContent = `~${Math.round(tpp * 0.6)}s`;
            }
        }

        // XP / Progress display
        const completeXp = document.getElementById('complete-xp');
        if (completeXp) {
            const completedCount = Object.keys(this.game.progress.completed).length;
            completeXp.textContent = `Level ${completedCount}/30 complete!`;
        }

        // Stars
        const starsContainer = document.getElementById('complete-stars');
        starsContainer.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const star = document.createElement('span');
            star.className = 'big-star';
            star.textContent = i < result.stars ? '\u2B50' : '\u2606';
            star.style.color = i < result.stars ? '#ffd700' : '#555';
            starsContainer.appendChild(star);
        }

        // Rewards / Unlocks
        const rewardEl = document.getElementById('complete-reward');
        if (result.newUnlocks && result.newUnlocks.length > 0) {
            rewardEl.innerHTML = result.newUnlocks.map(c =>
                `\u{1F389} New Character Unlocked: ${c.emoji} ${c.name}!`
            ).join('<br>');
        } else {
            rewardEl.textContent = '';
        }

        // Newly earned achievements
        const completeAchievement = document.getElementById('complete-achievement');
        if (completeAchievement) {
            const achievements = (this.game.achievements && this.game.achievements.list)
                ? this.game.achievements.list
                : this._getDefaultAchievements();

            const newAchievements = achievements.filter(ach =>
                ach.unlocked && !this._previouslyUnlocked.has(ach.id)
            );

            if (newAchievements.length > 0) {
                completeAchievement.innerHTML = newAchievements.map(ach =>
                    `<div class="new-achievement">${ach.icon} ${ach.name}</div>`
                ).join('');
            } else {
                completeAchievement.textContent = '';
            }
        }

        // Character celebration animation
        const charDisplay = document.getElementById('problem-character');
        if (charDisplay && this.game.selectedCharacter) {
            const celebrate = this.game.selectedCharacter.animations.celebrate;
            if (celebrate && celebrate.length > 0) {
                charDisplay.textContent = celebrate.join('');
            }
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
                if (btn.dataset.setting) {
                    this.toggleSetting(btn.dataset.setting);
                }
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
                // Show tutorial on first play, character select on subsequent
                if (!Utils.load('tutorialSeen')) {
                    this.showTutorial();
                    Utils.save('tutorialSeen', true);
                } else {
                    this.game.setState('characterSelect');
                    this.showScreen('characterSelect');
                    this._initCharacterGrid();
                    setTimeout(() => this.focusCharacter(0), 200);
                }
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
                this._cameFromPause = false;
                this.game.setState('settings');
                this.showScreen('settings');
                this._applySettings();
                audio.playSelect();
                break;

            case 'achievements':
                this.showAchievements();
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

            // ---- Pause actions ----

            case 'pause-game':
                this.showPause();
                audio.playSelect();
                break;

            case 'resume-game':
                this.hidePause();
                audio.playSelect();
                break;

            case 'quit-to-map':
                this.game.stopTimer();
                if (typeof this.game.resumeGame === 'function') {
                    this.game.resumeGame();
                }
                this.game.setState('levelSelect');
                this.showScreen('levelSelect');
                this.buildIslandMap();
                this.game.particles.clear();
                audio.stopMusic();
                audio.playSelect();
                break;

            case 'pause-settings':
                this._cameFromPause = true;
                this.showScreen('settings');
                this._applySettings();
                audio.playSelect();
                break;

            // ---- Settings back ----

            case 'settings-back':
                if (this._cameFromPause) {
                    this._cameFromPause = false;
                    this.showScreen('pause');
                    setTimeout(() => {
                        const resumeBtn = document.querySelector('[data-action="resume-game"]');
                        if (resumeBtn) resumeBtn.focus();
                    }, 200);
                } else {
                    this.game.setState('menu');
                    this.showScreen('menu');
                    setTimeout(() => {
                        const playBtn = document.querySelector('.btn-play');
                        if (playBtn) playBtn.focus();
                    }, 200);
                }
                audio.playSelect();
                break;

            // ---- Hint ----

            case 'use-hint':
                this._useHint();
                break;

            // ---- Tutorial ----

            case 'next-tutorial':
                this.nextTutorialPage();
                break;

            case 'skip-tutorial':
                this.game.setState('characterSelect');
                this.showScreen('characterSelect');
                this._initCharacterGrid();
                setTimeout(() => this.focusCharacter(0), 200);
                audio.playSelect();
                break;

            // ---- Reset Progress ----

            case 'reset-progress':
                // Confirm and reset
                this.game.resetProgress();
                // Reload character unlock state to defaults
                Characters.roster.forEach(c => {
                    c.unlocked = c.unlockLevel === 0;
                });
                Characters.saveUnlockState();

                // Visual feedback
                const resetBtn = document.getElementById('btn-reset');
                if (resetBtn) {
                    resetBtn.textContent = 'DONE!';
                    setTimeout(() => {
                        resetBtn.textContent = 'RESET';
                    }, 1500);
                }

                this._applySettings();
                audio.playSelect();
                break;
        }
    }

    // Get current focusable elements for the active screen
    getCurrentFocusables() {
        const screen = this.screens[this.currentScreen];
        if (!screen) return [];
        return [...screen.querySelectorAll('[tabindex="0"], button, .answer-btn, .character-card, .map-node')].filter(
            el => !el.disabled && el.offsetParent !== null && el.getAttribute('tabindex') !== '-1'
        );
    }
}
