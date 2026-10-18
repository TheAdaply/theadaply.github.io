(function () {
  const $ = id => document.getElementById(id);
  const node = (tag, text, className) => { const element = document.createElement(tag); if (text !== undefined) element.textContent = text; if (className) element.className = className; return element; };
  function initialize(data) {
    document.title = data.title;
    const meta = document.querySelector('meta[name=description]'); if (meta) meta.content = data.description || data.subtitle;
    $('page-title').textContent = data.title; $('page-subtitle').textContent = data.subtitle;
    data.sections.forEach(section => {
      const element = node('section');
      if (section.heading) element.append(node('h2', section.heading));
      section.paragraphs.forEach(p => element.append(node('p', p)));
      $('article-sections').append(element);
    });
    $('conclusion-text').textContent = data.conclusion;
    $('closing-text').textContent = data.closing;
    document.documentElement.dataset.ready = 'true';
  }
  fetch('content.json?v=thesis-v6-split-1').then(r => { if (!r.ok) throw new Error('Content unavailable'); return r.json(); }).then(initialize).catch(() => { $('page-subtitle').textContent = 'The article could not load. Read the offline article below, or refresh the page.'; });
})();
