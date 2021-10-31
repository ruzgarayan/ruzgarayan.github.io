//All the currently copied vertices and their colors
var copied_vertices = [];
var copied_colors = [];

//Id of the layer that copy was done at
var copied_layer_id = 0;

//Size of the copy area
var copy_size = vec2(0, 0);

function copy_selection(x_begin, y_begin, x_end, y_end, rect) {
	copied_vertices = [];
	copied_colors = [];
	
	copy_size = vec2(Math.abs(x_end-x_begin), Math.abs(y_end-y_begin));
	copied_layer_id = chosen_layer_id;
	
	var small_x = normalize_x(Math.min(x_begin, x_end), rect);
	var big_x = normalize_x(Math.max(x_begin, x_end), rect);

	//Big and small are reversed since normalizing reverses the direction
	var small_y = normalize_y(Math.max(y_begin, y_end), rect);
	var big_y = normalize_y(Math.min(y_begin, y_end), rect);
	
	var top_left = vec2(small_x, small_y);
	
	//For all the strokes in the selected layer and all their vertices, choose the ones inside the copy area 
	for (var i = 0; i < strokes.length; i++) {
		const stroke = strokes[i];
		if (!is_stroke_selected(stroke)) continue;
		
		const vertices = stroke.vertices;
		const num_vertices = stroke.vertices.length;
		
		for (var j = 0; j < num_vertices; j += 3) {
			if (inside_selection(vertices[j], small_x, small_y, big_x, big_y)) {
				const relative_v1 = loc_relative(vertices[j], top_left);
				const relative_v2 = loc_relative(vertices[j + 1], top_left);
				const relative_v3 = loc_relative(vertices[j + 2], top_left);
				copied_vertices.push(relative_v1);
				copied_vertices.push(relative_v2);
				copied_vertices.push(relative_v3);
		
				const color = stroke.properties.type === 'Paste' ? stroke.colors[i] : stroke.properties.color;
				copied_colors.push(color);
				copied_colors.push(color);
				copied_colors.push(color);
			}
		}
	}
}

//Paste the copied vertices into the selected layer
function paste_selection(x_begin, y_begin, rect) {
	const normalized_x = normalize_x(x_begin, rect);
	const normalized_y = normalize_y(y_begin + copy_size[1], rect);
	const z_coord = get_layer_z(chosen_layer_id);
	
	for(var i = 0; i < copied_vertices.length; i += 3) {
		const v1 = vec3(copied_vertices[i][0] + normalized_x, copied_vertices[i][1] + normalized_y, z_coord);
		const v2 = vec3(copied_vertices[i + 1][0] + normalized_x, copied_vertices[i + 1][1] + normalized_y, z_coord);
		const v3 = vec3(copied_vertices[i + 2][0] + normalized_x, copied_vertices[i + 2][1] + normalized_y, z_coord);
		
		triangle(v1, v2, v3, copied_colors[i]);
	}
}

function loc_relative(point, relative_point){
	return vec3(point[0] - relative_point[0], point[1] - relative_point[1]);
}

function inside_selection(point, small_x, small_y, big_x, big_y) {
	return (point[0] <= big_x && point[0] >=  small_x && point[1] <= big_y && point[1] >= small_y);
}