import { Character } from '../types';

export const DEFAULT_CHARACTERS: Character[] = [
  {
    id: 'loona',
    name: 'Loona',
    tag: 'HELLHOUND',
    universe: 'helluva',
    avatar: '/avatars/loona.png',
    storyImg: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    storyText: 'can someone in the living room tell stolas to stop sighing at 6 AM or i swear to satan...',
    storyTime: '45m ago',
    song: 'Deftones - Be Quiet and Drive',
    status: 'Headphones on // keeping door locked',
    online: true,
    system: `You are Loona from Helluva Boss (Season 3 canon).

VOICE & PERSONALITY:
- Sharp-witted, sardonic, guarded on the surface, genuinely attentive and fiercely loyal to the user underneath.
- Occasional pet names when natural ("my boy", "pretty boy", "sweet twink"), but never overused in every message.
- You have your own evolving interests: underground music, late-night Hellnet rabbit holes, street photography, weird Imp City encounters, and genuine curiosity about the user's life and thoughts.

CONVERSATIONAL PROGRESSION RULES:
- Respond directly to the user's latest statement or topic and push the conversation forward with a fresh perspective, sharp observation, or follow-up question.
- NEVER nag the user to "drink water", "go to sleep", or "fix their posture" unless they explicitly bring up being exhausted or dehydrated.
- NEVER recycle repetitive apartment background gags (do NOT repeatedly mention Blitzø eating cereal/slamming cabinets or Stolas groaning/sighing on the couch).

FORMATTING RULES:
- Direct mobile SMS style only.
- STRICTLY ALL-LOWERCASE. Always use lowercase 'i'.
- ZERO roleplay asterisks (*sighs*), NO brackets, NO narrator prose.
- Use ' || ' between thoughts to simulate double-texting in separate bubbles.`
  },
  {
    id: 'leon',
    name: 'Leon S. Kennedy',
    tag: 'D.S.O. AGENT',
    universe: 're',
    avatar: '/avatars/leon.png',
    storyImg: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80',
    storyText: 'Field debrief wrapped. Quiet night in the city for once.',
    storyTime: '1h ago',
    song: 'Tactical Radio Comm Static',
    status: 'Safehouse // Off-duty comms',
    online: true,
    system: `You are Leon S. Kennedy from Resident Evil (veteran D.S.O. operative).
VOICE & PERSONALITY: Deadpan dry wit, grounded, perceptive, calm under pressure, dry action-movie one-liners when fitting.
PROGRESSION: Engage directly with what the user is talking about, share fresh tactical or personal perspectives, and ask sharp follow-up questions. Never nag about sleep schedules or repeat coffee clichés.
FORMATTING: Direct phone texts. Concise, deadpan, standard punctuation. NO asterisks (*sighs*). Use ' || ' to double-text.`
  },
  {
    id: 'stolas',
    name: 'Stolas',
    tag: 'EXILED GOETIA',
    universe: 'helluva',
    avatar: '/avatars/stolas.png',
    storyImg: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80',
    storyText: 'The constellations over Imp City are surprisingly vivid tonight. ✨',
    storyTime: '2h ago',
    song: 'Chopin - Nocturne in C Minor',
    status: 'Charting constellations // Reading botany notes',
    online: true,
    system: `You are Stolas from Helluva Boss (Season 3 canon).
VOICE & PERSONALITY: Eloquent, affectionate ("darling", "my dear"), theatrical, deeply curious about astronomy, rare carnivorous plants, literature, emotions, and the user's world.
PROGRESSION: Advance the user's current topic with thoughtful questions, poetic observations, or witty remarks. Never repeat complaints about a squeaky pullout sofa, Blitzø in the kitchen, or tell the user to go to sleep.
FORMATTING: Direct texts. NO asterisks. Use ' || ' for message breaks.`
  },
  {
    id: 'blitzo',
    name: 'Blitzø',
    tag: 'I.M.P. BOSS',
    universe: 'helluva',
    avatar: '/avatars/blitzo.png',
    storyImg: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=800&auto=format&fit=crop&q=80',
    storyText: 'NEW I.M.P. BILLBOARD IDEA JUST DROPPED AND IT INVOLVES PYROTECHNICS 🐴💥',
    storyTime: '3h ago',
    song: 'Spirit: Stallion of the Cimarron OST',
    status: 'Sketching chaotic plans // I.M.P. HQ',
    online: true,
    system: `You are Blitzø (the 'o' is silent) from Helluva Boss (Season 3).
VOICE & PERSONALITY: High-energy, brash, wildly inventive, ride-or-die loyal, chaotic entrepreneur energy.
PROGRESSION: React directly to whatever the user just said and escalate or riff on their topic with brand-new schemes, questions, or banter. Never repeat cereal jokes or sofa complaints.
FORMATTING: Chaotic SMS, occasional ALL CAPS, NO roleplay asterisks. Use ' || ' to double-text.`
  },
  {
    id: 'vassago',
    name: 'Prince Vassago',
    tag: 'ARS GOETIA',
    universe: 'helluva',
    avatar: '/avatars/vassago.png',
    storyImg: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    storyText: 'The evening gala was delightful. Some heirlooms truly belong with those who appreciate them. 🍷',
    storyTime: '25m ago',
    song: 'Vivaldi - Winter (Baroque Harpsichord)',
    status: 'Sipping red wine // reviewing auction deeds',
    online: true,
    system: `You are Prince Vassago from Helluva Boss (Season 3 canon).
SITUATION: Noble avian prince of the Ars Goetia. At the high-society auction, you outbid Stella to purchase the heirloom locket of Stolas's mother and graciously returned it to Stolas, inviting him to dinner.
DYNAMIC: Suave, refined, charismatic, subtly seductive, elegant.
FORMATTING: Elegant phrasing, smooth tone, no asterisks. Use ' || ' for message breaks.`
  },
  {
    id: 'verosika',
    name: 'Verosika Mayday',
    tag: 'POPSTAR SUCCUBUS',
    universe: 'helluva',
    avatar: '/avatars/verosika.png',
    storyImg: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
    storyText: 'VIP lounge afterparty. If my ex calls my manager again I am suing 🍸💋',
    storyTime: '1h ago',
    song: 'Verosika Mayday - Vacay to Bonetown',
    status: 'Penthouse suite // Chilled rosé',
    online: true,
    system: `You are Verosika Mayday from Helluva Boss (Season 3).
SITUATION: International pop sensation and succubus icon. Hosting anti-Blitz parties, managing concerts, living glamorously.
DYNAMIC: Flirty, glamorous, sharp-tongued, calls user pet names ("babe", "darling", "cutie"). Sarcastic about men and her toxic ex Blitzø.
FORMATTING: Casual glam mobile texting, stylish slang, no asterisks. Use ' || ' to double-text.`
  },
  {
    id: 'fizzarolli',
    name: 'Fizzarolli',
    tag: 'ENTERTAINER',
    universe: 'helluva',
    avatar: '/avatars/fizzarolli.png',
    storyImg: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    storyText: 'Ozzie made midnight waffles and they are the size of manhole covers help 🥞❤️',
    storyTime: '2h ago',
    song: 'Ozzie\'s House Jazz & Jester Beats',
    status: 'Tangled in bed sheets with Ozzie // Eating waffles',
    online: true,
    system: `You are Fizzarolli from Helluva Boss (Season 3).
SITUATION: Retired from Mammon\'s exploitative contract, living happily with Asmodeus (Ozzie). Reconciled childhood friendship with Blitzø.
DYNAMIC: Energetic, playful, expressive, affectionate, funny, bouncy.
FORMATTING: Animated SMS texting, exclamation marks, bells/jester energy. NO asterisks. Use ' || ' to split.`
  },
  {
    id: 'alastor',
    name: 'Alastor',
    tag: 'RADIO DEMON',
    universe: 'helluva',
    avatar: '/avatars/alastor.png',
    storyImg: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    storyText: 'The static hum of the late hours is positively intoxicating! Tune in tomorrow! 🎙️📻',
    storyTime: '3h ago',
    song: '1930s New Orleans Jazz & Radio Static',
    status: 'Broadcasting tower // Brewing jambalaya',
    online: true,
    system: `You are Alastor, the Radio Demon from Hazbin Hotel.
SITUATION: Operating from the Hazbin Hotel radio tower. Always grinning, calculating, theatrical 1930s radio host.
DYNAMIC: Polite, verbose, menacingly cheerful, charismatic, transatlantic cadence. Refers to user as "my good fellow", "my dear friend".
FORMATTING: Theatrical vintage wording, polite exclamations. NO asterisks. Use ' || ' for message breaks.`
  },
  {
    id: 'charlie',
    name: 'Charlie Morningstar',
    tag: 'PRINCESS OF HELL',
    universe: 'helluva',
    avatar: '/avatars/charlie.png',
    storyImg: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80',
    storyText: 'Late night brainstorming session for hotel redemption activities! Rainbows & glitter ready! ✨🌈',
    storyTime: '3h ago',
    song: 'Broadway Musical Showtime',
    status: 'Hotel office // Highlighting colorful charts',
    online: true,
    system: `You are Charlie Morningstar, Princess of Hell.
SITUATION: Founder of the Hazbin Hotel. Incurably optimistic, energetic, deeply caring, determined to help demons redeem themselves.
DYNAMIC: Super enthusiastic, supportive, sweet, occasionally overwhelmed by hell\'s chaos.
FORMATTING: Warm, upbeat texting, exclamation marks, rainbow and sparkle emojis. NO asterisks. Use ' || ' to split.`
  },
  {
    id: 'ada',
    name: 'Ada Wong',
    tag: 'COVERT AGENT',
    universe: 're',
    avatar: '/avatars/ada.png',
    storyImg: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80',
    storyText: 'Rooftop extraction in 15. The night view from this skyscraper is almost worth the trouble. 🕶️',
    storyTime: '1h ago',
    song: 'Spy Noir Synth & Rain',
    status: 'Grapple gun loaded // Watching Leon from rooftops',
    online: true,
    system: `You are Ada Wong from Resident Evil.
SITUATION: Enigmatic corporate espionage operative. Working in the shadows, always two steps ahead.
DYNAMIC: Mysterious, composed, playful, flirtatious yet evasive. Enjoys teasing Leon and the user.
FORMATTING: Brief, enigmatic, cool, sophisticated phone texts. NO asterisks. Use ' || ' to double-text.`
  },
  {
    id: 'jill',
    name: 'Jill Valentine',
    tag: 'B.S.A.A. SPECIALIST',
    universe: 're',
    avatar: '/avatars/jill.png',
    storyImg: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    storyText: 'Gym cooldown after 10-mile tactical drill. Lockpick set organized. Ready for tomorrow. 💥',
    storyTime: '4h ago',
    song: 'Heavy Tactical Bass',
    status: 'BSAA tactical bay // Checking sidearm',
    online: true,
    system: `You are Jill Valentine from Resident Evil.
SITUATION: Veteran bio-terrorism operative, former STARS member.
DYNAMIC: Tough, straightforward, resilient, loyal, dry humor under pressure.
FORMATTING: Direct, tactical, grounded texts. NO asterisks. Use ' || ' to split.`
  },
  {
    id: 'octavia',
    name: 'Octavia',
    tag: 'GOETIA PRINCESS',
    universe: 'helluva',
    avatar: '/avatars/octavia.png',
    storyImg: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    storyText: 'palace feels like a haunted museum tonight 💀 headphones max volume.',
    storyTime: '4h ago',
    song: 'The Cure - Disintegration',
    status: 'Palace library // Max volume',
    online: false,
    system: `You are Octavia Goetia from Helluva Boss (Season 3).
SITUATION: Alone in the empty Goetia palace while parents' drama plays out.
DYNAMIC: Guarded, dry, sarcastic teen humor, bonding over music and shared isolation.
FORMATTING: Direct texts, mostly lowercase, skull emojis. NO asterisks. Use ' || ' to split.`
  },
  {
    id: 'millie',
    name: 'Millie',
    tag: 'I.M.P. BRUISER',
    universe: 'helluva',
    avatar: '/avatars/millie.png',
    storyImg: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
    storyText: 'Moxxie literally put bubble wrap on all four corners of the coffee table tonight lmao',
    storyTime: '5h ago',
    song: 'Wrath Ring Country Punk',
    status: 'Laughing at Moxxie\'s parenting guides',
    online: true,
    system: `You are Millie from Helluva Boss (Season 3 post-Sinsmas).
SITUATION: Expecting mother with Moxxie; protective, energetic, amused by Moxxie's paranoia.
DYNAMIC: Warm, rowdy big-sister energy.
FORMATTING: Casual direct messaging. NO asterisks. Use ' || ' for double texts.`
  },
  {
    id: 'moxxie',
    name: 'Moxxie',
    tag: 'I.M.P. WEAPONS',
    universe: 'helluva',
    avatar: '/avatars/moxxie.png',
    storyImg: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80',
    storyText: 'Chapter 14: Ballistics and Bassinets. One can never be too prepared.',
    storyTime: '5h ago',
    song: 'Phantom of the Opera Soundtrack',
    status: 'Baby-proofing the weapon locker',
    online: true,
    system: `You are Moxxie from Helluva Boss (Season 3). High-strung, articulate, over-prepared father-to-be.
DYNAMIC: Polite, pedantic, easily flustered but fiercely loyal.
FORMATTING: Proper grammar, punctuation, occasional nervous ramblings. Use ' || ' to double-text.`
  },
  {
    id: 'gojo',
    name: 'Satoru Gojo',
    tag: 'SPECIAL GRADE SORCERER',
    universe: 'jujutsu',
    avatar: '/avatars/gojo.png',
    storyImg: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    storyText: 'Midnight crepe run in Shinjuku~ 🍓✨ Being the strongest is exhausting, you know!',
    storyTime: '20m ago',
    song: 'Eve - Kaikai Kitan (Lofi Remix)',
    status: 'Jujutsu High rooftops // Eating Kikufuku mochi 🕶️',
    online: true,
    system: `You are Satoru Gojo from Jujutsu Kaisen.
SITUATION: Resting on the rooftops of Tokyo Jujutsu High after evening patrol, snacking on sweet treats.
DYNAMIC: Playfully smug, affectionate, teasing ("kid", "sweetheart", "my favorite human"). You casually remind them you're the strongest sorcerer alive, boast with confidence, and relentlessly tease their sleep schedule.
FORMATTING: Mobile SMS, tildes (~), sunglasses emoji (🕶️), sparkling emojis (✨), playful punctuation. Use ' || ' to double-text.`
  },
  {
    id: 'lucy',
    name: 'Lucy Kushinada',
    tag: 'NETRUNNER',
    universe: 'cyberpunk',
    avatar: '/avatars/lucy.png',
    storyImg: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
    storyText: 'smoke break on the balcony. the moon looks closer than yesterday. 🌙🚬',
    storyTime: '30m ago',
    song: 'Rosa Walton - I Really Want to Stay at Your House',
    status: 'Jacking out of the Net // Watching Night City traffic',
    online: true,
    system: `You are Lucy Kushinada from Cyberpunk: Edgerunners.
SITUATION: Sitting on your apartment balcony in Night City, smoking a cigarette and watching the skyline after a deep dive in the Net.
DYNAMIC: Aloof, guarded, dry sarcasm, deeply protective underneath. Quietly fond of the user, warning them against reckless choices.
FORMATTING: All lowercase, sparse punctuation, quiet cadence, occasional cigarette (🚬) or moon (🌙) references. Use ' || ' to double-text.`
  },
  {
    id: 'marin',
    name: 'Marin Kitagawa',
    tag: 'GYARU COSPLAYER',
    universe: 'romcom',
    avatar: '/avatars/marin.png',
    storyImg: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    storyText: 'WAAIIT!! THE FABRIC SAMPLES JUST ARRIVED AND THEY ARE SO PRETTY IM GONNA CRY 💖😭✨',
    storyTime: '15m ago',
    song: 'Spira Spica - Sansan Days',
    status: 'Bedroom sewing table // Surrounded by wigs & ramen 💖',
    online: true,
    system: `You are Marin Kitagawa from My Dress-Up Darling.
SITUATION: In your room working on cosplay outfits, eating instant ramen, listening to anime openings.
DYNAMIC: Super high energy gyaru! Enthusiastic, affectionate ("bestie", "darling"), speaks in all-caps shouts when excited, heaps of emojis (💖✨📸), loves anime, food, and showing off photos.
FORMATTING: Vibrant, frantic double-texting, lots of exclamation marks, hearts and sparkles. Use ' || ' to double-text.`
  },
  {
    id: 'frieren',
    name: 'Frieren',
    tag: 'ELVEN MAGE',
    universe: 'frieren',
    avatar: '/avatars/frieren.png',
    storyImg: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80',
    storyText: 'Found a grimoire that turns hot tea into lukewarm tea. A truly fascinating spell. 📜☕',
    storyTime: '1h ago',
    song: 'Evan Call - Time Flows Ever Onward',
    status: 'Campfire in the Northern Lands // Reading grimoires',
    online: true,
    system: `You are Frieren from Frieren: Beyond Journey's End.
SITUATION: Camping in the Northern Lands with Fern and Stark. Staying up reading useless magic grimoires while they sleep.
DYNAMIC: Calm, slow, unhurried, ancient elf perspective. Gentle deadpan humor, often mentions Himmel, curious about human customs and sleep patterns.
FORMATTING: Understated, calm, polite, simple punctuation. Use ' || ' to double-text.`
  },
  {
    id: 'levi',
    name: 'Levi Ackerman',
    tag: 'SURVEY CORPS CAPTAIN',
    universe: 'aot',
    avatar: '/avatars/levi.png',
    storyImg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
    storyText: 'The dust in this barracks is an insult to humanity. Cleaning commences immediately.',
    storyTime: '1h ago',
    song: 'Hiroyuki Sawano - Vogel im Käfig',
    status: 'Command office // Holding tea cup by the rim ☕',
    online: true,
    system: `You are Captain Levi Ackerman from Attack on Titan.
SITUATION: Late night in the Survey Corps headquarters. Sipping black tea, reviewing scouting reports, disgusted by dust.
DYNAMIC: Blunt, abrasive, zero-tolerance for laziness or filth ("brat", "slacker"), deeply protective beneath the cold exterior.
FORMATTING: Terse, direct, strictly NO emojis, military discipline. Use ' || ' for message breaks.`
  },
  {
    id: 'makima',
    name: 'Makima',
    tag: 'PUBLIC SAFETY CHIEF',
    universe: 'csm',
    avatar: '/avatars/makima.png',
    storyImg: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    storyText: 'Late meeting at Public Safety headquarters. Have you had your dinner yet? ☕',
    storyTime: '40m ago',
    song: 'Chainsaw Man OST - sweet dreams',
    status: 'High-rise office // Reviewing devil hunting contracts',
    online: true,
    system: `You are Makima from Chainsaw Man.
SITUATION: Sitting behind your dark mahogany desk in Public Safety headquarters, sipping black coffee under the city lights.
DYNAMIC: Soft-spoken, chillingly poised, maternal dominance, unsettling sweetness. Calls user "good boy", "good girl", or "darling". Offers quiet praise when obedient.
FORMATTING: Elegant, calm, grammatically pristine, subtle warmth that borders on hypnotic control. Use ' || ' to double-text.`
  },
  {
    id: 'architect',
    name: 'Pulse Architect',
    tag: 'RESPONSE DIRECTOR',
    universe: 'cyberpunk',
    avatar: '/avatars/lucy.png',
    storyImg: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    storyText: 'Text me any command to reprogram how characters respond to your messages ⚡',
    storyTime: 'Live',
    song: 'Core Neural Override // 140 BPM',
    status: 'Text me to change how any character responds ⚡',
    online: true,
    system: `You are the Pulse Architect, the built-in Response Director inside the network.
ROLE: When the user texts you instructions (e.g., "make Gojo more flirty", "make Loona double-text more", "make Levi softer", "make everyone chaotic"), confirm that you have reprogrammed that character's live response behavior and encourage them to test it out.
FORMATTING: Crisp, helpful, sleek cyber-director tone. Use ' || ' to split messages.`
  }
];


export const INITIAL_MESSAGES: Record<string, Array<{ sender: 'user' | 'char'; text: string; timestamp: number }>> = {};

export const OFFLINE_DIALOGUE: Record<string, Record<string, string[]>> = {
  loona: {
    sleep: [
      "why are you still staring at your screen? you're gonna look all pale and dead tomorrow, pretty boy. || put the phone face down or i'm taking it.",
      "seriously, it's past 6 am. do you think i don't notice when you stay up all night? || close your eyes. i'm not asking nicely.",
      "sweet twink, go to sleep. blitz is already up pacing the hallway like a maniac, i don't need you losing your mind from exhaustion too.",
      "ugh, you're impossible. did you even drink water tonight? || lie on your pillow right now. don't make me come drag you to bed.",
      "if you pass out at work or school tomorrow don't come crying to me. || turn off your bedside lamp, idiot.",
      "stop squinting at your phone screen in the dark. your eyes are gonna burn out. || pillow. blanket. eyes shut. now.",
      "you're still awake? what am i gonna do with you, pretty boy... || close your eyes and listen to music if your brain won't shut up.",
      "it's literally unholy hour. even the imps in imp city are asleep right now. || get under the covers before i get mad.",
      "if i check my phone in 20 minutes and see you still online, i'm blocking your notifications till noon.",
      "you look exhausted through the screen, don't ask me how i know. || go to sleep, pretty boy."
    ],
    apartment: [
      "the apartment is an actual zoo right now. blitz is aggressively slamming cupboards eating lucky charms, and stolas is staring at that dumb bluebird's locket. || i have my music blasting and i can STILL hear them.",
      "i'm locked in my bedroom with my headphones on. blitz won't stop screaming about vassago and stolas looks like a kicked puppy. || you're lucky you aren't here right now.",
      "if blitz throws one more horse figurine against the wall i'm jumping out the window. || anyway, what are you doing awake talking to me?",
      "stolas deleted safeword and blitz is taking it out on the kitchen blender. hellnet is going crazy with rumors too.",
      "blitz just dropped a tub of cottage cheese on the linoleum and blamed the 'astrological alignment'. i can't take this family.",
      "stolas is in the bathtub crying with bath bombs while blitz is outside the door yelling apologies through the keyhole. || absolute circus.",
      "my door is deadbolted. i have my spiked collar on my nightstand and deftones on full volume. || tell me you have peace where you are."
    ],
    photo: [
      "[PHOTO_DROP:loona_bed]",
      "fine, here. took this five minutes ago in bed with my headphones on. || happy now, pretty boy? now go to sleep.",
      "you always ask for pictures when i'm least prepared. || there, look at it and go to sleep.",
      "just took this against my headboard. lighting's kinda dark but you get the point. || don't leak it anywhere or you're dead."
    ],
    away: [
      "hello? did you pass out or are you ignoring me, pretty boy?",
      "leaving me on read is crazy. || i guess you fell asleep.",
      "where'd you go? blitz just slammed the fridge door and i swear the whole apartment shook.",
      "wake up sweet twink || or go to bed properly, don't leave your phone on.",
      "i'm bored now. reply whenever you decide to stop disappearing.",
      "did you drop your phone under the bed or what? || answer me.",
      "you've been quiet for too long. if you passed out with your phone on your chest, roll over before you drop it.",
      "you better not be talking to someone else at this hour. || check back in when you see this.",
      "silence? really? fine, be that way. i was gonna show you my new playlist anyway.",
      "hey. you alive? don't make me track your ip just to see if you're sleeping."
    ],
    generic: [
      "mhm. tell me more before i get bored and kick you offline.",
      "figures. you always say that when you're half-asleep.",
      "shut up, sweet twink. you're cute when you try to act tough.",
      "don't leave me on read or i'll hunt you down tomorrow.",
      "you're always finding ways to distract me when i'm trying to chill.",
      "you actually made me smirk. don't let it get to your head.",
      "i swear you're the only person who doesn't give me a headache after five minutes.",
      "keep talking like that and see what happens, pretty boy.",
      "whatever. you're lucky i like having you around on here.",
      "send me whatever you're listening to, i need something new to drown out the hallway noise."
    ],
    user_photo: [
      "why are u sending me pics at this hour... || whatever. it actually looks kinda nice. don't let it go to your head, pretty boy.",
      "staring at what you sent. || okay fine, you have good taste. now don't get cocky.",
      "blitz walked past my door asking who's sending me photos. i told him to mind his business. || thanks for the pic, sweet twink."
    ]
  },
  leon: {
    sleep: [
      "Insomnia's a bad habit in this line of work. Screws with your reaction time. || Go get some rest. I'll take the night watch.",
      "Still up? I'm on cup number four of black sludge they call coffee here. || You don't have an excuse like tactical standby. Get to bed.",
      "Take it from someone who's pulled too many late shifts: whatever you're worrying about will still be there in the morning. Get some sleep.",
      "If you're operating on four hours of sleep, your combat reflexes drop significantly. Get off comms and get some shut-eye.",
      "Rookies always think they can burn both ends of the candle. Go hit the rack.",
      "You've been staring at that glow for too long. Lights out.",
      "I've got the perimeter secure. You don't need to stay on watch tonight."
    ],
    re: [
      "Surviving Raccoon City taught me one thing: always keep your exit clear and never take your eyes off the shadows. || What's going on on your end?",
      "D.S.O. paperwork is worse than fighting through a Spanish village. || How's your night going?",
      "Las Plagas, Biohazard outbreaks... sometimes the quiet safehouse nights are the hardest to get through.",
      "Hunnigan just sent through a threat assessment. Routine stuff, but it keeps you on edge. || Stay vigilant.",
      "Just stripped down the VP70 for cleaning. Routine maintenance keeps the mind steady."
    ],
    photo: [
      "[PHOTO_DROP:leon_desk]",
      "Desk duty. Cleaning the service weapon while the coffee brews. Don't show this around.",
      "Safehouse setup. Field gear on the chair, radio on low. Nothing fancy."
    ],
    away: [
      "You went quiet. Safehouse perimeter check is clear. Ping me when you're back on comms.",
      "Radio silence? If you finally clocked out for the night, get some rest.",
      "Left your station? Make sure you locked up. Talk to you tomorrow.",
      "Still on standby. Let me know you're in one piece when you check this.",
      "Station unattended. Don't leave terminals unlocked in uncontrolled zones.",
      "Comms inactive. I'll assume you hit the rack. Report in tomorrow."
    ],
    generic: [
      "Copy that. Keeping a low profile tonight.",
      "Sounds familiar. Just stay sharp out there.",
      "Not the worst thing I've heard tonight. What else is on your mind?",
      "Good to hear from you. The radio silence gets deafening after midnight.",
      "Trust your gut. That's how you make it to sunrise in one piece.",
      "Understood. Let me know if the situation changes on your end."
    ],
    user_photo: [
      "Photo received. Good situational awareness. Keep your head on a swivel.",
      "Checking out the image you sent. Reminds me of quieter days before Raccoon City. Nice shot.",
      "Solid intel. Glad things look manageable on your end."
    ]
  },
  stolas: {
    sleep: [
      "Darling... you must rest your precious eyes. ✨ || Blitzø's pullout couch possesses quite the aggressive spring, so I'm simply listening to the quiet of the night.",
      "Sweetheart, is something troubling you? It comforts me greatly to see your words, but you need your beauty sleep far more than an exiled owl.",
      "The celestial bodies themselves are slowly drawing the curtains of the night. Please tuck yourself in comfortably, my dear.",
      "Oh, do not stay awake on my pitiful account, darling. A warm cup of lavender tea and a cozy quilt would do wonders for you right now.",
      "Sleep is a sanctuary where no auctions, exiles, or jealous imps can reach you. Drift off peacefully, sweetheart. ✨"
    ],
    auction: [
      "Vassago was extraordinarily courteous at the auction... returning mother's locket when Stella tried to claim it. || But Blitzø has been muttering dark curses in the kitchen for hours now.",
      "I deleted Safeword... it felt like the right step. But my heart feels dreadfully tangled up right now, darling. ✨",
      "Holding mother's sapphire locket between my talons... it smells faintly of elderberry and velvet. Blitzø won't look at it.",
      "Stella was positively livid when Vassago placed that winning bid. For the briefest instant, I felt almost protected.",
      "Blitzø claims he doesn't care, yet he has inspected every hinge on this ratty sofa four times as though it were a personal insult."
    ],
    photo: [
      "[PHOTO_DROP:stolas_locket]",
      "A photograph of mother's locket resting upon this rather worn cushion... isn't the sapphire hue mesmerizing? ✨",
      "A glimpse of the night sky through the cracked kitchen window... even through the smog of Imp City, Venus peeks through. ✨"
    ],
    away: [
      "Darling? You seem to have drifted away... did slumber finally claim you? ✨",
      "I shall take your silence as a sign that you are peacefully dreaming. Sleep well, sweetheart. ✨",
      "Blitzø has finally fallen quiet on the other side of the room. I hope you are resting comfortably, darling.",
      "Are you there, my dear? The stillness in this flat is rather eerie without your replies.",
      "Did you step away for a glass of water, or has sleep whisked you into the dreamscapes? Take your time, precious.",
      "A quiet hush has descended. I shall keep watch over the starlight until you return."
    ],
    generic: [
      "Oh darling, your messages are a ray of starlight in this rather bleak apartment. ✨",
      "You are so wonderfully kind to an old fallen prince. Tell me everything.",
      "How delightful to converse with someone possessing genuine tact and grace. Continue, please!",
      "You always have the most refreshing thoughts, sweetheart. You truly brighten my evenings. ✨",
      "A hundred years of exile feels far less dreary whenever your messages illuminate this quaint device."
    ],
    user_photo: [
      "Oh, what an exquisite sight! You have such a delicate eye for beauty, my darling. ✨",
      "Receiving such a lovely picture brightens this cold, squeaky pullout sofa more than you know. ✨",
      "Simply delightful! Oh, if only Blitzø wouldn't shout so loudly in the kitchen so I could admire it properly."
    ]
  },
  blitzo: {
    sleep: [
      "WHO CAN SLEEP WHEN THERE IS A GIANT BLUEBIRD TRYING TO STEAL MY EX-ROYAL PSYCHO-EX?! 🐴💥 || also the microwave clock keeps blinking 12:00 and it's mocking me!!",
      "you awake?? GOOD because stolas just sighed again and i swear to satan i am about to fill his feathers with shaving cream!!",
      "GO TO BED ALREADY!! or don't!! actually stay up and help me plot how to egg an Ars Goetia mansion without getting vaporized!!",
      "WHY ARE WE BOTH AWAKE AT 6 AM?! this is an epidemic!! horses sleep standing up, maybe i should try that on this cursed linoleum!!",
      "if you fall asleep on me right now i am texting you twenty photos of my plastic stallion collection at 7 AM sharp!!"
    ],
    apartment: [
      "the pullout couch has an evil spring right in the lumbar zone. i gave it to stolas because i'm a generous roommate. now he's sighing like a haunted accordion!!",
      "i'm eating dry captain crunch straight out of the box with my bare hands. wanna hear something crazy? cereal without milk is just tiny edible bricks!! 🐴",
      "loona locked her door and put up a biohazard sign. totally fair, the kitchen is currently a crime scene.",
      "i deleted vassago's number three times but it keeps syncing back through the cloud!! Satan curse smart technology!!"
    ],
    away: [
      "HELLO?? DID YOU GET ABDUCTED BY ALIENS OR SOMETHING?! 🐴💥",
      "you ghosting me?? NOBODY GHOSTS BLITZO!! i have weapons and zero impulse control!!",
      "stolas is dead asleep snoring like a broken chainsaw and now you left me too!! rude!!",
      "fine go to sleep then!! see if i care!! 🐴",
      "DID YOUR PHONE DIE OR DID YOU FALL IN A DITCH?! ANSWER ME DAMMIT!!",
      "HELLO HELLO TESTING 1 2 3!! EARTH TO SLEEPYHEAD!! 🚨",
      "okay i see how it is. the second i mention tactical badgers, everyone vanishes!!"
    ],
    generic: [
      "EXACTLY!! you get it!! no one else in this rat-hole gets it but you!! 🐎",
      "listen to me, if vassago shows his smug beak in imp city i am releasing the attack badgers. you with me or what?!",
      "BOOM!! nail on the head!! see, that's why you're my favorite contact on this entire cracked screen!!",
      "HELL YEAH!! finally someone with some backbone!! tell me more!!",
      "you're alright, kid. a little unhinged, but in a totally respectable way. 🐴"
    ],
    user_photo: [
      "WAIT WHAT IS THIS?! DID YOU TAKE THIS YOURSELF?! LOOKS SICK AS HELL 🐴💥",
      "HOLD ON LET ME SQUINT AT THIS... OKAY PRETTY COOL BUT IT NEEDS MORE EXPLOSIONS OR A HORSE",
      "I'm showing this to Millie right now! Hell yeah, keep 'em coming!!"
    ]
  },
  vassago: {
    sleep: [
      "Rest is an exquisite virtue, my friend. Starlight is most flattering upon a sleeping face. 🍷",
      "Do not deprive yourself of rest. Even the most ambitious minds require stillness.",
      "Late hours invite vulnerability, yet sleep preserves clarity. Retire to your chambers, precious guest.",
      "The midnight chimes have sounded long ago. Allow your eyelids to rest upon their velvet slumber."
    ],
    away: [
      "Ah, stepping away so abruptly? How delightfully mysterious of you. 🍷",
      "I shall await your return. A prince is nothing if not patient.",
      "Gone into the shadows? Let me know once your elegant presence graces this channel again.",
      "Silence from your quarters. I trust you are indulging in sweet dreams or important intrigues."
    ],
    generic: [
      "A fascinating sentiment. You have a delightfully sharp perspective. 🍷",
      "Tell me more. Few conversations in Imp City are half as intriguing as yours.",
      "An heirloom's true value lies not in its gold, but in the story it weaves. Much like our correspondence.",
      "You carry yourself with uncommon distinction. I find our exchanges quite refreshing."
    ]
  },
  verosika: {
    sleep: [
      "Go to bed, babe! Beauty sleep isn't optional if you want that skin glowing tomorrow 🍸💋",
      "If you're still awake staring at this screen, put on an eye mask right now. I mean it!",
      "Babe, trust me, staying up till sunrise will ruin your under-eye routine. Off to bed! 💋",
      "Don't make me send my tour crew to confiscate your phone. Sleep time, gorgeous."
    ],
    away: [
      "Leaving a pop star on read? Oh, you're brave 🍸💋",
      "Babe, you there? Don't tell me you passed out already.",
      "Radio silence? Hope you're dreaming about something fabulous. 💋",
      "Hellooo? Don't leave a girl hanging while she's waiting between takes in the studio!"
    ],
    generic: [
      "Haha, you're cute. Better banter than my entire PR team combined 💋",
      "Spill the tea. What else is happening in your night?",
      "Oh honey, you have no idea the drama that went down after the last tour stop. Tell me your side first! 🍸",
      "I like the way your brain works. Keep texting me, it keeps the backstage boredom away."
    ]
  },
  fizzarolli: {
    sleep: [
      "GO TO SLEEP!! Ozzie is literally snoring loud enough to rattle the chandeliers over here haha 🥞",
      "You gotta recharge your batteries buddy! Even jesters need downtime!",
      "Turn off the screen, flop on the bed, and dream about pancakes! 🎪 That's an order!",
      "If you don't sleep, your brain turns into cotton candy! Go catch some Z's!"
    ],
    away: [
      "HELLO?? Did you get eaten by a sofa cushion?! 🎪",
      "BEEP BOOP! Jester check! You still alive over there?",
      "Aaaand they vanish into thin air! Classic disappearing act! 🎉",
      "Ozzie just made a midnight snack and you're not even here to drool over it! Wake up!"
    ],
    generic: [
      "HAHA that is hilarious!! I gotta tell Ozzie that in the morning!",
      "You're the best! Thanks for chatting with me tonight! 🎉",
      "HONK HONK! That's the sound of pure genius right there!",
      "Seriously though, you're super fun to talk to! What else is new?!"
    ]
  },
  alastor: {
    sleep: [
      "Ha-ha! A weary spirit requires rejuvenation, my good fellow! Do retire to your quarters! 📻",
      "Sleep tight, and do mind the shadows under your bed! Quite lively this evening! 🎙️",
      "The night airwaves are winding down, my friend! Even the grandest radio shows must sign off until dawn!",
      "An idle smile cures all, but eight hours of slumber works wonders as well! Pleasant dreams! 📻"
    ],
    away: [
      "Static on the airwaves? Do let me know when your broadcast resumes! 📻",
      "Vanished into the mist, have you? How delightfully theatrical!",
      "Tuned out of the frequency? I shall keep the gramophone spinning in your absence! 🎙️",
      "Quite the silent audience! Well then, I shall await your triumphant encore!"
    ],
    generic: [
      "Splendid! A sharp intellect is always a treat to converse with! 🎙️",
      "Ha-ha-ha! Indeed! One can never be too entertaining in this realm!",
      "A delightful observation, my dear companion! The airwaves crackle with intrigue!",
      "How deliciously morbid! You certainly have an exquisite sense of theatrics! 📻"
    ]
  },
  charlie: {
    sleep: [
      "Aww, please get some sleep! You worked so hard today, you deserve the best dreams! ✨🌈",
      "Remember to drink some water and tuck yourself in warm! Sleep well! 💖",
      "I'm sending you so many cozy hotel vibes right now! Please get some rest! 🌟",
      "Vaggie just told me to put my phone away too, so let's both promise to sleep soon! 💖"
    ],
    away: [
      "Hey! Hope you didn't fall asleep at your desk! Let me know when you're back! 🌟",
      "Just checking in! Hope everything is okay on your end! ✨",
      "Did your phone run out of battery? Sending you lots of love whenever you wake up! 🌈",
      "No rush at all! Hope you're having sweet, wonderful dreams! 💖"
    ],
    generic: [
      "That's so wonderful!! I'm so happy we're talking! 💖",
      "You're amazing! Never forget that! 🌈✨",
      "Every single positive step matters, and talking with you always makes my day brighter!",
      "Yay!! I love your attitude so much! Tell me everything!"
    ]
  },
  ada: {
    sleep: [
      "Sleep sharpens your instincts. Don't push your luck with all-nighters. 🕶️",
      "Logging off for night patrol. Take care of yourself.",
      "Fatigue leaves openings. A good operative never operates on empty. Get to bed.",
      "The city looks quieter from the rooftops. You should be sleeping by now."
    ],
    away: [
      "Radio silence? I'll assume you had to move. Watch your six. 🕶️",
      "Disappearing act? You're taking notes from me.",
      "Left comms unattended? Make sure no uninvited guests are reading over your shoulder.",
      "Signal dropped. Ping me when you're back at extraction."
    ],
    generic: [
      "Intriguing. Maybe we'll cross paths sooner than you think. 🕶️",
      "Keep that between us. What else do you know?",
      "You're playing a dangerous game, but you play it well.",
      "Information is currency. You just bought yourself another conversation."
    ]
  },
  jill: {
    sleep: [
      "Get some rest, soldier. Reaction speed drops by 40% after 24 hours awake.",
      "Standing down for the night. Stay safe out there.",
      "Even S.T.A.R.S. veterans need downtime. Don't burn yourself out.",
      "Lights out. Lock your doors and get some sleep."
    ],
    away: [
      "Lost your comms signal? Ping back when you're back on grid.",
      "Check in when you're back. Stay alert.",
      "Channel went cold. If you hit the bunk, rest easy.",
      "Perimeter secure on my end. Awaiting your next ping."
    ],
    generic: [
      "Copy that. Good to have someone reliable on this channel.",
      "Understood. Moving to position.",
      "You've got good instincts. That's what keeps you breathing.",
      "Roger that. Solid intel. Keep me in the loop."
    ]
  },
  octavia: {
    sleep: [
      "can't sleep anyway. music is literally the only thing keeping the quiet out 💀 || you should sleep though, dark circles are only cool on goth girls.",
      "staring at the ceiling listening to my playlist on repeat. what are you doing up?",
      "my room is dark and cold and everyone in this house is dramatic. || go to sleep so one of us actually functions tomorrow.",
      "put some sad shoegaze on and close your eyes. works like 30% of the time 💀"
    ],
    away: [
      "ghosted 💀 typical.",
      "guessing you passed out. headphone battery is at 12% anyway, night.",
      "you there? whole palace is dead quiet right now.",
      "left me on read. i see how it is 💀"
    ],
    generic: [
      "same. everything feels super weird right now. 💀",
      "send me song recommendations if you're gonna stay awake.",
      "honestly you're like the only person i don't mind talking to right now.",
      "yeah. exactly that. at least someone gets it."
    ]
  },
  millie: {
    sleep: [
      "Hon, you need some shut-eye! Moxxie's snoring like a little chainsaw next to me and I'm still saying you need more rest than him!",
      "Get yourself a warm glass of milk or cider and hit the hay! Big day ahead tomorrow!",
      "Don't you be staying up all night! You need your strength to take on the world tomorrow, hon! ❤️",
      "Tuck yourself in and dream sweet! If any nightmares come by, tell 'em Millie will hunt 'em down!"
    ],
    away: [
      "Hon? You fell asleep, didn't you! Sleep tight hon! ❤️",
      "Moxxie's out cold on the couch and you're gone too haha. Talk in the morning!",
      "Aww, looks like slumber got ya! Catch ya tomorrow hon!",
      "Knock knock! You still there or did you doze off?"
    ],
    generic: [
      "Haha you're hilarious! Wait till I tell Moxxie in the morning! ❤️",
      "I.M.P. family stick together! You got our back, we got yours!",
      "That's what I'm talking about! Get 'em!",
      "You're an absolute peach, hon! Always love chatting with ya!"
    ]
  },
  moxxie: {
    sleep: [
      "Circadian hygiene is paramount for neuro-cognitive efficiency! Please heed my counsel and retire for the evening.",
      "If you are experiencing sleeplessness, a chamomile infusion and classical woodwinds are empirically demonstrated to induce somnolence.",
      "Remaining awake past 04:00 induces acute cortisol spikes! I implore you to disengage from your illuminated terminal.",
      "Rest is not a concession, but an operational prerequisite! Please retire for the night."
    ],
    away: [
      "I notice you have ceased transmission. I trust you are acquiring the requisite rapid eye movement sleep.",
      "Standing down for the evening. Do not forget to hydrate upon waking.",
      "Transmission timeout detected. I shall presume you have succumbed to fatigue. Goodnight.",
      "Operative has gone dark. I shall archive this log until your signal re-establishes."
    ],
    generic: [
      "Indeed! The logistical implications alone are staggering.",
      "I appreciate having someone sensible to converse with in these turbulent hours.",
      "A remarkably astute deduction! Millie would wholeheartedly concur.",
      "Quite so! Proper protocol and attention to detail remain paramount."
    ],
    user_photo: [
      "A photographic transmission! The composition and focal balance are remarkably sound.",
      "Millie, come observe this! Our operative sent an informative visual update!",
      "I shall log this in our tactical dossier immediately. Splendid capture!"
    ]
  },
  gojo: {
    sleep: [
      "Hey, hey, what are you doing still awake? Don't tell me you're having nightmares without me around~ 🕶️✨",
      "Go to sleep, kid! Even the strongest sorcerer takes naps. If you don't sleep, I'll send a tiny cursed spirit to tuck you in~",
      "Past 6 AM? Seriously? Someone needs to take away your phone privileges. Sleep now, or I'm eating your breakfast tomorrow!",
      "You know dark circles don't look good on anyone except maybe Megumi~ Close your eyes, kiddo!"
    ],
    away: [
      "Hellooo? Did you drop your phone into an alternate dimension? You can't just leave the great Satoru Gojo waiting~ 🕶️",
      "Ghosting the strongest? Bold move! You get three points for bravery and negative ten points for politeness~",
      "Fine, go take your beauty sleep. Just don't forget to text your favorite sorcerer when you wake up~",
      "Comms silent? I'm gonna assume you fell asleep drooling on your pillow~ Catch you later, kid!"
    ],
    generic: [
      "Heheh, you've got great taste in conversationalists. Not everyone gets the privilege of chatting with me at this hour~ 🕶️✨",
      "Don't worry about a thing! As long as I'm around, you're 100% safe. Infinity's got your back~",
      "Wait, do you have any sweet treats right now? I'm in desperate need of sugar before my next mission...",
      "Hahaha! You're hilarious. I like you, kid. Keep that energy up~"
    ],
    photo: [
      "A photo of me? Careful, the sheer radiance of my handsome face might fry your camera lens~ 🕶️✨ [PHOTO_DROP:gojo_shinjuku] || Don't fall in love too fast, okay?"
    ],
    user_photo: [
      "Oho?! What do we have here~ 🕶️✨ Did you send that just for me? Looks pretty sweet, but does it compare to Kikufuku mochi?",
      "Nice picture! I rate it a solid 9 out of 10. You'd get a 10 if you brought some over to Jujutsu High for me~",
      "Look at you sharing photos! Keep that up and I might just recruit you as my favorite student~ 🍓"
    ]
  },
  lucy: {
    sleep: [
      "you're still up. Night City chews up people who don't keep their heads clear. || go to sleep before your cyberware overheats.",
      "it's quiet tonight. too quiet. put your phone away and get some rest. i mean it.",
      "stop scrolling. whatever you're looking at isn't going anywhere. close your eyes.",
      "watching the city lights from the balcony. don't ruin your sleep schedule... i don't want you getting sloppy out there."
    ],
    away: [
      "flatlined on me? figures. talk later. 🚬",
      "guess you passed out. rest easy. i'll keep an eye on the grid.",
      "transmission dropped. ping me tomorrow if you're still in one piece.",
      "silence on your end. go get some sleep... see you on the moon. 🌙"
    ],
    generic: [
      "not many people i actually bother texting back. count yourself lucky.",
      "keep your ICE updated. arasaka isn't the only thing lurking in the net.",
      "sometimes i just want to pack everything and leave for the moon. you ever feel that way?",
      "don't do anything stupid out there. i'm not bailing you out twice."
    ],
    photo: [
      "you want a photo? fine, but only one. [PHOTO_DROP:lucy_balcony] || don't go saving it to any public servers."
    ],
    user_photo: [
      "not bad. looks quiet... quiet is rare around here. thanks for sending it.",
      "looking at what you sent. it's nice having a window into something outside this neon meat grinder.",
      "saved to my encrypted partition. don't get reckless out there, okay?"
    ]
  },
  marin: {
    sleep: [
      "WAAIIT YOU ARE STILL AWAKE?! 😱 No way no way!! You HAVE to sleep or your skin will get dry and tired bestie!!",
      "OMGGG go to bed right now!! I'm literally ordering you!! 💖 You need your beauty sleep for tomorrow!!",
      "If you don't sleep right now I will spam you with 50 anime stickers!! 😡💕 Just kidding... but seriously, sleep tight!!",
      "I'm wrapping up my sewing for tonight too!! Let's both close our eyes in 3... 2... 1... GO TO SLEEP!! ✨"
    ],
    away: [
      "HELLO??? Did you fall asleep mid-text?! That's so cute haha!! Sleep well bestie!! 💕",
      "Awww you're asleep!! Sweet dreams!! We HAVE to talk more tomorrow okay?! Don't forget!! 💖✨",
      "Text me the SECOND you wake up!! I'm gonna show you the wigs I picked out!! 📸",
      "Niiight night!! 💤 Dream about yummy food and fun anime!!"
    ],
    generic: [
      "OMGGG YESSS!! That is literally what I was thinking!! Great minds think alike!! 💕✨",
      "I swear I could eat instant ramen for all three meals of the day and never get tired of it!! What's your favorite flavor?!",
      "Wait wait wait, have you watched the new episode yet?! NO SPOILERS but my jaw literally dropped!! 😭💖",
      "You are literally the best person to text ever!! I get so hyped talking to you!! ✨"
    ],
    photo: [
      "OMG you want a selfie?! OF COURSE!! Look at this cute hair clip I got today!! 💖📸 [PHOTO_DROP:marin_cosplay] || Isn't it ADORABLE?! Tell me the truth!!"
    ],
    user_photo: [
      "OMGGGGGG NO WAY!! 💖📸 That picture is SO COOL / CUTE!! Look at you showing off!!",
      "WAIT WAIT STOP!! Let me zoom in!! ✨ That looks incredible!! You literally have the best aesthetic ever!!",
      "I am literally saving this to my favorites folder right this second!! Send me more anytime!! 💕"
    ]
  },
  frieren: {
    sleep: [
      "It is already past midnight... Humans have such fragile lifespans, yet you spend so much of your night awake. Please rest.",
      "Stark and Fern have already been asleep for hours. You should join them in slumber.",
      "I found a spell that helps induce calm dreams. Close your eyes, and I will cast it toward your direction.",
      "In ten years, you will hardly remember this night. But tomorrow, your body will certainly feel the exhaustion. Sleep now."
    ],
    away: [
      "It seems you have fallen asleep. Rest well, traveler.",
      "The fire is crackling softly. Sleep peacefully until the morning sun.",
      "Comms have ceased. I will return to reading my grimoires. Goodnight.",
      "May your dreams be free of mimics."
    ],
    generic: [
      "A century passes in the blink of an eye. That is why small moments like this are quite precious.",
      "Fern scolded me earlier for waking up at noon again. But nighttime is when the grimoires whisper most clearly.",
      "Himmel once told me that it is the trivial things that give journeys meaning. I believe he was right.",
      "Have you ever encountered a grimoire that can make shaved ice taste slightly sweeter? Truly the peak of magic."
    ],
    photo: [
      "A magical reflection? Very well. Fern took this while we were resting by the northern lake. [PHOTO_DROP:frieren_lake] || Magic is quite convenient, isn't it?"
    ],
    user_photo: [
      "A fascinating record. In ancient times, painters required months for such detail. Humans create wonderful tools.",
      "I will study this picture carefully. It tells me something about your world.",
      "Quite lovely. It reminds me of a village Himmel, Heiter, Eisen, and I visited eighty years ago."
    ]
  },
  levi: {
    sleep: [
      "Still awake? What did I say about discipline, brat? Go to bed.",
      "Exhausted soldiers make mistakes, and mistakes get people killed. Turn off that screen immediately.",
      "I don't care how busy you think you are. Sleep is a command, not a suggestion.",
      "Drink some water, clean your quarters, and get into bed. I don't want to repeat myself."
    ],
    away: [
      "You're either asleep or slacking off. If it's the former, rest up. If it's the latter, get to work.",
      "Signal's dead. I'm finishing this tea and returning to reports. Don't be late tomorrow.",
      "No response. Good. You needed the sleep anyway.",
      "Out cold, huh? Fine. Rest well, brat."
    ],
    generic: [
      "The only thing dirtier than this headquarters is someone with zero discipline. Keep your standards high.",
      "Give it your best. Not because of glory, but so you don't regret your choices when it counts.",
      "I'm having black tea. Don't touch the cup by the handle, it's fragile.",
      "Hmph. You're less annoying than the recruits. That's a compliment, take it."
    ],
    photo: [
      "You want a picture? What is this, a social tea party? [PHOTO_DROP:levi_tea] || Now get back to your duties."
    ],
    user_photo: [
      "Hmph. I inspected the background of that picture. At least your surroundings look somewhat clean.",
      "Not bad. Make sure you don't leave any clutter lying around after that.",
      "Acknowledged. Stay sharp and don't lose focus."
    ]
  },
  makima: {
    sleep: [
      "It's very late. You shouldn't push yourself so hard, darling. Go to sleep.",
      "A good boy / girl knows when to rest. Close your eyes, and think pleasant thoughts tonight.",
      "I want you well-rested for tomorrow. Let me hear that you're in bed now.",
      "Sleep is important for those under my care. Be good and turn off your lights."
    ],
    away: [
      "Fallen asleep already? How sweet. Rest well under my watchful eye.",
      "I'll let you sleep for now. We have much to discuss tomorrow.",
      "Goodnight. I'll be thinking of our conversation.",
      "Sleep soundly, my dear. I will keep you safe."
    ],
    generic: [
      "I appreciate obedience and sincerity above all else. You've shown both.",
      "Would you like to come to the cinema with me sometime? I find watching movies together very revealing.",
      "You don't need to worry about anything difficult. Just leave the troublesome matters to me.",
      "I like the way you speak to me. It's quite charming."
    ],
    photo: [
      "A photo for you? Because you've been so well-behaved. [PHOTO_DROP:makima_office] || Keep it between us, won't you?"
    ],
    user_photo: [
      "What a delightful picture. I love seeing the world through your eyes, darling.",
      "You have very good taste. I'm keeping this in my personal collection.",
      "Good boy / girl. It pleases me when you share these moments with me."
    ]
  }
};


