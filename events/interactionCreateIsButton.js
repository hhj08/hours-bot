const { ActionRowBuilder, StringSelectMenuBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const partyRecruitmentsDao = require('../db/dao/partyRecruitmentsDao');
const { getUserName } = require('../common/commandFunc');

require('dotenv').config();
/*
TODO: 1. 대기자가 가능 눌렀을 때, 취소 눌렀을 때 동작 & 마감이 풀리면 대기자에게 멘션 보내기
TODO: 2. 랭크 게임 가능 버튼 기능 구현 필요.
 */

// 가능, 대기, 취소, 펑 버튼을 눌렀을 때의 상호작용 처리
module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isButton()) {
            const messageId = interaction.message.id; // 원글 메시지 ID
            const customId = interaction.customId; // 버튼 ID
            const userId = interaction.user.id; // 버튼을 누른 사용자 디코 ID
            const lolName = await getUserName(interaction); // 디스코드 닉네임에서 롤닉만 추출

            // MessageID로 구인글 정보 찾아오기
            let { joinMessageId, waitingMessageId, closedMessageId, owner,
                members, waitingMembers, maxMembers, isClosed, isExploded, gameMode }
                = await partyRecruitmentsDao.findOneMessageId(messageId);

            const isExist = members.some(member => member.id === userId);
            const isWaiting = waitingMembers.some(member => member.id === userId);

            if(isExploded) {
                return await interaction.reply({
                    content: '🚨 펑 된 구인글입니다.',
                    ephemeral: true
                });
            }

            if(customId === 'join') {
                if(isExist || owner.id === userId) {
                    return await interaction.reply({
                        content: '🚨 이미 참가하셨습니다!',
                        ephemeral: true
                    });
                }

                if(isClosed) {
                    return await interaction.reply({
                        content: '🚨 구인이 마감되어 더 이상 참가할 수 없습니다.',
                        ephemeral: true
                    });
                }

                const newMessage = `⭕ ${lolName}님이 가능을 눌렀습니다.`;

                const cond = {
                    "$push": {members: { id: userId, message: newMessage }},
                    "$inc": { currentMembers: 1 }
                };

                const addMember = await partyRecruitmentsDao.findOneAndUpdateMessageId(messageId, cond);
                const allMessages = addMember.members.map(member => member.message).join('\n');

                if(!joinMessageId) {
                    const replyMessage = await interaction.reply({
                        content: allMessages,
                        fetchReply: true
                    });

                    await partyRecruitmentsDao.updateMessageId(messageId, {
                        "$set": { joinMessageId: replyMessage.id }
                    });
                } else {
                    const joinMessage = await interaction.channel.messages.fetch(joinMessageId);
                    await joinMessage.edit({ content: allMessages });
                    await interaction.deferUpdate();
                }

                if (addMember.currentMembers === maxMembers) {
                    await interaction.message.edit({
                        content: `@everyone (😊마감) ${owner.name}님의 ${gameMode} 구인이 마감되었습니다!(😊마감)`,
                        allowedMentions: { parse: ['everyone'] }
                    });

                    const closeMessage = await interaction.message.reply({
                        content: `<@${owner.id}> ${gameMode} 구인이 마감되었습니다.`,
                        fetchReply: true
                    });

                    await partyRecruitmentsDao.updateMessageId(messageId, {
                        "$set": { isClosed: true, closedMessageId: closedMessageId ? closedMessageId : closeMessage.id }
                    });
                }
            }

            // 대기버튼을 눌렀을 떄
            if(customId === 'waiting') {
                if(isExist) {
                    return await interaction.reply({
                        content: '🚨 이미 참가하여 대기를 할 수 없습니다. 취소 후 대기를 눌러주세요',
                        ephemeral: true
                    });
                }

                const modal = new ModalBuilder()
                    .setCustomId(`waitingForm_${waitingMessageId}`)
                    .setTitle('대기 사유를 입력해주세요');

                const waitingReason = new TextInputBuilder()
                    .setCustomId(`waitingReason`)
                    .setLabel('대기 사유를 입력해주세요')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('예: 30분 뒤에 자리있으면 참가합니다');

                const actionRow = new ActionRowBuilder().addComponents(waitingReason);

                modal.addComponents(actionRow);

                await interaction.showModal(modal);
            }

            // 취소 버튼 눌렀을 때
            // 2. 대기를 누른 참여자가 취소를 원하는지 -> waitingMembers에서 제외하고 waitingMembers의 message 수정 후에 waitingMessage 수정
            if(customId === 'cancel') {
                if(!isExist) {
                    return await interaction.reply({
                        content: '🚨 가능을 누르지 않았습니다.',
                        ephemeral: true
                    });
                }

                if(isExist) {
                    const cond = {
                        "$pull": {members: { id: userId }},
                        "$inc": { currentMembers: -1 }
                    };

                    const removeMember = await partyRecruitmentsDao.findOneAndUpdateMessageId(messageId, cond);
                    const allMessages = removeMember.members.map(member => member.message).join('\n');

                    const joinMessage = await interaction.channel.messages.fetch(joinMessageId);
                    await joinMessage.edit({ content: allMessages ? allMessages : '가능을 누른 사람이 없습니다.' });
                    await interaction.reply({
                        content: '취소를 눌러 가능 목록에서 제외 되었습니다.',
                        ephemeral: true
                    });

                    if (removeMember.currentMembers === maxMembers-1) {
                        await interaction.message.edit({
                            content: `@everyone ${owner.name}님의 ${gameMode} 구인이 진행중입니다.`,
                            allowedMentions: { parse: ['everyone'] }
                        });

                        const closeMessage = await interaction.channel.messages.fetch(closedMessageId);
                        await closeMessage.delete();

                        await partyRecruitmentsDao.updateMessageId(messageId, {
                            "$set": { isClosed: false, closedMessageId: null }
                        });
                    }
                }
            }

            // 펑 버튼을 눌렀을 때
            if(customId === 'boom') {
                if(owner.id !== userId) {
                    return await interaction.reply({
                        content: '🚨 작성자만 펑 할 수 있습니다.',
                        ephemeral: true
                    });
                }

                let mentionIds = [];
                members.forEach(member => mentionIds += `<@${member.id}>`);

                await interaction.message.edit({
                    content: `@everyone (💣펑) ${owner.name}님의 ${gameMode} 구인이 펑되었습니다.(펑💣)`,
                    allowedMentions: { parse: ['everyone'] }
                });

                await interaction.reply({
                    content: `${mentionIds} \n💥${owner.name}님의 ${gameMode} 구인이 펑되었습니다.`,
                });

                await partyRecruitmentsDao.updateMessageId(messageId, {
                    "$set": { isExploded: true }
                });
            }


        } else if(interaction.isStringSelectMenu()){ // 드롭 박스 이벤트 처리

        }
    }
};