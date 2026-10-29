/* MY ACADEMIA notebook addon. Node-attached pages, backward compatible. */
(() => {
 'use strict';
 const get=id=>document.getElementById(id);
 const style=document.createElement('style');style.textContent=`
 #acadBook{width:min(800px,97vw);max-height:92dvh;padding:0;overflow:hidden;border:1px solid #d6c59d;background:#f2ede1}
 #acadBook .head{padding:14px 18px;background:#132c45;color:white;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
 #acadBook .head strong{flex:1;min-width:180px;overflow-wrap:anywhere}
 #acadBook .head button{background:#fff;color:#132c45;padding:8px 11px}
 #acadBook .paper{padding:28px 24px;min-height:260px;max-height:51dvh;overflow:auto;background:repeating-linear-gradient(white 0px,white 31px,#cbddeb 32px,#fff 33px);line-height:33px;box-shadow:inset 5px 0 #e4c6bc}
 #acadBook .block{position:relative;margin:6px 0 18px;padding:0 0 5px 9px;overflow-wrap:anywhere}
 #acadBook textarea{background:#ffffffdf;line-height:1.65;min-height:110px}
 #acadBook .block img{max-width:100%;max-height:400px;display:block;margin:auto;object-fit:contain;border-radius:6px}
 #acadBook .controls{display:flex;gap:6px;flex-wrap:wrap;padding:10px 14px;background:#f5f1e8;align-items:center}
 #acadBook .controls button{font-size:13px;padding:8px 10px}
 #acadBook .controls .primary{background:#185f81;color:white}
 #acadBook .pagebar{display:flex;gap:9px;align-items:center;justify-content:center;padding:9px;background:#e8e0d2}
 #acadBook .pagebar button{padding:8px 14px}
 #acadBook .muted{font-size:12px;color:#526576}
 #acadBook .blockbar{display:flex;gap:5px;justify-content:flex-end;align-items:center;background:#ffffffe0;border-radius:6px}
 #acadBook .blockbar button{padding:3px 8px;font-size:12px}
 #acadImport{width:min(570px,95vw);max-height:90dvh;overflow:auto}
 #acadImport textarea{min-height:180px;font:12px ui-monospace,monospace}
 `;document.head.append(style);
 const dialog=document.createElement('dialog');dialog.id='acadBook';document.body.append(dialog);
 const imp=document.createElement('dialog');imp.id='acadImport';imp.innerHTML='<h3>AIの学習内容を取り込む</h3><p>ChatGPTで整理したJSONを貼り付けるか、JSONファイルを選択してください。現在の項目の新しいページとして追加します。</p><textarea id="acadJson" placeholder="JSONをここに貼り付け"></textarea><label>JSONファイル<input id="acadFile" type="file" accept=".json,application/json"></label><div class="actions"><button id="acadCancel">取消</button><button id="acadApply" class="primary">この項目に追加</button></div>';document.body.append(imp);
 let current=null,index=0;
 const node=()=>window.map?.nodes?.find(n=>n.id===current?.id); // top-level let map isn't a window property: resolved below
 function getNode(){try{return map?.nodes?.find(n=>n.id===current?.id)}catch{return null}}
 function save(){try{persist()}catch(e){alert('保存できませんでした: '+e.message)}}
 function books(){const n=getNode();if(!n)return[];if(!Array.isArray(n.studyPages))n.studyPages=[];return n.studyPages}
 function block(type,data){return type==='image'?{type:'image',src:data||''}:{type:'text',text:data||''}}
 function draw(){const n=getNode();if(!n){dialog.close();return}const pages=books();index=Math.max(0,Math.min(index,pages.length-1));const page=pages[index];dialog.replaceChildren();
  const head=document.createElement('div');head.className='head';const title=document.createElement('strong');title.textContent='📖 '+n.title;const close=btn('閉じる',()=>dialog.close());head.append(title,close);dialog.append(head);
  const pagebar=document.createElement('div');pagebar.className='pagebar';pagebar.append(btn('‹ 前',()=>{index--;draw()},!index),document.createTextNode(pages.length?`${index+1} / ${pages.length} ページ`:'まだページがありません'),btn('次 ›',()=>{index++;draw()},!pages.length||index>=pages.length-1));dialog.append(pagebar);
  const paper=document.createElement('div');paper.className='paper';if(!page){const p=document.createElement('p');p.textContent='ここに学んだことを、自分だけの教科書として残しましょう。';paper.append(p)}else{
   const h=document.createElement('input');h.value=page.title||'';h.placeholder='このページの見出し';h.setAttribute('aria-label','ページの見出し');h.onchange=()=>{page.title=h.value;save()};paper.append(h);
   const date=document.createElement('div');date.className='muted';date.textContent=page.date||'';paper.append(date);
   (page.blocks||[]).forEach((b,i)=>{const wrap=document.createElement('div');wrap.className='block';const bar=document.createElement('div');bar.className='blockbar';bar.append(btn('↑',()=>move(i,-1),i===0),btn('↓',()=>move(i,1),i===page.blocks.length-1),btn('削除',()=>{if(confirm('この内容を削除しますか？')){page.blocks.splice(i,1);save();draw()}}));wrap.append(bar);
     if(b.type==='image'){const img=document.createElement('img');img.src=b.src;img.alt=b.alt||'学習ノートの画像';wrap.append(img);const caption=document.createElement('input');caption.placeholder='画像の説明';caption.value=b.alt||'';caption.onchange=()=>{b.alt=caption.value;save()};wrap.append(caption)}else{const text=document.createElement('textarea');text.value=b.text||'';text.placeholder='学んだことを記入';text.style.height=Math.max(110,Math.min(400,(b.text||'').length/27*26+75))+'px';text.onchange=()=>{b.text=text.value;save()};wrap.append(text)}paper.append(wrap)});
   if(page.sourceUrl){const a=document.createElement('a');a.href=page.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';a.textContent='元の対話・参考資料を開く';paper.append(a)}
  }dialog.append(paper);
  const controls=document.createElement('div');controls.className='controls';controls.append(btn('＋ 新しいページ',()=>{books().push({title:'学習記録',date:new Date().toLocaleDateString('ja-JP'),blocks:[]});index=books().length-1;save();draw()},false,'primary'),btn('AIのJSONを取り込む',()=>imp.showModal()));
  if(page){controls.append(btn('＋ 文章',()=>{page.blocks.push(block('text',''));save();draw()}),btn('＋ 画像',()=>get('acadImage').click()),btn('ページ削除',()=>{if(confirm('このページを削除しますか？')){pages.splice(index,1);index=Math.max(0,index-1);save();draw()}}));}
  dialog.append(controls);
  let imageFile=document.createElement('input');imageFile.type='file';imageFile.accept='image/*';imageFile.hidden=true;imageFile.id='acadImage';imageFile.onchange=async()=>{const file=imageFile.files?.[0];if(!file)return;if(file.size>5*1024*1024){alert('画像は5MB以下を選んでください。');return}const r=new FileReader();r.onload=()=>{page.blocks.push({type:'image',src:r.result,alt:''});save();draw()};r.readAsDataURL(file)};dialog.append(imageFile);
 }
 function btn(label,fn,disabled=false,cls=''){const b=document.createElement('button');b.textContent=label;b.type='button';b.disabled=disabled;if(cls)b.className=cls;b.onclick=fn;return b}
 function move(i,delta){const blocks=books()[index].blocks;const j=i+delta;if(j<0||j>=blocks.length)return;[blocks[i],blocks[j]]=[blocks[j],blocks[i]];save();draw()}
 get('studyNotebook').onclick=()=>{const n=typeof readId!=='undefined'&&map?.nodes.find(x=>x.id===readId);if(!n)return alert('マップの項目を選択してください');current={id:n.id};index=0;draw();dialog.showModal()};
 get('acadCancel').onclick=()=>imp.close();get('acadFile').onchange=async e=>{const f=e.target.files?.[0];if(f)get('acadJson').value=await f.text()};
 get('acadApply').onclick=()=>{try{
  const parsed=JSON.parse(get('acadJson').value);if(parsed.format!=='my-academia-note-v1')throw Error('format が my-academia-note-v1 ではありません');
  if(!Array.isArray(parsed.blocks)||parsed.blocks.length>150)throw Error('blocks 配列がありません、または多すぎます');
  const blocks=parsed.blocks.map(b=>{if(b.type==='text'&&typeof b.text==='string')return{type:'text',text:b.text.slice(0,100000)};if(b.type==='image'&&typeof b.src==='string'&&/^data:image\/(png|jpeg|webp);base64,/.test(b.src)&&b.src.length<7000000)return{type:'image',src:b.src,alt:String(b.alt||'')};throw Error('未対応のブロックが含まれています')});
  let sourceUrl='';if(typeof parsed.sourceUrl==='string'){try{let u=new URL(parsed.sourceUrl);if(['https:','http:'].includes(u.protocol))sourceUrl=u.href}catch{}}
  books().push({title:String(parsed.title||'AI学習まとめ').slice(0,150),date:new Date().toLocaleDateString('ja-JP'),sourceUrl,blocks});index=books().length-1;save();imp.close();get('acadJson').value='';draw();
 }catch(e){alert('取り込みに失敗しました。\n'+e.message)}};
})();
