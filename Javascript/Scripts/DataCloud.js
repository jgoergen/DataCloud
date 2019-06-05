var DataCloud = function(settings) {
    "use strict";

    /// Default Settings ////////////////////////////////////////////

    var TAG_BASE_SIZE = 8;
    var WIDTH_PADDING = 20;
    var HEIGHT_PADDING = 20;
    var VALUE_SIZE_RAMP = 5;
    var COLLISION_BUMP_X = 2;
    var COLLISION_BUMP_Y = 5;
    var MOVEMENT_TWEEN_RATE = 10;
    var LIMIT = 40;
    var SWAY_STRENGTH = 5;
    var SWAY_DECAY_RATE = 100;
    var MAX_VALUE = 35;

    /////////////////////////////////////////////////////////

    var data = new Array();
    var targetItem = null;
    var mouseTargetItem = null;
    var qualifiedTags = new Array();
    var swayDecay = 0;
    var stageWidth = 0;
    var stageHeight = 0;

    function init(settings) {

        if (settings.hasOwnProperty("width"))
            stageWidth = settings.width;

        if (settings.hasOwnProperty("height"))
            stageHeight = settings.height;

        if (settings.hasOwnProperty("data"))
            settings.data.forEach(item => addItem(item));
    }

    function resetDataCloud() {

        data = new Array();
        mouseTargetItem = null;
        targetItem = null;
        qualifiedTags = new Array();
    }

    function update(ctx, clientX, clientY) {

        ctx.clearRect(0, 0, stageWidth, stageHeight);

        recalcPositions();

        if (swayDecay < SWAY_DECAY_RATE)
            runRandomSway();

        var mouseX = clientX;
        var mouseY = clientY;
        mouseTargetItem = null;

        for (var i = 0; i < qualifiedTags.length; i++) {

            if (mouseX > qualifiedTags[i].x && mouseX < (qualifiedTags[i].x + qualifiedTags[i].width) &&
                mouseY < qualifiedTags[i].y && mouseY > (qualifiedTags[i].y - qualifiedTags[i].height))
                mouseTargetItem = i;

            qualifiedTags[i].actualSize += ((qualifiedTags[i].value - qualifiedTags[i].actualSize) / MOVEMENT_TWEEN_RATE);

            if (i == targetItem) {

                // item is focused
                ctx.font = "bold " + (TAG_BASE_SIZE + (qualifiedTags[i].actualSize * VALUE_SIZE_RAMP) + 5) + "px Arial";
                ctx.fillStyle = "#00F";

            } else if (i == mouseTargetItem) {

                // mouse is over item
                ctx.font = (TAG_BASE_SIZE + (qualifiedTags[i].actualSize * VALUE_SIZE_RAMP)) + "px Arial";
                ctx.fillStyle = "#00F";

            } else {

                // default state
                ctx.font = (TAG_BASE_SIZE + (qualifiedTags[i].actualSize * VALUE_SIZE_RAMP)) + "px Arial";
                ctx.fillStyle = "#000";
            }

            qualifiedTags[i].actualX += ((qualifiedTags[i].x - qualifiedTags[i].actualX) / MOVEMENT_TWEEN_RATE);
            qualifiedTags[i].actualY += ((qualifiedTags[i].y - qualifiedTags[i].actualY) / MOVEMENT_TWEEN_RATE);

            ctx.fillText(qualifiedTags[i].phrase, qualifiedTags[i].actualX, qualifiedTags[i].actualY);
        }

        if (mouseTargetItem != null)
            document.body.style.cursor = "pointer";
        else
            document.body.style.cursor = "default";
    }

    function runRandomSway() {

        swayDecay ++;

        if (qualifiedTags.length < 1)
            return;

        var whichTag = Math.floor(Math.random() * qualifiedTags.length);
        qualifiedTags[whichTag].x += ((Math.random() * SWAY_STRENGTH) - (SWAY_STRENGTH / 2));
        qualifiedTags[whichTag].y += ((Math.random() * SWAY_STRENGTH) - (SWAY_STRENGTH / 2));
    }

    function recalcSizes() {

        var currentTargetTagPhrase = "";

        if (qualifiedTags.length > 0 && targetItem != null)
            currentTargetTagPhrase = qualifiedTags[targetItem].phrase;

        targetItem = null;
        qualifiedTags = new Array();

        var sortedTags =
            data.sort(
                function (x, y) {
                    return x.value < y.value;
                }
            );

        for (var i = 0; i < Math.min(sortedTags.length, LIMIT); i++) {

            if (sortedTags[i].phrase == currentTargetTagPhrase)
                targetItem = i;

            qualifiedTags.push(sortedTags[i]);
        }

        for (var i = 0; i < qualifiedTags.length; i++) {

            ctx.font = (TAG_BASE_SIZE + (qualifiedTags[i].value * VALUE_SIZE_RAMP)) + "px Arial";

            qualifiedTags[i].width = ctx.measureText(qualifiedTags[i].phrase).width + WIDTH_PADDING;
            qualifiedTags[i].height = (qualifiedTags[i].value * VALUE_SIZE_RAMP) + HEIGHT_PADDING;
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

                    if (qualifiedTags[i].x > (stageWidth - qualifiedTags[i].width))
                        qualifiedTags[i].x = (stageWidth - qualifiedTags[i].width);

                    if (qualifiedTags[o].x > (stageWidth - qualifiedTags[o].width))
                        qualifiedTags[o].x = (stageWidth - qualifiedTags[o].width);

                    if (qualifiedTags[i].y < 0)
                        qualifiedTags[i].y = 0;

                    if (qualifiedTags[o].y < 0)
                        qualifiedTags[o].y = 0;

                    if (qualifiedTags[i].y > (stageHeight - qualifiedTags[i].height))
                        qualifiedTags[i].y = (stageHeight - qualifiedTags[i].height);

                    if (qualifiedTags[o].y > (stageHeight - qualifiedTags[o].height))
                        qualifiedTags[o].y = (stageHeight - qualifiedTags[o].height);

                    if (qualifiedTags[i].x > qualifiedTags[o].x) {
                        qualifiedTags[i].x += COLLISION_BUMP_X;
                        qualifiedTags[o].x -= COLLISION_BUMP_X;
                    } else {
                        qualifiedTags[i].x -= COLLISION_BUMP_X;
                        qualifiedTags[o].x += COLLISION_BUMP_X;
                    }

                    if (qualifiedTags[i].y > qualifiedTags[o].y) {
                        qualifiedTags[i].y += COLLISION_BUMP_Y;
                        qualifiedTags[o].y -= COLLISION_BUMP_Y;
                    } else {
                        qualifiedTags[i].y -= COLLISION_BUMP_Y;
                        qualifiedTags[o].y += COLLISION_BUMP_Y;
                    }
                }
            }
        }
    }

    function doBoxesIntersect(a, b) {

        return (Math.abs(a.x - b.x) * 2 < (a.width + b.width)) &&
            (Math.abs(a.y - b.y) * 2 < (a.height + b.height));
    }

    function addItem(_item) {

        var itemIndex = -1;

        for (var i = 0; i < data.length; i++)
            if (data[i].phrase == _item)
                itemIndex = i;

        if (itemIndex > -1) {

            if (data[itemIndex].value < MAX_VALUE)
                data[itemIndex].value ++;

        } else {

            var baseX = Math.floor(stageWidth / 2) + (Math.floor(Math.random() * 30) - 15);
            var baseY = Math.floor(stageHeight / 2) + (Math.floor(Math.random() * 30) - 15);

            data.push({
                phrase: _item,
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
        }

        console.log(data);
        recalcSizes();
    }

    init(settings);

    return {
        update: update,
        addItem: addItem
    };
}