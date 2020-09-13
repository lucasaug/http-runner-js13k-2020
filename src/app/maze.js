import { ALLDIRS, DIRS } from './utils'

let create_mat = function(width, height, fill = 0) {
	let mat = [];
	mat.length = height;

	for (let i = 0; i < height; i++) {
		// https://stackoverflow.com/questions/1295584/most-efficient-way-to-create-a-zero-filled-javascript-array#comment53285905_23326623
		let row = [];
		row.length = width;
		row.fill(fill);
		mat[i] = row;
	}

	return mat;
}

let allowed_dirs_maze = function(visited, x, y, only_visited=false) {
	let allowed = [],
	    width = visited[0].length,
	    height = visited.length;

	if (only_visited) {
		if (x + 1 < width && visited[x + 1][y] && only_visited) {
			allowed.push(DIRS.RIGHT);
		}
		if (y + 1 < height && visited[x][y + 1] && only_visited) {
			allowed.push(DIRS.BOTTOM);
		}
		if (x - 1 >= 0 && visited[x - 1][y] && only_visited) {
			allowed.push(DIRS.LEFT);
		}
		if (y - 1 >= 0 && visited[x][y - 1] && only_visited) {
			allowed.push(DIRS.TOP);
		}
	} else {
		if (x + 1 < width && !visited[x + 1][y] && !only_visited) {
			allowed.push(DIRS.RIGHT);
		}
		if (y + 1 < height && !visited[x][y + 1] && !only_visited) {
			allowed.push(DIRS.BOTTOM);
		}
		if (x - 1 >= 0 && !visited[x - 1][y] && !only_visited) {
			allowed.push(DIRS.LEFT);
		}
		if (y - 1 >= 0 && !visited[x][y - 1] && !only_visited) {
			allowed.push(DIRS.TOP);
		}
	}

	return allowed;
}

let move_dir = function(grid, x, y, dir) {
	let new_x = x,
	    new_y = y;

	if (dir & DIRS.RIGHT) {
		grid[x][y] &= ~DIRS.RIGHT;
		grid[x+1][y] &= ~DIRS.LEFT;
		new_x += 1;
	}
	if (dir & DIRS.BOTTOM) {
		grid[x][y] &= ~DIRS.BOTTOM;
		grid[x][y+1] &= ~DIRS.TOP;
		new_y += 1;
	}
	if (dir & DIRS.LEFT) {
		grid[x][y] &= ~DIRS.LEFT;
		grid[x-1][y] &= ~DIRS.RIGHT;
		new_x -= 1;
	}
	if (dir & DIRS.TOP) {
		grid[x][y] &= ~DIRS.TOP;
		grid[x][y-1] &= ~DIRS.BOTTOM;
		new_y -= 1;
	}

	return {x: new_x, y: new_y};
}

let backtracking_step = function(maze, path, visited) {
	if (path.length == 0) return;

	let current = path[path.length - 1],
	    x = current.x,
	    y = current.y;

	let to_try = allowed_dirs_maze(visited, x, y),
	    try_len = to_try.length;

	visited[x][y] = 1;
	if (try_len > 0){
		let selected_dir = to_try[Math.floor(Math.random() * try_len)];
		path.push(move_dir(maze.grid, x, y, selected_dir));
	} else {
		// Always opens a random direction, change if statement to make this
		// happen less often
		if (Math.random() > 0) {
			// open a random allowed direction
			let to_open = allowed_dirs_maze(visited, x, y, true);
			let open_len = to_open.length;

			if (open_len > 0) {
				let random_index = Math.floor(Math.random() * open_len);
				let selected_dir = to_open[random_index];
				move_dir(maze.grid, x, y, selected_dir);
			}
		}

		path.pop();
	}
}


let recursive_backtracking = function(maze, path, visited) {
	while (path.length > 0) {
		backtracking_step(maze, path, visited);
	}
}

export let gen_maze = function(width, height, cell_size, start, debug=false) {
	let grid = create_mat(width, height, ALLDIRS);
	move_dir(grid, start.x, start.y, ALLDIRS);

	// generation configs
	let visited = create_mat(width, height),
		path = [start];

	let maze = {
		type: 'maze',
		grid: grid,
		width: width,
		height: height,
		cell_size: cell_size,
		exit: start,
		debug: debug
	};

	if (!debug) recursive_backtracking(maze, path, visited);
	return {
		maze: maze,
		visited: visited,
		path: path
	};
}

let draw_cell = function(context, cell, x, y, cell_size, visited = false,
	                 debug = false) {
	let vertices = [
		{ x: x * cell_size + cell_size, y: y * cell_size},
		{ x: x * cell_size + cell_size, y: y * cell_size  + cell_size},
		{ x: x * cell_size, y: y * cell_size + cell_size},
		{ x: x * cell_size, y: y * cell_size},
	];

	if (debug) {
		if (visited) {
		    context.fillStyle = 'pink';
			context.fillRect(vertices[3].x, vertices[3].y, cell_size,
				             cell_size);
		} else {
		    context.fillStyle = 'black';
			context.fillRect(vertices[3].x, vertices[3].y, cell_size,
				             cell_size);
		}
	}

	if (cell & DIRS.RIGHT) {
		context.moveTo(vertices[0].x, vertices[0].y);
		context.lineTo(vertices[1].x, vertices[1].y);
	}
	if (cell & DIRS.BOTTOM) {
		context.moveTo(vertices[1].x, vertices[1].y);
		context.lineTo(vertices[2].x, vertices[2].y);
	}
	if (cell & DIRS.LEFT) {
		context.moveTo(vertices[2].x, vertices[2].y);
		context.lineTo(vertices[3].x, vertices[3].y);
	}
	if (cell & DIRS.TOP) {
		context.moveTo(vertices[3].x, vertices[3].y);
		context.lineTo(vertices[0].x, vertices[0].y);
	}

}

export let render_maze = function(maze, canvas, context, visited = false,
	                              path = []) {
	context.strokeStyle = 'green';
	context.fillStyle = 'black'
	//context.fillRect(0, 0, canvas.width, canvas.height)
	//context.fillRect(-10000, -10000, 20000, 20000);
	context.beginPath();
	maze.grid.forEach((row, i) => {
		row.forEach((cell, j) => {
			let is_visited = 0;
			if (visited && visited[i][j]) is_visited = 1;
			draw_cell(context, cell, i, j, maze.cell_size, is_visited,
				      maze.debug);
		})
	})

	// draw exit
	let exit_x = maze.exit.x * maze.cell_size,
	    exit_y = maze.exit.y * maze.cell_size;
	context.fillStyle = 'white';
	context.fillRect(exit_x, exit_y, maze.cell_size, maze.cell_size);

	/*if (maze.debug) {
		path.forEach((cell) => {
			x = cell.x * maze.cell_size
			y = cell.y * maze.cell_size
			context.fillStyle="yellow"
			context.fillRect(x, y, maze.cell_size, maze.cell_size)
		})

		if (path.length > 0) {
			cell = path[path.length - 1]
			x = cell.x * maze.cell_size
			y = cell.y * maze.cell_size
			context.fillStyle="orange"
			context.fillRect(x, y, maze.cell_size, maze.cell_size)
		}
	}*/

	context.stroke();
}
