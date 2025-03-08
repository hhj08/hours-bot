const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder} = require('discord.js');

// 명령어 상호작용 데이터 가져오기
const getInteractionData = async (interaction, type) => {
    const isClosed = {
        '2': '2미펑',
        '3': '3미펑',
        '5': '5미펑',
        '0': '상시모집'
    };

    const gameMode = interaction.options.getString('게임모드');
    const channelID = interaction.options.getString('모집장소');
    const startTime = interaction.options.getString('시작시간');
    const line = interaction.options.getString('라인');
    const tier = interaction.options.getString('구인티어');
    const maxMembers = interaction.options.getString('모집인원');
    const minMembers = interaction.options.getString(type === 'etc' ? '마감인원' : '마감여부');
    const isClosedName = isClosed[minMembers];
    const description = interaction.options.getString('비고');

    return {gameMode, channelID, startTime, tier, maxMembers, minMembers, isClosedName, description, line};
}

// 디스코드 닉네임에서 롤 닉네임만 반환
const getUserName = async (interaction) => {
    const userName = interaction.member.nickname || interaction.user.username;
    return userName.substring(3, userName.length).trim();
}

// 시작 시간 입력 형식 체크
const checkTimeRegex = (startTime) => {
    const timeRegex = /^([0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(startTime);
};

// 임베디드 생성
const setEmbed = async (interaction, data, lolName, type, color) => {
    const { gameMode, channelID, startTime, tier,
        isClosedName, description, maxMembers, minMembers, line} = data;

    const fields = [
        { name: '모집장소', value: `<#${channelID
        }>` },
        { name: '시작시간', value: startTime },
        { name: '현인원', value: lolName },
        line ? {name : '라인', value: line } : null,
        tier? { name: '구인티어', value: tier } : null,
        type === 'etc' ? { name: '모집인원', value: `${maxMembers}명` } : null,
        type !== 'etc' ? { name: '마감여부', value: isClosedName } : { name: '마감인원', value: `${minMembers}명 미만 펑` },
        description ? { name: '비고', value: description } : null,
    ].filter(field => field !== null);
    
    return new EmbedBuilder()
        .setColor(color) // 0xD1B2FF
        .setTitle(`${lolName}님의 ${gameMode} 구인`)
        .addFields(...fields)
        .setTimestamp();
}

// 버튼
const setActionRow = async (join) => {
    const joinButton = new ButtonBuilder()
        .setCustomId(join)
        .setLabel('가능')
        .setStyle(ButtonStyle.Success);

    const waitingButton = new ButtonBuilder()
        .setCustomId('waiting')
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

    return new ActionRowBuilder()
        .addComponents(joinButton)
        .addComponents(waitingButton)
        .addComponents(cancelButton)
        .addComponents(boomButton);
}

module.exports = {
    getInteractionData,
    getUserName,
    checkTimeRegex,
    setEmbed,
    setActionRow
}