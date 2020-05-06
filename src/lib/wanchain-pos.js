const Method = require("web3-core-method");

function Pos(web3) {
    this._requestManager = web3._requestManager;
    web3.pos = this;

    const self = this;

    const methods = [
        new Method({
            name: 'version',
            call: 'pos_version',
            params: 0
        }),

        new Method({
            name: 'getEpochStakeOut',
            call: 'pos_getEpochStakeOut',
            params: 1
        }),
        new Method({
            name: 'getEpochIncentiveBlockNumber',
            call: 'pos_getEpochIncentiveBlockNumber',
            params: 1
        }),

        new Method({
            name: 'getSlotLeaderByEpochIDAndSlotID',
            call: 'pos_getSlotLeaderByEpochIDAndSlotID',
            params: 2
        }),

        new Method({
            name: 'getEpochLeadersByEpochID',
            call: 'pos_getEpochLeadersByEpochID',
            params: 1
        }),

        new Method({
            name: 'getEpochLeadersAddrByEpochID',
            call: 'pos_getEpochLeadersAddrByEpochID',
            params: 1
        }),

        new Method({
            name: 'getLeaderGroupByEpochID',
            call: 'pos_getLeaderGroupByEpochID',
            params: 1
        }),
        new Method({
            name: 'getSmaByEpochID',
            call: 'pos_getSmaByEpochID',
            params: 1
        }),

        new Method({
            name: 'getRandomProposersByEpochID',
            call: 'pos_getRandomProposersByEpochID',
            params: 1
        }),

        new Method({
            name: 'getRandomProposersAddrByEpochID',
            call: 'pos_getRandomProposersAddrByEpochID',
            params: 1
        }),

        new Method({
            name: 'getSlotScCallTimesByEpochID',
            call: 'pos_getSlotScCallTimesByEpochID',
            params: 1
        }),

        new Method({
            name: 'getSlotCreateStatusByEpochID',
            call: 'pos_getSlotCreateStatusByEpochID',
            params: 1
        }),

        new Method({
            name: 'getRandom',
            call: 'pos_getRandom',
            params: 2
        }),
        new Method({
            name: 'getRbSignatureCount',
            call: 'pos_getRbSignatureCount',
            params: 2
        }),
        new Method({
            name: 'getChainQuality',
            call: 'pos_getChainQuality',
            params: 2
        }),
        new Method({
            name: 'getReorgState',
            call: 'pos_getReorgState',
            params: 1
        }),

        new Method({
            name: 'getPosInfo',
            call: 'pos_getPosInfo',
            params: 0
        }),
        new Method({
            name: 'getEpochStakerInfo',
            call: 'pos_getEpochStakerInfo',
            params: 2
        }),
        new Method({
            name: 'getEpochStakerInfoAll',
            call: 'pos_getEpochStakerInfoAll',
            params: 1
        }),
        new Method({
            name: 'getLocalPK',
            call: 'pos_getLocalPK',
            params: 0
        }),
        new Method({
            name: 'getBootNodePK',
            call: 'pos_getBootNodePK',
            params: 0
        }),
        new Method({
            name: 'getWhiteListConfig',
            call: 'pos_getWhiteListConfig',
            params: 0
        }),
        new Method({
            name: 'getWhiteListbyEpochID',
            call: 'pos_getWhiteListbyEpochID',
            params: 1
        }),
        new Method({
            name: 'getEpochIncentivePayDetail',
            call: 'pos_getEpochIncentivePayDetail',
            params: 1
        }),
        new Method({
            name: 'getTotalIncentive',
            call: 'pos_getTotalIncentive',
            params: 0
        }),
        new Method({
            name: 'getEpochIncentive',
            call: 'pos_getEpochIncentive',
            params: 1
        }),
        new Method({
            name: 'getEpochRemain',
            call: 'pos_getEpochRemain',
            params: 1
        }),
        new Method({
            name: 'getTotalRemain',
            call: 'pos_getTotalRemain',
            params: 0
        }),
        new Method({
            name: 'getIncentiveRunTimes',
            call: 'pos_getIncentiveRunTimes',
            params: 0
        }),
        new Method({
            name: 'getEpochGasPool',
            call: 'pos_getEpochGasPool',
            params: 1
        }),
        new Method({
            name: 'getStakerInfo',
            call: 'pos_getStakerInfo',
            params: 1,
            outputFormatter: function(stakers) {
                for(let i=0; i<stakers.length; i++) {
                    stakers[i].votingPower = web3.utils.toBN(stakers[i].votingPower);
                    stakers[i].amount = web3.utils.toBN(stakers[i].amount);
                    for (let k=0; k<stakers[i].clients.length; k++) {
                        stakers[i].clients[k].votingPower = web3.utils.toBN(stakers[i].clients[k].votingPower);
                        stakers[i].clients[k].amount = web3.utils.toBN(stakers[i].clients[k].amount);
                    }
                    for (let k=0; k<stakers[i].partners.length; k++) {
                        stakers[i].partners[k].votingPower = web3.utils.toBN(stakers[i].partners[k].votingPower);
                        stakers[i].partners[k].amount = web3.utils.toBN(stakers[i].partners[k].amount);
                    }
                }
                return stakers
            }
        }),
        new Method({
            name: 'getRBAddress',
            call: 'pos_getRBAddress',
            params: 1
        }),
        new Method({
            name: 'getIncentivePool',
            call: 'pos_getIncentivePool',
            params: 1
        }),

        new Method({
            name: 'getActivity',
            call: 'pos_getActivity',
            params: 1
        }),
        new Method({
            name: 'getEpRnpActivity',
            call: 'pos_getEpRnpActivity',
            params: 1
        }),
        new Method({
            name: 'getValidatorActivity',
            call: 'pos_getValidatorActivity',
            params: 1
        }),
        new Method({
            name: 'getSlotActivity',
            call: 'pos_getSlotActivity',
            params: 1
        }),
        new Method({
            name: 'getEpochID',
            call: 'pos_getEpochID',
            params: 0
        }),
        new Method({
            name: 'getSlotID',
            call: 'pos_getSlotID',
            params: 0
        }),
        new Method({
            name: 'getSlotCount',
            call: 'pos_getSlotCount',
            params: 0
        }),
        new Method({
            name: 'getSlotTime',
            call: 'pos_getSlotTime',
            params: 0
        }),
        new Method({
            name: 'getMaxStableBlkNumber',
            call: 'pos_getMaxStableBlkNumber',
            params: 0
        }),
        new Method({
            name: 'calProbability',
            call: 'pos_calProbability',
            params: 2
        }),
        new Method({
            name: 'getEpochIDByTime',
            call: 'pos_getEpochIDByTime',
            params: 1
        }),
        new Method({
            name: 'getSlotIDByTime',
            call: 'pos_getSlotIDByTime',
            params: 1
        }),
        new Method({
            name: 'getTimeByEpochID',
            call: 'pos_getTimeByEpochID',
            params: 1
        }),
        new Method({
            name: 'getEpochBlkCnt',
            call: 'pos_getEpochBlkCnt',
            params: 1
        }),
        new Method({
            name: 'getValidSMACnt',
            call: 'pos_getValidSMACnt',
            params: 1
        }),
        new Method({
            name: 'getSlStage',
            call: 'pos_getSlStage',
            params: 1
        }),
        new Method({
            name: 'getValidRBCnt',
            call: 'pos_getValidRBCnt',
            params: 1
        }),
        new Method({
            name: 'getRbStage',
            call: 'pos_getRbStage',
            params: 1
        }),
        new Method({
            name: 'getEpochIdByBlockNumber',
            call: 'pos_getEpochIdByBlockNumber',
            params: 1
        }),
        new Method({
            name: 'getTps',
            call: 'pos_getTps',
            params: 2
        }),
    ];



    methods.forEach(function (method) {
        method.attachToObject(self);
        method.setRequestManager(self._requestManager); // second param means is eth.accounts (necessary for wallet signing)
    });
}

module.exports = Pos;
