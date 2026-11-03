const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=path.join(root,'tmp/raymarch-dxc');fs.mkdirSync(out,{recursive:true});
 let compiler=process.env.DXC_PATH;
 if(!compiler&&process.platform==='win32'){const kit='C:/Program Files (x86)/Windows Kits/10/bin';if(fs.existsSync(kit))compiler=fs.readdirSync(kit).sort().reverse().map(v=>path.join(kit,v,'x64/dxc.exe')).find(p=>fs.existsSync(p));}
 compiler=compiler||'dxc';const m=await import('./raymarch-study-core.js'),l=await import('./shader-memory-core.js'),source=path.join(out,'Raymarch_Study.hlsl');fs.writeFileSync(source,m.FULL_HLSL);
 for(const [entry,target]of [['VSMain','vs_6_0'],['PSMain','ps_6_0']]){const args=['-T',target,'-E',entry,source,'-Fo',path.join(out,entry+'.dxil'),'-Fc',path.join(out,entry+'.asm')],r=spawnSync(compiler,args,{encoding:'utf8'});if(r.error)throw r.error;assert.equal(r.status,0,r.stdout+r.stderr);console.log('PASS DXC '+entry+' / '+target);}
 const asm=fs.readFileSync(path.join(out,'PSMain.asm'),'utf8'),layout=l.calculateLayout(l.parseDeclarations(m.BUFFER_DECLARATIONS));
 for(const field of layout.rows)assert.match(asm,new RegExp('\\b'+field.name+';\\s*; Offset:\\s*'+field.offset+'\\b'));
 assert.match(asm,/StudyParameters;\s*; Offset:\s*0 Size:\s*84/);console.log('PASS DXC reflection: '+layout.rows.length+' offsets, 84-byte extent / 96-byte rounded calculator span.');
})().catch(e=>{console.error(e);process.exitCode=1;});
