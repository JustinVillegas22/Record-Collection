const username = "JustinVillegas";
const token = "GFmoriXlCJoKjcQLGptEpXxZNEVcjhUZSKXVuyBJ";

const artistList = document.getElementById("artist-list");
const albumDisplay = document.getElementById("album-display");
const randomContainer = document.getElementById("random-albums");

let releases = [];

async function fetchCollection() {
  let page = 1;
  let hasMore = true;
  let allReleases = [];

  while (hasMore) {
    const res = await fetch(
      `https://api.discogs.com/users/${username}/collection/folders/0/releases?token=${token}&per_page=100&page=${page}`
    );
    const data = await res.json();
    allReleases = allReleases.concat(data.releases);
    hasMore = data.pagination && page < data.pagination.pages;
    page++;
  }

  releases = allReleases.map(r => ({
    ...r.basic_information,
    id: r.id
  }));

  displayArtists();
  displayRandomAlbums();
}

function cleanArtistName(name) {
  name = name.replace(/\s*\(\d+\)$/, ""); // remove (1), (2)
  if (name.toLowerCase().startsWith("the ")) {
    name = name.slice(4);
  }
  if (name.includes("Jason Isbell")) name = "Jason Isbell";
  return name;
}

function displayArtists() {
  const names = {};
  releases.forEach(release => {
    release.artists.forEach(artist => {
      const name = cleanArtistName(artist.name);
      if (!names[name]) names[name] = [];
      names[name].push(release);
    });
  });

  const sorted = Object.keys(names).sort((a, b) => a.localeCompare(b));
  const columns = [];
  const colSize = 4;

  for (let i = 0; i < sorted.length; i++) {
    const name = sorted[i];
    const columnIndex = Math.floor(i / colSize);
    if (!columns[columnIndex]) columns[columnIndex] = [];
    columns[columnIndex].push({ name, albums: names[name] });
  }

  columns.forEach(col => {
    const colDiv = document.createElement("div");
    colDiv.className = "artist-column";
    col.forEach(({ name, albums }) => {
      const a = document.createElement("a");
      a.textContent = name.length > 25 ? name.slice(0, 22) + "..." : name;
      a.href = "#";
      a.onclick = () => {
        document.getElementById("daily-highlight").style.display = "none";
        albumDisplay.innerHTML = "";
        albums.sort((a, b) => a.title.localeCompare(b.title)).forEach(album => {
          const div = createAlbumElement(album);
          albumDisplay.appendChild(div);
        });
      };
      colDiv.appendChild(a);
    });
    artistList.appendChild(colDiv);
  });
}

function displayRandomAlbums() {
  const shuffled = releases.sort(() => 0.5 - Math.random()).slice(0, 3);
  shuffled.forEach(album => {
    const div = createAlbumElement(album, true);
    randomContainer.appendChild(div);
  });
}

function createAlbumElement(album, fromDaily = false) {
  const div = document.createElement("div");
  div.className = "album";

  const img = document.createElement("img");
  img.src = album.cover_image;
  img.alt = album.title;

  const artist = document.createElement("div");
  artist.className = "album-artist";
  artist.textContent = cleanArtistName(album.artists[0].name);

  const title = document.createElement("div");
  title.className = "album-title";
  title.textContent = album.title;

  div.appendChild(img);
  div.appendChild(artist);
  div.appendChild(title);

  div.onclick = async () => {
    const existing = div.querySelector(".tracklist");
    if (existing) {
      existing.remove();
      return;
    }

    const releaseUrl = album.resource_url + "?token=" + token;
    try {
      const res = await fetch(releaseUrl);
      const data = await res.json();
      const tracklist = data.tracklist;

      const trackDiv = document.createElement("div");
      trackDiv.className = "tracklist";
      tracklist.forEach(track => {
        const t = document.createElement("div");
        t.textContent = `${track.position} - ${track.title} ${track.duration ? "(" + track.duration + ")" : ""}`;
        trackDiv.appendChild(t);
      });

      div.appendChild(trackDiv);
      div.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      console.error("Failed to load tracklist", error);
    }
  };

  return div;
}

fetchCollection();

window.addEventListener('load', () => {
  const artistList = document.getElementById('artist-list');
  const albumList = document.getElementById('album-list');

  if (artistList.scrollWidth > artistList.clientWidth) {
    artistList.scrollTo({ left: 30, behavior: 'smooth' });
    setTimeout(() => artistList.scrollTo({ left: 0, behavior: 'smooth' }), 500);
  }

  setTimeout(() => {
    if (albumList.scrollHeight > albumList.clientHeight) {
      albumList.scrollTo({ top: 30, behavior: 'smooth' });
      setTimeout(() => albumList.scrollTo({ top: 0, behavior: 'smooth' }), 500);
    }
  }, 1000);
});

function bounceAlbumScrollIfNeeded() {
  const albumList = document.getElementById('album-list');
  if (albumList.scrollHeight > albumList.clientHeight + 50) {
    albumList.scrollTo({ top: 30, behavior: 'smooth' });
    setTimeout(() => albumList.scrollTo({ top: 0, behavior: 'smooth' }), 400);
  }
}
