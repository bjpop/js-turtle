//@ts-check
'use strict';
const doc = document;

// get a handle for each canvas in the document
/**@type {HTMLCanvasElement}*/
const imageCanvas = doc.getElementById('imagecanvas');
const imageContext = imageCanvas.getContext('2d');

imageContext.textAlign = "center";
imageContext.textBaseline = "middle";

/**@type {HTMLCanvasElement}*/
const turtleCanvas = doc.getElementById('turtlecanvas');
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

/**turtle-object constructor. For better "IntelliSense" and less code duplication*/
const newTurtle = function() {
    return {
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
}

// initialise the state of the turtle
let turtle = newTurtle();

const initialise = function() {
    turtle = newTurtle();
    imageContext.lineWidth = turtle.width;
    imageContext.strokeStyle = "black";
    imageContext.globalAlpha = 1;
}

/**
 * draw the turtle and the current image if redraw is true.
 * for complicated drawings it is much faster to turn redraw off.
*/
function drawIf() {
    if (turtle.redraw) draw();
}

/**
 * use canvas centered coordinates facing upwards
 * @param {CanvasRenderingContext2D} context
 */
function centerCoords(context) {
    context.translate(context.canvas.width / 2, context.canvas.height / 2);
    context.transform(1, 0, 0, -1, 0, 0);
}

/**draw the turtle and the current image*/
function draw() {
    clearContext(turtleContext);
    if (turtle.visible) {
        const x = turtle.pos.x;
        const y = turtle.pos.y;

        turtleContext.save();
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
            turtleContext[i==0 ? 'moveTo' : 'lineTo'](x+coord[0], y+coord[1]);
        }
        turtleContext.closePath();
        turtleContext.fillStyle = "green";
        turtleContext.fill();
        turtleContext.restore();
    }
    turtleContext.drawImage(imageCanvas, 0, 0, 300, 300, 0, 0, 300, 300);
}

/**clear the display, don't move the turtle*/
function clear() {
    clearContext(imageContext);
    drawIf();
}

function clearContext(/**@type {CanvasRenderingContext2D}*/ context) {
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.restore();
}

/**
 * reset the whole system, clear the display and move turtle back to
 * origin, facing the Y axis.
*/
function reset() {
    initialise();
    clear();
    draw();
}

/**
 * Trace the forward motion of the turtle, allowing for possible
 * wrap-around at the boundaries of the canvas.
 * @param {number} distance
 */
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
        // move to the current location of the turtle
        imageContext.moveTo(x, y);

        // calculate the new location of the turtle after doing the forward movement
        const cosAngle = Math.cos(turtle.angle);
        const sinAngle = Math.sin(turtle.angle);
        const newX = x + sinAngle * distance;
        const newY = y + cosAngle * distance;

        /**
         * wrap on the X boundary
         * @param {number} cutBound
         * @param {number} otherBound
         */
        const xWrap = function(cutBound, otherBound) {
            const distanceToEdge = Math.abs((cutBound - x) / sinAngle);
            const edgeY = cosAngle * distanceToEdge + y;
            imageContext.lineTo(cutBound, edgeY);
            distance -= distanceToEdge;
            x = otherBound;
            y = edgeY;
        }
        /**
         * wrap on the Y boundary
         * @param {number} cutBound
         * @param {number} otherBound
         */
        const yWrap = function(cutBound, otherBound) {
            const distanceToEdge = Math.abs((cutBound - y) / cosAngle);
            const edgeX = sinAngle * distanceToEdge + x;
            imageContext.lineTo(edgeX, cutBound);
            distance -= distanceToEdge;
            x = edgeX;
            y = otherBound;
        }
        /**don't wrap the turtle on any boundary*/
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

/**
 * turn edge wrapping on/off
 * @param {boolean} b
 */
function wrap(b) {
    turtle.wrap = b;
}

function hideTurtle() {
    turtle.visible = false;
    drawIf();
}

function showTurtle() {
    turtle.visible = true;
    drawIf();
}

/**
 * turn on/off redrawing
 * @param {boolean} b
 */
function redrawOnMove(b) {
    turtle.redraw = b;
}

/**lift up the pen (don't draw)*/
function penup() {
    turtle.penDown = false;
}
/**put the pen down (do draw)*/
function pendown() {
    turtle.penDown = true;
}

/**
 * turn right by an angle in degrees
 * @param {number} angle
 */
function right(angle) {
    turtle.angle += degToRad(angle);
    drawIf();
}

/**
 * turn left by an angle in degrees
 * @param {number} angle
 */
function left(angle) {
    turtle.angle -= degToRad(angle);
    drawIf();
}

// move the turtle to a particular coordinate (don't draw on the way there)
/**
 * @param {number} x
 * @param {number} y
 */
function goto(x, y) {
    turtle.pos.x = x;
    turtle.pos.y = y;
    drawIf();
}

// set the angle of the turtle in degrees
/**
 * @param {any} angle
 */
function angle(angle) {
    turtle.angle = degToRad(angle);
}

/**
 * convert degrees to radians
 * @param {number} deg
 */
function degToRad(deg) {
    return deg / 180 * Math.PI;
}

/**
 * convert radians to degrees
 * @param {number} rad
 */
function radToDeg(rad) {
    return rad * 180 / Math.PI;
}

/**
 * set the width of the line
 * @param {number} w
 */
function width(w) {
    turtle.width = w;
    imageContext.lineWidth = w;
}

/**
 * write some text at the turtle position.
 *
 * ideally we'd like this to rotate the text based on
 * the turtle orientation, but this will require some clever
 * canvas transformations which aren't implemented yet.
 * @param {string} msg
 */
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

/**
 * set the turtle draw shape, currently supports
 * triangle (default), circle, square and turtle
 * @param {string} s
 */
function shape(s) {
    turtle.shape = s;
    draw();
}

/**
 * set the colour of the line using RGB values in the range 0 - 255.
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {number} a
 */
function colour(r, g, b, a) { // should this have a `color` alias?
    imageContext.strokeStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
    turtle.colour.r = r;
    turtle.colour.g = g;
    turtle.colour.b = b;
    turtle.colour.a = a;
}

/**
 * https://docs.python.org/3/library/random.html#random.randint
 * @param {number} low
 * @param {number} hi
 */
function random(low, hi) {
    return Math.floor(Math.random() * (hi - low + 1) + low);
}

/**
 * @param {number} n
 * @param {() => void} action
 */
function repeat(n, action) {
    for (let count = 1; count <= n; count++)
        action();
}

/**
 * @param {TimerHandler} f
 * @param {number | undefined} ms
 */
function animate(f, ms) {
    return setInterval(f, ms);
}

/**
 * @param {string} font
 */
function setFont(font) {
    imageContext.font = font;
}

//////////////////
// UI code below//
//////////////////

// Navigate command history
const cmddHist = [];
let cmdIdx = 0;
let commandHistSize = 0; // measured in code-units, not bytes

// append command to history
const histAdd = function(/** @type {string | any[]} */ cmdTxt) {
    // queue and set index to newest entry
    cmdIdx = cmddHist.push(cmdTxt);
    commandHistSize += cmdTxt.length;
}
// removes old entries until memory use is lower
// essentially, explicit garbage collection
const histFlush = function() {
    // max CUs to store until a cmd is cleared from history queue
    const HIST_SIZE_LIMIT = 1 << 20;
    while (commandHistSize > HIST_SIZE_LIMIT) {
        // dequeue, then update size
        commandHistSize -= cmddHist.shift().length;
        cmdIdx--; // index correction
    }
}

/**@type {HTMLInputElement}*/
const cmdBox = doc.getElementById('command');

// Moves up and down in command history
cmdBox.addEventListener("keydown", function(e) {
    if (e.key == "ArrowUp") {
        if (--cmdIdx < 0)
            cmdIdx = 0;
        cmdBox.value = cmddHist[cmdIdx] || "";
    }
    if (e.key == "ArrowDown") {
        if (++cmdIdx > cmddHist.length)
            cmdIdx = cmddHist.length;
        cmdBox.value = cmddHist[cmdIdx] || "";
    }
}, false);

/**@type {HTMLTextAreaElement}*/
const def = doc.getElementById('definitions')

const runCommand = function() {
    const commandText = cmdBox.value;
    histAdd(commandText);
    histFlush();
    const definitionsText = def.value;
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

// Execute the program in the command box when the user presses "Run" button or any "Enter" key
doc.getElementById('runButton').addEventListener('click', runCommand);
cmdBox.addEventListener('keydown', function(e) {
    if (e.key == "Enter") runCommand();
});

doc.getElementById('resetButton').addEventListener('click', reset);

reset();
