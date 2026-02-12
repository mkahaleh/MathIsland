/**
 * Property Tycoon - Game Data
 * All board spaces, cards, and constants
 */

const GAME_DATA = {
    // Starting money for each player
    STARTING_MONEY: 1500,

    // Salary for passing GO
    GO_SALARY: 200,

    // Bail cost
    BAIL_COST: 50,

    // Max turns in jail
    MAX_JAIL_TURNS: 3,

    // Max houses per property
    MAX_HOUSES: 4,

    // Color groups
    COLORS: {
        BROWN: { name: 'Brown', hex: '#8B4513', light: '#A0522D', count: 2 },
        LIGHT_BLUE: { name: 'Light Blue', hex: '#87CEEB', light: '#B0E0E6', count: 3 },
        PINK: { name: 'Pink', hex: '#FF69B4', light: '#FFB6C1', count: 3 },
        ORANGE: { name: 'Orange', hex: '#FF8C00', light: '#FFA500', count: 3 },
        RED: { name: 'Red', hex: '#DC143C', light: '#FF6347', count: 3 },
        YELLOW: { name: 'Yellow', hex: '#FFD700', light: '#FFEC8B', count: 3 },
        GREEN: { name: 'Green', hex: '#228B22', light: '#32CD32', count: 3 },
        DARK_BLUE: { name: 'Dark Blue', hex: '#00008B', light: '#4169E1', count: 2 }
    },

    // Board spaces (40 total, clockwise from GO)
    BOARD: [
        // Bottom row (right to left): positions 0-10
        { id: 0, name: 'GO', type: 'go', side: 'bottom' },
        { id: 1, name: 'Mediterranean Avenue', type: 'property', color: 'BROWN', price: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50, side: 'bottom' },
        { id: 2, name: 'Community Chest', type: 'community', side: 'bottom' },
        { id: 3, name: 'Baltic Avenue', type: 'property', color: 'BROWN', price: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50, side: 'bottom' },
        { id: 4, name: 'Income Tax', type: 'tax', amount: 200, side: 'bottom' },
        { id: 5, name: 'Reading Railroad', type: 'railroad', price: 200, side: 'bottom' },
        { id: 6, name: 'Oriental Avenue', type: 'property', color: 'LIGHT_BLUE', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, side: 'bottom' },
        { id: 7, name: 'Chance', type: 'chance', side: 'bottom' },
        { id: 8, name: 'Vermont Avenue', type: 'property', color: 'LIGHT_BLUE', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, side: 'bottom' },
        { id: 9, name: 'Connecticut Avenue', type: 'property', color: 'LIGHT_BLUE', price: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 50, side: 'bottom' },
        { id: 10, name: 'Jail / Just Visiting', type: 'jail', side: 'corner' },

        // Left column (bottom to top): positions 11-19
        { id: 11, name: 'St. Charles Place', type: 'property', color: 'PINK', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, side: 'left' },
        { id: 12, name: 'Electric Company', type: 'utility', price: 150, side: 'left' },
        { id: 13, name: 'States Avenue', type: 'property', color: 'PINK', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, side: 'left' },
        { id: 14, name: 'Virginia Avenue', type: 'property', color: 'PINK', price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100, side: 'left' },
        { id: 15, name: 'Pennsylvania Railroad', type: 'railroad', price: 200, side: 'left' },
        { id: 16, name: 'St. James Place', type: 'property', color: 'ORANGE', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, side: 'left' },
        { id: 17, name: 'Community Chest', type: 'community', side: 'left' },
        { id: 18, name: 'Tennessee Avenue', type: 'property', color: 'ORANGE', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, side: 'left' },
        { id: 19, name: 'New York Avenue', type: 'property', color: 'ORANGE', price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100, side: 'left' },
        { id: 20, name: 'Free Parking', type: 'free_parking', side: 'corner' },

        // Top row (left to right): positions 21-29
        { id: 21, name: 'Kentucky Avenue', type: 'property', color: 'RED', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, side: 'top' },
        { id: 22, name: 'Chance', type: 'chance', side: 'top' },
        { id: 23, name: 'Indiana Avenue', type: 'property', color: 'RED', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, side: 'top' },
        { id: 24, name: 'Illinois Avenue', type: 'property', color: 'RED', price: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150, side: 'top' },
        { id: 25, name: 'B&O Railroad', type: 'railroad', price: 200, side: 'top' },
        { id: 26, name: 'Atlantic Avenue', type: 'property', color: 'YELLOW', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, side: 'top' },
        { id: 27, name: 'Ventnor Avenue', type: 'property', color: 'YELLOW', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, side: 'top' },
        { id: 28, name: 'Water Works', type: 'utility', price: 150, side: 'top' },
        { id: 29, name: 'Marvin Gardens', type: 'property', color: 'YELLOW', price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, side: 'top' },
        { id: 30, name: 'Go To Jail', type: 'go_to_jail', side: 'corner' },

        // Right column (top to bottom): positions 31-39
        { id: 31, name: 'Pacific Avenue', type: 'property', color: 'GREEN', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, side: 'right' },
        { id: 32, name: 'North Carolina Avenue', type: 'property', color: 'GREEN', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, side: 'right' },
        { id: 33, name: 'Community Chest', type: 'community', side: 'right' },
        { id: 34, name: 'Pennsylvania Avenue', type: 'property', color: 'GREEN', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, side: 'right' },
        { id: 35, name: 'Short Line Railroad', type: 'railroad', price: 200, side: 'right' },
        { id: 36, name: 'Chance', type: 'chance', side: 'right' },
        { id: 37, name: 'Park Place', type: 'property', color: 'DARK_BLUE', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, side: 'right' },
        { id: 38, name: 'Luxury Tax', type: 'tax', amount: 100, side: 'right' },
        { id: 39, name: 'Boardwalk', type: 'property', color: 'DARK_BLUE', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200, side: 'right' }
    ],

    // Chance cards
    CHANCE_CARDS: [
        { text: 'Advance to Boardwalk', action: 'move_to', destination: 39 },
        { text: 'Advance to GO. Collect $200.', action: 'move_to', destination: 0 },
        { text: 'Advance to Illinois Avenue. If you pass GO, collect $200.', action: 'move_to', destination: 24 },
        { text: 'Advance to St. Charles Place. If you pass GO, collect $200.', action: 'move_to', destination: 11 },
        { text: 'Advance to the nearest Railroad.', action: 'nearest_railroad' },
        { text: 'Advance to the nearest Railroad.', action: 'nearest_railroad' },
        { text: 'Advance to the nearest Utility.', action: 'nearest_utility' },
        { text: 'Bank pays you dividend of $50.', action: 'collect', amount: 50 },
        { text: 'Get Out of Jail Free.', action: 'jail_free' },
        { text: 'Go Back 3 Spaces.', action: 'move_back', spaces: 3 },
        { text: 'Go to Jail. Do not pass GO. Do not collect $200.', action: 'go_to_jail' },
        { text: 'Make general repairs on all your property. $25 per house, $100 per hotel.', action: 'repairs', perHouse: 25, perHotel: 100 },
        { text: 'Speeding fine $15.', action: 'pay', amount: 15 },
        { text: 'Take a trip to Reading Railroad. If you pass GO, collect $200.', action: 'move_to', destination: 5 },
        { text: 'You have been elected Chairman of the Board. Pay each player $50.', action: 'pay_each', amount: 50 },
        { text: 'Your building loan matures. Collect $150.', action: 'collect', amount: 150 }
    ],

    // Community Chest cards
    COMMUNITY_CARDS: [
        { text: 'Advance to GO. Collect $200.', action: 'move_to', destination: 0 },
        { text: 'Bank error in your favor. Collect $200.', action: 'collect', amount: 200 },
        { text: "Doctor's fee. Pay $50.", action: 'pay', amount: 50 },
        { text: 'From sale of stock you get $50.', action: 'collect', amount: 50 },
        { text: 'Get Out of Jail Free.', action: 'jail_free' },
        { text: 'Go to Jail. Do not pass GO. Do not collect $200.', action: 'go_to_jail' },
        { text: 'Holiday fund matures. Receive $100.', action: 'collect', amount: 100 },
        { text: 'Income tax refund. Collect $20.', action: 'collect', amount: 20 },
        { text: 'It is your birthday. Collect $10 from every player.', action: 'collect_each', amount: 10 },
        { text: 'Life insurance matures. Collect $100.', action: 'collect', amount: 100 },
        { text: 'Pay hospital fees of $100.', action: 'pay', amount: 100 },
        { text: 'Pay school fees of $50.', action: 'pay', amount: 50 },
        { text: 'Receive $25 consultancy fee.', action: 'collect', amount: 25 },
        { text: 'You are assessed for street repair. $40 per house, $115 per hotel.', action: 'repairs', perHouse: 40, perHotel: 115 },
        { text: 'You have won second prize in a beauty contest. Collect $10.', action: 'collect', amount: 10 },
        { text: 'You inherit $100.', action: 'collect', amount: 100 }
    ],

    // Player tokens with detailed character descriptions
    TOKENS: [
        { id: 0, name: 'Top Hat', symbol: '🎩', color: '#2C3E50', description: 'The distinguished gentleman' },
        { id: 1, name: 'Race Car', symbol: '🏎️', color: '#E74C3C', description: 'Speed and style' },
        { id: 2, name: 'Battleship', symbol: '🚢', color: '#3498DB', description: 'Commander of the seas' },
        { id: 3, name: 'Boot', symbol: '👢', color: '#8B4513', description: 'The working class hero' },
        { id: 4, name: 'Wheelbarrow', symbol: '🏗️', color: '#27AE60', description: 'The builder' },
        { id: 5, name: 'Scottie Dog', symbol: '🐕', color: '#F39C12', description: 'The loyal companion' }
    ],

    // Railroad rent based on number owned
    RAILROAD_RENT: [25, 50, 100, 200],

    // Utility multiplier based on number owned
    UTILITY_MULTIPLIER: [4, 10]
};

// Freeze game data to prevent accidental mutations
Object.freeze(GAME_DATA);
Object.freeze(GAME_DATA.BOARD);
Object.freeze(GAME_DATA.CHANCE_CARDS);
Object.freeze(GAME_DATA.COMMUNITY_CARDS);
Object.freeze(GAME_DATA.TOKENS);
