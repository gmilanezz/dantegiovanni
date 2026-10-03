const API = "/api";
let token = localStorage.token,
  user = JSON.parse(localStorage.user || "null"),
  tab = "agenda";
const $ = (s) => document.querySelector(s),
  headers = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });
async function req(p, o = {}) {
  let r = await fetch(API + p, {
    ...o,
    headers: { ...headers(), ...(o.headers || {}) },
  });
  let d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.detail || "Erro");
  return d;
}
const logo = () => `<img class="brand-logo" src="logo-dante.png" alt="Dante Giovanni Treinador">`;
const CONTACT = { instagram: localStorage.DANTE_INSTAGRAM || "", whatsapp: localStorage.DANTE_WHATSAPP || "" };
let activeWorkoutTimer = null;
function login() {
  app.innerHTML = `<main class="auth"><section class="auth-card">${logo()}<div><h1 class="accent">Dante Giovanni</h1><p class="muted">Agenda, treinos e evolução do time.</p></div><form id="f"><label class="field">Usuário<input id="u" autocomplete="username" required></label><label class="field">Senha<input id="p" type="password" autocomplete="current-password" required></label><button class="btn wide">Entrar</button><button type="button" class="forgot-link" onclick="forgotPassword()">Esqueci minha senha</button><p id="err" class="error"></p></form><div class="auth-divider"><span>Primeiro acesso?</span></div><div class="auth-actions"><button class="btn ghost" onclick="register('professor')">Criar conta de professor</button><button class="btn ghost" onclick="register('student')">Criar conta de aluno</button></div></section></main>`;
  f.onsubmit = async (e) => {
    e.preventDefault();
    let body = new URLSearchParams({ username: u.value, password: p.value });
    let r = await fetch(API + "/login", { method: "POST", body });
    if (!r.ok) {
      err.textContent = "Usuário ou senha inválidos";
      return;
    }
    saveSession(await r.json());
  };
}
function forgotPassword() {
  app.innerHTML = `<main class="auth"><section class="auth-card">${logo()}<button class="text-btn" onclick="login()">← Voltar ao login</button><div><h1>Redefinir senha</h1><p class="muted">Informe seu usuário, o código Dante e escolha uma nova senha.</p></div><form id="resetf"><label class="field">Usuário<input id="resetUser" autocomplete="username" required></label><label class="field">Código Dante<input id="resetCode" maxlength="5" minlength="5" pattern="[A-Za-z0-9]{5}" class="code-input" placeholder="A1B2C" required></label><label class="field">Nova senha<input id="resetPass" type="password" minlength="6" autocomplete="new-password" required></label><label class="field">Confirmar nova senha<input id="resetConfirm" type="password" minlength="6" autocomplete="new-password" required></label><button class="btn wide">Redefinir senha</button><p id="resetErr" class="error"></p><p id="resetOk" class="success"></p></form></section></main>`;
  resetf.onsubmit = async (e) => {
    e.preventDefault();
    resetErr.textContent = "";
    resetOk.textContent = "";
    if (resetPass.value !== resetConfirm.value) {
      resetErr.textContent = "As senhas não coincidem.";
      return;
    }
    try {
      let r = await fetch(API + "/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: resetUser.value,
          invite_code: resetCode.value,
          new_password: resetPass.value,
        }),
      });
      let d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.detail || "Não foi possível redefinir a senha");
      resetOk.textContent = "Senha redefinida. Redirecionando para o login...";
      setTimeout(login, 1200);
    } catch (e) {
      resetErr.textContent = e.message;
    }
  };
}

async function register(role) {
  let professors = [];
  if (role === "student")
    professors = await fetch(API + "/public/professors").then((r) => r.json());
  app.innerHTML = `<main class="auth"><section class="auth-card">${logo()}<button class="text-btn" onclick="login()">← Voltar ao login</button><div><h1>${role === "professor" ? "Professor" : "Aluno"}</h1><p class="muted">Use o código de 5 caracteres fornecido pelo Dante.</p></div><form id="rf"><label class="field">Nome completo<input id="rn" required></label><label class="field">Usuário<input id="ru" required></label>${role === "student" ? `<label class="field">Professor<select id="rp" required><option value="">Selecione</option>${professors.map((x) => `<option value="${x.id}">${x.name}</option>`).join("")}</select></label>` : ""}<label class="field">Senha<input id="rpass" type="password" minlength="6" required></label><label class="field">Código Dante<input id="rcode" maxlength="5" minlength="5" pattern="[A-Za-z0-9]{5}" class="code-input" placeholder="A1B2C" required></label><button class="btn wide">Criar conta</button><p id="rerr" class="error"></p></form></section></main>`;
  rf.onsubmit = async (e) => {
    e.preventDefault();
    try {
      let d = await fetch(API + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: rn.value,
          username: ru.value,
          password: rpass.value,
          role,
          invite_code: rcode.value,
          professor_id: role === "student" ? +rp.value : null,
        }),
      }).then(async (r) => {
        let d = await r.json();
        if (!r.ok) throw Error(d.detail || "Não foi possível criar a conta");
        return d;
      });
      saveSession(d);
    } catch (e) {
      rerr.textContent = e.message;
    }
  };
}
function saveSession(d) {
  token = d.access_token;
  user = d.user;
  localStorage.token = token;
  localStorage.user = JSON.stringify(user);
  tab = user.role === "student" ? "treino" : "agenda";
  render();
}
function menuItems() {
  return user.role === "student"
    ? [["treino","⌁","Meu treino"],["evolucao","↗","Evolução"],["contato","@","Contato"]]
    : [["agenda","▦","Minha agenda"],["time","◫","Agenda do time"],["alunos","◎","Alunos"],["fotos","▣","Fotos dos alunos"],["contato","@","Contato"]];
}
function nav() {
  return `<header class="topbar"><button class="menu-button" onclick="toggleMenu(true)" aria-label="Abrir menu">☰</button><div class="brand-inline nav-logo-only">${logo()}</div><div class="user-chip"><div><b>${user.name}</b><span>${user.role}</span></div></div></header><div class="menu-overlay" onclick="toggleMenu(false)"></div><aside class="sidebar"><div class="sidebar-head">${logo()}<button class="menu-close" onclick="toggleMenu(false)">×</button></div><div class="profile"><b>${user.name}</b><span>${user.role === "student" ? "Aluno" : "Time Dante Giovanni"}</span></div><nav class="side-nav">${menuItems().map(x=>`<button class="side-link ${tab===x[0]?"active":""}" onclick="tab='${x[0]}';toggleMenu(false);render()"><i>${x[1]}</i><span>${x[2]}</span></button>`).join("")}</nav><button class="side-link logout" onclick="logout()"><i>↪</i><span>Sair</span></button></aside>`;
}
function toggleMenu(open) {
  document.body.classList.toggle("menu-open", open);
}
async function render() {
  if (!token) return login();
  app.innerHTML = `${nav()}<main class="shell"><div class="page-title"><h1>${menuItems().find((x) => x[0] === tab)?.[2] || "Painel"}</h1></div><div id="view"></div></main>`;
  try {
    if (tab === "contato") return contato();
    if (user.role === "student") return tab === "evolucao" ? evolucao() : treino();
    if (tab === "alunos") return alunos();
    if (tab === "fotos") return fotosAlunos();
    return agenda(tab === "time");
  } catch (e) {
    view.innerHTML = `<div class="card error">${e.message}</div>`;
  }
}
async function agenda(team = false) {
  let data = await req("/lessons"),
    students = await req("/students");
  view.innerHTML = `<div class="grid"><section class="card"><div class="section-head"><h2>${team ? "Agenda completa" : "Nova aula"}</h2><span class="pill">${team ? "TIME" : "AGENDA"}</span></div>${team ? `<label class="field">Buscar aula<input id="q" placeholder="Professor, aluno ou dia"></label>` : `<form id="lf"><label class="field">Aluno<select id="sid">${students.map((s) => `<option value=${s.id}>${s.name}</option>`)}</select></label><label class="field">Dia<select id="day">${["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map((d, i) => `<option value=${i}>${d}</option>`)}</select></label><label class="field">Horário<input id="time" type="time" required></label><button class="btn">Salvar aula</button></form>`}</section><section class="card"><h2>Próximas aulas</h2><div id="ls" class="list"></div></section></div>`;
  let days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  function draw(f = "") {
    ls.innerHTML =
      data
        .filter((x) =>
          (x.professor + x.student + days[x.weekday])
            .toLowerCase()
            .includes(f.toLowerCase()),
        )
        .map(
          (x) =>
            `<div class="row"><div><b>${x.student}</b><div class="muted">${x.professor} · ${days[x.weekday]} ${x.time}</div></div>${!team ? `<button class="btn action compact" onclick="delLesson(${x.id})">Excluir</button>` : ""}</div>`,
        )
        .join("") || '<div class="empty">Nenhuma aula cadastrada.</div>';
  }
  draw();
  if (team) q.oninput = () => draw(q.value);
  else
    lf.onsubmit = async (e) => {
      e.preventDefault();
      await req("/lessons", {
        method: "POST",
        body: JSON.stringify({
          student_id: +sid.value,
          weekday: +day.value,
          time: time.value,
        }),
      });
      render();
    };
}
async function delLesson(id) {
  await req("/lessons/" + id, { method: "DELETE" });
  render();
}
async function alunos() {
  let ss = await req("/students");
  view.innerHTML = `<div class="grid"><section class="card"><div class="section-head"><h2>Adicionar aluno</h2><span class="pill">PROFESSOR</span></div><p class="muted">O aluno também pode criar a própria conta usando o código Dante e selecionar você como professor.</p><form id="sf"><label class="field">Nome<input id="sn" required></label><label class="field">Usuário<input id="su" required></label><label class="field">Senha inicial<input id="sp" minlength="6" required></label><button class="btn">Cadastrar diretamente</button></form></section><section class="card"><h2>Meus alunos</h2><div class="list">${ss.map((s) => `<div class="row"><div><b>${s.name}</b><div class="muted">@${s.username}</div></div><div class="row-actions"><button class="btn action compact" onclick="workout(${s.id},'${s.name.replaceAll("'", "")}')">Treino</button><button class="btn action compact" onclick="openStudentPhotos(${s.id},'${s.name.replaceAll("'", "")}')">Fotos</button></div></div>`).join("") || '<span class="empty">Nenhum aluno.</span>'}</div></section></div><div id="editor"></div>`;
  sf.onsubmit = async (e) => {
    e.preventDefault();
    await req("/students", {
      method: "POST",
      body: JSON.stringify({
        name: sn.value,
        username: su.value,
        password: sp.value,
      }),
    });
    render();
  };
}
function workout(id, name) {
  editor.innerHTML = `<section class="card editor"><div class="section-head"><h2>Treino de <span class="accent">${name}</span></h2><span class="pill">INDIVIDUAL</span></div><form id="wf"><label class="field">Título<input id="wt" placeholder="Treino A — Inferiores" required></label><label class="field">Periodização<input id="wp" placeholder="Semanas 1–4 · força/hipertrofia"></label><label class="field">Planilha<textarea id="wc" placeholder="Agachamento — 4x10 — 90s\nLeg press — 4x12 — 60s" required></textarea></label><button class="btn">Publicar para o aluno</button></form></section>`;
  wf.onsubmit = async (e) => {
    e.preventDefault();
    await req("/workouts", {
      method: "POST",
      body: JSON.stringify({
        student_id: id,
        title: wt.value,
        periodization: wp.value,
        content: wc.value,
      }),
    });
    alert("Treino publicado no perfil do aluno.");
  };
}
async function treino() {
  let ws = await req("/workouts");
  view.innerHTML = `<div class="workout-links">${ws.map(w=>`<button class="workout-link" onclick="treinoDetalhe(${w.id})"><span>${w.title}</span><b>ABRIR →</b></button>`).join("") || '<section class="card empty">Seu professor ainda não publicou um treino.</section>'}</div>`;
}
async function treinoDetalhe(id) {
  let w = await req("/workouts/"+id);
  view.innerHTML = `<button class="text-btn back" onclick="treino()">← Meus treinos</button><section class="card workout-detail"><span class="pill">${w.periodization || "TREINO"}</span><h2>${w.title}</h2><div class="workout-content">${w.content}</div><div id="timerBox" class="timer-box"><span>DURAÇÃO</span><strong id="timerText">00:00:00</strong></div><div class="workout-actions"><button id="startWorkout" class="btn" onclick="startWorkoutTimer(${w.id}, ${JSON.stringify(w.title)})">Iniciar treino</button><button id="finishWorkout" class="btn action" onclick="finishWorkoutTimer(${w.id}, ${JSON.stringify(w.title)})" disabled>Finalizar treino</button></div></section>`;
}
function startWorkoutTimer(id,title){
  if(activeWorkoutTimer) clearInterval(activeWorkoutTimer.interval);
  const started=Date.now(); activeWorkoutTimer={id,title,started};
  startWorkout.disabled=true; finishWorkout.disabled=false;
  activeWorkoutTimer.interval=setInterval(()=>{ timerText.textContent=formatDuration(Date.now()-started); },1000);
}
function formatDuration(ms){ let t=Math.floor(ms/1000),h=Math.floor(t/3600),m=Math.floor((t%3600)/60),s=t%60; return [h,m,s].map(v=>String(v).padStart(2,'0')).join(':'); }
async function finishWorkoutTimer(id,title){
  if(!activeWorkoutTimer || activeWorkoutTimer.id!==id) return;
  clearInterval(activeWorkoutTimer.interval); const duration=Date.now()-activeWorkoutTimer.started; activeWorkoutTimer=null;
  await req("/workouts/"+id+"/complete",{method:"POST"});
  await shareWorkoutCard(title,duration);
  finishWorkout.disabled=true; startWorkout.disabled=false;
}
async function shareWorkoutCard(title,duration){
  const canvas=document.createElement('canvas'); canvas.width=1080; canvas.height=1920; const c=canvas.getContext('2d');
  c.fillStyle='#030303'; c.fillRect(0,0,1080,1920);
  try{ const img=new Image(); img.src='logo-dante.png'; await img.decode(); c.drawImage(img,240,180,600,600); }catch(e){}
  c.textAlign='center'; c.fillStyle='#65f6d2'; c.font='bold 54px Arial'; c.fillText('TREINO CONCLUÍDO',540,930);
  c.fillStyle='#fff'; c.font='bold 78px Arial'; wrapCanvasText(c,title.toUpperCase(),540,1050,850,92);
  c.fillStyle='#a9b0ae'; c.font='bold 36px Arial'; c.fillText('DURAÇÃO',540,1320);
  c.fillStyle='#fff'; c.font='bold 110px Arial'; c.fillText(formatDuration(duration),540,1440);
  c.fillStyle='#65f6d2'; c.font='bold 38px Arial'; c.fillText('DANTE GIOVANNI',540,1680);
  const blob=await new Promise(r=>canvas.toBlob(r,'image/png')); const file=new File([blob],'dante-treino.png',{type:'image/png'});
  if(navigator.share && navigator.canShare?.({files:[file]})){ try{ await navigator.share({title:'Treino concluído',text:`${title} • ${formatDuration(duration)}`,files:[file]}); return; }catch(e){ if(e.name==='AbortError') return; } }
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='dante-treino.png'; a.click(); URL.revokeObjectURL(a.href); alert('Card gerado. No celular, compartilhe a imagem no Instagram Stories.');
}
function wrapCanvasText(c,text,x,y,maxWidth,lineHeight){ const words=text.split(' '); let line='',lines=[]; for(const word of words){ const test=line?line+' '+word:word; if(c.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test} lines.push(line); lines.slice(0,3).forEach((l,i)=>c.fillText(l,x,y+i*lineHeight)); }
async function complete(id) {
  await req("/workouts/" + id + "/complete", { method: "POST" });
  alert("Treino concluído!");
}
async function evolucao() {
  let w = await req("/weights/" + user.id),
    max = Math.max(...w.map((x) => x.value), 1);
  view.innerHTML = `<div class="grid"><section class="card"><div class="section-head"><h2>Peso semanal</h2><span class="pill">EVOLUÇÃO</span></div><form id="peso"><label class="field">Peso (kg)<input id="kg" type="number" step=".1" required></label><button class="btn">Registrar peso</button></form><div class="chart">${w.map((x) => `<div class="bar" style="height:${Math.max(12, (x.value / max) * 130)}px" title="${x.value} kg"><span>${String(x.measured_on).slice(5)}</span></div>`).join("")}</div></section><section class="card"><h2>Foto de evolução</h2><p class="muted">Envie sua foto semanal. O arquivo fica vinculado exclusivamente à sua conta.</p><form id="photo"><label class="field">Imagens<input id="img" type="file" accept="image/*" multiple required></label><button class="btn">Enviar foto</button></form></section></div>`;
  peso.onsubmit = async (e) => {
    e.preventDefault();
    await req("/weights", {
      method: "POST",
      body: JSON.stringify({
        value: +kg.value,
        measured_on: new Date().toISOString().slice(0, 10),
      }),
    });
    render();
  };
  photo.onsubmit = async (e) => {
    e.preventDefault();
    let fd = new FormData();
    [...img.files].forEach(file => fd.append("files", file));
    let r = await fetch(API + "/photos", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    alert(r.ok ? `${img.files.length} foto(s) enviada(s)` : "Erro no envio"); if(r.ok) render();
  };
}
async function fotosAlunos(){
  const students=await req('/students');
  view.innerHTML=`<section class="card"><h2>Fotos dos alunos</h2><p class="muted">Acesse o histórico de evolução enviado semanalmente por cada aluno.</p><div class="student-photo-list">${students.map(s=>`<button class="workout-link" onclick="openStudentPhotos(${s.id},${JSON.stringify(s.name)})"><span>${s.name}</span><b>VER FOTOS →</b></button>`).join('') || '<div class="empty">Nenhum aluno cadastrado.</div>'}</div></section><div id="photoGallery"></div>`;
}
async function openStudentPhotos(id,name){
  if(tab!=="fotos"){tab="fotos"; await render();}
  const photos=await req('/photos/'+id); const base=API.replace(/\/api$/,'');
  const photoUrl=(path)=>path.startsWith('data:')?path:base+path;
  photoGallery.innerHTML=`<section class="card gallery-card"><h2>${name}</h2><div class="photo-grid">${photos.map(p=>`<a href="${photoUrl(p.path)}" target="_blank"><img src="${photoUrl(p.path)}" alt="Evolução de ${name}"><span>${new Date(p.created_at).toLocaleDateString('pt-BR')}</span></a>`).join('') || '<div class="empty">Este aluno ainda não enviou fotos.</div>'}</div></section>`;
  photoGallery.scrollIntoView({behavior:'smooth'});
}
function contato(){
  const ig=CONTACT.instagram, wa=CONTACT.whatsapp;
  view.innerHTML=`<section class="contact-card">${logo()}<h2>Dante Giovanni</h2><p class="muted">Fale com o time pelos canais oficiais.</p><div class="contact-actions">${ig?`<a class="contact-link" href="${ig}" target="_blank" rel="noopener"><b>INSTAGRAM</b><span>Abrir perfil →</span></a>`:`<div class="contact-link disabled"><b>INSTAGRAM</b><span>Link ainda não configurado</span></div>`}${wa?`<a class="contact-link" href="${wa}" target="_blank" rel="noopener"><b>WHATSAPP</b><span>Iniciar conversa →</span></a>`:`<div class="contact-link disabled"><b>WHATSAPP</b><span>Link ainda não configurado</span></div>`}</div></section>`;
}
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  token = null;
  user = null;
  login();
}
render();
