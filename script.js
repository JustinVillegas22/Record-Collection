// The full corrected JS content with 'dailyDiv' variable properly set

const token = "GFmoriXlCJoKjcQLGptEpXxZNEVcjhUZSKXVuyBJ";
const username = "JustinVillegas";
const folderId = 0;

let collection = [];
let artistMap = new Map();

async function fetchCollection(page = 1) {
  const url = `https://api.discogs.com/users/${username}/collection/folders/${folderId}/releases?page=${page}&per_page=100&token=${token}`;
  const res = await fetch(url);
  const data = await res.json();

  collection = collection.concat(data.releases);

  if (data.pagination && page < data.pagination.pages) {
    await fetchCollection(page + 1);
  } else {
    prepareArtistMap();
    showRandomAlbums();
    renderSearchBar();
    renderArtists();
  }
}

function normalizeArtistName(name) {
  name = name.replace(/\s*\(\d+\)$/, "").trim();
  if (name.toLowerCase() === "jason isbell and the 400 unit") {
    return "Jason Isbell";
  }
  return name;
}

function getSortKey(name) {
  return name.toLowerCase().replace(/^the\s+/i, "");
}

function prepareArtistMap() {
  collection.forEach(release => {
    let originalName = release.basic_information.artists[0].name;
    let displayName = normalizeArtistName(originalName);

    if (!artistMap.has(displayName)) {
      artistMap.set(displayName, []);
    }
    artistMap.get(displayName).push(release.basic_information);
  });
}

function showRandomAlbums() {
  const randomContainer = document.getElementById("random-albums");
  const dailySection = document.getElementById("daily-highlight");
  randomContainer.innerHTML = "";

  const allAlbums = collection.map(r => r.basic_information);
  const shuffled = allAlbums.sort(() => 0.5 - Math.random());
  const selection = shuffled.slice(0, 3);

  selection.forEach(album => {
    const dailyDiv = document.createElement("div");
    dailyDiv.className = "album";

    const img = document.createElement("img");
    img.src = album.cover_image;
    img.alt = album.title;

    const artist = document.createElement("div");
    artist.className = "album-artist";
    artist.textContent = album.artists[0].name;

    const title = document.createElement("div");
    title.className = "album-title";
    title.textContent = album.title;

    dailyDiv.appendChild(img);
    dailyDiv.appendChild(artist);
    dailyDiv.appendChild(title);

    dailyDiv.onclick = async () => {
      if (dailyDiv.querySelector(".tracklist")) return;

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

        dailyDiv.appendChild(trackDiv);
        dailyDiv.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (error) {
        console.error("Failed to load tracklist", error);
      }
    };

    randomContainer.appendChild(dailyDiv);
  });
}

function renderSearchBar() {
  const artistList = document.getElementById("artist-list");

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Search artists...";
  input.addEventListener("input", () => {
    renderArtists(input.value.toLowerCase());
  });

  input.className = "search-bar";
  artistList.before(input);
}

function renderArtists(filter = "") {
  const artistList = document.getElementById("artist-list");
  const dailySection = document.getElementById("daily-highlight");
  artistList.innerHTML = '<p class="instruction">Tap an artist to see available albums.</p>';

  const sortedArtists = Array.from(artistMap.keys()).sort((a, b) => getSortKey(a).localeCompare(getSortKey(b)));
  const filtered = sortedArtists.filter(artist => artist.toLowerCase().includes(filter));

  const columns = [];
  for (let i = 0; i < filtered.length; i += 4) {
    columns.push(filtered.slice(i, i + 4));
  }

  columns.forEach(col => {
    const colDiv = document.createElement("div");
    colDiv.className = "artist-column";

    col.forEach(artist => {
      const link = document.createElement("a");
      link.href = "#";
      link.textContent = artist.length > 25 ? artist.slice(0, 22) + "..." : artist;
      link.onclick = (e) => {
        e.preventDefault();
        dailySection.style.display = "none";
        renderAlbums(artistMap.get(artist));
      };
      colDiv.appendChild(link);
    });

    artistList.appendChild(colDiv);
  });
}

function renderAlbums(albums) {
  const display = document.getElementById("album-display");
  display.innerHTML = "";

  const sortedAlbums = albums.slice().sort((a, b) => a.title.localeCompare(b.title));

  sortedAlbums.forEach(album => {
    const div = document.createElement("div");
    div.className = "album";

    const img = document.createElement("img");
    img.src = album.cover_image;
    img.alt = album.title;

    const title = document.createElement("div");
    title.className = "album-title";
    title.textContent = album.title;

    div.appendChild(img);
    div.appendChild(title);

    div.onclick = async () => {
      if (div.querySelector(".tracklist")) return;

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

    display.appendChild(div);
  });
}

fetchCollection();
