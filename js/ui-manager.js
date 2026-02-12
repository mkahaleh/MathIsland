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
            settings: document.getElementById('settings-screen'),
            stickers: document.getElementById('sticker-screen'),
            parentStats: document.getElementById('parent-stats-screen'),
            vsaiSelect: document.getElementById('vsai-select'),
            vsaiHud: document.getElementById('vsai-hud'),
            vsaiComplete: document.getElementById('vsai-complete')
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

        // Sticker popup queue
        this._stickerQueue = [];
        this._isShowingStickerPopup = false;

        // Track previously unlocked achievements for diffing
        this._previouslyUnlocked = new Set();

        this._initCharacterGrid();
        this._initEventListeners();
        this._applySettings();
    }

    // ---- Screen Management ----

    showScreen(name) {
        const prevScreen = this.currentScreen;
        const screenOrder = ['menu', 'tutorial', 'characterSelect', 'levelSelect', 'hud', 'pause', 'complete', 'achievements', 'stickers', 'parentStats', 'vsaiSelect', 'vsaiHud', 'vsaiComplete', 'settings'];
        const prevIndex = screenOrder.indexOf(prevScreen);
        const nextIndex = screenOrder.indexOf(name);
        const goingForward = nextIndex >= prevIndex;
        const isSameScreen = prevScreen === name;

        if (isSameScreen) {
            // Same screen - just ensure it's active, no animations
            if (this.screens[name] && !this.screens[name].classList.contains('active')) {
                this.screens[name].classList.add('active');
            }
            this.currentScreen = name;
        } else {
            // Different screen - animate transition

            // Exit animation on old screen
            Object.entries(this.screens).forEach(([key, s]) => {
                if (s && s.classList.contains('active')) {
                    s.classList.add(goingForward ? 'slide-out-left' : 'slide-out-right');
                    setTimeout(() => {
                        s.classList.remove('active', 'slide-out-left', 'slide-out-right',
                            'slide-in-left', 'slide-in-right', 'zoom-in', 'zoom-out');
                    }, 400);
                }
            });

            // Entrance animation on new screen
            const delay = prevScreen ? 150 : 0;
            setTimeout(() => {
                // Don't remove active from ALL screens here - exit timeout handles old ones
                if (this.screens[name]) {
                    this.screens[name].classList.add('active');
                    if (name === 'hud' || name === 'vsaiHud' || name === 'complete') {
                        this.screens[name].classList.add('zoom-in');
                    } else {
                        this.screens[name].classList.add(goingForward ? 'slide-in-right' : 'slide-in-left');
                    }
                    setTimeout(() => {
                        if (this.screens[name]) {
                            this.screens[name].classList.remove('slide-in-left', 'slide-in-right', 'zoom-in');
                        }
                    }, 600);
                }
            }, delay);

            this.currentScreen = name;
        }

        // Update menu stats when showing menu
        if (name === 'menu') {
            this._updateMenuStats();
        }

        // Check sticker unlocks when returning to menu
        if (name === 'menu' && typeof Rewards !== 'undefined') {
            const newStickers = Rewards.checkStickerUnlocks(this.game);
            if (newStickers.length > 0) {
                setTimeout(() => {
                    newStickers.forEach(sticker => this.showStickerPopup(sticker));
                }, 800);
            }
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

        // Zone positions - spread wide across the full map with a winding path
        const zonePositions = [
            { cx: 200, cy: 700 },    // Beach (bottom left)
            { cx: 550, cy: 480 },    // Jungle
            { cx: 950, cy: 600 },    // Cave
            { cx: 1300, cy: 400 },   // Volcano
            { cx: 1050, cy: 200 },   // Sky
            { cx: 1600, cy: 150 }    // Space (top right)
        ];

        // Draw paths between zones
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '1840');
        svg.setAttribute('height', '850');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.zIndex = '0';

        for (let i = 0; i < zonePositions.length - 1; i++) {
            const p1 = zonePositions[i];
            const p2 = zonePositions[i + 1];

            // Curved dotted path between zones (Unity-style)
            const midX = (p1.cx + p2.cx) / 2;
            const midY = Math.min(p1.cy, p2.cy) - 40;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M ${p1.cx} ${p1.cy} Q ${midX} ${midY} ${p2.cx} ${p2.cy}`);
            path.setAttribute('stroke', 'rgba(255,255,255,0.5)');
            path.setAttribute('stroke-width', '6');
            path.setAttribute('stroke-dasharray', '15,10');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('fill', 'none');
            path.setAttribute('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');
            svg.appendChild(path);

            // Animated dots along the path
            const dotPath = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dotPath.setAttribute('r', '5');
            dotPath.setAttribute('fill', '#ffd700');
            dotPath.setAttribute('filter', 'drop-shadow(0 0 6px rgba(255,215,0,0.6))');
            const animateMotion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
            animateMotion.setAttribute('dur', '3s');
            animateMotion.setAttribute('repeatCount', 'indefinite');
            animateMotion.setAttribute('path', `M ${p1.cx} ${p1.cy} Q ${midX} ${midY} ${p2.cx} ${p2.cy}`);
            dotPath.appendChild(animateMotion);
            svg.appendChild(dotPath);
        }

        map.appendChild(svg);

        // Draw island blobs
        Levels.zones.forEach((zone, zi) => {
            const pos = zonePositions[zi];

            // Island background blob with glow (bigger)
            const blob = document.createElement('div');
            blob.className = 'map-island-bg';
            blob.style.cssText = `
                left: ${pos.cx - 160}px;
                top: ${pos.cy - 110}px;
                width: 320px;
                height: 220px;
                background: radial-gradient(ellipse, ${zone.color}55, ${zone.color}20, transparent);
                border-radius: 50%;
                filter: blur(3px);
            `;
            map.appendChild(blob);

            // Zone name label (Unity-style banner, bigger)
            const zoneLabel = document.createElement('div');
            zoneLabel.className = 'map-zone-label';
            zoneLabel.style.cssText = `
                position: absolute;
                left: ${pos.cx - 90}px;
                top: ${pos.cy + 90}px;
                width: 180px;
                text-align: center;
                font-size: 20px;
                font-weight: 800;
                color: white;
                text-shadow: 0 2px 6px rgba(0,0,0,0.5);
                background: ${zone.color}cc;
                padding: 8px 16px;
                border-radius: 14px;
                border: 3px solid rgba(255,255,255,0.3);
                box-shadow: 0 4px 0 rgba(0,0,0,0.2);
                z-index: 3;
                letter-spacing: 0.5px;
            `;
            zoneLabel.textContent = zone.name;
            map.appendChild(zoneLabel);

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

                const nodeSize = isBoss ? 130 : 105;
                node.style.cssText = `
                    left: ${lp.x - nodeSize / 2}px;
                    top: ${lp.y - nodeSize / 2}px;
                    width: ${nodeSize}px;
                    height: ${nodeSize}px;
                    background: linear-gradient(180deg, ${zone.color}ff 0%, ${zone.color}cc 60%, ${zone.color}88 100%);
                    font-size: ${isBoss ? '40px' : '34px'};
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
        const spread = 100;
        const angleStep = (Math.PI * 1.0) / (count - 1 || 1);
        const startAngle = -Math.PI * 0.5;

        for (let i = 0; i < count; i++) {
            const angle = startAngle + angleStep * i;
            positions.push({
                x: center.cx + Math.cos(angle) * spread * (i % 2 === 0 ? 1.1 : 0.7),
                y: center.cy + Math.sin(angle) * spread - i * 18
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

        // Set character portrait in HUD
        this._updateCharacterPortrait();

        this.showScreen('hud');
        this._updateHud();
        this._updateProgress();
        this._showHintButton();
        this._hideComboDisplay();
        this._hidePowerIndicator();

        // Show countdown then start
        this._showCountdown(() => {
            this._showProblem();
            audio.resume();
            audio.startMusic();
        });
    }

    // ---- Level Start Countdown ----

    _showCountdown(callback) {
        const overlay = document.getElementById('countdown-overlay');
        const numberEl = document.getElementById('countdown-number');
        if (!overlay || !numberEl) {
            if (callback) callback();
            return;
        }

        overlay.style.display = 'flex';
        let count = 3;

        const showNumber = () => {
            if (count > 0) {
                numberEl.className = 'countdown-number';
                numberEl.textContent = count;
                // Reset animation
                void numberEl.offsetWidth;
                numberEl.className = 'countdown-number';
                audio.playCountdown();
                count--;
                setTimeout(showNumber, 800);
            } else {
                // Show GO!
                numberEl.className = 'countdown-number go';
                numberEl.textContent = 'GO!';
                void numberEl.offsetWidth;
                audio.playLevelStart();

                setTimeout(() => {
                    overlay.style.display = 'none';
                    if (callback) callback();
                }, 600);
            }
        };

        showNumber();
    }

    _updateCharacterPortrait() {
        const portrait = document.getElementById('hud-character-portrait');
        const emoji = document.getElementById('hud-char-emoji');
        const mood = document.getElementById('hud-char-mood');
        if (!portrait || !emoji) return;

        const char = this.game.selectedCharacter;
        if (char) {
            emoji.textContent = char.emoji;
        }
        if (mood) mood.textContent = '';
        portrait.className = 'hud-character-portrait';
    }

    setCharacterMood(moodType) {
        const portrait = document.getElementById('hud-character-portrait');
        const mood = document.getElementById('hud-char-mood');
        const char = this.game.selectedCharacter;
        if (!portrait || !char) return;

        portrait.classList.remove('happy', 'sad');
        void portrait.offsetWidth; // Reset animation

        if (moodType === 'happy' || moodType === 'celebrate') {
            portrait.classList.add('happy');
            if (mood && char.animations && char.animations.happy) {
                mood.textContent = char.animations.happy[1] || '✨';
            }
        } else if (moodType === 'sad') {
            portrait.classList.add('sad');
            if (mood && char.animations && char.animations.sad) {
                mood.textContent = char.animations.sad[1] || '💫';
            }
        }

        // Clear mood after a delay
        setTimeout(() => {
            if (mood) mood.textContent = '';
            portrait.classList.remove('happy', 'sad');
        }, 1500);
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
            this.setCharacterMood('happy');

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
            this.setCharacterMood('sad');

            const rect = btnElement.getBoundingClientRect();
            this.game.particles.wrongShake(rect.left + rect.width / 2, rect.top + rect.height / 2);

            // Highlight correct answer
            document.querySelectorAll('.answer-btn').forEach(b => {
                if (String(b.getAttribute('data-answer')) === String(result.correctAnswer)) {
                    b.classList.add('correct');
                }
            });

            // Encouraging message instead of just showing the answer
            const encouragement = typeof this.game.getEncouragementMessage === 'function'
                ? this.game.getEncouragementMessage(false, 0)
                : "Good try! Keep going!";
            this._showFeedback('wrong', encouragement);

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
        // Use game engine's encouragement system if available
        if (typeof this.game.getEncouragementMessage === 'function') {
            return this.game.getEncouragementMessage(true, this.game.streak);
        }

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

    // ---- Sticker Gallery ----

    showStickerGallery() {
        const gallery = document.getElementById('sticker-gallery');
        const countEl = document.getElementById('sticker-count');
        if (!gallery) return;

        gallery.innerHTML = '';
        const collected = typeof Rewards !== 'undefined' ? Rewards.getCollectedStickers() : [];

        const allStickers = typeof Rewards !== 'undefined' ? Rewards.stickerDefs : [];
        let collectedCount = 0;

        allStickers.forEach(sticker => {
            const isCollected = collected.includes(sticker.id);
            if (isCollected) collectedCount++;

            const card = document.createElement('div');
            card.className = `sticker-card ${isCollected ? 'collected' : ''}`;
            card.setAttribute('tabindex', '0');
            card.innerHTML = `
                <div class="sticker-card-icon">${isCollected ? sticker.icon : '\u{1F512}'}</div>
                <div class="sticker-card-name">${isCollected ? sticker.name : '???'}</div>
                <div class="sticker-card-desc">${isCollected ? sticker.description : 'Not yet unlocked'}</div>
            `;
            gallery.appendChild(card);
        });

        if (countEl) {
            countEl.textContent = `${collectedCount}/${allStickers.length}`;
        }

        this.showScreen('stickers');
        setTimeout(() => {
            const firstCard = gallery.querySelector('.sticker-card');
            if (firstCard) firstCard.focus();
        }, 200);
    }

    // ---- Parent Stats ----

    showParentStats() {
        const container = document.getElementById('parent-stats-container');
        if (!container) return;

        const stats = typeof Rewards !== 'undefined' ? Rewards.getParentStats() : {};

        container.innerHTML = '';

        const statItems = [
            { icon: '\u{1F4C5}', value: stats.totalLogins || 0, label: 'Total Sessions' },
            { icon: '\u{1F525}', value: `${stats.currentStreak || 0} days`, label: 'Login Streak' },
            { icon: '\u{1F4CA}', value: `${stats.levelsCompleted || 0}/30`, label: 'Levels Done' },
            { icon: '\u2B50', value: `${stats.totalStars || 0}/90`, label: 'Stars Earned' },
            { icon: '\u{1F3AF}', value: `${stats.accuracy || 0}%`, label: 'Accuracy' },
            { icon: '\u23F1\uFE0F', value: `${stats.averageTime || 0}s`, label: 'Avg Answer Time' },
            { icon: '\u{1F3C6}', value: `${stats.stickersCollected || 0}/${stats.totalStickers || 0}`, label: 'Stickers' },
            { icon: '\u{1F4AA}', value: stats.strongest || '-', label: 'Strongest Area' },
            { icon: '\u{1F4DD}', value: stats.weakest || '-', label: 'Needs Practice' }
        ];

        statItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'parent-stat-card';
            card.innerHTML = `
                <div class="stat-icon">${item.icon}</div>
                <div class="stat-value">${item.value}</div>
                <div class="stat-label">${item.label}</div>
            `;
            container.appendChild(card);
        });

        this.showScreen('parentStats');
    }

    // ---- Daily Reward Popup ----

    showDailyRewardPopup(loginData) {
        const popup = document.getElementById('daily-reward-popup');
        if (!popup || !loginData.isNew) return;

        const iconEl = document.getElementById('daily-reward-icon');
        const titleEl = document.getElementById('daily-reward-title');
        const textEl = document.getElementById('daily-reward-text');
        const streakEl = document.getElementById('daily-reward-streak');

        if (iconEl) iconEl.textContent = loginData.streak >= 7 ? '\u{1F381}' : '\u{1F31F}';
        if (titleEl) titleEl.textContent = 'Welcome Back!';
        if (textEl) textEl.textContent = loginData.streak > 1
            ? `You've played ${loginData.streak} days in a row!`
            : 'Start your adventure!';
        if (streakEl) streakEl.textContent = `Day ${loginData.streak}`;

        popup.style.display = 'flex';

        // Focus the claim button
        setTimeout(() => {
            const claimBtn = popup.querySelector('.daily-reward-claim');
            if (claimBtn) claimBtn.focus();
        }, 500);
    }

    hideDailyRewardPopup() {
        const popup = document.getElementById('daily-reward-popup');
        if (popup) popup.style.display = 'none';
    }

    // ---- Sticker Popup ----

    showStickerPopup(sticker) {
        this._stickerQueue.push(sticker);
        if (!this._isShowingStickerPopup) {
            this._processStickerQueue();
        }
    }

    _processStickerQueue() {
        if (this._stickerQueue.length === 0) {
            this._isShowingStickerPopup = false;
            return;
        }

        this._isShowingStickerPopup = true;
        const sticker = this._stickerQueue.shift();

        const popup = document.getElementById('sticker-popup');
        const iconEl = document.getElementById('sticker-popup-icon');
        const nameEl = document.getElementById('sticker-popup-name');

        if (!popup) {
            this._processStickerQueue();
            return;
        }

        if (iconEl) iconEl.textContent = sticker.icon;
        if (nameEl) nameEl.textContent = sticker.name;

        popup.style.display = 'flex';
        audio.playStar();

        // Auto-close or wait for button
        setTimeout(() => {
            const okBtn = popup.querySelector('.sticker-popup-ok');
            if (okBtn) okBtn.focus();
        }, 300);
    }

    hideStickerPopup() {
        const popup = document.getElementById('sticker-popup');
        if (popup) popup.style.display = 'none';
        this._processStickerQueue();
    }

    // ---- VS AI Mode UI ----

    showVsAiSelect() {
        const container = document.getElementById('vsai-opponents');
        if (!container) return;

        container.innerHTML = '';
        const opponents = this.game.vsAI.getOpponents();

        opponents.forEach((opp, index) => {
            const card = document.createElement('div');
            card.className = 'vsai-opponent-card';
            card.setAttribute('tabindex', '0');
            card.setAttribute('data-opponent-id', opp.id);
            card.setAttribute('data-index', index);

            card.innerHTML = `
                <div class="vsai-opp-emoji">${opp.emoji}</div>
                <div class="vsai-opp-card-name">${opp.name}</div>
            `;

            card.addEventListener('focus', () => this._onVsAiOpponentFocus(opp));
            card.addEventListener('click', () => this._onVsAiOpponentClick(opp));
            container.appendChild(card);
        });

        this._selectedVsAiOpponent = opponents[0];
        this.showScreen('vsaiSelect');

        setTimeout(() => {
            const firstCard = container.querySelector('.vsai-opponent-card');
            if (firstCard) firstCard.focus();
        }, 300);
    }

    _onVsAiOpponentFocus(opponent) {
        this._selectedVsAiOpponent = opponent;
        const nameEl = document.getElementById('vsai-opp-name');
        const descEl = document.getElementById('vsai-opp-desc');
        if (nameEl) nameEl.textContent = `${opponent.emoji} ${opponent.name}`;
        if (descEl) descEl.textContent = opponent.description;

        // Update visual selection
        document.querySelectorAll('.vsai-opponent-card').forEach(c => {
            c.classList.toggle('selected', c.dataset.opponentId === opponent.id);
        });
        audio.playNavigate();
    }

    _onVsAiOpponentClick(opponent) {
        this._selectedVsAiOpponent = opponent;
        this._onVsAiOpponentFocus(opponent);
        audio.playSelect();
    }

    startVsAiMatch() {
        if (!this._selectedVsAiOpponent) return;

        const matchInfo = this.game.startVsAiMatch(
            this._selectedVsAiOpponent.id,
            this.game.settings.difficulty
        );

        // Set up player avatar
        const playerAvatar = document.getElementById('vsai-player-avatar');
        if (playerAvatar && this.game.selectedCharacter) {
            playerAvatar.textContent = this.game.selectedCharacter.emoji;
        } else if (playerAvatar) {
            playerAvatar.textContent = '\u{1F9D2}';
        }

        // Set up AI avatar
        const aiAvatar = document.getElementById('vsai-ai-avatar');
        const aiName = document.getElementById('vsai-ai-name');
        if (aiAvatar) aiAvatar.textContent = matchInfo.opponent.emoji;
        if (aiName) aiName.textContent = matchInfo.opponent.name;

        // Set thinking emoji
        const thinkEmoji = document.getElementById('vsai-thinking-emoji');
        if (thinkEmoji) thinkEmoji.textContent = matchInfo.opponent.emoji;

        // Reset scores
        this._updateVsAiScores(0, 0, 1, matchInfo.totalRounds);

        // Track total rounds answered for accuracy
        this._vsAiTotalRounds = 0;
        this._vsAiCorrectAnswers = 0;

        this.showScreen('vsaiHud');

        // Show countdown then start first round
        this._showCountdown(() => {
            this._startVsAiRound();
            audio.resume();
            audio.startMusic();
        });
    }

    _startVsAiRound() {
        const problem = this.game.generateVsAiProblem();
        const roundInfo = this.game.vsAI.startRound(problem);

        // Show round number
        this._updateVsAiScores(
            this.game.vsAI.playerScore,
            this.game.vsAI.aiScore,
            this.game.vsAI.currentRound,
            this.game.vsAI.totalRounds
        );

        // Show problem
        const problemText = document.getElementById('vsai-problem-text');
        if (problemText) problemText.innerHTML = problem.questionHtml || problem.question;

        // Show answer options
        const options = document.getElementById('vsai-answer-options');
        if (options) {
            options.innerHTML = '';
            this.selectedAnswerIndex = 0;

            problem.options.forEach((opt, i) => {
                const btn = document.createElement('button');
                btn.className = 'answer-btn vsai-answer-btn';
                btn.textContent = opt;
                btn.setAttribute('tabindex', '0');
                btn.setAttribute('data-answer', opt);
                btn.setAttribute('data-index', i);

                btn.addEventListener('focus', () => {
                    this.selectedAnswerIndex = i;
                    audio.playNavigate();
                });
                btn.addEventListener('click', () => this._onVsAiAnswerClick(opt, btn));
                options.appendChild(btn);
            });

            // Focus first option
            setTimeout(() => {
                const firstBtn = options.querySelector('.vsai-answer-btn');
                if (firstBtn) firstBtn.focus();
            }, 200);
        }

        // Show AI thinking
        const thinking = document.getElementById('vsai-ai-thinking');
        const thinkText = document.getElementById('vsai-thinking-text');
        if (thinking) thinking.classList.add('active');
        if (thinkText) thinkText.textContent = 'Thinking...';

        // Hide round result
        const roundResult = document.getElementById('vsai-round-result');
        if (roundResult) roundResult.style.display = 'none';

        // Start AI thinking progress animation
        this._vsAiProgressLoop = setInterval(() => {
            const fill = document.getElementById('vsai-thinking-fill');
            if (fill && this.game.vsAI) {
                fill.style.width = `${this.game.vsAI.aiProgressPercent}%`;

                // Color changes as AI gets closer
                const pct = this.game.vsAI.aiProgressPercent;
                if (pct > 80) {
                    fill.style.background = 'linear-gradient(90deg, #ff6b6b, #ee5a24)';
                    if (thinkText) thinkText.textContent = 'Almost there!';
                } else if (pct > 50) {
                    fill.style.background = 'linear-gradient(90deg, #ffd93d, #ff6b6b)';
                    if (thinkText) thinkText.textContent = 'Hmm...';
                } else {
                    fill.style.background = 'linear-gradient(90deg, #6c5ce7, #a29bfe)';
                    if (thinkText) thinkText.textContent = 'Thinking...';
                }
            }
        }, 60);

        // Listen for AI answer
        this._vsAiAnswerHandler = (e) => {
            this._onAiAnswered(e.detail);
        };
        document.addEventListener('ai-answered', this._vsAiAnswerHandler, { once: true });
    }

    _onVsAiAnswerClick(answer, btnElement) {
        if (this.game.isAnswering) return;

        const result = this.game.submitVsAiAnswer(answer);
        if (!result) return;

        this._vsAiTotalRounds++;

        // Visual feedback
        if (result.correct) {
            btnElement.classList.add('correct');
            audio.playCorrect();
            this._vsAiCorrectAnswers++;

            if (result.playerWonRound) {
                // Player answered first and correctly!
                this._showVsAiRoundResult(true, 'You got it first!', '');
            } else if (result.aiHasAnswered) {
                // Both answered, player was correct but AI was faster
                this._showVsAiRoundResult(false, 'Correct, but AI was faster!', '');
            }
            // If AI hasn't answered yet and player is correct, wait is handled by playerWonRound
        } else {
            btnElement.classList.add('wrong');
            audio.playWrong();

            // Highlight correct answer
            document.querySelectorAll('.vsai-answer-btn').forEach(b => {
                if (String(b.getAttribute('data-answer')) === String(result.correctAnswer)) {
                    b.classList.add('correct');
                }
            });

            if (result.aiHasAnswered) {
                // Both have answered - check if AI already won or if both got it wrong
                this._showVsAiRoundResult(false, 'Not quite!', '');
                // End round - no one gets a point for this one
                this._endVsAiRound(false);
                return;
            }
            // If AI hasn't answered yet, let it continue
        }

        if (result.playerWonRound !== undefined) {
            this._endVsAiRound(result.playerWonRound);
        }
    }

    _onAiAnswered(detail) {
        clearInterval(this._vsAiProgressLoop);

        // Update AI thinking display
        const thinking = document.getElementById('vsai-ai-thinking');
        const thinkText = document.getElementById('vsai-thinking-text');
        const fill = document.getElementById('vsai-thinking-fill');
        if (fill) fill.style.width = '100%';

        if (detail.aiCorrect) {
            if (thinking) thinking.classList.add('ai-answered-correct');
            if (thinkText) thinkText.textContent = 'Got it!';
        } else {
            if (thinking) thinking.classList.add('ai-answered-wrong');
            if (thinkText) thinkText.textContent = 'Oops!';
        }

        if (!this.game.vsAI.playerHasAnswered) {
            // Player hasn't answered yet
            if (detail.aiCorrect) {
                audio.playVsAiAiWin();
                this._showVsAiRoundResult(false, `${this.game.vsAI.currentOpponent.emoji} beat you!`, detail.taunt || '');
                this._endVsAiRound(false);
            } else {
                // AI got it wrong - player still has a chance!
                if (thinkText) thinkText.textContent = 'Wrong answer!';
                // Don't end round yet - player can still answer
            }
        } else {
            // Player already answered (and was wrong, since correct would have ended the round)
            // Now AI also answered - end the round, nobody wins
            if (detail.aiCorrect) {
                this._showVsAiRoundResult(false, `${this.game.vsAI.currentOpponent.emoji} got it!`, detail.taunt || '');
                // AI gets the point since it was correct
                this.game.vsAI.aiScore++;
            } else {
                this._showVsAiRoundResult(false, 'Neither got it right!', '');
            }
            this._endVsAiRound(false);
        }
    }

    _showVsAiRoundResult(playerWon, text, taunt) {
        const overlay = document.getElementById('vsai-round-result');
        const icon = document.getElementById('vsai-result-icon');
        const textEl = document.getElementById('vsai-result-text');
        const tauntEl = document.getElementById('vsai-result-taunt');

        if (!overlay) return;

        overlay.style.display = 'flex';
        if (icon) icon.textContent = playerWon ? '\u{1F389}' : '\u{1F914}';
        if (textEl) textEl.textContent = text;
        if (tauntEl) tauntEl.textContent = taunt;

        overlay.className = `vsai-round-result ${playerWon ? 'player-won' : 'ai-won'}`;
    }

    _endVsAiRound(playerWonRound) {
        // Clean up listeners and timers
        clearInterval(this._vsAiProgressLoop);
        if (this._vsAiAnswerHandler) {
            document.removeEventListener('ai-answered', this._vsAiAnswerHandler);
        }

        const roundResult = this.game.endVsAiRound(playerWonRound);

        // Update scores
        this._updateVsAiScores(
            roundResult.playerScore,
            roundResult.aiScore,
            roundResult.currentRound,
            roundResult.totalRounds
        );

        // Check if match is over
        if (roundResult.isMatchOver) {
            setTimeout(() => {
                this._showVsAiMatchComplete();
            }, 2000);
        } else {
            // Start next round after delay
            setTimeout(() => {
                this.game.isAnswering = false;

                // Reset AI thinking display
                const thinking = document.getElementById('vsai-ai-thinking');
                if (thinking) {
                    thinking.classList.remove('active', 'ai-answered-correct', 'ai-answered-wrong');
                }
                const fill = document.getElementById('vsai-thinking-fill');
                if (fill) fill.style.width = '0%';

                this._startVsAiRound();
            }, 2200);
        }
    }

    _updateVsAiScores(playerScore, aiScore, round, total) {
        const pScore = document.getElementById('vsai-player-score');
        const aScore = document.getElementById('vsai-ai-score');
        const roundNum = document.getElementById('vsai-round-num');
        const roundOf = document.querySelector('.vsai-round-of');

        if (pScore) pScore.textContent = playerScore;
        if (aScore) aScore.textContent = aiScore;
        if (roundNum) roundNum.textContent = round;
        if (roundOf) roundOf.textContent = `/ ${total}`;

        // Animate score change
        if (pScore) { pScore.classList.remove('score-pop'); void pScore.offsetWidth; pScore.classList.add('score-pop'); }
        if (aScore) { aScore.classList.remove('score-pop'); void aScore.offsetWidth; aScore.classList.add('score-pop'); }
    }

    _showVsAiMatchComplete() {
        const results = this.game.endVsAiMatch();
        audio.stopMusic();

        // Set up complete screen
        const title = document.getElementById('vsai-complete-title');
        const message = document.getElementById('vsai-complete-message');
        const pAvatar = document.getElementById('vsai-final-player-avatar');
        const aAvatar = document.getElementById('vsai-final-ai-avatar');
        const aName = document.getElementById('vsai-final-ai-name');
        const pScore = document.getElementById('vsai-final-player-score');
        const aScore = document.getElementById('vsai-final-ai-score');
        const streak = document.getElementById('vsai-final-streak');
        const accuracy = document.getElementById('vsai-final-accuracy');

        if (title) {
            if (results.playerWon) {
                title.textContent = '\u{1F3C6} You Win!';
            } else if (results.isTie) {
                title.textContent = '\u{1F91D} It\'s a Tie!';
            } else {
                title.textContent = 'Good Game!';
            }
        }

        if (message) message.textContent = results.message;
        if (pAvatar && this.game.selectedCharacter) pAvatar.textContent = this.game.selectedCharacter.emoji;
        else if (pAvatar) pAvatar.textContent = '\u{1F9D2}';
        if (aAvatar) aAvatar.textContent = results.opponent.emoji;
        if (aName) aName.textContent = results.opponent.name;
        if (pScore) pScore.textContent = results.playerScore;
        if (aScore) aScore.textContent = results.aiScore;
        if (streak) streak.textContent = this.game.bestStreak;
        if (accuracy) {
            const acc = this._vsAiTotalRounds > 0
                ? Math.round((this._vsAiCorrectAnswers / this._vsAiTotalRounds) * 100)
                : 0;
            accuracy.textContent = `${acc}%`;
        }

        this.showScreen('vsaiComplete');

        // Effects
        if (results.playerWon) {
            this.game.particles.confetti(3000);
            audio.playFanfare();
        } else {
            audio.playStar();
        }

        // Focus rematch button
        setTimeout(() => {
            const rematchBtn = document.querySelector('[data-action="vsai-rematch"]');
            if (rematchBtn) rematchBtn.focus();
        }, 500);
    }

    _cleanupVsAi() {
        clearInterval(this._vsAiProgressLoop);
        if (this._vsAiAnswerHandler) {
            document.removeEventListener('ai-answered', this._vsAiAnswerHandler);
        }
        if (this.game.vsAI) {
            this.game.vsAI._cancelAiTimer();
            clearInterval(this.game.vsAI._aiProgressInterval);
            this.game.vsAI.roundActive = false;
        }
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
                    // Check if we came from VS AI flow
                    if (this._vsAiAfterCharSelect) {
                        this._vsAiAfterCharSelect = false;
                        this.showVsAiSelect();
                    } else {
                        this.game.setState('levelSelect');
                        this.showScreen('levelSelect');
                        this.buildIslandMap();
                        // Focus first available level
                        setTimeout(() => {
                            this.focusLevel(this.game.progress.highestUnlocked);
                        }, 300);
                    }
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

            case 'stickers':
                this.showStickerGallery();
                audio.playSelect();
                break;

            case 'parent-stats':
                this.showParentStats();
                audio.playSelect();
                break;

            case 'back-to-settings':
                this.showScreen('settings');
                this._applySettings();
                audio.playSelect();
                break;

            case 'claim-daily-reward':
                if (typeof Rewards !== 'undefined') {
                    const reward = Rewards.claimDailyReward();
                    if (reward && reward.sticker) {
                        this.showStickerPopup(reward.sticker);
                    }
                }
                this.hideDailyRewardPopup();
                audio.playSelect();
                break;

            case 'close-sticker-popup':
                this.hideStickerPopup();
                audio.playSelect();
                break;

            case 'daily-challenge':
                // Start daily challenge - use same flow as play
                this.game.setState('characterSelect');
                this.showScreen('characterSelect');
                this._initCharacterGrid();
                setTimeout(() => this.focusCharacter(0), 200);
                audio.playSelect();
                break;

            // ---- VS AI actions ----

            case 'vs-ai':
                // Need character first; if already selected, go to opponent select
                if (this.game.selectedCharacter) {
                    this.showVsAiSelect();
                } else {
                    // Go to character select, then redirect to VS AI
                    this._vsAiAfterCharSelect = true;
                    this.game.setState('characterSelect');
                    this.showScreen('characterSelect');
                    this._initCharacterGrid();
                    setTimeout(() => this.focusCharacter(0), 200);
                }
                audio.playSelect();
                break;

            case 'vsai-back-to-menu':
                this.game.setState('menu');
                this.showScreen('menu');
                audio.playSelect();
                setTimeout(() => {
                    const playBtn = document.querySelector('.btn-play');
                    if (playBtn) playBtn.focus();
                }, 200);
                break;

            case 'vsai-start-match':
                this.startVsAiMatch();
                audio.playSelect();
                break;

            case 'vsai-quit':
                this._cleanupVsAi();
                this.game.isVsAiMode = false;
                this.game.isAnswering = false;
                this.game.setState('menu');
                this.showScreen('menu');
                audio.stopMusic();
                audio.playSelect();
                break;

            case 'vsai-rematch':
                this._cleanupVsAi();
                this.game.isAnswering = false;
                this.startVsAiMatch();
                audio.playSelect();
                break;

            case 'vsai-change-opponent':
                this._cleanupVsAi();
                this.game.isAnswering = false;
                this.showVsAiSelect();
                audio.playSelect();
                break;

            case 'vsai-back-to-menu-end':
                this._cleanupVsAi();
                this.game.isVsAiMode = false;
                this.game.isAnswering = false;
                this.game.setState('menu');
                this.showScreen('menu');
                this.game.particles.clear();
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
