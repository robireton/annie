/* global Application, ObjC, $ */
ObjC.import('Foundation')

const stdin = $.NSString.alloc.initWithDataEncoding(
  $.NSFileHandle.fileHandleWithStandardInput.readDataToEndOfFileAndReturnError(null),
  $.NSUTF8StringEncoding
).js.trim().split(/\s*[\r\n]+\s*/)

const Playlists = new Map()
const Renames = new Map()
for (const line of stdin) {
  try {
    const update = JSON.parse(line)
    if ('class' in update) {
      if (update.class === 'playlist') {
        Playlists.set(update.id, update)
      }
      if (update.class === 'rename') {
        Renames.set(update.id, update)
      }
    }
  } catch (err) {
    console.log(err.message)
  }
}

const Music = Application('Music')
if (Renames.size > 0) {
  for (const t of Music.libraryPlaylists[0].tracks()) {
    const id = t.persistentID()
    if (Renames.has(id)) {
      const r = Renames.get(id)
      try {
        if ('artist' in r) {
          console.log(`“${t.artist()}” -> “${r.artist}”`)
          t.artist = r.artist
        }
        if ('sortArtist' in r) {
          console.log(`“${t.sortArtist()}” -> “${r.sortArtist}”`)
          t.sortArtist = r.sortArtist
        }
      } catch (renameErr) {
        console.log(`\n\nerror with ${JSON.stringify(r)}`)
      }
    }
  }
}

if (Playlists.size > 0) {
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
