# Property Tycoon

A Monopoly-style board game built for Samsung Tizen Smart TVs.

## Features

- Full Monopoly game mechanics: property buying, rent, houses, hotels, mortgages
- 40 board spaces with all classic properties, railroads, and utilities
- Chance and Community Chest card decks
- Jail system with bail, doubles rolling, and Get Out of Jail Free cards
- Property auction system when players decline to buy
- Trading between players
- AI opponents with Easy, Medium, and Hard difficulty levels
- Realistic board rendered with HTML5 Canvas
- Synthesized sound effects (Web Audio API)
- Samsung TV remote control navigation (D-pad, color buttons, OK/Back)
- Standard keyboard and mouse support for development
- 1920x1080 optimized for TV displays
- Game Mode metadata for reduced input latency on 2022+ Samsung TVs

## Project Structure

```
MathIsland/
├── config.xml          # Tizen TV app configuration
├── index.html          # Main HTML shell
├── css/
│   └── styles.css      # Full UI styling with TV-optimized focus system
├── js/
│   ├── gameData.js     # Board spaces, cards, tokens, constants
│   ├── boardRenderer.js # Canvas-based board rendering
│   ├── gameEngine.js   # Core game logic (turns, dice, properties, cards)
│   ├── aiPlayer.js     # AI opponent with difficulty levels
│   ├── inputHandler.js # TV remote, keyboard, touch input
│   ├── uiManager.js    # UI panels, overlays, menus
│   ├── soundEngine.js  # Web Audio synthesized sound effects
│   └── app.js          # Main application controller
└── img/
    ├── icon.svg        # App icon
    └── icon.png        # App icon (PNG)
```

## TV Remote Controls

| Button | Action |
|--------|--------|
| D-pad Up/Down | Navigate menu items |
| OK / Enter | Select / Confirm |
| Back | Go back / Pause menu |
| RED | Roll dice |
| GREEN | Buy property |
| YELLOW | Manage properties |
| BLUE | End turn |

## Development

Open `index.html` in a browser for development. The game works with standard keyboard input:
- Arrow keys for navigation
- Enter for selection
- Escape for back/menu
- Space for rolling dice

## Building for Tizen

1. Install Tizen Studio
2. Import this project as a Tizen Web Application
3. Build and sign with your Samsung certificate
4. Deploy to TV emulator or physical device
