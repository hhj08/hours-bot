const { ActionRowBuilder, StringSelectMenuBuilder, Events } = require('discord.js');
const partyRecruitmentsDao = require('../db/dao/partyRecruitmentsDao');
const { getUserName } = require('../common/commonFunc');

require('dotenv').config();

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isAutocomplete()) {
            const focusedOption = interaction.options.getFocused(true);
            if (focusedOption.name === '모집장소') {
                const gameMode = interaction.options.getString('게임모드');
                const choicesMap = {
                    '협곡': [
                        { name: '일반 1', value: process.env.NOMAL1 },
                        { name: '일반 2', value: process.env.NOMAL2 },
                        { name: '일반 3', value: process.env.NOMAL3 }
                    ],
                    '칼바람': [
                        { name: '칼바람나락1', value: process.env.ARAM1 },
                        { name: '칼바람나락2', value: process.env.ARAM2 },
                    ],
                    '자유랭크': [
                        { name: '자유랭크1', value: process.env.FREE1 },
                        { name: '자유랭크2', value: process.env.FREE2 },
                        { name: '자유랭크3', value: process.env.FREE3 }
                    ],
                    '듀오랭크': [
                        { name: '랭크듀오1', value: process.env.DUO1 },
                        { name: '랭크듀오2', value: process.env.DUO2 },
                        { name: '랭크듀오3', value: process.env.DUO3 },
                        { name: '랭크듀오4', value: process.env.DUO4 }
                    ],
                    '롤토체스': [
                        { name: '롤토체스1', value: process.env.TFT1 },
                        { name: '롤토체스2', value: process.env.TFT2 },
                    ],
                    '특별게임모드': [
                        { name: '특별게임모드1', value: process.env.ETC1 },
                    ],
                    '기타': [
                        { name: '타겜전용', value: process.env.ETC2 },
                    ]
                };

                const choices = choicesMap[gameMode] || [];
                const filtered = choices.filter(choice =>
                    choice.name.startsWith(focusedOption.value)
                );

                await interaction.respond(
                    filtered.map(choice => ({ name: choice.name, value: choice.value }))
                );
            }
        } else if (interaction.isButton()) {
            const { customId, user, message } = interaction;
            const messageId = message.id;
            const lolName = await getUserName(interaction)
            const interactionUserId = user.id;  //버튼을 누른 사용자의 디코 ID

            const partyRecruitmentData = await partyRecruitmentsDao.findOneMessageId(messageId);
            const { maxMembers, owner, gameMode, members, isClosed } = partyRecruitmentData;

            if(customId === 'join') {
                const isValid = await checkConditions(interaction, members, isClosed, 'join');
                if (!isValid) return;

                const addMember = await addMembers(messageId, interactionUserId);
                await interaction.reply({ content: `${lolName}님이 가능을 눌렀습니다!` });

                if (addMember.currentMembers === maxMembers) {
                    await interaction.message.edit({
                        content: `@everyone (😊마감) ${owner.name}님의 ${gameMode}구인이 마감되었습니다!(😊마감)`,
                        allowedMentions: { parse: ['everyone'] }
                    });

                    await interaction.message.reply({
                        content: `<@${owner.id}> ${gameMode} 구인이 마감 되었습니다.`
                    });

                    await partyRecruitmentsDao.updateBoomOrClosed(messageId, { isClosed : true });
                }
                return;
            }

            if(customId === 'rankJoin') {
                const isValid = await checkConditions(interaction, members, isClosed, 'join');
                if (!isValid) return;

                const positionSelect = new StringSelectMenuBuilder()
                    .setCustomId(`position_select_${interaction.message.id}`) // 원본 메시지 ID 포함
                    .setPlaceholder('원하는 포지션을 선택하세요')
                    .addOptions([
                        { label: 'ALL', value: 'ALL' },
                        { label: '탑', value: '탑' },
                        { label: '정글', value: '정글' },
                        { label: '미드', value: '미드' },
                        { label: '원딜', value: '원딜' },
                        { label: '서폿', value: '서폿' },
                    ]);

                const row = new ActionRowBuilder().addComponents(positionSelect);

                await interaction.reply({
                    content: '🎯 원하는 포지션을 선택하세요!',
                    components: [row],
                    ephemeral: true
                });
            }

            if(customId === 'cancel') {
                const isValid = await checkConditions(interaction, members, isClosed, 'cancel');
                if (!isValid) return;

                const removeMember = await removeMembers(messageId, interactionUserId);

                const messages = await interaction.message.channel.messages.fetch({ limit: 50 });
                const userMessage = messages.find(msg => msg.content.includes(`${lolName}님이 가능을 눌렀습니다!`) && msg.author.bot);

                if (userMessage) {
                    await userMessage.edit({ content: `${lolName}님이 취소했습니다!` });
                }

                if (removeMember.currentMembers === (maxMembers-1)) {
                    await interaction.message.edit({
                        content: `@everyone ${owner.name}님의 ${gameMode} 구인이 시작되었어요!`,
                        allowedMentions: { parse: ['everyone'] }
                    });

                    await interaction.message.reply({
                        content: `<@${owner.id}> 구인 마감이 해제되었습니다.`
                    });
                }

                await interaction.deferUpdate();
            }

            if (customId === 'rankCancel') {
                const isValid = await checkConditions(interaction, members, isClosed, 'cancel');
                if (!isValid) return;

                const updateMembers = await removeMembers(messageId, interactionUserId);

                // ✅ 기존 포지션 현황 메시지 삭제
                const replies = await interaction.message.channel.messages.fetch({ after: messageId });
                const existingReply = replies.find(msg =>
                    msg.reference?.messageId === messageId &&
                    msg.content.startsWith('🎯 현재 포지션 신청 현황')
                );

                if (existingReply) await existingReply.delete();

                // ✅ 포지션별 유저 정리
                const roleText = formatRoleText(updateMembers.members);

                // ✅ 새롭게 포지션 현황 메시지 작성
                const newReply = await interaction.message.reply(`🎯 현재 포지션 신청 현황\n${roleText}`);

                // ✅ 인원이 꽉 찼다가 한 명이 나가면 마감 해제 메시지 추가
                if (updateMembers.currentMembers === (updateMembers.maxMembers - 1)) {
                    await interaction.message.reply({
                        content: `@everyone ${updateMembers.owner.name}님의 ${updateMembers.gameMode} 랭크 구인이 다시 시작되었습니다!`,
                        allowedMentions: { parse: ['everyone'] }
                    });

                    await partyRecruitmentsDao.updateBoomOrClosed(messageId, { isClosed: false });
                }

                await interaction.deferUpdate();
            }

            if(customId === 'hold') {
                await partyRecruitmentsDao.addWaitingMembers(messageId, { id:interactionUserId } );

                await interaction.reply({
                    content: '대기열에 등록되었습니다.',
                    ephemeral: true
                });

            }

        } else if(interaction.isStringSelectMenu()){
            if (interaction.customId.startsWith('position_select_')) {
                const selectedPosition = interaction.values[0];
                const messageId = interaction.customId.replace('position_select_', '');
                const userId = interaction.user.id;

                try {
                    // 채널에서 원본 메시지 가져오기
                    const channel = interaction.channel;
                    const originalMessage = await channel.messages.fetch(messageId);
                    if (!originalMessage) {
                        await interaction.reply({ content: '원본 메시지를 찾을 수 없습니다.', ephemeral: true });
                        return;
                    }

                    // ✅ 기존 포지션 현황 메시지 삭제
                    const replies = await originalMessage.channel.messages.fetch({ after: messageId });
                    const existingReply = replies.find(msg =>
                        msg.reference?.messageId === messageId &&
                        msg.content.startsWith('🎯 현재 포지션 신청 현황')
                    );

                    if (existingReply) await existingReply.delete();

                    // ✅ 사용자 정보 DB에 저장 (포지션 선택)
                    const updateMembers = await addMembers(messageId, userId, selectedPosition);

                    // ✅ 포지션별 유저 정리
                    const roleText = formatRoleText(updateMembers.members);

                    // ✅ 새롭게 포지션 현황 메시지 작성
                    const newReply = await originalMessage.reply(`🎯 현재 포지션 신청 현황\n${roleText}`);

                    // ✅ 인원이 다 찼다면 마감 메시지 추가
                    if (updateMembers.currentMembers === updateMembers.maxMembers) {
                        await originalMessage.reply({
                            content: `@everyone (😊마감) ${updateMembers.owner.name}님의 ${updateMembers.gameMode} 랭크 구인이 마감되었습니다!(😊마감)`,
                            allowedMentions: { parse: ['everyone'] }
                        });

                        await partyRecruitmentsDao.updateBoomOrClosed(messageId, { isClosed: true });
                    }

                    await interaction.deferUpdate();
                    await interaction.deleteReply();
                } catch (error) {
                    console.error('포지션 선택 중 오류 발생:', error);
                    await interaction.reply({ content: '포지션 선택 처리 중 오류가 발생했습니다.', ephemeral: true });
                }
            }
        } else if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                const errorMessage = { content: 'There was an error while executing this command!', ephemeral: true };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        }
    }
};

const addMembers = async (messageId, memberId, role) => {
    let newMember = role ? { id: memberId, role } : { id:memberId };

    return await partyRecruitmentsDao.addMembers(messageId, newMember);
}

const removeMembers = async (messageId, memberId) => {
    return await partyRecruitmentsDao.removeMembers(messageId, memberId);
}

const checkConditions = async (interaction, members, isClosed, action) => {
    const interactionUserId = interaction.user.id;

    if (isClosed && action === 'join') {
        await interaction.reply({
            content: '🚨 구인이 마감되어 더 이상 참가할 수 없습니다.',
            ephemeral: true
        });
        return false;
    }

    const isExist = members.some(member => member.id === interactionUserId);
    if (isExist && action === 'join') {
        await interaction.reply({
            content: '🚨 이미 참가하셨습니다!',
            ephemeral: true
        });
        return false;
    }

    if(!isExist && action === 'cancel') {
        await interaction.reply({
            content: '🚨 가능을 누르지 않았습니다.',
            ephemeral: true
        });
        return false;
    }
    return true;
}

const formatRoleText = (members) => {
    const roles = ['ALL', '탑', '정글', '미드', '원딜', '서폿'];

    return roles.map(role => {
        const users = members
            .filter(member => member.role === role)
            .map(member => `<@${member.id}>`)
            .join(', ') || '없음';

        return `**${role}**: ${users}`;
    }).join('\n');
};