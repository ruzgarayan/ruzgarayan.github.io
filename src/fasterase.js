var saved_colors = [];

function save_background() {
	var pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
	gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	
	saved_colors = [];
	for (var i = 0; i < gl.drawingBufferWidth; i++) {
		saved_colors.push([]);
		for (var j = 0; j < gl.drawingBufferHeight; j++) {
			const index = (i * gl.drawingBufferHeight + j) * 4;
			saved_colors[i].push(vec4(pixels[index] / 256, pixels[index + 1] / 256, pixels[index + 2] / 256, pixels[index + 3] / 256));
		}
	}
}