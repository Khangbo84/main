let packs = [];

const grid = document.getElementById("grid");
const search = document.getElementById("search");
const filter = document.getElementById("filter");
const popup = document.getElementById("popup");
const config ={ "imgPath":"../banner/maps/", "galleryPath":"../gallery/maps/"}
let currentCategory = "all";

/* ===== FETCH ===== */
fetch("configuration/maps.json")
.then(r => r.json())
.then(d => {
  packs = d;
  render(packs);
});

/* ===== RENDER ===== */
function render(list){
  grid.innerHTML = "";

  list.forEach(p => {
    const c = document.createElement("div");
    c.className = "card";

    c.innerHTML = `
      <img src="${config.imgPath + p.image"}>
      <div class="card-body">
        <span class="type">${p.type}</span>
        <h3>${p.title}</h3>
      </div>
    `;

    c.onclick = () => openPopup(p);

    grid.appendChild(c);
  });
}

/* ===== FILTER ===== */
function applyFilter(){
  const q = search.value.toLowerCase();
  const typeValue = filter.value;

  const filtered = packs.filter(p => {
    return (
      (p.title.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q)) &&
      (typeValue === "all" || p.type === typeValue) &&
      (currentCategory === "all" || p.category === currentCategory)
    );
  });

  render(filtered);
}

search.addEventListener("input", applyFilter);
filter.addEventListener("change", applyFilter);

document.querySelectorAll(".category-filter button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".category-filter button")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");
    currentCategory = btn.dataset.cat;
    applyFilter();
  };
});

/* ===== POPUP ===== */
function openPopup(data) {
  document.body.classList.add("no-scroll"); //  khóa nền

  document.getElementById("popup-cover").src = config.imgPath + data.image;
  document.getElementById("popup-title").textContent = data.title;
  document.getElementById("popup-desc").textContent = data.desc || "";
  document.getElementById("popup-version").textContent = data.version || "";
  document.getElementById("popup-download").href = data.download || "#";

  const gallery = document.getElementById("popup-gallery");
  gallery.innerHTML = "";

  if (Array.isArray(data.gallery)) {
    data.gallery.forEach(src => {
      const img = document.createElement("img");
      img.src = config.gallery + src;
      img.onclick = () => openImage(src);
      gallery.appendChild(img);
    });
  }

  popup.classList.remove("hidden");
}

function closePopup(){
  popup.classList.add("hidden");
  document.body.classList.remove("no-scroll"); //  mở lại scroll
}

popup.querySelector(".popup-close").onclick = closePopup;
popup.querySelector(".popup-overlay").onclick = closePopup;

/* ===== IMAGE ZOOM ===== */
const viewer = document.getElementById("imgViewer");
const viewerImg = document.getElementById("imgViewerSrc");

function openImage(src){
  viewerImg.src = src;
  viewer.classList.remove("hidden");
}

viewer.querySelector(".img-overlay").onclick = () => {
  viewer.classList.add("hidden");
};
