const SOCKET = "module.web-marker";

export function initSocket() {
  game.socket.on(SOCKET, async (request) => {
    if (!game.user.isGM) return;
    const scene = game.scenes.current;
    if (!scene) return;

    if (request.action === "createTile") {
      await TileDocument.create(request.data, { parent: scene });

    } else if (request.action === "updateTile") {
      const tile = await fromUuid(request.uuid);
      await tile?.update(request.data);

    } else if (request.action === "deleteTile") {
      const tile = await fromUuid(request.uuid);
      await tile?.delete();
    }
  });
}

export async function socketCreateTile(data) {
  if (game.user.isGM) {
    await TileDocument.create(data, { parent: canvas.scene });
  } else {
    game.socket.emit(SOCKET, { action: "createTile", data });
  }
}

export async function socketUpdateTile(uuid, updateData) {
  if (game.user.isGM) {
    const tile = await fromUuid(uuid);
    await tile?.update(updateData);
  } else {
    game.socket.emit(SOCKET, { action: "updateTile", uuid, data: updateData });
  }
}

export async function socketDeleteTile(uuid) {
  if (game.user.isGM) {
    const tile = await fromUuid(uuid);
    await tile?.delete();
  } else {
    game.socket.emit(SOCKET, { action: "deleteTile", uuid });
  }
}
