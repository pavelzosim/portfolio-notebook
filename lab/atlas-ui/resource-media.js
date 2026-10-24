// Shared lab media fallback; do not introduce lab paths into the public registry.
export function withResourceMedia(record){
 return record.id==='TOOL-003'&&!record.image?{...record,image:'/lab/atlas-ui/material-path-manager.jpg',imageAlt:'Houdini Material Path Manager — workflow demonstration'}:record;
}
