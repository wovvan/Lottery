pragma solidity >=0.5.8 < 0.6.0;

import "./Ownable.sol";

contract Lottery is Ownable {
    struct Commit {
        bytes32 dataHash;
        uint64 block;
        bool revealed;
    }
    struct Participant {
        bool isExist;
    }

    Commit public commit;
    address[] public participants;

    mapping (address => Participant) participantsByAddress;
    bool public isLotteryFinished;

    event newParticipant(address contractAddr, address participant);
    event gameFinished(address contractAddr, address winner);
    event CommitHash(address sender, bytes32 dataHash, uint64 block);
    event FinishLottery(address sender, bytes32 revealHash, address winner);

    constructor() public {
        isLotteryFinished = false;
    }

    function becomeParticipant() public {
        require(isLotteryFinished == false, "Lottery::becomeParticipant: Lottery is finished");
        require(participantsByAddress[msg.sender].isExist == false, "Lottery::becomeParticipant: Participant already exists");
        participants.push(msg.sender);
        participantsByAddress[msg.sender].isExist = true;
        emit newParticipant(address(this), msg.sender);
    }

    function getHash(bytes32 data) public view returns (bytes32){
        return keccak256(abi.encodePacked(address(this), data));
    }

    function getParticipantById(uint32 id) public view returns (address) {
        require(id >= 0 && id < participants.length, "Lottery::getParticipantById: id is out of range");
        return participants[id];
    }

    function commitHash(bytes32 dataHash) public onlyOwner {
        commit.dataHash = dataHash;
        commit.block = uint64(block.number);
        commit.revealed = false;
        emit CommitHash(msg.sender, commit.dataHash, commit.block);
    }

    function finishLottery(bytes32 revealHash) public onlyOwner returns(address) {
        require(commit.revealed == false, "Lottery::finishLottery: Already revealed");
        commit.revealed = true;
        require(getHash(revealHash) == commit.dataHash, "Lottery::finishLottery: Revealed hash does not match commit");
        require(uint64(block.number) > commit.block, "Lottery::finishLottery: Reveal and commit happened on the same block");
        require(uint64(block.number) <= commit.block + 250, "Lottery::finishLottery: Revealed too late");
        bytes32 blockHash = blockhash(commit.block);
        uint32 random = uint32(uint256(keccak256(abi.encodePacked(blockHash, revealHash)))) % uint32(participants.length);
        isLotteryFinished = true;
        emit FinishLottery(msg.sender, revealHash, participants[random]);
        return participants[random];
    }
}