# ERC721Entity Contract

ERC721Entity Contract defines a standard ERC721 token, and then extends the functionality to give entity-type properties and functionality. An entity is defined here as a unique non-fungible token having: owner-mutable name, immutable age, immutable traceable lineage, and immutable genes propagated with both randomness and rarity. Entity creation requires two transactions total: First createEntity is called by the intended owner, which places the entity into a spawning pool with a pre-determined spawn block. After that, someone calling spawnEntity on or after the entity's spawn block, will spawn that entity, giving it genes. Genes are applied using the randomness of the pre-determined spawn block's hash combined with it's blind semi-random spawner. 
 
## Entity Creation
 
Creating an entity starts with calling createEntity, with a name and optional parents. Parents are given as two entity IDs. If no parents are given, the entity will be spawned with random rarity genes. If parents given, the entity will be spawned with random combinatorial genes. Each successful call to createEntity will cost 4 finney, which is payed in-full indirectly to the future spawner of that created entity.

## Entity Genes

Entity Genes are specified as 32 8-bit (0-255) values, which can be used as a property such as hair color, or as the entity's "potential" in some activity, for example: max movement speed or strength. The applied genes must have both randomness and rarity. Randomness is achieved in this implementation by either: Random Rarity Propagation, when created without parents, or Random Combinatorial Propagation, when created with parents. Both use a pre-determined future block hash, combined with blind semi-random spawning, to achieve randomness. 

## Random Rarity Propagation

With Random Rarity Propagation an entity is spawned, without parents, randomly giving it an exponentially curved set of possible gene values. Roughly half of all gene values spawned will be between 32 and 64, with each value above that being increasingly more rare. Maximum rarity for a single gene is 1:256, representing max gene value of 255. Getting all 32 genes at 255, has odds of 1:256^32, a 77 digit number, relatively impossible.

## Random Combinatorial Propagation

With Random Combinatorial Propagation an entity has parents, and therefore spawned with random gene values - between the values' of each of it's parents' genes. The min gene resulting value, will always be the lower of the two parent genes, and the higher of the two parent genes being the max, of any specific gene being randomized in-between those parent gene values.

## Entity Lineage

With each entity having either 2 parents or null parents, any entity's origin can be traced back to null parent end-nodes, creating a provable tree of lineage. An entity can never have only one null parent, either both null/zero, or both existing/traceable entities.

## Entity Spawning

Once created using createEntity, an entity goes into a spawning pool with a pre-determined spawn block and zeroed/null genes. On or after that pre-determined spawn block, spawnEntity can be called to spawn the entity, providing it with genes. Transaction spawnEntity can be called by anyone at any time, spawning the next queued spawn that is ready. Each successful call to spawnEntity pays 4 finney, payed indirectly by a previous caller of createEntity. If no spawns in queue, or none that are ready to spawn left on the block being called on, transaction will fail at minimal cost (~1/5 finney.) If 5 spawnEntity transactions occur on the same block, and only 4 spawns are ready on that block, the fifth call will fail. 

## Entity Renaming

Entity owner can rename entity at any time by calling nameEntity, for example, renaming an entity after purchasing it from someone else. Entity name will always be chopped at a 32 byte max.

## Entity Expiration

Given the Ethereum block-history-limit of 256 blocks, if a spawning entity reaches 255 blocks from pre-determined spawn block without being spawned, that entity's spawning becomes expired. An expired entity, cannot be spawned and therefore has permanently zeroed genes. Spawning is blind to the spawner, and queued in order, so for an entity to become expired, a full-stop in spawning must occur for 255 blocks, which should be relatively rare. If an entity creator is the only spawning force currently in play, it is their responsibility to spawn entities they have created. Claiming spawning reward, plays a more major role in motivating spawning activity of course. A call to spawnEntity, with expired spawn next in queue, still pays the spawner as always, but will result in a cheaper transaction, so expired spawns are never a penalty to spawner (to avoid backlog of expired spawns of any kind.) The number of entities ready to spawn, can be determined on any block, by calling spawnCount.
 
## Note on Block Hash Randomness

Obviously pseudo-random, and miner generated, but relatively random enough for it's given purpose. Miners have some control over block hash creation, but the process involves GPUs trying millions of nonces per second each translating into a different block hash. Once a nonce result hits the target difficulty, the new block immediately propagates in attempt to win the block creation reward. Any additional "rerolling" of nonce attempts and/or reordering transactions to find a more desirable resulting hash value exponentially adds risk of losing the block creation reward. Therefore, all block hash random values used must not translate into potential value over block reward, currently 3+ Eth, to ensure it's never worth it for miners to take that risk. Even if they do, it amounts to a series of re-rolls, and never direct control over exact block hash value. 

Miners also control transaction ordering, which can effect outcome to some degree, but not enough to cause any significant advantage or adverse disadvantage. Future block hash value (as opposed to current block hash) is used for two reasons: allows a built-in 12 block transaction verification process, and prevents any kind of read-ahead checking of block hash value by miners on any given block. All block hashes used are combined with integral data, so there is no block hash rooted value that effects any state values directly. In the case of spawning, in this implementation, an exact spawn block - 12 blocks into the future - is set during the createEntity call, and then the spawn block's hash is combined with unique entity id and spawner address during the spawnEntity call. 

## Usage with Truffle

clone repo
truffle compile
truffle test
truffle migrate

Author: Brian Ludlam