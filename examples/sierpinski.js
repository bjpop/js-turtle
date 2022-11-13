// draw a Sierpinski Curve of arbitrary recursive depth
// https://en.wikipedia.org/wiki/Sierpi%C5%84ski_curve

function halfSierpinski(size, level) {
   if (level <= 0)
      forward(size);
   else {
      const part = () => {
         halfSierpinski(size, level - 1);
         left(45);
         forward(size * Math.SQRT2);
         left(45);
         halfSierpinski(size, level - 1);
      };
      part();
      right(90);
      forward(size);
      right(90);
      part();
   }
}

function sierpinski(size, level) {
   function part() {
      halfSierpinski(size, level);
      right(90);
      forward(size);
      right(90);
   }
   part();
   part();
}

function demo() {
   hideTurtle();
   redrawOnMove(false);
   goto(0,-120);
   sierpinski(2,5);
   redrawOnMove(true);
   draw();
}
