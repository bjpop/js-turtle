// draw some randomly placed coloured stripes

function fun(count) {
   while (count-- > 0)
   {
      var x = random(-150, 150);
      var y = random(-150, 150);
      goto(x,y);
      var r = random(0, 255);
      var g = random(0, 255);
      var b = random(0, 255);
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
