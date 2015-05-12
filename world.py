__author__ = 'finde, arif'

import numpy as np
import numpy.random as random
from agent import Agent


class Prey(Agent):
    def __init__(self, init_position=None, cov=None):
        if not cov:
            cov = [[1, 0], [0, 1]]
        Agent.__init__(self, init_position)
        self.cov = cov

    def move(self, distance=None, toroidal_function=None):
        self.position = random.multivariate_normal(self.position, self.cov, 1)[0]
        if toroidal_function:
            self.position = toroidal_function(self.position)

    def __set_init_position(self, init_position):
        if init_position is None:
            return np.array([0, 0])
        else:
            return init_position


class World():
    def toroidal(self, state):
        if state[0] < 0:
            state[0] += self.width

        if state[1] < 0:
            state[1] += self.height

        return state

    def __init__(self, x, y):
        self.width = x
        self.height = y
        self.predator = None
        self.prey = None

    def spawn_predator(self, position):
        self.predator = Agent(np.array(position))
        pass

    def spawn_prey(self, position, cov):
        self.prey = Prey(position, cov)

    def get_predator_state(self):
        state = self.prey.position - self.predator.position
        return state


    def check_reward(self):
        pass


world = World(10, 10)
world.spawn_prey([0.1, 0.1], [[1, 0], [0, 1]])
world.spawn_predator([0.0, 0.0])
print 'init predator', world.predator.position
print 'init predator state', world.get_predator_state()
print ''

print 'move'
world.predator.move(toroidal_function=world.toroidal)
world.prey.move(toroidal_function=world.toroidal)
print world.predator.position
print world.prey.position
print world.get_predator_state()
print ''

print 'move'
world.predator.move(toroidal_function=world.toroidal)
world.prey.move(toroidal_function=world.toroidal)
print world.predator.position
print world.prey.position
print world.get_predator_state()
print ''
