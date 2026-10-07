
const APP_VERSION = 6;
const STATUS_META = {
  not_watched:{label:'Não assistida',cls:'not-watched',rank:0},
  assisted:{label:'Assistida',cls:'assisted',rank:1},
  studied:{label:'Estudada',cls:'studied',rank:2},
  reviewed:{label:'Revisada',cls:'reviewed',rank:3}
};

function makeExercises(prefix,count,label='Exercício'){
  return Array.from({length:count},(_,i)=>({
    id:`${prefix}-${String(i+1).padStart(2,'0')}`,
    name:`${label} ${String(i+1).padStart(2,'0')}`,
    goals:[80,100,120]
  }));
}

const E1_STRUCTURE = {
  id:'e1',
  title:'Domínio técnico',
  subtitle:'Fundamentos de execução',
  symbol:'𝄢',
  areas:[
    {
      id:'technique',
      name:'Técnica',
      course:'Técnica (mão esquerda, mão direita, slap...)',
      symbol:'𝄢',
      sections:[
        {
          id:'technique-10',
          name:'Técnica 1.0',
          subtitle:'Mão esquerda e mão direita',
          lessons:[
            {
              id:'lesson-independence',
              code:'01',
              name:'Exercícios de independência',
              exercises:makeExercises('ind',3)
            }
          ]
        },
        {
          id:'slap',
          name:'Slap',
          subtitle:'Técnica de slap',
          lessons:[
            {
              id:'lesson-slap',
              code:'02',
              name:'Exercícios para Slap',
              exercises:makeExercises('slap',8)
            }
          ]
        }
      ]
    },
    {
      id:'groove',
      name:'Treinamentos de Groove',
      course:'Turbinando seu Groove!',
      symbol:'♫',
      sections:[
        {
          id:'groove-course',
          name:'Turbinando seu Groove!',
          subtitle:'Treinamentos de groove',
          lessons:[
            {
              id:'lesson-groove-30',
              code:'01',
              name:'30 Frases de Groove',
              exercises:makeExercises('groove-frase',30,'Frase')
            },
            {
              id:'lesson-groove-dig',
              code:'02',
              name:'5 Exercícios de Groove para Digitação',
              exercises:makeExercises('groove-dig',5)
            },
            {
              id:'lesson-groove-pizz',
              code:'03',
              name:'5 Exercícios de Groove para Pizzicato',
              exercises:makeExercises('groove-pizz',5)
            }
          ]
        }
      ]
    },
    {
      id:'perception',
      name:'Percepção e Teoria Musical',
      course:'Percepção Musical',
      symbol:'♪',
      sections:[
        {
          id:'perception-series',
          name:'Série — Percepção Musical',
          subtitle:'Percepção e teoria musical',
          lessons:[
            {
              id:'lesson-perception-melodic-rhythmic',
              code:'01',
              name:'Percepção Melódica e Rítmica',
              exercises:[]
            },
            {
              id:'lesson-perception-rhythmic',
              code:'02',
              name:'Percepção Rítmica',
              exercises:[]
            }
          ]
        }
      ]
    },
    {
      id:'ear',
      name:'Treinamento de Ouvido',
      course:'Treinamentos de Ouvido',
      symbol:'♬',
      sections:[
        {
          id:'ear-advanced',
          name:'Série — Músicas de Ouvido (AVANÇADO)',
          subtitle:'Ouça, reconheça, aplique',
          lessons:[
            {
              id:'lesson-ear-field',
              code:'01',
              name:'Passo a passo — Descobrindo um campo harmônico',
              exercises:[]
            },
            {
              id:'lesson-ear-tonality',
              code:'02',
              name:'Como identificar uma tonalidade',
              exercises:[]
            }
          ]
        }
      ]
    }
  ]
};

const AXES_UI = [
  {id:'e1',number:1,title:'Domínio técnico',subtitle:'Fundamentos de execução',symbol:'𝄢'},
  {id:'e2',number:2,title:'Visão harmônica',subtitle:'Compreensão musical',symbol:'♭'},
  {id:'e3',number:3,title:'Fluência nas escalas',subtitle:'Fluência no instrumento',symbol:'♯'},
  {id:'e4',number:4,title:'Criação musical',subtitle:'Expressão musical',symbol:'♫'}
];

let records = [];
let goalOverrides = loadJSON('baixo_goals_v5',{});
let selectedDate = localISO();
let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();
let currentScreen='home';
let selectedExercises=[];
let selectedStudyStatus='assisted';
let toastTimer=null;
let goalDraft=[];
let goalEditorContext=null;
let progressView={level:'root'};
let registerMode='study';
let registerAreaId='technique';
let registerSectionId='technique-10';
let registerLessonId='lesson-independence';
let registerRecordId=null;
let registerPreselectExercise=null;

const THEME_META={
  green:{name:'Verde escuro',desc:'Oliva, profundo e sóbrio',themeColor:'#151c13'},
  black:{name:'Preto',desc:'Neutro e contrastado',themeColor:'#0d0f12'},
  blue:{name:'Azul',desc:'Frio, escuro e profundo',themeColor:'#101923'},
  yellow:{name:'Amarelo',desc:'Âmbar sobre fundo escuro',themeColor:'#1c190d'}
};
let currentTheme=THEME_META[document.documentElement.dataset.theme]?document.documentElement.dataset.theme:'black';

function loadJSON(key,fallback){try{const raw=localStorage.getItem(key);return raw!==null?JSON.parse(raw):fallback}catch{return fallback}}
function structuredCloneSafe(v){return JSON.parse(JSON.stringify(v))}
function localISO(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
function nowTime(){const d=new Date();return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`}
function escapeHTML(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}
function inlineArg(v){return JSON.stringify(String(v??'')).replace(/&/g,'\\u0026').replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/"/g,'&quot;')}
function formatMin(min){min=Number(min)||0;if(min<60)return `${min} min`;const h=Math.floor(min/60),m=min%60;return m?`${h}h ${m}min`:`${h}h`}
function formatDateBR(iso){if(!iso)return'';const [y,m,d]=iso.split('-').map(Number);return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'long',year:'numeric'}).format(new Date(y,m-1,d))}
function startOfWeek(d=new Date()){const x=new Date(d);const day=x.getDay();const diff=(day===0?-6:1-day);x.setDate(x.getDate()+diff);x.setHours(0,0,0,0);return x}
function showToast(msg,type='ok'){const h=document.getElementById('toastContainer');clearTimeout(toastTimer);h.innerHTML=`<div class="toast ${type==='error'?'error':''}">${escapeHTML(msg)}</div>`;toastTimer=setTimeout(()=>h.innerHTML='',2200)}
function sumDuration(list){return list.reduce((s,r)=>s+(Number(r.duration)||0),0)}
function uniqueDays(list){return new Set(list.map(r=>r.date)).size}
function recordSortKey(r){return `${r.date||''} ${r.startTime||''} ${r.updatedAt||''}`}
function weekRecords(){const start=startOfWeek(),end=new Date(start);end.setDate(end.getDate()+7);return records.filter(r=>{if(!r.date)return false;const d=new Date(`${r.date}T12:00:00`);return d>=start&&d<end})}

function save(){
  localStorage.setItem('baixo_records_v5',JSON.stringify(records));
  localStorage.setItem('baixo_goals_v5',JSON.stringify(goalOverrides));
}
function applyTheme(theme){
  if(!THEME_META[theme])return;
  currentTheme=theme;
  document.documentElement.dataset.theme=theme;
  try{localStorage.setItem('baixo_theme',theme)}catch(e){}
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',THEME_META[theme].themeColor);
  document.querySelectorAll('.theme-choice').forEach(el=>el.classList.toggle('active',el.dataset.theme===theme));
}
function openAppearance(){
  showModal('Aparência',`<p class="section-copy" style="margin-top:-5px;margin-bottom:13px">Escolha o visual do app. A preferência fica salva neste aparelho.</p><div class="theme-grid">${Object.entries(THEME_META).map(([key,t])=>`<button class="theme-choice ${currentTheme===key?'active':''}" data-theme="${key}" onclick="applyTheme('${key}')"><span class="theme-check">✓</span><span class="theme-swatch ${key}"></span><strong>${t.name}</strong><small>${t.desc}</small></button>`).join('')}</div>`,'Personalização');
}

function findArea(id){return E1_STRUCTURE.areas.find(a=>a.id===id)}
function findSection(areaId,sectionId){return findArea(areaId)?.sections.find(s=>s.id===sectionId)}
function findLesson(areaId,sectionId,lessonId){return findSection(areaId,sectionId)?.lessons.find(l=>l.id===lessonId)}
function allLessons(){
  return E1_STRUCTURE.areas.flatMap(a=>a.sections.flatMap(s=>s.lessons.map(l=>({area:a,section:s,lesson:l}))));
}
function findLessonAny(lessonId){return allLessons().find(x=>x.lesson.id===lessonId)}
function allExercises(){
  return allLessons().flatMap(x=>(x.lesson.exercises||[]).map(e=>({...x,exercise:e})));
}
function findExercise(exerciseId){return allExercises().find(x=>x.exercise.id===exerciseId)}
function getGoals(exerciseId){
  const found=findExercise(exerciseId);
  if(!found)return[];
  const custom=goalOverrides[exerciseId];
  return Array.isArray(custom)?custom:[...(found.exercise.goals||[])];
}
function bestBpm(exerciseId){
  const vals=records.filter(r=>r.type==='practice'&&(r.exerciseIds||[]).includes(exerciseId)&&Number(r.bpm)>0).map(r=>Number(r.bpm));
  return vals.length?Math.max(...vals):null;
}
function exerciseSessionTime(exerciseId){
  return sumDuration(records.filter(r=>r.type==='practice'&&(r.exerciseIds||[]).includes(exerciseId)));
}
function lessonRecords(lessonId,type=null){return records.filter(r=>r.lessonId===lessonId&&(!type||r.type===type))}
function sectionRecords(sectionId){return records.filter(r=>r.sectionId===sectionId)}
function areaRecords(areaId){return records.filter(r=>r.areaId===areaId)}
function lessonStatusKey(lessonId){
  const list=lessonRecords(lessonId,'study').filter(r=>STATUS_META[r.statusAfter]).sort((a,b)=>recordSortKey(a).localeCompare(recordSortKey(b)));
  return list.length?list[list.length-1].statusAfter:'not_watched';
}
function statusHTML(statusKey){
  const s=STATUS_META[statusKey]||STATUS_META.not_watched;
  return `<span class="lesson-status ${s.cls}">${s.label}</span>`;
}
function nextStudyStatus(lessonId){
  const k=lessonStatusKey(lessonId);
  if(k==='not_watched')return'assisted';
  if(k==='assisted')return'studied';
  return'reviewed';
}
function statusCountsForLessons(lessons){
  const counts={not_watched:0,assisted:0,studied:0,reviewed:0};
  lessons.forEach(l=>counts[lessonStatusKey(l.id)]++);
  return counts;
}

function migrateOldData(){
  const existing=loadJSON('baixo_records_v5',null);
  if(Array.isArray(existing)){records=existing;return}
  const old=loadJSON('baixo_records',[]);
  if(!Array.isArray(old)||!old.length){records=[];save();return}
  const migrated=[];
  const unitMap=(prefix,units=[])=>units.map(u=>{
    const m=String(u).match(/(\d+)/);
    return m?`${prefix}-${String(Number(m[1])).padStart(2,'0')}`:null;
  }).filter(Boolean);
  old.forEach(r=>{
    const base={id:`migrated-${r.id||Date.now()}-${Math.random().toString(16).slice(2)}`,date:r.date||localISO(),startTime:r.startTime||'00:00',duration:Number(r.duration)||0,notes:r.notes||'',updatedAt:r.updatedAt||new Date().toISOString()};
    if(r.axisId==='e1'&&r.subId==='e1-i01'){
      migrated.push({...base,type:'practice',areaId:'technique',sectionId:'technique-10',lessonId:'lesson-independence',exerciseIds:unitMap('ind',r.units),bpm:Number(r.metricValue)||0});
    }else if(r.axisId==='e1'&&r.subId==='e1-i03'){
      migrated.push({...base,type:'practice',areaId:'groove',sectionId:'groove-course',lessonId:'lesson-groove-dig',exerciseIds:unitMap('groove-dig',r.units),bpm:Number(r.metricValue)||0});
    }else{
      migrated.push({...base,type:'legacy',axisId:r.axisId||'e1',legacyTitle:r.subId||r.activity||'Registro anterior'});
    }
  });
  records=migrated;
  save();
}

function setHeader(title,subtitle=''){document.getElementById('screenTitle').textContent=title;document.getElementById('screenSubtitle').textContent=subtitle}
function setNav(screen){['Home','History','Progress','More'].forEach(x=>document.getElementById(`nav${x}`)?.classList.remove('active'));const map={home:'Home',history:'History',progress:'Progress',more:'More'};document.getElementById(`nav${map[screen]}`)?.classList.add('active')}
function showOnly(id){['homeScreen','historyScreen','progressScreen','moreScreen'].forEach(x=>document.getElementById(x).classList.toggle('hidden',x!==id))}
function showHome(){currentScreen='home';showOnly('homeScreen');setNav('home');setHeader('Baixo',new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'numeric',month:'long'}).format(new Date()));renderHome()}
function showHistory(){currentScreen='history';showOnly('historyScreen');setNav('history');setHeader('Histórico','Estudo e prática ao longo do tempo');renderHistory()}
function showProgress(){currentScreen='progress';showOnly('progressScreen');setNav('progress');setHeader('Progresso','Navegue pela estrutura do Eixo 1');renderProgress()}
function showMore(){currentScreen='more';showOnly('moreScreen');setNav('more');setHeader('Mais','Metas, aparência e dados');renderMore()}
function refreshCurrent(){if(currentScreen==='home')renderHome();if(currentScreen==='history')renderHistory();if(currentScreen==='progress')renderProgress();if(currentScreen==='more')renderMore()}

function renderHome(){
  const host=document.getElementById('homeScreen');
  const wr=weekRecords(),total=sumDuration(wr),sessions=wr.length,days=uniqueDays(wr);
  host.innerHTML=`
    <div class="card hero">
      <div class="hero-main">
        <div><div class="eyebrow">Plano mestre</div><h2 class="section-title">Seu estudo, registrado em segundos.</h2><p class="section-copy">Toque no Eixo 1 e registre a sessão diretamente.</p></div>
        <div style="text-align:right"><div class="hero-stat">${formatMin(total)}</div><div class="hero-label">esta semana</div></div>
      </div>
      <div class="hero-metrics">
        <div class="metric"><b>${sessions}</b><span>registros</span></div>
        <div class="metric"><b>${days}</b><span>dias</span></div>
        <div class="metric"><b>${records.length}</b><span>total</span></div>
      </div>
    </div>
    <div class="eyebrow" style="margin:4px 2px 9px">Registrar treino</div>
    <div class="axis-grid">${AXES_UI.map(axis=>{
      const mins=axis.id==='e1'?sumDuration(wr.filter(r=>r.axisId==='e1'||r.areaId)):0;
      return `<button class="axis-card" data-axis="${axis.id}" data-symbol="${escapeHTML(axis.symbol)}" onclick="openAxis('${axis.id}')">
        <div class="axis-symbol">${escapeHTML(axis.symbol)}</div>
        <div class="axis-number">Eixo ${axis.number}</div>
        <div class="axis-title">${escapeHTML(axis.title)}</div>
        <div class="axis-subtitle">${escapeHTML(axis.subtitle)}</div>
        <div class="axis-footer"><span class="axis-time">${axis.id==='e1'?`${formatMin(mins)} na semana`:'a estruturar'}</span><span class="axis-arrow">›</span></div>
      </button>`}).join('')}</div>`;
}

function showModal(title,body,kicker='Registro'){
  document.getElementById('modalContainer').innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="modal-content"><div class="sheet-handle"></div><div class="sheet-head"><div class="sheet-head-copy"><div class="sheet-kicker">${escapeHTML(kicker)}</div><div class="sheet-title">${escapeHTML(title)}</div></div><button class="sheet-close" onclick="closeModal()" aria-label="Fechar">×</button></div>${body}</div></div>`;
  document.body.style.overflow='hidden';
}
function closeModal(){document.getElementById('modalContainer').innerHTML='';document.body.style.overflow=''}

function openAxis(axisId){
  if(axisId!=='e1'){
    showModal(AXES_UI.find(a=>a.id===axisId)?.title||'Eixo',`<div class="empty"><div class="empty-symbol">♪</div>Este eixo ainda não foi estruturado. Vamos construí-lo quando você chegar nele no curso.</div>`,'Plano mestre');
    return;
  }
  openUnifiedRecordForm();
}
function openArea(areaId){
  const area=findArea(areaId);if(!area)return;
  if(area.sections.length===1){openSection(areaId,area.sections[0].id);return}
  showModal(area.name,`<p class="section-copy" style="margin-top:-5px">${escapeHTML(area.course)}</p><div class="tree-list">${area.sections.map(section=>{
    const rs=sectionRecords(section.id),counts=statusCountsForLessons(section.lessons);
    return `<button class="tree-card" onclick="openSection('${areaId}','${section.id}')">
      <span class="tree-icon">♩</span>
      <span class="tree-copy"><strong>${escapeHTML(section.name)}</strong><span>${escapeHTML(section.subtitle||'')} · ${section.lessons.length} aula${section.lessons.length===1?'':'s'}</span></span>
      <span class="tree-side"><b>${formatMin(sumDuration(rs))}</b><span>${counts.reviewed} revisada${counts.reviewed===1?'':'s'}</span></span>
    </button>`;
  }).join('')}</div>`,'Curso / trilha');
}
function openSection(areaId,sectionId){
  const area=findArea(areaId),section=findSection(areaId,sectionId);if(!area||!section)return;
  const list=section.lessons.map(lesson=>{
    const study=sumDuration(lessonRecords(lesson.id,'study')),practice=sumDuration(lessonRecords(lesson.id,'practice'));
    return `<button class="tree-card" onclick="openLesson('${areaId}','${sectionId}','${lesson.id}')">
      <span class="tree-icon">${escapeHTML(lesson.code||'♪')}</span>
      <span class="tree-copy"><strong>${escapeHTML(lesson.name)}</strong><span>${statusHTML(lessonStatusKey(lesson.id))} · ${lesson.exercises.length?`${lesson.exercises.length} exercícios`:'sem exercícios por enquanto'}</span></span>
      <span class="tree-side"><b>${formatMin(study+practice)}</b><span>${practice?`${formatMin(practice)} prática`:`${formatMin(study)} estudo`}</span></span>
    </button>`;
  }).join('');
  showModal(section.name,`<p class="section-copy" style="margin-top:-5px">${escapeHTML(area.course)}</p><div class="tree-list">${list}</div>`,'Aulas');
}

function lessonDetailBody(areaId,sectionId,lessonId){
  const area=findArea(areaId),section=findSection(areaId,sectionId),lesson=findLesson(areaId,sectionId,lessonId);
  if(!area||!section||!lesson)return'';
  const studyTime=sumDuration(lessonRecords(lessonId,'study'));
  const practiceTime=sumDuration(lessonRecords(lessonId,'practice'));
  const exercises=lesson.exercises||[];
  const exHtml=exercises.length?`<div class="section-label" style="margin-top:16px">Exercícios</div><div class="exercise-list">${exercises.map(ex=>{
    const best=bestBpm(ex.id),goals=getGoals(ex.id);
    return `<div class="exercise-row">
      <div class="exercise-row-top"><div class="exercise-name">${escapeHTML(ex.name)}</div><div class="exercise-best">${best?`${best} BPM`:'—'}</div></div>
      <div class="goal-line">${goals.length?goals.map(g=>`<span class="goal-chip ${best&&best>=g?'done':''}">${best&&best>=g?'✓ ':''}${g} BPM</span>`).join(''):`<span class="goal-chip">Sem metas</span>`}</div>
      <div class="exercise-actions"><button class="exercise-train" onclick="openPracticeForm('${areaId}','${sectionId}','${lessonId}',null,'${ex.id}')">Registrar prática</button><button class="exercise-goals-btn" onclick="openGoalEditor('${ex.id}','${areaId}','${sectionId}','${lessonId}')">Editar metas</button></div>
    </div>`;
  }).join('')}</div>`:'';
  return `<div class="lesson-detail-head">
    <div class="lesson-detail-top"><div><div class="eyebrow">${escapeHTML(section.name)}</div><div class="lesson-detail-title">${escapeHTML(lesson.name)}</div></div>${statusHTML(lessonStatusKey(lessonId))}</div>
    <div class="lesson-detail-meta"><div class="metric"><b>${formatMin(studyTime)}</b><span>estudo</span></div><div class="metric"><b>${formatMin(practiceTime)}</b><span>prática</span></div><div class="metric"><b>${formatMin(studyTime+practiceTime)}</b><span>total</span></div></div>
  </div>
  <div class="lesson-actions ${exercises.length?'':'one'}"><button class="action-study" onclick="openStudyForm('${areaId}','${sectionId}','${lessonId}')">Registrar estudo da aula</button>${exercises.length?`<button class="action-practice" onclick="openPracticeForm('${areaId}','${sectionId}','${lessonId}')">Registrar prática</button>`:''}</div>
  ${exHtml}`;
}
function openLesson(areaId,sectionId,lessonId){
  const lesson=findLesson(areaId,sectionId,lessonId);if(!lesson)return;
  showModal(lesson.name,lessonDetailBody(areaId,sectionId,lessonId),'Aula');
}

function setStudyStatus(key){
  if(!STATUS_META[key])return;
  selectedStudyStatus=key;
  document.querySelectorAll('.status-choice').forEach(el=>el.classList.toggle('active',el.dataset.status===key));
}
function durationFields(value){
  return `<div class="form-label">Duração <small>minutos</small></div><div class="duration-chips">${[10,20,30,45,60].map(n=>`<button type="button" class="chip ${Number(value)===n?'active':''}" onclick="setDuration(${n},this)">${n}</button>`).join('')}</div><input id="recordDuration" type="number" min="1" max="600" inputmode="numeric" placeholder="Duração em minutos" value="${value??''}">`;
}
function setDuration(n,el){document.getElementById('recordDuration').value=n;document.querySelectorAll('.duration-chips .chip').forEach(x=>x.classList.toggle('active',x===el))}
function readCommonForm(){
  return {date:document.getElementById('recordDate').value,startTime:document.getElementById('recordTime').value,duration:Number(document.getElementById('recordDuration').value)||0,notes:document.getElementById('recordNotes').value.trim()};
}
function validateCommon(data){if(!data.date||!data.startTime){showToast('Informe data e horário.','error');return false}if(data.duration<=0){showToast('Informe a duração.','error');return false}return true}
function upsertRecord(payload,recordId){
  if(recordId){const i=records.findIndex(r=>String(r.id)===String(recordId));if(i>=0)records[i]=payload}else records.push(payload);
  records.sort((a,b)=>recordSortKey(a).localeCompare(recordSortKey(b)));save();closeModal();showToast(recordId?'Registro atualizado.':'Registro salvo.');refreshCurrent();
}
function deleteRecord(id){if(!confirm('Excluir este registro?'))return;records=records.filter(r=>String(r.id)!==String(id));save();closeModal();showToast('Registro excluído.');refreshCurrent()}

function registerEligibleAreas(mode){
  if(mode==='practice')return E1_STRUCTURE.areas.filter(a=>a.sections.some(s=>s.lessons.some(l=>(l.exercises||[]).length)));
  return E1_STRUCTURE.areas;
}
function registerNormalizePath(resetLesson=true){
  const areas=registerEligibleAreas(registerMode);
  if(!areas.some(a=>a.id===registerAreaId))registerAreaId=areas[0]?.id||null;
  const area=findArea(registerAreaId);
  if(!area)return;
  const sections=registerMode==='practice'?area.sections.filter(s=>s.lessons.some(l=>(l.exercises||[]).length)):area.sections;
  if(!sections.some(s=>s.id===registerSectionId))registerSectionId=sections[0]?.id||null;
  const section=findSection(registerAreaId,registerSectionId);
  if(!section)return;
  const lessons=registerMode==='practice'?section.lessons.filter(l=>(l.exercises||[]).length):section.lessons;
  if(!lessons.some(l=>l.id===registerLessonId))registerLessonId=lessons[0]?.id||null;
  if(resetLesson){
    if(registerMode==='study')selectedStudyStatus=nextStudyStatus(registerLessonId);
    else selectedExercises=registerPreselectExercise?[registerPreselectExercise]:[];
  }
}
function registerTabs(items,activeId,onClick,labelFn){
  return `<div class="register-tabs-scroll">${items.map(item=>`<button type="button" class="register-select-tab ${item.id===activeId?'active':''}" onclick="${onClick}('${item.id}')">${escapeHTML(labelFn(item))}</button>`).join('')}</div>`;
}
function renderRegisterSelector(){
  const host=document.getElementById('registerSelector');if(!host)return;
  registerNormalizePath(false);
  const area=findArea(registerAreaId),section=findSection(registerAreaId,registerSectionId),lesson=findLesson(registerAreaId,registerSectionId,registerLessonId);
  if(!area||!section||!lesson){host.innerHTML='<div class="empty">Nenhum conteúdo disponível.</div>';return}
  const areas=registerEligibleAreas(registerMode);
  const sections=registerMode==='practice'?area.sections.filter(s=>s.lessons.some(l=>(l.exercises||[]).length)):area.sections;
  const lessons=registerMode==='practice'?section.lessons.filter(l=>(l.exercises||[]).length):section.lessons;
  let specific='';
  if(registerMode==='study'){
    specific=`<div class="register-status-wrap"><div class="form-label">Status após esta sessão <small>estado da aula</small></div><div class="status-choice-grid">${Object.entries(STATUS_META).map(([k,st])=>`<button type="button" data-status="${k}" class="status-choice ${selectedStudyStatus===k?'active':''}" onclick="setStudyStatus('${k}')">${st.label}</button>`).join('')}</div></div>`;
  }else{
    const bpm=Number(document.getElementById('bpmNumber')?.value)||Number((registerRecordId?records.find(r=>String(r.id)===String(registerRecordId))?.bpm:0))||0;
    if(!selectedExercises.length&&registerPreselectExercise&&lesson.exercises.some(e=>e.id===registerPreselectExercise))selectedExercises=[registerPreselectExercise];
    specific=`<div class="register-exercise-wrap"><div class="form-label">Exercícios praticados <small>marque um ou mais</small></div><div class="unit-grid">${lesson.exercises.map(ex=>`<button type="button" class="unit-chip ${selectedExercises.includes(ex.id)?'active':''}" data-exercise="${ex.id}" onclick="togglePracticeExercise(this)">${escapeHTML(ex.name)}</button>`).join('')}</div><div class="bpm-panel"><div class="bpm-title-row"><div class="bpm-title">BPM trabalhado</div><div class="small">0 a 200</div></div><div class="bpm-readout" id="bpmReadout">${bpm}<small>BPM</small></div><input class="bpm-range" id="bpmRange" type="range" min="0" max="200" step="1" value="${bpm}" oninput="setBpm(this.value,'range')"><div class="bpm-scale"><span>0</span><span>100</span><span>200</span></div><div class="bpm-number-wrap"><div><div class="form-label">Valor exato</div><input id="bpmNumber" type="number" min="0" max="200" inputmode="numeric" value="${bpm}" oninput="setBpm(this.value,'number')"></div><div class="small" style="padding-bottom:13px">BPM</div></div><div class="practice-goal-hints" id="practiceGoalHints"></div></div></div>`;
  }
  host.innerHTML=`<div class="register-selector-head"><strong>Conteúdo</strong><span>selecione por abas</span></div>
    <div class="form-label">Área</div>${registerTabs(areas,registerAreaId,'setRegisterArea',a=>a.name)}
    ${sections.length>1?`<div class="form-label" style="margin-top:10px">Bloco</div>${registerTabs(sections,registerSectionId,'setRegisterSection',x=>x.name)}`:''}
    <div class="form-label" style="margin-top:10px">Aula</div>${registerTabs(lessons,registerLessonId,'setRegisterLesson',x=>x.name)}
    <div class="register-path-summary"><b>${escapeHTML(area.name)}</b> › ${escapeHTML(section.name)} › ${escapeHTML(lesson.name)}</div>
    ${specific}`;
  if(registerMode==='practice')updatePracticeGoalHints();
}
function setRegisterMode(mode){
  if(registerRecordId)return;
  if(!['study','practice'].includes(mode))return;
  registerMode=mode;registerPreselectExercise=null;registerNormalizePath(true);
  document.querySelectorAll('.register-mode-tab').forEach(el=>el.classList.toggle('active',el.dataset.mode===mode));
  renderRegisterSelector();
  const btn=document.getElementById('registerSaveBtn');if(btn)btn.textContent=mode==='study'?'Salvar sessão de estudo':'Salvar prática';
}
function setRegisterArea(areaId){registerAreaId=areaId;registerSectionId=null;registerLessonId=null;registerPreselectExercise=null;registerNormalizePath(true);renderRegisterSelector()}
function setRegisterSection(sectionId){registerSectionId=sectionId;registerLessonId=null;registerPreselectExercise=null;registerNormalizePath(true);renderRegisterSelector()}
function setRegisterLesson(lessonId){registerLessonId=lessonId;registerPreselectExercise=null;if(registerMode==='study')selectedStudyStatus=nextStudyStatus(lessonId);else selectedExercises=[];renderRegisterSelector()}

function openUnifiedRecordForm(opts={}){
  const existing=opts.recordId?records.find(r=>String(r.id)===String(opts.recordId)):null;
  registerRecordId=existing?.id||null;
  registerMode=existing?.type||opts.mode||'study';
  registerAreaId=existing?.areaId||opts.areaId||registerAreaId||'technique';
  registerSectionId=existing?.sectionId||opts.sectionId||registerSectionId||null;
  registerLessonId=existing?.lessonId||opts.lessonId||registerLessonId||null;
  registerPreselectExercise=opts.preselect||null;
  selectedExercises=existing?.exerciseIds?[...existing.exerciseIds]:(opts.preselect?[opts.preselect]:[]);
  selectedStudyStatus=existing?.statusAfter||selectedStudyStatus;
  registerNormalizePath(!existing);
  if(existing?.type==='study')selectedStudyStatus=existing.statusAfter||nextStudyStatus(registerLessonId);
  const modeLock=existing?`<div class="register-edit-lock">Editando um registro existente. O tipo da sessão fica preservado; você pode alterar conteúdo, tempo, observações e demais dados.</div>`:'';
  showModal(existing?'Editar registro':'Novo registro — Eixo 1',`
    <div class="register-shell">
      <div class="register-common"><div class="register-common-title"><strong>Registro</strong><span>dados da sessão</span></div><div class="form-row"><div><div class="form-label">Data</div><input id="recordDate" type="date" value="${existing?.date||localISO()}"></div><div><div class="form-label">Hora</div><input id="recordTime" type="time" value="${existing?.startTime||nowTime()}"></div></div>${durationFields(existing?.duration)}<div class="form-label">Observações <small>opcional</small></div><textarea id="recordNotes" placeholder="Notas da sessão...">${escapeHTML(existing?.notes||'')}</textarea></div>
      ${modeLock}<div class="register-mode-tabs"><button type="button" data-mode="study" class="register-mode-tab study ${registerMode==='study'?'active':''}" ${existing&&registerMode!=='study'?'disabled':''} onclick="setRegisterMode('study')">Estudo da aula</button><button type="button" data-mode="practice" class="register-mode-tab practice ${registerMode==='practice'?'active':''}" ${existing&&registerMode!=='practice'?'disabled':''} onclick="setRegisterMode('practice')">Prática</button></div>
      <div id="registerSelector" class="register-selector"></div>
      <button class="primary register-save" id="registerSaveBtn" onclick="saveUnifiedRecord()">${existing?'Salvar alterações':registerMode==='study'?'Salvar sessão de estudo':'Salvar prática'}</button>
      ${existing?`<button class="secondary danger" onclick="deleteRecord(${inlineArg(existing.id)})">Excluir registro</button>`:''}
    </div>
  `,existing?'Edição':'Registro direto');
  renderRegisterSelector();
}
function saveUnifiedRecord(){
  const d=readCommonForm();if(!validateCommon(d))return;
  if(registerMode==='study'){
    const payload={id:registerRecordId||`${Date.now()}-${Math.random().toString(16).slice(2)}`,type:'study',axisId:'e1',areaId:registerAreaId,sectionId:registerSectionId,lessonId:registerLessonId,statusAfter:selectedStudyStatus,...d,updatedAt:new Date().toISOString()};
    upsertRecord(payload,registerRecordId);return;
  }
  if(!selectedExercises.length){showToast('Marque pelo menos um exercício.','error');return}
  const bpm=Math.max(0,Math.min(200,Number(document.getElementById('bpmNumber')?.value)||0));
  const payload={id:registerRecordId||`${Date.now()}-${Math.random().toString(16).slice(2)}`,type:'practice',axisId:'e1',areaId:registerAreaId,sectionId:registerSectionId,lessonId:registerLessonId,exerciseIds:[...selectedExercises],bpm,...d,updatedAt:new Date().toISOString()};
  upsertRecord(payload,registerRecordId);
}
function openStudyForm(areaId,sectionId,lessonId,recordId=null){openUnifiedRecordForm({mode:'study',areaId,sectionId,lessonId,recordId})}
function openPracticeForm(areaId,sectionId,lessonId,recordId=null,preselect=null){openUnifiedRecordForm({mode:'practice',areaId,sectionId,lessonId,recordId,preselect})}
function togglePracticeExercise(el){
  const id=el.dataset.exercise;const i=selectedExercises.indexOf(id);if(i>=0)selectedExercises.splice(i,1);else selectedExercises.push(id);el.classList.toggle('active');updatePracticeGoalHints();
}
function setBpm(value,source='range'){
  let n=Math.max(0,Math.min(200,Number(value)||0));const range=document.getElementById('bpmRange'),number=document.getElementById('bpmNumber'),readout=document.getElementById('bpmReadout');if(range&&source!=='range')range.value=n;if(number&&source!=='number')number.value=n;if(readout)readout.innerHTML=`${n}<small>BPM</small>`;
}
function updatePracticeGoalHints(){
  const host=document.getElementById('practiceGoalHints');if(!host)return;const goals=[...new Set(selectedExercises.flatMap(getGoals))].sort((a,b)=>a-b);host.innerHTML=goals.length?goals.map(g=>`<span class="goal-chip">${g} BPM</span>`).join(''):'<span class="goal-chip">Sem metas definidas</span>';
}

function renderGoalEditor(){
  const c=goalEditorContext;if(!c)return;
  const found=findExercise(c.exerciseId);if(!found)return;
  showModal(`Metas — ${found.exercise.name}`,`
    <p class="section-copy" style="margin-top:-5px;margin-bottom:13px">Crie, altere, exclua ou reorganize as metas deste exercício. Os registros antigos de BPM não são modificados.</p>
    <div class="goal-editor-list">${goalDraft.length?goalDraft.map((g,i)=>`<div class="goal-editor-row"><input type="number" min="1" max="200" value="${g}" oninput="goalDraft[${i}]=Number(this.value)||0"><button class="goal-mini-btn" onclick="moveGoal(${i},-1)" ${i===0?'disabled':''}>↑</button><button class="goal-mini-btn" onclick="moveGoal(${i},1)" ${i===goalDraft.length-1?'disabled':''}>↓</button><button class="goal-mini-btn danger" onclick="removeGoal(${i})">×</button></div>`).join(''):`<div class="empty">Nenhuma meta definida.</div>`}</div>
    <button class="secondary" onclick="addGoal()">+ Adicionar meta</button>
    <div style="height:9px"></div>
    <button class="primary" onclick="saveGoals()">Salvar metas</button>
  `,'Objetivos do exercício');
}
function openGoalEditor(exerciseId,areaId=null,sectionId=null,lessonId=null){
  goalEditorContext={exerciseId,areaId,sectionId,lessonId};
  goalDraft=[...getGoals(exerciseId)];
  renderGoalEditor();
}
function addGoal(){goalDraft.push(goalDraft.length?Math.min(200,goalDraft[goalDraft.length-1]+20):80);renderGoalEditor()}
function removeGoal(i){goalDraft.splice(i,1);renderGoalEditor()}
function moveGoal(i,dir){const j=i+dir;if(j<0||j>=goalDraft.length)return;[goalDraft[i],goalDraft[j]]=[goalDraft[j],goalDraft[i]];renderGoalEditor()}
function saveGoals(){
  const c=goalEditorContext;if(!c)return;
  goalOverrides[c.exerciseId]=goalDraft.map(Number).filter(x=>Number.isFinite(x)&&x>0&&x<=200);
  save();
  showToast('Metas atualizadas.');
  if(c.areaId&&c.sectionId&&c.lessonId)openLesson(c.areaId,c.sectionId,c.lessonId);else openGoalsManager();
}

function renderHistory(){
  const host=document.getElementById('historyScreen');
  const months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const first=new Date(calendarYear,calendarMonth,1),total=new Date(calendarYear,calendarMonth+1,0).getDate(),start=first.getDay();
  const monthKey=`${calendarYear}-${String(calendarMonth+1).padStart(2,'0')}`;
  const counts={};records.filter(r=>(r.date||'').startsWith(monthKey)).forEach(r=>counts[r.date]=(counts[r.date]||0)+1);
  let days='';for(let i=0;i<start;i++)days+='<span></span>';for(let d=1;d<=total;d++){const iso=`${calendarYear}-${String(calendarMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;days+=`<button class="cal-day ${counts[iso]?'has':''} ${iso===localISO()?'today':''} ${iso===selectedDate?'selected':''}" onclick="selectHistoryDate('${iso}')">${d}</button>`}
  const dayRecords=records.filter(r=>r.date===selectedDate).sort((a,b)=>(a.startTime||'').localeCompare(b.startTime||''));
  host.innerHTML=`<div class="history-shell"><div class="card calendar-card"><div class="calendar-top"><button class="icon-btn" onclick="changeMonth(-1)">‹</button><div class="calendar-title">${months[calendarMonth]} ${calendarYear}</div><button class="icon-btn" onclick="changeMonth(1)">›</button></div><div class="calendar-grid">${['D','S','T','Q','Q','S','S'].map(x=>`<div class="cal-head">${x}</div>`).join('')}${days}</div></div>
  <div class="card day-summary"><div class="day-summary-head"><div><div class="eyebrow">Dia selecionado</div><h3>${formatDateBR(selectedDate)}</h3></div><div class="day-total">${formatMin(sumDuration(dayRecords))}</div></div>${dayRecords.length?`<div class="timeline">${dayRecords.map(recordCardHTML).join('')}</div>`:`<div class="empty" style="margin-top:12px"><div class="empty-symbol">♪</div>Nenhum estudo ou prática registrado neste dia.</div>`}</div></div>`;
}
function recordCardHTML(r){
  if(r.type==='legacy')return `<div class="record-card"><div class="record-top"><div><div class="record-axis">Registro anterior</div><div class="record-title">${escapeHTML(r.legacyTitle||'Registro')}</div><span class="record-kind">legado</span></div><div class="record-time">${escapeHTML(r.startTime||'')} · ${formatMin(r.duration)}</div></div>${r.notes?`<div class="record-note">${escapeHTML(r.notes)}</div>`:''}</div>`;
  const found=findLessonAny(r.lessonId);if(!found)return'';
  const {area,section,lesson}=found;
  if(r.type==='study'){
    return `<div class="record-card" data-axis="e1" onclick="openStudyForm('${area.id}','${section.id}','${lesson.id}',${inlineArg(r.id)})"><div class="record-top"><div><div class="record-axis">${escapeHTML(area.name)} · ${escapeHTML(section.name)}</div><div class="record-title">${escapeHTML(lesson.name)}</div><span class="record-kind study">estudo · ${STATUS_META[r.statusAfter]?.label||'—'}</span></div><div class="record-time">${escapeHTML(r.startTime)} · ${formatMin(r.duration)}</div></div>${r.notes?`<div class="record-note">${escapeHTML(r.notes)}</div>`:''}</div>`;
  }
  const names=(r.exerciseIds||[]).map(id=>findExercise(id)?.exercise.name).filter(Boolean);
  return `<div class="record-card" data-axis="e1" onclick="openPracticeForm('${area.id}','${section.id}','${lesson.id}',${inlineArg(r.id)})"><div class="record-top"><div><div class="record-axis">${escapeHTML(area.name)} · ${escapeHTML(section.name)}</div><div class="record-title">${escapeHTML(lesson.name)}</div><span class="record-kind practice">prática${r.bpm?` · ${r.bpm} BPM`:''}</span></div><div class="record-time">${escapeHTML(r.startTime)} · ${formatMin(r.duration)}</div></div><div class="record-meta">${names.map(n=>`<span class="mini-tag">${escapeHTML(n)}</span>`).join('')}</div>${r.notes?`<div class="record-note">${escapeHTML(r.notes)}</div>`:''}</div>`;
}
function changeMonth(delta){calendarMonth+=delta;if(calendarMonth<0){calendarMonth=11;calendarYear--}if(calendarMonth>11){calendarMonth=0;calendarYear++}const d=Math.min(Number(selectedDate?.split('-')[2]||1),new Date(calendarYear,calendarMonth+1,0).getDate());selectedDate=`${calendarYear}-${String(calendarMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;renderHistory()}
function selectHistoryDate(iso){selectedDate=iso;renderHistory()}

function progressTotals(list){
  const study=sumDuration(list.filter(r=>r.type==='study')),practice=sumDuration(list.filter(r=>r.type==='practice'));
  return {study,practice,total:study+practice};
}
function renderProgress(){
  const host=document.getElementById('progressScreen');
  const all=records.filter(r=>r.type==='study'||r.type==='practice');
  const totals=progressTotals(all),wr=weekRecords().filter(r=>r.type==='study'||r.type==='practice');
  let browser='';
  if(progressView.level==='root')browser=progressRootHTML();
  if(progressView.level==='area')browser=progressAreaHTML(progressView.areaId);
  if(progressView.level==='section')browser=progressSectionHTML(progressView.areaId,progressView.sectionId);
  if(progressView.level==='lesson')browser=progressLessonHTML(progressView.areaId,progressView.sectionId,progressView.lessonId);
  host.innerHTML=`<div class="card hero"><div class="hero-main"><div><div class="eyebrow">Eixo 1</div><h2 class="section-title">Mapa de progresso</h2><p class="section-copy">Navegue pela estrutura e veja estado atual, estudo, prática e metas.</p></div><div style="text-align:right"><div class="hero-stat">${formatMin(sumDuration(wr))}</div><div class="hero-label">esta semana</div></div></div><div class="hero-metrics"><div class="metric"><b>${formatMin(totals.study)}</b><span>estudo</span></div><div class="metric"><b>${formatMin(totals.practice)}</b><span>prática</span></div><div class="metric"><b>${formatMin(totals.total)}</b><span>total</span></div></div></div>${browser}`;
}
function breadcrumb(parts){
  return `<div class="progress-breadcrumb">${parts.map((p,i)=>`${i?'<span class="crumb-sep">›</span>':''}<button class="crumb ${i===parts.length-1?'current':''}" onclick="${p.action||''}">${escapeHTML(p.label)}</button>`).join('')}</div>`;
}
function progressRootHTML(){
  return `${breadcrumb([{label:'Eixo 1',action:"progressGo('root')"}])}<div class="progress-browser">${E1_STRUCTURE.areas.map(area=>{
    const rs=areaRecords(area.id),t=progressTotals(rs),lessons=area.sections.flatMap(s=>s.lessons),counts=statusCountsForLessons(lessons);
    return `<button class="progress-node" onclick="progressOpenArea('${area.id}')"><div class="progress-node-top"><div><div class="eyebrow">${escapeHTML(area.course)}</div><h3>${escapeHTML(area.name)}</h3></div><div class="progress-node-time">${formatMin(t.total)}</div></div><div class="progress-node-sub">${lessons.length} aulas · ${counts.assisted} assistidas · ${counts.studied} estudadas · ${counts.reviewed} revisadas</div><div class="progress-node-metrics"><span class="progress-mini">${formatMin(t.study)} estudo</span><span class="progress-mini">${formatMin(t.practice)} prática</span></div></button>`;
  }).join('')}</div>`;
}
function progressAreaHTML(areaId){
  const area=findArea(areaId);if(!area)return'';
  return `${breadcrumb([{label:'Eixo 1',action:"progressGo('root')"},{label:area.name,action:`progressOpenArea('${areaId}')`}])}<button class="progress-back" onclick="progressGo('root')">‹ Voltar ao Eixo 1</button><div class="progress-browser">${area.sections.map(section=>{
    const rs=sectionRecords(section.id),t=progressTotals(rs),counts=statusCountsForLessons(section.lessons);
    return `<button class="progress-node" onclick="progressOpenSection('${areaId}','${section.id}')"><div class="progress-node-top"><div><div class="eyebrow">${escapeHTML(area.name)}</div><h3>${escapeHTML(section.name)}</h3></div><div class="progress-node-time">${formatMin(t.total)}</div></div><div class="progress-node-sub">${section.lessons.length} aula${section.lessons.length===1?'':'s'} · ${counts.studied+counts.reviewed} estudada${counts.studied+counts.reviewed===1?'':'s'} ou revisada${counts.studied+counts.reviewed===1?'':'s'}</div><div class="progress-node-metrics"><span class="progress-mini">${formatMin(t.study)} estudo</span><span class="progress-mini">${formatMin(t.practice)} prática</span></div></button>`;
  }).join('')}</div>`;
}
function progressSectionHTML(areaId,sectionId){
  const area=findArea(areaId),section=findSection(areaId,sectionId);if(!area||!section)return'';
  return `${breadcrumb([{label:'Eixo 1',action:"progressGo('root')"},{label:area.name,action:`progressOpenArea('${areaId}')`},{label:section.name,action:`progressOpenSection('${areaId}','${sectionId}')`}])}<button class="progress-back" onclick="progressOpenArea('${areaId}')">‹ Voltar para ${escapeHTML(area.name)}</button><div class="progress-browser">${section.lessons.map(lesson=>{
    const t=progressTotals(lessonRecords(lesson.id)),status=lessonStatusKey(lesson.id);
    const bests=(lesson.exercises||[]).map(e=>bestBpm(e.id)).filter(Boolean);
    return `<button class="progress-node" onclick="progressOpenLesson('${areaId}','${sectionId}','${lesson.id}')"><div class="progress-node-top"><div><div class="eyebrow">Aula ${escapeHTML(lesson.code||'')}</div><h3>${escapeHTML(lesson.name)}</h3></div><div class="progress-node-time">${formatMin(t.total)}</div></div><div class="progress-node-sub">${statusHTML(status)}</div><div class="progress-node-metrics"><span class="progress-mini">${formatMin(t.study)} estudo</span><span class="progress-mini">${formatMin(t.practice)} prática</span>${lesson.exercises.length?`<span class="progress-mini">${lesson.exercises.length} exercícios</span>`:''}${bests.length?`<span class="progress-mini">melhor ${Math.max(...bests)} BPM</span>`:''}</div></button>`;
  }).join('')}</div>`;
}
function progressLessonHTML(areaId,sectionId,lessonId){
  const area=findArea(areaId),section=findSection(areaId,sectionId),lesson=findLesson(areaId,sectionId,lessonId);if(!area||!section||!lesson)return'';
  const t=progressTotals(lessonRecords(lessonId));
  const exercises=lesson.exercises||[];
  return `${breadcrumb([{label:'Eixo 1',action:"progressGo('root')"},{label:area.name,action:`progressOpenArea('${areaId}')`},{label:section.name,action:`progressOpenSection('${areaId}','${sectionId}')`},{label:lesson.name,action:''}])}<button class="progress-back" onclick="progressOpenSection('${areaId}','${sectionId}')">‹ Voltar para ${escapeHTML(section.name)}</button>
  <div class="lesson-detail-head"><div class="lesson-detail-top"><div><div class="eyebrow">Estado atual</div><div class="lesson-detail-title">${escapeHTML(lesson.name)}</div></div>${statusHTML(lessonStatusKey(lessonId))}</div><div class="lesson-detail-meta"><div class="metric"><b>${formatMin(t.study)}</b><span>estudo</span></div><div class="metric"><b>${formatMin(t.practice)}</b><span>prática</span></div><div class="metric"><b>${formatMin(t.total)}</b><span>total</span></div></div></div>
  ${exercises.length?`<div class="section-label">Exercícios</div><div class="exercise-list">${exercises.map(ex=>{const best=bestBpm(ex.id),goals=getGoals(ex.id);return `<div class="exercise-row"><div class="exercise-row-top"><div><div class="exercise-name">${escapeHTML(ex.name)}</div><div class="progress-note">${formatMin(exerciseSessionTime(ex.id))} em sessões que incluíram este exercício</div></div><div class="exercise-best">${best?`${best} BPM`:'—'}</div></div><div class="goal-line">${goals.length?goals.map(g=>`<span class="goal-chip ${best&&best>=g?'done':''}">${best&&best>=g?'✓ ':''}${g} BPM</span>`).join(''):`<span class="goal-chip">Sem metas</span>`}</div><div class="exercise-actions"><button class="exercise-train" onclick="openPracticeForm('${areaId}','${sectionId}','${lessonId}',null,'${ex.id}')">Registrar prática</button><button class="exercise-goals-btn" onclick="openGoalEditor('${ex.id}','${areaId}','${sectionId}','${lessonId}')">Editar metas</button></div></div>`}).join('')}</div>`:`<div class="empty" style="margin-top:12px">Esta aula não possui exercícios cadastrados por enquanto.</div>`}`;
}
function progressGo(level){progressView={level};renderProgress()}
function progressOpenArea(areaId){progressView={level:'area',areaId};renderProgress()}
function progressOpenSection(areaId,sectionId){progressView={level:'section',areaId,sectionId};renderProgress()}
function progressOpenLesson(areaId,sectionId,lessonId){progressView={level:'lesson',areaId,sectionId,lessonId};renderProgress()}

function renderMore(){
  document.getElementById('moreScreen').innerHTML=`<div class="more-grid"><div class="eyebrow" style="margin:2px 2px 3px">Versão 6 · registro direto por abas</div>
    <button class="menu-btn" onclick="openGoalsManager()"><strong>Metas dos exercícios</strong><span>Editar, criar, excluir e reorganizar metas de BPM de qualquer exercício.</span></button>
    <button class="menu-btn" onclick="openAppearance()"><strong>Aparência</strong><span>Alternar entre verde escuro, preto, azul e amarelo.</span></button>
    <button class="menu-btn" onclick="exportJSON()"><strong>Exportar backup</strong><span>Baixar registros, metas personalizadas e aparência em JSON.</span></button>
    <button class="menu-btn" onclick="document.getElementById('importFile').click()"><strong>Importar backup</strong><span>Mesclar registros e restaurar metas personalizadas.</span></button>
    <button class="menu-btn" onclick="exportCSV()"><strong>Exportar planilha</strong><span>Baixar estudo e prática em CSV.</span></button>
  </div>`;
}
function openGoalsManager(){
  const groups=allLessons().filter(x=>x.lesson.exercises.length).map(({area,section,lesson})=>`<div class="manage-axis"><div class="manage-axis-head"><strong>${escapeHTML(area.name)} · ${escapeHTML(lesson.name)}</strong></div>${lesson.exercises.map(ex=>`<div class="manage-row"><div class="manage-row-copy"><b>${escapeHTML(ex.name)}</b><span>${getGoals(ex.id).length?`metas ${getGoals(ex.id).join(' → ')} BPM`:'sem metas'}</span></div><button class="manage-edit" onclick="openGoalEditor('${ex.id}')">Editar</button></div>`).join('')}</div>`).join('');
  showModal('Metas dos exercícios',groups,'Configuração');
}

function exportJSON(){
  const data={app:'baixo-plano-mestre',version:APP_VERSION,exportadoEm:new Date().toISOString(),records,goalOverrides,appearance:{theme:currentTheme}};
  downloadBlob(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),'baixo-backup-v6.json');showToast('Backup exportado.');
}
function csvEscape(v){const s=String(v??'');return `"${s.replace(/"/g,'""')}"`}
function exportCSV(){
  let csv='Data;Hora;Tipo;Area;Secao;Aula;Exercicios;Status;BPM;DuracaoMin;Notas\n';
  records.forEach(r=>{
    if(r.type==='legacy'){csv+=[r.date,r.startTime,'legado','','',csvEscape(r.legacyTitle),'','','',r.duration,csvEscape(r.notes)].join(';')+'\n';return}
    const f=findLessonAny(r.lessonId);if(!f)return;
    const ex=(r.exerciseIds||[]).map(id=>findExercise(id)?.exercise.name).filter(Boolean).join(' | ');
    csv+=[r.date,r.startTime,r.type,csvEscape(f.area.name),csvEscape(f.section.name),csvEscape(f.lesson.name),csvEscape(ex),r.type==='study'?(STATUS_META[r.statusAfter]?.label||''):'',r.bpm||'',r.duration,csvEscape(r.notes)].join(';')+'\n';
  });
  downloadBlob(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),'baixo-registros-v6.csv');showToast('Planilha exportada.');
}
function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function handleImport(event){
  const file=event.target.files?.[0];event.target.value='';if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{try{
    const data=JSON.parse(e.target.result);
    let incoming=[];
    if(Array.isArray(data.records)&&Number(data.version)>=5)incoming=data.records;
    else if(Array.isArray(data.records)){
      const tempOld=localStorage.getItem('baixo_records');
      localStorage.setItem('baixo_records',JSON.stringify(data.records));
      const currentV5=localStorage.getItem('baixo_records_v5');
      localStorage.removeItem('baixo_records_v5');
      migrateOldData();
      incoming=records;
      if(currentV5!==null)localStorage.setItem('baixo_records_v5',currentV5);else localStorage.removeItem('baixo_records_v5');
      if(tempOld!==null)localStorage.setItem('baixo_records',tempOld);else localStorage.removeItem('baixo_records');
      records=loadJSON('baixo_records_v5',[]);
    }else throw new Error('Formato inválido');
    const existing=new Set(records.map(r=>String(r.id)));let added=0;
    incoming.forEach(r=>{if(!existing.has(String(r.id))){records.push(r);existing.add(String(r.id));added++}});
    if(data.goalOverrides&&typeof data.goalOverrides==='object')goalOverrides={...goalOverrides,...data.goalOverrides};
    if(data.appearance?.theme&&THEME_META[data.appearance.theme])applyTheme(data.appearance.theme);
    save();showToast(`${added} registro(s) importado(s).`);refreshCurrent();
  }catch(err){showToast('Arquivo de backup inválido.','error')}};
  reader.readAsText(file);
}

migrateOldData();
applyTheme(currentTheme);
showHome();
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=6').catch(()=>{}))}
