from __future__ import division
import numpy as np
from agent import Agent, Prey

from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import SGDRegressor

import time
import datetime
import cPickle

__author__ = 'finde, arif'


class World():
    def toroidal(self, state):
        if state[0] < 0:
            state[0] += self.width
        elif state[0] > self.width:
            state[0] -= self.width

        if state[1] < 0:
            state[1] += self.height
        elif state[1] > self.height:
            state[1] -= self.height

        return state

    def __init__(self, x, y):
        self.width = x
        self.height = y
        self.predator = None
        self.prey = None

        self.poly = PolynomialFeatures(degree=2)
        self.model = SGDRegressor()

    def spawn_predator(self, position):
        self.predator = Agent(np.array(position), self.toroidal)
        pass

    def spawn_prey(self, position, cov=None):
        self.prey = Prey(position, cov, self.toroidal)

    def get_predator_state(self, predator_position=None, prey_position=None):

        if predator_position is None:
            predator_position = self.predator.position

        if prey_position is None:
            prey_position = self.prey.position

        state = prey_position - predator_position

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

    def fitted_value(self, X):
        """
        fitted value function
        for now it uses polynomial regression
        but it can also uses another technique
        """

        # X = self.poly.fit_transform(state)
        try:
            predicted = self.model.predict(X)
        except ValueError:
            predicted = np.mean(X, axis=1)

        return predicted

    def train_model(self, X, y):
        """
        train the regressor
        """

        # X = self.poly.fit_transform(states)
        self.model.partial_fit(X, y)

    """
    fitted value iteration
    """

    def fitted_value_iteration(self, n_state=10, n_iter=100, n_sample=10, gamma=0.1, eps=1E-5, verbose=False, log=True):
        """
        planning using fitted value iteration
        based on Andrew Ng
        """
        np.random.seed()
        ts = time.time()
        st = datetime.datetime.fromtimestamp(ts).strftime('%Y%m%d_%H%M%S')
        log_filename = 'fitted_vi_' + st + '__' + str(np.random.uniform(0, 1000))

        if log:
            log_file = open(log_filename + '.log', 'w')
            log_file.write('== Fitted value iterations ==\n')
            log_file.write('\n')
            log_file.write('n state         : %d \n' % n_sample)
            log_file.write('max iteration   : %d \n' % n_iter)
            log_file.write('gamma           : %d \n' % n_sample)
            log_file.write('eps             : %d \n' % eps)
            log_file.write('\n')

        print 'Fitted value iterations ...'

        positions = self.__sample_position(n_state)
        X = np.zeros((n_state, 2))
        y = np.zeros(n_state)
        y_old = -np.inf
        it = 0
        converge_counter = 0

        while it < n_iter:

            it += 1

            # expectation
            for i in xrange(0, n_state):

                self.spawn_predator(positions[i, :, 0])
                self.spawn_prey(positions[i, :, 1])

                X[i, :] = self.get_predator_state()

                approximated_value = np.zeros(self.predator.action_space.size)

                for idx, action in enumerate(self.predator.action_space):
                    next_states = self.__sample_next_state(n_state, action)
                    approximated_value[idx] = self.__approximate_value(next_states, gamma)

                y[i] = np.max(approximated_value)

            if verbose or it % 1000 == 0:
                y_total = np.sum(y)
                print 'iter %d ::: %f' % (it, y_total)

                if np.abs(y_total - y_old) < eps:
                    converge_counter += 1
                    print "   >> potential converge ", converge_counter
                elif converge_counter > 0:
                    converge_counter = 0
                    print "reset converge_counter"

                y_old = y_total

            if converge_counter >= 5:
                if log:
                    log_file.write('converged       : Yes at %d\n' % it)

                print "converged at iteration %d" % it
                break

            # maximization
            self.train_model(X, y)

        if it >= n_iter:
            if log:
                log_file.write('converged       : No at %d\n' % it)

            print "not converged"

        if log:
            log_file.write('y_total         : %f\n' % y_total)
            cPickle.dump((y_total, self.model), open(log_filename + '.cp', 'w'))

        return self.model

    def __sample_position(self, n_state):
        """
        it returns n_state x 2 array
        """

        # sample initial position for predator and prey
        np.random.seed()
        x = np.random.uniform(0, self.width, (n_state, 2))
        y = np.random.uniform(0, self.height, (n_state, 2))

        return np.dstack((x, y))

    def __sample_next_state(self, n_sample, action):
        """
        it returns n_sample x 2 array
        """

        next_states = []
        predator_position = self.predator.sim_move()

        for i in xrange(0, n_sample):
            prey_position = self.prey.sim_move()

            next_state = self.get_predator_state(predator_position, prey_position)

            next_states.append(next_state)

        return np.vstack(next_states)

    def __approximate_value(self, next_states, gamma):
        """
        approximate value of current state given a simulated action
        """

        return np.mean(self.reward() + (gamma * self.fitted_value(next_states)))