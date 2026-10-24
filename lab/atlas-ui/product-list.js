// Native details owns keyboard behaviour; purchase links remain real destinations.
export function setupProductLists(root){
 root.querySelectorAll('.home-store-row>a').forEach(link=>{link.classList.remove('atlas-btn--ghost');link.classList.add('button--outline');});
}
