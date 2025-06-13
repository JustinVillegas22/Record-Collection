
function scrollBounceX(element) {
  requestAnimationFrame(() => {
    if (element.scrollWidth > element.clientWidth) {
      element.scrollTo({ left: 100, behavior: 'smooth' });
      setTimeout(() => element.scrollTo({ left: 0, behavior: 'smooth' }), 600);
    }
  });
}

function scrollBounceY(element) {
  requestAnimationFrame(() => {
    if (element.scrollHeight > element.clientHeight + 50) {
      element.scrollTo({ top: 100, behavior: 'smooth' });
      setTimeout(() => element.scrollTo({ top: 0, behavior: 'smooth' }), 600);
    }
  });
}

window.addEventListener('load', () => {
  const artistList = document.getElementById('artist-list');
  const albumList = document.getElementById('album-list');

  scrollBounceX(artistList);
  setTimeout(() => scrollBounceY(albumList), 1000);
});

function bounceAlbumScrollIfNeeded() {
  const albumList = document.getElementById('album-list');
  scrollBounceY(albumList);
}
