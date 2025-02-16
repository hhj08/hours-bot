const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const gameRecruitmentsDao = require('../../db/dao/gameRecruitmentsDao');
const { gameIsClosed } = require('../../data/chiocesMap');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('일반')
        .setDescription('일반 게임 모집')
        .addStringOption(option =>
            option.setName('게임모드')
                .setDescription('게임 모드 선택: 협곡, 칼바람')
                .setRequired(true)
                .addChoices(
                    { name: '협곡', value: '협곡' },
                    { name: '칼바람', value: '칼바람' },
                )
        )
        .addStringOption(option =>
            option.setName('모집장소')
                .setDescription('게임이 시작되는 음성채널 선택')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option.setName('시작시간')
                .setDescription('시작 시간 입력 형식 - HH:MM')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('마감여부')
                .setDescription('마감 여부 선택')
                .setRequired(true)
                .addChoices(
                    { name: '2미펑', value: '2' },
                    { name: '3미펑', value: '3' },
                    { name: '5미펑', value: '5' },
                    { name: '상시모집', value: '0' }
                )
        )
        .addStringOption(option =>
            option.setName('현인원')
                .setDescription('추가인원이 있을 경우 입력')
        ),
    async execute(interaction) {
        const gameMode = interaction.options.getString('게임모드');
        const channelID = interaction.options.getString('모집장소');
        const currentMembers = interaction.options.getString('현인원') || '';
        const startTime = interaction.options.getString('시작시간');
        const nickname = interaction.member.nickname || interaction.user.username;
        const isClosed = interaction.options.getString('마감여부');
        const isClosedName = gameIsClosed[isClosed];

        const subNickName = nickname.substring(3,nickname.length).trim();

        const timeRegex = /^([0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/;

        const embed = new EmbedBuilder()
            .setColor(0xD1B2FF)
            .setTitle(`${subNickName}님의 ${gameMode} 구인`)
            .addFields(
                { name: '모집장소', value: `<#${channelID}>` },
                { name: '시작시간', value: startTime },
                { name: '현인원', value: currentMembers ? `${nickname}, ${currentMembers}` : subNickName },
                { name: '마감여부', value: isClosedName }
            )
            .setTimestamp();

        const joinButton = new ButtonBuilder()
            .setCustomId('join')
            .setLabel('가능')
            .setStyle(ButtonStyle.Success);

        const cancelButton = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('취소')
            .setStyle(ButtonStyle.Danger);

        const actionRow = new ActionRowBuilder()
            .addComponents(joinButton)
            .addComponents(cancelButton);

        if (!timeRegex.test(startTime)) {
            return interaction.reply({
                content: '⛔ 유효한 시간 형식이 아닙니다! 00:00 ~ 23:59 형식으로 입력하세요.',
                ephemeral: true
            });
        }
        const message = await interaction.reply({
            content: `@everyone ${subNickName}님의 ${gameMode} 구인이 시작되었어요!`,
            embeds: [embed],
            components: [actionRow],
            allowedMentions: { parse: ['everyone'] }
        });

        const data = {
            rctsId : message.interaction.id,
            owner : { id: interaction.user.id, name: subNickName },
            members : [
                { id: interaction.user.id, name: subNickName }
            ],
            memberCount: 5,
            currentMemberCount : 1,
            startTime : startTime,
            gameMode : '일반',
            isClosed : isClosed
        }
        await gameRecruitmentsDao.insertGameRecruitment(data);
    }
};
