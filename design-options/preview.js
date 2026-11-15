import {themes} from './themes.js';
const theme=themes.find(t=>t.id===new URLSearchParams(location.search).get('theme'))||themes[0];
document.title=`Reforge — ${theme.name} direction`;
document.body.className=theme.id+' '+theme.layout;
for(const [key,value] of Object.entries(theme.tokens))document.documentElement.style.setProperty('--'+key,value);
document.documentElement.style.setProperty('--font',`"${theme.font}", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`);
const dataset=await fetch('../case_study_evals/illustrative-dataset.json').then(r=>r.json());
const icons={Overview:'◫',Sessions:'◷',Evaluations:'◇',Repositories:'⌘',Team:'♧',Settings:'⚙'};
const cases=dataset.cases;
let selected=cases[0],filter='all',view='Results';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state=(c,r)=>c.checks[r]==='pass'?'<span class="pass">✓ Pass</span>':'<span class="fail">× Fail</span>';
const totals=Object.keys(dataset.rubrics).map(r=>({name:r,pass:cases.filter(c=>c.checks[r]==='pass').length}));
document.querySelector('#app').innerHTML=`
<div class="prototype"><a href="./">All 10 directions</a><span>${escape(theme.name)} · Reforge concept</span><span>Illustrative data · no live connection</span></div>
<header class="global"><strong class="wordmark"><span class="mark">r</span> reforge</strong><span class="workspace">TheAdaply <span class="divider">/</span> Ava retail agent</span><span class="global-end">Local examples <span class="avatar">A</span></span></header>
<div class="shell"><aside class="sidebar"><div class="workspace-name">TheAdaply <span>⌄</span></div><div class="navigation">${Object.entries(icons).map(([label,icon])=>`<div class="nav-item ${label==='Evaluations'?'current':''}"><span class="icon" aria-hidden="true">${icon}</span><span>${label}</span></div>`).join('')}</div><div class="project-nav"><small>Current project</small><strong><span class="project-dot"></span> Ava retail agent</strong><span>20 saved cases</span></div><div class="sidebar-bottom">Reforge Evaluations<br><small>Design preview</small></div></aside>
<main><div class="page-top"><span>Evaluations <span class="divider">/</span> Experiments</span><span>Example run #024</span></div><nav class="section-nav" aria-label="Evaluation sections"><span>Logs</span><span>Datasets</span><span>Playground</span><strong>Experiments</strong><span>Prompts</span><span>Scorers</span><span>Monitor</span></nav>
<section class="page-content"><div class="heading"><div><div class="breadcrumb">Ava retail agent</div><h1>Recommendation quality</h1><p>See where Ava’s answers meet the rubric—and where they need work.</p></div><a class="button primary" href="../case_study_evals/illustrative-dataset.json" download>Export examples</a></div>
<div class="run-meta"><span class="complete"><span class="dot"></span> Example results</span><span>20 Q&amp;A cases</span><span>3 rubrics</span><span>Text evaluation</span></div>
<div class="score-strip">${totals.map(t=>`<div class="score"><span>${t.name}</span><div><strong>${t.pass}<small> / 20</small></strong><span class="score-label">passed</span></div><div class="meter"><i style="width:${t.pass*5}%"></i></div></div>`).join('')}<div class="score footnote"><strong>Evidence first.</strong><p>Each judgment links back to the answer and its expected behavior.</p></div></div>
<div class="viewbar"><div role="tablist" aria-label="Experiment view">${['Results','Rubrics'].map((v,i)=>`<button role="tab" aria-selected="${i===0}" data-view="${v}">${v}</button>`).join('')}</div><span class="sample-note">Authored examples, not a model run</span></div>
<div id="results" class="results-layout"><section class="case-list"><div class="table-tools"><strong>Cases <span class="count">20</span></strong><label><span>Show</span><select id="filter"><option value="all">All cases</option><option value="failed">Failed cases</option><option value="passed">Passed cases</option></select></label></div><div class="table-scroll"><table><thead><tr><th scope="col">Question</th><th scope="col">Natural</th><th scope="col">Correct</th><th scope="col">Follows instructions</th></tr></thead><tbody id="rows"></tbody></table></div><div id="row-count" class="table-footer"></div></section><aside class="inspector" aria-label="Selected case evidence" id="inspector"></aside></div>
<section id="rubrics" hidden>${Object.entries(dataset.rubrics).map(([name,rule])=>`<article class="rubric-rule"><h2>${name}</h2><p>${rule}</p><span>Pass: criterion met · Fail: criterion violated</span></article>`).join('')}<p class="muted">These example judgments are authored fixtures. A production judge should be checked against reviewed examples.</p></section>
<footer class="content-footer"><span>Fantastic-Ava-3 · retail assistant</span><a href="${theme.source}" target="_blank" rel="noopener">${theme.name} design reference ↗</a></footer></section></main></div>`;
function render(){
 const filtered=cases.filter(c=>filter==='all'||(Object.values(c.checks).includes('fail')?filter==='failed':filter==='passed'));
 document.querySelector('#rows').innerHTML=filtered.map(c=>`<tr class="${c.id===selected.id?'selected':''}"><td><button class="case-button" data-id="${c.id}" aria-pressed="${c.id===selected.id}"><span class="case-id">${c.id}</span>${escape(c.question)}</button></td>${Object.keys(dataset.rubrics).map(r=>`<td>${state(c,r)}</td>`).join('')}</tr>`).join('');
 document.querySelector('#row-count').textContent=`${filtered.length} of 20 cases · select a row to inspect`;
 const failed=Object.entries(selected.checks).filter(([,v])=>v==='fail').map(([r])=>r);
 document.querySelector('#inspector').innerHTML=`<div class="inspector-title"><strong>${selected.id} <span>Case detail</span></strong><span class="${failed.length?'fail':'pass'}">${failed.length?'Needs attention':'Passed'}</span></div><div class="inspector-body"><div class="evidence"><h2>Caller</h2><p>${escape(selected.question)}</p></div><div class="evidence answer"><h2>Ava’s answer</h2><p>“${escape(selected.illustrative_answer)}”</p></div><div class="judgment"><h2>${failed.length?'Why it failed':'Why it passed'}</h2><span class="rubric-name">${escape(failed.join(', ')||'All three rubrics')}</span><p>${escape(selected.failure_reason||'The answer meets the stated behavior in this authored example.')}</p></div><div class="evidence expected"><h2>Expected behavior</h2><p>${escape(selected.expected)}</p></div><div class="evidence provenance">Illustrative Q&amp;A and judgments.<br>No real order was placed.</div></div>`;
 document.querySelectorAll('.case-button').forEach(b=>b.addEventListener('click',()=>{selected=cases.find(c=>c.id===b.dataset.id);render()}));
}
render();
document.querySelector('#filter').addEventListener('change',e=>{filter=e.target.value;render()});
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;document.querySelector('#results').hidden=view!=='Results';document.querySelector('#rubrics').hidden=view!=='Rubrics';document.querySelectorAll('[data-view]').forEach(t=>t.setAttribute('aria-selected',t===b));}));
