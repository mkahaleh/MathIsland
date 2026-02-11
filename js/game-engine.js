/* ========================================
   MATH ISLAND - Game Engine
   Core game loop and state management
   ======================================== */

class GameEngine {
    constructor() {
        this.state = 'menu'; // menu, characterSelect, levelSelect, playing, levelComplete, settings
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.renderer = new IslandRenderer(this.canvas);
        this.particles = new ParticleSystem('particle-canvas');
        this.mathEngine = new MathEngine();

        // Game state
        this.selectedCharacter = null;
        this.currentLevel = null;
        this.currentZone = null;
        this.progress = Levels.loadProgress();
        this.settings = Utils.load('settings', {
            sfx: true,
            music: true,
            difficulty: 'normal',
            timer: true
        });

        // Level play state
        this.problems = [];
        this.currentProblemIndex = 0;
        this.score = 0;
        this.correctCount = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.timeRemaining = 0;
        this.timerInterval = null;
        this.isAnswering = false;
        this.hintsUsed = 0;

        // --- NEW: Pause System ---
        this.isPaused = false;
        this._pausedTimeRemaining = 0;

        // --- NEW: Hint System (Coral's ability) ---
        this.hintsRemaining = 0;

        // --- NEW: Level Timing ---
        this.levelStartTime = 0;
        this.totalAnswerTime = 0;
        this.answerTimes = [];
        this._answerStartTime = 0;

        // --- NEW: Character Reaction State ---
        this.characterMood = 'idle';
        this._moodResetTimer = null;

        // --- NEW: Score Animation ---
        this.lastScoreGain = 0;

        // --- NEW: Adaptive Difficulty ---
        this._performanceHistory = [];  // Last N answers: true/false
        this._adaptiveLevel = 0;       // -2 to +2 adjustment
        this._sessionLevelsPlayed = 0;  // For session sticker tracking

        // --- NEW: Achievement System ---
        this.achievements = this._initAchievements();
        this._loadAchievements();

        // Animation
        this.animationTime = 0;
        this.lastFrameTime = performance.now();
        this.isRunning = true;

        this._gameLoop = this._gameLoop.bind(this);
        requestAnimationFrame(this._gameLoop);
    }

    // ---- Game Loop ----

    _gameLoop(now) {
        if (!this.isRunning) return;

        const dt = Math.min((now - this.lastFrameTime) / 1000, 0.05);
        this.lastFrameTime = now;

        // Skip animation updates when paused
        if (!this.isPaused) {
            this.animationTime += dt;
        }

        // Update renderer
        this.renderer.time = this.animationTime;
        this.renderer.update(dt);

        // Draw based on state
        switch (this.state) {
            case 'menu':
                this.renderer.drawMenuBackground();
                break;
            case 'characterSelect':
                this._drawCharacterSelectBg();
                break;
            case 'levelSelect':
                this.renderer.drawIslandMap(this.progress);
                break;
            case 'playing':
                this._drawPlayingScene();
                break;
            case 'levelComplete':
                this._drawPlayingScene(); // Keep background
                break;
        }

        requestAnimationFrame(this._gameLoop);
    }

    _drawCharacterSelectBg() {
        const ctx = this.ctx;
        const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, '#ffecd2');
        grad.addColorStop(0.5, '#fcb69f');
        grad.addColorStop(1, '#ee7752');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Floating characters decoration
        this.renderer._drawSparkles();
    }

    _drawPlayingScene() {
        if (this.currentZone) {
            this.renderer.drawScene(this.currentZone.id);
        } else {
            this.renderer.drawScene('beach');
        }

        // Draw the selected character on the scene
        if (this.selectedCharacter) {
            Characters.drawCharacter(
                this.ctx,
                this.selectedCharacter,
                200, 700,
                120,
                this.animationTime
            );
        }
    }

    // ---- State Management ----

    setState(newState) {
        this.state = newState;
    }

    selectCharacter(charId) {
        this.selectedCharacter = Characters.getCharacter(charId);
        Utils.save('selectedCharacter', charId);
    }

    // ---- Pause System ----

    pauseGame() {
        if (this.isPaused || this.state !== 'playing') return;
        this.isPaused = true;

        // Pause the timer by saving remaining time and clearing the interval
        this._pausedTimeRemaining = this.timeRemaining;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    resumeGame() {
        if (!this.isPaused) return;
        this.isPaused = false;

        // Restore timer from paused state
        this.timeRemaining = this._pausedTimeRemaining;

        // Restart the timer interval if the timer setting is active and we have callbacks stored
        if (this.settings.timer && this._timerOnTick && this._timerOnExpire) {
            this.timerInterval = setInterval(() => {
                this.timeRemaining -= 0.5;
                if (this._timerOnTick) {
                    this._timerOnTick(this.timeRemaining, this._timerMaxTime);
                }

                if (this.timeRemaining <= 0) {
                    this.stopTimer();
                    if (this._timerOnExpire) this._timerOnExpire();
                }
            }, 500);
        }
    }

    // ---- Level Management ----

    startLevel(levelNum) {
        const levelDef = Levels.getLevel(levelNum);
        if (!levelDef) return false;

        this.currentLevel = { num: levelNum, ...levelDef };
        this.currentZone = Levels.getZoneForLevel(levelNum);
        this.mathEngine.setDifficulty(this.settings.difficulty);

        // Generate problems
        this.problems = [];
        for (let i = 0; i < levelDef.problems; i++) {
            this.problems.push(this.mathEngine.generate(levelNum, levelDef.type));
        }

        // Reset play state
        this.currentProblemIndex = 0;
        this.score = 0;
        this.correctCount = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.hintsUsed = 0;
        this.isAnswering = false;

        // Reset pause state
        this.isPaused = false;
        this._pausedTimeRemaining = 0;

        // Reset hint system based on character ability
        if (this.selectedCharacter && this.selectedCharacter.bonusType === 'hint') {
            this.hintsRemaining = this.selectedCharacter.bonusValue;
        } else {
            this.hintsRemaining = 0;
        }

        // Reset level timing
        this.levelStartTime = performance.now();
        this.totalAnswerTime = 0;
        this.answerTimes = [];
        this._answerStartTime = performance.now();

        // Reset character mood
        this._setCharacterMood('idle');

        // Reset score animation tracking
        this.lastScoreGain = 0;

        // Reset adaptive tracking for this level
        this._performanceHistory = [];

        // Timer
        this.timeRemaining = levelDef.timePerProblem;

        this.setState('playing');

        // Track session levels
        this._sessionLevelsPlayed++;

        return true;
    }

    getCurrentProblem() {
        return this.problems[this.currentProblemIndex] || null;
    }

    submitAnswer(answer) {
        if (this.isAnswering) return null;
        this.isAnswering = true;

        const problem = this.getCurrentProblem();
        if (!problem) return null;

        // Track answer timing
        const answerTime = (performance.now() - this._answerStartTime) / 1000;
        this.answerTimes.push(answerTime);
        this.totalAnswerTime += answerTime;

        const isCorrect = String(answer) === String(problem.answer);
        const result = {
            correct: isCorrect,
            correctAnswer: problem.answer,
            givenAnswer: answer,
            answerTime: answerTime
        };

        if (isCorrect) {
            // Score calculation
            let points = 100;
            const timeBonus = Math.floor(this.timeRemaining * 2);
            points += timeBonus;

            // Streak bonus
            this.streak++;
            if (this.streak > this.bestStreak) this.bestStreak = this.streak;
            if (this.streak >= 3) {
                points = Math.floor(points * (1 + this.streak * 0.1));
            }

            // Character bonus
            if (this.selectedCharacter) {
                if (this.selectedCharacter.bonusType === 'streak') {
                    points = Math.floor(points * this.selectedCharacter.bonusValue);
                } else if (this.selectedCharacter.bonusType === 'doubleAll') {
                    points *= this.selectedCharacter.bonusValue;
                } else if (this.selectedCharacter.bonusType === 'tripleAll') {
                    points *= this.selectedCharacter.bonusValue;
                } else if (this.selectedCharacter.bonusType === 'doubleStart' &&
                           this.currentProblemIndex < this.selectedCharacter.bonusValue) {
                    points *= 2;
                }
            }

            this.score += points;
            this.correctCount++;
            this.lastScoreGain = points;
            result.points = points;

            // Set character mood to happy
            this._setCharacterMood('happy');

            // Check achievements after correct answer
            result.newAchievements = this._checkAchievementsOnAnswer(answerTime);
        } else {
            // Wrong answer
            if (this.selectedCharacter && this.selectedCharacter.bonusType === 'shield') {
                // Shield character doesn't break streak
            } else {
                this.streak = 0;
            }

            this.lastScoreGain = 0;

            // Set character mood to sad
            this._setCharacterMood('sad');

            result.newAchievements = [];
        }

        // Track performance for adaptive difficulty
        this._performanceHistory.push(isCorrect);
        if (this._performanceHistory.length > 10) {
            this._performanceHistory.shift();
        }
        this._updateAdaptiveDifficulty();

        return result;
    }

    nextProblem() {
        this.currentProblemIndex++;
        this.isAnswering = false;

        if (this.currentProblemIndex >= this.problems.length) {
            return this._completeLevel();
        }

        // Reset timer for next problem
        this.timeRemaining = this.currentLevel.timePerProblem;

        // Reset answer start time for timing tracking
        this._answerStartTime = performance.now();

        return { done: false };
    }

    _completeLevel() {
        // Calculate stars
        const thresholds = this.currentLevel.starThresholds;
        let stars = 0;
        if (this.correctCount >= thresholds[0]) stars = 1;
        if (this.correctCount >= thresholds[1]) stars = 2;
        if (this.correctCount >= thresholds[2]) stars = 3;

        // Calculate timing stats
        const levelEndTime = performance.now();
        const totalLevelTime = (levelEndTime - this.levelStartTime) / 1000;
        const averageAnswerTime = this.answerTimes.length > 0
            ? this.totalAnswerTime / this.answerTimes.length
            : 0;

        // Save progress
        const levelNum = this.currentLevel.num;
        if (!this.progress.completed[levelNum] || this.progress.completed[levelNum].stars < stars) {
            this.progress.completed[levelNum] = {
                stars: stars,
                score: this.score,
                correct: this.correctCount,
                total: this.problems.length,
                bestStreak: this.bestStreak,
                totalTime: Math.round(totalLevelTime * 10) / 10,
                averageTime: Math.round(averageAnswerTime * 10) / 10
            };
        }

        // Unlock next level
        if (levelNum >= this.progress.highestUnlocked) {
            this.progress.highestUnlocked = levelNum + 1;
        }

        // Count total stars
        this.progress.totalStars = Object.values(this.progress.completed)
            .reduce((sum, l) => sum + (l.stars || 0), 0);

        Levels.saveProgress(this.progress);

        // Check character unlocks
        const completedCount = Object.keys(this.progress.completed).length;
        const newUnlocks = Characters.checkUnlocks(completedCount);
        Characters.saveUnlockState();

        // Set character mood to celebrate
        this._setCharacterMood('celebrate');

        // Check achievements on level complete
        const newAchievements = this._checkAchievementsOnLevelComplete(stars);

        this.setState('levelComplete');

        return {
            done: true,
            stars: stars,
            score: this.score,
            correct: this.correctCount,
            total: this.problems.length,
            bestStreak: this.bestStreak,
            newUnlocks: newUnlocks,
            levelNum: levelNum,
            totalTime: Math.round(totalLevelTime * 10) / 10,
            averageTime: Math.round(averageAnswerTime * 10) / 10,
            answerTimes: this.answerTimes,
            newAchievements: newAchievements
        };
    }

    // ---- Timer Management ----

    startTimer(onTick, onExpire) {
        this.stopTimer();
        if (!this.settings.timer) return;

        this.timeRemaining = this.currentLevel.timePerProblem;

        // Character time bonus
        if (this.selectedCharacter && this.selectedCharacter.bonusType === 'time') {
            this.timeRemaining += this.selectedCharacter.bonusValue;
        }

        // Store callbacks for pause/resume
        this._timerOnTick = onTick;
        this._timerOnExpire = onExpire;
        this._timerMaxTime = this.timeRemaining;

        this.timerInterval = setInterval(() => {
            // Do not decrement while paused (safety check; timer should be cleared on pause)
            if (this.isPaused) return;

            this.timeRemaining -= 0.5;
            if (onTick) onTick(this.timeRemaining, this._timerMaxTime);

            if (this.timeRemaining <= 0) {
                this.stopTimer();
                if (onExpire) onExpire();
            }
        }, 500);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        // Clear stored callbacks
        this._timerOnTick = null;
        this._timerOnExpire = null;
        this._timerMaxTime = 0;
    }

    // ---- Hint System (Coral's ability - bonusType: 'hint') ----

    useHint() {
        // Only available when character has hint bonus and hints remain
        if (!this.selectedCharacter || this.selectedCharacter.bonusType !== 'hint') {
            return null;
        }
        if (this.hintsRemaining <= 0) {
            return null;
        }

        const problem = this.getCurrentProblem();
        if (!problem || !problem.options || problem.options.length <= 2) {
            return null;
        }

        // Consume one hint
        this.hintsRemaining--;
        this.hintsUsed++;

        const correctAnswer = String(problem.answer);

        // Find wrong options to eliminate (remove 2 wrong answers)
        const wrongOptions = problem.options.filter(opt => String(opt) !== correctAnswer);

        // Shuffle wrong options and pick up to 2 to eliminate
        const shuffledWrong = Utils.shuffle(wrongOptions);
        const eliminated = shuffledWrong.slice(0, Math.min(2, shuffledWrong.length));

        return eliminated;
    }

    // ---- Proximity Feedback (Byte's ability - bonusType: 'proximity') ----

    getProximity(answer) {
        // Only available when character has proximity bonus
        if (!this.selectedCharacter || this.selectedCharacter.bonusType !== 'proximity') {
            return null;
        }

        const problem = this.getCurrentProblem();
        if (!problem) return null;

        // Parse both answers as numbers
        const correctNum = parseFloat(problem.answer);
        const givenNum = parseFloat(answer);

        // If either is not a valid number, cannot compute proximity
        if (isNaN(correctNum) || isNaN(givenNum)) {
            return null;
        }

        // Calculate proximity as 0-1 (1 = exact match, 0 = far away)
        const diff = Math.abs(correctNum - givenNum);
        const range = Math.max(Math.abs(correctNum), 10); // Use answer magnitude or 10 as reference range

        // Proximity falls off based on how far the answer is relative to the range
        const proximity = Math.max(0, 1 - (diff / range));

        return Utils.clamp(proximity, 0, 1);
    }

    // ---- Character Reaction State ----

    _setCharacterMood(mood) {
        this.characterMood = mood;

        // Clear any existing mood reset timer
        if (this._moodResetTimer) {
            clearTimeout(this._moodResetTimer);
            this._moodResetTimer = null;
        }

        // Auto-reset to idle after a delay (except for idle itself and celebrate during level complete)
        if (mood !== 'idle' && mood !== 'celebrate') {
            this._moodResetTimer = setTimeout(() => {
                this.characterMood = 'idle';
                this._moodResetTimer = null;
            }, 2000);
        } else if (mood === 'celebrate') {
            // Celebrate resets after a longer delay
            this._moodResetTimer = setTimeout(() => {
                this.characterMood = 'idle';
                this._moodResetTimer = null;
            }, 5000);
        }
    }

    // ---- Adaptive Difficulty ----

    _updateAdaptiveDifficulty() {
        if (this._performanceHistory.length < 5) return;

        const recent = this._performanceHistory.slice(-5);
        const recentCorrect = recent.filter(Boolean).length;

        // If getting 5/5 right, make slightly harder
        if (recentCorrect >= 5 && this._adaptiveLevel < 2) {
            this._adaptiveLevel++;
        }
        // If getting 1/5 or less right, make easier
        else if (recentCorrect <= 1 && this._adaptiveLevel > -2) {
            this._adaptiveLevel--;
        }
        // If getting 2/5, nudge easier
        else if (recentCorrect <= 2 && this._adaptiveLevel > -1) {
            this._adaptiveLevel--;
        }
    }

    getAdaptiveDifficulty() {
        // Returns current adaptive difficulty adjustment
        return this._adaptiveLevel;
    }

    getEncouragementMessage(isCorrect, streak) {
        if (isCorrect) {
            if (streak >= 10) {
                return Utils.randomChoice([
                    'INCREDIBLE! You are a math legend!',
                    'UNSTOPPABLE! Nothing can stop you!',
                    'PHENOMENAL! You are on fire!',
                    'AMAZING! Math genius at work!'
                ]);
            }
            if (streak >= 5) {
                return Utils.randomChoice([
                    'Fantastic streak! Keep going!',
                    'You are on a roll!',
                    'Math superstar!',
                    'Brilliant! So impressive!'
                ]);
            }
            if (streak >= 3) {
                return Utils.randomChoice([
                    'Great combo! Keep it up!',
                    'You are doing amazing!',
                    'Wonderful work!',
                    'Super smart!'
                ]);
            }
            return Utils.randomChoice([
                'Correct! Great job!',
                'You got it! Amazing!',
                'Perfect! Well done!',
                'Right answer! Brilliant!',
                'Yes! You are so clever!',
                'Awesome! Keep going!',
                'Fantastic! Nailed it!',
                'Wonderful! Math star!'
            ]);
        } else {
            // NEVER negative - always encouraging
            return Utils.randomChoice([
                "Almost! You'll get the next one!",
                "Good try! Keep going!",
                "So close! You're learning!",
                "Nice effort! Try the next one!",
                "Don't worry, practice makes perfect!",
                "You're getting better every time!",
                "Great attempt! Onward!",
                "That was a tricky one! You've got this!"
            ]);
        }
    }

    // ---- Achievement System ----

    _initAchievements() {
        return {
            first_correct: {
                id: 'first_correct',
                name: 'First Steps',
                description: 'Get your first correct answer',
                icon: '🎯',
                unlocked: false,
                unlockedAt: null
            },
            perfect_level: {
                id: 'perfect_level',
                name: 'Perfectionist',
                description: 'Get 3 stars on any level',
                icon: '🌟',
                unlocked: false,
                unlockedAt: null
            },
            streak_5: {
                id: 'streak_5',
                name: 'On Fire!',
                description: 'Get a 5x streak',
                icon: '🔥',
                unlocked: false,
                unlockedAt: null
            },
            streak_10: {
                id: 'streak_10',
                name: 'Unstoppable!',
                description: 'Get a 10x streak',
                icon: '💥',
                unlocked: false,
                unlockedAt: null
            },
            zone_complete_1: {
                id: 'zone_complete_1',
                name: 'Beach Explorer',
                description: 'Complete Sandy Shores',
                icon: '🏖️',
                unlocked: false,
                unlockedAt: null
            },
            zone_complete_2: {
                id: 'zone_complete_2',
                name: 'Jungle Trekker',
                description: 'Complete Jungle Trail',
                icon: '🌴',
                unlocked: false,
                unlockedAt: null
            },
            zone_complete_3: {
                id: 'zone_complete_3',
                name: 'Cave Diver',
                description: 'Complete Crystal Cave',
                icon: '💎',
                unlocked: false,
                unlockedAt: null
            },
            zone_complete_4: {
                id: 'zone_complete_4',
                name: 'Volcano Conqueror',
                description: 'Complete Volcano Peak',
                icon: '🌋',
                unlocked: false,
                unlockedAt: null
            },
            zone_complete_5: {
                id: 'zone_complete_5',
                name: 'Cloud Walker',
                description: 'Complete Cloud Kingdom',
                icon: '☁️',
                unlocked: false,
                unlockedAt: null
            },
            zone_complete_6: {
                id: 'zone_complete_6',
                name: 'Star Master',
                description: 'Complete Star Temple',
                icon: '⭐',
                unlocked: false,
                unlockedAt: null
            },
            all_stars: {
                id: 'all_stars',
                name: 'Star Collector',
                description: 'Earn all 90 stars',
                icon: '🏆',
                unlocked: false,
                unlockedAt: null
            },
            speed_demon: {
                id: 'speed_demon',
                name: 'Speed Demon',
                description: 'Answer correctly within 3 seconds',
                icon: '⚡',
                unlocked: false,
                unlockedAt: null
            },
            no_hints: {
                id: 'no_hints',
                name: 'Pure Genius',
                description: 'Complete a level without using hints',
                icon: '🧠',
                unlocked: false,
                unlockedAt: null
            },
            level_10: {
                id: 'level_10',
                name: 'Explorer',
                description: 'Complete 10 levels',
                icon: '🗺️',
                unlocked: false,
                unlockedAt: null
            },
            level_30: {
                id: 'level_30',
                name: 'Math Master',
                description: 'Complete all 30 levels',
                icon: '👑',
                unlocked: false,
                unlockedAt: null
            },
            score_1000: {
                id: 'score_1000',
                name: 'Big Score',
                description: 'Score 1000+ in a single level',
                icon: '💰',
                unlocked: false,
                unlockedAt: null
            },
            score_5000: {
                id: 'score_5000',
                name: 'Legendary',
                description: 'Score 5000+ in a single level',
                icon: '🌈',
                unlocked: false,
                unlockedAt: null
            },
            all_characters: {
                id: 'all_characters',
                name: 'Collector',
                description: 'Unlock all characters',
                icon: '🎭',
                unlocked: false,
                unlockedAt: null
            }
        };
    }

    _loadAchievements() {
        const saved = Utils.load('achievements', {});
        for (const key in saved) {
            if (this.achievements[key]) {
                this.achievements[key].unlocked = saved[key].unlocked || false;
                this.achievements[key].unlockedAt = saved[key].unlockedAt || null;
            }
        }
    }

    _saveAchievements() {
        const data = {};
        for (const key in this.achievements) {
            data[key] = {
                unlocked: this.achievements[key].unlocked,
                unlockedAt: this.achievements[key].unlockedAt
            };
        }
        Utils.save('achievements', data);
    }

    _unlockAchievement(id) {
        const achievement = this.achievements[id];
        if (!achievement || achievement.unlocked) return null;

        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
        this._saveAchievements();

        return {
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon
        };
    }

    _checkAchievementsOnAnswer(answerTime) {
        const newlyUnlocked = [];

        // first_correct: Get your first correct answer
        if (this.correctCount >= 1) {
            const a = this._unlockAchievement('first_correct');
            if (a) newlyUnlocked.push(a);
        }

        // streak_5: Get a 5x streak
        if (this.streak >= 5) {
            const a = this._unlockAchievement('streak_5');
            if (a) newlyUnlocked.push(a);
        }

        // streak_10: Get a 10x streak
        if (this.streak >= 10) {
            const a = this._unlockAchievement('streak_10');
            if (a) newlyUnlocked.push(a);
        }

        // speed_demon: Answer correctly within 3 seconds
        if (answerTime <= 3) {
            const a = this._unlockAchievement('speed_demon');
            if (a) newlyUnlocked.push(a);
        }

        // score_1000: Score 1000+ in current level
        if (this.score >= 1000) {
            const a = this._unlockAchievement('score_1000');
            if (a) newlyUnlocked.push(a);
        }

        // score_5000: Score 5000+ in current level
        if (this.score >= 5000) {
            const a = this._unlockAchievement('score_5000');
            if (a) newlyUnlocked.push(a);
        }

        return newlyUnlocked;
    }

    _checkAchievementsOnLevelComplete(stars) {
        const newlyUnlocked = [];

        // perfect_level: Get 3 stars on any level
        if (stars === 3) {
            const a = this._unlockAchievement('perfect_level');
            if (a) newlyUnlocked.push(a);
        }

        // no_hints: Complete a level without using hints
        if (this.hintsUsed === 0) {
            const a = this._unlockAchievement('no_hints');
            if (a) newlyUnlocked.push(a);
        }

        // score_1000: Score 1000+ in a single level
        if (this.score >= 1000) {
            const a = this._unlockAchievement('score_1000');
            if (a) newlyUnlocked.push(a);
        }

        // score_5000: Score 5000+ in a single level
        if (this.score >= 5000) {
            const a = this._unlockAchievement('score_5000');
            if (a) newlyUnlocked.push(a);
        }

        // Check zone completions
        const completedLevels = this.progress.completed;
        Levels.zones.forEach((zone, index) => {
            const zoneKey = `zone_complete_${index + 1}`;
            const allComplete = zone.levels.every(levelNum => completedLevels[levelNum]);
            if (allComplete) {
                const a = this._unlockAchievement(zoneKey);
                if (a) newlyUnlocked.push(a);
            }
        });

        // level_10: Complete 10 levels
        const completedCount = Object.keys(completedLevels).length;
        if (completedCount >= 10) {
            const a = this._unlockAchievement('level_10');
            if (a) newlyUnlocked.push(a);
        }

        // level_30: Complete all 30 levels
        if (completedCount >= 30) {
            const a = this._unlockAchievement('level_30');
            if (a) newlyUnlocked.push(a);
        }

        // all_stars: Earn all 90 stars (30 levels x 3 stars)
        if (this.progress.totalStars >= 90) {
            const a = this._unlockAchievement('all_stars');
            if (a) newlyUnlocked.push(a);
        }

        // all_characters: Unlock all characters
        const allUnlocked = Characters.roster.every(c => c.unlocked);
        if (allUnlocked) {
            const a = this._unlockAchievement('all_characters');
            if (a) newlyUnlocked.push(a);
        }

        return newlyUnlocked;
    }

    checkAchievements() {
        // Public method that runs all achievement checks based on current state
        // Called externally when needed (e.g., after manual progress updates)
        const newlyUnlocked = [];

        // Check answer-related achievements using current state
        if (this.correctCount >= 1) {
            const a = this._unlockAchievement('first_correct');
            if (a) newlyUnlocked.push(a);
        }

        if (this.bestStreak >= 5) {
            const a = this._unlockAchievement('streak_5');
            if (a) newlyUnlocked.push(a);
        }

        if (this.bestStreak >= 10) {
            const a = this._unlockAchievement('streak_10');
            if (a) newlyUnlocked.push(a);
        }

        if (this.score >= 1000) {
            const a = this._unlockAchievement('score_1000');
            if (a) newlyUnlocked.push(a);
        }

        if (this.score >= 5000) {
            const a = this._unlockAchievement('score_5000');
            if (a) newlyUnlocked.push(a);
        }

        // Check speed demon from answer times
        if (this.answerTimes.some(t => t <= 3) && this.correctCount > 0) {
            const a = this._unlockAchievement('speed_demon');
            if (a) newlyUnlocked.push(a);
        }

        // Check progress-based achievements
        const completedLevels = this.progress.completed;
        const completedCount = Object.keys(completedLevels).length;

        // Check if any level has 3 stars
        const hasPerfect = Object.values(completedLevels).some(l => l.stars === 3);
        if (hasPerfect) {
            const a = this._unlockAchievement('perfect_level');
            if (a) newlyUnlocked.push(a);
        }

        // Zone completions
        Levels.zones.forEach((zone, index) => {
            const zoneKey = `zone_complete_${index + 1}`;
            const allComplete = zone.levels.every(levelNum => completedLevels[levelNum]);
            if (allComplete) {
                const a = this._unlockAchievement(zoneKey);
                if (a) newlyUnlocked.push(a);
            }
        });

        if (completedCount >= 10) {
            const a = this._unlockAchievement('level_10');
            if (a) newlyUnlocked.push(a);
        }

        if (completedCount >= 30) {
            const a = this._unlockAchievement('level_30');
            if (a) newlyUnlocked.push(a);
        }

        if (this.progress.totalStars >= 90) {
            const a = this._unlockAchievement('all_stars');
            if (a) newlyUnlocked.push(a);
        }

        const allUnlocked = Characters.roster.every(c => c.unlocked);
        if (allUnlocked) {
            const a = this._unlockAchievement('all_characters');
            if (a) newlyUnlocked.push(a);
        }

        if (this.hintsUsed === 0 && completedCount > 0) {
            const a = this._unlockAchievement('no_hints');
            if (a) newlyUnlocked.push(a);
        }

        return newlyUnlocked;
    }

    getAchievements() {
        // Return all achievements with their current state
        return Object.values(this.achievements);
    }

    getUnlockedAchievements() {
        return Object.values(this.achievements).filter(a => a.unlocked);
    }

    // ---- Settings ----

    updateSetting(key, value) {
        this.settings[key] = value;
        Utils.save('settings', this.settings);
    }

    // ---- Reset Progress ----

    resetProgress() {
        this.progress = {
            completed: {},
            highestUnlocked: 1,
            totalStars: 0
        };
        Levels.saveProgress(this.progress);

        // Reset achievements
        this.achievements = this._initAchievements();
        this._saveAchievements();

        // Reset adaptive difficulty
        this._adaptiveLevel = 0;
        this._performanceHistory = [];
    }
}
