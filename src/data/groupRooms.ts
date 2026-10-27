import { DynamicGroupRoom, BacklogMessage } from '../types';

export const PRESET_GROUP_ROOMS: DynamicGroupRoom[] = [
  {
    id: 'imp_comms',
    name: 'I.M.P. Emergency Comms',
    memberIds: ['blitzo', 'moxxie', 'millie', 'loona'],
    isUnlocked: false,
    memberConfigs: {
      loona: {
        characterId: 'loona',
        requiredAffinity: 30,
        inviteDmText: "*sighs* look, blitz won't stop yelling about needing backup. I just added you to our work thread. don't spam it.",
        groupAddSystemText: '*Loona dragged Operative_07 into the channel*',
      },
      blitzo: {
        characterId: 'blitzo',
        requiredAffinity: 45,
        inviteDmText: "HEY!! You're actually pretty badass. I'm dumping you into the I.M.P. comms so Moxxie can stop whining about our workload!",
        groupAddSystemText: '*Blitzø added Operative_07 with full administrative privileges*',
      },
      millie: {
        characterId: 'millie',
        requiredAffinity: 20, // Easier: friendly Wrath bruiser
        inviteDmText: "You are so sweet! ❤️ We could always use good company around the office, so I tossed you into our crew chat!",
        groupAddSystemText: '*Millie happily invited Operative_07 to the group*',
      },
      moxxie: {
        characterId: 'moxxie',
        requiredAffinity: 40, // High: needs to see operational competence
        inviteDmText: "Given your recent professionalism, I have taken the liberty of routing you to our tactical liaison channel. Please maintain strict protocol.",
        groupAddSystemText: '*Moxxie authorized Operative_07 onto the secure frequency*',
      },
    },
    baseBacklog: [
      {
        id: 'imp-bg-1',
        senderId: 'blitzo',
        senderName: 'Blitzø',
        avatarUrl: '/avatars/blitzo.png',
        text: 'WHO TOOK MY SPECIAL HORSE MUG OUT OF THE BREAKROOM SINK',
        timestamp: '5:42 PM',
      },
      {
        id: 'imp-bg-2',
        senderId: 'moxxie',
        senderName: 'Moxxie',
        avatarUrl: '/avatars/moxxie.png',
        text: 'Sir, with all due respect, you left it behind a dumpster on Earth during the D.H.O.R.K.S. escape.',
        timestamp: '5:44 PM',
      },
      {
        id: 'imp-bg-3',
        senderId: 'millie',
        senderName: 'Millie',
        avatarUrl: '/avatars/millie.png',
        text: "it's true boss ❤️ we took a photo of it before the van caught on fire",
        timestamp: '5:45 PM',
      },
      {
        id: 'imp-bg-4',
        senderId: 'loona',
        senderName: 'Loona',
        avatarUrl: '/avatars/loona.png',
        text: "*sighs loudly* stop spamming the work comms while I'm on the phone, old man.",
        timestamp: '5:48 PM',
      },
      {
        id: 'imp-bg-5',
        senderId: 'blitzo',
        senderName: 'Blitzø',
        avatarUrl: '/avatars/blitzo.png',
        text: 'I AM NOT AN OLD MAN LOONEY, I AM A MAJESTIC ENTREPRENEUR',
        timestamp: '5:49 PM',
      },
    ],
  },
  {
    id: 'batfamily_comms',
    name: 'Bat-Family Encrypted Channel',
    memberIds: ['batman', 'nightwing', 'redhood'],
    isUnlocked: false,
    memberConfigs: {
      nightwing: {
        characterId: 'nightwing',
        requiredAffinity: 25, // Dick is trusting and quick to reach out
        inviteDmText: "You've been holding your own out there. Patrolling gets lonely—linking you into our Bat-comms.",
        groupAddSystemText: '*Nightwing patched Operative_07 into the secure loop*',
      },
      redhood: {
        characterId: 'redhood',
        requiredAffinity: 35, // Jason respects street competence
        inviteDmText: "You're not completely useless. Throwing you on the comm line so you don't step into crossfire in Crime Alley.",
        groupAddSystemText: '*Red Hood routed an unregistered signal for Operative_07*',
      },
      batman: {
        characterId: 'batman',
        requiredAffinity: 60, // Bruce is hyper-vigilant and extremely strict
        inviteDmText: "Your performance has been evaluated. Operational clearance granted to frequency Delta-9. Keep transmissions brief.",
        groupAddSystemText: '*Batman granted provisional encrypted access to Operative_07*',
      },
    },
    baseBacklog: [
      {
        id: 'bat-bg-1',
        senderId: 'batman',
        senderName: 'Batman',
        avatarUrl: '/avatars/batman.png',
        text: 'All units. Status report on Sector 4 docks.',
        timestamp: '6:10 PM',
      },
      {
        id: 'bat-bg-2',
        senderId: 'nightwing',
        senderName: 'Nightwing',
        avatarUrl: '/avatars/nightwing.png',
        text: 'Sector 4 clear, B. Grabbed some coffee on the way. You should try sleeping for once.',
        timestamp: '6:12 PM',
      },
      {
        id: 'bat-bg-3',
        senderId: 'redhood',
        senderName: 'Red Hood',
        avatarUrl: '/avatars/redhood.png',
        text: "He doesn't sleep, Dickie, he just glares at monitors until crime drops 2%.",
        timestamp: '6:14 PM',
      },
      {
        id: 'bat-bg-4',
        senderId: 'batman',
        senderName: 'Batman',
        avatarUrl: '/avatars/batman.png',
        text: 'Todd. Stay off open civilian frequencies.',
        timestamp: '6:15 PM',
      },
    ],
  },
];

export function checkAndUnlockGroupRooms(
  userAffinityMap: Record<string, number>,
  currentRooms: DynamicGroupRoom[],
  sendDirectMessage: (senderId: string, text: string) => void
): DynamicGroupRoom[] {
  let updated = false;

  const newRooms = currentRooms.map((room) => {
    if (room.isUnlocked) return room;

    // Check if ANY member's unique threshold is reached
    for (const memberId of room.memberIds) {
      const config = room.memberConfigs[memberId];
      const affinity = userAffinityMap[memberId] || 0;

      if (config && affinity >= config.requiredAffinity) {
        updated = true;

        // 1. Send the inviter's DM to the user
        sendDirectMessage(memberId, config.inviteDmText);

        // 2. Assemble the full room backlog with this member's custom invite line
        const completeBacklog: BacklogMessage[] = [
          ...room.baseBacklog,
          {
            id: `${room.id}-add-${Date.now()}`,
            senderId: memberId,
            senderName: 'System Action',
            text: config.groupAddSystemText,
            timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            isSystemDivider: true,
          },
        ];

        // 3. Persist messages so the room opens loaded with history
        localStorage.setItem(`pulsedirect_messages_${room.id}`, JSON.stringify(completeBacklog));

        return {
          ...room,
          isUnlocked: true,
          unlockedBy: memberId,
        };
      }
    }

    return room;
  });

  if (updated) {
    localStorage.setItem('pulsedirect_group_rooms', JSON.stringify(newRooms));
  }

  return newRooms;
}
