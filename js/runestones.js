window.onerror = function(msg, url, line, col, err){ console.error('window.onerror', {msg,url,line,col, stack: err && err.stack}); }; window.addEventListener('unhandledrejection', e=>console.error(e.reason));

let builds = [];
const config={"imgPath":"../banner/runestones/","galleryPath":"../gallery/runestones/","downloadPath":"../download/runestones/"}

fetch('../configuration/builds.json')
  .then(res => res.json())
  .then(data => {
    builds = data;
    render(builds);
  })
  .catch(err => console.error('Failed to load builds.json:', err));

// Popup DOM refs (look for elements by id; if not present, code will still work but gallery won't render)
const overlay = document.getElementById('overlay');
const popup = document.getElementById('popup');
const popupTitle = document.getElementById('popupTitle');
const popupDesc = document.getElementById('popupDesc');
const popupDownload = document.getElementById("popupDownload").href = config.downloadPath + data.download || "#";
const popupImage = document.getElementById('popupImage');
const popupGallery = document.getElementById('popupGallery');
const bundleControls = document.getElementById('bundleControls');

// state for bundle viewer
let currentBundle = null; // {items: [...], index: 0}

function render(list){
  const grid = document.getElementById('grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  list.forEach((b,i)=>{
    const card = document.createElement('div');
    card.className='card';
    card.onclick=()=>openPopup(i);
    card.innerHTML = `
  <img src="${config.imgPath + b.image}" alt="${b.title}">
  <div class="card-body">
    <span class="badge ${b.type}">
      ${formatType(b.type)}
    </span>
    <h3>${b.title}</h3>
    <p class="author">by ${b.author}</p>
    <p class="desc">${b.desc || ''}</p>
  </div>
`;
    grid.appendChild(card);
  });
}
    
function formatType(type) {
  const map = {
    unlimited_free: "UNLIMITED FREE",
    limited_free: "LIMITED FREE",
    bundle: "BUNDLE",
    gold_ad: "GOLD VERSION",
    official: "OFFICIAL"
  };
  return map[type] || (type && type.toUpperCase());
}

function isItemExpired(item) {
  if (item.type !== 'limited_free' || !item.expiryDate) return false;
  const now = new Date().getTime();
  const expiry = new Date(item.expiryDate).getTime();
  return now > expiry;
}

function redirectToOops(index, item) {
  // Store item data in sessionStorage as fallback
  const itemData = {
    title: item.title,
    desc: item.desc,
    expiryDate: item.expiryDate
  };
  sessionStorage.setItem('oopsItemData', JSON.stringify(itemData));
  
  // Redirect to oops page with index parameter
  window.location.href = `../html/oops.html?index=${index}`;
}
    
function openPopup(i){
  const b = builds[i];
  
  // Check if limited item is expired
  if (isItemExpired(b)) {
    redirectToOops(i, b);
    return;
  }
  
  // If bundle type with multiple items, render bundle viewer
  if (b.type === 'bundle' && Array.isArray(b.items)) {
    currentBundle = { items: b.items, index: 0 };
    renderBundleViewer();
    overlay && overlay.classList.add('active');
    document.body.classList.add('no-scroll');
    return;
  }

  // Single build / normal project
  currentBundle = null;
  clearBundleControls(); // Clear bundle controls for non-bundle items
  
  const galleryBase = config.galleryPath || config.imgPath;
  
  if (popupImage) {
    // prefer gallery main image if available
    if (Array.isArray(b.gallery) && b.gallery.length) {
      popupImage.src = galleryBase + b.gallery[0];
    } else {
      popupImage.src = config.imgPath + (b.image || '');
    }
    popupImage.alt = b.title || '';
  }
  
  if (popupTitle) popupTitle.innerText = b.title || '';
  if (popupDesc) popupDesc.innerText = b.desc || '';
  if (popupDownload) popupDownload.href = b.download || '#';

  renderGallery(Array.isArray(b.gallery) ? b.gallery : []);

  overlay && overlay.classList.add('active');
  document.body.classList.add('no-scroll');
}

function closePopup(e){ 
  if(!e || e.target.id==='overlay'){
    overlay && overlay.classList.remove('active');
    document.body.classList.remove('no-scroll');
    // cleanup
    currentBundle = null;
    clearBundleControls();
    if (popupGallery) popupGallery.innerHTML = '';
  } 
}

function clearBundleControls() {
  if (bundleControls) {
    bundleControls.innerHTML = '';
  }
}

function renderGallery(images){
  if (!popupGallery) return;
  popupGallery.innerHTML = '';
  if (!Array.isArray(images) || !images.length) return;

  const galleryBase = config.galleryPath || config.imgPath;

  // main image is popupImage (already set by caller)
  images.forEach((img, idx) => {
    const thumb = document.createElement('img');
    thumb.className = 'thumb';
    thumb.src = galleryBase + img;
    thumb.alt = '';
    thumb.onclick = () => {
      if (popupImage) popupImage.src = galleryBase + img;
    };
    popupGallery.appendChild(thumb);
  });
}

function renderBundleViewer(){
  if (!currentBundle) return;
  const items = currentBundle.items;
  const i = currentBundle.index;
  const item = items[i];

  // Update content for current bundle item
  if (popupTitle) popupTitle.innerText = item.title || '';
  if (popupDesc) popupDesc.innerText = item.desc || '';
  if (popupDownload) popupDownload.href = item.download || '#';

  // set main image
  const galleryBase = config.galleryPath || config.imgPath;
  if (popupImage) {
    if (Array.isArray(item.gallery) && item.gallery.length) {
      popupImage.src = galleryBase + item.gallery[0];
    } else {
      popupImage.src = config.imgPath + (item.image || '');
    }
    popupImage.alt = item.title || '';
  }

  // render this item's gallery
  renderGallery(Array.isArray(item.gallery) ? item.gallery : []);

  // render bundle navigation (prev/next and index) - ONLY for bundles
  if (bundleControls) {
    bundleControls.innerHTML = '';
    const prev = document.createElement('button');
    prev.innerText = '<';
    prev.disabled = i === 0;
    prev.onclick = () => { currentBundle.index = Math.max(0, currentBundle.index - 1); renderBundleViewer(); };

    const next = document.createElement('button');
    next.innerText = '>';
    next.disabled = i === items.length - 1;
    next.onclick = () => { currentBundle.index = Math.min(items.length - 1, currentBundle.index + 1); renderBundleViewer(); };

    const label = document.createElement('span');
    label.className = 'bundle-index';
    label.innerText = `${i+1} / ${items.length}`;

    bundleControls.appendChild(prev);
    bundleControls.appendChild(label);
    bundleControls.appendChild(next);
  }
}

const searchInput = document.getElementById("search");
const typeFilter  = document.getElementById("typeFilter");
const badgeFilter = document.getElementById("badgeFilter");

function applyFilter() {
  const q = searchInput ? searchInput.value.toLowerCase() : '';
  const typeValue  = typeFilter ? typeFilter.value : "all";
  const badgeValue = badgeFilter ? badgeFilter.value : "all";

  const filtered = builds.filter(b => {
    const textMatch =
      (b.title && b.title.toLowerCase().includes(q)) ||
      (b.desc && b.desc.toLowerCase().includes(q)) ||
      (b.author && b.author.toLowerCase().includes(q)) ||
      (b.theme && b.theme.toLowerCase().includes(q));

    const typeMatch =
      typeValue === "all" || b.type === typeValue;

    const badgeMatch =
      badgeValue === "all" || b.badge === badgeValue;

    return textMatch && typeMatch && badgeMatch;
  });

  render(filtered);
}

/* Events */
if (searchInput) searchInput.addEventListener("input", applyFilter);

if (typeFilter) {
  typeFilter.addEventListener("change", applyFilter);
}

if (badgeFilter) {
  badgeFilter.addEventListener("change", applyFilter);
}

// close popup when clicking overlay
if (overlay) overlay.addEventListener('click', closePopup);
