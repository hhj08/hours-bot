const { SlashCommandBuilder } = require('discord.js');
const partyRecruitmentsDao = require('../../db/dao/partyRecruitmentsDao');
const { getInteractionData, getUserName, checkTimeRegex, setEmbed, setActionRow } = require('../../common/commandFunc');
const errorHandler = require('../../common/errorHandler');
const script = require('../../common/script');

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
                .setDescription('게임에 필요한 최대 인원 수를 입력 (숫자만 입력)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('마감인원')
                .setDescription('게임 시작에 필요한 최소 인원 수 입력 (숫자만 입력)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('비고')
                .setDescription('게임의 이름, 롤체 티어 등을 입력')
        ),
    async execute(interaction) {
        await errorHandler(interaction, async (interaction) => {
            // 상호작용 데이터 가져오기
            const interactionData = await getInteractionData(interaction, 'etc');
            let { gameMode, startTime, minMembers, maxMembers } = interactionData;

            // 숫자 입력 여부 확인
            if (isNaN(maxMembers) || isNaN(minMembers)) {
                await interaction.reply({
                    content: script.validateMemberCount,
                    ephemeral: true
                });
                return;
            }

            // 숫자로 변환
            maxMembers = parseInt(maxMembers, 10);
            minMembers = parseInt(minMembers, 10);

            // 마감인원이 모집인원보다 클 경우 오류 메시지 출력
            if (minMembers > maxMembers) {
                await interaction.reply({
                    content: script.validateMinMembers,
                    ephemeral: true
                });
                return;
            }

            // 사용자 닉네임 가져오기
            const lolName = await getUserName(interaction);

            // 시간 정규식 확인
            if (!checkTimeRegex(startTime)) {
                await interaction.reply({
                    content: script.validateTime,
                    ephemeral: true
                });
                return;
            }

            // 임베드 생성
            const embed = await setEmbed(interaction, interactionData, lolName, 'etc');

            // 버튼 생성
            const actionRow = await setActionRow('join');

            // 메시지 전송
            const message = await interaction.reply({
                content: script.recruit(1, maxMembers, lolName, gameMode, '구인'),
                embeds: [embed],
                components: [actionRow],
                allowedMentions: { parse: ['everyone'] },
                fetchReply: true
            });

            const data = {
                interactionId: message.interaction.id,
                messageId: message.id,
                owner: { id: interaction.user.id, name: lolName },
                members: [{ id: interaction.user.id }],
                maxMembers,
                minMembers,
                startTime,
                channelId: process.env.LFP_ETC_GAME,
                gameMode
            };
            await partyRecruitmentsDao.savePartyRecruitment(data);
        });
    }
};
