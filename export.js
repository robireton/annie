/* global Application, ObjC, $ */
ObjC.import('Foundation')

function writeJSON (obj) {
  $.NSFileHandle.fileHandleWithStandardOutput.writeData(
    $.NSString.alloc.initWithString(`${JSON.stringify(obj)}\n`).dataUsingEncoding($.NSUTF8StringEncoding)
  )
}

const Music = Application('Music')

for (const playlist of Music.playlists()) {
  const p = playlist.properties()
  if (p.class === 'subscriptionPlaylist') continue
  if (p.class === 'folderPlaylist') continue
  if (p.class === 'userPlaylist') {
    if (p.smart) continue
    writeJSON(p)
  }

  for (const track of playlist.tracks()) {
    const t = track.properties()

    if (p.class === 'libraryPlaylist') {
      // the tracks that user playlists refer to
      writeJSON(t)
    } else {
      // the mappings between tracks and user playlists
      writeJSON({ class: 'playlistTrack', playlist: p.persistentID, index: t.index, track: t.persistentID })
    }
  }
}
