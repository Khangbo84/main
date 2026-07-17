/* ===============================
   ELEMENTS
================================ */
const menuBtn = document.getElementById('menuBtn');
const panel = document.getElementById('sidePanel');
const overlay = document.getElementById('overlay');
const langToggle = document.getElementById('langToggle');
const langDropdown = document.getElementById('langDropdown');

/* ===============================
   PANEL TOGGLE
================================ */
menuBtn.addEventListener('click', ()=>{
  panel.classList.add('show');
  overlay.classList.add('show');
});

overlay.addEventListener('click', ()=>{
  panel.classList.remove('show');
  overlay.classList.remove('show');
  langDropdown.classList.remove('show');
});

/* ===============================
   LANGUAGE DROPDOWN
================================ */
langToggle.addEventListener('click', (e)=>{
  e.stopPropagation();
  langDropdown.classList.toggle('show');
});
langDropdown.addEventListener('click', e=>e.stopPropagation());

/* ===============================
   TRANSLATIONS
================================ */
const translations = {
  vi: {
    play: "Chơi",
    map: "Bản đồ",
    games: "Trò chơi",
    wiki: "Wiki",
    content: "Nội dung",
    language: "Ngôn ngữ",
    vi_lang:"Tiếng Việt",
    en_lang:"Tiếng Anh",

    lobby_title: "Sảnh",
    lobby_desc: "Khu trung tâm nơi người chơi bắt đầu hành trình của mình. Bạn đã sẵn sàng khám phá bữa tiệc này chưa?",

    games_title: "Trò chơi",
    games_desc: "Với 3 mini games đa dạng, độc đáo là: Mê cung tử thần, Bùng phát ngược và Tháp phản bội. Đem lại trải nghiệm mới lạ và hấp dẫn!",

    stall_title: "Gian hàng",
    stall_desc: "Khu gian hàng với nền ẩm thực độc đáo, những trang bị xịn xò. Mua vật phẩm bằng phiếu sự kiện.",

    stage_title: "Sân khấu",
    stage_desc: "Sân khấu chính cho sự kiện với buổi khai mạc hoành tráng.",

    dungeon_title: "Hầm ngục",
    dungeon_desc: "Thử thách cuối cùng cho người chơi dũng cảm. Đánh trùm và mang về chiến lợi phẩm.",

    suggest_title: "Tiếp theo là?",
    rule: "Luật",
    terms: "Điều khoản & Pháp lý"
  },

  en: {
    play: "Play",
    map: "Map",
    games: "Games",
    wiki: "Wiki",
    content: "Content",
    language: "Language",
    vi_lang:"Vietnamese",
    en_lang:"English",

    lobby_title: "Lobby",
    lobby_desc: "The central hub where players begin their journey. Are you ready to explore this party?",

    games_title: "Games",
    games_desc: "Three unique mini-games: Death Maze, Reverse Outbreak, and Traitor Tower — offering fresh and exciting experiences!",

    stall_title: "Stalls",
    stall_desc: "Food stalls and premium gear. Exchange event tickets for powerful items and collectibles.",

    stage_title: "Stage",
    stage_desc: "The main stage of the event, featuring a spectacular opening and battle arena.",

    dungeon_title: "Dungeon",
    dungeon_desc: "The ultimate challenge for brave players. Explore, fight bosses, and claim epic rewards.",

    suggest_title: "What’s next?",
    rule: "Rules",
    terms: "Terms & Legal"
  }
};

/* ===============================
   APPLY LANGUAGE
================================ */
function setLanguage(lang){
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.dataset.i18n;
    if(translations[lang]?.[key]){
      el.textContent = translations[lang][key];
    }
  });

  /* Panel buttons */
  document.querySelectorAll('.panel-btn').forEach(btn=>{
    const key = btn.dataset.i18n;
    if(key && translations[lang][key]){
      btn.textContent = translations[lang][key];
    }
  });
}

/* ===============================
   LANGUAGE BUTTONS
================================ */
document.querySelectorAll('[data-lang]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    setLanguage(btn.dataset.lang);
    langDropdown.classList.remove('show');
    panel.classList.remove('show');
    overlay.classList.remove('show');
  });
});

/* ===============================
   DEFAULT
================================ */
setLanguage('vi');