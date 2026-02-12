/**
 * Property Tycoon - UI Manager
 * Manages all UI panels, overlays, menus, and HUD elements
 */

class UIManager {
    constructor(gameEngine) {
        this.engine = gameEngine;
        this.currentOverlay = null;
        this.propertyDetailId = null;
        this.selectedMenuIndex = 0;

        // Cache DOM elements
        this.elements = {};
        this.initElements();
    }

    /**
     * Cache DOM element references
     */
    initElements() {
        this.elements = {
            playerPanel: document.getElementById('player-panel'),
            actionPanel: document.getElementById('action-panel'),
            messageLog: document.getElementById('message-log'),
            turnInfo: document.getElementById('turn-info'),
            overlay: document.getElementById('overlay'),
            overlayContent: document.getElementById('overlay-content'),
            propertyDetail: document.getElementById('property-detail'),
            cardDisplay: document.getElementById('card-display'),
            phaseIndicator: document.getElementById('phase-indicator'),
            remoteTips: document.getElementById('remote-tips')
        };
    }

    /**
     * Update all UI elements based on game state
     */
    update(gameState) {
        if (!gameState) return;

        this.updatePlayerPanel(gameState);
        this.updateActionPanel(gameState);
        this.updateTurnInfo(gameState);
        this.updatePhaseIndicator(gameState);
        this.updateRemoteTips(gameState);

        // Update card display
        if (gameState.activeCard) {
            this.showCard(gameState.activeCard);
        }
    }

    /**
     * Update the player information panel
     */
    updatePlayerPanel(gameState) {
        const panel = this.elements.playerPanel;
        if (!panel) return;

        let html = '';
        gameState.players.forEach((player, index) => {
            const isActive = index === gameState.currentPlayerIndex;
            const statusClass = player.bankrupt ? 'bankrupt' : (isActive ? 'active' : '');

            html += `
                <div class="player-card ${statusClass}" data-player="${index}">
                    <div class="player-header">
                        <span class="player-token" style="background: ${player.token.color}">
                            ${player.token.symbol}
                        </span>
                        <div class="player-name-section">
                            <span class="player-name">${player.name}</span>
                            ${player.isAI ? '<span class="ai-badge">AI</span>' : ''}
                            ${player.inJail ? '<span class="jail-badge">IN JAIL</span>' : ''}
                        </div>
                    </div>
                    <div class="player-stats">
                        <div class="stat money">
                            <span class="stat-label">Cash</span>
                            <span class="stat-value ${player.money < 100 ? 'low-money' : ''}">
                                $${player.money.toLocaleString()}
                            </span>
                        </div>
                        <div class="stat worth">
                            <span class="stat-label">Worth</span>
                            <span class="stat-value">$${player.totalWorth.toLocaleString()}</span>
                        </div>
                        <div class="stat properties-count">
                            <span class="stat-label">Properties</span>
                            <span class="stat-value">${player.properties.length}</span>
                        </div>
                    </div>
                    ${this.renderPlayerProperties(player, gameState)}
                    ${player.bankrupt ? '<div class="bankrupt-overlay">BANKRUPT</div>' : ''}
                </div>
            `;
        });

        panel.innerHTML = html;
    }

    /**
     * Render property indicators for a player
     */
    renderPlayerProperties(player, gameState) {
        if (player.properties.length === 0) return '';

        // Group by color
        const groups = {};
        player.properties.forEach(propId => {
            const space = GAME_DATA.BOARD[propId];
            const key = space.color || space.type;
            if (!groups[key]) groups[key] = [];
            groups[key].push({ space, prop: gameState.properties[propId] });
        });

        let html = '<div class="player-properties">';
        for (const [key, props] of Object.entries(groups)) {
            const color = GAME_DATA.COLORS[key]?.hex || '#888';
            html += '<div class="prop-group">';
            props.forEach(({ space, prop }) => {
                const mortgagedClass = prop.mortgaged ? 'mortgaged' : '';
                html += `
                    <div class="prop-indicator ${mortgagedClass}" style="background: ${color}"
                         title="${space.name}${prop.houses > 0 ? ` (${prop.houses === 5 ? 'Hotel' : prop.houses + 'H'})` : ''}">
                        ${prop.houses > 0 ? (prop.houses === 5 ? '★' : prop.houses) : ''}
                    </div>
                `;
            });
            html += '</div>';
        }
        html += '</div>';
        return html;
    }

    /**
     * Update the action buttons panel
     */
    updateActionPanel(gameState) {
        const panel = this.elements.actionPanel;
        if (!panel) return;

        const actions = gameState.getAvailableActions();
        const player = gameState.getCurrentPlayer();

        let html = '';
        if (player.isAI && !player.bankrupt) {
            html = '<div class="ai-thinking">AI is thinking...</div>';
        } else {
            actions.forEach((action, index) => {
                const shortcut = this.getActionShortcut(action.id);
                html += `
                    <button class="btn-action focusable" data-action="${action.id}" data-index="${index}">
                        <span class="btn-label">${action.label}</span>
                        ${shortcut ? `<span class="btn-shortcut">${shortcut}</span>` : ''}
                    </button>
                `;
            });
        }

        panel.innerHTML = html;

        // Attach click handlers
        panel.querySelectorAll('.btn-action').forEach(btn => {
            btn.addEventListener('click', () => {
                const actionId = btn.dataset.action;
                if (this.onActionClick) this.onActionClick(actionId);
            });
        });
    }

    /**
     * Get keyboard shortcut label for an action
     */
    getActionShortcut(actionId) {
        const shortcuts = {
            'roll': 'RED / Space',
            'buy': 'GREEN',
            'manage': 'YELLOW',
            'end_turn': 'BLUE',
            'auction': 'GREEN',
            'trade': 'YELLOW',
            'pay_bail': 'GREEN',
            'use_card': 'YELLOW'
        };
        return shortcuts[actionId] || '';
    }

    /**
     * Update turn information display
     */
    updateTurnInfo(gameState) {
        const info = this.elements.turnInfo;
        if (!info) return;

        const player = gameState.getCurrentPlayer();
        const dice = gameState.lastDice;

        info.innerHTML = `
            <div class="turn-header">
                <span class="turn-number">Turn ${gameState.turnNumber}</span>
                <span class="current-player" style="color: ${player.token.color}">
                    ${player.token.symbol} ${player.name}'s Turn
                </span>
            </div>
            ${dice[0] > 0 ? `
                <div class="dice-display">
                    <span class="die">${this.getDieFace(dice[0])}</span>
                    <span class="die">${this.getDieFace(dice[1])}</span>
                    <span class="dice-total">= ${dice[0] + dice[1]}</span>
                    ${dice[0] === dice[1] ? '<span class="doubles-badge">DOUBLES!</span>' : ''}
                </div>
            ` : ''}
            ${gameState.freeParkingPool > 0 ? `
                <div class="free-parking-pool">
                    Free Parking Pool: $${gameState.freeParkingPool}
                </div>
            ` : ''}
        `;
    }

    /**
     * Update phase indicator
     */
    updatePhaseIndicator(gameState) {
        const indicator = this.elements.phaseIndicator;
        if (!indicator) return;

        const phases = {
            'roll': 'Roll Dice',
            'moved': 'Moved',
            'action': 'Action Required',
            'end_turn': 'End Turn'
        };

        indicator.textContent = phases[gameState.turnPhase] || '';
        indicator.className = `phase-indicator phase-${gameState.turnPhase}`;
    }

    /**
     * Update remote control tips
     */
    updateRemoteTips(gameState) {
        const tips = this.elements.remoteTips;
        if (!tips) return;

        const player = gameState.getCurrentPlayer();
        if (player.isAI) {
            tips.innerHTML = '<span class="tip">Watching AI play...</span>';
            return;
        }

        let html = '<div class="tips-row">';
        html += '<span class="tip"><kbd>↑↓</kbd> Navigate</span>';
        html += '<span class="tip"><kbd>OK</kbd> Select</span>';

        if (gameState.turnPhase === 'roll') {
            html += '<span class="tip red-tip"><kbd>RED</kbd> Roll</span>';
        }
        if (gameState.pendingAction?.type === 'buy_property') {
            html += '<span class="tip green-tip"><kbd>GREEN</kbd> Buy</span>';
        }
        html += '<span class="tip blue-tip"><kbd>BLUE</kbd> End Turn</span>';
        html += '<span class="tip"><kbd>BACK</kbd> Menu</span>';
        html += '</div>';

        tips.innerHTML = html;
    }

    /**
     * Add a message to the log
     */
    addMessage(text) {
        const log = this.elements.messageLog;
        if (!log) return;

        const msgEl = document.createElement('div');
        msgEl.className = 'message-entry';
        msgEl.textContent = text;
        log.appendChild(msgEl);

        // Auto-scroll to bottom
        log.scrollTop = log.scrollHeight;

        // Limit visible messages
        while (log.children.length > 30) {
            log.removeChild(log.firstChild);
        }

        // Fade in animation
        requestAnimationFrame(() => {
            msgEl.classList.add('visible');
        });
    }

    /**
     * Show a Chance/Community Chest card
     */
    showCard(card) {
        const display = this.elements.cardDisplay;
        if (!display) return;

        const isChance = card.deck === 'chance';
        const color = isChance ? '#FF8C00' : '#1565C0';
        const title = isChance ? 'CHANCE' : 'COMMUNITY CHEST';
        const icon = isChance ? '❓' : '📦';

        display.innerHTML = `
            <div class="card-popup" style="border-color: ${color}">
                <div class="card-header" style="background: ${color}">
                    <span class="card-icon">${icon}</span>
                    <span class="card-title">${title}</span>
                </div>
                <div class="card-body">
                    <p class="card-text">${card.text}</p>
                </div>
            </div>
        `;
        display.classList.add('visible');

        // Auto-hide after delay
        setTimeout(() => {
            display.classList.remove('visible');
        }, 3000);
    }

    /**
     * Show property detail overlay
     */
    showPropertyDetail(spaceId, gameState) {
        const space = GAME_DATA.BOARD[spaceId];
        if (!space) return;

        const prop = gameState.properties[spaceId];
        const color = GAME_DATA.COLORS[space.color];
        const owner = prop?.owner !== null ? gameState.players[prop.owner] : null;

        let html = `
            <div class="property-card-detail">
                ${color ? `<div class="card-color-bar" style="background: ${color.hex}">
                    <span>${color.name}</span>
                </div>` : ''}
                <h2 class="prop-title">${space.name}</h2>
                <div class="prop-price">Price: $${space.price}</div>
        `;

        if (space.type === 'property') {
            html += `
                <div class="rent-table">
                    <div class="rent-row ${!prop?.houses ? 'current' : ''}">
                        <span>Rent</span><span>$${space.rent[0]}</span>
                    </div>
                    <div class="rent-row ${prop?.houses === 1 ? 'current' : ''}">
                        <span>With 1 House</span><span>$${space.rent[1]}</span>
                    </div>
                    <div class="rent-row ${prop?.houses === 2 ? 'current' : ''}">
                        <span>With 2 Houses</span><span>$${space.rent[2]}</span>
                    </div>
                    <div class="rent-row ${prop?.houses === 3 ? 'current' : ''}">
                        <span>With 3 Houses</span><span>$${space.rent[3]}</span>
                    </div>
                    <div class="rent-row ${prop?.houses === 4 ? 'current' : ''}">
                        <span>With 4 Houses</span><span>$${space.rent[4]}</span>
                    </div>
                    <div class="rent-row ${prop?.houses === 5 ? 'current' : ''}">
                        <span>With Hotel</span><span>$${space.rent[5]}</span>
                    </div>
                </div>
                <div class="prop-costs">
                    <div>House Cost: $${space.houseCost}</div>
                    <div>Hotel Cost: $${space.houseCost} + 4 Houses</div>
                    <div>Mortgage: $${Math.floor(space.price / 2)}</div>
                </div>
            `;
        }

        if (owner) {
            html += `
                <div class="prop-owner">
                    <span style="color: ${owner.token.color}">
                        ${owner.token.symbol} Owned by ${owner.name}
                    </span>
                </div>
            `;
        }

        if (prop?.mortgaged) {
            html += '<div class="prop-mortgaged">MORTGAGED</div>';
        }

        html += '</div>';

        this.showOverlay(html, 'property-overlay');
    }

    /**
     * Show property management overlay
     */
    showPropertyManager(gameState) {
        const player = gameState.getCurrentPlayer();
        if (player.properties.length === 0) return;

        let html = `
            <div class="property-manager">
                <h2>Property Management</h2>
                <p class="manager-cash">Cash: $${player.money.toLocaleString()}</p>
                <div class="prop-list">
        `;

        player.properties.forEach(propId => {
            const space = GAME_DATA.BOARD[propId];
            const prop = gameState.properties[propId];
            const color = GAME_DATA.COLORS[space.color];
            const canBuild = gameState.getBuildableProperties(player.id).includes(propId);
            const canMortgage = !prop.mortgaged && prop.houses === 0;
            const canUnmortgage = prop.mortgaged && player.money >= Math.floor(space.price / 2 * 1.1);
            const canSellHouse = prop.houses > 0;

            html += `
                <div class="prop-manager-row" data-prop="${propId}">
                    <div class="prop-info">
                        ${color ? `<span class="color-dot" style="background: ${color.hex}"></span>` : ''}
                        <span class="prop-name">${space.name}</span>
                        ${prop.houses > 0 ? `<span class="house-count">${prop.houses === 5 ? 'Hotel' : prop.houses + ' House(s)'}</span>` : ''}
                        ${prop.mortgaged ? '<span class="mortgaged-label">Mortgaged</span>' : ''}
                    </div>
                    <div class="prop-actions">
                        ${canBuild ? `<button class="btn-small focusable" data-action="build" data-prop="${propId}">Build ($${space.houseCost})</button>` : ''}
                        ${canSellHouse ? `<button class="btn-small focusable" data-action="sell-house" data-prop="${propId}">Sell House</button>` : ''}
                        ${canMortgage ? `<button class="btn-small focusable" data-action="mortgage" data-prop="${propId}">Mortgage ($${Math.floor(space.price / 2)})</button>` : ''}
                        ${canUnmortgage ? `<button class="btn-small focusable" data-action="unmortgage" data-prop="${propId}">Unmortgage ($${Math.floor(space.price / 2 * 1.1)})</button>` : ''}
                    </div>
                </div>
            `;
        });

        html += `
                </div>
                <button class="btn-action focusable btn-close" data-action="close">Close</button>
            </div>
        `;

        this.showOverlay(html, 'manager-overlay');
    }

    /**
     * Show trade overlay
     */
    showTradeUI(gameState) {
        const player = gameState.getCurrentPlayer();
        const otherPlayers = gameState.players.filter(p => !p.bankrupt && p.id !== player.id);

        let html = `
            <div class="trade-panel">
                <h2>Trade</h2>
                <p>Select a player to trade with:</p>
                <div class="trade-players">
        `;

        otherPlayers.forEach(p => {
            html += `
                <button class="btn-action focusable trade-target" data-player="${p.id}">
                    <span style="color: ${p.token.color}">${p.token.symbol}</span>
                    ${p.name} ($${p.money})
                </button>
            `;
        });

        html += `
                </div>
                <button class="btn-action focusable btn-close" data-action="close">Cancel</button>
            </div>
        `;

        this.showOverlay(html, 'trade-overlay');
    }

    /**
     * Show auction UI
     */
    showAuctionUI(gameState) {
        if (!gameState.auction) return;

        const space = GAME_DATA.BOARD[gameState.auction.spaceId];
        const currentBidder = gameState.auction.activeBidders[gameState.auction.currentBidderIndex];
        const bidderPlayer = gameState.players[currentBidder];

        let html = `
            <div class="auction-panel">
                <h2>Auction: ${space.name}</h2>
                <div class="auction-info">
                    <div>Current Bid: $${gameState.auction.currentBid}</div>
                    ${gameState.auction.highestBidder !== null ?
                        `<div>Highest Bidder: ${gameState.players[gameState.auction.highestBidder].name}</div>` : ''}
                    <div>Bidding: <span style="color: ${bidderPlayer.token.color}">${bidderPlayer.name}</span></div>
                </div>
        `;

        if (!bidderPlayer.isAI) {
            const minBid = gameState.auction.currentBid + 10;
            html += `
                <div class="bid-options">
                    <button class="btn-action focusable" data-action="bid" data-amount="${minBid}">
                        Bid $${minBid}
                    </button>
                    <button class="btn-action focusable" data-action="bid" data-amount="${minBid + 40}">
                        Bid $${minBid + 40}
                    </button>
                    <button class="btn-action focusable" data-action="bid" data-amount="${minBid + 90}">
                        Bid $${minBid + 90}
                    </button>
                    <button class="btn-action focusable" data-action="pass_auction">
                        Pass
                    </button>
                </div>
            `;
        } else {
            html += '<div class="ai-thinking">AI is deciding...</div>';
        }

        html += '</div>';

        this.showOverlay(html, 'auction-overlay');
    }

    /**
     * Show game over screen
     */
    showGameOver(winner) {
        const html = `
            <div class="game-over">
                <h1>Game Over!</h1>
                <div class="winner-display">
                    <div class="winner-token" style="background: ${winner.token.color}">
                        ${winner.token.symbol}
                    </div>
                    <h2>${winner.name} Wins!</h2>
                    <div class="winner-stats">
                        <div>Final Worth: $${winner.totalWorth.toLocaleString()}</div>
                        <div>Properties: ${winner.properties.length}</div>
                    </div>
                </div>
                <button class="btn-action focusable btn-large" data-action="new_game">
                    New Game
                </button>
            </div>
        `;

        this.showOverlay(html, 'gameover-overlay');
    }

    /**
     * Show a generic overlay
     */
    showOverlay(html, className = '') {
        const overlay = this.elements.overlay;
        const content = this.elements.overlayContent;
        if (!overlay || !content) return;

        content.innerHTML = html;
        overlay.className = `overlay visible ${className}`;
        this.currentOverlay = className;
    }

    /**
     * Hide the overlay
     */
    hideOverlay() {
        const overlay = this.elements.overlay;
        if (overlay) {
            overlay.classList.remove('visible');
            this.currentOverlay = null;
        }
    }

    /**
     * Get dice face character
     */
    getDieFace(value) {
        const faces = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        return faces[value] || '?';
    }
}
