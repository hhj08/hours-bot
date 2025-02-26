const { SlashCommandBuilder } = require('discord.js');
const partyRecruitmentsDao = require('../../db/dao/partyRecruitmentsDao');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('펑')
        .setDescription('구인글 펑'),
    async execute(interaction) {

        const partyRecruitment = await partyRecruitmentsDao.findBoomPartyRecruitment(interaction.user.id);
        const { channelId, messageId, owner, members, gameMode } = partyRecruitment;

        if(!partyRecruitment) {
            await interaction.reply({
                content: '진행 중인 구인글이 없습니다.',
                ephemeral: true
            });
            return;
        }

        let mentionIds = [];
        members.forEach(member => mentionIds += `<@${member.id}>`);

        const channel = await interaction.client.channels.fetch(channelId);
        const message = await channel.messages.fetch(messageId);

        await message.edit({
            content: `@everyone (💣펑) ${owner.name}님의 ${gameMode} 구인이 펑되었습니다.(펑💣)`,
            allowedMentions: { parse: ['everyone'] }
        });

        await message.reply(`${mentionIds} \n💥${owner.name}님의 ${gameMode} 구인이 펑되었습니다.`);

        await partyRecruitmentsDao.updateBoomOrClosed(messageId, { isExploded : true });

        await interaction.deferReply({ ephemeral: true });
        await interaction.deleteReply();
    }

}
