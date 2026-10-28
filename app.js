let protocols=[],selected=null,showFav=false,installPrompt=null;const $=id=>document.getElementById(id);let favorites=new Set(JSON.parse(localStorage.getItem('ftfd-favorites')||'[]'));function save(){localStorage.setItem('ftfd-favorites',JSON.stringify([...favorites]))}function toggle(code){favorites.has(code)?favorites.delete(code):favorites.add(code);save();render();if(selected)showDetail(selected.code)}function render(){let q=$('search').value.trim().toLowerCase(),cat=$('category').value;let list=protocols.filter(p=>(!cat||p.category===cat)&&(!showFav||favorites.has(p.code))&&(!q||(p.code+' '+p.title+' '+p.text).toLowerCase().includes(q)));$('count').textContent=`${list.length} of ${protocols.length} indexed sections`;let target=$('results');target.replaceChildren();for(let p of list){let item=document.createElement('div');item.className='item';let info=document.createElement('div');info.className='info';info.tabIndex=0;info.setAttribute('role','button');info.innerHTML='<span class="code"></span><strong></strong><span class="meta"></span>';info.children[0].textContent=p.code;info.children[1].textContent=p.title;info.children[2].textContent=p.category+' · PDF page '+p.pages[0];info.onclick=()=>showDetail(p.code);info.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showDetail(p.code)}};let star=document.createElement('button');star.className='star';star.textContent=favorites.has(p.code)?'★':'☆';star.setAttribute('aria-label','Toggle favorite '+p.code);star.onclick=()=>toggle(p.code);item.append(info,star);target.append(item)}}function showDetail(code){let p=protocols.find(x=>x.code===code);if(!p)return;selected=p;$('catalog').style.display='none';$('detail').style.display='block';$('detailTitle').textContent=p.code+' — '+p.title;$('detailMeta').textContent=p.category+' · Original PDF page'+(p.pages.length>1?'s ':' ')+p.pages.join(', ');renderReader(p);$('source').href='./swonky-2026.pdf#page='+p.pages[0];$('detailStar').textContent=favorites.has(p.code)?'★ Saved':'☆ Save';window.scrollTo(0,0);history.replaceState(null,'','#'+p.code)}function back(){selected=null;$('detail').style.display='none';$('catalog').style.display='block';history.replaceState(null,'',location.pathname);window.scrollTo(0,0)}$('back').onclick=back;$('detailStar').onclick=()=>selected&&toggle(selected.code);$('search').oninput=render;$('category').onchange=render;$('all').onclick=()=>{showFav=false;$('all').classList.add('active');$('favs').classList.remove('active');render()};$('favs').onclick=()=>{showFav=true;$('favs').classList.add('active');$('all').classList.remove('active');render()};document.querySelectorAll('.tile').forEach(b=>b.onclick=()=>{showFav=false;$('favs').classList.remove('active');$('all').classList.add('active');if(b.dataset.code){showDetail(b.dataset.code);return}$('category').value=b.dataset.category||'';$('search').value=b.dataset.query||'';render();document.getElementById('results').scrollIntoView({behavior:'smooth'})});window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('install').hidden=false});$('install').onclick=async()=>{if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('install').hidden=true}};fetch('./protocols.json').then(r=>{if(!r.ok)throw Error('Cannot load protocol index');return r.json()}).then(data=>{protocols=data;let cats=[...new Set(data.map(x=>x.category))];for(let c of cats){let o=document.createElement('option');o.value=o.textContent=c;$('category').append(o)}render();if(location.hash)showDetail(decodeURIComponent(location.hash.slice(1)))}).catch(e=>{$('status').textContent='Unable to load protocols: '+e.message});if('serviceWorker'in navigator){navigator.serviceWorker.register('./sw.js').then(async()=>{let cache=await caches.open('ftfd-field-guide-v0.3');let assets=['./index.html','./app.js','./protocols.json','./swonky-2026.pdf'];let checks=await Promise.all(assets.map(a=>cache.match(a)));$('status').textContent=checks.every(Boolean)?'● Core files cached for offline use':'◌ Offline files still caching; keep app open and check again';}).catch(()=>{$('status').textContent='Offline cache unavailable'})}

// v0.3: Preserve original source ordering; headings are only extracted when explicitly present.
// No algorithmic inference of provider scope or dose safety is performed.
const originalShowDetail=showDetail;
let readerSize=Number(localStorage.getItem('ftfd-reader-size')||18);
readerSize=Math.max(16,Math.min(26,readerSize));
function renderReader(p){
 const target=$('reader');target.replaceChildren();
 target.style.setProperty('--reader-size',readerSize+'px');
 let lines=p.text.replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
 // Remove only obvious repeating page furniture; leave clinical content untouched.
 lines=lines.filter(x=>!(/^TABLE OF CONTENTS$/i.test(x)||/^Academy of Medicine of Cincinnati$/i.test(x)||/^Prehospital Care Clinical Practice Guidelines$/i.test(x)||/^Last (Modified|Reviewed):$/i.test(x)||/^Version:\s*2\.9\.26/i.test(x)));
 let groups=[], current={title:'Beginning of protocol',lines:[]};
 const heading=/^(?:[IVX]{1,7}\.|(?:INCLUSION CRITERIA|DIFFERENTIAL DIAGNOSIS|PROTOCOL|NOTES|PRECAUTIONS|CONTRAINDICATIONS|SPECIAL CONSIDERATIONS|TREATMENT|ASSESSMENT|INDICATIONS|PEDIATRIC CONSIDERATIONS|MEDICAL CONTROL))$/i;
 for(let i=0;i<lines.length;i++){
   const line=lines[i];
   // Roman numeral headings are often on their own line in the extracted PDF.
   if(/^[IVX]{1,7}\.$/.test(line)&&i+1<lines.length){if(current.lines.length)groups.push(current);current={title:line+' '+lines[++i],lines:[]};continue;}
   if(heading.test(line)&&current.lines.length){groups.push(current);current={title:line,lines:[]};continue;}
   current.lines.push(line);
 }
 if(current.lines.length)groups.push(current);
 if(!groups.length)groups=[{title:'Full extracted text',lines}];
 groups.forEach((group,i)=>{
   const details=document.createElement('details');details.className='reader-section';details.open=i===0;
   const summary=document.createElement('summary');summary.textContent=group.title;
   const content=document.createElement('div');content.className='section-content';content.textContent=group.lines.join('\n');
   const note=document.createElement('div');note.className='source-note';note.textContent=`Extracted text • ${p.code} • PDF pages ${p.pages.join(', ')} • Check original for layout and provider-level labels`;
   details.append(summary,content,note);target.append(details);
 });
}
$('larger').onclick=()=>{readerSize=Math.min(26,readerSize+2);localStorage.setItem('ftfd-reader-size',readerSize);$('reader').style.setProperty('--reader-size',readerSize+'px')};
$('smaller').onclick=()=>{readerSize=Math.max(16,readerSize-2);localStorage.setItem('ftfd-reader-size',readerSize);$('reader').style.setProperty('--reader-size',readerSize+'px')};
$('dim').onclick=()=>{const on=document.body.classList.toggle('extra-dim');$('dim').setAttribute('aria-pressed',String(on));localStorage.setItem('ftfd-extra-dim',String(on))};
if(localStorage.getItem('ftfd-extra-dim')==='true'){document.body.classList.add('extra-dim');$('dim').setAttribute('aria-pressed','true')};
$('expandAll').onclick=()=>document.querySelectorAll('#reader details').forEach(x=>x.open=true);
$('collapseAll').onclick=()=>document.querySelectorAll('#reader details').forEach(x=>x.open=false);
