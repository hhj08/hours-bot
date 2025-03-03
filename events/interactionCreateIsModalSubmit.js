const { Events } = require('discord.js');
const partyRecruitmentsDao = require('../db/dao/partyRecruitmentsDao');
const { getUserName } = require('../common/commandFunc');

require('dotenv').config();

// 모달 이벤트 처리
module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isModalSubmit()) {
            const messageId = interaction.message.id; // 원글 메시지 ID
            const userId = interaction.user.id; // 버튼을 누른 사용자 디코 ID
            const lolName = await getUserName(interaction); // 디스코드 닉네임에서 롤닉만 추출

            const index = interaction.customId.indexOf('_');
            const customId = interaction.customId.substring(0, index);
            const otherMessageId = interaction.customId.substring(index+1);

            if (customId === 'joinForm') {


                const rankDesc = interaction.fields.getTextInputValue('rankDesc');

                const newMessage = `${lolName}님 : ${rankDesc}`

                const cond = {
                    "$push": {members: { id: userId, message: newMessage }},
                    "$inc": { currentMembers: 1 }
                };

                const addMember = await partyRecruitmentsDao.findOneAndUpdateMessageId(messageId, cond);
                const allMessages = addMember.members.map(member => member.message).join('\n');

                await interaction.message.edit({
                    content: `@everyone (${addMember.currentMembers}/${addMember.maxMembers})${lolName}님의 ${addMember.gameMode} 구인이 진행 중입니다.`,
                    allowedMentions: { parse: ['everyone'] }
                });

                if(otherMessageId === 'null' || !otherMessageId) {
                    const replyMessage = await interaction.reply({
                        content: allMessages,
                        fetchReply: true
                    });

                    await partyRecruitmentsDao.updateMessageId(messageId, {
                        "$set": { joinMessageId: replyMessage.id }
                    });
                } else {
                    const joinMessage = await interaction.channel.messages.fetch(otherMessageId);
                    await joinMessage.edit({ content: allMessages });
                    await interaction.deferUpdate();
                }

                if (addMember.currentMembers === addMember.maxMembers) {
                    await interaction.message.edit({
                        content: `@everyone (😊마감) ${addMember.owner.name}님의 ${addMember.gameMode} 구인이 마감되었습니다!(😊마감)`,
                        allowedMentions: { parse: ['everyone'] }
                    });

                    const closeMessage = await interaction.message.reply({
                        content: `<@${addMember.owner.id}> ${addMember.gameMode} 구인이 마감되었습니다.`,
                        fetchReply: true
                    });

                    await partyRecruitmentsDao.updateMessageId(messageId, {
                        "$set": { isClosed: true, closedMessageId: addMember.closedMessageId ? addMember.closedMessageId : closeMessage.id }
                    });
                }

            }

            if (customId === 'waitingForm') {
                const waitingReason = interaction.fields.getTextInputValue('waitingReason');

                const newMessage = `${lolName}님이 대기 중 입니다. 사유:"${waitingReason}"`
                const cond = {
                    "$push": {waitingMembers: { id: userId, message: newMessage }}
                };
                const addWaitingMember = await partyRecruitmentsDao.findOneAndUpdateMessageId(messageId, cond);
                const allMessages = addWaitingMember.waitingMembers.map(member => member.message).join('\n');

                if(otherMessageId === 'null' || !otherMessageId) {
                    const replyMessage = await interaction.message.reply({
                        content: allMessages,
                        fetchReply: true
                    });

                    await partyRecruitmentsDao.updateMessageId(messageId, {
                        "$set": { waitingMessageId: replyMessage.id }
                    });
                } else {
                    const waitingMessage = await interaction.channel.messages.fetch(otherMessageId);
                    await waitingMessage.edit({ content: allMessages });
                }
                await interaction.deferUpdate();
            }
        }
    }
};