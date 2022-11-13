// draw some randomly placed coloured stripes

function fun(count) {
   while (count-- > 0) {
      goto(random(-150, 150), random(-150, 150));
      colour(
         random(0,255),
         random(0,255),
         random(0,255),
         Math.random()
      );
      angle(random(0,180));
      width(random(1,10));
      forward(random(10, 30));
   }
}

function demo(count) {
   hideTurtle();
   redrawOnMove(false);
   fun(count);
   redrawOnMove(true);
   draw();
}
