/* global Application */
const Music = Application('Music')
for (const playlist of Music.playlists()) {
  console.log()
  console.log(JSON.stringify(playlist.properties()))
  // console.log(`playlist.class: ${playlist.class}`)
  console.log(`playlist.class(): ${playlist.class()}`)
}
