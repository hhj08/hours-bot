const { Events } = require('discord.js');
const errorHandler = require('../common/errorHandler');
const { checkCommandChannel } = require('../common/interactionFunc');
const partyRecruitmentsDao = require('../db/dao/partyRecruitmentsDao')
const script = require('../common/script');

require('dotenv').config();

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        await errorHandler(interaction, async (interaction) => {
            if (interaction.isAutocomplete()) {
                const focusedOption = interaction.options.getFocused(true);
                if (focusedOption.name === '모집장소') {
                    const gameMode = interaction.options.getString('게임모드');
                    const choicesMap = {
                        '협곡': [
                            { name: '일반 1', value: process.env.NORMAL1 },
                            { name: '일반 2', value: process.env.NORMAL2 },
                            { name: '일반 3', value: process.env.NORMAL3 }
                        ],
                        '칼바람': [
                            { name: '칼바람나락1', value: process.env.ARAM1 },
                            { name: '칼바람나락2', value: process.env.ARAM2 },
                        ],
                        '자유랭크': [
                            { name: '자유랭크1', value: process.env.FLEX1 },
                            { name: '자유랭크2', value: process.env.FLEX2 },
                            { name: '자유랭크3', value: process.env.FLEX3 }
                        ],
                        '듀오랭크': [
                            { name: '랭크듀오1', value: process.env.DUO1 },
                            { name: '랭크듀오2', value: process.env.DUO2 },
                            { name: '랭크듀오3', value: process.env.DUO3 },
                            { name: '랭크듀오4', value: process.env.DUO4 }
                        ],
                        '롤토체스': [
                            { name: '롤토체스1', value: process.env.TFT1 },
                            { name: '롤토체스2', value: process.env.TFT2 },
                        ],
                        '특별게임모드': [{ name: '특별게임모드1', value: process.env.FEATURED_GAME_MODE },],
                        '기타': [{ name: '타겜전용', value: process.env.ETC_GAME },]
                    };

                    const choices = choicesMap[gameMode] || [];
                    const filtered = choices.filter(choice => choice.name.startsWith(focusedOption.value));

                    await interaction.respond(filtered.map(choice => ({ name: choice.name, value: choice.value })));
                }
            } else if (interaction.isChatInputCommand()) {
                const command = interaction.client.commands.get(interaction.commandName);

                if (!command) {
                    console.error(`No command matching ${interaction.commandName} was found.`);
                    return;
                }

                try {
                    const dupCheck = await  partyRecruitmentsDao.dupRecruitmentCheck(interaction.user.id);

                    console.log('dupCheck >>>>>>>>>>>>>>>>>>>>>> ', dupCheck);

                    if(dupCheck) {
                        return await interaction.reply({ content: script.warnDup, ephemeral: true });
                    }

                    const { check, channelId } = await checkCommandChannel(command.data.name, interaction.channelId);

                    if(!check) {
                        return await interaction.reply({ content: script.warnCommand(channelId), ephemeral: true });
                    }

                    await command.execute(interaction);
                } catch (error) {
                    console.error(error);
                    const errorMessage = { content: 'There was an error while executing this command!', ephemeral: true };

                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp(errorMessage);
                    } else {
                        await interaction.reply(errorMessage);
                    }
                }
            }
        })
    }
};
