const t0 = Date.now()

function ageInDays (d) {
  if (d instanceof Date) {
    return Math.ceil((t0 - d.valueOf()) / (1000 * 60 * 60 * 24))
  }

  if (Number.isInteger(d)) {
    return Math.ceil((t0 - d) / (1000 * 60 * 60 * 24))
  }

  // 2017-12-06T16:16:38.000Z
  if (typeof d === 'string' && d.length === 24 && d.charAt(10) === 'T' && d.charAt(23) === 'Z') {
    const [date, time] = d.split('T')
    const [year, month, day] = date.split('-').map(s => Number.parseInt(s))
    const [major, minor] = time.split('.')
    const [hours, minutes, seconds] = major.split(':').map(s => Number.parseInt(s))
    const milliseconds = Number.parseInt(minor)
    return Math.ceil((t0 - Date.UTC(year, month - 1, day, hours, minutes, seconds, milliseconds)) / (1000 * 60 * 60 * 24))
  }

  return Number.POSITIVE_INFINITY
}

export default class Track {
  #id
  #enabled
  #random
  #name
  #artist
  #mediaKind
  #kind
  #genre
  #cloudStatus
  #stars
  #added
  #played
  #count
  #duplicate

  constructor (track) {
    this.#id = track.persistentID
    this.#enabled = Boolean(track.enabled)
    this.#name = track.name
    this.#artist = track.artist
    this.#mediaKind = track.mediaKind
    this.#kind = track.kind
    this.#genre = track.genre
    this.#cloudStatus = track.cloudStatus
    this.#stars = Math.floor(track.rating / 20)
    this.#count = track.playedCount + Math.floor(Math.sqrt(Math.max(0, track.skippedCount - 1)))
    this.#added = ageInDays(track.dateAdded)
    this.#played = ageInDays(track.playedDate)
    this.#duplicate = String(track.comment).includes('«duplicate»')
    this.#random = Math.random()
  }

  get id () { return this.#id }
  get enabled () { return this.#enabled }
  get duplicate () { return this.#duplicate }
  get name () { return this.#name }
  get artist () { return this.#artist }
  get mediaKind () { return this.#mediaKind }
  get kind () { return this.#kind }
  get genre () { return this.#genre }
  get cloudStatus () { return this.#cloudStatus }
  get count () { return this.#count }
  get stars () { return this.#stars }
  get added () { return this.#added }
  get played () { return this.#played }
  get random () { return this.#random }
}
