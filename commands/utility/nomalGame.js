const { SlashCommandBuilder } = require('discord.js');
const partyRecruitmentsDao = require('../../db/dao/partyRecruitmentsDao');
const { getInteractionData, getUserName, checkTimeRegex, setEmbed, setActionRow } = require('../../common/commonFunc');

require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('일반')
        .setDescription('일반 게임 모집')
        .addStringOption(option =>
            option.setName('게임모드')
                .setDescription('게임 모드 선택')
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
            option.setName('비고')
                .setDescription('즐겜, 빡겜 여부 등 기타 비고 사항 작성')
        )
        .addUserOption(option =>
            option.setName('추가인원1')
                .setDescription('본인 외의 추가 인원 선택')
        )
        .addUserOption(option =>
            option.setName('추가인원2')
                .setDescription('본인 외의 추가 인원 선택')
        )
        .addUserOption(option =>
            option.setName('추가인원3')
                .setDescription('본인 외의 추가 인원 선택')
        )
        .addUserOption(option =>
            option.setName('추가인원4')
                .setDescription('본인 외의 추가 인원 선택')
        ),
    async execute(interaction) {
        // 상호작용 데이터 가져오기
        const interactionData = await getInteractionData(interaction);
        const {gameMode, startTime, minMembers, extraMembers} = interactionData;

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
        const actionRow = await setActionRow('join', 'hold', 'cancel');

        // 메시지 전송
        const message = await interaction.reply({
            content: `@everyone ${lolName}님의 ${gameMode} 구인이 시작되었어요!`,
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
            members: [
                { id: interaction.user.id }, // 모집자 추가
                ...extraMembers.map(memberId => ({ id: memberId.replace(/[<@>]/g, '') })) // 추가 인원 변환
            ],
            minMembers,
            currentMembers: extraMembers.length + 1,
            startTime,
            channelId: process.env.LFP_NORMAL_GAME,
            gameMode
        };

        await partyRecruitmentsDao.savePartyRecruitment(data);
    }
};
