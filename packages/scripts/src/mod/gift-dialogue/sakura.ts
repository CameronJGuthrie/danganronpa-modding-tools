import { Character } from "linscript-definitions";
import { type GiftDialogue, makoto, raw, say, think } from "./types.ts";

/**
 * Sakura's reactions to every present. She speaks in verdicts and short commands and never
 * shouts; Makoto's fear of her is played straight. Voice references are Chapter_99 transcripts,
 * or an id where the transcript repeats.
 */
export const dialogue: GiftDialogue = {
  character: Character.Sakura,
  presents: {
    MineralWater: {
      reaction: "Liked",
      brief: [
        "She gives a short lecture on the importance of hydration",
        "She practically inhales the entire bottle in half a second.",
      ],
      lines: [
        say("Neutral", "Water. Good.", "Mmm."),
        say("Listening", "The body is seventy percent water. Lose two percent and your strength drops. Lose ten and you drop."),
        say("FacingRight", "Most people walk around at a deficit. You, for example. Your skin has the finish of a dry eraser."),
        think("She unscrewed the cap and the bottle was empty. I didn't see it happen. There was no swallowing."),
        say("Smiling", "Hydration. Remember it.", "Well then."),
      ],
    },
    ColaCola: {
      reaction: "Okay",
      brief: [
        "Cola is a new years tradition at the dojo, for some reason.",
      ],
      lines: [
        say("Neutral", "Cola.", "Hmm?"),
        say("ListeningEyesClosed", "At the dojo we drink one can of this every New Year's morning. Nobody remembers why. Nobody asks.", "Well."),
        makoto("That's... kind of nice, actually."),
        say("Irked", "It is not nice. It is tradition. The two are unrelated."),
        say("Neutral", "I will keep it until January.", "Mmm."),
      ],
    },
    CivetCoffee: {
      reaction: "Okay",
      brief: [
        "Interesting. She plainly thanks him for the gift.",
      ],
      lines: [
        say("Neutral", "Coffee. From a civet.", "Huh."),
        say("Smiling", "Thank you, Makoto."),
        think("That's it? No verdict? No assessment of my bone density?"),
        say("Neutral", "Were you expecting more?", "Hmm?"),
        makoto("No! No. Thank you. Enjoy the... civet."),
      ],
    },
    RoseHipTea: {
      reaction: "Okay",
      brief: [
        "A little too sweet for her liking. Still, she appreciates it.",
      ],
      lines: [
        say("Listening", "Rose hip. I have had this. It is sweet.", "Hmm."),
        say("FacingRight", "Too sweet. Sugar is a weakness that pretends to be a reward."),
        makoto("It's herbal tea, Sakura."),
        say("Neutral", "I know what it is. I will drink it anyway. The gesture was adequate.", "Well."),
      ],
    },
    SeaSalt: {
      reaction: "Liked",
      brief: [
        "Too much salt is bad for you. She begins to talk about junk food.",
        "Makoto would usually zone out but he is on high alert around Sakura and pays",
        "full attention, learning way more than he ever had in any classroom.",
        "Sakura seems satisfied that Makoto had learned something about nutrition.",
      ],
      lines: [
        say("Neutral", "Salt. Sit down.", "Well then."),
        say("Listening", "Too much salt raises the blood pressure and strains the heart. Most of it hides in packaged food."),
        say("ListeningEyesClosed", "Chips. Instant noodles. Anything in a bright bag. The body wants it because the body is a fool."),
        think("I'm listening. I'm actually listening. I have never once done this in a classroom."),
        think("Terror turns out to be a very effective teaching method. Someone should tell the teachers. Actually, no."),
        say("Smiling", "You were paying attention. Good. Perhaps there is a brain in there after all.", "I see."),
      ],
    },
    PotatoChips: {
      reaction: "Okay",
      brief: [
        "Sakura mentions the high calorie count of potato chips compared with the low",
        "protein. She takes them anyway, as a way to bribe Hifumi or Hiro to leave her alone.",
        "Makoto isn't sure she knows how unnecessary that is given her terrifying stature",
      ],
      lines: [
        say("Irked", "Potato chips. Five hundred calories a bag and perhaps six grams of protein.", "Hmm."),
        say("Neutral", "I will take them. Hifumi and Hiro follow me around. Food makes them go away."),
        makoto("You could also just... look at them."),
        say("FacingRight", "I do look at them.", "So?"),
        think("She doesn't know. She genuinely doesn't know that one glance from her clears a hallway."),
      ],
    },
    PrismaticHardtack: {
      reaction: "Okay",
      brief: [
        "Basically cookies. She notes that you would benefit from soaking them in water first.",
      ],
      lines: [
        say("Neutral", "Hardtack. Seven flavours in a cracker that could stop a door.", "Huh."),
        say("Listening", "Soak it in water before eating. Otherwise you will lose a tooth, and you need the ones you have."),
        makoto("Noted."),
        say("Neutral", "Good.", "Mmm."),
      ],
    },
    BlackCroissant: {
      reaction: "Liked",
      brief: [
        "Sakura finds the black food trend amusing. Clearly she is not someone who usually",
        "pays any attention to this kind of thing, but being trapped in a school without her dojo",
        "has taken away much of her routine.",
      ],
      lines: [
        say("Listening", "A black croissant. So this is the trend.", "Hmm?"),
        say("Smiling", "Food that looks burnt on purpose. People pay extra for it.", "*laughs*"),
        makoto("I didn't take you for someone who follows food trends."),
        say("FacingRight", "I am not. At the dojo my days were full. Here there is no dojo, and so I notice croissants."),
        say("Neutral", "I will eat it. Thank you.", "Well."),
      ],
    },
    SonicCupaNoodle: {
      reaction: "Liked",
      brief: [
        "Sakura gives a short history on the cup noodles and the war.",
        "Makoto forgets to be scared for a moment due to how great of a storyteller she is.",
      ],
      lines: [
        say("Neutral", "Cup noodles. Do you know where they come from?", "Hmm?"),
        makoto("A... factory?"),
        say("ListeningEyesClosed", "After the war there was American wheat and nobody knew how to eat it. One man spent a year in a shed."),
        say("Listening", "He fried the noodles to dry them. The cup came later, from watching foreigners break them into a mug."),
        think("I've completely forgotten to be scared. She tells a story like a documentary with the volume down."),
        say("Smiling", "Three seconds and it is ready. Thirty seconds and it is ruined. Like most things.", "Well then."),
      ],
    },
    RoyalCurry: {
      reaction: "Okay",
      brief: [
        "Sakura doesn't think much of this dish. These foods are far too salty.",
        "She briefly mentions a pork ramen with clear broth.",
      ],
      lines: [
        say("Irked", "Curry from a packet. Salt, fat, and colour.", "Hmm."),
        say("Neutral", "If you wish to feed me, find a pork ramen with a clear broth. Clear. Not that cloudy sludge."),
        makoto("I'll keep an eye out."),
        say("FacingRight", "You will not find it here. I know. I have checked.", "Damn."),
      ],
    },
    Ration: {
      reaction: "Liked",
      brief: [
        "Sakura likes the practicality of this gift. Well done Makoto.",
      ],
      lines: [
        say("Neutral", "Rations. Sealed, dense, and they keep.", "Mmm."),
        say("Smiling", "A practical gift. Well done, Makoto. I did not expect that sentence to leave my mouth today."),
        makoto("Neither did I."),
      ],
    },
    FlotationDonut: {
      reaction: "Liked",
      brief: [
        "Sakura likes the fact that the flotation device looks like a donut. She",
        "mentions the importance of learning to swim, and seems visibly sad when she",
        "considers how many people drowned in relatively shallow water.",
        "Makoto confirms that he knows how to swim when asked.",
      ],
      lines: [
        say("Smiling", "A float shaped like a donut. Hina would lose her mind.", "*laughs*"),
        say("Neutral", "Can you swim, Makoto?", "So then,"),
        makoto("Yes. Not well, but yes.", "Yes."),
        say("ListeningEyesClosed", "Good. Most people who drown do it in water they could have stood up in. They panic, and then they stop."),
        say("FacingRight", "..."),
        think("She went quiet. I think she's counting people. I'm going to leave her to it."),
      ],
    },
    OverflowingLunchBox: {
      reaction: "Liked",
      brief: [
        "Good food keeps you going. Presumably she eats about 3 of these for breakfast.",
      ],
      lines: [
        say("Smiling", "A full lunch box. Rice, vegetables, mushrooms. This is fuel.", "Mmm."),
        say("Neutral", "I eat three of these before training. Four if I am to spar."),
        makoto("Three. Before breakfast."),
        say("Listening", "This is breakfast.", "So?"),
      ],
    },
    SunflowerSeeds: {
      reaction: "Liked",
      brief: [
        "Good for chewing, also contains vitamin E and some fat.",
        "Some use it as a substitute for smoking while trying to quit.",
        "She seems to approve.",
      ],
      lines: [
        say("Neutral", "Sunflower seeds. Vitamin E, some fat, and something to do with the jaw.", "Hmm."),
        say("Listening", "Men at the dojo chew them when they are quitting cigarettes. It gives the hands a job."),
        makoto("I don't smoke."),
        say("Smiling", "Then your hands are free to train. Good.", "Well."),
      ],
    },
    Birdseed: {
      reaction: "Okay",
      brief: [
        "Sakura asks Makoto where the birds she is meant to feed is.",
        "Makoto starts to panic, but it was only a joke.",
      ],
      lines: [
        say("Neutral", "Birdseed.", "Huh."),
        say("Irked", "Where are the birds, Makoto?"),
        makoto("The... I don't... there aren't any birds, I just thought..."),
        say("Listening", "You have given me food for birds in a building with no birds. Where am I meant to spread it?"),
        makoto("I can take it back, I'm sorry, I'll just...", "Oh, sorry."),
        say("Smiling", "A joke. Breathe.", "*laughs*"),
        think("I didn't know she did jokes. I'm not sure I'm glad I know now."),
      ],
    },
    KittenHairclip: {
      reaction: "Liked",
      brief: [
        "Sakura says she used to have something similar when she was a little girl.",
        "Presumably when she was a little girl she could still deck Makoto.",
      ],
      lines: [
        say("Smiling", "A kitten. I had one like this when I was small.", "Well."),
        makoto("You were small?"),
        say("Neutral", "I was six. I was already taller than you.", "Mmm."),
        think("Six-year-old Sakura could have knocked me out. Present Sakura is being nice about this. Keep it that way."),
      ],
    },
    EverlastingBracelet: {
      reaction: "Okay",
      brief: [
        "Sakura simply thanks him for the gift. Would it even fit on her wrist?",
      ],
      lines: [
        say("Neutral", "A bracelet. Thank you.", "Mmm."),
        think("She's holding it up to her wrist. The bracelet is a standard wrist size. Her wrist is not."),
        say("Listening", "It will fit. I will make it fit.", "Perhaps."),
      ],
    },
    LoveStatusRing: {
      reaction: "Okay",
      brief: [
        "A pleasant bauble. Makoto gets the feeling she won't be wearing it.",
      ],
      lines: [
        say("Listening", "A ring. Right hand looking, left hand found.", "Hmm."),
        say("Neutral", "I will put it somewhere safe.", "Well."),
        think("Somewhere safe. A drawer. The bottom of a drawer, under the heavier things."),
      ],
    },
    ZolesDiamond: {
      reaction: "Liked",
      brief: [
        "Jewellery diamonds are a monopoly owned by De Bears. Sakura explains the economics of",
        "supply and demand to Makoto in as few words as possible.",
      ],
      lines: [
        say("Listening", "A Zoles diamond. Do you know why these cost what they cost?", "Hmm?"),
        makoto("Because they're rare?"),
        say("Neutral", "No. One company owns the mines and sells a few at a time. Scarce supply, steady demand, high price."),
        say("Smiling", "That was economics. It took eleven words. Thank you for the gift.", "Well then."),
      ],
    },
    HopesPeakRing: {
      reaction: "Okay",
      brief: [
        "Neither Sakura nor Makoto could understand why the school has its own ring merchandise.",
      ],
      lines: [
        say("Irked", "A ring with the school crest on it.", "Hmm."),
        makoto("Why does a school have merchandise?"),
        say("Neutral", "I do not know. Perhaps the school wished to be remembered. Perhaps it wished to be paid.", "Perhaps."),
        makoto("Both, probably."),
      ],
    },
    BlueberryPerfume: {
      reaction: "Liked",
      brief: [
        "Sakura likes to use perfume in the bathroom, not on her person. Still, she likes it.",
        "Makoto wonders if he'll get beheaded for commenting on that.",
        "Like, with a chop. Like, with bare hands.",
      ],
      lines: [
        say("Smiling", "Blueberry. Good. I keep perfume in the bathroom.", "Well."),
        makoto("You... wear perfume in the bathroom?"),
        say("Neutral", "I do not wear it. I spray it. In the bathroom. Afterwards."),
        think("Oh. OH. Do not comment. Do not comment. She can take a head off with one chop. With her hand."),
        makoto("Great! Great. Enjoy the... fragrance."),
      ],
    },
    ScarabBrooch: {
      reaction: "Loved",
      brief: [
        "Makoto gets it out just to show her and ask her what she thinks, but she misunderstands",
        "as him giving her it. He almost opens his mouth to say \"Wait, that wasn't what I meant to give you\",",
        "but he chooses to continue being five foot 3 instead of 2 foot zero, which he'd be after getting flattened.",
      ],
      lines: [
        makoto("Hey, Sakura, what do you think of this? I found it and I wasn't sure if..."),
        say("Angry", "A scarab.", "What?"),
        say("Smiling", "For me? The sacred beetle of the old kingdoms. You chose this for me.", "I see."),
        think("I was going to say \"wait, that wasn't what I meant.\" I'm choosing not to."),
        think("Five foot three is a fine height. Two foot zero, which is what I'd be after she flattened me, is not."),
        makoto("Yes. Yes, I chose it. For you.", "Yes."),
        say("Neutral", "I will treasure it.", "Mmm."),
      ],
    },
    GodofWarCharm: {
      reaction: "Loved",
      brief: [
        "Sakura loves this charm. She proclaims that she has many artworks around the dojo",
        "Makoto is happy, though he only really knows God of War from his PSP",
      ],
      lines: [
        say("Smiling", "Kashima. Guardian of the martial arts. There are a dozen likenesses of him around my dojo.", "I see."),
        say("Neutral", "You could not have chosen better.", "Well then."),
        think("I thought it was the one from the game on my PSP. The angry bald man. I'm keeping that to myself."),
        makoto("I knew you'd like it.", "Yeah."),
      ],
    },
    MacsGloves: {
      reaction: "Liked",
      brief: [
        "Sakura likes this. She asks Makoto to take up boxing once he gets out, to fix",
        "his 'noodleism'. He agrees, half out of fear and the other half also out of fear.",
      ],
      lines: [
        say("Smiling", "Boxing gloves. There is passion in these.", "Mmm."),
        say("Neutral", "When we get out, Makoto, you will take up boxing. It will cure your noodleism."),
        makoto("My what?", "What?"),
        say("Listening", "You are shaped like a noodle. Boxing will fix that. Agree."),
        makoto("I agree.", "Yes."),
        think("Half of that was fear. The other half was also fear, from a different angle."),
      ],
    },
    Glasses: {
      reaction: "Okay",
      brief: [
        "Sakura does not need glasses to see, but she recalls Hina wanting some for some reason.",
      ],
      lines: [
        say("Listening", "Glasses. My eyes are fine.", "Hmm."),
        say("Neutral", "Hina wanted a pair last week. She said they would make her look like she reads.", "Hina."),
        makoto("Does she read?"),
        say("FacingRight", "No.", "Huh."),
      ],
    },
    GSick: {
      reaction: "Okay",
      brief: [
        "A time keeping device. Sakura does not like to be late.",
      ],
      lines: [
        say("Neutral", "A watch. Cheap, but it tells the time.", "Hmm."),
        say("Listening", "I am never late. Lateness is a decision to waste someone else's life."),
        makoto("I'm late to most things."),
        say("Irked", "I know.", "Well."),
      ],
    },
    RollerSlippers: {
      reaction: "Disliked",
      brief: [
        "Rollers in the slippers. A symbol of laziness, with wheels to make it so you don't even",
        "need to walk.",
      ],
      lines: [
        say("Irked", "Slippers with wheels.", "What?"),
        say("Angry", "Someone looked at walking across a room and decided it was too much. You have brought me that person's legacy."),
        makoto("They're kind of fun, though..."),
        say("Furious", "Fun is what the weak call rot.", "*Growls*"),
        think("I'm going to go stand somewhere with less of me in it."),
      ],
    },
    RedScarf: {
      reaction: "Okay",
      brief: [
        "The scarf looks almost small on her frame. She accepts his gift.",
      ],
      lines: [
        say("Neutral", "A scarf. Worn. Someone fought in this.", "Hmm."),
        think("She put it on. On her it's a tie. A small tie."),
        say("Smiling", "It will do. Thank you.", "Mmm."),
      ],
    },
    LeafCovering: {
      reaction: "Hated",
      brief: [
        "\"I will take this to the incinerator. Next time, I will be taking you also\".",
      ],
      lines: [
        say("Angry", "..."),
        say("Furious", "I will take this to the incinerator.", "How dare you!"),
        say("Angry", "Next time, I will be taking you also."),
        makoto("Understood.", "I understand."),
        think("I'm not going to think about this. I'm going to go lie down and not think about this."),
      ],
    },
    TornekosPants: {
      reaction: "Liked",
      brief: [
        "She likes how these pants actually fit her legs. Makoto says nothing about",
        "the design intending to be baggy, nor how they're actually three quarter pants",
        "and not shorts.",
      ],
      lines: [
        say("Smiling", "Pants that fit my legs. Finally.", "Well."),
        say("Neutral", "Most are cut for people built like you. These were cut for a person."),
        think("They're meant to be baggy. They're also three-quarter length, so on her they're shorts."),
        think("I will take both facts to my grave, which I'd like to be far from today."),
        makoto("They look great.", "Yeah."),
      ],
    },
    BunnyEarmuffs: {
      reaction: "Liked",
      brief: [
        "Unexpectedly Sakura likes rabbits. She then goes on to explain how to skin",
        "one and extract as much meat as possible. \"It died, so that you can live a",
        "strong life. Do not waste anything\".",
      ],
      lines: [
        say("Smiling", "Rabbits. I like rabbits.", "Mmm."),
        makoto("Oh! That's unexpectedly..."),
        say("ListeningEyesClosed", "Cut around the hind legs, then peel downward in one motion. The hide comes off like a sock."),
        say("Listening", "The meat is on the back and the thighs. Save the bones for stock."),
        makoto("..."),
        say("Neutral", "It died so that you can live a strong life. Do not waste anything.", "Well then."),
        think("That started as earmuffs and ended somewhere I can't come back from."),
      ],
    },
    FreshBindings: {
      reaction: "Loved",
      brief: [
        "A practical gift. For Sakura, there is nothing better.",
      ],
      lines: [
        say("Smiling", "Bindings. Clean cotton.", "I see."),
        say("Neutral", "Wrapped tight, they hold the body together and the mind with it. There is no better gift. None.", "Well then."),
        makoto("I was worried it was too plain."),
        say("Listening", "Plain is what working looks like.", "Mmm."),
      ],
    },
    JimmyDecayTShirt: {
      reaction: "Okay",
      brief: [
        "A T shirt that does not fit. Sakura will probably tear this up and use it as",
        "a rag.",
      ],
      lines: [
        say("Listening", "A shirt. A small shirt.", "Hmm."),
        makoto("It's a limited edition. Only a hundred were made."),
        say("Neutral", "Then it will be a limited edition rag. Thank you.", "Mmm."),
      ],
    },
    EmperorsThong: {
      reaction: "Disliked",
      brief: [
        "She asks (or more like demands) Makoto explain why he has given her a thong.",
        "Makoto saves himself by saying he thought it was some kind of exercise band.",
      ],
      lines: [
        say("Angry", "Explain. Now.", "What?"),
        makoto("I thought it was an exercise band! For resistance! You stretch it!", "Wait, no!"),
        say("Irked", "..."),
        say("Neutral", "It is not an exercise band.", "Hmm."),
        makoto("I see that now."),
        say("FacingRight", "Leave. Before I decide what it is.", "Well."),
      ],
    },
    HandBra: {
      reaction: "Hated",
      brief: [
        "She is disappointed. This is not something you give to a friend who you only",
        "met days prior.",
      ],
      lines: [
        say("Irked", "...", "*Groans*"),
        say("Angry", "We met days ago, Makoto. Days. This is not what you hand to someone you met days ago."),
        say("FacingRight", "I am disappointed. I did not think you had the range.", "I see."),
        think("I'd rather she hit me. Disappointment lasts longer."),
      ],
    },
    Waterlover: {
      reaction: "Liked",
      brief: [
        "Swimming is important. She ponders whether the 10% faster claim could be",
        "verified, and concludes she will ask Hina. Nonetheless, a good gift.",
      ],
      lines: [
        say("Neutral", "A competition swimsuit. Ten percent faster, it says.", "Hmm."),
        say("Listening", "Ten percent of what? Measured how? Against whom?"),
        makoto("I don't think the label goes into it."),
        say("Smiling", "Hina will know. Hina will talk about it for an hour. I accept.", "Well."),
      ],
    },
    DemonAngelPrincessFigure: {
      reaction: "Disliked",
      brief: [
        "Demons are not to be taken lightly, she says. Nor princesses, either for some reason.",
        "She says toys like this distract from a virtuous, strong life.",
      ],
      lines: [
        say("Irked", "A demon. Dressed as a princess.", "Hmm."),
        say("Angry", "Demons are not to be taken lightly. Nor are princesses, in my experience."),
        makoto("In your... experience?"),
        say("Neutral", "Toys like this distract from a virtuous life. Take it to Hifumi. He will weep.", "Well."),
      ],
    },
    AstralBoyDoll: {
      reaction: "Disliked",
      brief: [
        "She says toys like this distract from a virtuous, strong life.",
      ],
      lines: [
        say("Irked", "A doll of a television man.", "Huh."),
        say("Neutral", "Toys like this distract from a virtuous, strong life. I have said this before. I will say it until it is heard."),
        think("She's going to be saying it a lot, then."),
      ],
    },
    Shears: {
      reaction: "Okay",
      brief: [
        "It may come in handy.",
      ],
      lines: [
        say("Neutral", "Scissors.", "Hmm."),
        say("Listening", "They may come in handy. Hair grows. So does everything else in this place.", "Perhaps."),
      ],
    },
    LayeringShears: {
      reaction: "Okay",
      brief: [
        "It may come in handy.",
      ],
      lines: [
        say("Neutral", "Styling scissors. Sharp.", "Hmm?"),
        makoto("Watch the edges."),
        say("Listening", "I was born watching edges. They may come in handy.", "Perhaps."),
      ],
    },
    QualityChinchillaCover: {
      reaction: "Disliked",
      brief: [
        "A seat cover, for a bike that she doesn't have. Great.",
      ],
      lines: [
        say("Irked", "A seat cover.", "What?"),
        say("Neutral", "For a bicycle. I do not own a bicycle. I run."),
        makoto("You could... sit on it?"),
        say("Angry", "I could sit on you.", "Hmm."),
        think("She could. I believe her. I'm going to stop making suggestions."),
      ],
    },
    KirlianCamera: {
      reaction: "Okay",
      brief: [
        "She seems interested until she realises the camera has no film.",
      ],
      lines: [
        say("Listening", "A camera that photographs the field around a body. Interesting. Mine would be considerable.", "Hmm?"),
        say("Irked", "There is no film.", "Huh."),
        makoto("There's no film."),
        say("Neutral", "Then it is a box. A box that promised something.", "Well."),
      ],
    },
    AdorableReactionsCollection: {
      reaction: "Disliked",
      brief: [
        "Time spent watching a DVD is time wasted.",
        "Time spent watching this particular DVD is unforgivable.",
      ],
      lines: [
        say("Irked", "A DVD. Of people. Looking at things.", "What?"),
        say("Angry", "Time spent watching a DVD is time stolen from the body. Time spent watching this one is unforgivable."),
        makoto("Hifumi said it was moving."),
        say("Furious", "Hifumi moves very little.", "*Growls*"),
      ],
    },
    Tumbleweed: {
      reaction: "Disliked",
      brief: [
        "She doesn't know where he found this, but tells him to put it back.",
      ],
      lines: [
        say("Irked", "Where did you find this.", "What?"),
        makoto("It was just... rolling. Down the hall."),
        say("Angry", "Put it back.", "Well."),
        makoto("Back where?"),
        say("Neutral", "Wherever it was going. It had somewhere to be. Unlike you."),
      ],
    },
    UnendingDandelion: {
      reaction: "Disliked",
      brief: [
        "She says toys like this distract from a virtuous, strong life.",
      ],
      lines: [
        say("Listening", "A dandelion on a string. You blow, it returns.", "Hmm."),
        say("Irked", "Toys like this distract from a virtuous, strong life. This one also teaches the wrong lesson."),
        makoto("What lesson?"),
        say("Neutral", "That what you blow away comes back. It does not. Train harder.", "Well."),
      ],
    },
    RoseinVitro: {
      reaction: "Loved",
      brief: [
        "Unexpectedly she loves this gift. She reminisces of the flowers that grow outside",
        "the dojo. She likes to be seen as a woman, possibly something she",
        "struggles with given her stature.",
      ],
      lines: [
        say("Listening", "A rose. In glass.", "Hmm?"),
        say("Smiling", "Roses grew along the wall outside the dojo. My mother cut them back every spring and they came back angrier.", "I see."),
        say("FacingRight", "Few people give me flowers. They give me protein.", "Some protein."),
        makoto("You're a woman, Sakura. Flowers are allowed."),
        say("Smiling", "...Thank you, Makoto.", "Well then."),
        think("She went quiet in the good way this time. I think. I'm about seventy percent on that."),
      ],
    },
    CherryBlossomBouquet: {
      reaction: "Liked",
      brief: [
        "A bouquet of flowers. She likes to be seen as a woman, possibly something she",
        "struggles with given her stature.",
      ],
      lines: [
        say("Listening", "Cherry blossom. \"A woman of superior beauty,\" the flower books say.", "Hmm."),
        makoto("I didn't know that when I picked it. But it fits."),
        say("Smiling", "You are a poor liar and I am choosing to accept it. Thank you.", "Well."),
        think("She's holding the bouquet like it might break. That's the gentlest I've ever seen her hands."),
      ],
    },
    RoseWhip: {
      reaction: "Disliked",
      brief: [
        "She admits she has no interest in this kind of exercise.",
      ],
      lines: [
        say("Irked", "A whip. Made of roses.", "What?"),
        say("Neutral", "I have no interest in this kind of exercise."),
        makoto("What kind of exercise is..."),
        say("FacingRight", "Do not finish that sentence.", "Well."),
      ],
    },
    Zantetsuken: {
      reaction: "Disliked",
      brief: [
        "A toy, a distraction.",
      ],
      lines: [
        say("Irked", "A sword that cuts nothing.", "Hmm."),
        say("Neutral", "A toy. A distraction. Give it to someone with time to waste.", "Well."),
        makoto("So... me?"),
        say("Listening", "Yes.", "Mmm."),
      ],
    },
    Muramasa: {
      reaction: "Disliked",
      brief: [
        "A toy, a distraction.",
      ],
      lines: [
        say("Irked", "This weapon does not exist. It says so on the box.", "What?"),
        say("Neutral", "A toy, then. A distraction. The strongest sword in a world that is not this one.", "Hmm."),
        think("She read the box more carefully than I did. She reads everything more carefully than I do."),
      ],
    },
    RaygunZurion: {
      reaction: "Disliked",
      brief: [
        "A toy, a distraction.",
      ],
      lines: [
        say("Listening", "A raygun. One shot melts a man.", "Hmm?"),
        say("Irked", "No batteries. So it is a toy, and a distraction, and it is also plastic."),
        makoto("I can find batteries..."),
        say("Angry", "Do not find batteries.", "Hey!"),
      ],
    },
    GoldenGun: {
      reaction: "Disliked",
      brief: [
        "A toy, a distraction. It's made of real metal, she notes, but not gold.",
      ],
      lines: [
        say("Listening", "Heavy. Real metal.", "Hmm."),
        say("Irked", "Not gold. Brass, perhaps. Painted. A toy wearing a costume."),
        say("Neutral", "A distraction. I do not want it. I will keep it so it does not distract you either.", "Well."),
      ],
    },
    BerserkerArmor: {
      reaction: "Okay",
      brief: [
        "Not something that allows any real mobility. She speaks briefly of well-designed",
        "armor, the interlocking pieces. Makoto pays full attention, too scared not to.",
        "She accepts the gift, but looks like she enjoyed speaking about armor.",
      ],
      lines: [
        say("Irked", "This armour allows no movement. You would be cut down tying your shoes.", "Hmm."),
        say("ListeningEyesClosed", "Good armour is plates sliding over each other. The joint is the problem. Solve that and you have a soldier."),
        say("Listening", "The old smiths understood this. They built the elbow first and the rest around it."),
        think("I'm nodding. I'm nodding a lot. I could not stop nodding if I tried."),
        say("Neutral", "I will keep it. It is not good armour. But it was good to speak of armour.", "Well then."),
      ],
    },
    SelfDestructingCassette: {
      reaction: "Okay",
      brief: [
        "Not something she has a use for, but the nuance intrigues her.",
      ],
      lines: [
        say("Listening", "A tape that destroys itself once heard.", "Hmm?"),
        say("Neutral", "I have no use for it. And yet there is something in it. A message that exists once and is gone."),
        say("FacingRight", "Like a strike. You do not get it back.", "Perhaps."),
        think("She's turning it over in her hands like it owes her an answer."),
      ],
    },
    SilentReceiver: {
      reaction: "Disliked",
      brief: [
        "When Makoto explains what it is, she apologizes: I have no use for this.",
      ],
      lines: [
        say("Listening", "A telephone.", "Hmm?"),
        makoto("It doesn't let you hear them, and they can't hear you."),
        say("Irked", "...", "Huh."),
        say("Neutral", "I'm sorry. I have no use for this. I am not sure anyone does.", "I'm sorry."),
      ],
    },
    PrettyHungryCaterpillar: {
      reaction: "Disliked",
      brief: [
        "A toy, a distraction. She notes that small children would enjoy playing with",
        "the toy, as a way for them to learn cause and effect.",
      ],
      lines: [
        say("Irked", "A caterpillar on a string.", "Hmm."),
        say("Neutral", "A toy. A distraction. For a small child it teaches cause and effect. Pull, and it moves."),
        makoto("And for me?"),
        say("Listening", "For you it teaches that I am not a small child.", "Well."),
      ],
    },
    OldTimeyRadio: {
      reaction: "Okay",
      brief: [
        "Sakura admits she doesn't have much use for a radio. She is very concerned that",
        "none of the radio frequencies are picking anything up.",
      ],
      lines: [
        say("Neutral", "A radio. I have little use for one.", "Hmm."),
        say("Listening", "...", "Wait."),
        say("Irked", "Nothing. Not one station. Not even static with a voice in it."),
        makoto("Monokuma said we're cut off."),
        say("FacingRight", "Saying it and proving it are different things. This proves it.", "This is bad."),
      ],
    },
    MrFastball: {
      reaction: "Okay",
      brief: [
        "Sakura has never played baseball, which surprises Makoto. She was never allowed to",
        "play with the boys, and she wasn't allowed to join the girls team either. A lonely",
        "childhood, she must have had Makoto thinks.",
      ],
      lines: [
        say("Listening", "A ball that tells you how hard you threw it.", "Hmm?"),
        makoto("You've never used one? I thought everyone threw a baseball at some point."),
        say("Neutral", "The boys would not let me play with them. The girls' team would not have me either.", "Well."),
        say("FacingRight", "So I trained. Alone is quiet. Quiet is useful."),
        think("That's the loneliest thing anyone has said to me here, and she said it like a weather report."),
        makoto("You can throw it at me sometime. Gently.", "Yeah."),
      ],
    },
    AntiqueDoll: {
      reaction: "Liked",
      brief: [
        "Sakura likes the craftsmanship of this doll. She spends a moment commenting on Japan's",
        "culture of elite craftsman, and mastership.",
        "Makoto secretly is just happy he can get that creepy doll out of his room.",
      ],
      lines: [
        say("Smiling", "Porcelain. Look at the stitching on the sleeve. A master did this.", "I see."),
        say("ListeningEyesClosed", "This country once gave a craftsman his whole life for one skill. Fifty years on a single kind of hinge."),
        makoto("Mm-hmm.", "Mm-hmm."),
        think("Its eyes followed me around my room for a week. Now they can follow her. She can take it."),
        say("Neutral", "Thank you. It will sit where I can see it.", "Well."),
      ],
    },
    CrystalSkull: {
      reaction: "Okay",
      brief: [
        "Makoto tries to make a joke about Indiano James but it doesn't land.",
      ],
      lines: [
        makoto("A crystal skull! Like in that movie. Indiano James and the... you know."),
        say("Listening", "...", "Hmm?"),
        makoto("The one with the whip. And the hat."),
        say("Neutral", "I do not know that one.", "Huh."),
        say("Smiling", "It is a skull. Carved. I will keep it. Thank you.", "Mmm."),
        think("Nothing. Not a flicker. I'd have had better luck explaining the plot to the skull."),
      ],
    },
    GoldenAirplane: {
      reaction: "Okay",
      brief: [
        "Makoto tries to make a joke about Indiano James but it doesn't land.",
      ],
      lines: [
        makoto("A golden airplane! Indiano James would've grabbed this and run from a boulder."),
        say("Irked", "You have told me about this man before.", "Hmm."),
        makoto("It's the same guy, I thought maybe the second time..."),
        say("Neutral", "It is not. I accept the airplane.", "Well."),
        think("Twice now. I'm retiring the bit. The bit is dead. Sakura killed it with her face."),
      ],
    },
    PrinceShotokusGlobe: {
      reaction: "Liked",
      brief: [
        "Before Makoto can hardly say anything, Sakura smiles. Interesting, I was thinking",
        "about this just yesterday, idly. She goes on to explain what it is.",
        "Makoto pays full attention.",
      ],
      lines: [
        say("Smiling", "Interesting. I was thinking about this only yesterday.", "I see."),
        makoto("You were thinking about a globe?"),
        say("ListeningEyesClosed", "A round earth, carved centuries before anyone sailed around it. The carver guessed, or knew and was ignored."),
        say("Listening", "I prefer the second. A truth nobody accepts is still a truth. It is just lonely."),
        think("I'm paying attention. Full attention. I didn't know I had this much attention in me."),
        say("Neutral", "Thank you, Makoto.", "Well then."),
      ],
    },
    MoonRock: {
      reaction: "Okay",
      brief: [
        "Sakura accepts the gift, but notes that man spent so much effort going to the moon,",
        "but very little effort bettering himself (speaking in the second person).",
        "Makoto never realised she was such a philosopher.",
      ],
      lines: [
        say("Listening", "A piece of the moon.", "Hmm."),
        say("Neutral", "You spent a decade and a nation's wealth to reach a rock in the sky. And you still cannot do ten push-ups."),
        makoto("I personally didn't..."),
        say("FacingRight", "You. Mankind. The same word.", "So?"),
        think("I didn't know she was a philosopher. A philosopher who can bench a car, but still."),
      ],
    },
    AsurasTears: {
      reaction: "Loved",
      brief: [
        "This holds significant spiritual importance to Sakura.",
      ],
      lines: [
        say("Angry", "...", "Wait."),
        say("Smiling", "Asura's Tears. Do you know what these are, Makoto?", "I see."),
        makoto("A jewel? It said something about the devil having friends."),
        say("ListeningEyesClosed", "The warrior god wept because even his enemies had someone. Strength with nobody beside you is only weight."),
        say("Neutral", "This means a great deal to me. I will not forget who gave it.", "Well then."),
        think("She's holding it to her chest. I've never seen her hold anything like it mattered."),
      ],
    },
    SecretsoftheOmoplata: {
      reaction: "Loved",
      brief: [
        "This holds significant spiritual importance to Sakura.",
      ],
      lines: [
        say("Smiling", "The Omoplata. The shoulder lock. I have searched for this text for years.", "I see."),
        say("ListeningEyesClosed", "It is not a book of holds. It is a book about yielding until the other person has given you their arm."),
        say("Neutral", "You have given me something sacred, Makoto. I am not certain you know that.", "Well then."),
        makoto("I... really don't know what to say.", "I... really don't know what to say."),
        say("Smiling", "Then say nothing. It suits you.", "Mmm."),
      ],
    },
    MillenniumPrizeProblems: {
      reaction: "Okay",
      brief: [
        "Mathematics keeps the brain active, and problem solving grows the number of connections",
        "in the brain. Makoto thinks to himself that his brain is probably completely smooth.",
        "He then thinks to himself that Hina's is probably so smooth you could see yourself in its",
        "reflection.",
      ],
      lines: [
        say("Listening", "Mathematics. Seven problems, a million dollars each.", "Hmm."),
        say("Neutral", "Problem solving grows connections in the brain. It is a muscle like any other. Most people let it sag."),
        think("Mine is smooth. Completely smooth. A marble. Nothing has ever stuck to it."),
        think("Hina's is probably so smooth you could fix your hair in the reflection."),
        say("Smiling", "I will try one tonight. Thank you.", "Well."),
      ],
    },
    TheFunplane: {
      reaction: "Liked",
      brief: [
        "Video game device. She finds it interesting and immediately finds the workout app",
        "that seems preinstalled on it. Makoto thinks she might be the only person to A. open the app, and B.",
        "keep it open.",
      ],
      lines: [
        say("Listening", "A game machine. Touchscreen. Music. Videos.", "Hmm?"),
        say("Neutral", "There is a fitness program on it. Squats. Planks. It counts for you."),
        makoto("That... came with it? Nobody uses that."),
        say("Smiling", "I will use it. Daily. It will learn my name.", "Well then."),
        think("She's the only person alive who will open that app, and the only one who will leave it open."),
      ],
    },
    ProjectZombie: {
      reaction: "Okay",
      brief: [
        "Zombies. Sakura seems uninterested in this fictional horror game.",
      ],
      lines: [
        say("Listening", "A game. Zombies, and a model who commands them.", "Hmm."),
        say("Neutral", "I have no interest in imagined horror. There is enough of the real kind in this building."),
        makoto("Fair."),
        say("FacingRight", "I will keep it. Hifumi will want it, and he will have to ask me.", "Well."),
      ],
    },
    PaganDancer: {
      reaction: "Okay",
      brief: [
        "A power tripping game. Real power comes with hard work, and it is one that cannot",
        "be imposed on another (person).",
        "Makoto wonders if he should be writing this wisdom down.",
      ],
      lines: [
        say("Irked", "You play a god. You punish mortals.", "Hmm."),
        say("Neutral", "Real power is built with the hands, slowly, and it cannot be imposed on another person. Only shown."),
        think("Should I be writing this down? I feel like I should be writing this down."),
        say("Listening", "I accept it. I will not play it.", "Well."),
      ],
    },
    TipsTips: {
      reaction: "Okay",
      brief: [
        "Tips for video games. Sakura takes this time to say that asking for help is another",
        "form of strength sometimes.",
      ],
      lines: [
        say("Listening", "A book of hints. For games.", "Hmm?"),
        makoto("It's basically cheating."),
        say("Neutral", "No. Asking for help is a kind of strength. The weak pretend they do not need it."),
        say("FacingRight", "Though I will not be using it.", "Mmm."),
        makoto("Of course not."),
      ],
    },
    MaidensHandbag: {
      reaction: "Okay",
      brief: [
        "The handbag looks small next to Sakura. Still, she accepts the gift.",
      ],
      lines: [
        say("Neutral", "A handbag.", "Hmm."),
        think("On her arm it's a coin purse. A coin purse with a strap."),
        say("Smiling", "I will carry it. It will hold my keys, if I ever see them again.", "Well."),
      ],
    },
    KokeshiDynamo: {
      reaction: "Loved",
      brief: [
        "Initially Sakura doesn't know what this is.",
        "Makoto has an awful thought as he's handing this over. 'Wait, is that a vibrator. Did I just give a vibrator",
        "to Sakura. I'm about to die. This is it.'",
        "She instead turns it on, and her reaction is good:",
        "\"You have given me a device for muscle massage. Pertinent after an intense workout to loosen muscle fibers",
        "and prevent cramps.\"",
        "\"A very thoughtful gift, Makoto.\"",
      ],
      lines: [
        say("Listening", "What is this.", "Hmm?"),
        think("Wait. Wait. Is that a... did I just hand Sakura Ogami a... I'm going to die. This is it. In a hallway."),
        say("Neutral", "...", "Hmm."),
        say("Smiling", "A device for muscle massage. Pertinent after a hard workout, to loosen the fibres and prevent cramps.", "I see."),
        say("Neutral", "A very thoughtful gift, Makoto.", "Well then."),
        makoto("Yes. That's what it's for. That's exactly what it's for.", "Yes."),
        think("I'm alive. I'm alive, and I am never going to explain anything to anyone ever again."),
      ],
    },
    TheSecondButton: {
      reaction: "Disliked",
      brief: [
        "A spare button. Who would like getting this as a gift?",
      ],
      lines: [
        say("Irked", "A button.", "What?"),
        makoto("It's the second button. From a uniform. It's supposed to be romantic."),
        say("Angry", "It is a button. Who is pleased to receive a button?"),
        say("Neutral", "Sew it back on. Something of yours is flapping open.", "Well."),
      ],
    },
    SomeonesGraduationAlbum: {
      reaction: "Disliked",
      brief: [
        "Why would I want this? Put thought into gifts, friendship is not cheap.",
      ],
      lines: [
        say("Irked", "Someone's album. The pages are blank.", "Hmm."),
        say("Angry", "Why would I want this? Put thought into a gift. Friendship is not cheap. Stop treating it as if it were."),
        makoto("I'm sorry.", "Oh, sorry."),
        say("FacingRight", "Be better.", "Well."),
      ],
    },
    Vise: {
      reaction: "Okay",
      brief: [
        "I am not a craftsman, though I appreciate the work that others do.",
      ],
      lines: [
        say("Listening", "A vise. Heavy. Honest.", "Hmm."),
        say("Neutral", "I am not a craftsman. But I respect the ones who are. Their hands know things mine do not."),
        makoto("Yours know how to break things."),
        say("Smiling", "Theirs know how to fix them. Both are needed. Thank you.", "Well."),
      ],
    },
    SacredTreeSprig: {
      reaction: "Liked",
      brief: [
        "Sakura likes the spirituality of this. She says if more people took this kind",
        "of thing seriously, the world would be a lot better.",
      ],
      lines: [
        say("Smiling", "Sakaki. The branch that joins us to the gods.", "I see."),
        say("ListeningEyesClosed", "If more people took this seriously, they would be quieter, and the world would be better for it."),
        makoto("Quieter?"),
        say("Neutral", "You would be a start.", "Mmm."),
      ],
    },
    Pumice: {
      reaction: "Okay",
      brief: [
        "Sakura talks about the physical properties of pumice. It floats, and because of the holes,",
        "It's also a half decent insulator.",
        "Makoto pays full attention, too scared to do anything else.",
      ],
      lines: [
        say("Listening", "Pumice. It floats, you know.", "Hmm?"),
        makoto("A floating rock."),
        say("ListeningEyesClosed", "Volcanic foam, cooled fast. The holes trap air, so it floats, and the same holes make it a passable insulator."),
        think("I'm paying full attention. Not because it's interesting. Because of what's holding the rock."),
        say("Neutral", "Use it on your heels. They sound like gravel when you walk.", "Well."),
      ],
    },
    Oblaat: {
      reaction: "Okay",
      brief: [
        "Sakura gives a short history on Oblaat.",
        "Makoto pays full attention, too scared to do anything else.",
      ],
      lines: [
        say("Listening", "Oblaat. Starch, pressed into a sheet thin enough to read through.", "Hmm."),
        say("ListeningEyesClosed", "The Dutch brought it as a wafer for the church. Here it was used to wrap medicine so children would swallow it."),
        think("I know more about edible paper now than I know about my own house. I have never been this alert."),
        say("Neutral", "Thank you. It will wrap something.", "Well."),
      ],
    },
    WaterFlute: {
      reaction: "Okay",
      brief: [
        "Sakura admits to not being able to play any instruments.",
        "Makoto thinks to himself that the sounds of her opponents getting punched is probably",
        "what counts for music in Sakura's world.",
      ],
      lines: [
        say("Listening", "A flute that sounds like a bird when it has water in it.", "Hmm?"),
        say("Neutral", "I cannot play an instrument. Not one. My hands were busy."),
        think("Her music is probably the sound of an opponent hitting the mat. One long, flat note."),
        say("Smiling", "I will blow into it once and then give it to Hina.", "Well."),
      ],
    },
    BojoboDolls: {
      reaction: "Okay",
      brief: [
        "Dolls. Makoto doesn't really know what these are for, but he saw them in a movie",
        "once. Sakura accepts. \"Very well\"",
      ],
      lines: [
        makoto("Bojobo dolls. You pose the arms and legs and it's... a wish, I think. I saw it in a movie once."),
        say("Listening", "You saw it in a movie.", "Hmm."),
        makoto("Part of a movie."),
        say("Neutral", "Very well.", "Well."),
        think("Very well. Two words. I've had whole conversations that said less."),
      ],
    },
    SmallLight: {
      reaction: "Okay",
      brief: [
        "A torch. Walking through the woods without these is dangerous.",
        "Makoto thinks that anything else in the woods would certainly be in a lot",
        "of danger when Sakura has a torch. Hiding wouldn't even work!",
      ],
      lines: [
        say("Neutral", "A light. Small, but it works.", "Hmm."),
        say("Listening", "Never walk a forest at night without one. Everything out there can see you. You cannot see it."),
        think("If Sakura's in the woods with a torch, the woods should worry. Hiding wouldn't help. She'd hear them breathe."),
        say("Smiling", "Thank you. It will go in my pocket.", "Mmm."),
      ],
    },
    VoiceChangingBowtie: {
      reaction: "Okay",
      brief: [
        "A voice changing bow tie. She tries it on: [play one of Taka's voice line]",
        "and immediately decides it shouldn't really be used.",
      ],
      lines: [
        say("Listening", "A bowtie that changes the voice.", "Hmm?"),
        makoto("Try it!"),
        say("Neutral", "Very well."),
        raw("Voice(Taka, Chapter_99, 8)"),
        raw('Text("LISTEN TO ME!")'),
        say("Irked", "..."),
        say("Neutral", "No. This should not be used. By anyone.", "Hmm."),
        think("She sounded exactly like Taka. I'm going to hear that in my sleep."),
      ],
    },
    AncientTourTickets: {
      reaction: "Okay",
      brief: [
        "She says that she would accompany a friend if invited. Implied is that she hasn't",
        "ever been invited to an event like this before.",
      ],
      lines: [
        say("Listening", "Two tickets. A tour of Mu, with the Ancients.", "Hmm."),
        makoto("I don't think Mu is a real place."),
        say("Neutral", "If a friend invited me, I would go. Wherever it was."),
        say("FacingRight", "Nobody has. Yet.", "Well."),
        think("She said \"yet\" like she'd been holding the word for a while."),
      ],
    },
    NovelistsFountainPen: {
      reaction: "Liked",
      brief: [
        "The pen is mightier than the sword. A good gift.",
        "Makoto doubts that the pen is mightier than the Sakura, though.",
      ],
      lines: [
        say("Smiling", "A pen. The pen is mightier than the sword, they say.", "I see."),
        say("Neutral", "I have met many swords. I have met few pens. I am willing to be convinced."),
        think("Mightier than the sword, maybe. Mightier than Sakura? Nothing I've met."),
        say("Listening", "Thank you, Makoto. It writes only one sentence, I am told. That is one more than most.", "Well."),
      ],
    },
    IfFax: {
      reaction: "Disliked",
      brief: [
        "A fax machine. I do not require a fax machine.",
      ],
      lines: [
        say("Irked", "A fax machine.", "What?"),
        say("Neutral", "I do not require a fax machine."),
        makoto("It sends a novel about what would happen if your dreams came true..."),
        say("Angry", "I do not require a fax machine.", "Hmm."),
      ],
    },
    CatDogMagazine: {
      reaction: "Okay",
      brief: [
        "A sexual education book. She states this immediately which confuses Makoto, who",
        "had only seen the cat and dog and just thought it was a picture book.",
        "\"I... wish I could tell you more about this topic. Apologies\"",
      ],
      lines: [
        say("Neutral", "Sexual education. For junior high students.", "Hmm."),
        makoto("Wh... I thought it was about pets! There's a cat and a dog on the..."),
        say("Listening", "It is not about pets."),
        say("FacingRight", "I... wish I could tell you more about this topic. Apologies.", "I'm sorry."),
        think("I'm going to walk into the sea. There's no sea here. I'm going to find one."),
      ],
    },
    MeteoriteArrowhead: {
      reaction: "Okay",
      brief: [
        "Decorative. She admits not having much eye for decoration.",
      ],
      lines: [
        say("Listening", "An arrowhead. Meteorite.", "Hmm?"),
        say("Neutral", "It is decorative. I have no eye for decoration. My room has a mat and a wall."),
        makoto("You could put it on the wall."),
        say("Listening", "That would make it a wall with a thing on it.", "Perhaps."),
      ],
    },
    ChinDrill: {
      reaction: "Okay",
      brief: [
        "A chin drill. What is this for? Makoto doesn't know either.",
      ],
      lines: [
        say("Listening", "A drill. For the chin.", "What?"),
        makoto("Yeah.", "Yeah."),
        say("Irked", "What is it for."),
        makoto("I don't know."),
        say("Neutral", "Neither do I. We are agreed. Thank you.", "Well."),
      ],
    },
    GreenCostume: {
      reaction: "Disliked",
      brief: [
        "She is initially happy, but then unhappy once she realises its not going to fit.",
      ],
      lines: [
        say("Smiling", "A dinosaur. I like this.", "*laughs*"),
        say("Listening", "..."),
        say("Irked", "It will not fit. It would not fit my arm.", "Hmm."),
        makoto("They might do a bigger size..."),
        say("Angry", "They do not.", "Damn."),
      ],
    },
    RedCostume: {
      reaction: "Disliked",
      brief: [
        "She is initially happy, but then unhappy once she realises its not going to fit.",
      ],
      lines: [
        say("Smiling", "A yeti. Good. The yeti is a strong animal.", "I see."),
        say("Listening", "..."),
        say("Irked", "It is made for a child. Or you. Which is to say, a child.", "Hmm."),
        makoto("I'm sorry.", "Oh, sorry."),
        say("Angry", "So am I.", "Damn."),
      ],
    },
  },
};
