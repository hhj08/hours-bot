const cron = require("node-cron");
const gameRecruitmentsDao = require('../db/dao/gameRecruitmentsDao');
const moment = require('moment-timezone');

require('dotenv').config();

const channelIds = {
    '랭크' : process.env.RANKCHANNEL,
    '일반' : process.env.NOMALCHANNEL,
    '기타' : process.env.ETCCHANNEL
}

// 매분마다 실행 => 펑 된 구인글은 예약되지 않도록 처리해야함..
const schedule = (client) => {
    cron.schedule("* * * * *",  async function() {
        const nowHour = moment().tz('Asia/Seoul').format('H:mm');
        const gameRecruitmentList = await gameRecruitmentsDao.GameRecruitmentList();

        const filteredGames = gameRecruitmentList.filter(game => game.startTime === nowHour);

        filteredGames.forEach(async game => {
            let mentionIds = '';
            game.members.forEach(member => mentionIds += `<@${member.id}>`);

            const channelId = channelIds[game.gameMode];
            const channel = await client.channels.fetch(channelId);

            const messageId = game.messageId;
            const message = await channel.messages.fetch(messageId);

            await message.reply(`${mentionIds} \n ${nowHour}에 게임이 시작됩니다.`);
        })
    });
}

module.exports = { schedule }
