const { Events } = require('discord.js');

const userMessageMap = new Map();
const gameMessageMap = new Map();
const participants = new Set();

const MAX_PARTICIPANTS = 2;
let closingMessage = null;
let botUserId = null;

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        if (!user || !user.id || user.bot) return;

        const { message, client } = reaction;

        if (!message || !message.id) return;

        let member;
        try {
            member = await message.guild.members.fetch(user.id);
        } catch (err) {
            console.warn(`⚠️ 유저 정보를 가져올 수 없음: ${user?.id || 'unknown'}`);
            return;
        }

        if (!member) return;
        const nickname = member.displayName;

        if (!botUserId) botUserId = client.user.id;

        if (reaction.emoji.name === '✅') {
            if (participants.size >= MAX_PARTICIPANTS) {
                await reaction.users.remove(user.id);
                return;
            }

            if (userMessageMap.has(user.id)) {
                await reaction.users.remove(user.id);
                return;
            }

            participants.add(user.id);
            const participationMessage = await message.reply(`✅ ${nickname}님이 게임에 참여했습니다!`);

            userMessageMap.set(user.id, participationMessage.id);
            gameMessageMap.set(user.id, message.id);

            await participationMessage.react('❌');

            if (participants.size >= MAX_PARTICIPANTS) {
                closingMessage = await message.reply('🚨 마감되었습니다!');
                await message.react('⭕');
            }
        }

        else if (reaction.emoji.name === '❌') {
            const participationMessageId = userMessageMap.get(user.id);
            const originalMessageId = gameMessageMap.get(user.id);

            if (!participationMessageId || participationMessageId !== message.id) {
                await reaction.users.remove(user.id);
                return;
            }

            const wasFull = participants.size === MAX_PARTICIPANTS;

            await message.edit(`❌ ${nickname}님이 참여를 취소했습니다!`);

            const originalMessage = await message.channel.messages.fetch(originalMessageId).catch(() => null);
            if (originalMessage) {
                const checkReaction = originalMessage.reactions.cache.get('✅');
                if (checkReaction) {
                    await checkReaction.users.remove(user.id);
                }
            }

            userMessageMap.delete(user.id);
            gameMessageMap.delete(user.id);
            participants.delete(user.id);

            if (wasFull && participants.size < MAX_PARTICIPANTS) {
                const circleReaction = originalMessage?.reactions.cache.get('⭕');
                if (circleReaction) {
                    await circleReaction.users.remove(botUserId).catch(() => {});
                }

                if (closingMessage) {
                    await closingMessage.delete().catch(() => {});
                    closingMessage = null;
                }

                await message.reply('🚨 마감이 해제되었습니다!');
            }

            await reaction.message.reactions.cache.get('❌')?.remove();
        }
    },
};
