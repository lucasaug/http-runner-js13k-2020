// Title scene

import { init, initPointer, track, Grid, Scene, Text } from 'kontra';

import { NUM_FILES, INITIAL_DIFFICULTY, NEXTDIFFICULTY } from './constants'
import { randint } from './utils'
import { play_melody } from './audio'

init();
initPointer();

const TEXT_OPTIONS = {
    color: 'white',
    font: '20px Arial, sans-serif'
};

const MAX_TEXT_SPEED = 5
const TEXT_SIZE = 10

export const SCREENS = {
    TITLE: 1,
    INSTRUCTIONS: 2,
    GAMEOVER: 3,
    VICTORY: 4
}

export let title_scene = Scene({
    id: 'title',
    hidden: true,
    current_screen: SCREENS.TITLE,
    difficulty: INITIAL_DIFFICULTY,
    word_list: [
        {word: 'GET'},
        {word: 'POST'},
        {word: 'HTTP'},
        {word: 'NOT FOUND'},
        {word: 'CONTENT-TYPE'},
        {word: 'REQUEST'},
        {word: 'RESPONSE'},
        {word: '404'},
        {word: '200'},
        {word: 'REDIRECT'},
        {word: 'ACKNOWLEDGED'},
        {word: 'BLOCK'},
    ],
    canvas: null,
    texts: {},
    grids: {},
    createText: function() {
    	let this_canvas = this.canvas,
    		this_scene = this;

    	this.texts['title_text'] = Text({
    	    text: 'HTTP RUNNER\n\n',
    	    color: 'white',
    	    font: '30px Arial, sans-serif'
    	})

    	this.texts['start_text'] = Text({
    	    text: 'Start',
    	    onDown: function() {
    	        this_scene.hide()
    	    },
    	    ...TEXT_OPTIONS
    	});

    	this.texts['instructions_button'] = Text({
    	    text: 'Instructions\n\n',
    	    onDown: function() {
    	        this_scene.current_screen = SCREENS.INSTRUCTIONS
    	    },
    	    ...TEXT_OPTIONS
    	});

    	this.texts['instructions_text'] = Text({
    	    width: Math.floor(this_canvas.width * 0.75),
    	    text: 'You are an HTTP request. You just got sent to an unknown '+
    	          'server where there are ' + NUM_FILES + ' hidden files to '+
    	          'be found. The problem is that the system\'s firewall has '+
    	          'gone haywire and is trying to intercept all incoming '+
    	          'requests, including you. You must find all the files and '+
    	          'get back to the exit before the firewall agent can get '+
    	          'you, but beware: every time you collect a file the agent '+
    	          'becomes a little bit faster. If the agent catches you '+
    	          'before you can fulfill your mission, you will get a 404 '+
    	          'error.',
    	    ...TEXT_OPTIONS
    	});

    	this.texts['movement_info_text'] = Text({
    	    text: 'Move with WASD or arrow keys.\n\n',
    	    ...TEXT_OPTIONS
    	});

    	this.texts['gameover_text'] = Text({
    	    text: '404: FILE NOT FOUND',
    	    ...TEXT_OPTIONS
    	});

    	this.texts['victory_text'] = Text({
    	    text: '200: OK\nYOU WIN!',
    	    ...TEXT_OPTIONS
    	});

    	this.texts['back_button'] = Text({
    	    text: '\n\nBack',
    	    onDown: function() {
    	        this_scene.current_screen = SCREENS.TITLE
    	    },
    	    ...TEXT_OPTIONS
    	});

    	this.texts['difficulty_button'] = Text({
    	    text: 'Mode: ' + this.difficulty + ' (Click to switch)',
    	    onDown: function() {
    	        this_scene.difficulty = NEXTDIFFICULTY[this_scene.difficulty]
    	        this.text = 'Mode: ' +
    	                    this_scene.difficulty.charAt(0).toUpperCase() +
    	                    this_scene.difficulty.slice(1) +
    	                    ' (Click to switch)';
    	    },
    	    ...TEXT_OPTIONS
    	});

    	track(this.texts['start_text'])
    	track(this.texts['instructions_button'])
    	track(this.texts['back_button'])
    	track(this.texts['difficulty_button'])
    },
    createGrids: function() {
    	let this_canvas = this.canvas,
    		texts = this.texts;

    	this.grids['lore_info'] = Grid({
    	    anchor: {x: 0.5, y: 0.5},

    	    rowGap: 15,

    	    justify: 'start',

    	    children: [texts['instructions_text'], texts['movement_info_text']]
    	})

    	this.grids['title_menu'] = Grid({
    	    x: Math.floor(this_canvas.width/2),
    	    y: Math.floor(this_canvas.height/2) - 100,
    	    anchor: {x: 0.5, y: 0.5},

    	    rowGap: 15,

    	    justify: 'center',

    	    children: [texts['title_text'], texts['start_text'],
    	               texts['instructions_button'],
    	               texts['difficulty_button']]
    	})

    	this.grids['instruction_menu'] = Grid({
    	    x: Math.floor(this_canvas.width/2),
    	    y: Math.floor(this_canvas.height/2) - 100,
    	    anchor: {x: 0.5, y: 0.5},

    	    rowGap: 15,

    	    justify: 'center',

    	    children: [this.grids['lore_info'], texts['back_button']]
    	})

    	this.grids['gameover_menu'] = Grid({
    	    x: Math.floor(this_canvas.width/2),
    	    y: Math.floor(this_canvas.height/2) - 100,
    	    anchor: {x: 0.5, y: 0.5},

    	    rowGap: 15,

    	    justify: 'center',

    	    children: [texts['gameover_text'], texts['back_button']]
    	})

    	this.grids['victory_menu'] = Grid({
    	    x: Math.floor(this_canvas.width/2),
    	    y: Math.floor(this_canvas.height/2) - 100,
    	    anchor: {x: 0.5, y: 0.5},

    	    rowGap: 15,

    	    justify: 'center',

    	    children: [texts['victory_text'], texts['back_button']]
    	})
    },
    onShow: function() {
    	this.createText()
    	this.createGrids()

        for (let word in this.word_list) {
            let w = this.word_list[word]
            w.x = randint(0, this.canvas.width)
            w.y = randint(0, 500)
            w.speed = randint(1, MAX_TEXT_SPEED)
        }

        // notes in the C minor scale
        /*
            130, // C
            146, // D
            155, // Eb
            174, // F
            196, // G
            220, // A
            233  // Bb
        */

        const main_melody = [
            130*2,
            155*2,
            196*2,
            174*2,
            155*2,
            174*2,
            130*2
        ]

        const bass_melody = [
            233,
            196,
            174,
            130,
        ]

        const INIT_DELAY = 500,
              INTERVAL = 200

        play_melody(main_melody, INIT_DELAY, INTERVAL)
        play_melody(bass_melody, INIT_DELAY, 2*INTERVAL)

    },
    update: function() {
        for (let word in this.word_list) {
            let w = this.word_list[word]
            w.y = w.y + w.speed
            if (w.y >= this.canvas.height) {
                w.x = randint(0, this.canvas.width)
                w.speed = randint(1, MAX_TEXT_SPEED)
            }
            w.y = w.y % this.canvas.height
        }
        if (this.current_screen == SCREENS.TITLE)
            this.grids['title_menu'].update()
        else if (this.current_screen == SCREENS.INSTRUCTIONS)
            this.grids['instruction_menu'].update()
        else if (this.current_screen == SCREENS.GAMEOVER)
            this.grids['gameover_menu'].update()
        else if (this.current_screen == SCREENS.VICTORY)
            this.grids['victory_menu'].update()
    },
    render: function() {
        this.context.font = TEXT_SIZE + 'px bold sans-serif';

        for (let word in this.word_list) {
            let w = this.word_list[word],
                letters = w.word,
                count = 0
            for (let letter in letters) {
                let l = letters[letter],
                    alpha = (4*((count + 1)/(letters.length))/5   ) + 0.2
                this.context.fillStyle = "rgba(0, 255, 0, " + alpha + ")";
                this.context.fillText(l, w.x, w.y + count * TEXT_SIZE)
                count += 1
            }
        }
        if (this.current_screen == SCREENS.TITLE)
            this.grids['title_menu'].render()
        else if (this.current_screen == SCREENS.INSTRUCTIONS)
            this.grids['instruction_menu'].render()
        else if (this.current_screen == SCREENS.GAMEOVER)
            this.grids['gameover_menu'].render()
        else if (this.current_screen == SCREENS.VICTORY)
            this.grids['victory_menu'].render()
    }
})
