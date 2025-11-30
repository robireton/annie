const t0 = Date.now()

function parseISO8601 (x) {
  try {
    const [date, time] = x.split('T')
    const [year, month, day] = date.split('-').map(s => Number.parseInt(s))
    const [major, minor] = time.split('.')
    const [hours, minutes, seconds] = major.split(':').map(s => Number.parseInt(s))
    const milliseconds = Number.parseInt(minor)

    return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds, milliseconds))
  } catch (_e) {
    return null
  }
}

function ageInDays (d) {
  if (d instanceof Date) {
    return Math.ceil((t0 - d.valueOf()) / (1000 * 60 * 60 * 24))
  }

  if (Number.isInteger(d)) {
    return Math.ceil((t0 - d) / (1000 * 60 * 60 * 24))
  }

  // 2017-12-06T16:16:38.000Z
  if (typeof d === 'string' && d.length === 24 && d.charAt(10) === 'T' && d.charAt(23) === 'Z') {
    return Math.ceil((t0 - parseISO8601(d)) / (1000 * 60 * 60 * 24))
  }

  return Number.POSITIVE_INFINITY
}

export default class Track {
  #id
  #enabled
  #random
  #name
  #artist
  #duration
  #mediaKind
  #kind
  #genre
  #cloudStatus
  #stars
  #added
  #last
  #played
  #plays
  #count
  #duplicate
  #christmas

  constructor (track) {
    this.#id = track.persistentID
    this.#enabled = Boolean(track.enabled)
    this.#name = track.name
    this.#artist = track.artist
    this.#duration = track.duration
    this.#mediaKind = track.mediaKind
    this.#kind = track.kind
    this.#genre = track.genre
    this.#cloudStatus = track.cloudStatus
    this.#stars = Math.floor(track.rating / 20)
    this.#count = track.playedCount + Math.floor(Math.sqrt(Math.max(0, track.skippedCount - 1)))
    this.#added = ageInDays(track.dateAdded)
    this.#last = parseISO8601(track.playedDate)
    this.#played = ageInDays(track.playedDate)
    this.#plays = track.playedCount
    this.#duplicate = String(track.comment).includes('«duplicate»')
    this.#christmas = String(track.comment).includes('«christmas»')
    this.#random = Math.random()
  }

  get id () { return this.#id }
  get enabled () { return this.#enabled }
  get duplicate () { return this.#duplicate }
  get christmas () { return this.#christmas }
  get name () { return this.#name }
  get artist () { return this.#artist }
  get duration () { return this.#duration }
  get mediaKind () { return this.#mediaKind }
  get kind () { return this.#kind }
  get genre () { return this.#genre }
  get cloudStatus () { return this.#cloudStatus }
  get count () { return this.#count }
  get stars () { return this.#stars }
  get added () { return this.#added }
  get last () { return this.#last }
  get played () { return this.#played }
  get plays () { return this.#plays }
  get random () { return this.#random }
}
