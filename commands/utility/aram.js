const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('칼')
        .setDescription('칼바람 구인글 작성')
        .addStringOption(option =>
            option.setName('게임유형')
                .setDescription('게임유형 작성 ex)즐겜, 승리지향 등')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('모집장소')
                .setDescription('게임을 시작할 채널 선택')
                .setRequired(true)
                .addChoices(
                    { name: '칼바람나락1', value: process.env.ARAM_CHANNEL1 },
                    { name: '칼바람나락2', value: process.env.ARAM_CHANNEL2 },
                    { name: '칼바람나락3', value: process.env.ARAM_CHANNEL3 },
                ))
        .addStringOption(option =>
            option.setName('시작시간')
                .setDescription('게임 시작 시간 (12:00 형식으로 입력)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('현인원')
                .setDescription('현인원 입력')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('마감여부')
                .setDescription('마감여부 입력')
                .setRequired(true)),
    async execute(interaction) {
        const gameType = interaction.options.getString('게임유형');
        const channelID = interaction.options.getString('모집장소')
        const startTime = interaction.options.getString('시작시간');
        const currentMembers = interaction.options.getString('현인원');
        const isClosed = interaction.options.getString('마감여부');

        const message = `@everyone\n게임모드: 칼바람\n게임유형: ${gameType}\n모집장소: <#${channelID}>\n시작시간: ${startTime}\n현 인 원: ${currentMembers}\n마감여부: ${isClosed}`;

        await interaction.reply({
            content: message,
            allowedMentions: { parse: ['everyone'] },
        });
    },
};
