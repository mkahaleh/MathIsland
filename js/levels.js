/* ========================================
   MATH ISLAND - Level System
   30 levels across 6 island zones
   ======================================== */

const Levels = {
    zones: [
        {
            id: 'beach',
            name: 'Sandy Shores',
            description: 'Begin your adventure on the sunny beach!',
            icon: '🏖️',
            color: '#ffd166',
            bgColors: ['#87ceeb', '#ffd166', '#f4a261'],
            levels: [1, 2, 3, 4, 5]
        },
        {
            id: 'jungle',
            name: 'Jungle Trail',
            description: 'Navigate through the tropical jungle!',
            icon: '🌴',
            color: '#06d6a0',
            bgColors: ['#2d6a4f', '#40916c', '#52b788'],
            levels: [6, 7, 8, 9, 10]
        },
        {
            id: 'cave',
            name: 'Crystal Cave',
            description: 'Discover gems hidden in the cave!',
            icon: '💎',
            color: '#8338ec',
            bgColors: ['#2b2d42', '#5a189a', '#7b2cbf'],
            levels: [11, 12, 13, 14, 15]
        },
        {
            id: 'volcano',
            name: 'Volcano Peak',
            description: 'Brave the heat of the volcano!',
            icon: '🌋',
            color: '#ef476f',
            bgColors: ['#d00000', '#e85d04', '#faa307'],
            levels: [16, 17, 18, 19, 20]
        },
        {
            id: 'sky',
            name: 'Cloud Kingdom',
            description: 'Float among the clouds!',
            icon: '☁️',
            color: '#00b4d8',
            bgColors: ['#caf0f8', '#90e0ef', '#48cae4'],
            levels: [21, 22, 23, 24, 25]
        },
        {
            id: 'space',
            name: 'Star Temple',
            description: 'The final challenge among the stars!',
            icon: '⭐',
            color: '#ffd700',
            bgColors: ['#0d1b2a', '#1b263b', '#415a77'],
            levels: [26, 27, 28, 29, 30]
        }
    ],

    definitions: {
        // Zone 1: Sandy Shores (Basics)
        1: {
            name: 'First Steps',
            type: 'addition',
            problems: 8,
            timePerProblem: 30,
            starThresholds: [4, 6, 8], // 1-star, 2-star, 3-star correct counts
            description: 'Simple addition to warm up!'
        },
        2: {
            name: 'Shell Counting',
            type: 'addition',
            problems: 10,
            timePerProblem: 25,
            starThresholds: [5, 7, 9],
            description: 'Count shells on the beach!'
        },
        3: {
            name: 'Tide Takeaway',
            type: 'subtraction',
            problems: 10,
            timePerProblem: 25,
            starThresholds: [5, 7, 9],
            description: 'The tide takes things away...'
        },
        4: {
            name: 'Beach Mix',
            type: 'mixed',
            problems: 10,
            timePerProblem: 25,
            starThresholds: [5, 7, 9],
            description: 'Addition and subtraction mix!'
        },
        5: {
            name: 'Sand Castle Boss',
            type: 'mixed',
            problems: 12,
            timePerProblem: 20,
            starThresholds: [6, 9, 11],
            description: 'Build the ultimate sand castle!'
        },

        // Zone 2: Jungle Trail (Multiplication & Division)
        6: {
            name: 'Vine Climber',
            type: 'multiplication',
            problems: 10,
            timePerProblem: 25,
            starThresholds: [5, 7, 9],
            description: 'Multiply your way up the vines!'
        },
        7: {
            name: 'Banana Split',
            type: 'division',
            problems: 10,
            timePerProblem: 25,
            starThresholds: [5, 7, 9],
            description: 'Share bananas with the monkeys!'
        },
        8: {
            name: 'Jungle Math',
            type: 'mixed',
            problems: 12,
            timePerProblem: 22,
            starThresholds: [6, 9, 11],
            description: 'All four operations in the wild!'
        },
        9: {
            name: 'Pattern Parrot',
            type: 'patterns',
            problems: 10,
            timePerProblem: 30,
            starThresholds: [5, 7, 9],
            description: 'Find the pattern like a clever parrot!'
        },
        10: {
            name: 'Jungle King Boss',
            type: 'mixed',
            problems: 15,
            timePerProblem: 20,
            starThresholds: [7, 11, 14],
            description: 'Defeat the Jungle King!'
        },

        // Zone 3: Crystal Cave (Fractions & Comparisons)
        11: {
            name: 'Crystal Fractions',
            type: 'fractions',
            problems: 10,
            timePerProblem: 30,
            starThresholds: [5, 7, 9],
            description: 'Split crystals into fractions!'
        },
        12: {
            name: 'Gem Compare',
            type: 'comparison',
            problems: 10,
            timePerProblem: 20,
            starThresholds: [5, 7, 9],
            description: 'Which pile of gems is bigger?'
        },
        13: {
            name: 'Deep Dive',
            type: 'fractions',
            problems: 12,
            timePerProblem: 28,
            starThresholds: [6, 9, 11],
            description: 'Dive deeper into fractions!'
        },
        14: {
            name: 'Word Cavern',
            type: 'word-problem',
            problems: 10,
            timePerProblem: 35,
            starThresholds: [5, 7, 9],
            description: 'Solve word problems in the cavern!'
        },
        15: {
            name: 'Crystal Guardian Boss',
            type: 'mixed',
            problems: 15,
            timePerProblem: 25,
            starThresholds: [7, 11, 14],
            description: 'Face the Crystal Guardian!'
        },

        // Zone 4: Volcano Peak (Basic Algebra)
        16: {
            name: 'Mystery Number',
            type: 'algebra-basic',
            problems: 10,
            timePerProblem: 30,
            starThresholds: [5, 7, 9],
            description: 'Find the mystery number!'
        },
        17: {
            name: 'Lava Equations',
            type: 'algebra-basic',
            problems: 12,
            timePerProblem: 28,
            starThresholds: [6, 9, 11],
            description: 'Solve equations before the lava rises!'
        },
        18: {
            name: 'Two-Step Trek',
            type: 'algebra-intermediate',
            problems: 10,
            timePerProblem: 35,
            starThresholds: [5, 7, 9],
            description: 'Two steps to find the answer!'
        },
        19: {
            name: 'Fire Patterns',
            type: 'patterns',
            problems: 12,
            timePerProblem: 30,
            starThresholds: [6, 9, 11],
            description: 'Advanced patterns in the flames!'
        },
        20: {
            name: 'Volcano Dragon Boss',
            type: 'algebra-intermediate',
            problems: 15,
            timePerProblem: 30,
            starThresholds: [7, 11, 14],
            description: 'Defeat the Volcano Dragon!'
        },

        // Zone 5: Cloud Kingdom (Intermediate Algebra)
        21: {
            name: 'Cloud Equations',
            type: 'algebra-intermediate',
            problems: 10,
            timePerProblem: 35,
            starThresholds: [5, 7, 9],
            description: 'Equations floating in the clouds!'
        },
        22: {
            name: 'Sky Stories',
            type: 'word-problem',
            problems: 12,
            timePerProblem: 35,
            starThresholds: [6, 9, 11],
            description: 'Word problems among the stars!'
        },
        23: {
            name: 'Rainbow Bridge',
            type: 'mixed',
            problems: 15,
            timePerProblem: 25,
            starThresholds: [7, 11, 14],
            description: 'Cross the rainbow with all your skills!'
        },
        24: {
            name: 'Wind Algebra',
            type: 'algebra-advanced',
            problems: 10,
            timePerProblem: 40,
            starThresholds: [5, 7, 9],
            description: 'Advanced algebra in the wind!'
        },
        25: {
            name: 'Cloud King Boss',
            type: 'algebra-advanced',
            problems: 15,
            timePerProblem: 35,
            starThresholds: [7, 11, 14],
            description: 'The Cloud King awaits!'
        },

        // Zone 6: Star Temple (Advanced)
        26: {
            name: 'Star Algebra',
            type: 'algebra-advanced',
            problems: 12,
            timePerProblem: 40,
            starThresholds: [6, 9, 11],
            description: 'Algebra among the stars!'
        },
        27: {
            name: 'Cosmic Mix',
            type: 'mixed',
            problems: 15,
            timePerProblem: 25,
            starThresholds: [7, 11, 14],
            description: 'Every type of math challenge!'
        },
        28: {
            name: 'Galaxy Patterns',
            type: 'patterns',
            problems: 12,
            timePerProblem: 35,
            starThresholds: [6, 9, 11],
            description: 'Find patterns across the galaxy!'
        },
        29: {
            name: 'Nebula Words',
            type: 'word-problem',
            problems: 15,
            timePerProblem: 35,
            starThresholds: [7, 11, 14],
            description: 'The hardest word problems!'
        },
        30: {
            name: 'Final Boss: Math Master',
            type: 'mixed',
            problems: 20,
            timePerProblem: 30,
            starThresholds: [10, 15, 19],
            description: 'The ultimate math challenge!'
        }
    },

    getLevel(num) {
        return this.definitions[num] || null;
    },

    getZoneForLevel(levelNum) {
        return this.zones.find(z => z.levels.includes(levelNum));
    },

    getTotalLevels() {
        return Object.keys(this.definitions).length;
    },

    // Get save data
    loadProgress() {
        return Utils.load('levelProgress', {
            completed: {},
            highestUnlocked: 1,
            totalStars: 0
        });
    },

    saveProgress(progress) {
        Utils.save('levelProgress', progress);
    }
};
