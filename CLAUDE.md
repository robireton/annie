# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Annie** is a JavaScript automation tool for managing an Apple Music library on macOS. It uses a hybrid architecture combining osascript (AppleScript via JavaScript), Node.js, and SQLite to sync, organize, and automatically generate playlists.

### Key Capabilities
- Export Music library metadata to SQLite (library.db)
- Generate 7 day-of-week playlists with intelligent track selection based on ratings, play history, and recency
- Detect and report duplicate tracks
- Harmonize track ratings and favorites/disliked status
- Normalize artist name metadata across the library
- Update playback dates and play counts

## Architecture

### Core Data Model
The system revolves around two main classes in `/lib`:

**Track** (Track.js) - Immutable value object representing a track with computed properties:
- Metadata: id, name, artist, duration, genre, mediaKind, kind, cloudStatus
- Ratings: stars (0-5, derived from rating/20)
- Playback: plays (playedCount), played (days since last play), activity (plays + sqrt(skips))
- Dates: age (days since added), last (ISO8601 playedDate)
- Flags: enabled, duplicate (marked in comments), christmas (marked in comments)
- random (for shuffling)

**Playlist** (Playlist.js) - Extends Map, holds a collection of Tracks with utility methods:
- `tracksWithStars(stars)` - filter by rating
- `leastRecentlyPlayedTrack()` / `leastPlayedTrack()` - selection with artist avoidance
- `isFull()` - check batch completion
- `shuffle()` - special handling for Christmas tracks

### Data Flow

```
Music.app
    ↓
[export.js] → JSON (osascript)
    ↓
[import.js] ← stdin (Node.js)
    ↓
library.db (SQLite)
    ↓
[automatic.js/plays.js/artists.js/etc] → compute updates
    ↓
JSON to stdout
    ↓
[sync.js] ← stdin (osascript) → Music.app updates
```

### How Playlist Generation Works (automatic.js)

1. **Load library**: Query all tracks from library.db into a working Playlist
2. **Filter**: Remove tracks not meeting requirements (ratings, cloud status, genres, file types, play recency)
3. **Load existing playlists**: Load Sun-Sat playlists from database
4. **Calculate batch sizes**: Allocate track counts per rating (5★, 4★, 3★, 2★) across 7 playlists
5. **Reconcile**: Remove already-assigned tracks from the working library
6. **Fill playlists**: For each rating tier, add least-recently-played tracks (preferring artists not in target playlist), then least-played tracks
7. **Top-up**: Fill remaining slots with any least-recently-played tracks
8. **Shuffle**: Special shuffling with Christmas tracks interspersed
9. **Output**: JSON objects to stdout for sync.js

Key requirements for tracks:
- At least 2 stars (rating ≥ 40)
- Cloud status not 'no longer available' or 'prerelease'
- Genres exclude Spoken Word, Classical
- Play recency: recently played (< 8 days ago) OR older with some activity, unless marked Christmas
- Star-specific thresholds for "not recently played" cutoff
- Not marked duplicate or cloud-only

## Commands

| Command | Effect |
|---------|--------|
| `npm run refresh` | Export Music library to JSON via osascript, then import into library.db (full sync) |
| `npm run automatic` | Regenerate all 7 day playlists using intelligent selection algorithm, apply to Music.app |
| `npm run plays <playlist> [start] [count]` | Output playback updates for tracks from a playlist, use with sync |
| `npm run duplicates` | Identify potential duplicate tracks (same artist/name/duration) |
| `npm run ratings` | Harmonize favorites/disliked flags with ratings |
| `npm run test` | Run test.js (currently a scratch file for experiments) |

### Linting & Code Quality

**Linter**: ESLint with neostandard config (via `eslint.config.js`)
```bash
npx eslint .
```

**No build step** - this is ES modules that runs directly in Node.js and osascript.

## Key Implementation Details

### osascript vs Node.js Split
- **osascript**: Direct Music.app control (read/write properties, delete, duplicate operations)
- **Node.js**: Data processing, database queries, algorithm logic (faster, more full-featured)
- **Communication**: JSON piped between them via stdout/stdin

### Database Schema (library.db)
- `track` - All track metadata (persistentID is primary key)
- `playlist` - Playlist metadata
- `playlisttrack` - M:M relationships with index ordering
- `artist` - Normalized artist names (key, artist, sortArtist)

### Special Tagging System
Tracks store metadata in the `comment` field using guillemet markers:
- `«duplicate»` - marks redundant versions
- `«christmas»` - marks holiday music (gets special shuffle handling)

### Environment Variables
- `NODE_ENV=debug` - verbose logging in automatic.js
- `REPLACE=true` - in automatic.js, clear all playlists before regenerating (vs. incremental update)

## Important Files

- `lib/Track.js`, `lib/Playlist.js` - Core data model and algorithms
- `export.js` - osascript to export Music library
- `import.js` - Node.js to import JSON into SQLite
- `automatic.js` - Playlist generation logic
- `sync.js` - osascript to update Music.app from JSON
- `plays.js` - Generate playback update commands
- `artists.js` - Generate artist normalization commands
- `duplicates.js` - Duplicate detection report
- `ratings.js` - Rating/favorite/disliked harmonization
- `relics/` - Legacy scripts (not actively used)

## Development Notes

- All scripts use modern ES modules (`"type": "module"` in package.json)
- SQLite uses Node 18+ built-in `DatabaseSync` (synchronous API)
- ISO8601 timestamp parsing in Track.js handles Music.app's format (2017-12-06T16:16:38.000Z)
- Playlist.shuffle() has special logic: if any Christmas tracks exist, they become group leaders and other tracks are randomly distributed around them
- The 7 playlists correspond to days of week (Sunday, Monday, etc.) but names are configurable
