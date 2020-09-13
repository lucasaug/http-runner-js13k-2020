// Constants to configure most aspects of the game

// Number of files to be collected
export const NUM_FILES = 0;

// Difficulty levels
export const DIFFICULTY = {
    EASY: 'Easy',
    MEDIUM: 'Medium',
    HARD: 'Hard'
};

export const INITIAL_DIFFICULTY = DIFFICULTY.MEDIUM;

export const NEXTDIFFICULTY = {
    [DIFFICULTY.EASY]: DIFFICULTY.MEDIUM,
    [DIFFICULTY.MEDIUM]: DIFFICULTY.HARD,
    [DIFFICULTY.HARD]: DIFFICULTY.EASY
};

// Gamestates
export const GAMESTATES = {
    TITLE: 1,
    RUNNING: 2,
    GAMEOVER: 3
};

// Level configuration
export const LEVEL_START_DELAY = 1000;

export const LEVELS = [
    {grid_width: 20, grid_height: 20, cell_size : 24},
    {grid_width: 30, grid_height: 30, cell_size : 24},
    {grid_width: 50, grid_height: 50, cell_size : 30},
    {grid_width: 70, grid_height: 70, cell_size : 30},
    {grid_width: 90, grid_height: 90, cell_size : 36}
];

// Map configuration
export const MAZE_WIDTH = 50;
export const MAZE_HEIGHT =  50;
export const CELL_SIZE = 24;

// Enemy specs
export const ENEMY_BASE_SPEED = {
    [DIFFICULTY.EASY]: 1.0,
    [DIFFICULTY.MEDIUM]: 1.75,
    [DIFFICULTY.HARD]: 2.5,
};

export const ENEMY_SPEED_INC = {
    [DIFFICULTY.EASY]: 0.25,
    [DIFFICULTY.MEDIUM]: 0.50,
    [DIFFICULTY.HARD]: 0.8,
};
