module.exports = async (interaction, handler) => {
    try {
        await handler(interaction);
    } catch (error) {
        console.error("에러 발생:", error);
        if (interaction && interaction.reply) {
            await interaction.reply({
                content: "잠시 문제가 있어 잠시 후 다시 시도해주세요.",
                ephemeral: true
            }).catch(console.error);
        }
    }
};
