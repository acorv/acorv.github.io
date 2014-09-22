var canvas
var ctx;

function init()
{
	canvas = document.getElementById("mainCanvas");
	ctx = canvas.getContext("2d");
	if( canvas.getContext )
	{
		startUp();	
	}
}


var count=50
var radius=5
var enabled=false

var maxAcc=1
var maxVel=5
var deathVel=12		
var deadTime=5000
var reactAcc=8
var width = 600;
var height = 400;

var microbes=new Array()

function startUp() 
{
  for(i=0;i<count;i++) {
   	microbe = new Microbe()
	microbes[i] = microbe
  }

  updateScreen()
}

function updateScreen() 
{
	ctx.save();
	ctx.fillStyle = "#113311";
	ctx.fillRect( 0 , 0 , width , height );
	ctx.restore();
	for (j=0; j<count; j++) 
		microbes[j].update()

	ctx.lineWidth=3;
	ctx.strokeRect( 0 , 0 , width , height );
}


function Microbe(N)
{
	this.x = Math.random()*width
	this.y = Math.random()*height
	this.rx = (Math.random()+1)*radius
	this.ry = this.rx

	this.alive = true
	this.rotation = 0
	this.velx = 1
	this.vely = 1
	this.accx = 1
	this.accy = 1
	this.death = new Date().getTime();
	this.color = "#777777"

	this.update = function(){
	    	with(this){
			var vel = Math.sqrt(Math.pow(velx,2)+ Math.pow(vely,2));

			if (!alive) {
				if (new Date().getTime()-death.getTime()>deadTime) {
					alive=true;
				}
			}
			
			if (vel>deathVel) {
				alive=false;
				death=new Date();
			}
			
			x+=velx;
			y+=vely;
			
			velx+=accx;
			vely+=accy;
			
			if (alive) {
				this.modifyAccel();
				this.curbSpeed();
				keepInBoundaries();
			} else {
				this.slowdown();
			}
			deform();
			modifyColor();

			ctx.save();
			ctx.fillStyle=color
			ctx.translate(x,y);
			ctx.rotate(rotation);
			ctx.globalAlpha=0.5
			ctx.scale(rx/rx, ry/rx);
			ctx.beginPath();
			ctx.lineWidth=3;
			ctx.arc(0, 0, rx, 0, Math.PI*2, false);
			ctx.fill();
			ctx.stroke();
			ctx.closePath();
			ctx.restore();

		}
	}

	this.react = function (cX, cY, power) {
		with(this) {
			var dist  = Math.sqrt(Math.abs(cX-x)+ Math.abs(cY-y));
			var distX = Math.abs(cX-x);			
			var distY = Math.abs(cY-y);			

			var totalDist = distX+distY;
			distX=distX/totalDist;
			distY=distY/totalDist;
			
			var power = Math.min(1, power/Math.pow(dist,2));
			
			if (x>cX) {
				accx+=reactAcc*power*distX;
			} else {
				accx-=reactAcc*power*distX;
			}
			
			if (y>cY) {
				accy+=reactAcc*power*distY;
			} else {
				accy-=reactAcc*power*distY;
			}
		}
	}
	this.slowdown = function()  {
		with(this) {
			accx=0;
			accy=0;
			velx = Math.floor(velx);
			vely = Math.floor(vely);
			
			if (velx>0) {
				velx-=1;
			}  else if (velx< 0) {
				velx+= 1;
			}

			if (vely>0) {
				vely-=1;
			}  else if (vely< 0) {
				vely+= 1;
			}
		}
	}
	this.deform = function()  {
		with(this) {
			var angle = 0;
			var vel = Math.sqrt(Math.pow(velx,2)+ Math.pow(vely,2));
			if (vel!=0) {
				if (velx>0 && vely>=0) {
					angle=Math.PI/2+ (vely/vel);
				}
				if (velx>0 && vely<0) {
					angle=(velx/vel);
				}
				if (velx<=0 && vely>=0) {
					angle=Math.PI+(-velx/vel);
				}
				if (velx<=0 && vely<0) {
					angle=Math.PI*(3/2)+(-vely/vel);
				}
				rotation=angle;
				ry=rx + 3*(Math.min(vel, maxVel)/maxVel);			
			}

		}
	}
	this.modifyColor = function(){
		with(this) {
			var vel = Math.sqrt(Math.pow(velx,2)+ Math.pow(vely,2));
			var green= 100+ 100*(vel/maxVel);
			if (green>255) green=255;
			color = "#50"+ Math.floor(green).toString(16)+"50"
		}
	}
	this.modifyAccel = function() {
		with(this) {
			if (accx>=maxAcc) {
				accx-=1;
			}  else if (accx<= -maxAcc) {
				accx+= 1;
			}  else  {
				if(Math.random()>.66) {
					accx++;
				} else if(Math.random()>.5) {
					accx--;
				} 
			} 
			if (accy>=maxAcc) {
				accy-=1;
			}  else if (accy<= -maxAcc) {
				accy+=1;
			}  else  {
				if(Math.random()>.66) {
					accy++;
				} else if(Math.random()>.5) {
					accy--;
				} 
			} 
		}
	}
				
	this.curbSpeed = function() {
		with(this) {
			if (velx>maxVel) {
				velx-=Math.random()*2;
			}

			if (vely>maxVel) {
				vely-=Math.random()*2;
			}

			if (velx< -maxVel) {
				velx+=Math.random()*2;
			}

			if (vely< -maxVel) {
				vely+=Math.random()*2;
			}
		}
	}
		
	this.keepInBoundaries = function() {
		with(this) {
			if (x<0) {
				accx=maxAcc;
			}
			if (y<0) {
				accy=maxAcc;
			}

			if (y>height) {
				accy= -maxAcc;
			}

			if (x>width) {
				accx= -maxAcc;
			}
		}
	}



}

function rad2deg(rad) {
	return (rad*360)/(2*Math.PI);
}

function mouseClick(e)
{
  if (!enabled) {
      setInterval("updateScreen()",30);
      enabled=true;
  } else {
	for (i in microbes) microbes[i].react(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop, 100)
  }
}

