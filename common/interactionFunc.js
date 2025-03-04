const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const partyRecruitmentsDao = require('../db/dao/partyRecruitmentsDao');
const script = require('./script');

require('dotenv').config();

const handleJoin = async (interaction, lolName, type, position, joinMessageId, messageId) => {

    const newMessage = type === 'normal' ? script.join(lolName) : script.rankJoin(lolName, position)
    const cond = {
        "$push": { members: { id: interaction.user.id, message: newMessage } },
        "$inc": { currentMembers: 1 }
    };

    const addMember = await partyRecruitmentsDao.findOneAndUpdateMessageId(messageId, cond);
    const { currentMembers, maxMembers, owner, gameMode, closedMessageId} = addMember;

    const allMessages = addMember.members.map(member => member.message).join('\n');
    await interaction.message.edit({
        content: script.recruit(currentMembers, maxMembers, lolName, gameMode, '가능'),
        allowedMentions: { parse: ['everyone'] }
    });

    if (!joinMessageId || joinMessageId === 'null') {
        const replyMessage = await interaction.reply({ content: allMessages, fetchReply: true });
        await partyRecruitmentsDao.updateMessageId(messageId, { "$set": { joinMessageId: replyMessage.id } });
    } else {
        const joinMessage = await interaction.channel.messages.fetch(joinMessageId);
        await joinMessage.edit({ content: allMessages });
        await interaction.deferUpdate();
    }

    if (currentMembers === maxMembers) {
        await interaction.message.edit({
            content: script.done(owner.name, gameMode, process.env.DONE_EMOJI, '마감'),
            allowedMentions: { parse: ['everyone'] }
        });

        const closeMessage = await interaction.message.reply({
            content: script.ownerMention1(owner.id, gameMode),
            fetchReply: true
        });

        await partyRecruitmentsDao.updateMessageId(addMember.messageId,
            { "$set": { isClosed: true, closedMessageId: closedMessageId ? closedMessageId : closeMessage.id } });
    }
}

const removeUserFromWaiting = async (interaction, messageId, waitingMessageId, userId) => {
    const cond = {
        "$pull": {waitingMembers: { id: userId }}
    };

    const removeWaitingMember = await partyRecruitmentsDao.findOneAndUpdateMessageId(messageId, cond);
    const removeWaitingMessages = removeWaitingMember.waitingMembers.map(member => member.message).join('\n');

    if (waitingMessageId) {
        const waitingMessage = await interaction.channel.messages.fetch(waitingMessageId);
        if (!removeWaitingMessages) {
            await waitingMessage.delete();
            await partyRecruitmentsDao.updateMessageId(messageId, { "$set": { waitingMessageId: null } });
        } else {
            await waitingMessage.edit({ content: removeWaitingMessages });
        }
    }
}

const showModal = async (interaction, customId, title, inputId, placeholder) => {
    const modal = new ModalBuilder()
        .setCustomId(customId)
        .setTitle(title);

    const input = new TextInputBuilder()
        .setCustomId(inputId).setLabel(title)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(placeholder);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
}

const checkCommandChannel = async (command, channelId) => {

    if( command === '일반' && (channelId !== process.env.LFP_NORMAL_GAME))
        return { check : false, channelId: process.env.LFP_NORMAL_GAME };

    if( command === '랭크' && (channelId !== process.env.LFP_RANK_GAME))
        return { check : false, channelId: process.env.LFP_RANK_GAME };

    if( command === '기타' && (channelId !== process.env.LFP_ETC_GAME))
        return { check : false, channelId: process.env.LFP_ETC_GAME };

    if( command === '일반' && (channelId !== process.env.LFP_NORMAL_GAME))
        return { check : false, channelId: process.env.LFP_NORMAL_GAME };

    return { check : true, channelId: null };
}

module.exports = {
    handleJoin,
    removeUserFromWaiting,
    showModal,
    checkCommandChannel
}