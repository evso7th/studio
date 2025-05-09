# **App Name**: IPO Mad Racing

## Core Features:

- Responsive Game Window: Dynamically resize the main game container to fit 100% of the screen, adapting to different mobile device resolutions without any scrolling.
- Fixed Control Panel: Implement a fixed control panel at the bottom of the screen with buttons for left, right, jump, and exit actions.
- Animated Hero: Display the hero character with basic animations for movement (left, right, jump) and collision detection with platforms.
- Level Design: Create a game level with moving platforms and a collection of "Spasibki" (coins) for the hero to collect.
- Coin Collection Effect: Implement a particle effect when the hero collects a coin, making it visually disappear.
- Coordinate System: Use a relative coordinate system with the origin at the bottom-left corner. Pixels may be used where necessary for precise positioning.
- Platform Interaction: The hero cannot intersect platforms from above or below. When the hero lands on a platform, they stick to it and move with it until a new movement or jump command is given. The hero's bottom edge aligns precisely with the platform's top edge when on it.
- Platforms: Moving objects 130*24 pixels inside the level from edge to edge of the playing field by default. Depending on the level, the logic of platform movement can be changed. On the first level, two platforms. The first is 200 pixels high, the second is 320 pixels high. The height is ALWAYS counted from the bottom up, from the lower border of the playing field.

## Style Guidelines:

- Maintain a fixed control panel at the bottom of the screen with clearly visible and easily tappable buttons.
- Use a dark semi-transparent overlay for the control panel to ensure it stands out against the game background.
- Implement a vibrant, pixel-art style for the game elements to evoke a retro gaming aesthetic. Consider shades of blues and greens.
- Accent color: Electric Blue (#7DF9FF) for the coins and visual feedback.
- Use clear, simple icons for the control panel buttons (arrows for movement, a jump symbol, etc.).
- Apply smooth transitions and animations for character movements and platform movements using `requestAnimationFrame`.
- Background color for the game field: Blue.
- Coins color: Yellow.
- Platforms color: Green.
- Game title font: Roboto 24px white bold.
- Level indicator font: Roboto 16px white bold.