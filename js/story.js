// ============================================================
// PALE HARVEST — story content: notes, intro, outro, objectives
// ============================================================
const STORY = {

  intro: [
    "KANSAS — OCTOBER, 1986",
    "Three days ago they buried Jonas Hale.",
    "His grandson Eli got everything: one farm, one key,",
    "and a note in the lawyer's envelope that said only —",
    "“COME ALONE. COUNT THE NIGHTS.”",
    "This is the third night."
  ],

  outro: [
    "The doors held until sunrise.",
    "Through the boards you listened to it pace the chapel walls — round and round, dragging its burning straw, calling in every voice it had collected. Your father's voice gave out around four in the morning. After that there was only its own voice left, which is the sound dry stalks make in October when there is no wind to blame it on.",
    "You did not watch it burn. You did exactly as much as the pages told you, and not one thing more.",
    "At first light the field stood silent for the first time in thirteen years. Ash on the post. The chain back on the chapel door, and Eli Hale's truck rolling out the county road with every window down, because the cab still smelled of smoke and you wanted to hear the world.",
    "The farm sold at auction in the spring, to a man from Wichita. Sight unseen.",
    "That summer the new corn came up green out of the burned acre. It came up taller than anywhere else in the county. The agriculture man took a photograph.",
    "Nobody planted it."
  ],

  deaths: [
    "WHAT WALKS THE ROWS AT NIGHT\nSTAYS IN THE ROWS",
    "THE ROWS TAKE WHAT THEY ARE OWED",
    "BLOOD KEEPS ITS PROMISES\nEVEN WHEN MEN DON'T",
    "IT HAS HAD YEARS\nTO PRACTICE THE VOICE"
  ],

  // Eli's plain-English take, shown after each note closes — keeps the plot followable
  thoughts: {
    letter:    "Burn the scarecrow before the third sundown… that's tonight.",
    journal73: "1973. The farm was dying — so Grandpa shook hands with something out in the field.",
    ruth:      "Mom knew something was wrong here. That's why we never came back.",
    sermon:    "Four watchers at the corner-stones force him into the scarecrow. Then oil. Then fire.",
    frag74:    "The bargain worked. And whatever walked the rows at night… got eaten.",
    frag79:    "By '79 it wasn't taking rabbits anymore. It was calling Dad's name.",
    frag81:    "Dad never ran off. The rows took him. The lie was for Mom.",
    frag86:    "It knows I exist. Blood is owed. I'm the payment."
  },

  obj: {
    approach:  "Walk up to the farmhouse.",
    letter:    "Find what Grandpa left for you inside.",
    flash:     "Take the flashlight.",
    barn:      "Get the chapel key from Pa's hook in the barn. Take the oil can too.",
    chapel:    "Unlock the chapel beyond the field.",
    altar:     "Read what waits on the altar.",
    takeKit:   "Take the four watchers and the matches.",
    place:     "Set the watchers at the four corner-stones. Look for the lanterns. (0/4)",
    douse:     "He is in his shape. Soak the Old Man in oil.",
    light:     "Strike a match.",
    run:       "RUN. THE CHAPEL. NOW."
  },

  notes: {

    letter: {
      title: "A letter, weighted under a coffee cup",
      body:
`Eli —

If you are reading this then the funeral is done and you came out anyway, even though your mother swore you never would. You always were your father's boy.

Listen to me now, because I only get to say it once.

Do not stay past dark. If dark catches you anyway, do not trust the quiet, and do not answer anything that calls you by name. Not even in a voice you know. ESPECIALLY not in a voice you know.

The chapel out past the field — the chain comes off it. The key is in the barn, on your pa's hook, where it has hung for thirty years. Everything you need to know is written down and waiting on that altar.

I kept all of it off you your whole life, boy. I am sorry that dying undoes it. There are debts on this land older than the county, and I was the last payment ever made on them.

Burn the Old Man of the Rows. Before the third sundown after they put me in the ground.

Count the nights, Eli.

— J. Hale`
    },

    journal73: {
      title: "A journal page nailed to the workbench",
      body:
`OCTOBER, 1973

No rain since June. The bank man came again wearing his church suit. Said by spring this farm is paper in a drawer in Wichita.

Last night I walked the rows like I do and there was a man standing in the middle of the field where no path goes. Tall. Taller than the corn — and the corn that year was nothing, but I mean taller than corn has any right to get. He never walked toward me. He was just closer every time I blinked.

He said my corn could come in gold and heavy every year until they bury me. Said it plain, like a man selling seed.

I asked what he wanted for it.

He said: ONLY WHAT WALKS THE ROWS AT NIGHT.

I thought he meant the rabbits.

God help me, I shook on it. His hand was like gripping a bundle of dry stalks.`
    },

    ruth: {
      title: "A letter, returned unopened",
      body:
`MARCH, 1982

Jonas —

You will not tell me what happened, so I am telling you what I know.

My husband did not run off. Tommy was building a crib in your hayloft. He was happy. Men do not walk out on a wife eight months along with the paint catalog still open to the page that says CANARY YELLOW.

You know something. It sits behind your teeth every time you look at that field.

I am gone to my sister's in Ohio, and I am taking the baby when he comes, and neither of us will ever set foot on this land again. Do not write to Eli when he is grown. Do not leave him so much as a fence post in your will.

Whatever it is you are keeping out there — you keep it.

— Ruth`
    },

    sermon: {
      title: "Loose pages on the altar, in a careful hand",
      body:
`COPIED OUT OF PASTOR KIRBY'S BOOK, 1981.
(He would not set foot past my fence line after this. I cannot blame him.)

The thing that walks a field is not bound to the field. It is bound to its SHAPE. The old families knew it. That is why they raised the scarecrow — not to frighten what flies in, but to HOUSE what already walks there.

To put it back in its shape:

FOUR WATCHERS, woven from its own corn, set at the four corner-stones of the field. The stones know their work. Look for my lanterns — I have kept them oiled and lit.

When the fourth watcher is set, every row will speak its name back to the center, and it MUST return to the shape that was raised for it. It cannot refuse the shape. That is the oldest law it answers to.

It will not stay bound long. They never do.

While it hangs on the post: soak the shape in oil and put a match to it. What burns WITH the shape stays IN the shape while it burns.

Do not watch it burn longer than you must.

And whatever wears a familiar face out there between the stones — set the watchers anyway. It will say anything. It has had years to practice the voice.`
    },

    frag74: {
      title: "Journal page, under the corner-stone",
      body:
`NOVEMBER, 1974

Harvest came in like the man promised. Heaviest the county scale ever weighed. The Hale farm in the newspaper, me shaking the agent's hand in a photograph.

The cattle will not go near the east field anymore. Not for feed, not for the whip. The dog went in after a rabbit on Tuesday and the rows closed up behind him like water.

I heard the corn chewing.

I told Marion it was coyotes. There is money in the bank for the first time in my life, and I have got to where I can sleep most nights, if I keep the window shut. Whatever walks out there, it keeps to the bargain. It is only rabbits and strays being taken.

It is only rabbits and strays.`
    },

    frag79: {
      title: "Journal page, under the corner-stone",
      body:
`AUGUST, 1979

Tommy heard it last night.

Fifteen years that field has been fat and quiet, and last night my son comes down the stairs at three in the morning, barefoot on the porch with his hand on the screen door. Says somebody out in the rows was calling him. Says it knew his birthday. Says it had my voice, and then his mother's voice, and then a voice like the school nurse — trying them on like Sunday hats. It was asking him to come and see what it found.

I have nailed his window shut. I sleep in the hallway now.

At noon I walked out to the post and told it we had a bargain. The scarecrow's head was turned full around backwards, and the stitching of its mouth had come open at one corner, like it had been working at the seams.

WHAT WALKS THE ROWS AT NIGHT. That was the words. That was always the words.

It waited until my boy walked the rows.`
    },

    frag81: {
      title: "Journal page, under the corner-stone",
      body:
`JUNE, 1981

The county says Thomas Hale, 19, ran off west like young men do. His girl in town says he never would. The sheriff wrote it down whichever way made the least paperwork.

I found my son's boots out by the post. Set side by side, square to the rows, neat as church shoes. Still warm inside.

The corn stood an inch taller in the morning. The whole east field. One inch, overnight. I measured it, because a man has to do something with his hands while he is screaming on the inside.

Pastor Kirby came out once. He prayed at the fence line and would not come past it. He gave me the pages out of his book and said God forgive him, the binding was older than his church and it was all he had for me.

Let the town say my boy ran off. His mother believes it, and that lie is the last kind thing I have left to give anybody.`
    },

    frag86: {
      title: "Journal page, under the corner-stone — the last entry",
      body:
`SEPTEMBER, 1986

The doctor put a name to what is in my lungs. So the bargain is nearly done — UNTIL THEY BURY ME, that was the words. It knows. It has come up out of the field every night this week, far as the fence, which it never could do before. It is getting loose of the rules the way a dog gets loose of a rope. Patient, patient, then all at once.

When the moon is thin it stands at the fence wearing Tommy's face and asks after Eli. Asks in Tommy's voice. WHERE IS MY BOY. IT IS HIS TURN TO WALK THE ROWS. AIN'T HE GROWN NOW.

I told it the boy died as a baby. It smiled with my dead son's mouth, and the smile went on past where a face ought to stop, and it said:

I SMELL HIM ON YOUR LETTERS, OLD MAN. BLOOD KEEPS ITS PROMISES EVEN WHEN MEN DON'T.

I am out of years and out of lies. The watchers are woven, the stones are ready, the oil is in the barn. I have written it all down for the boy, and I pray to God he is quick about it.

It will be angriest on the third night.

The third night, the ground lets go.`
    }
  }
};
