const root = document.querySelector('#polls');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const token = () => localStorage.getItem('quickpoll_admin_token') || '';
const headers = () => ({'Content-Type':'application/json', Authorization:'Bearer '+token()});
const $ = id => document.getElementById(id);

function iconFor(question='') {
  const q = question.toLowerCase();
  if (q.includes('game') || q.includes('bgmi') || q.includes('valorant')) return '🎮';
  if (q.includes('movie') || q.includes('film')) return '🎬';
  if (q.includes('food') || q.includes('favorite')) return '⭐';
  return '💻';
}

function showView(view){
  const user = view === 'user';
  $('userView').classList.toggle('hidden', !user);
  $('adminView').classList.toggle('hidden', user);
  $('userNav').classList.toggle('active', user);
  $('adminNav').classList.toggle('active', !user);
  if (!user) { showAdminSection('manage'); loadAdmin(); }
  else load();
  window.scrollTo({top:0,behavior:'smooth'});
}

function showAdminSection(section){
  const logged = !!token();
  $('adminHeading').textContent = section === 'results' ? 'Poll Results' : 'Manage Polls';
  $('manageSection').classList.toggle('hidden', section !== 'manage');
  $('resultsSection').classList.toggle('hidden', section !== 'results');
  document.querySelectorAll('.side-nav a').forEach(a=>a.classList.remove('selected'));
  document.querySelectorAll('.side-nav a')[section === 'results' ? 1 : 0].classList.add('selected');
  if (logged && section === 'results') loadResults();
}

function renderPoll(p) {
  const total = p.options.reduce((sum, o) => sum + (o.votes || 0), 0);
  return `<article class="poll-card">
    <div class="poll-card-head"><div class="topic-icon">${iconFor(p.question)}</div><span class="status-badge">Active</span></div>
    <h2>${esc(p.question)}</h2>
    <p class="poll-description">${esc(p.description || 'Share your opinion with the community.')}</p>
    <form onsubmit="vote(event,'${p.id}')" class="vote-form">
      <div class="option-list">${p.options.map(o => `<label class="option-row"><input type="radio" name="poll-${p.id}" value="${o._id}" required><span>${esc(o.text)}</span></label>`).join('')}</div>
      <button class="primary-btn" type="submit"><span>➤</span> Vote Now</button>
    </form>
    <div class="mini-results"><div class="result-label">Current results</div>${p.options.map(o => {
      const pct = total ? Math.round((o.votes / total) * 100) : 0;
      return `<div class="mini-result"><div><span>${esc(o.text)}</span><strong>${pct}%</strong></div><div class="progress"><i style="width:${pct}%"></i></div></div>`;
    }).join('')}</div>
  </article>`;
}

async function load() {
  try {
    const r = await fetch('/api/polls');
    const polls = await r.json();
    root.innerHTML = polls.length ? polls.map(renderPoll).join('') : `<div class="empty-state"><div>📊</div><h2>No active polls yet</h2><p>Check back soon for the next poll.</p></div>`;
  } catch {
    root.innerHTML = `<div class="empty-state"><div>⚠️</div><h2>Unable to load polls</h2><p>Make sure the server and MongoDB are running.</p></div>`;
  }
}

async function vote(e, id) {
  e.preventDefault();
  const optionId = e.target.querySelector('input:checked').value;
  const button = e.target.querySelector('button');
  button.disabled = true; button.innerHTML = '<span>✓</span> Saving...';
  try {
    const r = await fetch('/api/polls/' + id + '/vote', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({optionId})});
    if (r.ok) { button.innerHTML = '<span>✓</span> Vote Recorded'; setTimeout(load, 500); }
    else { alert((await r.json()).error || 'Unable to record vote'); button.disabled=false; button.innerHTML='<span>➤</span> Vote Now'; }
  } catch { alert('Server unavailable'); button.disabled=false; button.innerHTML='<span>➤</span> Vote Now'; }
}

function login(){
  const t=$('tokenLogin').value.trim(); if(!t)return alert('Enter your Admin Key.');
  localStorage.setItem('quickpoll_admin_token',t); $('loginCard').classList.add('hidden'); loadAdmin();
}
function logout(){ localStorage.removeItem('quickpoll_admin_token'); $('adminPolls').innerHTML=''; $('resultsCards').innerHTML=''; $('loginCard').classList.remove('hidden'); }
function resetForm(){ ['question','description','options'].forEach(id=>$(id).value=''); $('editingId').value=''; $('formTitle').textContent='Create New Poll'; $('saveBtn').innerHTML='＋ Add Poll'; $('cancelBtn').classList.add('hidden'); }
function editPoll(p){ $('editingId').value=p.id; $('question').value=p.question; $('description').value=p.description||''; $('options').value=p.options.map(o=>o.text).join('\n'); $('formTitle').textContent='Edit Poll'; $('saveBtn').innerHTML='✓ Save Changes'; $('cancelBtn').classList.remove('hidden'); window.scrollTo({top:0,behavior:'smooth'}); }

function adminCard(p){
  const total=p.totalVotes||0;
  return `<article class="admin-poll-card"><div class="admin-poll-top"><div class="topic-icon small">${iconFor(p.question)}</div><div class="poll-meta"><h3>${esc(p.question)}</h3><p>${esc(p.description||'No description')}</p></div><label class="switch"><input type="checkbox" ${p.isActive?'checked':''} onchange="togglePoll('${p.id}',this.checked)"><span></span></label></div>
  <div class="admin-stats"><span class="active-label ${p.isActive?'on':'off'}">● ${p.isActive?'Active':'Inactive'}</span><span>${total} vote${total===1?'':'s'}</span></div>
  <div class="bar-list">${p.options.map(o=>{const pct=total?Math.round(o.votes/total*100):0;return `<div class="bar-row"><div><span>${esc(o.text)}</span><strong>${pct}%</strong></div><div class="progress"><i style="width:${pct}%"></i></div></div>`}).join('')}</div>
  <div class="card-actions"><button class="edit-btn" onclick='editPoll(${JSON.stringify(p)})'>✎ Edit</button><button class="delete-btn" onclick="deletePoll('${p.id}')">▣ Delete</button></div></article>`;
}

async function loadAdmin(){
  if(!token()){ $('loginCard').classList.remove('hidden'); return; }
  $('loginCard').classList.add('hidden');
  const r=await fetch('/api/polls?admin=true',{headers:{Authorization:'Bearer '+token()}});
  if(r.status===401){logout(); alert('Unauthorized. Please enter the correct Admin Key.'); return;}
  const ps=await r.json();
  $('adminPolls').innerHTML=ps.length ? ps.map(adminCard).join('') : '<div class="empty-state compact"><div>📊</div><h3>No polls created</h3><p>Create your first poll using the form.</p></div>';
}

async function loadResults(){
  if(!token()){ $('loginCard').classList.remove('hidden'); return; }
  const r=await fetch('/api/polls?admin=true',{headers:{Authorization:'Bearer '+token()}});
  if(r.status===401){logout(); return;}
  const ps=await r.json();
  $('resultsCards').innerHTML=ps.length ? ps.map(p=>{
    const total=p.totalVotes||0;
    return `<article class="result-card"><div class="result-card-head"><div><span class="result-status ${p.isActive?'on':'off'}">● ${p.isActive?'ACTIVE':'INACTIVE'}</span><h3>${esc(p.question)}</h3><p>${esc(p.description||'No description')}</p></div><strong>${total}<small> total votes</small></strong></div><div>${p.options.map(o=>{const pct=total?Math.round(o.votes/total*100):0;return `<div class="big-bar"><div><span>${esc(o.text)}</span><b>${o.votes} · ${pct}%</b></div><div class="progress"><i style="width:${pct}%"></i></div></div>`}).join('')}</div></article>`;
  }).join('') : '<div class="empty-state compact"><div>📈</div><h3>No results yet</h3><p>Create a poll and collect votes to see analytics here.</p></div>';
}

async function savePoll(){
  const options=$('options').value.split('\n').map(x=>x.trim()).filter(Boolean).map(text=>({text}));
  const question=$('question').value.trim(); if(!question)return alert('Enter a poll question.'); if(options.length<2)return alert('Enter at least 2 options.');
  const id=$('editingId').value; const url=id?'/api/polls/'+id:'/api/polls'; const method=id?'PUT':'POST';
  const body={question,description:$('description').value.trim(),options};
  const r=await fetch(url,{method,headers:headers(),body:JSON.stringify(body)}); const data=await r.json();
  if(!r.ok)return alert(data.error||'Request failed'); resetForm(); await loadAdmin();
}
async function togglePoll(id,isActive){const r=await fetch('/api/polls/'+id,{method:'PUT',headers:headers(),body:JSON.stringify({isActive})});if(!r.ok)alert((await r.json()).error||'Unable to update');loadAdmin();}
async function deletePoll(id){if(!confirm('Delete this poll permanently?'))return;const r=await fetch('/api/polls/'+id,{method:'DELETE',headers:{Authorization:'Bearer '+token()}});if(!r.ok)alert((await r.json()).error||'Unable to delete');loadAdmin();}

window.addEventListener('hashchange',()=>showView(location.hash==='#admin'?'admin':'user'));
showView(location.hash==='#admin'?'admin':'user');
