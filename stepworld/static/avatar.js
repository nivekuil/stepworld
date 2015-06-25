function Avatar(name, x, y, direction) {
  if (Math.random() < 0.5)
    var tex = PIXI.Texture.fromImage("static/pixelguy.png");
  else
    var tex = PIXI.Texture.fromImage("static/pixeldude.png");

  PIXI.Sprite.call(this, tex);
  this.name = name;
  this.gridX = x;
  this.gridY = y;
  this.x = x*40;
  this.y = y*30 - 30
  //this.anchor = 0.5;

  this.velX = 0;
  this.velY = 0;
  //this.hitArea = PIXI.Rectangle(x, y, this.width, this.height);

  this.isFalling = true;
  this.lastFootMoved = 0; //0=right, 1=left

  this.direction = direction; //1=right, -1=left
  if (this.direction === -1) {
    this.scale.x *= -1;
    updateAvatarDisplayPos(this);
  }

}


Avatar.prototype = Object.create(PIXI.Sprite.prototype);
Avatar.prototype.constructor = Avatar;
