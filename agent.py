import numpy as np
import numpy.random as random


class Agent:
    """
    class agent
    """

    def __init__(self, init_position=None, toroidal_function=None):
        self.position = self.__set_init_position(init_position)
        self.action_space = np.round(np.arange(-1.5, 1.5, 0.1), 1)
        self.toroidal_function = toroidal_function

    def move(self, distance=None):
        """
        real action
        action space for agent is discretized
        it can move to any point within a circle with radius 1.5 from its
        current position
        """

        self.position = self.sim_move(distance)

        return self.position

    def sim_move(self, distance=None):
        """
        simulate move
        """

        if distance is None:
            # move randomly
            distance = np.random.choice(self.action_space, 2)

        if self.toroidal_function:
            new_position = self.toroidal_function(self.position + distance)
        else:
            new_position = self.position + distance

        return new_position

    def __set_init_position(self, init_position):
        if init_position is None:
            return np.array([0, 0])
        else:
            return init_position


class Prey(Agent):
    def __init__(self, init_position=None, cov=None, toroidal_function=None):
        if not cov:
            cov = [[1, 0], [0, 1]]
        Agent.__init__(self, init_position)
        self.cov = cov
        self.toroidal_function = toroidal_function

    def move(self, **kwargs):
        """
        real move
        :param **kwargs:
        """

        self.position = self.sim_move()

    def sim_move(self, **kwargs):
        """
        simulate move
        :param **kwargs:
        """

        new_position = np.round(random.multivariate_normal(self.position, self.cov, 1)[0],1)

        if self.toroidal_function:
            new_position = self.toroidal_function(new_position)

        return new_position

    def __set_init_position(self, init_position):
        if init_position is None:
            return np.array([0, 0])
        else:
            return init_position
