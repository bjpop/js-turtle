// https://en.wikipedia.org/wiki/Sierpi%C5%84ski_curve

function part(size, level) {
   level--;
   halfSierpinski(size, level);
   left(45);
   forward(size * Math.SQRT2);
   left(45);
   halfSierpinski(size, level);
}

/** helper for `sierpinski` */
function halfSierpinski(size, level) {
   if (level <= 0) {
      forward(size);
      return;
   }
   part(size, level);
   right(90);
   forward(size);
   right(90);
   part(size, level);
}

/** draw a Sierpinski Curve of arbitrary recursive depth */
function sierpinski(size, level) {
   function half() {
      halfSierpinski(size, level);
      right(90);
      forward(size);
      right(90);
   }
   half();
   half();
}

function demo() {
   hideTurtle();
   redrawOnMove(false);
   goto(0,-120);
   sierpinski(2,5);
   redrawOnMove(true);
   draw();
}
