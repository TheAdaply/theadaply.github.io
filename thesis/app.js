/* A deterministic longest-common-subsequence diff. Equal ties prefer deletion. */
function diffLines(before, after) {
  const lines = text => { const result = text.replace(/\r\n/g, '\n').split('\n'); if (result[result.length - 1] === '') result.pop(); return result; };
  const a = lines(before), b = lines(after);
  const table = Array.from({length: a.length + 1}, () => new Uint32Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) table[i][j] = a[i] === b[j] ? 1 + table[i + 1][j + 1] : Math.max(table[i + 1][j], table[i][j + 1]);
  const changes = []; let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) { changes.push({type:'equal',text:a[i],before:++i,after:++j}); }
    else if (i < a.length && (j === b.length || table[i + 1][j] >= table[i][j + 1])) { changes.push({type:'delete',text:a[i],before:++i}); }
    else { changes.push({type:'add',text:b[j],after:++j}); }
  }
  return changes;
}
function diffRows(changes) {
  const rows = []; let i = 0;
  while (i < changes.length) {
    if (changes[i].type === 'equal') {rows.push({before:changes[i],after:changes[i],changed:false}); i++; continue;}
    const removed=[], added=[];
    while (i < changes.length && changes[i].type !== 'equal') { (changes[i].type === 'delete' ? removed : added).push(changes[i++]); }
    for (let k=0;k<Math.max(removed.length,added.length);k++) rows.push({before:removed[k],after:added[k],changed:true});
  }
  return rows;
}
if (typeof module !== 'undefined') module.exports = {diffLines,diffRows};
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  const node = (tag, text, className) => { const element=document.createElement(tag); if(text !== undefined) element.textContent=text; if(className) element.className=className; return element; };
  let data, selected=0, changesOnly=false;
  function renderCode(container,rows,side) {
    container.replaceChildren();
    let hidden=0;
    const gap = () => {if(hidden){container.append(node('div',`${hidden} unchanged ${hidden===1?'line':'lines'} hidden`,'code-line gap'));hidden=0;}};
    for (const row of rows) {
      if(changesOnly && !row.changed){hidden++;continue;}
      gap(); const line=row[side]; const element=node('div',undefined,`code-line ${line ? line.type : 'blank'}`);
      element.append(node('span',line ? String(line[side] ?? '') : '', 'line-number'));
      element.append(node('span',line?.type==='add' ? '+' : line?.type==='delete' ? '−' : ' ', 'line-marker'));
      element.append(node('span',line?.text ?? ' ', 'line-text')); container.append(element);
    }
    gap();
  }
  function selectFile(index,announce=true) {
    selected=index; const file=data.files[index]; const changes=diffLines(file.before,file.after), rows=diffRows(changes);
    const additions=changes.filter(c=>c.type==='add').length, deletions=changes.filter(c=>c.type==='delete').length;
    $('selected-file').textContent=file.path; $('file-purpose').textContent=file.why;
    $('diff-stats').replaceChildren(node('span',`+${additions}`,'added-count'),node('span',`−${deletions}`,'deleted-count'));
    $('diff-stats').setAttribute('aria-label',`${additions} added lines, ${deletions} deleted lines`);
    $('file-tree').querySelectorAll('button').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
    renderCode($('before-code'),rows,'before'); renderCode($('after-code'),rows,'after');
    if(announce) $('selection-announcement').textContent=`Selected ${file.path}. ${additions} added lines and ${deletions} deleted lines. ${changesOnly?'Showing changes only.':'Showing all lines.'}`;
  }
  function setView(only) {changesOnly=only;$('all-lines').setAttribute('aria-pressed',String(!only));$('changes-only').setAttribute('aria-pressed',String(only));selectFile(selected);}
  function initialize(content) {
    data=content; document.title=data.title;
    document.querySelector('meta[name=description]').content=data.description || data.subtitle;
    $('page-title').textContent=data.title; $('page-subtitle').textContent=data.subtitle;
    let customerQuote;
    if(data.quote){const quote=node('figure',undefined,'customer-quote');const block=node('blockquote');const paragraph=node('p');paragraph.append(node('mark',data.quote.text));block.append(paragraph);quote.append(block,node('figcaption',data.quote.attribution));if(data.quote.context)quote.append(node('p',data.quote.context,'quote-context'));customerQuote=quote;}
    function renderSpecPreview(preview) {
      const element=node('section',undefined,'spec-preview');const title=node('h4',preview.title);title.id='spec-preview-title';element.setAttribute('aria-labelledby',title.id);element.append(title,node('p',preview.description));
      const scroll=node('div',undefined,'spec-table-scroll');scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label',`${preview.title}. Scroll horizontally to read all columns.`);
      const table=node('table');const head=node('thead'),header=node('tr');preview.columns.forEach(label=>{const cell=node('th',label);cell.scope='col';header.append(cell);});head.append(header);table.append(head);
      const body=node('tbody');preview.rows.forEach(row=>{const line=node('tr');['state','decision','behavior','checks'].forEach((key,index)=>{const cell=node(index===0?'th':'td',row[key]);if(index===0)cell.scope='row';line.append(cell);});body.append(line);});table.append(body);scroll.append(table);element.append(scroll);return element;
    }
    data.sections.forEach((section,index)=>{
      const element=node('section');
      if(index!==0 || section.heading!==''){const heading=node(index<2?'h2':'h3',section.heading);if(index===1)heading.id='customer-case-title';element.append(heading);}
      section.paragraphs.forEach(p=>element.append(node('p',p)));
      if(customerQuote && index===data.quote.afterSection) element.append(customerQuote,node('p',data.caseNote));
      $(index===0?'article-sections':'case-sections').append(element);
      if(data.specPreview && index===data.specPreview.afterSection) element.append(renderSpecPreview(data.specPreview));
    });
    $('explorer-title').textContent=data.explorerTitle;
    $('case-note').textContent=data.explorerDescription;
    const changedFiles=data.files.filter(file=>file.before!==file.after).length;
    $('bundle-count').textContent=`${data.files.length} files · ${changedFiles} changed`;
    data.files.forEach((file,index)=>{const button=node('button',file.path);button.type='button';button.id=`file-${index}`;button.setAttribute('aria-pressed',String(index===0));button.append(node('span',file.category,'file-category'));button.addEventListener('click',()=>selectFile(index));button.addEventListener('keydown',event=>{let next;if(event.key==='ArrowDown'||event.key==='ArrowRight')next=(index+1)%data.files.length;else if(event.key==='ArrowUp'||event.key==='ArrowLeft')next=(index+data.files.length-1)%data.files.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=data.files.length-1;if(next!==undefined){event.preventDefault();selectFile(next);$(`file-${next}`).focus();}});$('file-tree').append(button);});
    if(data.evaluation){const evaluation=data.evaluation;$('evaluation').append(node('h4',evaluation.title));const body=node('div');const checks=node('ul');evaluation.checks.forEach(check=>checks.append(node('li',check)));body.append(checks);$('evaluation').append(body);}
    $('conclusion-text').textContent=data.conclusion;
    $('closing-text').textContent=data.closing;
    $('all-lines').addEventListener('click',()=>setView(false));$('changes-only').addEventListener('click',()=>setView(true));selectFile(0,false);
    document.documentElement.dataset.ready='true';
  }
  fetch('content.json?v=thesis-v1-bridge-1').then(response=>{if(!response.ok)throw new Error('Content unavailable');return response.json();}).then(initialize).catch(()=>{$('page-subtitle').textContent='The article could not load. Read the offline article below, or refresh the page.';});
}
