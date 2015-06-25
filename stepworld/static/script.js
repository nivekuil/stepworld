var c = document.getElementById("c");
var renderer = PIXI.autoDetectRenderer(
  c.width,
  c.height,
  c
);

var stage = new PIXI.Stage(0xADD8E6);
var allSprites = new PIXI.DisplayObjectContainer();
stage.addChild(allSprites);

var steps = [];
var remoteAvatars = {};
var grid = {};
function setUpGame(playerName) {
  setUpInput();
  drawLoop();
  window.setInterval(update, 1000/30);

  function setUpInput() {
    kd.LEFT.press(moveLeftFoot);
    kd.RIGHT.press(moveRightFoot);
    kd.SPACE.press(turn);
    kd.DOWN.press(drop);

    function moveLeftFoot(e) {
      if (avatar.lastFootMoved === 0 && !avatar.isFalling) {
        socket.emit('move left foot');
        avatar.lastFootMoved = 1;
        moveAvatar();
      }
    }

    function moveRightFoot(e) {
      if (avatar.lastFootMoved === 1 && !avatar.isFalling) {
        socket.emit('move right foot');
        avatar.lastFootMoved = 0;
        moveAvatar();
      }
    }

    function moveAvatar() {
      avatar.gridX += 1 * avatar.direction;
      avatar.gridY -= 1;
      checkCollision(avatar);
    }

    function turn(e) {
      socket.emit('avatar turn request');
      avatar.direction *= -1;
      avatar.lastFootMoved = 0;
      avatar.scale.x *= -1;
      updateAvatarDisplayPos(avatar);
    }

    function drop(e) {
      if (!avatar.isFalling) {
        socket.emit('avatar drop request');
        avatar.gridY += 1;
        checkCollision(avatar);
        if (avatar.gridY > grid.height-1) {
          avatar.gridY = grid.height-1;
          updateAvatarDisplayPos(avatar);
        }
      }
    }
  }
}

function centerCamera() {
  allSprites.y = 300 - avatar.gridY * 30;
  //allSprites.x = 512 - avatar.gridX * 40;
}
function updateAvatarDisplayPos(avt) {
  /**Translates the position on the grid to the position of the PIXI sprite**/
  if (avt.direction === 1) avt.x = avt.gridX * 40; //facing right
  if (avt.direction === -1) avt.x = avt.gridX * 40 + 40; //facing left. add 40 to offset negative sprite width
  avt.y = avt.gridY * 30 - 30;
}
function checkCollision(avt) {
  avt.isFalling = true;
  updateAvatarDisplayPos(avt);
  if (avt.gridX < 0)
    avt.gridX = grid.width-1;
  else if (avt.gridX === grid.width)
    avt.gridX = 0;

  if (avt.gridY >= grid.height-1) { //at the bottom of the screen
    avt.isFalling = false;
    avt.velY = 0;
    if (avt === avatar) centerCamera();
  }
  else if (grid[avatar.gridX+','+(avt.gridY+1)] === 1) { //on a step
    avt.isFalling = false;
    avt.velY = 0;
    if (avt === avatar) centerCamera();
  }
  else if (grid[avatar.gridX+','+(avt.gridY+1)] === 2) { //step with a flag
    avt.isFalling = false;
    avt.velY = 0;
    if (avt === avatar) centerCamera();
    renderer.render(stage);
    alert('YOU DID IT');
  }
  //check if avatar is on the ground
  /**if (avatar.position.y + avatar.height >= 600) {
     avatar.position.y = 600 - avatar.height;
     avatar.velY = 0;
     avatar.isFalling = false;
     return;
     }



     //check if avatar is on a step
     for (var i=0; i<steps.length; ++i) {
     var block = steps[i];
     if (avatar.position.x === block.position.x
     && block.position.y === avatar.position.y + avatar.height
     && avatar.position.y + avatar.height >= block.position.y) {
     avatar.position.y = block.position.y - avatar.height;
     console.log('collided' + avatar.position.y);
     avatar.isFalling = false;
     avatar.velY = 0;
     break;
     }
     }
     //socket.emit('move avatar', {'x': avatar.position.x, 'y':avatar.position.y});**/
}

/**function moveAvatar(point) {
   avatar.position.x = point.x - avatar.wSeinabo Sey - Youngeridth / 2;
   avatar.position.y = point.y - avatar.height / 2;
   socket.emit('move avatar', {
   'x': avatar.position.x,
   'y': avatar.position.y
   });
   }**/

function moveRemoteAvatar(avt, x, y) {
  avt.gridX = x;
  avt.gridY = y;
  checkCollision(avt);
} 

function drawLoop() {
  kd.tick();
  renderer.render(stage);
  requestAnimFrame(drawLoop);
}
function update() {
  avatar.gridX += avatar.velX;
  avatar.gridY += avatar.velY;
  if (avatar.isFalling) {
    avatar.velY = 1;
    checkCollision(avatar);
  }

  /**for (var avatarName in remoteAvatars) {
     remoteAvatar = remoteAvatars[avatarName];
     remoteAvatar.gridY += remoteAvatar.velY;
     if (remoteAvatar.isFalling) {
     remoteAvatar.velY = 1;
     checkCollision(remoteAvatar);
     }
     }**/
}

//
function Step(x, y) {
  var tex = PIXI.Texture.fromImage("static/block.png");
  PIXI.Sprite.call(this, tex);
  this.gridX = x;
  this.gridY = y;
  this.x = x*40;
  this.y = y*30;
  //this.hitArea = new PIXI.Rectangle(x, y, 40, 30);
  // console.log(this.position.x, this.position.y)
}
Step.prototype = Object.create(PIXI.Sprite.prototype);
Step.prototype.constructor = Step;

function FlagStep(x, y) {
  var tex = PIXI.Texture.fromImage('static/flagStep.png');
  PIXI.Sprite.call(this, tex);
  this.gridX = x;
  this.gridY = y;
  this.x = x*40;
  this.y = y*30 - 60;
}
FlagStep.prototype = Object.create(PIXI.Sprite.prototype);
FlagStep.prototype.constructor = FlagStep;

