/* ========================================
   MATH ISLAND - AI Opponent System
   Variable-speed AI for VS mode
   Makes kids feel they have a real chance!
   ======================================== */

class AIOpponent {
    constructor() {
        // AI personality roster
        this.opponents = [
            {
                id: 'rookie',
                name: 'Rookie Robot',
                emoji: '\u{1F916}',
                description: 'Just learning math!',
                baseSpeed: [5.0, 8.0],    // seconds to answer (min, max)
                accuracy: 0.55,             // 55% chance of getting it right
                adaptRate: 0.15,            // how much to adapt
                tauntCorrect: [
                    'Beep boop... I got it!',
                    'My circuits say this one!',
                    'Computing... done!'
                ],
                tauntWrong: [
                    'Oops, my wires crossed!',
                    'Error 404: answer not found!',
                    'Beep... that was wrong!'
                ],
                tauntLose: [
                    'You are too fast for me!',
                    'Wow, you beat a robot!',
                    'I need an upgrade!'
                ],
                tauntWin: [
                    'Beep boop, I won this one!',
                    'Robot power!',
                    'My processor was faster!'
                ]
            },
            {
                id: 'brainy',
                name: 'Brainy Bear',
                emoji: '\u{1F9F8}',
                description: 'Loves solving puzzles!',
                baseSpeed: [3.5, 6.5],
                accuracy: 0.70,
                adaptRate: 0.20,
                tauntCorrect: [
                    'Honey, I got the answer!',
                    'Bear-illiant!',
                    'That was sweet!'
                ],
                tauntWrong: [
                    'Oops, bear mistake!',
                    'Hmm, that\'s not right...',
                    'Back to the honey pot...'
                ],
                tauntLose: [
                    'You\'re smarter than a bear!',
                    'Great job, friend!',
                    'I\'ll try harder next time!'
                ],
                tauntWin: [
                    'Bear wins!',
                    'Grr, I got it first!',
                    'Bear-y fast!'
                ]
            },
            {
                id: 'speedy',
                name: 'Speedy Fox',
                emoji: '\u{1F98A}',
                description: 'Quick and clever!',
                baseSpeed: [2.5, 5.0],
                accuracy: 0.78,
                adaptRate: 0.25,
                tauntCorrect: [
                    'Quick as a fox!',
                    'Too fast!',
                    'Fox reflexes!'
                ],
                tauntWrong: [
                    'Too fast, wrong answer!',
                    'Oops, went too quick!',
                    'Speed isn\'t everything...'
                ],
                tauntLose: [
                    'You outfoxed me!',
                    'Impressive speed!',
                    'I\'ll be faster next time!'
                ],
                tauntWin: [
                    'Fox speed wins!',
                    'Can\'t catch this fox!',
                    'Lightning fast!'
                ]
            },
            {
                id: 'professor',
                name: 'Professor Owl',
                emoji: '\u{1F989}',
                description: 'The wisest of all!',
                baseSpeed: [2.0, 4.0],
                accuracy: 0.85,
                adaptRate: 0.30,
                tauntCorrect: [
                    'Hoo hoo, elementary!',
                    'Wisdom prevails!',
                    'As I calculated!'
                ],
                tauntWrong: [
                    'Even owls make mistakes!',
                    'Hmm, miscalculated...',
                    'A rare error!'
                ],
                tauntLose: [
                    'You are truly wise!',
                    'A worthy opponent!',
                    'Remarkable intellect!'
                ],
                tauntWin: [
                    'Knowledge is power!',
                    'The owl knows!',
                    'Hoo hoo, victory!'
                ]
            }
        ];

        // Current match state
        this.currentOpponent = null;
        this.aiScore = 0;
        this.playerScore = 0;
        this.currentRound = 0;
        this.totalRounds = 10;
        this.aiAnswerTimer = null;
        this.aiHasAnswered = false;
        this.playerHasAnswered = false;
        this.roundActive = false;

        // Adaptive difficulty tracking
        this._playerWinStreak = 0;
        this._aiWinStreak = 0;
        this._speedAdjustment = 0;      // Negative = slower (easier), Positive = faster (harder)
        this._accuracyAdjustment = 0;

        // Match history for this session
        this.matchHistory = [];

        // AI thinking animation state
        this.aiThinking = false;
        this.aiProgressPercent = 0;
        this._aiProgressInterval = null;
    }

    // Get all available opponents
    getOpponents() {
        return this.opponents;
    }

    // Select an opponent by id
    selectOpponent(opponentId) {
        this.currentOpponent = this.opponents.find(o => o.id === opponentId);
        return this.currentOpponent;
    }

    // Start a new VS AI match
    startMatch(opponentId, totalRounds) {
        this.selectOpponent(opponentId);
        this.totalRounds = totalRounds || 10;
        this.aiScore = 0;
        this.playerScore = 0;
        this.currentRound = 0;
        this.matchHistory = [];

        // Reset adaptive adjustments
        this._playerWinStreak = 0;
        this._aiWinStreak = 0;
        this._speedAdjustment = 0;
        this._accuracyAdjustment = 0;

        return {
            opponent: this.currentOpponent,
            totalRounds: this.totalRounds
        };
    }

    // Start a new round - AI begins "thinking"
    startRound(problem) {
        if (!this.currentOpponent) return;

        this.currentRound++;
        this.aiHasAnswered = false;
        this.playerHasAnswered = false;
        this.roundActive = true;
        this.aiThinking = true;
        this.aiProgressPercent = 0;

        // Calculate AI answer time for this round
        const answerTime = this._calculateAnswerTime();

        // Determine if AI will get the answer right
        const aiWillBeCorrect = Math.random() < this._getEffectiveAccuracy();

        // AI "thinking" progress animation
        const progressStep = 50; // ms between updates
        const totalSteps = Math.floor((answerTime * 1000) / progressStep);
        let currentStep = 0;

        this._aiProgressInterval = setInterval(() => {
            if (!this.roundActive) {
                clearInterval(this._aiProgressInterval);
                return;
            }
            currentStep++;
            // Non-linear progress: starts slow, speeds up (more exciting!)
            const linearProgress = currentStep / totalSteps;
            this.aiProgressPercent = Math.min(100, Math.pow(linearProgress, 0.7) * 100);
        }, progressStep);

        // Set the actual AI answer timer
        this.aiAnswerTimer = setTimeout(() => {
            if (!this.roundActive) return;
            this._aiAnswer(problem, aiWillBeCorrect);
        }, answerTime * 1000);

        return {
            round: this.currentRound,
            aiAnswerTime: answerTime
        };
    }

    // Calculate how fast AI should answer this round
    _calculateAnswerTime() {
        const opp = this.currentOpponent;
        const [minSpeed, maxSpeed] = opp.baseSpeed;

        // Base random time
        let time = minSpeed + Math.random() * (maxSpeed - minSpeed);

        // Apply adaptive adjustment (-1 to +1 range maps to speed change)
        // Positive adjustment = faster (harder), negative = slower (easier)
        const adaptAmount = this._speedAdjustment * opp.adaptRate * (maxSpeed - minSpeed);
        time -= adaptAmount;

        // Add some "drama" - occasionally very fast or very slow
        const dramaticRoll = Math.random();
        if (dramaticRoll < 0.08) {
            // Occasionally super fast (exciting close calls!)
            time *= 0.6;
        } else if (dramaticRoll < 0.15) {
            // Occasionally very slow (let player win easily for confidence)
            time *= 1.5;
        }

        // Add small random jitter for natural feel
        time += (Math.random() - 0.5) * 0.8;

        // Clamp to reasonable range
        return Math.max(1.5, Math.min(time, 12.0));
    }

    // Get effective accuracy after adaptive adjustments
    _getEffectiveAccuracy() {
        let accuracy = this.currentOpponent.accuracy + this._accuracyAdjustment;

        // If player is struggling, AI makes more mistakes
        if (this._playerWinStreak <= -3) {
            accuracy -= 0.15;
        }

        return Math.max(0.3, Math.min(0.95, accuracy));
    }

    // AI submits its answer
    _aiAnswer(problem, isCorrect) {
        if (!this.roundActive || this.aiHasAnswered) return;

        clearInterval(this._aiProgressInterval);
        this.aiThinking = false;
        this.aiHasAnswered = true;
        this.aiProgressPercent = 100;

        let aiAnswer;
        if (isCorrect) {
            aiAnswer = problem.answer;
        } else {
            // Pick a wrong option
            const wrongOptions = problem.options.filter(
                opt => String(opt) !== String(problem.answer)
            );
            aiAnswer = wrongOptions.length > 0
                ? wrongOptions[Math.floor(Math.random() * wrongOptions.length)]
                : problem.answer; // fallback to correct if no wrong options
        }

        const result = {
            aiAnswer: aiAnswer,
            aiCorrect: isCorrect,
            correctAnswer: problem.answer
        };

        // If player hasn't answered yet, check if AI wins the round
        if (!this.playerHasAnswered) {
            if (isCorrect) {
                this.aiScore++;
                result.aiWonRound = true;
                result.taunt = this._getTaunt('tauntWin');
            } else {
                result.aiWonRound = false;
                result.taunt = this._getTaunt('tauntWrong');
            }
        }

        // Dispatch event for UI to handle
        const event = new CustomEvent('ai-answered', { detail: result });
        document.dispatchEvent(event);

        return result;
    }

    // Player submits their answer - check who won the round
    playerAnswer(problem, playerAnswer, isCorrect) {
        if (!this.roundActive || this.playerHasAnswered) return null;

        this.playerHasAnswered = true;

        const result = {
            playerAnswer: playerAnswer,
            playerCorrect: isCorrect,
            aiHasAnswered: this.aiHasAnswered
        };

        if (!this.aiHasAnswered) {
            // Player answered first!
            if (isCorrect) {
                // Player wins this round
                this.playerScore++;
                result.playerWonRound = true;

                // Cancel AI timer since player already won
                this._cancelAiTimer();
            } else {
                // Player was first but wrong - AI still has a chance
                result.playerWonRound = false;
                // Let AI timer continue
            }
        } else {
            // AI already answered
            if (isCorrect && !this.aiHasAnswered) {
                this.playerScore++;
                result.playerWonRound = true;
            } else {
                result.playerWonRound = false;
            }
        }

        return result;
    }

    // End the current round and update adaptive difficulty
    endRound(playerWonRound) {
        this.roundActive = false;
        this._cancelAiTimer();
        clearInterval(this._aiProgressInterval);
        this.aiThinking = false;

        // Track for adaptive difficulty
        if (playerWonRound) {
            this._playerWinStreak++;
            this._aiWinStreak = 0;
        } else {
            this._aiWinStreak++;
            this._playerWinStreak = 0;
        }

        // Adapt AI difficulty based on performance
        this._adaptDifficulty();

        // Save round to history
        this.matchHistory.push({
            round: this.currentRound,
            playerWon: playerWonRound,
            playerScore: this.playerScore,
            aiScore: this.aiScore
        });

        return {
            playerScore: this.playerScore,
            aiScore: this.aiScore,
            currentRound: this.currentRound,
            totalRounds: this.totalRounds,
            isMatchOver: this.currentRound >= this.totalRounds,
            playerWinStreak: this._playerWinStreak,
            aiWinStreak: this._aiWinStreak
        };
    }

    // Adaptive difficulty - keep it fun and competitive
    _adaptDifficulty() {
        // Player is dominating - make AI a bit harder
        if (this._playerWinStreak >= 3) {
            this._speedAdjustment = Math.min(this._speedAdjustment + 0.3, 1.0);
            this._accuracyAdjustment = Math.min(this._accuracyAdjustment + 0.05, 0.15);
        }
        // Player winning steadily
        else if (this._playerWinStreak >= 2) {
            this._speedAdjustment = Math.min(this._speedAdjustment + 0.15, 1.0);
        }
        // AI is dominating - make AI easier (never discourage the kid!)
        else if (this._aiWinStreak >= 2) {
            this._speedAdjustment = Math.max(this._speedAdjustment - 0.4, -1.0);
            this._accuracyAdjustment = Math.max(this._accuracyAdjustment - 0.08, -0.20);
        }
        // AI winning a bit
        else if (this._aiWinStreak >= 1) {
            this._speedAdjustment = Math.max(this._speedAdjustment - 0.2, -1.0);
        }
        // Close match - keep it exciting
        else {
            // Drift back toward neutral slowly
            this._speedAdjustment *= 0.8;
            this._accuracyAdjustment *= 0.8;
        }
    }

    // Get match results
    getMatchResults() {
        const playerWon = this.playerScore > this.aiScore;
        const isTie = this.playerScore === this.aiScore;

        return {
            playerScore: this.playerScore,
            aiScore: this.aiScore,
            playerWon: playerWon,
            isTie: isTie,
            opponent: this.currentOpponent,
            rounds: this.matchHistory,
            totalRounds: this.totalRounds,
            message: playerWon
                ? this._getVictoryMessage()
                : isTie
                    ? 'It\'s a tie! What a close match!'
                    : this._getDefeatMessage()
        };
    }

    _getVictoryMessage() {
        const margin = this.playerScore - this.aiScore;
        if (margin >= 7) {
            return 'INCREDIBLE! You totally crushed it!';
        } else if (margin >= 4) {
            return 'Amazing victory! You\'re a math champion!';
        } else if (margin >= 2) {
            return 'Great win! You showed real skill!';
        } else {
            return 'What a close match! You won by a whisker!';
        }
    }

    _getDefeatMessage() {
        // NEVER discouraging - always positive!
        const margin = this.aiScore - this.playerScore;
        if (margin >= 5) {
            return 'Great effort! Practice makes perfect!';
        } else if (margin >= 3) {
            return 'So close! You\'re getting better every time!';
        } else {
            return 'Almost had it! Try again - you\'re really close!';
        }
    }

    _getTaunt(type) {
        if (!this.currentOpponent || !this.currentOpponent[type]) return '';
        const taunts = this.currentOpponent[type];
        return taunts[Math.floor(Math.random() * taunts.length)];
    }

    _cancelAiTimer() {
        if (this.aiAnswerTimer) {
            clearTimeout(this.aiAnswerTimer);
            this.aiAnswerTimer = null;
        }
    }

    // Save VS AI stats
    saveStats() {
        const stats = Utils.load('vsAiStats', {
            totalMatches: 0,
            wins: 0,
            losses: 0,
            ties: 0,
            bestWinMargin: 0,
            opponentWins: {}
        });

        stats.totalMatches++;
        const results = this.getMatchResults();
        if (results.playerWon) {
            stats.wins++;
            const margin = results.playerScore - results.aiScore;
            if (margin > stats.bestWinMargin) stats.bestWinMargin = margin;
        } else if (results.isTie) {
            stats.ties++;
        } else {
            stats.losses++;
        }

        // Track wins per opponent
        const oppId = this.currentOpponent.id;
        if (!stats.opponentWins[oppId]) {
            stats.opponentWins[oppId] = { wins: 0, losses: 0, ties: 0 };
        }
        if (results.playerWon) stats.opponentWins[oppId].wins++;
        else if (results.isTie) stats.opponentWins[oppId].ties++;
        else stats.opponentWins[oppId].losses++;

        Utils.save('vsAiStats', stats);
        return stats;
    }

    // Load VS AI stats
    static loadStats() {
        return Utils.load('vsAiStats', {
            totalMatches: 0,
            wins: 0,
            losses: 0,
            ties: 0,
            bestWinMargin: 0,
            opponentWins: {}
        });
    }
}
