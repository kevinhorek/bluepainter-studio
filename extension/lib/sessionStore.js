const STORE_KEY = 'bluepainter.fileSessions';

class SessionStore {
  constructor(context) {
    this.context = context;
  }

  _readAll() {
    return this.context.globalState.get(STORE_KEY, {});
  }

  get(uri) {
    const all = this._readAll();
    return all[uri] || null;
  }

  set(uri, data) {
    const all = this._readAll();
    all[uri] = {
      rootNodeId: data.rootNodeId,
      nodesMap: data.nodesMap,
      selectedNodeId: data.selectedNodeId || null,
      updatedAt: Date.now()
    };
    return this.context.globalState.update(STORE_KEY, all);
  }
}

module.exports = { SessionStore };
