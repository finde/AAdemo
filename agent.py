import numpy as np

class Agent:
    """
    class agent
    """

    def __init__(self, init_position = None):
        position = self.__set_init_position(init_position)
        action_space = np.arange(-1.5, 1.5, 0.1)


    def move(self, distance=None):
        """
        action space for agent is discretized
        it can move to any point within a circle with radius 1.5 from its
        current position
        """

        step = 0.1

        if distance is None:
            # move randomly
            distance = np.random.choice(self.action_space, 2)

        self.position += distance


    def __set_init_position(init_position):
        if init_position is None:
            return np.array([0, 0])
        else:
            return init_position
