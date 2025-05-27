import { DatabaseSync } from 'node:sqlite'

const db = new DatabaseSync('library.db')

const select = db.prepare(`
  SELECT
    "persistentID",
    iif("sortName" = '', "name", "sortName") AS "name",
    iif("sortArtist" = '', "artist", "sortArtist") AS "artist",
    iif("sortAlbum" = '', "album", "sortAlbum") AS "album",
    "time",
    "duration",
    "year",
    "compilation"
  FROM "track"
  WHERE
    "enabled" = 1
    AND "mediaKind" = 'song'
    AND "kind" NOT IN ('iTunes LP', 'PDF document')
    AND "cloudStatus" != 'no longer available'
    AND "comment" NOT LIKE '%«duplicate»%'
  ORDER BY
    "artist",
    "album"
`)

const A = new Map()
for (const track of select.iterate()) {
  const artist = track.artist.trim()
  const name = track.name.trim().replaceAll(/^[a-z0-9 ]/ig, '')
  const key = `${artist}·${name}`.toLowerCase()
  if (A.has(key)) {
    A.get(key).push(track)
  } else {
    A.set(key, [track])
  }
}
db.close()

const report = Array.from(A.values()).filter(tracks => tracks.length > 1).map(tracks => [`${tracks[0].artist} · “${tracks[0].name}”`, ...tracks.sort((a, b) => a.duration - b.duration).map(track => ` ${String(track.time).padStart(5)}  ${track.year}  ${track.album}${track.compilation ? ' «compilation»' : ''}`)].join('\n')).join('\n\n')
console.log(report)
