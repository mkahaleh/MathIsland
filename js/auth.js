/**
 * Property Tycoon: Riyadh Edition - Authentication UI
 * Login screen, registration, user profile display
 */

class AuthUI {
    constructor(storageManager) {
        this.storage = storageManager;
        this.onLoginSuccess = null;
        this.onGuestPlay = null;
        this.mode = 'login'; // login, register, profile
    }

    /**
     * Render the login screen
     */
    render() {
        const container = document.getElementById('login-content');
        if (!container) return;

        // Check if a user is already logged in
        const currentUser = this.storage.getCurrentUser();
        if (currentUser) {
            this.renderProfile(container, currentUser);
            return;
        }

        if (this.mode === 'register') {
            this.renderRegister(container);
        } else {
            this.renderLogin(container);
        }
    }

    /**
     * Render login form
     */
    renderLogin(container) {
        const users = this.storage.getUsers();
        const userList = Object.keys(users);

        let html = `
            <div class="auth-panel">
                <div class="auth-logo">
                    <div class="auth-logo-icon">🏰</div>
                    <h1 class="auth-title">PROPERTY TYCOON</h1>
                    <h2 class="auth-edition">Riyadh Edition</h2>
                </div>
        `;

        if (userList.length > 0) {
            html += `
                <div class="auth-section">
                    <h3 class="auth-section-title">Welcome Back</h3>
                    <p class="auth-hint">Select your profile to log in</p>
                    <div class="user-list">
            `;

            userList.forEach(username => {
                const user = users[username];
                const winRate = user.stats.gamesPlayed > 0
                    ? Math.round((user.stats.gamesWon / user.stats.gamesPlayed) * 100)
                    : 0;
                html += `
                    <button class="user-card focusable" data-username="${username}">
                        <span class="user-avatar">${user.avatar}</span>
                        <div class="user-info">
                            <span class="user-card-name">${username}</span>
                            <span class="user-card-stats">
                                ${user.stats.gamesPlayed} games | ${user.stats.gamesWon} wins (${winRate}%)
                            </span>
                        </div>
                        <span class="user-arrow">→</span>
                    </button>
                `;
            });

            html += `
                    </div>
                </div>

                <div class="auth-divider">
                    <span>or</span>
                </div>
            `;
        }

        html += `
                <div class="auth-section">
                    <div class="auth-form">
                        <div class="form-group">
                            <label for="login-username">Username</label>
                            <input type="text" id="login-username" class="auth-input focusable"
                                   placeholder="Enter username" autocomplete="off" />
                        </div>
                        <div class="form-group">
                            <label for="login-pin">PIN</label>
                            <input type="password" id="login-pin" class="auth-input focusable"
                                   placeholder="Enter 4+ digit PIN" maxlength="8" inputmode="numeric" />
                        </div>
                        <div id="login-error" class="auth-error"></div>
                        <button class="btn-auth btn-login focusable" id="btn-login">
                            Sign In
                        </button>
                    </div>
                </div>

                <div class="auth-footer">
                    <button class="btn-auth-link focusable" id="btn-show-register">
                        Create New Account
                    </button>
                    <button class="btn-auth-link focusable" id="btn-guest">
                        Play as Guest
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.attachLoginHandlers();
    }

    /**
     * Render registration form
     */
    renderRegister(container) {
        const html = `
            <div class="auth-panel">
                <div class="auth-logo">
                    <div class="auth-logo-icon">🏰</div>
                    <h1 class="auth-title">PROPERTY TYCOON</h1>
                    <h2 class="auth-edition">Create Account</h2>
                </div>

                <div class="auth-section">
                    <div class="auth-form">
                        <div class="form-group">
                            <label for="reg-username">Username</label>
                            <input type="text" id="reg-username" class="auth-input focusable"
                                   placeholder="Choose a username (2+ chars)" autocomplete="off" />
                        </div>
                        <div class="form-group">
                            <label for="reg-pin">PIN</label>
                            <input type="password" id="reg-pin" class="auth-input focusable"
                                   placeholder="Choose a 4+ digit PIN" maxlength="8" inputmode="numeric" />
                        </div>
                        <div class="form-group">
                            <label for="reg-pin-confirm">Confirm PIN</label>
                            <input type="password" id="reg-pin-confirm" class="auth-input focusable"
                                   placeholder="Re-enter PIN" maxlength="8" inputmode="numeric" />
                        </div>
                        <div class="form-group">
                            <label>Choose Avatar</label>
                            <div class="avatar-selector">
                                ${['🏠', '🏢', '🏰', '🌆', '🕌', '🏗️', '🎯', '⭐', '🦅', '🐪', '🌴', '☕'].map((av, i) => `
                                    <button class="btn-avatar focusable ${i === 0 ? 'selected' : ''}"
                                            data-avatar="${av}">${av}</button>
                                `).join('')}
                            </div>
                        </div>
                        <div id="reg-error" class="auth-error"></div>
                        <button class="btn-auth btn-register focusable" id="btn-register">
                            Create Account
                        </button>
                    </div>
                </div>

                <div class="auth-footer">
                    <button class="btn-auth-link focusable" id="btn-show-login">
                        Back to Sign In
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.attachRegisterHandlers();
    }

    /**
     * Render user profile (already logged in)
     */
    renderProfile(container, user) {
        const stats = user.stats;
        const winRate = stats.gamesPlayed > 0
            ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
        const playTimeMin = Math.round(stats.totalPlayTimeMs / 60000);

        // Get leaderboard position
        const leaderboard = this.storage.getLeaderboard();
        const rank = leaderboard.findIndex(l => l.username === user.username) + 1;

        // Get recent actions
        const recentActions = this.storage.getActionHistory(5);

        let html = `
            <div class="auth-panel profile-panel">
                <div class="profile-header">
                    <div class="profile-avatar">${user.avatar}</div>
                    <div class="profile-info">
                        <h2 class="profile-name">${user.username}</h2>
                        <span class="profile-rank">Rank #${rank} of ${leaderboard.length}</span>
                        <span class="profile-joined">Member since ${new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                <div class="profile-stats-grid">
                    <div class="profile-stat">
                        <span class="pstat-value">${stats.gamesPlayed}</span>
                        <span class="pstat-label">Games</span>
                    </div>
                    <div class="profile-stat">
                        <span class="pstat-value">${stats.gamesWon}</span>
                        <span class="pstat-label">Wins</span>
                    </div>
                    <div class="profile-stat">
                        <span class="pstat-value">${winRate}%</span>
                        <span class="pstat-label">Win Rate</span>
                    </div>
                    <div class="profile-stat">
                        <span class="pstat-value">$${stats.highestNetWorth.toLocaleString()}</span>
                        <span class="pstat-label">Best Worth</span>
                    </div>
                    <div class="profile-stat">
                        <span class="pstat-value">${stats.propertiesBought}</span>
                        <span class="pstat-label">Properties</span>
                    </div>
                    <div class="profile-stat">
                        <span class="pstat-value">${stats.housesBuilt + stats.hotelsBuilt}</span>
                        <span class="pstat-label">Buildings</span>
                    </div>
                    <div class="profile-stat">
                        <span class="pstat-value">$${stats.rentCollected.toLocaleString()}</span>
                        <span class="pstat-label">Rent Earned</span>
                    </div>
                    <div class="profile-stat">
                        <span class="pstat-value">${playTimeMin}m</span>
                        <span class="pstat-label">Play Time</span>
                    </div>
                </div>

                ${recentActions.length > 0 ? `
                    <div class="profile-recent">
                        <h3>Recent Activity</h3>
                        <div class="recent-list">
                            ${recentActions.map(a => `
                                <div class="recent-item">
                                    <span class="recent-type">${this.getActionIcon(a.type)}</span>
                                    <span class="recent-text">${this.getActionText(a)}</span>
                                    <span class="recent-time">${this.timeAgo(a.timestamp)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="profile-actions">
                    <button class="btn-auth btn-play focusable" id="btn-play-game">
                        Play Game
                    </button>
                    <button class="btn-auth-link focusable" id="btn-view-leaderboard">
                        Leaderboard
                    </button>
                    <button class="btn-auth-link focusable" id="btn-logout">
                        Switch Account
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.attachProfileHandlers();
    }

    /**
     * Attach login form handlers
     */
    attachLoginHandlers() {
        // Quick login via user cards
        document.querySelectorAll('.user-card').forEach(card => {
            card.addEventListener('click', () => {
                const username = card.dataset.username;
                document.getElementById('login-username').value = username;
                document.getElementById('login-pin').focus();
            });
        });

        // Login button
        const loginBtn = document.getElementById('btn-login');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.doLogin());
        }

        // Enter key on PIN field
        const pinField = document.getElementById('login-pin');
        if (pinField) {
            pinField.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.doLogin();
            });
        }

        // Show register
        const regBtn = document.getElementById('btn-show-register');
        if (regBtn) {
            regBtn.addEventListener('click', () => {
                this.mode = 'register';
                this.render();
            });
        }

        // Guest play
        const guestBtn = document.getElementById('btn-guest');
        if (guestBtn) {
            guestBtn.addEventListener('click', () => {
                if (this.onGuestPlay) this.onGuestPlay();
            });
        }
    }

    /**
     * Attach register form handlers
     */
    attachRegisterHandlers() {
        let selectedAvatar = '🏠';

        // Avatar selection
        document.querySelectorAll('.btn-avatar').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-avatar').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedAvatar = btn.dataset.avatar;
            });
        });

        // Register button
        const regBtn = document.getElementById('btn-register');
        if (regBtn) {
            regBtn.addEventListener('click', () => {
                const username = document.getElementById('reg-username').value.trim();
                const pin = document.getElementById('reg-pin').value;
                const pinConfirm = document.getElementById('reg-pin-confirm').value;
                const errorEl = document.getElementById('reg-error');

                if (pin !== pinConfirm) {
                    errorEl.textContent = 'PINs do not match.';
                    return;
                }

                const result = this.storage.registerUser(username, pin);
                if (result.success) {
                    // Update avatar
                    this.storage.updateUser(username, { avatar: selectedAvatar });
                    // Auto-login
                    this.storage.loginUser(username, pin);
                    if (this.onLoginSuccess) this.onLoginSuccess(this.storage.getCurrentUser());
                } else {
                    errorEl.textContent = result.error;
                }
            });
        }

        // Back to login
        const backBtn = document.getElementById('btn-show-login');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.mode = 'login';
                this.render();
            });
        }
    }

    /**
     * Attach profile screen handlers
     */
    attachProfileHandlers() {
        const playBtn = document.getElementById('btn-play-game');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (this.onLoginSuccess) this.onLoginSuccess(this.storage.getCurrentUser());
            });
        }

        const leaderBtn = document.getElementById('btn-view-leaderboard');
        if (leaderBtn) {
            leaderBtn.addEventListener('click', () => this.showLeaderboard());
        }

        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.storage.logoutUser();
                this.mode = 'login';
                this.render();
            });
        }
    }

    /**
     * Execute login
     */
    doLogin() {
        const username = document.getElementById('login-username').value.trim();
        const pin = document.getElementById('login-pin').value;
        const errorEl = document.getElementById('login-error');

        if (!username || !pin) {
            errorEl.textContent = 'Please enter username and PIN.';
            return;
        }

        const result = this.storage.loginUser(username, pin);
        if (result.success) {
            if (this.onLoginSuccess) this.onLoginSuccess(result.user);
        } else {
            errorEl.textContent = result.error;
        }
    }

    /**
     * Show leaderboard overlay
     */
    showLeaderboard() {
        const leaderboard = this.storage.getLeaderboard();
        const container = document.getElementById('login-content');

        let html = `
            <div class="auth-panel leaderboard-panel">
                <h2 class="lb-title">Leaderboard</h2>
                <div class="lb-list">
                    <div class="lb-header">
                        <span>#</span><span>Player</span><span>Wins</span><span>Win%</span><span>Best Worth</span>
                    </div>
        `;

        leaderboard.forEach((entry, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
            html += `
                <div class="lb-row ${idx < 3 ? 'lb-top' : ''}">
                    <span class="lb-rank">${medal}</span>
                    <span class="lb-name">${entry.avatar} ${entry.username}</span>
                    <span class="lb-wins">${entry.wins}/${entry.played}</span>
                    <span class="lb-rate">${entry.winRate}%</span>
                    <span class="lb-worth">$${entry.highestWorth.toLocaleString()}</span>
                </div>
            `;
        });

        if (leaderboard.length === 0) {
            html += '<div class="lb-empty">No players yet. Be the first!</div>';
        }

        html += `
                </div>
                <button class="btn-auth btn-play focusable" id="btn-back-profile">Back</button>
            </div>
        `;

        container.innerHTML = html;

        document.getElementById('btn-back-profile').addEventListener('click', () => {
            this.render();
        });
    }

    /**
     * Get icon for action type
     */
    getActionIcon(type) {
        const icons = {
            'dice_roll': '🎲',
            'buy_property': '🏠',
            'build_house': '🏗️',
            'build_hotel': '🏨',
            'pay_rent': '💸',
            'collect_rent': '💰',
            'draw_card': '🃏',
            'go_to_jail': '🔒',
            'win_game': '🏆',
            'lose_game': '💔',
            'auction_win': '🔨',
            'trade': '🤝',
            'mortgage': '📋',
            'game_start': '🎮',
            'game_end': '🏁'
        };
        return icons[type] || '📌';
    }

    /**
     * Get human-readable text for an action
     */
    getActionText(action) {
        const d = action.details || {};
        switch (action.type) {
            case 'buy_property': return `Bought ${d.propertyName || 'property'}`;
            case 'build_house': return `Built house on ${d.propertyName || 'property'}`;
            case 'build_hotel': return `Built hotel on ${d.propertyName || 'property'}`;
            case 'pay_rent': return `Paid $${d.amount || 0} rent`;
            case 'collect_rent': return `Collected $${d.amount || 0} rent`;
            case 'win_game': return 'Won the game!';
            case 'lose_game': return 'Went bankrupt';
            case 'game_start': return 'Started a new game';
            case 'game_end': return `Game ended (Turn ${d.turn || '?'})`;
            case 'dice_roll': return `Rolled ${d.d1 || '?'} + ${d.d2 || '?'}`;
            default: return action.type.replace(/_/g, ' ');
        }
    }

    /**
     * Format time ago string
     */
    timeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }
}
