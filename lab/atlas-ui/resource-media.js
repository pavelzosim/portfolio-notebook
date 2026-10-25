// Shared lab media fallback; do not introduce lab paths into the public registry.
export function withResourceMedia(record){
 return record.id==='TOOL-003'&&!record.image?{...record,image:new URL('./material-path-manager.jpg',import.meta.url).pathname,imageAlt:'Houdini Material Path Manager — workflow demonstration'}:record;
}
