// Shared full-width feedback link, registered alongside Share in the catalogue.
export function createToolFeedback(){
 const block=document.createElement('a');block.className='tool-feedback';block.href='mailto:pavel.zosim@protonmail.com';
 block.textContent='Have a suggestion for improving this tool or found a bug? Write to pavel.zosim@protonmail.com.';
 return block;
}
