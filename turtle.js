//@ts-check
'use strict';
/*
vars that should be private/local but are public/global, should be prefixed with `_`.

public API (for the user) fns should sanitize their inputs, usually via unary-plus `+`.
*/

// get a handle for each canvas in the document
/**@type {HTMLCanvasElement}*/
const _imageCanvas = document.getElementById('imagecanvas');
const _imageCtx = _imageCanvas.getContext('2d');

_imageCtx.textAlign = 'center';
_imageCtx.textBaseline = 'middle';

/**@type {CanvasRenderingContext2D}*/
const _turtleCtx = document.getElementById('turtlecanvas').getContext('2d');

// the turtle takes precedence when compositing
_turtleCtx.globalCompositeOperation = 'destination-over';

/**
 * specification of relative coordinates for drawing turtle shapes,
 * as lists of [x,y] pairs.
 * (The shapes are borrowed from cpython turtle.py)
 */
const shapes = {
    triangle: [[-5, 0], [5, 0], [0, 15]],
    turtle: [[0, 16], [-2, 14], [-1, 10], [-4, 7], [-7, 9],
               [-9, 8], [-6, 5], [-7, 1], [-5, -3], [-8, -6],
               [-6, -8], [-4, -5], [0, -7], [4, -5], [6, -8],
               [8, -6], [5, -3], [7, 1], [6, 5], [9, 8],
               [7, 9], [4, 7], [1, 10], [2, 14]],
    square: [[10, -10], [10, 10], [-10, 10], [-10, -10]],
    circle: [[10, 0], [9.51, 3.09], [8.09, 5.88],
               [5.88, 8.09], [3.09, 9.51], [0, 10],
               [-3.09, 9.51], [-5.88, 8.09], [-8.09, 5.88],
               [-9.51, 3.09], [-10, 0], [-9.51, -3.09],
               [-8.09, -5.88], [-5.88, -8.09], [-3.09, -9.51],
               [-0.00, -10.00], [3.09, -9.51], [5.88, -8.09],
               [8.09, -5.88], [9.51, -3.09]]
};

const _DEFAULT_SHAPE = 'triangle';

/** turtle-object constructor. For better "IntelliSense" and less code duplication */
const _defaultTurtle = () => ({
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
    shape: _DEFAULT_SHAPE,
    colour: {
        r: 0,
        g: 0,
        b: 0,
        a: 1
    }
});

// initialise the state of the turtle
let turtle = _defaultTurtle();

/**
 * draw the turtle and the current image if `redraw` is `true`.
 * for complicated drawings it is much faster to turn `redraw` off.
*/
const drawIf = () => { turtle.redraw && draw(); };

/**
 * use canvas centered coordinates facing upwards
 * @param {CanvasRenderingContext2D} ctx
 */
const _centerCoords = ctx => {
    const {width: w, height: h} = ctx.canvas;
    ctx.translate(w / 2, h / 2);
    ctx.transform(1, 0, 0, -1, 0, 0);
};

/** draw the turtle and the current image */
const draw = () => {
    _clearCtx(_turtleCtx);
    if (turtle.visible) {
        const {x, y} = turtle.pos;

        _turtleCtx.save();
        _centerCoords(_turtleCtx);
        // move the origin to the turtle center
        _turtleCtx.translate(x, y);
        // rotate about the center of the turtle
        _turtleCtx.rotate(-turtle.angle);
        // move the turtle back to its position
        _turtleCtx.translate(-x, -y);

        /**
         * the type isn't guaranteed, because `shapes` isn't `freeze`d nor `seal`ed,
         * so the user may mutate it
         * @type {number[][]}
        */
        const icon = shapes[
            shapes.hasOwnProperty(turtle.shape) ? turtle.shape : _DEFAULT_SHAPE
        ];
        const iconLen = icon.length;

        // draw the turtle icon
        _turtleCtx.beginPath();
        if (iconLen > 0)
            _turtleCtx.moveTo(x + icon[0][0], y + icon[0][1]);
        for (let i=1; i < iconLen; i++) {
            const [cx, cy] = icon[i];
            _turtleCtx.lineTo(x + cx, y + cy);
        }
        _turtleCtx.closePath();

        _turtleCtx.fillStyle = 'green';
        _turtleCtx.fill();
        _turtleCtx.restore();
    }
    _turtleCtx.drawImage(_imageCanvas, 0, 0, 300, 300, 0, 0, 300, 300);
};

const _clearCtx = (/**@type {CanvasRenderingContext2D}*/ ctx) => {
    const {width: w, height: h} = ctx.canvas;
    ctx.save();
    ctx.setTransform( 1,0,0,1,0,0 );
    ctx.clearRect( 0,0,w,h );
    ctx.restore();
};

/** clear the display, don't move the turtle */
const clear = () => {
    _clearCtx(_imageCtx);
    drawIf();
};

/**
 * reset the whole system, clear the display and move turtle back to
 * origin, facing the Y axis.
*/
const reset = () => {
    // initialise
    turtle = _defaultTurtle();
    _imageCtx.lineWidth = turtle.width;
    _imageCtx.strokeStyle = 'black';
    _imageCtx.globalAlpha = 1;

    clear();
    draw();
};

/**
 * Trace the forward motion of the turtle, allowing for possible
 * wrap-around at the boundaries of the canvas.
 * @param {number} distance
 */
const forward = distance => {
    _imageCtx.save();
    _centerCoords(_imageCtx);
    _imageCtx.beginPath();

    // get the boundaries of the canvas
    const
        {width: w, height: h} = _imageCanvas,
        maxX = w / 2, minX = -maxX,
        maxY = h / 2, minY = -maxY,
        {abs, sin, cos} = Math;

    /**
     * Returns the sine and cosine of a number, as a 2-tuple.
     * @param {number} x
     */
    const sin_cos = x => [sin(x), cos(x)];

    let {x, y} = turtle.pos;

    // trace out the forward steps
    while (distance > 0) {
        // move to the current location of the turtle
        _imageCtx.moveTo(x, y);

        // calculate the new location of the turtle after doing the forward movement
        const
            [sinAngle, cosAngle] = sin_cos(turtle.angle),
            newX = x + sinAngle * distance,
            newY = y + cosAngle * distance;

        /**
         * wrap on the X boundary
         * @param {number} cutBound
         * @param {number} otherBound
         */
        const xWrap = (cutBound, otherBound) => {
            const distanceToEdge = abs((cutBound - x) / sinAngle);
            const edgeY = cosAngle * distanceToEdge + y;
            _imageCtx.lineTo(cutBound, edgeY);
            distance -= distanceToEdge;
            x = otherBound;
            y = edgeY;
        };
        /**
         * wrap on the Y boundary
         * @param {number} cutBound
         * @param {number} otherBound
         */
        const yWrap = (cutBound, otherBound) => {
            const distanceToEdge = abs((cutBound - y) / cosAngle);
            const edgeX = sinAngle * distanceToEdge + x;
            _imageCtx.lineTo(edgeX, cutBound);
            distance -= distanceToEdge;
            x = edgeX;
            y = otherBound;
        };
        /** don't wrap the turtle on any boundary */
        const noWrap = () => {
            _imageCtx.lineTo(newX, newY);
            turtle.pos.x = newX;
            turtle.pos.y = newY;
            distance = 0;
        };
        // if wrap is on, trace a part segment of the path and wrap on boundary if necessary
        if (turtle.wrap)
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
        // wrap is not on.
        else
            noWrap();
    }
    // only draw if the pen is currently down.
    turtle.penDown && _imageCtx.stroke();
    _imageCtx.restore();
    drawIf();
};

/**
 * turn edge wrapping on/off
 * @param {boolean} b
 */
const wrap = b => { turtle.wrap = b; };

const hideTurtle = () => {
    turtle.visible = false;
    drawIf();
};

const showTurtle = () => {
    turtle.visible = true;
    drawIf();
};

/**
 * turn on/off redrawing
 * @param {boolean} b
 */
const redrawOnMove = b => { turtle.redraw = b; };

/** lift up the pen (don't draw) */
const penup = () => { turtle.penDown = false; };
/** put the pen down (do draw) */
const pendown = () => { turtle.penDown = true; };

/**
 * turn right by an angle in degrees
 * @param {number} angle
 */
const right = angle => {
    turtle.angle += _degToRad(angle);
    drawIf();
};

/**
 * turn left by an angle in degrees
 * @param {number} angle
 */
const left = angle => {
    turtle.angle -= _degToRad(angle);
    drawIf();
};

/**
 * move the turtle to a particular coordinate (don't draw on the way there)
 * @param {number} x
 * @param {number} y
 */
const goto = (x, y) => {
    turtle.pos.x = +x;
    turtle.pos.y = +y;
    drawIf();
};

/**
 * set the angle of the turtle in degrees
 * @param {number} a
 */
const angle = a => { turtle.angle = _degToRad(a); };

/**
 * convert degrees to radians
 * @param {number} deg
 */
const _degToRad = deg => deg / 180 * Math.PI;

/**
 * convert radians to degrees
 * @param {number} rad
 */
const _radToDeg = rad => rad * 180 / Math.PI;

/**
 * set the width of the line
 * @param {number} w
 */
const width = w => {
    w = +w;
    turtle.width = w;
    _imageCtx.lineWidth = w;
};

/**
 * write some text at the turtle position, with custom or default font.
 *
 * ideally we'd like this to rotate the text based on
 * the turtle orientation, but this will require some clever
 * canvas transformations which aren't implemented yet.
 * @param {string} msg
 * @param {string} font
 */
const write = (msg, font) => {
    const {x, y} = turtle.pos;

    _imageCtx.save();
    _centerCoords(_imageCtx);

    //_imageCtx.rotate(turtle.angle);
    _imageCtx.translate(x, y);
    _imageCtx.transform(1, 0, 0, -1, 0, 0);
    _imageCtx.translate(-x, -y);
    _imageCtx.font = font;
    _imageCtx.fillText(msg, x, y);
    _imageCtx.restore();

    drawIf();
};

/**
 * set the turtle draw shape
 *
 * currently supports triangle (default), circle, square, and turtle
 * @param {string} s
 */
const shape = s => {
    turtle.shape = s;
    draw();
};

/**
 * set background color using RGB values in the range 0 - 255.
 *
 * currently, this has the unintended effect of wiping the entire canvas.
 * (to-do: fix later)
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {number} a alpha
 */
const bgColour = (r, g, b, a) => {
    const {width: w, height: h} = _imageCanvas;
    _imageCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    _imageCtx.fillRect(0, 0, w, h);
};
const bgColor = bgColour;

/**
 * set line color using RGB values in the range 0 - 255.
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {number} a alpha
 */
const colour = (r, g, b, a) => {
    r = +r;
    g = +g;
    b = +b;
    a = +a;

    _imageCtx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    const c = turtle.colour;
    c.r = r;
    c.g = g;
    c.b = b;
    c.a = a;
};
const color = colour;

/**
 * Returns a pseudo-random integer in the range `min` <= n <= `max` (inclusive)
 * @param {number} min
 * @param {number} max
 */
const random = (min, max) => {
    min = +min;
    max = +max;

    return Math.floor(Math.random() * (max - min + 1) + min);
};

/**
 * repeatedly run an "action" callback `n` times
 * @param {number} n (integer)
 * @param {Function} action (callback)
 */
const repeat = (n, action) => { while (n-- > 0) action(); };

/**
 * `setInterval` alias, but 2-adic (no rest args)
 * @param {TimerHandler} f
 * @param {number | undefined} ms
 */
const animate = (f, ms) => setInterval(f, ms);

/**
 * main program/script, mostly UI code.
 *
 * this fn is used to encapsulate private stuff that the user shouldn't access
 */
const _main = () => {
    const doc = document;

    // simplify history API
    const History = class {
        constructor(maxLen = 1 << 16) {
            this.maxLen = maxLen;
        }
    };

    /** to navigate command history (a queue) */
    const cmdHist = [];
    /** current hist index */
    let cmdIdx = 0;
    /**
     * total size of the history in memory.
     *
     * for performance, it's measured in **code-units** (16b or 2B), not bytes (8b or 1B).
     */
    let cmdHistSize = 0;

    /**
     * append command to history
     * @param {string} cmdTxt
     */
    const histAdd = cmdTxt => {
        // queue, then set index to newest entry
        cmdIdx = cmdHist.push(cmdTxt);
        // ensure it's up-to-date, to avoid memory leaks
        cmdHistSize += cmdTxt.length;
    };

    /**
     * removes old history entries until memory-use is lower.
     * essentially, explicit garbage collection.
     */
    const histFlush = () => {
        /** max CUs to store until a cmd is cleared from history queue */
        const HIST_SIZE_LIMIT = 1 << 20;
        while (cmdHistSize > HIST_SIZE_LIMIT) {
            // dequeue, then update size
            cmdHistSize -= cmdHist.shift().length;
            cmdIdx--; // index correction
        }
    };

    /**@type {HTMLInputElement}*/
    const cmdBox = doc.getElementById('command');

    cmdBox.addEventListener('keydown', ({ key }) => {
        switch (key) {
            // Moves up and down in command history
            case 'ArrowDown':
                cmdIdx = Math.min(cmdIdx + 1, cmdHist.length); // clamp
                break;
            case 'ArrowUp':
                cmdIdx = Math.max(cmdIdx - 1, 0); // index must be unsigned
                break;
            // Execute program in the command box when user presses any "Enter" or "Return" keys
            case 'Enter':
                return runCmd();
            default:
                return;
        }
        // external fall-through, only executed if `return` isn't touched
        cmdBox.value = cmdHist[cmdIdx] || '';
    }, false);

    /**@type {HTMLTextAreaElement}*/
    const def = doc.getElementById('definitions');

    const runCmd = () => {
        const cmdText = cmdBox.value;
        histAdd(cmdText);
        histFlush();

        const definitionsText = def.value;
        // https://stackoverflow.com/questions/19357978/indirect-eval-call-in-strict-mode
        // "JS never ceases to surprise me" @Rudxain
        try {
            // execute any code in the definitions box
            (0, eval)(definitionsText);
            // execute the code in the command box
            (0, eval)(cmdText);
        } catch (e) {
            alert('Exception thrown:\n' + e);
            throw e;
        } finally {
            // clear the command box
            cmdBox.value = '';
        }
    }

    // Execute program in the command box when user presses "Run"
    doc.getElementById('runButton').addEventListener('click', runCmd);
    doc.getElementById('resetButton').addEventListener('click', reset);
    reset();
};

_main();
