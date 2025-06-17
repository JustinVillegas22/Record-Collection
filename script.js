
const username = "JustinVillegas";
const token = "GFmoriXlCJoKjcQLGptEpXxZNEVcjhUZSKXVuyBJ";

const artistList = document.getElementById("artist-list");
const albumList = document.getElementById("album-list");
const randomContainer = document.getElementById("random-albums");

let releases = [];
let artistMap = {};

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

  buildArtistMap();
  displayArtists();
  displayRandomAlbums();
}

function cleanArtistName(name) {
  name = name.replace(/\s*\(\d+\)$/, "");
  if (name.toLowerCase().startsWith("the ")) name = name.slice(4);
  return name.trim();
}


function buildArtistMap() {
  const COMBINE = {
    "jason isbell and the 400 unit": "Jason Isbell"
  };
  const IGNORE = ["night tripper", "orchestra"];

  artistMap = {};
  releases.forEach(release => {
    release.artists.forEach(artist => {
      let name = cleanArtistName(artist.name);
      const merged = COMBINE[name.toLowerCase()];
      if (merged) name = merged;
      if (IGNORE.includes(name.toLowerCase())) return;
      if (!artistMap[name]) artistMap[name] = [];
      artistMap[name].push(release);
      artistMap[name].sort((a, b) => a.title.localeCompare(b.title));
    });
  });
}

function displayArtists(filter = "") {
  artistList.innerHTML = "";
  const filtered = Object.keys(artistMap)
    .filter(name => name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  const colSize = 4;
  const columns = [];

  for (let i = 0; i < filtered.length; i++) {
    const name = filtered[i];
    const columnIndex = Math.floor(i / colSize);
    if (!columns[columnIndex]) columns[columnIndex] = [];
    columns[columnIndex].push({ name, albums: artistMap[name] });
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
        showAlbums(name, albums);
      };
      colDiv.appendChild(a);
    });
    artistList.appendChild(colDiv);
  });
}

function showAlbums(artistName, albums) {
  albumList.innerHTML = "";
  const banner = document.createElement("h2");
  banner.textContent = artistName;
  albumList.appendChild(banner);

  albums.forEach(album => {
    const albumDiv = document.createElement("div");
    albumDiv.className = "album";
    const img = document.createElement("img");
    img.src = album.cover_image;
    const title = document.createElement("p");
    title.textContent = album.title;
    albumDiv.appendChild(img);
    albumDiv.appendChild(title);

    const tracklist = document.createElement("ul");
    tracklist.style.display = "none";
    albumDiv.appendChild(tracklist);

    albumDiv.addEventListener("click", async () => {
      if (tracklist.style.display === "none") {
        const idToUse = album.master_id || album.id;
        const res = await fetch(`https://api.discogs.com/masters/${idToUse}`);
        const data = await res.json();

        if (Array.isArray(data.tracklist) && data.tracklist.length > 0) {
          tracklist.innerHTML = "";
          data.tracklist.forEach(track => {
            const li = document.createElement("li");
            li.textContent = track.title;
            tracklist.appendChild(li);
          });
          tracklist.style.display = "block";
        }
      } else {
        tracklist.style.display = "none";
      }
    });

    albumList.appendChild(albumDiv);
  });
}

function displayRandomAlbums() {
  const shuffled = [...releases].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3);
  randomContainer.innerHTML = "";
  selected.forEach(album => {
    const albumDiv = document.createElement("div");
    albumDiv.className = "album";
    const img = document.createElement("img");
    img.src = album.cover_image;
    const name = document.createElement("p");
    const artist = album.artists?.[0]?.name || "Unknown";
    name.textContent = `${cleanArtistName(artist)} – ${album.title}`;
    albumDiv.appendChild(img);
    albumDiv.appendChild(name);
    albumDiv.addEventListener("click", () => {
      showAlbums(cleanArtistName(artist), artistMap[cleanArtistName(artist)]);
    });
    randomContainer.appendChild(albumDiv);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("search-bar").addEventListener("input", function (e) {
    displayArtists(e.target.value);
  });
  fetchCollection();
});
