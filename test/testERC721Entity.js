const truffleAssert = require('truffle-assertions');
const ERC721Entity = artifacts.require("ERC721Entity");

const entities = [];
const names = ["op", "Bob", "Steve", "Tim", "Dave", "Bill", "Sam", "Heather", "Brian"];
const index = [1,2,3,4,5,6,7,8,9];
const SPAWNING_FEE = "4000000000000000";//4 finney
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

const logThis = (obj) => console.log('LOG - ',obj);
//logThis(e);

contract("ERC721Entity", (accounts) => {

	const operator = accounts[0];
	const alice = accounts[1];
	const bob = accounts[2];
  let entity;

  beforeEach(async () => {
    entity = await ERC721Entity.new({from: operator});
  });

  afterEach(async () => {
    await entity.destroy({from: operator});
  });

  it("Acts like an ERC721Entity", async () => {
  	let startBlock = await web3.eth.getBlock("latest");
  	let tx = await entity.createEntity ("Alice", 0, 0, {from: alice, value: SPAWNING_FEE});
  	assert.equal (tx.receipt.status, true, "createEntity - status false");
  	assert.equal (tx.receipt.blockNumber > 0, true, "createEntity - No Tx blockNumber");
  	let createBlock = tx.receipt.blockNumber;
  	let spawnBlock = createBlock + 12;
  	truffleAssert.eventEmitted(tx, 'Transfer', (e) => (
  		e.from === ADDRESS_ZERO && 
    	e.to === alice && 
    	e.tokenId.toString() === "1"
  	));
  	let aliceName1 = await entity.nameOf ("1", {from: alice});
  	aliceName1 = aliceName1.toString().replace(/[^A-Za-z0-9\s$%&*!@-_().]/ig, "");
  	assert.equal (aliceName1, "Alice", "nameEntity - name check");
  	
  	let aliceOwner = await entity.ownerOf ("1", {from: bob});
  	assert.equal (aliceOwner, alice, "ownerOf");

  	let aliceGenes = await entity.genesOf ("1", {from: bob});
  	assert.equal (aliceGenes.reduce((total, num) => (total + num)), 0, "Zeroed genes");

  	let aliceParents = await entity.parentsOf ("1", {from: bob});
  	assert.equal (aliceParents.parentA, 0, "Zeroed parents");
  	assert.equal (aliceParents.parentB, 0, "Zeroed parents");

  	let aliceAge = await entity.ageOf ("1", {from: bob});
  	assert.equal (aliceAge, 0, "Zeroed age");

  	let aliceEntity = await entity.getEntity ("1", {from: bob});
  	assert.equal (aliceEntity.owner, alice, "owner");
  	assert.equal (aliceEntity.born, spawnBlock, "Born spawn block");
  	assert.equal (aliceEntity.parentA, 0, "Zeroed parents");
  	assert.equal (aliceEntity.parentB, 0, "Zeroed parents");
  	assert.equal (aliceEntity.genes.reduce((total, num) => (total + num)), 0, "Zeroed genes");
  	aliceName1 = aliceEntity.name.toString().replace(/[^A-Za-z0-9\s$%&*!@-_().]/ig, "");
  	assert.equal (aliceName1, "Alice", "nameEntity name check");

  	tx = await entity.createEntity ("Alice2", 0, 0, {from: alice, value: SPAWNING_FEE});
    assert.equal (tx.receipt.status, true, "createEntity - status false");
    truffleAssert.eventEmitted(tx, 'Transfer', (e) => (
      e.from === ADDRESS_ZERO && 
      e.to === alice && 
      e.tokenId.toString() === "2"
    ));

  	tx = await entity.nameEntity ("1", "Alice1", {from: alice});
  	assert.equal (tx.receipt.status, true, "nameEntity - status false");
  	assert.equal (tx.receipt.blockNumber > 0, true, "nameEntity - No Tx blockNumber");
  	let block = tx.receipt.blockNumber;
  	truffleAssert.eventEmitted(tx, 'NameChanged', (e) => (
  		e.owner.toString() === alice && 
    	e.entity.toString() === "1" && 
    	e.name.toString().replace(/[^A-Za-z0-9\s$%&*!@-_().]/ig, "") === "Alice1"
  	));
  	aliceName1 = await entity.nameOf ("1", {from: bob});
  	aliceName1 = aliceName1.toString().replace(/[^A-Za-z0-9\s$%&*!@-_().]/ig, "");
  	assert.equal (aliceName1, "Alice1", "nameEntity name check");

  	//using nameEntity to push block chain forward to spawn block
  	while (block < (spawnBlock-1)) {
  		tx = await entity.nameEntity ("1", "Alice1", {from: alice});
  		assert.equal (tx.receipt.status, true, "nameEntity");
  		block++;
  	}
  	block = await web3.eth.getBlock("latest");
  	assert.equal (block.number, spawnBlock-1, "block check");

  	tx = await entity.spawnEntity ({from: alice});
  	assert.equal (tx.receipt.status, true, "spawnEntity tx status");
  	truffleAssert.eventEmitted(tx, 'Spawned', (e) => (
  		e.owner.toString() === alice && 
    	e.entity.toString() === "1" && 
    	e.spawner.toString() === alice
  	));
  	aliceGenes = await entity.genesOf ("1", {from: bob});
  	assert.equal (aliceGenes.reduce((total, num) => (total + num)) > 0, true, "Has genes");

  	tx = await entity.spawnEntity ({from: bob});
  	assert.equal (tx.receipt.status, true, "spawnEntity - status false");
  	truffleAssert.eventEmitted(tx, 'Spawned', (e) => (
  		e.owner.toString() === alice && 
    	e.entity.toString() === "2" && 
    	e.spawner.toString() === bob
  	));
  	aliceGenes = await entity.genesOf ("2", {from: bob});
  	assert.equal (aliceGenes.reduce((total, num) => (total + num)) > 0, true, "Has genes");

  	tx = await entity.createEntity ("Alice3", "1", "2", {from: alice, value: SPAWNING_FEE});
  	assert.equal (tx.receipt.status, true, "createEntity - status false");
  	truffleAssert.eventEmitted(tx, 'Transfer', (e) => (
  		e.from === ADDRESS_ZERO && 
    	e.to === alice && 
    	e.tokenId.toString() === "3"
  	));
  	block = createBlock = tx.receipt.blockNumber;
  	spawnBlock = createBlock + 12;
  	while (block < (spawnBlock-1)) {
  		tx = await entity.nameEntity ("1", "Alice1", {from: alice});
  		assert.equal (tx.receipt.status, true, "nameEntity");
  		block++;
  	}
  	block = await web3.eth.getBlock("latest");
  	assert.equal (block.number, spawnBlock-1, "block check");

  	tx = await entity.spawnEntity ({from: alice});
  	assert.equal (tx.receipt.status, true, "spawnEntity tx status");
  	truffleAssert.eventEmitted(tx, 'Spawned', (e) => (
  		e.owner.toString() === alice && 
    	e.entity.toString() === "3" && 
    	e.spawner.toString() === alice
  	));
  	aliceGenes = await entity.genesOf ("3", {from: bob});
  	assert.equal (aliceGenes.reduce((total, num) => (total + num)) > 0, true, "Has genes");

  	aliceParents = await entity.parentsOf ("3", {from: bob});
  	assert.equal (aliceParents.parentA, "1", "Has parents");
  	assert.equal (aliceParents.parentB, "2", "Has parents");

  	let aliceBalance = await entity.balanceOf (alice, {from: bob});
  	assert.equal (aliceBalance, 3, "Has balance");
  	aliceOwner = await entity.ownerOf ("3", {from: bob});
  	assert.equal (aliceOwner, alice, "ownerOf");

  	let bobBalance = await entity.balanceOf (bob, {from: bob});
  	assert.equal (bobBalance, 0, "Zero balance");

  	tx = await entity.safeTransferFrom (alice, bob, "3", {from: alice});
  	assert.equal (tx.receipt.status, true, "transferFrom - status false");
  	truffleAssert.eventEmitted(tx, 'Transfer', (e) => (
  		e.from === alice && 
    	e.to === bob && 
    	e.tokenId.toString() === "3"
  	));
  	let bobOwner = await entity.ownerOf ("3", {from: bob});
  	assert.equal (bobOwner, bob, "ownerOf");

  	aliceBalance = await entity.balanceOf (alice, {from: alice});
  	assert.equal (aliceBalance, 2, "Has balance");

  	bobBalance = await entity.balanceOf (bob, {from: bob});
  	assert.equal (bobBalance, 1, "Has balance");

  	let bobApproved = await entity.isApprovedForAll (alice, bob, {from: operator});
  	assert.equal (bobApproved, false, "isApprovedForAll");

  	tx = await entity.setApprovalForAll (bob, true, {from: alice});
  	assert.equal (tx.receipt.status, true, "setApprovalForAll - status false");
  	truffleAssert.eventEmitted(tx, 'ApprovalForAll', (e) => (
  		e.owner === alice && 
    	e.operator === bob && 
    	e.approved === true
  	));

  	bobApproved = await entity.isApprovedForAll (alice, bob, {from: operator});
  	assert.equal (bobApproved, true, "isApprovedForAll");

  	tx = await entity.safeTransferFrom (alice, operator, "1", {from: bob});
  	assert.equal (tx.receipt.status, true, "transferFrom - status false");
  	truffleAssert.eventEmitted(tx, 'Transfer', (e) => (
  		e.from === alice && 
    	e.to === operator && 
    	e.tokenId.toString() === "1"
  	));
  	let opOwner = await entity.ownerOf ("1", {from: bob});
  	assert.equal (opOwner, operator, "ownerOf");

  	tx = await entity.setApprovalForAll (bob, false, {from: alice});
  	assert.equal (tx.receipt.status, true, "setApprovalForAll - status false");
  	truffleAssert.eventEmitted(tx, 'ApprovalForAll', (e) => (
  		e.owner === alice && 
    	e.operator === bob && 
    	e.approved === false
  	));

  	bobApproved = await entity.isApprovedForAll (alice, bob, {from: operator});
  	assert.equal (bobApproved, false, "isApprovedForAll");

  	tx = await entity.approve (operator, "2", {from: alice});
  	assert.equal (tx.receipt.status, true, "approve - status false");
  	truffleAssert.eventEmitted(tx, 'Approval', (e) => (
  		e.owner === alice && 
    	e.approved === operator && 
    	e.tokenId.toString() === "2"
  	));

  	let opApproved = await entity.getApproved ("2", {from: operator});
  	assert.equal (opApproved, operator, "getApproved");

  	tx = await entity.safeTransferFrom (alice, bob, "2", {from: operator});
  	assert.equal (tx.receipt.status, true, "transferFrom - status false");
  	truffleAssert.eventEmitted(tx, 'Transfer', (e) => (
  		e.from === alice && 
    	e.to === bob && 
    	e.tokenId.toString() === "2"
  	));
  	bobOwner = await entity.ownerOf ("2", {from: bob});
  	assert.equal (bobOwner, bob, "ownerOf");
  });

});