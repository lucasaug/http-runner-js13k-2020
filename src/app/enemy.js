import { Sprite } from 'kontra';

import { astar, calc_dir_from_move, canvas_to_grid, dir_to_rot,
	     grid_to_canvas } from './utils';

import { play_sine } from './audio'

export let enemy = Sprite({
    height: null,
    base: null,
    rotation: 0,
    dt: 0,
    current_speed: 0,
    player: null,
    map: null,
    reset: function(x, y, cell_size, initial_speed, speed_increment) {
        this.x = x;
        this.y = y;
        this.rotation = 0;
        this.dt = 0;
        this.current_speed = initial_speed;
        this.speed_increment = speed_increment;
        this.base = Math.floor(cell_size/2);
        this.height = cell_size;
    },
    update: function() {
        if (this.map) {
            this.dt += 1;

            let player_pos = canvas_to_grid(this.map, this.player.x,
            	                            this.player.y),
                enemy_pos = canvas_to_grid(this.map, this.x, this.y);

            if (this.dt % Math.floor(60/this.current_speed) == 0) {
                let path_data = astar(this.map, enemy_pos, player_pos);

                let path_to_player = path_data["path"];

                if (path_to_player.length > 0) {
                    let dir = calc_dir_from_move(path_to_player[0],
                                                 path_to_player[1]);

                    this.rotation = dir_to_rot(dir);

                    let new_pos = grid_to_canvas(this.map, path_to_player[1].x,
                                                      path_to_player[1].y);
                    this.x = new_pos.x;
                    this.y = new_pos.y;

                    play_sine(110);
                }
            }
        }
    },
    render: function() {
	    this.context.strokeStyle = 'red';
	    this.context.fillStyle = 'red';

	    let base_h = Math.floor(this.base/2),
	        height_h = Math.floor(this.height/2);

	    this.context.beginPath();
	    this.context.moveTo(-height_h, -base_h);
	    this.context.lineTo(-height_h, base_h);
	    this.context.lineTo(height_h, 0);
	    this.context.closePath();
	    this.context.fill();

        /*if (DEBUG && this.map) {
            let player_pos = canvas_to_grid(this.map, player.x, player.y),
                enemy_pos = canvas_to_grid(this.map, this.x, this.y)

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
                next_node.x -= this.x
                next_node.y -= this.y
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
        }*/
    }
})
