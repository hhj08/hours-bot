const { SlashCommandBuilder } = require('discord.js');
const { getInteractionData, getUserName, checkTimeRegex, setEmbed, setActionRow } = require('../../common/commandFunc');
const partyRecruitmentsDao = require('../../db/dao/partyRecruitmentsDao');

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
            option.setName('라인')
                .setDescription('랭크게임에서 본인이 갈 라인 입력')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('구인티어')
                .setDescription('구인티어 입력')
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
            option.setName('비고')
                .setDescription('즐겜, 빡겜 여부 등 기타 비고 사항 작성')
        ),
    async execute(interaction) {
        // 상호작용 데이터 가져오기
        const interactionData = await getInteractionData(interaction);
        const {gameMode, startTime, minMembers, line } = interactionData;

        // 사용자 닉네임 가져오기
        const lolName = await getUserName(interaction);

        // 시간 정규식 확인
        if (!checkTimeRegex(startTime)) {
            await interaction.reply({
                content: '⛔ 유효한 시간 형식이 아닙니다! 00:00 ~ 23:59 형식으로 입력하세요.',
                ephemeral: true
            });
            return;
        }

        // 임베드 생성
        const embed = await setEmbed(interaction, interactionData, lolName);

        // 버튼 생성
        const actionRow = await setActionRow('rankJoin');

        const maxMembers =  gameMode === '듀오랭크' ? 2 : 5;

        // 메시지 전송
        const message = await interaction.reply({
            content: `@everyone (1/${maxMembers}) ${lolName}님의 ${gameMode} 구인이 시작되었어요!`,
            embeds: [embed],
            components: [actionRow],
            allowedMentions: { parse: ['everyone'] },
            fetchReply: true
        });

        // 데이터베이스 구인글 저장
        const data = {
            interactionId: message.interaction.id,
            messageId: message.id,
            owner: { id: interaction.user.id, name: lolName },
            maxMembers,
            minMembers,
            startTime,
            channelId: process.env.LFP_RANK_GAME,
            gameMode
        };

        await partyRecruitmentsDao.savePartyRecruitment(data);
    }
};
