/**
 * Property Tycoon - Game Engine
 * Core game logic: turns, dice, movement, property management, cards, jail, bankruptcy
 */

class GameEngine {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.properties = {}; // spaceId -> { owner, houses, mortgaged }
        this.chanceDeck = [];
        this.communityDeck = [];
        this.gamePhase = 'setup'; // setup, playing, gameover
        this.turnPhase = 'roll'; // roll, moved, action, end_turn
        this.lastDice = [0, 0];
        this.doublesCount = 0;
        this.freeParkingPool = 0;
        this.messageLog = [];
        this.turnNumber = 0;
        this.winner = null;

        // Card state
        this.activeCard = null;
        this.pendingAction = null;

        // Auction state
        this.auction = null;

        // Trade state
        this.trade = null;

        // Callbacks
        this.onStateChange = null;
        this.onMessage = null;
        this.onAnimationRequest = null;
    }

    /**
     * Initialize a new game
     */
    initGame(playerConfigs) {
        this.players = playerConfigs.map((config, index) => ({
            id: index,
            name: config.name,
            token: GAME_DATA.TOKENS[config.tokenId],
            money: GAME_DATA.STARTING_MONEY,
            position: 0,
            properties: [],
            inJail: false,
            jailTurns: 0,
            getOutOfJailCards: 0,
            bankrupt: false,
            isAI: config.isAI || false,
            aiDifficulty: config.aiDifficulty || 'medium',
            totalWorth: GAME_DATA.STARTING_MONEY,
            doublesRolled: 0
        }));

        // Initialize property states
        this.properties = {};
        GAME_DATA.BOARD.forEach(space => {
            if (space.type === 'property' || space.type === 'railroad' || space.type === 'utility') {
                this.properties[space.id] = {
                    owner: null,
                    houses: 0,
                    mortgaged: false
                };
            }
        });

        // Shuffle card decks
        this.chanceDeck = this.shuffleArray([...GAME_DATA.CHANCE_CARDS]);
        this.communityDeck = this.shuffleArray([...GAME_DATA.COMMUNITY_CARDS]);

        this.gamePhase = 'playing';
        this.turnPhase = 'roll';
        this.currentPlayerIndex = 0;
        this.turnNumber = 1;
        this.freeParkingPool = 0;

        this.addMessage(`Game started! ${this.players.length} players ready.`);
        this.addMessage(`${this.getCurrentPlayer().name}'s turn. Roll the dice!`);
        this.notifyStateChange();
    }

    /**
     * Get current player
     */
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    /**
     * Get property owner index (or null)
     */
    getPropertyOwner(spaceId) {
        const prop = this.properties[spaceId];
        return prop ? prop.owner : null;
    }

    /**
     * Roll dice and process movement
     */
    rollDice() {
        if (this.turnPhase !== 'roll' || this.gamePhase !== 'playing') return null;

        const player = this.getCurrentPlayer();
        if (player.bankrupt) {
            this.nextTurn();
            return null;
        }

        const d1 = Math.ceil(Math.random() * 6);
        const d2 = Math.ceil(Math.random() * 6);
        this.lastDice = [d1, d2];
        const total = d1 + d2;
        const isDoubles = d1 === d2;

        this.addMessage(`${player.name} rolled ${d1} + ${d2} = ${total}${isDoubles ? ' (Doubles!)' : ''}`);

        // Handle jail
        if (player.inJail) {
            return this.handleJailRoll(d1, d2, isDoubles);
        }

        // Check for 3 consecutive doubles -> jail
        if (isDoubles) {
            this.doublesCount++;
            if (this.doublesCount >= 3) {
                this.addMessage(`${player.name} rolled doubles 3 times! Go to Jail!`);
                this.sendToJail(player);
                this.doublesCount = 0;
                this.turnPhase = 'end_turn';
                this.notifyStateChange();
                return { d1, d2, total, doubles: true, jailed: true };
            }
        } else {
            this.doublesCount = 0;
        }

        // Move player
        this.movePlayer(player, total);

        // If doubles, player gets another roll (set after processing)
        if (isDoubles) {
            this.turnPhase = 'roll'; // Will roll again after action
        }

        this.notifyStateChange();
        return { d1, d2, total, doubles: isDoubles };
    }

    /**
     * Handle dice roll while in jail
     */
    handleJailRoll(d1, d2, isDoubles) {
        const player = this.getCurrentPlayer();
        const total = d1 + d2;

        if (isDoubles) {
            player.inJail = false;
            player.jailTurns = 0;
            this.addMessage(`${player.name} rolled doubles and is free from Jail!`);
            this.movePlayer(player, total);
        } else {
            player.jailTurns++;
            if (player.jailTurns >= GAME_DATA.MAX_JAIL_TURNS) {
                // Must pay bail and move
                this.addMessage(`${player.name} spent 3 turns in Jail. Must pay $${GAME_DATA.BAIL_COST} bail.`);
                player.money -= GAME_DATA.BAIL_COST;
                this.freeParkingPool += GAME_DATA.BAIL_COST;
                player.inJail = false;
                player.jailTurns = 0;
                this.movePlayer(player, total);
                this.checkBankruptcy(player);
            } else {
                this.addMessage(`${player.name} did not roll doubles. Still in Jail. (Turn ${player.jailTurns}/${GAME_DATA.MAX_JAIL_TURNS})`);
                this.turnPhase = 'end_turn';
            }
        }

        this.notifyStateChange();
        return { d1, d2, total, doubles: isDoubles, inJail: player.inJail };
    }

    /**
     * Pay bail to leave jail
     */
    payBail() {
        const player = this.getCurrentPlayer();
        if (!player.inJail) return false;

        if (player.money < GAME_DATA.BAIL_COST) {
            this.addMessage(`${player.name} cannot afford bail ($${GAME_DATA.BAIL_COST}).`);
            return false;
        }

        player.money -= GAME_DATA.BAIL_COST;
        this.freeParkingPool += GAME_DATA.BAIL_COST;
        player.inJail = false;
        player.jailTurns = 0;
        this.addMessage(`${player.name} paid $${GAME_DATA.BAIL_COST} bail and is free!`);
        this.notifyStateChange();
        return true;
    }

    /**
     * Use Get Out of Jail Free card
     */
    useJailFreeCard() {
        const player = this.getCurrentPlayer();
        if (!player.inJail || player.getOutOfJailCards <= 0) return false;

        player.getOutOfJailCards--;
        player.inJail = false;
        player.jailTurns = 0;
        this.addMessage(`${player.name} used a Get Out of Jail Free card!`);
        this.notifyStateChange();
        return true;
    }

    /**
     * Move player by a number of spaces
     */
    movePlayer(player, spaces) {
        const oldPos = player.position;
        const newPos = (oldPos + spaces) % 40;

        // Check if passed GO
        if (newPos < oldPos && spaces > 0) {
            player.money += GAME_DATA.GO_SALARY;
            this.addMessage(`${player.name} passed GO and collected $${GAME_DATA.GO_SALARY}!`);
        }

        player.position = newPos;
        this.turnPhase = 'moved';

        // Process the space landed on
        this.processSpace(player, newPos);
    }

    /**
     * Move player to a specific position
     */
    movePlayerTo(player, destination, collectGo = true) {
        const oldPos = player.position;

        if (collectGo && destination < oldPos && destination !== oldPos) {
            player.money += GAME_DATA.GO_SALARY;
            this.addMessage(`${player.name} passed GO and collected $${GAME_DATA.GO_SALARY}!`);
        }

        player.position = destination;
        this.processSpace(player, destination);
    }

    /**
     * Process landing on a space
     */
    processSpace(player, spaceId) {
        const space = GAME_DATA.BOARD[spaceId];
        this.addMessage(`${player.name} landed on ${space.name}.`);

        switch (space.type) {
            case 'property':
            case 'railroad':
            case 'utility':
                this.handlePropertySpace(player, space);
                break;
            case 'tax':
                this.handleTax(player, space);
                break;
            case 'chance':
                this.handleChance(player);
                break;
            case 'community':
                this.handleCommunityChest(player);
                break;
            case 'go_to_jail':
                this.sendToJail(player);
                break;
            case 'free_parking':
                this.handleFreeParking(player);
                break;
            case 'go':
            case 'jail':
                // Nothing special
                this.turnPhase = 'end_turn';
                break;
            default:
                this.turnPhase = 'end_turn';
        }

        this.updatePlayerWorth();
        this.notifyStateChange();
    }

    /**
     * Handle landing on a property/railroad/utility
     */
    handlePropertySpace(player, space) {
        const prop = this.properties[space.id];

        if (prop.owner === null) {
            // Unowned - offer to buy
            this.pendingAction = {
                type: 'buy_property',
                spaceId: space.id,
                price: space.price
            };
            this.turnPhase = 'action';
        } else if (prop.owner !== player.id) {
            // Owned by another player - pay rent
            if (!prop.mortgaged) {
                const rent = this.calculateRent(space, prop);
                this.payRent(player, this.players[prop.owner], rent, space);
            } else {
                this.addMessage(`${space.name} is mortgaged. No rent due.`);
                this.turnPhase = 'end_turn';
            }
        } else {
            // Own property
            this.turnPhase = 'end_turn';
        }
    }

    /**
     * Calculate rent for a property
     */
    calculateRent(space, prop) {
        if (space.type === 'railroad') {
            const owner = this.players[prop.owner];
            const railroadsOwned = owner.properties.filter(pid =>
                GAME_DATA.BOARD[pid].type === 'railroad'
            ).length;
            return GAME_DATA.RAILROAD_RENT[railroadsOwned - 1] || 25;
        }

        if (space.type === 'utility') {
            const owner = this.players[prop.owner];
            const utilitiesOwned = owner.properties.filter(pid =>
                GAME_DATA.BOARD[pid].type === 'utility'
            ).length;
            const diceTotal = this.lastDice[0] + this.lastDice[1];
            return diceTotal * GAME_DATA.UTILITY_MULTIPLIER[utilitiesOwned - 1];
        }

        // Regular property
        if (prop.houses === 0) {
            // Check if owner has monopoly (double rent with no houses)
            const hasMonopoly = this.hasMonopoly(prop.owner, space.color);
            return space.rent[0] * (hasMonopoly ? 2 : 1);
        }

        return space.rent[prop.houses]; // houses 1-4 or 5 for hotel
    }

    /**
     * Check if a player has a monopoly on a color group
     */
    hasMonopoly(playerId, colorGroup) {
        const colorProperties = GAME_DATA.BOARD.filter(s =>
            s.type === 'property' && s.color === colorGroup
        );

        return colorProperties.every(s =>
            this.properties[s.id].owner === playerId
        );
    }

    /**
     * Pay rent from one player to another
     */
    payRent(payer, receiver, amount, space) {
        this.addMessage(`${payer.name} pays $${amount} rent to ${receiver.name} for ${space.name}.`);
        payer.money -= amount;
        receiver.money += amount;
        this.turnPhase = 'end_turn';
        this.checkBankruptcy(payer);
    }

    /**
     * Buy a property
     */
    buyProperty(spaceId) {
        const player = this.getCurrentPlayer();
        const space = GAME_DATA.BOARD[spaceId];

        if (player.money < space.price) {
            this.addMessage(`${player.name} cannot afford ${space.name} ($${space.price}).`);
            return false;
        }

        player.money -= space.price;
        player.properties.push(spaceId);
        this.properties[spaceId].owner = player.id;

        this.addMessage(`${player.name} bought ${space.name} for $${space.price}!`);
        this.pendingAction = null;
        this.turnPhase = 'end_turn';
        this.updatePlayerWorth();
        this.notifyStateChange();
        return true;
    }

    /**
     * Decline buying a property (trigger auction)
     */
    declineProperty(spaceId) {
        this.pendingAction = null;
        this.startAuction(spaceId);
    }

    /**
     * Start an auction for a property
     */
    startAuction(spaceId) {
        const space = GAME_DATA.BOARD[spaceId];
        this.addMessage(`${space.name} goes to auction!`);

        const activePlayers = this.players.filter(p => !p.bankrupt);

        this.auction = {
            spaceId: spaceId,
            currentBid: 0,
            highestBidder: null,
            currentBidderIndex: 0,
            activeBidders: activePlayers.map(p => p.id),
            passedPlayers: new Set()
        };

        this.turnPhase = 'action';
        this.pendingAction = {
            type: 'auction',
            spaceId: spaceId
        };

        this.notifyStateChange();
    }

    /**
     * Place a bid in the auction
     */
    placeBid(playerId, amount) {
        if (!this.auction) return false;

        if (amount <= this.auction.currentBid) {
            this.addMessage('Bid must be higher than the current bid.');
            return false;
        }

        const player = this.players[playerId];
        if (amount > player.money) {
            this.addMessage(`${player.name} cannot afford that bid.`);
            return false;
        }

        this.auction.currentBid = amount;
        this.auction.highestBidder = playerId;
        this.auction.passedPlayers.clear();
        this.addMessage(`${player.name} bids $${amount}!`);

        this.advanceAuction();
        return true;
    }

    /**
     * Pass on auction bidding
     */
    passAuction(playerId) {
        if (!this.auction) return;

        this.auction.passedPlayers.add(playerId);
        this.auction.activeBidders = this.auction.activeBidders.filter(
            id => !this.auction.passedPlayers.has(id) || id === this.auction.highestBidder
        );

        this.addMessage(`${this.players[playerId].name} passes.`);
        this.advanceAuction();
    }

    /**
     * Advance auction to next bidder
     */
    advanceAuction() {
        if (!this.auction) return;

        const remainingBidders = this.auction.activeBidders.filter(
            id => !this.auction.passedPlayers.has(id)
        );

        if (remainingBidders.length <= 1 || (remainingBidders.length === 1 && this.auction.highestBidder !== null)) {
            this.resolveAuction();
            return;
        }

        // Move to next bidder
        let nextIdx = (this.auction.currentBidderIndex + 1) % this.auction.activeBidders.length;
        while (this.auction.passedPlayers.has(this.auction.activeBidders[nextIdx])) {
            nextIdx = (nextIdx + 1) % this.auction.activeBidders.length;
        }
        this.auction.currentBidderIndex = nextIdx;
        this.notifyStateChange();
    }

    /**
     * Resolve the auction
     */
    resolveAuction() {
        if (!this.auction) return;

        if (this.auction.highestBidder !== null && this.auction.currentBid > 0) {
            const winner = this.players[this.auction.highestBidder];
            const space = GAME_DATA.BOARD[this.auction.spaceId];

            winner.money -= this.auction.currentBid;
            winner.properties.push(this.auction.spaceId);
            this.properties[this.auction.spaceId].owner = winner.id;

            this.addMessage(`${winner.name} wins the auction for ${space.name} at $${this.auction.currentBid}!`);
        } else {
            this.addMessage('No bids placed. Property remains unsold.');
        }

        this.auction = null;
        this.pendingAction = null;
        this.turnPhase = 'end_turn';
        this.updatePlayerWorth();
        this.notifyStateChange();
    }

    /**
     * Handle tax space
     */
    handleTax(player, space) {
        player.money -= space.amount;
        this.freeParkingPool += space.amount;
        this.addMessage(`${player.name} pays $${space.amount} ${space.name}.`);
        this.turnPhase = 'end_turn';
        this.checkBankruptcy(player);
    }

    /**
     * Handle Free Parking (house rule: collect pool)
     */
    handleFreeParking(player) {
        if (this.freeParkingPool > 0) {
            player.money += this.freeParkingPool;
            this.addMessage(`${player.name} collects $${this.freeParkingPool} from Free Parking!`);
            this.freeParkingPool = 0;
        } else {
            this.addMessage(`${player.name} takes a rest at Free Parking.`);
        }
        this.turnPhase = 'end_turn';
    }

    /**
     * Handle Chance card
     */
    handleChance(player) {
        if (this.chanceDeck.length === 0) {
            this.chanceDeck = this.shuffleArray([...GAME_DATA.CHANCE_CARDS]);
        }

        const card = this.chanceDeck.pop();
        this.activeCard = { ...card, deck: 'chance' };
        this.addMessage(`CHANCE: "${card.text}"`);
        this.executeCard(player, card);
    }

    /**
     * Handle Community Chest card
     */
    handleCommunityChest(player) {
        if (this.communityDeck.length === 0) {
            this.communityDeck = this.shuffleArray([...GAME_DATA.COMMUNITY_CARDS]);
        }

        const card = this.communityDeck.pop();
        this.activeCard = { ...card, deck: 'community' };
        this.addMessage(`COMMUNITY CHEST: "${card.text}"`);
        this.executeCard(player, card);
    }

    /**
     * Execute a card action
     */
    executeCard(player, card) {
        switch (card.action) {
            case 'move_to':
                this.movePlayerTo(player, card.destination, true);
                return; // processSpace handles turn phase

            case 'move_back':
                const newPos = (player.position - card.spaces + 40) % 40;
                player.position = newPos;
                this.processSpace(player, newPos);
                return;

            case 'go_to_jail':
                this.sendToJail(player);
                break;

            case 'collect':
                player.money += card.amount;
                this.addMessage(`${player.name} collects $${card.amount}.`);
                break;

            case 'pay':
                player.money -= card.amount;
                this.freeParkingPool += card.amount;
                this.addMessage(`${player.name} pays $${card.amount}.`);
                this.checkBankruptcy(player);
                break;

            case 'pay_each':
                const payTotal = card.amount * (this.players.filter(p => !p.bankrupt && p.id !== player.id).length);
                this.players.forEach(p => {
                    if (!p.bankrupt && p.id !== player.id) {
                        p.money += card.amount;
                        player.money -= card.amount;
                    }
                });
                this.addMessage(`${player.name} pays $${card.amount} to each player (total: $${payTotal}).`);
                this.checkBankruptcy(player);
                break;

            case 'collect_each':
                this.players.forEach(p => {
                    if (!p.bankrupt && p.id !== player.id) {
                        p.money -= card.amount;
                        player.money += card.amount;
                    }
                });
                this.addMessage(`${player.name} collects $${card.amount} from each player.`);
                break;

            case 'jail_free':
                player.getOutOfJailCards++;
                this.addMessage(`${player.name} receives a Get Out of Jail Free card.`);
                break;

            case 'repairs':
                let repairCost = 0;
                player.properties.forEach(propId => {
                    const prop = this.properties[propId];
                    if (prop.houses > 0 && prop.houses < 5) {
                        repairCost += prop.houses * card.perHouse;
                    } else if (prop.houses === 5) {
                        repairCost += card.perHotel;
                    }
                });
                player.money -= repairCost;
                this.freeParkingPool += repairCost;
                this.addMessage(`${player.name} pays $${repairCost} for repairs.`);
                this.checkBankruptcy(player);
                break;

            case 'nearest_railroad':
                const railroads = [5, 15, 25, 35];
                let nearestRR = railroads.find(r => r > player.position);
                if (!nearestRR) nearestRR = railroads[0]; // wrap around
                this.movePlayerTo(player, nearestRR, true);
                return;

            case 'nearest_utility':
                const utilities = [12, 28];
                let nearestUtil = utilities.find(u => u > player.position);
                if (!nearestUtil) nearestUtil = utilities[0];
                this.movePlayerTo(player, nearestUtil, true);
                return;
        }

        this.turnPhase = 'end_turn';
        this.activeCard = null;
        this.notifyStateChange();
    }

    /**
     * Send a player to jail
     */
    sendToJail(player) {
        player.position = 10;
        player.inJail = true;
        player.jailTurns = 0;
        this.addMessage(`${player.name} is sent to Jail!`);
        this.turnPhase = 'end_turn';
        this.notifyStateChange();
    }

    /**
     * Buy a house for a property
     */
    buyHouse(spaceId) {
        const player = this.getCurrentPlayer();
        const space = GAME_DATA.BOARD[spaceId];
        const prop = this.properties[spaceId];

        if (prop.owner !== player.id) return false;
        if (!this.hasMonopoly(player.id, space.color)) {
            this.addMessage('You need a complete color set to build houses.');
            return false;
        }
        if (prop.houses >= 5) {
            this.addMessage('Maximum development reached (hotel).');
            return false;
        }
        if (prop.mortgaged) {
            this.addMessage('Cannot build on a mortgaged property.');
            return false;
        }
        if (player.money < space.houseCost) {
            this.addMessage(`Cannot afford a house ($${space.houseCost}).`);
            return false;
        }

        // Even building rule: check that we're building evenly
        const colorGroup = GAME_DATA.BOARD.filter(s => s.type === 'property' && s.color === space.color);
        const minHouses = Math.min(...colorGroup.map(s => this.properties[s.id].houses));
        if (prop.houses > minHouses) {
            this.addMessage('Must build evenly across the color group.');
            return false;
        }

        player.money -= space.houseCost;
        prop.houses++;

        const buildingType = prop.houses === 5 ? 'a hotel' : `house #${prop.houses}`;
        this.addMessage(`${player.name} built ${buildingType} on ${space.name} for $${space.houseCost}.`);
        this.updatePlayerWorth();
        this.notifyStateChange();
        return true;
    }

    /**
     * Sell a house from a property
     */
    sellHouse(spaceId) {
        const player = this.getCurrentPlayer();
        const space = GAME_DATA.BOARD[spaceId];
        const prop = this.properties[spaceId];

        if (prop.owner !== player.id) return false;
        if (prop.houses <= 0) return false;

        // Even selling rule
        const colorGroup = GAME_DATA.BOARD.filter(s => s.type === 'property' && s.color === space.color);
        const maxHouses = Math.max(...colorGroup.map(s => this.properties[s.id].houses));
        if (prop.houses < maxHouses) {
            this.addMessage('Must sell houses evenly across the color group.');
            return false;
        }

        const refund = Math.floor(space.houseCost / 2);
        player.money += refund;
        prop.houses--;

        this.addMessage(`${player.name} sold a house on ${space.name} for $${refund}.`);
        this.updatePlayerWorth();
        this.notifyStateChange();
        return true;
    }

    /**
     * Mortgage a property
     */
    mortgageProperty(spaceId) {
        const player = this.getCurrentPlayer();
        const space = GAME_DATA.BOARD[spaceId];
        const prop = this.properties[spaceId];

        if (prop.owner !== player.id) return false;
        if (prop.mortgaged) return false;
        if (prop.houses > 0) {
            this.addMessage('Must sell all buildings before mortgaging.');
            return false;
        }

        const mortgageValue = Math.floor(space.price / 2);
        player.money += mortgageValue;
        prop.mortgaged = true;

        this.addMessage(`${player.name} mortgaged ${space.name} for $${mortgageValue}.`);
        this.updatePlayerWorth();
        this.notifyStateChange();
        return true;
    }

    /**
     * Unmortgage a property
     */
    unmortgageProperty(spaceId) {
        const player = this.getCurrentPlayer();
        const space = GAME_DATA.BOARD[spaceId];
        const prop = this.properties[spaceId];

        if (prop.owner !== player.id) return false;
        if (!prop.mortgaged) return false;

        const unmortgageCost = Math.floor(space.price / 2 * 1.1); // 10% interest
        if (player.money < unmortgageCost) {
            this.addMessage(`Cannot afford to unmortgage ($${unmortgageCost}).`);
            return false;
        }

        player.money -= unmortgageCost;
        prop.mortgaged = false;

        this.addMessage(`${player.name} unmortgaged ${space.name} for $${unmortgageCost}.`);
        this.updatePlayerWorth();
        this.notifyStateChange();
        return true;
    }

    /**
     * Initiate a trade between players
     */
    initTrade(fromPlayerId, toPlayerId) {
        this.trade = {
            from: fromPlayerId,
            to: toPlayerId,
            offeredProperties: [],
            requestedProperties: [],
            offeredMoney: 0,
            requestedMoney: 0,
            accepted: false
        };
        this.notifyStateChange();
    }

    /**
     * Execute a trade
     */
    executeTrade() {
        if (!this.trade) return false;

        const from = this.players[this.trade.from];
        const to = this.players[this.trade.to];

        // Transfer properties
        this.trade.offeredProperties.forEach(propId => {
            from.properties = from.properties.filter(p => p !== propId);
            to.properties.push(propId);
            this.properties[propId].owner = to.id;
        });

        this.trade.requestedProperties.forEach(propId => {
            to.properties = to.properties.filter(p => p !== propId);
            from.properties.push(propId);
            this.properties[propId].owner = from.id;
        });

        // Transfer money
        from.money -= this.trade.offeredMoney;
        from.money += this.trade.requestedMoney;
        to.money += this.trade.offeredMoney;
        to.money -= this.trade.requestedMoney;

        this.addMessage(`Trade completed between ${from.name} and ${to.name}!`);
        this.trade = null;
        this.updatePlayerWorth();
        this.notifyStateChange();
        return true;
    }

    /**
     * Cancel trade
     */
    cancelTrade() {
        this.trade = null;
        this.notifyStateChange();
    }

    /**
     * Check if a player is bankrupt
     */
    checkBankruptcy(player) {
        if (player.money < 0) {
            // Check if player can raise money by mortgaging/selling
            const totalAssets = this.calculateTotalAssets(player);
            if (totalAssets + player.money < 0) {
                this.declareBankruptcy(player);
            } else {
                this.pendingAction = {
                    type: 'must_raise_funds',
                    amount: Math.abs(player.money)
                };
                this.turnPhase = 'action';
                this.addMessage(`${player.name} must raise $${Math.abs(player.money)}! Sell houses or mortgage properties.`);
            }
        }
    }

    /**
     * Calculate total assets a player can liquidate
     */
    calculateTotalAssets(player) {
        let total = 0;
        player.properties.forEach(propId => {
            const space = GAME_DATA.BOARD[propId];
            const prop = this.properties[propId];
            if (!prop.mortgaged) {
                total += Math.floor(space.price / 2); // mortgage value
            }
            if (prop.houses > 0) {
                total += prop.houses * Math.floor(space.houseCost / 2);
            }
        });
        return total;
    }

    /**
     * Declare a player bankrupt
     */
    declareBankruptcy(player) {
        player.bankrupt = true;
        this.addMessage(`${player.name} is BANKRUPT and eliminated!`);

        // Return all properties to bank
        player.properties.forEach(propId => {
            this.properties[propId].owner = null;
            this.properties[propId].houses = 0;
            this.properties[propId].mortgaged = false;
        });
        player.properties = [];
        player.money = 0;

        // Check for game over
        const activePlayers = this.players.filter(p => !p.bankrupt);
        if (activePlayers.length === 1) {
            this.gamePhase = 'gameover';
            this.winner = activePlayers[0];
            this.addMessage(`🎉 ${this.winner.name} WINS THE GAME! 🎉`);
        }

        this.notifyStateChange();
    }

    /**
     * End the current turn and move to next player
     */
    nextTurn() {
        // Check if doubles grant another turn
        if (this.lastDice[0] === this.lastDice[1] && this.doublesCount > 0 && !this.getCurrentPlayer().inJail) {
            this.turnPhase = 'roll';
            this.addMessage(`${this.getCurrentPlayer().name} rolled doubles! Roll again.`);
            this.notifyStateChange();
            return;
        }

        this.doublesCount = 0;
        this.activeCard = null;
        this.pendingAction = null;

        // Find next non-bankrupt player
        let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
        while (this.players[nextIndex].bankrupt) {
            nextIndex = (nextIndex + 1) % this.players.length;
            if (nextIndex === this.currentPlayerIndex) break;
        }

        this.currentPlayerIndex = nextIndex;
        this.turnNumber++;
        this.turnPhase = 'roll';

        const nextPlayer = this.getCurrentPlayer();
        this.addMessage(`--- Turn ${this.turnNumber}: ${nextPlayer.name}'s turn ---`);

        this.notifyStateChange();
    }

    /**
     * Update total worth for all players
     */
    updatePlayerWorth() {
        this.players.forEach(player => {
            if (player.bankrupt) {
                player.totalWorth = 0;
                return;
            }
            let worth = player.money;
            player.properties.forEach(propId => {
                const space = GAME_DATA.BOARD[propId];
                const prop = this.properties[propId];
                worth += space.price;
                if (prop.houses > 0) {
                    worth += prop.houses * space.houseCost;
                }
            });
            player.totalWorth = worth;
        });
    }

    /**
     * Get available actions for the current player
     */
    getAvailableActions() {
        const player = this.getCurrentPlayer();
        const actions = [];

        if (this.gamePhase !== 'playing') return actions;

        if (this.turnPhase === 'roll') {
            if (player.inJail) {
                actions.push({ id: 'roll', label: 'Roll for Doubles' });
                if (player.money >= GAME_DATA.BAIL_COST) {
                    actions.push({ id: 'pay_bail', label: `Pay Bail ($${GAME_DATA.BAIL_COST})` });
                }
                if (player.getOutOfJailCards > 0) {
                    actions.push({ id: 'use_card', label: 'Use Get Out of Jail Free Card' });
                }
            } else {
                actions.push({ id: 'roll', label: 'Roll Dice' });
            }
        }

        if (this.turnPhase === 'action' && this.pendingAction) {
            if (this.pendingAction.type === 'buy_property') {
                const space = GAME_DATA.BOARD[this.pendingAction.spaceId];
                if (player.money >= space.price) {
                    actions.push({ id: 'buy', label: `Buy ($${space.price})` });
                }
                actions.push({ id: 'auction', label: 'Pass (Auction)' });
            } else if (this.pendingAction.type === 'auction') {
                actions.push({ id: 'bid', label: 'Place Bid' });
                actions.push({ id: 'pass_auction', label: 'Pass' });
            } else if (this.pendingAction.type === 'must_raise_funds') {
                actions.push({ id: 'manage', label: 'Manage Properties' });
                actions.push({ id: 'declare_bankruptcy', label: 'Declare Bankruptcy' });
            }
        }

        if (this.turnPhase === 'end_turn') {
            actions.push({ id: 'end_turn', label: 'End Turn' });
        }

        // Property management actions (available during own turn)
        if (!player.bankrupt && (this.turnPhase === 'end_turn' || this.turnPhase === 'roll')) {
            if (player.properties.length > 0) {
                actions.push({ id: 'manage', label: 'Manage Properties' });
            }
            if (this.players.filter(p => !p.bankrupt).length > 1) {
                actions.push({ id: 'trade', label: 'Trade' });
            }
        }

        return actions;
    }

    /**
     * Get properties that can have houses built
     */
    getBuildableProperties(playerId) {
        const player = this.players[playerId];
        return player.properties.filter(propId => {
            const space = GAME_DATA.BOARD[propId];
            if (space.type !== 'property') return false;
            const prop = this.properties[propId];
            if (prop.mortgaged || prop.houses >= 5) return false;
            if (!this.hasMonopoly(playerId, space.color)) return false;
            if (player.money < space.houseCost) return false;

            // Even building check
            const colorGroup = GAME_DATA.BOARD.filter(s => s.type === 'property' && s.color === space.color);
            const minHouses = Math.min(...colorGroup.map(s => this.properties[s.id].houses));
            return prop.houses <= minHouses;
        });
    }

    /**
     * Add a message to the log
     */
    addMessage(text) {
        this.messageLog.push({
            text,
            timestamp: Date.now(),
            turn: this.turnNumber
        });

        // Keep log manageable
        if (this.messageLog.length > 100) {
            this.messageLog = this.messageLog.slice(-80);
        }

        if (this.onMessage) {
            this.onMessage(text);
        }
    }

    /**
     * Notify that game state changed
     */
    notifyStateChange() {
        if (this.onStateChange) {
            this.onStateChange(this);
        }
    }

    /**
     * Shuffle an array (Fisher-Yates)
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Serialize game state for saving
     */
    serialize() {
        return JSON.stringify({
            players: this.players,
            properties: this.properties,
            currentPlayerIndex: this.currentPlayerIndex,
            turnPhase: this.turnPhase,
            gamePhase: this.gamePhase,
            turnNumber: this.turnNumber,
            freeParkingPool: this.freeParkingPool,
            lastDice: this.lastDice,
            doublesCount: this.doublesCount
        });
    }

    /**
     * Load game state
     */
    deserialize(data) {
        const state = JSON.parse(data);
        Object.assign(this, state);
        this.notifyStateChange();
    }
}
