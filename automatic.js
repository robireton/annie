import { DatabaseSync } from 'node:sqlite'
import Track from './lib/Track.js'
import Playlist from './lib/Playlist.js'

const targetLength = 100
const debug = false

function meetsRequirements (track) {
  if (!(track instanceof Track)) return false
  if (!track.enabled) return false
  if (track.mediaKind !== 'song') return false
  if (track.cloudStatus === 'no longer available') return false
  if (['Spoken Word', 'Classical'].includes(track.genre)) return false
  if (['iTunes LP', 'PDF document'].includes(track.kind)) return false

  if (track.stars < 2) return false
  if (track.played < 8 || (track.played < 13 && track.added > 34)) return false // older songs played recently
  if (track.duplicate) return false // “duplicates” in compilations, etc.

  const isNew = track.added < 89 || track.count < 5
  switch (track.stars) {
    case 2:
      if (track.played < 610) return false
      break
    case 3:
      if (track.played < 377 && !isNew) return false
      break
    case 4:
      if (track.played < 233 && !isNew) return false
      break
    case 5:
      if (track.played < 144 && !isNew) return false
      break
  }
  return true
}

function batchSizes (playlist, tl = 100, playlistsCount = 7) {
  const result = new Map()
  const n = tl - 2

  result.set(5, Math.floor(Math.min(n * 0.145898, playlist.tracksWithStars(5).length / playlistsCount)))
  result.set(4, Math.floor(Math.min(n * 0.236068, playlist.tracksWithStars(4).length / playlistsCount)))
  result.set(3, n - result.get(4) - result.get(5))
  result.set(2, 2)
  return result
}

const db = new DatabaseSync('library.db')

const music = Playlist.fromDatabase({ name: 'Music', db })
for (const track of music.tracks) {
  if (!meetsRequirements(track)) music.delete(track)
}

if (debug) {
  console.log(`\n\n“${music.name}” (${music.id})`)
  console.log(`   ★★ · ${String(music.tracksWithStars(2).length).padStart(4)} tracks`)
  console.log(`  ★★★ · ${String(music.tracksWithStars(3).length).padStart(4)} tracks`)
  console.log(` ★★★★ · ${String(music.tracksWithStars(4).length).padStart(4)} tracks`)
  console.log(`★★★★★ · ${String(music.tracksWithStars(5).length).padStart(4)} tracks`)
  console.log(`total · ${String(music.length).padStart(4)} tracks`)
  console.log(`distinct artists: ${music.artists.size}`)
}

const playlists = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(name => Playlist.fromDatabase({ name, db }))
if (debug) console.log(`playlists has type ${typeof playlists} and length ${playlists.length} and ${playlists instanceof Array ? 'is' : 'is not'} an array`)
db.close()

const B = batchSizes(music, targetLength, playlists.length)
if (debug) {
  console.log('\nBatch Sizes')
  for (const [key, value] of B) {
    console.log(`\t${key}: ${value}`)
  }
}

if (debug) {
  for (const playlist of playlists) {
    for (const track of playlist.tracks) {
      playlist.delete(track)
    }
  }
} else {
  for (const playlist of playlists) {
    for (const track of playlist.tracks) {
      if (music.has(track)) {
        music.delete(track)
      } else {
        playlist.delete(track)
      }
    }
  }
}

if (debug) {
  for (const playlist of playlists) {
    console.log(`\n\n“${playlist.name}” (${playlist.id})`)
    console.log(`   ★★ · ${String(playlist.tracksWithStars(2).length).padStart(4)} tracks`)
    console.log(`  ★★★ · ${String(playlist.tracksWithStars(3).length).padStart(4)} tracks`)
    console.log(` ★★★★ · ${String(playlist.tracksWithStars(4).length).padStart(4)} tracks`)
    console.log(`★★★★★ · ${String(playlist.tracksWithStars(5).length).padStart(4)} tracks`)
    console.log(`total · ${String(playlist.length).padStart(4)} tracks`)
    console.log(`distinct artists: ${playlist.artists.size}`)
  }
}

for (const [s, n] of B) {
  if (debug) console.log(`\n\n${s} · ${n}`)
  let abort = playlists.map(playlist => playlist.length).every(length => length >= targetLength)
  if (debug) console.log(`\tabort is ${abort}`)
  if (debug) console.log(`playlists that have fewer than ${n} tracks with ${s} stars: ${playlists.filter(p => !p.isFull(s, n, targetLength)).map(p => p.name).join(', ')}`)
  while (!abort && playlists.some(p => !p.isFull(s, n, targetLength)) && music.tracksWithStars(s).length > 0) {
    for (const playlist of playlists) {
      // Get the least-recently-played track
      if (!(abort || playlist.isFull(s, n, targetLength))) {
        const track = music.leastRecentlyPlayedTrack(s, playlist.artists)
        if (track) {
          playlist.add(track)
          music.delete(track)
        } else {
          if (debug) console.log('abort')
          abort = true
          break
        }
      }

      // Get the least-played/skipped track
      if (!(abort || playlist.isFull(s, n, targetLength))) {
        const track = music.leastPlayedTrack(s, playlist.artists)
        if (track) {
          playlist.add(track)
          music.delete(track)
        } else {
          if (debug) console.log('abort')
          abort = true
          break
        }
      }
    }
    if (debug) console.log(`playlists that have fewer than ${n} tracks with ${s} stars: ${playlists.filter(p => !p.isFull(s, n, targetLength)).map(p => p.name).join(', ')}`)
  }
}

while (playlists.map(playlist => playlist.length).some(size => size < targetLength) && music.length > 0) {
  for (const playlist of playlists) {
    if (playlist.length < targetLength) {
      const track = music.leastRecentlyPlayedTrack()
      if (track) {
        playlist.add(track)
        music.delete(track)
      }
    }

    // Get the least-played/skipped track
    if (playlist.length < targetLength) {
      const track = music.leastPlayedTrack()
      if (track) {
        playlist.add(track)
        music.delete(track)
      }
    }
  }
}

if (debug) {
  for (const playlist of playlists) {
    console.log(`\n\n“${playlist.name}” (${playlist.id})`)
    console.log(`   ★★ · ${String(playlist.tracksWithStars(2).length).padStart(4)} tracks`)
    console.log(`  ★★★ · ${String(playlist.tracksWithStars(3).length).padStart(4)} tracks`)
    console.log(` ★★★★ · ${String(playlist.tracksWithStars(4).length).padStart(4)} tracks`)
    console.log(`★★★★★ · ${String(playlist.tracksWithStars(5).length).padStart(4)} tracks`)
    console.log(`total · ${String(playlist.length).padStart(4)} tracks`)
    console.log(`distinct artists: ${playlist.artists.size}`)
  }
} else {
  for (const playlist of playlists) {
    console.log(JSON.stringify({ class: 'playlist', id: playlist.id, name: playlist.name, tracks: playlist.shuffle().map(track => track.id) }))
  }
}
