__author__ = 'finde, arif'

import numpy as np
import numpy.random as random
from agent import Agent


class Prey():
    def __init__(self, loc, cov):
        self.loc = np.array(loc)
        self.cov = cov

    def move(self):
        return random.multivariate_normal(self.loc, self.cov, 1)


class World():
    def __init__(self, x, y):
        self.width = x
        self.height = y
        self.predator = None
        self.prey = None

    def spawn_predator(self, loc):
        self.predator = Agent(np.array(loc))
        pass

    def spawn_prey(self, loc, cov):
        self.prey = Prey(loc, cov)

    def get_predator(self):
        return self.predator

    def get_prey(self):
        return self.prey

    def check_reward(self):
        pass


world = World(10, 10)
world.spawn_prey([0, 0], [[1, 0], [0, 1]])
world.spawn_predator([0, 0])
print world.get_predator().position