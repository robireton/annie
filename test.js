/* global Application */
const Music = Application('Music')
for (const t of Music.libraryPlaylists[0].tracks()) {
  if (t.persistentID() !== '8C47E7EBAAF3EF2F') continue
  const d0 = t.playedDate()
  console.log(`${d0} (${d0 instanceof Date ? 'Date' : typeof d0})`)
  t.playedDate = new Date(1762180194133)
  t.playedCount = 1
  const d1 = t.playedDate()
  console.log(`${d1} (${d1 instanceof Date ? 'Date' : typeof d1})`)
  break
}
