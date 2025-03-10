module.exports = {
    recruit : (currMember, maxMember, ownerName, gameMode, type) => `@everyone\n(${currMember}/${maxMember}) ${ownerName}님의 ${gameMode} 구인이 ${type === '구인' ? '시작되었어요.' : '진행 중이에요.'}\n [가능]을 눌러 참가해보세요`,
    done : (ownerName, gameMode, emoji, type) => `@everyone\n${emoji} ${ownerName}님의 ${gameMode} 구인이 ${type === '마감' ? '마감되었어요!' : '취소되었어요'} ${emoji}`,
    ownerMention1 : (ownerId, gameMode) => `<@${ownerId}> ${gameMode} 구인이 마감되었어요. 빠른 시작을 원하시면 팀원들을 태그해 조정해보세요.`,
    boomMention : (mentionIds, ownerName, gameMode) => `${mentionIds}\n💥${ownerName}님의 ${gameMode} 파티는 구인이 취소되어 진행되지 않아요. 게임참여를 원하시면 직접 파티를 만들어보세요. `,
    waitMention : (mentionIds) => `${mentionIds}\n마감이 해제되었어요. 게임 참여를 원하시면 가능을 눌러주세요!`,
    validateTime : `⛔ 시간은 0:00 ~ 23:59 형식으로 입력해주세요.`,
    alertClose : `🚨 구인이 마감된 파티에요. 게임참여를 원하시면 다른 파티에 참가하시거나 직접 파티를 만들어보세요.`, // 시간이 오래 지났거나, 펑 된 구인글 가능 눌렀을 때
    alertOwnerJoin : `🚨 구인글을 작성한 본인이에요. 다른 파티 참여를 원하시면 파티원들에게 양해를 구한 뒤 [펑]을 누르고 참여해주세요.`,
    alertOwnerWait : `🚨 구인글을 작성한 본인이에요. 대기 사유가 필요하다면 파티원들을 태그하여 알려주세요.`,
    alertJoin : `🚨 이미 파티원으로 참가하고 있어요. 취소를 원하시면 [취소]를 눌러주세요.`,
    alertWait : `🚨 이미 대기 중이에요. 자리가 비었을때 알려드릴게요.`,
    alertDone : `🚨 구인이 마감되어 참가가 어려워요. [대기]버튼을 누르면 자리가 비었을때 알려드릴게요.`,
    alertJoinWait : `🚨 이미 파티에 참가중이에요. 대기를 원한다면, [취소] 후 [대기]를 눌러주세요.`,
    warnBoom : `🚨 파티취소는 파티장만 할 수 있어요. 다른파티와 합치고 싶으신가요? 파티장을 태그해서 요청해보세요.`, // 작성자 외에 펑 버튼을 눌렀을 때
    alertBoom : `🚨 구인글을 취소하고 싶으신가요? [펑]을 눌러주세요.`,
    warnJoin : `🚨 가능을 누르지 않았나요? 파티원에 포함되어 있지 않아요.`,
    cancelJoin : `⚠️ 취소를 눌러 파티원에서 제외 되었어요.`,
    cancelWait: `⚠️ 취소를 눌러 파티 대기에서 제외 되었어요.`,
    alertStart : (mentionIds, startTime, gameMode) => `${mentionIds}\n${startTime}에 ${gameMode} 게임이 시작돼요. 늦을 것 같다면 파티장과 파티원을 태그해 미리 말해주세요. `,
    join : (lolName) => `✅ ${lolName}님이 파티원으로 참가했어요.`,
    wait : (lolName, reason) => `${lolName}님이 대기중 이에요. "${reason}" (이)라고 하네요.`,
    rankJoin : (lolName, position) => `${lolName}님 : ${position}`,
    warnCommand : (channelId) => `<#${channelId}>에서만 사용 가능한 명령어에요`,
    validateMemberCount : `⛔ 모집인원과 마감인원은 숫자로만 입력해주세요`,
    validateMinMembers : `⛔ 마감 인원은 모집 인원보다 많으면 안 돼요. 다시 한번 확인해 주세요`,
    warnDup : `⛔ 구인 중인 파티가 있어요. 새로운 파티를 만들고 싶다면 [펑]을 누르고 다시 작성해주세요.`
}