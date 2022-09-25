

function draw_shape(x_begin, y_begin, x_end, y_end, rect) {
	switch (mode) {
		case 2:
			draw_rectangle(true, x_begin, y_begin, x_end, y_end, rect);
			break;
		case 3:
			draw_rectangle(false, x_begin, y_begin, x_end, y_end, rect);
			break;
		case 4:
			draw_triangle(true, x_begin, y_begin, x_end, y_end, rect);
			break;
		case 5:
			draw_triangle(false, x_begin, y_begin, x_end, y_end, rect);
			break;
		case 6:
			draw_ellipse(true, x_begin, y_begin, x_end, y_end, rect);
			break;
		case 7:
			draw_ellipse(false, x_begin, y_begin, x_end, y_end, rect);
			break;
	}
}

function draw_rectangle(filled, x_begin, y_begin, x_end, y_end, rect) {
	var small_x = Math.min(x_begin, x_end);
	var big_x = Math.max(x_begin, x_end);
	
	var small_y = Math.min(y_begin, y_end);
	var big_y = Math.max(y_begin, y_end);
	
	var thickness_pixels = shape_thickness * ((big_y - small_y) + (big_x - small_x)) / 4; //Divide by 4 to share between all edges
	
	for (var i = small_x; i <= big_x; i++) {
		for (var j = small_y; j <= big_y; j++) {
			if (!filled && (
				(i > small_x + thickness_pixels && i < big_x - thickness_pixels)
				&& ((j > small_y + thickness_pixels && j < big_y - thickness_pixels))
			)) continue;
			
			var normalizedX = ((i - rect.left) - canvas.width/2)/(canvas.width/2);
			var normalizedY = (canvas.height/2 - (j - rect.top))/(canvas.height/2);
			pixel(normalizedX, normalizedY);
		}
	}
}

//Mouse down position is taken as the center of the triangle.
//Mouse up position is taken as one of the vertices of triangle.
//Drawing an equilateral triangle according to this center and vertex.
function draw_triangle(filled, x_begin, y_begin, x_end, y_end, rect) {
	
	var v1 = vec2(x_end, y_end);
	var center = vec2(x_begin, y_begin);
	var edge_len = 4 * length(subtract(v1, center)) / Math.sqrt(3);
	
	var v1_bisector = mix(v1, center, 2);
	var bisector_normal = normalize(vec2(-subtract(v1_bisector, v1)[1], subtract(v1_bisector, v1)[0]));
	
	//Compute the other two vertices
	var v2 = add(v1_bisector, scale(0.5 * edge_len, bisector_normal));
	var v3 = add(v1_bisector, scale(-0.5 * edge_len, bisector_normal));
	
	//To allow unfilled vertices, define vertices of a smaller triangle inside
	var v1_inner = mix(v1, center, shape_thickness);
	var v2_inner = mix(v2, center, shape_thickness / 2);
	var v3_inner = mix(v3, center, shape_thickness / 2);
	
	var small_x = Math.min(v1[0], v2[0], v3[0]);
	var big_x = Math.max(v1[0], v2[0], v3[0]);
	
	var small_y = Math.min(v1[1], v2[1], v3[1]);
	var big_y = Math.max(v1[1], v2[1], v3[1]);
	
	//For all possible pixel locations, test if they should be painted
	for (var i = small_x; i <= big_x; i++) {
		for (var j = small_y; j <= big_y; j++) {
			var point = vec2(i, j);
			
			//For filled triangles, check if point is in the original triangle
			//For unfilled triangles, also check if point is not in the inner triangle
			if ((filled && point_in_triangle(v1, v2, v3, point))
				|| (!filled && point_in_triangle(v1, v2, v3, point) && !point_in_triangle(v1_inner, v2_inner, v3_inner, point)))
			{ 
				var normalizedX = ((i - rect.left) - canvas.width/2)/(canvas.width/2);
				var normalizedY = (canvas.height/2 - (j - rect.top))/(canvas.height/2);
				pixel(normalizedX, normalizedY);
			}
		}
	}
}

//Method for checking a point lies inside a triangle
//Reference: barycentric coordinate system equations from
//http://totologic.blogspot.com/2014/01/accurate-point-in-triangle-test.html
function point_in_triangle(v1, v2, v3, point) {
	var a = ((v2[1] - v3[1])*(point[0] - v3[0]) + (v3[0] - v2[0])*(point[1] - v3[1])) / ((v2[1] - v3[1])*(v1[0] - v3[0]) + (v3[0] - v2[0])*(v1[1] - v3[1]));
	var b = ((v3[1] - v1[1])*(point[0] - v3[0]) + (v1[0] - v3[0])*(point[1] - v3[1])) / ((v2[1] - v3[1])*(v1[0] - v3[0]) + (v3[0] - v2[0])*(v1[1] - v3[1]));
	var c = 1 - a - b;
	
	return ((a >= 0 && a <= 1) && (b >= 0 && b <= 1) && (c >= 0 && c <= 1));
}

function draw_ellipse(filled, x_begin, y_begin, x_end, y_end, rect) {
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
			
			//For filled ellipses, take all points with small enough distance
			//For unfilled ellipses, don't take the points with very small distance 
			if ((filled && dist <= 1) || (!filled && dist <= 1 && dist >= (1 - 2 * shape_thickness))) {
				
				var normalizedX = ((i - rect.left) - canvas.width/2)/(canvas.width/2);
				var normalizedY = (canvas.height/2 - (j - rect.top))/(canvas.height/2);
				pixel(normalizedX, normalizedY);
			}
		}
	}
}