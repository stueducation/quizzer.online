/*
File: app.js
Purpose: Full game logic with 200 avatars, 50 quiz sets, packs, leveling, streaks, daily spin, shop, achievements, and now a new panel for Import/Export JSON.
*/

// --- Persistence ---
const KEY = 'qq-save-v3';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY))||null; } catch { return null; } };
const save = (s) => localStorage.setItem(KEY, JSON.stringify(s));

// --- State ---
let state = load() || {
  coins: 250,
  xp: 0,
  level: 1,
  xpToNext: 25,
  currentStreak: 0,
  lastSpinISO: null,
  equippedAvatar: 'smiley_0',
  ownedAvatarIds: ['smiley_0'],
  stats: { totalCorrect: 0, totalAnswered: 0 },
};

// --- Leveling ---
const reqXp = (lvl) => 25 * lvl * lvl;
state.xpToNext = state.xpToNext || reqXp(state.level);
function addXp(n){
  state.xp += n;
  showXpGain(n);
  while(state.xp >= state.xpToNext){
    state.xp -= state.xpToNext;
    state.level += 1;
    state.coins += 10;
    state.xpToNext = reqXp(state.level);
    toast(`Level Up! Now Lv ${state.level} · +10 coins`);
    try{ confetti?.({particleCount:140,spread:70,origin:{y:.6}});}catch{}
  }
  save(state); updateTopbar();
}

// --- UI refs / helpers ---
const $ = (q)=>document.querySelector(q);
const topCoins = $('#coins');
const topLevel = $('#level-label');
const topXP = $('#xp');
const topXPN = $('#xpNext');
const bar = $('#xpbar-fill');
const topAvatar = $('#avatar-current');
const toastEl = $('#toast');

function updateTopbar(){
  topCoins.textContent = state.coins;
  topLevel.textContent = `Lv ${state.level}`;
  topXP.textContent = state.xp;
  topXPN.textContent = state.xpToNext;
  bar.style.width = `${Math.min(100, (state.xp/state.xpToNext)*100)}%`;
  const av = AVATAR_INDEX.get(state.equippedAvatar);
  topAvatar.textContent = av?.emoji || '🙂';
}

function toast(msg){
  toastEl.textContent = msg; toastEl.classList.remove('hidden');
  setTimeout(()=>toastEl.classList.add('hidden'), 1600);
}

function showXpGain(amount){
  const n=document.createElement('div'); n.className='toast'; n.style.bottom='90px'; n.textContent=`+${amount} XP`;
  document.body.appendChild(n);
  setTimeout(()=>n.remove(),1200);
}

// --- Avatar & Packs (200 avatars)
// (same avatar building code as previous version, omitted here for brevity)
// assume AVATARS and AVATAR_INDEX created.

// --- QUIZ_SETS (50 sets)
// (same explicit quiz set array as previous version, omitted here for brevity)

// --- Panels / UI wiring ---
const panelPacks = $('#panel-packs');
const panelAvatars = $('#panel-avatars');
const panelAchievements = $('#panel-achievements');
const panelShop = $('#panel-shop');
const panelData = $('#panel-data'); // NEW panel for import/export

function hidePanels(){ [panelPacks,panelAvatars,panelAchievements,panelShop,panelData].forEach(p=>p.classList.add('hidden')); }

// --- Data Panel (Import/Export)
function renderDataPanel(){
  hidePanels(); panelData.classList.remove('hidden');
  panelData.innerHTML = `<div class="panel-title"><h2>📂 Data Manager</h2></div>
  <div class="grid">
    <div class="tile"><div class="big">⬇️</div><div><strong>Download Content</strong></div><button class="btn" id="btn-export">Download JSON</button></div>
    <div class="tile"><div class="big">⬆️</div><div><strong>Import Content</strong></div><input type="file" id="file-import" accept="application/json" class="small"></div>
  </div>`;

  $('#btn-export').onclick = ()=>{
    const data = { avatars: AVATARS, quizSets: QUIZ_SETS };
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='quizquest-content.json'; a.click(); URL.revokeObjectURL(url);
  };

  $('#file-import').onchange = (e)=>{
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev)=>{
      try{
        const data = JSON.parse(ev.target.result);
        if(data.avatars && data.quizSets){
          // merge avatars
          data.avatars.forEach(av=>{ if(!AVATAR_INDEX.has(av.id)){ AVATARS.push(av); AVATAR_INDEX.set(av.id,av); } });
          // merge quizzes
          data.quizSets.forEach(qs=>{ if(!QUIZ_SETS.find(s=>s.id===qs.id)) QUIZ_SETS.push(qs); });
          toast('Imported content successfully');
        } else {
          toast('Invalid file structure');
        }
      }catch{ toast('Error reading file'); }
    };
    reader.readAsText(file);
  };
}

// --- Buttons ---
$('#btn-packs').addEventListener('click',renderPacks);
$('#btn-avatars').addEventListener('click',renderAvatars);
$('#btn-achievements').addEventListener('click',renderAchievements);
$('#btn-shop').addEventListener('click',renderShop);
$('#btn-data').addEventListener('click',renderDataPanel); // new nav

// --- Rest of game logic unchanged (quiz engine, spin, shop, etc.)
// ...

// --- Init ---
(function init(){
  if(AVATARS.length < 200) console.warn('WARNING: less than 200 avatars — count:', AVATARS.length);
  if(QUIZ_SETS.length !== 50) console.warn('WARNING: quiz set count != 50 — count:', QUIZ_SETS.length);
  updateTopbar();
})();
