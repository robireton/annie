import { DatabaseSync } from 'node:sqlite'
import Track from './Track.js'

export default class Playlist extends Map {
  #id
  #name

  constructor (id, name, iterable) {
    super(Array.from(iterable).filter(t => t instanceof Track).map(t => [t.id, t]))
    this.#id = id
    this.#name = name
  }

  get id () { return this.#id }
  get name () { return this.#name }
  get tracks () { return Array.from(super.values()) }
  get length () { return super.size }
  get artists () { return new Set(this.tracks.map(t => t.artist)) }

  has (track) {
    return (track instanceof Track) ? super.has(track.id) : super.has(track)
  }

  add (track) {
    if (track instanceof Track) {
      super.set(track.id, track)
    }
  }

  set (id, track) {
    if (!(track instanceof Track) || id !== track.id) throw new TypeError('Playlist.prototype.set(id, track) requires track to be an instance of Track and id = track.id')
    return super.set(id, track)
  }

  delete (track) {
    return (track instanceof Track) ? super.delete(track.id) : super.delete(track)
  }

  tracksWithStars (stars) {
    return this.tracks.filter(track => track.stars === stars)
  }

  leastRecentlyPlayedTrack (stars, artists = new Set()) {
    const candidates = stars ? this.tracksWithStars(stars) : this.tracks.filter(track => track.stars > 2)
    if (candidates.length < 1) return null
    const songsByOtherArtists = candidates.filter(track => !artists.has(track.artist)).sort((a, b) => b.played - a.played || b.random - a.random)
    return ((songsByOtherArtists.length > 0) ? songsByOtherArtists : candidates.sort((a, b) => b.played - a.played || b.random - a.random))[0]
  }

  leastPlayedTrack (stars, artists = new Set()) {
    const candidates = stars ? this.tracksWithStars(stars) : this.tracks.filter(track => track.stars > 2)
    if (candidates.length < 1) return null
    const songsByOtherArtists = candidates.filter(track => !artists.has(track.artist)).sort((a, b) => a.count - b.count || a.random - b.random)
    return ((songsByOtherArtists.length > 0) ? songsByOtherArtists : candidates.sort((a, b) => a.count - b.count || a.random - b.random))[0]
  }

  isFull (stars, batch, total) {
    return super.size >= total || this.tracksWithStars(stars).length >= batch
  }

  shuffle () {
    return this.tracks.sort((a, b) => a.random - b.random)
  }

  static fromDatabase (obj) {
    if (obj.db instanceof DatabaseSync) {
      let id, name, playlist
      if ('id' in obj) {
        playlist = obj.db.prepare('SELECT "persistentID", "name" FROM "playlist" WHERE "persistentID" = ?').get(obj.id)
      } else if ('name' in obj) {
        playlist = obj.db.prepare('SELECT "persistentID", "name" FROM "playlist" WHERE "name" = ?').get(obj.name)
      }

      if (playlist) {
        id = playlist.persistentID
        name = playlist.name
        const tracks = obj.db.prepare(`
          SELECT
            t."persistentID",
            t."artist",
            t."cloudStatus",
            t."comment",
            t."dateAdded",
            t."enabled",
            t."genre",
            t."genre",
            t."kind",
            t."mediaKind",
            t."name",
            t."playedCount",
            t."playedDate",
            t."rating",
            t."skippedCount"
          FROM
            "track" t, "playlisttrack" x
          WHERE
            t."persistentID" = x."track"
            AND x."playlist" = ?
          ORDER BY x."index"
        `).all(id).map(track => new Track(track))
        return new Playlist(id, name, tracks)
      } else {
        id = '0000000000000000'
        name = 'Library'
        const tracks = obj.db.prepare(`
          SELECT
            "persistentID",
            "artist",
            "cloudStatus",
            "comment",
            "dateAdded",
            "enabled",
            "genre",
            "genre",
            "kind",
            "mediaKind",
            "name",
            "playedCount",
            "playedDate",
            "rating",
            "skippedCount"
          FROM
            "track"
        `).all().map(track => new Track(track))
        return new Playlist(id, name, tracks)
      }
    }
  }
}
