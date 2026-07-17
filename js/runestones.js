    window.onerror = function(msg, url, line, col, err){ console.error('window.onerror', {msg,url,line,col, stack: err && err.stack}); }; window.addEventListener('unhandledrejection', e=>console.error('unhandledrejection', e.reason && e.reason.stack ? e.reason.stack : e.reason));
let builds = [];

fetch('builds.json')
  .then(res => res.json())
  .then(data => {
    builds = data;
    render(builds);
  });

function render(list){
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  list.forEach((b,i)=>{
    const card = document.createElement('div');
    card.className='card';
    card.onclick=()=>openPopup(i);
    card.innerHTML = `
  <img src="${b.image}" alt="${b.title}">
  <div class="card-body">
    <span class="badge ${b.type}">
      ${formatType(b.type)}
    </span>
    <h3>
  ${b.title}
<p class="author">by ${b.author}</p>
<p class="desc">${b.desc}</p>
</h3>
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
  return map[type] || type.toUpperCase();
    }
    
function openPopup(i){
  const b = builds[i];
  popupImage.src=b.image; popupImage.alt=b.title;
  popupTitle.innerText=b.title;
  popupDesc.innerText=b.desc;
  popupDownload.href=b.download;
  overlay.classList.add('active');
}
function closePopup(e){ if(!e||e.target.id==='overlay')overlay.classList.remove('active'); }

const searchInput = document.getElementById("search");
const typeFilter  = document.getElementById("typeFilter");
const badgeFilter = document.getElementById("badgeFilter");

function applyFilter() {
  const q = searchInput.value.toLowerCase();
  const typeValue  = typeFilter ? typeFilter.value : "all";
  const badgeValue = badgeFilter ? badgeFilter.value : "all";

  const filtered = builds.filter(b => {
    const textMatch =
      b.title.toLowerCase().includes(q) ||
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
searchInput.addEventListener("input", applyFilter);

if (typeFilter) {
  typeFilter.addEventListener("change", applyFilter);
}

if (badgeFilter) {
  badgeFilter.addEventListener("change", applyFilter);
}