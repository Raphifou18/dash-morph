# Dash Morph

A local side-scrolling runner that sits between the Chrome dinosaur and Geometry Dash. The character stands still until you choose to run. Left click jumps. In Music mode a wall of fire keeps the pace even if you stop. Everything is drawn and synthesized in the page: no server, no network, no build step.

The in-game interface is in French. The full design rules live in [SPEC.md](SPEC.md) (version 1.35).

## Play

Open `index.html` in a current browser. A double-click is enough, including from a `file://` address. The page does not fetch scripts, fonts, images, or audio.

The stage is a 1280 × 720 canvas, scaled to the window while keeping that ratio. The first click or key press unlocks sound (browsers block audio until a gesture).

Progress is stored in `localStorage` under the prefix `dashmorph.`. Coins, diamonds, skins, accessories, unlocked levels, and best times stay on this machine. A run in progress is not restored after a reload.

## How to play

The runner does not move on its own. Hold run to advance, and jump to clear spikes, blocks, stairs, and gaps. Walking off a step or a block makes you fall; that fall is not a hit.

| Action | Mouse | Keyboard | Touch |
| --- | --- | --- | --- |
| Run | Right click. A short click nudges forward; holding runs until release | Right arrow or `D` | — |
| Back up | — | Left arrow, `Q`, or `A` | — |
| Jump, climb, start a Music run | Left click. Hold to fly the ship | `Z`, `W`, Space, or Up arrow | Tap. Hold to fly the ship |
| Fall faster in the air (Music) | — | Down arrow or `S` | — |
| Pause | Pause button | Escape | Pause button |
| Aim the slingshot | Drag backward | — | Drag backward |
| Launch | Release | — | Release |
| Restart after death | Left click outside a button | Enter or Space | — |

`Z` / `Q` match an AZERTY keyboard. `W` / `A` match QWERTY. A click on a button does not jump.

In Endless, the camera never scrolls backward. If you retreat, it stays put and only follows again once you are back at the center and running forward. You cannot leave the frame, and hitting the edge does not kill you. You also cannot pass through the ground.

## Modes

The menu offers four destinations. Your coin and diamond balances and the equipped character are shown there.

### Endless (Infini)

Go as far as you can. Each run draws a different course: biome order and obstacle sequence are random, and a run never opens on Space or Christmas. Speed starts low and climbs slowly with distance, up to a ceiling. Voluntary running is 1.22× the reference speed. There is no fire.

Biomes change every 4200 units, with an 860-unit crossfade. The distant scenery (dunes, ridges, towers, treetops, stars, snow, Santa, gifts) scrolls far more slowly than the ground. Platforms, spikes, blocks, and steps stretch with speed, up to 2.4× their starting length. A heart sits on a low shelf every 8000 m.

Before 15 000 m every pit has spikes. After that, one pit in three has none and opens the past world (see below). Hard platform chains appear only after 15 000 m, and become longer and more common from 25 000 m.

Dying pays 1 coin per 100 units of distance. Quitting or restarting before death pays nothing. Enter, Space, or a left click that is not on a button restarts from the death screen.

### Adventure (Aventure)

Twenty hand-arranged levels, eight per page across three pages, from easiest to hardest. Clearing a level unlocks only the next one. Cleared levels stay replayable. There is no music and no bonus: no growth, no slow-motion, no ship, no hearts.

| Levels | Names | Idea |
| --- | --- | --- |
| 1–8 | Dunes, Corniches, Ruelles, Racines, Cratères, Guirlandes, Mirage, Seracs | Open ground, bridges, arches, short stairs, then tighter spikes |
| 9–16 | Toits, Canopée, Anneaux, Cheminée, Oasis, Crête, Néons, Lianes | Low arches, long stairs, pit sequences, spikes without stairs, platforms |
| 17–20 | Satellite, Traîneau, Tempête, Apogée | The densest mix. Apogée is the hardest, and every pit stays jumpable |

Inside a level, obstacles are not copies of each other. Several times per level a chain of platforms crosses a spiked pit, including red spiked platforms that must be avoided. The safe platform is the only path, and each jump remains possible. The biome paints the sky and the ground for that level.

Reference speed starts at the level’s base and rises a little toward the finish (`base × (1 + progress × 0.22)`). On death it returns to that base. The first clear pays `50 × level number`, once.

### Music (Musique)

Twenty worlds, laid out like Adventure: eight per page, three pages, easiest to hardest. They are not the Adventure levels. Each world has its own name, biome, course, and tune. Clearing a world unlocks only the next one. Worlds are not bought. There is no ship.

The course and the fire wall wait for the first input (right, `D`, right click, left click, or jump). After that you still run yourself. The fire always advances at running speed, even if you stop or back up, and its front stays inside the screen. Standing still means it catches you.

The piece plays on the beat from the first input until the finish. If it ends before the goal, it repeats. The finish cuts the sound. Holding run, a world lasts about 40 to 55 seconds. Néon is the easiest. Zénith is the hardest.

A jump lasts two beats of the piece and clears the step in front of you, plus the gap placed between some stairs. That gap stays under about two thirds of the jump distance. Boards in a chain are spaced one full jump apart. Stairs start on a struck beat, with the chord. Steps vary in width and height. Later worlds add more steps, taller steps, and wider gaps. Every pit stays jumpable.

| Worlds | Tunes | Idea |
| --- | --- | --- |
| 1–5 | Néon, Backbeat, Circuit, Asphalte, Surcharge | The most open. Short stairs, spikes and blocks, rare gaps |
| 6–12 | Relais, Foudre, Gravier, Voltage, Sirène, Moteur, Écho | Taller steps, gaps more often |
| 13–20 | Bitume, Laser, Riff, Turbo, Orage, Arcade, Chrome, Zénith | The densest mix. Zénith is the hardest |

Tunes alternate electro and rock, synthesized in the page. Electro chains kick, bass, and a sawtooth lead. Rock puts the snare on beats 2 and 4. Each staircase leaves with a stronger chord. Finishing records the time; a better time replaces the record. Dying records nothing and does not unlock the next world. Music pays no first-clear bonus.

Touching the fire plays a burn of about half a second, then resolves like any other flame: slingshot if you are large or still have a life, death screen otherwise. An object the fire reaches ignites all at once. Ground already passed burns too.

### The past world (Monde du passé)

Only Endless can reach it, and only by falling into a pit without spikes or touching that pit’s wall. Adventure and Music never open it. Before 15 000 m every pit has spikes, so the past cannot appear yet.

1. You slide to the middle of the pit. The camera follows the fall.
2. The screen closes to black from the edges inward.
3. It opens on the past. A chicken is eating grass. You are not there yet.
4. Two seconds later you yell and land on the chicken.
5. You sit on the chicken. `Z` or left click grants a second jump while you are in the air. Prehistoric people with bones chase you. They run a little slower than you (× 0.88): holding run pulls you ahead. If you stop, they keep coming until they touch you, and that touch is a hit. They climb obstacles without dying. If you back up, they come back toward you.

The course is hard from the first step: spikes, blocks, tight stairs, jumps, platform chains, and shelves. Some shelves have spikes underneath — passing under them kills, jumping onto them is the way through. Every pit here has spikes and does not open another past. Constructions stretch with speed, as in Endless.

From the moment you are on the chicken, you earn one diamond every 10 seconds, including during a slingshot. No hearts appear. Lives do nothing here. A hit, even while large or holding extra lives, does not play the slingshot and does not spend a life. The screen goes black and you return to the previous biome, on the ground just before the pit, with the same lives and the diamonds already earned. That pit now has spikes. Falling into it again is a pit hit, and it will not reopen the past.

## Characters

| Form | How you get it | Physics |
| --- | --- | --- |
| Runner | Blue circle | Gravity, one jump on press |
| Ship | Purple circle | Hold jump to climb. Release to descend |

The purple circle is absent for the first 15 seconds, and absent in Music. Once taken, the ship lasts 8 seconds. Purple circles are rarer than an ordinary bonus, and another cannot appear in the 4 seconds after a pickup. The ship flies over a pit as long as it does not enter it. The runner falls as soon as the ground opens.

The top of the screen is a ceiling for the ship only. Hitting it never plays the slingshot:

1. Slow-motion active: fatal fall.
2. Large size: thrown to center, shrink in three steps, no life spent.
3. Normal size and at least one life: same throw, one life spent.
4. Normal size and zero lives: fall, then the death screen after 2 seconds.

### Size and slow-motion

Normal size is ×1. Large is ×1.6. Growth takes 0.9 s and is visible in three steps: ×1, then ×1.2, then ×1.4, then ×1.6. The growth bonus is only offered at normal size. Taking it blocks another growth bonus for 4 seconds and removes copies already placed on the next 4 seconds of path.

A hit while large plays the slingshot and returns you to normal size without spending a life. During slow-motion, the same hit is a real death.

Slow-motion lasts 5 seconds at ×0.55 time scale. Taking it blocks another slow-motion for 4 seconds. While it is active, a spike, a block, a flame, or a pit is a real death.

The same bonus type cannot return for 4 seconds after you take it.

### Hits and the slingshot

Resolved in this order:

0. Ship ceiling: see above. Never a slingshot.
1. Slow-motion active: death screen.
2. Spike, block, flame, or pit while large: slingshot, no life spent, back to normal size.
3. Same hit at normal size with at least one life: spend one life, slingshot.
4. Same hit at normal size with zero lives: death screen.
5. Past world: none of the above. The hit returns you to the previous biome without spending a life.

The slingshot cinematic is the same in cases 2 and 3: rise, zoom out, slow down, aim by dragging backward, dotted trajectory, launch opposite the drag, biome effect at the screen edge. On impact a puff of smoke rises under the character and fades. A safe landing resumes the run at normal size, distance kept. A dangerous landing opens the death screen, with no second slingshot.

Lives start at 0 on every attempt. A heart adds one life.

## Coins, diamonds, and the shop

Counters in the top right show lives, coins, diamonds, and pause.

| Source | Reward |
| --- | --- |
| Sky coin | +1. A continuous zigzag ribbon, one coin every few pixels, only while you are the ship |
| Distance bonus | 1 coin per 100 units, paid on the Endless death screen |
| First Adventure clear | `50 × level number`, once |
| Past world | 1 diamond every 10 seconds on the chicken |

Diamonds are the rarer currency. They are not picked up in a level. They stay yours after you return from the past. Quitting or restarting before death pays nothing.

The shop has three pages. The first two are skins, cheapest to most expensive. Buying a skin does not change stats. The last page is accessories, priced in diamonds. Each accessory is shown on the card, worn by the equipped character, and can be worn on every skin. They stick out from the body. The collision box stays the body: if only the accessory touches a block, it is not a hit. Pressing the equipped accessory again removes it.

**Skins (coins):** Classique 0, Dino 120, Cube 300, Astronaute 600, Chat 950, Robot 1400, Oiseau 2100, Spectre 2900, Renard 3700, Lapin 4600, Ninja 5600, Chevalier 6800, Sorcier 8100, Pirate 9500, Panda 11000, Alien 12900.

**Accessories (diamonds):** écharpe 6, bonnet 8, lunettes 10, cape 12, couronne 14, nœud 16, ailes 18, masque 20.

## Biomes

Scenery does not collide. Neighboring props are not the same sprite, and the far layer changes along the run. Some objects sit farther away and draw smaller.

| Biome | Sky | On the ground |
| --- | --- | --- |
| Désert | Sun, dunes of different shapes | Cactus, beetle, tent, pot, skull, bush, palm, cart, vulture |
| Montagne enneigée | Varied peaks, falling snow | Penguin, igloo, fir, sled, snowman, fox, cabin, crystal |
| Ville de nuit | Buildings of different heights and roofs | Cat, airship, street lamp, hydrant, sign, pigeon, bench, storefront |
| Jungle | Varied treetops | Parrot, monkey, flower, frog, totem, bush, mushroom, vine, toucan |
| Espace | Stars, a moon, sometimes a ring | Green aliens in suits, some of them waving. Satellite, comet, crater, flag, robot, capsule, rover |
| Noël | Falling snow, hills, Santa in a sleigh, distant gifts | Gift, fir, wreath, candy cane, bell, snowman, stocking, lantern |
| Monde du passé | Ferns, sometimes a volcano | Fern, rock, bone, totem, egg, skull, hut, fire, spear |

Endless biome music loops on the beat and changes with the biome. Christmas has its own tune. Adventure is silent. Music-mode tunes are a little louder than the biome loops.

## Speed

| Mode | Rule |
| --- | --- |
| Endless | `min(ceiling, base × (1 + distance × coefficient))`, then × 1.22 while running. No fire |
| Adventure | Level base × `(1 + progress × 0.22)`, then × 1.22 while running. No fire |
| Music | Fixed track speed, zero until the piece has started, then × 1.22 while running. Fire always moves at running speed, even when you stop, and its front stays on screen |

Pause freezes the world, the Music fire, and the music.

| Parameter | Value |
| --- | --- |
| Endless base speed | 210 / s, then a slow climb |
| Distance coefficient | 0.000055 |
| Endless speed ceiling | 720 / s |
| Adventure bases | 260, then one step up per level, to 440 on level 20 |
| Voluntary run | × 1.22 the reference speed |
| Construction stretch | Endless and the past, with speed, ceiling × 2.4 |
| Pits without spikes | Endless only, after 15 000 m, 1 in 3 |
| Diamond | 1 every 10 s on the chicken |
| Prehistoric runners | × 0.88 of the player’s run speed |
| Fire | Music only. Continuous running speed, even when stopped. Front kept on screen |
| Music jump | Two beats. Clears the step and the gap ahead. Boards are spaced by that length |
| Bonus lockout | 4 s, and copies on the next 4 seconds of path are removed |
| Ship | Absent for 15 s, then lasts 8 s |
| Growth | ×1 → ×1.2 → ×1.4 → ×1.6 in 0.9 s |
| Slow-motion | 5 s at × 0.55 |
| Biome fade | 860 units, every 4200 |
| Endless biome order | Shuffled each run and reshuffled each cycle. The start is never Space or Christmas |
| First-clear bonus | 50 × Adventure level. Music pays none |
| Music worlds | 20, unlocked one by one, not for sale |

## Saving

Keys, all prefixed `dashmorph.`:

| Key | Contents |
| --- | --- |
| `coins` | Coin balance |
| `diamonds` | Diamond balance |
| `owned` | Owned skin ids. `classique` is always owned |
| `equipped` | Equipped skin id |
| `ownedAccessories` | Owned accessory ids |
| `accessory` | Equipped accessory id, or empty |
| `unlockedLevel` | Next Adventure level (1–20). Advances by one on a clear |
| `cleared` | Adventure levels already beaten |
| `unlockedTrack` | Next Music world. Advances by one on a clear |
| `clearedTracks` | Music worlds already beaten |
| `tracks` | Legacy Music unlock list, kept for older saves |
| `times` | Best Music times |

Writes happen on purchase, equip, coin credit, and a clear. `unlockedLevel` and `unlockedTrack` only move one step: beating the current world opens the next, not the ones after it. Adventure and Music keep separate counters.

To reset progress, clear the site’s `localStorage` entries that start with `dashmorph.` (browser devtools, or the site data for that origin). Opening the file directly uses the `file://` origin, which is separate from `http://localhost`.

## Project layout

```
dash-morph/
├── index.html          Menu, HUD, shop, level select, canvas
├── css/style.css       Stage, screens, buttons
├── js/
│   ├── main.js         Input, scaling, requestAnimationFrame loop
│   ├── game.js         Modes, physics step, camera, HUD state
│   ├── player.js       Runner, ship, skins, accessories
│   ├── world.js        Biomes, obstacles, Adventure and Music courses
│   ├── bonuses.js      Growth, slow-motion, pickup lockout
│   ├── slingshot.js    Hit cinematic
│   ├── music.js        Synthesized grooves and biome loops
│   ├── ui.js           Screens, pause, clear, shop pages
│   ├── shop.js         Skin and accessory catalog
│   └── save.js         localStorage
├── SPEC.md             Design specification (French)
├── README.md
└── LICENSE             MIT
```

Scripts are classic `<script>` tags, in the order above. Each file attaches itself to a shared `window.DM` object. There is no bundler, package manager, or remote dependency.

## How it is built

- **Picture.** Canvas 2D. Every sprite, biome, character, and effect is drawn in code.
- **Sound.** Web Audio oscillators. Grooves are note lists built from chord degrees and riffs (`js/music.js`), played with kick, snare, bass, and a sawtooth lead. A short cadence closes each piece.
- **Loop.** `requestAnimationFrame` in `js/main.js`, with physics on a fixed step inside `js/game.js`. The frame delta is capped so a background tab does not skip a huge step. While the document is hidden, the loop does not advance the game.
- **Memory.** `localStorage` only. No account, leaderboard, or multiplayer.
- **Out of this version.** Level editor, build tool, remote audio, fonts, or images. Speed orbs and springboards are not placed. Still-protected tunes are not included.

## License

[MIT](LICENSE) © 2026 Raphifou18.
