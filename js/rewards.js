/* ========================================
   MATH ISLAND - Rewards & Engagement System
   Daily rewards, collectibles, daily challenge
   ======================================== */

const Rewards = {
    // ---- Daily Login Streak ----

    getDailyData() {
        return Utils.load('dailyData', {
            lastLoginDate: null,
            streak: 0,
            totalLogins: 0,
            claimedToday: false,
            stickers: [],
            dailyChallengeCompleted: false,
            dailyChallengeSeed: null
        });
    },

    saveDailyData(data) {
        Utils.save('dailyData', data);
    },

    checkDailyLogin() {
        const data = this.getDailyData();
        const today = this._getDateString();
        const yesterday = this._getDateString(-1);

        if (data.lastLoginDate === today) {
            // Already logged in today
            return { isNew: false, streak: data.streak, reward: null, claimedToday: data.claimedToday };
        }

        // New day!
        data.totalLogins++;
        data.dailyChallengeCompleted = false;
        data.dailyChallengeSeed = this._generateDailySeed();

        if (data.lastLoginDate === yesterday) {
            // Consecutive day - increase streak
            data.streak++;
        } else {
            // Streak broken
            data.streak = 1;
        }

        data.lastLoginDate = today;
        data.claimedToday = false;
        this.saveDailyData(data);

        return { isNew: true, streak: data.streak, reward: null, claimedToday: false };
    },

    claimDailyReward() {
        const data = this.getDailyData();
        if (data.claimedToday) return null;

        data.claimedToday = true;

        // Calculate reward based on streak
        const reward = this._calculateReward(data.streak);

        // Award sticker if applicable
        if (reward.sticker) {
            if (!data.stickers.includes(reward.sticker.id)) {
                data.stickers.push(reward.sticker.id);
            }
        }

        this.saveDailyData(data);
        return reward;
    },

    _calculateReward(streak) {
        const reward = {
            type: 'daily',
            streak: streak,
            message: '',
            sticker: null,
            bonusStars: 0
        };

        if (streak >= 30) {
            reward.message = 'Legendary! 30 day streak!';
            reward.sticker = this.stickerDefs.find(s => s.id === 'sticker-legendary');
            reward.bonusStars = 5;
        } else if (streak >= 14) {
            reward.message = 'Two week champion!';
            reward.sticker = this.stickerDefs.find(s => s.id === 'sticker-champion');
            reward.bonusStars = 3;
        } else if (streak >= 7) {
            reward.message = 'One week warrior!';
            reward.sticker = this.stickerDefs.find(s => s.id === 'sticker-warrior');
            reward.bonusStars = 2;
        } else if (streak >= 3) {
            reward.message = `${streak} day streak! Keep going!`;
            reward.bonusStars = 1;
        } else {
            reward.message = 'Welcome back!';
            reward.bonusStars = 0;
        }

        return reward;
    },

    // ---- Collectible Stickers ----

    stickerDefs: [
        // Zone completion stickers
        { id: 'sticker-beach', name: 'Beach Star', icon: '🏖️', category: 'zones', description: 'Complete Sandy Shores' },
        { id: 'sticker-jungle', name: 'Jungle Crown', icon: '🌴', category: 'zones', description: 'Complete Jungle Trail' },
        { id: 'sticker-cave', name: 'Crystal Heart', icon: '💎', category: 'zones', description: 'Complete Crystal Cave' },
        { id: 'sticker-volcano', name: 'Fire Ruby', icon: '🌋', category: 'zones', description: 'Complete Volcano Peak' },
        { id: 'sticker-sky', name: 'Cloud Wings', icon: '☁️', category: 'zones', description: 'Complete Cloud Kingdom' },
        { id: 'sticker-space', name: 'Galaxy Medal', icon: '⭐', category: 'zones', description: 'Complete Star Temple' },

        // Streak stickers
        { id: 'sticker-warrior', name: 'Week Warrior', icon: '⚔️', category: 'streaks', description: '7 day login streak' },
        { id: 'sticker-champion', name: 'Champion Badge', icon: '🏅', category: 'streaks', description: '14 day login streak' },
        { id: 'sticker-legendary', name: 'Legendary Star', icon: '🌟', category: 'streaks', description: '30 day login streak' },

        // Performance stickers
        { id: 'sticker-perfect', name: 'Perfect Score', icon: '💯', category: 'performance', description: 'Get all answers right in a level' },
        { id: 'sticker-speed', name: 'Lightning Fast', icon: '⚡', category: 'performance', description: 'Answer 5 questions under 3 seconds' },
        { id: 'sticker-streak10', name: 'Unstoppable', icon: '🔥', category: 'performance', description: 'Get a 10x streak' },
        { id: 'sticker-allchars', name: 'Team Complete', icon: '🎭', category: 'performance', description: 'Unlock all characters' },
        { id: 'sticker-master', name: 'Math Master', icon: '👑', category: 'performance', description: 'Complete all 30 levels' },
        { id: 'sticker-allstars', name: 'Star Galaxy', icon: '🌌', category: 'performance', description: 'Earn all 90 stars' },

        // Fun stickers (earned randomly or from milestones)
        { id: 'sticker-rainbow', name: 'Rainbow Power', icon: '🌈', category: 'fun', description: 'Complete 5 levels in one session' },
        { id: 'sticker-rocket', name: 'Rocket Math', icon: '🚀', category: 'fun', description: 'Score over 2000 in a level' },
        { id: 'sticker-treasure', name: 'Treasure Chest', icon: '🎁', category: 'fun', description: 'Daily reward special' },
        { id: 'sticker-unicorn', name: 'Math Unicorn', icon: '🦄', category: 'fun', description: 'Play 50 total levels' },
        { id: 'sticker-trophy', name: 'Grand Trophy', icon: '🏆', category: 'fun', description: 'Earn 20 stickers' }
    ],

    getCollectedStickers() {
        const data = this.getDailyData();
        return data.stickers || [];
    },

    awardSticker(stickerId) {
        const data = this.getDailyData();
        if (!data.stickers) data.stickers = [];
        if (!data.stickers.includes(stickerId)) {
            data.stickers.push(stickerId);
            this.saveDailyData(data);
            return this.stickerDefs.find(s => s.id === stickerId);
        }
        return null;
    },

    checkStickerUnlocks(game) {
        const newStickers = [];
        const data = this.getDailyData();
        const stickers = data.stickers || [];
        const progress = game.progress;
        const completedLevels = Object.keys(progress.completed).length;

        // Zone completion stickers
        const zoneMap = {
            'sticker-beach': [1, 2, 3, 4, 5],
            'sticker-jungle': [6, 7, 8, 9, 10],
            'sticker-cave': [11, 12, 13, 14, 15],
            'sticker-volcano': [16, 17, 18, 19, 20],
            'sticker-sky': [21, 22, 23, 24, 25],
            'sticker-space': [26, 27, 28, 29, 30]
        };

        for (const [stickerId, levels] of Object.entries(zoneMap)) {
            if (!stickers.includes(stickerId)) {
                const allDone = levels.every(l => progress.completed[l]);
                if (allDone) {
                    const s = this.awardSticker(stickerId);
                    if (s) newStickers.push(s);
                }
            }
        }

        // Performance stickers
        if (!stickers.includes('sticker-perfect')) {
            const hasPerfect = Object.values(progress.completed).some(l =>
                l.correct === l.total
            );
            if (hasPerfect) {
                const s = this.awardSticker('sticker-perfect');
                if (s) newStickers.push(s);
            }
        }

        if (!stickers.includes('sticker-streak10') && game.bestStreak >= 10) {
            const s = this.awardSticker('sticker-streak10');
            if (s) newStickers.push(s);
        }

        if (!stickers.includes('sticker-allchars')) {
            if (Characters.roster.every(c => c.unlocked)) {
                const s = this.awardSticker('sticker-allchars');
                if (s) newStickers.push(s);
            }
        }

        if (!stickers.includes('sticker-master') && completedLevels >= 30) {
            const s = this.awardSticker('sticker-master');
            if (s) newStickers.push(s);
        }

        if (!stickers.includes('sticker-allstars') && (progress.totalStars || 0) >= 90) {
            const s = this.awardSticker('sticker-allstars');
            if (s) newStickers.push(s);
        }

        if (!stickers.includes('sticker-rocket')) {
            const hasHighScore = Object.values(progress.completed).some(l => l.score >= 2000);
            if (hasHighScore) {
                const s = this.awardSticker('sticker-rocket');
                if (s) newStickers.push(s);
            }
        }

        // Trophy sticker - earned 20 stickers
        const updatedData = this.getDailyData();
        if (!updatedData.stickers.includes('sticker-trophy') && updatedData.stickers.length >= 20) {
            const s = this.awardSticker('sticker-trophy');
            if (s) newStickers.push(s);
        }

        return newStickers;
    },

    // ---- Daily Challenge ----

    getDailyChallenge() {
        const data = this.getDailyData();

        // Generate deterministic challenge from seed
        const seed = data.dailyChallengeSeed || this._generateDailySeed();
        const challengeType = this._seededRandom(seed, 0) > 0.5 ? 'speed' : 'accuracy';
        const difficulty = ['easy', 'normal', 'hard'][Math.floor(this._seededRandom(seed, 1) * 3)];

        // Pick a random problem type
        const types = ['addition', 'subtraction', 'multiplication', 'mixed'];
        const typeIndex = Math.floor(this._seededRandom(seed, 2) * types.length);

        return {
            type: challengeType,
            mathType: types[typeIndex],
            difficulty: difficulty,
            problemCount: 10,
            timePerProblem: challengeType === 'speed' ? 15 : 30,
            completed: data.dailyChallengeCompleted,
            reward: { bonusStars: 2, sticker: challengeType === 'speed' ? null : null },
            title: challengeType === 'speed' ? 'Speed Challenge' : 'Accuracy Challenge',
            description: challengeType === 'speed'
                ? 'Answer 10 questions as fast as possible!'
                : 'Get all 10 questions correct!',
            icon: challengeType === 'speed' ? '⚡' : '🎯'
        };
    },

    completeDailyChallenge(success) {
        if (!success) return null;
        const data = this.getDailyData();
        if (data.dailyChallengeCompleted) return null;

        data.dailyChallengeCompleted = true;
        this.saveDailyData(data);

        // Award treasure sticker occasionally
        if (!data.stickers.includes('sticker-treasure') && data.streak >= 5) {
            return this.awardSticker('sticker-treasure');
        }

        return null;
    },

    // ---- Parent Stats ----

    getParentStats() {
        const data = this.getDailyData();
        const progress = Utils.load('levelProgress', { completed: {}, totalStars: 0 });
        const completed = progress.completed || {};
        const completedCount = Object.keys(completed).length;

        // Calculate averages
        let totalCorrect = 0;
        let totalProblems = 0;
        let totalTime = 0;
        let timeCount = 0;

        Object.values(completed).forEach(level => {
            totalCorrect += level.correct || 0;
            totalProblems += level.total || 0;
            if (level.averageTime) {
                totalTime += level.averageTime;
                timeCount++;
            }
        });

        const accuracy = totalProblems > 0 ? Math.round((totalCorrect / totalProblems) * 100) : 0;
        const avgTime = timeCount > 0 ? (totalTime / timeCount).toFixed(1) : '0';

        // Find strongest and weakest areas
        const typePerformance = {};
        Object.entries(completed).forEach(([levelNum, levelData]) => {
            const levelDef = Levels.getLevel(parseInt(levelNum));
            if (levelDef) {
                const type = levelDef.type;
                if (!typePerformance[type]) {
                    typePerformance[type] = { correct: 0, total: 0 };
                }
                typePerformance[type].correct += levelData.correct || 0;
                typePerformance[type].total += levelData.total || 0;
            }
        });

        let strongest = '-';
        let weakest = '-';
        let bestRate = 0;
        let worstRate = 1;

        Object.entries(typePerformance).forEach(([type, perf]) => {
            if (perf.total > 0) {
                const rate = perf.correct / perf.total;
                if (rate >= bestRate) {
                    bestRate = rate;
                    strongest = this._formatMathType(type);
                }
                if (rate <= worstRate) {
                    worstRate = rate;
                    weakest = this._formatMathType(type);
                }
            }
        });

        return {
            totalLogins: data.totalLogins,
            currentStreak: data.streak,
            levelsCompleted: completedCount,
            totalStars: progress.totalStars || 0,
            accuracy: accuracy,
            averageTime: avgTime,
            stickersCollected: (data.stickers || []).length,
            totalStickers: this.stickerDefs.length,
            strongest: strongest,
            weakest: weakest,
            dailyChallengesCompleted: Utils.load('dailyChallengesTotal', 0)
        };
    },

    _formatMathType(type) {
        const names = {
            'addition': 'Addition',
            'subtraction': 'Subtraction',
            'multiplication': 'Multiplication',
            'division': 'Division',
            'mixed': 'Mixed',
            'fractions': 'Fractions',
            'comparison': 'Comparison',
            'patterns': 'Patterns',
            'word-problem': 'Word Problems',
            'algebra-basic': 'Basic Algebra',
            'algebra-intermediate': 'Algebra',
            'algebra-advanced': 'Advanced Algebra'
        };
        return names[type] || type;
    },

    // ---- Utilities ----

    _getDateString(offsetDays = 0) {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },

    _generateDailySeed() {
        const today = this._getDateString();
        let hash = 0;
        for (let i = 0; i < today.length; i++) {
            const chr = today.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0;
        }
        return Math.abs(hash);
    },

    _seededRandom(seed, index) {
        const x = Math.sin(seed + index * 12.9898) * 43758.5453;
        return x - Math.floor(x);
    }
};
