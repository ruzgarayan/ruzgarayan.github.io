
var canvas;
var gl, program;

//Different programs for different rendering options
var programGourad;
var programPhong;
var programWireframe;


var iBuffer, vBuffer, cBuffer, nBuffer;

var numTimesToSubdivide = 3;
var index = 0;
var indices = [];
var pointsArray = [];
var colorsArray = [];
var normalsArray = [];

var fovy = 20.0;
var near = -10;
var far = 2;
var radius = 10.0;
var theta  = Math.PI/4;
var phi    = Math.PI/4;
var rotationAngle = 0;

var modelMatrix, viewMatrix, projectionMatrix;
var modelMatrixLoc, viewMatrixLoc, projectionMatrixLoc;
var environmentCubeLoc;
var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

//Mouse tracking variables
var mousedown = false;
var lastMousePos;

//Lighting-shading variables
var lightPosition = vec4(20.0, 0.0, 20.0, 0.0 );
var lightAmbient = vec4(0.4, 0.4, 0.4, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var shininess = 10.0;

//Torus knot variables
var p = 1, q1 = 1, q2 = 1, q3 = 1;
var r1 = 1, r2 = 1, r3 = 1;
var tubeStep = 10, pathStep = 100;
var mainRadius = 1, tubeRadius = 0.1; 
var rotationEnabled = false;

var vertexColors = [
    vec4(215/256, 197/256, 185/256, 1.0),  // DUN(E)
    vec4(232/256, 191/256, 169/256, 1.0),  // GOLD CHAMPAGNE
    vec4(0.0, 1.0, 0.0, 1.0),  // GREEN
    vec4(248/256, 241/256, 231/256, 1.0),  // CARAMELLO
    vec4(169/256, 149/256, 128/256, 1.0),// magenta
    vec4(0.8, 0.81, 0.52, 1.0),  // grey
    vec4(1, 1, 0.87, 1.0),// WHITE
	vec4(231/256, 203/256, 153/256, 1.0),//BUCK
    vec4(242/256, 227/256, 227/256, 1.0),//Palomino
];

// 0 => Per vertex shading
// 1 => Per fragment shading
// 2 => Wireframe
var renderingMode = 0;
var useEnvironmentMapping = false;

const presets = [
{	p:2, q1:5, q2:10, q3:5, mainRadius:1, r1:0.6, r2:0.75, r3:0.35, tubeRadius: 0.1, tubeStep: 50, pathStep: 500	},
{	p:2, q1:9, q2:3, q3:9, mainRadius:1, r1:0.4, r2:0.45, r3:0.2, tubeRadius: 0.1, tubeStep: 50, pathStep: 500	},
{	p:3, q1:5, q2:10, q3:20, mainRadius:1, r1:0.3, r2:0.5, r3:0.2, tubeRadius: 0.05, tubeStep: 50, pathStep: 500	},
{	p:3, q1:4, q2:16, q3:20, mainRadius:1, r1:0.35, r2:0.25, r3:0.2, tubeRadius: 0.05, tubeStep: 50, pathStep: 500	},
{	p:4, q1:5, q2:20, q3:15, mainRadius:1, r1:0.5, r2:0.4, r3:0.35, tubeRadius: 0.05, tubeStep: 50, pathStep: 500	},
{	p:3, q1:4, q2:12, q3:8, mainRadius:1, r1:-0.5, r2:0.75, r3:0.3, tubeRadius: 0.1, tubeStep: 50, pathStep: 500	},
{	p:3, q1:5, q2:15, q3:10, mainRadius:1, r1:-0.5, r2:0.75, r3:0.35, tubeRadius: 0.1, tubeStep: 50, pathStep: 500	},
{	p:2, q1:7, q2:9, q3:9, mainRadius:1, r1:0.4, r2:0.485, r3:0.3, tubeRadius: 0.1, tubeStep: 50, pathStep: 500	},
{	p:3, q1:7, q2:9, q3:14, mainRadius:1, r1:0.4, r2:0.485, r3:0.2, tubeRadius: 0.1, tubeStep: 50, pathStep: 500	},
{	p:3, q1:2, q2:8, q3:16, mainRadius:1, r1:0.175, r2:0.5, r3:0.15, tubeRadius: 0.1, tubeStep: 50, pathStep: 500	},
{	p:3, q1:2, q2:5, q3:4, mainRadius:1, r1:0.65, r2:0.36, r3:0.2, tubeRadius: 0.1, tubeStep: 50, pathStep: 500	},
{	p:3, q1:2, q2:10, q3:8, mainRadius:1, r1:0.5, r2:0.75, r3:0.2, tubeRadius: 0.1, tubeStep: 50, pathStep: 500	},
{	p:1, q1:1, q2:2, q3:1, mainRadius:1, r1:0.5, r2:0, r3:0.5, tubeRadius: 0.4, tubeStep: 50, pathStep: 500	},
]

function triangle(a, b, c) {
	indices.push(a);
	indices.push(b);
	indices.push(c);
	index += 3;
}

//vertices are given on order (clockwise or counterclockwise)
function quad(a, b, c, d) {
	triangle(a, b, c);
	triangle(a, c, d);
}

function vertexOnTorusKnot(t, s) {
	const x = [
		Math.cos(p * t) * (mainRadius + r1 * Math.cos(q1 * t) + r2 * Math.cos(q2 * t)),
		Math.sin(p * t) * (mainRadius + r1 * Math.cos(q1 * t) + r2 * Math.cos(q2 * t)),
		r3 * Math.sin(q3 * t)
	]; 
	
	const firstDerivative = [
		(p * -Math.sin(p * t) * (mainRadius + r1 * Math.cos(q1 * t) + r2 * Math.cos(q2 * t))) + Math.cos(p * t) * (r1 * q1 * -Math.sin(q1 * t) + q2 * r2 * -Math.sin(q2 * t)),
		(p * Math.cos(p * t) * (mainRadius + r1 * Math.cos(q1 * t) + r2 * Math.cos(q2 * t))) + Math.sin(p * t) * (r1 * q1 * -Math.sin(q1 * t) + q2 * r2 * -Math.sin(q2 * t)),
		r3 * q3 * Math.cos(q3 * t)
	]; 
	
	const secondDerivative = [
		( p * p * -Math.cos(p * t) * (mainRadius + r1 * Math.cos(q1 * t) + r2 * Math.cos(q2 * t)) ) 
		+ ( p * -Math.sin(p * t) * (r1 * q1 * -Math.sin(q1 * t) + r2 * q2 * -Math.sin(q2 * t)) )
		+ ( p * -Math.sin(p * t) * (r1 * q1 * -Math.sin(q1 * t) + q2 * r2 * -Math.sin(q2 * t)) )
		+ ( Math.cos(p * t) * (r1 * q1 * q1 * -Math.cos(q1 * t) + q2 * q2 * r2 * -Math.cos(q2 * t) ))
		
		,
		
		( p * p * -Math.sin(p * t) * (mainRadius + r1 * Math.cos(q1 * t) + r2 * Math.cos(q2 * t)) ) 
		+ ( p * Math.cos(p * t) * (r1 * q1 * -Math.sin(q1 * t) + r2 * q2 * -Math.sin(q2 * t)) )
		+ ( p * Math.cos(p * t) * (r1 * q1 * -Math.sin(q1 * t) + q2 * r2 * -Math.sin(q2 * t)) )
		+ ( Math.sin(p * t) * (r1 * q1 * q1 * -Math.cos(q1 * t) + q2 * q2 * r2 * -Math.cos(q2 * t) ))
		
		,
		
		r3 * q3 * q3 * -Math.sin(q3 * t)
	]; 
	
	const b = cross(firstDerivative, secondDerivative);
	const bPrime = normalize(b);
	
	const n = cross(bPrime, firstDerivative);
	const nPrime = normalize(n);
	
	
	const vertex = add( add(x, scale(tubeRadius * Math.cos(s), nPrime)),
					scale(tubeRadius * Math.sin(s), bPrime));
	const normal = add(scale(Math.cos(s), nPrime), scale(Math.sin(s), bPrime));
	
	return {
		vertex: [vertex[0], vertex[1], vertex[2], 1.0],
		normal: normal
	};
}


//This is simple torus knot with only one cosine term inside.
/*
function vertexOnTorusKnot2(t, s) {
	const radius = innerRadius;
	
	const x = [
		(mainRadius + radius * Math.cos(q * t)) * Math.cos(p * t),
		(mainRadius + radius * Math.cos(q * t)) * Math.sin(p * t),
		radius * Math.sin(q * t)
	]; 
	
	const nPrime = [
		Math.cos(p * t) * Math.cos(q * t),
		Math.sin(p * t) * Math.cos(q * t),
		Math.sin(q * t)
	]; 
	
	const t_theta = [
		(mainRadius + radius * Math.cos(q * t)) * (-Math.sin(p * t)),
		(mainRadius + radius * Math.cos(q * t)) * (Math.cos(p * t)),
		0
	];
	
	const t_psi = [
		radius * (-Math.sin(q * t) * Math.cos(p * t)),
		radius * (-Math.sin(q * t) * Math.sin(p * t)),
		radius * Math.cos(q * t)
	];
	
	const t_t = add( scale(p, t_theta) , scale(q, t_psi));
	const t_tPrime = normalize(t_t);
	
	const bPrime = cross(t_tPrime, nPrime);
	
	const vertex = add( add(x, scale(tubeRadius * Math.cos(s), nPrime)),
					scale(tubeRadius * Math.sin(s), bPrime));
	const normal = add(scale(Math.cos(s), nPrime), scale(Math.sin(s), bPrime));
	
	return {
		vertex: [vertex[0], vertex[1], vertex[2], 1.0],
		normal: normal
	};
}
*/

function generateTorusKnot() {
	index = 0;
	pointsArray = [];
	colorsArray = [];
	normalsArray = [];
	indices = [];
	
	const tDiff = 2 * Math.PI / pathStep;
	const sDiff = 2 * Math.PI / tubeStep;
	
	var i = 0;
	for (var t = 0; t < 2 * Math.PI; t += tDiff) {
		pointsArray.push([]);
		normalsArray.push([]);
		for (var s = 0; s < 2 * Math.PI; s += sDiff) {
			mappedPoint = vertexOnTorusKnot(t, s);
			
			pointsArray[i].push(mappedPoint.vertex);
			normalsArray[i].push(mappedPoint.normal);
			colorsArray.push(vertexColors[0]);
		}
		i++;
	}
	
	const len1 = pointsArray.length;
	const len2 = pointsArray[0].length;
	
	for (var t = 0; t < len1; t++) {
		for (var s = 0; s < len2; s++) {
			const v1 = t * len2 + s;
			const v2 = ((t + 1) % len1) * len2 + s;
			const v3 = ((t + 1) % len1) * len2 + ((s + 1) % len2);
			const v4 = t * len2 + ((s + 1) % len2)
			
			quad(v1,v2,v3,v4);
		}
	}
	
}

window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    programGourad = initShaders( gl, "vertex-shader-gourad", "fragment-shader-gourad" );
    programPhong = initShaders( gl, "vertex-shader-phong", "fragment-shader-phong" );
    programWireframe = initShaders( gl, "vertex-shader-wireframe", "fragment-shader-wireframe" );
    programEnvironment = initShaders( gl, "vertex-shader-environment", "fragment-shader-environment" );
	
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
	changeRenderingMode(renderingMode);
	gl.enable(gl.DEPTH_TEST);
	
	handleMouseMovement();
	initUI();
	loadCubeMap("Water");
	
	//Torus is generated inside this function
	setPreset(presets[0]);
	
    render();
}

function setPreset(preset) {
	const pSlider = document.getElementById("slider-p");
	const q1Slider = document.getElementById("slider-q1");
	const q2Slider = document.getElementById("slider-q2");
	const q3Slider = document.getElementById("slider-q3");
	const r1Slider = document.getElementById("slider-r1");
	const r2Slider = document.getElementById("slider-r2");
	const r3Slider = document.getElementById("slider-r3");
	const mainRadiusSlider = document.getElementById("slider-mainRadius");
	const tubeRadiusSlider = document.getElementById("slider-tubeRadius");
	const tubeStepSlider = document.getElementById("slider-tubeStep");
	const pathStepSlider = document.getElementById("slider-pathStep");
	
	p = preset.p;
	pSlider.value = p;
	q1 = preset.q1;
	q1Slider.value = q1;
	q2 = preset.q2;
	q2Slider.value = q2;
	q3 = preset.q3;
	q3Slider.value = q3;
	
	r1 = preset.r1;
	r1Slider.value = r1;
	r2 = preset.r2;
	r2Slider.value = r2;
	r3 = preset.r3;
	r3Slider.value = r3;
	
	mainRadius = preset.mainRadius;
	mainRadiusSlider.value = mainRadius;
	tubeRadius = preset.tubeRadius;
	tubeRadiusSlider.value = tubeRadius;
	
	tubeStep = preset.tubeStep;
	tubeStepSlider.value = tubeStep;
	pathStep = preset.pathStep;
	pathStepSlider.value = pathStep;
	
	afterParameterUpdate();
}

function initUI() {
	const buttonGourad = document.getElementById("button-gourad");
	const buttonPhong = document.getElementById("button-phong");
	const buttonWireframe = document.getElementById("button-wireframe");
	const buttonToggleRotation = document.getElementById("button-toggle-rotation");
	const buttonToggleEnvironmentMapping = document.getElementById("button-toggle-environment");
	buttonGourad.addEventListener('click', function() {changeRenderingMode(0);});
	buttonPhong.addEventListener('click', function() {changeRenderingMode(1);});
	buttonWireframe.addEventListener('click', function() {changeRenderingMode(2);});
	buttonToggleRotation.addEventListener('click', function() {rotationEnabled = !rotationEnabled;});
	buttonToggleEnvironmentMapping.addEventListener('click', function() {useEnvironmentMapping = !useEnvironmentMapping;});
	
	const buttonCityEnvironment = document.getElementById("button-city-environment");
	const buttonWaterEnvironment = document.getElementById("button-water-environment");
	const buttonParkEnvironment = document.getElementById("button-park-environment");
	const buttonMuseumEnvironment = document.getElementById("button-museum-environment");
	const buttonWorldEnvironment = document.getElementById("button-museum-world");
	buttonCityEnvironment.addEventListener('click', function() {loadCubeMap("City")});
	buttonWaterEnvironment.addEventListener('click', function() {loadCubeMap("Water")});
	buttonParkEnvironment.addEventListener('click', function() {loadCubeMap("Park")});
	buttonMuseumEnvironment.addEventListener('click', function() {loadCubeMap("Museum")});
	buttonWorldEnvironment.addEventListener('click', function() {loadCubeMap("World")});
	
	
	const mainRadiusSlider = document.getElementById("slider-mainRadius");
	const tubeRadiusSlider = document.getElementById("slider-tubeRadius");
	mainRadiusSlider.addEventListener('input', function() {mainRadius = parseFloat(event.srcElement.value); afterParameterUpdate();});
	tubeRadiusSlider.addEventListener('input', function() {tubeRadius = parseFloat(event.srcElement.value); afterParameterUpdate();});
	
	const pSlider = document.getElementById("slider-p");
	const q1Slider = document.getElementById("slider-q1");
	const q2Slider = document.getElementById("slider-q2");
	const q3Slider = document.getElementById("slider-q3");
	pSlider.addEventListener('input', function() {p = parseFloat(event.srcElement.value); afterParameterUpdate();});
	q1Slider.addEventListener('input', function() {q1 = parseFloat(event.srcElement.value); afterParameterUpdate();});
	q2Slider.addEventListener('input', function() {q2 = parseFloat(event.srcElement.value); afterParameterUpdate();});
	q3Slider.addEventListener('input', function() {q3 = parseFloat(event.srcElement.value); afterParameterUpdate();});
	
	const r1Slider = document.getElementById("slider-r1");
	const r2Slider = document.getElementById("slider-r2");
	const r3Slider = document.getElementById("slider-r3");
	r1Slider.addEventListener('input', function() {r1 = parseFloat(event.srcElement.value); afterParameterUpdate();});
	r2Slider.addEventListener('input', function() {r2 = parseFloat(event.srcElement.value); afterParameterUpdate();});
	r3Slider.addEventListener('input', function() {r3 = parseFloat(event.srcElement.value); afterParameterUpdate();});
	
	const tubeStepSlider = document.getElementById("slider-tubeStep");
	const pathStepSlider = document.getElementById("slider-pathStep");
	tubeStepSlider.addEventListener('input', function() {tubeStep = parseFloat(event.srcElement.value); afterParameterUpdate();});
	pathStepSlider.addEventListener('input', function() {pathStep = parseFloat(event.srcElement.value); afterParameterUpdate();});
	
	document.getElementById("Presets").onclick = function( event) {
        setPreset(presets[event.srcElement.index]);  
	};
}

// 0 => Per vertex shading
// 1 => Per fragment shading
// 2 => Wireframe
function changeRenderingMode(mode) {
	renderingMode = mode;
	
	if ( mode === 0 ) program = programGourad;
	else if ( mode === 1 ) program = programPhong;
	else if ( mode === 2 ) program = programWireframe;
	
    gl.useProgram( program );
	fillBuffers();
}

function afterParameterUpdate() {
	generateTorusKnot();
	fillBuffers();
}

function fillBuffers() {
    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray.flat(2)), gl.STATIC_DRAW);
	
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
	if ( renderingMode != 2) {
		nBuffer = gl.createBuffer();
		gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
		gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray.flat(2)), gl.STATIC_DRAW );
		
		var vNormal = gl.getAttribLocation( program, "vNormal" );
		gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( vNormal );
		
		cBuffer = gl.createBuffer();
		gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
		gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );

		var vColor = gl.getAttribLocation( program, "vColor" );
		gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( vColor );
	}

    iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	
	gl.uniform4fv( gl.getUniformLocation(program, 
       "lightAmbient"),flatten(lightAmbient) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightDiffuse"),flatten(lightDiffuse) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightSpecular"),flatten(lightSpecular) );	
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), 
       flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, 
       "shininess"),shininess);
	
    modelMatrixLoc = gl.getUniformLocation( program, "modelMatrix" );
    viewMatrixLoc = gl.getUniformLocation( program, "viewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    environmentCubeLoc = gl.getUniformLocation( program, "environmentCube");
    useEnvironmentMappingLoc = gl.getUniformLocation( program, "useEnvironmentMapping");
}

function handleMouseMovement() {
	canvas.onmousedown = function(event) {
        var x = event.clientX;
        var y = event.clientY;
        mousedown = true;
		lastMousePos = [x, y];
    }

    canvas.onmouseup = function(event) {
        mousedown = false; 
    }
     
    canvas.onmousemove = function(event) {
        var x = event.clientX;
        var y = event.clientY;
                    
        if (mousedown) {
            var scale = 1;
            xChange = (x - lastMousePos[0]);
            yChange = (y - lastMousePos[1]);

			if (yChange > 0) {
				if (theta + yChange / 180 < Math.PI) theta += yChange / 180;
			} else {
				if (theta + yChange / 180 > 0) theta += yChange / 180;
			}
			phi += xChange / 180;
			
        }
		lastMousePos = [x, y];
    }
	
	canvas.onwheel = function(event) {
		if (event.deltaY > 0) {
			radius += 1;
		} else {
			radius -= 1;
		}
		
		event.preventDefault();
    }
}

function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    eye = vec3(radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta), radius*Math.sin(theta)*Math.cos(phi));
	
	if (rotationEnabled)
		rotationAngle += 1;
	
	modelMatrix = rotate(rotationAngle, 0, 0, 1);
    viewMatrix = lookAt(eye, at , up);
    projectionMatrix = perspective(fovy, canvas.width/canvas.height, near, far);
            
    gl.uniformMatrix4fv( viewMatrixLoc, false, flatten(viewMatrix) );
    gl.uniformMatrix4fv( modelMatrixLoc, false, flatten(modelMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniform1i(useEnvironmentMappingLoc, useEnvironmentMapping );
        
		
	//Render lines for wireframe
	if ( renderingMode === 2) {
		for( var i=0; i<4*index; i+=4) 
		gl.drawElements(gl.LINE_LOOP, 4, gl.UNSIGNED_SHORT, i );
	} else {
		gl.drawElements( gl.TRIANGLES, index, gl.UNSIGNED_SHORT, 0 );
	}

    window.requestAnimFrame(render);
}


function loadCubeMap(environmentType) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
	
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	
    //gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    //gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
	
	if (environmentType === "City") {
		var faces = [{url: "https://i.ibb.co/s677qvg/pos-x.png", side: gl.TEXTURE_CUBE_MAP_POSITIVE_X},
				 {url: "https://i.ibb.co/TbFZ9K1/neg-x.png", side: gl.TEXTURE_CUBE_MAP_NEGATIVE_X},
                 {url: "https://i.ibb.co/vCF2BPJ/pos-y.png", side: gl.TEXTURE_CUBE_MAP_POSITIVE_Y},
                 {url: "https://i.ibb.co/bPXnYb8/neg-y.png", side: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y},
                 {url: "https://i.ibb.co/BtS73xh/pos-z.png", side: gl.TEXTURE_CUBE_MAP_POSITIVE_Z},
                 {url: "https://i.ibb.co/QXnX10q/neg-z.png", side: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z}];
	} else if (environmentType === "Water") {
		var faces = [{url: "https://i.ibb.co/zN5fvR9/posx.jpg", side: gl.TEXTURE_CUBE_MAP_POSITIVE_X},
                 {url: "https://i.ibb.co/HH6DwpN/negx.jpg", side: gl.TEXTURE_CUBE_MAP_NEGATIVE_X},
                 {url: "https://i.ibb.co/cTTdLJR/posy.jpg", side: gl.TEXTURE_CUBE_MAP_POSITIVE_Y},
                 {url: "https://i.ibb.co/MPWcvpc/negy.jpg", side: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y},
                 {url: "https://i.ibb.co/JF7Q6HF/posz.jpg", side: gl.TEXTURE_CUBE_MAP_POSITIVE_Z},
                 {url: "https://i.ibb.co/5BR1rbk/negz.jpg", side: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z}];
	} else if (environmentType === "Park") {
		var faces = [{url: "https://i.ibb.co/myBKrBs/posx.jpg", side: gl.TEXTURE_CUBE_MAP_POSITIVE_X},
                 {url: "https://i.ibb.co/vqnT4XB/negx.jpg", side: gl.TEXTURE_CUBE_MAP_NEGATIVE_X},
                 {url: "https://i.ibb.co/4R7G2XS/posy.jpg", side: gl.TEXTURE_CUBE_MAP_POSITIVE_Y},
                 {url: "https://i.ibb.co/Qn79QDx/negy.jpg", side: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y},
                 {url: "https://i.ibb.co/Jc2WBvV/posz.jpg", side: gl.TEXTURE_CUBE_MAP_POSITIVE_Z},
                 {url: "https://i.ibb.co/yywxNn9/negz.jpg", side: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z}];
	} else if (environmentType === "Museum") {
		var faces = [{url: "https://i.ibb.co/3TKCnW1/pos-x.jpg", side: gl.TEXTURE_CUBE_MAP_POSITIVE_X},
                 {url: "https://i.ibb.co/3kRfN8d/neg-x.jpg", side: gl.TEXTURE_CUBE_MAP_NEGATIVE_X},
                 {url: "https://i.ibb.co/DMzTskj/pos-y.jpg", side: gl.TEXTURE_CUBE_MAP_POSITIVE_Y},
                 {url: "https://i.ibb.co/XDSn4Zj/neg-y.jpg", side: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y},
                 {url: "https://i.ibb.co/Ld5Xk45/pos-z.jpg", side: gl.TEXTURE_CUBE_MAP_POSITIVE_Z},
                 {url: "https://i.ibb.co/vmtZyM3/neg-z.jpg", side: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z}];
	} else if (environmentType === "World") {
		var faces = [{url: "https://i.ibb.co/B2vKDq2/posx.jpg", side: gl.TEXTURE_CUBE_MAP_POSITIVE_X},
                 {url: "https://i.ibb.co/F3NgJtV/negx.jpg", side: gl.TEXTURE_CUBE_MAP_NEGATIVE_X},
                 {url: "https://i.ibb.co/6vLVxLX/posy.jpg", side: gl.TEXTURE_CUBE_MAP_POSITIVE_Y},
                 {url: "https://i.ibb.co/xhbwsML/negy.jpg", side: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y},
                 {url: "https://i.ibb.co/gydsnQJ/posz.jpg", side: gl.TEXTURE_CUBE_MAP_POSITIVE_Z},
                 {url: "https://i.ibb.co/dPLMqgz/negz.jpg", side: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z}];
	}
				 
    for (var i = 0; i < faces.length; i++) {
        var side = faces[i].side;
        var image = new Image();
        image.onload = function(texture, side, image) {
            return function() {
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                gl.texImage2D(side, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            }
        } (texture, side, image);
		image.crossOrigin = "anonymous";
        image.src = faces[i].url;
    }
	
	gl.activeTexture(gl.TEXTURE0);
	gl.uniform1i(environmentCubeLoc, 0);
}
