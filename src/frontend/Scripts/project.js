
// --- Filter chips ---
const chips = Array.from(document.querySelectorAll('.chip'));
const grid  = document.getElementById('grid');
const cards = Array.from(grid.querySelectorAll('.card'));
const q     = document.getElementById('q');

function applyFilters(){
    const active = chips.find(c => c.classList.contains('active'))?.dataset.filter || 'all';
    const term   = q.value.trim().toLowerCase();

    cards.forEach(card=>{
    const lang = card.getAttribute('data-lang');
    const text = (card.innerText || card.textContent).toLowerCase();
    const langOk = (active === 'all') || (lang === active);
    const textOk = !term || text.includes(term);
    card.style.display = (langOk && textOk) ? '' : 'none';
    });
}

chips.forEach(chip=>{
    chip.addEventListener('click', ()=>{
    chips.forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    applyFilters();
    });
});

q.addEventListener('input', applyFilters);

// --- Toggle details ---
grid.addEventListener('click', (e)=>{
    const t = e.target;
    if (t.classList.contains('toggle')){
    const card = t.closest('.card');
    card.classList.toggle('open');
    }
    if (t.classList.contains('copy')){
    const cmd = t.getAttribute('data-copy') || '';
    if (cmd){
        navigator.clipboard.writeText(cmd).then(()=>{
        t.textContent = 'Copied!';
        setTimeout(()=> t.textContent = 'Copy Run Cmd', 900);
        });
    }
    }
});

// Initial render
applyFilters();
