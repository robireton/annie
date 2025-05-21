#!/usr/bin/env osascript -l JavaScript
/* global Application */

const stars = (c = '★', n) => ''.padStart(n, c)

const tracks = Application('Music').libraryPlaylists[0].tracks()
console.log(`Adjusting ratings for ${tracks.length} tracks`)
for (const track of tracks) {
  try {
    const t = track.properties()
    if (t.mediaKind !== 'song') continue
    if (t.cloudStatus === 'no longer available') continue
    if (t.kind === 'PDF document') continue
    // if (!t.enabled) continue

    if (t.favorited && t.disliked) {
      console.log(`☞ “${t.name}” by “${t.artist}” is both favorited and disliked ☜`)
      continue
    }

    if (t.rating === 0) {
      console.log(`rating “${t.name}” by “${t.artist}” ★★★`)
      track.rating = 60
      t.rating = 60
    }

    if (t.rating > 60 && !t.favorited) {
      console.log(`favoriting “${t.name}” by “${t.artist}” (${stars(Math.floor(t.rating / 20))})`)
      track.favorited = true
      continue
    }

    if (t.favorited && t.rating < 80) {
      console.log(`rating “${t.name}” by “${t.artist}” ★★★★`)
      track.rating = 80
      continue
    }

    if (t.rating < 60 && !t.disliked) {
      console.log(`disliking “${t.name}” by “${t.artist}” (${stars(Math.floor(t.rating / 20))})`)
      track.disliked = true
      continue
    }

    if (t.disliked && t.rating > 40) {
      console.log(`rating “${t.name}” by “${t.artist}” ★★`)
      track.rating = 40
    }
  } catch (err) {
    console.log(`caught error: “${err.message}” while processing “${track?.name()}” by “${track?.artist()}”`)
  }
}
