
//Buffer is allocated for previews starting from this index
var buffer_preview_start = 2500000;
//Number of vertices to be drawn for preview
var preview_index = 0;

//Draw a circle to show the brush cursor
function draw_brush_preview(mouse_loc, rect) {
	reset_preview();
	
	var prev_color = chosen_color;
	chosen_color = vec4(0.0, 0.0, 0.0, 1.0);
	draw_brush_border(mouse_loc[0] - 5, mouse_loc[1] - 5, mouse_loc[0] + 5, mouse_loc[1] + 5, rect);
	chosen_color = prev_color;
}

//Draw previews for shapes
function draw_shape_preview(start_loc, mouse_loc, rect) {
	reset_preview();
	
	if (mode === 2 || mode === 3)
		shape_preview_rectangle(start_loc[0], start_loc[1], mouse_loc[0], mouse_loc[1], rect);
	else if (mode === 4 || mode === 5)
		shape_preview_triangle(start_loc[0], start_loc[1], mouse_loc[0], mouse_loc[1], rect);
	else if (mode === 6 || mode === 7)
		shape_preview_ellipse(start_loc[0], start_loc[1], mouse_loc[0], mouse_loc[1], rect);
}

//Draw a border for showing the copy borders
function draw_copy_preview(start_loc, mouse_loc, rect) {
	reset_preview();
	
	const prev_color = chosen_color;
	chosen_color = vec4(0.0, 0.0, 0.0, 1.0);
	
	copy_preview(start_loc[0], start_loc[1], mouse_loc[0], mouse_loc[1], rect);
	chosen_color = prev_color;
	
}

//Draw a border for showing the paste borders
function draw_paste_preview(mouse_loc, rect) {
	reset_preview();
	
	const prev_color = chosen_color;
	chosen_color = vec4(0.0, 0.0, 0.0, 1.0);
	
	paste_preview(mouse_loc[0], mouse_loc[1], rect);
	chosen_color = prev_color;
}

function reset_preview() {
	//Reset all the previous previews
	preview_index = 0;
}

//Draw a pixel into the preview buffer
function pixel_preview(x, y, optional_z_coordinate) {
	var len = 0.005;
	if (optional_z_coordinate) {
		triangle_preview(vec2(x - len/2, y + len/2), vec2(x - len/2, y - len/2), vec2(x + len/2, y - len/2), chosen_color, optional_z_coordinate);
		triangle_preview(vec2(x + len/2, y + len/2), vec2(x + len/2, y - len/2), vec2(x - len/2, y + len/2), chosen_color, optional_z_coordinate);
	}
	else {
		triangle_preview(vec2(x - len/2, y + len/2), vec2(x - len/2, y - len/2), vec2(x + len/2, y - len/2), chosen_color);
		triangle_preview(vec2(x + len/2, y + len/2), vec2(x + len/2, y - len/2), vec2(x - len/2, y + len/2), chosen_color);
	}

}

//Draw a triangle into the preview buffer
function triangle_preview( a, b, c, color, optional_z_coordinate )
{
	const z_coordinate = optional_z_coordinate || get_current_z();
	
	a[2] = z_coordinate;
	b[2] = z_coordinate;
	c[2] = z_coordinate;
	
	const curr_index = buffer_preview_start + preview_index;
	const three_vertices = [a,b,c];
	
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
	gl.bufferSubData(gl.ARRAY_BUFFER, 12*curr_index, flatten(three_vertices.flat()));
	
	const three_colors = [color,color,color];
	
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 16*curr_index, flatten(three_colors.flat()));
	preview_index += 3;
}

//Almost the same as draw_ellipse function
function draw_brush_border(x_begin, y_begin, x_end, y_end, rect) {
	var small_x = Math.min(x_begin, x_end);
	var big_x = Math.max(x_begin, x_end);
	
	var small_y = Math.min(y_begin, y_end);
	var big_y = Math.max(y_begin, y_end);
	
	var center_x = (small_x + big_x) / 2;
	var center_y = (small_y + big_y) / 2;
	
	var radius_hor = big_x - center_x;
	var radius_vert = big_y - center_y;
	
	for (var i = small_x; i <= big_x; i++) {
		for (var j = small_y; j <= big_y; j++) {
			var dist = ((i - center_x) * (i - center_x)) / (radius_hor * radius_hor) + ((j - center_y) * (j - center_y)) / (radius_vert * radius_vert);
			if (dist <= 1 && dist >= (1 - 2 * shape_thickness)) {
				
				var normalizedX = ((i - rect.left) - canvas.width/2)/(canvas.width/2);
				var normalizedY = (canvas.height/2 - (j - rect.top))/(canvas.height/2);
				pixel_preview(normalizedX, normalizedY, get_top_layer_z());
			}
		}
	}
}

//Compute all the vertices for a preview, and just draw a single triangle
//No need to draw pixel by pixel since it will not be erased
function shape_preview_triangle(x_begin, y_begin, x_end, y_end, rect) {
	var v1 = vec2(x_end, y_end);
	var center = vec2(x_begin, y_begin);
	var edge_len = 4 * length(subtract(v1, center)) / Math.sqrt(3);
	
	var v1_bisector = mix(v1, center, 2);
	var bisector_normal = normalize(vec2(-subtract(v1_bisector, v1)[1], subtract(v1_bisector, v1)[0]));
	
	var v2 = add(v1_bisector, scale(0.5 * edge_len, bisector_normal));
	var v3 = add(v1_bisector, scale(-0.5 * edge_len, bisector_normal));
	
	var normalized_v1 = normalize_2d(v1, rect);
	var normalized_v2 = normalize_2d(v2, rect);
	var normalized_v3 = normalize_2d(v3, rect);
	
	triangle_preview(normalized_v1, normalized_v2 ,normalized_v3, chosen_color);
}


//Draw two large triangles for a rectangle preview
//No need to draw pixel by pixel since it will not be erased
function shape_preview_rectangle(x_begin, y_begin, x_end, y_end, rect) {
	var small_x = Math.min(x_begin, x_end);
	var big_x = Math.max(x_begin, x_end);
	
	var small_y = Math.min(y_begin, y_end);
	var big_y = Math.max(y_begin, y_end);
	
	var normalized_v1 = normalize_2d(vec2(small_x, small_y), rect);
	var normalized_v2 = normalize_2d(vec2(small_x, big_y), rect);
	var normalized_v3 = normalize_2d(vec2(big_x, small_y), rect);
	var normalized_v4 = normalize_2d(vec2(big_x, big_y), rect);
	
	triangle_preview(normalized_v1, normalized_v2 ,normalized_v3, chosen_color);
	triangle_preview(normalized_v2, normalized_v3 ,normalized_v4, chosen_color);
}

//Draw 360 large triangles for an ellipse preview
//No need to draw pixel by pixel since it will not be erased
function shape_preview_ellipse(x_begin, y_begin, x_end, y_end, rect) {
	var small_x = Math.min(x_begin, x_end);
	var big_x = Math.max(x_begin, x_end);
	
	var small_y = Math.min(y_begin, y_end);
	var big_y = Math.max(y_begin, y_end);
	
	var center_x = (small_x + big_x) / 2;
	var center_y = (small_y + big_y) / 2;
	
	var radius_hor = big_x - center_x;
	var radius_vert = big_y - center_y;

	var center = vec2(center_x, center_y);
	var normalized_center = normalize_2d(center, rect);
	var angle_per_tri = 2 * Math.PI / 360;
	for (var i = 0; i < 360; i++) {
		var v1 = vec2(center_x + radius_hor * Math.cos(angle_per_tri * i), center_y + radius_vert * Math.sin(angle_per_tri * i));
		var v2 = vec2(center_x + radius_hor * Math.cos(angle_per_tri * (i + 1)), center_y + radius_vert * Math.sin(angle_per_tri * (i + 1)));
		var normalized_v1 = normalize_2d(v1, rect);
		var normalized_v2 = normalize_2d(v2, rect);
		
		triangle_preview(normalized_v1, normalized_v2 , normalized_center, chosen_color);
	}
}

function copy_preview(x_begin, y_begin, x_end, y_end, rect) {
	shape_preview_rectangle(x_begin, y_begin, x_begin + 1, y_end, rect);
	shape_preview_rectangle(x_begin, y_begin, x_end, y_begin + 1, rect);
	shape_preview_rectangle(x_end, y_begin, x_end - 1, y_end, rect);
	shape_preview_rectangle(x_end, y_end, x_begin, y_end - 1, rect);
}

function paste_preview(x_begin, y_begin, rect) {
	copy_preview(x_begin, y_begin, x_begin + copy_size[0], y_begin + copy_size[1], rect);
}

function render_preview() {
    gl.drawArrays( gl.TRIANGLES, buffer_preview_start, preview_index );
}