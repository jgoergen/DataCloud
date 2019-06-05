/// Settings ////////////////////////////////////////////

var FPS = 60;
var TAG_BASE_SIZE = 8;
var STAGE_WIDTH = 300;
var STAGE_HEIGHT = 1200;
var WIDTH_PADDING = 20;
var HEIGHT_PADDING = 20;
var TAG_VALUE_SIZE_RAMP = 5;
var TAG_COLLISION_BUMP_X = 2;
var TAG_COLLISION_BUMP_Y = 5;
var MOVEMENT_TWEEN_RATE = 10;
var TAG_LIMIT = 40;
var SWAY_STRENGTH = 2;
var SWAY_DECAY_RATE = 100;
var MAX_TAG_VALUE = 15;

var TAG_INJECTIONS = 10;

/////////////////////////////////////////////////////////

var tags = new Array();
var canvasRect = null;
var clientX = null;
var clientY = null;
var targetTag = null;
var mouseTargetTag = null;
var tagList = null;
var imageBubbleContainer = null;
var intervalID = 0;
var cloudContainer = null;
var qualifiedTags = new Array();
var swayDecay = 0;

function init() {

    tagList = document.getElementById("tagList");
    imageBubbleContainer = document.getElementById("imagebubbles");
    cloudContainer = document.getElementById("cloudContainer");

    window.addEventListener("resize", updateCanvasBounds);

    canvasRect = canvas.getBoundingClientRect();

    canvas.addEventListener('mousemove', function (evt) {

        clientX = evt.layerX;
        clientY = evt.layerY;
    }, false);

    canvas.addEventListener('mousedown', function (evt) {

        if (mouseTargetTag == null)
            return;

        targetTag = mouseTargetTag;
        clickTag(mouseTargetTag);
    }, false);
}

function updateCanvasBounds() {

    STAGE_WIDTH = cloudContainer.offsetWidth;
    canvas.width = STAGE_WIDTH;
    canvasRect = canvas.getBoundingClientRect();
}

function clickListTag(_elem) {

    for (var i = 0; i < qualifiedTags.length; i++)
        if (qualifiedTags[i].phrase == _elem.className)
            targetTag = i;

    clickTag(targetTag);
}

function clickTag(_targetTag) {

    var images = document.getElementsByClassName("bubbleImage");

    for (var i = 0; i < images.length; i++) {

        if (images[i].className.indexOf(qualifiedTags[_targetTag].phrase) > -1) {

            images[i].classList.remove("taghidden");
            images[i].classList.add("tagshown");
        } else {

            images[i].classList.add("taghidden");
            images[i].classList.remove("tagshown");
        }
    }
}

function resetDataCloud() {

    tags = new Array();
    mouseTargetTag = null;
    targetTag = null;
    qualifiedTags = new Array();
}

function draw() {

    ctx.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);

    recalcPositions();

    if (swayDecay < SWAY_DECAY_RATE)
        runRandomSway();

    var mouseX = clientX;
    var mouseY = clientY;
    mouseTargetTag = null;

    for (var i = 0; i < qualifiedTags.length; i++) {

        if (mouseX > qualifiedTags[i].x && mouseX < (qualifiedTags[i].x + qualifiedTags[i].width) &&
            mouseY < qualifiedTags[i].y && mouseY > (qualifiedTags[i].y - qualifiedTags[i].height))
            mouseTargetTag = i;

        qualifiedTags[i].actualSize += ((qualifiedTags[i].value - qualifiedTags[i].actualSize) / MOVEMENT_TWEEN_RATE);

        if (i == targetTag) {

            // tag is focused
            fontColor = "#00F";
            ctx.font = "bold " + (TAG_BASE_SIZE + (qualifiedTags[i].actualSize * TAG_VALUE_SIZE_RAMP) + 5) + "px Arial";
            ctx.fillStyle = "#00F";

        } else if (i == mouseTargetTag) {

            // mouse is over tag
            fontColor = "#00F";
            ctx.font = (TAG_BASE_SIZE + (qualifiedTags[i].actualSize * TAG_VALUE_SIZE_RAMP)) + "px Arial";
            ctx.fillStyle = "#00F";

        } else {

            // default state
            ctx.font = (TAG_BASE_SIZE + (qualifiedTags[i].actualSize * TAG_VALUE_SIZE_RAMP)) + "px Arial";
            ctx.fillStyle = "#000";
        }

        qualifiedTags[i].actualX += ((qualifiedTags[i].x - qualifiedTags[i].actualX) / MOVEMENT_TWEEN_RATE);
        qualifiedTags[i].actualY += ((qualifiedTags[i].y - qualifiedTags[i].actualY) / MOVEMENT_TWEEN_RATE);

        ctx.fillText(qualifiedTags[i].phrase, qualifiedTags[i].actualX, qualifiedTags[i].actualY);
    }

    if (mouseTargetTag != null)
        document.body.style.cursor = "pointer";
    else
        document.body.style.cursor = "default";
}

function runRandomSway() {

    swayDecay++;

    if (qualifiedTags.length < 1)
        return;

    var whichTag = Math.floor(Math.random() * qualifiedTags.length);
    qualifiedTags[whichTag].x += ((Math.random() * SWAY_STRENGTH) - (SWAY_STRENGTH / 2));
    qualifiedTags[whichTag].y += ((Math.random() * SWAY_STRENGTH) - (SWAY_STRENGTH / 2));
}

function recalcSizes() {

    var currentTargetTagPhrase = "";

    if (qualifiedTags.length > 0 && targetTag != null)
        currentTargetTagPhrase = qualifiedTags[targetTag].phrase;

    targetTag = null;
    qualifiedTags = new Array();

    var sortedTags =
        tags.sort(
            function (x, y) {
                return x.value < y.value;
            }
        );

    for (var i = 0; i < Math.min(sortedTags.length, TAG_LIMIT); i++) {

        if (sortedTags[i].phrase == currentTargetTagPhrase)
            targetTag = i;

        qualifiedTags.push(sortedTags[i]);
    }

    for (var i = 0; i < qualifiedTags.length; i++) {

        ctx.font = (TAG_BASE_SIZE + (qualifiedTags[i].value * TAG_VALUE_SIZE_RAMP)) + "px Arial";

        qualifiedTags[i].width = ctx.measureText(qualifiedTags[i].phrase).width + WIDTH_PADDING;
        qualifiedTags[i].height = (qualifiedTags[i].value * TAG_VALUE_SIZE_RAMP) + HEIGHT_PADDING;
    }
}

function recalcPositions() {

    for (var i = 0; i < qualifiedTags.length; i++) {

        for (var o = 0; o < qualifiedTags.length; o++) {

            if (doBoxesIntersect(qualifiedTags[i], qualifiedTags[o])) {

                if (qualifiedTags[i].x < 0)
                    qualifiedTags[i].x = 0;

                if (qualifiedTags[o].x < 0)
                    qualifiedTags[o].x = 0;

                if (qualifiedTags[i].x > (STAGE_WIDTH - qualifiedTags[i].width))
                    qualifiedTags[i].x = (STAGE_WIDTH - qualifiedTags[i].width);

                if (qualifiedTags[o].x > (STAGE_WIDTH - qualifiedTags[o].width))
                    qualifiedTags[o].x = (STAGE_WIDTH - qualifiedTags[o].width);

                if (qualifiedTags[i].y < 0)
                    qualifiedTags[i].y = 0;

                if (qualifiedTags[o].y < 0)
                    qualifiedTags[o].y = 0;

                if (qualifiedTags[i].y > (STAGE_HEIGHT - qualifiedTags[i].height))
                    qualifiedTags[i].y = (STAGE_HEIGHT - qualifiedTags[i].height);

                if (qualifiedTags[o].y > (STAGE_HEIGHT - qualifiedTags[o].height))
                    qualifiedTags[o].y = (STAGE_HEIGHT - qualifiedTags[o].height);

                if (qualifiedTags[i].x > qualifiedTags[o].x) {
                    qualifiedTags[i].x += TAG_COLLISION_BUMP_X;
                    qualifiedTags[o].x -= TAG_COLLISION_BUMP_X;
                } else {
                    qualifiedTags[i].x -= TAG_COLLISION_BUMP_X;
                    qualifiedTags[o].x += TAG_COLLISION_BUMP_X;
                }

                if (qualifiedTags[i].y > qualifiedTags[o].y) {
                    qualifiedTags[i].y += TAG_COLLISION_BUMP_Y;
                    qualifiedTags[o].y -= TAG_COLLISION_BUMP_Y;
                } else {
                    qualifiedTags[i].y -= TAG_COLLISION_BUMP_Y;
                    qualifiedTags[o].y += TAG_COLLISION_BUMP_Y;
                }
            }
        }
    }
}

function doBoxesIntersect(a, b) {

    return (Math.abs(a.x - b.x) * 2 < (a.width + b.width)) &&
        (Math.abs(a.y - b.y) * 2 < (a.height + b.height));
}

function addImage(_url, _tags) {

    // add image to image bubbles
    var img = document.createElement('img');
    img.src = _url;
    img.className = "bubbleImage animated tagshown " + _tags.join(" ");
    imageBubbleContainer.appendChild(img);
}

function addUpdateTag(_tag) {

    var tagIndex = -1;

    for (var i = 0; i < tags.length; i++)
        if (tags[i].phrase == _tag)
            tagIndex = i;

    if (tagIndex > -1) {

        if (tags[tagIndex].value < MAX_TAG_VALUE)
            tags[tagIndex].value++;
    } else {

        var baseX = Math.floor(STAGE_WIDTH / 2) + (Math.floor(Math.random() * 30) - 15);
        var baseY = Math.floor(STAGE_HEIGHT / 3) + (Math.floor(Math.random() * 30) - 15);

        tags.push({
            phrase: _tag,
            x: baseX,
            y: baseY,
            actualX: baseX,
            actualY: baseY,
            actualSize: 0,
            width: 0,
            height: 0,
            value: 1
        });

        swayDecay = 0;
        updateCanvasBounds();
    }

    recalcSizes();
}

var canvas = null;
var ctx = null;
var now;
var then = Date.now();
var interval = 1000 / FPS;
var delta;

window.onload = function () {

    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    init();

    requestAnimationFrame(update);
}

function update() {

    now = Date.now();
    delta = now - then;

    if (delta > interval) {

        then = now - (delta % interval);
        draw();
    }

    requestAnimationFrame(update);
}