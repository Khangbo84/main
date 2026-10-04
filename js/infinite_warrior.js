// Chiến Binh Vô Hạn - game.js
// CONFIG nằm ngay đầu file này: chỉnh số liệu ở đó.
// =====================================================================
//  CONFIG — CHỈNH MỌI THỨ Ở ĐÂY (sát thương, máu quái, cooldown, giá...)
//  Sửa số rồi lưu lại là có hiệu lực ở ván mới.
// =====================================================================
const CONFIG = {
    // ----- NGƯỜI CHƠI -----
    player: {
        radius: 18, speed: 3.6,
        maxHp: 100, regen: 0.2,          // hồi máu / giây
        magnetRadius: 110, xpMultiplier: 1.0,
        firstLevelXp: 100, xpGrowth: 1.28, // XP cần cho cấp đầu / hệ số tăng mỗi cấp
        mana: 100, manaRegen: 1            // mana tối đa / hồi mỗi giây
    },

    // ----- VŨ KHÍ (đánh thường) -----
    weapons: {
        sword:  { dmg: 90,  cd: 0.32 },
        hammer: { dmg: 100, cd: 0.50 },
        dual:   { dmg: 80,  cd: 0.28 },
        bow:    { dmg: 140, cd: 0.60, arrowSpeed: 16, arrowLife: 100, arrowRadius: 7 },
        spear:  { dmg: 95,  cd: 0.34 },
        axe:    { dmg: 110, cd: 0.45 },
        staff:  { dmg: 105, cd: 0.42, orbSpeed: 11, orbLife: 50, orbRadius: 9 }
    },
    comboPct: [0.2, 0.5, 0.9],   // % sát thương đòn 1 / 2 / 3 của vũ khí cận chiến
    comboResetSec: 1.4,          // ngừng đánh bao lâu thì combo về đòn 1
    autoAim: { melee: 340, ranged: 1100 }, // tầm tự nhắm của cận chiến / cung

    // ----- KỸ NĂNG CHỦ ĐỘNG -----
    activeSkills: {
        cdReducePerLevel: 0.2, minCd: 0.6,   // mỗi cấp giảm cooldown / cooldown tối thiểu
        dagger:    { cd: 1.5,  mana: 12, dmg: 40,  dmgGrowth: 0.3, countBase: 3, countPerLevel: 2, speed: 10, life: 100 },
        lightning: { cd: 3.0,  mana: 20, dmg: 90,  countBase: 2, countPerLevel: 1 },            // dmg x cấp
        laser:     { cd: 4.5,  mana: 30, dmg: 160, range: 650, halfAngle: 0.38 },               // dmg x cấp
        nova:      { cd: 5.0,  mana: 25, dmg: 70,  radiusBase: 140, radiusPerLevel: 14, freezeSec: 1.25 }, // dmg x cấp
        meteor:    { cd: 6.0,  mana: 28, dmg: 150, radius: 90, delayFrames: 48, countBase: 1, levelsPerExtra: 2 }, // dmg x cấp
        shield:    { cd: 12.0, mana: 22, absorbBase: 40, absorbPerLevel: 25, duration: 6 }
    },

    // ----- NỘI TẠI (mỗi cấp) -----
    passives: {
        damagePerLevel: 0.25, moveSpeedMult: 1.12,
        maxHpPerLevel: 40, maxHpHealPct: 0.5,
        magnetPerLevel: 50, xpPerLevel: 0.25, regenPerLevel: 0.3,
        lifestealPerLevel: 0.01, freezeChancePerLevel: 0.08,
        critBase: 0.05, critPerLevel: 0.08, critMult: 2.0, trueDmgPerLevel: 0.12,
        orbit: { dmg: 5, radius: 80, countBase: 2, speed: 0.04 },                 // số lưỡi = countBase + cấp
        aura:  { dmg: 1.2, radiusBase: 85, radiusPerLevel: 12 }                   // sát thương mỗi khung hình
    },
    freeze: { sec: 1, bossSec: 0.5, immuneSec: 4 },

    // ----- KỸ NĂNG CYAN (thần thoại) -----
    fusion: {
        blade:   { cd: 4, dmg: 55, count: 8, speed: 10 },
        thunder: { cd: 3, dmg: 100, count: 5 },
        storm:   { active: 6, cd: 7, dmg: 8, radius: 120, count: 8, speed: 0.08 },
        vamp:    { active: 6, cd: 7, dmg: 1.8, radius: 130, heal: 0.5 }
    },

    // ----- ĐIỂM KỸ NĂNG (chế độ Tháp) -----
    stats: {
        pointsPerLevel: 3,
        hp: 25, def: 1, atk: 0.08, skill: 0.1, mana: 15, manaRegen: 0.2,
        defFactor: 8       // giáp: sát thương nhận = 100 / (100 + giáp * defFactor)
    },

    // ----- QUÁI THƯỜNG -----
    // hp = hp * (1 + (cấp-1) * hpGrowth) ; giáp = def + cấp * defPerLevel
    enemies: {
        aimLength: 720, aimWarnFrames: 36,  // đường dự đoán của cung thủ/pháp sư
        slime:   { radius: 14, speed: 1.6,  hp: 30,  hpGrowth: 0.25, def: 2,  defPerLevel: 0.4,  xp: 15, damage: 10, gold: 4,  color: '#34d399' },
        bat:     { radius: 11, speed: 2.7,  hp: 22,  hpGrowth: 0.22, def: 1,  defPerLevel: 0.2,  xp: 22, damage: 8,  gold: 5,  color: '#c084fc' },
        orc:     { radius: 22, speed: 1.15, hp: 90,  hpGrowth: 0.4,  def: 6,  defPerLevel: 0.8,  xp: 45, damage: 22, gold: 12, color: '#f87171' },
        soldier: { radius: 14, speed: 1.8,  hp: 38,  hpGrowth: 0.25, def: 1,  defPerLevel: 0.2,  xp: 18, damage: 14, gold: 6,  color: '#f59e0b' },
        tank:    { radius: 24, speed: 0.95, hp: 130, hpGrowth: 0.25, def: 10, defPerLevel: 0.9,  xp: 40, damage: 7,  gold: 10, color: '#64748b' },
        archer:  { radius: 12, speed: 1.5,  hp: 28,  hpGrowth: 0.25, def: 0,  defPerLevel: 0.15, xp: 25, damage: 6,  gold: 7,  color: '#84cc16',
                   range: 230, shootCd: 110, projDmg: 12, projGrowth: 0.06, projSpeed: 9,   projColor: '#bef264' },
        mage:    { radius: 13, speed: 1.3,  hp: 26,  hpGrowth: 0.25, def: 0,  defPerLevel: 0,    xp: 35, damage: 6,  gold: 9,  color: '#e879f9',
                   range: 190, shootCd: 170, projDmg: 30, projGrowth: 0.06, projSpeed: 6.5, projColor: '#d946ef' },
        // Boss chế độ Sinh Tồn: hp = hp * hpTierMult^(bậc-1), bậc = cấp/10
        boss:    { radius: 52, speed: 1.35, hp: 1800, hpTierMult: 1.8, def: 15, defPerLevel: 1.5, xp: 1000, damage: 35, gold: 80, color: '#dc2626' }
    },
    affix: { fastSpeed: 1.4, armorBonus: 8, frenzyDmg: 1.5, regenPct: 0.02, explodeDmg: 18, explodeRadius: 85 },

    // ----- CHẾ ĐỘ SINH TỒN -----
    survival: { spawnChance: 0.04, batFromLevel: 3, batChance: 0.4, orcFromLevel: 5, orcChance: 0.25, bossEveryLevels: 10 },

    // ----- CHẾ ĐỘ THÁP (100 tầng) -----
    tower: {
        arenaRadius: 340, maxFloor: 100, introSec: 3, bossEvery: 5,
        firstFloorMonsters: 5, monstersPerFloor: 2.2, maxMonsters: 70, bossFloorMonsterRatio: 0.6,
        difficultyPerFloor: 0.7,       // "cấp quái" tăng bao nhiêu mỗi tầng
        monsterDmgGrowth: 0.02,        // sát thương quái tăng thêm mỗi tầng (x(1 + (tầng-1) * giá trị))
        healOnClear: 0.3,              // hồi % máu khi qua tầng
        unlockFloor: { soldier: 2, bat: 3, archer: 4, tank: 6, mage: 8, orc: 12 }, // tầng bắt đầu xuất hiện
        boss: { hpPerStep: 10000, defBase: 8, defPerFloor: 0.9, xp: 300, gold: 80 }, // máu = hpPerStep * (tầng / bossEvery)
        shopEvery: 10, shopSeconds: 60,             // cửa hàng sau boss mỗi 10 tầng
        affixChance: 0.6, affixFromFloor: 2, doubleAffixFloor: 50, // hiệu ứng đặc biệt RANDOM mỗi tầng (từ tầng 50 có 2 hiệu ứng)
        bosses: {
            5:   { name: 'SLIME CHÚA',            color: '#22c55e', skills: ['summon'],                                   desc: 'Triệu hồi đàn quái' },
            10:  { name: 'PHÁP SƯ BÓNG TỐI',      color: '#a855f7', skills: ['meteors'],                                  desc: 'Mưa thiên thạch' },
            15:  { name: 'XẠ THỦ TỬ THẦN',        color: '#84cc16', skills: ['beam', 'fan'],                              desc: 'Tia tử thần & loạt đạn quạt' },
            20:  { name: 'HỘ VỆ THÉP',            color: '#64748b', skills: ['shield', 'slam'],                           desc: 'Giáp thép & đập đất' },
            25:  { name: 'BÓNG MA XUYÊN KHÔNG',   color: '#38bdf8', skills: ['teleport', 'spiral'],                       desc: 'Dịch chuyển & đạn xoắn ốc' },
            30:  { name: 'CHÚA TỂ LỬA',           color: '#f97316', skills: ['meteors', 'fan', 'slam'],                   desc: 'Hỏa cầu, loạt đạn & đập đất' },
            35:  { name: 'NHỆN ĐỘC KHỔNG LỒ',     color: '#65a30d', skills: ['pool', 'summon'],                           desc: 'Vũng độc & đàn nhện con' },
            40:  { name: 'VUA SẤM SÉT',           color: '#facc15', skills: ['beam', 'cross'],                            desc: 'Tia sét chữ thập' },
            45:  { name: 'PHÁP VƯƠNG HƯ KHÔNG',   color: '#7c3aed', skills: ['pull', 'spiral', 'meteors'],                desc: 'Hố đen hút người chơi' },
            50:  { name: 'HOÀNG ĐẾ BĂNG GIÁ',     color: '#7dd3fc', skills: ['stunwave', 'fan', 'slam'],                  desc: 'Sóng băng gây choáng' },
            55:  { name: 'RỒNG CỔ ĐẠI',           color: '#ef4444', skills: ['fan', 'meteors', 'sweep'],                  desc: 'Hơi thở rồng quét ngang' },
            60:  { name: 'QUỶ VƯƠNG ĐỊA NGỤC',    color: '#be123c', skills: ['pool', 'cross', 'summon'],                  desc: 'Dung nham & quỷ nhỏ' },
            65:  { name: 'THẦN CHIẾN TRANH',      color: '#b45309', skills: ['slam', 'stunwave', 'shield'],               desc: 'Chấn động gây choáng' },
            70:  { name: 'KẺ DỆT BÓNG TỐI',       color: '#475569', skills: ['teleport', 'pull', 'spiral', 'cross'],      desc: 'Dịch chuyển & hố đen' },
            75:  { name: 'TƯỢNG ĐÀI CỔ ĐẠI',      color: '#a8a29e', skills: ['shield', 'slam', 'sweep', 'stunwave'],      desc: 'Bất động như núi' },
            80:  { name: 'CHÚA TỂ THIÊN THẠCH',   color: '#fb923c', skills: ['meteors', 'sweep', 'fan'],                  desc: 'Mưa sao băng' },
            85:  { name: 'HẮC LONG VƯƠNG',        color: '#1e293b', skills: ['fan', 'pool', 'sweep', 'meteors'],          desc: 'Long hỏa & vũng độc' },
            90:  { name: 'MA THẦN HỦY DIỆT',      color: '#dc2626', skills: ['cross', 'pull', 'stunwave', 'summon', 'spiral'], desc: 'Hủy diệt mọi thứ' },
            95:  { name: 'THIÊN SỨ SA NGÃ',       color: '#e879f9', skills: ['sweep', 'cross', 'teleport', 'fan', 'meteors'], desc: 'Ánh sáng thanh tẩy' },
            100: { name: 'CHÚA TỂ TỐI THƯỢNG',    color: '#f43f5e', skills: ['meteors', 'beam', 'summon', 'slam', 'spiral', 'fan', 'cross', 'pool', 'stunwave', 'pull', 'sweep', 'teleport', 'shield'], desc: 'Nắm giữ mọi tuyệt kỹ' }
        }
    },

    // ----- KỸ NĂNG BOSS -----
    bossSkills: {
        radialCount: 12, radialDmg: 18, radialSpeed: 4.5, radialInterval: 3.5,   // đạn vòng
        chargeInterval: 6, chargeSpeed: 8, chargeFrames: 38, windupFrames: 45,    // lướt (windup = thời gian báo trước)
        enrageHpPct: 0.3, enrageSpeedMult: 1.4,
        towerInterval: 6.5, finalInterval: 4.5, finalEnrageInterval: 3.5,          // nhịp tung chiêu riêng (tầng 30 nhanh hơn)
        summonCount: 4, meteorCount: 5, finalMeteorCount: 7, meteorDmg: 28, meteorRadius: 70, meteorDelay: 70,
        beamDmg: 35, beamWidth: 36, slamDmg: 30, slamRadius: 175, teleportDmg: 28,
        shieldSec: 4, shieldReduce: 0.7, spiralDmg: 14,
        fanDmg: 14, crossDmg: 30, poolDmg: 8, sweepDmg: 10, stunSec: 1.0,        // kỹ năng mới
        dmgPerFloor: 0.012,                                                      // sát thương chiêu boss tăng mỗi tầng
        minInterval: 2.8, intervalDropPerFloor: 0.035                             // nhịp tung chiêu: càng lên cao càng nhanh
    },

    // ----- VÀNG & CỬA HÀNG -----
    shop: {
        prices: { sword: 250, hammer: 300, dual: 350, bow: 250, spear: 300, axe: 320, staff: 350 },
        hpPotion: { price: 60, heal: 0.6 },   // hồi % máu tối đa
        mpPotion: { price: 60 }
    },

    // ----- HIỆU ỨNG TRẠNG THÁI (thẻ Lửa / Độc / Sóng) -----
    status: {
        fire:   { dpsBase: 10, dpsPerLevel: 8, sec: 3 },                                   // cháy: sát thương/giây
        poison: { dpsBase: 4, dpsPerLevel: 4, maxHpPctPerLevel: 0.0008, sec: 5 },           // độc: + % máu tối đa mỗi cấp
        wave:   { pctPerLevel: 0.25, speed: 9, life: 55, radius: 38 }                      // sóng: % sát thương vũ khí x cấp
    },

    // ----- CHOÁNG (stun người chơi) -----
    stun: { immuneSec: 2.5, contactSec: 0.5, tankStompInterval: 6, tankStompRadius: 95, tankStompDmg: 10, stompSec: 0.8 },

    // ----- TỈ LỆ RA THẺ THEO ĐỘ HIẾM -----
    cardWeights: { common: 50, rare: 30, epic: 14, master: 6, legendary: 1.2 }
};

// ===== CÀI ĐẶT NGƯỜI DÙNG (lưu trên máy) =====
const SETTINGS_KEY = 'cbvh_settings_v1';
const settings = { lowEnd: false, noShake: false };
try { Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch (e) {}
function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {} }

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function applySettings() {
    document.body.classList.toggle('lowend', !!settings.lowEnd);
    try {
        // Máy yếu: tắt toàn bộ shadowBlur (rất tốn GPU)
        if (settings.lowEnd) Object.defineProperty(ctx, 'shadowBlur', { configurable: true, get() { return 0; }, set(v) {} });
        else delete ctx.shadowBlur;
    } catch (e) {}
}
applySettings();

function resizeCanvas() {
    const vv = window.visualViewport;
    const h = Math.round(vv ? vv.height : window.innerHeight);
    const w = Math.round(vv ? vv.width : window.innerWidth);
    document.documentElement.style.setProperty('--app-h', h + 'px');
    document.documentElement.style.setProperty('--app-w', w + 'px');
    canvas.width = w;
    canvas.height = h;
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 200));
if (window.visualViewport) window.visualViewport.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 300);
resizeCanvas();

// Audio System
let audioMuted = false;
const synth = new Tone.PolySynth(Tone.Synth).toDestination();
synth.volume.value = -14;

const noiseSynth = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.005, decay: 0.08, sustain: 0 }
}).toDestination();
noiseSynth.volume.value = -20;

function playSound(type) {
    if (audioMuted) return;
    if (settings.lowEnd && (type === 'hit' || type === 'gem' || type === 'slash')) return;
    try {
        if (Tone.context.state !== 'running') Tone.start();
        if (type === 'shoot') synth.triggerAttackRelease("C5", "16n", undefined, 0.08);
        else if (type === 'hit') noiseSynth.triggerAttackRelease("16n");
        else if (type === 'gem') synth.triggerAttackRelease("G6", "32n", undefined, 0.05);
        else if (type === 'levelup') synth.triggerAttackRelease(["C5", "E5", "G5", "C6"], "8n");
        else if (type === 'fusion') synth.triggerAttackRelease(["C4", "G4", "C5", "E5", "G5", "C6"], "4n");
        else if (type === 'boss') synth.triggerAttackRelease(["G1", "C2", "G2"], "2n");
        else if (type === 'active') synth.triggerAttackRelease(["E5", "A5"], "16n", undefined, 0.1);
        else if (type === 'crit') synth.triggerAttackRelease(["E6", "B6"], "16n", undefined, 0.15);
        else if (type === 'slash') synth.triggerAttackRelease("A3", "16n", undefined, 0.1);
    } catch (e) {}
}

document.getElementById('muteBtn').addEventListener('click', () => {
    audioMuted = !audioMuted;
    document.getElementById('muteBtn').querySelector('i').className = audioMuted ? 'fa-solid fa-volume-xmark text-sm text-red-400' : 'fa-solid fa-volume-high text-sm';
});

let gameState = 'START'; // 'START', 'PLAYING', 'LEVEL_UP', 'PAUSED', 'GAMEOVER', 'SWAP'
let gameTime = 0;
let killCount = 0;
let keys = {};
let touchStartPos = null;
let touchCurrentPos = null;
let screenShakeTime = 0;

// ===== TOWER MODE =====
let gameMode = 'survival'; // 'survival' | 'tower'
const ARENA_R = CONFIG.tower.arenaRadius, TOWER_MAX = CONFIG.tower.maxFloor;
let towerFloor = 1, introTimer = 0, floorActive = false, pendingNextFloor = false;
const AFFIX = {
    fast:    { name: 'CUỒNG TỐC', desc: 'Quái di chuyển nhanh hơn', color: '#38bdf8' },
    armored: { name: 'GIÁP SẮT', desc: 'Quái có giáp dày hơn', color: '#94a3b8' },
    regen:   { name: 'TÁI SINH', desc: 'Quái tự hồi máu', color: '#4ade80' },
    explode: { name: 'TỰ BẠO', desc: 'Quái phát nổ khi chết', color: '#fb923c' },
    frenzy:  { name: 'CUỒNG NỘ', desc: 'Quái gây thêm 50% sát thương', color: '#f43f5e' },
    stun:    { name: 'CHOÁNG', desc: 'Quái đánh trúng sẽ làm bạn choáng', color: '#facc15' }
};
function difficultyLevel() { return gameMode === 'tower' ? 1 + (towerFloor - 1) * CONFIG.tower.difficultyPerFloor : player.level; }
function hurtPlayer(amount) {
    let a = amount * 100 / (100 + player.defense * CONFIG.stats.defFactor);
    if (player.shield > 0) { const ab = Math.min(player.shield, a); player.shield -= ab; a -= ab; }
    player.hp -= a;
}
const AIM_LEN = CONFIG.enemies.aimLength; // tầm bay đạn của cung thủ/pháp sư (cũng là độ dài đường dự đoán)
const TOWER_BOSSES = CONFIG.tower.bosses;
const bossInfo = n => TOWER_BOSSES[n] || TOWER_BOSSES[CONFIG.tower.maxFloor];
let floorAffixes = [], floorColor = '#38bdf8';
function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}
function rollAffixes(n) {
    if (n % CONFIG.tower.bossEvery === 0 || n < CONFIG.tower.affixFromFloor) return [];
    if (Math.random() > CONFIG.tower.affixChance) return [];
    const keys = Object.keys(AFFIX), cnt = n >= CONFIG.tower.doubleAffixFloor ? 2 : 1, out = [];
    while (out.length < cnt) { const k = keys[Math.floor(Math.random() * keys.length)]; if (!out.includes(k)) out.push(k); }
    return out;
}
function stunPlayer(sec) {
    if (player.stunT > 0 || player.stunImmune > 0) return;
    player.stunT = Math.round(sec * 60);
    player.stunImmune = player.stunT + Math.round(CONFIG.stun.immuneSec * 60);
    createFloatingText(player.x, player.y - 36, 'CHOÁNG!', '#facc15', 16);
    playSound('crit');
}
function tickStatus(e) {
    if (e.burnT > 0) e.burnT -= 1 / 60;
    if (e.poisonT > 0) e.poisonT -= 1 / 60;
    if (e.burnT > 0 || e.poisonT > 0) {
        e.dotTick = (e.dotTick || 0) + 1;
        if (e.dotTick >= 30) {
            e.dotTick = 0;
            let dmg = 0;
            if (e.burnT > 0) dmg += e.burnDps * 0.5;
            if (e.poisonT > 0) dmg += e.poisonDps * 0.5;
            e.hp -= dmg; e.hitTimer = 4;
            createFloatingText(e.x, e.y - e.radius, Math.round(dmg), e.burnT > 0 ? '#fb923c' : '#84cc16', 11);
        }
    }
}
let hazards = [], playerStrikes = [];

// Player Data & Skill Registry
const player = {
    x: 0,
    y: 0,
    radius: CONFIG.player.radius,
    speed: CONFIG.player.speed,
    hp: CONFIG.player.maxHp,
    maxHp: CONFIG.player.maxHp,
    level: 1,
    xp: 0,
    nextXp: CONFIG.player.firstLevelXp,
    regen: CONFIG.player.regen,            // HP regen per second
    magnetRadius: CONFIG.player.magnetRadius,     // Magnet attraction radius
    xpMultiplier: CONFIG.player.xpMultiplier,     // More XP multiplier
    facingAngle: 0,
    normalAttackCd: 0,
    lastBossSpawnLevel: 0, // Fix boss repeated spawn bug!
    mana: CONFIG.player.mana, maxMana: CONFIG.player.mana, manaRegen: CONFIG.player.manaRegen,
    defense: 0, skillPoints: 0, skillPower: 1, statAtk: 0,
    statLv: { hp: 0, def: 0, atk: 0, skill: 0, mana: 0 },
    weapon: 'sword', comboStep: 0, comboTimer: 0, gold: 0, shield: 0, shieldTimer: 0, stunT: 0, stunImmune: 0, swingT: 0,

    // Skill Slots
    activeSlots: ['dagger', null],
    activeCdTimers: [0, 0],

    // Skill Registry
    skills: {
        // Active Skills
        dagger: { id: 'dagger', name: 'Dao Ma Thuật', level: 1, maxLevel: 5, icon: 'fa-wand-magic-sparkles', type: 'active', cd: 1.5, mana: 12 },
        lightning: { id: 'lightning', name: 'Sét Đánh', level: 0, maxLevel: 5, icon: 'fa-bolt-lightning', type: 'active', cd: 3.0, mana: 20 },
        laser: { id: 'laser', name: 'Tia Laser Tối Thượng', level: 0, maxLevel: 5, icon: 'fa-raygun', type: 'active', cd: 4.5, mana: 30 },
        nova: { id: 'nova', name: 'Băng Giá Bùng Nổ', level: 0, maxLevel: 5, icon: 'fa-icicles', type: 'active', cd: 5.0, mana: 25 },
        meteor: { id: 'meteor', name: 'Thiên Thạch Giáng Thế', level: 0, maxLevel: 5, icon: 'fa-meteor', type: 'active', cd: 6.0, mana: 28 },
        shield: { id: 'shield', name: 'Khiên Năng Lượng', level: 0, maxLevel: 5, icon: 'fa-shield-halved', type: 'active', cd: 12.0, mana: 22 },

        // Passive / Auto Skills
        orbit: { id: 'orbit', name: 'Vòng Xoáy Lưỡi Đao', level: 0, maxLevel: 5, icon: 'fa-circle-notch', type: 'passive' },
        aura: { id: 'aura', name: 'Hào Quang Thánh Sĩ', level: 0, maxLevel: 5, icon: 'fa-fire', type: 'passive' },
        damage: { id: 'damage', name: 'Sức Mạnh Cuồng Thần', level: 0, maxLevel: 5, icon: 'fa-hand-fist', type: 'passive' },
        move_speed: { id: 'move_speed', name: 'Thần Tốc', level: 0, maxLevel: 5, icon: 'fa-person-running', type: 'passive' },
        max_hp: { id: 'max_hp', name: 'Sinh Lực Bền Vững', level: 0, maxLevel: 5, icon: 'fa-heart-pulse', type: 'passive' },

        // NEW Passive Skills
        magnet: { id: 'magnet', name: 'Nam Châm Thần Hỏa', level: 0, maxLevel: 5, icon: 'fa-magnet', type: 'passive' },
        more_xp: { id: 'more_xp', name: 'Tri Thức Uyển Chuyển', level: 0, maxLevel: 5, icon: 'fa-graduation-cap', type: 'passive' },
        regen: { id: 'regen', name: 'Tự Chữa Lành', level: 0, maxLevel: 5, icon: 'fa-kit-medical', type: 'passive' },
        lifesteal: { id: 'lifesteal', name: 'Huyết Ma Thuật', level: 0, maxLevel: 5, icon: 'fa-vial', type: 'passive' },
        freeze: { id: 'freeze', name: 'Băng Trầm Băng Hàn', level: 0, maxLevel: 5, icon: 'fa-snowflake', type: 'passive' },
        crit: { id: 'crit', name: 'Tâm Mắt Khát Máu', level: 0, maxLevel: 5, icon: 'fa-crosshairs', type: 'passive' },
        true_dmg: { id: 'true_dmg', name: 'Sát Thương Chuẩn', level: 0, maxLevel: 5, icon: 'fa-shield-virus', type: 'passive' },
        fire: { id: 'fire', name: 'Hỏa Ấn Thiêu Đốt', level: 0, maxLevel: 5, icon: 'fa-fire-flame-curved', type: 'passive' },
        poison: { id: 'poison', name: 'Độc Tố Ăn Mòn', level: 0, maxLevel: 5, icon: 'fa-skull-crossbones', type: 'passive' },
        wave: { id: 'wave', name: 'Sóng Chém Xung Kích', level: 0, maxLevel: 5, icon: 'fa-water', type: 'passive' },

        // Mythic Fusions (Cyan)
        fusion_blade: { id: 'fusion_blade', name: 'Ma Kiếm Vô Song', level: 0, maxLevel: 1, icon: 'fa-ring', type: 'fusion', color: 'cyan' },
        fusion_storm: { id: 'fusion_storm', name: 'Thiên Tai Phong Bão', level: 0, maxLevel: 1, icon: 'fa-tornado', type: 'fusion', color: 'cyan' },
        fusion_thunder: { id: 'fusion_thunder', name: 'Lôi Thần Trừng Phạt', level: 0, maxLevel: 1, icon: 'fa-cloud-showers-heavy', type: 'fusion', color: 'cyan' },
        fusion_vamp: { id: 'fusion_vamp', name: 'Huyết Hào Quang', level: 0, maxLevel: 1, icon: 'fa-ankh', type: 'fusion', color: 'cyan' }
    },

    // Helper methods for damage calculations
    getDamageMultiplier() {
        // Fix bug: Properly apply damage boost (+25% per level)
        return 1 + (this.skills.damage.level * CONFIG.passives.damagePerLevel) + this.statAtk * CONFIG.stats.atk;
    },
    getCritChance() {
        return CONFIG.passives.critBase + (this.skills.crit.level * CONFIG.passives.critPerLevel);
    },
    getCritMultiplier() {
        return CONFIG.passives.critMult;
    },
    getTrueDmgChance() {
        return this.skills.true_dmg.level * CONFIG.passives.trueDmgPerLevel;
    },
    getLifestealPercent() {
        return this.skills.lifesteal.level * CONFIG.passives.lifestealPerLevel;
    },
    getFreezeChance() {
        return this.skills.freeze.level * CONFIG.passives.freezeChancePerLevel;
    }
};

['dagger', 'lightning', 'laser', 'nova', 'meteor', 'shield'].forEach(id => {
    player.skills[id].cd = CONFIG.activeSkills[id].cd;
    player.skills[id].mana = CONFIG.activeSkills[id].mana;
});
let pendingSkillToEquip = null;

// Fusion Combo Recipes
const fusionRecipes = [
    {
        id: 'fusion_blade',
        name: 'Ma Kiếm Vô Song',
        desc: 'Phóng ra 8 Ma Kiếm Thần Thoại xoay càn quét toàn màn hình',
        req1: { id: 'dagger', name: 'Dao Ma Thuật', level: 5 },
        req2: { id: 'damage', name: 'Sức Mạnh Cuồng Thần', level: 5 },
        icon: 'fa-ring'
    },
    {
        id: 'fusion_storm',
        name: 'Thiên Tai Phong Bão',
        desc: 'Siêu bão Cyan hút quái vật và gây sát thương liên tục',
        req1: { id: 'orbit', name: 'Vòng Xoáy Lưỡi Đao', level: 5 },
        req2: { id: 'aura', name: 'Hào Quang Thánh Sĩ', level: 5 },
        icon: 'fa-tornado'
    },
    {
        id: 'fusion_thunder',
        name: 'Lôi Thần Trừng Phạt',
        desc: 'Mưa sấm sét Cyan giáng liên tục tàn phá diện rộng',
        req1: { id: 'lightning', name: 'Sét Đánh', level: 5 },
        req2: { id: 'move_speed', name: 'Thần Tốc', level: 5 },
        icon: 'fa-cloud-showers-heavy'
    },
    {
        id: 'fusion_vamp',
        name: 'Huyết Hào Quang',
        desc: 'Hào quang Cyan thiêu đốt quái và hồi máu liên tục cho người chơi',
        req1: { id: 'aura', name: 'Hào Quang Thánh Sĩ', level: 5 },
        req2: { id: 'max_hp', name: 'Sinh Lực Bền Vững', level: 5 },
        icon: 'fa-ankh'
    }
];

// Rarity Definitions
const rarityConfig = {
    common: { name: 'Thường', class: 'rarity-common', badgeBg: 'bg-slate-700 text-slate-200' },
    rare: { name: 'Hiếm', class: 'rarity-rare', badgeBg: 'bg-blue-600 text-white' },
    epic: { name: 'Cực Phẩm', class: 'rarity-epic', badgeBg: 'bg-purple-600 text-white' },
    master: { name: 'Tinh Diệu', class: 'rarity-master', badgeBg: 'bg-amber-500 text-slate-950 font-extrabold' },
    legendary: { name: 'Huyền Thoại', class: 'rarity-legendary', badgeBg: 'bg-red-600 text-white font-extrabold' },
    mythic: { name: 'Thần Thoại', class: 'rarity-mythic', badgeBg: 'bg-cyan-400 text-slate-950 font-black' }
};

// Cards Pool
const cardPool = [
    {
        id: 'dagger', rarity: 'common',
        getProps: () => ({ title: player.skills.dagger.level === 0 ? 'Dao Ma Thuật (Chủ Động)' : `Dao Ma Thuật (Lv.${player.skills.dagger.level + 1})`, desc: 'Kích hoạt: Phóng liên hoàn dao ma thuật sát thương lớn.', icon: 'fa-wand-magic-sparkles' }),
        canAppear: () => player.skills.dagger.level < player.skills.dagger.maxLevel,
        apply: () => handleAcquireActiveSkill('dagger')
    },
    {
        id: 'lightning', rarity: 'rare',
        getProps: () => ({ title: player.skills.lightning.level === 0 ? 'Sét Đánh (Chủ Động)' : `Sét Đánh (Lv.${player.skills.lightning.level + 1})`, desc: 'Kích hoạt: Giáng sấm sét tàn phá đám quái.', icon: 'fa-bolt-lightning' }),
        canAppear: () => player.skills.lightning.level < player.skills.lightning.maxLevel,
        apply: () => handleAcquireActiveSkill('lightning')
    },
    {
        id: 'laser', rarity: 'master',
        getProps: () => ({ title: player.skills.laser.level === 0 ? 'Tia Laser Tối Thượng' : `Tia Laser Tối Thượng (Lv.${player.skills.laser.level + 1})`, desc: 'Kích hoạt: Bắn chùm tia laser xuyên phá thiêu rụi kẻ địch.', icon: 'fa-raygun' }),
        canAppear: () => player.skills.laser.level < player.skills.laser.maxLevel,
        apply: () => handleAcquireActiveSkill('laser')
    },
    {
        id: 'nova', rarity: 'epic',
        getProps: () => ({ title: player.skills.nova.level === 0 ? 'Băng Giá Bùng Nổ (Chủ Động)' : `Băng Giá Bùng Nổ (Lv.${player.skills.nova.level + 1})`, desc: 'Kích hoạt: Nổ băng quanh người, gây sát thương và đóng băng quái xung quanh.', icon: 'fa-icicles' }),
        canAppear: () => player.skills.nova.level < player.skills.nova.maxLevel,
        apply: () => handleAcquireActiveSkill('nova')
    },
    {
        id: 'meteor', rarity: 'master',
        getProps: () => ({ title: player.skills.meteor.level === 0 ? 'Thiên Thạch Giáng Thế (Chủ Động)' : `Thiên Thạch Giáng Thế (Lv.${player.skills.meteor.level + 1})`, desc: 'Kích hoạt: Triệu hồi thiên thạch giáng xuống kẻ địch sau một nhịp báo trước.', icon: 'fa-meteor' }),
        canAppear: () => player.skills.meteor.level < player.skills.meteor.maxLevel,
        apply: () => handleAcquireActiveSkill('meteor')
    },
    {
        id: 'shield', rarity: 'rare',
        getProps: () => ({ title: player.skills.shield.level === 0 ? 'Khiên Năng Lượng (Chủ Động)' : `Khiên Năng Lượng (Lv.${player.skills.shield.level + 1})`, desc: 'Kích hoạt: Tạo khiên hấp thụ sát thương trong 6 giây.', icon: 'fa-shield-halved' }),
        canAppear: () => player.skills.shield.level < player.skills.shield.maxLevel,
        apply: () => handleAcquireActiveSkill('shield')
    },
    {
        id: 'orbit', rarity: 'rare',
        getProps: () => ({ title: player.skills.orbit.level === 0 ? 'Vòng Xoáy Lưỡi Đao' : `Vòng Xoáy Lưỡi Đao (Lv.${player.skills.orbit.level + 1})`, desc: 'Tự động: Lưỡi đao xoay quanh bảo vệ người chơi.', icon: 'fa-circle-notch' }),
        canAppear: () => player.skills.orbit.level < player.skills.orbit.maxLevel,
        apply: () => player.skills.orbit.level++
    },
    {
        id: 'aura', rarity: 'epic',
        getProps: () => ({ title: player.skills.aura.level === 0 ? 'Hào Quang Thánh Sĩ' : `Hào Quang Thánh Sĩ (Lv.${player.skills.aura.level + 1})`, desc: 'Tự động: Tạo vòng lửa thiêu đốt quái vật áp sát.', icon: 'fa-fire' }),
        canAppear: () => player.skills.aura.level < player.skills.aura.maxLevel,
        apply: () => player.skills.aura.level++
    },
    {
        id: 'damage', rarity: 'epic',
        getProps: () => ({ title: player.skills.damage.level === 0 ? 'Sức Mạnh Cuồng Thần' : `Sức Mạnh Cuồng Thần (Lv.${player.skills.damage.level + 1})`, desc: `Nội tại: Gia tăng +${Math.round(CONFIG.passives.damagePerLevel * 100)}% Tổng sát thương cho mọi chiêu thức.`, icon: 'fa-hand-fist' }),
        canAppear: () => player.skills.damage.level < player.skills.damage.maxLevel,
        apply: () => player.skills.damage.level++
    },
    {
        id: 'move_speed', rarity: 'common',
        getProps: () => ({ title: player.skills.move_speed.level === 0 ? 'Thần Tốc' : `Thần Tốc (Lv.${player.skills.move_speed.level + 1})`, desc: `Nội tại: Tăng +${Math.round((CONFIG.passives.moveSpeedMult - 1) * 100)}% Tốc độ di chuyển.`, icon: 'fa-person-running' }),
        canAppear: () => player.skills.move_speed.level < player.skills.move_speed.maxLevel,
        apply: () => { player.skills.move_speed.level++; player.speed *= CONFIG.passives.moveSpeedMult; }
    },
    {
        id: 'max_hp', rarity: 'master',
        getProps: () => ({ title: player.skills.max_hp.level === 0 ? 'Sinh Lực Bền Vững' : `Sinh Lực Bền Vững (Lv.${player.skills.max_hp.level + 1})`, desc: `Nội tại: Tăng +${CONFIG.passives.maxHpPerLevel} HP tối đa và hồi ngay ${Math.round(CONFIG.passives.maxHpHealPct * 100)}% HP.`, icon: 'fa-heart-pulse' }),
        canAppear: () => player.skills.max_hp.level < player.skills.max_hp.maxLevel,
        apply: () => { player.skills.max_hp.level++; player.maxHp += CONFIG.passives.maxHpPerLevel; player.hp = Math.min(player.maxHp, player.hp + player.maxHp * CONFIG.passives.maxHpHealPct); }
    },

    // NEW SUPPORT & PASSIVE CARDS
    {
        id: 'magnet', rarity: 'common',
        getProps: () => ({ title: player.skills.magnet.level === 0 ? 'Nam Châm Thần Hỏa' : `Nam Châm Thần Hỏa (Lv.${player.skills.magnet.level + 1})`, desc: `Bổ trợ: Mở rộng +${CONFIG.passives.magnetPerLevel}px phạm vi tự động hút XP từ xa.`, icon: 'fa-magnet' }),
        canAppear: () => player.skills.magnet.level < player.skills.magnet.maxLevel,
        apply: () => { player.skills.magnet.level++; player.magnetRadius += CONFIG.passives.magnetPerLevel; }
    },
    {
        id: 'more_xp', rarity: 'rare',
        getProps: () => ({ title: player.skills.more_xp.level === 0 ? 'Tri Thức Uyển Chuyển' : `Tri Thức Uyển Chuyển (Lv.${player.skills.more_xp.level + 1})`, desc: `Bổ trợ: Tăng thêm +${Math.round(CONFIG.passives.xpPerLevel * 100)}% lượng XP nhận được khi nhặt ngọc.`, icon: 'fa-graduation-cap' }),
        canAppear: () => player.skills.more_xp.level < player.skills.more_xp.maxLevel,
        apply: () => { player.skills.more_xp.level++; player.xpMultiplier += CONFIG.passives.xpPerLevel; }
    },
    {
        id: 'regen', rarity: 'epic',
        getProps: () => ({ title: player.skills.regen.level === 0 ? 'Tự Chữa Lành' : `Tự Chữa Lành (Lv.${player.skills.regen.level + 1})`, desc: `Nội tại: Hồi phục +${CONFIG.passives.regenPerLevel} HP mỗi giây liên tục.`, icon: 'fa-kit-medical' }),
        canAppear: () => player.skills.regen.level < player.skills.regen.maxLevel,
        apply: () => { player.skills.regen.level++; player.regen += CONFIG.passives.regenPerLevel; }
    },
    {
        id: 'lifesteal', rarity: 'master',
        getProps: () => ({ title: player.skills.lifesteal.level === 0 ? 'Huyết Ma Thuật' : `Huyết Ma Thuật (Lv.${player.skills.lifesteal.level + 1})`, desc: `Nội tại: Chuyển ${Math.round(CONFIG.passives.lifestealPerLevel * 100)}% sát thương gây ra thành máu hồi phục.`, icon: 'fa-vial' }),
        canAppear: () => player.skills.lifesteal.level < player.skills.lifesteal.maxLevel,
        apply: () => player.skills.lifesteal.level++
    },
    {
        id: 'freeze', rarity: 'rare',
        getProps: () => ({ title: player.skills.freeze.level === 0 ? 'Băng Trầm Băng Hàn' : `Băng Trầm Băng Hàn (Lv.${player.skills.freeze.level + 1})`, desc: `Nội tại: +${Math.round(CONFIG.passives.freezeChancePerLevel * 100)}% tỷ lệ đóng băng quái vật trong ${CONFIG.freeze.sec} giây.`, icon: 'fa-snowflake' }),
        canAppear: () => player.skills.freeze.level < player.skills.freeze.maxLevel,
        apply: () => player.skills.freeze.level++
    },
    {
        id: 'crit', rarity: 'legendary',
        getProps: () => ({ title: player.skills.crit.level === 0 ? 'Tâm Mắt Khát Máu' : `Tâm Mắt Khát Máu (Lv.${player.skills.crit.level + 1})`, desc: `Nội tại: +${Math.round(CONFIG.passives.critPerLevel * 100)}% Tỷ lệ Chí Mạng (Chí mạng BỎ QUA lớp phòng ngự).`, icon: 'fa-crosshairs' }),
        canAppear: () => player.skills.crit.level < player.skills.crit.maxLevel,
        apply: () => player.skills.crit.level++
    },
    {
        id: 'true_dmg', rarity: 'legendary',
        getProps: () => ({ title: player.skills.true_dmg.level === 0 ? 'Sát Thương Chuẩn' : `Sát Thương Chuẩn (Lv.${player.skills.true_dmg.level + 1})`, desc: `Nội tại: +${Math.round(CONFIG.passives.trueDmgPerLevel * 100)}% Tỷ lệ đòn đánh là Sát Thương Chuẩn (Bỏ qua giáp).`, icon: 'fa-shield-virus' }),
        canAppear: () => player.skills.true_dmg.level < player.skills.true_dmg.maxLevel,
        apply: () => player.skills.true_dmg.level++
    }
    ,{
        id: 'fire', rarity: 'epic',
        getProps: () => ({ title: player.skills.fire.level === 0 ? 'Hỏa Ấn Thiêu Đốt' : `Hỏa Ấn Thiêu Đốt (Lv.${player.skills.fire.level + 1})`, desc: `Nội tại: Mỗi đòn đánh thường gây CHÁY ${CONFIG.status.fire.sec}s (${CONFIG.status.fire.dpsBase + CONFIG.status.fire.dpsPerLevel * (player.skills.fire.level + 1)} sát thương/giây).`, icon: 'fa-fire-flame-curved' }),
        canAppear: () => player.skills.fire.level < player.skills.fire.maxLevel,
        apply: () => player.skills.fire.level++
    }
    ,{
        id: 'poison', rarity: 'epic',
        getProps: () => ({ title: player.skills.poison.level === 0 ? 'Độc Tố Ăn Mòn' : `Độc Tố Ăn Mòn (Lv.${player.skills.poison.level + 1})`, desc: `Nội tại: Mỗi đòn đánh thường gây ĐỘC ${CONFIG.status.poison.sec}s, thêm sát thương theo máu tối đa của mục tiêu.`, icon: 'fa-skull-crossbones' }),
        canAppear: () => player.skills.poison.level < player.skills.poison.maxLevel,
        apply: () => player.skills.poison.level++
    }
    ,{
        id: 'wave', rarity: 'master',
        getProps: () => ({ title: player.skills.wave.level === 0 ? 'Sóng Chém Xung Kích' : `Sóng Chém Xung Kích (Lv.${player.skills.wave.level + 1})`, desc: `Nội tại: Mỗi đòn đánh thường tạo một đường sóng vòng cung bay thẳng về trước (${Math.round(CONFIG.status.wave.pctPerLevel * 100 * (player.skills.wave.level + 1))}% sát thương vũ khí).`, icon: 'fa-water' }),
        canAppear: () => player.skills.wave.level < player.skills.wave.maxLevel,
        apply: () => player.skills.wave.level++
    }
];

// Damage Calculation Engine with Defense, Crit & True Damage
function applyDamageToEnemy(enemy, rawDamage, isMelee = false, isTick = false, isBasic = false) {
    const dmgMult = player.getDamageMultiplier();
    let baseDamage = rawDamage * dmgMult;

    let isCrit = Math.random() < player.getCritChance();
    let isTrueDmg = Math.random() < player.getTrueDmgChance();

    if (isCrit) {
        baseDamage *= player.getCritMultiplier();
    }

    // Defense Logic: Crit or True Damage completely bypasses defense!
    let finalDamage = baseDamage;
    if (!isCrit && !isTrueDmg) {
        finalDamage = Math.max(1, baseDamage - enemy.defense);
    }

    if (enemy.shieldTimer > 0) finalDamage *= (1 - CONFIG.bossSkills.shieldReduce);
    // Apply damage
    enemy.hp -= finalDamage;
    enemy.hitTimer = 6;

    // Apply Freeze chance
    // (đòn tick liên tục như Hào Quang/Lưỡi Đao không đóng băng; có thời gian miễn nhiễm để không bị khóa cứng)
    if (!isTick && !(enemy.freezeImmune > 0) && Math.random() < player.getFreezeChance()) {
        enemy.freezeTimer = Math.round((enemy.type === 'boss' ? CONFIG.freeze.bossSec : CONFIG.freeze.sec) * 60);
        enemy.freezeImmune = Math.round(CONFIG.freeze.immuneSec * 60);
    }
    // Cháy / Độc từ đòn đánh thường
    if (isBasic && !isTick) {
        const fl = player.skills.fire.level, pl = player.skills.poison.level;
        if (fl > 0) { const F = CONFIG.status.fire; enemy.burnT = F.sec; enemy.burnDps = F.dpsBase + F.dpsPerLevel * fl; }
        if (pl > 0) { const P = CONFIG.status.poison; enemy.poisonT = P.sec; enemy.poisonDps = P.dpsBase + P.dpsPerLevel * pl + enemy.maxHp * P.maxHpPctPerLevel * pl; }
    }

    // Apply Lifesteal
    const lifestealPct = player.getLifestealPercent();
    if (lifestealPct > 0) {
        const healAmt = finalDamage * lifestealPct;
        player.hp = Math.min(player.maxHp, player.hp + healAmt);
    }

    if (isTick) return finalDamage;
    // Visual Text & Particles
    if (isCrit) {
        screenShakeTime = 6;
        playSound('crit');
        createFloatingText(enemy.x, enemy.y, `CRIT! ${Math.round(finalDamage)}`, '#fbbf24', 16);
        createParticles(enemy.x, enemy.y, '#fbbf24', 12);
    } else if (isTrueDmg) {
        createFloatingText(enemy.x, enemy.y, `TRUE ${Math.round(finalDamage)}`, '#22d3ee', 15);
        createParticles(enemy.x, enemy.y, '#22d3ee', 10);
    } else {
        createFloatingText(enemy.x, enemy.y, `${Math.round(finalDamage)}`, '#f8fafc', 12);
        createParticles(enemy.x, enemy.y, enemy.color, 5);
    }

    return finalDamage;
}

// Active Skill Equipment Logic
function handleAcquireActiveSkill(skillId) {
    const sk = player.skills[skillId];
    if (player.activeSlots.includes(skillId)) { sk.level++; updateActiveButtonsUI(); return; }
    const empty = player.activeSlots.indexOf(null);
    if (empty !== -1) {
        player.activeSlots[empty] = skillId;
        player.activeCdTimers[empty] = 0;
        sk.level++;
        updateActiveButtonsUI();
        return;
    }
    // Ô đầy: chỉ nhận kỹ năng khi người chơi chọn thay thế (chưa cộng cấp ở đây)
    pendingSkillToEquip = skillId;
    openSwapModal();
}

function openSwapModal() {
    gameState = 'SWAP';
    const modal = document.getElementById('swapSkillModal');
    const container = document.getElementById('swapChoicesContainer');
    const newSk = player.skills[pendingSkillToEquip];

    container.innerHTML = '';
    player.activeSlots.forEach((slotSkillId, idx) => {
        const currentSk = player.skills[slotSkillId];
        const btn = document.createElement('button');
        btn.className = 'w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 hover:border-amber-400 flex items-center justify-between text-left transition';
        btn.innerHTML = `
            <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center text-base">
                    <i class="fa-solid ${currentSk.icon}"></i>
                </div>
                <div>
                    <div class="text-xs font-bold text-white">Thay thế Ô ${idx + 1}: ${currentSk.name}</div>
                    <div class="text-[10px] text-gray-400">Đồng ý trang bị <b>${newSk.name}</b> vào Ô ${idx + 1}</div>
                </div>
            </div>
            <i class="fa-solid fa-chevron-right text-amber-400 text-xs"></i>
        `;
        btn.addEventListener('click', () => {
            const oldId = player.activeSlots[idx];
            if (oldId) player.skills[oldId].level = 0;
            player.activeSlots[idx] = pendingSkillToEquip;
            player.skills[pendingSkillToEquip].level++;
            player.activeCdTimers[idx] = 0;
            updateActiveSkillsBar();
            modal.classList.add('hidden');
            updateActiveButtonsUI();
            gameState = 'PLAYING';
            afterCardResolved();
        });
        container.appendChild(btn);
    });

    modal.classList.remove('hidden');
}

document.getElementById('cancelSwapBtn').addEventListener('click', () => {
    document.getElementById('swapSkillModal').classList.add('hidden');
    gameState = 'PLAYING';
    afterCardResolved();
});

// ===== VŨ KHÍ & COMBO =====
const WEAPONS = {
    sword:  { name: 'Kiếm',      emoji: '🗡️', color: '#60a5fa', dmg: 90,  cd: 0.32, melee: true },
    hammer: { name: 'Búa',       emoji: '🔨', color: '#eab308', dmg: 100, cd: 0.50, melee: true },
    dual:   { name: 'Song Kiếm', emoji: '⚔️', color: '#38bdf8', dmg: 80,  cd: 0.28, melee: true },
    bow:    { name: 'Cung',      emoji: '🏹', color: '#4ade80', dmg: 140, cd: 0.60, melee: false }
};
const COMBO_PCT = CONFIG.comboPct;
WEAPONS.dual.color2 = '#fb923c';   // song kiếm: xanh dương + cam
WEAPONS.spear = { name: 'Giáo',    emoji: '🔱', color: '#f472b6', melee: true };
WEAPONS.axe   = { name: 'Rìu',     emoji: '🪓', color: '#ef4444', melee: true };
WEAPONS.staff = { name: 'Trượng',  emoji: '🪄', color: '#c084fc', melee: false, combo: true };
Object.keys(WEAPONS).forEach(k => Object.assign(WEAPONS[k], CONFIG.weapons[k]));

function getStrikeShapes(weapon, step, a, px, py) {
    const line = (len, half, col, ang = a) => ({ t: 'line', ang, len, half, col });
    const arc = (r, half, ang, dir = 1, col) => ({ t: 'arc', ang, r, half, dir, col });
    const circ = (off, r, col) => ({ t: 'circle', cx: px + Math.cos(a) * off, cy: py + Math.sin(a) * off, r, col });
    const BL = '#38bdf8', OR = '#fb923c';
    switch (weapon) {
        case 'sword':  return [[line(135, 18)], [arc(105, 1.35, a)], [line(150, 38)]][step];
        case 'hammer': return [[circ(62, 46)], [arc(100, 1.3, a)], [circ(0, 115)]][step];
        case 'spear':  return [[line(195, 14)], [arc(150, 0.5, a)], [line(170, 16), line(170, 16, null, a - 0.5), line(170, 16, null, a + 0.5)]][step];
        case 'axe':    return [[arc(100, 0.95, a)], [circ(95, 58)], [arc(135, 2.3, a)]][step];
        default: return [ // dual: xanh dương + cam
            [arc(90, 1.2, a, 1, BL)],
            [arc(95, 0.5, a + 0.7, -1, BL), arc(95, 0.5, a - 0.7, 1, OR)],
            [arc(95, 0.95, a, 1, BL), arc(95, 0.95, a + Math.PI, 1, OR)]
        ][step];
    }
}

function shapeHits(sh, px, py, e) {
    const dx = e.x - px, dy = e.y - py, dist = Math.hypot(dx, dy);
    // Quái sát/trùng lên người chơi luôn bị trúng
    if (dist <= player.radius + e.radius + 6) return true;
    if (sh.t === 'line') {
        const c = Math.cos(sh.ang), sn = Math.sin(sh.ang);
        const along = dx * c + dy * sn, side = Math.abs(-dx * sn + dy * c);
        return along >= 0 && along <= sh.len + e.radius && side <= sh.half + e.radius;
    }
    if (sh.t === 'arc') {
        if (dist > sh.r + e.radius) return false;
        let d = ((Math.atan2(dy, dx) - sh.ang) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        if (d > Math.PI) d = Math.PI * 2 - d;
        return d <= sh.half + Math.atan2(e.radius, dist);
    }
    return Math.hypot(e.x - sh.cx, e.y - sh.cy) <= sh.r + e.radius;
}

// ===== VẼ HÌNH VŨ KHÍ =====
function drawWeaponShape(c, id, sc = 1) {
    c.save(); c.scale(sc, sc); c.lineCap = 'round'; c.lineJoin = 'round';
    const W = WEAPONS[id];
    const blade = (len, wd, col1, col2) => {
        const g = c.createLinearGradient(0, -wd, 0, wd); g.addColorStop(0, '#f8fafc'); g.addColorStop(1, col1);
        c.fillStyle = g; c.beginPath();
        c.moveTo(10, -wd); c.lineTo(10 + len - 6, -wd * 0.8); c.lineTo(10 + len, 0); c.lineTo(10 + len - 6, wd * 0.8); c.lineTo(10, wd); c.closePath(); c.fill();
        c.strokeStyle = col2; c.lineWidth = 1.2; c.stroke();
    };
    const hilt = () => {
        c.fillStyle = '#78350f'; c.fillRect(-4, -2.2, 14, 4.4);
        c.fillStyle = '#fbbf24'; c.fillRect(8, -7, 3.5, 14);
        c.beginPath(); c.arc(-4, 0, 3, 0, Math.PI * 2); c.fill();
    };
    const shaft = (x0, x1, w) => { c.strokeStyle = '#78350f'; c.lineWidth = w; c.beginPath(); c.moveTo(x0, 0); c.lineTo(x1, 0); c.stroke(); };
    if (id === 'sword') { hilt(); blade(34, 3.4, '#93c5fd', '#2563eb'); }
    else if (id === 'hammer') {
        shaft(-2, 38, 4);
        c.fillStyle = '#94a3b8'; c.fillRect(30, -11, 16, 22);
        c.fillStyle = W.color; c.fillRect(30, -11, 4, 22); c.fillRect(42, -11, 4, 22);
        c.strokeStyle = '#334155'; c.lineWidth = 1.2; c.strokeRect(30, -11, 16, 22);
    } else if (id === 'dual') {
        c.save(); c.rotate(-0.4); c.translate(0, -4); hilt(); blade(30, 3, '#7dd3fc', '#0284c7'); c.restore();
        c.save(); c.rotate(0.4); c.translate(0, 4); hilt(); blade(30, 3, '#fdba74', '#ea580c'); c.restore();
    } else if (id === 'bow') {
        c.strokeStyle = '#92400e'; c.lineWidth = 3.5; c.beginPath(); c.arc(4, 0, 24, -1.15, 1.15); c.stroke();
        const bx = 4 + 24 * Math.cos(1.15), by = 24 * Math.sin(1.15);
        c.strokeStyle = '#e2e8f0'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(bx, -by); c.lineTo(bx - 6, 0); c.lineTo(bx, by); c.stroke();
        c.strokeStyle = '#e2e8f0'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx - 6, 0); c.lineTo(30, 0); c.stroke();
        c.fillStyle = W.color; c.beginPath(); c.moveTo(36, 0); c.lineTo(28, -4); c.lineTo(28, 4); c.closePath(); c.fill();
    } else if (id === 'spear') {
        shaft(-8, 50, 3.5);
        c.fillStyle = W.color; c.beginPath(); c.moveTo(44, -4); c.lineTo(52, 0); c.lineTo(44, 4); c.closePath(); c.fill();
        c.fillStyle = '#e2e8f0'; c.strokeStyle = '#64748b'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(50, -5.5); c.lineTo(70, 0); c.lineTo(50, 5.5); c.closePath(); c.fill(); c.stroke();
    } else if (id === 'axe') {
        shaft(-2, 38, 4);
        const g = c.createLinearGradient(30, 0, 50, 0); g.addColorStop(0, '#fca5a5'); g.addColorStop(1, '#b91c1c');
        c.fillStyle = g; c.strokeStyle = '#7f1d1d'; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(30, -3); c.bezierCurveTo(30, -17, 46, -21, 50, -12); c.bezierCurveTo(44, -6, 44, 6, 50, 12);
        c.bezierCurveTo(46, 21, 30, 17, 30, 3); c.closePath(); c.fill(); c.stroke();
    } else if (id === 'staff') {
        shaft(-6, 44, 3.2);
        c.strokeStyle = '#fbbf24'; c.lineWidth = 2; c.beginPath(); c.arc(48, 0, 8, 0, Math.PI * 2); c.stroke();
        const g = c.createRadialGradient(47, -2, 1, 48, 0, 7); g.addColorStop(0, '#f5d0fe'); g.addColorStop(1, W.color);
        c.fillStyle = g; c.shadowColor = W.color; c.shadowBlur = 8; c.beginPath(); c.arc(48, 0, 6, 0, Math.PI * 2); c.fill();
    }
    c.restore();
}
const _wIconCache = {};
function weaponIconURL(id) {
    if (_wIconCache[id]) return _wIconCache[id];
    try {
        const cv = document.createElement('canvas'); cv.width = cv.height = 64;
        const c = cv.getContext('2d');
        c.translate(32, 32); c.rotate(-Math.PI / 4);
        const off = { sword: -24, hammer: -24, dual: -22, bow: -6, spear: -30, axe: -24, staff: -28 }[id] || -24;
        c.translate(off, 0);
        drawWeaponShape(c, id, id === 'spear' ? 0.8 : 0.9);
        return (_wIconCache[id] = cv.toDataURL());
    } catch (e) { return ''; }
}

function updateWeaponUI() {
    const w = WEAPONS[player.weapon];
    document.getElementById('weaponIcon').innerHTML = `<img src="${weaponIconURL(player.weapon)}" style="width:36px;height:36px" alt="">`;
    document.getElementById('weaponLabel').innerText = w.name;
    const btn = document.getElementById('normalAttackBtn');
    btn.style.borderColor = w.color;
    if (w.color2) { btn.style.borderRightColor = w.color2; btn.style.borderBottomColor = w.color2; }
    const pips = document.getElementById('comboPips');
    pips.innerHTML = '';
    if (w.melee || w.combo) for (let i = 0; i < 3; i++) {
        const d = document.createElement('span');
        d.style.cssText = `width:6px;height:6px;border-radius:50%;background:${i < player.comboStep ? w.color : 'rgba(255,255,255,.2)'}`;
        pips.appendChild(d);
    }
}

function spawnWave(a, w) {
    const lv = player.skills.wave.level;
    if (lv <= 0) return;
    const WV = CONFIG.status.wave;
    projectiles.push({
        x: player.x + Math.cos(a) * 20, y: player.y + Math.sin(a) * 20,
        vx: Math.cos(a) * WV.speed, vy: Math.sin(a) * WV.speed, ang: a,
        radius: WV.radius, rawDamage: w.dmg * WV.pctPerLevel * lv, color: w.color2 || w.color,
        life: WV.life, isPiercing: true, hitSet: new Set(), isWave: true, isBasic: true
    });
}

function triggerNormalAttack() {
    if (gameState !== 'PLAYING' || player.normalAttackCd > 0) return;
    const w = WEAPONS[player.weapon];
    player.normalAttackCd = w.cd;
    let a = player.facingAngle;
    // Tự nhắm mục tiêu gần nhất
    let tgt = null, bd = w.melee ? CONFIG.autoAim.melee : CONFIG.autoAim.ranged;
    enemies.forEach(e => { const d = Math.hypot(e.x - player.x, e.y - player.y); if (d < bd) { bd = d; tgt = e; } });
    if (tgt) { a = Math.atan2(tgt.y - player.y, tgt.x - player.x); player.facingAngle = a; }
    player.swingT = 9;

    if (player.weapon === 'bow') { // Cung
        projectiles.push({
            x: player.x, y: player.y,
            vx: Math.cos(a) * w.arrowSpeed, vy: Math.sin(a) * w.arrowSpeed,
            radius: w.arrowRadius, rawDamage: w.dmg, color: w.color,
            life: w.arrowLife, isPiercing: true, hitSet: new Set(), isArrow: true, trail: [], isBasic: true
        });
        spawnWave(a, w);
        playSound('shoot');
        return;
    }

    const step = player.comboStep, pct = COMBO_PCT[step];

    if (player.weapon === 'staff') { // Trượng: cầu phép / 3 cầu / nổ vùng
        const orb = ang => projectiles.push({
            x: player.x, y: player.y,
            vx: Math.cos(ang) * w.orbSpeed, vy: Math.sin(ang) * w.orbSpeed,
            radius: w.orbRadius, rawDamage: w.dmg * pct, color: w.color, life: w.orbLife, trail: [], isBasic: true
        });
        if (step === 0) orb(a);
        else if (step === 1) { orb(a - 0.3); orb(a); orb(a + 0.3); }
        else {
            const near = tgt && bd < 450;
            const tx = near ? tgt.x : player.x + Math.cos(a) * 220, ty = near ? tgt.y : player.y + Math.sin(a) * 220;
            skillFx.push({ t: 'ring', x: tx, y: ty, r: 105, color: w.color, life: 18, maxLife: 18 });
            createParticles(tx, ty, w.color, 18);
            screenShakeTime = Math.max(screenShakeTime, 3);
            enemies.slice().forEach(e => { if (Math.hypot(e.x - tx, e.y - ty) < 105 + e.radius) applyDamageToEnemy(e, w.dmg * pct, false, false, true); });
        }
        player.comboStep = (step + 1) % 3;
        player.comboTimer = CONFIG.comboResetSec;
        updateWeaponUI();
        spawnWave(a, w);
        playSound('shoot');
        return;
    }

    const shapes = getStrikeShapes(player.weapon, step, a, player.x, player.y);
    enemies.slice().forEach(e => {
        if (shapes.some(sh => shapeHits(sh, player.x, player.y, e))) {
            applyDamageToEnemy(e, w.dmg * pct, true, false, true);
        }
    });
    shapes.forEach(sh => slashFx.push({ ...sh, x: player.x, y: player.y, life: 14, maxLife: 14, color: sh.col || w.color }));
    if (step === 2) screenShakeTime = Math.max(screenShakeTime, 3);
    player.comboStep = (step + 1) % 3;
    player.comboTimer = CONFIG.comboResetSec;
    updateWeaponUI();
    spawnWave(a, w);
    playSound('slash');
}

function addBolt(x, y, color = '#facc15') {
    const topY = y - 520, startX = x + (Math.random() - 0.5) * 80, n = 8, pts = [];
    for (let i = 0; i <= n; i++) {
        const t = i / n;
        pts.push({ x: i === n ? x : startX + (x - startX) * t + (Math.random() - 0.5) * 50, y: topY + (y - topY) * t });
    }
    skillFx.push({ t: 'bolt', pts, x, y, color, life: 16, maxLife: 16 });
}

// Trigger Active Slot Execution
function triggerActiveSlot(slotIndex) {
    if (gameState !== 'PLAYING') return;

    const skillId = player.activeSlots[slotIndex];
    if (!skillId) return;

    const sk = player.skills[skillId];
    if (player.activeCdTimers[slotIndex] > 0) return;
    const manaCost = sk.mana || 0;
    if (player.mana < manaCost) {
        createFloatingText(player.x, player.y - 28, 'THIẾU MANA!', '#60a5fa', 13);
        return;
    }
    player.mana -= manaCost;

    if (skillId === 'dagger') {
        let targets = [...enemies].sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
        const A = CONFIG.activeSkills.dagger;
        const count = A.countBase + sk.level * A.countPerLevel;
        for (let i = 0; i < count; i++) {
            let angle = player.facingAngle + (Math.random() - 0.5) * 0.5;
            if (targets[i]) angle = Math.atan2(targets[i].y - player.y, targets[i].x - player.x);

            projectiles.push({
                x: player.x, y: player.y,
                vx: Math.cos(angle) * A.speed, vy: Math.sin(angle) * A.speed,
                radius: 6, rawDamage: A.dmg * (1 + (sk.level - 1) * A.dmgGrowth) * player.skillPower,
                color: '#38bdf8', life: A.life, trail: []
            });
        }
        playSound('shoot');
    } else if (skillId === 'lightning') {
        const L = CONFIG.activeSkills.lightning;
        const count = L.countBase + sk.level * L.countPerLevel;
        for (let i = 0; i < count; i++) {
            if (enemies.length === 0) break;
            const target = enemies[Math.floor(Math.random() * enemies.length)];
            if (target) {
                applyDamageToEnemy(target, L.dmg * sk.level * player.skillPower);
                addBolt(target.x, target.y);
                createParticles(target.x, target.y, '#facc15', 12);
            }
        }
        playSound('active');
    } else if (skillId === 'laser') {
        const sorted = [...enemies].sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
        const closest = sorted[0];
        const angle = closest ? Math.atan2(closest.y - player.y, closest.x - player.x) : player.facingAngle;
        const LZ = CONFIG.activeSkills.laser;
        skillFx.push({ t: 'beam', x: player.x, y: player.y, ang: angle, len: LZ.range, half: LZ.halfAngle, color: '#fb7185', life: 16, maxLife: 16 });
        enemies.forEach(e => {
            let d = Math.abs(Math.atan2(e.y - player.y, e.x - player.x) - angle) % (Math.PI * 2);
            if (d > Math.PI) d = Math.PI * 2 - d;
            if (d < LZ.halfAngle && Math.hypot(e.x - player.x, e.y - player.y) < LZ.range) {
                applyDamageToEnemy(e, LZ.dmg * sk.level * player.skillPower);
            }
        });
        screenShakeTime = Math.max(screenShakeTime, 4);
        playSound('active');
    } else if (skillId === 'nova') {
        const NV = CONFIG.activeSkills.nova;
        const r = NV.radiusBase + sk.level * NV.radiusPerLevel;
        skillFx.push({ t: 'ring', x: player.x, y: player.y, r, color: '#7dd3fc', life: 18, maxLife: 18 });
        enemies.forEach(e => {
            if (Math.hypot(e.x - player.x, e.y - player.y) < r + e.radius) {
                applyDamageToEnemy(e, NV.dmg * sk.level * player.skillPower);
                if (!(e.freezeImmune > 0)) { e.freezeTimer = Math.round(NV.freezeSec * (e.type === 'boss' ? 0.5 : 1) * 60); e.freezeImmune = Math.round(CONFIG.freeze.immuneSec * 60); }
            }
        });
        createParticles(player.x, player.y, '#7dd3fc', 26);
        screenShakeTime = Math.max(screenShakeTime, 5);
        playSound('active');
    } else if (skillId === 'meteor') {
        const MT = CONFIG.activeSkills.meteor;
        const count = MT.countBase + Math.ceil(sk.level / MT.levelsPerExtra);
        const pool = [...enemies].sort(() => Math.random() - 0.5);
        for (let i = 0; i < count; i++) {
            const t = pool[i];
            const px = t ? t.x : player.x + Math.cos(player.facingAngle) * 170 + (Math.random() - 0.5) * 80;
            const py = t ? t.y : player.y + Math.sin(player.facingAngle) * 170 + (Math.random() - 0.5) * 80;
            playerStrikes.push({ x: px, y: py, r: MT.radius, delay: MT.delayFrames, maxDelay: MT.delayFrames, dmg: MT.dmg * sk.level * player.skillPower });
        }
        playSound('active');
    } else if (skillId === 'shield') {
        player.shield = CONFIG.activeSkills.shield.absorbBase + CONFIG.activeSkills.shield.absorbPerLevel * sk.level;
        player.shieldTimer = CONFIG.activeSkills.shield.duration;
        skillFx.push({ t: 'ring', x: player.x, y: player.y, r: 70, color: '#60a5fa', life: 18, maxLife: 18 });
        createFloatingText(player.x, player.y - 30, `KHIÊN ${Math.round(player.shield)}`, '#60a5fa', 15);
        playSound('active');
    }

    const baseCd = sk.cd || 3.0;
    player.activeCdTimers[slotIndex] = Math.max(CONFIG.activeSkills.minCd, baseCd - (sk.level - 1) * CONFIG.activeSkills.cdReducePerLevel);
    playSound('active');
}

// Update Active Skill & Attack Buttons UI
function updateActiveButtonsUI() {
    // Normal Attack Overlay
    const normalOverlay = document.getElementById('normalAttackCdOverlay');
    if (player.normalAttackCd > 0) {
        normalOverlay.classList.remove('hidden');
        normalOverlay.innerText = `${player.normalAttackCd.toFixed(1)}s`;
    } else {
        normalOverlay.classList.add('hidden');
    }

    // Active Slots Overlay
    [0, 1].forEach(idx => {
        const btn = document.getElementById(`activeBtnSlot${idx}`);
        const icon = document.getElementById(`activeIconSlot${idx}`);
        const cdOverlay = document.getElementById(`activeCdOverlay${idx}`);
        const skillId = player.activeSlots[idx];

        if (skillId && player.skills[skillId].level > 0) {
            const sk = player.skills[skillId];
            icon.className = `fa-solid ${sk.icon} text-xl`;
            document.getElementById(`activeKeyHintSlot${idx}`).innerText = `${sk.mana} MP`;
            btn.style.opacity = player.mana < sk.mana ? '0.55' : '1';
            btn.classList.remove('text-gray-500', 'border-slate-700');
            btn.classList.add('text-amber-400', 'border-amber-500/60');

            const cd = player.activeCdTimers[idx];
            if (cd > 0) {
                cdOverlay.classList.remove('hidden');
                cdOverlay.innerText = `${cd.toFixed(1)}s`;
            } else {
                cdOverlay.classList.add('hidden');
            }
        } else {
            icon.className = 'fa-solid fa-lock text-xl';
            btn.classList.remove('text-amber-400', 'border-amber-500/60');
            btn.classList.add('text-gray-500', 'border-slate-700');
            cdOverlay.classList.add('hidden');
        }
    });
}

// Listeners
// Dùng pointerdown (không dùng click) để bấm được nút khi ngón tay khác đang giữ joystick
function bindTap(id, fn) {
    const el = document.getElementById(id);
    el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
    el.addEventListener('click', e => e.preventDefault());
    el.addEventListener('contextmenu', e => e.preventDefault());
}
bindTap('normalAttackBtn', () => triggerNormalAttack());
bindTap('activeBtnSlot0', () => triggerActiveSlot(0));
bindTap('activeBtnSlot1', () => triggerActiveSlot(1));

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' || e.code === 'KeyF') triggerNormalAttack();
    if (e.code === 'Digit1' || e.code === 'Numpad1' || e.code === 'KeyJ') triggerActiveSlot(0);
    if (e.code === 'Digit2' || e.code === 'Numpad2' || e.code === 'KeyK') triggerActiveSlot(1);
});
window.addEventListener('keyup', e => keys[e.code] = false);

// Touch Control Setup
const touchZone = document.getElementById('touchZone');
let joyTouchId = null;
function findJoyTouch(list) {
    for (const t of list) if (t.identifier === joyTouchId) return t;
    return null;
}
touchZone.addEventListener('touchstart', e => {
    if (joyTouchId !== null) return;
    const touch = e.changedTouches[0];
    joyTouchId = touch.identifier;
    touchStartPos = { x: touch.clientX, y: touch.clientY };
    touchCurrentPos = { x: touch.clientX, y: touch.clientY };
}, { passive: true });

touchZone.addEventListener('touchmove', e => {
    if (joyTouchId === null) return;
    const touch = findJoyTouch(e.changedTouches);
    if (touch) touchCurrentPos = { x: touch.clientX, y: touch.clientY };
}, { passive: true });

function endJoy(e) {
    if (joyTouchId === null) return;
    if (findJoyTouch(e.changedTouches)) {
        joyTouchId = null;
        touchStartPos = null;
        touchCurrentPos = null;
    }
}
touchZone.addEventListener('touchend', endJoy);
touchZone.addEventListener('touchcancel', endJoy);

let projectiles = [];
let slashFx = [];
let skillFx = [];
let goldDrops = [];
let bossProjectiles = [];
let enemies = [];
let xpGems = [];
let particles = [];
let damageTexts = [];
let activeBoss = null;
let orbitAngle = 0;

// Enemy & Boss Class Definition
class Enemy {
    constructor(x, y, type, affix = null) {
        const L = difficultyLevel();
        this.x = x;
        this.y = y;
        this.type = type;
        this.freezeTimer = 0;
        this.freezeImmune = 0;

        const C = CONFIG.enemies[type];
        this.radius = C.radius; this.speed = C.speed;
        this.xpValue = C.xp; this.damage = C.damage; this.color = C.color;
        this.defense = C.def + Math.floor(L * C.defPerLevel);
        if (type === 'boss') {
            const bossTier = Math.floor(L / CONFIG.survival.bossEveryLevels);
            this.maxHp = C.hp * Math.pow(C.hpTierMult, bossTier - 1);
            this.name = `TRÙM TỐI CAO (LV.${L})`;
            // Boss skill timers & charge state
            this.skillTimer1 = 0; // Ring shockwave bullet skill
            this.skillTimer2 = 0; // Charge / Dash skill
            this.isCharging = false;
            this.chargeVx = 0; this.chargeVy = 0; this.chargeDuration = 0;
            this.windup = 0; this.chargeAngle = 0; this.shieldTimer = 0;
        } else {
            this.maxHp = C.hp * (1 + (L - 1) * C.hpGrowth);
        }
        if (C.range) {
            this.range = C.range; this.shootCd = C.shootCd;
            this.projDmg = C.projDmg * (1 + (L - 1) * C.projGrowth);
            this.projSpeed = C.projSpeed; this.projColor = C.projColor;
        }

        if (type === 'boss' && gameMode === 'tower') {
            const info = bossInfo(towerFloor);
            this.maxHp = CONFIG.tower.boss.hpPerStep * (towerFloor / CONFIG.tower.bossEvery);
            this.defense = CONFIG.tower.boss.defBase + Math.floor(towerFloor * CONFIG.tower.boss.defPerFloor);
            this.xpValue = CONFIG.tower.boss.xp;
            this.damage *= 1 + (towerFloor - 1) * CONFIG.bossSkills.dmgPerFloor;
            this.name = `TẦNG ${towerFloor}: ${info.name}`;
            this.color = info.color;
            this.towerSkills = info.skills;
            this.skillIdx = 0; this.uniqueTimer = 2; this.spiralLeft = 0; this.spiralAng = 0;
        }
        this.gold = (type === 'boss' && gameMode === 'tower') ? CONFIG.tower.boss.gold : C.gold;
        if (gameMode === 'tower') {
            const dm = 1 + (towerFloor - 1) * CONFIG.tower.monsterDmgGrowth;
            this.damage *= dm; if (this.projDmg) this.projDmg *= dm;
        }
        const affs = Array.isArray(affix) ? affix : (affix ? [affix] : []);
        this.affixes = affs;
        this.shootTimer = Math.random() * 60;
        this.aimAngle = null;
        this.burnT = 0; this.poisonT = 0; this.burnDps = 0; this.poisonDps = 0;
        if (affs.includes('fast')) this.speed *= CONFIG.affix.fastSpeed;
        if (affs.includes('armored')) this.defense += CONFIG.affix.armorBonus;
        if (affs.includes('frenzy')) { this.damage *= CONFIG.affix.frenzyDmg; if (this.projDmg) this.projDmg *= CONFIG.affix.frenzyDmg; }
        this.hp = this.maxHp;
        this.hitTimer = 0;
    }

    update() {
        // Freeze status effect
        if (this.freezeImmune > 0) this.freezeImmune--;
        if (this.freezeTimer > 0) {
            this.freezeTimer--;
            if (this.hitTimer > 0) this.hitTimer--;
            return; // Frozen in place!
        }

        if (this.type === 'boss') {
            this.updateBossSkills();
        } else {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);

            if (this.affixes.includes('regen')) this.hp = Math.min(this.maxHp, this.hp + this.maxHp * CONFIG.affix.regenPct / 60);
            if (this.type === 'tank' && dist < 230) {   // Tank: giậm đất gây choáng
                this.stompT = (this.stompT || 0) + 1 / 60;
                if (this.stompT >= CONFIG.stun.tankStompInterval) {
                    this.stompT = 0;
                    hazards.push({ t: 'circle', x: this.x, y: this.y, r: CONFIG.stun.tankStompRadius, delay: 40, maxDelay: 40, dmg: CONFIG.stun.tankStompDmg, color: '#facc15', stun: CONFIG.stun.stompSec });
                }
            }

            if (this.range) {
                // Quái tầm xa: giữ khoảng cách và bắn
                let dir = 0;
                if (dist > this.range + 25) dir = 1; else if (dist < this.range - 50) dir = -1;
                if (dist > 0) {
                    this.x += (dx / dist) * this.speed * dir;
                    this.y += (dy / dist) * this.speed * dir;
                }
                this.shootTimer++;
                const warn = CONFIG.enemies.aimWarnFrames;
                // Khóa hướng bắn trước 36 khung hình và hiện đường dự đoán
                if (this.aimAngle == null && this.shootTimer >= this.shootCd - warn && dist < this.range + 120 && dist > 0) {
                    this.aimAngle = Math.atan2(dy, dx);
                    this.shootTimer = this.shootCd - warn;
                }
                if (this.aimAngle != null && this.shootTimer >= this.shootCd) {
                    bossProjectiles.push({
                        x: this.x, y: this.y,
                        vx: Math.cos(this.aimAngle) * this.projSpeed, vy: Math.sin(this.aimAngle) * this.projSpeed,
                        radius: this.type === 'mage' ? 10 : 5, damage: this.projDmg,
                        life: Math.ceil(AIM_LEN / this.projSpeed) + 5, color: this.projColor
                    });
                    this.shootTimer = 0;
                    this.aimAngle = null;
                }
            } else if (dist > 0) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
        }

        if (this.hitTimer > 0) this.hitTimer--;
    }

    updateBossSkills() {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (this.shieldTimer > 0) this.shieldTimer -= 1 / 60;

        // Đang lướt
        if (this.isCharging) {
            this.x += this.chargeVx;
            this.y += this.chargeVy;
            this.chargeDuration--;
            createParticles(this.x, this.y, '#ef4444', 3);
            if (this.chargeDuration <= 0) this.isCharging = false;
            return;
        }

        // Gồng chuẩn bị lướt (có đường dự đoán, hướng đã khóa)
        if (this.windup > 0) {
            this.windup--;
            if (this.windup === 0) {
                this.isCharging = true;
                this.chargeDuration = CONFIG.bossSkills.chargeFrames;
                this.chargeVx = Math.cos(this.chargeAngle) * CONFIG.bossSkills.chargeSpeed;
                this.chargeVy = Math.sin(this.chargeAngle) * CONFIG.bossSkills.chargeSpeed;
                screenShakeTime = 10;
                createFloatingText(this.x, this.y, 'CÀN QUÉT!', '#ef4444', 18);
                playSound('boss');
            }
            return;
        }

        // Normal movement towards player
        if (dist > 0) {
            const speed = (this.hp < this.maxHp * CONFIG.bossSkills.enrageHpPct) ? this.speed * CONFIG.bossSkills.enrageSpeedMult : this.speed; // Enrage speed
            this.x += (dx / dist) * speed;
            this.y += (dy / dist) * speed;
        }

        // Boss Skill 1: Radial Shockwave Bullets (Every 3.5s)
        this.skillTimer1 += 1 / 60;
        if (this.skillTimer1 >= CONFIG.bossSkills.radialInterval) {
            this.skillTimer1 = 0;
            const bulletCount = CONFIG.bossSkills.radialCount;
            for (let i = 0; i < bulletCount; i++) {
                const angle = (Math.PI * 2 / bulletCount) * i;
                bossProjectiles.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(angle) * CONFIG.bossSkills.radialSpeed,
                    vy: Math.sin(angle) * CONFIG.bossSkills.radialSpeed,
                    radius: 7, damage: CONFIG.bossSkills.radialDmg * (gameMode === 'tower' ? 1 + (towerFloor - 1) * CONFIG.bossSkills.dmgPerFloor : 1), life: 180, color: '#f43f5e'
                });
            }
            playSound('boss');
        }

        // Boss Skill 2: Lướt có báo trước (mỗi 6s)
        this.skillTimer2 += 1 / 60;
        if (this.skillTimer2 >= CONFIG.bossSkills.chargeInterval && dist > 80) {
            this.skillTimer2 = 0;
            this.windup = CONFIG.bossSkills.windupFrames;
            this.chargeAngle = Math.atan2(dy, dx);
            createFloatingText(this.x, this.y - 60, '⚠ LƯỚT!', '#fbbf24', 16);
        }

        if (this.towerSkills) this.updateTowerSkills();
    }

    updateTowerSkills() {
        // Hố đen hút người chơi
        if (this.pullT > 0) {
            this.pullT--;
            const pdx = this.x - player.x, pdy = this.y - player.y, pd = Math.hypot(pdx, pdy);
            if (pd > 70) { player.x += pdx / pd * 2.4; player.y += pdy / pd * 2.4; }
            if (this.pullT % 20 === 0) skillFx.push({ t: 'ring', x: this.x, y: this.y, r: 260, color: '#a855f7', life: 18, maxLife: 18 });
        }
        // Đạn xoắn ốc đang bắn
        if (this.spiralLeft > 0) {
            this.spiralLeft--;
            if (this.spiralLeft % 6 === 0) {
                this.spiralAng += 0.55;
                bossProjectiles.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(this.spiralAng) * 4.5, vy: Math.sin(this.spiralAng) * 4.5,
                    radius: 6, damage: CONFIG.bossSkills.spiralDmg * (1 + (towerFloor - 1) * CONFIG.bossSkills.dmgPerFloor), life: 170, color: '#38bdf8'
                });
            }
        }
        this.uniqueTimer += 1 / 60;
        const BS = CONFIG.bossSkills;
        const enrage = this.hp < this.maxHp * 0.5;
        let interval = Math.max(BS.minInterval, BS.towerInterval - towerFloor * BS.intervalDropPerFloor);
        if (enrage) interval *= 0.75;
        if (this.uniqueTimer >= interval) {
            this.uniqueTimer = 0;
            castBossSkill(this, this.towerSkills[this.skillIdx++ % this.towerSkills.length]);
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Đường dự đoán: cung thủ / pháp sư
        if (this.aimAngle != null && this.range) {
            const prog = Math.min(1, Math.max(0, (this.shootTimer - (this.shootCd - CONFIG.enemies.aimWarnFrames)) / CONFIG.enemies.aimWarnFrames));
            ctx.save();
            ctx.rotate(this.aimAngle);
            ctx.strokeStyle = this.projColor; ctx.globalAlpha = 0.25 + 0.55 * prog;
            ctx.lineWidth = this.type === 'mage' ? 4 : 2.5;
            ctx.setLineDash([12, 8]);
            ctx.beginPath(); ctx.moveTo(this.radius, 0); ctx.lineTo(AIM_LEN, 0); ctx.stroke();
            ctx.restore();
        }
        // Đường dự đoán: boss lướt
        if (this.windup > 0) {
            const prog = 1 - this.windup / CONFIG.bossSkills.windupFrames, len = CONFIG.bossSkills.chargeSpeed * CONFIG.bossSkills.chargeFrames;
            ctx.save();
            ctx.rotate(this.chargeAngle);
            ctx.fillStyle = `rgba(239,68,68,${0.12 + 0.25 * prog})`;
            ctx.fillRect(0, -this.radius, len, this.radius * 2);
            ctx.strokeStyle = 'rgba(248,113,113,.9)'; ctx.lineWidth = 2; ctx.setLineDash([10, 8]);
            ctx.strokeRect(0, -this.radius, len, this.radius * 2);
            ctx.restore();
        }

        // Frozen effect ring
        if (this.freezeTimer > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.hitTimer > 0 ? '#ffffff' : (this.freezeTimer > 0 ? '#7dd3fc' : this.color);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        if (this.type === 'boss') {
            // Boss Horns & Glow
            ctx.beginPath();
            ctx.arc(-16, -12, 8, 0, Math.PI * 2);
            ctx.arc(16, -12, 8, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(-4, -3, 3, 0, Math.PI * 2);
            ctx.arc(4, -3, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.shieldTimer > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 9, 0, Math.PI * 2);
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 5;
            ctx.stroke();
        }
        this.affixes.forEach((k, i) => {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 3 + i * 4, 0, Math.PI * 2);
            ctx.strokeStyle = AFFIX[k].color;
            ctx.lineWidth = 2;
            ctx.stroke();
        });
        if (this.burnT > 0) {
            ctx.beginPath(); ctx.arc(0, 0, this.radius + 4 + Math.random() * 3, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(251,146,60,.9)'; ctx.lineWidth = 3; ctx.stroke();
        }
        if (this.poisonT > 0) {
            ctx.beginPath(); ctx.arc(0, 0, this.radius + 7, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(132,204,22,.85)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
        }
        ctx.restore();
    }
}

function drawLingeringHazard(h) {
    ctx.save();
    const tele = h.delay > 0, prog = tele ? 1 - h.delay / h.maxDelay : 1;
    ctx.fillStyle = h.color; ctx.strokeStyle = h.color;
    if (h.t === 'zone') {
        ctx.globalAlpha = tele ? 0.1 + 0.2 * prog : 0.28 + 0.08 * Math.sin(Date.now() / 160);
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.85; ctx.lineWidth = 2; if (tele) ctx.setLineDash([10, 8]);
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.stroke();
    } else {
        ctx.translate(h.x, h.y); ctx.rotate(h.ang);
        ctx.globalAlpha = tele ? 0.1 + 0.2 * prog : 0.5;
        ctx.fillRect(0, -h.w / 2, h.len, h.w);
        ctx.globalAlpha = 0.9; ctx.lineWidth = 2; if (tele) ctx.setLineDash([10, 8]);
        ctx.strokeRect(0, -h.w / 2, h.len, h.w);
        if (!tele) { ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.8; ctx.fillRect(0, -h.w / 6, h.len, h.w / 3); }
    }
    ctx.restore();
}

function castBossSkill(b, name) {
    const dx = player.x - b.x, dy = player.y - b.y;
    const f = towerFloor, B = CONFIG.bossSkills;
    const sc = 1 + (f - 1) * B.dmgPerFloor;     // sát thương chiêu tăng theo tầng
    const ang0 = Math.atan2(dy, dx);
    const say = (t, c) => createFloatingText(b.x, b.y - 70, t, c, 16);
    if (name === 'summon') {
        const types = f <= 15 ? ['slime', 'soldier'] : (f <= 45 ? ['soldier', 'archer', 'tank', 'bat'] : ['tank', 'mage', 'orc', 'archer']);
        const n = B.summonCount + Math.floor(f / 25);
        for (let i = 0; i < n && enemies.length < 60; i++) {
            const ang = Math.random() * Math.PI * 2;
            enemies.push(new Enemy(b.x + Math.cos(ang) * 90, b.y + Math.sin(ang) * 90, types[Math.floor(Math.random() * types.length)]));
        }
        say('TRIỆU HỒI!', '#4ade80');
    } else if (name === 'meteors') {
        const n = f >= 50 ? B.finalMeteorCount : B.meteorCount;
        for (let i = 0; i < n; i++) {
            const ang = Math.random() * Math.PI * 2, rr = i === 0 ? 0 : 60 + Math.random() * 130;
            hazards.push({ t: 'circle', x: player.x + Math.cos(ang) * rr, y: player.y + Math.sin(ang) * rr, r: B.meteorRadius, delay: B.meteorDelay, maxDelay: B.meteorDelay, dmg: B.meteorDmg * sc, color: '#f97316' });
        }
        say('MƯA THIÊN THẠCH!', '#fb923c');
    } else if (name === 'beam') {
        const offs = f >= 50 ? [-0.4, 0, 0.4] : [0];
        offs.forEach(o => hazards.push({ t: 'beam', x: b.x, y: b.y, ang: ang0 + o, len: 760, w: B.beamWidth, delay: 60, maxDelay: 60, dmg: B.beamDmg * sc, color: '#f43f5e' }));
        say('TIA TỬ THẦN!', '#f43f5e');
    } else if (name === 'shield') {
        b.shieldTimer = B.shieldSec;
        say('GIÁP THÉP!', '#e2e8f0');
    } else if (name === 'slam') {
        hazards.push({ t: 'circle', x: b.x, y: b.y, r: B.slamRadius, delay: 55, maxDelay: 55, dmg: B.slamDmg * sc, color: '#facc15' });
        say('ĐẬP ĐẤT!', '#facc15');
    } else if (name === 'teleport') {
        const ang = Math.random() * Math.PI * 2;
        const dx2 = player.x + Math.cos(ang) * 130, dy2 = player.y + Math.sin(ang) * 130;
        hazards.push({ t: 'circle', x: dx2, y: dy2, r: 95, delay: 50, maxDelay: 50, dmg: B.teleportDmg * sc, color: '#38bdf8',
            onFire: h => { if (enemies.includes(b)) { b.x = h.x; b.y = h.y; } } });
        say('DỊCH CHUYỂN!', '#38bdf8');
    } else if (name === 'spiral') {
        b.spiralLeft = 150; b.spiralAng = Math.random() * 6;
        say('XOẮN ỐC!', '#38bdf8');
    } else if (name === 'fan') {          // loạt đạn quạt (có đường báo trước)
        const n = 9, spread = 1.3;
        for (let i = 0; i < n; i++) {
            const a = ang0 - spread / 2 + spread * i / (n - 1);
            hazards.push({ t: 'beam', x: b.x, y: b.y, ang: a, len: 700, w: 8, delay: 40, maxDelay: 40, dmg: 0, color: '#fb923c',
                onFire: h => bossProjectiles.push({ x: b.x, y: b.y, vx: Math.cos(h.ang) * 6, vy: Math.sin(h.ang) * 6, radius: 6, damage: B.fanDmg * sc, life: 130, color: '#fb923c' }) });
        }
        say('LOẠT ĐẠN!', '#fb923c');
    } else if (name === 'cross') {        // tia chữ thập
        const n = f >= 60 ? 8 : 4, off = Math.random() * 0.8;
        for (let i = 0; i < n; i++) hazards.push({ t: 'beam', x: b.x, y: b.y, ang: ang0 + off + i * (Math.PI * 2 / n), len: 720, w: 38, delay: 55, maxDelay: 55, dmg: B.crossDmg * sc, color: '#facc15' });
        say('TIA CHỮ THẬP!', '#facc15');
    } else if (name === 'pool') {         // vũng độc kéo dài
        for (let i = 0; i < 4; i++) {
            const ang = Math.random() * Math.PI * 2, rr = i === 0 ? 0 : 70 + Math.random() * 120;
            hazards.push({ t: 'zone', x: player.x + Math.cos(ang) * rr, y: player.y + Math.sin(ang) * rr, r: 80, delay: 50, maxDelay: 50, life: 300, tickEvery: 30, tickLeft: 30, dmg: B.poolDmg * sc, color: '#84cc16' });
        }
        say('VŨNG ĐỘC!', '#84cc16');
    } else if (name === 'stunwave') {     // sóng gây choáng
        hazards.push({ t: 'circle', x: b.x, y: b.y, r: 170, delay: 60, maxDelay: 60, dmg: 10 * sc, color: '#facc15', stun: B.stunSec });
        say('SÓNG CHOÁNG!', '#facc15');
    } else if (name === 'pull') {         // hố đen hút người chơi
        b.pullT = 110;
        say('HỐ ĐEN!', '#a855f7');
    } else if (name === 'sweep') {        // chùm tia quét vòng tròn
        const dir = Math.random() < 0.5 ? -1 : 1;
        hazards.push({ t: 'sweep', x: b.x, y: b.y, ang: ang0, len: 760, w: 34, delay: 45, maxDelay: 45, life: 150, spin: 0.026 * dir, tickEvery: 8, tickLeft: 8, dmg: B.sweepDmg * sc, color: '#f43f5e' });
        say('TIA QUÉT!', '#f43f5e');
    }
    playSound('boss');
}

function createParticles(x, y, color, count = 8) {
    if (settings.lowEnd) { count = Math.ceil(count * 0.35); if (particles.length > 50) return; }
    else if (particles.length > 400) return;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 20 + Math.random() * 15,
            maxLife: 35,
            color,
            radius: Math.random() * 3 + 2
        });
    }
}

function createFloatingText(x, y, text, color = '#facc15', size = 13) {
    if (settings.lowEnd && damageTexts.length > 8) return;
    damageTexts.push({
        x, y, text, color, size,
        life: 35, vy: -1.3
    });
}

// Update Skill Icons Bar
function updateActiveSkillsBar() {
    const container = document.getElementById('activeSkillsBar');
    container.innerHTML = '';

    Object.values(player.skills).forEach(sk => {
        if (sk.level > 0) {
            const badge = document.createElement('div');
            const isCyan = sk.color === 'cyan';
            badge.className = `flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black border flex-none ${
                isCyan ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 animate-pulse' : 'bg-slate-900/90 border-slate-700 text-slate-200'
            }`;
            badge.innerHTML = `<i class="fa-solid ${sk.icon}"></i> <span>Lv.${sk.level}</span>`;
            container.appendChild(badge);
        }
    });
}

// ===== Kỹ năng Cyan: có cooldown / chu kỳ bật-tắt =====
const FUSION_CFG = {
    fusion_blade:   { cd: CONFIG.fusion.blade.cd },
    fusion_thunder: { cd: CONFIG.fusion.thunder.cd },
    fusion_storm:   { active: CONFIG.fusion.storm.active, cd: CONFIG.fusion.storm.cd },
    fusion_vamp:    { active: CONFIG.fusion.vamp.active, cd: CONFIG.fusion.vamp.cd }
};
let fusionState = {};
function resetFusionState() {
    fusionState = { fusion_blade: { t: 1.5, on: false }, fusion_thunder: { t: 1, on: false }, fusion_storm: { t: CONFIG.fusion.storm.active, on: true }, fusion_vamp: { t: CONFIG.fusion.vamp.active, on: true } };
}
resetFusionState();
const stormOn = () => player.skills.fusion_storm.level > 0 && fusionState.fusion_storm.on;
const vampOn = () => player.skills.fusion_vamp.level > 0 && fusionState.fusion_vamp.on;

const _asb = document.getElementById('activeSkillsBar');
const fusionBarEl = document.createElement('div');
fusionBarEl.id = 'fusionBar';
fusionBarEl.className = 'flex gap-1 flex-wrap pointer-events-none';
_asb.parentNode.insertBefore(fusionBarEl, _asb.nextSibling);
let fusionBarTick = 0;
function updateFusionBar() {
    let html = '';
    Object.keys(FUSION_CFG).forEach(id => {
        const sk = player.skills[id];
        if (sk.level <= 0) return;
        const cfg = FUSION_CFG[id], st = fusionState[id], t = Math.max(0, st.t).toFixed(1);
        const label = cfg.active ? (st.on ? `BẬT ${t}s` : `HỒI ${t}s`) : (st.t > 0 ? `HỒI ${t}s` : 'SẴN SÀNG');
        const cls = (cfg.active && st.on) ? 'text-cyan-300 border-cyan-400' : 'text-slate-300 border-slate-600';
        html += `<div class="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[9px] font-black border bg-slate-950/80 ${cls}"><i class="fa-solid ${sk.icon}"></i>${label}</div>`;
    });
    if (fusionBarEl.innerHTML !== html) fusionBarEl.innerHTML = html;
}

function autoExecutePassiveWeapons() {
    Object.keys(FUSION_CFG).forEach(id => {
        if (player.skills[id].level <= 0) return;
        const cfg = FUSION_CFG[id], st = fusionState[id];
        st.t -= 1 / 60;
        if (cfg.active) {
            if (st.t <= 0) {
                st.on = !st.on; st.t = st.on ? cfg.active : cfg.cd;
                if (st.on) createFloatingText(player.x, player.y - 40, 'KÍCH HOẠT!', '#22d3ee', 14);
            }
            return;
        }
        if (st.t > 0) return;
        if (id === 'fusion_blade') {
            const FB = CONFIG.fusion.blade;
            for (let i = 0; i < FB.count; i++) {
                const angle = (Math.PI * 2 / FB.count) * i + gameTime;
                projectiles.push({
                    x: player.x, y: player.y,
                    vx: Math.cos(angle) * FB.speed, vy: Math.sin(angle) * FB.speed,
                    radius: 9, rawDamage: FB.dmg,
                    color: '#06b6d4', life: 100, isPiercing: true, hitSet: new Set(), trail: []
                });
            }
            playSound('shoot');
            st.t = cfg.cd;
        } else if (id === 'fusion_thunder') {
            if (enemies.length === 0) { st.t = 0.3; return; }
            const pool = [...enemies].sort(() => Math.random() - 0.5);
            for (let i = 0; i < Math.min(CONFIG.fusion.thunder.count, pool.length); i++) {
                const target = pool[i];
                applyDamageToEnemy(target, CONFIG.fusion.thunder.dmg);
                addBolt(target.x, target.y, '#22d3ee');
                createParticles(target.x, target.y, '#06b6d4', 16);
            }
            st.t = cfg.cd;
        }
    });
}

// Level Up Trigger
function triggerLevelUp(titleText) {
    gameState = 'LEVEL_UP';
    playSound('levelup');

    const modal = document.getElementById('levelUpModal');
    const container = document.getElementById('cardsContainer');
    document.getElementById('modalLevelTitle').innerText = titleText || `THĂNG CẤP ${player.level}!`;
    container.innerHTML = '';

    // Check Fusion Mythic Cards
    let fusionCards = [];
    fusionRecipes.forEach(rec => {
        if (player.skills[rec.id].level === 0 &&
            player.skills[rec.req1.id].level >= rec.req1.level &&
            player.skills[rec.req2.id].level >= rec.req2.level) {

            fusionCards.push({
                isFusion: true,
                rarity: 'mythic',
                title: `THẦN THOẠI: ${rec.name}`,
                desc: rec.desc,
                icon: rec.icon,
                apply: () => {
                    player.skills[rec.id].level = 1;
                    playSound('fusion');
                }
            });
        }
    });

    let available = cardPool.filter(c => c.canAppear());
    let choices = [];

    fusionCards.forEach(fc => choices.push(fc));

    // Chọn thẻ theo trọng số độ hiếm (Huyền Thoại rất hiếm)
    const rarityWeight = CONFIG.cardWeights;
    let pool = [...available];
    while (choices.length < 3 && pool.length) {
        const total = pool.reduce((a, c) => a + (rarityWeight[c.rarity] || 10), 0);
        let r = Math.random() * total, idx = 0;
        for (; idx < pool.length - 1; idx++) {
            r -= (rarityWeight[pool[idx].rarity] || 10);
            if (r <= 0) break;
        }
        const c = pool.splice(idx, 1)[0];
        const props = c.getProps();
        choices.push({ isFusion: false, rarity: c.rarity, title: props.title, desc: props.desc, icon: props.icon, apply: c.apply });
    }

    choices.forEach(card => {
        const rStyle = rarityConfig[card.rarity] || rarityConfig.common;
        const cardEl = document.createElement('div');
        cardEl.className = `glass-panel card-hover ${rStyle.class} p-4 rounded-3xl cursor-pointer flex flex-col items-center text-center relative overflow-hidden border-2 h-full justify-between min-h-[220px]`;

        cardEl.innerHTML = `
            <div class="w-full flex justify-end">
                <span class="px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider ${rStyle.badgeBg}">
                    ${rStyle.name}
                </span>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-slate-900/80 border border-white/20 flex items-center justify-center text-white text-xl shadow-md my-1.5">
                <i class="fa-solid ${card.icon}"></i>
            </div>
            <h3 class="text-sm font-extrabold text-white mb-1 leading-tight">${card.title}</h3>
            <p class="text-[11px] text-slate-300 leading-snug flex-1 mb-2">${card.desc}</p>
            <button class="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs uppercase tracking-wider border border-white/20">
                CHỌN THẺ NÀY
            </button>
        `;

        cardEl.addEventListener('click', () => {
            card.apply();
            updateActiveSkillsBar();
            modal.classList.add('hidden');
            if (gameState !== 'SWAP') { gameState = 'PLAYING'; afterCardResolved(); }
        });

        container.appendChild(cardEl);
    });

    modal.classList.remove('hidden');
}

function updateGame() {
    if (gameState !== 'PLAYING') return;

    gameTime += 1 / 60;

    if (player.normalAttackCd > 0) {
        player.normalAttackCd = Math.max(0, player.normalAttackCd - 1 / 60);
    }

    [0, 1].forEach(idx => {
        if (player.activeCdTimers[idx] > 0) {
            player.activeCdTimers[idx] = Math.max(0, player.activeCdTimers[idx] - 1 / 60);
        }
    });
    updateActiveButtonsUI();

    if (player.comboTimer > 0) {
        player.comboTimer -= 1 / 60;
        if (player.comboTimer <= 0) { player.comboStep = 0; updateWeaponUI(); }
    }

    // Player Movement
    let moveX = 0, moveY = 0;
    if (keys['KeyW'] || keys['ArrowUp']) moveY -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) moveY += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

    if (touchStartPos && touchCurrentPos) {
        const dx = touchCurrentPos.x - touchStartPos.x;
        const dy = touchCurrentPos.y - touchStartPos.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 10) {
            moveX = dx / dist;
            moveY = dy / dist;
        }
    }

    if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.7071;
        moveY *= 0.7071;
    }

    if (player.stunT > 0) { player.stunT--; moveX = 0; moveY = 0; }
    if (player.stunImmune > 0) player.stunImmune--;
    if (player.swingT > 0) player.swingT--;
    player.x += moveX * player.speed;
    player.y += moveY * player.speed;
    if (moveX !== 0 || moveY !== 0) player.facingAngle = Math.atan2(moveY, moveX);
    if (gameMode === 'tower') {
        const pd = Math.hypot(player.x, player.y), lim = ARENA_R - player.radius;
        if (pd > lim) { player.x *= lim / pd; player.y *= lim / pd; }
    }

    // Passive Regen Skill
    if (player.hp < player.maxHp) player.hp = Math.min(player.maxHp, player.hp + player.regen / 60);
    player.mana = Math.min(player.maxMana, player.mana + player.manaRegen / 60);
    if (player.shieldTimer > 0) { player.shieldTimer -= 1 / 60; if (player.shieldTimer <= 0) player.shield = 0; }

    autoExecutePassiveWeapons();
    if (++fusionBarTick % 6 === 0) updateFusionBar();

    // Orbit Blades Skill
    if (player.skills.orbit.level > 0 || stormOn()) {
        const isStorm = stormOn();
        orbitAngle += isStorm ? CONFIG.fusion.storm.speed : CONFIG.passives.orbit.speed;
        const orbitCount = isStorm ? CONFIG.fusion.storm.count : (CONFIG.passives.orbit.countBase + player.skills.orbit.level);
        const orbitRadius = isStorm ? CONFIG.fusion.storm.radius : CONFIG.passives.orbit.radius;

        for (let i = 0; i < orbitCount; i++) {
            const angle = orbitAngle + (Math.PI * 2 / orbitCount) * i;
            const bx = player.x + Math.cos(angle) * orbitRadius;
            const by = player.y + Math.sin(angle) * orbitRadius;

            enemies.forEach(e => {
                if (Math.hypot(e.x - bx, e.y - by) < e.radius + 14) {
                    applyDamageToEnemy(e, isStorm ? CONFIG.fusion.storm.dmg : CONFIG.passives.orbit.dmg, false, true);
                    if (isStorm) {
                        e.x += (player.x - e.x) * 0.03;
                        e.y += (player.y - e.y) * 0.03;
                    }
                }
            });
        }
    }

    // Aura Skill
    if (player.skills.aura.level > 0 || vampOn()) {
        const isVamp = vampOn();
        const auraRadius = isVamp ? CONFIG.fusion.vamp.radius : (CONFIG.passives.aura.radiusBase + player.skills.aura.level * CONFIG.passives.aura.radiusPerLevel);

        enemies.forEach(e => {
            if (Math.hypot(e.x - player.x, e.y - player.y) < auraRadius + e.radius) {
                applyDamageToEnemy(e, isVamp ? CONFIG.fusion.vamp.dmg : CONFIG.passives.aura.dmg, false, true);
                if (isVamp && Math.random() < 0.05) {
                    player.hp = Math.min(player.maxHp, player.hp + CONFIG.fusion.vamp.heal);
                }
            }
        });
    }

    // Player Projectiles
    projectiles.forEach((p, index) => {
        if (p.trail && !settings.lowEnd) { p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > 12) p.trail.shift(); }
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        enemies.forEach(e => {
            if (Math.hypot(e.x - p.x, e.y - p.y) < e.radius + p.radius) {
                if (p.hitSet) { if (p.hitSet.has(e)) return; p.hitSet.add(e); }
                applyDamageToEnemy(e, p.rawDamage, false, false, !!p.isBasic);
                if (!p.isPiercing) p.life = 0;
            }
        });

        if (p.life <= 0) projectiles.splice(index, 1);
    });

    // Boss Radial Projectiles
    bossProjectiles.forEach((bp, index) => {
        bp.x += bp.vx;
        bp.y += bp.vy;
        bp.life--;

        if (Math.hypot(player.x - bp.x, player.y - bp.y) < player.radius + bp.radius) {
            hurtPlayer(bp.damage);
            createParticles(bp.x, bp.y, bp.color, 8);
            bp.life = 0;
            if (player.hp <= 0) triggerGameOver();
        }

        if (bp.life <= 0) bossProjectiles.splice(index, 1);
    });

    // Vùng nguy hiểm của boss (có báo trước)
    hazards.forEach(h => {
        if (h.t === 'zone' || h.t === 'sweep') {   // vùng tồn tại lâu
            if (h.delay > 0) { h.delay--; return; }
            h.life--;
            if (h.t === 'sweep') h.ang += h.spin;
            if (--h.tickLeft <= 0) {
                h.tickLeft = h.tickEvery;
                const pdx = player.x - h.x, pdy = player.y - h.y;
                let hit;
                if (h.t === 'zone') hit = Math.hypot(pdx, pdy) < h.r + player.radius;
                else {
                    const c = Math.cos(h.ang), sn = Math.sin(h.ang);
                    const along = pdx * c + pdy * sn, side = Math.abs(-pdx * sn + pdy * c);
                    hit = along >= 0 && along <= h.len && side <= h.w / 2 + player.radius;
                }
                if (hit) {
                    hurtPlayer(h.dmg);
                    if (h.stun) stunPlayer(h.stun);
                    createParticles(player.x, player.y, h.color, 5);
                    if (player.hp <= 0 && gameState === 'PLAYING') triggerGameOver();
                }
            }
            return;
        }
        if (h.fired) { h.flash--; return; }
        if (--h.delay > 0) return;
        h.fired = true; h.flash = 12;
        let hit = false;
        const pdx = player.x - h.x, pdy = player.y - h.y;
        if (h.t === 'circle') hit = Math.hypot(pdx, pdy) < h.r + player.radius;
        else {
            const c = Math.cos(h.ang), sn = Math.sin(h.ang);
            const along = pdx * c + pdy * sn, side = Math.abs(-pdx * sn + pdy * c);
            hit = along >= 0 && along <= h.len && side <= h.w / 2 + player.radius;
        }
        if (hit) { hurtPlayer(h.dmg); createParticles(player.x, player.y, h.color, 10); if (h.stun) stunPlayer(h.stun); }
        if (h.onFire) h.onFire(h);
        screenShakeTime = Math.max(screenShakeTime, 4);
        if (player.hp <= 0 && gameState === 'PLAYING') triggerGameOver();
    });
    hazards = hazards.filter(h => (h.t === 'zone' || h.t === 'sweep') ? h.life > 0 : (!h.fired || h.flash > 0));

    // Tower: đếm ngược banner tầng rồi mới spawn quái
    if (gameMode === 'tower' && introTimer > 0) {
        introTimer--;
        if (introTimer === 0) { document.getElementById('floorBanner').classList.add('hidden'); spawnFloor(); }
    }

    // Enemy Spawning (chỉ Sinh Tồn)
    if (gameMode === 'survival' && Math.random() < CONFIG.survival.spawnChance) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.max(canvas.width, canvas.height) / 2 + 60;
        const spawnX = player.x + Math.cos(angle) * dist;
        const spawnY = player.y + Math.sin(angle) * dist;

        let type = 'slime';
        const r = Math.random();
        if (player.level >= CONFIG.survival.batFromLevel && r < CONFIG.survival.batChance) type = 'bat';
        else if (player.level >= CONFIG.survival.orcFromLevel && r < CONFIG.survival.orcChance) type = 'orc';

        enemies.push(new Enemy(spawnX, spawnY, type));
    }

    // FIX BUG: Check lastBossSpawnLevel so boss only spawns ONCE at level 10, 20, 30, etc.
    if (gameMode === 'survival' && player.level % CONFIG.survival.bossEveryLevels === 0 && player.lastBossSpawnLevel !== player.level && !activeBoss) {
        player.lastBossSpawnLevel = player.level;
        const boss = new Enemy(player.x + 350, player.y, 'boss');
        enemies.push(boss);
        activeBoss = boss;
        playSound('boss');
        screenShakeTime = 15;
        document.getElementById('bossHpContainer').classList.remove('hidden');
        document.getElementById('bossName').innerText = boss.name;
    }

    // Update Enemies
    enemies.forEach((e, index) => {
        tickStatus(e);
        e.update();
        if (gameMode === 'tower') {
            const ed = Math.hypot(e.x, e.y), el = ARENA_R - e.radius;
            if (ed > el) { e.x *= el / ed; e.y *= el / ed; }
        }

        // Player Hit
        if (Math.hypot(player.x - e.x, player.y - e.y) < player.radius + e.radius) {
            hurtPlayer(e.damage / 60);
            if (e.affixes.includes('stun')) stunPlayer(CONFIG.stun.contactSec);
            if (player.hp <= 0) triggerGameOver();
        }

        // Enemy Death
        if (e.hp <= 0) {
            killCount++;
            if (e.affixes.includes('explode')) {
                createParticles(e.x, e.y, '#fb923c', 22);
                if (Math.hypot(player.x - e.x, player.y - e.y) < CONFIG.affix.explodeRadius) hurtPlayer(CONFIG.affix.explodeDmg);
            }
            createParticles(e.x, e.y, e.color, 12);
            xpGems.push({ x: e.x, y: e.y, value: e.xpValue, radius: e.type === 'boss' ? 12 : 5 });
            if (gameMode === 'tower') goldDrops.push({ x: e.x + (Math.random() - 0.5) * 12, y: e.y + (Math.random() - 0.5) * 12, value: e.gold, radius: e.type === 'boss' ? 9 : 5 });

            if (e === activeBoss) {
                activeBoss = null;
                document.getElementById('bossHpContainer').classList.add('hidden');
            }
            enemies.splice(index, 1);
        }
    });

    for (let i = goldDrops.length - 1; i >= 0; i--) {
        const g = goldDrops[i];
        const gd = Math.hypot(player.x - g.x, player.y - g.y);
        if (gd < player.magnetRadius) { g.x += (player.x - g.x) * 0.14; g.y += (player.y - g.y) * 0.14; }
        if (gd < player.radius + g.radius) { player.gold += g.value; playSound('gem'); goldDrops.splice(i, 1); }
    }

    if (gameMode === 'tower' && floorActive && introTimer <= 0 && enemies.length === 0) {
        onFloorClear();
        return;
    }

    // XP Gems & Magnet Attraction
    xpGems.forEach((gem, index) => {
        const dist = Math.hypot(player.x - gem.x, player.y - gem.y);
        if (dist < player.magnetRadius) {
            gem.x += (player.x - gem.x) * 0.14;
            gem.y += (player.y - gem.y) * 0.14;
        }

        if (dist < player.radius + gem.radius) {
            const gainedXp = gem.value * player.xpMultiplier;
            player.xp += gainedXp;
            playSound('gem');
            xpGems.splice(index, 1);

            if (player.xp >= player.nextXp) {
                player.xp -= player.nextXp;
                player.level++;
                player.nextXp = Math.floor(player.nextXp * CONFIG.player.xpGrowth);
                onLevelUp();
            }
        }
    });

    // Update Boss HP UI
    if (activeBoss) {
        const pct = Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100);
        document.getElementById('bossHpBar').style.width = `${pct}%`;
        document.getElementById('bossHpText').innerText = `${Math.ceil(activeBoss.hp)} / ${Math.ceil(activeBoss.maxHp)}`;
    }

    slashFx = slashFx.filter(f => --f.life > 0);
    playerStrikes = playerStrikes.filter(st => {
        if (--st.delay > 0) return true;
        skillFx.push({ t: 'ring', x: st.x, y: st.y, r: st.r, color: '#fb923c', life: 18, maxLife: 18 });
        createParticles(st.x, st.y, '#fb923c', 18);
        screenShakeTime = Math.max(screenShakeTime, 5);
        enemies.forEach(e => { if (Math.hypot(e.x - st.x, e.y - st.y) < st.r + e.radius) applyDamageToEnemy(e, st.dmg); });
        return false;
    });
    skillFx = skillFx.filter(f => --f.life > 0);

    // Particles & Floating Text
    particles.forEach((pt, index) => {
        pt.x += pt.vx; pt.y += pt.vy; pt.life--;
        if (pt.life <= 0) particles.splice(index, 1);
    });

    damageTexts.forEach((dt, index) => {
        dt.y += dt.vy; dt.life--;
        if (dt.life <= 0) damageTexts.splice(index, 1);
    });

    // Update HUD Stats
    document.getElementById('hpBar').style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
    document.getElementById('hpText').innerText = `${Math.ceil(player.hp)} / ${player.maxHp}`;
    document.getElementById('xpBar').style.width = `${Math.min(100, (player.xp / player.nextXp) * 100)}%`;
    document.getElementById('playerLevelDisplay').innerText = `LV ${player.level}`;
    document.getElementById('killDisplay').innerText = killCount;
    document.getElementById('manaBar').style.width = `${(player.mana / player.maxMana) * 100}%`;
    document.getElementById('manaText').innerText = `${Math.floor(player.mana)} / ${player.maxMana}`;
    if (gameMode === 'tower') {
        document.getElementById('towerInfo').innerText = `TẦNG ${towerFloor}/${TOWER_MAX} • Còn ${enemies.length} quái • 💰 ${player.gold}`;
    }

    const m = Math.floor(gameTime / 60).toString().padStart(2, '0');
    const s = Math.floor(gameTime % 60).toString().padStart(2, '0');
    document.getElementById('timeDisplay').innerText = `${m}:${s}`;
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Screen Shake Effect
    if (screenShakeTime > 0) {
        screenShakeTime--;
        if (!settings.noShake) {
            ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
        }
    }

    ctx.translate(canvas.width / 2 - player.x, canvas.height / 2 - player.y);

    // Grid Background
    const gridSize = 80;
    const startX = Math.floor((player.x - canvas.width) / gridSize) * gridSize;
    const endX = Math.floor((player.x + canvas.width) / gridSize) * gridSize;
    const startY = Math.floor((player.y - canvas.height) / gridSize) * gridSize;
    const endY = Math.floor((player.y + canvas.height) / gridSize) * gridSize;

    ctx.strokeStyle = gameMode === 'tower' ? hexA(floorColor, 0.14) : '#1e293b';
    ctx.lineWidth = 1;
    for (let x = startX; x <= endX; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke();
    }
    for (let y = startY; y <= endY; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
    }

    if (gameMode === 'tower') {
        // Sàn tháp: màu theo boss / hiệu ứng đặc biệt của tầng
        ctx.beginPath(); ctx.arc(0, 0, ARENA_R, 0, Math.PI * 2);
        ctx.fillStyle = hexA(floorColor, 0.16); ctx.fill();
        ctx.strokeStyle = hexA(floorColor, 0.24); ctx.lineWidth = 2;
        [0.33, 0.66].forEach(k => { ctx.beginPath(); ctx.arc(0, 0, ARENA_R * k, 0, Math.PI * 2); ctx.stroke(); });
        for (let i = 0; i < 8; i++) {
            const a = i * Math.PI / 4;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * ARENA_R * 0.33, Math.sin(a) * ARENA_R * 0.33);
            ctx.lineTo(Math.cos(a) * ARENA_R, Math.sin(a) * ARENA_R);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.rect(player.x - canvas.width, player.y - canvas.height, canvas.width * 2, canvas.height * 2);
        ctx.arc(0, 0, ARENA_R, 0, Math.PI * 2, true);
        ctx.fillStyle = '#070a12';
        ctx.fill('evenodd');
        ctx.beginPath();
        ctx.arc(0, 0, ARENA_R, 0, Math.PI * 2);
        ctx.strokeStyle = floorColor;
        ctx.lineWidth = 4;
        ctx.shadowColor = floorColor; ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Draw Aura FX
    if (player.skills.aura.level > 0 || vampOn()) {
        const isVamp = vampOn();
        const r = isVamp ? CONFIG.fusion.vamp.radius : (CONFIG.passives.aura.radiusBase + player.skills.aura.level * CONFIG.passives.aura.radiusPerLevel);
        ctx.beginPath();
        ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isVamp ? 'rgba(6, 182, 212, 0.15)' : 'rgba(239, 68, 68, 0.08)';
        ctx.fill();
        ctx.strokeStyle = isVamp ? '#06b6d4' : 'rgba(239, 68, 68, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Draw Magnet Circle Indicator
    if (player.skills.magnet.level > 0) {
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.magnetRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Draw XP Gems
    xpGems.forEach(g => {
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
        ctx.fillStyle = g.radius > 5 ? '#facc15' : '#38bdf8';
        ctx.fill();
    });

    // Draw Hazards (vùng báo trước của boss)
    hazards.forEach(h => {
        if (h.t === 'zone' || h.t === 'sweep') { drawLingeringHazard(h); return; }
        ctx.save();
        if (!h.fired) {
            const prog = 1 - h.delay / h.maxDelay;
            ctx.fillStyle = h.color; ctx.strokeStyle = h.color;
            if (h.t === 'circle') {
                ctx.globalAlpha = 0.12 + 0.25 * prog;
                ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 0.85; ctx.lineWidth = 2; ctx.setLineDash([10, 8]);
                ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.stroke();
                ctx.setLineDash([]); ctx.globalAlpha = 0.6;
                ctx.beginPath(); ctx.arc(h.x, h.y, h.r * prog, 0, Math.PI * 2); ctx.stroke();
            } else {
                ctx.translate(h.x, h.y); ctx.rotate(h.ang);
                ctx.globalAlpha = 0.1 + 0.25 * prog;
                ctx.fillRect(0, -h.w / 2, h.len, h.w);
                ctx.globalAlpha = 0.85; ctx.lineWidth = 2; ctx.setLineDash([10, 8]);
                ctx.strokeRect(0, -h.w / 2, h.len, h.w);
            }
        } else {
            const al = h.flash / 12;
            ctx.fillStyle = h.color; ctx.shadowColor = h.color; ctx.shadowBlur = 20;
            if (h.t === 'circle') {
                ctx.globalAlpha = al * 0.7;
                ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.fill();
            } else {
                ctx.translate(h.x, h.y); ctx.rotate(h.ang);
                ctx.globalAlpha = al * 0.85;
                ctx.fillRect(0, -h.w / 2, h.len, h.w);
                ctx.fillStyle = '#fff'; ctx.globalAlpha = al;
                ctx.fillRect(0, -h.w / 6, h.len, h.w / 3);
            }
        }
        ctx.restore();
    });

    // Draw Player Meteors (báo trước + thiên thạch rơi)
    playerStrikes.forEach(st => {
        const prog = 1 - st.delay / st.maxDelay;
        ctx.save();
        ctx.fillStyle = '#fb923c'; ctx.strokeStyle = '#fb923c';
        ctx.globalAlpha = 0.1 + 0.2 * prog;
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.8; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
        ctx.shadowColor = '#f97316'; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(st.x, st.y - (1 - prog) * 320, 14, 0, Math.PI * 2); ctx.fillStyle = '#fdba74'; ctx.fill();
        ctx.restore();
    });

    // Draw Gold
    goldDrops.forEach(g => {
        ctx.beginPath(); ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24'; ctx.fill();
        ctx.strokeStyle = '#b45309'; ctx.lineWidth = 1.5; ctx.stroke();
    });

    // Draw Enemies
    enemies.forEach(e => e.draw());

    // Draw Player Projectiles
    projectiles.forEach(p => {
        if (p.isWave) {
            ctx.save();
            ctx.translate(p.x, p.y); ctx.rotate(p.ang);
            ctx.globalAlpha = 0.85 * Math.min(1, p.life / 20);
            ctx.lineCap = 'round'; ctx.strokeStyle = p.color; ctx.lineWidth = 9;
            ctx.shadowColor = p.color; ctx.shadowBlur = 14;
            ctx.beginPath(); ctx.arc(-26, 0, 56, -0.95, 0.95); ctx.stroke();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(-26, 0, 56, -0.8, 0.8); ctx.stroke();
            ctx.restore();
            return;
        }
        if (p.trail && p.trail.length > 1) {
            ctx.save();
            ctx.lineCap = 'round'; ctx.strokeStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 10;
            const n = p.trail.length;
            for (let i = 1; i < n; i++) {
                const k = i / n;
                ctx.globalAlpha = k * 0.7;
                ctx.lineWidth = Math.max(1, p.radius * 2 * k * (p.isArrow ? 0.8 : 1));
                ctx.beginPath();
                ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
                ctx.lineTo(p.trail[i].x, p.trail[i].y);
                ctx.stroke();
            }
            ctx.restore();
        }
        if (p.isArrow) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(Math.atan2(p.vy, p.vx));
            ctx.shadowColor = p.color; ctx.shadowBlur = 12;
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(8, 0); ctx.stroke();
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(6, -6); ctx.lineTo(6, 6); ctx.closePath(); ctx.fill();
            ctx.restore();
        } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    });

    // Draw Boss Projectiles
    bossProjectiles.forEach(bp => {
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, bp.radius, 0, Math.PI * 2);
        ctx.fillStyle = bp.color;
        ctx.shadowColor = bp.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Draw Orbit Blades
    if (player.skills.orbit.level > 0 || stormOn()) {
        const isStorm = stormOn();
        const count = isStorm ? CONFIG.fusion.storm.count : (CONFIG.passives.orbit.countBase + player.skills.orbit.level);
        const r = isStorm ? CONFIG.fusion.storm.radius : CONFIG.passives.orbit.radius;

        for (let i = 0; i < count; i++) {
            const angle = orbitAngle + (Math.PI * 2 / count) * i;
            const bx = player.x + Math.cos(angle) * r;
            const by = player.y + Math.sin(angle) * r;

            ctx.save();
            ctx.translate(bx, by);
            ctx.rotate(angle + Math.PI / 2);
            ctx.fillStyle = isStorm ? '#06b6d4' : '#f59e0b';
            ctx.beginPath();
            ctx.moveTo(0, -12); ctx.lineTo(6, 12); ctx.lineTo(-6, 12);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    // Draw Slash FX (quét qua nhanh)
    slashFx.forEach(f => {
        const el = f.maxLife - f.life;
        const e = 1 - Math.pow(1 - Math.min(1, el / 6), 3);
        const al = el < 6 ? 1 : Math.max(0, 1 - (el - 6) / (f.maxLife - 6));
        ctx.save();
        ctx.strokeStyle = f.color; ctx.fillStyle = f.color; ctx.lineCap = 'round';
        ctx.shadowColor = f.color; ctx.shadowBlur = 12;
        if (f.t === 'line') {
            const ex = f.x + Math.cos(f.ang) * f.len * e, ey = f.y + Math.sin(f.ang) * f.len * e;
            ctx.globalAlpha = al * 0.35; ctx.lineWidth = f.half * 2;
            ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(ex, ey); ctx.stroke();
            ctx.globalAlpha = al; ctx.lineWidth = 4; ctx.strokeStyle = '#fff';
            ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(ex, ey); ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(ex, ey, f.half * 0.5 + 4, 0, Math.PI * 2); ctx.fill();
        } else if (f.t === 'arc') {
            const dir = f.dir || 1;
            const start = f.ang - f.half * dir, head = start + 2 * f.half * dir * e;
            const a0 = Math.min(start, head), a1 = Math.max(start, head);
            ctx.globalAlpha = al * 0.25;
            ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.arc(f.x, f.y, f.r, a0, a1); ctx.closePath(); ctx.fill();
            ctx.globalAlpha = al; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.arc(f.x, f.y, f.r, a0, a1); ctx.stroke();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(f.x + Math.cos(head) * f.r * 0.3, f.y + Math.sin(head) * f.r * 0.3);
            ctx.lineTo(f.x + Math.cos(head) * f.r, f.y + Math.sin(head) * f.r);
            ctx.stroke();
        } else {
            const rr = f.r * e;
            ctx.globalAlpha = al * 0.25;
            ctx.beginPath(); ctx.arc(f.cx, f.cy, rr, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = al; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.arc(f.cx, f.cy, rr, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.restore();
    });

    if (player.shield > 0) {
        ctx.save();
        ctx.globalAlpha = 0.45 + 0.2 * Math.sin(Date.now() / 150);
        ctx.strokeStyle = '#60a5fa'; ctx.fillStyle = '#3b82f6'; ctx.lineWidth = 3;
        ctx.shadowColor = '#60a5fa'; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(player.x, player.y, player.radius + 9, 0, Math.PI * 2);
        ctx.globalAlpha *= 0.4; ctx.fill(); ctx.globalAlpha = 0.8; ctx.stroke();
        ctx.restore();
    }

    // Draw Skill FX (sét, laser)
    skillFx.forEach(f => {
        const al = f.life / f.maxLife;
        ctx.save();
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.shadowColor = f.color; ctx.shadowBlur = 18;
        if (f.t === 'bolt') {
            ctx.globalAlpha = al * 0.35; ctx.fillStyle = f.color;
            ctx.beginPath(); ctx.arc(f.x, f.y, 22 + (1 - al) * 40, 0, Math.PI * 2); ctx.fill();
            [[f.color, 7], ['#ffffff', 2.5]].forEach(([c, w]) => {
                ctx.globalAlpha = al; ctx.strokeStyle = c; ctx.lineWidth = w;
                ctx.beginPath();
                f.pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
                ctx.stroke();
            });
        } else if (f.t === 'ring') {
            const p = 1 - al, rr = f.r * (0.25 + 0.75 * (1 - Math.pow(1 - p, 3)));
            ctx.globalAlpha = al * 0.25; ctx.fillStyle = f.color;
            ctx.beginPath(); ctx.arc(f.x, f.y, rr, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = al; ctx.strokeStyle = f.color; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.arc(f.x, f.y, rr, 0, Math.PI * 2); ctx.stroke();
        } else {
            const L = f.len * Math.min(1, (f.maxLife - f.life) / 3);
            const ex = f.x + Math.cos(f.ang) * L, ey = f.y + Math.sin(f.ang) * L;
            ctx.globalAlpha = al * 0.12; ctx.fillStyle = f.color;
            ctx.beginPath(); ctx.moveTo(f.x, f.y);
            ctx.arc(f.x, f.y, L, f.ang - f.half, f.ang + f.half); ctx.closePath(); ctx.fill();
            ctx.globalAlpha = al * 0.6; ctx.strokeStyle = f.color; ctx.lineWidth = 24 * al + 4;
            ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(ex, ey); ctx.stroke();
            ctx.globalAlpha = al; ctx.strokeStyle = '#fff'; ctx.lineWidth = 8 * al + 1;
            ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(ex, ey); ctx.stroke();
        }
        ctx.restore();
    });

    // Draw Player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#facc15';
    ctx.fill();

    // Direction Pointer
    ctx.rotate(player.facingAngle);
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(8, -3, 3, 0, Math.PI * 2);
    ctx.arc(8, 3, 3, 0, Math.PI * 2);
    ctx.fill();
    // Vũ khí cầm trên tay
    {
        const wid = player.weapon, sw = player.swingT > 0 ? player.swingT / 9 : 0;
        ctx.save();
        if (wid === 'bow' || wid === 'staff') { ctx.translate(14 - sw * 4, wid === 'staff' ? 9 : 0); if (wid === 'staff') ctx.rotate(-0.15 * sw); }
        else if (wid === 'dual') { ctx.translate(8 + sw * 4, 0); ctx.rotate(-0.7 * sw); }
        else { ctx.translate(12 + sw * 5, 9); ctx.rotate(-1.1 * sw + 0.1); }
        drawWeaponShape(ctx, wid, 0.85);
        ctx.restore();
    }
    ctx.restore();
    if (player.stunT > 0) {
        const tt = Date.now() / 200;
        ctx.save(); ctx.fillStyle = '#fde047';
        for (let i = 0; i < 3; i++) {
            const ang = tt + i * 2.09;
            ctx.beginPath(); ctx.arc(player.x + Math.cos(ang) * 16, player.y - player.radius - 10 + Math.sin(ang) * 4, 3.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    // Draw Particles & Floating Texts
    particles.forEach(pt => {
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fillStyle = pt.color; ctx.globalAlpha = pt.life / pt.maxLife;
        ctx.fill(); ctx.globalAlpha = 1.0;
    });

    damageTexts.forEach(dt => {
        ctx.font = `black ${dt.size || 13}px Outfit, sans-serif`;
        ctx.fillStyle = dt.color;
        ctx.globalAlpha = dt.life / 35;
        ctx.fillText(dt.text, dt.x, dt.y);
        ctx.globalAlpha = 1.0;
    });

    ctx.restore();
}

function openPauseModal() {
    gameState = 'PAUSED';

    const skillsGrid = document.getElementById('inspectSkillsGrid');
    skillsGrid.innerHTML = '';
    Object.values(player.skills).forEach(sk => {
        if (sk.level > 0) {
            const isCyan = sk.color === 'cyan';
            const card = document.createElement('div');
            card.className = `p-2.5 rounded-xl border flex items-center gap-2.5 ${
                isCyan ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300' : 'bg-slate-900/80 border-slate-700 text-slate-200'
            }`;
            card.innerHTML = `
                <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-sm">
                    <i class="fa-solid ${sk.icon}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-xs font-bold truncate">${sk.name}</div>
                    <div class="text-[10px] text-amber-400 font-extrabold">Cấp ${sk.level}</div>
                </div>
            `;
            skillsGrid.appendChild(card);
        }
    });

    const fusionContainer = document.getElementById('fusionRecipesContainer');
    fusionContainer.innerHTML = '';
    fusionRecipes.forEach(rec => {
        const sk1 = player.skills[rec.req1.id];
        const sk2 = player.skills[rec.req2.id];
        const isUnlocked = player.skills[rec.id].level > 0;

        const item = document.createElement('div');
        item.className = `p-3 rounded-2xl border ${
            isUnlocked ? 'bg-cyan-950/80 border-cyan-400' : 'bg-slate-900/60 border-slate-800'
        } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs`;

        item.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-base">
                    <i class="fa-solid ${rec.icon}"></i>
                </div>
                <div>
                    <div class="font-black text-cyan-300">${rec.name}</div>
                    <div class="text-[10px] text-gray-400">${rec.desc}</div>
                </div>
            </div>
            <div class="flex items-center gap-2 text-[10px] font-bold">
                <span class="${sk1.level >= rec.req1.level ? 'text-emerald-400' : 'text-slate-500'}">${rec.req1.name} (Lv.${sk1.level}/${rec.req1.level})</span>
                <span class="text-slate-600">+</span>
                <span class="${sk2.level >= rec.req2.level ? 'text-emerald-400' : 'text-slate-500'}">${rec.req2.name} (Lv.${sk2.level}/${rec.req2.level})</span>
            </div>
        `;
        fusionContainer.appendChild(item);
    });

    document.getElementById('pauseModal').classList.remove('hidden');
}

document.getElementById('pauseBtn').addEventListener('click', () => { if (gameState === 'PLAYING') openPauseModal(); });
document.getElementById('resumeBtn').addEventListener('click', () => {
    document.getElementById('pauseModal').classList.add('hidden');
    gameState = 'PLAYING';
});

function triggerGameOver(win = false) {
    gameState = 'GAMEOVER';
    document.getElementById('finalLevel').innerText = `LV ${player.level}`;
    document.getElementById('finalKills').innerText = killCount;
    const t = document.getElementById('gameOverTitle'), sub = document.getElementById('gameOverSub');
    if (win) {
        t.innerText = 'CHIẾN THẮNG!'; t.className = 'text-2xl sm:text-3xl font-black text-amber-400 tracking-tight mb-1';
        sub.innerText = `Bạn đã chinh phục toàn bộ ${TOWER_MAX} tầng của Tòa Tháp!`;
    } else {
        t.innerText = 'BẠN ĐÃ HY SINH!'; t.className = 'text-2xl sm:text-3xl font-black text-red-500 tracking-tight mb-1';
        sub.innerText = gameMode === 'tower' ? `Bạn gục ngã ở tầng ${towerFloor}/${TOWER_MAX}...` : 'Đấu trường đã nuốt chửng linh hồn bạn...';
    }
    document.getElementById('gameOverOverlay').classList.remove('hidden');
}

// ===== Tower logic =====
function onLevelUp() {
    player.mana = player.maxMana;
    if (gameMode === 'tower') {
        player.skillPoints += CONFIG.stats.pointsPerLevel;
        playSound('levelup');
        createFloatingText(player.x, player.y - 30, `+${CONFIG.stats.pointsPerLevel} ĐIỂM KỸ NĂNG`, '#facc15', 16);
        updateStatsBtn();
    } else {
        triggerLevelUp();
    }
}

function showBanner(title, sub) {
    document.getElementById('floorBannerTitle').innerText = title;
    document.getElementById('floorBannerSub').innerHTML = sub;
    document.getElementById('floorBanner').classList.remove('hidden');
}

function startFloor(n) {
    towerFloor = n;
    player.x = 0; player.y = 0; player.stunT = 0;
    enemies = []; projectiles = []; bossProjectiles = []; xpGems = []; goldDrops = []; hazards = []; playerStrikes = [];
    floorActive = false;
    introTimer = Math.round(CONFIG.tower.introSec * 60);
    const lines = [], isBoss = n % CONFIG.tower.bossEvery === 0;
    floorAffixes = rollAffixes(n);     // hiệu ứng đặc biệt RANDOM
    if (isBoss) {
        const bi = bossInfo(n);
        floorColor = bi.color;
        lines.push(`<span style="color:${bi.color}">⚠ ${bi.name}</span><br><span class="text-red-300 text-xs">${bi.desc}</span>`);
    } else {
        floorColor = floorAffixes.length ? AFFIX[floorAffixes[0]].color : '#38bdf8';
        floorAffixes.forEach(k => lines.push(`<span style="color:${AFFIX[k].color}">${AFFIX[k].name}: ${AFFIX[k].desc}</span>`));
    }
    showBanner(`TẦNG ${n}`, lines.join('<br>') || 'Chuẩn bị chiến đấu!');
    playSound('boss');
}

function spawnFloor() {
    const f = towerFloor, isBoss = f % CONFIG.tower.bossEvery === 0;
    const types = ['slime'];
    Object.keys(CONFIG.tower.unlockFloor).forEach(t => { if (f >= CONFIG.tower.unlockFloor[t]) types.push(t); });
    let n = CONFIG.tower.firstFloorMonsters + Math.round((f - 1) * CONFIG.tower.monstersPerFloor);
    if (isBoss) n = Math.round(n * CONFIG.tower.bossFloorMonsterRatio);
    n = Math.min(n, CONFIG.tower.maxMonsters);
    const affix = isBoss ? null : floorAffixes;
    for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2, rr = ARENA_R * (0.55 + Math.random() * 0.35);
        const type = types[Math.floor(Math.random() * types.length)];
        enemies.push(new Enemy(Math.cos(ang) * rr, Math.sin(ang) * rr, type, affix));
    }
    if (isBoss) {
        const boss = new Enemy(0, -ARENA_R * 0.6, 'boss');
        enemies.push(boss);
        activeBoss = boss;
        screenShakeTime = 15;
        document.getElementById('bossHpContainer').classList.remove('hidden');
        document.getElementById('bossName').innerText = boss.name;
    }
    floorActive = true;
}

function onFloorClear() {
    floorActive = false;
    xpGems.forEach(g => { player.xp += g.value * player.xpMultiplier; });
    xpGems = [];
    const goldGain = goldDrops.reduce((a, g) => a + g.value, 0);
    player.gold += goldGain; goldDrops = [];
    if (goldGain > 0) createFloatingText(player.x, player.y - 50, `+${goldGain} vàng`, '#fbbf24', 15);
    while (player.xp >= player.nextXp) {
        player.xp -= player.nextXp;
        player.level++;
        player.nextXp = Math.floor(player.nextXp * CONFIG.player.xpGrowth);
        onLevelUp();
    }
    bossProjectiles = []; projectiles = []; hazards = []; playerStrikes = [];
    player.hp = Math.min(player.maxHp, player.hp + player.maxHp * CONFIG.tower.healOnClear);
    player.mana = player.maxMana;
    if (towerFloor >= TOWER_MAX) { pendingVictory = true; openShop(); return; }
    pendingNextFloor = true;
    triggerLevelUp(`HOÀN THÀNH TẦNG ${towerFloor}`);
}

function afterCardResolved() {
    if (pendingNextFloor) {
        pendingNextFloor = false;
        if (towerFloor % CONFIG.tower.shopEvery === 0) openShop(); else startFloor(towerFloor + 1);
    }
}


// ===== CÀI ĐẶT (UI) =====
function refreshSettingsUI() {
    document.getElementById('toggleLowEnd').classList.toggle('on', !!settings.lowEnd);
    document.getElementById('toggleNoShake').classList.toggle('on', !!settings.noShake);
}
document.querySelectorAll('.open-settings').forEach(b => b.addEventListener('click', () => {
    refreshSettingsUI();
    document.getElementById('settingsModal').classList.remove('hidden');
}));
document.getElementById('settingsCloseBtn').addEventListener('click', () => document.getElementById('settingsModal').classList.add('hidden'));
document.getElementById('toggleLowEnd').addEventListener('click', () => { settings.lowEnd = !settings.lowEnd; saveSettings(); applySettings(); refreshSettingsUI(); });
document.getElementById('toggleNoShake').addEventListener('click', () => { settings.noShake = !settings.noShake; saveSettings(); refreshSettingsUI(); });
refreshSettingsUI();

// ===== ADMIN PANEL =====
function recalcPassives() {
    const L = k => player.skills[k].level;
    player.speed = CONFIG.player.speed * Math.pow(CONFIG.passives.moveSpeedMult, L('move_speed'));
    player.maxHp = CONFIG.player.maxHp + CONFIG.passives.maxHpPerLevel * L('max_hp') + CONFIG.stats.hp * player.statLv.hp;
    player.hp = Math.min(player.hp, player.maxHp);
    player.magnetRadius = CONFIG.player.magnetRadius + CONFIG.passives.magnetPerLevel * L('magnet');
    player.xpMultiplier = CONFIG.player.xpMultiplier + CONFIG.passives.xpPerLevel * L('more_xp');
    player.regen = CONFIG.player.regen + CONFIG.passives.regenPerLevel * L('regen');
}
function refreshAfterAdmin() {
    updateActiveButtonsUI(); updateActiveSkillsBar(); updateWeaponUI(); updateStatsBtn(); renderAdmin();
}
function adminSetLevel(id, lv) {
    const sk = player.skills[id];
    sk.level = Math.max(0, Math.min(sk.maxLevel, lv));
    if (sk.type === 'active') {
        const idx = player.activeSlots.indexOf(id);
        if (sk.level === 0 && idx !== -1) player.activeSlots[idx] = null;
        if (sk.level > 0 && idx === -1) {
            let e = player.activeSlots.indexOf(null);
            if (e === -1) { e = 1; const old = player.activeSlots[e]; if (old) player.skills[old].level = 0; }
            player.activeSlots[e] = id; player.activeCdTimers[e] = 0;
        }
    }
    recalcPassives(); refreshAfterAdmin();
}
function adminEquip(id, slot) {
    const sk = player.skills[id];
    if (sk.level === 0) sk.level = 1;
    const cur = player.activeSlots.indexOf(id), displaced = player.activeSlots[slot];
    if (cur !== -1) player.activeSlots[cur] = displaced;
    else if (displaced) player.skills[displaced].level = 0;
    player.activeSlots[slot] = id;
    player.activeCdTimers[slot] = 0;
    refreshAfterAdmin();
}
function renderAdmin() {
    const body = document.getElementById('adminBody');
    body.innerHTML = '';
    const sec = t => { const h = document.createElement('div'); h.className = 'text-[11px] font-black uppercase tracking-wider text-amber-400 mt-1'; h.innerText = t; body.appendChild(h); };
    const btn = (label, on, fn, cls = '') => {
        const b = document.createElement('button');
        b.innerHTML = label;
        b.className = `px-2.5 py-1.5 rounded-lg text-[11px] font-black border ${on ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800 text-slate-200 border-slate-600'} ${cls}`;
        b.addEventListener('click', fn);
        return b;
    };
    const row = () => { const d = document.createElement('div'); d.className = 'flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-700'; return d; };
    const lvCtl = (id) => {
        const sk = player.skills[id], w = document.createElement('div');
        w.className = 'flex items-center gap-1.5';
        w.appendChild(btn('−', false, () => adminSetLevel(id, sk.level - 1)));
        const span = document.createElement('span');
        span.className = 'text-xs font-black text-white w-10 text-center'; span.innerText = `${sk.level}/${sk.maxLevel}`;
        w.appendChild(span);
        w.appendChild(btn('+', false, () => adminSetLevel(id, sk.level + 1)));
        return w;
    };

    sec('Vũ khí');
    const wr = document.createElement('div'); wr.className = 'flex flex-wrap gap-1.5';
    Object.keys(WEAPONS).forEach(k => wr.appendChild(btn(`<img src="${weaponIconURL(k)}" style="width:20px;height:20px;display:inline-block;vertical-align:middle"> ${WEAPONS[k].name}`, player.weapon === k, () => {
        player.weapon = k; player.comboStep = 0; player.comboTimer = 0; refreshAfterAdmin();
    })));
    body.appendChild(wr);

    sec('Kỹ năng chủ động (Ô1 / Ô2)');
    ['dagger', 'lightning', 'laser', 'nova', 'meteor', 'shield'].forEach(id => {
        const sk = player.skills[id], r = row();
        const nm = document.createElement('div'); nm.className = 'text-xs font-bold text-white min-w-0 truncate'; nm.innerHTML = `<i class="fa-solid ${sk.icon} text-amber-400"></i> ${sk.name}`;
        r.appendChild(nm);
        const c = document.createElement('div'); c.className = 'flex items-center gap-1.5 flex-none';
        c.appendChild(lvCtl(id));
        [0, 1].forEach(slot => c.appendChild(btn(`Ô${slot + 1}`, player.activeSlots[slot] === id, () => adminEquip(id, slot))));
        r.appendChild(c); body.appendChild(r);
    });

    sec('Kỹ năng nội tại');
    Object.values(player.skills).filter(k => k.type === 'passive').forEach(sk => {
        const r = row();
        const nm = document.createElement('div'); nm.className = 'text-xs font-bold text-white min-w-0 truncate'; nm.innerHTML = `<i class="fa-solid ${sk.icon} text-slate-300"></i> ${sk.name}`;
        r.appendChild(nm); r.appendChild(lvCtl(sk.id)); body.appendChild(r);
    });

    sec('Thần Thoại (Cyan)');
    Object.values(player.skills).filter(k => k.type === 'fusion').forEach(sk => {
        const r = row();
        const nm = document.createElement('div'); nm.className = 'text-xs font-bold text-cyan-300 min-w-0 truncate'; nm.innerHTML = `<i class="fa-solid ${sk.icon}"></i> ${sk.name}`;
        r.appendChild(nm);
        r.appendChild(btn(sk.level > 0 ? 'ĐANG BẬT' : 'BẬT', sk.level > 0, () => adminSetLevel(sk.id, sk.level > 0 ? 0 : 1)));
        body.appendChild(r);
    });

    sec('Tiện ích');
    const u = document.createElement('div'); u.className = 'flex flex-wrap gap-1.5';
    u.appendChild(btn('+1000 💰', false, () => { player.gold += 1000; refreshAfterAdmin(); }));
    u.appendChild(btn('+10 điểm KN', false, () => { player.skillPoints += 10; refreshAfterAdmin(); }));
    u.appendChild(btn('Hồi đầy HP/Mana', false, () => { player.hp = player.maxHp; player.mana = player.maxMana; refreshAfterAdmin(); }));
    u.appendChild(btn('Max mọi nội tại', false, () => {
        Object.values(player.skills).filter(k => k.type === 'passive').forEach(k => k.level = k.maxLevel);
        recalcPassives(); refreshAfterAdmin();
    }));
    body.appendChild(u);
}
document.getElementById('adminBtn').addEventListener('click', () => {
    renderAdmin();
    document.getElementById('adminModal').classList.remove('hidden');
});
document.getElementById('adminCloseBtn').addEventListener('click', () => {
    document.getElementById('adminModal').classList.add('hidden');
    openPauseModal();
});

// ===== CỬA HÀNG =====
let shopTimeLeft = 0, pendingVictory = false, lastFrameTs = 0;
const shopItems = [
    { kind: 'weapon', weapon: 'sword',  price: 250, desc: 'Đâm thẳng → chém cung → đâm rộng. Tầm xa, sát thương cao.' },
    { kind: 'weapon', weapon: 'hammer', price: 300, desc: 'Đập vùng tròn nhỏ → chém cung → xoay vòng quanh người.' },
    { kind: 'weapon', weapon: 'dual',   price: 350, desc: 'Chém cung → chém chữ X → chém trước & sau. Đánh nhanh.' },
    { kind: 'weapon', weapon: 'bow',    price: 250, desc: 'Bắn rất xa, mũi tên xuyên mục tiêu, sát thương cao, có vệt sáng.' },
    { kind: 'weapon', weapon: 'spear',  price: 300, desc: 'Đâm xa → quét cung dài → đâm 3 hướng.' },
    { kind: 'weapon', weapon: 'axe',    price: 320, desc: 'Chém cung → bổ vùng tròn → quét cung gần 270°.' },
    { kind: 'weapon', weapon: 'staff',  price: 350, desc: 'Cầu phép → 3 cầu phép → nổ phép vùng lớn lên mục tiêu.' },
    { kind: 'hp', name: 'Thuốc Hồi Máu', emoji: '🧪', price: 60, desc: 'Hồi 60% máu tối đa.' },
    { kind: 'mp', name: 'Thuốc Hồi Mana', emoji: '💧', price: 60, desc: 'Hồi đầy mana.' }
];

shopItems.forEach(it => {
    if (it.kind === 'weapon') it.price = CONFIG.shop.prices[it.weapon];
    else if (it.kind === 'hp') { it.price = CONFIG.shop.hpPotion.price; it.desc = `Hồi ${Math.round(CONFIG.shop.hpPotion.heal * 100)}% máu tối đa.`; }
    else if (it.kind === 'mp') it.price = CONFIG.shop.mpPotion.price;
});

function openShop() {
    gameState = 'SHOP';
    shopTimeLeft = CONFIG.tower.shopSeconds;
    renderShop();
    document.getElementById('shopModal').classList.remove('hidden');
}

function closeShop() {
    document.getElementById('shopModal').classList.add('hidden');
    if (pendingVictory) { pendingVictory = false; triggerGameOver(true); return; }
    gameState = 'PLAYING';
    startFloor(towerFloor + 1);
}

function renderShop() {
    document.getElementById('shopGold').innerText = player.gold;
    const box = document.getElementById('shopItems');
    box.innerHTML = '';
    shopItems.forEach(it => {
        const isW = it.kind === 'weapon';
        const w = isW ? WEAPONS[it.weapon] : null;
        const name = isW ? w.name : it.name, emoji = isW ? w.emoji : it.emoji;
        const owned = isW && player.weapon === it.weapon;
        const full = (it.kind === 'hp' && player.hp >= player.maxHp - 0.5) || (it.kind === 'mp' && player.mana >= player.maxMana - 0.5);
        const canBuy = !owned && !full && player.gold >= it.price;
        const el = document.createElement('div');
        el.className = 'p-2.5 rounded-2xl bg-slate-900/80 border flex flex-col gap-1';
        el.style.borderColor = isW ? w.color + '99' : '#334155';
        el.innerHTML = `<div class="flex items-center gap-2">${isW ? `<img src="${weaponIconURL(it.weapon)}" style="width:38px;height:38px" alt="">` : `<span class="text-2xl">${emoji}</span>`}
            <div class="min-w-0"><div class="text-xs font-black text-white">${name}</div>
            ${isW ? `<div class="text-[9px] text-gray-400">Sát thương ${w.dmg} • Hồi ${w.cd}s</div>` : ''}</div></div>
            <div class="text-[10px] text-slate-300 leading-snug flex-1">${it.desc}</div>`;
        const b = document.createElement('button');
        b.disabled = !canBuy;
        b.className = 'w-full py-1.5 rounded-xl font-black text-[11px] uppercase ' + (canBuy ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500');
        b.innerText = owned ? 'ĐANG DÙNG' : (full ? 'ĐÃ ĐẦY' : `💰 ${it.price}`);
        b.addEventListener('click', () => {
            if (!canBuy) return;
            player.gold -= it.price;
            if (isW) { player.weapon = it.weapon; player.comboStep = 0; player.comboTimer = 0; updateWeaponUI(); }
            else if (it.kind === 'hp') player.hp = Math.min(player.maxHp, player.hp + player.maxHp * CONFIG.shop.hpPotion.heal);
            else player.mana = player.maxMana;
            playSound('gem');
            renderShop();
        });
        el.appendChild(b);
        box.appendChild(el);
    });
}
document.getElementById('shopLeaveBtn').addEventListener('click', closeShop);

// ===== Stats (điểm kỹ năng) =====
const statDefs = [
    { key: 'hp', name: 'Máu', icon: 'fa-heart', color: 'text-rose-400', desc: () => `+${CONFIG.stats.hp} HP tối đa (hiện ${player.maxHp})`, apply: () => { player.maxHp += CONFIG.stats.hp; player.hp += CONFIG.stats.hp; } },
    { key: 'def', name: 'Thủ', icon: 'fa-shield', color: 'text-slate-300', desc: () => `Giảm ~8% sát thương nhận (Thủ ${player.defense})`, apply: () => { player.defense += CONFIG.stats.def; } },
    { key: 'atk', name: 'Công', icon: 'fa-hand-fist', color: 'text-orange-400', desc: () => `+${Math.round(CONFIG.stats.atk * 100)}% sát thương mọi đòn (hiện +${Math.round(player.statAtk * CONFIG.stats.atk * 100)}%)`, apply: () => { player.statAtk += 1; } },
    { key: 'skill', name: 'Kỹ năng', icon: 'fa-wand-magic-sparkles', color: 'text-cyan-400', desc: () => `+${Math.round(CONFIG.stats.skill * 100)}% sát thương kỹ năng chủ động (x${player.skillPower.toFixed(1)})`, apply: () => { player.skillPower += CONFIG.stats.skill; } },
    { key: 'mana', name: 'Mana', icon: 'fa-droplet', color: 'text-sky-400', desc: () => `+${CONFIG.stats.mana} mana tối đa, +${CONFIG.stats.manaRegen} hồi/giây (${player.maxMana})`, apply: () => { player.maxMana += CONFIG.stats.mana; player.manaRegen += CONFIG.stats.manaRegen; } }
];
function updateStatsBtn() {
    document.getElementById('statsBadge').innerText = player.skillPoints;
    document.getElementById('statsBtn').classList.toggle('animate-pulse', player.skillPoints > 0);
}
function renderStats() {
    document.getElementById('statsPoints').innerText = player.skillPoints;
    const box = document.getElementById('statsRows');
    box.innerHTML = '';
    statDefs.forEach(d => {
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-900/80 border border-slate-700';
        row.innerHTML = `<div class="flex items-center gap-2.5 min-w-0">
            <div class="w-9 h-9 rounded-xl bg-slate-800 ${d.color} flex items-center justify-center"><i class="fa-solid ${d.icon}"></i></div>
            <div class="min-w-0"><div class="text-xs font-black text-white">${d.name} <span class="text-amber-400">Lv.${player.statLv[d.key]}</span></div>
            <div class="text-[10px] text-gray-400">${d.desc()}</div></div></div>`;
        const b = document.createElement('button');
        b.innerText = '+';
        b.disabled = player.skillPoints <= 0;
        b.className = 'w-9 h-9 rounded-xl font-black text-lg flex-none ' + (b.disabled ? 'bg-slate-800 text-slate-600' : 'bg-amber-500 text-slate-950');
        b.addEventListener('click', () => {
            if (player.skillPoints <= 0) return;
            player.skillPoints--; player.statLv[d.key]++; d.apply();
            updateStatsBtn(); renderStats();
        });
        row.appendChild(b);
        box.appendChild(row);
    });
}
document.getElementById('statsBtn').addEventListener('click', () => {
    if (gameState !== 'PLAYING') return;
    gameState = 'STATS';
    renderStats();
    document.getElementById('statsModal').classList.remove('hidden');
});
document.getElementById('statsCloseBtn').addEventListener('click', () => {
    document.getElementById('statsModal').classList.add('hidden');
    gameState = 'PLAYING';
});

function resetGame(mode) {
    if (typeof mode === 'string') gameMode = mode;
    player.x = gameMode === 'tower' ? 0 : canvas.width / 2;
    player.y = gameMode === 'tower' ? 0 : canvas.height / 2;
    player.hp = CONFIG.player.maxHp;
    player.maxHp = CONFIG.player.maxHp;
    player.level = 1;
    player.xp = 0;
    player.nextXp = CONFIG.player.firstLevelXp;
    player.speed = CONFIG.player.speed;
    player.regen = CONFIG.player.regen;
    player.magnetRadius = CONFIG.player.magnetRadius;
    player.xpMultiplier = CONFIG.player.xpMultiplier;
    player.lastBossSpawnLevel = 0; // Reset boss tracker

    player.activeSlots = ['dagger', null];
    player.activeCdTimers = [0, 0];

    Object.keys(player.skills).forEach(k => {
        player.skills[k].level = (k === 'dagger') ? 1 : 0;
    });

    enemies = []; projectiles = []; bossProjectiles = []; xpGems = []; particles = []; damageTexts = []; slashFx = []; skillFx = []; goldDrops = []; hazards = []; playerStrikes = []; resetFusionState(); player.shield = 0; player.shieldTimer = 0; player.stunT = 0; player.stunImmune = 0; player.swingT = 0; floorAffixes = []; floorColor = '#38bdf8';
    activeBoss = null; gameTime = 0; killCount = 0;

    document.getElementById('bossHpContainer').classList.add('hidden');
    document.getElementById('gameOverOverlay').classList.add('hidden');
    document.getElementById('startOverlay').classList.add('hidden');
    document.getElementById('pauseModal').classList.add('hidden');
    document.getElementById('swapSkillModal').classList.add('hidden');

    player.mana = CONFIG.player.mana; player.maxMana = CONFIG.player.mana; player.manaRegen = CONFIG.player.manaRegen;
    player.defense = 0; player.skillPoints = 0; player.skillPower = 1; player.statAtk = 0;
    player.statLv = { hp: 0, def: 0, atk: 0, skill: 0, mana: 0 };
    floorActive = false; pendingNextFloor = false; introTimer = 0; towerFloor = 1;
    pendingVictory = false; player.gold = 0;
    player.weapon = (k => k[Math.floor(Math.random() * k.length)])(Object.keys(WEAPONS));
    player.comboStep = 0; player.comboTimer = 0;
    document.getElementById('shopModal').classList.add('hidden');
    updateWeaponUI();
    document.getElementById('statsModal').classList.add('hidden');
    document.getElementById('floorBanner').classList.add('hidden');
    const isTower = gameMode === 'tower';
    document.getElementById('statsBtn').style.display = isTower ? 'flex' : 'none';
    document.getElementById('towerInfo').style.display = isTower ? 'block' : 'none';
    updateStatsBtn();

    updateActiveSkillsBar();
    updateActiveButtonsUI();
    gameState = 'PLAYING';
    if (isTower) startFloor(1);
}

function gameLoop(ts) {
    const dt = lastFrameTs ? Math.min(0.1, (ts - lastFrameTs) / 1000) : 0;
    lastFrameTs = ts;
    if (gameState === 'SHOP') {
        shopTimeLeft -= dt;
        document.getElementById('shopTimer').innerText = Math.max(0, Math.ceil(shopTimeLeft));
        if (shopTimeLeft <= 0) closeShop();
    }
    updateGame();
    render();
    requestAnimationFrame(gameLoop);
}

document.getElementById('startBtn').addEventListener('click', () => resetGame('survival'));
document.getElementById('startTowerBtn').addEventListener('click', () => resetGame('tower'));
document.getElementById('restartBtn').addEventListener('click', () => resetGame(gameMode));
document.getElementById('menuBtn').addEventListener('click', () => {
    document.getElementById('gameOverOverlay').classList.add('hidden');
    document.getElementById('startOverlay').classList.remove('hidden');
    gameState = 'START';
});

window.onload = () => {
    requestAnimationFrame(gameLoop);
};
    
