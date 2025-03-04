const partyRecruitments = require('../schemas/partyRecruitments');
const moment = require('moment-timezone');

const startOfToday = moment().tz('Asia/Seoul').startOf('day').toDate();
const endOfToday = moment().tz('Asia/Seoul').endOf('day').toDate();

// 파티구인글 저장
const savePartyRecruitment = async (data) => {
    const gameRecruitment = new partyRecruitments(data);
    return await gameRecruitment.save();
}

// 파티구인글 messageId로 찾기
const findOneMessageId = async (messageId) => {
    return partyRecruitments.findOne({messageId});
}

// 구인글 중복 방지
const dupRecruitmentCheck = async (ownerId) => {
    return await partyRecruitments.findOne({
        "owner.id": ownerId,
        isClosed: false,
        isExploded: false,
        createdAt: { $gte: startOfToday, $lt: endOfToday }
    })
        .sort({ createdAt: -1 })
}

// 시작 시간 알람을 위한 목록 찾기
const partyRecruitmentList = async () => {
    // const nowHour = moment().tz('Asia/Seoul').format('H:mm');
    const nowHour = "15:30";

    return await partyRecruitments.find({
        isExploded: false,
        startTime: nowHour,
        createdAt: { $gte: startOfToday, $lt: endOfToday }
    });
}

// 단순히 업데이트만 진행
const updateMessageId = async (messageId, cond) => {
    await partyRecruitments.updateOne(
        { messageId }, cond
    );
}
// MessageId로 업데이트 후 업데이트 된 데이터 반환
const findOneAndUpdateMessageId = async (messageId, cond) => {
    return await partyRecruitments.findOneAndUpdate(
        { messageId },
        cond,
        { new: true }
    );
}


module.exports = {
    savePartyRecruitment,
    findOneMessageId,
    dupRecruitmentCheck,
    updateMessageId,
    partyRecruitmentList,
    findOneAndUpdateMessageId
}
