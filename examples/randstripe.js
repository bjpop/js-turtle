// draw some randomly placed coloured stripes

function fun(count) {
   while (count-- > 0)
   {
      const
         x = random(-150, 150),
         y = random(-150, 150);
      goto(x,y);
      const
         r = random(0, 255),
         g = random(0, 255),
         b = random(0, 255);
      colour(r, g, b, Math.random());
      angle(random(0, 180));
      width(random(1, 10));
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
