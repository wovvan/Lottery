const Lottery = artifacts.require("Lottery.sol");

const getContractInstance = (contractName, owner, contrctAddress) => {
    const artifact = artifacts.require(contractName) // globally injected artifacts helper
    const deployedAddress = contrctAddress || artifact.networks[artifact.network_id].address;
    console.log('deployedAddress', deployedAddress);
    const instance = new web3.eth.Contract(artifact.abi, deployedAddress, {
        from: owner,
        gasPrice: '20000000000'
    })
    return instance
};

async function wait(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

contract('Lottery', async (accounts) => {
    let lottery;
    const owner = accounts[0];

    it('Lottery check becomeParticipant', async () => {
        lottery = await getContractInstance('Lottery', owner);
        await lottery.methods.becomeParticipant().send(
            { from: owner, gas: 4000000,gasPrice: 1 });
        const participant = await lottery.methods.getParticipantById(0).call(
            { from: owner, gas: 4000000,gasPrice: 1 });
        assert.equal(owner, participant);
    });


    it('double becomeParticipant', async () => {
        try {
        lottery = await getContractInstance('Lottery', owner);
        await lottery.methods.becomeParticipant().send(
            { from: owner, gas: 4000000,gasPrice: 1 });
        await lottery.methods.becomeParticipant().send(
            { from: owner, gas: 4000000,gasPrice: 1 });
        } catch (e) {
            assert.equal(e.toString().indexOf('Participant already exists') !== -1, true);
        }
    });



    it('Check finished lottery', async () => {
        lottery = await getContractInstance('Lottery', owner);
        await lottery.methods.becomeParticipant().send(
            { from: accounts[1], gas: 4000000,gasPrice: 1 });
        await lottery.methods.becomeParticipant().send(
            { from: accounts[2], gas: 4000000,gasPrice: 1 });
        await lottery.methods.becomeParticipant().send(
            { from: accounts[3], gas: 4000000,gasPrice: 1 });
        await lottery.methods.becomeParticipant().send(
            { from: accounts[4], gas: 4000000,gasPrice: 1 });


        const reveal = web3.utils.sha3('' + Math.random());
        const hash = await lottery.methods.getHash(reveal).call(
            { from: owner, gas: 4000000,gasPrice: 1 });

        await lottery.methods.commitHash(hash).send(
            { from: owner, gas: 4000000,gasPrice: 1 });


        const blockData = await lottery.methods.finishLottery(reveal).send(
            { from: owner, gas: 4000000,gasPrice: 1 });

        const winner = blockData.events.FinishLottery.returnValues.winner;
        assert.equal(accounts.includes(winner), true);
    });

});
