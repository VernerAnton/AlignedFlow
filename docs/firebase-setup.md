# Firebase setup for AlignedFlow sync

AlignedFlow runs fully local until this is done — nothing is broken without it, and local
mode is a complete mode rather than a degraded one. The sync panel at the foot of either
builder will simply say sync is unavailable. This takes about five minutes of console
clicking.

The sync layer itself is already built and verified end to end against the Firestore
emulator: two devices converging, the join guard, offline replay, the running-device rule,
deletes propagating, and reconnect on reload. What follows is only about giving it a project
to talk to.

**Use a new project for AlignedFlow.** Don't point it at the project belonging to another
app — they'd share a database for no benefit, and a mistake in one could reach the other.

## 1. Create the project

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. Name it `alignedflow`. Google Analytics: off — not needed.
3. **Build → Firestore Database → Create database.**
   Choose **production mode** and a region near you (e.g. `europe-north1`).
   Production mode is correct here: the rule below is what grants access, and test mode
   would silently expire after 30 days and break sync with no warning.

## 2. Register the web app

1. Project overview → the `</>` (web) icon → register an app, name it `alignedflow`.
   No Firebase Hosting needed — Vercel serves the app.
2. It shows a `firebaseConfig` object. Copy the six values into `.env.local` at the repo
   root (template in `.env.example`):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

`.env.local` is gitignored and must stay that way.

## 3. Firestore rules

Pick your sync key now — the phrase you're about to type into the app — and put it directly
in the rule. Build → Firestore Database → **Rules** tab, replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{syncKey}/{document=**} {
      allow read, write: if syncKey == "YOUR-CHOSEN-KEY-HERE";
    }
  }
}
```

Swap in your real key (keep the quotes) and publish. The `{document=**}` wildcard covers
every path the app uses — `users/{syncKey}/work-presets/…`, `evening-presets/…`,
`state/selection` and `state/session` (see `src/sync/firestore.js`) — and `allow read`
already covers both `get` and `list`, which is what the live preset subscriptions need.

**The key is verified server-side, not just obscure.** Only requests carrying the exact key
you put in the rule are allowed through; a wrong or guessed key is denied by Firestore
itself, and the app reports it as *"Key rejected"*. Rules text isn't visible to end users,
only to people with access to the Firebase project, so this is a real password check.

**Make the key long and random rather than memorable.** The app is served as a public
bundle, so the project id in it is public too — which is normal and safe for Firebase, but
it does mean the key is the only thing standing between a stranger and your routines. It is
never itself in the bundle: it is typed into the app and kept in that device's
`localStorage`.

The one cost: changing your key later means editing and republishing this rule, not just
retyping it in the app's sync field. Fine for a personal key you're not rotating often.

## 4. Vercel

Project settings → **Environment Variables** → add the same six `VITE_FIREBASE_*` values.

**Then redeploy.** Vite bakes `VITE_*` values into the bundle at build time, so saving them
in Vercel changes nothing until a new build runs. A deploy that predates the variables will
keep running local-only, and the app will look like sync is broken when it simply was never
compiled in — the sync panel says exactly this when it happens.

## 5. Connect

Open AlignedFlow → **EDIT** (either builder) → scroll to the foot of the page → enter your
key → **Connect**.

The first device to connect seeds the key with everything it has. On the next device the app
notices the key already holds routines and asks how to join:

- **Use cloud routines** — the normal answer. This device takes the routines already in the
  cloud. What it had before is stashed in `localStorage` under
  `alignedflow-presync-backup` first, so nothing is unrecoverable.
- **Add mine too** — keeps this device's routines and adds them alongside the cloud's.

It asks rather than merging silently because every device generated its own preset ids when
it migrated from the pre-preset config: the same routines on two devices are, to the sync
layer, different documents. Merging without asking would leave every device holding
duplicates of everything.

To check it worked: the panel reads `Sync · synced`, and a preset renamed on one device is
renamed on the other without a reload.

## What syncs, and what doesn't

| Syncs | Stays on the device |
|---|---|
| All presets, work and evening | The running countdown (`timeLeft`, playing or paused) |
| Which preset is active in each mode | The task budget's elapsed time |
| The work cycle position (phase + block count) | |

The cycle position is shared on purpose: four focus blocks spread across a laptop and a
desktop still add up to one long break, instead of each machine counting its own and the
long break never arriving.

Two rules keep that from being annoying:

- **A running device is never moved.** If a timer is running here, this device is the one
  actually doing the blocks, so an idle machine in another room can't reposition it. The
  incoming position is held and applied the moment the timer stops.
- **The countdown never syncs.** Arriving at another device puts you at the *start* of the
  phase the last one left off in, paused, waiting for you to press play. Two devices running
  live countdowns against one shared clock would be a mess.

The same held-until-idle rule applies to preset edits: changing a routine on your phone
while that routine is mid-block on your desktop won't reset the timer under you.

## Trying it without a project

The sync layer can be exercised against the Firestore emulator — useful for testing changes
without risking real data. `firebase.json` and `firestore.rules` in this repo are already
set up for it (the emulator rules are open: it holds no real data, so there is nothing to
key-gate):

```bash
npx firebase-tools emulators:start --only firestore --project alignedflow-emu
```

then in `.env.local`:

```
VITE_FIRESTORE_EMULATOR=127.0.0.1:8080
```

plus any six placeholder `VITE_FIREBASE_*` values (the emulator checks none of them). The
variable is read in `src/sync/firestore.js` and is absent from real builds, so production is
unaffected.

## Notes on the build

The Firebase SDK is about 160 KB gzipped — roughly double the rest of the app. It is loaded
through a dynamic import that only runs once a sync key is set, and `vite.config.js`
deliberately keeps its chunk out of the service worker's precache, so a device that never
turns sync on never downloads it. Once a device has connected once the chunk is cached, which
is what lets Firestore's offline replay work with no network.
