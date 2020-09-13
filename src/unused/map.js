TRY_LIMIT = 1000

create_mat = function(width, height, fill = 0) {
	mat = []
	mat.length = height

	for (i = 0; i < height; i++) {
		// https://stackoverflow.com/questions/1295584/most-efficient-way-to-create-a-zero-filled-javascript-array#comment53285905_23326623
		(row = []).length = width
		row.fill(fill)
		mat[i] = row
	}

	return mat
}

randint = function(upper, lower=0) {
	return Math.floor(Math.random() * (upper - lower)) + lower
}

intersect = function(a, b, min_distance = 0) {
	let max_norm = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))

	return max_norm - min_distance <= a.radius + b.radius
}

add_room = function(map, room) {
	map.rooms.push(room)

	for (let i = room.x - room.radius; i <= room.x + room.radius; i++) {
		for (let j = room.y - room.radius; j <= room.y + room.radius; j++) {
			map.grid[i][j] = 1
		}
	}
}

fit_room = function(map, room, min_radius) {
	for (let i = 0; i < map.rooms.length; i++) {
		while (room.radius >= min_radius) {
			if (intersect(room, map.rooms[i], 2)) {
				room.radius -= 1
			} else {
				break
			}
		}

		if (room.radius < min_radius) {
			return false
		}
	}
	return true
}

gen_rooms = function(map, num_rooms, min_radius, max_radius) {
	let start_room = {
		x: map.start.x,
		y: map.start.y,
		radius: max_radius,
	}

	add_room(map, start_room)

	for (let i = 0; i < num_rooms; i++) {
		let num_tries = 0

		while (num_tries < TRY_LIMIT) {
			let radius = randint(max_radius + 1, min_radius)

			let room = {
				x: randint(map.width - radius - 1, radius + 2),
			    y: randint(map.height - radius - 1, radius + 2),
			    radius: radius
			}

			let allowed = true;

			allowed = fit_room(map, room, min_radius)

			if (allowed) {
				add_room(map, room)
				break
			} else {
				num_tries += 1
			}
		}

		// if (num_tries == TRY_LIMIT) {
		// 	throw Error("Unable to fit all the rooms")
		// }
	}
}

gen_map = function(width, height, cell_size, start, num_rooms, min_radius,
	               max_radius, debug=false) {
	map = {
		type: 'map',
		grid: create_mat(width, height),
		start: start,
		width: width,
		height: height,
		cell_size: cell_size,
		rooms: [],
		debug: debug
	}

	gen_rooms(map, num_rooms, min_radius, max_radius)

	return map
}

render_map = function(map, canvas, context) {
	context.fillStyle = 'black'
	context.fillRect(-10000, -10000, 20000, 20000)
	context.beginPath();
	map.grid.forEach((row, i) => {
		row.forEach((cell, j) => {
			if (cell) {
				context.fillStyle = 'white'
			} else {
				context.fillStyle = 'black'
			}
			context.strokeStyle = 'black'
			let position = grid_to_canvas(map, i, j)
			position.x -= Math.floor(map.cell_size/2)
			position.y -= Math.floor(map.cell_size/2)
			context.fillRect(position.x, position.y, map.cell_size,
				             map.cell_size)
			if (map.debug) {
				context.strokeRect(position.x, position.y, map.cell_size,
					             map.cell_size)
			}
		})
	})

	// draw exit
	exit_x = map.start.x * map.cell_size
	exit_y = map.start.y * map.cell_size
	context.fillStyle = 'red'
	context.fillRect(exit_x, exit_y, map.cell_size, map.cell_size)

	if (map.debug) {
		map.rooms.forEach((room) => {
			context.fillStyle = 'red'
			let position = grid_to_canvas(map, room.x, room.y)
			position.x -= Math.floor(map.cell_size/2)
			position.y -= Math.floor(map.cell_size/2)
			context.fillRect(position.x, position.y, map.cell_size,
		             map.cell_size)
		})
	}

	context.stroke();
}
