const mongoose = require('mongoose');
const { Schema } = mongoose;
const moment = require('moment-timezone');

const gameRecruitmentsSchema = new Schema({
    rctsId: String, // 구인글의 상호작용 ID
    messageId : String, // 구인글 messageID
    owner: Object, // 구인글 작성한 회원의 정보
    members: [Object], // 게임 참여 회원 목록
    memberCount: Number, // 마감 인원수
    currentMemberCount: Number, // 가능을 누른 사람들의 수
    startTime: String, // 게임 시작 시간
    isClosed: Number, // 게임 마감 여부
    gameMode: String, // 게임 유형
    createdAt: { // 구인글 작성 시간
        type: Date,
        default: () => moment().tz('Asia/Seoul').toDate(),
        get: (value) => moment(value).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
    },
}, { toJSON: { getters: true }, toObject: { getters: true } }); // JSON 변환 시 getter 적용

module.exports = mongoose.model('gameRecruitments', gameRecruitmentsSchema);
