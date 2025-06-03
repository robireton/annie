import { DatabaseSync } from 'node:sqlite'

function standardize (str) {
  return str.trim().replaceAll(/\s*[(][^)]*[)]\s*/g, '').replaceAll(/\s*[\[][^\]]*[\]]\s*/g, '').normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '').toLowerCase().replaceAll(/&/g, 'and').replaceAll(/['?!.]/g, '')
}

const db = new DatabaseSync('library.db')

const select = db.prepare(`
  SELECT
    "persistentID",
    "name",
    "artist",
    "album",
    iif("sortName" = '', "name", "sortName") AS "sortName",
    iif("sortArtist" = '', "artist", "sortArtist") AS "sortArtist",
    iif("sortAlbum" = '', "album", "sortAlbum") AS "sortAlbum",
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
  const artist = standardize(track.sortArtist)
  const name = standardize(track.sortName)
  const duration = Math.round(track.duration / 10)
  const key = `${artist}·${name}·${duration}`
  if (A.has(key)) {
    A.get(key).push(track)
  } else {
    A.set(key, [track])
  }
}
db.close()

const report = Array.from(A.values()).filter(tracks => tracks.length > 1).map(tracks => [`${tracks[0].artist} · “${tracks[0].name}” · ${Math.round(tracks[0].duration / 10)}`, ...tracks.sort((a, b) => a.duration - b.duration).map(track => ` ${String(track.time).padStart(5)}  ${track.name} by ${track.artist} on ${track.album}${track.compilation ? ' «compilation»' : ''} (${track.year})`)].join('\n')).join('\n\n')
console.log(report)
