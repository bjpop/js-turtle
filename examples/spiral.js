// randomly spaced spirals

function spiral(steps,angle) {
   var widthInc = 5 / steps;
   var w = 0.1;
   while (steps-- > 0) {
      width(w);
      forward(random(1,10));
      right(angle--);
      w += widthInc;
   }
}

function fun(count) {
   while (count-- > 0) {
      var r = random(0,255);
      var g = random(0,255);
      var b = random(0,255);
      var a = Math.random();
      colour(r,g,b,a);
      var x = random(-150,150);
      var y = random(-150, 150);
      goto(x,y);
      var theta = random(0,360);
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
