const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const gameRecruitmentsSchema = new Schema({
    rctsId: String, // 구인글 ID
    owner: Object, // 구인글 작성한 회원의 정보 디코id, 롤닉
    members: [Object], // 게임을 참여하는 회원 목록
    memberCount: Number, // 게임의 마감 인원수
    currentMemberCount: Number, // 가능을 누른 사람들의 수
    startTime: String, // 게임 시작 시간
    isClosed : Number, // 게임 마감 여부 2미펑-2, 3미펑-3, 5미펑-5, 상시모집-0
    gameMode: String, // 게임 유형
    createdAt: { type: Date, default: Date.now } // 구인글 작성일자
});

module.exports = mongoose.model('gameRecruitments', gameRecruitmentsSchema);