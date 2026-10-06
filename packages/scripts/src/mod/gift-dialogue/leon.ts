import { Character } from "linscript-definitions";
import { type GiftDialogue, makoto, raw, say, think } from "./types.ts";

/**
 * Leon's reactions to every present. He is a wannabe rockstar who has never had a thought he
 * did not say out loud; Makoto is losing a slow war of attrition against the word "dude".
 * Where Leon hands a present back, the handler also writes `ReceivePresent` so Makoto keeps
 * it. Voice references are Chapter_99 transcripts, or an id where the transcript repeats.
 */
export const dialogue: GiftDialogue = {
  character: Character.Leon,
  presents: {
    MineralWater: {
      reaction: "Disliked",
      brief: [
        "Dude are you stupid? Rockstars drink booze and red bull.",
        "B-But I'm not old enough for booze. Just you wait alcohol!",
        "(He gives the gift back)",
      ],
      lines: [
        say("Frowning", "Water? Dude, are you stupid? Rockstars drink booze and energy drinks.", "Stupid!"),
        makoto("You're not old enough for booze."),
        say("Worried", "W-Well, no. Not yet. But just you wait, alcohol! I'm coming for you!", "Huh..."),
        say("Speaking", "Anyway, take this back. I've got an image.", "Give me a break."),
        raw("ReceivePresent(MineralWater)"),
        think("He threatened a beverage. Out loud. With a fist."),
      ],
    },
    ColaCola: {
      reaction: "Liked",
      brief: [
        "Hell yeah! I'm going to have my face on the side of this cola",
        "in like, 2 years, no, make that 24 months.",
        "(Makoto) does he not realise that 2 years is 24 months?",
        "For the cola's sake I hope it doesn't have to deal with Leon's face",
        "I'm barely coping with it now",
      ],
      lines: [
        say("Charming", "Hell yeah! Cola! Dude, I'm gonna have my face on the side of this thing.", "Yeah!"),
        say("Determined", "In like, two years. No. Make that twenty-four months.", "Let's do it!"),
        think("Does he not realise that two years is twenty-four months?"),
        think("For the cola's sake, I hope it never has to deal with Leon's face. I'm barely coping with it now."),
        say("Relaxed", "Twenty-four months, man. Remember I said that.", "Heh heh heh."),
      ],
    },
    CivetCoffee: {
      reaction: "Okay",
      brief: [
        "Coffee. Now dude, when I'm up all night writing a banger song, this will",
        "be my inspiration. (starts a terrible solo with coffee theme, its lame)",
        "Cool to the max bro.",
        "Makoto doesn't bother mentioning the civet",
      ],
      lines: [
        say("Speaking", "Coffee. Now dude, when I'm up all night writing a banger, this is gonna be my inspiration.", "Hey, listen."),
        say("Charming", "Check it. Coffeeee... in my cuuup... hot and brooown... and whatever's uuup...", "Yeah!"),
        think("That's the solo. That's the whole solo. He's air-guitaring the word 'brown'."),
        say("Relaxed", "Cool to the max, bro. Thanks.", "How cool is that?"),
        think("I'm not going to mention the civet. Let him have this. Let the civet have this."),
      ],
    },
    RoseHipTea: {
      reaction: "Disliked",
      brief: [
        "Rose tea? Bro are you gay? Don't be giving me tea unless you're either a",
        "grandma or a nurse.",
      ],
      lines: [
        say("Frowning", "Rose tea? Bro, are you gay or something?", "I mean, seriously?"),
        makoto("It's tea, Leon."),
        say("Speaking", "Don't be giving me tea unless you're either a grandma or a nurse, dude. Those are the rules."),
        think("Those are not the rules. Nobody wrote those rules. He made those rules up on the way here."),
      ],
    },
    SeaSalt: {
      reaction: "Liked",
      brief: [
        "You're telling me this is special salt? Damn dude I didn't know you had access",
        "to that kind of thing. Hook me up bro.",
        "Makoto doesn't bother correcting him on his assumption that 'salt' was some kind",
        "of euphamism for drugs. He hopes Leon tries to snort it.",
      ],
      lines: [
        say("Thinking", "Wait, wait. You're telling me this is *special* salt?", "Is it, like..."),
        makoto("Sea salt. From the sea. Yeah."),
        say("Charming", "Damn, dude! I didn't know you had access to that kind of thing. Hook me up, bro.", "Heh heh heh."),
        think("He thinks 'salt' is a euphemism. He thinks I'm a dealer. He's winking at me."),
        think("I'm not correcting him. I hope he tries to snort it."),
        say("Relaxed", "Say no more, man. Say no more.", "You know what I mean."),
      ],
    },
    PotatoChips: {
      reaction: "Liked",
      brief: [
        "Kuwata Crunch! Leon's Lays! Cool crisps!",
        "Makoto zones out as Leon fantasizes about having his own brand of chips.",
      ],
      lines: [
        say("Charming", "Chips! Dude, picture it. Kuwata Crunch. Leon's Lays. Cool Crisps!", "How cool is that?"),
        say("Determined", "Salt and rockstar flavour. Sour cream and stardom. Limited edition face-shaped bag.", "Yeah!"),
        think("He's still going. He's naming the flavours. There are more flavours."),
        think("I've stopped listening. My body is here, but Makoto has left the building."),
        say("Relaxed", "...and that's just the first season. Thanks, man.", "Heh heh heh."),
      ],
    },
    PrismaticHardtack: {
      reaction: "Okay",
      brief: ["Crackers? Alright, thanks dude."],
      lines: [
        say("Neutral", "Crackers? Alright. Thanks, dude.", "Hmm."),
        think("No speech. No brand. No face on it. I'll take it."),
      ],
    },
    BlackCroissant: {
      reaction: "Disliked",
      brief: [
        "Leon: Dude, its burnt. That is burnt, you're trying to give me a burnt muffin.",
        "Makoto: Well actu-",
        "Leon: No dude I'm not stupid, go take your burnt muffin and give it to someone",
        "actually stupid, like Hifumi.",
        "Makoto (thinking) well I didn't manage to teach him the difference between a muffin",
        "and a croissant, which I wasn't really expecting to have to do in the first place.",
        "As an aside, Hifumi is certainly smarter than Leon. I'm not really standing up for",
        "Leon here, but facts need to be set straight.",
      ],
      lines: [
        say("Frowning", "Dude, it's burnt. That is burnt. You're trying to give me a burnt muffin.", "What the crap?"),
        makoto("Well, actu-"),
        say("Angry", "No, dude, I'm not stupid. Take your burnt muffin and give it to someone actually stupid. Like Hifumi.", "Stupid!"),
        raw("ReceivePresent(BlackCroissant)"),
        think("I didn't manage to teach him the difference between a muffin and a croissant."),
        think("I wasn't expecting to have to teach him that in the first place."),
        think("As an aside, Hifumi is smarter than Leon. I'm not defending Hifumi. Facts just need to be set straight."),
      ],
    },
    SonicCupaNoodle: {
      reaction: "Liked",
      brief: [
        "Leon just starts making sonic the warthog noises. Dude! Cool!",
        "Makoto imagines that Hiro would find this funny.",
      ],
      lines: [
        say("Shocked", "Dude! Sonic!", "Hey!"),
        say("Stupid", "Nyoom! Nyeeerm! Ding ding ding! Ba-ding! Nyoooooom!", "Yeah!"),
        think("He's making the noises. Those aren't even the right noises. I think one of them was a pig."),
        say("Charming", "Cool! Thanks, man.", "How cool is that?"),
        think("Hiro would find this hilarious. That's the worst thing I can say about it."),
      ],
    },
    RoyalCurry: {
      reaction: "Liked",
      brief: [
        "Curry! Thanks bro. WHen I'm famous, I mean, it won't take long...",
        "Makoto listens to a painful monologue of Leon trying to see music themed",
        "curry (with his face on it of course).",
      ],
      lines: [
        say("Charming", "Curry! Thanks, bro. Y'know, when I'm famous... I mean, it won't take long...", "Y'know..."),
        say("Determined", "Kuwata Curry. Rock Hot. Face on the box, obviously. Guitar-shaped naan."),
        say("Speaking", "Medium is called 'Opening Act'. Hot is 'Headliner'. Extra hot is 'Encore', dude.", "How cool is that?"),
        think("This is painful. It is physically painful. And he's only just getting to the mascot."),
        say("Relaxed", "The mascot is also me. Anyway, thanks."),
      ],
    },
    Ration: {
      reaction: "Okay",
      brief: [
        "A ration? You mean for the war? The war has been over for about 30 years dude.",
        "Did you not go to school? Right, right, I guess some of us had to 'study'. Some people",
        "are just born smart, dude. You'll be alright.",
        "Makoto is baffled. Leon is insulting his intelligence while consoling him, while also",
        "being completely brain dead. What war ended in the 80s?",
      ],
      lines: [
        say("Thinking", "A ration? Like, for the war? Dude, the war's been over for like thirty years.", "Huh?"),
        say("Frowning", "Did you not go to school?"),
        makoto("I... what?", "What?"),
        say("Relaxed", "Right, right. I guess some of us had to 'study'. Some people are just born smart, dude. You'll be alright.", "It's all good."),
        think("He's insulting my intelligence and consoling me at the same time, while being completely brain-dead."),
        think("What war ended in the eighties? Which war does he think that was?"),
      ],
    },
    FlotationDonut: {
      reaction: "Okay",
      brief: [
        "Woah, a donut! That's sick dude, I think that Kyoko chick likes donuts, maybe she'd let",
        "me slide in...",
        "Makoto turns his ears off.",
      ],
      lines: [
        say("Shocked", "Woah, a donut! That's sick, dude.", "Hey!"),
        say("Charming", "Y'know, I think that Kyoko chick likes donuts. Maybe she'd let me slide right in and-", "Y'know..."),
        think("Ears off. Ears off. Makoto has turned his ears off."),
        say("Relaxed", "...and that's the plan. Pretty smooth, right?", "Heh heh heh."),
        makoto("Mm-hmm.", "Mm-hmm."),
      ],
    },
    OverflowingLunchBox: {
      reaction: "Okay",
      brief: [
        "A lunch box. Thanks dude.",
        "Makoto is bracing for the bragging, but it doesn't come. Noted.",
      ],
      lines: [
        say("Neutral", "A lunch box. Thanks, dude.", "Hmm."),
        think("Here it comes. Kuwata Kitchen. Lunch of champions. Face on the lid."),
        think("...Nothing? No bragging? Noted. Lunch boxes are the off switch."),
      ],
    },
    SunflowerSeeds: {
      reaction: "Loved",
      brief: [
        "Sunflower seeds, Makoto is happy to offload this junk.",
        "(These are \"Magic Beans\", you plant them and they grow into a... guitar)",
        "(an electric guitar)",
        "Dude, what? You're giving me something that special? I thought you were kind",
        "of lame before, but now? Dude.",
      ],
      lines: [
        think("Sunflower seeds. Finally. Somebody take this junk off my hands."),
        makoto("They're magic beans. You plant them, and they grow into a guitar."),
        say("Shocked", "What?", "What?"),
        makoto("An electric one."),
        say("Charming", "Dude! You're giving me something that special? I thought you were kind of lame before, but now? Dude.", "There's no way!"),
        think("He's going to plant them. He's going to water them. He's going to wait."),
      ],
    },
    Birdseed: {
      reaction: "Liked",
      brief: [
        "Makoto says that girls love feeding birds. Leon is like woah, dude, that's",
        "way smarter than you usually are. Thanks",
        "Makoto doesn't remind Leon that there are no birds underground.",
      ],
      lines: [
        say("Thinking", "Birdseed? What am I gonna do with birdseed?", "Huh?"),
        makoto("Girls love feeding birds. Think about it."),
        say("Shocked", "Woah. Dude. That's way smarter than you usually are. Thanks, man!", "How cool is that?"),
        think("I'm not going to remind him that we're sealed in a school. There are no birds here."),
        think("I want to see him standing in the courtyard with a handful of seed, waiting."),
      ],
    },
    KittenHairclip: {
      reaction: "Disliked",
      brief: [
        "You're giving me this? I'm not gay, alright. You should give this to a chick,",
        "or maybe just don't?",
        "Makoto (thinking) did he just imagine me giving this to one of the girls and get",
        "some kind of micro jealousy? This fucking guy...",
        "(He hands it back)",
      ],
      lines: [
        say("Frowning", "You're giving me this? I'm not gay, alright.", "What the hell?"),
        say("Speaking", "You should give this to a chick. Or... actually, maybe just don't?", "Uh, hmm."),
        raw("ReceivePresent(KittenHairclip)"),
        think("Did he just imagine me giving this to one of the girls and get some kind of micro-jealousy?"),
        think("This guy. This absolute guy."),
      ],
    },
    EverlastingBracelet: {
      reaction: "Okay",
      brief: [
        "This is an everlasting bracelet. Rockstars always have one of these.",
        "Oh, y-yeah I know dude they do! Absolutely, rock on man, bro!",
        "Makoto (thinking) can he just pick one. Man. Bro. Dude. Ugh.",
      ],
      lines: [
        makoto("It's an everlasting bracelet. Rockstars always have one of these."),
        say("Worried", "Oh, y-yeah! I know, dude, they do! Absolutely.", "Oh, yeah?"),
        say("Charming", "Rock on, man. Bro.", "Yeah!"),
        think("Can he just pick one? Man. Bro. Dude. Pick a lane. Ugh."),
      ],
    },
    LoveStatusRing: {
      reaction: "Hated",
      brief: [
        "We aren't friends, dude. Go and give this to Sayaka, she's basically glued to you.",
        "Makoto (thinking) he's extremely jealous. Our friend- no, aquaintanceship is probably",
        "doomed, but this moment might make it worth it.",
        "Makoto: And when you're famous and rich, write a song about it. Your insecurity, I mean.",
        "(He shoves it back at Makoto)",
      ],
      lines: [
        say("Angry", "We aren't friends, dude. Go give this to Sayaka. She's basically glued to you anyway.", "Hey, you bastard!"),
        raw("ReceivePresent(LoveStatusRing)"),
        think("He's extremely jealous. Our friend- no. Our acquaintanceship is probably doomed."),
        think("But this moment might make it worth it."),
        makoto("And when you're famous and rich, write a song about it. Your insecurity, I mean."),
        say("Venting", "Get out of my face, man.", "Shut up!"),
      ],
    },
    ZolesDiamond: {
      reaction: "Okay",
      brief: [
        "A diamond ring? Chicks dig diamond rings, thanks bro.",
        "(Leon fumbles it and it goes down a drain)",
        "A-Ah! No! The ring! I'm really sorry dude, that, I- ah. Shit.",
        "That was a not cool moment. Not superstar at all.",
        "Makoto (thinking) it was a fake, but this moment is priceless.",
        "Makoto: you're getting fake jewellery from now on.",
      ],
      lines: [
        say("Charming", "A diamond ring? Chicks dig diamond rings. Thanks, bro.", "Heh heh heh."),
        raw("Sound(28)"),
        say("Shocked", "A-Ah! No! The ring! It went down the drain!", "What the hell?"),
        say("Scared", "I'm really sorry, dude, that- I- ah. Crap. That was a not cool moment. Not superstar at all.", "My bad, my bad."),
        think("It was a fake. But this moment? Priceless."),
        makoto("You're getting fake jewellery from now on."),
        say("Worried", "That's fair. That's totally fair.", "Huh..."),
      ],
    },
    HopesPeakRing: {
      reaction: "Liked",
      brief: [
        "Makoto (thinking) this has the school logo on it, I wont miss it",
        "Leon hey, what's that symbol on the top, pretty sure its from a movie",
        "or a game or something. Dude I'm going to use that for my band! It's sick!",
        "Makoto (thinking) he's a moron. If we ever get out of here, I hope he remembers",
        "to do this and gets taken to court",
      ],
      lines: [
        think("This has the school logo on it. I won't miss it."),
        say("Thinking", "Hey, what's that symbol on the top? Pretty sure it's from a movie or a game or something.", "Is it, like..."),
        say("Charming", "Dude, I'm gonna use that for my band! It's sick!", "How cool is that?"),
        think("It's the crest of the school we go to. The one we're standing in. He's a moron."),
        think("If we ever get out of here, I hope he remembers to do this and gets taken to court."),
      ],
    },
    BlueberryPerfume: {
      reaction: "Loved",
      brief: [
        "Leon: A star has to look like a star, talk like a star, and smell like a star!",
        "This is just what I needed, how did you know?",
        "Makoto: I'm pretty good at giving gifts.",
        "Makoto (thinking) I couldn't think of anyone else who would want this.",
        "Leon: Anyway what flavor do you think blue is?",
        "Makoto: (thinking) Flavor- no you tweaked out goblin, it's scent!",
        "Makoto: (thinking) Breathe, Makoto.",
      ],
      lines: [
        say("Charming", "A star has to look like a star, talk like a star, and smell like a star!", "Yeah!"),
        say("Relaxed", "This is just what I needed! How did you know?", "How cool is that?"),
        makoto("I'm pretty good at giving gifts."),
        think("I couldn't think of anyone else who would want this."),
        say("Thinking", "Anyway, what flavour do you think blue is?", "Is it, like..."),
        think("Flavour- No, you tweaked-out goblin, it's a scent! It's a scent!"),
        think("Breathe, Makoto. Breathe."),
      ],
    },
    ScarabBrooch: {
      reaction: "Liked",
      brief: [
        "Makoto gives him an unopened capsule, which contains a scarab brooch.",
        "Leon thinks it looks like an ant (which is wrong) but he likes it.",
        "Makoto is screaming internally, that is by far the most interesting thing to",
        "come out of a capsule so far.",
      ],
      lines: [
        makoto("Here. I haven't opened it. It's a surprise."),
        say("Thinking", "Huh? Oh, cool. It's a little ant guy. Shiny ant.", "Huh?"),
        say("Charming", "I dig it, man. Ant brooch. Rock and roll.", "Heh heh heh."),
        think("It's a scarab. A scarab brooch. That is by far the most interesting thing to come out of a capsule so far."),
        think("And it's going on his jacket as an ant. I am screaming. Internally. Loudly."),
      ],
    },
    GodofWarCharm: {
      reaction: "Okay",
      brief: [
        "Makoto tells him it's a charm. Leon says that he already has all the charm he'll ever need.",
        "Leon then writes his own autograph over the paper and gives it to Makoto.",
        "Makoto thinks: I hope the real god of war shows up and throws Leon through a wall.",
      ],
      lines: [
        makoto("It's a charm. God of war."),
        say("Charming", "Dude, I already have all the charm I'll ever need. Here, check this out.", "Heh heh heh."),
        say("Relaxed", "There. Signed it. Now it's worth something. You keep it, man.", "It's all good."),
        raw("ReceivePresent(GodofWarCharm)"),
        think("He autographed a sacred charm and handed it back to me."),
        think("I hope the real god of war shows up and throws Leon through a wall."),
      ],
    },
    MacsGloves: {
      reaction: "Okay",
      brief: [
        "Boxing gloves? I could take on probably like, two boxers at once. I'm just naturally",
        "talented, you know? One of those people who's good at everything. It comes naturally.",
        "You're just good at being normal. I think.",
        "Makoto (thinking) Maybe I kill him. Maybe I do it.",
      ],
      lines: [
        say("Charming", "Boxing gloves? Dude, I could take on probably like, two boxers at once.", "Oh, yeah?"),
        say("Relaxed", "I'm just naturally talented, y'know? One of those people who's good at everything. It comes naturally.", "Y'know..."),
        say("Speaking", "You're just good at being normal. I think."),
        think("Maybe I kill him. Maybe I do it. There's a rule for it and everything."),
      ],
    },
    Glasses: {
      reaction: "Disliked",
      brief: [
        "Glasses are for nerds, and for women?",
        "When Makoto asks what he means, he says that some women look good with glasses,",
        "and some just looks fat.",
        "Makoto just sighs.",
      ],
      lines: [
        say("Frowning", "Glasses? Glasses are for nerds, dude. And for women?", "I mean, seriously?"),
        makoto("What does that mean?"),
        say("Speaking", "Like, some women look good with glasses, and some just look fat. It's science.", "You know what I mean."),
        makoto("*Sigh*", "*sigh*"),
      ],
    },
    GSick: {
      reaction: "Liked",
      brief: [
        "Oh dude! This is just like my old one, how did you know?",
        "Makoto doesn't but he says: Sayaka read your mind last night and she told me.",
        "Leon gets real nervous. W-What time last night did she read my mind?",
        "Before we went to our rooms, right?",
      ],
      lines: [
        say("Shocked", "Oh, dude! This is just like my old one! How did you know?", "Hey!"),
        think("I didn't."),
        makoto("Sayaka read your mind last night and told me."),
        say("Scared", "W-What time last night did she read my mind?", "Hey, hold on!"),
        say("Terrified", "Before we went to our rooms, right? Right? Dude. Say right."),
        think("I'm not going to say right."),
      ],
    },
    RollerSlippers: {
      reaction: "Loved",
      brief: [
        "Leons tries them on, and annoyingly he instantly knows how to use them really",
        "well. All of his puffing about being naturally talented isn't entirely inaccurate.",
        "Man, fuck Leon.",
      ],
      lines: [
        say("Charming", "Roller slippers? Sick! Hold my... hold my everything.", "Let's do it!"),
        think("He's got them on. He's moving. He's doing a spin. He's going backwards."),
        say("Relaxed", "Dude, these are nothing. I told you, man. Naturally talented.", "How cool is that?"),
        think("All of his puffing about being naturally talented isn't entirely inaccurate. That's the worst part."),
        think("Man. Screw Leon."),
      ],
    },
    RedScarf: {
      reaction: "Okay",
      brief: ["A scarf. It matches my hair, kind of. Thanks dude."],
      lines: [
        say("Neutral", "A scarf. It matches my hair, kind of. Thanks, dude.", "Hmm."),
        think("Kind of. The hair is louder."),
      ],
    },
    LeafCovering: {
      reaction: "Okay",
      brief: [
        "A leaf covering for my dick? Dude, if you hadn't given me this, I'd have been taking",
        "autographs in the nude! Probably with a bunch of women fighting over me. Ah, it would",
        "have been dangerous, trying to give autographs like that.",
        "Makoto really regrets giving Leon what he thought was just some junk.",
        "\"I want to unhear that\"",
      ],
      lines: [
        say("Thinking", "A leaf? For covering my... dude.", "Huh?"),
        say("Charming", "If you hadn't given me this, I'd have been signing autographs in the nude! Women fighting over me!", "Heh heh heh."),
        say("Relaxed", "Ah, it would've been dangerous, signing stuff like that. Y'know. Logistically."),
        think("I thought this was junk. I really regret giving Leon this junk."),
        think("I want to unhear that. I want to unhear it so badly."),
      ],
    },
    TornekosPants: {
      reaction: "Disliked",
      brief: [
        "Clown pants? What the hell dude, I'm not a kid.",
        "They're not clown pants, but Makoto doesn't bother correcting him. Mission",
        "accomplished.",
      ],
      lines: [
        say("Frowning", "Clown pants? What the hell, dude? I'm not a kid.", "What the hell?"),
        think("They're not clown pants. I'm not going to correct him."),
        think("Mission accomplished."),
      ],
    },
    BunnyEarmuffs: {
      reaction: "Disliked",
      brief: [
        "Leon accuses Makoto first of being gay, then of thinking Leon was gay,",
        "then of thinking that Leon likes bunnies.",
        "Makoto asks why he didn't use the word 'rabbit' instead of 'bunny', using",
        "that kind of language is the first sign of becoming feminine.",
        "Leon get's mad.",
        "Makoto's pleased. Ragebait: successful.",
      ],
      lines: [
        say("Frowning", "Bunny earmuffs? Dude, are you gay?", "What the crap?"),
        say("Angry", "Wait, no. You think *I'm* gay? Or do you think I like bunnies? Which one?!", "Hey, come on!"),
        makoto("Why did you say 'bunny' instead of 'rabbit'?"),
        makoto("That kind of language is the first sign. Of becoming feminine, I mean."),
        say("Venting", "I- That's not- Shut up! They're called bunny earmuffs! That's the name!", "Shut up!"),
        think("Ragebait: successful. I feel great."),
      ],
    },
    FreshBindings: {
      reaction: "Okay",
      brief: [
        "Bandages? Okay dude, I guess this could come in handy.",
        "You're not going to like, stab me or anything right? Ha-ha...",
        "Say something Makoto.",
        "Makoto: oh right, no, I was just thinking about... Sayaka.",
        "Leon (visually irritated)",
        "Makoto: (thinking) Jealousy activated. Fuck you Leon.",
        "And Sayaka, if you're listening: Fuck you Leon.",
        "It needed to be thought twice.",
      ],
      lines: [
        say("Neutral", "Bandages? Okay, dude. I guess this could come in handy.", "Hmm."),
        say("Worried", "You're not gonna like, stab me or anything, right? Ha-ha...", "Ha ha."),
        say("Scared", "...Say something, Makoto."),
        makoto("Oh, right. No. I was just thinking about... Sayaka."),
        say("Frowning", "...", "Huh..."),
        think("Jealousy activated. Screw you, Leon."),
        think("And Sayaka, if you're listening: screw you, Leon. It needed to be thought twice."),
      ],
    },
    JimmyDecayTShirt: {
      reaction: "Loved",
      brief: [
        "THis is a limited edition, only 100 ever made.",
        "Jimmy decay! Dude, I'm going to be even bigger than Jimmy Decay, I have like",
        "well only one of his songs on my mp3. LIMITED EDITION! WOAH WHAT?!",
        "Makoto (thinking) there is a ten second lag between hearing something and it being processed",
        "in the brain of Leon.",
        "He seems to actually like this though.",
      ],
      lines: [
        makoto("It's limited edition. Only a hundred were ever made."),
        say("Charming", "Jimmy Decay! Dude, I'm gonna be even bigger than Jimmy Decay. I've got like... well, one of his songs.", "Oh, yeah?"),
        say("Shocked", "LIMITED EDITION? WOAH, WHAT?!", "There's no way!"),
        think("There's a ten-second lag between Leon hearing something and it being processed."),
        think("He seems to actually like this, though. Loading bar and all."),
      ],
    },
    EmperorsThong: {
      reaction: "Disliked",
      brief: [
        "This belonged to an emporer? Which one dude?",
        "Wait, does that mean it belonged to a guy? That's hella gay dude. Not cool.",
        "Makoto (thinking) I haven't said a single word. This did not belong to an emperor, and frankly",
        "no functioning brain could have opened a capsule and arrived at that conclusion.",
      ],
      lines: [
        say("Thinking", "This belonged to an emperor? Which one, dude?", "Huh?"),
        say("Frowning", "Wait. Does that mean it belonged to a guy? That's hella gay, dude. Not cool.", "What the hell?"),
        think("I haven't said a single word. This did not belong to an emperor."),
        think("No functioning brain could have opened a capsule and arrived at that conclusion on its own."),
      ],
    },
    HandBra: {
      reaction: "Liked",
      brief: [
        "You're giving me this? Dude, this will be the perfect gift for like, any girl!",
        "Wicked great thinking cool dude, man. Yeah- I'm gonna be a star.",
        "Makoto (thinking) I hope he gives it to Sakura.",
        "Makoto (thinking) also that was the least coherant sentense I've heard from this dumbass",
        "since I arrived here.",
      ],
      lines: [
        say("Shocked", "You're giving me this? Dude, this'll be the perfect gift for like, any girl!", "Hey!"),
        say("Charming", "Wicked great thinking, cool dude, man. Yeah- I'm gonna be a star.", "Yeah!"),
        think("I hope he gives it to Sakura."),
        think("Also, that was the least coherent sentence I've heard from this dumbass since I arrived here."),
      ],
    },
    Waterlover: {
      reaction: "Disliked",
      brief: [
        "A swimsuit? What am I meant to do with this?",
        "Makoto: I don't know.",
        "Leon: Well okay. Not that cool but okay.",
      ],
      lines: [
        say("Thinking", "A swimsuit? What am I meant to do with this?", "Huh?"),
        makoto("I don't know."),
        say("Frowning", "Well, okay. Not that cool, but okay.", "Hmm."),
      ],
    },
    DemonAngelPrincessFigure: {
      reaction: "Disliked",
      brief: [
        "It's a nerd thing, for nerds. Didn't you realise I'm cool!",
        "You have to repeat yourself so much for normal people, I wish they'd just remember",
        "it the first time.",
        "Makoto... right.",
      ],
      lines: [
        say("Frowning", "It's a nerd thing. For nerds. Didn't you realise I'm cool?", "I mean, seriously?"),
        say("Venting", "You have to repeat yourself so much for normal people. I wish they'd just remember it the first time.", "*Sigh*"),
        makoto("...Right."),
      ],
    },
    AstralBoyDoll: {
      reaction: "Disliked",
      brief: [
        "A robot doll? What am I meant to do with this? Chicks don't care about",
        "robots dude, that's common knowledge.",
      ],
      lines: [
        say("Thinking", "A robot doll? What am I meant to do with this?", "Huh?"),
        say("Frowning", "Chicks don't care about robots, dude. That's common knowledge.", "You know what I mean."),
        think("Common knowledge. From the man who thinks salt is a drug."),
      ],
    },
    Shears: {
      reaction: "Hated",
      brief: [
        "Scissors.",
        "Makoto: It's for haircutting.",
        "Leon: Oh, I see, what the hell am I going to do with this then? I'm NEVER cutting",
        "my hair again. Don't you remember?",
      ],
      lines: [
        say("Neutral", "Scissors.", "Hmm."),
        makoto("They're for cutting hair."),
        say("Angry", "Oh, I see. Then what the hell am I gonna do with this? I'm NEVER cutting my hair again. Don't you remember?!", "What the hell?"),
        think("I remember. Everyone remembers. He tells us every day."),
      ],
    },
    LayeringShears: {
      reaction: "Hated",
      brief: [
        "Scissors.",
        "Makoto: It's for haircutting.",
        "Leon: Oh, I see, what the hell am I going to do with this then? I'm NEVER cutting",
        "my hair again. Don't you remember?",
      ],
      lines: [
        say("Neutral", "Scissors. Fancy ones.", "Hmm."),
        makoto("They're for cutting hair. Layering, specifically."),
        say("Angry", "Oh, I see. Then what the hell am I gonna do with this? I'm NEVER cutting my hair again. Don't you remember?!", 30),
        think("I remember. He says it so often that I could recite it along with him."),
      ],
    },
    QualityChinchillaCover: {
      reaction: "Okay",
      brief: ["A bike seat that Makoto manages to convince leon is a high tech pillow."],
      lines: [
        say("Thinking", "What is this? Some kind of... seat?", "Huh?"),
        makoto("High-tech pillow. Ergonomic. Chinchilla."),
        say("Charming", "Oh, sick. Yeah, I'm gonna need one of those. Stars need their sleep, dude.", "How cool is that?"),
        think("It's a bike seat. He's going to sleep on a bike seat."),
      ],
    },
    KirlianCamera: {
      reaction: "Okay",
      brief: [
        "A camera, with no film.",
        "Leon doesn't know how to operate a camera, so Makoto just leads him to believe that",
        "he's doing it wrong. Leon is embarrassed and takes it away: \"I-I'll totally take some photos of",
        "things that matter\"",
        "The gimmick of the camera is not mentioned.",
      ],
      lines: [
        say("Thinking", "A camera? Cool. Wait. How do you... which button... dude, nothing's coming out.", "Uh, hmm."),
        makoto("You're holding it wrong."),
        say("Worried", "I know! I know that. I was just testing it.", "My bad, my bad."),
        say("Determined", "I-I'll totally take some photos of things that matter. Later. Somewhere else.", "Yeah!"),
        think("There's no film in it. I'm not telling him that either."),
      ],
    },
    AdorableReactionsCollection: {
      reaction: "Okay",
      brief: [
        "A DVD of reacting to things. Leon: uh okay, thanks I guess? This whole place",
        "is pretty not cool, so I guess this fits.",
      ],
      lines: [
        say("Thinking", "A DVD of... people reacting to stuff?", "Huh?"),
        say("Neutral", "Uh, okay. Thanks, I guess? This whole place is pretty not cool, so I guess this fits.", "Hmm."),
        think("That's the most self-aware thing he's ever said, and it was about a DVD."),
      ],
    },
    Tumbleweed: {
      reaction: "Okay",
      brief: [
        "Leon is baffled. Where did this come from?",
        "Makoto is baffled. When did Leon learn to think for himself?",
        "Makoto: I put it in the e-Handbook, obviously. Where else?",
        "Leon: Oh-oh right yeah okay.",
        "He doesn't ask any further questions to avoid looking stupid",
      ],
      lines: [
        say("Thinking", "A tumbleweed? Dude, where did this even come from?", "Huh?"),
        think("A question. An actual question. When did Leon learn to think for himself?"),
        makoto("I put it in the e-Handbook, obviously. Where else?"),
        say("Worried", "Oh- oh, right. Yeah. Okay.", "Uh, hmm."),
        think("No follow-up. He'd rather accept that than look stupid. Crisis averted."),
      ],
    },
    UnendingDandelion: {
      reaction: "Okay",
      brief: ["Leon is wondering what this is. Makoto demonstrates.", "Okay, cool, I guess."],
      lines: [
        say("Thinking", "What's this?", "Huh?"),
        makoto("You blow on it. Watch."),
        say("Neutral", "...Okay. Cool, I guess.", "Hmm."),
        think("It grew back. He didn't notice. I'm not going to point it out."),
      ],
    },
    RoseinVitro: {
      reaction: "Okay",
      brief: [
        "A rose in a tube. Leon drinks the water, then says it tasted weird.",
        "Makoto tried to tell him to not drink the water, but Leon didn't listen.",
        "Makoto hopes some of those brain eating microbes made their way in.",
        "He realises that would technically be murder, and panics for a bit, then he calms",
        "down. A brain eating microbe would have nothing to eat in there anyway.",
      ],
      lines: [
        say("Thinking", "A rose in a tube? Weird. What's the water for?", "Huh?"),
        makoto("Don't drink the-"),
        say("Frowning", "Blegh. Dude, that tasted weird.", "What the crap?"),
        think("I hope some of those brain-eating microbes made their way in."),
        think("Wait. That would technically be murder. That would be MY murder. Oh no. Oh no."),
        think("...No. It's fine. A brain-eating microbe would have nothing to eat in there anyway."),
      ],
    },
    CherryBlossomBouquet: {
      reaction: "Liked",
      brief: [
        "Dude! I'm going to give this to the next chick I see! Thanks, man.",
        "Makoto hopes the next chick he sees is Toko.",
      ],
      lines: [
        say("Charming", "Dude! I'm gonna give this to the next chick I see! Thanks, man.", "Yeah!"),
        think("I hope the next chick he sees is Toko."),
        think("I hope she has her scissors."),
      ],
    },
    RoseWhip: {
      reaction: "Okay",
      brief: [
        "Woah, dude like Indiamo James. Wham! I'm so cool! Super cool!",
        "I'll become a legend with the whip, on stage! It'll be rockstar levels of whipping!",
        "Makoto: (thinking) he doesn't seem to have made the connection to the... kinky side.",
        "I'm not going to tell him.",
      ],
      lines: [
        say("Shocked", "Woah, dude! Like Indiamo James! Wham! I'm so cool! Super cool!", "How cool is that?"),
        say("Determined", "I'll become a legend with this on stage. Rockstar levels of whipping, dude!", "Let's do it!"),
        think("He hasn't made the connection to the... other use. The kinky one."),
        think("I'm not going to tell him. Somebody at his first concert can tell him."),
      ],
    },
    Zantetsuken: {
      reaction: "Okay",
      brief: ["A sword? Pretty cool, I guess, I'll put it in my room."],
      lines: [say("Neutral", "A sword? Pretty cool, I guess. I'll put it in my room.", "Hmm.")],
    },
    Muramasa: {
      reaction: "Okay",
      brief: ["A sword? Pretty cool, I guess, I'll put it in my room."],
      lines: [say("Neutral", "A sword? Pretty cool, I guess. I'll put it in my room.", 40)],
    },
    RaygunZurion: {
      reaction: "Okay",
      brief: ["A raygun? Pretty cool, I guess, I'll put it in my room."],
      lines: [say("Neutral", "A raygun? Pretty cool, I guess. I'll put it in my room.", "Hmm.")],
    },
    GoldenGun: {
      reaction: "Okay",
      brief: ["A golden gun? Pretty cool, I guess, I'll put it in my room."],
      lines: [say("Neutral", "A golden gun? Pretty cool, I guess. I'll put it in my room.", 40)],
    },
    BerserkerArmor: {
      reaction: "Disliked",
      brief: [
        "Armor? Dude, armor is for pussies. I read that on the internet once.",
        "YOu have to face your enemies like a real man! Yeah!",
        "Makoto (thinking) Maybe I tell Sakura that he's been in the girl's bathroom.",
      ],
      lines: [
        say("Frowning", "Armour? Dude, armour is for wimps. I read that on the internet once.", "I mean, seriously?"),
        say("Determined", "You have to face your enemies like a real man! Yeah!", "Yeah!"),
        think("Maybe I tell Sakura he's been in the girls' bathroom. Let's see how the real man does."),
      ],
    },
    SelfDestructingCassette: {
      reaction: "Okay",
      brief: ["Spy stuff. Cool, I guess."],
      lines: [
        say("Neutral", "Spy stuff. Cool, I guess.", "Hmm."),
        think("He put it in his pocket. It's going to go off in his pocket."),
      ],
    },
    SilentReceiver: {
      reaction: "Okay",
      brief: [
        "A silent receiver? Dude, I'm not Albert Armstrong, what do you mean?",
        "I hate it when people make up words.",
        "Makoto: (thinking) what... what the fuck? Which word did I make up?",
        "silent?",
        "Makoto: It's a telephone.",
        "Leon; Oh, why didn't you say so?",
      ],
      lines: [
        say("Frowning", "A silent receiver? Dude, I'm not Albert Armstrong. What does that even mean?", "What?"),
        say("Venting", "I hate it when people make up words.", "Give me a break."),
        think("What... what? Which word did I make up? 'Silent'? Was it 'silent'?"),
        makoto("It's a telephone."),
        say("Relaxed", "Oh. Why didn't you just say so?", "It's all good."),
      ],
    },
    PrettyHungryCaterpillar: {
      reaction: "Disliked",
      brief: [
        "Uh this is kind of lame. What am I going to do with this? Hook a dumb chick?",
        "You don't do a lot of thinking do you man? Don't worry, I forgive you.",
        "This is one of the true qualities of a star. Stay humble out there.",
        "Makoto (thinking) I really want to punch him. I really really do.",
      ],
      lines: [
        say("Frowning", "Uh, this is kind of lame. What am I gonna do with this? Hook some dumb chick?", "I mean, seriously?"),
        say("Relaxed", "You don't do a lot of thinking, do you, man? Don't worry. I forgive you.", "It's all good."),
        say("Charming", "That's one of the true qualities of a star. Stay humble out there."),
        think("I really want to punch him. I really, really do."),
      ],
    },
    OldTimeyRadio: {
      reaction: "Liked",
      brief: [
        "Ah, they'll be broadcasting my music soon enough. LEON KUWATA DUH DUH DUH!",
        "I want you to have it Makoto, so you can listen to me on it once I'm out of here.",
        "Makoto (thinking) I think I'd rather eat a bag of nails.",
        "(Makoto keeps the radio.)",
      ],
      lines: [
        say("Charming", "Ah, a radio. They'll be broadcasting my music on these soon enough.", "Oh, yeah?"),
        say("Determined", "LEON KUWATA! DUH DUH DUUUH!", "Yeah!"),
        say("Relaxed", "Actually, I want you to have it, Makoto. So you can listen to me on it once I'm outta here.", "It's all good."),
        raw("ReceivePresent(OldTimeyRadio)"),
        think("I think I'd rather eat a bag of nails."),
        think("He's thrilled. I'm holding my own gift. Somehow this counts as a win for him."),
      ],
    },
    MrFastball: {
      reaction: "Disliked",
      brief: [
        "Lame. Lame to the max! Why would you remind me of this?",
        "Makoto (thinking) oh right, he doesn't like baseball...",
        "Makoto (thinking) ... should I give him another one?",
      ],
      lines: [
        say("Angry", "Lame. Lame to the max! Why would you remind me of this?", "Give me a break."),
        think("Oh, right. He doesn't like baseball..."),
        think("...Should I give him another one?"),
      ],
    },
    AntiqueDoll: {
      reaction: "Okay",
      brief: [
        "A creepy doll. Makoto manages to convince him that it's a voodoo doll.",
        "Makoto was expecting him to get scared (so he could make fun of him)",
        "but instead Leon goes quiet and nervous, in a lechourous way.",
        "Makoto regrets giving it to him.",
        "'Don't think about what he's going to do'.",
      ],
      lines: [
        say("Worried", "Dude, this doll is creepy. Why does it look at me like that?", "Huh..."),
        makoto("It's a voodoo doll. Whatever you do to it happens to someone."),
        think("Here it comes. He's going to scream. I'm going to enjoy this."),
        say("Thinking", "...Anyone? Like... anyone you want?", "Is it, like..."),
        say("Relaxed", "Heh. Heh heh. Cool. Thanks, man.", "Heh heh heh."),
        think("I regret this. Don't think about what he's going to do. Don't think about it."),
      ],
    },
    CrystalSkull: {
      reaction: "Hated",
      brief: [
        "What? What is this trash? Looks cheap because it is.",
        "Makoto is annoyed, suddenly it would look much better in Makoto's own room than Leons.",
        "(Makoto takes it back)",
      ],
      lines: [
        say("Frowning", "What? What is this trash? It looks cheap because it is.", "What the crap?"),
        think("Trash? It's crystal. Suddenly it would look much better in my room than his."),
        makoto("Give it here, then."),
        raw("ReceivePresent(CrystalSkull)"),
        say("Venting", "Gladly, dude.", "*Sigh*"),
      ],
    },
    GoldenAirplane: {
      reaction: "Hated",
      brief: [
        "What? What is this trash? Looks cheap because it is.",
        "Makoto is annoyed, suddenly it would look much better in Makoto's own room than Leons.",
        "(Makoto takes it back)",
      ],
      lines: [
        say("Frowning", "What? What is this trash? It looks cheap because it is.", "What the hell?"),
        think("It's a golden airplane. Suddenly it would look much better in my room than his."),
        makoto("Fine. I'll keep it."),
        raw("ReceivePresent(GoldenAirplane)"),
        say("Venting", "Yeah, you do that.", "Give me a break."),
      ],
    },
    PrinceShotokusGlobe: {
      reaction: "Hated",
      brief: [
        "A globe? It looks like a kid made it. Lame.",
        "Makoto doesn't really know the history of this either, its just an ugly item",
        "that he wanted out of his room.",
      ],
      lines: [
        say("Frowning", "A globe? It looks like a kid made it. Lame.", "I mean, seriously?"),
        think("I don't know the history of it either. It's ugly and I wanted it out of my room."),
        think("Now it's ugly and in his room. I call that a result."),
      ],
    },
    MoonRock: {
      reaction: "Okay",
      brief: [
        "This is a rock from the moon? Why doesn't it float in the air? It must be fake.",
        "Makoto has to stop himself from gouging his own eyeballs out.",
      ],
      lines: [
        say("Thinking", "This is a rock from the moon? Then why doesn't it float?", "Huh?"),
        say("Frowning", "It must be fake, dude. Moon stuff floats. Everyone knows that.", "You know what I mean."),
        think("I have to physically stop myself from gouging my own eyeballs out."),
        say("Relaxed", "I'll keep it anyway. Fake moon rock. Still a rock.", "It's all good."),
      ],
    },
    AsurasTears: {
      reaction: "Okay",
      brief: ["Leon mistakes the tears for eye drops and puts some in. They do nothing, which he takes personally."],
      lines: [
        say("Thinking", "Eye drops? Sweet, my eyes are wrecked from writing lyrics all night.", "Huh?"),
        makoto("Those aren't-"),
        say("Frowning", "...Nothing happened. Dude, these are broken.", "What the crap?"),
        think("He put a god's tears in his eyes and gave them a bad review."),
      ],
    },
    SecretsoftheOmoplata: {
      reaction: "Disliked",
      brief: [
        "A book? Dude, books are for losers. Like, look at Toko. She barely even looks",
        "like a chick, and she's been stuck with books probably since she was born.",
        "I'm telling you dude, books really make you lame. I'd just throw it out if I were",
        "you.",
        "(he gives it back)",
      ],
      lines: [
        say("Frowning", "A book? Dude, books are for losers.", "I mean, seriously?"),
        say("Speaking", "Like, look at Toko. She barely even looks like a chick, and she's been stuck with books since she was born."),
        say("Relaxed", "I'm telling you, dude, books make you lame. I'd just throw it out if I were you. Here.", "You know what I mean."),
        raw("ReceivePresent(SecretsoftheOmoplata)"),
        think("He handed it back like it was contagious. It's a grappling manual. He'd love it if he could read."),
      ],
    },
    MillenniumPrizeProblems: {
      reaction: "Hated",
      brief: [
        "Math? What are you my teacher? That's so unbeilieveably uncool, I can't even believe",
        "it man, even from you. I mean, out of all the dudes here, you're pretty lame, I mean, math problems?",
        "Super lame. Super super lame.",
        "Makoto regrets spending time with Leon.",
      ],
      lines: [
        say("Angry", "Math? What are you, my teacher? That's so unbelievably uncool.", "What the hell?"),
        say("Venting", "I can't even believe it, man. Even from you. Out of all the dudes here, you're pretty lame, but math problems?", "Give me a break."),
        say("Frowning", "Super lame. Super super lame."),
        think("I regret spending time with Leon. I regret it on a cellular level."),
      ],
    },
    TheFunplane: {
      reaction: "Liked",
      brief: [
        "Gaming is super cool! To the max! Toby Pork Pro Skater is wicked, I'm a master",
        "at that game. You should watch me play sometime.",
        "Makoto (thinking) yeah that's never going to happen.",
      ],
      lines: [
        say("Charming", "Gaming is super cool! To the max! Toby Pork Pro Skater is wicked, dude, I'm a master at that game.", "How cool is that?"),
        say("Relaxed", "You should watch me play sometime.", "Y'know..."),
        think("Yeah, that's never going to happen."),
        makoto("Yeah.", "Yeah."),
      ],
    },
    ProjectZombie: {
      reaction: "Loved",
      brief: [
        "Zombies? Dude! No way, how did you know I liked zombies? This is awesome?",
        "Wait, this game hasn't even been released yet? How did you get a copy?",
        "Makoto (thinking) what? Not realeased? What does he mean?",
        "Man, even Makoto has some secrets huh? Fine, this is a rockstar level gift so I'll let you have it bro.",
        "Makoto (thinking) Not released... does that mean we've been here longer than we thing?",
        "Makoto (thinking) Wait, this is Leon, why am seriously thinking about this? He's clearly just wrong.",
      ],
      lines: [
        say("Shocked", "Zombies? Dude! No way! How did you know I liked zombies? This is awesome!", "There's no way!"),
        say("Thinking", "Wait. This game hasn't even been released yet. How did you get a copy?", "Hey, hold on!"),
        think("What? Not released? What does he mean, not released?"),
        say("Charming", "Man, even Makoto has secrets, huh? Fine. This is a rockstar-level gift, so I'll let you have it, bro.", "Heh heh heh."),
        think("Not released... does that mean we've been in here longer than we think?"),
        think("Wait. This is Leon. Why am I seriously thinking about this? He's clearly just wrong."),
      ],
    },
    PaganDancer: {
      reaction: "Liked",
      brief: [
        "A game where you play as god. Dude, I should make a game where you play as me!",
        "Picking up chicks, being a superstar, and just being good at everything, actually.",
        "Man, I'm pretty awesome. I'd call it: Leon Super-Cool.",
        "Makoto (thinking) that is the stupidest name I've ever heard.",
        "Makoto: that's a pretty good fit.",
      ],
      lines: [
        say("Thinking", "A game where you play as God? Dude, I should make a game where you play as me!", "Oh, yeah?"),
        say("Charming", "Picking up chicks, being a superstar, and just being good at everything, actually. Man, I'm pretty awesome.", "Yeah!"),
        say("Determined", "I'd call it... Leon Super-Cool."),
        think("That is the stupidest name I've ever heard."),
        makoto("That's a pretty good fit."),
      ],
    },
    TipsTips: {
      reaction: "Disliked",
      brief: [
        "A book?! Dude, you cannot be giving me a book. Do you know what books do to your",
        "charisma? Oh by the way man, charisma is a long word that means charm. I don't expect",
        "you'd know that, so you know. Anyway, go give this to someone lame like Taka.",
        "Makoto (thinking) don't judge a book by its cover. Leon wouldn't even get that",
        "far. Is there a word for this, like racism, but just for books. Bookism?",
        "Let's just settle for 'completely stupid'.",
        "(he gives it back)",
      ],
      lines: [
        say("Frowning", "A book?! Dude, you cannot be giving me a book. Do you know what books do to your charisma?", "What the hell?"),
        say("Relaxed", "Oh, by the way, man, charisma is a long word that means charm. I don't expect you'd know that, so, y'know.", "Y'know..."),
        say("Speaking", "Anyway, go give this to someone lame. Like Taka.", "Give me a break."),
        raw("ReceivePresent(TipsTips)"),
        think("Don't judge a book by its cover. Leon wouldn't even get that far."),
        think("Is there a word for this? Like racism, but for books. Bookism? Let's settle for 'completely stupid'."),
      ],
    },
    MaidensHandbag: {
      reaction: "Okay",
      brief: [
        "Ha! A bag, I'm going to give this to Sayaka and then she'll be my assistant, like instead of you.",
        "Uh, I mean yeah, cool. Cool! Leon is great!",
        "Makoto (thinking) he just said the quiet part out loud.",
        "Human toilet brush indeed.",
      ],
      lines: [
        say("Charming", "Ha! A bag! I'm gonna give this to Sayaka, and then she'll be my assistant. Like, instead of you.", "Ha ha."),
        say("Worried", "Uh, I mean- yeah. Cool. Cool! Leon is great!", "Kidding! Just kidding!"),
        think("He just said the quiet part out loud. Then tried to put it back."),
        think("Human toilet brush indeed."),
      ],
    },
    KokeshiDynamo: {
      reaction: "Disliked",
      brief: [
        "What? I don't need an alarm clock man, the world revolves around me. I get up when I say.",
        "That's what its like being a star. I wouldn't expect you to get it.",
        "Makoto (thinking) I don't know what this device is, but it definitely is not an alarm clock.",
        "(he gives it back)",
      ],
      lines: [
        say("Frowning", "What? I don't need an alarm clock, man. The world revolves around me. I get up when I say.", "Give me a break."),
        say("Relaxed", "That's what it's like being a star. I wouldn't expect you to get it. Take it back.", "You know what I mean."),
        raw("ReceivePresent(KokeshiDynamo)"),
        think("I don't know what this device is. But it is definitely not an alarm clock."),
        think("It's buzzing. Why is it buzzing?"),
      ],
    },
    TheSecondButton: {
      reaction: "Disliked",
      brief: [
        "A button? Isn't your mom supposed to give this to you when you turn 20?",
        "Makoto. What? No? What are you talking about.",
        "It's a school tradition. You're probably too ordinary to get it. Anyway I don't need this,",
        "I'll ace my exams without studying.",
        "Makoto (thinking) Who is still in school at 20 years old? Oh, I mean, Hiro is.",
        "Makoto (thinking) That still made no sense. How does he remember to breathe?",
      ],
      lines: [
        say("Thinking", "A button? Isn't your mom supposed to give you this when you turn twenty?", "Huh?"),
        makoto("What? No? What are you talking about?", "What?"),
        say("Relaxed", "It's a school tradition. You're probably too ordinary to get it.", "You know what I mean."),
        say("Frowning", "Anyway, I don't need this. I'll ace my exams without studying."),
        think("Who is still in school at twenty? Oh. I mean, Hiro is."),
        think("That still made no sense. None of it. How does he remember to breathe?"),
      ],
    },
    SomeonesGraduationAlbum: {
      reaction: "Disliked",
      brief: [
        "A graduation album? Why? None of these people have star aura. What am I supposed to do with this?",
        "Makoto (thinking) take it so it's no longer taking space in my room.",
      ],
      lines: [
        say("Frowning", "A graduation album? Why? None of these people have star aura.", "I mean, seriously?"),
        say("Thinking", "What am I supposed to do with this?", "Huh..."),
        think("Take it. So it's no longer taking up space in my room. That's what you're supposed to do with it."),
      ],
    },
    Vise: {
      reaction: "Liked",
      brief: [
        "Makoto gives it to him, expecting a negative reaction.",
        "Dude! A vise! I've always wanted one of these. It grabs things, like on your desk.",
        "Makoto (thinking) Leon is still explaining how it works. It's really not that complicated.",
        "Makoto: Leon, do you actually like this?",
        "Leon: yeah dude, what's not to like? Machinary is cool! Maximum coolness!",
        "Makoto (thinking) this doesn't count as machinery. Someone kill me.",
      ],
      lines: [
        think("A vise. Here we go. Three, two, one..."),
        say("Shocked", "Dude! A vise! I've always wanted one of these!", "Hey!"),
        say("Speaking", "It grabs things. Like, on your desk. You turn this bit, and the other bit goes in, and then it's grabbed."),
        think("He's still explaining how it works. It's really not that complicated."),
        makoto("Leon, do you actually like this?"),
        say("Charming", "Yeah, dude, what's not to like? Machinery is cool! Maximum coolness!", "How cool is that?"),
        think("This doesn't count as machinery. Someone kill me."),
      ],
    },
    SacredTreeSprig: {
      reaction: "Hated",
      brief: [
        "A twig? Dude, why are you giving me this?",
        "Is this some gay love thing, because if it is you can count me out.",
        "Makoto (thinking) great, he's an idiot and a homophobe.",
      ],
      lines: [
        say("Frowning", "A twig? Dude, why are you giving me this?", "What?"),
        say("Angry", "Is this some gay love thing? Because if it is, you can count me out.", "What the hell?"),
        think("Great. He's an idiot AND a homophobe. The full package."),
      ],
    },
    Pumice: {
      reaction: "Okay",
      brief: [
        "A rock? Oh wait this is one of those bath rocks. Not that we can use",
        "the bathhouse anyway, but cool, it floats in the sink.",
      ],
      lines: [
        say("Thinking", "A rock? Oh, wait, this is one of those bath rocks.", "Huh?"),
        say("Relaxed", "Not that we can use the bathhouse anyway. But cool. It floats in the sink.", "It's all good."),
        think("He got there on his own. I'm weirdly proud. I hate that I'm proud."),
      ],
    },
    Oblaat: {
      reaction: "Hated",
      brief: [
        "What is this? I don't get it.",
        "Makoto tries to explain the concept of an edible wrapper to Leon, but he doesn't get it.",
        "Dude, you just want me to eat plastic don't you? Do you think that's funny! Imagine what",
        "plastic would do to my vocal cords.",
      ],
      lines: [
        say("Thinking", "What is this? I don't get it.", "Huh?"),
        makoto("It's an edible wrapper. You wrap something in it, and then you eat the whole thing."),
        say("Frowning", "...So it's plastic you eat.", "Uh, hmm."),
        makoto("No. It's made of starch. It dissolves-"),
        say("Angry", "You just want me to eat plastic, don't you? You think that's funny?! Imagine what it'd do to my vocal cords!", "Hey, come on!"),
        think("I tried. I genuinely tried. The concept bounced off him."),
      ],
    },
    WaterFlute: {
      reaction: "Liked",
      brief: [
        "Leon likes it just because it's music related. That's all.",
        "He's blowing into it backwards and getting water everywhere but Makoto doesn't",
        "interrupt him.",
        "\"Never interrupt a dumbass when he is making a mistake\" ~ Sun Tzu, the Art of Leon.",
      ],
      lines: [
        say("Charming", "A flute! Music, dude! Now you're speaking my language.", "Yeah!"),
        say("Determined", "Check this out. Pffffft. Pfffffffft. Hold on, it's leaking. Pffffft."),
        think("He's blowing into it backwards. There's water everywhere. It's on the ceiling."),
        think("Never interrupt a dumbass when he is making a mistake. Sun Tzu, The Art of Leon."),
        say("Relaxed", "Sounds a bit wet. Still cool though. Thanks, man.", "It's all good."),
      ],
    },
    BojoboDolls: {
      reaction: "Okay",
      brief: ["Neither Makoto nor Leon know what these really are, but they look funny."],
      lines: [
        say("Thinking", "What are these?", "Huh?"),
        makoto("I don't know. They look funny, though."),
        say("Relaxed", "Ha. Yeah, they do. Alright, dude.", "Ha ha."),
        think("A moment of genuine agreement. Over two dolls. Neither of us knows anything."),
      ],
    },
    SmallLight: {
      reaction: "Disliked",
      brief: [
        "A torch. Leon puts the batteries in backwards and it doesn't work.",
        "It's broken (it's not). Lame.",
      ],
      lines: [
        say("Neutral", "A torch? Okay. Let me just... batteries go in... there. And...", "Hmm."),
        say("Frowning", "It's broken. Lame.", "Give me a break."),
        think("It's not broken. The batteries are in backwards. Both of them. Consistently."),
      ],
    },
    VoiceChangingBowtie: {
      reaction: "Okay",
      brief: [
        "Voice changing bowtie. It changes all of Leon's lines to 'STUPID'.",
        "He takes it off. Makoto wonders if it's actually just describing its wearer.",
      ],
      lines: [
        say("Charming", "A bowtie? Classy. Let's see how I sound.", "Let's do it!"),
        say("Stupid", "STUPID.", "Stupid!"),
        say("Shocked", "STUPID. STUPID! STUPID?!", 61),
        say("Frowning", "...Okay, I'm taking it off."),
        think("Does it change the voice? Or is it just describing the wearer? Science may never know."),
      ],
    },
    AncientTourTickets: {
      reaction: "Okay",
      brief: [
        "Tickets to an event? I'll probably be hosting my own event in a couple of years.",
        "Leon, the life of the one and only. I should come up with a stage name.",
        "Anyway I can hook you up with some free tickets to my show, I know that regular people get pretty broke",
        "but it's cool man.",
        "Makoto (thinking) how did he manage to turn this into something about him?",
        "What was I even expecting...",
      ],
      lines: [
        say("Thinking", "Tickets to an event? Y'know, I'll probably be hosting my own event in a couple of years.", "Y'know..."),
        say("Charming", "Leon: The Life of the One and Only. Hmm. I should come up with a stage name."),
        say("Relaxed", "Anyway, I can hook you up with free tickets to my show. I know regular people get pretty broke. It's cool.", "It's all good."),
        think("How did he manage to turn this into something about him?"),
        think("What was I even expecting..."),
      ],
    },
    NovelistsFountainPen: {
      reaction: "Hated",
      brief: [
        "Writing? Dude, if books are lame, then writing is GAY. Books are lame, that wasn't a question.",
        "Writing is for double dweebs. Super nerds. I mean, look at Toko. That's what I'm talking about.",
        "She barely even resembles a chick, more like some kind of homeless witch.",
        "You should have this dude, I'd put it in the incinerator if I were you.",
        "(he gives the pen back)",
      ],
      lines: [
        say("Frowning", "Writing? Dude, if books are lame, then writing is GAY. Books are lame. That wasn't a question.", "What the hell?"),
        say("Venting", "Writing is for double dweebs. Super nerds. Look at Toko. She barely resembles a chick. Homeless witch, more like.", "I mean, seriously?"),
        say("Speaking", "You should have this, dude. I'd put it in the incinerator if I were you.", "Give me a break."),
        raw("ReceivePresent(NovelistsFountainPen)"),
        think("He gave it back. He's never going to write a single lyric down, and somehow that's the good news."),
      ],
    },
    IfFax: {
      reaction: "Okay",
      brief: [
        "A fax machine that prints out something if your dreams came true? My dream is to become a star!",
        "I'm already most of the way there.",
        "... (plenty more bragging, etc.)",
        "Makoto (thinking) I regret existing.",
      ],
      lines: [
        say("Thinking", "A fax machine that prints out what happens if your dreams came true?", "Huh?"),
        say("Charming", "My dream is to become a star! I'm already most of the way there, dude.", "Yeah!"),
        say("Relaxed", "Like, it'd just print a picture of me. Now. As I am. Maybe with more women in it."),
        think("There was more. So much more. I regret existing."),
      ],
    },
    CatDogMagazine: {
      reaction: "Okay",
      brief: [
        "A book? You have to stop with the books man, they rot your brain.",
        "Have you ever seen a librarian? They're always pale and ugly. Books make you",
        "ugly dude, and your charm? Well pick up a book and it's all gone.",
        "Makoto (thinking) ugh, can Mondo knock me out again? Listening to this is worse.",
      ],
      lines: [
        say("Frowning", "A book? You have to stop with the books, man. They rot your brain.", "Give me a break."),
        say("Speaking", "Have you ever seen a librarian? Always pale and ugly. Books make you ugly, dude.", "You know what I mean."),
        say("Relaxed", "And your charm? Pick up a book, and it's all gone. Poof."),
        think("Ugh. Can Mondo knock me out again? Listening to this is worse."),
      ],
    },
    MeteoriteArrowhead: {
      reaction: "Okay",
      brief: ["A decoration for my room? I suppose it looks cool enough."],
      lines: [
        say("Neutral", "A decoration for my room? I suppose it looks cool enough.", "Hmm."),
        think("'Cool enough'. From him, that's a five-star review."),
      ],
    },
    ChinDrill: {
      reaction: "Okay",
      brief: ["A chin drill? Okay, thanks dude."],
      lines: [
        say("Neutral", "A chin drill? Okay. Thanks, dude.", "Hmm."),
        think("He didn't ask what it's for. Neither did I. We're both better off."),
      ],
    },
    GreenCostume: {
      reaction: "Hated",
      brief: ["This is lame. For kids. Lame kids."],
      lines: [
        say("Frowning", "This is lame. For kids. Lame kids.", "Give me a break."),
        think("That's three uses of 'lame' in six words. A personal best."),
      ],
    },
    RedCostume: {
      reaction: "Hated",
      brief: ["This is lame. For kids. Lame kids."],
      lines: [
        say("Frowning", "This is lame. For kids. Lame kids.", "*Sigh*"),
        think("It matches his hair. I thought that would count for something. It did not."),
      ],
    },
  },
};
