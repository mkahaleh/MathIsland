/**
 * Property Tycoon - Main Application Controller
 * Ties together all modules: engine, renderer, UI, AI, input
 */

class App {
    constructor() {
        this.engine = null;
        this.renderer = null;
        this.ui = null;
        this.ai = null;
        this.input = null;
        this.gameLoop = null;
        this.setupPhase = true;

        // Player setup state
        this.setupConfig = {
            playerCount: 2,
            players: [
                { name: 'Player 1', tokenId: 0, isAI: false },
                { name: 'Computer 1', tokenId: 1, isAI: true, aiDifficulty: 'medium' },
                { name: 'Computer 2', tokenId: 2, isAI: true, aiDifficulty: 'medium' },
                { name: 'Computer 3', tokenId: 3, isAI: true, aiDifficulty: 'hard' }
            ]
        };

        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onReady());
        } else {
            this.onReady();
        }
    }

    /**
     * DOM ready handler
     */
    onReady() {
        // Initialize canvas
        const canvas = document.getElementById('game-canvas');
        if (!canvas) {
            console.error('Game canvas not found!');
            return;
        }

        // Set canvas to 1080p
        canvas.width = 1920;
        canvas.height = 1080;

        // Initialize modules
        this.renderer = new BoardRenderer(canvas);
        this.input = new InputHandler();

        // Set up input callbacks
        this.input.onAction = (action, data) => this.handleAction(action, data);
        this.input.onBack = () => this.handleBack();

        // Show setup screen
        this.showSetupScreen();

        // Start render loop
        this.startRenderLoop();
    }

    /**
     * Show the game setup/configuration screen
     */
    showSetupScreen() {
        this.setupPhase = true;
        const setupScreen = document.getElementById('setup-screen');
        const gameScreen = document.getElementById('game-screen');

        if (setupScreen) setupScreen.classList.add('visible');
        if (gameScreen) gameScreen.classList.remove('visible');

        this.renderSetupUI();
    }

    /**
     * Render setup screen UI
     */
    renderSetupUI() {
        const container = document.getElementById('setup-content');
        if (!container) return;

        const tokens = GAME_DATA.TOKENS;
        const config = this.setupConfig;

        let html = `
            <div class="setup-panel">
                <h1 class="setup-title">PROPERTY TYCOON</h1>
                <h2 class="setup-subtitle">New Game Setup</h2>

                <div class="player-count-section">
                    <label>Number of Players:</label>
                    <div class="count-selector">
                        ${[2, 3, 4].map(n => `
                            <button class="btn-count focusable ${config.playerCount === n ? 'selected' : ''}"
                                    data-count="${n}">${n} Players</button>
                        `).join('')}
                    </div>
                </div>

                <div class="player-setup-list">
        `;

        for (let i = 0; i < config.playerCount; i++) {
            const p = config.players[i];
            html += `
                <div class="setup-player-row">
                    <div class="setup-player-header">
                        <span class="setup-token" style="background: ${tokens[p.tokenId].color}">
                            ${tokens[p.tokenId].symbol}
                        </span>
                        <input type="text" class="player-name-input focusable"
                               data-player="${i}" value="${p.name}"
                               placeholder="Player ${i + 1} name" />
                    </div>
                    <div class="setup-player-options">
                        <div class="token-selector">
                            ${tokens.map((t, ti) => `
                                <button class="btn-token focusable ${p.tokenId === ti ? 'selected' : ''}"
                                        data-player="${i}" data-token="${ti}"
                                        style="background: ${t.color}" title="${t.name}">
                                    ${t.symbol}
                                </button>
                            `).join('')}
                        </div>
                        <div class="type-selector">
                            <button class="btn-type focusable ${!p.isAI ? 'selected' : ''}"
                                    data-player="${i}" data-type="human">
                                Human
                            </button>
                            <button class="btn-type focusable ${p.isAI ? 'selected' : ''}"
                                    data-player="${i}" data-type="ai">
                                Computer
                            </button>
                        </div>
                        ${p.isAI ? `
                            <div class="difficulty-selector">
                                <button class="btn-diff focusable ${p.aiDifficulty === 'easy' ? 'selected' : ''}"
                                        data-player="${i}" data-diff="easy">Easy</button>
                                <button class="btn-diff focusable ${p.aiDifficulty === 'medium' ? 'selected' : ''}"
                                        data-player="${i}" data-diff="medium">Medium</button>
                                <button class="btn-diff focusable ${p.aiDifficulty === 'hard' ? 'selected' : ''}"
                                        data-player="${i}" data-diff="hard">Hard</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        html += `
                </div>

                <div class="setup-actions">
                    <button class="btn-action btn-start focusable" id="btn-start-game">
                        Start Game
                    </button>
                </div>

                <div class="setup-tips">
                    <p>Use <kbd>↑↓</kbd> to navigate, <kbd>OK</kbd> to select</p>
                    <p>TV Color buttons: <span class="red-text">RED</span> Roll,
                       <span class="green-text">GREEN</span> Buy,
                       <span class="yellow-text">YELLOW</span> Manage,
                       <span class="blue-text">BLUE</span> End Turn</p>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.attachSetupHandlers();
        this.input.refreshFocusables();
    }

    /**
     * Attach event handlers for setup screen
     */
    attachSetupHandlers() {
        // Player count buttons
        document.querySelectorAll('.btn-count').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setupConfig.playerCount = parseInt(btn.dataset.count);
                this.renderSetupUI();
            });
        });

        // Name inputs
        document.querySelectorAll('.player-name-input').forEach(input => {
            input.addEventListener('change', () => {
                const idx = parseInt(input.dataset.player);
                this.setupConfig.players[idx].name = input.value;
            });
        });

        // Token buttons
        document.querySelectorAll('.btn-token').forEach(btn => {
            btn.addEventListener('click', () => {
                const playerIdx = parseInt(btn.dataset.player);
                const tokenId = parseInt(btn.dataset.token);
                this.setupConfig.players[playerIdx].tokenId = tokenId;
                this.renderSetupUI();
            });
        });

        // Type buttons (human/ai)
        document.querySelectorAll('.btn-type').forEach(btn => {
            btn.addEventListener('click', () => {
                const playerIdx = parseInt(btn.dataset.player);
                const isAI = btn.dataset.type === 'ai';
                this.setupConfig.players[playerIdx].isAI = isAI;
                this.renderSetupUI();
            });
        });

        // Difficulty buttons
        document.querySelectorAll('.btn-diff').forEach(btn => {
            btn.addEventListener('click', () => {
                const playerIdx = parseInt(btn.dataset.player);
                this.setupConfig.players[playerIdx].aiDifficulty = btn.dataset.diff;
                this.renderSetupUI();
            });
        });

        // Start game button
        const startBtn = document.getElementById('btn-start-game');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGame());
        }
    }

    /**
     * Start a new game with the configured players
     */
    startGame() {
        const config = this.setupConfig;
        const playerConfigs = config.players.slice(0, config.playerCount);

        // Validate unique tokens
        const tokens = new Set(playerConfigs.map(p => p.tokenId));
        if (tokens.size < playerConfigs.length) {
            alert('Each player must have a unique token!');
            return;
        }

        // Initialize game engine
        this.engine = new GameEngine();
        this.ui = new UIManager(this.engine);
        this.ai = new AIPlayer(this.engine);

        // Set up callbacks
        this.engine.onStateChange = (state) => this.onGameStateChange(state);
        this.engine.onMessage = (msg) => this.ui.addMessage(msg);
        this.ui.onActionClick = (actionId) => this.handleAction(actionId);

        // Start game
        this.engine.initGame(playerConfigs);

        // Switch to game screen
        this.setupPhase = false;
        const setupScreen = document.getElementById('setup-screen');
        const gameScreen = document.getElementById('game-screen');

        if (setupScreen) setupScreen.classList.remove('visible');
        if (gameScreen) gameScreen.classList.add('visible');

        // Initial render
        this.onGameStateChange(this.engine);

        // Trigger AI if first player is AI
        this.checkAITurn();
    }

    /**
     * Handle game state changes
     */
    onGameStateChange(state) {
        this.ui.update(state);
        this.input.refreshFocusables();
    }

    /**
     * Handle player actions (from UI buttons, keyboard, or remote)
     */
    handleAction(actionId, data) {
        if (this.setupPhase) return;
        if (!this.engine || this.engine.gamePhase !== 'playing') return;

        const player = this.engine.getCurrentPlayer();
        if (player.isAI) return; // Don't process manual actions for AI

        switch (actionId) {
            case 'roll':
                if (this.engine.turnPhase === 'roll') {
                    const result = this.engine.rollDice();
                    if (result) {
                        this.renderer.setDiceValues(result.d1, result.d2);
                        this.renderer.startDiceAnimation(() => {
                            // Check if action needed after roll
                            if (this.engine.turnPhase === 'action' && this.engine.pendingAction) {
                                if (this.engine.pendingAction.type === 'buy_property') {
                                    this.renderer.highlightedSpace = this.engine.pendingAction.spaceId;
                                }
                            }
                            this.onGameStateChange(this.engine);
                        });
                    }
                }
                break;

            case 'buy':
                if (this.engine.pendingAction?.type === 'buy_property') {
                    this.engine.buyProperty(this.engine.pendingAction.spaceId);
                    this.renderer.highlightedSpace = -1;
                }
                break;

            case 'auction':
                if (this.engine.pendingAction?.type === 'buy_property') {
                    this.engine.declineProperty(this.engine.pendingAction.spaceId);
                    this.renderer.highlightedSpace = -1;
                }
                break;

            case 'bid':
                if (this.engine.auction) {
                    const minBid = this.engine.auction.currentBid + 10;
                    if (data !== undefined) {
                        this.engine.placeBid(player.id, data);
                    } else {
                        this.engine.placeBid(player.id, minBid);
                    }
                }
                break;

            case 'pass_auction':
                if (this.engine.auction) {
                    this.engine.passAuction(player.id);
                }
                break;

            case 'pay_bail':
                this.engine.payBail();
                break;

            case 'use_card':
                this.engine.useJailFreeCard();
                break;

            case 'manage':
                this.ui.showPropertyManager(this.engine);
                this.setupManagerHandlers();
                break;

            case 'trade':
                this.ui.showTradeUI(this.engine);
                this.input.refreshFocusables();
                break;

            case 'end_turn':
                if (this.engine.turnPhase === 'end_turn') {
                    this.engine.nextTurn();
                    this.checkAITurn();
                }
                break;

            case 'declare_bankruptcy':
                this.engine.declareBankruptcy(player);
                break;

            case 'new_game':
                this.showSetupScreen();
                break;

            case 'info':
                // Show current space info
                this.ui.showPropertyDetail(player.position, this.engine);
                this.input.refreshFocusables();
                break;
        }
    }

    /**
     * Set up property manager button handlers
     */
    setupManagerHandlers() {
        setTimeout(() => {
            document.querySelectorAll('.prop-actions button').forEach(btn => {
                btn.addEventListener('click', () => {
                    const propId = parseInt(btn.dataset.prop);
                    const action = btn.dataset.action;

                    switch (action) {
                        case 'build':
                            this.engine.buyHouse(propId);
                            break;
                        case 'sell-house':
                            this.engine.sellHouse(propId);
                            break;
                        case 'mortgage':
                            this.engine.mortgageProperty(propId);
                            break;
                        case 'unmortgage':
                            this.engine.unmortgageProperty(propId);
                            break;
                    }

                    // Refresh manager
                    this.ui.showPropertyManager(this.engine);
                    this.setupManagerHandlers();
                });
            });

            document.querySelectorAll('.btn-close').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.ui.hideOverlay();
                    this.input.refreshFocusables();
                });
            });

            this.input.refreshFocusables();
        }, 50);
    }

    /**
     * Handle back button
     */
    handleBack() {
        if (this.ui && this.ui.currentOverlay) {
            this.ui.hideOverlay();
            this.input.refreshFocusables();
        } else {
            this.showPauseMenu();
        }
    }

    /**
     * Show pause menu
     */
    showPauseMenu() {
        const html = `
            <div class="pause-menu">
                <h2>Game Paused</h2>
                <button class="btn-action focusable" data-action="resume">Resume Game</button>
                <button class="btn-action focusable" data-action="new_game">New Game</button>
            </div>
        `;

        this.ui.showOverlay(html, 'pause-overlay');

        setTimeout(() => {
            document.querySelectorAll('.pause-menu .btn-action').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    if (action === 'resume') {
                        this.ui.hideOverlay();
                    } else if (action === 'new_game') {
                        this.ui.hideOverlay();
                        this.showSetupScreen();
                    }
                    this.input.refreshFocusables();
                });
            });
            this.input.refreshFocusables();
        }, 50);
    }

    /**
     * Check if it's AI's turn and execute
     */
    async checkAITurn() {
        if (!this.engine || this.engine.gamePhase !== 'playing') return;

        const player = this.engine.getCurrentPlayer();
        if (!player.isAI || player.bankrupt) return;

        // Delay to let UI update
        await new Promise(r => setTimeout(r, 500));

        // Execute AI turn
        await this.ai.executeTurn();

        // If doubles, AI might get another turn
        // Check again after AI turn completes
        await new Promise(r => setTimeout(r, 300));

        if (this.engine.gamePhase === 'playing') {
            const nextPlayer = this.engine.getCurrentPlayer();
            if (nextPlayer.isAI && !nextPlayer.bankrupt) {
                await this.checkAITurn();
            }
        }

        // Check for game over
        if (this.engine.gamePhase === 'gameover' && this.engine.winner) {
            this.ui.showGameOver(this.engine.winner);
            this.input.refreshFocusables();
        }
    }

    /**
     * Main render loop
     */
    startRenderLoop() {
        const loop = () => {
            if (this.renderer && this.engine && !this.setupPhase) {
                this.renderer.render(this.engine);
            } else if (this.renderer && this.setupPhase) {
                // Draw board preview in setup
                this.renderer.render(null);
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}

// Boot the application
const app = new App();
