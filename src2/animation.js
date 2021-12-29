var keyframes = [];
var allFrames = [];
var keyframeGlobalId = 1;

const defaultFramesPerSecond = 60;
var framesPerSecond = defaultFramesPerSecond;
const animationSliderMax = 1000;

var speedMultiplier = 1;
var loopEnabled = false;
var lastTimeout;

function initAnimationUI() {
	const addKeyframeButton = document.getElementById("addKeyframeButton");
	addKeyframeButton.onclick = function(event) {
		const keyframeName = "Keyframe " + keyframeGlobalId;
		keyframes.push({
			id: keyframeGlobalId,
			name: keyframeName,
			theta: [...theta],
			duration: 1
		});
		keyframeGlobalId++;
		updateKeyframeSquares();
    };
	
	
	const startAnimationButton = document.getElementById("startAnimationButton");
	startAnimationButton.onclick = function(event) {
		if (keyframes.length < 2) return;
		if(!lastTimeout) {
			updateKeyframeSquares();
			generateAllFrames();
			playAnimation(0);
		}
    };
	
	const stopAnimationButton = document.getElementById("stopAnimationButton");
	stopAnimationButton.onclick = function(event) {
		if (lastTimeout) {
			clearTimeout(lastTimeout);
			lastTimeout = null;
		}
    };
	
	const saveAnimationButton = document.getElementById("saveAnimationButton");
	saveAnimationButton.onclick = function(event) {
		saveAnimation();
    };
	
	const loadAnimationButton = document.getElementById("loadAnimationButton");
	loadAnimationButton.onchange = function(event) {
		var fr = new FileReader();
		fr.readAsText(this.files[0]);
		fr.onload=function(){
			obj = fr.result;
			var parsed_keyframes = JSON.parse(obj);
			keyframes = parsed_keyframes;
			keyframeGlobalId = keyframes[keyframes.length - 1].id + 1;
			updateKeyframeSquares();
		}
    };
	
	const animationSlider = document.getElementById("animationSlider");
	animationSlider.oninput = function(event) {
        var val = event.srcElement.value;
		var frac = val / animationSliderMax;
		var frameIndex = Math.floor(frac * allFrames.length);
		setFrame(frameIndex);
    };
	
	const loopCheckbox = document.getElementById("enableLoop");
	loopCheckbox.onchange = function(event) {
        loopEnabled = event.target.checked;
    };
	
	const speedSlider = document.getElementById("speedSlider");
	speedSlider.addEventListener('input', function() {
		
		clearTimeout(lastTimeout);
		lastTimeout = null;
		
		speedMultiplier = event.srcElement.value;
		framesPerSecond = defaultFramesPerSecond / speedMultiplier;
		generateAllFrames();
	});
}

function setFrame(frameIndex) {
	if (keyframes.length < 2) return;
	
	if (frameIndex == allFrames.length) {
		setFrame(frameIndex - 1);
		lastTimeout = null;
		return false;
	}
	theta = allFrames[frameIndex].theta;
	rerenderAllNodes();
	
	const animationSlider = document.getElementById("animationSlider");
	animationSlider.value = frameIndex / allFrames.length * animationSliderMax;
	
	var keyframeDiv = document.getElementById("keyframe"+allFrames[frameIndex].keyframe);
	keyframeDiv.style.backgroundColor = "blue";
	
	for (var i = 0; i < theta.length; i++) {
		const slider = sliders.find(slider => slider.id === i);
		if (slider) {
			const thetaSlider = document.getElementById("slider"+i);
			thetaSlider.value = theta[i];
		}
	}
	
	return true;
}

function playAnimation(currFrameIndex) {
	if (setFrame(currFrameIndex))
		lastTimeout = setTimeout(function(){ playAnimation(currFrameIndex + 1) } , 1000/defaultFramesPerSecond);
	else if (loopEnabled) {
		updateKeyframeSquares();
		playAnimation(0);
	}
}

function updateKeyframeSquares() {
	const numKeyframes = keyframes.length;
	const keyframesDiv = document.getElementById("keyframesDiv");
	keyframesDiv.innerHTML = "";
	
	for (var i = 0; i < numKeyframes; i++) {
		const keyframe = keyframes[i];
		keyframesDiv.appendChild(getKeyframeSquare(keyframe));
	}
	generateAllFrames();
}

function getKeyframeSquare(keyframe) {
	
	var div = document.createElement('div');
	
	var durationDiv = document.createElement('div');
	var durationDivEditable = document.createElement('div');
	durationDivEditable.innerHTML = keyframe.duration;
	durationDivEditable.setAttribute('contentEditable', 'true');
	durationDivEditable.oninput = function(event) {
		keyframe.duration = parseFloat(event.target.innerText);
		generateAllFrames();
	};
	durationDiv.appendChild(document.createTextNode("Duration: "));
	durationDiv.appendChild(durationDivEditable);
	durationDiv.appendChild(document.createTextNode(" seconds"));
	durationDiv.setAttribute('class', 'FlexDiv KeyframeDurDiv');
	
		
	var nameDiv = document.createElement('div');
	var nameDivEditable = document.createElement('div');
	nameDivEditable.innerHTML = keyframe.name;
	nameDivEditable.setAttribute('contentEditable', 'true');
	nameDivEditable.oninput = function(event) {
		keyframe.name = event.target.innerText;
	};
	nameDiv.appendChild(document.createTextNode("Name: "));
	nameDiv.appendChild(nameDivEditable);
	nameDiv.setAttribute('class', 'FlexDiv KeyframeNameDiv');
	
	var buttonsDiv = document.createElement('div');
	buttonsDiv.setAttribute('class', 'KeyframeButtonsDiv');
	
	var gotoButton = document.createElement('button');
	gotoButton.appendChild(document.createTextNode("Go to"));
	gotoButton.setAttribute('class', 'styledButton');
	buttonsDiv.appendChild(gotoButton);
	
	var updateButton = document.createElement('button');
	updateButton.appendChild(document.createTextNode("Update"));
	updateButton.setAttribute('class', 'styledButton');
	buttonsDiv.appendChild(updateButton);
	
	var deleteButton = document.createElement('button');
	deleteButton.appendChild(document.createTextNode("Delete"));
	deleteButton.setAttribute('class', 'styledButton');
	buttonsDiv.appendChild(deleteButton);
	
	var leftButtonDiv = document.createElement('div');
	leftButtonDiv.setAttribute('class', 'LeftButton');
	var rightButtonDiv = document.createElement('div');
	rightButtonDiv.setAttribute('class', 'RightButton');
	
	var upButton = document.createElement('button');
	upButton.setAttribute('class', 'containerButton');
	upButton.innerHTML = "<div class=\"containerButton__triangle containerButton__triangle--left\"></div>";
	leftButtonDiv.appendChild(upButton);
	var downButton = document.createElement('button');
	downButton.setAttribute('class', 'containerButton');
	downButton.innerHTML = "<div class=\"containerButton__triangle containerButton__triangle--right\"></div>";
	rightButtonDiv.appendChild(downButton);
	
	upButton.onclick = function(event) {keyframeUp(keyframe)};
	gotoButton.onclick = function(event) {keyframeGoto(keyframe)};
	updateButton.onclick = function(event) {keyframeUpdate(keyframe)};
	deleteButton.onclick = function(event) {keyframeDelete(keyframe)};
	downButton.onclick = function(event) {keyframeDown(keyframe)};
	
	div.appendChild(nameDiv);
	div.appendChild(durationDiv);
	div.appendChild(buttonsDiv);
	div.appendChild(leftButtonDiv);
	div.appendChild(rightButtonDiv);
	div.setAttribute('class', 'KeyframeDiv containerKeyframe');
	div.setAttribute('id', 'keyframe' + keyframe.id);
	
	return div;
}

function keyframeIndex(keyframe) {
	return keyframes.findIndex((currKeyframe) => keyframe.id == currKeyframe.id);
}

function keyframeUp(keyframe) {
	const index = keyframeIndex(keyframe);
	if (index == 0) return;
	swapKeyframes(index, index - 1);
	updateKeyframeSquares();
}

function keyframeGoto(keyframe) {
	const currKeyframeIndex = keyframeIndex(keyframe);
	var frameIndex = 0;
	for (var i = 0; i < currKeyframeIndex; i++){
		frameIndex += keyframes[i].duration * framesPerSecond;
	}
	setFrame(frameIndex);
}

function keyframeUpdate(keyframe) {
	keyframe.theta = theta;
	updateKeyframeSquares();
	keyframeGoto(keyframe);
}

function keyframeDelete(keyframe) {
	const index = keyframeIndex(keyframe);
	keyframes.splice(index, 1);
	updateKeyframeSquares();
}

function keyframeDown(keyframe) {
	const index = keyframeIndex(keyframe);
	if (index == keyframes.length - 1) return;
	swapKeyframes(index, index + 1);
	updateKeyframeSquares();
}

function swapKeyframes(index1, index2) {
	const temp = keyframes[index1];
	keyframes[index1] = keyframes[index2];
	keyframes[index2] = temp;
}

function generateAllFrames() {
	allFrames = [];
	
	const numKeyframes = keyframes.length;
	for (var i = 0; i < numKeyframes - 1; i++) {
		const keyframe = keyframes[i];
		const nextKeyframe = keyframes[i + 1];
		const numFrames = keyframe.duration * framesPerSecond;
		for (var j = 0; j < numFrames; j++) {
			allFrames.push(
			{
				theta: getFrame(keyframe, nextKeyframe, keyframe.duration, j),
				keyframe: keyframe.id
			}
			);
		}
	}
}

function getFrame(currKeyframe, nextKeyframe, duration, frameIndex) {
	if (nextKeyframe) {
		const currTheta = currKeyframe.theta;
		const nextTheta = nextKeyframe.theta;
		
		return mix(currTheta, nextTheta, frameIndex / (duration * framesPerSecond));
	} else {
		return [...currKeyframe.theta];
	}
}

function saveAnimation() {
	var a = document.createElement('a');
	var content = JSON.stringify(keyframes);
	var blob = new Blob([content], {'type':'application/octet-stream'});
	a.href = window.URL.createObjectURL(blob);
	a.download = 'save.dat';
	a.click();
}