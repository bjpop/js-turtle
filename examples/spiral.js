// randomly spaced spirals

function spiral(steps, angle) {
   const widthInc = 5 / steps;
   let w = 0.1;
   while (steps-- > 0) {
      width(w);
      forward(random(1,10));
      right(angle--);
      w += widthInc;
   }
}

function fun(count) {
   while (count-- > 0) {
      const
         r = random(0,255),
         g = random(0,255),
         b = random(0,255),
         a = Math.random();
      colour(r,g,b,a);
      const
         x = random(-150,150),
         y = random(-150, 150);
      goto(x,y);
      const theta = random(0,360);
      angle(theta);
      spiral(random(100,1000), random(5,90));
   }
}

function demo(count) {
   hideTurtle();
   redrawOnMove(false);
   fun(count);
   redrawOnMove(true);
   draw();
}
