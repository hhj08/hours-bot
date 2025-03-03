const mongoose = require('mongoose');
const { Schema } = mongoose;
const moment = require('moment-timezone');

const partyRecruitments = new Schema({
    interactionId: String,     // Discord 상호작용 ID
    messageId: String,         // Discord 메시지 ID
    joinMessageId: {type: String, default: null}, // 가능 답글 메시지 ID
    waitingMessageId: {type: String, default: null}, // 대기 답글 메시지 ID
    closedMessageId: {type: String, default: null}, //마감 메시지 ID
    owner: Object,           // 파티장 (구인글 작성자)
    members: {type:[Object], default: null},         // 파티 참여 멤버 목록
    waitingMembers: {type:[Object], default: null},  // 대기 인원 목록
    maxMembers: { type: Number, default: 5 },        // 최대 인원 수
    minMembers: Number,        // 최소 인원 수 - 마감 여부 인원수
    currentMembers: { type: Number, default: 1 },    // 현재 인원 수
    startTime: String,           // 시작 시간
    isClosed: { type: Boolean, default: false },         // 마감 여부 - 최대인원을 충족했을 때 true
    isExploded: { type: Boolean, default: false },       // 펑 여부 (파티 최소 인원 부족으로 파티 터짐)
    channelId: String,         // 채널 ID
    gameMode: String, //게임모드
    createdAt: {               // 구인글 작성 시간
        type: Date,
        default: () => moment().tz('Asia/Seoul').toDate(),
        get: (value) => moment(value).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
    },
}, { toJSON: { getters: true }, toObject: { getters: true } }); // JSON 변환 시 getter 적용

module.exports = mongoose.model('partyRecruitments', partyRecruitments);