var socket = io.connect('http://' + document.domain + ':' + location.port + '/play');
var playerName = Math.random();

/***
 * loading
 * ***/
socket.on('connection callback', function(msg) {
  socket.emit('request world from server', {
    player_name: playerName
  });
});

socket.on('send world to client', function(msg) {
  grid.width = msg.width;
  grid.height = msg.height;
  for (cell in msg.grid) {
    //Parse the string sent from the server to get the grid dimensions
    //NOTE: if the cell position is negative, the regex will make it positive
    var gridX = cell.split(',')[0].replace(/\D/g, '');
    var gridY = cell.split(',')[1].replace(/\D/g, '');
    grid[gridX+','+gridY] = 0;
    if (msg.grid[cell] === 1) {
      var step = new Step(gridX, gridY);
      grid[gridX+','+gridY] = 1;
      allSprites.addChild(step);
    }
    if (msg.grid[cell] === 2) {
      var flagStep = new FlagStep(gridX, gridY);
      grid[gridX+','+gridY] = 2;
      allSprites.addChild(flagStep);
    }
  }
  console.log(grid);

  //Get the info about existing avatars from the server then create them on the client
  var parsed = JSON.parse(msg.players);
  for (var p in parsed) {
    if (parsed[p].name === playerName)
      continue;
    var a = new Avatar(parsed[p].name, parsed[p].grid_x, parsed[p].grid_y, parsed[p].direction);
    allSprites.addChild(a);
    remoteAvatars[a.name] = a;
  }

  //Create the Avatar for the local client
  console.log("YOU JOINED THE GAME");
  avatar = new Avatar(playerName, 1, 198, 1);
  allSprites.addChild(avatar);
  centerCamera();
  setUpGame(playerName);
});

/****
 * end loading
 * ****/
socket.on('disconnection callback', function(msg) {
  var a = remoteAvatars[msg.playerName];
  allSprites.removeChild(a);
  delete remoteAvatars[msg.playerName];
  console.log(msg.playerName+' removed');
});

socket.on('new player callback', function(msg) {
  if (msg.playerName === playerName) return;
  //Create the Avatar for a remote client
  var a = new Avatar(msg.playerName, msg.x, msg.y, msg.direction);
  remoteAvatars[msg.playerName] = a;
  allSprites.addChildAt(a, 1); //Our avatar should always be at index 0 so it's drawn on top
  console.log("SOMEONE ELSE JOINED: " + a.name, a.gridX, a.gridY);
});

socket.on('update remote players about the move', function(msg) {
  if (msg.playerName === avatar.name)
    return;
  console.log('received');
  var a = remoteAvatars[msg.playerName];
  moveRemoteAvatar(a, msg.x, msg.y);
  console.log(msg.playerName+" moved");
});

socket.on('update remote players about the turn', function(msg) {
  if (msg.playerName === avatar.name)
    return;
  console.log('received');
  var a = remoteAvatars[msg.playerName];
  a.direction = msg.direction;
  a.scale.x *= -1;
  updateAvatarDisplayPos(a);
  console.log(msg.playerName+" turned"+" dir="+msg.direction);
});

