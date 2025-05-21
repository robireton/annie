/* global Application, ObjC, $ */
ObjC.import('Foundation')

function writeJSON (obj) {
  $.NSFileHandle.fileHandleWithStandardOutput.writeData(
    $.NSString.alloc.initWithString(`${JSON.stringify(obj)}\n`).dataUsingEncoding($.NSUTF8StringEncoding)
  )
}

const Music = Application('Music')

for (const playlist of Music.playlists()) {
  if (playlist.class() === 'subscriptionPlaylist') continue
  const p = playlist.properties()
  writeJSON(p)
  for (const track of playlist.tracks()) {
    if (playlist.class() === 'libraryPlaylist') writeJSON(track.properties())
    writeJSON({ class: 'playlistTrack', playlist: p.persistentID, index: track.index(), track: track.persistentID() })
  }
}
