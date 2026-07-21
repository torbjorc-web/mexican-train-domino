# Mexican Train Dominoes Prototype

This workspace contains a Phaser.js browser prototype of Mexican Train Dominoes.

## Implemented rules

- Full 13-round match from `12|12` down to `0|0`.
- Configurable table size from 2 to 6 players.
- Configurable human player count from 1 up to the chosen table size.
- Hands are dealt by standard table size: 15 tiles for 2 to 4 players, 12 tiles for 5 to 6 players.
- Each player has a personal train. One shared Mexican Train is always public.
- A player may play on their own train, the Mexican Train, or another player's open train.
- Opening phase rule: every player must start their personal train before broader play opens up.
- If a player cannot play, they draw one tile. If they still cannot play, their train opens.
- Playing on your own open train closes it again.
- Doubles must be covered immediately. If the player who laid the double cannot cover it, responsibility passes clockwise until someone does.
- The round ends when any player empties their hand, or when the boneyard is empty and no legal moves remain.
- Scores accumulate across all 13 rounds. Lowest total score wins the match.

## Controls

- Use the title screen to choose total players, how many are human, the bot difficulty, each human player's name, and each human train color.
- Human turns are pass-and-play. Reveal the current hand when the next player is ready.
- Drag a domino from your hand onto a train endpoint.
- Or click a domino in your hand to select it and click a highlighted endpoint.
- Click `Draw / Pass` if you cannot play.
- Click `Next Round` after a round ends.
- Return to the title screen after round 13 finishes to start a new match with new settings.

## Extras

- Each train now has its own visible color in the station view, and human train colors must stay unique.
- Human player names are saved for the match and shown in the score and train summaries.
- Completed match results are stored as local high scores in the browser.
- Optional online multiplayer mode is available via PartyKit room sync (host + guest).
- The Phaser canvas now uses responsive FIT scaling for phone and tablet screens.
- Short placement sound effects play whenever a domino is placed.
- A dedicated heavier placement clip is used for doubles.
- Online mode includes a reconnect button in the status banner for manual reconnect.

## Tiles

- The prototype uses a standard double-12 domino set.
- Total tile count is 91 unique tiles.
- Tile notation is `a|b` (for example `12|12`, `12|7`, `0|0`).
- The engine for each round is removed from the draw pile and placed at the center.
- Hand size in this prototype is 15 tiles per player for 2 to 4 players.
- Hand size in this prototype is 12 tiles per player for 5 to 6 players.

## Bot behavior

- `Easy`: chooses from legal moves loosely and plays more randomly.
- `Normal`: chooses from the stronger moves but still varies play.
- `Hard`: uses the highest-scoring heuristic move each turn.
- Stronger heuristics prioritize shedding high pips, closing personal trains, satisfying doubles, and avoiding unnecessary help to opponents.

## Run it

Because `npm` is not available in this environment, this prototype uses Phaser from a CDN and does not require a build step.

You can serve it with any static server, for example:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

## Online multiplayer with PartyKit

1. Create and deploy a PartyKit project (or use an existing one).
2. Use the relay implementation in `partykit/server.js` as your PartyKit server.
3. Start this game locally as usual.
4. In the title screen, set `Game Mode` to `Online Host (PartyKit)` on one device and `Online Join (PartyKit)` on the other.
5. Click `Online Setup` and enter:
   - PartyKit host (example: `your-project.your-account.partykit.dev`)
   - shared room code
   - your player name
6. Start the match on host, then join from the second device using the same room code.

Notes:

- Current online mode is authoritative-host and trust-based (the full state is synced).
- Online mode is currently fixed to 2 human players.

## Browser tests

You can run the lightweight browser-based rules tests by opening:

```text
http://localhost:8000/tests/run-tests.html
```

These tests exercise the shared state module directly in the browser without npm or an external test runner.

## Notes

- The prototype still runs directly in the browser from a static server.
- If you change gameplay rules or player setup, remember to update this README so the controls and stored-match behavior stay in sync.
