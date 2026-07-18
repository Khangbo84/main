let packs=[];
const grid=document.getElementById("grid");
const search=document.getElementById("search");
const filter=document.getElementById("filter");
const config ={"imgPath":"../banner/bg/"}
/* ===== Fetch ===== */
fetch("../configuration/wallpapers.json")
.then(r=>r.json())
.then(d=>{
  packs=d;
  render(packs);
  observeCards();
});

/* ===== Render ===== */
function render(list){
  grid.innerHTML="";
  list.forEach(p=>{
    // Tạo thẻ <a> thay vì <div> để biến cả card thành một đường link bấm được
    const c=document.createElement("a");
    c.href = p.download;          // Gán link download từ JSON vào đây
    c.target = "_blank";         // Mở link trong tab mới để không bị mất trang hiện tại
    c.rel = "noopener noreferrer"; // Bảo mật khi mở tab mới
    c.className="card";
    
    c.innerHTML=`
      <img src="${config.imgPath+p.image}" alt="${p.title}">
      <div class="card-body">
        <span class="type ${p.type}">${p.type}</span>
        <h3>${p.title}</h3>
      </div>
    `;
    grid.appendChild(c);
  });
}

/* ===== Filter ===== */
function applyFilter(){
  const q=search.value.toLowerCase();
  const t=filter.value;
  render(
    packs.filter(p=>{
      const text =
        p.title.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q);
      const typeOk = t==="all" || p.type===t;
      return text && typeOk;
    })
  );
  observeCards();
}
search.addEventListener("input",applyFilter);
filter.addEventListener("change",applyFilter);

/* ===== Viewport shine control ===== */
function observeCards(){
  const cards=document.querySelectorAll(".card");
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add("shine");
      }else{
        e.target.classList.remove("shine");
      }
    });
  },{threshold:0.3});

  cards.forEach(c=>io.observe(c));
}
