const cron = require("node-cron");
const partyRecruitmentsDao = require('../db/dao/partyRecruitmentsDao');
const script = require('../common/script');

require('dotenv').config();

// 현재 인원수와 마감 인원수를 비교
// 현재 인원수가 마감 인원수보다 크면 게임 시작 알람 메시지 전송
// 현재 인원수가 마감 인원수보다 작으면 펑 알람 메시지 전송
const schedule = (client) => {
    cron.schedule("* * * * *",  async function() {
        const partyRecruitmentList = await partyRecruitmentsDao.partyRecruitmentList();

        partyRecruitmentList.forEach(async party => {
            const { minMembers, currentMembers, members, messageId, channelId,
                isClosed, gameMode, startTime, owner } = party;

            let mentionIds = `<@${owner.id}>`;
            members.forEach(member => mentionIds += `, <@${member.id}>`);

            const channel = await client.channels.fetch(channelId);
            const message = await channel.messages.fetch(messageId);


            if(currentMembers >= minMembers ) {
                let text = (minMembers === 0 && !isClosed) ? `@everyone 상시 모집 중인 ${owner.name}님 ${gameMode} 게임이 ${startTime}에 시작돼요`
                    : script.alertStart(mentionIds, startTime, gameMode)
                await message.reply(text);
            }

            if(currentMembers < minMembers && minMembers !== 0) {
                await message.edit({
                    content: script.done(owner.name, gameMode, '(펑💣)', '취소'),
                    allowedMentions: { parse: ['everyone'] }
                });

                await message.reply(script.boomMention(mentionIds, owner.name, gameMode));
                await partyRecruitmentsDao.updateMessageId(messageId, {
                    "$set": { isExploded: true }
                });
            }

        })
    });
}

module.exports = { schedule }
