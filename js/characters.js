/* ========================================
   MATH ISLAND - Character System
   Playable characters with unique traits
   ======================================== */

const Characters = {
    roster: [
        {
            id: 'luna',
            name: 'Luna the Explorer',
            emoji: '🧙‍♀️',
            description: 'A brave wizard who loves numbers!',
            color: '#8338ec',
            bgGradient: ['#c084fc', '#8338ec'],
            unlocked: true,
            unlockLevel: 0,
            bonus: 'Extra time on problems',
            bonusType: 'time',
            bonusValue: 5, // +5 seconds
            animations: {
                idle: ['🧙‍♀️'],
                happy: ['🧙‍♀️', '✨'],
                sad: ['🧙‍♀️', '💫'],
                celebrate: ['🧙‍♀️', '🎉', '⭐']
            }
        },
        {
            id: 'captain',
            name: 'Captain Finn',
            emoji: '🏴‍☠️',
            description: 'A friendly pirate hunting for treasure!',
            color: '#ef476f',
            bgGradient: ['#ff6b8a', '#ef476f'],
            unlocked: true,
            unlockLevel: 0,
            bonus: 'Bonus points for streaks',
            bonusType: 'streak',
            bonusValue: 1.5, // 1.5x streak multiplier
            animations: {
                idle: ['🏴‍☠️'],
                happy: ['🏴‍☠️', '💎'],
                sad: ['🏴‍☠️', '😅'],
                celebrate: ['🏴‍☠️', '🎉', '💰']
            }
        },
        {
            id: 'coral',
            name: 'Coral the Mermaid',
            emoji: '🧜‍♀️',
            description: 'Swims through math with grace!',
            color: '#00b4d8',
            bgGradient: ['#48cae4', '#0077b6'],
            unlocked: true,
            unlockLevel: 0,
            bonus: 'Hint available once per level',
            bonusType: 'hint',
            bonusValue: 1,
            animations: {
                idle: ['🧜‍♀️'],
                happy: ['🧜‍♀️', '🐚'],
                sad: ['🧜‍♀️', '💧'],
                celebrate: ['🧜‍♀️', '🎉', '🌊']
            }
        },
        {
            id: 'dino',
            name: 'Rex the Dino',
            emoji: '🦖',
            description: 'Small arms, big brain!',
            color: '#06d6a0',
            bgGradient: ['#34d399', '#059669'],
            unlocked: false,
            unlockLevel: 5,
            bonus: 'Double points on first 3 answers',
            bonusType: 'doubleStart',
            bonusValue: 3,
            animations: {
                idle: ['🦖'],
                happy: ['🦖', '🌟'],
                sad: ['🦖', '😢'],
                celebrate: ['🦖', '🎉', '🔥']
            }
        },
        {
            id: 'astro',
            name: 'Astro the Space Cat',
            emoji: '🐱',
            description: 'Explores math from outer space!',
            color: '#fb8500',
            bgGradient: ['#ffaa33', '#fb8500'],
            unlocked: false,
            unlockLevel: 10,
            bonus: 'Wrong answers don\'t break streak',
            bonusType: 'shield',
            bonusValue: 1,
            animations: {
                idle: ['🐱'],
                happy: ['🐱', '🚀'],
                sad: ['🐱', '💫'],
                celebrate: ['🐱', '🎉', '🌙']
            }
        },
        {
            id: 'phoenix',
            name: 'Blaze the Phoenix',
            emoji: '🦅',
            description: 'Rises from every challenge!',
            color: '#ff6b35',
            bgGradient: ['#ff8c5a', '#ff4500'],
            unlocked: false,
            unlockLevel: 15,
            bonus: 'All points doubled',
            bonusType: 'doubleAll',
            bonusValue: 2,
            animations: {
                idle: ['🦅'],
                happy: ['🦅', '🔥'],
                sad: ['🦅', '💨'],
                celebrate: ['🦅', '🎉', '🔥']
            }
        },
        {
            id: 'robot',
            name: 'Byte the Robot',
            emoji: '🤖',
            description: 'Calculates at lightning speed!',
            color: '#64748b',
            bgGradient: ['#94a3b8', '#475569'],
            unlocked: false,
            unlockLevel: 20,
            bonus: 'Shows if answer is close',
            bonusType: 'proximity',
            bonusValue: 1,
            animations: {
                idle: ['🤖'],
                happy: ['🤖', '⚡'],
                sad: ['🤖', '🔧'],
                celebrate: ['🤖', '🎉', '💡']
            }
        },
        {
            id: 'dragon',
            name: 'Spark the Dragon',
            emoji: '🐉',
            description: 'Master of all math realms!',
            color: '#dc2626',
            bgGradient: ['#f87171', '#dc2626'],
            unlocked: false,
            unlockLevel: 25,
            bonus: 'Triple score multiplier',
            bonusType: 'tripleAll',
            bonusValue: 3,
            animations: {
                idle: ['🐉'],
                happy: ['🐉', '🔥'],
                sad: ['🐉', '💨'],
                celebrate: ['🐉', '🎉', '👑']
            }
        }
    ],

    getCharacter(id) {
        return this.roster.find(c => c.id === id);
    },

    getUnlocked() {
        return this.roster.filter(c => c.unlocked);
    },

    checkUnlocks(completedLevels) {
        const newUnlocks = [];
        this.roster.forEach(char => {
            if (!char.unlocked && completedLevels >= char.unlockLevel) {
                char.unlocked = true;
                newUnlocks.push(char);
            }
        });
        return newUnlocks;
    },

    loadUnlockState() {
        const saved = Utils.load('unlockedCharacters', []);
        saved.forEach(id => {
            const char = this.getCharacter(id);
            if (char) char.unlocked = true;
        });
    },

    saveUnlockState() {
        const unlocked = this.roster.filter(c => c.unlocked).map(c => c.id);
        Utils.save('unlockedCharacters', unlocked);
    },

    // Draw character on canvas - uses chibi sprite renderer
    drawCharacter(ctx, char, x, y, size, time, mood) {
        if (typeof SpriteRenderer !== 'undefined' && SpriteRenderer._cacheReady) {
            SpriteRenderer.drawCharacter(ctx, char.id, x, y, size, time, mood || 'idle');
        } else {
            // Fallback to emoji while sprites load
            const bounceY = Math.sin(time * 2) * 8;
            const scale = 1 + Math.sin(time * 3) * 0.03;
            ctx.save();
            ctx.translate(x, y + bounceY);
            ctx.scale(scale, scale);
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.beginPath();
            ctx.ellipse(0, size * 0.4, size * 0.35, size * 0.08, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = `${size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(char.emoji, 0, 0);
            ctx.restore();
        }
    }
};
