const cron = require("node-cron");
const partyRecruitmentsDao = require('../db/dao/partyRecruitmentsDao');

require('dotenv').config();

// 현재 인원수와 마감 인원수를 비교
// 현재 인원수가 마감 인원수보다 크면 게임 시작 알람 메시지 전송
// 현재 인원수가 마감 인원수보다 작으면 펑 알람 메시지 전송
const schedule = (client) => {
    cron.schedule("* * * * *",  async function() {
        const partyRecruitmentList = await partyRecruitmentsDao.partyRecruitmentList();

        partyRecruitmentList.forEach(async party => {
            const { minMembers, currentMembers, members, messageId, channelId, gameMode, startTime, owner } = party;

            let mentionIds = '';
            members.forEach(member => mentionIds += `<@${member.id}>`);

            const channel = await client.channels.fetch(channelId);
            const message = await channel.messages.fetch(messageId);

            if(currentMembers >= minMembers) {
                await message.reply(`${mentionIds} \n ${startTime}에  ${gameMode} 게임이 시작됩니다.`);
            } else {
                await message.edit({
                    content: `@everyone (💣펑) ${owner.name}님의 ${gameMode} 구인이 펑되었습니다.(펑💣)`,
                    allowedMentions: { parse: ['everyone'] }
                });

                await message.reply(`${mentionIds} \n💥${owner.name}님의 ${gameMode} 구인이 펑되었습니다.`);

                await partyRecruitmentsDao.updateBoomPartyRecruitment(messageId);
            }
        })
    });
}

module.exports = { schedule }
