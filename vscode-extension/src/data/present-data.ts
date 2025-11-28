export enum Present {
    MineralWater = 0,
    ColaCola = 1,
    CivetCoffee = 2,
    RoseHipTea = 3,
    SeaSalt = 4,
    PotatoChips = 5,
    PrismaticHardtack = 6,
    BlackCroissant = 7,
    SonicCupaNoodle = 8,
    RoyalCurry = 9,
    Ration = 10,
    FlotationDonut = 11,
    OverflowingLunchBox = 12,
    SunflowerSeeds = 13,
    Birdseed = 14,
    KittenHairclip = 15,
    EverlastingBracelet = 16,
    LoveStatusRing = 17,
    ZolesDiamond = 18,
    HopesPeakRing = 19,
    BlueberryPerfume = 20,
    ScarabBrooch = 21,
    GodofWarCharm = 22,
    MacsGloves = 23,
    Glasses = 24,
    GSick = 25,
    RollerSlippers = 26,
    RedScarf = 27,
    LeafCovering = 28,
    TornekosPants = 29,
    BunnyEarmuffs = 30,
    FreshBindings = 31,
    JimmyDecayTShirt = 32,
    EmperorsThong = 33,
    HandBra = 34,
    Waterlover = 35,
    DemonAngelPrincessFigure = 36,
    AstralBoyDoll = 37,
    Shears = 38,
    LayeringShears = 39,
    QualityChinchillaCover = 40,
    KirlianCamera = 41,
    AdorableReactionsCollection = 42,
    Tumbleweed = 43,
    UnendingDandelion = 44,
    RoseinVitro = 45,
    CherryBlossomBouquet = 46,
    RoseWhip = 47,
    Zantetsuken = 48,
    Muramasa = 49,
    RaygunZurion = 50,
    GoldenGun = 51,
    BerserkerArmor = 52,
    SelfDestructingCassette = 53,
    SilentReceiver = 54,
    PrettyHungryCaterpillar = 55,
    OldTimeyRadio = 56,
    MrFastball = 57,
    AntiqueDoll = 58,
    CrystalSkull = 59,
    GoldenAirplane = 60,
    PrinceShotokusGlobe = 61,
    MoonRock = 62,
    AsurasTears = 63,
    SecretsoftheOmoplata = 64,
    MillenniumPrizeProblems = 65,
    TheFunplane = 66,
    ProjectZombie = 67,
    PaganDancer = 68,
    TipsTips = 69,
    MaidensHandbag = 70,
    KokeshiDynamo = 71,
    TheSecondButton = 72,
    SomeonesGraduationAlbum = 73,
    Vise = 74,
    SacredTreeSprig = 75,
    Pumice = 76,
    Oblaat = 77,
    WaterFlute = 78,
    BojoboDolls = 79,
    SmallLight = 80,
    VoiceChangingBowtie = 81,
    AncientTourTickets = 82,
    NovelistsFountainPen = 83,
    IfFax = 84,
    CatDogMagazine = 85,
    MeteoriteArrowhead = 86,
    ChinDrill = 87,
    GreenCostume = 88,
    RedCostume = 89,
    AMansFantasy = 90,
    EscapeButton = 91,
    SchoolCrest = 92,
    DespairBat = 93,
    CrazyDiamond = 94,
    SuperRoboJustice = 95,
    AlterLump = 96,
    DreamIslandRocket = 97,
    MonokumaHairties = 98,
    EasterEgg = 99,
    KiyotakasUndergarments = 100,
    ByakuyasUndergarments = 101,
    MondosUndergarments = 102,
    LeonsUndergarments = 103,
    HifumisUndergarments = 104,
    YasuhirosUndergarments = 105,
    SayakasUndergarments = 106,
    KyokosUndergarments = 107,
    AoisUndergarments = 108,
    TokosUndergarments = 109,
    SakurasUndergarments = 110,
    CelestesUndergarments = 111,
    JunkosUndergarments = 112,
    ChihirosUndergarments = 113,
}

export const presentConfiguration: Record<Present, { name: string; description: string }> = {
  [Present.MineralWater]: {
    name: "Mineral Water",
    description: "Drawn from the ocean depths and rigorously purified. Ideal for a modern on-the-go public unsatisfied with tap water."
  },
  [Present.ColaCola]: {
    name: "Cola Cola",
    description: "Contains a highly stimulating, almost addictive sweetness. Pair it with some nice junk food for a can't-miss combo."
  },
  [Present.CivetCoffee]: {
    name: "Civet Coffee",
    description: "Made from an extremely rare and expensive coffee bean collected from the dung of the Asian palm civet. It has a unique fragrance..."
  },
  [Present.RoseHipTea]: {
    name: "Rose Hip Tea",
    description: "An herbal tea said to promote beauty and wellness. You can somehow sense its essential elegance..."
  },
  [Present.SeaSalt]: {
    name: "Sea Salt",
    description: "A basic seasoning produced from the evaporation of seawater. It also sees use as a preservative."
  },
  [Present.PotatoChips]: {
    name: "Potato Chips",
    description: "A staple snack food made by frying thin potato slices in oil. Beware its dangerously high calorie count."
  },
  [Present.PrismaticHardtack]: {
    name: "Prismatic Hardtack",
    description: "A tough, long-lasting cracker used mainly as an emergency ration. Each piece contains a full seven different flavors."
  },
  [Present.BlackCroissant]: {
    name: "Black Croissant",
    description: "A baked good made from black ingredients. It looks burnt, but it's actually pretty good."
  },
  [Present.SonicCupaNoodle]: {
    name: "Sonic Cup-a-Noodle",
    description: "Instant noodles. Fill it with boiling water and it's ready in 3 seconds. Of course, it also goes bad in like 30..."
  },
  [Present.RoyalCurry]: {
    name: "Royal Curry",
    description: "A curry pack made for kids. It's made with expensive, high-quality ingredients you wouldn't expect from a kid's food."
  },
  [Present.Ration]: {
    name: "Ration",
    description: "A set of canned and vacuum- sealed foodstuffs. The taste isn't bad, and certain snakes that enjoy hide-and-go-seek are just crazy about it."
  },
  [Present.FlotationDonut]: {
    name: "Flotation Donut",
    description: "A gigantic donut that doubles as a flotation device. And naturally, you can snack on it while floating out to sea. It comes in a variety of styles."
  },
  [Present.OverflowingLunchBox]: {
    name: "Overflowing Lunch Box",
    description: "A lunch box stuffed with rice, ginger, carrots, peppers, mushrooms, and more. It's meat-free, so you vegetarians out there are covered, too."
  },
  [Present.SunflowerSeeds]: {
    name: "Sunflower Seeds",
    description: "The seeds of that particular flower that loves facing the sun. They have a flavor somewhat similar to peanuts."
  },
  [Present.Birdseed]: {
    name: "Birdseed",
    description: "Sprinkle this around outside and watch the birds come flocking. There's nothing stopping you from eating it too, I suppose..."
  },
  [Present.KittenHairclip]: {
    name: "Kitten Hairclip",
    description: "A hairclip in the shape of a little kitty cat. Properly placed, it can make a girl positively sparkle."
  },
  [Present.EverlastingBracelet]: {
    name: "Everlasting Bracelet",
    description: "A handcrafted item made with needle and thread. They say that once you put it on, it will never come off again."
  },
  [Present.LoveStatusRing]: {
    name: "Love Status Ring",
    description: "Wear it on your right hand, you're looking for love. On your left, you've found it. On both...well, that's just asking for catastrophe."
  },
  [Present.ZolesDiamond]: {
    name: "Zoles Diamond",
    description: "A brand-name diamond popularly used in engagement rings. Although...this one's just an imitation..."
  },
  [Present.HopesPeakRing]: {
    name: "Hope's Peak Ring",
    description: "A school ring emblazoned with the Hope's Peak Academy school crest. It stands as proof of friendship between those who spent their youth together."
  },
  [Present.BlueberryPerfume]: {
    name: "Blueberry Perfume",
    description: "Very popular with men these days. But to be honest, although it does attract the ladies, most guys hate the smell..."
  },
  [Present.ScarabBrooch]: {
    name: "Scarab Brooch",
    description: "The scarab was considered to be sacred by many ancient societies. It's better known today as...the dung beetle."
  },
  [Present.GodofWarCharm]: {
    name: "God of War Charm",
    description: "A charm devised by the protective deity of martial arts, the Great and Gracious Kashima."
  },
  [Present.MacsGloves]: {
    name: "Mac's Gloves",
    description: "A pair of boxing gloves infused with a staggering amount of passion and effort. Wearing them makes you want to throw a thousand cross-counters."
  },
  [Present.Glasses]: {
    name: "Glasses",
    description: "They say that wearing these while performing incantations will help you better speak with the target of your spell."
  },
  [Present.GSick]: {
    name: "G-Sick",
    description: "Most people consider it a \"throwaway watch\" due to its poor quality. Still, it enjoys massive popularity thanks to its low price."
  },
  [Present.RollerSlippers]: {
    name: "Roller Slippers",
    description: "Slippers with a small wheel installed in each heel. They were invented to move easily around the house, but there is absolutely no demand for them."
  },
  [Present.RedScarf]: {
    name: "Red Scarf",
    description: "A scarf belonging to a certain masked hero. It's tattered and worn due to the countless battles it's been through. "
  },
  [Present.LeafCovering]: {
    name: "Leaf Covering",
    description: "A loincloth meant to emphasize one's manliness. Its simple design features a single leaf overlaid on white cloth."
  },
  [Present.TornekosPants]: {
    name: "Torneko's Pants",
    description: "The latest style from premier gothic lolita fashion label, Wonder Dungeon."
  },
  [Present.BunnyEarmuffs]: {
    name: "Bunny Earmuffs",
    description: "One of the most popular items from gothic lolita designer Ina Bauer."
  },
  [Present.FreshBindings]: {
    name: "Fresh Bindings",
    description: "Strips of cotton cloth. They were once commonly used for underwear and bandages. They say when you wrap it around yourself, both body and soul become taut."
  },
  [Present.JimmyDecayTShirt]: {
    name: "Jimmy Decay T-Shirt",
    description: "A limited-edition shirt featuring legendary punk rocker Jimmy Decay. Only a hundred were ever made."
  },
  [Present.EmperorsThong]: {
    name: "Emperor's Thong",
    description: "Designed solely for those in control of their buttocks. For better or worse, it's unisex."
  },
  [Present.HandBra]: {
    name: "Hand Bra",
    description: "A bra designed to slip over your hands. Its slogan? \"Raise your hands, raise your spirits!\""
  },
  [Present.Waterlover]: {
    name: "Waterlover",
    description: "A competition swimsuit for women. Its design concept is to \"become one with the water\" and it claims to increase swimming speed by 10%."
  },
  [Present.DemonAngelPrincessFigure]: {
    name: "Demon Angel Princess Figure",
    description: "A collectible figure of Princess Piggles, the popular heroine from \"Demon Angel Pretty Pudgy Princess.\""
  },
  [Present.AstralBoyDoll]: {
    name: "Astral Boy Doll",
    description: "A figurine of the popular TV personality who hosted \"Lost in Forbidden Love Fantasy Outer Space.\""
  },
  [Present.Shears]: {
    name: "Shears",
    description: "Since Hope's Peak Academy doesn't have a barber, the students are responsible for cutting their own hair."
  },
  [Present.LayeringShears]: {
    name: "Layering Shears",
    description: "A specialized set of scissors used to create advanced styling designs. Watch the edges!"
  },
  [Present.QualityChinchillaCover]: {
    name: "Quality Chinchilla Cover",
    description: "A dark red seat cover. Its refined design is intended for only the most elite clientele."
  },
  [Present.KirlianCamera]: {
    name: "Kirlian Camera",
    description: "A camera invented to take pictures of electrical fields surrounding objects. Sadly, there's no film in it..."
  },
  [Present.AdorableReactionsCollection]: {
    name: "Adorable Reactions Collection",
    description: "A DVD that contains footage of people reacting to various pieces of art."
  },
  [Present.Tumbleweed]: {
    name: "Tumbleweed",
    description: "A dried-out plant seen in many Western films. If they pile up around your yard, just toss 'em off a cliff or something."
  },
  [Present.UnendingDandelion]: {
    name: "Unending Dandelion",
    description: "A dandelion toy. You can blow the fluff away, and the attached string will pull it back, so you can do it over and over and over and..."
  },
  [Present.RoseinVitro]: {
    name: "Rose in Vitro",
    description: "A small rose stored inside a test tube. It's good for both hellos and farewells. In the language of flowers, a red rose means passionate love."
  },
  [Present.CherryBlossomBouquet]: {
    name: "Cherry Blossom Bouquet",
    description: "A collection of branches from a sakura tree. In the language of flowers, cherry blossoms represent \"a woman of superior beauty.\""
  },
  [Present.RoseWhip]: {
    name: "Rose Whip",
    description: "A whip made from real roses. Even the most beautiful rose has thorns..."
  },
  [Present.Zantetsuken]: {
    name: "Zantetsuken",
    description: "A sword that can't even cut through iron. Or flesh. Or anything, really. In other words, totally useless..."
  },
  [Present.Muramasa]: {
    name: "Muramasa",
    description: "The strongest weapon ever made. It's great for dungeon diving and lets you warp through walls. Of course, it doesn't actually exist in this reality, so..."
  },
  [Present.RaygunZurion]: {
    name: "Raygun Zurion",
    description: "Created with hi-tech future technology. A single shot can melt every molecule in a fully grown human. There aren't any batteries, though, so you can't fire it..."
  },
  [Present.GoldenGun]: {
    name: "Golden Gun",
    description: "A replica of the gun preferred by a famous assassin. It's not really much good by itself. You can't even cock it..."
  },
  [Present.BerserkerArmor]: {
    name: "Berserker Armor",
    description: "Donning this armor bestows the wearer with immense power, but at the cost of their soul and senses."
  },
  [Present.SelfDestructingCassette]: {
    name: "Self-Destructing Cassette",
    description: "Once you record a message onto this, it sets up a chemical reaction that will destroy the tape a few seconds after it's played."
  },
  [Present.SilentReceiver]: {
    name: "Silent Receiver",
    description: "A phone that, for some unknown reason, doesn't let you hear the person on the other end, and doesn't let them hear you."
  },
  [Present.PrettyHungryCaterpillar]: {
    name: "Pretty Hungry Caterpillar",
    description: "A caterpillar toy that was all the rage years ago. As you pull it, it moves up and down, making it look alive."
  },
  [Present.OldTimeyRadio]: {
    name: "Old Timey Radio",
    description: "A radio with a retro exterior but state-of-the-art technology inside. Of course, there's no reception in the school, so you can't hear anything anyway."
  },
  [Present.MrFastball]: {
    name: "Mr. Fastball",
    description: "A baseball-shaped velocity measurement machine. Throw it to measure your speed. But, uh...don't throw it at the wall."
  },
  [Present.AntiqueDoll]: {
    name: "Antique Doll",
    description: "A porcelain doll. Due to the exquisite craftsmanship of the doll and its clothing, many people still collect and prize them to this very day."
  },
  [Present.CrystalSkull]: {
    name: "Crystal Skull",
    description: "A skull carved from pure rock crystal. Some think skulls like this were created hundreds of years ago, perhaps with alien intervention, and consider them \"OOPArts.\""
  },
  [Present.GoldenAirplane]: {
    name: "Golden Airplane",
    description: "A golden sculpture said to reprent a plane or spaceship. It was found in ruins in Colombia dated to around 1,000 CE, indicating to some that this represents an \"OOPArt.\""
  },
  [Present.PrinceShotokusGlobe]: {
    name: "Prince Shotoku's Globe",
    description: "A spherical representation of Earth, about the size of a softball. Some believe it to be an \"OOPArt\" since it depicts a round Earth, despite being many centuries old."
  },
  [Present.MoonRock]: {
    name: "Moon Rock",
    description: "A rock taken from the Sea of Tranquility on the moon by the astronauts on Apollo 11. Its composition is apparently unusual for where it was found..."
  },
  [Present.AsurasTears]: {
    name: "Asura's Tears",
    description: "A jewel treasured by an ancient super-race. \"Even the devil has friends. You fool...\" And then...tears flow."
  },
  [Present.SecretsoftheOmoplata]: {
    name: "Secrets of the Omoplata",
    description: "A little-known book about Brazilian jiu-jitsu that teaches high-level shoulder lock techniques. \"Omoplata\" is another word for the scapula, or shoulder blade."
  },
  [Present.MillenniumPrizeProblems]: {
    name: "Millennium Prize Problems",
    description: "These seven important mathematical problems were posed by the Clay Mathematics Institute, with a reward of one million dollars for each one solved."
  },
  [Present.TheFunplane]: {
    name: "The Funplane",
    description: "The newest popular portable game system. It has a hi-def touchscreen, and can also play music and videos, making for the perfect all-in-one media machine!"
  },
  [Present.ProjectZombie]: {
    name: "Project Zombie",
    description: "A mature game designed for the Funplane, where a former runway model takes zombies as slaves in a post-apocalyptic world. It's been out of print for a while..."
  },
  [Present.PaganDancer]: {
    name: "Pagan Dancer",
    description: "A mature game designed for the Funplane, which allows you to become a massive god handing out divine punishment to puny mortals. Good luck finding a copy..."
  },
  [Present.TipsTips]: {
    name: "Tips & Tips",
    description: "A thick book that has hints and codes for every game ever released. A must-have for any true gaming fanatic."
  },
  [Present.MaidensHandbag]: {
    name: "Maiden's Handbag",
    description: "Available only at the posh Maiden Road, which is geared toward female fanfic fans. Please, PLEASE take me with you next time you go!"
  },
  [Present.KokeshiDynamo]: {
    name: "Kokeshi Dynamo",
    description: "Flip the switch on the bottom to set the doll shaking. Apparently it's a kid's toy, but I don't really get the point of it..."
  },
  [Present.TheSecondButton]: {
    name: "The Second Button",
    description: "The button from a school uniform which increases in value as graduation approaches. In a few cases, reservations are necessary."
  },
  [Present.SomeonesGraduationAlbum]: {
    name: "Someone's Graduation Album",
    description: "A Hope's Peak graduation album that someone left behind. The signature pages are all completely blank..."
  },
  [Present.Vise]: {
    name: "Vise",
    description: "A tool used to grip and stabilize materials (like metal) to shape and fix it. Somehow, just the name conveys a strong sense of power..."
  },
  [Present.SacredTreeSprig]: {
    name: "Sacred Tree Sprig",
    description: "The branch from a sakaki tree, commonly used in Shinto rituals. It serves as a connection between humans and the gods."
  },
  [Present.Pumice]: {
    name: "Pumice",
    description: "A porous rock formed within a volcano. Many people use these to exfoliate and remove dead skin from the body."
  },
  [Present.Oblaat]: {
    name: "Oblaat",
    description: "A thin, edible film made from starch. It's commonly used as a candy wrapper, but also helps cover up the taste of bitter medicine."
  },
  [Present.WaterFlute]: {
    name: "Water Flute",
    description: "A unique type of flute. You pour water into the base and blow into the top, which can create a variety of sounds similar to a chirping bird."
  },
  [Present.BojoboDolls]: {
    name: "Bojobo Dolls",
    description: "Made from seeds and coconut fiber, these are used in Buddhist prayers. You determine your wish based on how you position the arms and legs."
  },
  [Present.SmallLight]: {
    name: "Small Light",
    description: "Common wisdom might make you think that shining this light on you will turn you small... but nope. It's just that the light itself is about the size of a matchbox."
  },
  [Present.VoiceChangingBowtie]: {
    name: "Voice-Changing Bowtie",
    description: "This originally belonged to a detective who has the body of a child but the mind of a genius. The bowtie lets its user speak in a variety of voices."
  },
  [Present.AncientTourTickets]: {
    name: "Ancient Tour Tickets",
    description: "Two tickets that advertise \"a whirlwind tour of Mu with the Ancients for four days and three nights!\""
  },
  [Present.NovelistsFountainPen]: {
    name: "Novelist's Fountain Pen",
    description: "It once belonged to a late, great novelist. They say the writer's soul is sealed within the pen, and any user can only write one sentence: \"I have become something not human.\""
  },
  [Present.IfFax]: {
    name: "\"If\" Fax",
    description: "Used to distribute a full-length novel based on what the world would look like if all of someone's dreams came true."
  },
  [Present.CatDogMagazine]: {
    name: "Cat-Dog Magazine",
    description: "You might think it has to do with pets, but it's more related to...beds. It's a guide for junior high and high school students to help with their...um...physical health."
  },
  [Present.MeteoriteArrowhead]: {
    name: "Meteorite Arrowhead",
    description: "An arrowhead discovered in some ancient ruins. Fashioned from a meteorite, they say that getting pierced by it will give you the power to see demons."
  },
  [Present.ChinDrill]: {
    name: "Chin Drill",
    description: "A fashion accessory that allows you to equip a drill on your chin. It is said to represent the idea of \"spiral energy.\""
  },
  [Present.GreenCostume]: {
    name: "Green Costume",
    description: "As soon as you put this on, you'll feel like you can take on any challenge. It resembles a stereotypical dinosaur."
  },
  [Present.RedCostume]: {
    name: "Red Costume",
    description: "Jump into this, and you'll feel like you can support the world. It resembles some kind of yeti creature..."
  },
  [Present.AMansFantasy]: {
    name: "A Man's Fantasy",
    description: "A wash basin intended to give you the courage to seek out a true man's fantasy. Specifically, in public bathhouses..."
  },
  [Present.EscapeButton]: {
    name: "Escape Button",
    description: "One press of this button will allow you to escape from Hope's Peak Academy. Once you possess it, a new clip will be added to the Movie Gallery."
  },
  [Present.SchoolCrest]: {
    name: "School Crest",
    description: "Proof that you've cleared the Prologue. It's a patch that displays the Hope's Peak Academy school crest."
  },
  [Present.DespairBat]: {
    name: "Despair Bat",
    description: "Proof that you've cleared Chapter 1. The name really doesn't sound pleasant, it creates a foreboding sense that something very bad has begun."
  },
  [Present.CrazyDiamond]: {
    name: "Crazy Diamond",
    description: "Proof that you've cleared Chapter 2. It's Mondo's old trenchcoat, which has the name of the country's greatest biker gang leader embroidered on it."
  },
  [Present.SuperRoboJustice]: {
    name: "Super Robo Justice",
    description: "Proof that you've cleared Chapter 3. Hifumi created this costume at the school, but the quality is so high, it's hard to imagine it was made solely with materials in the school."
  },
  [Present.AlterLump]: {
    name: "Alter Lump",
    description: "Proof that you've cleared Chapter 4. It's the only thing left of Alter Ego..."
  },
  [Present.DreamIslandRocket]: {
    name: "Dream Island Rocket",
    description: "Proof that you've cleared Chapter 5. It was once abandoned on Dream Island. It feels strangely familiar..."
  },
  [Present.MonokumaHairties]: {
    name: "Monokuma Hairties",
    description: "Proof that you've cleared Chapter 6. As the final memento of Junko Enoshima, they're decorated with twin bear figures."
  },
  [Present.EasterEgg]: {
    name: "Easter Egg",
    description: "Proof that you've cleared the Epilogue. It serves as a graduation token for all those who made it out of Hope's Peak. Is it a symbol of hope, or of despair...?"
  },
  [Present.KiyotakasUndergarments]: {
    name: "Kiyotaka's Undergarments",
    description: "Kiyotaka's favorite briefs. They were also the preferred briefs of his grandfather, the former prime minister and the official Ultimate Manager. The manufacturer, \"Military World,\" claims they help support all ideal Japanese men from down below."
  },
  [Present.ByakuyasUndergarments]: {
    name: "Byakuya's Undergarments",
    description: "Byakuya's favorite high-end underwear. It comes from the only brand that the truly elite will wear. All of his family's underwear is made-to- order, in order to show that no matter how much money some no-name upstart may have, they'll never be a Togami."
  },
  [Present.MondosUndergarments]: {
    name: "Mondo's Undergarments",
    description: "Mondo's favorite boxer briefs. They fit nice and snug in order to keep from getting in the way when you're riding your hog. Mondo doesn't normally have a thing for tiger print, but the instant he saw them, he found himself drawn to the design..."
  },
  [Present.LeonsUndergarments]: {
    name: "Leon's Undergarments",
    description: "Leon's favorite supportive sports underoos. He may claim he hates baseball, but deep down it still holds a special place in his heart. After all, that's what makes him \"ultimate.\""
  },
  [Present.HifumisUndergarments]: {
    name: "Hifumi's Undergarments",
    description: "Hifumi's favorite briefs. This one-of-a-kind, not-for- sale-anywhere item was designed to mimic the garments of the galactic king, Robo Justice. Due to Hifumi's exceptional girth, the briefs have been stretched into a rather form-fitting thong."
  },
  [Present.YasuhirosUndergarments]: {
    name: "Yasuhiro's Undergarments",
    description: "Yasuhiro's favorite bikini briefs. \"The higher the waist, the higher your luck!\" This is what the salesman told him at one of his seminars, and he couldn't resist. Later, he would run into severe money troubles."
  },
  [Present.SayakasUndergarments]: {
    name: "Sayaka's Undergarments",
    description: "Sayaka's favorite everyday underwear. They may be inexpensive, but when the Ultimate Pop Sensation wears them, they still shine with an inner light. Of course, the brighter the light, the darker the shadow..."
  },
  [Present.KyokosUndergarments]: {
    name: "Kyoko's Undergarments",
    description: "Kyoko's favorite low-rise briefs. No matter what position she finds herself in, their mysterious darkness obscures her form. Whether she's squatting to inspect a crime scene or climbing a ladder in search of evidence, she's safe..."
  },
  [Present.AoisUndergarments]: {
    name: "Aoi's Undergarments",
    description: "Aoi's favorite panties. They're the kind of thing you'd expect to find in any bedroom in the world, they're as plain as what any prison inmate might wear, but still completely comfortable. The one drawback is that they turn totally see-through if you go swimming in them..."
  },
  [Present.TokosUndergarments]: {
    name: "Toko's Undergarments",
    description: "Toko's favorite panties. Actually, they're probably Genocide Jack's favorite. They have reinforced elastic and loops to hold her deadly scissors."
  },
  [Present.SakurasUndergarments]: {
    name: "Sakura's Undergarments",
    description: "Sakura's favorite loincloth. She wears the complicated garment to remind her daily of the process of putting on her various martial arts uniforms. The loincloth represents her willingness to accept any challenge at any time."
  },
  [Present.CelestesUndergarments]: {
    name: "Celeste's Undergarments",
    description: "Celeste's favorite dark-hued panties. Their most notable feature is the tulle lace, and it's rumored that a C-rank human can't bear to gaze upon them. They give off the distinct air of a queen."
  },
  [Present.JunkosUndergarments]: {
    name: "Junko's Undergarments",
    description: "Junko's favorite underwear. In contrast to her title as the Ultimate Fashionista, the underwear is remarkably plain. However, it's also woven from blade-resistant and bulletproof fibers, making it much more durable. Still, it doesn't seem to be spear-proof..."
  },
  [Present.ChihirosUndergarments]: {
    name: "Chihiro's Undergarments",
    description: "Chihiro's favorite bloomers. Even if you got a peek under his skirt, you wouldn't be able to tell at a glance that he was a boy. His choice of underwear clearly underlines how strong his fear of weakness really is."
  }
};

const validPresentSet = new Set(Object.values(Present).filter(x => typeof x === "number"));

export function isPresent(present: number): present is Present {
  return validPresentSet.has(present);
}
