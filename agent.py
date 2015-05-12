import numpy as np

class Agent:
    """
    class agent
    """

    def __init__(self, init_position = None):
        self.position = self.__set_init_position(init_position)
        self.action_space = np.round(np.arange(-1.5, 1.5, 0.1), 1)


    def move(self, distance=None, toroidal_function = None):
        """
        action space for agent is discretized
        it can move to any point within a circle with radius 1.5 from its
        current position
        """

        if distance is None:
            # move randomly
            distance = np.random.choice(self.action_space, 2)

        new_position = self.position + distance

        if toroidal_function:
            self.position = toroidal_function(new_position)
        else:
            self.position = new_position

        return self.position

    def __set_init_position(self, init_position):
        if init_position is None:
            return np.array([0, 0])
        else:
            return init_position
