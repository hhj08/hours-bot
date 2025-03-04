const { ActionRowBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const partyRecruitmentsDao = require('../db/dao/partyRecruitmentsDao');
const { getUserName } = require('../common/commandFunc');
const { handleJoin, removeUserFromWaiting, showModal, } = require('../common/interactionFunc');
const errorHandler = require("../common/errorHandler");
const script = require('../common/script');

require('dotenv').config();

// 가능, 대기, 취소, 펑 버튼을 눌렀을 때의 상호작용 처리
module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        await errorHandler(interaction, async (interaction) => {
            if(!interaction.isButton()) return;

            const { message, customId, user } = interaction;
            const messageId = message.id; // 원글 메시지 ID
            const userId= user.id; // 버튼을 누른 사용자 디코 ID
            const lolName = getUserName(interaction); // 디스코드 닉네임에서 롤닉만 추출

            // MessageID로 구인글 정보 찾아오기
            let recruitment = await partyRecruitmentsDao.findOneMessageId(messageId);
            if (!recruitment) return;

            const { joinMessageId, waitingMessageId, closedMessageId, owner,
                members, waitingMembers, maxMembers, isClosed, isExploded, gameMode } = recruitment;

            // 참가 중인 멤버인지 체크
            const isExist = members.some(member => member.id === userId);
            // 대기 멤버인지 체크
            const isWaiting = waitingMembers.some(member => member.id === userId);

            // 이미 펑된 구인글인 경우
            if (isExploded)
                return await interaction.reply({
                    content: script.alertClose,
                    ephemeral: true
                });

            // 파티에 이미 참가중인 사용자가 또 다시 가능을 눌렀을 때
            if (isExist && (customId === 'rankJoin' || customId === 'join'))
                return await interaction.reply({
                    content: script.alertJoin,
                    ephemeral: true
                });

            // 가능
            if(customId === 'join' || customId === 'rankJoin') {
                // 구인글 작성자가 가능을 눌렀을 떄
                if(owner.id === userId)
                    return await interaction.reply({
                        content: script.alertOwnerJoin,
                        ephemeral: true
                    });

                // 파티가 마감되었는데 가능을 눌렀을 때
                if(isClosed)
                    return await interaction.reply({
                        content: script.alertDone,
                        ephemeral: true
                    });

                await removeUserFromWaiting(interaction, messageId, waitingMessageId, userId);

                if(customId === 'rankJoin')
                    return await showModal(interaction, `joinForm_${joinMessageId}`, '포지션 입력', 'rankDesc', '예: 미드 or 원딜');

                await handleJoin(interaction, lolName, 'normal', null, joinMessageId, messageId);
            }

            // 대기
            if(customId === 'waiting') {
                // 구인글 작성자가 대기를 눌렀을 때
                if(owner.id === userId)
                    return await interaction.reply({
                        content: script.alertOwnerWait,
                        ephemeral: true
                    });

                // 이미 대기 중인 멤버인 경우
                if (isWaiting)
                    return await interaction.reply({
                        content: script.alertWait,
                        ephemeral: true
                    });

                // 이미 파티를 참가하고 있는 멤버인 경우
                if (isExist)
                    return await interaction.reply({
                        content: script.alertJoinWait,
                        ephemeral: true
                    });

                await showModal(interaction, `waitingForm_${waitingMessageId}`, '대기 사유를 입력해주세요', 'waitingReason', '예: 30분 뒤 참가');
            }

            //취소
            if(customId === 'cancel') {
                // 구인글 작성자가 취소를 눌렀을 때
                if(userId === owner.id)
                    return await interaction.reply({
                        content: script.alertBoom,
                        ephemeral: true
                    });

                // 가능 혹은 대기 멤버 목록에 없는 경우
                if(!isExist && !isWaiting)
                    return await interaction.reply({
                        content: script.warnJoin,
                        ephemeral: true
                    });


                // 참가 중인 멤버가 취소를 눌렀을 떄
                if(isExist) {
                    const cond = {
                        "$pull": {members: { id: userId }},
                        "$inc": { currentMembers: -1 }
                    };

                    const removeMember = await partyRecruitmentsDao.findOneAndUpdateMessageId(messageId, cond);
                    const allMessages = removeMember.members.map(member => member.message).join('\n');

                    const joinMessage = await interaction.channel.messages.fetch(joinMessageId);

                    await interaction.message.edit({
                        content: script.recruit(removeMember.currentMembers, removeMember.maxMembers, lolName, gameMode, '취소'),
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
                        content: script.cancelJoin,
                        ephemeral: true
                    });

                    if (removeMember.currentMembers === maxMembers-1) {
                        // 대기 중인 사람에게 멘션 보내기
                        let mentionIds = '';
                        waitingMembers.forEach(member => mentionIds += `<@${member.id}>`);

                        await interaction.message.reply({
                            content: script.waitMention(mentionIds)
                        })

                        const closeMessage = await interaction.channel.messages.fetch(closedMessageId);
                        await closeMessage.delete();

                        await partyRecruitmentsDao.updateMessageId(messageId, {
                            "$set": { isClosed: false, closedMessageId: null }
                        });
                    }
                }

                // 대기 중인 멤버가 취소를 눌렀을 떄
                if(isWaiting) {
                    await removeUserFromWaiting(interaction, messageId, waitingMessageId, userId);
                    await interaction.reply({
                        content: '취소를 눌러 대기 목록에서 제외 되었습니다.',
                        ephemeral: true
                    });
                }
            }

            if(customId === 'boom') {
                // 구인글 작성자가 아닌 다른 사용자가 펑을 눌렀을 때
                if(owner.id !== userId)
                    return await interaction.reply({
                        content: script.warnBoom,
                        ephemeral: true
                    });

                let mentionIds = [];
                members.forEach(member => mentionIds += `<@${member.id}>`);

                await interaction.message.edit({
                    content: script.done(owner.name, gameMode, process.env.BOOM_EMOJI, '취소'),
                    allowedMentions: { parse: ['everyone'] }
                });

                await interaction.reply({
                    content: script.boomMention(mentionIds, owner.name, gameMode),
                });

                await partyRecruitmentsDao.updateMessageId(messageId, {
                    "$set": { isExploded: true }
                });
            }
        })
    }
};