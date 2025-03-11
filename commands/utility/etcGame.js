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
                .setDescription('게임 모드를 선택하세요. 기타 게임의 이름은 비고란에 추가로 기재해 주세요.')
                .setRequired(true)
                .addChoices(
                    { name: '롤토체스', value: '롤토체스' },
                    { name: '특별게임모드', value: '특별게임모드' },
                    { name: '기타', value: '기타' },
                )
        )
        .addStringOption(option =>
            option.setName('모집장소')
                .setDescription('몇번 음성채널에서 게임하실 예정이신가요? 게임모드에 맞는 음성채팅방을 이용해주세요.')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option.setName('시작시간')
                .setDescription('시작시간을 24시간 형식으로 적어주세요 (ex. 14:45) ')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('모집인원')
                .setDescription('몇명을 모집할 예정인가요? 모집 인원을 숫자만 입력해주세요')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('마감인원')
                .setDescription('몇 명이 모이면 시작할 예정인가요? 최소 인원을 숫자만 입력해주세요.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('비고')
                .setDescription('즐겜, 빡겜 여부 혹은 파티원에게 공지하고 싶은 내용을 기재해주세요.')
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
            const embed = await setEmbed(interaction, interactionData, lolName, 'etc', 0x9FC93C);

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
