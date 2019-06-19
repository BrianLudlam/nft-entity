const Entity = artifacts.require("ERC721Entity");

module.exports = function(deployer) {
  deployer.deploy(Entity);
};
