// Read all registry shapes used by the original project renderer.
const interfaceCaptions={
 'exploration_comicenv.jpg':'Exploration environment — interface overview',
 'T_ui_Orion_ScreenGraph_01.png':'Orion spacecraft — interface layout 1',
 'T_ui_Orion_ScreenGraph_02.png':'Orion spacecraft — interface layout 2',
 'T_ui_Orion_ScreenGraph_03.png':'Orion spacecraft — interface layout 3',
 'UI_ScreenGraph_19dec2020_camAssemble_Cupola02.png':'Cupola — interface layout',
 'UI_ScreenGraph_19dec2020_camAssemble_Display_04.png':'Spacecraft — display layout 4',
 'UI_ScreenGraph_19dec2020_camAssemble_Display_05.png':'Spacecraft — display layout 5',
 'UI_ScreenGraph_19dec2020_camAssemble_Display_10.png':'Spacecraft — display layout 10',
 'UI_ScreenGraph_19dec2020_camAssemble_Display_11.png':'Spacecraft — display layout 11',
 'UI_ScreenGraph_19dec2020_camAssemble_sideDisplay_03.png':'Spacecraft — side display',
 'UI_ScreenGraph_19dec2020_cc_centralDisplay.png':'Control centre — central display',
 'UI_ScreenGraph_19dec2020_cc_ctrlDisplay_01.png':'Control centre — display layout 1',
 'UI_ScreenGraph_19dec2020_cc_ctrlDisplay_02.png':'Control centre — display layout 2',
 'UI_ScreenGraph_19dec2020_cc_ctrlDisplay_03.png':'Control centre — display layout 3',
 'UI_ScreenGraph_19dec2020_vegLab_Display_03.png':'Vegetation laboratory — environmental controls',
 'UI_ScreenGraph_SleepingArea01.png':'Crew sleeping area — interface layout'
};
export function projectMediaCaption(item,title){
 if(item.src.includes('/nasa-first-woman/ui/'))return interfaceCaptions[item.src.split('/').at(-1)]||'Spacecraft interface';
 if(item.src.includes('/robot-emotions/'))return 'Robot assistant — facial-expression animation';
 return (item.caption||item.alt||title).replace(/\s*(?:[\/|·—-]\s*)?ace175[ _-].*$/i,'').replace(/\s*(?:[\/|·—-]\s*)?[a-f0-9]{16,}[^\s]*/gi,'').replace(/\s*\([^)]*\.(?:jpe?g|png|webp|gif)\)/gi,'').trim()||title;
}
export function projectMediaThemes(record){
 const media=record.media||[];
 const themes=[['interface','Interface & screen systems',media.filter(m=>m.src.includes('/ui/'))],['badges','Badges & motion',media.filter(m=>m.src.includes('/bages/'))],['robot','Robot expressions',media.filter(m=>m.src.includes('/robot-emotions/'))],['locations','Locations & environments',record.locationMedia||[]]].filter(([, ,items])=>items.length);
 const classified=media.filter(m=>!['/ui/','/bages/','/robot-emotions/'].some(key=>m.src.includes(key)));
 if(classified.length)themes.push(['more-media','Production media',classified]);
 for(const [index,group]of (record.mediaGalleries||[]).entries())if(group.media?.length)themes.push(['media-group-'+(index+1),group.title,group.media]);
 if(!themes.length&&record.image)themes.push(['project-image','Project image',[{src:record.image,alt:record.title,caption:record.title}]]);
 return themes.map(([id,title,items])=>[id,title,items.map(item=>({...item,caption:projectMediaCaption(item,title),alt:projectMediaCaption(item,title)}))]);
}
