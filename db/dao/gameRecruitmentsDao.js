const gameRecruitments = require('../schemas/gameRecruitments');

// 구인정보 저장
const insertGameRecruitment = async (data) => {
    const gameRecruitment = new gameRecruitments(data);
    return await gameRecruitment.save();
}

// 구인글 ID로 정보 조회
const findOneRctsId = async (rctsId) => {
    return await gameRecruitments.findOne({rctsId: rctsId});
}

// 게임참여자 수 업데이트
const updateCurrentMemberCount = async (rctsId, currentMemberCount) => {
    await gameRecruitments.updateOne({rctsId}, {currentMemberCount});
}

// 가능 누른 사람 추가
const addMember = async (rctsId, newMember) => {
    await gameRecruitments.findOneAndUpdate(
        { rctsId: rctsId },
        { $push: { members: newMember } }, // 기존 members 배열에 추가
        { new: true }
    );
};

// 취소 누른 멤버 제외
const removeMember = async (rctsId, memberId) => {
     await gameRecruitments.findOneAndUpdate(
        { rctsId: rctsId },
        { $pull: { members: { id: memberId } } }, // `id`가 일치하는 객체 삭제
        { new: true }
    );
};

module.exports = {
    insertGameRecruitment,
    findOneRctsId,
    addMember,
    removeMember,
    updateCurrentMemberCount
}