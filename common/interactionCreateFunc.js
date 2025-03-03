const partyRecruitmentsDao = require('../db/dao/partyRecruitmentsDao');
const removeWaitingMembers = async (messageId, userId) => {
    const cond = {
        "$pull": {waitingMembers: { id: userId }}
    };

    const removeWaitingMember = await partyRecruitmentsDao.findOneAndUpdateMessageId(messageId, cond);
    return removeWaitingMember.waitingMembers.map(member => member.message).join('\n');
}

module.exports = {
    removeWaitingMembers
}