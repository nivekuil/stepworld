class World:
  def __init__(self):
    self.activePlayers = []

class Player:
  def __init__(self, name, x, y):
    self.name = name
    self.grid_x = x
    self.grid_y = y
    self.vel_x = 0
    self.vel_y = 0
    self.height = 60
    self.width = 40

    self.direction = 1 #1=right, -1=left
    self.last_foot_moved = 0 #0=right, 1=left
    self.is_falling = False
