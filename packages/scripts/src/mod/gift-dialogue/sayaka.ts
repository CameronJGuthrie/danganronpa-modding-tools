import { Character } from "linscript-definitions";
import { type GiftDialogue, makoto, raw, say, think } from "./types.ts";

/** Sayaka's reactions to every present. Voice references are Chapter_99 transcripts, or an id where the transcript repeats. */
export const dialogue: GiftDialogue = {
  character: Character.Sayaka,
  presents: {
    MineralWater: {
      reaction: "Okay",
      brief: [
        "Sayaka is disappointed but lets slip that she is a bottled water snob",
      ],
      lines: [
        say("Concerned", "Huh? Mineral water? Oh. Well. That's... hydrating.", "Huh?"),
        say("Neutral", "Which spring is it from? It doesn't say. It just says \"spring.\"", "Umm..."),
        say("Serious", "I only drink glacier water, Makoto. Bottled at source, carbon neutral, slightly judgmental.", "I mean..."),
        makoto("It's water, Sayaka."),
        say("BlushingSmiling", "And this is a bottle. We're both learning things today.", "*Giggle*"),
      ],
    },
    ColaCola: {
      reaction: "Disliked",
      brief: [
        "Sayaka thinks Makoto is trying to end her career",
      ],
      lines: [
        say("Scared", "Ah! Makoto, is this cola?", "Ah!"),
        makoto("Yeah. It's a drink. People drink it."),
        say("DissociatingOutburst", "Do you know what sugar does to a pop idol's skin? To her voice? To her contract?", "Why? Why?"),
        say("Dissociating", "This isn't a gift. This is a career-ending event in a can.", "*Sigh*"),
        makoto("I can take it back..."),
        say("Serious", "No. I'll keep it. As evidence.", "Hold on a second..."),
      ],
    },
    CivetCoffee: {
      reaction: "Okay",
      brief: [
        "Sayaka says she thought civet coffee was great until she learned how it was made",
      ],
      lines: [
        say("Cheerful", "Ah! Civet coffee! I used to love this stuff.", 40),
        say("Neutral", "Then someone explained how it's made.", "But,"),
        makoto("How is it made?"),
        say("ShyEyesAverted", "A small animal eats the beans, Makoto. And then... the beans continue their journey.", "You see,"),
        think("Oh. OH."),
        say("Smiling", "Anyway, thanks! I'll regift it to Byakuya.", "Okay."),
      ],
    },
    RoseHipTea: {
      reaction: "Liked",
      brief: [
        "Sayaka muses that her grandma used to like this tea",
      ],
      lines: [
        say("Wistful", "Rose hip tea... My grandma used to drink this every single evening.", "Ummm..."),
        say("Smiling", "She said it kept her young. She was ninety-one and still doing the splits."),
        makoto("That's... actually impressive."),
        say("BlushingSmiling", "That's good. You'd have liked her. She also bit people.", "That's good."),
      ],
    },
    SeaSalt: {
      reaction: "Okay",
      brief: [
        "Sayaka is baffled and hardly knows what to say, settling with a sideways compliment",
      ],
      lines: [
        say("Concerned", "Huh? Salt?", "Huh?"),
        say("Thinking", "Ummm... From the... sea. Sea salt. From the sea.", "Ummm..."),
        say("Neutral", "Umm... It's very salty looking. Good job on picking a salt.", "Umm..."),
        think("A sideways compliment. I'll take it. Sideways."),
      ],
    },
    PotatoChips: {
      reaction: "Disliked",
      brief: [
        "Sayaka hates potato chips because she say Hifumi eating them earlier",
      ],
      lines: [
        say("DissociatingOutburst", "Oh no! Not chips!", "Oh no!"),
        makoto("What's wrong with chips?"),
        say("Dissociating", "I... watched Hifumi eat a bag of these an hour ago. With his whole face. I can still hear it.", "I..."),
        say("Serious", "He didn't chew, Makoto. He absorbed them."),
        makoto("Okay, that's fair."),
      ],
    },
    PrismaticHardtack: {
      reaction: "Liked",
      brief: [
        "Sayaka assumes it's a pop culture decoration and gracefully accepts.",
        "Makoto thinks to himself that she has probably been on a strict diet",
        "for her career, which he thinks is kind of sad.",
      ],
      lines: [
        say("Cheerful", "Ah! A rainbow biscuit decoration! It's so retro and cute.", 40),
        say("BlushingSmiling", "I'll put it on my shelf next to the other things I'm never allowed to eat.", "I'm so happy!"),
        think("She thinks it's a decoration. She thinks food is a decoration."),
        think("I guess that's what a career diet does to you. That's kind of sad, actually."),
      ],
    },
    BlackCroissant: {
      reaction: "Hated",
      brief: [
        "Sayaka hates this because she hates black food. She then clarifies that",
        "she isn't racist, but she does have opinions. She starts to talk about",
        "prisons but Makoto changes the subject real quick to something mundane.",
        "Phew, PR crisis avoided.",
      ],
      lines: [
        say("Scared", "Ah! No. Nope. I don't do black food.", "Ah!"),
        makoto("...Black food?"),
        say("Serious", "Squid ink, charcoal buns, this. I'm not racist, Makoto. I just have opinions.", "I mean..."),
        say("Determined", "Speaking of which, have you ever thought about how the prison system...", "You see,"),
        makoto("Wait, no! Uh, so, the weather! Pretty mild for an underground school, huh?", "Wait, no!"),
        say("Neutral", "Okay... I suppose it is.", 36),
        think("Phew. PR crisis averted. Barely."),
      ],
    },
    SonicCupaNoodle: {
      reaction: "Okay",
      brief: [
        "Sayaka is familiar with cup noodles. They remind her of long nights waiting",
        "for her dad to get back home. She quickly apologizes before asking Makoto to",
        "use his 'superpower' of just being ignorant and to forget about her problems.",
        "Makoto is about to respond but then Sayaka tells him that he's a virgin (out",
        "of the blue) before apologizing and rephrasing it as a question. She clearly",
        "has already decided what the answer would be anyway.",
      ],
      lines: [
        say("Wistful", "Cup noodles... I used to make these every night, waiting up for Dad to get home.", "*Sigh*"),
        say("Crying", "Sometimes he did."),
        say("Concerned", "Sorry about that. That got heavy. Can you do your thing where you just don't notice stuff?", "Sorry about that."),
        makoto("My... thing?"),
        say("Smiling", "Your superpower! Blissful ignorance. Please forget all my problems. Also, you're a virgin."),
        makoto("Wait, what?!", "Wait, what?!"),
        say("BlushingSmiling", "Sorry. I mean... you're a virgin? Question mark?", "Sorry."),
        think("She didn't wait for my answer. She didn't need to."),
      ],
    },
    RoyalCurry: {
      reaction: "Liked",
      brief: [
        "Sayaka likes curry. Her manager doesn't let her eat it often.",
      ],
      lines: [
        say("Cheerful", "Curry! Real curry! With the little flakes of... whatever these are!", "I'm so happy!"),
        say("ShyEyesAverted", "Um... my manager only lets me have it twice a year. My birthday, and if we hit a sales target.", "Um..."),
        makoto("That's a weird rule."),
        say("Determined", "I've hit the target every year, Makoto. Every. Year."),
      ],
    },
    Ration: {
      reaction: "Okay",
      brief: [
        "Sayaka remarks that rations are like the least exciting kind of christmas present",
        "Makoto thinks this is odd. Has someone given her rations before?",
      ],
      lines: [
        say("Neutral", "Ah? A ration. The least exciting thing you can unwrap on Christmas morning.", "Ah?"),
        say("Wistful", "You tear off the paper, you see a brown block, and your whole family just nods.", "*Sigh*"),
        think("That's a really specific memory. Has someone given her rations before?"),
        think("Who gives a child a ration?"),
      ],
    },
    FlotationDonut: {
      reaction: "Disliked",
      brief: [
        "Sayaka is annoyed at Makoto for offloading the junk he clearly got from the",
        "MonoMono machine. This school doesn't even have a pool.",
      ],
      lines: [
        say("Serious", "Makoto. Be honest. Did this fall out of the MonoMono Machine?", "Um, listen."),
        makoto("...Maybe."),
        say("DissociatingOutburst", "This school doesn't even have a pool! What am I floating in? My feelings?", "Why? Why?"),
        makoto("Oh, sorry. I panicked at the machine.", "Oh, sorry."),
        say("Concerned", "Hold on a second... You're just offloading junk on me, aren't you?", "Hold on a second..."),
      ],
    },
    OverflowingLunchBox: {
      reaction: "Loved",
      brief: [
        "Sayaka appreciates the sentiment, but she doesn't want the whole thing to herself",
        "Sayaka offers to share with Makoto (which she's oddly shy about)",
        "She starts talking about feelings, and the meaning of sharing food, but Makoto is",
        "too engorged in the food. Have her dialog become 'blah blah blah' and switch to Makoto's",
        "thoughts on the various items in the lunchbox.",
      ],
      lines: [
        say("HandOverMouth", "Ah! This is huge! Thank you, but I couldn't finish all this alone.", 40),
        say("Shy", "Um... we could share it? If you wanted. No pressure. It's just food.", "Um..."),
        makoto("Sure!"),
        say("BlushingSmiling", "There's something special about sharing a meal, you know? It says, \"I trust you with my\"", "I'm so happy!"),
        think("Oh wow, there's a whole egg roll in here."),
        say("BlushingSmiling", "...blah blah blah feelings blah blah blah closeness blah..."),
        think("Is that a tiny octopus wiener? It is. It's got little eyes."),
        say("Smiling", "...blah blah, don't you think so, Makoto?", "Makoto!"),
        makoto("Mm-hmm.", "Mm-hmm."),
        think("I have no idea what I just agreed to. The rice is really good though."),
      ],
    },
    SunflowerSeeds: {
      reaction: "Okay",
      brief: [
        "Sayaka doesn't understand why Makoto has just given her sunflower seeds.",
        "She thinks its funny and gives them right back.",
      ],
      lines: [
        say("Concerned", "Huh? Sunflower seeds? For me?", "Huh?"),
        makoto("Yeah."),
        say("Neutral", "Umm... Why?", "Umm..."),
        makoto("I... really don't know what to say.", "I... really don't know what to say."),
        say("Cheerful", "Here. You have them. You clearly need them more than I do.", "*laughs*"),
        think("She gave them straight back. I'm holding my own gift again."),
      ],
    },
    Birdseed: {
      reaction: "Loved",
      brief: [
        "Sayaka and Makoto talk more about the crane that they saw in school together.",
        "Sayaka confesses to Makoto that she is scared of cranes. Makoto thinks that he is scared",
        "of Sayaka and she throws her hands up in shock. She seems to have read his mind. \"I'm psychic\".",
        "Makoto nervously laughs, which Sayaka then follows up on with lots of laughter. Slightly crazy,",
        "but you wouldn't catch Makoto thinking the word 'crazy' after that. He does anyway.",
      ],
      lines: [
        say("Smiling", "Hi, Makoto! Birdseed! Is this for the crane we saw by the trash room?", "Hi, Makoto!"),
        makoto("Yeah, I thought you might want to feed it."),
        say("ScaredEyesAverted", "Um... can I tell you something? I'm scared of cranes. The legs. The neck. The eyes that know things.", 47),
        think("Honestly, right now I'm a little scared of Sayaka."),
        say("DissociatingOutburst", "Ah, ah! Rude! I heard that!", "Ah, ah!"),
        makoto("W-What are you doing?!", "W-What are you doing?!"),
        say("BlushingSmiling", "Like I said, I'm psychic.", "Like I said, I'm psychic."),
        makoto("Ha... ha..."),
        say("Cheerful", "Ahaha! Ahahahaha! AHAHAHAHA!", "*laughs*"),
        think("I'm not going to think the word \"crazy.\" I'm not going to think it. Crazy. Dang it."),
      ],
    },
    KittenHairclip: {
      reaction: "Liked",
      brief: [
        "Sayaka has a soft spot for cats. She fed a neigbourhood stray while she was living",
        "in her old apartment",
      ],
      lines: [
        say("Cheerful", "Ah! A kitty! Look at its little face!", 40),
        say("Wistful", "There was a stray outside my old apartment. I fed him every morning for two years.", "You see,"),
        makoto("What was his name?"),
        say("BlushingSmiling", "Mr. Contractual Obligation. Long story. My agency named him.", "*Giggle*"),
      ],
    },
    EverlastingBracelet: {
      reaction: "Liked",
      brief: [
        "Sayaka thinks this is a big cringe, but Makoto can tell she means it in a nice way.",
        "She sure is rude about being nice about it.",
      ],
      lines: [
        say("Neutral", "Wow. Okay. That is... a lot of cringe in one bracelet.", "Okay."),
        say("ShyEyesAverted", "An \"everlasting\" bracelet. From a capsule machine. In a murder school. Deeply, deeply cringe.", "I mean..."),
        think("She's smiling though. She means it in a nice way. I think."),
        say("BlushingSmiling", "I'm going to wear it forever, you absolute dork.", "But that's why."),
        think("She sure is rude about being nice."),
      ],
    },
    LoveStatusRing: {
      reaction: "Loved",
      brief: [
        "Sayaka thinks it is shiny any barely pays any attention to Makoto after he gives it to her.",
      ],
      lines: [
        say("Cheerful", "Ah! Ooh! Shiny!", 40),
        makoto("So, I was thinking, maybe later we could..."),
        say("BlushingSmiling", "Shiiiiny..."),
        makoto("Sayaka?", "Sayaka?"),
        say("BlushingSmiling", "Huh? Sorry. It's just so shiny. Were you talking?", "Huh?"),
        makoto("No, not really.", "No, not really."),
      ],
    },
    ZolesDiamond: {
      reaction: "Hated",
      brief: [
        "Sayaka thinks he is proposing to her. She clearly has trust issues with adults and",
        "marriage. Mommy issues, anyone?",
      ],
      lines: [
        say("Scared", "Ah! Makoto, a diamond? Are you... proposing?", "Ah!"),
        makoto("What? No! It's a gift! Just a gift!", "What?"),
        say("Dissociating", "Th-that's... what Mom's third husband said. \"Just a gift.\" Then the paperwork started.", "Th-that's..."),
        say("DissociatingOutburst", "Why? Why do adults always want to sign things?", "Why? Why?"),
        makoto("I'm not an adult! I'm not signing anything!"),
        say("Serious", "That's exactly what an adult would say."),
        think("Note to self: never bring up marriage, mothers, or paperwork again."),
      ],
    },
    HopesPeakRing: {
      reaction: "Liked",
      brief: [
        "Makoto confesses that he got it from the MonoMono machine and it has the school logo",
        "on it so he had to be rid of it.",
        "Sayaka finds the upfront honesty refreshing after making the mistake of talking to Leon",
        "for 30 seconds earlier.",
      ],
      lines: [
        makoto("Full disclosure: this came out of the MonoMono Machine. It has the school logo on it."),
        makoto("I couldn't look at it anymore. So now it's your problem."),
        say("HandOverMouth", "You know what? That's refreshing.", "*Giggle*"),
        say("Smiling", "I talked to Leon for thirty seconds earlier and he lied about his height, his band, and his name.", "You see,"),
        makoto("His name?"),
        say("Neutral", "He said it was \"Leon Thunderfist.\""),
      ],
    },
    BlueberryPerfume: {
      reaction: "Okay",
      brief: [
        "Mild response. She's not very big on perfume, nor are most Japanese girls.",
      ],
      lines: [
        say("Neutral", "Perfume. Blueberry. Okay.", 36),
        say("Thinking", "I don't really wear perfume. Most girls I know don't. We mostly just smell like shampoo.", "Ummm..."),
        makoto("Oh."),
        say("Smiling", "It's fine! I'll spray it on Hifumi when he's not looking. For everyone's sake.", "But that's why."),
      ],
    },
    ScarabBrooch: {
      reaction: "Loved",
      brief: [
        "Makoto thinks this item is really cool. He pulls it out just to show off and not",
        "to give to her, but she decides she 'must' have this beautiful pendant.",
        "Makoto tries and fails to communicate that he was just getting it out to have",
        "a look, and her gift was something else, but that fails.",
      ],
      lines: [
        think("Check this thing out. A scarab brooch! It's got little legs and everything."),
        makoto("Hey, look at this. Isn't it cool? I just wanted to show you."),
        say("Cheerful", "Ah! It's beautiful! I must have it. Thank you, Makoto!", 40),
        makoto("Wait, no! I wasn't... that's not the gift, I was just getting it out to...", "Wait, no!"),
        say("BlushingSmiling", "You're so thoughtful. I'm going to wear it every day.", "I'm so happy!"),
        makoto("Hold on!", "Hold on!"),
        say("Smiling", "Huh? Did you say something?", "Huh?"),
        think("It's gone. The scarab is gone. The actual gift is still in my pocket."),
      ],
    },
    GodofWarCharm: {
      reaction: "Disliked",
      brief: [
        "Sayaka doesn't really like this.",
      ],
      lines: [
        say("Concerned", "Umm... A charm for the god of war?", "Umm..."),
        say("Neutral", "I'm a pop idol, Makoto. The only war I'm in is with the tabloids.", "I mean..."),
        makoto("You could use it for that?"),
        say("Serious", "No."),
      ],
    },
    MacsGloves: {
      reaction: "Liked",
      brief: [
        "Sayaka seems to think boxing is cool. She makes several incorrect boxing jokes",
        "which actually belong to other sports. Despite that, she's smiling brightly.",
      ],
      lines: [
        say("Cheerful", "Ah! Boxing gloves! Boxing is so cool. Grand slam!", 40),
        makoto("That's baseball."),
        say("Smiling", "Right, right. Hole in one! Touchdown!", "Okay."),
        makoto("Golf. Football."),
        say("BlushingSmiling", "Checkmate!", "*laughs*"),
        think("Not a single one of those was boxing. She's never looked happier."),
      ],
    },
    Glasses: {
      reaction: "Liked",
      brief: [
        "Sayaka takes a lot of offense. She thinks Makoto is accusing her of being some kind",
        "of nerd, some kind of wretched geek. Does he expect her to play 'DMD' (she gets the acronym wrong) and start",
        "watching anime next? Maybe Startcraft? (She get's that slightly wrong too).",
        "Makoto tries to take the glasses back, but she gets even more annoyed.",
        "So you want to steal my posessions too?",
        "Then she laughs and reveals she's been messing with him.",
      ],
      lines: [
        say("DissociatingOutburst", "Glasses? GLASSES? Are you calling me a nerd, Makoto?", "Why? Why?"),
        makoto("No! I just..."),
        say("Serious", "What's going on? You want me to play DMD with you? Watch anime? Start Craft?", "What's going on?"),
        makoto("It's D and D. And StarCraft. And no!"),
        say("Dissociating", "Oh, so you DO know. Of course you know.", "Ah?"),
        makoto("Okay, okay, just give them back..."),
        say("DissociatingOutburst", "Ah, ah! So you want to steal my possessions too?", "Ah, ah!"),
        say("Cheerful", "Oh my gosh, your face! I'm messing with you! They're cute, I love them.", "*laughs*"),
        think("I think I lost two years off my life just now."),
      ],
    },
    GSick: {
      reaction: "Okay",
      brief: [
        "A low quality wristwatch. Sayaka spends some time talking about watches,",
        "she likes the ticking sound of clocks, which is surely some kind of early warning",
        "signal for dementia, Makoto thinks.",
      ],
      lines: [
        say("Neutral", "A watch. Not a very good one, but a watch.", "Ah?"),
        say("Wistful", "I... love the ticking, though. Tick. Tick. Tick. I sleep with three clocks in my room.", 48),
        say("Smiling", "Sometimes I just sit and listen to them. For hours. Tick. Tick."),
        think("That's either very relaxing or an early warning sign for something."),
      ],
    },
    RollerSlippers: {
      reaction: "Liked",
      brief: [
        "Makoto pretends to be a salesman for these goofy slippers with wheels in the heel.",
        "He falls over in the process, and Sayaka then and only then finds it amusing.",
      ],
      lines: [
        makoto("Ladies and gentlemen, introducing the Roller Slipper! Wheels in the heel! Just lean back and glide like..."),
        makoto("Whoa! Whoa, whoa! Aaah!", "*Gasp*"),
        raw("Sound(28)"),
        say("Neutral", "..."),
        say("Cheerful", "Okay, now I'm interested.", "*laughs*"),
        makoto("I think I broke my tailbone."),
        say("BlushingSmiling", "Do it again.", 36),
      ],
    },
    RedScarf: {
      reaction: "Liked",
      brief: [
        "Sayaka takes the scarf with no further context, and she looks happy.",
        "She liked it.",
      ],
      lines: [
        say("Smiling", "Ah! A scarf!", 40),
        say("BlushingSmiling", "..."),
        think("She just put it on. No speech, no questions. She looks really happy."),
        think("Sometimes it's that simple, I guess."),
      ],
    },
    LeafCovering: {
      reaction: "Okay",
      brief: [
        "Sayaka wonders what went wrong with Makoto for him to give her this.",
        "She starts quizzing him: dropped as a baby? lead poisoning? fetal alcohol syndrom?",
        "The tone is comical and dripping with satiric pity",
        "She didn't like the gift, but liked making fun of Makoto",
      ],
      lines: [
        say("Concerned", "Makoto. A leaf. You've given me a leaf to wear.", "Um, listen."),
        say("Serious", "I'm going to ask you some questions and I need you to be honest."),
        say("Thinking", "Were you dropped as a baby? Lead paint in the house? Did your mother drink while she was...", "Ummm..."),
        makoto("Hey!"),
        say("HandOverMouth", "Oh, you poor thing. You poor, poor thing.", "*Giggle*"),
        think("She didn't like the leaf. She really liked making fun of me, though."),
      ],
    },
    TornekosPants: {
      reaction: "Liked",
      brief: [
        "Arrr! Sayaka pretends to be a pirate.",
        "Here Makoto and Sayaka roleplay as a pirate and a pirate's assistant for a bit.",
        "Makoto says Land Ho, and Sayaka tells him not to speak of women with such vulgarity!",
        "Nor should he command them without saying please. She will 'land' when she feels like it.",
        "Makoto is stunned.",
      ],
      lines: [
        say("Determined", "Arrr! Pirate pants! Hoist the mainsail, ye scurvy dog!"),
        makoto("Aye aye, Captain! Uh... land ho!"),
        say("DissociatingOutburst", "Ah, ah! Don't you dare speak of women with such vulgarity!", "Ah, ah!"),
        makoto("What? I just said land..."),
        say("Serious", "And don't command a lady without saying please. I'll land when I feel like landing.", "Um, listen."),
        makoto("I... really don't know what to say.", "I... really don't know what to say."),
        say("Smiling", "Cause I'm your assistant. First mate, I mean. Arrr.", "Cause I'm your assistant."),
      ],
    },
    BunnyEarmuffs: {
      reaction: "Liked",
      brief: [
        "Bunnies are all the rage at the moment. Makoto is just pleased that he doesn't",
        "have such a girly item in his room anymore.",
      ],
      lines: [
        say("Cheerful", "Bunny earmuffs! Everyone's wearing these right now!", "I'm so happy!"),
        say("BlushingSmiling", "Huh? You've been paying attention to trends? For me?", "Huh?"),
        think("No. I've been trying to get those out of my room for a week. A guy can only own so many bunny items."),
        makoto("Yes. Totally.", "Yes."),
      ],
    },
    FreshBindings: {
      reaction: "Okay",
      brief: [
        "Makoto honestly doesn't know what this is, and Sayaka doesn't know either.",
      ],
      lines: [
        makoto("So, this is... fresh bindings."),
        say("Thinking", "Bindings for what?", "Ummm..."),
        makoto("I don't know."),
        say("Concerned", "Are they for a book? A sprain? A ritual?", "Hey, um..."),
        makoto("I genuinely don't know."),
        say("Neutral", "Okay. Well. I'll keep them fresh.", "Okay."),
      ],
    },
    JimmyDecayTShirt: {
      reaction: "Loved",
      brief: [
        "Sayaka is a big fan of Jimmy Decay. She doesn't know about this particular shirt,",
        "but if the label is to be believed only 100 were ever made.",
      ],
      lines: [
        say("DissociatingOutburst", "Ah! Is that... JIMMY DECAY?!", "Ah!"),
        say("Cheerful", "I have every album! Every bootleg! I have a tooth he threw into a crowd once!", "I'm so happy!"),
        makoto("A tooth?"),
        say("BlushingSmiling", "Makoto! Look at this label! \"One of one hundred.\" Only a hundred of these exist!", "Makoto!"),
        makoto("If the label's telling the truth..."),
        say("Determined", "Jimmy Decay doesn't lie. He only decays."),
      ],
    },
    EmperorsThong: {
      reaction: "Disliked",
      brief: [
        "Sayaka is embarassed by this. She says she's disappointed in Makoto.",
      ],
      lines: [
        say("ShyEyesAverted", "Um... Makoto. What is this.", "Um..."),
        makoto("It said \"Emperor's\" on it, so I thought it was fancy..."),
        say("Scared", "Th-that's... a thong. You gave me a thong. In public.", "Th-that's..."),
        say("Serious", "I'm disappointed in you.", "*Sigh*"),
        think("Yeah. Me too."),
      ],
    },
    HandBra: {
      reaction: "Hated",
      brief: [
        "Sayaka is embarassed by this. She says she's disappointed in Makoto.",
      ],
      lines: [
        say("Scared", "Ah! What is this?!", "Ah!"),
        makoto("It's a... hand... it holds..."),
        say("DissociatingOutburst", "Why? Why would you hand this to me?", "Why? Why?"),
        say("ScaredEyesAverted", "I'm disappointed in you, Makoto. Deeply. Permanently.", "*Sigh*"),
        think("I should have read the capsule before I opened it."),
      ],
    },
    Waterlover: {
      reaction: "Disliked",
      brief: [
        "Sayaka is annoyed. Why is Makoto giving her swimwear when there is no pool?",
        "The only answer is that he is a no-good horny teenager.",
      ],
      lines: [
        say("Serious", "Swimwear. There's no pool here, Makoto.", "Um, listen."),
        makoto("There might be a pool on another floor!"),
        say("Dissociating", "You don't know that. So the only reason to give a girl swimwear in a building with no pool is...", "You see,"),
        say("DissociatingOutburst", "Makoto! ...that you're a no-good horny teenager!", "Makoto!"),
        makoto("That's not... I mean... it was in the machine..."),
        say("Concerned", "Hold on a second. Is everything in that machine like this?", "Hold on a second..."),
      ],
    },
    DemonAngelPrincessFigure: {
      reaction: "Okay",
      brief: [
        "Sayaka accepts the gift. She clearly doesn't know what this thing is, though.",
      ],
      lines: [
        say("Smiling", "Ah! Thank you! It's a... princess? Demon? Angel?", 40),
        makoto("All three, I think."),
        say("Thinking", "She has a lot going on. Is she good or bad?", "Ummm..."),
        makoto("I honestly have no idea."),
        say("Neutral", "I'll face her toward the wall at night, just in case.", 36),
      ],
    },
    AstralBoyDoll: {
      reaction: "Okay",
      brief: [
        "Sayaka recalls a guest star on the show that this figurine belongs to.",
        "She clams up, having remembered something traumatic. Was this one of those",
        "things she wasn't proud of?",
      ],
      lines: [
        say("Smiling", "Ah! Astral Boy! I guest starred on that show once.", 40),
        say("Neutral", "I... played a space princess who...", "I..."),
        say("Dissociating", "..."),
        makoto("Sayaka?", "Sayaka?"),
        say("ScaredEyesAverted", "Sorry. It's nothing. Let's talk about something else.", "Sorry."),
        think("That was fast. Was this one of those jobs she said she wasn't proud of?"),
      ],
    },
    Shears: {
      reaction: "Liked",
      brief: [
        "Sayaka promises to give Makoto a haircut if they're stuck down here.",
        "The conversation becomes serious, as the two wonder how long they will be here.",
      ],
      lines: [
        say("Smiling", "Shears! Okay, deal: if we're stuck down here long enough, I'm cutting your hair.", "Okay."),
        makoto("How long is long enough?"),
        say("Wistful", "...", "*Sigh*"),
        say("Serious", "I... don't know. How long do you think we'll be here, Makoto?", 48),
        makoto("I... don't know either."),
        say("Neutral", "Well. Your hair's not going anywhere. Neither are we."),
      ],
    },
    LayeringShears: {
      reaction: "Liked",
      brief: [
        "Sayaka promises to give Makoto a haircut if they're stuck down here.",
        "The conversation becomes serious, as the two wonder how long they will be here.",
      ],
      lines: [
        say("Smiling", "Layering shears! Okay, when we've been here long enough, I'm fixing your layers.", "Okay."),
        makoto("My hair has layers?"),
        say("Wistful", "It will. If we're here long enough.", "*Sigh*"),
        say("Serious", "...How long do you think that'll be?", "Um..."),
        makoto("I don't know."),
        say("Neutral", "Me neither. But I'll have a lot of time to practice."),
      ],
    },
    QualityChinchillaCover: {
      reaction: "Disliked",
      brief: [
        "This is junk to Sayaka. What would she do with a bike seat cover?",
      ],
      lines: [
        say("Concerned", "Huh? A bike seat cover? Makoto, where's the bike?", "Huh?"),
        makoto("There isn't one."),
        say("Serious", "So I have a cover. For a seat. For a bike. That doesn't exist.", "I mean..."),
        makoto("It's really soft, though."),
        say("Neutral", "So is junk."),
      ],
    },
    KirlianCamera: {
      reaction: "Okay",
      brief: [
        "A weird camera with no film. Alright.",
      ],
      lines: [
        say("Thinking", "A camera. Does it have film?", "Ummm..."),
        makoto("No."),
        say("Neutral", "Okay.", 36),
        makoto("It photographs auras, apparently."),
        say("Neutral", "Okay.", "Okay."),
      ],
    },
    AdorableReactionsCollection: {
      reaction: "Okay",
      brief: [
        "A DVD containing footage of people reacting to artwork. Makoto and Sayaka both agree",
        "that they'll kill themselves before watching it.",
      ],
      lines: [
        say("Thinking", "A DVD of... people reacting to paintings?", "Ummm..."),
        makoto("Yeah. Just their faces. For two hours."),
        say("Serious", "I would rather die in here than watch this."),
        makoto("Yeah.", "Yeah."),
        say("Smiling", "Okay. We'll watch it together, then. As a last resort.", 36),
      ],
    },
    Tumbleweed: {
      reaction: "Disliked",
      brief: [
        "Sayaka questions how Makoto has a whole tumbleweed. Where was he even keeping that?",
        "Makoto says he just stuffed it into the e-Handbook. Sayaka for once is the one taken aback.",
      ],
      lines: [
        say("Concerned", "Makoto, that's an entire tumbleweed. Where were you even keeping that?", "Hold on a second..."),
        makoto("In the e-Handbook."),
        say("Scared", "Huh? ...What?", "Huh?"),
        makoto("I just kind of stuffed it in there. It fit."),
        say("Dissociating", "It was so strange... That's not how anything works.", "It was so strange."),
        think("For once, she's the one who looks taken aback. I'll savor this."),
      ],
    },
    UnendingDandelion: {
      reaction: "Okay",
      brief: [
        "Apparently blowing dandelions again and again is something somebody found interesting",
        "enough to put the fluff bit on a string, so it can be pulled back and blown again.",
        "Sayaka makes an accidental innuendo with 'blow' which Makoto can barely keep his composure from.",
      ],
      lines: [
        say("Smiling", "Ah! A dandelion on a string! So you blow it, pull the fluff back, and blow it again?", 40),
        makoto("Yeah, that's the whole idea."),
        say("Cheerful", "I love blowing. I could blow all day. Watch me blow this.", "I'm so happy!"),
        makoto("Mm... hmm.", "Mm-hmm."),
        think("Keep it together, Makoto. Keep it together. She has no idea."),
        say("Concerned", "Huh? Why is your face red?", "Huh?"),
      ],
    },
    RoseinVitro: {
      reaction: "Loved",
      brief: [
        "Roses in a test tube. Sayaka thinks this is cute. She asks Makoto what it feels",
        "like to be in a glass tube, and he answers that he doesn't know, followed by an",
        "awkwardly long silence. Sayaka seems unbothered by the silence.",
      ],
      lines: [
        say("BlushingSmiling", "Roses in a test tube! That's so cute. Little flowers in a little jar.", "I'm so happy!"),
        say("Thinking", "What do you think it feels like? Being in a glass tube?", "Hey, um..."),
        makoto("I... don't know."),
        say("Smiling", "..."),
        makoto("..."),
        say("Smiling", "..."),
        think("This silence has been going on for forty seconds. She seems completely fine with it."),
      ],
    },
    CherryBlossomBouquet: {
      reaction: "Loved",
      brief: [
        "Straight up beautiful. Sayaka wonders how she got so lucky to have such a nice Makoto",
        "with her. Makoto asks her what she means, and she just tells him that other Makoto's just",
        "don't measure up. How many Makotos does she know?!",
      ],
      lines: [
        say("BlushingSmiling", "...Makoto... They're beautiful.", "...Makoto..."),
        say("BlushingSmiling", "How did I get so lucky? To be stuck in here with such a nice Makoto.", "*Relieved sigh*"),
        makoto("What do you mean, \"such a nice\" Makoto?"),
        say("Smiling", "I mean... the other Makotos just don't measure up. You're the best one by far.", "I mean..."),
        think("Other Makotos? How many Makotos does she know?!"),
      ],
    },
    RoseWhip: {
      reaction: "Disliked",
      brief: [
        "Sayaka dislikes the idea of a whip. This spawns a discussion on slavery",
        "that Makoto keeps trying to dip out of, without success.",
        "Makoto zones out, and sums up in thought: \"Slavery: bad\"",
      ],
      lines: [
        say("Concerned", "A whip? I don't like whips. They remind me of plantation history.", "Umm..."),
        makoto("Right, so, moving on..."),
        say("Serious", "And did you know indentured servitude continued well into the...", "You see,"),
        makoto("That's a good point, anyway, how about this weather..."),
        say("Determined", "...and the economic legacy still shapes...", "But that's why."),
        think("I'm not here anymore. I'm somewhere else. I'm on a beach."),
        say("Serious", "...wouldn't you agree, Makoto?", "Makoto!"),
        think("Slavery: bad. Got it."),
      ],
    },
    Zantetsuken: {
      reaction: "Disliked",
      brief: [
        "Some kind of toy sword. Does Makoto think she is a 7 year old boy?",
      ],
      lines: [
        say("Concerned", "Huh? A toy sword?", "Huh?"),
        say("Serious", "Makoto, do you think I'm a seven-year-old boy?", "Um, listen."),
        makoto("No! I just thought it looked cool."),
        say("Neutral", "That's what a seven-year-old boy would think."),
      ],
    },
    Muramasa: {
      reaction: "Disliked",
      brief: [
        "Some kind of toy sword. Does Makoto think she is a 7 year old boy?",
      ],
      lines: [
        say("Concerned", "Huh? Another toy sword?", "Huh?"),
        say("Serious", "Do I look like a seven-year-old boy to you?", "Um, listen."),
        makoto("You said that was a seven-year-old thing last time, so I thought..."),
        say("Neutral", "You thought a second sword would fix it."),
      ],
    },
    RaygunZurion: {
      reaction: "Disliked",
      brief: [
        "Some kind of toy gun. Does Makoto think she is a 7 year old boy?",
      ],
      lines: [
        say("Concerned", "Huh? A ray gun. Pew pew.", "Huh?"),
        say("Serious", "Makoto. Seven. Year. Old. Boy. Is that what you see when you look at me?", "Um, listen."),
        makoto("It lights up!"),
        say("Neutral", "So do my eyes when I'm about to leave."),
      ],
    },
    GoldenGun: {
      reaction: "Liked",
      brief: [
        "Sayaka relishes in the memory of watching James Pond with her father.",
        "The movie played in English with no subtitles, so she had no idea what anyone",
        "was saying. Still, a great memory.",
      ],
      lines: [
        say("Cheerful", "Ah! The Golden Gun! From James Pond!", 40),
        say("Wistful", "Dad and I watched that every Friday. In English. With no subtitles.", "You see,"),
        makoto("So you understood it?"),
        say("Smiling", "Not a single word. We made up what they were saying. Pond was a dentist in our version.", "*laughs*"),
        say("BlushingSmiling", "Best Fridays of my life."),
      ],
    },
    BerserkerArmor: {
      reaction: "Okay",
      brief: [
        "Makoto tries to say that this would be decent for self defense, but she reminds",
        "him that *he* is her self defense. This is entirely not reassuring to Makoto.",
      ],
      lines: [
        makoto("I figured this might be decent for self defense. You know, just in case."),
        say("Smiling", "Huh? Oh, I don't need armor. I have you for that.", "Huh?"),
        makoto("...Huh?", "Huh?"),
        say("Determined", "Cause I'm your assistant, and you're my self defense. You'd stand between me and anything.", "Cause I'm your assistant."),
        think("Would I? Would I really? I'm five foot three."),
      ],
    },
    SelfDestructingCassette: {
      reaction: "Disliked",
      brief: [
        "Once Makoto explains how this works, she is confused. Why record music only to be",
        "played once? It's not really for music, Makoto begins to explain, but Sayaka has already",
        "decided that junk is junk.",
      ],
      lines: [
        makoto("So you record on it, and then it plays once, and then it destroys itself."),
        say("Thinking", "Why would you record music that only plays once?", "Ummm..."),
        makoto("Well, it's not really for music, it's more for..."),
        say("Serious", "Junk is junk, Makoto.", "Um, listen."),
        makoto("...spy stuff."),
        say("Serious", "Junk."),
      ],
    },
    SilentReceiver: {
      reaction: "Disliked",
      brief: [
        "Once Makoto explains how this works (or more aptly, doesn't work) Sayaka correctly",
        "identifies that he is trying to give her junk. Rude.",
      ],
      lines: [
        makoto("Okay, so, this is a receiver. It receives... well, actually it doesn't receive anything. It's silent."),
        say("Neutral", "So it does nothing.", 36),
        makoto("It does it very quietly."),
        say("Serious", "You're giving me junk, Makoto. Just say it. Say \"Sayaka, here is some junk.\"", "Um, listen."),
        makoto("...Sayaka, here is some junk."),
        say("Concerned", "Rude.", "*Sigh*"),
      ],
    },
    PrettyHungryCaterpillar: {
      reaction: "Disliked",
      brief: [
        "A caterpillar toy that was all the rage years ago. As you pull it, it moves up and down, making it look alive.",
        "Makoto does this and it freaks Sayaka out.",
      ],
      lines: [
        makoto("Check this out, when you pull it..."),
        say("Scared", "A-ah! A-ah! It's moving! Why is it moving?!", "A-ah! A-ah!"),
        makoto("It's a toy! Look, it goes up and down, like it's alive!"),
        say("ScaredEyesAverted", "Makoto! That's the problem! Get it away from me!", "Makoto!"),
        think("Oh no. I've traumatized a pop idol with a caterpillar."),
      ],
    },
    OldTimeyRadio: {
      reaction: "Okay",
      brief: [
        "An old timey radio is a great decoration. Sayaka is a bit upset that all the",
        "channels seem to be broken.",
      ],
      lines: [
        say("Smiling", "Ah! An old radio! This would look so good on a shelf.", 40),
        say("Thinking", "Okay, let's see what's on. Static. Static. Static... Monokuma? No. Static.", "Okay."),
        say("Concerned", "Oh no! All the channels are broken. Every single one.", "Oh no!"),
        makoto("Maybe it's the walls?"),
        say("Neutral", "Maybe it's the whole situation.", "*Sigh*"),
      ],
    },
    MrFastball: {
      reaction: "Disliked",
      brief: [
        "The baseball reminds her of Leon. Makoto and Sayaka have a short whine about",
        "the resident toilet brush.",
      ],
      lines: [
        say("Concerned", "A baseball. Oh, that reminds me of Leon.", "Ah?"),
        say("Serious", "Why? Why does he dye his hair like that? Why does he talk like that? Why does he exist like that?", "Why? Why?"),
        makoto("He said he'd quit baseball to become a punk rocker."),
        say("Dissociating", "He is a human toilet brush, Makoto. A toilet brush with a goatee.", "I mean..."),
        makoto("Yeah.", "Yeah."),
      ],
    },
    AntiqueDoll: {
      reaction: "Liked",
      brief: [
        "A skilled craftsman has made this. Makoto is just relieved to get the doll out of his room.",
      ],
      lines: [
        say("Smiling", "Ah! An antique doll! Look at the detail on the eyes. A real craftsman made this.", 40),
        say("BlushingSmiling", "The eyes almost follow you. I love it.", "I'm so happy!"),
        think("The eyes DO follow you. They followed me all night. That's why it's not in my room anymore."),
        makoto("Enjoy!"),
      ],
    },
    CrystalSkull: {
      reaction: "Okay",
      brief: [
        "A gimmicky thing. Sayaka thinks it's just okay.",
      ],
      lines: [
        say("Thinking", "A crystal skull. Hm.", "Ummm..."),
        say("Neutral", "It's fine. It's a skull. Made of crystal. That's the whole thing.", 36),
        makoto("It's supposed to be mysterious."),
        say("Neutral", "It's supposed to be okay. And it is."),
      ],
    },
    GoldenAirplane: {
      reaction: "Okay",
      brief: [
        "A gimmicky thing. Sayaka thinks it's just okay.",
      ],
      lines: [
        say("Thinking", "A golden airplane. Hm.", "Ummm..."),
        say("Neutral", "It's fine. It's a plane. It's gold. That's the whole thing.", 36),
        makoto("It's for your desk!"),
        say("Neutral", "It can sit next to the other fine thing."),
      ],
    },
    PrinceShotokusGlobe: {
      reaction: "Okay",
      brief: [
        "A gimmicky thing. Sayaka thinks it's just okay.",
      ],
      lines: [
        say("Thinking", "A globe. Hm.", "Ummm..."),
        say("Neutral", "It's fine. It's a globe. It's... a globe.", 36),
        makoto("Prince Shotoku's globe! From before globes!"),
        say("Neutral", "It's okay, Makoto. It's just okay."),
      ],
    },
    MoonRock: {
      reaction: "Okay",
      brief: [
        "An actual moon rock. Sayaka doesn't believe that the US landed on the moon",
        "in 1969, but actually in 1992. Makoto turns his ears off for the following",
        "conversation.",
      ],
      lines: [
        say("Cheerful", "Ah! A moon rock! Oh, this is great. You know they didn't land in 1969, right?", 40),
        makoto("...They didn't?"),
        say("Determined", "1992. Everything before that was a soundstage in Nevada. Look at the shadows, Makoto.", "You see,"),
        think("I'm going to turn my ears off now. Nod and smile. Nod and smile."),
        say("Serious", "...and that's why the flag was waving. Are you listening?", "But that's why."),
        makoto("Mm-hmm.", "Mm-hmm."),
      ],
    },
    AsurasTears: {
      reaction: "Okay",
      brief: [
        "Some kind of ancient artifact? It came of of a MonoMono capsule so probably not.",
      ],
      lines: [
        say("Thinking", "Is this an ancient artifact? It looks like an ancient artifact.", "Ummm..."),
        makoto("It came out of a capsule machine for a hundred yen."),
        say("Neutral", "So, probably not.", 36),
        makoto("Probably not."),
      ],
    },
    SecretsoftheOmoplata: {
      reaction: "Okay",
      brief: [
        "Sayaka reads the first page and tries to judo flip Makoto without warning.",
        "Makoto thinks she's trying to kiss him and he panics and falls in a heap.",
      ],
      lines: [
        say("Thinking", "A grappling manual. Let me just read the first page...", "Ummm..."),
        say("Determined", "Hold on a second...", "Hold on a second..."),
        makoto("Huh? Wait, what are you... Sayaka?!", "Huh?"),
        raw("Sound(28)"),
        raw("SpriteFlash(4, 0, 30, 4, 2)"),
        think("She's lunging at me! Is she... trying to kiss me?! What do I do with my hands?!"),
        makoto("AAAH!"),
        say("Cheerful", "It worked! The judo flip worked! Are you okay down there?", "*laughs*"),
        think("No. Nothing about that was okay."),
      ],
    },
    MillenniumPrizeProblems: {
      reaction: "Hated",
      brief: [
        "Math puzzles? Makoto? Really? You... cretin! How dare you!",
        "Makoto didn't even realize that it was math related, because he didn't check.",
      ],
      lines: [
        say("Scared", "Ah! Math? MATH?!", "Ah!"),
        makoto("Wait, it's math?"),
        say("DissociatingOutburst", "Unsolved math problems, Makoto! Seven of them! You absolute cretin! How dare you!", "Why? Why?"),
        makoto("I didn't check! I just saw \"prize\" on the cover!"),
        say("Dissociating", "You've handed me homework with no due date. Forever homework.", "*Sigh*"),
        think("I should have read it. I should have read anything."),
      ],
    },
    TheFunplane: {
      reaction: "Liked",
      brief: [
        "Sayaka says that she's too busy for games. Despite that, she pockets the device.",
        "Makoto gets the feeling that she secretly likes games.",
      ],
      lines: [
        say("Neutral", "A handheld game console? I'm far too busy for games, Makoto.", "Ah?"),
        say("Neutral", "..."),
        think("She pocketed it. She pocketed it immediately."),
        say("BlushingSmiling", "Um... I'll just hold onto it. For safekeeping.", "Um..."),
        think("She's a gamer. She's a closet gamer. I knew it."),
      ],
    },
    ProjectZombie: {
      reaction: "Liked",
      brief: [
        "A zombie slavery game. Sayaka is not interested when he starts with zombies, but concerningly",
        "interested when he mentions slavery.",
      ],
      lines: [
        makoto("It's a game where you fight zombies..."),
        say("Neutral", "Pass.", 36),
        makoto("...and enslave them to run your farm."),
        say("Determined", "Wait. Go on.", "Hold on a second..."),
        think("She perked up at the wrong part. She perked up at a very wrong part."),
      ],
    },
    PaganDancer: {
      reaction: "Liked",
      brief: [
        "Makoto blinks. Wasn't this game banned due to obscene levels of violence?",
        "By the time he has finished thinking, Sayaka has already grabbed it.",
      ],
      lines: [
        think("Hold on. Wasn't this game banned? Something about the violence being \"obscene even by...\""),
        say("Cheerful", "Ah! Ooh! Mine!", 40),
        think("...and it's gone. She just grabbed it out of my hands."),
        say("Smiling", "I've heard about this one. Thanks, Makoto!", "I'm so happy!"),
      ],
    },
    TipsTips: {
      reaction: "Okay",
      brief: [
        "A tips guide for video games. Sayaka likes it about as much as most people like a cookie.",
      ],
      lines: [
        say("Neutral", "A tips guide. For video games. Okay.", 36),
        makoto("You like it?"),
        say("Smiling", "About as much as anyone likes being handed one cookie. It's a cookie. I'm not mad.", "I mean..."),
      ],
    },
    MaidensHandbag: {
      reaction: "Okay",
      brief: [
        "This is a posh looking bag. Sayaka must have a lot of money, because she didn't",
        "even flinch. She also didn't look that excited.",
      ],
      lines: [
        say("Neutral", "Oh, this brand. Yes, I have the spring one.", "Ah?"),
        makoto("That's really expensive, isn't it?"),
        say("Neutral", "Huh? Is it?", "Huh?"),
        think("She didn't even flinch at the price tag. She also didn't look excited. Rich people are strange."),
      ],
    },
    KokeshiDynamo: {
      reaction: "Hated",
      brief: [
        "TODO",
      ],
      lines: [
        makoto("It's a kokeshi doll! Traditional! But it... vibrates? For some reason?"),
        say("Scared", "Ah! Makoto. Makoto, no.", "Ah!"),
        makoto("What? It's a doll. Isn't it a doll?"),
        say("DissociatingOutburst", "That is NOT a doll! Why would you hand me this?!", "Why? Why?"),
        say("Dissociating", "It was so strange... Did you really not know? Did you really think...", "It was so strange."),
        think("What am I missing here? It's shaped like a doll. It's painted like a doll."),
        say("Serious", "We're never speaking of this again.", "Um, listen."),
      ],
    },
    TheSecondButton: {
      reaction: "Disliked",
      brief: [
        "Sayaka: you're giving me a button? Why?",
      ],
      lines: [
        say("Thinking", "A button. You're giving me a button? Why?", "Ummm..."),
        makoto("It's the second button! From a uniform! It's a... it's a tradition?"),
        say("Concerned", "Huh? Whose uniform?", "Huh?"),
        makoto("I don't know."),
        say("Serious", "So it's a stranger's button."),
      ],
    },
    SomeonesGraduationAlbum: {
      reaction: "Okay",
      brief: [
        "Makoto seems to be offloading random junk. Sayaka tells him to just put it back where",
        "he found it.",
      ],
      lines: [
        say("Concerned", "Makoto, this is somebody else's graduation album.", "Hold on a second..."),
        makoto("I know."),
        say("Serious", "Put it back where you found it.", "Um, listen."),
        makoto("I found it in a capsule machine."),
        say("Neutral", "Then put it back in the capsule.", 36),
      ],
    },
    Vise: {
      reaction: "Disliked",
      brief: [
        "Sayaka drops the vice on Makoto's foot. Was that on purpose? She didn't like the gift anyway",
      ],
      lines: [
        say("Neutral", "A vise. Hm. Heavy.", "Ah?"),
        raw("Sound(28)"),
        makoto("AAGH! My foot!"),
        say("Neutral", "Oops."),
        makoto("Was that... on purpose?"),
        say("Smiling", "Sorry about that.", "Sorry about that."),
        think("That was on purpose. That was so on purpose."),
      ],
    },
    SacredTreeSprig: {
      reaction: "Okay",
      brief: [
        "Sayaka begins explaining the mythology behind the sacred tree sprig, but she seems",
        "to be getting confused with Japanese, Norse, Egyptian, and Greek mythology all at once.",
        "Makoto deems it not worth the effort to correct her.",
      ],
      lines: [
        say("Determined", "A sacred sprig! This comes from Yggdrasil, the tree where Amaterasu hid from Osiris.", "You see,"),
        makoto("That's... three different..."),
        say("Determined", "And Zeus used its branches to build the ark. Everyone knows that.", "But that's why."),
        think("Japanese, Norse, Egyptian and Greek. All at once. All wrong."),
        think("Not worth correcting. Not even a little."),
      ],
    },
    Pumice: {
      reaction: "Liked",
      brief: [
        "Pumice is a good rock for scraping skin. Girls like this apparently.",
        "Makoto just thought it was a cool rock, but he'll take the accidental win.",
      ],
      lines: [
        say("Cheerful", "A pumice stone! For my heels! You actually know what girls like.", "I'm so happy!"),
        makoto("Oh. Yes. Definitely."),
        think("I thought it was just a cool rock. It floats. I'll take the accidental win."),
      ],
    },
    Oblaat: {
      reaction: "Okay",
      brief: [
        "An edible wrapper. Sayaka is confused to be given just the wrapper on its own.",
      ],
      lines: [
        say("Thinking", "Oblaat? The edible wrapper?", "Ummm..."),
        makoto("Yeah."),
        say("Concerned", "Huh? Just the wrapper? There's nothing inside?", "Huh?"),
        makoto("It's a wrapper for nothing."),
        say("Neutral", "Okay. I'll wrap nothing in it, then.", "Okay."),
      ],
    },
    WaterFlute: {
      reaction: "Liked",
      brief: [
        "The water flute is a bit of fun. Sayaka seems to be cheered up by the sounds it makes.",
      ],
      lines: [
        say("Smiling", "Ah! A water flute! Hold on, let me fill it...", 40),
        say("Cheerful", "It sounds like a drunk bird!", "*Giggle*"),
        makoto("I thought you'd like the sound."),
        say("BlushingSmiling", "I love the sound. I needed something silly today.", "I'm so happy!"),
      ],
    },
    BojoboDolls: {
      reaction: "Okay",
      brief: [
        "Neither Sayaka nor Makoto understand the religious significance of these dolls.",
        "Instead they spend some time alikening the features to their other classmates;",
        "Hiro's lanky arms, and Chihiro's spine.",
      ],
      lines: [
        say("Thinking", "Bojobo dolls. These are supposed to be spiritual, right?", "Ummm..."),
        makoto("I think so. I don't know how."),
        say("Smiling", "Me neither. But look, this one's got Hiro's lanky arms.", "Okay."),
        makoto("And that one's got Chihiro's spine. Sort of droopy."),
        say("Cheerful", "And this one's Byakuya. It's not smiling.", "*laughs*"),
      ],
    },
    SmallLight: {
      reaction: "Liked",
      brief: [
        "The flashlight might come in handy. Sayaka is happy that Makoto is planning ahead.",
      ],
      lines: [
        say("Smiling", "Ah! A flashlight! That's smart. If the power goes out down here we're going to want this.", 40),
        makoto("Yeah, I figured it might come in handy."),
        say("BlushingSmiling", "That's good. Someone's planning ahead. I like that.", "That's good."),
      ],
    },
    VoiceChangingBowtie: {
      reaction: "Okay",
      brief: [
        "The label reads 'voice changing voice tie",
      ],
      lines: [
        say("Thinking", "The label says \"Voice Changing Voice Tie.\"", "Ummm..."),
        makoto("Voice tie?"),
        say("Neutral", "That's what it says. Voice Tie. Twice.", "I mean..."),
        makoto("Does it change your voice?"),
        say("Neutral", "It doesn't say."),
      ],
    },
    AncientTourTickets: {
      reaction: "Okay",
      brief: [
        "Sayaka seems bitter sweet at receiving tickets to a show that she wouldn't be able",
        "to attend. In a rare moment of sincerity, she admits it would have been nice to go",
        "together.",
      ],
      lines: [
        say("Wistful", "Tour tickets... Ah. The show's next month.", "*Sigh*"),
        say("Crying", "We'll never make it there from in here, will we?"),
        makoto("Sorry, are you okay?", "Sorry, are you okay?"),
        say("Shy", "I... I mean it. It would've been really nice. To go together.", "I..."),
        think("No jokes, no act. Just Sayaka for a second. I didn't know what to say."),
      ],
    },
    NovelistsFountainPen: {
      reaction: "Okay",
      brief: [
        "A fountain pen. Makoto gets ink on himself while fishing it out of his pocket.",
      ],
      lines: [
        makoto("Hold on, I've got it right here in my... ugh."),
        say("HandOverMouth", "Ah! Makoto, your hand is black.", "Ah!"),
        makoto("The cap came off in my pocket."),
        say("Smiling", "And your shirt. And your other hand.", "*Giggle*"),
        makoto("It's a very good pen, though."),
      ],
    },
    IfFax: {
      reaction: "Okay",
      brief: [
        "A whole fax machine. Makoto recalls faxing prank messages from the teachers lounge.",
        "They never figured out it was him.",
        "Sayaka finds this funny.",
      ],
      lines: [
        say("Concerned", "A whole fax machine. Where do you keep finding these?", "Hold on a second..."),
        makoto("You know, I used to fax prank messages from the teachers' lounge. Every Friday."),
        say("Smiling", "Huh? Did they ever catch you?", "Huh?"),
        makoto("Never. They blamed the printer for three years."),
        say("Cheerful", "The printer! Oh, that's wonderful.", "*laughs*"),
      ],
    },
    CatDogMagazine: {
      reaction: "Okay",
      brief: [
        "A sex eduation book, disguised as a picture book for some reason.",
        "Makoto of course, thinks its a picture book and hands it over. Sayaka misinterprets:",
        "d-dont you think it's a bit early to think about this kind of thing?",
        "Makoto is oblivious; no I think giving you a book is kind of where we're at now.",
        "Sayaka is blushing.",
      ],
      lines: [
        makoto("It's a picture book! Cats and dogs. I flipped through, looks cute."),
        say("Scared", "Ah! Makoto! D-don't you think it's a bit early for this kind of thing?!", "Ah!"),
        makoto("Early? I mean, I think giving you a book is kind of where we're at right now."),
        say("BlushingSmiling", "Th-that's... where we're at...?", "Th-that's..."),
        say("ShyEyesAverted", "Um...", 47),
        think("Why is she blushing so hard? It's a picture book. Dogs. Cats. Right?"),
      ],
    },
    MeteoriteArrowhead: {
      reaction: "Okay",
      brief: [
        "Seems to be some kind of artifact. Neither Sayaka or Makoto know what it is,",
        "but it will look alright on a desk.",
      ],
      lines: [
        say("Thinking", "An arrowhead? Made of meteorite?", "Ummm..."),
        makoto("I think it's some kind of artifact."),
        say("Neutral", "What does it do?", 36),
        makoto("I don't know. Sits there?"),
        say("Smiling", "That's good. It'll look alright on a desk.", "That's good."),
      ],
    },
    ChinDrill: {
      reaction: "Disliked",
      brief: [
        "Sayaka thinks this is kind of weird. Who would want a drill on her chin.",
        "Makoto stays silent until he realises the question wasn't rhetorical.",
        "Oh, uh, miners? Sayaka looks at him puzzled; why would a minor want a chin drill?",
        "You're not making any sense.",
      ],
      lines: [
        say("Concerned", "A chin drill. Who would want a drill on their chin?", "Umm..."),
        makoto("..."),
        say("Serious", "Makoto. I'm asking.", "Um, listen."),
        makoto("Oh! Uh... miners?"),
        say("Thinking", "Huh? Why would a minor want a chin drill? They can't even consent to a drill.", "Huh?"),
        makoto("No, miners, like, in a mine..."),
        say("Concerned", "What's going on? You're not making any sense.", "What's going on?"),
      ],
    },
    GreenCostume: {
      reaction: "Liked",
      brief: [
        "Sayaka recalls dressing up as a green dinosaur when visiting an elementary school.",
        "This seems to be one of her fonder memories as a star.",
      ],
      lines: [
        say("Cheerful", "Ah! A green costume! I wore one just like this at an elementary school visit once.", 40),
        say("Wistful", "I was a dinosaur. The kids chased me around the gym for an hour. I've never felt so famous.", "You see,"),
        say("BlushingSmiling", "That was a good day.", "That's good."),
      ],
    },
    RedCostume: {
      reaction: "Liked",
      brief: [
        "Sayaka recalls dressing up as a red dragon when visiting an elementary school.",
        "This seems to be one of her fonder memories as a star.",
      ],
      lines: [
        say("Cheerful", "Ah! A red costume! I wore one just like this for an elementary school visit.", 40),
        say("Wistful", "I was a dragon. One kid cried, then hugged my leg for twenty minutes. I've never felt so loved.", "You see,"),
        say("BlushingSmiling", "That was a good day.", "That's good."),
      ],
    },
  },
};
