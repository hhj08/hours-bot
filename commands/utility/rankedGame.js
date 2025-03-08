const { SlashCommandBuilder } = require('discord.js');
const { getInteractionData, getUserName, checkTimeRegex, setEmbed, setActionRow } = require('../../common/commandFunc');
const partyRecruitmentsDao = require('../../db/dao/partyRecruitmentsDao');
const errorHandler = require('../../common/errorHandler');
const script = require('../../common/script');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('랭크')
        .setDescription('랭크 게임 모집')
        .addStringOption(option =>
            option.setName('게임모드')
                .setDescription('게임 모드를 선택하세요.')
                .setRequired(true)
                .addChoices(
                    { name: '자유랭크', value: '자유랭크' },
                    { name: '듀오랭크', value: '듀오랭크' },
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
                .setDescription('시작시간을 24시간 형식으로 적어주세요 (ex. 14:45)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('라인')
                .setDescription('어떤 라인에 가실건가요? 가고 싶은 라인을 입력해주세요.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('구인티어')
                .setDescription('구인하는 티어를 기재해주세요. 부계정은 월별 활동일수에 포함 안된다는 점 참고하세요 🙂')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('마감여부')
                .setDescription('최소 출발 인원을 선택해주세요. 만약 인원 상관없이 시작시간에 출발하신다면 상시모집을 선택해주세요. ')
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
                .setDescription('즐겜, 빡겜 여부 혹은 파티원에게 공지하고 싶은 내용을 기재해주세요.')
        ),
    async execute(interaction) {
        await errorHandler(interaction, async (interaction) => {
            // 상호작용 데이터 가져오기
            const interactionData = await getInteractionData(interaction);
            const {gameMode, startTime, minMembers, line } = interactionData;

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
            const embed = await setEmbed(interaction, interactionData, lolName, null, 0x4374D9);

            // 버튼 생성
            const actionRow = await setActionRow('rankJoin');

            const maxMembers =  gameMode === '듀오랭크' ? 2 : 5;

            // 메시지 전송
            const message = await interaction.reply({
                content: script.recruit(1, maxMembers, lolName, gameMode, '구인'),
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
        })
    }
};
