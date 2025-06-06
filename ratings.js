#!/usr/bin/env osascript -l JavaScript
/* global Application */

const stars = (𝑛, c = '★') => ''.padStart(Math.floor(𝑛 / 20), c)

const tracks = Application('Music').libraryPlaylists[0].tracks()
console.log(`Adjusting ratings for ${tracks.length} tracks`)
for (const track of tracks) {
  try {
    const t = track.properties()
    if (t.mediaKind !== 'song') continue
    // if (t.cloudStatus === 'no longer available') continue
    if (t.kind === 'PDF document') continue
    if (t.kind === 'iTunes LP') continue

    if (t.rating === 0) {
      console.log(`rating “${t.name}” by “${t.artist}” ${stars(60)}`)
      track.rating = 60
      t.rating = 60
    }

    if (t.rating < 40 && !t.disliked) {
      console.log(`disliking “${t.name}” by “${t.artist}” (${stars(t.rating)})`)
      track.disliked = true
      continue
    }

    if (t.disliked && t.rating > 20) {
      console.log(`clearing disliked from “${t.name}” by “${t.artist}” (${stars(t.rating)})`)
      track.disliked = false
      continue
    }

    if (t.rating > 80 && !t.favorited) {
      console.log(`favoriting “${t.name}” by “${t.artist}” (${stars(t.rating)})`)
      track.favorited = true
      continue
    }

    if (t.favorited && t.rating < 100) {
      console.log(`clearing favorite from “${t.name}” by “${t.artist}” (${stars(t.rating)})`)
      track.favorited = false
      continue
    }

    if (t.favorited && t.disliked) {
      console.log(`☞ “${t.name}” by “${t.artist}” is both favorited and disliked ☜`)
      continue
    }
  } catch (err) {
    console.log(`caught error: “${err.message}” while processing “${track?.name()}” by “${track?.artist()}”`)
  }
}
