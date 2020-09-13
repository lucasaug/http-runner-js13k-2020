import { Sprite, initKeys, keyPressed } from 'kontra';

import { canvas_to_grid, can_move, DIRS } from './utils';

initKeys()

export let player = Sprite({
    radius: null,
    time: 0,
    last_moved: -60,
    cell_size: null,
    map: null,
    reset: function(x, y, cell_size) {
        this.x = x
        this.y = y
        this.cell_size = cell_size
        this.time = 0
        this.last_moved = -60
        this.radius = Math.floor(cell_size/2)
    },
    update: function() {
        this.time += 1

        if (this.time - this.last_moved >= 5 && this.map) {

            let delta = {
                x:0,
                y:0
            }

            let player_grid = canvas_to_grid(this.map, this.x, this.y)

            if ((keyPressed('w') || keyPressed('up')) &&
                can_move(player_grid, this.map, DIRS.TOP)){
                delta.y -= this.cell_size
            }
            else if ((keyPressed('a') || keyPressed('left')) &&
                can_move(player_grid, this.map, DIRS.LEFT)){
                delta.x -= this.cell_size
            }
            else if ((keyPressed('s') || keyPressed('down')) &&
                can_move(player_grid, this.map, DIRS.BOTTOM)){
                delta.y += this.cell_size
            }
            else if ((keyPressed('d') || keyPressed('right')) &&
                can_move(player_grid, this.map, DIRS.RIGHT)){
                delta.x += this.cell_size
            }

            this.x += delta.x
            this.y += delta.y
            this.last_moved = this.time
        }
    },
    render: function() {
        this.context.strokeStyle = 'green';
        this.context.fillStyle = 'green';
        this.context.beginPath();
        this.context.arc(0, 0, this.radius, 0, Math.PI*2);
        this.context.fill();
    }
})