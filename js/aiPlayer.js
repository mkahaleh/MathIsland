/**
 * Property Tycoon - AI Player Logic
 * Provides intelligent computer opponents with different difficulty levels
 */

class AIPlayer {
    constructor(gameEngine) {
        this.engine = gameEngine;
        this.thinkDelay = 800; // ms delay to simulate thinking
    }

    /**
     * Execute AI turn
     */
    async executeTurn() {
        const player = this.engine.getCurrentPlayer();
        if (!player.isAI || player.bankrupt) return;

        await this.delay(this.thinkDelay);

        // Handle jail first
        if (player.inJail) {
            await this.handleJail(player);
            return;
        }

        // Roll dice
        if (this.engine.turnPhase === 'roll') {
            this.engine.rollDice();
            await this.delay(this.thinkDelay);
        }

        // Handle pending actions
        if (this.engine.turnPhase === 'action' && this.engine.pendingAction) {
            await this.handleAction(player);
        }

        // Property management before ending turn
        if (this.engine.turnPhase === 'end_turn') {
            await this.manageProperties(player);
            await this.delay(400);
            this.engine.nextTurn();
        }
    }

    /**
     * Handle jail decisions
     */
    async handleJail(player) {
        // Use card if available
        if (player.getOutOfJailCards > 0) {
            this.engine.useJailFreeCard();
            await this.delay(this.thinkDelay);
            this.engine.rollDice();
        }
        // Pay bail if wealthy and early game
        else if (player.money > 500 && this.engine.turnNumber < 30) {
            this.engine.payBail();
            await this.delay(this.thinkDelay);
            this.engine.rollDice();
        }
        // Otherwise try to roll doubles
        else {
            this.engine.rollDice();
        }

        await this.delay(this.thinkDelay);

        if (this.engine.turnPhase === 'action' && this.engine.pendingAction) {
            await this.handleAction(player);
        }

        if (this.engine.turnPhase === 'end_turn') {
            this.engine.nextTurn();
        }
    }

    /**
     * Handle pending actions (buy/auction/raise funds)
     */
    async handleAction(player) {
        const action = this.engine.pendingAction;

        if (action.type === 'buy_property') {
            const shouldBuy = this.evaluatePurchase(player, action.spaceId);
            if (shouldBuy) {
                this.engine.buyProperty(action.spaceId);
            } else {
                this.engine.declineProperty(action.spaceId);
            }
            await this.delay(this.thinkDelay);
        }

        if (action && action.type === 'auction') {
            await this.handleAuction(player);
        }

        if (action && action.type === 'must_raise_funds') {
            await this.raiseFunds(player, action.amount);
        }

        // Check for additional actions after moving
        if (this.engine.turnPhase === 'action' && this.engine.pendingAction) {
            await this.delay(this.thinkDelay);
            await this.handleAction(player);
        }
    }

    /**
     * Evaluate whether to buy a property
     */
    evaluatePurchase(player, spaceId) {
        const space = GAME_DATA.BOARD[spaceId];
        const difficulty = player.aiDifficulty;

        // Can't afford it
        if (player.money < space.price) return false;

        // Always buy railroads and utilities if possible
        if (space.type === 'railroad' || space.type === 'utility') {
            return player.money > space.price + 100;
        }

        // Check if this completes or advances a monopoly
        const colorGroup = GAME_DATA.BOARD.filter(s => s.type === 'property' && s.color === space.color);
        const ownedInGroup = colorGroup.filter(s => this.engine.properties[s.id].owner === player.id).length;

        // Would complete monopoly - always buy
        if (ownedInGroup === colorGroup.length - 1) {
            return true;
        }

        // Would block opponent monopoly
        const opponentNearMonopoly = colorGroup.some(s => {
            const owner = this.engine.properties[s.id].owner;
            return owner !== null && owner !== player.id;
        });

        switch (difficulty) {
            case 'easy':
                // Easy: buy if affordable, leave money for rent
                return player.money > space.price + 150;

            case 'medium':
                // Medium: buy strategically
                if (opponentNearMonopoly) return true; // Block opponent
                if (ownedInGroup > 0) return true; // Build toward monopoly
                return player.money > space.price + 200;

            case 'hard':
                // Hard: advanced evaluation
                if (opponentNearMonopoly) return true;
                if (ownedInGroup > 0) return player.money > space.price + 50;
                // Prefer high-value properties
                const roi = space.rent[0] / space.price;
                return roi > 0.03 || player.money > space.price + 300;

            default:
                return player.money > space.price + 100;
        }
    }

    /**
     * Handle auction bidding
     */
    async handleAuction(player) {
        if (!this.engine.auction) return;

        const space = GAME_DATA.BOARD[this.engine.auction.spaceId];
        const maxBid = this.getMaxAuctionBid(player, space);

        while (this.engine.auction &&
               this.engine.auction.activeBidders.includes(player.id) &&
               !this.engine.auction.passedPlayers.has(player.id)) {

            const currentBid = this.engine.auction.currentBid;

            if (currentBid < maxBid) {
                const bidAmount = Math.min(
                    currentBid + Math.ceil(Math.random() * 30) + 10,
                    maxBid
                );
                this.engine.placeBid(player.id, bidAmount);
            } else {
                this.engine.passAuction(player.id);
            }

            await this.delay(500);
        }
    }

    /**
     * Get maximum auction bid for a property
     */
    getMaxAuctionBid(player, space) {
        const baseMax = Math.floor(space.price * 0.8);
        const difficulty = player.aiDifficulty;

        // Check if completes monopoly
        const colorGroup = GAME_DATA.BOARD.filter(s => s.type === 'property' && s.color === space.color);
        const ownedInGroup = colorGroup.filter(s =>
            this.engine.properties[s.id].owner === player.id
        ).length;

        let multiplier = 1;
        if (ownedInGroup === colorGroup.length - 1) multiplier = 1.5;
        if (difficulty === 'hard') multiplier *= 1.2;
        if (difficulty === 'easy') multiplier *= 0.7;

        return Math.min(Math.floor(baseMax * multiplier), player.money - 50);
    }

    /**
     * Raise funds when in debt
     */
    async raiseFunds(player, amount) {
        let raised = 0;
        const needed = amount;

        // First: mortgage properties without houses (prefer least valuable)
        const mortgageable = player.properties
            .filter(propId => {
                const prop = this.engine.properties[propId];
                return !prop.mortgaged && prop.houses === 0;
            })
            .sort((a, b) => GAME_DATA.BOARD[a].price - GAME_DATA.BOARD[b].price);

        for (const propId of mortgageable) {
            if (player.money >= 0) break;
            this.engine.mortgageProperty(propId);
            await this.delay(300);
        }

        // Second: sell houses (from most expensive properties first)
        if (player.money < 0) {
            const withHouses = player.properties
                .filter(propId => this.engine.properties[propId].houses > 0)
                .sort((a, b) => GAME_DATA.BOARD[b].price - GAME_DATA.BOARD[a].price);

            for (const propId of withHouses) {
                while (this.engine.properties[propId].houses > 0 && player.money < 0) {
                    this.engine.sellHouse(propId);
                    await this.delay(300);
                }
            }
        }

        // If still bankrupt, declare bankruptcy
        if (player.money < 0) {
            this.engine.declareBankruptcy(player);
        } else {
            this.engine.pendingAction = null;
            this.engine.turnPhase = 'end_turn';
        }
    }

    /**
     * Manage properties (build houses) at end of turn
     */
    async manageProperties(player) {
        const difficulty = player.aiDifficulty;
        if (difficulty === 'easy') return; // Easy AI doesn't build strategically

        const buildable = this.engine.getBuildableProperties(player.id);
        if (buildable.length === 0) return;

        // Sort by ROI (rent increase per cost)
        const sorted = buildable.sort((a, b) => {
            const spaceA = GAME_DATA.BOARD[a];
            const spaceB = GAME_DATA.BOARD[b];
            const propA = this.engine.properties[a];
            const propB = this.engine.properties[b];
            const roiA = (spaceA.rent[propA.houses + 1] - spaceA.rent[propA.houses]) / spaceA.houseCost;
            const roiB = (spaceB.rent[propB.houses + 1] - spaceB.rent[propB.houses]) / spaceB.houseCost;
            return roiB - roiA;
        });

        // Build if profitable and can afford it
        const reserveMoney = difficulty === 'hard' ? 200 : 300;
        for (const propId of sorted) {
            const space = GAME_DATA.BOARD[propId];
            if (player.money > space.houseCost + reserveMoney) {
                this.engine.buyHouse(propId);
                await this.delay(400);
            }
        }
    }

    /**
     * Utility: delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
