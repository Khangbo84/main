let packs = [];

const grid = document.getElementById("grid");
const search = document.getElementById("search");
const filter = document.getElementById("filter");
const popup = document.getElementById("popup");
const config = {
  imgPath: "../banner/maps/",
  galleryPath: "../gallery/maps/",
  downloadPath: "../download/map/"
};
let currentCategory = "all";

function normalizeChangelog(changelog, fallbackVersion) {
  if (!changelog) {
    return { [fallbackVersion || "Current version"]: "" };
  }

  if (typeof changelog === "string") {
    return { [fallbackVersion || "Current version"]: changelog };
  }

  if (Array.isArray(changelog)) {
    const entries = {};

    changelog.forEach(item => {
      if (!item || typeof item !== "object") return;

      const version = item.version || item.label || item.name || fallbackVersion || "Current version";
      const text = item.text || item.changelog || item.content || "";

      if (text) {
        entries[version] = text;
      }
    });

    return Object.keys(entries).length ? entries : { [fallbackVersion || "Current version"]: "" };
  }

  if (typeof changelog === "object") {
    const entries = {};

    Object.entries(changelog).forEach(([version, text]) => {
      if (text !== undefined && text !== null && text !== "") {
        entries[version] = String(text);
      }
    });

    return Object.keys(entries).length ? entries : { [fallbackVersion || "Current version"]: "" };
  }

  return { [fallbackVersion || "Current version"]: String(changelog) };
}

function getYouTubeVideoId(url) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "").split("?")[0];
    }

    if (hostname.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v) return v;

      const embedMatch = parsed.pathname.match(/\/embed\/([A-Za-z0-9_-]{11})/);
      if (embedMatch) return embedMatch[1];

      const shortsMatch = parsed.pathname.match(/\/shorts\/([A-Za-z0-9_-]{11})/);
      if (shortsMatch) return shortsMatch[1];
    }
  } catch (error) {
    const fallbackMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/);
    if (fallbackMatch) return fallbackMatch[1];
  }

  return "";
}

/* ===== FETCH ===== */
fetch("../configuration/maps.json")
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
      <img src="${config.imgPath + p.image}">
      <div class="card-body">
        <span class="type ${p.type}">${p.type}</span>
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
  document.body.classList.add("no-scroll");

  document.getElementById("popup-cover").src = config.imgPath + data.image;
  document.getElementById("popup-title").textContent = data.title;
  document.getElementById("popup-desc").textContent = data.desc || "";
  document.getElementById("popup-version").textContent = data.version || "";
  document.getElementById("popup-download").href = config.downloadPath + data.download || "#";

  const videoWrapper = document.getElementById("popup-video-wrapper");
  videoWrapper.innerHTML = "";

  if (data["link-youtube"]) {
    const videoId = getYouTubeVideoId(data["link-youtube"]);

    if (videoId) {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0`;
      iframe.title = `${data.title} YouTube video`;
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.loading = "lazy";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      videoWrapper.appendChild(iframe);
      videoWrapper.classList.remove("hidden");
    } else {
      videoWrapper.classList.add("hidden");
    }
  } else {
    videoWrapper.classList.add("hidden");
  }

  // ===== CHANGELOG =====
  const changelog = document.getElementById("popup-changelog");
  const changelogVersion = document.getElementById("popup-changelog-version");
  const changelogMap = normalizeChangelog(data.changelog, data.version || "Current version");
  const versions = Object.entries(changelogMap);

  changelogVersion.innerHTML = "";

  versions.forEach(([version, text]) => {
    const option = document.createElement("option");
    option.value = version;
    option.textContent = version;

    if (version === (data.version || versions[0][0])) {
      option.selected = true;
    }

    changelogVersion.appendChild(option);
  });

  const updateChangelog = () => {
    const selectedVersion = changelogVersion.value || versions[0][0];
    changelog.textContent = changelogMap[selectedVersion] || "";
  };

  changelogVersion.onchange = updateChangelog;
  updateChangelog();

  const gallery = document.getElementById("popup-gallery");
  gallery.innerHTML = "";

  if (Array.isArray(data.gallery)) {
    data.gallery.forEach(src => {
      const img = document.createElement("img");
      img.src = config.galleryPath + src;
      img.onclick = () => openImage(src);
      gallery.appendChild(img);
    });
  }

  popup.classList.remove("hidden");
}

function closePopup(){
  popup.classList.add("hidden");
  document.body.classList.remove("no-scroll");
}

popup.querySelector(".popup-close").onclick = closePopup;

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

popup.querySelector(".popup-overlay").onclick = closePopup;

/* ===== LEGACY COMPATIBILITY ===== */
window.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("popup-changelog-version")) return;

  const select = document.getElementById("popup-changelog-version");
  select.addEventListener("change", () => {
    const changelog = document.getElementById("popup-changelog");
    if (!changelog || !select.value) return;
    changelog.textContent = select.value;
  });
});
