const { Events } = require('discord.js');
const partyRecruitmentsDao = require('../db/dao/partyRecruitmentsDao');
const { getUserName } = require('../common/commandFunc');
const script = require('../common/script');
const {handleJoin} = require('../common/interactionFunc');


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

                await handleJoin(interaction, lolName, 'rank', rankDesc, otherMessageId, messageId);
            }

            if (customId === 'waitingForm') {
                const waitingReason = interaction.fields.getTextInputValue('waitingReason');

                const newMessage = script.wait(lolName, waitingReason);
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