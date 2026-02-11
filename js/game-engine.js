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

        // Animation
        this.animationTime = 0;
        this.lastFrameTime = performance.now();
        this.isRunning = true;

        this._gameLoop = this._gameLoop.bind(this);
        requestAnimationFrame(this._gameLoop);
    }

    _gameLoop(now) {
        if (!this.isRunning) return;

        const dt = Math.min((now - this.lastFrameTime) / 1000, 0.05);
        this.lastFrameTime = now;
        this.animationTime += dt;

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

        // Timer
        this.timeRemaining = levelDef.timePerProblem;

        this.setState('playing');
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

        const isCorrect = String(answer) === String(problem.answer);
        const result = {
            correct: isCorrect,
            correctAnswer: problem.answer,
            givenAnswer: answer
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
            result.points = points;
        } else {
            // Wrong answer
            if (this.selectedCharacter && this.selectedCharacter.bonusType === 'shield') {
                // Shield character doesn't break streak
            } else {
                this.streak = 0;
            }
        }

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
        return { done: false };
    }

    _completeLevel() {
        // Calculate stars
        const thresholds = this.currentLevel.starThresholds;
        let stars = 0;
        if (this.correctCount >= thresholds[0]) stars = 1;
        if (this.correctCount >= thresholds[1]) stars = 2;
        if (this.correctCount >= thresholds[2]) stars = 3;

        // Save progress
        const levelNum = this.currentLevel.num;
        if (!this.progress.completed[levelNum] || this.progress.completed[levelNum].stars < stars) {
            this.progress.completed[levelNum] = {
                stars: stars,
                score: this.score,
                correct: this.correctCount,
                total: this.problems.length,
                bestStreak: this.bestStreak
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

        this.setState('levelComplete');

        return {
            done: true,
            stars: stars,
            score: this.score,
            correct: this.correctCount,
            total: this.problems.length,
            bestStreak: this.bestStreak,
            newUnlocks: newUnlocks,
            levelNum: levelNum
        };
    }

    // Timer management
    startTimer(onTick, onExpire) {
        this.stopTimer();
        if (!this.settings.timer) return;

        this.timeRemaining = this.currentLevel.timePerProblem;

        // Character time bonus
        if (this.selectedCharacter && this.selectedCharacter.bonusType === 'time') {
            this.timeRemaining += this.selectedCharacter.bonusValue;
        }

        this.timerInterval = setInterval(() => {
            this.timeRemaining -= 0.5;
            if (onTick) onTick(this.timeRemaining, this.currentLevel.timePerProblem);

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
    }

    // Settings
    updateSetting(key, value) {
        this.settings[key] = value;
        Utils.save('settings', this.settings);
    }

    // Reset progress
    resetProgress() {
        this.progress = {
            completed: {},
            highestUnlocked: 1,
            totalStars: 0
        };
        Levels.saveProgress(this.progress);
    }
}
