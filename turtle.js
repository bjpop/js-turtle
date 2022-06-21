'use strict';
// get a handle for the canvases in the document
const imageCanvas = document.getElementById('imagecanvas');
const imageContext = imageCanvas.getContext('2d');

imageContext.textAlign = "center";
imageContext.textBaseline = "middle";

const turtleCanvas = document.getElementById('turtlecanvas');
const turtleContext = turtleCanvas.getContext('2d');

// the turtle takes precedence when compositing
turtleContext.globalCompositeOperation = 'destination-over';

// specification of relative coordinates for drawing turtle shapes,
// as lists of [x,y] pairs
// (The shapes are borrowed from cpython turtle.py)
const shapes = {
    "triangle" : [[-5, 0], [5, 0], [0, 15]],
    "turtle": [[0, 16], [-2, 14], [-1, 10], [-4, 7], [-7, 9],
               [-9, 8], [-6, 5], [-7, 1], [-5, -3], [-8, -6],
               [-6, -8], [-4, -5], [0, -7], [4, -5], [6, -8],
               [8, -6], [5, -3], [7, 1], [6, 5], [9, 8],
               [7, 9], [4, 7], [1, 10], [2, 14]],
    "square": [[10, -10], [10, 10], [-10, 10], [-10, -10]],
    "circle": [[10, 0], [9.51, 3.09], [8.09, 5.88],
               [5.88, 8.09], [3.09, 9.51], [0, 10],
               [-3.09, 9.51], [-5.88, 8.09], [-8.09, 5.88],
               [-9.51, 3.09], [-10, 0], [-9.51, -3.09],
               [-8.09, -5.88], [-5.88, -8.09], [-3.09, -9.51],
               [-0.00, -10.00], [3.09, -9.51], [5.88, -8.09],
               [8.09, -5.88], [9.51, -3.09]]
};

// initialise the state of the turtle
let turtle = null;

function initialise() {
    turtle = {
        pos: {
            x: 0,
            y: 0
        },
        angle: 0,
        penDown: true,
        width: 1,
        visible: true,
        redraw: true, // does this belong here?
        wrap: true,
        shape: "triangle",
        colour: {
            r: 0,
            g: 0,
            b: 0,
            a: 1
        },
    };
    imageContext.lineWidth = turtle.width;
    imageContext.strokeStyle = "black";
    imageContext.globalAlpha = 1;
}

// draw the turtle and the current image if redraw is true
// for complicated drawings it is much faster to turn redraw off
function drawIf() {
    if (turtle.redraw) draw();
}

// use canvas centered coordinates facing upwards
function centerCoords(context) {
    context.translate(context.canvas.width / 2, context.canvas.height / 2);
    context.transform(1, 0, 0, -1, 0, 0);
}

// draw the turtle and the current image
function draw() {
    clearContext(turtleContext);
    if (turtle.visible) {
        const x = turtle.pos.x;
        const y = turtle.pos.y;
        turtleContext.save();
        // use canvas centered coordinates facing upwards
        centerCoords(turtleContext);
        // move the origin to the turtle center
        turtleContext.translate(x, y);
        // rotate about the center of the turtle
        turtleContext.rotate(-turtle.angle);
        // move the turtle back to its position
        turtleContext.translate(-x, -y);
        // draw the turtle icon
        const icon = shapes.hasOwnProperty(turtle.shape) ?
            turtle.shape : "triangle";
        turtleContext.beginPath();
        for (let i=0; i < shapes[icon].length; i++) {
            const coord = shapes[icon][i];
            if (i==0) {
                turtleContext.moveTo(x+coord[0], y+coord[1]);
            }
            else {
                turtleContext.lineTo(x+coord[0], y+coord[1]);
            }
        }
        turtleContext.closePath();
        turtleContext.fillStyle = "green";
        turtleContext.fill();
        turtleContext.restore();
    }
    turtleContext.drawImage(imageCanvas, 0, 0, 300, 300, 0, 0, 300, 300);
}

// clear the display, don't move the turtle
function clear() {
    clearContext(imageContext);
    drawIf();
}

function clearContext(context) {
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.restore();
}

// reset the whole system, clear the display and move turtle back to
// origin, facing the Y axis.
function reset() {
    initialise();
    clear();
    draw();
}

// Trace the forward motion of the turtle, allowing for possible
// wrap-around at the boundaries of the canvas.
function forward(distance) {
    imageContext.save();
    centerCoords(imageContext);
    imageContext.beginPath();
    const canv = imageContext.canvas;
    // get the boundaries of the canvas
    const maxX = canv.width / 2, minX = -maxX;
    const maxY = canv.height / 2, minY = -maxY;
    let x = turtle.pos.x;
    let y = turtle.pos.y;
    // trace out the forward steps
    while (distance > 0) {
        // move the to current location of the turtle
        imageContext.moveTo(x, y);
        // calculate the new location of the turtle after doing the forward movement
        const cosAngle = Math.cos(turtle.angle);
        const sinAngle = Math.sin(turtle.angle);
        const newX = x + sinAngle * distance;
        const newY = y + cosAngle * distance;
        // wrap on the X boundary
        const xWrap = function(cutBound, otherBound) {
            const distanceToEdge = Math.abs((cutBound - x) / sinAngle);
            const edgeY = cosAngle * distanceToEdge + y;
            imageContext.lineTo(cutBound, edgeY);
            distance -= distanceToEdge;
            x = otherBound;
            y = edgeY;
        }
        // wrap on the Y boundary
        const yWrap = function(cutBound, otherBound) {
            const distanceToEdge = Math.abs((cutBound - y) / cosAngle);
            const edgeX = sinAngle * distanceToEdge + x;
            imageContext.lineTo(edgeX, cutBound);
            distance -= distanceToEdge;
            x = edgeX;
            y = otherBound;
        }
        // don't wrap the turtle on any boundary
        const noWrap = function() {
            imageContext.lineTo(newX, newY);
            turtle.pos.x = newX;
            turtle.pos.y = newY;
            distance = 0;
        }
        // if wrap is on, trace a part segment of the path and wrap on boundary if necessary
        if (turtle.wrap) {
            if (newX > maxX)
                xWrap(maxX, minX);
            else if (newX < minX)
                xWrap(minX, maxX);
            else if (newY > maxY)
                yWrap(maxY, minY);
            else if (newY < minY)
                yWrap(minY, maxY);
            else
                noWrap();
        }
        // wrap is not on.
        else {
            noWrap();
        }
    }
    // only draw if the pen is currently down.
    if (turtle.penDown)
        imageContext.stroke();
    imageContext.restore();
    drawIf();
}

// turn edge wrapping on/off
function wrap(bool) {
    turtle.wrap = bool;
}

// show/hide the turtle
function hideTurtle() {
    turtle.visible = false;
    drawIf();
}

// show/hide the turtle
function showTurtle() {
    turtle.visible = true;
    drawIf();
}

// turn on/off redrawing
function redrawOnMove(bool) {
    turtle.redraw = bool;
}

// lift up the pen (don't draw)
function penup() {
    turtle.penDown = false;
}
// put the pen down (do draw)
function pendown() {
    turtle.penDown = true;
}

// turn right by an angle in degrees
function right(angle) {
    turtle.angle += degToRad(angle);
    drawIf();
}

// turn left by an angle in degrees
function left(angle) {
    turtle.angle -= degToRad(angle);
    drawIf();
}

// move the turtle to a particular coordinate (don't draw on the way there)
function goto(x, y) {
    turtle.pos.x = x;
    turtle.pos.y = y;
    drawIf();
}

// set the angle of the turtle in degrees
function angle(angle) {
    turtle.angle = degToRad(angle);
}

// convert degrees to radians
function degToRad(deg) {
    return deg / 180 * Math.PI;
}

// convert radians to degrees
function radToDeg(rad) {
    return rad * 180 / Math.PI;
}

// set the width of the line
function width(w) {
    turtle.width = w;
    imageContext.lineWidth = w;
}

// write some text at the turtle position.
// ideally we'd like this to rotate the text based on
// the turtle orientation, but this will require some clever
// canvas transformations which aren't implemented yet.
function write(msg) {
    const x = turtle.pos.x;
    const y = turtle.pos.y;
    imageContext.save();
    centerCoords(imageContext);
    //imageContext.rotate(turtle.angle);
    imageContext.translate(x, y);
    imageContext.transform(1, 0, 0, -1, 0, 0);
    imageContext.translate(-x, -y);
    imageContext.fillText(msg, x, y);
    imageContext.restore();
    drawIf();
}

// set the turtle draw shape, currently supports
// triangle (default), circle, square and turtle
function shape(s) {
    turtle.shape = s;
    draw();
}

// set the colour of the line using RGB values in the range 0 - 255.
function colour(r, g, b, a) { // should this have a `color` alias?
    imageContext.strokeStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
    turtle.colour.r = r;
    turtle.colour.g = g;
    turtle.colour.b = b;
    turtle.colour.a = a;
}

// equivalent to: https://docs.python.org/3/library/random.html#random.randint
function random(low, hi) {
    return Math.floor(Math.random() * (hi - low + 1) + low);
}

function repeat(n, action) {
    for (let count = 1; count <= n; count++)
        action();
}

function animate(f, ms) {
    return setInterval(f, ms);
}

function setFont(font) {
    imageContext.font = font;
}

//////////////////
// UI code below//
//////////////////

// Navigate command history
const commandHist = [];
let commandIndex = 0;
let commandHistSize = 0; // measured in code-units, not bytes

// append command to history
const histAdd = function(cmdTxt) {
    // queue and set index to newest entry
    commandIndex = commandHist.push(cmdTxt);
    commandHistSize += cmdTxt.length;
}
// removes old entries until memory use is lower
// essentially, manual hi-level garbage collection
const histFlush = function() {
    // max CUs to store until a cmd is cleared from history queue
    const HIST_SIZE_LIMIT = 1 << 20;
    while (commandHistSize > HIST_SIZE_LIMIT) {
        // dequeue, then update size
        commandHistSize -= commandHist.shift().length;
        commandIndex--; // index correction
    }
}

const cmdBox = document.getElementById('command');

// Moves up and down in command history
cmdBox.addEventListener("keydown", function(e) {
    if (e.key == "ArrowUp") {
        if (--commandIndex < 0)
            commandIndex = 0;
        cmdBox.value = commandHist[commandIndex] || "";
    }
    if (e.key == "ArrowDown") {
        if (++commandIndex > commandHist.length)
            commandIndex = commandHist.length;
        cmdBox.value = commandHist[commandIndex] || "";
    }
}, false);

const runCommand = function() {
    const commandText = cmdBox.value;
    histAdd(commandText);
    histFlush();
    const definitionsText = document.getElementById('definitions').value;
    // https://stackoverflow.com/questions/19357978/indirect-eval-call-in-strict-mode
    // "JS never ceases to surprise me" @Rudxain
    try {
        // execute any code in the definitions box
        (0, eval)(definitionsText);
        // execute the code in the command box
        (0, eval)(commandText);
    } catch (e) {
        alert('Exception thrown:\n' + e);
        throw e;
    } finally {
        // clear the command box
        cmdBox.value = '';
    }
}

// Execute the program in the command box when the user presses "Run" button or "Enter" key
document.getElementById('runButton').addEventListener('click', runCommand);
cmdBox.addEventListener('keydown', function(e) {
    if (e.key == "Enter") runCommand();
});

document.getElementById('resetButton').addEventListener('click', reset);

reset();
