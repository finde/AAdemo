from world import World

world = World(10, 10)
world.spawn_prey([0.1, 0.1], [[1, 0], [0, 1]])
world.spawn_predator([10.0, 10.0])

print world.fitted_value_iteration(n_iter=10000, verbose=True)
