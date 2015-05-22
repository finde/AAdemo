from world import World
from multiprocessing import Pool


def f(n_sample):
    world = World(10, 10)
    world.fitted_value_iteration(n_iter=100000, verbose=True, n_sample=n_sample)


if __name__ == '__main__':
    print "experiment with different sample"
    p = Pool(5)
    for sample in [10, 100, 1000]:
        p.map(f, [sample for _ in xrange(10)])  # 10 times for each sample size