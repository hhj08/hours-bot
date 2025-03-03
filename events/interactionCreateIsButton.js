const { ActionRowBuilder, StringSelectMenuBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const partyRecruitmentsDao = require('../db/dao/partyRecruitmentsDao');
const { getUserName } = require('../common/commandFunc');
const { removeWaitingMembers } = require('../common/interactionCreateFunc');

require('dotenv').config();

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

            // 가능을 눌렀을 때
            if(customId === 'join') {
                if(owner.id === userId) {
                    return await interaction.reply({
                        content: '🚨 구인글을 작성한 본인입니다.',
                        ephemeral: true
                    });
                }

                if(isExist) {
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

                // 대기자가 가능을 누르면 대기 목록에서 삭제.
                if(isWaiting) {
                    const removeWaitingMessages = await removeWaitingMembers(messageId, userId)
                    const waitingMessage = await interaction.channel.messages.fetch(waitingMessageId);

                    if(!removeWaitingMessages) {
                        await waitingMessage.delete();
                        await partyRecruitmentsDao.updateMessageId(messageId, {
                            "$set": { waitingMessageId: null }
                        });
                    } else {
                        await waitingMessage.edit({ content: removeWaitingMessages });
                    }
                }

                const newMessage = `⭕ ${lolName}님이 가능을 눌렀습니다.`;

                const cond = {
                    "$push": {members: { id: userId, message: newMessage }},
                    "$inc": { currentMembers: 1 }
                };

                const addMember = await partyRecruitmentsDao.findOneAndUpdateMessageId(messageId, cond);
                const allMessages = addMember.members.map(member => member.message).join('\n');

                await interaction.message.edit({
                    content: `@everyone (${addMember.currentMembers}/${addMember.maxMembers})${lolName}님의 ${gameMode} 구인이 진행 중입니다.`,
                    allowedMentions: { parse: ['everyone'] }
                });

                if(!joinMessageId) {
                    const replyMessage = await interaction.reply({
                        content: `${allMessages}`,
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

            // 랭크 게임 가능 버튼
            if(customId === 'rankJoin') {
                if(owner.id === userId) {
                    return await interaction.reply({
                        content: '🚨 구인글을 작성한 본인입니다.',
                        ephemeral: true
                    });
                }

                if(isExist) {
                    return await interaction.reply({
                        content: '🚨 이미 참가하셨습니다!',
                        ephemeral: true
                    });
                }

                if(isWaiting) {
                    const removeWaitingMessages = await removeWaitingMembers(messageId, userId)
                    const waitingMessage = await interaction.channel.messages.fetch(waitingMessageId);

                    if(!removeWaitingMessages) {
                        await waitingMessage.delete();
                        await partyRecruitmentsDao.updateMessageId(messageId, {
                            "$set": { waitingMessageId: null }
                        });
                    } else {
                        await waitingMessage.edit({ content: removeWaitingMessages });
                    }
                }

                const modal = new ModalBuilder()
                    .setCustomId(`joinForm_${joinMessageId}`)
                    .setTitle('포지션 입력');

                const rankDesc = new TextInputBuilder()
                    .setCustomId(`rankDesc`)
                    .setLabel('희망 포지션을 입력해주세요')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('예: 미드 or 원딜');

                const actionRow = new ActionRowBuilder().addComponents(rankDesc);

                modal.addComponents(actionRow);

                await interaction.showModal(modal);
            }

            // 대기버튼을 눌렀을 떄
            if(customId === 'waiting') {
                if(userId === owner.id) {
                    return await interaction.reply({
                        content: '🚨',
                        ephemeral: true
                    });
                }

                if(isWaiting) {
                    return await interaction.reply({
                        content: '🚨 이미 대기중입니다.',
                        ephemeral: true
                    });
                }

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
            if(customId === 'cancel') {
                if(userId === owner.id) {
                    return await interaction.reply({
                        content: '🚨 구인글을 펑 시키고 싶을 땐 취소가 아닌 펑을 눌러주세요',
                        ephemeral: true
                    });
                }

                if(!isExist && !isWaiting) {
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

                    await interaction.message.edit({
                        content: `@everyone (${removeMember.currentMembers}/${removeMember.maxMembers})${lolName}님의 ${gameMode} 구인이 진행 중입니다.`,
                        allowedMentions: { parse: ['everyone'] }
                    });

                    if(!allMessages) {
                        await joinMessage.delete();
                        await partyRecruitmentsDao.updateMessageId(messageId, {
                            "$set": { joinMessageId: null }
                        });
                    } else {
                        await joinMessage.edit({ content: allMessages });
                    }

                    await interaction.reply({
                        content: '취소를 눌러 가능 목록에서 제외 되었습니다.',
                        ephemeral: true
                    });

                    if (removeMember.currentMembers === maxMembers-1) {
                        // 대기 중인 사람에게 멘션 보내기
                        let mentionIds = '';
                        waitingMembers.forEach(member => mentionIds += `<@${member.id}>`);

                        await interaction.message.reply({
                            content: `${mentionIds} 마감이 해제되었습니다. 대기 중이신 분은 가능을 눌러주세요`
                        })

                        const closeMessage = await interaction.channel.messages.fetch(closedMessageId);
                        await closeMessage.delete();

                        await partyRecruitmentsDao.updateMessageId(messageId, {
                            "$set": { isClosed: false, closedMessageId: null }
                        });
                    }
                }

                if(isWaiting) {
                    const removeWaitingMessages = await removeWaitingMembers(messageId, userId)
                    const waitingMessage = await interaction.channel.messages.fetch(waitingMessageId);

                    if(!removeWaitingMessages) {
                        await waitingMessage.delete();
                        await partyRecruitmentsDao.updateMessageId(messageId, {
                            "$set": { waitingMessageId: null }
                        });
                    } else {
                        await waitingMessage.edit({ content: removeWaitingMessages });
                    }

                    await interaction.reply({
                        content: '취소를 눌러 대기 목록에서 제외 되었습니다.',
                        ephemeral: true
                    });
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
        }
    }
};