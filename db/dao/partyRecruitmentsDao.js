const partyRecruitments = require('../schemas/partyRecruitments');
const moment = require('moment-timezone');

// 파티구인글 저장
const savePartyRecruitment = async (data) => {
    const gameRecruitment = new partyRecruitments(data);
    return await gameRecruitment.save();
}

module.exports = {
    savePartyRecruitment
}
