/**
 * Immediately-Invoked Function Expression (IIFE) that generates and animates
 * floating icons in the background of the authentication section.
 * Creates an aesthetic, depth-of-field particle effect.
 */
(function spawnBooks() {
    const runSpawnBooks = () => {
        const layer = document.getElementById('booksLayer');
        if (!layer) return;
        layer.innerHTML = '';
        
        const TOTAL = 40; 
        
        const icons = [
            'fas fa-book', 
            'fas fa-book-open', 
            'fas fa-bookmark', 
            'fas fa-layer-group', 
            'fas fa-swatchbook'
        ];
        
        for (let i = 0; i < TOTAL; i++) {
            const book = document.createElement('div');
            book.classList.add('book');
            
            // Depth controls size, blur, and opacity for parallax
            const depth = Math.random(); 
            const size = 20 + (depth * 40); // 20px to 60px
            const blur = (1 - depth) * 4; // up to 4px blur
            const opacity = (0.15 + (depth * 0.5)).toFixed(2); // 0.15 to 0.65
            
            // Random start position just below the screen
            const startX = -10 + Math.random() * 120; // -10vw to 110vw
            const startY = 110 + Math.random() * 20; // 110vh to 130vh
            
            // Float upwards and slightly sideways past the top
            const endX = startX + (-40 + Math.random() * 80); 
            const endY = -20 - Math.random() * 20; // -20vh to -40vh
            
            // Travel duration 20s to 50s (slower is more premium)
            const dur = (20 + (1 - depth) * 15 + Math.random() * 15).toFixed(1); 
            const delay = (-Math.random() * dur).toFixed(1);
            
            // Rotation
            const rotS = (Math.random() * 360).toFixed(1);
            const rotDirection = Math.random() > 0.5 ? 1 : -1;
            const rotE = (parseFloat(rotS) + rotDirection * (90 + Math.random() * 180)).toFixed(1);
            
            // Use cssText to guarantee CSS Custom Properties are correctly applied!
            book.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                font-size: ${size}px;
                left: ${startX}vw;
                top: ${startY}vh;
                color: #e0f2fe;
                filter: drop-shadow(0 0 ${8 + depth * 12}px rgba(255,255,255,${0.2 + depth * 0.4})) blur(${blur}px);
                animation-duration: ${dur}s;
                animation-delay: ${delay}s;
                --rot-start: ${rotS}deg;
                --rot-end: ${rotE}deg;
                --tx: ${endX - startX}vw;
                --ty: ${endY - startY}vh;
                --book-opacity: ${opacity};
            `;
            
            const ic = document.createElement('i');
            ic.className = icons[Math.floor(Math.random() * icons.length)];
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

