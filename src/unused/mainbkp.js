import { init, Sprite, Scene, GameLoop, initKeys, keyPressed, Text, Grid, initPointer, track } from 'kontra';

import {DIRS, minHeap, randint, grid_to_canvas, canvas_to_grid, can_move,
       next_pos, calc_dir_from_move, dir_to_rot, heuristic, astar} from './utils'
import './maze'
//import './map'
import './entities'


const DIFFICULTY = {
    EASY: 'Easy',
    MEDIUM: 'Medium',
    HARD: 'Hard'
}

const NEXTDIFFICULTY = {
    [DIFFICULTY.EASY]: DIFFICULTY.MEDIUM,
    [DIFFICULTY.MEDIUM]: DIFFICULTY.HARD,
    [DIFFICULTY.HARD]: DIFFICULTY.EASY
}

const INITIAL_DIFFICULTY = DIFFICULTY.MEDIUM


let render_player = function(player, canvas, context) {
    context.strokeStyle = 'green';
    context.fillStyle = 'green';
    context.beginPath();
    context.arc(0, 0, player.radius, 0, Math.PI*2);
    context.fill();
}

let render_enemy = function(enemy, canvas, context) {
    context.strokeStyle = 'red';
    context.fillStyle = 'red';

    let base_h = Math.floor(enemy.base_len/2),
        height_h = Math.floor(enemy.height/2)

    context.beginPath()
    context.moveTo(-height_h, -base_h)
    context.lineTo(-height_h, base_h)
    context.lineTo(height_h, 0)
    context.closePath()
    context.fill()
}

let { canvas, context } = init();

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const maze_width = 50;
const maze_height =  50;
const cell_size = 24

const MAP_TYPE = 'maze'
const NUM_ROOMS = 50
const MIN_RADIUS = 1
const MAX_RADIUS = 5

const DEBUG = false
const PARTIAL_MAZE = false

const ENEMY_BASE_SPEED = {
    [DIFFICULTY.EASY]: 1.0,
    [DIFFICULTY.MEDIUM]: 1.5,
    [DIFFICULTY.HARD]: 2.0,
}
const ENEMY_SPEED_INC = {
    [DIFFICULTY.EASY]: 0.25,
    [DIFFICULTY.MEDIUM]: 0.75,
    [DIFFICULTY.HARD]: 1.0,
}

const PLAYER_RADIUS = Math.floor(cell_size/2);
const ENEMY_BASE = Math.floor(cell_size/2);
const ENEMY_HEIGHT = cell_size;

/*let map, path, visited
if (MAP_TYPE == 'rooms'){
    map = gen_map(maze_width, maze_height, cell_size, START, NUM_ROOMS,
                  MIN_RADIUS, MAX_RADIUS, DEBUG)
}*/

initKeys()
initPointer()
/*
let map_sprite
if (MAP_TYPE == 'maze') {
    map_sprite = Sprite({
        dt: 0,
        update() {
            if (PARTIAL_MAZE) {
                this.dt += 1
                if (this.dt % 5 == 0)
                    backtracking_step(maze, path, visited)
                    backtracking_step(maze, path, visited)
                    backtracking_step(maze, path, visited)
            }
        },
        render() {
            render_maze(maze, canvas, this.context, visited, path)
        }
    })
} else if(MAP_TYPE == 'rooms') {
    map_sprite = Sprite({
        render() {
            render_map(map, canvas, this.context)
        }
    })
}*/

let player = Sprite({
    radius: PLAYER_RADIUS,
    time: 0,
    lastpressed: -60,
    map: null,
    reset(x, y) {
        this.x = x
        this.y = y
        this.time = 0
        this.lastpressed = -60
    },
    update() {
        this.time += 1

        if (this.time - this.lastpressed >= 5 && this.map) {
            //let grid_pos = canvas_to_grid(map, this.x, this.y)
            //let curr_cell = map.grid[grid_pos.x][grid_pos.y]

            let delta = {
                x:0,
                y:0
            }

            let player_grid = canvas_to_grid(this.map, player.x, player.y)

            if ((keyPressed('w') || keyPressed('up')) &&
                can_move(player_grid, this.map, DIRS.TOP)){
                delta.y -= cell_size
            }
            else if ((keyPressed('a') || keyPressed('left')) &&
                can_move(player_grid, this.map, DIRS.LEFT)){
                delta.x -= cell_size
            }
            else if ((keyPressed('s') || keyPressed('down')) &&
                can_move(player_grid, this.map, DIRS.BOTTOM)){
                delta.y += cell_size
            }
            else if ((keyPressed('d') || keyPressed('right')) &&
                can_move(player_grid, this.map, DIRS.RIGHT)){
                delta.x += cell_size
            }

            this.x += delta.x
            this.y += delta.y
            this.lastpressed = this.time
            //this.context.translate(-delta.x, -delta.y)
        }
    },
    render() {
        render_player(this, canvas, this.context)
    }
})

var get_audio_context = function() {
  var ac = null;
  if ( !window.AudioContext && !window.webkitAudioContext ) {
    console.warn('Web Audio API not supported in this browser');
  } else {
    ac = new ( window.AudioContext || window.webkitAudioContext )();
  }
  return function() {
    return ac;
  };
}();

let play_sine = function(freq) {
    var audio_context = get_audio_context()
    var o = audio_context.createOscillator()
    var g = audio_context.createGain()
    o.connect(g)
    g.connect(audio_context.destination)
    g.gain.value = 0.1
    o.frequency.value = freq
    o.type = 'triangle'
    o.start(0)
    g.gain.exponentialRampToValueAtTime(
        0.00000001, audio_context.currentTime + 0.2
    )
    setTimeout(function () {
        o.stop()
        o.disconnect()
    }, 210)
}

let play_melody = function(melody, initial_delay, interval) {
    var audio_context = get_audio_context()
    var o = audio_context.createOscillator()
    var g = audio_context.createGain()
    o.connect(g)
    g.connect(audio_context.destination)
    g.gain.value = 0.03
    o.frequency.value = 440
    o.type = 'square'

    setTimeout(function() {
        o.start(0)
    }, initial_delay)

    for (let i = 0; i < melody.length; i++) {
        setTimeout(function() {
            o.frequency.value = melody[i]
        }, interval * i + initial_delay)
    }
    setTimeout(function() {
        o.stop()
        o.disconnect()
    }, interval * melody.length + initial_delay)
}

let enemy = Sprite({
    height: ENEMY_HEIGHT,
    base_len: ENEMY_BASE,
    rotation: 0,
    dt: 0,
    current_speed: 0,
    map: null,
    reset(x, y, initial_speed, speed_increment) {
        this.x = x
        this.y = y
        this.rotation = 0
        this.dt = 0
        this.current_speed = initial_speed
        this.speed_increment = speed_increment
    },
    update() {
        if (this.map) {
            this.dt += 1

            let player_pos = canvas_to_grid(this.map, player.x, player.y),
                enemy_pos = canvas_to_grid(this.map, enemy.x, enemy.y)

            if (this.dt % Math.floor(60/this.current_speed) == 0) {
                let path_data = astar(this.map, enemy_pos, player_pos)

                let path_to_player = path_data["path"]

                if (path_to_player.length > 0) {
                    let dir = calc_dir_from_move(path_to_player[0], path_to_player[1])

                    this.rotation = dir_to_rot(dir)

                    let new_pos = grid_to_canvas(this.map, path_to_player[1].x,
                                                      path_to_player[1].y)
                    this.x = new_pos.x
                    this.y = new_pos.y

                    play_sine(110)
                }
            }
        }
    },
    render() {
        render_enemy(this, canvas, this.context)
        if (DEBUG && this.map) {
            let player_pos = canvas_to_grid(this.map, player.x, player.y),
                enemy_pos = canvas_to_grid(this.map, enemy.x, enemy.y)

            let path_data = astar(this.map, enemy_pos, player_pos)

            let path_to_player = path_data["path"],
                cost = path_data["cost"]

            this.context.rotate(-this.rotation)
            this.context.strokeStyle = 'blue';
            this.context.beginPath()
            for (i = 0; i < path_to_player.length; i++) {
                let next_node = grid_to_canvas(this.map, path_to_player[i].x,
                                                    path_to_player[i].y)
                // position wrt this enemy
                next_node.x -= enemy.x
                next_node.y -= enemy.y
                this.context.lineTo(next_node.x, next_node.y)
            }
            this.context.stroke()

            this.context.fillStyle = 'black';
            for (let key in cost) {
                let data = key.split(",").map((x) => parseInt(x))
                let print_at = grid_to_canvas(this.map, data[0], data[1])
                print_at.x -= this.x
                print_at.y -= this.y
                this.context.fillText(cost[key], print_at.x, print_at.y);
            }
            this.context.rotate(+this.rotation)
        }
    }
})

const STATES = {
    TITLE: 1,
    RUNNING: 2,
    GAMEOVER: 3
}

const NUM_FILES = 5

let file_collected_text = Text({
    text: 'Files collected: 0',
    color: 'white',
    font: '30px Arial, sans-serif',
    x: 10,
    y: 10
})

const LEVEL_DELAY = 1000

let running_scene = Scene({
    id: 'running',
    //children: [map_sprite, player, enemy],
    hidden: true,
    cullObjects: false,
    files: [],
    collected_files: 0,
    victory: false,
    current_level: 0,
    difficulty: INITIAL_DIFFICULTY,
    levels: [
        {grid_width: 20, grid_height: 20, cell_size : 24},
        {grid_width: 30, grid_height: 30, cell_size : 24},
        {grid_width: 40, grid_height: 40, cell_size : 24},
        {grid_width: 50, grid_height: 50, cell_size : 24},
        {grid_width: 70, grid_height: 70, cell_size : 24}
    ],
    level_title: Text({
        text: 'Level 1',
        color: 'white',
        font: '60px sans-serif',
        hidden: false,
        anchor: {x: 0.5, y:0.5}
    }),
    map_sprite: Sprite({
        map_data: null,
        dt: 0,
        update() {
            /*if (PARTIAL_MAZE) {
                this.dt += 1
                if (this.dt % 5 == 0)
                    backtracking_step(maze, path, visited)
                    backtracking_step(maze, path, visited)
                    backtracking_step(maze, path, visited)
            }*/
        },
        render() {
            if (this.map_data)
                render_maze(this.map_data, canvas, this.context)//, visited, path)
        }
    }),
    current_start: {x: 0, y: 0},
    playable: false,
    start_level: function() {
        let maze_config = this.levels[this.current_level],
            maze_width = maze_config['grid_width'],
            maze_height = maze_config['grid_height'],
            cell_size = maze_config['cell_size']

        let grid_start = {
            x: Math.floor(maze_width/2),
            y: Math.floor(maze_height/2)
        }

        let map_data = gen_maze(maze_width, maze_height, cell_size, grid_start,
                                PARTIAL_MAZE)['maze'],
            canvas_start_coords = grid_to_canvas(map_data, grid_start.x,
                                                 grid_start.y),
            canvas_enemy_coords = grid_to_canvas(map_data, grid_start.x + 5,
                                                 grid_start.y)

        this.current_start = grid_start

        player.reset(canvas_start_coords.x, canvas_start_coords.y)
        enemy.reset(canvas_enemy_coords.x, canvas_enemy_coords.y,
            ENEMY_BASE_SPEED[this.difficulty],
            ENEMY_SPEED_INC[this.difficulty])

        this.map_sprite.map_data = map_data
        player.map = map_data
        enemy.map = map_data

        const begin_melody = [130, 155, 196]
        play_melody(begin_melody, 0, 100)

        this.playable = false
        let this_scene = this
        setTimeout(function() {
            this_scene.playable = true
        }, LEVEL_DELAY)

        this.files = []
        this.collected_files = 0
        for (let i = 0; i < NUM_FILES; i++) {
            let file_pos = grid_to_canvas(map_data, randint(0, maze_width),
                                               randint(0, maze_height), true),
                file_sprite = Sprite({
                    x: file_pos.x + 3,
                    y: file_pos.y + 3,
                    height: Math.floor(cell_size/2),
                    width: Math.floor(cell_size/2),
                    offset: 5,
                    render() {
                        render_file(this, canvas, this.context)
                    }
                })

            this.files.push(file_sprite)
        }

        this.level_title.text = 'Level ' + (this.current_level + 1)
        this.level_title.x = canvas_start_coords.x
        this.level_title.y = canvas_start_coords.y
    },
    update: function() {
        if (this.playable) {

            let map = this.map_sprite.map_data,
                player_pos = canvas_to_grid(map, player.x, player.y),
                enemy_pos = canvas_to_grid(map, enemy.x, enemy.y);

            if (player_pos.x == enemy_pos.x && player_pos.y == enemy_pos.y) {
                this.hide()
                return
            }

            this.map_sprite.update();

            player.update();
            enemy.update();

            for (let i = 0; i < this.files.length; i++){
                let file = this.files[i],
                    file_pos = canvas_to_grid(map, file.x, file.y)

                file.update()

                if (player_pos.x == file_pos.x && player_pos.y == file_pos.y) {
                    this.files.splice(i, 1)
                    this.collected_files++

                    // increase enemy's speed
                    enemy.current_speed += enemy.speed_increment

                    //play_sine(880)
                    if (this.collected_files < NUM_FILES)
                        play_melody([520, 1040], 0, 100)
                    else
                        play_melody([520, 2080], 0, 100)
                }
            }

            if (player_pos.x == this.current_start.x &&
                player_pos.y == this.current_start.y &&
                this.collected_files == NUM_FILES) {
                play_melody([174*4], 0, 100)
                play_melody([174*4], 120, 100)

                this.current_level++
                if (this.current_level >= this.levels.length) {
                    this.victory = true
                    this.hide()
                } else {
                    this.playable = false
                    this.start_level()
                }
                return
            }


        }
        file_collected_text.text = 'Files collected: ' + this.collected_files

        this.lookAt(player)
    },
    render: function() {
        this.map_sprite.render();

        for (let i = 0; i < this.files.length; i++){
            this.files[i].render()
        }
        player.render();
        enemy.render();

        if (!this.playable) {
            this.level_title.render()
        }
    },
    onShow: function() {
        this.victory = false
        this.current_level = 0
        this.playable = false
        this.start_level()
    },
    onHide: function() {
        //context.resetTransform()
    },
})

let text_options = {
    color: 'white',
    font: '20px Arial, sans-serif'
};

let title_text = Text({
    text: 'HTTP RUNNER\n\n',
    color: 'white',
    font: '30px Arial, sans-serif'
})

let start_text = Text({
    text: 'Start',
    onDown: function() {
        title_scene.hide()
        //get_audio_context().resume()
    },
    ...text_options
});

let instructions_button = Text({
    text: 'Instructions\n\n',
    onDown: function() {
        title_scene.current_screen = SCREENS.INSTRUCTIONS
    },
    ...text_options
});

let instructions_text = Text({
    width: Math.floor(canvas.width * 0.75),
    text: 'You are an HTTP request. You just got sent to an unknown server '+
          'where there are ' + NUM_FILES + ' hidden files to be found. The '+
          'problem is that the system\'s firewall has gone haywire and is '+
          'trying to intercept all incoming requests, including you. You '+
          'must find all the files and get back to the exit before the '+
          'firewall agent can get you, but beware: every time you collect a '+
          'file the agent becomes a little bit faster. If the agent catches '+
          'you before you can fulfill your mission, you will get a 404 error.',
    ...text_options
});

let movement_info_text = Text({
    text: 'Move with WASD or arrow keys.\n\n',
    ...text_options
});

let gameover_text = Text({
    text: 'ERROR 404',
    ...text_options
});

let victory_text = Text({
    text: 'YOU WIN!',
    ...text_options
});

let back_button = Text({
    text: '\n\nBack',
    onDown: function() {
        title_scene.current_screen = SCREENS.TITLE
    },
    ...text_options
});

let difficulty_button = Text({
    text: 'Mode: ' + INITIAL_DIFFICULTY + ' (Click to switch)',
    onDown: function() {
        running_scene.difficulty = NEXTDIFFICULTY[running_scene.difficulty]
        this.text = 'Mode: ' +
                    running_scene.difficulty.charAt(0).toUpperCase() +
                    running_scene.difficulty.slice(1) + ' (Click to switch)';
    },
    ...text_options
});

let lore_info = Grid({
    anchor: {x: 0.5, y: 0.5},

    rowGap: 15,

    justify: 'start',

    children: [instructions_text, movement_info_text]
})

let title_menu = Grid({
    x: Math.floor(canvas.width/2),
    y: Math.floor(canvas.height/2) - 100,
    anchor: {x: 0.5, y: 0.5},

    rowGap: 15,

    justify: 'center',

    children: [title_text, start_text, instructions_button, difficulty_button]
})

let instruction_menu = Grid({
    x: Math.floor(canvas.width/2),
    y: Math.floor(canvas.height/2) - 100,
    anchor: {x: 0.5, y: 0.5},

    rowGap: 15,

    justify: 'center',

    children: [lore_info, back_button]
})

let gameover_menu = Grid({
    x: Math.floor(canvas.width/2),
    y: Math.floor(canvas.height/2) - 100,
    anchor: {x: 0.5, y: 0.5},

    rowGap: 15,

    justify: 'center',

    children: [gameover_text, back_button]
})

let victory_menu = Grid({
    x: Math.floor(canvas.width/2),
    y: Math.floor(canvas.height/2) - 100,
    anchor: {x: 0.5, y: 0.5},

    rowGap: 15,

    justify: 'center',

    children: [victory_text, back_button]
})

track(start_text)
track(instructions_button)
track(back_button)
track(difficulty_button)

const MAX_TEXT_SPEED = 5
const TEXT_SIZE = 10

const SCREENS = {
    TITLE: 1,
    INSTRUCTIONS: 2,
    GAMEOVER: 3,
    VICTORY: 4
}

let title_scene = Scene({
    id: 'title',
    hidden: true,
    current_screen: SCREENS.TITLE,
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
    onShow() {
        for (let word in this.word_list) {
            let w = this.word_list[word]
            w.x = randint(0, canvas.width)
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
    update() {
        for (let word in this.word_list) {
            let w = this.word_list[word]
            w.y = w.y + w.speed
            if (w.y >= canvas.height) {
                w.x = randint(0, canvas.width)
                w.speed = randint(1, MAX_TEXT_SPEED)
            }
            w.y = w.y % canvas.height
        }
        if (this.current_screen == SCREENS.TITLE)
            title_menu.update()
        else if (this.current_screen == SCREENS.INSTRUCTIONS)
            instruction_menu.update()
        else if (this.current_screen == SCREENS.GAMEOVER)
            gameover_menu.update()
        else if (this.current_screen == SCREENS.VICTORY)
            victory_menu.update()
    },
    render() {
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
            title_menu.render()
        else if (this.current_screen == SCREENS.INSTRUCTIONS)
            instruction_menu.render()
        else if (this.current_screen == SCREENS.GAMEOVER)
            gameover_menu.render()
        else if (this.current_screen == SCREENS.VICTORY)
            victory_menu.render()
    }
})

let SCENE_MAP = {
    [STATES.TITLE]: title_scene,
    [STATES.RUNNING]: running_scene,
}

let NEXT_STATE = {
    [STATES.TITLE]: STATES.RUNNING,
    [STATES.RUNNING]: STATES.TITLE,
}

let current_state = STATES.TITLE

let loop = GameLoop({
    update: function() {
        let curr_scene = SCENE_MAP[current_state]

        if (!curr_scene.hidden) {
            curr_scene.update();
        } else {
            let victory = false
            if (current_state == STATES.RUNNING) {
                victory = curr_scene.victory
            }

            current_state = NEXT_STATE[current_state]

            if (current_state == STATES.TITLE) {
                if (victory)
                    SCENE_MAP[current_state].current_screen = SCREENS.VICTORY
                else
                    SCENE_MAP[current_state].current_screen = SCREENS.GAMEOVER
            }

            SCENE_MAP[current_state].show()
        }
    },
    render: function() {
        context.fillStyle = 'black'
        context.fillRect(-10000, -10000, 20000, 20000)
        let curr_scene = SCENE_MAP[current_state]
        curr_scene.render();
        if (current_state == STATES.RUNNING) file_collected_text.render()
    }

});


title_scene.show()
loop.start();
