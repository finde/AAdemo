from world import World
import cPickle
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

plt.style.use('ggplot')


def fvi(N, M, gamma):
    world = World(10, 10)
    world.spawn_prey([5, 5], [[1, 0], [0, 1]])
    world.spawn_predator([0.0, 0.0])
    world.fitted_value_iteration(n_iter=20, verbose=True, n_state=N, n_sample=M, gamma=gamma)


def evi():
    world = World(10, 10)
    world.spawn_prey([5, 5], [[1, 0], [0, 1]])
    world.spawn_predator([0.0, 0.0])
    V = world.exact_value_iteration(n_iter=20, verbose=True, gamma=0.1)
    cPickle.dump(V, open('exact_value_iteration_I20.cp', 'w'))


if __name__ == '__main__':
    print 'Fitted Value Iteration'

    V = cPickle.load(open('exact_value_iteration_I20.cp', 'r'))

    fig = plt.figure()
    ax = fig.gca(projection='3d')

    x, y = np.meshgrid(np.linspace(-5, 4.9, 100), np.linspace(-5, 4.9, 100))
    z = []
    for i in range(len(x[0])):
        for j in range(len(x)):
            print x[j][i], y[j][i]
            z.append(V['%.1f_%.1f' % (x[j][i], y[j][i])])

    z = np.array(z).reshape(x.shape)
    ax.plot_surface(x, y, z, cmap='hot', alpha=0.8)

    plt.show()

    print 'Exact Value Iteration'
    fvi(10, 10, 0.1)
    fvi(10, 10, 0.8)

    fvi(50, 50, 0.1)
    fvi(50, 50, 0.8)

    fvi(100, 100, 0.1)
    fvi(1000, 100, 0.1)
    # print "fitted value iteration experiment with different sample"
    # p = Pool(5)
    # for sample in [10, 100, 1000]:
    # p.map(fvi, [sample, sample, sample])  # 10 times for each sample size