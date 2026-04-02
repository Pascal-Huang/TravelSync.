/* ── State ───────────────────────────────────────────────── */
const S = { name: '', loc: '', dates: '', ideas: [] };

const PHRASES = [
  'AI is synthesizing everyone\'s ideas…',
  'Weighing group preferences…',
  'Checking dealbreakers &amp; dietary needs…',
  'Balancing budgets across the group…',
  'Finalising the perfect itinerary…',
];

/* ── Helpers ─────────────────────────────────────────────── */
function show(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.setAttribute('aria-hidden', 'true');
  });
  const el = document.getElementById(id);
  el.classList.add('active');
  el.removeAttribute('aria-hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function ideaIcon(t) {
  t = t.toLowerCase();
  if (/sushi|taco|burger|pizza|brunch|dinner|lunch|restaurant|eat|food/.test(t)) return '🍽️';
  if (/drink|bar|cocktail|wine|beer|pub|rooftop/.test(t)) return '🍹';
  if (/museum|art|gallery|exhibit|tour/.test(t)) return '🎨';
  if (/hike|walk|park|outdoor|lake/.test(t)) return '🌿';
  if (/hotel|stay|airbnb|check.?in/.test(t)) return '🏨';
  if (/concert|music|show|live/.test(t)) return '🎵';
  if (/http|www|\.com/.test(t)) return '🔗';
  return '💡';
}

let toastT;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('show'), 2600);
}

function runLoader(onDone, introMsg) {
  const loadEl  = document.getElementById('load-pane');
  const labelEl = document.getElementById('load-label');
  loadEl.classList.remove('gone');
  labelEl.textContent = introMsg || PHRASES[0];
  let i = 0;
  const iv = setInterval(() => {
    i = (i + 1) % PHRASES.length;
    labelEl.textContent = PHRASES[i];
  }, 900);
  setTimeout(() => { clearInterval(iv); loadEl.classList.add('gone'); onDone(); }, 2800);
}

/* ── Screen 1 → 2 ──────────────────────────────────────── */
function createPlan() {
  S.name  = document.getElementById('inp-name').value.trim()   || 'My Plan';
  S.loc   = document.getElementById('inp-loc').value.trim()    || 'Location TBD';
  S.dates = document.getElementById('inp-dates').value.trim()  || 'Dates TBD';

  document.getElementById('ctx-name').textContent  = S.name;
  document.getElementById('ctx-loc').textContent   = S.loc;
  document.getElementById('ctx-dates').textContent = S.dates;
  document.getElementById('ih-meta').textContent   = S.name;

  toast('✓ Invite link copied to clipboard!');
  show('s2');
}

/* ── Screen 2: Add idea ─────────────────────────────────── */
function addIdea() {
  const ideaEl  = document.getElementById('inp-idea');
  const budgEl  = document.getElementById('inp-budget');
  const dealEl  = document.getElementById('inp-deal');
  const board   = document.getElementById('board');
  const empty   = document.getElementById('board-empty');

  const text = ideaEl.value.trim();
  if (!text) { toast('Write an idea or paste a link first.'); ideaEl.focus(); return; }

  const budget = budgEl.value;
  const deal   = dealEl.value.trim();
  S.ideas.push({ text, budget, deal });

  if (empty) empty.remove();
  board.classList.add('has-items');

  const card = document.createElement('div');
  card.className = 'idea-card';
  card.setAttribute('role', 'listitem');
  card.innerHTML = `
    <span class="ic" aria-hidden="true">${ideaIcon(text)}</span>
    <div class="idea-body">
      <div class="idea-text">${esc(text)}</div>
      <div class="idea-chips">
        <span class="chip chip-b" aria-label="Budget: ${budget}">${budget}</span>
        ${deal ? `<span class="chip chip-d" aria-label="Dealbreaker: ${esc(deal)}">🚫 ${esc(deal)}</span>` : ''}
      </div>
    </div>`;
  board.appendChild(card);

  updateHint();
  ideaEl.value = '';
  dealEl.value = '';
  ideaEl.focus();
}

document.getElementById('inp-idea').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addIdea(); }
});

function updateHint() {
  const n = S.ideas.length;
  const el = document.getElementById('gen-hint');
  if (n === 0)      el.textContent = 'Add at least one idea to generate an itinerary';
  else if (n === 1) el.textContent = '1 idea added — add more or generate now';
  else              el.textContent = `${n} ideas in the sandbox — AI will reconcile them all`;
}

/* ── Screen 2 → 3: Generate ─────────────────────────────── */
function genItinerary() {
  if (S.ideas.length === 0) { toast('Add at least one idea first.'); return; }
  document.getElementById('draft-result').classList.remove('show');
  show('s3');
  runLoader(() => {
    document.getElementById('draft-result').classList.add('show');
  });
}

/* ── Approve ─────────────────────────────────────────────── */
function approvePlan() { show('s4'); }

/* ── Regenerate ──────────────────────────────────────────── */
function regenPlan() {
  document.getElementById('draft-result').classList.remove('show');
  toast('Generating a fresh itinerary…');
  runLoader(() => {
    document.getElementById('draft-result').classList.add('show');
    toast('New itinerary ready!');
  }, 'Synthesising a fresh itinerary…');
}

/* ── Share ───────────────────────────────────────────────── */
function copyLink() {
  const url = 'https://harmony.app/p/' + Math.random().toString(36).slice(2,8).toUpperCase();
  if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast('Link copied! 🔗'));
  else toast('Link copied! 🔗');
}

function shareText() {
  const msg = `✅ ${S.name} — Plan Locked!\n📍 ${S.loc}  ·  🗓️ ${S.dates}\n\n1. Day 1 12PM — Arrival & Check-In\n2. Day 1 2PM  — Lakefront Walk\n3. Day 1 7PM  — El Camino Kitchen (Dinner)\n4. Day 2 10AM — The Publican (Brunch)\n5. Day 2 1PM  — Art Institute of Chicago\n\nSee you there! 🎉`;
  if (navigator.share) navigator.share({ title: S.name, text: msg });
  else { if (navigator.clipboard) navigator.clipboard.writeText(msg); toast('Plan text copied! 💬'); }
}

/* ── Start over ──────────────────────────────────────────── */
function startOver() {
  Object.assign(S, { name: '', loc: '', dates: '', ideas: [] });
  ['inp-name','inp-loc','inp-dates','inp-idea','inp-deal']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('inp-budget').value = '$$';

  const board = document.getElementById('board');
  board.innerHTML = `<div class="board-empty" id="board-empty"><span class="ei" aria-hidden="true">💭</span>Ideas from your group will appear here</div>`;
  board.classList.remove('has-items');
  updateHint();

  document.getElementById('load-pane').classList.remove('gone');
  document.getElementById('draft-result').classList.remove('show');
  show('s1');
}