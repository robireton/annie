import { DatabaseSync } from 'node:sqlite'

const db = new DatabaseSync('library.db')

const select = db.prepare(`
  SELECT
    "persistentID",
    "name",
    "time",
    "duration",
    "artist",
    "albumArtist",
    "year",
    "kind",
    "rating",
    "album",
    "compilation"
  FROM "track"
  WHERE
    "enabled" = 1
    AND "mediaKind" = 'song'
    AND "kind" NOT IN ('iTunes LP', 'PDF document')
    AND "cloudStatus" != 'no longer available'
    AND "comment" NOT LIKE '%«duplicate»%'
  ORDER BY
    "album",
    "artist",
    "name",
    "duration"
`)

const A = new Map()
for (const track of select.iterate()) {
  const artist = track.artist.trim()
  const name = track.name.trim() // track.name.replaceAll(/\s*\([^)]+\)\s*/ig, '')
  const key = `${artist} · ${name}`.toLowerCase()
  if (A.has(key)) {
    A.get(key).push(track)
  } else {
    A.set(key, [track])
  }
}
db.close()

const report = Array.from(A.entries()).filter(([_key, tracks]) => tracks.length > 1).map(([key, tracks]) => [key, ...tracks.map(track => ` ${String(track.time).padStart(5)}  ${track.year}  ${track.album}${track.compilation ? ' «compilation»' : ''}`)].join('\n')).join('\n\n')
console.log(report)
