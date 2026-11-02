# Phase 6 handoff - Results, progression, capsules and Vault

## Implemented

PH-09 only. Read PH-09, CTX-07/CTX-08, ARC-05/ARC-06/ARC-08 and AST-07.
No additional assets, dependencies, backend, purchases or Phase 7 work.

- Results show victory/defeat, player/opponent final scores (damage dealt),
  final HP, match statistics, granted XP/coins and level-up feedback.
  Continue opens the capsule; Play again and Arena home remain available.
- XP, levels, coins and shards update the same persisted player profile used
  by Arena, Profile and Vault. Completed results reopen from Profile history,
  including after an app restart; live battle state is still transient.
- One deterministic common/rare/epic capsule per non-forfeit match. The reveal
  saves a new collectible or converts a duplicate into shards, once only.
  Unopened capsules remain accessible from Vault.
- Vault displays owned fighters/boosters, descriptions, rarity, balances,
  pending capsules and reward receipts. Fighter equip and exactly-three
  booster loadouts persist locally.
- Per user approval, initial ownership is Arcane plus 50:50, Extra Time and
  Mind Shield. Unowned options are labeled/disabled in setup and rejected by
  validation/store methods. Booster unlocks are permanent, not consumables.

## Approved policy and deterministic rewards

| Rule | Value |
|---|---|
| Win | 100 XP / 50 coins |
| Loss | 50 XP / 25 coins |
| Correct answers | +5 XP each |
| Forfeit | No XP, coins or capsule; history still saved |
| Level `L` threshold | `100 * (L + 1)` XP; carry any remainder |
| Duplicate common / rare / epic | 5 / 15 / 40 shards |
| Starting profile | Existing level 3, 240/400 XP, 1250 coins, 40 shards |

Capsule generation uses the existing PRNG/hash, stable match ID and seed.
Prototype rarity weights are 70%/25%/5%, with fixed rarity per existing
collectible ID. See [GAMEPLAY_DECISIONS.md](GAMEPLAY_DECISIONS.md) for the
catalogue and the full approved policy.

## Reliability and persistence

- `brain-brawl/player-data`, version 2, contains profile, equipment, inventory,
  match/reward receipts and the durable match-ID counter in a single snapshot.
- All writes are serialized. XP/coins and the claim receipt are saved in one
  write; inventory/shards and the reveal receipt are saved in one write.
  UI state is published only after storage succeeds.
- Concurrent/repeated claims return the existing match receipt. Concurrent,
  repeated or reopened capsules cannot duplicate items or shards.
- Matchmaking reserves persistent `reward-match-k` identifiers, preventing
  app-restart ID collisions while retaining the existing seeded AI behavior.
- Failed grants retain the finished battle for retry; leaving Results does not
  discard it. Arena and the battle-start boundary prevent replacing an
  unsaved finished match. Errors are visible; successful retries grant once.
- Version-1 selections migrate to owned starter equipment. Malformed current
  data, unknown versions and invalid claim/counter/inventory combinations
  fail closed without overwriting the original storage.
- Results, reward reveal, Vault and Profile read the same persisted receipts;
  no screen independently recalculates or grants rewards.

The battle engine's damage, HP, timers, booster effects, initiative and outcome
calculations were not changed. Battle setup now uses the earned player level,
and entry/session cleanup honors ownership and unsaved-result guards.

## Files changed

Added:

- [collectibles.ts](../src/data/collectibles.ts)
- [rewards.ts](../src/game/rewards.ts)
- [player-storage.ts](../src/services/player-storage.ts)
- [PlayerDataNotice.tsx](../src/components/player/PlayerDataNotice.tsx)
- [CollectibleDetails.tsx](../src/components/player/CollectibleDetails.tsx)
- [rewards.test.tsx](../tests/rewards.test.tsx)
- This handoff.

Modified:

- [player-store.ts](../src/store/player-store.ts)
- [Root layout](../app/_layout.tsx)
- [Results](../app/battle/result.tsx), [Reward reveal](../app/battle/rewards.tsx)
- [Arena](../app/(tabs)/arena.tsx), [Vault](../app/(tabs)/vault.tsx),
  [Profile](../app/(tabs)/profile.tsx)
- [Fighter select](../app/battle/fighter-select.tsx),
  [Loadout](../app/battle/loadout.tsx),
  [Matchmaking](../app/battle/matchmaking.tsx)
- [Match setup store](../src/features/match-setup/store.ts)
- [Battle store](../src/features/battle/store.ts),
  [Battle session](../src/features/battle/session.ts)
- [journey.ts](../src/navigation/journey.ts), [player.ts](../src/data/player.ts)
- [Pre-battle rules tests](../tests/pre-battle/rules.test.ts),
  [Pre-battle journey tests](../tests/pre-battle/journey.test.tsx),
  [Navigation tests](../tests/navigation.test.tsx)
- [README.md](../README.md), [GAMEPLAY_DECISIONS.md](GAMEPLAY_DECISIONS.md),
  [ASSET_MANIFEST.md](ASSET_MANIFEST.md), [ART_DIRECTION.md](ART_DIRECTION.md)

Removed: the obsolete reward-placeholder `JourneyScreen.tsx`.

No dependencies added or package manifests changed in this phase.

## Focused validation

| Check | Result |
|---|---|
| `npm run typecheck` | Passed, exit 0 |
| `npm run lint` | Passed with no warnings, exit 0 |
| Focused Jest command below | 3 suites passed; 26 tests passed, 17 unrelated tests skipped; exit 0 |

```powershell
npx jest --runInBand tests\rewards.test.tsx tests\pre-battle\rules.test.ts tests\navigation.test.tsx --testNamePattern="XP|capsule|collectible|grant|duplicate|persisted player selections|match setup store|malformed|reward|unsaved finished"
```

The 13 new focused cases verify win/loss/forfeit XP/coin values, exact XP
thresholds and multi-level remainder, deterministic catalogue/rarities, all
three duplicate shard amounts, concurrent/reopened/restarted claims, Vault
inventory visibility, persisted equipment, reopened capsule idempotency,
failed-write rollback/retry, malformed-storage retention and unsaved-result
navigation/new-battle guards. Related existing selection/validation and direct
reward-route checks were also run.

No full regression run, whole-app audit or end-to-end journey was performed.
Storage restart checks clear in-memory stores and reload mocked AsyncStorage;
they are not evidence of native-device durability under process interruption.

## Known issues and Phase 8 gaps

- Native iOS/Android app restarts, storage behavior, process termination,
  background timing, visual layout and touch interactions remain unverified.
- A crash before the first successful finished-match write can still lose that
  transient battle. Writes/retries are protected within the running app, but
  crash-point/fault-injection coverage and interrupted-write recovery need
  Phase 8. Do not promise persistence when the device cannot save.
- Malformed version-2 storage fails closed and requires a valid backup/manual
  repair if retry cannot read it. No destructive reset button was added,
  because clearing a claim ledger could permit duplicate grants.
- The claim/history ledger is retained indefinitely for idempotency; history
  UI shows the latest ten. Large histories, storage size/performance,
  pagination and migrations need Phase 8 validation.
- The modified full pre-battle journey suite was not executed in this phase.
  Whole win/loss/capsule/replay flows, ownership gates, live Vault equipping
  and Android Back/iOS gestures need Phase 8 integration/device coverage.
- Username/rank and missions remain demo content; missions do not grant
  rewards. No spending, payments, server inventory or cloud sync.
- Existing Sylva/Titan placeholders remain if those fighters are collected.
  No new custom artwork or native screenshots/recordings were produced.

**Stopped after Phase 6. Phase 7 has not started; awaiting approval.**
