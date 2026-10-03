        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

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
        const ARENA_R = 340, TOWER_MAX = 30;
        let towerFloor = 1, introTimer = 0, floorActive = false, pendingNextFloor = false;
        const AFFIX = {
            fast:    { name: 'CUỒNG TỐC', desc: 'Quái di chuyển nhanh hơn', color: '#38bdf8' },
            armored: { name: 'GIÁP SẮT', desc: 'Quái có giáp dày hơn', color: '#94a3b8' },
            regen:   { name: 'TÁI SINH', desc: 'Quái tự hồi máu', color: '#4ade80' },
            explode: { name: 'TỰ BẠO', desc: 'Quái phát nổ khi chết', color: '#fb923c' },
            frenzy:  { name: 'CUỒNG NỘ', desc: 'Quái gây thêm 50% sát thương', color: '#f43f5e' }
        };
        const towerAffix = { 3:'fast', 7:'armored', 8:'frenzy', 9:'regen', 12:'explode', 13:'fast', 14:'frenzy', 16:'regen', 17:'armored', 19:'regen', 21:'fast', 22:'explode', 24:'armored', 26:'explode', 27:'frenzy', 28:'armored', 29:'frenzy' };
        function difficultyLevel() { return gameMode === 'tower' ? 1 + (towerFloor - 1) * 0.7 : player.level; }
        function hurtPlayer(amount) { player.hp -= amount * 100 / (100 + player.defense * 8); }

        // Player Data & Skill Registry
        const player = {
            x: 0,
            y: 0,
            radius: 18,
            speed: 3.6,
            hp: 100,
            maxHp: 100,
            level: 1,
            xp: 0,
            nextXp: 100,
            regen: 0.2,            // HP regen per second
            magnetRadius: 110,     // Magnet attraction radius
            xpMultiplier: 1.0,     // More XP multiplier
            facingAngle: 0,
            normalAttackCd: 0,
            lastBossSpawnLevel: 0, // Fix boss repeated spawn bug!
            mana: 100, maxMana: 100, manaRegen: 1,
            defense: 0, skillPoints: 0, skillPower: 1, statAtk: 0,
            statLv: { hp: 0, def: 0, atk: 0, skill: 0, mana: 0 },
            weapon: 'sword', comboStep: 0, comboTimer: 0, gold: 0,

            // Skill Slots
            activeSlots: ['dagger', null],
            activeCdTimers: [0, 0],

            // Skill Registry
            skills: {
                // Active Skills
                dagger: { id: 'dagger', name: 'Dao Ma Thuật', level: 1, maxLevel: 5, icon: 'fa-wand-magic-sparkles', type: 'active', cd: 1.5, mana: 12 },
                lightning: { id: 'lightning', name: 'Sét Đánh', level: 0, maxLevel: 5, icon: 'fa-bolt-lightning', type: 'active', cd: 3.0, mana: 20 },
                laser: { id: 'laser', name: 'Tia Laser Tối Thượng', level: 0, maxLevel: 5, icon: 'fa-raygun', type: 'active', cd: 4.5, mana: 30 },

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

                // Mythic Fusions (Cyan)
                fusion_blade: { id: 'fusion_blade', name: 'Ma Kiếm Vô Song', level: 0, maxLevel: 1, icon: 'fa-ring', type: 'fusion', color: 'cyan' },
                fusion_storm: { id: 'fusion_storm', name: 'Thiên Tai Phong Bão', level: 0, maxLevel: 1, icon: 'fa-tornado', type: 'fusion', color: 'cyan' },
                fusion_thunder: { id: 'fusion_thunder', name: 'Lôi Thần Trừng Phạt', level: 0, maxLevel: 1, icon: 'fa-cloud-showers-heavy', type: 'fusion', color: 'cyan' },
                fusion_vamp: { id: 'fusion_vamp', name: 'Huyết Hào Quang', level: 0, maxLevel: 1, icon: 'fa-ankh', type: 'fusion', color: 'cyan' }
            },

            // Helper methods for damage calculations
            getDamageMultiplier() {
                // Fix bug: Properly apply damage boost (+25% per level)
                return 1 + (this.skills.damage.level * 0.25) + this.statAtk * 0.08;
            },
            getCritChance() {
                return 0.05 + (this.skills.crit.level * 0.08); // Base 5% + 8% per level
            },
            getCritMultiplier() {
                return 2.0; // 200% damage on crit
            },
            getTrueDmgChance() {
                return this.skills.true_dmg.level * 0.12; // 12% per level
            },
            getLifestealPercent() {
                return this.skills.lifesteal.level * 0.01; // 1% per level (đã giảm)
            },
            getFreezeChance() {
                return this.skills.freeze.level * 0.08; // 8% per level
            }
        };

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
                getProps: () => ({ title: player.skills.damage.level === 0 ? 'Sức Mạnh Cuồng Thần' : `Sức Mạnh Cuồng Thần (Lv.${player.skills.damage.level + 1})`, desc: 'Nội tại: Gia tăng +25% Tổng sát thương cho mọi chiêu thức.', icon: 'fa-hand-fist' }),
                canAppear: () => player.skills.damage.level < player.skills.damage.maxLevel,
                apply: () => player.skills.damage.level++
            },
            {
                id: 'move_speed', rarity: 'common',
                getProps: () => ({ title: player.skills.move_speed.level === 0 ? 'Thần Tốc' : `Thần Tốc (Lv.${player.skills.move_speed.level + 1})`, desc: 'Nội tại: Tăng +12% Tốc độ di chuyển.', icon: 'fa-person-running' }),
                canAppear: () => player.skills.move_speed.level < player.skills.move_speed.maxLevel,
                apply: () => { player.skills.move_speed.level++; player.speed *= 1.12; }
            },
            {
                id: 'max_hp', rarity: 'master',
                getProps: () => ({ title: player.skills.max_hp.level === 0 ? 'Sinh Lực Bền Vững' : `Sinh Lực Bền Vững (Lv.${player.skills.max_hp.level + 1})`, desc: 'Nội tại: Tăng +40 HP tối đa và hồi ngay 50% HP.', icon: 'fa-heart-pulse' }),
                canAppear: () => player.skills.max_hp.level < player.skills.max_hp.maxLevel,
                apply: () => { player.skills.max_hp.level++; player.maxHp += 40; player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.5); }
            },

            // NEW SUPPORT & PASSIVE CARDS
            {
                id: 'magnet', rarity: 'common',
                getProps: () => ({ title: player.skills.magnet.level === 0 ? 'Nam Châm Thần Hỏa' : `Nam Châm Thần Hỏa (Lv.${player.skills.magnet.level + 1})`, desc: 'Bổ trợ: Mở rộng +50px phạm vi tự động hút XP từ xa.', icon: 'fa-magnet' }),
                canAppear: () => player.skills.magnet.level < player.skills.magnet.maxLevel,
                apply: () => { player.skills.magnet.level++; player.magnetRadius += 50; }
            },
            {
                id: 'more_xp', rarity: 'rare',
                getProps: () => ({ title: player.skills.more_xp.level === 0 ? 'Tri Thức Uyển Chuyển' : `Tri Thức Uyển Chuyển (Lv.${player.skills.more_xp.level + 1})`, desc: 'Bổ trợ: Tăng thêm +25% lượng XP nhận được khi nhặt ngọc.', icon: 'fa-graduation-cap' }),
                canAppear: () => player.skills.more_xp.level < player.skills.more_xp.maxLevel,
                apply: () => { player.skills.more_xp.level++; player.xpMultiplier += 0.25; }
            },
            {
                id: 'regen', rarity: 'epic',
                getProps: () => ({ title: player.skills.regen.level === 0 ? 'Tự Chữa Lành' : `Tự Chữa Lành (Lv.${player.skills.regen.level + 1})`, desc: 'Nội tại: Hồi phục +0.3 HP mỗi giây liên tục.', icon: 'fa-kit-medical' }),
                canAppear: () => player.skills.regen.level < player.skills.regen.maxLevel,
                apply: () => { player.skills.regen.level++; player.regen += 0.3; }
            },
            {
                id: 'lifesteal', rarity: 'master',
                getProps: () => ({ title: player.skills.lifesteal.level === 0 ? 'Huyết Ma Thuật' : `Huyết Ma Thuật (Lv.${player.skills.lifesteal.level + 1})`, desc: 'Nội tại: Chuyển 1% sát thương gây ra thành máu hồi phục.', icon: 'fa-vial' }),
                canAppear: () => player.skills.lifesteal.level < player.skills.lifesteal.maxLevel,
                apply: () => player.skills.lifesteal.level++
            },
            {
                id: 'freeze', rarity: 'rare',
                getProps: () => ({ title: player.skills.freeze.level === 0 ? 'Băng Trầm Băng Hàn' : `Băng Trầm Băng Hàn (Lv.${player.skills.freeze.level + 1})`, desc: 'Nội tại: +8% tỷ lệ đóng băng quái vật trong 1 giây.', icon: 'fa-snowflake' }),
                canAppear: () => player.skills.freeze.level < player.skills.freeze.maxLevel,
                apply: () => player.skills.freeze.level++
            },
            {
                id: 'crit', rarity: 'legendary',
                getProps: () => ({ title: player.skills.crit.level === 0 ? 'Tâm Mắt Khát Máu' : `Tâm Mắt Khát Máu (Lv.${player.skills.crit.level + 1})`, desc: 'Nội tại: +8% Tỷ lệ Chí Mạng (Chí mạng BỎ QUA lớp phòng ngự).', icon: 'fa-crosshairs' }),
                canAppear: () => player.skills.crit.level < player.skills.crit.maxLevel,
                apply: () => player.skills.crit.level++
            },
            {
                id: 'true_dmg', rarity: 'legendary',
                getProps: () => ({ title: player.skills.true_dmg.level === 0 ? 'Sát Thương Chuẩn' : `Sát Thương Chuẩn (Lv.${player.skills.true_dmg.level + 1})`, desc: 'Nội tại: +12% Tỷ lệ đòn đánh là Sát Thương Chuẩn (Bỏ qua giáp).', icon: 'fa-shield-virus' }),
                canAppear: () => player.skills.true_dmg.level < player.skills.true_dmg.maxLevel,
                apply: () => player.skills.true_dmg.level++
            }
        ];

        // Damage Calculation Engine with Defense, Crit & True Damage
        function applyDamageToEnemy(enemy, rawDamage, isMelee = false, isTick = false) {
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

            // Apply damage
            enemy.hp -= finalDamage;
            enemy.hitTimer = 6;

            // Apply Freeze chance
            // (đòn tick liên tục như Hào Quang/Lưỡi Đao không đóng băng; có thời gian miễn nhiễm để không bị khóa cứng)
            if (!isTick && !(enemy.freezeImmune > 0) && Math.random() < player.getFreezeChance()) {
                enemy.freezeTimer = enemy.type === 'boss' ? 30 : 60;
                enemy.freezeImmune = 240;
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
            hammer: { name: 'Búa',       emoji: '🔨', color: '#fb923c', dmg: 100, cd: 0.50, melee: true },
            dual:   { name: 'Song Kiếm', emoji: '⚔️', color: '#c084fc', dmg: 80,  cd: 0.28, melee: true },
            bow:    { name: 'Cung',      emoji: '🏹', color: '#4ade80', dmg: 140, cd: 0.60, melee: false }
        };
        const COMBO_PCT = [0.2, 0.5, 0.9];

        function getStrikeShapes(weapon, step, a, px, py) {
            const line = (len, half) => ({ t: 'line', ang: a, len, half });
            const arc = (r, half, ang, dir = 1) => ({ t: 'arc', ang, r, half, dir });
            const circ = (off, r) => ({ t: 'circle', cx: px + Math.cos(a) * off, cy: py + Math.sin(a) * off, r });
            if (weapon === 'sword') return [[line(135, 18)], [arc(105, 1.35, a)], [line(150, 38)]][step];
            if (weapon === 'hammer') return [[circ(62, 46)], [arc(100, 1.3, a)], [circ(0, 115)]][step];
            return [ // dual
                [arc(90, 1.2, a)],
                [arc(95, 0.5, a + 0.7, -1), arc(95, 0.5, a - 0.7, 1)],
                [arc(95, 0.95, a), arc(95, 0.95, a + Math.PI)]
            ][step];
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

        function updateWeaponUI() {
            const w = WEAPONS[player.weapon];
            document.getElementById('weaponIcon').innerText = w.emoji;
            document.getElementById('weaponLabel').innerText = w.name;
            document.getElementById('normalAttackBtn').style.borderColor = w.color;
            const pips = document.getElementById('comboPips');
            pips.innerHTML = '';
            if (w.melee) for (let i = 0; i < 3; i++) {
                const d = document.createElement('span');
                d.style.cssText = `width:6px;height:6px;border-radius:50%;background:${i < player.comboStep ? w.color : 'rgba(255,255,255,.2)'}`;
                pips.appendChild(d);
            }
        }

        function triggerNormalAttack() {
            if (gameState !== 'PLAYING' || player.normalAttackCd > 0) return;
            const w = WEAPONS[player.weapon];
            player.normalAttackCd = w.cd;
            const a = player.facingAngle;

            if (!w.melee) { // Cung
                projectiles.push({
                    x: player.x, y: player.y,
                    vx: Math.cos(a) * 16, vy: Math.sin(a) * 16,
                    radius: 7, rawDamage: w.dmg, color: w.color,
                    life: 100, isPiercing: true, hitSet: new Set(), isArrow: true, trail: []
                });
                playSound('shoot');
                return;
            }

            const step = player.comboStep;
            const shapes = getStrikeShapes(player.weapon, step, a, player.x, player.y);
            enemies.slice().forEach(e => {
                if (shapes.some(sh => shapeHits(sh, player.x, player.y, e))) {
                    applyDamageToEnemy(e, w.dmg * COMBO_PCT[step], true);
                }
            });
            shapes.forEach(sh => slashFx.push({ ...sh, x: player.x, y: player.y, life: 14, maxLife: 14, color: w.color }));
            if (step === 2) screenShakeTime = Math.max(screenShakeTime, 3);
            player.comboStep = (step + 1) % 3;
            player.comboTimer = 1.4;
            updateWeaponUI();
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
                const count = 3 + sk.level * 2;
                for (let i = 0; i < count; i++) {
                    let angle = player.facingAngle + (Math.random() - 0.5) * 0.5;
                    if (targets[i]) angle = Math.atan2(targets[i].y - player.y, targets[i].x - player.x);

                    projectiles.push({
                        x: player.x, y: player.y,
                        vx: Math.cos(angle) * 10, vy: Math.sin(angle) * 10,
                        radius: 6, rawDamage: 40 * (1 + (sk.level - 1) * 0.3) * player.skillPower,
                        color: '#38bdf8', life: 100, trail: []
                    });
                }
                playSound('shoot');
            } else if (skillId === 'lightning') {
                const count = 2 + sk.level;
                for (let i = 0; i < count; i++) {
                    if (enemies.length === 0) break;
                    const target = enemies[Math.floor(Math.random() * enemies.length)];
                    if (target) {
                        applyDamageToEnemy(target, 90 * sk.level * player.skillPower);
                        addBolt(target.x, target.y);
                        createParticles(target.x, target.y, '#facc15', 12);
                    }
                }
                playSound('active');
            } else if (skillId === 'laser') {
                const sorted = [...enemies].sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
                const closest = sorted[0];
                const angle = closest ? Math.atan2(closest.y - player.y, closest.x - player.x) : player.facingAngle;
                skillFx.push({ t: 'beam', x: player.x, y: player.y, ang: angle, len: 650, half: 0.38, color: '#fb7185', life: 16, maxLife: 16 });
                enemies.forEach(e => {
                    let d = Math.abs(Math.atan2(e.y - player.y, e.x - player.x) - angle) % (Math.PI * 2);
                    if (d > Math.PI) d = Math.PI * 2 - d;
                    if (d < 0.38 && Math.hypot(e.x - player.x, e.y - player.y) < 650) {
                        applyDamageToEnemy(e, 160 * sk.level * player.skillPower);
                    }
                });
                screenShakeTime = Math.max(screenShakeTime, 4);
                playSound('active');
            }

            const baseCd = sk.cd || 3.0;
            player.activeCdTimers[slotIndex] = Math.max(0.6, baseCd - (sk.level - 1) * 0.2);
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

                if (type === 'slime') {
                    this.radius = 14;
                    this.speed = 1.6;
                    this.maxHp = 30 * (1 + (L - 1) * 0.25);
                    this.defense = 2 + Math.floor(L * 0.4); // Armor defense layer
                    this.color = '#34d399';
                    this.xpValue = 15;
                    this.damage = 10;
                } else if (type === 'bat') {
                    this.radius = 11;
                    this.speed = 2.7;
                    this.maxHp = 22 * (1 + (L - 1) * 0.22);
                    this.defense = 1 + Math.floor(L * 0.2);
                    this.color = '#c084fc';
                    this.xpValue = 22;
                    this.damage = 8;
                } else if (type === 'orc') {
                    this.radius = 22;
                    this.speed = 1.15;
                    this.maxHp = 90 * (1 + (L - 1) * 0.4);
                    this.defense = 6 + Math.floor(L * 0.8);
                    this.color = '#f87171';
                    this.xpValue = 45;
                    this.damage = 22;
                } else if (type === 'soldier') {
                    this.radius = 14; this.speed = 1.8;
                    this.maxHp = 38 * (1 + (L - 1) * 0.25);
                    this.defense = 1 + Math.floor(L * 0.2);
                    this.color = '#f59e0b'; this.xpValue = 18; this.damage = 14;
                } else if (type === 'tank') {
                    this.radius = 24; this.speed = 0.95;
                    this.maxHp = 130 * (1 + (L - 1) * 0.25);
                    this.defense = 10 + Math.floor(L * 0.9);
                    this.color = '#64748b'; this.xpValue = 40; this.damage = 7;
                } else if (type === 'archer') {
                    this.radius = 12; this.speed = 1.5;
                    this.maxHp = 28 * (1 + (L - 1) * 0.25);
                    this.defense = Math.floor(L * 0.15);
                    this.color = '#84cc16'; this.xpValue = 25; this.damage = 6;
                    this.range = 230; this.shootCd = 110; this.projDmg = 12 * (1 + (L - 1) * 0.06); this.projSpeed = 5.5; this.projColor = '#bef264';
                } else if (type === 'mage') {
                    this.radius = 13; this.speed = 1.3;
                    this.maxHp = 26 * (1 + (L - 1) * 0.25);
                    this.defense = 0;
                    this.color = '#e879f9'; this.xpValue = 35; this.damage = 6;
                    this.range = 190; this.shootCd = 170; this.projDmg = 30 * (1 + (L - 1) * 0.06); this.projSpeed = 3.2; this.projColor = '#d946ef';
                } else if (type === 'boss') {
                    // ENHANCED BOSS: Beefy HP, high defense & boss skills!
                    this.radius = 52;
                    this.speed = 1.35;
                    const bossTier = Math.floor(L / 10);
                    this.maxHp = 1800 * Math.pow(1.8, bossTier - 1); // Significantly higher HP!
                    this.defense = 15 + Math.floor(L * 1.5); // High Armor layer
                    this.color = '#dc2626';
                    this.xpValue = 1000;
                    this.damage = 35;
                    this.name = `TRÙM TỐI CAO (LV.${L})`;

                    // Boss skill timers & charge state
                    this.skillTimer1 = 0; // Ring shockwave bullet skill
                    this.skillTimer2 = 0; // Charge / Dash skill
                    this.isCharging = false;
                    this.chargeVx = 0;
                    this.chargeVy = 0;
                    this.chargeDuration = 0;
                }

                if (type === 'boss' && gameMode === 'tower') {
                    this.maxHp = 500 + towerFloor * 140;
                    this.defense = 8 + Math.floor(towerFloor * 0.9);
                    this.xpValue = 300;
                    this.name = `TRÙM TẦNG ${towerFloor}`;
                }
                this.gold = { slime: 4, bat: 5, soldier: 6, archer: 7, tank: 10, mage: 9, orc: 12, boss: 80 }[type] || 4;
                this.affix = affix;
                this.shootTimer = Math.random() * 60;
                if (affix === 'fast') this.speed *= 1.4;
                if (affix === 'armored') this.defense += 8;
                if (affix === 'frenzy') { this.damage *= 1.5; if (this.projDmg) this.projDmg *= 1.5; }
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

                    if (this.affix === 'regen') this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.02 / 60);

                    if (this.range) {
                        // Quái tầm xa: giữ khoảng cách và bắn
                        let dir = 0;
                        if (dist > this.range + 25) dir = 1; else if (dist < this.range - 50) dir = -1;
                        if (dist > 0) {
                            this.x += (dx / dist) * this.speed * dir;
                            this.y += (dy / dist) * this.speed * dir;
                        }
                        this.shootTimer++;
                        if (this.shootTimer >= this.shootCd && dist < this.range + 120 && dist > 0) {
                            this.shootTimer = 0;
                            bossProjectiles.push({
                                x: this.x, y: this.y,
                                vx: (dx / dist) * this.projSpeed, vy: (dy / dist) * this.projSpeed,
                                radius: this.type === 'mage' ? 10 : 5, damage: this.projDmg, life: 150, color: this.projColor
                            });
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

                // Handle Boss Dash/Charge state
                if (this.isCharging) {
                    this.x += this.chargeVx;
                    this.y += this.chargeVy;
                    this.chargeDuration--;

                    createParticles(this.x, this.y, '#ef4444', 3);

                    if (this.chargeDuration <= 0) {
                        this.isCharging = false;
                    }
                    return;
                }

                // Normal movement towards player
                if (dist > 0) {
                    const speed = (this.hp < this.maxHp * 0.3) ? this.speed * 1.4 : this.speed; // Enrage speed
                    this.x += (dx / dist) * speed;
                    this.y += (dy / dist) * speed;
                }

                // Boss Skill 1: Radial Shockwave Bullets (Every 3.5s)
                this.skillTimer1 += 1 / 60;
                if (this.skillTimer1 >= 3.5) {
                    this.skillTimer1 = 0;
                    const bulletCount = 12;
                    for (let i = 0; i < bulletCount; i++) {
                        const angle = (Math.PI * 2 / bulletCount) * i;
                        bossProjectiles.push({
                            x: this.x, y: this.y,
                            vx: Math.cos(angle) * 4.5,
                            vy: Math.sin(angle) * 4.5,
                            radius: 7, damage: 18, life: 180, color: '#f43f5e'
                        });
                    }
                    playSound('boss');
                }

                // Boss Skill 2: Targeted Charge Attack (Every 6s)
                this.skillTimer2 += 1 / 60;
                if (this.skillTimer2 >= 6.0 && dist > 80) {
                    this.skillTimer2 = 0;
                    this.isCharging = true;
                    this.chargeDuration = 35; // Dash duration
                    const chargeAngle = Math.atan2(dy, dx);
                    this.chargeVx = Math.cos(chargeAngle) * 7.5;
                    this.chargeVy = Math.sin(chargeAngle) * 7.5;
                    screenShakeTime = 10;
                    createFloatingText(this.x, this.y, 'CÀN QUÉT!', '#ef4444', 18);
                    playSound('boss');
                }
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);

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

                if (this.affix) {
                    ctx.beginPath();
                    ctx.arc(0, 0, this.radius + 3, 0, Math.PI * 2);
                    ctx.strokeStyle = AFFIX[this.affix].color;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                ctx.restore();
            }
        }

        function createParticles(x, y, color, count = 8) {
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

        // Auto Execute Passive Weapons
        function autoExecutePassiveWeapons() {
            // Mythic Fusion 1: Ma Kiếm Vô Song (Cyan)
            if (player.skills.fusion_blade.level > 0) {
                if (Math.random() < 0.05) {
                    for (let i = 0; i < 8; i++) {
                        const angle = (Math.PI * 2 / 8) * i + gameTime;
                        projectiles.push({
                            x: player.x, y: player.y,
                            vx: Math.cos(angle) * 10, vy: Math.sin(angle) * 10,
                            radius: 9, rawDamage: 85,
                            color: '#06b6d4', life: 120, isPiercing: true, trail: []
                        });
                    }
                    playSound('shoot');
                }
            }

            // Mythic Fusion 3: Lôi Thần Trừng Phạt (Cyan)
            if (player.skills.fusion_thunder.level > 0 && enemies.length > 0) {
                if (Math.random() < 0.22) {
                    const target = enemies[Math.floor(Math.random() * enemies.length)];
                    if (target) {
                        applyDamageToEnemy(target, 140);
                        addBolt(target.x, target.y, '#22d3ee');
                        createParticles(target.x, target.y, '#06b6d4', 16);
                    }
                }
            }
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
            const rarityWeight = { common: 50, rare: 30, epic: 14, master: 6, legendary: 1.2 };
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

            autoExecutePassiveWeapons();

            // Orbit Blades Skill
            if (player.skills.orbit.level > 0 || player.skills.fusion_storm.level > 0) {
                orbitAngle += player.skills.fusion_storm.level > 0 ? 0.08 : 0.04;
                const isStorm = player.skills.fusion_storm.level > 0;
                const orbitCount = isStorm ? 8 : (2 + player.skills.orbit.level);
                const orbitRadius = isStorm ? 120 : 80;

                for (let i = 0; i < orbitCount; i++) {
                    const angle = orbitAngle + (Math.PI * 2 / orbitCount) * i;
                    const bx = player.x + Math.cos(angle) * orbitRadius;
                    const by = player.y + Math.sin(angle) * orbitRadius;

                    enemies.forEach(e => {
                        if (Math.hypot(e.x - bx, e.y - by) < e.radius + 14) {
                            applyDamageToEnemy(e, isStorm ? 12 : 5, false, true);
                            if (isStorm) {
                                e.x += (player.x - e.x) * 0.03;
                                e.y += (player.y - e.y) * 0.03;
                            }
                        }
                    });
                }
            }

            // Aura Skill
            if (player.skills.aura.level > 0 || player.skills.fusion_vamp.level > 0) {
                const isVamp = player.skills.fusion_vamp.level > 0;
                const auraRadius = isVamp ? 130 : (85 + player.skills.aura.level * 12);

                enemies.forEach(e => {
                    if (Math.hypot(e.x - player.x, e.y - player.y) < auraRadius + e.radius) {
                        applyDamageToEnemy(e, isVamp ? 2.5 : 1.2, false, true);
                        if (isVamp && Math.random() < 0.05) {
                            player.hp = Math.min(player.maxHp, player.hp + 0.5);
                        }
                    }
                });
            }

            // Player Projectiles
            projectiles.forEach((p, index) => {
                if (p.trail) { p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > 12) p.trail.shift(); }
                p.x += p.vx;
                p.y += p.vy;
                p.life--;

                enemies.forEach(e => {
                    if (Math.hypot(e.x - p.x, e.y - p.y) < e.radius + p.radius) {
                        if (p.hitSet) { if (p.hitSet.has(e)) return; p.hitSet.add(e); }
                        applyDamageToEnemy(e, p.rawDamage);
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

            // Tower: đếm ngược banner tầng rồi mới spawn quái
            if (gameMode === 'tower' && introTimer > 0) {
                introTimer--;
                if (introTimer === 0) { document.getElementById('floorBanner').classList.add('hidden'); spawnFloor(); }
            }

            // Enemy Spawning (chỉ Sinh Tồn)
            if (gameMode === 'survival' && Math.random() < 0.04) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.max(canvas.width, canvas.height) / 2 + 60;
                const spawnX = player.x + Math.cos(angle) * dist;
                const spawnY = player.y + Math.sin(angle) * dist;

                let type = 'slime';
                const r = Math.random();
                if (player.level >= 3 && r < 0.4) type = 'bat';
                else if (player.level >= 5 && r < 0.25) type = 'orc';

                enemies.push(new Enemy(spawnX, spawnY, type));
            }

            // FIX BUG: Check lastBossSpawnLevel so boss only spawns ONCE at level 10, 20, 30, etc.
            if (gameMode === 'survival' && player.level % 10 === 0 && player.lastBossSpawnLevel !== player.level && !activeBoss) {
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
                e.update();
                if (gameMode === 'tower') {
                    const ed = Math.hypot(e.x, e.y), el = ARENA_R - e.radius;
                    if (ed > el) { e.x *= el / ed; e.y *= el / ed; }
                }

                // Player Hit
                if (Math.hypot(player.x - e.x, player.y - e.y) < player.radius + e.radius) {
                    hurtPlayer(e.damage / 60);
                    if (player.hp <= 0) triggerGameOver();
                }

                // Enemy Death
                if (e.hp <= 0) {
                    killCount++;
                    if (e.affix === 'explode') {
                        createParticles(e.x, e.y, '#fb923c', 22);
                        if (Math.hypot(player.x - e.x, player.y - e.y) < 85) hurtPlayer(18);
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
                        player.nextXp = Math.floor(player.nextXp * 1.28);
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
                const shakeX = (Math.random() - 0.5) * 8;
                const shakeY = (Math.random() - 0.5) * 8;
                ctx.translate(shakeX, shakeY);
            }

            ctx.translate(canvas.width / 2 - player.x, canvas.height / 2 - player.y);

            // Grid Background
            const gridSize = 80;
            const startX = Math.floor((player.x - canvas.width) / gridSize) * gridSize;
            const endX = Math.floor((player.x + canvas.width) / gridSize) * gridSize;
            const startY = Math.floor((player.y - canvas.height) / gridSize) * gridSize;
            const endY = Math.floor((player.y + canvas.height) / gridSize) * gridSize;

            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            for (let x = startX; x <= endX; x += gridSize) {
                ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke();
            }
            for (let y = startY; y <= endY; y += gridSize) {
                ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
            }

            if (gameMode === 'tower') {
                ctx.beginPath();
                ctx.rect(player.x - canvas.width, player.y - canvas.height, canvas.width * 2, canvas.height * 2);
                ctx.arc(0, 0, ARENA_R, 0, Math.PI * 2, true);
                ctx.fillStyle = '#070a12';
                ctx.fill('evenodd');
                ctx.beginPath();
                ctx.arc(0, 0, ARENA_R, 0, Math.PI * 2);
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 4;
                ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 14;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            // Draw Aura FX
            if (player.skills.aura.level > 0 || player.skills.fusion_vamp.level > 0) {
                const isVamp = player.skills.fusion_vamp.level > 0;
                const r = isVamp ? 130 : (85 + player.skills.aura.level * 12);
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
            if (player.skills.orbit.level > 0 || player.skills.fusion_storm.level > 0) {
                const isStorm = player.skills.fusion_storm.level > 0;
                const count = isStorm ? 8 : (2 + player.skills.orbit.level);
                const r = isStorm ? 120 : 80;

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
            ctx.restore();

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
                player.skillPoints += 3;
                playSound('levelup');
                createFloatingText(player.x, player.y - 30, '+3 ĐIỂM KỸ NĂNG', '#facc15', 16);
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
            player.x = 0; player.y = 0;
            enemies = []; projectiles = []; bossProjectiles = []; xpGems = []; goldDrops = [];
            floorActive = false;
            introTimer = 300; // 5 giây
            const lines = [];
            if (n % 5 === 0) lines.push('<span class="text-red-400">⚠ TRÙM XUẤT HIỆN</span>');
            if (towerAffix[n] && n % 5 !== 0) lines.push(`<span style="color:${AFFIX[towerAffix[n]].color}">${AFFIX[towerAffix[n]].name}: ${AFFIX[towerAffix[n]].desc}</span>`);
            showBanner(`TẦNG ${n}`, lines.join('<br>') || 'Chuẩn bị chiến đấu!');
            playSound('boss');
        }

        function spawnFloor() {
            const f = towerFloor, isBoss = f % 5 === 0;
            const types = ['slime'];
            if (f >= 2) types.push('soldier');
            if (f >= 3) types.push('bat');
            if (f >= 4) types.push('archer');
            if (f >= 6) types.push('tank');
            if (f >= 8) types.push('mage');
            let n = 4 + f;
            if (isBoss) n = Math.floor(n / 2);
            const affix = isBoss ? null : (towerAffix[f] || null);
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
                player.nextXp = Math.floor(player.nextXp * 1.28);
                onLevelUp();
            }
            bossProjectiles = []; projectiles = [];
            player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.3);
            player.mana = player.maxMana;
            if (towerFloor >= TOWER_MAX) { pendingVictory = true; openShop(); return; }
            pendingNextFloor = true;
            triggerLevelUp(`HOÀN THÀNH TẦNG ${towerFloor}`);
        }

        function afterCardResolved() {
            if (pendingNextFloor) {
                pendingNextFloor = false;
                if ([10, 20, 30].includes(towerFloor)) openShop(); else startFloor(towerFloor + 1);
            }
        }

        // ===== ADMIN PANEL =====
        function recalcPassives() {
            const L = k => player.skills[k].level;
            player.speed = 3.6 * Math.pow(1.12, L('move_speed'));
            player.maxHp = 100 + 40 * L('max_hp') + 25 * player.statLv.hp;
            player.hp = Math.min(player.hp, player.maxHp);
            player.magnetRadius = 110 + 50 * L('magnet');
            player.xpMultiplier = 1 + 0.25 * L('more_xp');
            player.regen = 0.2 + 0.3 * L('regen');
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
            Object.keys(WEAPONS).forEach(k => wr.appendChild(btn(`${WEAPONS[k].emoji} ${WEAPONS[k].name}`, player.weapon === k, () => {
                player.weapon = k; player.comboStep = 0; player.comboTimer = 0; refreshAfterAdmin();
            })));
            body.appendChild(wr);

            sec('Kỹ năng chủ động (Ô1 / Ô2)');
            ['dagger', 'lightning', 'laser'].forEach(id => {
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
            { kind: 'hp', name: 'Thuốc Hồi Máu', emoji: '🧪', price: 60, desc: 'Hồi 60% máu tối đa.' },
            { kind: 'mp', name: 'Thuốc Hồi Mana', emoji: '💧', price: 60, desc: 'Hồi đầy mana.' }
        ];

        function openShop() {
            gameState = 'SHOP';
            shopTimeLeft = 60;
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
                el.innerHTML = `<div class="flex items-center gap-2"><span class="text-2xl">${emoji}</span>
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
                    else if (it.kind === 'hp') player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.6);
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
            { key: 'hp', name: 'Máu', icon: 'fa-heart', color: 'text-rose-400', desc: () => `+25 HP tối đa (hiện ${player.maxHp})`, apply: () => { player.maxHp += 25; player.hp += 25; } },
            { key: 'def', name: 'Thủ', icon: 'fa-shield', color: 'text-slate-300', desc: () => `Giảm ~8% sát thương nhận (Thủ ${player.defense})`, apply: () => { player.defense += 1; } },
            { key: 'atk', name: 'Công', icon: 'fa-hand-fist', color: 'text-orange-400', desc: () => `+8% sát thương mọi đòn (hiện +${player.statAtk * 8}%)`, apply: () => { player.statAtk += 1; } },
            { key: 'skill', name: 'Kỹ năng', icon: 'fa-wand-magic-sparkles', color: 'text-cyan-400', desc: () => `+10% sát thương kỹ năng chủ động (x${player.skillPower.toFixed(1)})`, apply: () => { player.skillPower += 0.1; } },
            { key: 'mana', name: 'Mana', icon: 'fa-droplet', color: 'text-sky-400', desc: () => `+15 mana tối đa, +0.2 hồi/giây (${player.maxMana})`, apply: () => { player.maxMana += 15; player.manaRegen += 0.2; } }
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
            player.hp = 100;
            player.maxHp = 100;
            player.level = 1;
            player.xp = 0;
            player.nextXp = 100;
            player.speed = 3.6;
            player.regen = 0.2;
            player.magnetRadius = 110;
            player.xpMultiplier = 1.0;
            player.lastBossSpawnLevel = 0; // Reset boss tracker

            player.activeSlots = ['dagger', null];
            player.activeCdTimers = [0, 0];

            Object.keys(player.skills).forEach(k => {
                player.skills[k].level = (k === 'dagger') ? 1 : 0;
            });

            enemies = []; projectiles = []; bossProjectiles = []; xpGems = []; particles = []; damageTexts = []; slashFx = []; skillFx = []; goldDrops = [];
            activeBoss = null; gameTime = 0; killCount = 0;

            document.getElementById('bossHpContainer').classList.add('hidden');
            document.getElementById('gameOverOverlay').classList.add('hidden');
            document.getElementById('startOverlay').classList.add('hidden');
            document.getElementById('pauseModal').classList.add('hidden');
            document.getElementById('swapSkillModal').classList.add('hidden');

            player.mana = 100; player.maxMana = 100; player.manaRegen = 1;
            player.defense = 0; player.skillPoints = 0; player.skillPower = 1; player.statAtk = 0;
            player.statLv = { hp: 0, def: 0, atk: 0, skill: 0, mana: 0 };
            floorActive = false; pendingNextFloor = false; introTimer = 0; towerFloor = 1;
            pendingVictory = false; player.gold = 0;
            player.weapon = Object.keys(WEAPONS)[Math.floor(Math.random() * 4)];
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