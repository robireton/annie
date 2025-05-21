/* global Application, ObjC, $ */
ObjC.import('Foundation')

const stdin = $.NSString.alloc.initWithDataEncoding(
  $.NSFileHandle.fileHandleWithStandardInput.readDataToEndOfFileAndReturnError(null),
  $.NSUTF8StringEncoding
).js.trim().split(/\s*[\r\n]+\s*/)

const Playlists = new Map()
for (const line of stdin) {
  try {
    const playlist = JSON.parse(line)
    if ('class' in playlist && playlist.class === 'playlist') {
      Playlists.set(playlist.id, playlist)
    }
  } catch (err) {
    console.log(err.message)
  }
}

if (Playlists.size > 0) {
  const Music = Application('Music')
  const Tracks = new Map(Array.from(Playlists.values()).map(p => p.tracks).reduce((a, c) => a.concat(c)).map(id => [id, null]))

  for (const t of Music.libraryPlaylists[0].tracks()) {
    if (Tracks.has(t.persistentID())) {
      Tracks.set(t.persistentID(), t)
    }
  }

  for (const p of Music.playlists()) {
    if (Playlists.has(p.persistentID())) {
      const ids = new Set(Playlists.get(p.persistentID()).tracks)

      for (const t of p.tracks()) {
        if (ids.has(t.persistentID())) {
          ids.delete(t.persistentID())
        } else {
          t.delete()
        }
      }
      for (const id of ids) {
        Music.duplicate(Tracks.get(id), { to: p })
      }
    }
  }
}
