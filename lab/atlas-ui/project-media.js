// Read all registry shapes used by the original project renderer.
export function projectMediaThemes(record){
 const media=record.media||[];
 const themes=[['interface','Interface & screen systems',media.filter(m=>m.src.includes('/ui/'))],['badges','Badges & motion',media.filter(m=>m.src.includes('/bages/'))],['robot','Robot expressions',media.filter(m=>m.src.includes('/robot-emotions/'))],['locations','Locations & environments',record.locationMedia||[]]].filter(([, ,items])=>items.length);
 const classified=media.filter(m=>!['/ui/','/bages/','/robot-emotions/'].some(key=>m.src.includes(key)));
 if(classified.length)themes.push(['more-media','Production media',classified]);
 for(const [index,group]of (record.mediaGalleries||[]).entries())if(group.media?.length)themes.push(['media-group-'+(index+1),group.title,group.media]);
 if(!themes.length&&record.image)themes.push(['project-image','Project image',[{src:record.image,alt:record.title,caption:record.title}]]);
 return themes;
}
