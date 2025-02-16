const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const gameRecruitmentsDao = require('../../db/dao/gameRecruitmentsDao');
const { gameIsClosed } = require('../../data/chiocesMap');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('랭크')
        .setDescription('랭크 게임 모집')
        .addStringOption(option =>
            option.setName('게임모드')
                .setDescription('게임 모드 선택: 자유랭크, 듀오랭크')
                .setRequired(true)
                .addChoices(
                    { name: '자유랭크', value: '자유랭크' },
                    { name: '듀오랭크', value: '듀오랭크' },
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
            option.setName('구인티어')
                .setDescription('시작 시간 입력 형식 - HH:MM')
                .setRequired(true)
                .addChoices(
                    { name: '상관없음', value: '상관없음' },
                    { name: '아이언', value: '아이언' },
                    { name: '실버', value: '실버' },
                    { name: '골드', value: '골드' },
                    { name: '플레티넘', value: '플레티넘' },
                    { name: '에멜랄드', value: '에멜랄드' },
                    { name: '다이아', value: '다이아' },
                    { name: '마스터', value: '마스터' },
                    { name: '그랜드마스터', value: '그랜드마스터' },
                    { name: '챌린저', value: '챌린저' }
                )
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
        ),
    async execute(interaction) {
        const gameMode = interaction.options.getString('게임모드');
        const channelID = interaction.options.getString('모집장소');
        const startTime = interaction.options.getString('시작시간');
        const tier = interaction.options.getString('구인티어');
        const isClosed = interaction.options.getString('마감여부');
        const isClosedName = gameIsClosed[isClosed];
        const nickname = interaction.member.nickname || interaction.user.username;
        const subNickName = nickname.substring(3,nickname.length).trim();

        const timeRegex = /^([0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/;

        if (!timeRegex.test(startTime)) {
            return interaction.reply({
                content: '⛔ 유효한 시간 형식이 아닙니다! 00:00 ~ 23:59 형식으로 입력하세요.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0x6B66FF)
            .setTitle(`${subNickName}님의 ${gameMode} 구인`)
            .addFields(
                { name: '모집장소', value: `<#${channelID}>` }
            )
            .addFields(
                { name: '시작시간', value: startTime }
            )
            .addFields(
                { name: '구인티어', value: tier }
            )
            .addFields(
                { name: '마감여부', value: isClosedName }
            )
            .setTimestamp();

        const topButton = new ButtonBuilder()
            .setCustomId('탑')
            .setLabel('탑')
            .setStyle(ButtonStyle.Success);

        const jgButton = new ButtonBuilder()
            .setCustomId('정글')
            .setLabel('정글')
            .setStyle(ButtonStyle.Success);

        const midButton = new ButtonBuilder()
            .setCustomId('미드')
            .setLabel('미드')
            .setStyle(ButtonStyle.Success);

        const adcButton = new ButtonBuilder()
            .setCustomId('원딜')
            .setLabel('원딜')
            .setStyle(ButtonStyle.Success);

        const supButton = new ButtonBuilder()
            .setCustomId('서폿')
            .setLabel('서폿')
            .setStyle(ButtonStyle.Success);

        const cancelButton = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('취소')
            .setStyle(ButtonStyle.Danger);

        const row1 = new ActionRowBuilder()
            .addComponents(topButton)
            .addComponents(jgButton)
            .addComponents(midButton);


        const row2 = new ActionRowBuilder()
            .addComponents(adcButton)
            .addComponents(supButton)
            .addComponents(cancelButton);


        const message = await interaction.reply({
            content: `@everyone ${subNickName}님의 ${gameMode} 구인이 시작되었어요!`,
            embeds: [embed],
            components: [row1, row2],
            allowedMentions: { parse: ['everyone'] }
        });

        let memberCount = 5;
        if(gameMode === '듀오랭크')
            memberCount = 2;

        const data = {
            rctsId : message.interaction.id,
            owner : { id: interaction.user.id, name: subNickName },
            members : [],
            memberCount,
            currentMemberCount : 0,
            startTime : startTime,
            gameMode : '랭크',
            isClosed : isClosed
        }
        await gameRecruitmentsDao.insertGameRecruitment(data);
    }
};
