# Gameplay decisions

Interpretations made where the specs leave room (ARC-05). Phase 3 covers the
pre-battle journey; Phase 4 combat and Phase 6 rewards are below. Combat
numbers live in `src/game/battle/rules.ts`; reward numbers in `src/game/rewards.ts`.

## Category draft (CTX-08)

- Order: player ban, opponent ban, player pick, opponent pick, system fill.
- Five match categories (`MATCH_RULES.categoryCount = 5`): the player's pick,
  the opponent's pick, and three seeded system choices from the four remaining
  categories. The last category is unused.
- Questions from all five categories are mixed into one seeded shared sequence.
  Picks no longer determine question order or create rounds.
- Local AI strategy: take the first still-available category in the
  opponent's fixed ban/pick priority list (`src/data/opponents.ts`), falling
  back to canonical category order. No randomness, so a draft is reproducible.
- Invalid actions (banning twice, picking a banned/picked category, picking
  during the ban stage) throw; the UI disables them first.

## Mock matchmaking

- `src/services/mock-matchmaking.ts` implements a `MatchmakingService`
  interface so a real service can replace it later. No network access.
- Fixed 1.2 s delay, cancellable through `AbortSignal` (timer cleared).
- The pure mock resolver uses seed `n` and opponent `OPPONENTS[(n - 1) % 4]`.
  The seed starts at 1 on each app launch and advances per found match.
  Phase 6's screen replaces the resolver's temporary `local-n` ID with a
  durably reserved `reward-match-k` ID before accepting the match. The
  persisted counter prevents collisions across app restarts without changing
  seeded AI/question behavior. Cancelling before resolution does not reserve
  an ID; cancelling during its write can leave a harmless counter gap.
- Only Offline Duel is selectable. Ranked Online and Friend Challenge are
  shown as unavailable future modes.

## Selections and persistence

- Defaults: Astral Sage (stable ID `arcane`); boosters 50:50, Extra Time, Mind Shield.
- Phase 6 uses `brain-brawl/player-data`, version 2, for equipment, profile,
  inventory, completed reward records and the match-ID counter in one
  serialized write. State is published only after storage succeeds.
- The old version-1 `brain-brawl/player-selections` key is read once during
  migration and left unchanged. Malformed legacy fields and unowned old
  selections reset to the owned starter equipment with a warning.
- Current records validate IDs, balances, XP/levels, owned equipment, unique
  match claims, capsule settlements and counter consistency. Malformed or
  unsupported data fails closed, is not overwritten, and shows a retry error.
  This avoids clearing an idempotency ledger and granting old matches again.
- Fighter is saved when confirmed; the loadout is saved when battle entry
  passes validation. Match state (mode, opponent, draft) is transient and is
  never persisted.
- Battle entry requires an available mode, a found match, a complete draft
  (5 distinct, non-banned categories), an owned fighter and exactly three distinct
  owned, battle-available boosters (`validateMatchSetup`). Second Chance cannot
  be equipped for a new battle; a saved loadout containing it must be changed.
  Failed selection saves do not enter
  battle. An unsaved finished match cannot be replaced by the next battle.

## Fighter passives - approved, active from Phase 4

The product context does not specify passive effects and asks for a minimal,
explicit, balanced proposal. Each passive triggers once per match for a 3 HP
swing and is visible to both players. Enabled in
combat for both sides (user decision, Phase 4; `BATTLE_RULES.passivesEnabled`).

| Fighter | Passive | Effect |
|---|---|---|
| Astral Sage (`arcane`) | Arcane Insight | First correct answer deals +3 damage |
| Nightblade (`shadow`) | Swift Strike | First correct answer in the first half of the timer deals +3 damage |
| Thorn Ranger (`sylva`) | Keen Eye | First correct answer deals +3 damage |
| Iron Bastion (`titan`) | Bulwark | First hit taken deals 3 less damage |
| Ember Sentinel (`ember`) | Solar Resolve | First correct answer deals +3 damage |
| Frost Warden (`frost`) | Glacial Guard | First hit taken deals 3 less damage |

The combat visual replacement retains the original four IDs, ownership and
passive behavior; Ember/Frost reuse existing passive triggers and amounts.
Action timing, weapons, specials and Skia effects are presentation only.

Phase 6 uses fixed collection rarity only; it does not alter fighter combat power.

## Demo data

The former demo profile is the persisted starting baseline (level 3, 240/400
XP, 1250 coins, 40 shards). Username/rank and missions remain demo content.
Earned progression, currencies, inventory and match history are now persisted.
Missions do not track progress or grant anything in Phase 6.

## Continuous combat (CTX-04, CTX-05, ARC-05)

### Match flow and endings
- Both players start at 100 HP. Display one shared question, collect independent
  final answers or timeouts, resolve both results and attacks, reveal, then
  advance both players to the next shared question.
- Both players receive the exact same prompt and option order. Answering locks
  only that player's answer; it does not stop or change the opponent's timer.
- Matches end only by knockout or forfeit. There is no question limit, HP-lead
  finish, sudden-death stage, round, round bonus, clash turn or round damage cap.
  Legacy HP-lead/sudden-death results remain readable in saved match history.
- One answer per player per question. Second Chance is disabled, as approved
  for the continuous loop; there are no retry prompts or AI retries.

### Timers and speed bonus
- Each player has an independent 12 s deadline (`questionTimeMs`). Extra Time
  extends only the activating player's deadline by 5 s. An answer must arrive
  strictly before the private deadline; at or after it is a timeout.
- A question resolves exactly once, after both players have answered or timed
  out. Until then, neither answer correctness nor damage is revealed.
- Speed bonus = `max - floor(elapsed * (max + 1) / 12 s)`, clamped to 0..max.
  Max is 3: <3 s = 3, <6 s = 2, <9 s = 1, else 0. The base 12 s window is
  unchanged by Extra Time.

### Damage and initiative
- Every correct answer creates an attack. Raw damage = base (10; Double Damage
  x2 on base only) + speed bonus + eligible attacker passive.
- Mind Shield blocks the whole attack and is consumed; otherwise Titan Bulwark
  reduces the first unblocked hit by 3. Damage cannot reduce HP below zero.
  Double Damage and offensive passives are spent even on a shielded attack.
- Wrong answers and timeouts cause no attack and no additional HP penalty.
- Both correct answers can attack. Faster answers hit first; exact ties use
  initiative, seeded for question 1 (odd seed = player) and alternating each
  question. A knockout voids any later attack in the same resolution.

### Boosters
- Exactly 3 distinct available boosters per player, each once per match, at most
  one activation per player per question. Activate before answering and before
  the player's deadline; no activation during reveal.
- 50:50 removes two incorrect options for its activating player only.
- Extra Time adds 5 s to the activating player's current deadline.
- Double Damage stays armed until the next correct-answer attack and doubles
  its base damage, not speed or passive bonuses.
- Mind Shield stays armed until it blocks the next incoming attack.
- Streak Saver stays armed until a wrong answer or timeout would reset combo.
- Second Chance remains in collection/storage for compatibility but cannot be
  equipped or activated in a new battle. The battle dock omits it and all
  unequipped powers, showing only the three equipped compatible boosters.
  Activating a power immediately greys out its card for the rest of the match,
  including while its effect remains armed.
  Saved loadouts containing it show an error until the player replaces it.
- Opponent booster use is revealed only when the shared question resolves.

### Combo and passives
- A correct answer adds 1 to combo; a wrong answer or timeout resets it unless
  Streak Saver is armed. Current and best combo remain tracked and displayed,
  with no damage multiplier.
- Arcane and Sylva: first correct answer +3. Shadow: first correct answer in
  the first half of the base timer (<6 s) +3. Titan: first unblocked incoming
  hit -3. Each passive triggers once per match.
- Sylva's former clash-only passive now uses first correct answer, matching
  Arcane, as approved for the simplified flow.

### Deterministic opponent
- Accuracy, response-time distributions and difficulty/level scaling are
  unchanged. Each question's plan is fixed at opening from the match seed,
  question key and public state, never from the player's answer.
- Knows the answer with p = 0.85/0.65/0.45 (easy/medium/hard) + 0.05 per level
  above 3, clamped to 0.05-0.95; otherwise guesses among visible options.
  Response is 2-7 s when knowing (0.25 s faster per level above 3, minimum
  0.5 s) or 5-15 s when guessing, with timeouts possible.
- Booster priority remains shield, double damage, extra time, 50:50, streak
  saver. Timing gates now use question counts: shield at HP <= 60 or question
  13 onward; Double Damage when knowing, from question 5. This preserves the
  old opponent-question-count thresholds without round state.
- Second Chance is replaced by Mind Shield for RuneScholar and Extra Time for
  IronAegis. Other fixed loadouts are unchanged; no opponent retries.

### Questions, timing and visibility
- The existing local bank has 8 questions per category (3 easy, 3 medium, 2
  hard), with 4 options. All questions in the five selected categories form
  one seeded shuffle. No banned or unused category enters the sequence.
- The entire selected pool is exhausted before repeating. Repeated questions
  are new shared slots with freshly seeded option order and fresh timers.
- The engine remains pure and timestamp-driven. The UI ticks every 250 ms;
  timers run through backgrounding and catch up once on resume.
- Each reveal lasts 2.2 s, then both players advance together. The next timer
  starts on advancement, so background catch-up does not skip question slots.
- The HUD shows the question number and current category. The arena, animations,
  answer reveal, HP, combos and ability dock retain their existing presentation.
  The former clash URL redirects to the arena; it is not an active journey step.
- The user's view never exposes the correct option before resolution, the
  opponent's chosen options, its plan or unrevealed booster use.
- Forfeit confirmation, Android Back handling, results, persisted damage scores,
  XP, coins, capsules and history remain unchanged.

## Phase 6 progression and rewards (PH-09, CTX-07, CTX-08)

Approved by the user before implementation:

- Win: 100 XP and 50 coins. Loss: 50 XP and 25 coins. Add 5 XP per correct
  player answer. Forfeit: 0 XP, 0 coins, no capsule, but keep the match history.
- XP is within the current level; level `L` costs `100 * (L + 1)` XP. Carry
  surplus across one or multiple levels. Preserve the existing starting profile.
- Final player/opponent score means damage dealt (the existing battle stat),
  not HP or XP; match outcome remains the engine's decision.
- One capsule per non-forfeit match. Duplicate common/rare/epic collectibles
  convert to 5/15/40 shards, with no duplicate inventory entry.
- Start with Arcane and the default three boosters (50:50, Extra Time,
  Mind Shield). Lock unowned fighters/boosters in selection and at validation.
  Owned boosters are permanent unlocks; Phase 4 usage rules are unchanged.

Deterministic prototype catalogue:

| Rarity | Collectibles |
|---|---|
| Common | Astral Sage, 50:50, Extra Time |
| Rare | Nightblade, Thorn Ranger, Ember Sentinel, Second Chance, Mind Shield |
| Epic | Iron Bastion, Frost Warden, Double Damage, Streak Saver |

The capsule uses the existing PRNG/hash with `(capsule-v1, seed, matchId)`.
Demo rarity weights are 70% common, 25% rare, 5% epic, then a uniform item
within the fixed rarity pool. Rarity never changes damage or passives.
Only existing roster/booster IDs and MVP art/UI treatments are used.

Claiming a completed match saves XP, coins, its summary and sealed capsule
together under the stable match ID. Opening the capsule saves inventory/shards
and the opened/duplicate receipt together. Both operations are serialized and
idempotent, including concurrent calls. Results, Vault and Profile share this
same record. All claims are retained; only recent history display is limited
to ten entries. No payments, capsule purchases, missions, cloud sync or server
inventory were implemented.
