from world import World


world = World(10, 10)
world.spawnPredator(5, 5)
world.spawnPredator(5, 5)
world.spawnPredator(5, 5)

print world.getPredator()