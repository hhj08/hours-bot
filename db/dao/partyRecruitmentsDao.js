const partyRecruitments = require('../schemas/partyRecruitments');
const moment = require('moment-timezone');
const gameRecruitments = require('../schemas/gameRecruitments');

// 파티구인글 저장
const savePartyRecruitment = async (data) => {
    const gameRecruitment = new partyRecruitments(data);
    return await gameRecruitment.save();
}

// 파티구인글 messageId로 찾기
const findOneMessageId = async (messageId) => {
    return await gameRecruitments.findOne({messageId});
}

module.exports = {
    savePartyRecruitment,
    findOneMessageId
}
