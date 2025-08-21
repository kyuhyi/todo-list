// ====== 상태 ======
const K = 'bsd.todos.v1';
let todos = load();

function load(){ try{ return JSON.parse(localStorage.getItem(K)) || []; }catch{ return []; } }
function save(){ localStorage.setItem(K, JSON.stringify(todos)); }

// ====== 유틸 ======
const $ = s=>document.querySelector(s);
const $$ = s=>document.querySelectorAll(s);
const tpl = id=>document.getElementById(id).content.firstElementChild.cloneNode(true);
const fmtTime = ts => ts ? new Date(ts).toLocaleString() : '';

// ====== 렌더 ======
function render(){
  const todayUL = $('#listToday'); const tomorrowUL = $('#listTomorrow');
  todayUL.innerHTML = ''; tomorrowUL.innerHTML = '';
  const now = new Date(); const todayKey = now.toDateString();
  const tomorrowKey = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1).toDateString();

  todos.forEach(t => {
    const li = tpl('itemTemplate');
    const chk = li.querySelector('.chk');
    const title = li.querySelector('.title');
    const rem = li.querySelector('.rem');

    title.textContent = t.title;
    title.classList.toggle('done', !!t.done);
    chk.checked = !!t.done;
    rem.textContent = t.remindAt ? '🔔 ' + fmtTime(t.remindAt) : '';

    chk.addEventListener('change', () => { t.done = chk.checked; save(); render(); });
    li.querySelector('.edit').addEventListener('click', () => editItem(t));
    li.querySelector('.del').addEventListener('click', () => delItem(t.id));

    (t.dueKey===todayKey ? todayUL : tomorrowUL).appendChild(li);
  });
}
function editItem(t){
  const nt = prompt('내용 수정', t.title);
  if (nt && nt.trim()) { t.title = nt.trim(); save(); render(); }
}
function delItem(id){
  todos = todos.filter(x=>x.id!==id);
  save(); render();
}

// ====== 추가 ======
function add(due){ // due: 'today' | 'tomorrow'
  const form = due==='today' ? $('#formToday') : $('#formTomorrow');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(form);
    const title = (fd.get('title')||'').toString().trim();
    const remindAt = fd.get('remindAt') ? new Date(fd.get('remindAt')).getTime() : null;
    if(!title) return;

    const now = new Date();
    const dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (due==='today'?0:1));
    const item = {
      id: crypto.randomUUID(),
      title, done:false,
      dueKey: dueDate.toDateString(),
      remindAt
    };
    todos.unshift(item);
    save(); render();
    if (remindAt) scheduleReminder(item);
    form.reset();
  });
}

// ====== 알림 ======
$('#notifyPermBtn').onclick = async () => {
  if (!('Notification' in window)) return alert('브라우저가 알림을 지원하지 않아요.');
  const perm = await Notification.requestPermission();
  alert(perm === 'granted' ? '알림 사용 가능!' : '알림이 거부되었습니다.');
};

function scheduleReminder(t){
  if (!t.remindAt) return;
  const delay = t.remindAt - Date.now();
  if (delay <= 0) return;
  setTimeout(() => {
    if (Notification.permission === 'granted'){
      new Notification('오늘의 할 일 ✅', { body: t.title });
    } else {
      alert('알림: ' + t.title);
    }
  }, Math.min(delay, 2_147_483_647)); // setTimeout 한계 보호
}

// 앱 시작
add('today'); add('tomorrow');
render();
todos.filter(x=>x.remindAt).forEach(scheduleReminder);

// ====== 챗봇 ======
const log = $('#chatLog');
function append(who, text){
  const div = document.createElement('div');
  div.className = 'msg';
  
  // 텍스트 포맷팅
  let formattedText = text.replace(/</g,'&lt;').replace(/>/g,'&gt;');
  
  // 줄바꿈 처리
  formattedText = formattedText.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
  
  // 링크 처리
  formattedText = formattedText.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="chat-link">$1</a>');
  
  // 볼드 처리 (**텍스트**)
  formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // 번호 목록 처리
  formattedText = formattedText.replace(/^(\d+\.|-)(\s+)/gm, '<br>$1$2');
  
  div.innerHTML = `<span class="who">${who}:</span><div class="msg-content">${formattedText}</div>`;
  log.appendChild(div); log.scrollTop = log.scrollHeight;
}
$('#chatForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const q = $('#chatInput').value.trim();
  if(!q) return;
  append('나', q); $('#chatInput').value = '';
  try{
    const r = await fetch('/api/gemini', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ prompt:q })
    });
    const data = await r.json();
    append('Gemini', data.response || '(응답 없음)');
  }catch(err){
    append('Gemini', '에러가 발생했어요. 잠시 후 다시 시도해주세요.');
  }
});
