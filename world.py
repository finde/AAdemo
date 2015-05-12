__author__ = 'finde, arif'

import numpy as np
import numpy.random as random


class Prey():
    def __init__(self, x, y, cov):
        self.x = x
        self.y = y
        self.cov = cov

    def move(self):
        return np.random.multivariate_normal([self.x, self.y], self.cov, 1)


class Predator():
    def __init__(self, x, y):
        self.x = x
        self.y = y


class World():
    def __init__(self, x, y):
        self.width = x
        self.height = y
        self.predator = None
        self.prey = None

    def spawn_predator(self, x, y):
        pass

    def spawn_prey(self, x, y, cov):
        self.prey = Prey(x, y, cov)

    def get_predator(self):
        return self.predator

    def get_prey(self):
        return self.prey

    def check_reward(self):
        pass


world = World(10, 10)
world.spawn_prey(0, 0, [[1, 0], [0, 1]])
world.spawn_predator(0, 0)

world.getPrey().move()