
var canvas;
var gl;
var program;

var projectionMatrix; 
var modelViewMatrix;

var instanceMatrix;

var modelMatrixLoc;
var viewMatrixLoc;
var projectionMatrixLoc;

var vertices = [

    vec4( -0.5, -0.5,  0.5, 1.0 ),  //
    vec4( -0.5,  0.5,  0.5, 1.0 ),  //
    vec4( 0.5,  0.5,  0.5, 1.0 ),   //
    vec4( 0.5, -0.5,  0.5, 1.0 ),   //
    vec4( -0.5, -0.5, -0.5, 1.0 ),  //
    vec4( -0.5,  0.5, -0.5, 1.0 ),  //
    vec4( 0.5,  0.5, -0.5, 1.0 ),   //
    vec4( 0.5, -0.5, -0.5, 1.0 ),    //
    vec4( 0, 0.5, 0, 1.0 ),    //8
    vec4( 0, -0.5, 0, 1.0 )    //9
];

var vertexColors = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
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

const cylinderStartIndex = 24;
var cylinderIndexLength = 0;
var cylinderTopStartIndex = 0;
var cylinderTopIndexLength = 0;
var cylinderBottomStartIndex = 0;
var cylinderBottomIndexLength = 0;
var cylinderSideStartIndex = 0;
var cylinderSideIndexLength = 0;
var ellipsoidStartIndex = 0;
var ellipsoidIndexLength = 0;

var torsoId = 0;
var torso2Id = 21;
var headId  = 10;
var head1Id = 10;
var head2Id = 11;
var neckId  = 1;
var neck2Id = 22;
var leftUpperArmId = 2;
var leftLowerArmId = 3;
var rightUpperArmId = 4;
var rightLowerArmId = 5;
var leftUpperLegId = 6;
var leftLowerLegId = 7;
var rightUpperLegId = 8;
var rightLowerLegId = 9;
var leftUpperWingId = 12;
var leftLowerWingId = 13;
var rightUpperWingId = 14;
var rightLowerWingId = 15;
var upperTailId = 16;
var lowerTailId = 17;

var globalXId = 18;
var globalYId = 19;
var globalZId = 20;


var headHeight = 1.5;
var headWidth = 1.0;
var headLength = 3.0;

var torsoHeight = 1.5;
var torsoWidth = 3.0;
var torsoLength = 7.0;

var neckHeight = 2.0;
var neckWidth = 0.5;
var neckLength = 1.0;

var upperArmWidth  = 0.75;  //front left
var upperArmHeight = 2.0;
var upperArmLength = 0.0;

var lowerArmWidth  = 0.5;
var lowerArmHeight = 2.0;
var LowerArmLength = 0.0;

var upperLegWidth  = 1.3;
var upperLegHeight = 3.0;
var upperLegLength = 1.5;

var lowerLegWidth  = 0.5;
var lowerLegHeight = 2.1;
var lowerLegLength = 0.5;

var upperWingWidth = 3.0;
var upperWingHeight = 0.5;
var upperWingLength = 5.0;

var lowerWingWidth = 3.0;
var lowerWingHeight = 0.5;
var lowerWingLength = 4.5;

var upperTailLength = 1;
var lowerTailLength = 2;

var numNodes = 18;
var numAngles = 17;
var angle = 0;

var theta = [0, 20, 0, 0, 0, 0, 10, -20, 10, -20, 0, 0, 20, -40, 20, -40, 0, 0, 0, 0.2, 0, 0, 0];
var sliders = [];

var numVertices = 24;

var stack = [];

var pegasus = [];

for( var i=0; i<numNodes; i++) pegasus[i] = createNode(null, null, null, null);

var vBuffer, cBuffer;
var modelViewLoc;

var pointsArray = [];
var colorsArray = [];
var normalsArray = [];

var radius = 50.0;
var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);
var phi = Math.PI/5, psi = Math.PI/2;

var near = 0.3;
var far = 2000.0;
var cameraX = 0;
var cameraY = 0;
var cameraZ = 0;

var fovy = 20.0;  // Field-of-view in Y direction angle (in degrees)

//Mouse tracking variables
var mousedown = false;
var lastMousePos;


//Lighting-shading variables
var lightPosition = vec4(0.0, 10.0, 0.0, 0.0 );
var ambientLight = vec3(0.1, 0.1, 0.1);
var shininess = 10.0;
var lightingRatio = 0.3;

//-------------------------------------------

function scale4(a, b, c) {
   var result = mat4();
   result[0][0] = a;
   result[1][1] = b;
   result[2][2] = c;
   return result;
}

//--------------------------------------------


function createNode(transform, render, sibling, child){
    var node = {
    transform: transform,
    render: render,
    sibling: sibling,
    child: child,
    }
    return node;
}

function colouredFace(faceCount, colour){
    colours = [];
    for(var i = 0; i < faceCount; i++){
        colours.push(colour);
    }
    return colours;
}

function initNodes(Id) {

    var m = mat4();
    
    switch(Id) {
    
    case torsoId:
    case torso2Id:
    m = translate(theta[globalXId], theta[globalYId], theta[globalZId]);
    m = mult(m, rotate(theta[torsoId], 1, 0, 0 ));
    m = mult(m, rotate(theta[torso2Id], 0, 1, 0));
    m = mult(m, scale4(0.75, 1, 1));
    pegasus[torsoId] = createNode( m, torso, null, neckId );
    break;

    case headId: 
    case head1Id: 
    case head2Id:
    

    m = translate(0, torsoHeight-0.2*headHeight+neckHeight*.5, -(neckLength)*.1);
    m = mult(m, rotate(15, 1, 0, 0));
	m = mult(m, rotate(-theta[head1Id]/2, 1, 0, 0))
	m = mult(m, rotate(theta[head2Id], 0, 1, 0));
    m = mult(m, translate(0.0, -0.5*headHeight, 0.0));
    pegasus[headId] = createNode( m, head, null, null);
    break;

    case neckId:
        case neck2Id:
        m = translate(0.0, torsoHeight*0.7, torsoLength/2-1.5*neckWidth);
        m = mult(m, rotate(theta[neckId], 1, 0, 0));
        m = mult(m, rotate(theta[neck2Id], 0, 1, 0));
        pegasus[neckId] = createNode( m, neck, leftUpperArmId, headId);
    break;

    case leftUpperWingId:
        m = translate(torsoWidth/3, torsoHeight*.5, -0.5);
        m = mult(m, rotate(theta[leftUpperWingId], 0, 0, 1));
        pegasus[leftUpperWingId] = createNode( m, leftUpperWing, rightUpperWingId, leftLowerWingId);
    break;

    case leftLowerWingId:
            m = translate(torsoWidth/2+upperWingWidth/2, 0, 0.0);
            m = mult(m, rotate(theta[leftLowerWingId], 0, 0, 1));
            pegasus[leftLowerWingId] = createNode( m, leftLowerWing, null, null);
    break;

    case rightUpperWingId:
            m = translate(-torsoWidth/3, torsoHeight*.5, -0.5);
            m = mult(m, rotate(-theta[rightUpperWingId], 0, 0, 1));
            pegasus[rightUpperWingId] = createNode( m, rightUpperWing, upperTailId, rightLowerWingId);
    break;

    case upperTailId:
        m = translate(0, torsoHeight/2, -torsoLength*.65);
        m = mult(m, rotate(theta[upperTailId], 1, 0, 0));
        pegasus[upperTailId] = createNode( m, upperTail, null, lowerTailId);
    break;

    case lowerTailId:
        m = translate(0, -upperTailLength, 0);
        m = mult(m, rotate(theta[lowerTailId], 1, 0, 0));
        pegasus[lowerTailId] = createNode( m, lowerTail, null, null);
        break;

    case rightLowerWingId:
            m = translate(-torsoWidth/2-upperWingWidth/2, 0, 0.0);
            m = mult(m, rotate(-theta[rightLowerWingId], 0, 0, 1));
            pegasus[rightLowerWingId] = createNode( m, rightLowerWing, null, null);
    break;

    case leftUpperArmId:
    
    m = translate((torsoWidth/2-upperArmWidth), -1.0, torsoLength*.37);
	m = mult(m, rotate(theta[leftUpperArmId], 1, 0, 0));
    pegasus[leftUpperArmId] = createNode( m, leftUpperArm, rightUpperArmId, leftLowerArmId );
    break;

    case rightUpperArmId:

        m = translate(-(torsoWidth/2-upperArmWidth), -1.0, torsoLength*.37);
        m = mult(m, rotate(theta[rightUpperArmId], 1, 0, 0));
    pegasus[rightUpperArmId] = createNode( m, rightUpperArm, leftUpperLegId, rightLowerArmId );
    break;
    
    case leftUpperLegId:

        m = translate((.8*torsoWidth-upperLegWidth), 0.0, -2.3*torsoLength/5);
        m = mult(m, rotate(theta[leftUpperLegId], 1, 0, 0));
    pegasus[leftUpperLegId] = createNode( m, leftUpperLeg, rightUpperLegId, leftLowerLegId );
    break;

    case rightUpperLegId:

        m = translate(-(.8*torsoWidth-upperLegWidth), 0.0, -2.3*torsoLength/5);
        m = mult(m, rotate(theta[rightUpperLegId], 1, 0, 0));
    pegasus[rightUpperLegId] = createNode( m, rightUpperLeg, leftUpperWingId, rightLowerLegId );
    break;
    
    case leftLowerArmId:

    m = translate(0.0, -upperArmHeight, 0.0);
    m = mult(m, rotate(theta[leftLowerArmId], 1, 0, 0));
    pegasus[leftLowerArmId] = createNode( m, leftLowerArm, null, null );
    break;
    
    case rightLowerArmId:

        m = translate(0.0, -upperArmHeight, 0.0);
        m = mult(m, rotate(theta[rightLowerArmId], 1, 0, 0));
    pegasus[rightLowerArmId] = createNode( m, rightLowerArm, null, null );
    break;
    
    case leftLowerLegId:

        m = translate(0.0, -upperLegHeight, 0.0);
        m = mult(m, rotate(theta[leftLowerLegId], 1, 0, 0));
    pegasus[leftLowerLegId] = createNode( m, leftLowerLeg, null, null );
    break;
    
    case rightLowerLegId:

        m = translate(0.0, -upperLegHeight, 0.0);
        m = mult(m, rotate(theta[rightLowerLegId], 1, 0, 0));
    pegasus[rightLowerLegId] = createNode( m, rightLowerLeg, null, null );
    break;
    
    }

}

function traverse(Id) {
   
   if(Id == null) return; 
   stack.push(modelViewMatrix);
   modelViewMatrix = mult(modelViewMatrix, pegasus[Id].transform);
   pegasus[Id].render();
   if(pegasus[Id].child != null) traverse(pegasus[Id].child);
    modelViewMatrix = stack.pop();
   if(pegasus[Id].sibling != null) traverse(pegasus[Id].sibling);
}

function torso() {
    chest();
    butt();
    instanceMatrix = mult(modelViewMatrix, rotate(90, 1, 0, 0));
    instanceMatrix = mult(instanceMatrix, translate(0.0, -0.5, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( torsoWidth, torsoLength, torsoWidth));
    setModelViewMatrix(instanceMatrix);
    drawColoredEllipsoid(vertexColors[4]);
}

function chest(){
    instanceMatrix = mult(modelViewMatrix, translate(0, 0, torsoLength/3));
    instanceMatrix = mult(instanceMatrix, scale4(torsoWidth, torsoWidth, torsoWidth*1.1) );
    setModelViewMatrix(instanceMatrix);
    drawColoredEllipsoid(vertexColors[4]);
}

function butt(){
    instanceMatrix = mult(modelViewMatrix, translate(0, 0, -torsoLength*.5));
    instanceMatrix = mult(instanceMatrix, scale4(torsoWidth*1.1, torsoWidth, torsoWidth *.8) );
    setModelViewMatrix(instanceMatrix);
    drawColoredEllipsoid(vertexColors[4]);
}

function upperTail(){
    instanceMatrix = mult(modelViewMatrix, translate(0, -upperTailLength/2, -.25));
    instanceMatrix = mult(instanceMatrix, scale4(.5, upperTailLength, .5) );
    setModelViewMatrix(instanceMatrix);
    const tailColors = colouredFace(6, vertexColors[0]);
    drawColoredCube(tailColors);
}

function lowerTail(){
    instanceMatrix = mult(modelViewMatrix, translate(0, -lowerTailLength/2, -.25));
    instanceMatrix = mult(instanceMatrix, scale4(.5, lowerTailLength, .5) );
    setModelViewMatrix(instanceMatrix);
    const tailColors = colouredFace(6, vertexColors[0]);
    drawColoredCube(tailColors);
}

function head() {
    ears(-1);
    ears(1);
    nose();
    eyes(-1);
    eyes(1);
    hair();
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight, 1));
	instanceMatrix = mult(instanceMatrix, scale4(headWidth, headHeight, headLength) );
    setModelViewMatrix(instanceMatrix);
    drawColoredEllipsoid(vertexColors[8]);
}

function ears(side) {
    instanceMatrix = mult(modelViewMatrix,  rotate(side*90, 0, 1, 0));
    instanceMatrix = mult(instanceMatrix, translate(side*-.3, headHeight, -.3*headHeight ));
    instanceMatrix = mult(instanceMatrix, scale4(0.2, 1.0, 0.5) );
    setModelViewMatrix(instanceMatrix);
    drawColoredEllipsoid(vertexColors[8]);
}

function eyes(side) {
    instanceMatrix = mult(modelViewMatrix, translate(side*-.5, headHeight*.75, headHeight/2));
    instanceMatrix = mult(instanceMatrix, scale4(.2, .2, .2) );
    setModelViewMatrix(instanceMatrix);
    drawColoredEllipsoid(vertexColors[0]);
}

function nose() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, headHeight/2, headLength*0.8));
    instanceMatrix = mult(instanceMatrix, scale4(.7, .7, .7) );
    setModelViewMatrix(instanceMatrix);
    drawColoredEllipsoid(vertexColors[0]);
}

function hair() {
    instanceMatrix = mult(modelViewMatrix, translate(0, headHeight, headLength*.1));
    instanceMatrix = mult(instanceMatrix, scale4(0.5, 0.5, .75) );
    setModelViewMatrix(instanceMatrix);
    const hairCubeColors = colouredFace(6, vertexColors[0]);
    drawColoredCube(hairCubeColors);
}

function neck() {
    mane();
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * neckHeight, 0.0 ));
    instanceMatrix = mult(instanceMatrix, scale4(neckLength, neckHeight, neckLength) );
    setModelViewMatrix(instanceMatrix);
    drawColoredCylinder(vertexColors[2],vertexColors[2],vertexColors[2]);
}

function mane() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, neckHeight*.8, -headLength*0.1));
    instanceMatrix = mult(instanceMatrix, scale4(0.9, 3, .7) );
    setModelViewMatrix(instanceMatrix);
    const maneCubeColors = colouredFace(6, vertexColors[0]);
    drawColoredCube(maneCubeColors);
}


function leftUpperWing(){
    instanceMatrix = mult(modelViewMatrix, translate(upperWingWidth/2, upperWingHeight/2, 0.0 ));
    instanceMatrix = mult(modelViewMatrix, translate(upperWingWidth/2, upperWingHeight/2, 0.0 ));
    instanceMatrix = mult(instanceMatrix, scale4(upperWingWidth, upperWingHeight, upperWingLength) );
    setModelViewMatrix(instanceMatrix);
    const leftUpperWingCubeColors = colouredFace(6, vertexColors[1]);
	drawColoredCube(leftUpperWingCubeColors);
}

function leftLowerWing(){
	wingEnd(0);
    instanceMatrix = mult(modelViewMatrix, translate(lowerWingWidth/2, lowerWingHeight/2, 0.0 ));
    instanceMatrix = mult(instanceMatrix, scale4(lowerWingWidth, lowerWingHeight, lowerWingLength) );
    setModelViewMatrix(instanceMatrix);
    const leftLowerWingCubeColors = colouredFace(6, vertexColors[1]);
	drawColoredCube(leftLowerWingCubeColors);
}

function rightUpperWing(){
    instanceMatrix = mult(modelViewMatrix, translate(-upperWingWidth/2, upperWingHeight/2, 0.0 ));
    instanceMatrix = mult(instanceMatrix, scale4(upperWingWidth, upperWingHeight, upperWingLength) );
    setModelViewMatrix(instanceMatrix);
    const rightUpperWingCubeColors = colouredFace(6, vertexColors[1]);
	drawColoredCube(rightUpperWingCubeColors);
}

function rightLowerWing(){
	wingEnd(1);
    instanceMatrix = mult(modelViewMatrix, translate(-lowerWingWidth/2, lowerWingHeight/2, 0.0 ));
    instanceMatrix = mult(instanceMatrix, scale4(lowerWingWidth, lowerWingHeight, lowerWingLength) );
    setModelViewMatrix(instanceMatrix);
    const rightLowerWingCubeColors = colouredFace(6, vertexColors[1]);
	drawColoredCube(rightLowerWingCubeColors);
}

function leftUpperArm() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, -0.5 * upperArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperArmWidth, upperArmHeight, upperArmWidth) );
    setModelViewMatrix(instanceMatrix);
    drawColoredCylinder(vertexColors[2],vertexColors[2],vertexColors[2]);
}

function leftLowerArm() {
    hoof(0);
    instanceMatrix = mult(modelViewMatrix, translate(0.0, -0.5 * lowerArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerArmWidth, lowerArmHeight, lowerArmWidth) );
    setModelViewMatrix(instanceMatrix);
    const leftLowerArmCubeColors = colouredFace(6, vertexColors[5]);
	drawColoredCube(leftLowerArmCubeColors);
}

function rightUpperArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, -0.5 * upperArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperArmWidth, upperArmHeight, upperArmWidth) );
    setModelViewMatrix(instanceMatrix);
    drawColoredCylinder(vertexColors[2],vertexColors[2],vertexColors[2]);
}

function rightLowerArm() {
    hoof(0);
    instanceMatrix = mult(modelViewMatrix, translate(0.0, -0.5 * lowerArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerArmWidth, lowerArmHeight, lowerArmWidth) );
    setModelViewMatrix(instanceMatrix);
    const rightLowerArmCubeColors = colouredFace(6, vertexColors[5]);
	drawColoredCube(rightLowerArmCubeColors);
}

function  leftUpperLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, -0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth, upperLegHeight, upperLegLength) );
    setModelViewMatrix(instanceMatrix);
	drawColoredCylinder(vertexColors[2],vertexColors[2],vertexColors[2]);
}

function leftLowerLeg() {
    hoof(1);
    instanceMatrix = mult(modelViewMatrix, translate( 0.0, -0.5 * lowerLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerLegWidth, lowerLegHeight, lowerLegLength) );
    setModelViewMatrix(instanceMatrix);
    const leftLowerLegCubeColors = colouredFace(6, vertexColors[5]);
    drawColoredCube(leftLowerLegCubeColors);
}

function rightUpperLeg() {
    
    instanceMatrix = mult(modelViewMatrix, translate(0.0, -0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth, upperLegHeight, upperLegLength) );
    setModelViewMatrix(instanceMatrix);
	drawColoredCylinder(vertexColors[2],vertexColors[2],vertexColors[2]);
}

function rightLowerLeg() {
    hoof(1);
    instanceMatrix = mult(modelViewMatrix, translate(0.0, -0.5 * lowerLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerLegWidth, lowerLegHeight, lowerLegLength) )
    setModelViewMatrix(instanceMatrix);
    const rightLowerLegCubeColors = colouredFace(6, vertexColors[5]);
    drawColoredCube(rightLowerLegCubeColors);
}

function hoof(leg){
    height = leg ? lowerLegHeight : lowerArmHeight;
    instanceMatrix = mult(modelViewMatrix, translate(0.0, -height, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4(.51, .51, .51) )
    setModelViewMatrix(instanceMatrix);
    drawColoredCube(colouredFace(6, vertexColors[0]));
}

function wingEnd(wing){
    height = wing ? leftLowerWing : lowerArmHeight;
	
	if (wing) {
		instanceMatrix = mult(modelViewMatrix, translate(-3.0, 0.2, 0.0) );
		instanceMatrix = mult(instanceMatrix, rotate(180, 0, 0, 1));
		instanceMatrix = mult(instanceMatrix, rotate(45, 0, 1, 0));
		instanceMatrix = mult(instanceMatrix, rotate(90, 1, 0, 0));
		instanceMatrix = mult(instanceMatrix, scale4(3.2, 3.2, .42));
		setModelViewMatrix(instanceMatrix);
		drawColoredCube(colouredFace(6, vertexColors[1]));
	} else {
		instanceMatrix = mult(modelViewMatrix, translate(3.0, 0.2, 0.0) );
		instanceMatrix = mult(instanceMatrix, rotate(180, 0, 0, 1));
		instanceMatrix = mult(instanceMatrix, rotate(45, 0, 1, 0));
		instanceMatrix = mult(instanceMatrix, rotate(90, 1, 0, 0));
		instanceMatrix = mult(instanceMatrix, scale4(3.2, 3.2, .42));
		setModelViewMatrix(instanceMatrix);
		drawColoredCube(colouredFace(6, vertexColors[1]));
	}
}

function tri(a, b, c) {
	//Note that this function is only used at spheres and cylinders
	//So just giving the point coordinates as normals
	//Perfect for sphere, mostly ok with cylinder
	
	pointsArray.push(a);
	colorsArray.push(vertexColors[1]);
	normalsArray.push(vec3(a)); 
	pointsArray.push(b);
	colorsArray.push(vertexColors[1]);
	normalsArray.push(vec3(b)); 
	pointsArray.push(c);
	colorsArray.push(vertexColors[1]);
	normalsArray.push(vec3(c)); 
}

function quadNoFan(a, b, c, d) {
	tri(a,b,c);
	tri(a,c,d);
}

function quad(a, b, c, d) {
	var t1 = subtract(vertices[b], vertices[a]);
	var t2 = subtract(vertices[c], vertices[b]);
	var normal = cross(t1, t2);
	var normal = vec3(normal);
	
	pointsArray.push(vertices[a]);
	colorsArray.push(vertexColors[a]);
	normalsArray.push(normal);
	pointsArray.push(vertices[b]);
	colorsArray.push(vertexColors[a]);
	normalsArray.push(normal);
	pointsArray.push(vertices[c]);
	colorsArray.push(vertexColors[a]);
	normalsArray.push(normal);
	pointsArray.push(vertices[d]);
	colorsArray.push(vertexColors[a]);
	normalsArray.push(normal);
}

function setModelViewMatrix(instanceMatrix) {
	//The coordinates below are swapped because the original spherical coordinates didn't work.
	eye = vec3(radius*Math.sin(psi)*Math.sin(phi), radius*Math.cos(psi), radius*Math.sin(psi)*Math.cos(phi));
	
	gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(instanceMatrix));
	gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(lookAt(eye, at , up)));
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(perspective(fovy, canvas.width/canvas.height, near, far)));
}

function cube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function cylinder()
{
    const topCenter = vertices[8];
    const bottomCenter = vertices[9];
	const radius = 0.5;
	
	var index = 0;
	var count = 0;
	
	//Construct top part
	cylinderTopStartIndex = cylinderStartIndex + index;
	for (var i = 0; i < 360; i++) {
		const angle = i * Math.PI / 180;
		const angleNext = (i + 1) * Math.PI / 180;
		const topCirclePoint = vec4(topCenter[0] + Math.cos(angle) * radius, topCenter[1], topCenter[2] + Math.sin(angle) * radius, 1.0);
		const topCirclePointNext = vec4(topCenter[0] + Math.cos(angleNext) * radius, topCenter[1], topCenter[2] + Math.sin(angleNext) * radius, 1.0);
		
		tri(topCenter, topCirclePoint, topCirclePointNext);
		index += 3; count += 3;
	}
	cylinderTopIndexLength = count;
	
	//Construct bottom part
	cylinderBottomStartIndex = cylinderStartIndex + index;
	count = 0;
	for (var i = 0; i < 360; i++) {
		const angle = i * Math.PI / 180;
		const angleNext = (i + 1) * Math.PI / 180;
		const bottomCirclePoint = vec4(bottomCenter[0] + Math.cos(angle) * radius, bottomCenter[1], bottomCenter[2] + Math.sin(angle) * radius, 1.0);
		const bottomCirclePointNext = vec4(bottomCenter[0] + Math.cos(angleNext) * radius, bottomCenter[1], bottomCenter[2] + Math.sin(angleNext) * radius, 1.0);
		
		tri(bottomCenter, bottomCirclePoint, bottomCirclePointNext);
		index += 3; count += 3;
	}
	cylinderBottomIndexLength = count;
	
	//Construct sides
	cylinderSideStartIndex = cylinderStartIndex + index;
	count = 0;
	for (var i = 0; i < 360; i++) {
		const angle = i * Math.PI / 180;
		const angleNext = (i + 1) * Math.PI / 180;
		const topCirclePoint = vec4(topCenter[0] + Math.cos(angle) * radius, topCenter[1], topCenter[2] + Math.sin(angle) * radius, 1.0);
		const topCirclePointNext = vec4(topCenter[0] + Math.cos(angleNext) * radius, topCenter[1], topCenter[2] + Math.sin(angleNext) * radius, 1.0);
		const bottomCirclePoint = vec4(bottomCenter[0] + Math.cos(angle) * radius, bottomCenter[1], bottomCenter[2] + Math.sin(angle) * radius, 1.0);
		const bottomCirclePointNext = vec4(bottomCenter[0] + Math.cos(angleNext) * radius, bottomCenter[1], bottomCenter[2] + Math.sin(angleNext) * radius, 1.0);
		
		quadNoFan(topCirclePoint, topCirclePointNext, bottomCirclePointNext, bottomCirclePoint);
		index += 6; count += 6;
	}
	cylinderSideIndexLength = count;
	
	cylinderIndexLength = cylinderTopIndexLength + cylinderBottomIndexLength + cylinderSideIndexLength;
	ellipsoidStartIndex = cylinderStartIndex + cylinderIndexLength;
}

function ellipsoid()
{
	const radius = 0.5;
	var count = 0;
	
	const divisionDetail = 50;
	
	for (var i = 0; i < divisionDetail; i++) {
		const angle1 = (i / divisionDetail) * Math.PI * 2;
		const angle1Next = ((i + 1) / divisionDetail) * Math.PI * 2;
		for (var j = 0; j < divisionDetail; j++) {
			const angle2 = (j / divisionDetail) * Math.PI * 2;
			const angle2Next = ((j + 1) / divisionDetail) * Math.PI * 2;
			
			
			const v1 = vec4(radius * Math.sin(angle1) * Math.cos(angle2), radius * Math.sin(angle1) * Math.sin(angle2), radius * Math.cos(angle1));
			const v2 = vec4(radius * Math.sin(angle1Next) * Math.cos(angle2), radius * Math.sin(angle1Next) * Math.sin(angle2), radius * Math.cos(angle1Next));
			const v3 = vec4(radius * Math.sin(angle1Next) * Math.cos(angle2Next), radius * Math.sin(angle1Next) * Math.sin(angle2Next), radius * Math.cos(angle1Next));
			const v4 = vec4(radius * Math.sin(angle1) * Math.cos(angle2Next), radius * Math.sin(angle1) * Math.sin(angle2Next), radius * Math.cos(angle1));
			
			quadNoFan(v1,v2,v3,v4);
			count += 6;
		}
	}
	ellipsoidIndexLength = count;
}

function drawColoredCube(sideColors) {
	for (var i = 0; i < 6; i++) {
		for (var j = 0; j < 4; j++) {
			colorsArray[i * 4 + j] = sideColors[i];
		}
	}
	
	gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );
	for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function drawColoredCylinder(topColor, bottomColor, sidesColor) {
	for (var i = 0; i < cylinderTopIndexLength; i++)
		colorsArray[i + cylinderTopStartIndex] = topColor;
	for (var i = 0; i < cylinderBottomIndexLength; i++)
		colorsArray[i + cylinderBottomStartIndex] = bottomColor;
	for (var i = 0; i < cylinderSideIndexLength; i++)
		colorsArray[i + cylinderSideStartIndex] = sidesColor;
	
	//gl.bufferSubData(gl.ARRAY_BUFFER, cylinderStartIndex, flatten(colorsArray.slice(cylinderStartIndex, cylinderStartIndex + cylinderIndexLength)));
	gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );
	gl.drawArrays(gl.TRIANGLES, cylinderStartIndex, cylinderIndexLength);
}

function drawColoredEllipsoid(color) {
	for (var i = 0; i < ellipsoidIndexLength; i++) {
			colorsArray[i + ellipsoidStartIndex] = color;
	}
	
	gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );
	gl.drawArrays(gl.TRIANGLES, ellipsoidStartIndex, ellipsoidIndexLength);
}

function defineSliders() {
	sliders.push({name:"Torso x-Axis Rotation Angle", id:torsoId, min:-180, max:180, val:0})
    sliders.push({name:"Torso y-Axis Rotation Angle", id:torso2Id, min:-180, max:180, val:0})
	sliders.push({name:"Head 1 Angle", id:headId, min:-30, max:80, val:0})
	sliders.push({name:"Head 2 Angle", id:head2Id, min:-35, max:35, val:0})
	sliders.push({name:"Neck Angle", id:neckId, min:-30, max:75, val:0})
    sliders.push({name:"Neck 2 Angle", id:neck2Id, min:-60, max:60, val:0})
	sliders.push({name:"Left Upper Arm Angle", id:leftUpperArmId, min:-50, max:50, val:0})
	sliders.push({name:"Left Lower Arm Angle", id:leftLowerArmId, min:-60, max:60, val:0})
	sliders.push({name:"Right Upper Arm Angle", id:rightUpperArmId, min:-50, max:50, val:0})
	sliders.push({name:"Right Lower Arm Angle", id:rightLowerArmId, min:-60, max:50, val:0})
	sliders.push({name:"Left Upper Leg Angle", id:leftUpperLegId, min:-40, max:65, val:0})
	sliders.push({name:"Left Lower Leg Angle", id:leftLowerLegId, min:-40, max:40, val:0})
    sliders.push({name:"Right Upper Leg Angle", id:rightUpperLegId, min:-40, max:65, val:0})
    sliders.push({name:"Right Lower Leg Angle", id:rightLowerLegId, min:-40, max:40, val:0})
	sliders.push({name:"Left Upper Wing Angle", id:leftUpperWingId, min:-20, max:60, val:0})
    sliders.push({name:"Left Lower Wing Angle", id:leftLowerWingId, min:-90, max:0, val:0})
    sliders.push({name:"Right Upper Wing Angle", id:rightUpperWingId, min:-20, max:60, val:0})
	sliders.push({name:"Right Lower Wing Angle", id:rightLowerWingId, min:-90, max:0, val:0})
    sliders.push({name:"Upper Tail Angle", id:upperTailId, min:0, max:90, val:0})
    sliders.push({name:"Lower Tail Angle", id:lowerTailId, min:-60, max:45, val:0})
	sliders.push({name:"Global X", id:globalXId, min:-20, max:20, val:0})
	sliders.push({name:"Global Y", id:globalYId, min:0, max:20, val:0})
	sliders.push({name:"Global Z", id:globalZId, min:-20, max:20, val:0})
}

function initSliders() {
	const slidersTable = document.getElementById("slidersTable");

	for (var i = 0; i < sliders.length; i++) {
		const sliderInfo = sliders[i]
		const val = theta[sliderInfo.id];
		const newSlider = document.createElement("input");
		newSlider.setAttribute("value", val);
		newSlider.setAttribute("min", sliderInfo.min);
		newSlider.setAttribute("max", sliderInfo.max);
		newSlider.setAttribute("step", 1);
		newSlider.setAttribute("type", "range");
		newSlider.setAttribute("id", "slider"+sliderInfo.id);
		
		const newSliderTd = document.createElement("tr");
		const nameTr = document.createElement("td");
		nameTr.appendChild(document.createTextNode(sliderInfo.name + " "));
		const minTr = document.createElement("td");
		minTr.appendChild(document.createTextNode(sliderInfo.min));
		const sliderTr = document.createElement("td");
		sliderTr.appendChild(newSlider);
		const maxTr = document.createElement("td");
		maxTr.appendChild(document.createTextNode(sliderInfo.max));
		
		newSliderTd.appendChild(nameTr);
		newSliderTd.appendChild(minTr);
		newSliderTd.appendChild(sliderTr);
		newSliderTd.appendChild(maxTr);
		slidersTable.appendChild(newSliderTd);
		
		newSlider.addEventListener("input", function() {
				theta[sliderInfo.id] = event.srcElement.value;
				initNodes(sliderInfo.id);
				initNodes(torsoId); //TODO fix, this is because changing global coordinates do not update the torso
		});
	}
	
	const lightingRatioSlider = document.getElementById("lightingRatioSlider");
	console.log(lightingRatioSlider);
	lightingRatioSlider.addEventListener('input', function() {
		lightingRatio = event.srcElement.value;
		gl.uniform1f(gl.getUniformLocation(program, 
		   "lightingRatio"),lightingRatio);
		   console.log("here");
	});
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    gl.enable( gl.DEPTH_TEST );
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader");
    
    gl.useProgram( program);

    instanceMatrix = mat4();
    
    projectionMatrix = ortho(-10.0,10.0,-10.0, 10.0,-10.0,10.0);
    modelViewMatrix = mat4();

        
    gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( gl.getUniformLocation( program, "projectionMatrix"), false, flatten(projectionMatrix) );
    
    modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix")
    viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix")
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix")
    
    cube();
    cylinder();
	ellipsoid();
        
	var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );	
		
    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
	
	gl.uniform3fv(gl.getUniformLocation(program, "ambientLight"),
       flatten(ambientLight));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), 
       flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, 
       "shininess"),shininess);
    gl.uniform1f(gl.getUniformLocation(program, 
       "lightingRatio"),lightingRatio);
	
	defineSliders();
	initSliders();
	
    for(i=0; i<numNodes; i++) initNodes(i);
	
	initAnimationUI();
	handleMouseMovement();
    
    render();
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

			if (yChange < 0) {
				if (psi - yChange / 180 < Math.PI / 2) psi -= yChange / 180;
			} else {
				if (psi - yChange / 180 > 0) psi -= yChange / 180;
			}
			phi -= xChange / 180;
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

function rerenderAllNodes() {
    for(i=0; i<numNodes; i++) initNodes(i);
}

function renderTerrain() {
    var terrainInstanceMatrix = mat4();
    terrainInstanceMatrix = mult(terrainInstanceMatrix, translate(0,-5.5,0));
    terrainInstanceMatrix = mult(terrainInstanceMatrix, scale4(100,1,100));
	setModelViewMatrix(terrainInstanceMatrix);
	
    const terrainCubeColors = [vertexColors[3],vertexColors[3],vertexColors[3],vertexColors[3],vertexColors[3],vertexColors[3]];
	drawColoredCube(terrainCubeColors);
}

var render = function() {

        gl.clear( gl.COLOR_BUFFER_BIT );
		renderTerrain();
        traverse(torsoId);
        requestAnimFrame(render);
}
