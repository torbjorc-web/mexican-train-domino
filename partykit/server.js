// Minimal PartyKit relay server for Mexican Train snapshots and actions.
export default class Server {
  constructor(party) {
    this.party = party;
  }

  onConnect(connection) {
    this.party.broadcast(JSON.stringify({ type: 'system', message: 'peer-connected' }));
  }

  onMessage(message, sender) {
    this.party.broadcast(message, [sender.id]);
  }
}
