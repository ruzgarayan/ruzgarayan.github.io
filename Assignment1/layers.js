//Id of the currently chosen layer
var chosen_layer_id;

//Orders of each layer in the screen
var layer_orders = [1, 2, 3, 4];

//Whether or not a layer's strokes are currently rendered.
var layer_shown = [true, true, true, true];

//Initialize button event listeners
function init_layers() {
	document.getElementById("Layer1").addEventListener("click", function(){change_chosen_layer_order(1)});
	document.getElementById("Layer2").addEventListener("click", function(){change_chosen_layer_order(2)});
	document.getElementById("Layer3").addEventListener("click", function(){change_chosen_layer_order(3)});
	document.getElementById("Layer4").addEventListener("click", function(){change_chosen_layer_order(4)});
	
	document.getElementById("Layer1Down").addEventListener("click", function(){change_layer_ordering(1, false)});
	document.getElementById("Layer2Down").addEventListener("click", function(){change_layer_ordering(2, false)});
	document.getElementById("Layer3Down").addEventListener("click", function(){change_layer_ordering(3, false)});
	document.getElementById("Layer2Up").addEventListener("click", function(){change_layer_ordering(2, true)});
	document.getElementById("Layer3Up").addEventListener("click", function(){change_layer_ordering(3, true)});
	document.getElementById("Layer4Up").addEventListener("click", function(){change_layer_ordering(4, true)});
	
	document.getElementById("Layer1Show").addEventListener('change', (event) => {change_layer_show(1, event.currentTarget.checked)});
	document.getElementById("Layer2Show").addEventListener('change', (event) => {change_layer_show(2, event.currentTarget.checked)});
	document.getElementById("Layer3Show").addEventListener('change', (event) => {change_layer_show(3, event.currentTarget.checked)});
	document.getElementById("Layer4Show").addEventListener('change', (event) => {change_layer_show(4, event.currentTarget.checked)});
	
	change_chosen_layer_order(1);
}

function change_chosen_layer_order(order) {
	var layer_id = find_id_by_order(order);
	change_chosen_layer_id(layer_id);
}

function change_chosen_layer_id(layer_id) {
	var order = layer_orders[layer_id];
	chosen_layer_id = layer_id;
	
	for (var i = 1; i <= 4; i++){
		const text_div_name = "Layer" + (i) + "Text";
		document.getElementById(text_div_name).innerHTML = "";
	} 
	
	const text_div_name = "Layer" + (order) + "Text";
	document.getElementById(text_div_name).innerHTML = "&#10003;";
	
	const checkbox_name = "Layer" + (order) + "Show";
	document.getElementById(checkbox_name).checked = true;
	
	change_layer_show(order, true);
}

function find_id_by_order(curr_order) {
	for (var i = 0; i < 4; i++){
		if (layer_orders[i] === curr_order)
			return i;
	}
	
	return -1;
}

function change_layer_ordering(curr_order, move_up) {
	var layer_id = find_id_by_order(curr_order);
	var other_layer_id;
	if (move_up) {
		other_layer_id = find_id_by_order(curr_order - 1);
		layer_orders[layer_id] = curr_order - 1;
		layer_orders[other_layer_id] = curr_order;
	} else {
		other_layer_id = find_id_by_order(curr_order + 1);
		layer_orders[layer_id] = curr_order + 1;
		layer_orders[other_layer_id] = curr_order;
	}
	
	if (chosen_layer_id === layer_id) {
		change_chosen_layer_id(layer_id);
	} else if (chosen_layer_id === other_layer_id) {
		change_chosen_layer_id(other_layer_id);
	}
	rebuffer_render();
}

function change_layer_show(curr_order, new_val) {
	var layer_id = find_id_by_order(curr_order);
	
	if (!new_val && chosen_layer_id === layer_id) {
		alert('You cannot unshow the selected layer.');
		
		const checkbox_name = "Layer" + (layer_id + 1) + "Show";
		document.getElementById(checkbox_name).checked = true;
		return;
	}
	
	layer_shown[layer_id] = new_val;
	rebuffer_render();
}

//After layer changes, a lot of vertices' z coordinates change
//So, change these coordinates here and then rebuffer everything.
function rebuffer_render() {
	index = 0;
	
	const selected_layer_strokes = strokes.filter((stroke) => (
		(stroke.properties.type !== 'Erase') && (layer_shown[stroke.properties.layer_id]))
	);
	
	var all_stroke_vertices = [];
	var all_vertex_colors = [];
	
	for (var i = 0; i < selected_layer_strokes.length; i++) {
		var stroke = selected_layer_strokes[i];
		index += stroke.vertices.length;
		const z_coord = get_layer_z(stroke.properties.layer_id);
		all_stroke_vertices.push( stroke.vertices.map((vertex) => vec3(vertex[0], vertex[1], z_coord)) );
		if (stroke.properties.type === 'Paste')
			all_vertex_colors.push(stroke.colors);
		else
			all_vertex_colors.push(Array(stroke.vertices.length).fill(stroke.properties.color));
	}
	
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(all_stroke_vertices.flat()));
			
	gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(all_vertex_colors.flat()));
	
	render();
}

function get_top_layer_z() {
	return -(1 / 1);
}

function get_layer_z(layer_id) {
	const order = layer_orders[layer_id];
	return -(1 / order);
}

function get_current_z() {
	return get_layer_z(chosen_layer_id);
}

function is_stroke_selected(stroke) {
	return stroke.properties.layer_id === chosen_layer_id;
}

function chosen_bottommost_layer() {
	return layer_orders[chosen_layer_id] === 4;
}