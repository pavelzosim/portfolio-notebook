/* Homepage behavior only; the candidate shell owns navigation and keyboard routing. */
import {setupIntroSearch} from './intro-profile.js?v=review-100';
import {setupVfxGallery} from './vfx-gallery.js?v=review-106';
import {setupOnlineToolCards} from './online-tool-card.js?v=review-107';
export function setupHomeInteractions(main,records){
 const lead=main.querySelector('.contact-lead');if(lead){lead.textContent=lead.textContent.replace(/\s*If this overlaps with a problem your team is solving, write directly\./,'').trim();}
 setupOnlineToolCards(main);
 setupVfxGallery(main.querySelector('[data-vfx-section]'));
 setupIntroSearch(main,{records});
}
