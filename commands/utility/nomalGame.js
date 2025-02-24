const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const partyRecruitmentsDao = require('../../db/dao/partyRecruitmentsDao');
const { gameIsClosed } = require('../../data/chiocesMap');

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
        const gameMode = interaction.options.getString('게임모드');
        const channelID = interaction.options.getString('모집장소');
        const startTime = interaction.options.getString('시작시간');
        const minMembers = interaction.options.getString('마감여부');
        const isClosedName = gameIsClosed[minMembers];
        const description = interaction.options.getString('비고') || '';

        const extraMembers = [];
        for (let i = 1; i <= 4; i++) {
            const extraMember = interaction.options.getUser(`추가인원${i}`);
            if (extraMember) {
                extraMembers.push(`<@${extraMember.id}>`);
            }
        }

        const userName = interaction.member.nickname || interaction.user.username;
        const lolName = userName.substring(3, userName.length).trim();

        // 시간 정규식 확인
        const timeRegex = /^([0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/;
        if (!timeRegex.test(startTime)) {
            return interaction.reply({
                content: '⛔ 유효한 시간 형식이 아닙니다! 00:00 ~ 23:59 형식으로 입력하세요.',
                ephemeral: true
            });
        }

        // 현인원 필드 값 결정
        const currentMembersField = extraMembers.length > 0
            ? { name: '현인원', value: `<@${interaction.user.id}>` + ', ' + extraMembers.join(', ') }
            : { name: '현인원', value: `<@${interaction.user.id}>` };

        // 임베드 생성
        const embed = new EmbedBuilder()
            .setColor(0xD1B2FF)
            .setTitle(`${lolName}님의 ${gameMode} 구인`)
            .addFields(
                { name: '모집장소', value: `<#${channelID}>` },
                { name: '시작시간', value: startTime },
                currentMembersField,
                { name: '마감여부', value: isClosedName },
                { name: '비고', value: description ? description : '없음' }
            )
            .setTimestamp();

        // 버튼 생성
        const joinButton = new ButtonBuilder()
            .setCustomId('join')
            .setLabel('가능')
            .setStyle(ButtonStyle.Success);

        const holdButton = new ButtonBuilder()
            .setCustomId('hold')
            .setLabel('대기')
            .setStyle(ButtonStyle.Primary);

        const cancelButton = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('취소')
            .setStyle(ButtonStyle.Danger);

        const boomButton = new ButtonBuilder()
            .setCustomId('boom')
            .setLabel('펑')
            .setStyle(ButtonStyle.Secondary);


        const actionRow = new ActionRowBuilder()
            .addComponents(joinButton)
            .addComponents(holdButton)
            .addComponents(cancelButton)
            .addComponents(boomButton);

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
            channelId: process.env.NOMALCHANNEL,
        };

        await partyRecruitmentsDao.savePartyRecruitment(data);
    }
};
