const textElement = document.getElementById('dialog-text');
const cursor = document.querySelector('.cursor-blink');

const dialogLines = [
    "Sammy, pegue o sal. Temos um problema.",
    "Esse demônio não vai a lugar nenhum.",
    "Onde eu deixei as chaves do opala?"
];

let currentLine = 0;
let currentChar = 0;
let isTyping = false;
let typingSpeed = 50; // ms per char

function typeWriter() {
    if (currentChar < dialogLines[currentLine].length) {
        isTyping = true;
        cursor.style.display = 'none';
        textElement.innerHTML += dialogLines[currentLine].charAt(currentChar);
        currentChar++;
        setTimeout(typeWriter, typingSpeed);
    } else {
        isTyping = false;
        cursor.style.display = 'block';
    }
}

function nextLine() {
    if (isTyping) {
        // Skip typing and show full line
        textElement.innerHTML = dialogLines[currentLine];
        currentChar = dialogLines[currentLine].length;
    } else {
        // Go to next line
        currentLine++;
        if (currentLine < dialogLines.length) {
            textElement.innerHTML = '';
            currentChar = 0;
            typeWriter();
        } else {
            // End of dialog
            textElement.innerHTML = "Fim do diálogo.";
            cursor.style.display = 'none';
        }
    }
}

// Start first line
textElement.innerHTML = '';
typeWriter();

// Listen for clicks or keypresses to advance dialog
document.addEventListener('click', nextLine);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        nextLine();
    }
});
