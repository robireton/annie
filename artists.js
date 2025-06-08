import { DatabaseSync } from 'node:sqlite'

function makeKey (str) {
  return str.trim().normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '').toLowerCase()
}

const db = new DatabaseSync('library.db')

const artists = new Map(db.prepare('SELECT "key", "artist", "sortArtist" FROM "artist"').all().map(a => [a.key, { artist: a.artist, sortArtist: a.sortArtist }]))

const updates = new Map()
for (const t of db.prepare('SELECT "persistentID", "artist", "sortArtist" FROM "track"').all()) {
  const key = makeKey(t.artist)
  if (!artists.has(key)) {
    console.error(`no entry for “${t.artist}”`)
    continue
  }
  const a = artists.get(key)
  const id = t.persistentID
  if (t.artist !== a.artist) {
    if (updates.has(id)) {
      updates.get(id).artist = a.artist
    } else {
      updates.set(id, { class: 'rename', id, artist: a.artist })
    }
  }
  if (t.sortArtist !== a.sortArtist) {
    if (updates.has(id)) {
      updates.get(id).sortArtist = a.sortArtist
    } else {
      updates.set(id, { class: 'rename', id, sortArtist: a.sortArtist })
    }
  }
}
db.close()

for (const update of updates.values()) {
  console.log(JSON.stringify(update))
}
