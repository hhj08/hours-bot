const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const gameRecruitmentsDao = require('../../db/dao/gameRecruitmentsDao');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('기타')
        .setDescription('기타 게임 모집')
        .addStringOption(option =>
            option.setName('게임모드')
                .setDescription('롤토체스, 기타, 특별게임모드')
                .setRequired(true)
                .addChoices(
                    { name: '롤토체스', value: '롤토체스' },
                    { name: '특별게임모드', value: '특별게임모드' },
                    { name: '기타', value: '기타' },
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
            option.setName('모집인원')
                .setDescription('게임에 필요한 인원 수를 입력')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('비고')
                .setDescription('기타 게임의 경우 게임 이름 입력')
        )
        .addStringOption(option =>
            option.setName('티어')
                .setDescription('티어 입력이 필요한 경우 입력')
        )
        .addStringOption(option =>
            option.setName('현인원')
                .setDescription('추가인원이 있을 경우 입력')
        ),
    async execute(interaction) {
        const gameMode = interaction.options.getString('게임모드');
        const channelID = interaction.options.getString('모집장소');
        const currentMembers = interaction.options.getString('현인원') || '';
        const tier = interaction.options.getString('티어') || '';
        const maxParticipants = interaction.options.getString('모집인원');
        const startTime = interaction.options.getString('시작시간');
        const nickname = interaction.member.nickname || interaction.user.username;
        const description = interaction.options.getString('비고');

        const subNickName = nickname.substring(3, nickname.length).trim();

        const timeRegex = /^([0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/;

        if (!timeRegex.test(startTime)) {
            return interaction.reply({
                content: '⛔ 유효한 시간 형식이 아닙니다! 00:00 ~ 23:59 형식으로 입력하세요.',
                ephemeral: true
            });
        }

        const fields = [
            { name: '모집장소', value: `<#${channelID}>` },
            { name: '시작시간', value: startTime },
            { name: '현인원', value: currentMembers ? currentMembers : subNickName },
            { name: '모집인원', value: maxParticipants },
            // { name: '마감여부', value: '마감여부' }, => 마감여부 어떻게 할지 피드백 필요
            tier ? { name: '티어', value: tier } : null,
            description ? { name: '비고', value: description } : null,
        ].filter(field => field !== null);

        const embed = new EmbedBuilder()
            .setColor(0xD1B2FF)
            .setTitle(`${subNickName}님의 ${gameMode} 구인`)
            .addFields(...fields)
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
            .addComponents(joinButton, cancelButton);

        const message = await interaction.reply({
            content: `@everyone ${subNickName}님의 ${gameMode} 구인이 시작되었어요!`,
            embeds: [embed],
            components: [actionRow],
            allowedMentions: { parse: ['everyone'] }
        });

        const data = {
            rctsId: message.interaction.id,
            owner: { id: interaction.user.id, name: subNickName },
            members: [{ id: interaction.user.id, name: subNickName }],
            memberCount: maxParticipants,
            currentMemberCount: 1,
            gameMode: '기타',
            startTime: startTime
        };
        await gameRecruitmentsDao.insertGameRecruitment(data);
    }
};
