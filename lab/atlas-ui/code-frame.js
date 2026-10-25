// Code stays selectable and unchanged; metadata is derived from authored context.
export function setupCodeFrames(root){
 for(const pre of root.querySelectorAll('pre')){
  if(pre.closest('.atlas-code-frame'))continue;
  const code=pre.querySelector('code')||pre,language=(code.className+' '+pre.className).match(/language-([\w-]+)/)?.[1]||'text';
  const names={c:'C',cpp:'C++',csharp:'C#',js:'JavaScript',javascript:'JavaScript',python:'Python',py:'Python',hlsl:'HLSL',glsl:'GLSL',bash:'Shell',json:'JSON',text:'Plain text'};
  const first=code.textContent.trim().split('\n').find(line=>/^\s*(\/\/|\/\*)\s*\w/.test(line)||(/^(python|py|bash|shell)$/.test(language)&&/^\s*#\s*\w/.test(line)));
  let heading=pre.previousElementSibling;while(heading&&!/^H[2-4]$/.test(heading.tagName))heading=heading.previousElementSibling;
  const purpose=pre.dataset.codeTitle||(first?first.replace(/^\s*(\/\/|#|\/\*)\s*/,'').replace(/\*\/$/,'').trim():heading?.textContent.replace(/^[§>\s\d.-]+/,'').trim())||'Implementation example';
  const frame=document.createElement('figure');frame.className='atlas-code-frame';
  const caption=document.createElement('figcaption');caption.className='atlas-code-caption';caption.textContent=`${names[language]||language.toUpperCase()} · ${purpose.length>140?purpose.slice(0,137)+'…':purpose}`;
  pre.before(frame);frame.append(caption,pre);
 }
}
