// Main game scene

import { init, Scene, Sprite, Text } from 'kontra';

import { play_melody } from './audio'
import { NUM_FILES, LEVELS, ENEMY_BASE_SPEED,
	     ENEMY_SPEED_INC,LEVEL_START_DELAY } from './constants'
import { gen_maze, render_maze } from './maze'
import { canvas_to_grid, grid_to_canvas, randint } from './utils'

export let file_collected_text = Text({
    text: 'Files collected: 0',
    color: 'white',
    font: '30px Arial, sans-serif',
    x: 10,
    y: 10
})

function render_file(file, context) {
    context.lineWidth = 3;
    context.strokeStyle = 'black';
    context.fillStyle = 'gray';
    context.strokeRect(0, 0, file.width, file.height);
    context.fillRect(0, 0, file.width, file.height);
    context.strokeRect(file.offset, file.offset, file.width, file.height);
    context.fillRect(file.offset, file.offset, file.width, file.height);
}


export let running_scene = Scene({
    id: 'running',
    hidden: true,
    cullObjects: false,
    files: [],
    collected_files: 0,
    victory: false,
    current_level: 0,
    player: null,
    enemy: null,
    canvas: null,
    difficulty: null,
    levels: LEVELS,
    level_title: Text({
        text: 'Level 1',
        color: 'white',
        font: '60px sans-serif',
        hidden: false,
        anchor: {x: 0.5, y:0.5}
    }),
    map_sprite: Sprite({
        map_data: null,
        canvas: null,
        dt: 0,
        update() {},
        render() {
            if (this.map_data)
                render_maze(this.map_data, this.canvas, this.context)
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

        let map_data = gen_maze(maze_width, maze_height, cell_size,
                                grid_start)['maze'],
            canvas_start_coords = grid_to_canvas(map_data, grid_start.x,
                                                 grid_start.y),
            canvas_enemy_coords = grid_to_canvas(map_data, grid_start.x + 5,
                                                 grid_start.y)

        this.current_start = grid_start

        this.player.reset(canvas_start_coords.x, canvas_start_coords.y,
        	              cell_size)
        this.enemy.reset(canvas_enemy_coords.x, canvas_enemy_coords.y,
            cell_size, ENEMY_BASE_SPEED[this.difficulty],
            ENEMY_SPEED_INC[this.difficulty])

        this.map_sprite.map_data = map_data
        this.map_sprite.canvas = this.canvas
        this.player.map = map_data
        this.enemy.map = map_data
        this.enemy.player = this.player

        const begin_melody = [130, 155, 196]
        play_melody(begin_melody, 0, 100)

        this.playable = false
        let this_scene = this
        setTimeout(function() {
            this_scene.playable = true
        }, LEVEL_START_DELAY)

        this.files = []
        this.collected_files = 0

        let used_locations = [
            grid_start
        ]
        for (let i = 0; i < NUM_FILES; i++) {
            let file_pos = {
                x: grid_start.x,
                y: grid_start.y
            }

            // do not generate in the maze entrance
            let allowed = false
            while (!allowed) {
            	file_pos = {
                    x: randint(0, maze_width),
                    y: randint(0, maze_height)
                }

                allowed = true
                for (let i = 0; i < used_locations.length; i++) {
                    if (file_pos.x == used_locations[i].x &&
                        file_pos.y == used_locations[i].y) {
                        allowed = false
                    }
                }
            }

            used_locations.push(file_pos)
            let file_canvas_pos = grid_to_canvas(map_data, file_pos.x,
                                                 file_pos.y, true);

            let file_sprite = Sprite({
                    x: file_canvas_pos.x + 3,
                    y: file_canvas_pos.y + 3,
                    height: Math.floor(cell_size/2),
                    width: Math.floor(cell_size/2),
                    offset: 5,
                    render() {
                        render_file(this, this.context)
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
                player_pos = canvas_to_grid(map, this.player.x, this.player.y),
                enemy_pos = canvas_to_grid(map, this.enemy.x, this.enemy.y);

            if (player_pos.x == enemy_pos.x && player_pos.y == enemy_pos.y) {
                this.hide()
                return
            }

            this.map_sprite.update();

            this.player.update();
            this.enemy.update();

            for (let i = 0; i < this.files.length; i++){
                let file = this.files[i],
                    file_pos = canvas_to_grid(map, file.x, file.y)

                file.update()

                if (player_pos.x == file_pos.x && player_pos.y == file_pos.y) {
                    this.files.splice(i, 1)
                    this.collected_files++

                    // increase enemy's speed
                    this.enemy.current_speed += this.enemy.speed_increment

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

        this.lookAt(this.player)
    },
    render: function() {
        this.map_sprite.render();

        for (let i = 0; i < this.files.length; i++){
            this.files[i].render()
        }
        this.player.render();
        this.enemy.render();

        if (!this.playable) {
            this.level_title.render()
        }
    },
    onShow: function() {
        this.victory = false
        this.current_level = 0
        this.playable = false

        this.camera.width = this.canvas.width
        this.camera.height = this.canvas.height

        this.start_level()
    },
    onHide: function() {},
})
