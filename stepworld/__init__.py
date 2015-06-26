import gevent, jsonpickle, random
from flask import Flask, render_template, jsonify, request, session, make_response
from flask.ext.socketio import SocketIO, emit
from models import Player

app = Flask(__name__)
#app.config['DEBUG'] = True
socketio = SocketIO(app)


allClientIDs = []
#Dict of Player object key = Player.name
players = {}
grid = {}
grid_width = 30
grid_height = 200
@app.route('/')	
def index():
  return render_template('index.html')

@socketio.on('connect', namespace='/play')
def test_connect():
  emit('connection callback')
  print('connected', id(request.namespace))
  allClientIDs.append(id(request.namespace))

@socketio.on('disconnect', namespace='/play')
def disconnect_client():
  print('disconnected', id(request.namespace), allClientIDs)
  for client in allClientIDs:
    if client == id(request.namespace):
      print('someone disconnected')
      allClientIDs.remove(client)
      disconnectedPlayer = players[client]
      del players[client]
      break
    emit('disconnection callback', {'playerName': disconnectedPlayer.name}, broadcast=True)

@socketio.on('new player request', namespace='/play')
def add_player(msg):
  #Add the new player to players{} dict
  start_x = 1
  start_y = grid_height - 1
  new_player = Player(msg['player_name'], start_x, start_y)
  print("new player", id(request.namespace))
  players[id(request.namespace)] = new_player

  emit('new player callback',
       {'playerName':new_player.name, 'x':new_player.grid_x, 'y':new_player.grid_y,
        'direction':new_player.direction},
       broadcast=True)

  @socketio.on('move right foot', namespace='/play')
  def move_avatar_right():
    #	print('right')
    player = players[id(request.namespace)]
    #if player.last_foot_moved == 1 and not player.is_falling:
	player.grid_x += 1 * player.direction
	player.grid_y -= 1
	player.last_foot_moved = 0
	check_collision(player)

@socketio.on('move left foot', namespace='/play')
def move_avatar_left():
  #print('left')
	player = players[id(request.namespace)]
	#if player.last_foot_moved == 0 and not player.is_falling:
	player.grid_x += 1 * player.direction
	player.grid_y -= 1
	player.last_foot_moved = 1
	check_collision(player)

@socketio.on('avatar turn request', namespace='/play')
def turn():
  player = players[id(request.namespace)]
  player.direction *= -1
  player.last_foot_moved = 0
  emit('update remote players about the turn',
       {'playerName': player.name, 'direction': player.direction}, broadcast=True)

@socketio.on('avatar drop request', namespace='/play')
def drop_down():
  player = players[id(request.namespace)]
	if not player.is_falling:
          player.grid_y += 1
          check_collision(player)
		if player.grid_y > grid_height-1:
                  player.grid_y = grid_height-1

@socketio.on('request world from server', namespace='/play')
def return_world_info(msg):
  add_player(msg)
  emit('send world to client', {'grid':grid, 'width':grid_width, 'height':grid_height,
                                'players':jsonpickle.encode(players)})

def update():
  gevent.spawn_later(0.05, update)
	for player in players.values():
          player.grid_x += player.vel_x
          player.grid_y += player.vel_y
		if player.is_falling:
                  player.vel_y = 1
                  check_collision(player)


def set_up_world():
  update()
	for x in range(grid_width):
		for y in range(grid_height):
                  grid[str((x, y))] = 0

	total_stairs = 17
	step_x = 12
	step_y = grid_height - 1 #bottom
	stair_direction = 1 #1=right, -1=left 
	for _i in range(total_stairs): 
          total_steps = random.randint(1, 13)
		for _j in range(total_steps):
                  grid[str((step_x, step_y))] = 1
                  step_x += 1 * stair_direction
                  step_y -= 1
			if step_x < 1:
                          step_x = 2
				break
			if step_x > grid_width-2:
                          step_x = grid_width - 3
				break
                              stair_direction *= -1
                              grid[str((step_x, step_y))] = 2

def check_collision(player):
  #print('check')
	player.is_falling = True
	if player.grid_x < 0:
          player.grid_x = grid_width-1
	elif player.grid_x == grid_width:
          player.grid_x = 0
	if player.grid_y >= grid_height-1:
          player.is_falling = False
          player.vel_y = 0
	elif grid[str((player.grid_x, player.grid_y+1))] == 1:
          player.is_falling = False
          player.vel_y = 0
	elif grid[str((player.grid_x, player.grid_y+1))] == 2:
          player.is_falling = False
          player.vel_y = 0
          set_up_world()
          socketio.emit('update remote players about the move',
                        {'playerName': player.name, 'x': player.grid_x, 'y': player.grid_y},
                        namespace='/play') #need the namespace argument

set_up_world()
