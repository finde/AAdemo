from __future__ import division
import numpy as np
from agent import Agent, Prey

from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import SGDRegressor
from sklearn.gaussian_process import GaussianProcess

import time
import datetime
import cPickle
import sys
import itertools
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

plt.style.use('ggplot')

__author__ = 'finde, arif'


class World():
    def toroidal(self, position):
        if position[0] < 0:
            position[0] += self.width
        elif position[0] > self.width:
            position[0] -= self.width

        if position[1] < 0:
            position[1] += self.height
        elif position[1] > self.height:
            position[1] -= self.height

        return position

    def toroidal_state(self, state):
        if state[0] + self.width / 2 < 0:
            state[0] += self.width
        elif state[0] >= self.width / 2:
            state[0] -= self.width

        if state[1] + self.height / 2 < 0:
            state[1] += self.height
        elif state[1] >= self.height / 2:
            state[1] -= self.height

        return state


    def __init__(self, x, y):
        self.width = x
        self.height = y
        self.predator = None
        self.prey = None

        # self.poly = PolynomialFeatures(degree=2)
        # self.model = SGDRegressor()
        self.model = GaussianProcess(theta0=1e-2, thetaL=1e-4, thetaU=1e-1)

        self.fig = plt.figure()
        self.ax = self.fig.gca(projection='3d')


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

        try:
            predicted = self.model.predict(X)
        except ValueError:
            predicted = np.zeros(X.shape[0])

        return predicted

    def train_model(self, X, y):
        """
        train the regressor
        """

        # self.model.partial_fit(X, y)
        self.model.fit(X, y)

    """
    fitted value iteration
    """

    def fitted_value_iteration(self, n_state=10, n_iter=100, n_sample=10, gamma=0.1, eps=1E-4, verbose=False, log=True):
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
            log_file.write('gamma           : %f \n' % gamma)
            log_file.write('eps             : %f \n' % eps)
            log_file.write('\n')
            log_file.write('==iter ==\n')

        print 'Fitted value iterations ...'

        positions = self.__sample_position(n_state)
        X = np.zeros((n_state, 2))
        y = np.zeros(n_state)
        it = 0

        while it < n_iter:

            it += 1
            delta = 0
            y_old = y.copy()

            # expectation
            for i in xrange(0, n_state):
                sys.stdout.write(".")
                self.spawn_predator(positions[i, :, 0])
                self.spawn_prey(positions[i, :, 1])
                X[i, :] = self.get_predator_state()

                approximated_value = np.zeros(self.predator.action_space.size)

                for idx, action in enumerate(self.predator.action_space):
                    next_states = self.__sample_next_state(n_state, action)
                    approximated_value[idx] = self.__approximate_value(next_states, gamma)

                y[i] = np.max(approximated_value)
                delta = max(delta, abs(y_old[i] - y[i]))

            if verbose or it % 100 == 0:
                if log:
                    log_file.write('%d,%f' % (it, delta))
                print 'iter %d ::: %f' % (it, delta)
                print y
            log_file.write('\n')

            if delta < eps * 2 * gamma / ((1 - gamma) ** 2):
                if log:
                    log_file.write('\nconverged       : Yes at %d\n' % it)
                    log_file.write('\n== Ys ==\n')
                    for i in y:
                        log_file.write('%f\n' % i)
                    log_file.write('\n== Xs ==\n')
                    for (i, j) in X:
                        log_file.write('(%f, %f)\n' % (i, j))

                print "converged at iteration %d" % it
                print "Ys", y
                print "Xs", X
                break

            # maximization
            self.train_model(X, y)

            if it == 1:
                self.__plot(X, 'g')

        if it >= n_iter:
            if log:
                log_file.write('converged       : No at %d\n' % it)

            print "not converged"

        if log:
            cPickle.dump((y, self.model), open(log_filename + '.cp', 'w'))

        self.__plot(X, 'r')
        plt.show()
        return self.model

    def __sample_position(self, n_state, discretized=True):
        """
        it returns n_state x 2 array
        """

        # sample initial position for predator and prey
        np.random.seed()
        x = np.random.uniform(0, self.width, (n_state, 2))
        y = np.random.uniform(0, self.height, (n_state, 2))

        if discretized:
            x = np.round(x, 1)
            y = np.round(y, 1)

        x[0, :] = [0, .9]
        y[0, :] = [0, 0]

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


    """
    exact value iteration
    """

    def get_all_states(self, steps=0.1, digit=1):
        return np.around([val for val in itertools.product(np.arange(-5, 5, steps), repeat=2)], digit) + [0., 0.]

    def get_all_actions(self):
        return np.around([val for val in itertools.product(self.predator.action_space, repeat=2)], 1) + [0., 0.]

    def exact_value_iteration(self, n_iter=100, gamma=0.1, eps=1E-4, verbose=False, log=True):
        """
        MDP value iteration
        :param n_iter:
        :param gamma:
        :param eps:
        :param verbose:
        :param log:
        :return:
        """
        states = self.get_all_states()

        V_ = dict([('%.1f_%.1f' % (s[0], s[1]), 0) for s in states])
        it = 0

        while it < n_iter:
            it += 1
            V = V_.copy()

            delta = 0
            for sidx, s in enumerate(states):
                if sidx % 1000 == 0:
                    sys.stdout.write(".")

                sIndex = '%.1f_%.1f' % (s[0], s[1])
                #
                # s_val = 0
                # for a in self.get_all_actions():
                #     val = 0
                #     for (p, s_) in self.__exact_transition(s, a):
                #         s_Index = '%.1f_%.1f' % (s_[0], s_[1])
                #         if s_Index in V:
                #             val += p * V[s_Index]
                #         else:
                #             print s_Index
                #     s_val = max(s_val, val)
                #
                r = 0
                if abs(s[0]) <= 1 and abs(s[1]) <= 1:
                    r = 1
                #
                # V_[sIndex] = r + gamma * s_val

                V_[sIndex] = r + gamma * max(
                    [sum([p * V['%.1f_%.1f' % (s_[0], s_[1])] for (p, s_) in self.__exact_transition(s, a)])
                     for a in self.get_all_actions()])

                delta = max(delta, abs(V_[sIndex] - V[sIndex]))

            print it, delta

            if delta < eps:
                return V

    def __exact_transition(self, s, a):
        p = 1
        s_ = self.toroidal_state(s + a)
        return [(p, s_)]

    def __plot(self, sampled_state, c='b', cmap='hot'):
        x, y = np.meshgrid(np.linspace(-5, 5), np.linspace(-5, 5))
        z = []
        for i in range(len(x[0])):
            for j in range(len(x)):
                pairwise = [x[j][i], y[j][i]]
                z.append(self.model.predict(pairwise))

        z = np.array(z).reshape(x.shape)
        self.ax.plot_surface(x, y, z, cmap=cmap, alpha=0.5)
        # self.ax.scatter(sampled_state[:, 0], sampled_state[:, 1], self.model.predict(sampled_state), c=c)
        # self.ax.plot_wireframe(x, y, z)


if __name__ == '__main__':
    world = World(10, 10)
    world.spawn_prey([5, 5], [[1, 0], [0, 1]])
    world.spawn_predator([0.0, 0.0])
    print 'init predator', world.predator.position
    print 'init predator state', world.get_predator_state()
    print ''

    for _ in xrange(5):
        world.predator.move()
        print ' predator move to:   ', world.predator.position
        world.prey.move()
        print ' prey move to:       ', world.prey.position
        print ' state:              ', world.get_predator_state()
        print ''

    # world.fitted_value_iteration(n_iter=20, verbose=True, n_state=100, n_sample=100, gamma=0.1)
    world.exact_value_iteration(n_iter=20, verbose=True, gamma=0.1)

    # print model.predict((x,y))