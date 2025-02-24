const { ActionRowBuilder, StringSelectMenuBuilder, Events } = require('discord.js');
const partyRecruitmentsDao = require('../db/dao/partyRecruitmentsDao');

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
            const userName = interaction.member.nickname || interaction.user.username;
            const lolName = userName.substring(3).trim();
            const interactionUserId = user.id;  //버튼을 누른 사용자 디코 ID

            const partyRecruitmentData = await partyRecruitmentsDao.findOneMessageId(messageId);
            // const { members, maxMembers, currentMembers } = partyRecruitmentData;
            // const ownerId =  partyRecruitmentData.owner.id;
            // const ownerName =  partyRecruitmentData.owner.name;

            // const isExist = partyRecruitmentData.members.some(member => member.id === interactionUserId);

            if (interaction.customId === 'rankJoin') {
                const positionSelect = new StringSelectMenuBuilder()
                    .setCustomId('position_select')
                    .setPlaceholder('원하는 포지션을 선택하세요')
                    .addOptions([
                        { label: '탑', value: '탑' },
                        { label: '정글', value: '정글' },
                        { label: '미드', value: '미드' },
                        { label: '원딜', value: '원딜' },
                        { label: '서폿', value: '서폿' }
                    ]);

                const row = new ActionRowBuilder().addComponents(positionSelect);

                await interaction.reply({
                    content: '🎯 원하는 포지션을 선택하세요!',
                    components: [row],
                    ephemeral: true
                });
            }
            //
            // if (['join', '탑', '정글', '미드', '원딜', '서폿'].includes(customId)) {
            //     await handleJoin(interaction, rctsId, subNickName, memberCount, currentMemberCount,
            //         isExist, id, name, gameMode, customId, members);
            // } else if (customId === 'cancel') {
            //     await handleCancel(interaction, interaction.message.interaction.id, subNickName, memberCount, currentMemberCount,
            //         isExist, id, name, gameMode, members);
            // }
        } else if(interaction.isStringSelectMenu()){
            
            if (interaction.customId === 'position_select') {
                const selectedPosition = interaction.values[0];

                await interaction.reply({
                    content: `✅ **${interaction.user.username}**님이 **${selectedPosition}** 포지션을 선택하셨습니다!`,
                    ephemeral: true
                });

                // TODO: 데이터베이스에 저장 (선택 사항)
                // await partyRecruitmentsDao.updateMemberPosition(interaction.user.id, selectedPosition);
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

const handleJoin = async (interaction, rctsId, nickName, memberCount, currentMemberCount,
                          isExist, ownerId, ownerName, gameMode, customId, members) => {
    if (isExist) {
        await interaction.reply({ content: '🚨 이미 가능을 눌렀습니다!', ephemeral: true });
        return;
    }

    currentMemberCount ++;
    if (currentMemberCount > memberCount)
        await interaction.reply({ content: '🚨 구인이 마감되어 더 이상 가능을 누르실 수 없습니다.', ephemeral: true });

    await gameRecruitmentsDao.updateCurrentMemberCount(interaction.message.interaction.id, currentMemberCount);

    let newMember = {};

    if (gameMode === '랭크') {
        if(!members.some(member => member.role === customId)) {
            newMember = { id: interaction.user.id, name: nickName, role: customId };
            await interaction.reply({ content: `${nickName}님이 ${customId}을 찜했습니다!` });
        } else {
            await interaction.reply({ content: '🚨 다른 라인을 선택해주세요!', ephemeral: true });
        }
    } else {
        newMember = { id: interaction.user.id, name: nickName };
        await interaction.reply({ content: `${nickName}님이 가능을 눌렀습니다!` });
    }

    await gameRecruitmentsDao.addMember(interaction.message.interaction.id, newMember);

    if (currentMemberCount === memberCount) {
        await interaction.message.edit({
            content: `@everyone (😊마감) ${ownerName}님의 구인이 마감되었습니다!(😊마감)`,
            allowedMentions: { parse: ['everyone'] }
        });
        await interaction.message.channel.send(`<@${ownerId}> 구인이 마감 되었습니다.`);
    }
}

const handleCancel = async (interaction, rctsId, nickName, memberCount, currentMemberCount,
                            isExist, ownerId, ownerName, gameMode, members) => {
    if (!isExist) {
        await interaction.reply({ content: '🚨 가능을 누르지 않았습니다.', ephemeral: true });
        return;
    }

    currentMemberCount --;
    await gameRecruitmentsDao.updateCurrentMemberCount(rctsId, currentMemberCount);

    const role = members.filter(member => member.id === interaction.user.id).map(item => item.role);
    const messages = await interaction.message.channel.messages.fetch({ limit: 50 });

    let userMessage = null;

    if (gameMode === '랭크') {
        userMessage = messages.find(msg => msg.content.includes(`${nickName}님이 ${role}을 찜했습니다!`) && msg.author.bot);
    } else {
        userMessage = messages.find(msg => msg.content.includes(`${nickName}님이 가능을 눌렀습니다!`) && msg.author.bot);
    }

    await gameRecruitmentsDao.removeMember(rctsId, interaction.user.id);

    if (userMessage) {
        await userMessage.edit({ content: `${nickName}님이 취소했습니다!` });
    }

    if (currentMemberCount === memberCount - 1) {
        await interaction.message.edit({
            content: `@everyone ${nickName}님의 ${gameMode} 구인이 시작되었어요!`,
            allowedMentions: { parse: ['everyone'] }
        });
        await interaction.message.channel.send(`<@${ownerId}> 구인 마감이 해제되었습니다.`);
    }

    await interaction.deferUpdate();
}

