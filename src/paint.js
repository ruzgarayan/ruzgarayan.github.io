//Two canvas and gl objects for the main painting area and the HSV color picker
var canvas, color_picker_canvas;
var gl, color_picker_gl;

var vbuffer;
var cbuffer;

//The list of strokes on the canvas
var strokes = [];
//Stack of undo-ed strokes to be able to redo them
var undo_stack = [];

//Vertices of the current stroke being drawn
//After mouse up, this stroke is registered into the strokes array
var stroke_vertices = [];
var stroke_color = vec4( 0.0, 0.0, 0.0, 1.0 );

//2D array boolean array for recording the already drawn pixels for the current stroke
//This prevents painting the same pixel multiple times in a single stroke
var drawn = Array(600).fill(0).map(x => Array(600).fill(false));

var mousedown = false;

//On a single stroke, the coordinates of the points that mouse has moved on
var dragged_points = [];

//These are for deciding the size of the initially allocated buffer
var maxNumTriangles = 1000000;  
var maxNumVertices  = 3 * maxNumTriangles;

//Number of vertices to be rendered
var index = 0;

//Incremental stroke id
var stroke_id = 0;

//Radius of the brush in pixels
var radius = 5;

//Shapeness ratio of the unfilled shapes
var shape_thickness = 0.1;

//Last position of the mouse recorded by the mousemove action
var last_mouse_pos;
//The location of the mouse at the last mousedown action
var mouse_down_pos;

//Chosen color and hue by the user
var chosen_color = vec4( 0.0, 0.0, 0.0, 1.0 );
var chosen_hue = 0.5;

/*
	0 Pen
	1 Eraser
	2 Filled Rectangle
	3 Unfilled Rectangle
	4 Filled Triangle
	5 Unfilled Triangle
	6 Filled Ellipse
	7 Unfilled Ellipse
	8 Copy
	9 Paste
*/
var mode = 0;
const mode_names = [
	"Pen",
	"Eraser",
	"Filled Rectangle",
	"Unfilled Rectangle",
	"Filled Triangle",
	"Unfilled Triangle",
	"Filled Ellipse",
	"Unfilled Ellipse",
	"Copy",
	"Paste"
];

window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
	
	canvas.onmousedown = function(ev){ mousedownAction(ev) };
	canvas.onmouseup = function(ev){ mouseupAction(ev) };
	canvas.onmousemove = function(ev){ mousemoveAction(ev, gl, canvas) };
	
	//Initilaze buttons for using the predefined colors
	for (var i = 0; i < 8; i++) {
		const choice = i;
		const colorbutton = document.getElementById("ColorButton" + choice);
		
		//Take the background color of the button here
		const style = getComputedStyle(colorbutton);
		const backgroundcolor_str = style['background-color'];
		const backgroundcolor = backgroundcolor_str.match(/\d+/g);
		const backgroundcolorvec =
			vec4(backgroundcolor[0] / 256, backgroundcolor[1] / 256, backgroundcolor[2] / 256, 1.0);
		
		colorbutton.addEventListener("click", function() {change_chosen_color(backgroundcolorvec);});
	}
	//Initially, set the color to black
	change_chosen_color(vec4(0.0, 0.0, 0.0, 1.0));

	document.getElementById("UndoButton").addEventListener("click", function(){undo()});
	document.getElementById("RedoButton").addEventListener("click", function(){redo()});
	document.getElementById("ClearButton").addEventListener("click", function(){clear()});
	document.getElementById("DownloadButton").addEventListener("click", function(){download()});
	document.getElementById("CopyButton").addEventListener("click", function(){mode = 8});
	document.getElementById("PasteButton").addEventListener("click", function(){mode = 9});
	
	//Handle loading a save file
	document.getElementById('InputFile')
		.addEventListener('change', function() {
		var fr = new FileReader();
		fr.readAsText(this.files[0]);
		fr.onload=function(){
			obj = fr.result;
			var parsed_strokes = JSON.parse(obj);
			
			strokes = parsed_strokes;
			index = 0;
			for (var i = 0; i < strokes.length; i++)
				index += strokes[i].vertices.length; 
			
			//Load all the vertices and vertex colors into the buffers and render
			const all_stroke_vertices = strokes.map((stroke) => stroke.vertices);
			gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(all_stroke_vertices.flat()));
			
			all_vertex_colors = [];
			for (var i = 0; i < strokes.length; i++) {
				if (strokes[i].properties.type === 'Paste')
					all_vertex_colors.push(strokes[i].colors);
				else
					all_vertex_colors.push(Array(strokes[i].vertices.length).fill(strokes[i].properties.color));
			}
			gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(all_vertex_colors.flat()));
			
			rebuffer_render();
		}
	})
	
	document.getElementById("Controls").onclick = function( event) {
        mode = event.srcElement.index;
		document.getElementById("selectedOption").innerHTML = "Selected: " + mode_names[mode];
    };

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, 12*maxNumVertices, gl.DYNAMIC_DRAW );
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 16*maxNumVertices, gl.DYNAMIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
	
	//Initialize the color picker canvas and gl
	init_color_picker();
	
	//Initialize multi-layer structure
	init_layers();
	
	//Render for the first time, other render calls are triggered by user interaction
    render();

}

function init_color_picker() {
	color_picker_canvas = document.getElementById( "gl-canvas-color-picker" );
    
    color_picker_gl = WebGLUtils.setupWebGL( color_picker_canvas );
    if ( !color_picker_gl ) { alert( "WebGL isn't available" ); }
	
	color_picker_canvas.onmousedown = function(ev){ 
		const rect = color_picker_canvas.getBoundingClientRect();
		const x = ev.clientX - rect.left;
		const y = ev.clientY - rect.top;
	
		//(color_picker_canvas.height - y) to inverse y here, because the hsvToRgb method in glsl is different from the one here
		var rgb = hsvToRgb(chosen_hue, x / color_picker_canvas.width, (color_picker_canvas.height - y) / color_picker_canvas.height); 
		var color = vec4(rgb[0], rgb[1], rgb[2], 1.0);
		change_chosen_color(color);
	};
	
    color_picker_gl.viewport( 0, 0, color_picker_canvas.width, color_picker_canvas.height );
	color_picker_gl.clearColor( 1, 1, 1, 1.0 );

	//There is a special fragment shader written for this canvas in the html file.
    var color_picker_program = initShaders( color_picker_gl, "vertex-shader", "fragment-shader-color-picker" );
    color_picker_gl.useProgram( color_picker_program );
    
	//Draw two triangles to completely cover the canvas
	var vertices = [
        vec2( -1, -1 ),
        vec2(  -1,  1 ),
        vec2(  1, -1 ),
		vec2( 1, 1 ),
        vec2(  1,  -1 ),
        vec2(  -1, 1 ) 		
	];    
	
	var bufferId = color_picker_gl.createBuffer();
    color_picker_gl.bindBuffer( color_picker_gl.ARRAY_BUFFER, bufferId );
    color_picker_gl.bufferData( color_picker_gl.ARRAY_BUFFER, flatten(vertices), color_picker_gl.STATIC_DRAW ); 
	
	// Associate out shader variables with our data buffer

	var vPosition = color_picker_gl.getAttribLocation( color_picker_program, "vPosition" );
	color_picker_gl.vertexAttribPointer( vPosition, 2, color_picker_gl.FLOAT, false, 0, 0 );
	color_picker_gl.enableVertexAttribArray( vPosition );    
	
    var hue_uniform = color_picker_gl.getUniformLocation(color_picker_program, "u_hue");
	
	//Slider to change the hue value
	document.getElementById("slide").oninput = function() { 
		chosen_hue = event.srcElement.value / 100; 
		color_picker_gl.uniform1f(hue_uniform, chosen_hue);
		
		color_picker_gl.clear( color_picker_gl.COLOR_BUFFER_BIT );
		color_picker_gl.drawArrays( color_picker_gl.TRIANGLES, 0, 6);
	};
	
	color_picker_gl.uniform1f(hue_uniform, chosen_hue);
	color_picker_gl.clear( color_picker_gl.COLOR_BUFFER_BIT );
	color_picker_gl.drawArrays( gl.TRIANGLES, 0, 6);
}


function mousedownAction(ev) {
	mousedown = true;
	last_mouse_pos = vec2(ev.clientX, ev.clientY);
	mouse_down_pos = vec2(ev.clientX, ev.clientY);
	
	//Start with a clean stroke
	drawn = Array(600).fill(0).map(x => Array(600).fill(false));
	stroke_vertices = [];
	dragged_points = [];
	
	stroke_color = chosen_color;
}

function mouseupAction(ev) {
	mousedown = false;
	const rect = ev.target.getBoundingClientRect();
	
	if (mode == 0) { //Mode is pen, register the new stroke normally
		const new_stroke = {
			vertices: stroke_vertices,
			properties: {
				color: stroke_color,
				type: 'Pen',
				id: stroke_id++,
				layer_id: chosen_layer_id
			}
		};
		strokes.push(new_stroke);
	} else if (mode == 1) { //Mode is eraser
		var num_dragged_points = dragged_points.length;
		var num_strokes = strokes.length;
		
		//If we were erasing from the bottom-most layer, all real deletions are done here at mouseup (for better interactive performance)
		//If we were erasing from another layer, no need to do anything at mouseup
		if (chosen_bottommost_layer()) {
			
			//Go over all the strokes to modify them with the removed verticse
			for (var i = 0; i < num_strokes; i++) {
				if (!is_stroke_selected(strokes[i])) continue;
				
				var curr_stroke_id = strokes[i].properties.id;
				var curr_vertices = strokes[i].vertices;
				var curr_colors = strokes[i].colors;
				var num_vertices = curr_vertices.length;
			
				var new_stroke_vertices = [];
				var new_stroke_colors = [];
				
				//Go over all the vertices to decide which of them are deleted
				for (var j = 0; j < num_vertices; j += 3) {
					var pixelX = (curr_vertices[j][0] + 1) * canvas.width/2;
					var pixelY = canvas.height - ((curr_vertices[j][1] + 1) * canvas.height/2);
					
					var to_delete = false;
					
					//Check if the pixel is close to any of the dragged points
					for (var k = 0; k < num_dragged_points; k++) {
						const x = dragged_points[k][0] - rect.left;
						const y = dragged_points[k][1] - rect.top;
						var dist = Math.sqrt((pixelX - x) * (pixelX - x) + (pixelY - y) * (pixelY - y));
						
						if (dist < radius) {
							to_delete = true;
							break;
						}
					}
					
					if (to_delete) {
						index -= 3;
						stroke_vertices.push({vertex: curr_vertices[j], stroke_id: curr_stroke_id});
						stroke_vertices.push({vertex: curr_vertices[j + 1], stroke_id: curr_stroke_id});
						stroke_vertices.push({vertex: curr_vertices[j + 2], stroke_id: curr_stroke_id});
					} else {
						new_stroke_vertices.push(curr_vertices[j], curr_vertices[j + 1], curr_vertices[j + 2]);
						if (strokes[i].properties.type === "Paste")
							new_stroke_colors.push(curr_colors[j], curr_colors[j + 1], curr_colors[j + 2]);
					}
				}
				strokes[i].vertices = new_stroke_vertices;
				if (strokes[i].properties.type === "Paste")
					strokes[i].colors = new_stroke_colors;
			}
		}
		
		//Rebuffer all the vertices and colors and render again.
		rebuffer_render();
		
	} else if (mode === 8) { //Mode is copy
		copy_selection(mouse_down_pos[0], mouse_down_pos[1], ev.clientX, ev.clientY, rect);
	} else if (mode === 9) { //Mode is paste
		paste_selection(ev.clientX, ev.clientY, rect);
		
		const new_stroke = {
			vertices: stroke_vertices,
			colors: copied_colors,
			properties: {
				type: 'Paste',
				id: stroke_id++,
				layer_id: chosen_layer_id
			}
		};
		strokes.push(new_stroke);
	} 
	else { //Else, mode is any of the shapes
		draw_shape(mouse_down_pos[0], mouse_down_pos[1], ev.clientX, ev.clientY, rect);
		
		const new_stroke = {
			vertices: stroke_vertices,
			properties: {
				color: stroke_color,
				type: 'Shape',
				id: stroke_id++,
				layer_id: chosen_layer_id
			}
		};
		strokes.push(new_stroke);
	}
	stroke_vertices = [];
	//Undo stack is cleared after a new stroke
	undo_stack = [];
	
	render();
}

function mousemoveAction(ev, gl, canvas) {
	var x = ev.clientX;
	var y = ev.clientY;
	var rect = ev.target.getBoundingClientRect();
	var curr_mouse_pos = vec2(x, y);
	
	//Show a preview according to the current mode
	if (mode === 9) { //Paste preview
		draw_paste_preview(curr_mouse_pos, rect);
	} else if (mousedown) {
		if (mode === 8)
			draw_copy_preview(mouse_down_pos, curr_mouse_pos, rect);
		else if (mode > 1)
			draw_shape_preview(mouse_down_pos, curr_mouse_pos, rect);
		else if (mode === 1)
			draw_brush_preview(curr_mouse_pos, rect);
		else if (mode === 0)
			reset_preview(); //Don't show the brush while drawing	
	} else {
		draw_brush_preview(curr_mouse_pos, rect);
	}
	
	if (mousedown) {
		dragged_points.push(vec2(x, y));
		
		//When the mouse is dragged fast, the brush doesn't paint the parts in the middle
		//Fill them manually here
		if (mode < 2) {
			click(x, y, rect, gl);
			var distance = length(subtract(curr_mouse_pos, last_mouse_pos));
			
			if (distance > radius) {
				for (var i = radius / 2; i <= distance; i += radius / 2) {
					var middle_point = mix(curr_mouse_pos, last_mouse_pos, i / distance); 
					dragged_points.push(vec2(middle_point[0], middle_point[1]));
					click(middle_point[0], middle_point[1], rect, gl);
				}
			}
		}
		
		//Extra cases when erasing (for performance)
		if (mode === 1) {
			//Faster when erasing from the bottom-most layer, just painting with the background color until mouse up
			//No need to rebuffer everything in this case
			if (chosen_bottommost_layer()) {
				render();
			} else {
				//For normally erasing, all vertices and colors are rebuffered
				//Because some pixels from the middle of the buffer might have been erased
				rebuffer_render();
			}
		}
		
		last_mouse_pos = curr_mouse_pos;
	}
	
	//Renders for mousedown erase are separately handled above
	if (!mousedown || mode !== 1)
		render();
}

//Perform the click or drag of the mouse at location (x,y)
//Paint or erase according to the mode
function click(x, y, rect, gl) {
	if (mode == 0) {
		//Paint the pixels that are at most radius away from the mouse
		for (var i = x - radius; i < x + radius; i ++) {
			for (var j = y - radius; j < y + radius; j ++) {
				if (i < 0 || j < 0) continue;
				if (drawn[parseInt(i)][parseInt(j)]) continue;
				
				var dist = Math.sqrt((i - x) * (i - x) + (j - y) * (j - y));
				if (dist < radius) {
					var normalizedX = ((i - rect.left) - canvas.width/2)/(canvas.width/2);
					var normalizedY = (canvas.height/2 - (j - rect.top))/(canvas.height/2);
					pixel(normalizedX, normalizedY);
					
					drawn[parseInt(i)][parseInt(j)] = true;
				}
			}
		}
	}
	
	else { //Erasing
	
		//If we are erasing from the bottom-most layer, just simulate painting with background color
		if (chosen_bottommost_layer()) {
			mode = 0;
			const prev_color = chosen_color;
			chosen_color = vec4(0.5, 0.5, 0.5, 1.0);
			click(x, y, rect, gl);
			
			chosen_color = prev_color;
			mode = 1;
			return;
		}
	
		var num_strokes = strokes.length;
		x = x - rect.left;
		y = y - rect.top;
		
		//Go over all the strokes and all their vertices and remove the pixels that are close to (x,y)
		for (var i = 0; i < num_strokes; i++) {
			//Skip the strokes that aren't in the selected layer
			if (!is_stroke_selected(strokes[i])) continue;
			
			var curr_stroke_id = strokes[i].properties.id;
			var curr_vertices = strokes[i].vertices;
			var curr_colors = strokes[i].colors;
			var num_vertices = curr_vertices.length;
		
			var new_stroke_vertices = [];
			var new_stroke_colors = [];
		
			for (var j = 0; j < num_vertices - 1; j += 3) {
				var pixelX = (curr_vertices[j][0] + 1) * 200;
				var pixelY = 400 - ((curr_vertices[j][1] + 1) * 200);
				
				var dist = Math.sqrt((pixelX - x) * (pixelX - x) + (pixelY - y) * (pixelY - y));
				if (dist < radius) {
					index -= 3;
					stroke_vertices.push({vertex: curr_vertices[j], stroke_id: curr_stroke_id});
					stroke_vertices.push({vertex: curr_vertices[j + 1], stroke_id: curr_stroke_id});
					stroke_vertices.push({vertex: curr_vertices[j + 2], stroke_id: curr_stroke_id});
				} else {
					new_stroke_vertices.push(curr_vertices[j], curr_vertices[j + 1], curr_vertices[j + 2]);
					if (strokes[i].properties.type === "Paste")
						new_stroke_colors.push(curr_colors[j], curr_colors[j + 1], curr_colors[j + 2]);
				}
			}
			strokes[i].vertices = new_stroke_vertices;
			if (strokes[i].properties.type === "Paste")
				strokes[i].colors = new_stroke_colors;
		}
	}
}

//Paint a pixel at normalized location (x,y)
function pixel(x, y) {
	var len = 0.005; //Size of a single pixel's edge length, value is 2/400= 0.005 since canvas is 400x400.
	triangle(vec2(x - len/2, y + len/2), vec2(x - len/2, y - len/2), vec2(x + len/2, y - len/2), chosen_color);
	triangle(vec2(x + len/2, y + len/2), vec2(x + len/2, y - len/2), vec2(x - len/2, y + len/2), chosen_color);
}

function triangle( a, b, c, color )
{
	a[2] = get_current_z();
	b[2] = get_current_z();
	c[2] = get_current_z();
	
	const three_vertices = [a,b,c];
	
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
	gl.bufferSubData(gl.ARRAY_BUFFER, 12*index, flatten(three_vertices.flat()));
	
	const three_colors = [color,color,color];
	
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(three_colors.flat()));
	
	index += 3;
	stroke_vertices.push(a);
	stroke_vertices.push(b);
	stroke_vertices.push(c);
}

function undo() {
	var last_stroke = strokes.pop();
	
	//This part was for undoing the erases, removed since not necessary and there were bugs
	if (last_stroke.properties.type === 'Erase') {
		/*
		var num_erased_vertices = last_stroke.erased_vertices.length;
		for (var i = 0; i < num_erased_vertices; i += 3) {
			var erased_stroke_id = last_stroke.erased_vertices[i].stroke_id;
			for (var j = 0; j < strokes.length; j++) {
				if (erased_stroke_id === strokes[j].properties.id) {
					strokes[j].vertices.push(last_stroke.erased_vertices[i]);
					strokes[j].vertices.push(last_stroke.erased_vertices[i + 1]);
					strokes[j].vertices.push(last_stroke.erased_vertices[i + 2]);
					index += 3;
				}
			}
		}
		
		const all_stroke_vertices = strokes.filter((stroke) => stroke.properties.type !== 'Erase').map((stroke) => stroke.vertices);
		gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(all_stroke_vertices.flat()));
		
		all_vertex_colors = [];
		for (var i = 0; i < strokes.length; i++) {
			if (strokes[i].properties.type === 'Erase') continue;
			all_vertex_colors.push(Array(strokes[i].vertices.length).fill(strokes[i].properties.color));
		}
		gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(all_vertex_colors.flat()));
		*/
		
	} else {
		var num_vertices = last_stroke.vertices.length;
		//Just decrease the number of vertices to be drawn by the size of the last stroke
		index -= num_vertices;
	}
	
	undo_stack.push(last_stroke);
	render();
}

function redo() {
	if (undo_stack.length == 0) return;
	var last_undo = undo_stack.pop();
	var last_undo_vertices = last_undo.vertices;
	strokes.push(last_undo);
	
	var stroke_color = last_undo.properties.color;
	var num_vertices = last_undo_vertices.length;
	
	//Add triangles for all the redoed vertices.
	for (var i = 0; i < num_vertices; i += 3) {
		triangle(last_undo_vertices[i], last_undo_vertices[i + 1], last_undo_vertices[i + 2], stroke_color);
	}
	stroke_vertices = []; //Clear this because this was not a real stroke.
	
	render();
}

//Converts the coordinates from range (0, width) and (0, height) to (-1, 1) and (-1, 1)
function normalize_2d(loc, rect) {
	return vec2(vec2(normalize_x(loc[0], rect), normalize_y(loc[1], rect)));
}
function normalize_x(x, rect) {
	return ((x - rect.left) - canvas.width/2)/(canvas.width/2);
}
function normalize_y(y, rect) {
	return (canvas.height/2 - (y - rect.top))/(canvas.height/2);
}

function render() {
	//Enable depth test for layers
	gl.enable(gl.DEPTH_TEST);            
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays( gl.TRIANGLES, 0, index );
	render_preview();
}

function change_chosen_color(new_color) {
	chosen_color = new_color;
	
	//Reference https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
	function componentToHex(c) {
	  var hex = c.toString(16);
	  return hex.length == 1 ? "0" + hex : hex;
	}

	function rgbToHex(r, g, b) {
	  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
	}
	
	document.getElementById("ColorButtonChosen").style.background = rgbToHex(
		Math.floor(new_color[0] * 256), Math.floor(new_color[1] * 256), Math.floor(new_color[2] * 256));
}

//Reference https://gist.github.com/mjackson/5311256
function hsvToRgb(h, s, v) {
  var r, g, b;

  var i = Math.floor(h * 6);
  var f = h * 6 - i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }

  return [ r, g, b];
}

function download()
{
	var a = document.createElement('a');
	var content = JSON.stringify(strokes);
	var blob = new Blob([content], {'type':'application/octet-stream'});
	a.href = window.URL.createObjectURL(blob);
	a.download = 'save.dat';
	a.click();
}

function clear()
{
    strokes = [];
	index = 0;
	render();
}
