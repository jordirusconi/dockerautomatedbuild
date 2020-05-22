/*===============================

Countdown.
Based on Kerem Suer dribble shot:
http://dribbble.com/shots/560534

change value of the variable --countTo-- to set the timer.
Would love to see someone adding a UI to this one.

=================================*/

(function drawCanvas(){

  var canvas = document.getElementById('timer');
  var ctx = canvas.getContext('2d');
  var cWidth=canvas.width;
  var cHeight=canvas.height;

  var countTo;
  var min = 0;
  var sec = 0;
  var counter = 0;
  var angle = 270;
  var inc = 0;
  var start = -100;
/* 
	  
	if (sec<=0 && counter<countTo) {
		angle+=inc;
		counter++;
		min--;
		sec=59;
	} else if (counter>=countTo) {
		sec=0;
		min=0;
	} else {
		angle+=inc;
		counter++;
		sec--;
	}
*/

  var socket = io.connect('https://timer.ipratico.app');
  //var socket = io.connect('http://192.168.0.107:3000');

  socket.on('timeNow', function(total, time) {
	var countFrom = parseInt(total);  
  	countTo = parseInt(time);
  	
  	console.log(start +" != "+ countFrom);
  	
  	if (start != countFrom) {
	  	start = countFrom;
	  	angle = 270;
		console.log("reset angle "+ angle);
		if (start != time) {
			angle = time * (360/start);
		}
	}
	  
    console.log("timeNow "+ time +" - "+ angle);
    
    if (countTo >= 0) {
	    min = Math.floor(countTo/60);
	    sec = countTo-(min*60);
	    counter = 0;
	    inc = 360/start;
	    angle += inc;
	    drawScreen();
    }
  });

  function drawScreen() {

    //======= reset canvas

    ctx.fillStyle="#2e3032";
    ctx.fillRect(0,0,cWidth,cHeight);

    //========== base arc

    ctx.beginPath();
    ctx.strokeStyle="#252424";
    ctx.lineWidth=14;
    ctx.arc(cWidth/2,cHeight/2,100,(Math.PI/180)*0,(Math.PI/180)*360,false);
    ctx.stroke();
    ctx.closePath();

    //========== dynamic arc

    ctx.beginPath();
    ctx.strokeStyle="#df8209";
    ctx.lineWidth=14;
    ctx.arc(cWidth/2,cHeight/2,100,(Math.PI/180)*270,(Math.PI/180)*angle,false);
    ctx.stroke();
    ctx.closePath();

    //======== inner shadow arc

    grad=ctx.createRadialGradient(cWidth/2,cHeight/2,80,cWidth/2,cHeight/2,115);
    grad.addColorStop(0.0,'rgba(0,0,0,.4)');
    grad.addColorStop(0.5,'rgba(0,0,0,0)');
    grad.addColorStop(1.0,'rgba(0,0,0,0.4)');

    ctx.beginPath();
    ctx.strokeStyle=grad;
    ctx.lineWidth=14;
    ctx.arc(cWidth/2,cHeight/2,100,(Math.PI/180)*0,(Math.PI/180)*360,false);
    ctx.stroke();
    ctx.closePath();

    //======== bevel arc

    grad=ctx.createLinearGradient(cWidth/2,0,cWidth/2,cHeight);
    grad.addColorStop(0.0,'#6c6f72');
    grad.addColorStop(0.5,'#252424');

    ctx.beginPath();
    ctx.strokeStyle=grad;
    ctx.lineWidth=1;
    ctx.arc(cWidth/2,cHeight/2,93,(Math.PI/180)*0,(Math.PI/180)*360,true);
    ctx.stroke();
    ctx.closePath();

    //====== emboss arc

    grad=ctx.createLinearGradient(cWidth/2,0,cWidth/2,cHeight);
    grad.addColorStop(0.0,'transparent');
    grad.addColorStop(0.98,'#6c6f72');

    ctx.beginPath();
    ctx.strokeStyle=grad;
    ctx.lineWidth=1;
    ctx.arc(cWidth/2,cHeight/2,107,(Math.PI/180)*0,(Math.PI/180)*360,true);
    ctx.stroke();
    ctx.closePath();

    //====== Labels

    var textColor='#646464';
    var textSize="12";
    var fontFace="helvetica, arial, sans-serif";

    ctx.fillStyle = textColor;
    ctx.font = textSize+"px "+fontFace;
    ctx.fillText('MIN',cWidth/2-46,cHeight/2-40);
    ctx.fillText('SEC',cWidth/2+25,cHeight/2-15);

    //====== Values



    ctx.fillStyle='#6292ae';

    ctx.font='65px '+ fontFace;
    ctx.fillText(min ,cWidth/2-72,cHeight/2+35);

    ctx.font='40px '+ fontFace;
    if (sec<10) {
      ctx.fillText('0'+sec,cWidth/2+20,cHeight/2+35);
    }
    else {
      ctx.fillText(sec,cWidth/2+20,cHeight/2+35);
    }


    
  }

})()
