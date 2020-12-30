Work in progress DDR in-browser stepchart editor.

Stack:
- ThreeJS
- React
- Typescript

Install once using `npm install`, then run locally with `npm start`.

The sample songs are in public/static/songs and scripts/findAllSongs.js can be used to generate the songs_generated.ts file used for testing. Run `node scripts/findAllsongs.js` after adding new entries.

Use `j`, `k` keys to go forward/back in elapsed time.
Use `<Space>` to pause/play the song.

You can also toggle showing the waveform / select from a few sample songs.
Showing waveform might impact frame rate significantly.

## Next
1. No way to 'edit' anything yet, :)
2. The holds are just green rectangles rn, look bad
3. The arrows are all triangles, also look bad
4. Controls for zoom don't exist yet, you can, however, toggle some constants in code

## Sample Songs

The sample songs are found from the internet. I did not create them. Please let me know if you'd like me to remove them from this repo.

## About Create React App

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).
