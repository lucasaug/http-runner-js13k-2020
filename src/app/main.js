import { init, GameLoop } from 'kontra';

import './maze'
import { DIFFICULTY, GAMESTATES, CELL_SIZE } from './constants'
import { title_scene, SCREENS} from './title_scene'
import { running_scene, file_collected_text } from './game_scene'
import { player } from './player'
import { enemy } from './enemy'

let { canvas, context } = init();

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// disable default keyboard scrolling controls
window.addEventListener("keydown", function(e) {
    // space and arrow keys
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);


let SCENE_MAP = {
    [GAMESTATES.TITLE]: title_scene,
    [GAMESTATES.RUNNING]: running_scene,
}

let NEXT_STATE = {
    [GAMESTATES.TITLE]: GAMESTATES.RUNNING,
    [GAMESTATES.RUNNING]: GAMESTATES.TITLE,
}

let current_state = GAMESTATES.TITLE

title_scene.canvas = canvas
running_scene.canvas = canvas

let loop = GameLoop({
    update: function() {
        let curr_scene = SCENE_MAP[current_state]

        if (!curr_scene.hidden) {
            curr_scene.update();
        } else {
            let victory = false
            if (current_state == GAMESTATES.RUNNING) {
                victory = curr_scene.victory
            }

            current_state = NEXT_STATE[current_state]
            curr_scene = SCENE_MAP[current_state]

            if (current_state == GAMESTATES.TITLE) {
                if (victory)
                    curr_scene.current_screen = SCREENS.VICTORY
                else
                    curr_scene.current_screen = SCREENS.GAMEOVER
            } else if (current_state == GAMESTATES.RUNNING) {
                curr_scene.difficulty = title_scene.difficulty;
                curr_scene.player = player;
                curr_scene.enemy = enemy;
            }

            curr_scene.canvas = canvas
            curr_scene.show()
        }
    },
    render: function() {
        context.fillStyle = 'black'
        //context.fillRect(-10000, -10000, 20000, 20000)
        let curr_scene = SCENE_MAP[current_state]
        curr_scene.render();
        if (current_state == GAMESTATES.RUNNING) file_collected_text.render()
    }

});


title_scene.show()
loop.start();
