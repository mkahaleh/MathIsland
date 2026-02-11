# Math Island Adventure

A kids' math game for Samsung Smart TV (Tizen) with vivid colors, animated island environments, and progressive algebra challenges.

## Features

- **8 Playable Characters** - Each with unique abilities and bonuses (e.g., Luna the Explorer gets extra time, Captain Finn earns bonus streak points)
- **30 Levels across 6 Island Zones** - Sandy Shores, Jungle Trail, Crystal Cave, Volcano Peak, Cloud Kingdom, Star Temple
- **Progressive Math Difficulty** - Addition/subtraction through multi-step algebra, fractions, patterns, and word problems
- **Procedural Canvas Graphics** - Animated ocean waves, swaying palm trees, glowing crystals, volcanic lava, star fields, and more
- **Particle Effects** - Confetti bursts, star explosions, streak fire, and celebration effects
- **Procedural Audio** - Web Audio API sound effects and background music (no asset files needed)
- **Samsung TV Remote Support** - D-pad navigation, Enter to select, color buttons for quick answers, Back button
- **Keyboard Support** - Arrow keys / WASD, Enter/Space, number keys 1-4 for answers
- **Save System** - Progress, unlocked characters, and settings saved via localStorage
- **Timer & Streak System** - Optional countdown timer and score multiplier streaks

## Island Zones

| Zone | Levels | Math Topics |
|------|--------|-------------|
| Sandy Shores | 1-5 | Addition, Subtraction |
| Jungle Trail | 6-10 | Multiplication, Division, Patterns |
| Crystal Cave | 11-15 | Fractions, Comparisons, Word Problems |
| Volcano Peak | 16-20 | Basic Algebra (x + a = b, ax = b) |
| Cloud Kingdom | 21-25 | Intermediate Algebra (ax + b = c) |
| Star Temple | 26-30 | Advanced Algebra, Mixed Challenges |

## Project Structure

```
MathIsland/
├── config.xml          # Tizen app manifest
├── index.html          # Entry point
├── css/
│   └── styles.css      # Full UI styling (1920x1080 TV)
├── js/
│   ├── utils.js        # Utility functions
│   ├── audio.js        # Web Audio procedural sound
│   ├── particles.js    # Canvas particle system
│   ├── characters.js   # 8 character definitions & abilities
│   ├── math-engine.js  # Problem generator (add to algebra)
│   ├── levels.js       # 30 level definitions
│   ├── island-renderer.js  # Canvas background renderer
│   ├── game-engine.js  # Core game loop & state
│   ├── ui-manager.js   # Screen management & DOM
│   ├── input-handler.js    # TV remote & keyboard input
│   └── app.js          # Application entry point
└── assets/             # (optional external assets)
```

## Running Locally

Open `index.html` in a browser. Use arrow keys to navigate and Enter to select.

## Deploying to Samsung Smart TV

1. Install Tizen Studio
2. Create a Samsung TV certificate
3. Package the project: `tizen package -t wgt`
4. Install to TV: `tizen install -n MathIsland.wgt`

## Controls

| Input | Action |
|-------|--------|
| D-pad / Arrow keys | Navigate |
| Enter / OK | Select |
| Back / Escape | Go back |
| 1-4 / Color buttons | Quick answer selection |
