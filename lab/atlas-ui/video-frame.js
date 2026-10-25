// Native project/catalogue footage uses the approved Article media frame.
export function videoFrame(item,escape,{id='video'}={}){
 const captionId=id+'-description';
 return `<figure class="media-frame"><video controls playsinline preload="none" aria-label="${escape(item.title||item.caption||'Project video')}" aria-describedby="${escape(captionId)}"${item.poster?` poster="${escape(item.poster)}"`:''} src="${escape(item.src)}">Your browser cannot play this video. <a href="${escape(item.src)}">Open video</a>.</video><figcaption class="media-caption" id="${escape(captionId)}"><strong>${escape(item.caption||item.title||'Project video')}</strong>${item.description?`<p>${escape(item.description)}</p>`:''}</figcaption></figure>`;
}
