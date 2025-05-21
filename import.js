import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { DatabaseSync } from 'node:sqlite'

function getType (types) {
  if (types.includes('string')) return 'TEXT'
  if (types.includes('real')) return 'REAL'
  if (types.includes('integer')) return 'INTEGER'
  if (types.includes('boolean')) return 'INTEGER'
  return null
}

function getStructure (items) {
  const columnTypes = new Map()
  for (const track of items) {
    for (const [key, value] of Object.entries(track)) {
      const type = typeof value === 'number' ? (Number.isInteger(value) ? 'integer' : 'real') : typeof value
      if (!columnTypes.has(key)) {
        columnTypes.set(key, [])
      }
      const s = columnTypes.get(key)
      s.push(type)
      columnTypes.set(key, s)
    }
  }

  // skip columns where every value is the same
  for (const column of columnTypes.keys()) {
    if ((new Set(Array.from(items).map(track => track[column]))).size === 1) {
      console.log(`skipping unused column “${column}”`)
      columnTypes.delete(column)
    }
  }
  return new Map(Array.from(columnTypes).map(([field, types]) => [field, getType(types)]).filter(([_field, type]) => ['TEXT', 'REAL', 'INTEGER'].includes(type)))
}

function createTableSQL (name, columns) {
  return [
    `CREATE TABLE IF NOT EXISTS "${name}" (`,
    Array.from(columns).map(([field, type]) => `\t"${field}" ${type}${field === 'persistentID' ? ' PRIMARY KEY NOT NULL' : ''}`).join(',\n'),
    ') STRICT'
  ].join('\n')
}

function insertSQL (name, columns) {
  const fields = Array.from(columns.keys())
  const names = fields.map(field => `"${field}"`).join(', ')
  const values = fields.map(field => `:${field}`).join(', ')
  return `INSERT INTO "${name}" (${names}) VALUES (${values})`
}

stdin.setEncoding('utf8')
const rl = createInterface({
  input: stdin,
  output: stdout,
  terminal: false
})

const tracks = new Map()
const playlists = new Map()
const mappings = []
rl.on('line', line => {
  try {
    const A = JSON.parse(line)
    switch (A.class) {
      case 'sharedTrack':
      case 'fileTrack':
        tracks.set(A.persistentID, A)
        break

      case 'libraryPlaylist':
      case 'folderPlaylist':
      case 'userPlaylist':
        playlists.set(A.persistentID, A)
        break

      case 'subscriptionPlaylist':
        // ignoring for now
        break

      case 'playlistTrack':
        mappings.push(A)
        break

      default:
        console.log(`unhandled class: “${A.class}”`)
    }
  } catch (err) {
    console.error(`failed to parse line: “${line}”`)
  }
})

rl.on('close', () => {
  console.log('Input complete')
  console.log(`\t${tracks.size} tracks`)
  console.log(`\t${playlists.size} playlists`)
  console.log(`\t${mappings.length} mappings`)
  if (tracks.size > 0 || playlists.size > 0 || mappings.length > 0) {
    const db = new DatabaseSync('library.db')
    db.exec('DROP TABLE IF EXISTS "playlisttrack"')
    db.exec('DROP TABLE IF EXISTS "track"')
    db.exec('DROP TABLE IF EXISTS "playlist"')

    if (playlists.size > 0) {
      const structure = getStructure(playlists.values())
      db.exec(createTableSQL('playlist', structure))
      const insert = db.prepare(insertSQL('playlist', structure))
      const template = Object.fromEntries(structure.keys().map(name => [name, null]))
      for (const playlist of playlists.values()) {
        const t = Object.create(template)
        for (const [name, value] of Object.entries(playlist)) {
          if (!structure.has(name)) continue
          if (value === null) continue
          t[name] = (structure.get(name) === 'TEXT' ? String(value) : Number(value))
        }
        insert.run(t)
      }
    }

    if (tracks.size > 0) {
      const structure = getStructure(tracks.values())
      db.exec(createTableSQL('track', structure))
      const insert = db.prepare(insertSQL('track', structure))
      const template = Object.fromEntries(structure.keys().map(name => [name, null]))
      for (const track of tracks.values()) {
        const t = Object.create(template)
        for (const [name, value] of Object.entries(track)) {
          if (!structure.has(name)) continue
          if (value === null) continue
          t[name] = (structure.get(name) === 'TEXT' ? String(value) : Number(value))
        }
        insert.run(t)
      }
    }

    if (mappings.length > 0) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS "playlisttrack" (
          "playlist" TEXT NOT NULL,
          "index" INTEGER NOT NULL,
          "track" TEXT NOT NULL,
          FOREIGN KEY ("playlist") REFERENCES "playlist" ("persistentID") ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY ("track") REFERENCES "track" ("persistentID") ON DELETE CASCADE ON UPDATE CASCADE,
          PRIMARY KEY("playlist", "track")
        ) STRICT;
       `)
      const insert = db.prepare('INSERT OR IGNORE INTO "playlisttrack" ("playlist", "index", "track") VALUES (:playlist, :index, :track)')
      for (const { playlist, index, track } of mappings) {
        if (!tracks.has(track)) continue
        if (!playlists.has(playlist)) continue
        insert.run({ playlist, index, track })
      }
    }
    db.close()
  }
})
