const proxy = 'https://api.codetabs.com/v1/proxy?quest=';
const base = 'https://www.megacartoons.net/video-serie/spongebob-squarepants/page/';
const total = 16;

const pagination = document.getElementById('pagination');
const grid = document.getElementById('episodes-grid');
const loader = document.getElementById('loader');

async function fetchPage(url) {
  const full = proxy + url;
  try {
    const res = await fetch(full);
    if (!res.ok) throw new Error(res.status);
    const html = await res.text();
    return new DOMParser().parseFromString(html, 'text/html');
  } catch (e) {
    console.error('error fetching:', url, e);
    return null;
  }
}

async function loadPage(num) {
  loader.style.display = 'block';
  grid.innerHTML = '';
  document.querySelectorAll('#pagination button').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.page) === num);
  });

  const url = `${base}${num}/`;
  const doc = await fetchPage(url);

  if (!doc) {
    loader.style.display = 'none';
    grid.innerHTML = '<p>error loading episode list. please try another page.</p>';
    return;
  }

  const items = Array.from(doc.querySelectorAll('div.item-thumbnail a'));
  if (items.length === 0) {
    loader.style.display = 'none';
    grid.innerHTML = '<p>no episodes found on this page.</p>';
    return;
  }

  loader.style.display = 'none';
  let episodesFound = 0;

  for (const el of items) {
    const link = el.href;
    const title = el.title.replace('Watch ', '').trim();
    const imgUrl = el.querySelector('img')?.src;

    const epDoc = await fetchPage(link);
    
    if (!epDoc) continue; 

    let video = null;
    const input = epDoc.querySelector('input[name="main_video_url"]');
    if (input && input.value) {
      video = input.value;
    } else {
      const scripts = Array.from(epDoc.querySelectorAll('script'));
      const script = scripts.find(s => s.textContent.includes('var video_url_0'));
      if (script) {
        const match = script.textContent.match(/var video_url_0 = "(.*?)";/);
        if (match && match[1]) video = match[1];
      }
    }

    if (video) {
      episodesFound++;
      const ep = { title, thumbnail: imgUrl, download: video };
      
      const card = document.createElement('a');
      card.className = 'episode-card';
      card.href = ep.download;
      const safe = ep.title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-');
      card.download = `${safe}.mp4`;
      const img = document.createElement('img');
      img.src = ep.thumbnail || 'https://placehold.co/320x180/1e3a8a/FFFFFF?text=no+image';
      img.alt = ep.title;
      img.onerror = () => { img.src = 'https://placehold.co/320x180/1e3a8a/FFFFFF?text=image+error'; };
      const t = document.createElement('p');
      t.textContent = ep.title;
      card.appendChild(img);
      card.appendChild(t);
      grid.appendChild(card);
    }
  }

  if (episodesFound === 0) {
    grid.innerHTML = '<p>could not find valid download links for any episodes on this page.</p>';
  }
}

function init() {
  for (let i = 1; i <= total; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.dataset.page = i;
    btn.addEventListener('click', () => loadPage(i));
    pagination.appendChild(btn);
  }
  loadPage(1);
}

document.addEventListener('DOMContentLoaded', init);