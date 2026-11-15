import {themes} from './themes.js';
const gallery=document.querySelector('#gallery');
let selected=new Set();
try{const saved=JSON.parse(localStorage.getItem('reforge-design-shortlist')||'[]');if(Array.isArray(saved))selected=new Set(saved.filter(id=>themes.some(t=>t.id===id)).slice(0,2));}catch{}
let comparing=false;
gallery.innerHTML=themes.map((t,i)=>`<article class="option" id="${t.id}"><div class="option-header"><div class="option-title"><span class="number">${String(i+1).padStart(2,'0')}</span><h2>${t.name}</h2></div><label class="select-option"><input type="checkbox" value="${t.id}">Compare</label></div><a class="preview" href="preview.html?theme=${t.id}" target="_blank" rel="noopener" aria-label="Open ${t.name} Reforge preview at full size"><img src="previews/${t.id}.png" width="1440" height="1000" ${i>1?'loading="lazy"':''} alt="Reforge Evaluations in the ${t.name} design direction, displaying the Ava dataset, three rubric scores, and a failed-answer inspector."><span class="preview-label">Open full-size preview ↗</span></a><div class="option-info"><div><h3>${t.tag}</h3><p>${t.note}</p></div><div class="swatches" aria-label="Palette: ${t.colors.join(', ')}">${t.colors.map(c=>`<span class="swatch" style="background:${c}" title="${c}"></span>`).join('')}</div></div><div class="option-links"><a href="${t.source}" target="_blank" rel="noopener">${t.kind} ↗</a><span class="typography">${t.font==='system-ui'?'System sans':t.font}</span></div></article>`).join('');
function update(){
 document.querySelectorAll('.option').forEach(card=>{const chosen=selected.has(card.id);card.classList.toggle('selected',chosen);card.hidden=comparing&&!chosen;const input=card.querySelector('input');input.checked=chosen;input.disabled=selected.size===2&&!chosen;});
 document.querySelector('#selection-count').textContent=selected.size?`${selected.size} of 2 selected`:'Select two to compare';
 document.querySelector('#compare').disabled=selected.size!==2;
 document.querySelector('#reset').hidden=!comparing;
 try{localStorage.setItem('reforge-design-shortlist',JSON.stringify([...selected]));}catch{}
}
document.querySelectorAll('.select-option input').forEach(input=>input.addEventListener('change',()=>{input.checked?selected.add(input.value):selected.delete(input.value);if(selected.size<2)comparing=false;update()}));
document.querySelector('#compare').addEventListener('click',()=>{comparing=true;update();gallery.scrollIntoView({behavior:'auto',block:'start'});});
document.querySelector('#reset').addEventListener('click',()=>{comparing=false;selected.clear();update()});
for(const id of ['grid','large'])document.querySelector('#'+id).addEventListener('click',()=>{gallery.classList.toggle('large',id==='large');document.querySelector('#grid').setAttribute('aria-pressed',id==='grid');document.querySelector('#large').setAttribute('aria-pressed',id==='large')});
document.querySelectorAll('.recommendation a').forEach(a=>a.addEventListener('click',()=>{comparing=false;update()}));
update();
