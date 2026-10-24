export function projectMetrics(items,escape){
 if(!items.length)return '';
 return `<dl class="project-metrics">${items.map(item=>`<div><dt>${escape(item.value)}</dt><dd>${escape(item.label)}</dd></div>`).join('')}</dl>`;
}
