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

- Use the title screen to choose total players, how many are human, and the bot difficulty.
- Human turns are pass-and-play. Reveal the current hand when the next player is ready.
- Drag a domino from your hand onto a train endpoint.
- Or click a domino in your hand to select it and click a highlighted endpoint.
- Click `Draw / Pass` if you cannot play.
- Click `Next Round` after a round ends.
- Return to the title screen after round 13 finishes to start a new match with new settings.

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
