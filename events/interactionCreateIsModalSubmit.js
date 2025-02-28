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
            const waitingMessageId = interaction.customId.substring(index+1);

            if (customId === 'waitingForm') {
                const waitingReason = interaction.fields.getTextInputValue('waitingReason');

                const newMessage = `${lolName}님이 대기 중 입니다. 사유:"${waitingReason}"`
                const cond = {
                    "$push": {waitingMembers: { id: userId, message: newMessage }},
                    "$inc": { currentMembers: 1 }
                };
                const addWaitingMember = await partyRecruitmentsDao.findOneAndUpdateMessageId(messageId, cond);
                const allMessages = addWaitingMember.waitingMembers.map(member => member.message).join('\n');

                if(waitingMessageId === 'null' || !waitingMessageId) {
                    const replyMessage = await interaction.message.reply({
                        content: allMessages,
                        fetchReply: true
                    });

                    await partyRecruitmentsDao.updateMessageId(messageId, {
                        "$set": { waitingMessageId: replyMessage.id }
                    });
                } else {
                    const waitingMessage = await interaction.channel.messages.fetch(waitingMessageId);
                    await waitingMessage.edit({ content: allMessages });
                }
                await interaction.deferUpdate();
            }
        }
    }
};