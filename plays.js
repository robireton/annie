import { argv } from 'node:process'
import { DatabaseSync } from 'node:sqlite'
import Playlist from './lib/Playlist.js'

const [, , playlistName, playlistStart, playlistCount] = argv
if (playlistName) {
  const db = new DatabaseSync('library.db')
  const pl = Playlist.fromDatabase({ db, name: playlistName })
  const start = Number.parseInt(playlistStart) || 1
  const count = Number.parseInt(playlistCount) || (pl.length - start + 1)
  const tracks = pl.tracks.slice(start - 1, start + count)
  const initial = tracks.shift()
  const playedDate = initial.last
  for (const track of tracks) {
    playedDate.setUTCMilliseconds(playedDate.getUTCMilliseconds() + Math.round(track.duration * 1000))
    if (track.plays === 0 || track.last < playedDate) {
      console.log((JSON.stringify({ class: 'played', id: track.id, date: playedDate.valueOf(), count: 1 + track.plays })))
    }
  }
}
