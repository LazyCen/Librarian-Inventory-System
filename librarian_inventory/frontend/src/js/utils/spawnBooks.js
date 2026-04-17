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
        const TOTAL = 48;
        for (let i = 0; i < TOTAL; i++) {
            const book = document.createElement('div');
            book.classList.add('book');
            const w = 34 + Math.random() * 26;
            const h = w * (1.3 + Math.random() * 0.4);
            const startX = Math.random() * 100;
            const startY = Math.random() * 100;
            const dist = 30 + Math.random() * 40;
            const angle = 270 + Math.random() * 90;
            const rad = (angle * Math.PI) / 180;
            const tx = (dist * Math.cos(rad)).toFixed(1) + 'vw';
            const ty = (dist * Math.sin(rad) * 0.4).toFixed(1) + 'vh';
            const opacity = (0.20 + Math.random() * 0.35).toFixed(2);
            const dur = (12 + Math.random() * 18).toFixed(1);
            const delay = (Math.random() * -30).toFixed(1);
            const rotS = (-20 + Math.random() * 40).toFixed(1);
            const rotE = (parseInt(rotS) + (-30 + Math.random() * 60)).toFixed(1);
            Object.assign(book.style, {
                width: w + 'px', height: h + 'px', left: startX + 'vw', top: startY + 'vh',
                color: '#ffffff', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
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
