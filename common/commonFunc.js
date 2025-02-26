const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const getUserName = async (interaction) => {
    const userName = interaction.member.nickname || interaction.user.username;
    return userName.substring(3, userName.length).trim();
}

const checkTimeRegex = (startTime) => {
    const timeRegex = /^([0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(startTime);
};

const getExtraMembers = async (interaction) => {
    return [...Array(4)]
        .map((_, i) => interaction.options.getUser(`추가인원${i + 1}`))
        .filter(user => user)
        .map(user => user.id);
};

const getCurrentMembers = async (interaction, extraMembers) => {
    const members = [`<@${interaction.user.id}>`, ...extraMembers.map(id => `<@${id}>`)];
    return { name: '현인원', value: members.join(', ') };
};

const setActionRow = async (join, hold, cancel) => {
    const joinButton = new ButtonBuilder()
        .setCustomId(join)
        .setLabel('가능')
        .setStyle(ButtonStyle.Success);

    const holdButton = new ButtonBuilder()
        .setCustomId(hold)
        .setLabel('대기')
        .setStyle(ButtonStyle.Primary);

    const cancelButton = new ButtonBuilder()
        .setCustomId(cancel)
        .setLabel('취소')
        .setStyle(ButtonStyle.Danger);

    return new ActionRowBuilder()
        .addComponents(joinButton)
        .addComponents(holdButton)
        .addComponents(cancelButton);
}

module.exports = {
    getUserName,
    checkTimeRegex,
    getExtraMembers,
    getCurrentMembers,
    setActionRow
}