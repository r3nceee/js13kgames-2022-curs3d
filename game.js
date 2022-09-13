/** GAME TODO
 * [x] Making the Player move
 * [x] Making Enemies walk around
 * [x] Make Player dash to Enemies
 * [x] Make Player kill the enemy
 * [x] Give Player a Health Bar and decrement N/second
 * [x] Make Enemies heal the player at range
 * [x] Add particles
 * [x] Basic Spritesheet
 */
const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext('2d');
const ciw = window.innerWidth;
const cih = window.innerHeight;
canvas.width = ciw;
canvas.height = cih;

const frameWidth = 64;
const frameHeight = 100;
const PI = Math.PI * 2;
const spriteSize = 32;
const spriteSheet = new Image();
	  spriteSheet.src = 'spritesheet.png';	
const staggerFrames = 5;
function mr(){ return Math.random(); }

var gameStatus = 0;
var gameDelay = 0;
var gameEnding = 0;
var canvasPlay = 0;
var startTime = 0;
var gameTime = Date.now();
var spriteFrame = 0;
var gameFrame = 0;

// Screens
var sos = document.querySelector("#onscreen");
var sop = document.querySelector("#panel");
var bsg = document.querySelector("#startGame");
	bsg.addEventListener("click", function(){
		sos.style.display = 'none';
		canvasPlay = 1;
		gameAnimate();
		startTime = Date.now();
	});

var er = ["Live!", "HAHAHA!", "We'll heal you", "bro come here"];

// In game assets
var keys = {}
var player = {
	x: (ciw / 2) - 100,
	y: cih / 2,
	r: 1,
	ra: 40,
	velX: 0,
	velY: 0,
	health: 200,
	maxHealth: 200,
	experience: 0,
	experienceMax: 200,
	level: 0,
	color: "red",
	auraColor: "rgba(0,0,0,0.05)",
	speed: 10,
	friction: .80,

	spriteFrame: 0,
	spriteFrameY: 1,
	spriteCount: 2,

	power: 1,
	powerType: 0,
	powerA: 0,
	powerTO: null,

	healSFXTime: null,
	draw: function(){
		var isMoving = 0;

		// Controls
		if (keys[87]) {
			if (this.velY > -this.speed) {
				this.velY--;
			}
			isMoving = 1;
		}
		if (keys[83]) {
			if (this.velY < this.speed) {
				this.velY++;
			}
			isMoving = 1;
		}
		if (keys[68]) {
			if (this.velX < this.speed) {
				this.velX++;
			}
			isMoving = 1;
			this.spriteFrameY = 2;
		}
		if (keys[65]) {
			if (this.velX > -this.speed) {
				this.velX--;
			}
			isMoving = 1;
			this.spriteFrameY = 1;
		}

		this.velY 	*= this.friction;
		this.y 		+= this.velY;
		this.velX 	*= this.friction;
		this.x 		+= this.velX;

		// Aura
		ctx.fillStyle = this.auraColor;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.ra, 0, PI * 2);
		ctx.closePath();
		ctx.fill();

		// Sprite
		if( isMoving && this.spriteFrame >= this.spriteCount ){
			this.spriteFrame = 0;
		}else if( isMoving && gameFrame % staggerFrames === 0 ){
			this.spriteFrame++;
		}else if( isMoving == 0 ){
			this.spriteFrame = 0;
		}

		if( keys[32] ){
			this.friction = .60;
			this.spriteFrameY = 3;
		}else{
			this.friction = .80;
		}

		if( this.health > 0 ){
			ctx.filter = "saturate("+ (this.level) +")"; 
			ctx.drawImage(
				spriteSheet,
				this.spriteFrame * spriteSize - .5, this.spriteFrameY * spriteSize + 1, spriteSize, spriteSize,
				this.x - (52 / 2), this.y - (52 / 2), 52, 52
			);
		}else{
			loadParticles({
				x: this.x,
				y: this.y,
				color: "rgba(20, 204, 110, .75)",
				count: 10
			});
		}

		ctx.filter = "none";
	},
	drawBoards: function(){
		ctx.beginPath();
		ctx.fillStyle = 'rgba(0,0,0,0.25)';
		ctx.fillRect(20, 20, 200, 15);
		ctx.closePath();

		ctx.beginPath();
		ctx.fillStyle = 'red';
		ctx.fillRect(20, 20, this.health, 15);
		ctx.closePath();

		ctx.beginPath();
		ctx.fillStyle = 'rgba(0,0,0,0.25)';
		ctx.fillRect(20, 50, this.experienceMax, 10);
		ctx.closePath();

		ctx.beginPath();
		ctx.fillStyle = 'yellow';
		ctx.fillRect(20, 50, this.experience, 10);
		ctx.closePath();

		ctx.fillStyle = 'white';
		ctx.font = "15px Georgia";
		ctx.fillText(`LEVEL ${ this.level }`, 20, 80);

		// Draw the skill
		var b = ['Z', 'X', 'C'];
		for(var i = 0; i < 3; i++){
			if( !this.power || i > this.level ) ctx.filter = "saturate(0)";
			ctx.drawImage(
				spriteSheet,
				i * spriteSize - .5, 5 * spriteSize, spriteSize, spriteSize,
				((i*50)+20), 100, 42, 42
			);
			ctx.fillStyle = 'white';
			ctx.font = "15px arial";
			ctx.fillText(b[i], ((i*50)+25), 160);
			if( !this.power || i > this.level ) ctx.filter = "none";
		}
	},
	updateHealth: function(add){
		this.health += add;
		this.health = (this.health >= this.maxHealth) ? this.maxHealth : this.health;
	},
	leveling: function(increment){
		this.experience += increment;
		if( this.experience >= this.experienceMax ){
			zzfx(...[1.05,,82,.02,.06,.09,1,1.98,23,-5,,,,,,.1,,.63,.06]);
			this.experience = 0;
			this.level++;
			this.ra += 5;
			this.power = 1;

			if( this.level == 3 ){
				totem.ra = 100;
			}
		}
	}
}
let enemies = [];
let enemiesNextGeneration = gameTime + 3000; // Spawn in 3 seconds
var enemy = {
	x: 100,
	y: 100,
	r: 10,
	ra: 100,
	velX: 0,
	velY: 0,
	color: "black",
	auraColor: "rgba(225,225,225, .5)",
	speed: 5,
	friction: .80,
	followPlayer: 1,
	followSpeed: 1,

	health: 100,
	inScope: 0,
	spriteFrame: 0,
	spriteFrameY: 0,
	spriteCount: 2,

	effect: 0,
	ss: 0,
	type: 0,
	freeze: 0,
	pawnTime: null,
	
	diaShow: null,
	diaHide: null,
	diaText: null,

	damageSFX: null,
	draw: function(){

		if( gameTime <= this.pawnTime ){
			return 0;
		}

		let dx = 0;
		let dy = 0;
		switch(this.type){
			case 0: // Healer
				this.effect = this.ss ? 1 : .25;
				if( this.ss ) this.auraColor = "rgba(225,0,0,0.2)";
				dx = ( player.x - this.x ) * this.friction;
				dy = ( player.y - this.y ) * this.friction;
				break;
			case 1: // Attacker
				this.effect = this.ss ? 1 : .25;
				ctx.filter = "saturate(5)"; 
				this.ra = 10;
				dx = ( totem.x - this.x ) * this.friction;
				dy = ( totem.y - this.y ) * this.friction;
				break;
		}

		// Move	
		var distance = Math.sqrt(dx*dx + dy*dy);
		if( distance > this.followSpeed ){
			dx *= this.followSpeed / distance;
			dy *= this.followSpeed / distance;
		}
		this.x += dx;
		this.y += dy;

		// Aura
		ctx.fillStyle = this.auraColor;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.ra, 0, PI * 2);
		ctx.closePath();
		ctx.fill();

		// Player
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.r, 0, PI * 2);
		ctx.closePath();
		ctx.fill();

		if( this.diaShow < gameTime && this.diaHide > gameTime ){
			ctx.fillStyle = 'white';
			ctx.font = "12px Georgia";
			ctx.fillText(this.diaText, this.x - 25, this.y + 50);
		}

		// Sprite
		if( this.spriteFrame >= this.spriteCount ){
			this.spriteFrame = 0;
		}else if( gameFrame % (staggerFrames + 10) === 0 ){
			this.spriteFrame++;
		}

		// Special
		if( this.ss ){
			loadParticles({
				x: this.x - 20,
				y: this.y - 20,
				count: 2,
				color: "rgba(225, 0, 0, 0.5)"
			});
		}

		ctx.drawImage(
			spriteSheet,
			this.spriteFrame * spriteSize, this.spriteFrameY * spriteSize, spriteSize, spriteSize,
			this.x - (52 / 2), this.y - (52 / 2), 52, 52
		);
		ctx.filter = "none";
	},
	pawn: function(){
		this.pawnTime = gameTime + 1000;
		loadParticles({
			x: this.x,
			y: this.y,
			count: 10,
			color: this.type == 0 ? "yellow" : "orange"
		});

		if( Math.floor(mr() * 100) > 50 ){
			this.diaShow = gameTime + 1000;
			this.diaHide = gameTime + 2500;
			this.diaText = er[ Math.floor(mr() * 4) ];
		}
	}
}
var particles = [];
var particle = {
	x: 0,
	dx: 0,
	y: 0,
	r: 15,
	color: "#111",
	removeAfter: null,
	create: function(config){
		this.x = config.x;
		this.y = config.y;
		this.r = config.r || 10;
		this.color = config.color || "#111";
		this.dx = Math.sign(mr() - 0.5) >= 0 ? (mr() * 1) : (mr() * 1 * -1);
		this.removeAfter = gameTime + 1000;
	},
	draw: function(){
		this.x -= this.dx;
		this.y -= ( Math.sign(mr() - 0.5) >= 0 ) ? -(mr() * 2) : (mr() * 2);
		this.r -= .5;
		this.r = Math.abs(this.r);

		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.r, 0, PI * 2);
		ctx.closePath();
		ctx.fill();

		return this.removeAfter <= gameTime;
	}
}
var totem = {
	x: ciw / 2,
	y: cih / 2,
	r: 20,
	ra: 25,
	health: 100,
	maxHealth: 100,
	draw: function(){

		ctx.fillStyle = 'rgba(225, 225, 225, 0.05)';
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.r + 2.5, 0, PI * 2);
		ctx.closePath();
		ctx.fill();

		ctx.fillStyle = 'rgba(225, 225, 225, 0.05)';
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.r + 5, 0, PI * 2);
		ctx.closePath();
		ctx.fill();

		ctx.fillStyle = 'rgba(225, 225, 225, 0.05)';
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.ra, 0, PI * 2);
		ctx.closePath();
		ctx.fill();

		ctx.beginPath();
		ctx.fillStyle = 'rgba(20, 204, 110, 1)';
		ctx.fillRect(this.x - ( this.health / 2 ), this.y - 50, this.health, 7);
		ctx.closePath();

		if( player.level >= 1 ){
			loadParticles({
				x: this.x,
				y: this.y - 15,
				color: "rgba(20, 204, 110, .50)",
				count: 1
			});
		}

		if( player.level >= 2 ){
			loadParticles({
				x: this.x - 50,
				y: this.y,
				color: "rgba(20, 204, 110, .25)",
				count: 1
			});
		}

		if( player.level >= 5 ){
			loadParticles({
				x: this.x + 50,
				y: this.y,
				color: "rgba(20, 204, 110, .25)",
				count: 1
			});
		}

		ctx.drawImage(
			spriteSheet,
			0, 4 * spriteSize + 1, spriteSize - 3, spriteSize - 3,
			this.x - (45 / 2) - 3, this.y - (45 / 2), 45, 45
		);
	},
	attack: function(e){
		if( player.level < 2 ) return false;
		zzfx(...[.5,,320,.01,.08,.17,,2.31,,,,,.12,.5,,.1,.1,.53,.02]);

		if( player.level >= 2 ){
			ctx.beginPath();
			ctx.moveTo(this.x - 50, this.y);
			ctx.strokeStyle = 'rgba(20, 204, 110, 1)';
			ctx.lineTo(e.x, e.y);
			ctx.stroke();
			e.health -= .5;
		}
		if( player.level >= 5 ){
			ctx.beginPath();
			ctx.strokeStyle = 'rgba(20, 204, 110, 1)';
			ctx.moveTo(this.x + 50, this.y);
			ctx.lineTo(e.x, e.y);
			ctx.stroke();
			e.health -= .25;
		}	
		loadParticles({
			x: e.x,
			y: e.y,
			color: "rgba(20, 204, 110, .75)",
			count: 1
		});

		return e.health <= 0;
	}
}

// helpers
function collisionCircle(c1, c2){
	let dx = c2.x - c1.x;
	let dy = c2.y - c1.y;
	let distance = Math.sqrt(dx * dx + dy * dy);
	let sumOfRadii = c1.r + c2.r;
	return distance <= sumOfRadii;
}
function loadParticles(config){
	for(let i = 0; i < config.count; i++){
		let a = Object.create(particle);
			a.create(config);
		particles.push(a);
	}
}

// Game sequence render
function gameRender(){
	var inScope = 0;

	// Generate enemy
	if( gameTime >= enemiesNextGeneration && enemies.length <= 3 ){
		for(let i = 0; i < ((player.maxHealth - player.health) / 20) + 3; i++){
			var e = Object.create(enemy);
				e.x = Math.floor( mr() * ciw );
				e.y = Math.floor( mr() * cih );
				e.ra = Math.floor( mr() * 100 ) + 50;
				e.type = Math.floor( mr() * 2 );
				e.ss = ( Math.floor( mr() * 99 ) > 90 )
				e.pawn();
			enemies.push( e );
		}
		enemiesNextGeneration = gameTime + 3000;
	}

	// Skills
	var x = (player.powerType == 1) ? player.x : totem.x;
	var y = (player.powerType == 1) ? player.y : totem.y;
	if(
		player.power &&
		( keys[90] || (keys[88] && player.level >= 1) || (keys[67] && player.level >= 2))
	){
		player.power = 0;
		player.powerTO = gameTime + 1500;
		if( keys[90] )  player.powerType = 1;
		if( keys[88] )  player.powerType = 2;

		if( keys[67] ){
			player.powerType = 3;
			totem.ra += 30;
		}
	}

	if( player.powerTO > gameTime ){
		player.powerA += .01;

		ctx.fillStyle = 'white';
		ctx.font = "12px Georgia";
		var t = "";
		if( player.powerType == 1 ) t = "Magic: Dieeee";
		if( player.powerType == 2 ) t = "Magic: Role switchi";
		if( player.powerType == 3 ) t = "Magic: Totem expand";
		ctx.fillText(t, player.x + 15, player.y - 20);
	}
	if( player.powerTO != null && player.powerTO < gameTime ){
		player.powerTO = null;
		player.powerA = 0;

		for (var i = enemies.length - 1; i >= 0; i--) {
			if( player.powerType == 1 ){
				enemies[i].health = -1;
			}else if( player.powerType == 2 ){
				enemies[i].isP = 0;
				enemies[i].type = 0;
			}else if( player.powerType == 3 ){
				enemies[i].health -= 50;
			}
		}
	}

	for (var i = enemies.length - 1; i >= 0; i--) {
		if( enemies[i].draw() == 0 ) continue;

		// Power
		if( player.powerTO > gameTime ){
			if( player.powerType == 1 || player.powerType == 3 ){
				ctx.beginPath();
				ctx.moveTo(x, y);
				ctx.strokeStyle = 'rgba(20, 204, 110, '+ (player.powerA) +')';
				ctx.lineTo(enemies[i].x, enemies[i].y);
				ctx.stroke();
				x = enemies[i].x;
				y = enemies[i].y;
				zzfx(...[.025,,401,.01,.09,.07,2,1.82,27,,,,,,,,,.86,.1]);

			}else if( player.powerType == 2 && enemies[i].type == 1 ){
				loadParticles({
					x: enemies[i].x,
					y: enemies[i].y,
					color: "orange",
					count: 1
				});
			}
		}

		// Check if the player is inside the aura of the enemy (is in scope)
		var iis = collisionCircle({
			x: player.x,
			y: player.y,
			r: player.r
		}, {
			x: enemies[i].x,
			y: enemies[i].y,
			r: enemies[i].ra
		});
		if( iis ){
			player.updateHealth(enemies[i].effect);
			inScope = 1;

			loadParticles({
				x: enemies[i].x - 15,
				y: enemies[i].y - 10,
				color: "rgba(225, 225, 0, .25)",
				count: 1
			});

			loadParticles({
				x: player.x,
				y: player.y,
				color: "rgba(225, 225, 225, 0.1)",
				count: 1
			});

			enemies[i].freeze = 1;
			enemies[i].auraColor = "rgba(225,225,0, .025)";

			if( player.healSFXTime < gameTime || player.healSFXTime == null ){
				player.healSFXTime = gameTime + 1000;
				zzfx(...[1.01,,325,.03,.22,.33,1,1.17,1.4,,,,.16,.1,17,,,.49,.23,.1]);
			}
		}else{
			enemies[i].auraColor = "rgba(225,225,225, .025)";
			enemies[i].freeze = 0;
		}

		// Check if the player is touching the enemy
		iis = collisionCircle({
			x: player.x,
			y: player.y,
			r: player.ra
		}, {
			x: enemies[i].x,
			y: enemies[i].y,
			r: enemies[i].r
		});
		if( (iis && keys[32]) || enemies[i].health <= 0 ){
			player.leveling(15);
			loadParticles({
				x: enemies[i].x,
				y: enemies[i].y,
				color: "rgba(20, 204, 110, .50)",
				count: 5
			});
			enemies.splice(i, 1)

			zzfx(...[,,494,.03,.02,.19,,2.37,-2.6,,,,,,,.1,,.58,.05]);
			continue;
		}

		// Check if the enemy is an attacker
		if( enemies[i].type == 1 ){
			iis = collisionCircle({
				x: totem.x,
				y: totem.y,
				r: totem.r
			}, {
				x: enemies[i].x,
				y: enemies[i].y,
				r: enemies[i].r
			});
			if( iis ){
				totem.health -= enemies[i].effect;
				if( enemies.damageSFX < gameTime || enemies.damageSFX == null ){
					enemies.damageSFX = gameTime + 1000;
					zzfx(...[2.43,,260,.02,.05,.08,1,2.98,,,,,,.5,,.3,.02,.62,.02]);
				}
			}
		}

		// Check if the enemy scoped by totem
		iis = collisionCircle({
			x: totem.x,
			y: totem.y,
			r: totem.ra
		}, {
			x: enemies[i].x,
			y: enemies[i].y,
			r: enemies[i].r
		});
		if( iis ){
			if( totem.attack(enemies[i]) ){
				enemies.splice(i, 1)
				zzfx(...[,,494,.03,.02,.19,,2.37,-2.6,,,,,,,.1,,.58,.05]);
				continue;
			}
		}

	}

	player.draw();
	if( inScope == 0 ) player.updateHealth(-.10);

	// Particles
	for (var i = particles.length - 1; i >= 0; i--) {
		if( particles[i].draw() ) {
			particles.splice(i, 1);
		}
	}

	totem.draw();

	player.drawBoards();
}

const flooringX = Math.ceil(ciw / spriteSize) + 1;
const flooringY = Math.ceil(cih / spriteSize) + 1;
function gameRenderBoard(){
	for( let y = 0; y < flooringY; y++ ){
		for( let x = 0; x < flooringX; x++ ){
			ctx.drawImage(
				spriteSheet,
				(y % 5 == 0 ? 2 : 1) * spriteSize, 4 * spriteSize, spriteSize, spriteSize - 2,
				x * 52, y * 52, 52, 52
			);
		}
	}
}

// Main renderer
function gameAnimate(){
	ctx.clearRect(0,0, canvas.width, canvas.height);

	gameRenderBoard();
	gameRender();

	gameTime = Date.now();
	gameFrame++;

	if( totem.health <= 0 ){
		canvasPlay = 0;	
		gameStatus = -1;
	}else if( player.health <= 0 && !gameEnding ){
		gameEnding = 1;
		gameDelay = gameTime + 3000;
		player.power = 1;
		keys[90] = 1;
	}else if( player.health <= 0 && gameTime >= gameDelay ){
		canvasPlay = 0;
		gameStatus = 1;
	}

	if( canvasPlay ){
		window.requestAnimationFrame(gameAnimate);
	}else{
		if( gameStatus == -1 ){
			sop.innerHTML = `
				<div style='text-align:center;' >
				<h1 style='color: red;' >Totem Destroyed</h1>
				<p>You'll witness how cruel the world is.</p>
				<a onclick="window.location.reload()" class="button" >Play again</a>
				</div>
			`;
			sos.style.display = 'block';
		}else if( gameStatus == 1 ){
			var d = Date.now();
			sop.innerHTML = `
				<div style='text-align:center;' >
				<h1 style='color: #4add4a;' >You're now dead</h1>
				<p>Time: ${ ((d - startTime) / 1000) } | Level ${ player.level }</p>
				<p>After 13k millions years, you're now in the multiverse.</p>
				<a onclick="window.location.reload()" class="button" >Play Again</a>
				</div>
			`;
			sos.style.display = 'block';
		}
	}

} gameAnimate();

spriteSheet.onload = gameAnimate();

// Events
window.addEventListener('keydown', e => {
	keys[e.keyCode] = 1;
});
window.addEventListener('keyup', e => {
	keys[e.keyCode] = 0;
});

// ZzFX by: KilledByAPixel | https://github.com/KilledByAPixel/ZzFX (very cool!)
var zzfxV = .3;
var zzfx = (p=1,k=.05,b=220,e=0,r=0,t=.1,q=0,D=1,u=0,y=0,v=0,z=0,l=0,E=0,A=0,F=0,c=0,w=1,m=0,B=0)=>{let
M=Math,R=44100,d=2*M.PI,G=u*=500*d/R/R,C=b*=(1-k+2*k*M.random(k=[]))*d/R,g=0,H=0,a=0,n=1,I=0
,J=0,f=0,x,h;e=R*e+9;m*=R;r*=R;t*=R;c*=R;y*=500*d/R**3;A*=d/R;v*=d/R;z*=R;l=R*l|0;for(h=e+m+
r+t+c|0;a<h;k[a++]=f)++J%(100*F|0)||(f=q?1<q?2<q?3<q?M.sin((g%d)**3):M.max(M.min(M.tan(g),1)
,-1):1-(2*g/d%2+2)%2:1-4*M.abs(M.round(g/d)-g/d):M.sin(g),f=(l?1-B+B*M.sin(d*a/l):1)*(0<f?1:
-1)*M.abs(f)**D*p*zzfxV*(a<e?a/e:a<e+m?1-(a-e)/m*(1-w):a<e+m+r?w:a<h-c?(h-a-c)/t*w:0),f=c?f/
2+(c>a?0:(a<h-c?1:(h-a)/c)*k[a-c|0]/2):f),x=(b+=u+=y)*M.cos(A*H++),g+=x-x*E*(1-1E9*(M.sin(a)
+1)%2),n&&++n>z&&(b+=v,C+=v,n=0),!l||++I%l||(b=C,u=G,n=n||1);p=zzfxX.createBuffer(1,h,R);p.
getChannelData(0).set(k);b=zzfxX.createBufferSource();b.buffer=p;b.connect(zzfxX.destination
);b.start();return b};var zzfxX=new(window.AudioContext||webkitAudioContext);