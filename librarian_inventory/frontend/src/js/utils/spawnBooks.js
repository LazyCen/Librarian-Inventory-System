/**
 * Immediately-Invoked Function Expression (IIFE) that generates and animates
 * floating book icons in the background of the authentication section.
 * It randomly calculates dimensions, start positions, rotation angles, and animations.
 */
(function spawnBooks() {
    // Only execute if document is loaded or executed directly since it involves DOM manipulation.
    const runSpawnBooks = () => {
        const layer = document.getElementById('booksLayer');
        if (!layer) return;
        layer.innerHTML = '';
        const TOTAL = 60;
        const SIZE = 28;
        for (let i = 0; i < TOTAL; i++) {
            const book = document.createElement('div');
            book.classList.add('book');
            const w = SIZE;
            const h = SIZE;
            const startX = -20 + Math.random() * 120; // spread from slightly off-screen left
            const startY = Math.random() * 100;
            const dist = 130; // long path so movement is clearly visible
            const angle = 10; // exact 10 degree direction for all books
            const rad = (angle * Math.PI) / 180;
            const tx = (dist * Math.cos(rad)).toFixed(1) + 'vw';
            const ty = (dist * Math.sin(rad)).toFixed(1) + 'vh';
            const opacity = (0.32 + Math.random() * 0.18).toFixed(2);
            const dur = (14 + Math.random() * 6).toFixed(1);
            const delay = (Math.random() * -20).toFixed(1);
            const rotS = (-16 + Math.random() * 8).toFixed(1);
            const rotE = (Number(rotS) + (6 + Math.random() * 10)).toFixed(1);
            Object.assign(book.style, {
                width: w + 'px', height: h + 'px', left: startX + 'vw', top: startY + 'vh',
                color: '#f8fbff', filter: 'drop-shadow(0 10px 14px rgba(15,23,42,0.36))',
                '--rot-start': rotS + 'deg', '--rot-end': rotE + 'deg', '--tx': tx, '--ty': ty,
                '--book-opacity': opacity, animationDuration: dur + 's', animationDelay: delay + 's'
            });
            const ic = document.createElement('i');
            ic.className = 'fas fa-book-open';
            book.appendChild(ic);
            layer.appendChild(book);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runSpawnBooks);
    } else {
        runSpawnBooks();
    }
})();
