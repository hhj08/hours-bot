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

// 마감되지 않거나, 펑되지 않은 구인글 찾기
const findBoomPartyRecruitment = async (ownerId) => {
    return await partyRecruitments.findOne({
        "owner.id": ownerId,
        isClosed: false,
        isExploded: false,
        createdAt: { $gte: startOfToday, $lt: endOfToday }
    })
        .sort({ createdAt: -1 })
}

// 펑 or 마감 처리
const updateBoomOrClosed = async (messageId, data) => {
    await partyRecruitments.updateOne(
        { messageId },
        { $set: data }
    );
}

// 마감되지 않은 구인글 목록 반환
const partyRecruitmentList = async () => {
    const nowHour = moment().tz('Asia/Seoul').format('H:mm');
    // const nowHour = "22:00";

    return await partyRecruitments.find({
        isClosed: false,
        isExploded: false,
        startTime: nowHour,
        createdAt: { $gte: startOfToday, $lt: endOfToday }
    });
}

// 가능 누른 참여자 목록 및 현재 인원 업데이트
const addMembers = async (messageId, newMember) => {
    return await partyRecruitments.findOneAndUpdate(
        { messageId },
        {
            $push: { members: newMember },
            $inc: { currentMembers: 1 }
        },
        { new: true }
    );
}

// 취소 누른 참여자 목록 및 현재 인원 업데이트
const removeMembers = async (messageId, memberId) => {
    return await partyRecruitments.findOneAndUpdate(
        { messageId },
        {
            $pull: { members: { id: memberId } },
            $inc: { currentMembers: -1 }
        },
        { new: true }
    );
}

// 대기자 추가
const addWaitingMembers = async (messageId, newMember) => {
    return await partyRecruitments.findOneAndUpdate(
        { messageId },
        {
            $push: { waitingMembers: newMember },
        },
        { new: true }
    );
}

// 대기자 삭제
const removeWaitingMembers = async (messageId, newMember) => {
    return await partyRecruitments.findOneAndUpdate(
        { messageId },
        {
            $pull: { waitingMembers: { id: memberId } },
        },
        { new: true }
    );
}

module.exports = {
    savePartyRecruitment,
    findOneMessageId,
    findBoomPartyRecruitment,
    updateBoomOrClosed,
    partyRecruitmentList,
    addMembers,
    removeMembers,
    addWaitingMembers,
    removeWaitingMembers
}
