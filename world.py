from __future__ import division
import numpy as np
from agent import Agent, Prey

__author__ = 'finde, arif'

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

        if abs(state[0]) > self.width / 2:
            if state[0] > 0:
                state[0] -= self.width
            else:
                state[0] += self.width

        if abs(state[1]) > self.height / 2:
            if state[1] > 0:
                state[1] -= self.height
            else:
                state[1] += self.height

        return state


    def reward(self):
        # The reward the predator gets is 1 if the predator gets within 1 unit range of the prey.
        # That is the position of prey is within a circle defined by radius 1 and center as the current position of
        # the predator.

        after_state = self.get_predator_state()

        if np.all(np.abs(after_state) < 1):
            return 1

        return 0


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

print world.predator.action_space