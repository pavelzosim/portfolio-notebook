import {studySettings,renderStudy} from './raymarch-study-core.js';
self.onmessage=({data:{id,settings}})=>{try{const image=renderStudy(studySettings(settings));self.postMessage({id,ok:true,...image},[image.data.buffer]);}catch(error){self.postMessage({id,ok:false,error:error.message});}};
