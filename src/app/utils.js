// flags for each direction
export const DIRS = {
	RIGHT: 1,
	BOTTOM: 2,
	LEFT: 4,
	TOP: 8,
}

export const ALLDIRS = DIRS.RIGHT | DIRS.BOTTOM | DIRS.LEFT | DIRS.TOP

// code from https://truetocode.com/binary-treemax-heap-priority-queue-and-implementation-using-javascript/427/
class minHeap {
	constructor(array) {
		this.array = [null, ...array];
		this.size = array.length;
	}
	arrange(idx) {
		while (idx > 1 && this.compare(Math.floor(idx / 2), idx)) {
			this.swap(idx, Math.floor(idx / 2));
			idx = Math.floor(idx / 2);
		}
	}
	heaper(idx1) {
		while (2 * idx1 <= this.size) {
			let idx2 = 2 * idx1;
			if (idx2 < this.size && this.compare(idx2, idx2 + 1)) idx2++;
			if (!this.compare(idx1, idx2)) break;
			this.swap(idx1, idx2);
			idx1 = idx2;
		}
	}
	insert(element) {
		this.array[++this.size] = element;
		this.arrange(this.size);
	}
	rootdelete() {
		let max = this.array[1];

		this.swap(1, this.size--);
		this.heaper(1);

		this.array[this.size + 1] = null;

		return max;
	}
	compare(idx1, idx2) {
		return this.array[idx1].priority > this.array[idx2].priority;
	}
	swap(idx1, idx2) {
		const temp = this.array[idx1];
		this.array[idx1] = this.array[idx2];
		this.array[idx2] = temp;
	}
}

export let randint = function(upper, lower=0) {
    return Math.floor(Math.random() * (upper - lower)) + lower;
}

export let grid_to_canvas = function(map, x, y, align_to_grid=false) {
	if (align_to_grid) {
		return {
			x: x * map.cell_size,
			y: y * map.cell_size,
		}
	}

	let new_x = x * map.cell_size + Math.floor(map.cell_size/2),
	    new_y = y * map.cell_size + Math.floor(map.cell_size/2);

	return {x: new_x, y: new_y};
}

export let canvas_to_grid = function(map, x, y) {
	let new_x = Math.floor(x / map.cell_size),
	    new_y = Math.floor(y / map.cell_size);

	return {x: new_x, y: new_y};
}

export let can_move = function(position, map, dir) {
	if (map.type == 'map') {
		if (dir & DIRS.TOP) {
			return (position.y > 0 && map.grid[position.x][position.y - 1])
		}
		if (dir & DIRS.LEFT) {
			return (position.x > 0 && map.grid[position.x - 1][position.y])
		}
		if (dir & DIRS.BOTTOM) {
			return (position.y < map.height &&
				    map.grid[position.x][position.y + 1])
		}
		if (dir & DIRS.RIGHT) {
			return (position.x < map.width &&
				    map.grid[position.x + 1][position.y])
		}
	} else if (map.type == 'maze') {
		if (dir & DIRS.TOP) {
			return (position.y > 0 &&
				    !(map.grid[position.x][position.y] & DIRS.TOP))
		}
		if (dir & DIRS.LEFT) {
			return (position.x > 0 &&
				    !(map.grid[position.x][position.y] & DIRS.LEFT))
		}
		if (dir & DIRS.BOTTOM) {
			return (position.y < map.height &&
				    !(map.grid[position.x][position.y] & DIRS.BOTTOM))
		}
		if (dir & DIRS.RIGHT) {
			return (position.x < map.width &&
				    !(map.grid[position.x][position.y] & DIRS.RIGHT))
		}
	}

}

export let next_pos = function(position, dir) {
	if (dir & DIRS.TOP) {
		return {x: position.x, y: position.y - 1}
	}
	if (dir & DIRS.LEFT) {
		return {x: position.x - 1, y: position.y}
	}
	if (dir & DIRS.BOTTOM) {
		return {x: position.x, y: position.y + 1}
	}
	if (dir & DIRS.RIGHT) {
		return {x: position.x + 1, y: position.y}
	}
}

export let calc_dir_from_move = function(start, end) {
	if (start.y - 1 == end.y) return DIRS.TOP
	if (start.y + 1 == end.y) return DIRS.BOTTOM
	if (start.x - 1 == end.x) return DIRS.LEFT
	if (start.x + 1 == end.x) return DIRS.RIGHT
}

export let dir_to_rot = function(dir) {
	if (dir == DIRS.RIGHT) return 0
	if (dir == DIRS.TOP) return -Math.PI/2
	if (dir == DIRS.LEFT) return -3*Math.PI
	if (dir == DIRS.BOTTOM) return -3*Math.PI/2
}

export let heuristic = function(a, b) {
	return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

// based on this post https://www.redblobgames.com/pathfinding/a-star/introduction.html
export let astar = function(map, start, end) {
	let frontier = new minHeap([])
	frontier.insert({pos:start, priority:0 })

	let came_from = {}
	let cost_so_far = {}

	came_from[Object.values(start)] = null
	cost_so_far[Object.values(start)] = 0

	while (frontier.size > 0) {
		let current = frontier.rootdelete().pos,
		    current_index = Object.values(current)

		if (current.x == end.x && current.y == end.y)
			break

		let allowed_dirs = Object.keys(DIRS)
		                     .filter((x) => can_move(current, map, DIRS[x]))
		                     .map((x) => DIRS[x])

		for (let dir in allowed_dirs) {
			let next = next_pos(current, allowed_dirs[dir]),
			    next_index = Object.values(next),
			    new_cost = cost_so_far[current_index] + 1

			if (!(next_index in cost_so_far) ||
				new_cost < cost_so_far[next_index]) {
				cost_so_far[next_index] = new_cost
				let priority = new_cost + heuristic(end, next)
				frontier.insert({pos:next, priority:priority})
				came_from[next_index] = current
			}
		}
	}

	if (came_from[Object.values(end)] == null) {
		return {
			path: [],
			cost: 0
		}
	}

	let path = [end]
	let current = end
	while (!(current.x == start.x && current.y == start.y)) {
		let current_index = Object.values(current)
		current = came_from[current_index]
		path.push(current)
	}


	return {
		path: path.reverse(),
		cost: cost_so_far
	}
}