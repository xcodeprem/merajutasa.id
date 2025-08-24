function qs(n){return new URLSearchParams(window.location.search).get(n)}
async function fetchJSON(path){const r=await fetch(path,{cache:'no-store'});if(!r.ok) throw new Error('Fetch '+path+' '+r.status);return r.json()}
async function renderIndex(){
  const root = document.getElementById('list'); if(!root) return
  const idx = await fetchJSON('/content-index.json').catch(()=>({orphanages:[]}))
  root.innerHTML = ''
  for(const o of idx.orphanages){
    const el = document.createElement('article'); el.className='card'; el.role='listitem'
    el.innerHTML = `
      <h3>${o.name}</h3>
      <div class="loc">${o.city}, ${o.province}</div>
      <p>${(o.description||'').slice(0,120)}...</p>
      <a class="a-btn" href="/portal/panti.html?org=${encodeURIComponent(o.slug)}" aria-label="Lihat ${o.name}">Lihat Profil</a>
    `
    root.appendChild(el)
  }
}
async function renderDetail(){
  const slug = qs('org'); if(!slug) return
  const data = await fetchJSON(`/content/orphanages/${slug}.json`)
  const h1 = document.getElementById('name'); if(h1) h1.textContent = data.name
  const hero = document.getElementById('hero'); if(hero && data.image_url) hero.style.backgroundImage = `url('${data.image_url}')`
  const meta = document.getElementById('meta'); if(meta) meta.textContent = `${data.city}, ${data.province}`
  const ulp = document.getElementById('programs'); if(ulp) ulp.innerHTML = (data.programs||[]).map(p=>`<li>${p}</li>`).join('')
  const uld = document.getElementById('donations'); if(uld) uld.innerHTML = (data.donation_links||[]).map(d=>`<li><a class="a-btn" href="${d.url}" target="_blank" rel="noopener">${d.label}</a></li>`).join('')
}
renderIndex(); renderDetail();
