/**
 * Property Tycoon - Persistent Storage Manager
 * localStorage-based persistence for user profiles, game stats, settings, and saves
 */

class StorageManager {
    constructor() {
        this.PREFIX = 'pt_'; // namespace prefix to avoid collisions
        this.KEYS = {
            USERS: this.PREFIX + 'users',
            CURRENT_USER: this.PREFIX + 'current_user',
            SETTINGS: this.PREFIX + 'settings',
            GAME_SAVE: this.PREFIX + 'game_save',
            ACTION_LOG: this.PREFIX + 'action_log'
        };
    }

    // ========================================
    // USER MANAGEMENT
    // ========================================

    /**
     * Get all registered users
     */
    getUsers() {
        try {
            const data = localStorage.getItem(this.KEYS.USERS);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.warn('Failed to read users:', e);
            return {};
        }
    }

    /**
     * Save users map back to storage
     */
    saveUsers(users) {
        try {
            localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
        } catch (e) {
            console.warn('Failed to save users:', e);
        }
    }

    /**
     * Register a new user
     */
    registerUser(username, pin) {
        const users = this.getUsers();

        if (users[username]) {
            return { success: false, error: 'Username already exists' };
        }

        if (!username || username.trim().length < 2) {
            return { success: false, error: 'Username must be at least 2 characters' };
        }

        if (!pin || pin.length < 4) {
            return { success: false, error: 'PIN must be at least 4 digits' };
        }

        users[username] = {
            username: username.trim(),
            pinHash: this.hashPin(pin),
            createdAt: Date.now(),
            lastLoginAt: null,
            avatar: this.getDefaultAvatar(Object.keys(users).length),
            stats: this.getDefaultStats(),
            preferences: this.getDefaultPreferences(),
            actionHistory: []
        };

        this.saveUsers(users);
        return { success: true };
    }

    /**
     * Authenticate a user
     */
    loginUser(username, pin) {
        const users = this.getUsers();
        const user = users[username];

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        if (user.pinHash !== this.hashPin(pin)) {
            return { success: false, error: 'Incorrect PIN' };
        }

        // Update last login
        user.lastLoginAt = Date.now();
        this.saveUsers(users);

        // Set current user
        localStorage.setItem(this.KEYS.CURRENT_USER, username);

        return { success: true, user };
    }

    /**
     * Get currently logged in user
     */
    getCurrentUser() {
        const username = localStorage.getItem(this.KEYS.CURRENT_USER);
        if (!username) return null;

        const users = this.getUsers();
        return users[username] || null;
    }

    /**
     * Get current username
     */
    getCurrentUsername() {
        return localStorage.getItem(this.KEYS.CURRENT_USER);
    }

    /**
     * Log out current user
     */
    logoutUser() {
        localStorage.removeItem(this.KEYS.CURRENT_USER);
    }

    /**
     * Update user profile
     */
    updateUser(username, updates) {
        const users = this.getUsers();
        if (!users[username]) return false;

        Object.assign(users[username], updates);
        this.saveUsers(users);
        return true;
    }

    /**
     * Delete a user account
     */
    deleteUser(username) {
        const users = this.getUsers();
        if (!users[username]) return false;

        delete users[username];
        this.saveUsers(users);

        if (this.getCurrentUsername() === username) {
            this.logoutUser();
        }
        return true;
    }

    // ========================================
    // STATISTICS
    // ========================================

    /**
     * Get default stats for a new user
     */
    getDefaultStats() {
        return {
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            totalMoneyEarned: 0,
            totalMoneySpent: 0,
            propertiesBought: 0,
            housesBuilt: 0,
            hotelsBuilt: 0,
            rentCollected: 0,
            rentPaid: 0,
            timesInJail: 0,
            timesBankrupt: 0,
            doublesRolled: 0,
            longestGame: 0,  // turns
            highestNetWorth: 0,
            favoriteProperty: null,
            totalPlayTimeMs: 0,
            lastGameDate: null
        };
    }

    /**
     * Update a stat for the current user
     */
    updateStat(statName, value) {
        const username = this.getCurrentUsername();
        if (!username) return;

        const users = this.getUsers();
        const user = users[username];
        if (!user) return;

        if (typeof value === 'number' && typeof user.stats[statName] === 'number') {
            user.stats[statName] += value;
        } else {
            user.stats[statName] = value;
        }

        this.saveUsers(users);
    }

    /**
     * Set a stat to an exact value (for max tracking like highestNetWorth)
     */
    setStatMax(statName, value) {
        const username = this.getCurrentUsername();
        if (!username) return;

        const users = this.getUsers();
        const user = users[username];
        if (!user) return;

        if (value > (user.stats[statName] || 0)) {
            user.stats[statName] = value;
            this.saveUsers(users);
        }
    }

    /**
     * Get stats for the current user
     */
    getStats() {
        const user = this.getCurrentUser();
        return user ? user.stats : this.getDefaultStats();
    }

    /**
     * Get leaderboard (all users sorted by wins)
     */
    getLeaderboard() {
        const users = this.getUsers();
        return Object.values(users)
            .map(u => ({
                username: u.username,
                avatar: u.avatar,
                wins: u.stats.gamesWon,
                played: u.stats.gamesPlayed,
                winRate: u.stats.gamesPlayed > 0
                    ? Math.round((u.stats.gamesWon / u.stats.gamesPlayed) * 100)
                    : 0,
                highestWorth: u.stats.highestNetWorth,
                totalPlayTime: u.stats.totalPlayTimeMs
            }))
            .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);
    }

    // ========================================
    // ACTION HISTORY (Persistent Memory)
    // ========================================

    /**
     * Log a user action for persistent memory
     */
    logAction(actionType, details) {
        const username = this.getCurrentUsername();
        if (!username) return;

        const users = this.getUsers();
        const user = users[username];
        if (!user) return;

        const action = {
            type: actionType,
            details: details,
            timestamp: Date.now()
        };

        user.actionHistory.push(action);

        // Keep history manageable (last 500 actions)
        if (user.actionHistory.length > 500) {
            user.actionHistory = user.actionHistory.slice(-400);
        }

        this.saveUsers(users);
    }

    /**
     * Get action history for current user
     */
    getActionHistory(limit = 50) {
        const user = this.getCurrentUser();
        if (!user) return [];
        return user.actionHistory.slice(-limit);
    }

    /**
     * Get action summary (aggregated stats from action history)
     */
    getActionSummary() {
        const user = this.getCurrentUser();
        if (!user) return {};

        const history = user.actionHistory;
        const summary = {
            totalActions: history.length,
            propertyPurchases: history.filter(a => a.type === 'buy_property').length,
            diceRolls: history.filter(a => a.type === 'dice_roll').length,
            housesBuilt: history.filter(a => a.type === 'build_house').length,
            tradesCompleted: history.filter(a => a.type === 'trade').length,
            auctionWins: history.filter(a => a.type === 'auction_win').length,
            favoriteProperties: this.getFavoriteProperties(history),
            recentActions: history.slice(-10)
        };

        return summary;
    }

    /**
     * Get most frequently purchased properties
     */
    getFavoriteProperties(history) {
        const propCounts = {};
        history.filter(a => a.type === 'buy_property').forEach(a => {
            const name = a.details.propertyName;
            propCounts[name] = (propCounts[name] || 0) + 1;
        });

        return Object.entries(propCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
    }

    // ========================================
    // GAME SAVES
    // ========================================

    /**
     * Save current game state
     */
    saveGame(gameState, slotName = 'auto') {
        const username = this.getCurrentUsername();
        const key = this.PREFIX + 'save_' + (username || 'guest') + '_' + slotName;

        try {
            const saveData = {
                state: gameState,
                savedAt: Date.now(),
                username: username,
                slotName: slotName
            };
            localStorage.setItem(key, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.warn('Failed to save game:', e);
            return false;
        }
    }

    /**
     * Load a saved game
     */
    loadGame(slotName = 'auto') {
        const username = this.getCurrentUsername();
        const key = this.PREFIX + 'save_' + (username || 'guest') + '_' + slotName;

        try {
            const data = localStorage.getItem(key);
            if (!data) return null;
            return JSON.parse(data);
        } catch (e) {
            console.warn('Failed to load game:', e);
            return null;
        }
    }

    /**
     * Get list of save slots for current user
     */
    getSaveSlots() {
        const username = this.getCurrentUsername() || 'guest';
        const prefix = this.PREFIX + 'save_' + username + '_';
        const slots = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    slots.push({
                        slotName: key.replace(prefix, ''),
                        savedAt: data.savedAt,
                        username: data.username
                    });
                } catch (e) {
                    // Skip corrupted saves
                }
            }
        }

        return slots.sort((a, b) => b.savedAt - a.savedAt);
    }

    /**
     * Delete a save slot
     */
    deleteSave(slotName) {
        const username = this.getCurrentUsername() || 'guest';
        const key = this.PREFIX + 'save_' + username + '_' + slotName;
        localStorage.removeItem(key);
    }

    // ========================================
    // PREFERENCES
    // ========================================

    /**
     * Get default preferences
     */
    getDefaultPreferences() {
        return {
            soundEnabled: true,
            soundVolume: 0.3,
            animationSpeed: 'normal', // slow, normal, fast
            lastTokenId: 0,
            lastPlayerCount: 2,
            lastAIDifficulty: 'medium',
            theme: 'default'
        };
    }

    /**
     * Get preferences for current user
     */
    getPreferences() {
        const user = this.getCurrentUser();
        return user ? user.preferences : this.getDefaultPreferences();
    }

    /**
     * Update a preference
     */
    setPreference(key, value) {
        const username = this.getCurrentUsername();
        if (!username) return;

        const users = this.getUsers();
        const user = users[username];
        if (!user) return;

        user.preferences[key] = value;
        this.saveUsers(users);
    }

    // ========================================
    // HELPERS
    // ========================================

    /**
     * Simple hash for PIN (not cryptographically secure, but adequate for local TV game)
     */
    hashPin(pin) {
        let hash = 0;
        const str = 'pt_salt_' + pin;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit int
        }
        return hash.toString(36);
    }

    /**
     * Get default avatar based on index
     */
    getDefaultAvatar(index) {
        const avatars = ['🏠', '🏢', '🏰', '🌆', '🕌', '🏗️', '🎯', '⭐'];
        return avatars[index % avatars.length];
    }

    /**
     * Get storage usage info
     */
    getStorageInfo() {
        let totalSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.PREFIX)) {
                totalSize += (localStorage.getItem(key) || '').length;
            }
        }
        return {
            usedBytes: totalSize * 2, // UTF-16
            usedKB: Math.round((totalSize * 2) / 1024),
            itemCount: localStorage.length
        };
    }

    /**
     * Clear all game data (factory reset)
     */
    clearAll() {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }
}

// Global storage instance
const storage = new StorageManager();
