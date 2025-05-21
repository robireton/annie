# Annie
JavaScript for working with an Apple Music library

* uses osascript to interact with Music.app on MacOS
* does most of its processing in Node.js, which is more full-featured
* keeps a SQLite version of the Music library
* communication between osascript and node via JSON piped between stdout/stdin

## Scripts

| npm run … | effect |
| --- | --- |
| automatic | uses library.db to generate 𝑘 playlists of 𝑛 tracks |
| duplicates | identifies potentially-redundant tracks |
| ratings | tries to harmonize track ratings/favorites |
| refresh | update library.db with current state of Music library |
| test | runs whatever is currently in test.js — usually some experiment |

---

*share and enjoy*
