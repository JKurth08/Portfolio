
// ===== Settings =====
const TASKBAR_HEIGHT = 40;
const DEFAULT_W = 560;
const DEFAULT_H = 380;
const CASCADE_OFFSET = 28;
let cascadeIndex = 0;


// --- Terminal banner (used by 'clear' and when resetting) ---
const TERMINAL_BANNER ="--help for available commands";

// Clock
function updateClock() {
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    document.getElementById('clock').textContent = `${hours}:${minutes} ${ampm}`;
}
updateClock();
setInterval(updateClock, 1000);

// Helpers
function bringToFront(win) {
    const maxZ = Math.max(
        10,
        ...Array.from(document.querySelectorAll('.window')).map(w => parseInt(getComputedStyle(w).zIndex) || 10)
    );
    win.style.zIndex = maxZ + 1;
}

function clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
}

function clampWindowToViewport(win) {
    const rect = win.getBoundingClientRect();
    const maxLeft = Math.max(0, window.innerWidth - rect.width);
    const maxTop  = Math.max(0, window.innerHeight - TASKBAR_HEIGHT - rect.height);
    win.style.left = clamp(rect.left, 0, maxLeft) + 'px';
    win.style.top  = clamp(rect.top,  0, maxTop) + 'px';
}

function initializeWindowSizeAndPosition(win) {
    if (win.dataset.initialized) return;

        // Set default consistent size
        win.style.width = DEFAULT_W + 'px';
        win.style.height = DEFAULT_H + 'px';

        // Calculate centered position
    const centerX = (window.innerWidth - DEFAULT_W) / 2;
    const centerY = (window.innerHeight - TASKBAR_HEIGHT - DEFAULT_H) / 2;

// Add slight cascade offset so multiple windows don’t perfectly overlap
const offset = CASCADE_OFFSET * cascadeIndex;
cascadeIndex = (cascadeIndex + 1) % 8; // prevent infinite drift

// Final position
win.style.left = `${centerX + offset}px`;
win.style.top  = `${centerY + offset}px`;

win.dataset.initialized = '1';
}


// Desktop icons (selection + double click to open)
const icons = document.querySelectorAll('.desktop-icon');
let selectedIcon = null;

icons.forEach(icon => {
    icon.addEventListener('click', (e) => {
        e.stopPropagation();
        if (selectedIcon) selectedIcon.classList.remove('selected');
        icon.classList.add('selected');
        selectedIcon = icon;
    });

    icon.addEventListener('dblclick', () => {
        const windowId = icon.dataset.window + '-window';
        const win = document.getElementById(windowId);
        if (win) {
            initializeWindowSizeAndPosition(win);
            win.classList.add('active');
            clampWindowToViewport(win);
            bringToFront(win);
        }
    });

    // Icon dragging (unchanged)
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    icon.addEventListener('mousedown', (e) => {
        if (e.detail === 1) {
            e.preventDefault();
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = icon.offsetLeft;
            startTop = icon.offsetTop;
            icon.style.zIndex = 100;
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging && selectedIcon === icon) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            icon.style.left = (startLeft + dx) + 'px';
            icon.style.top = (startTop + dy) + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            icon.style.zIndex = 1;
        }
    });
});

document.addEventListener('click', () => {
    if (selectedIcon) {
        selectedIcon.classList.remove('selected');
        selectedIcon = null;
    }
});

// Window management
const windows = document.querySelectorAll('.window');
windows.forEach(win => {
    const titleBar = win.querySelector('.title-bar');
    const closeBtn = win.querySelector('.close-btn');
    const resizer = win.querySelector('.resizer');

    // ===== Dragging with bounds =====
    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    titleBar.addEventListener('mousedown', (e) => {
        if (e.target.tagName !== 'BUTTON') {
            isDragging = true;
            const rect = win.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            bringToFront(win);
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const rect = win.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            let newLeft = e.clientX - offsetX;
            let newTop  = e.clientY - offsetY;

            const maxLeft = window.innerWidth - width;
            const maxTop  = window.innerHeight - TASKBAR_HEIGHT - height;

            newLeft = clamp(newLeft, 0, Math.max(0, maxLeft));
            newTop  = clamp(newTop,  0, Math.max(0, maxTop));

            win.style.left = newLeft + 'px';
            win.style.top  = newTop + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Close button
    closeBtn.addEventListener('click', () => {
        if (win.id === 'terminal-window') {
            // reset output + input
            terminalOutput.innerHTML = TERMINAL_BANNER;
            terminalInput.textContent = "";
        }
        win.classList.remove('active');
    });


    // ===== Resizing with bounds =====
    let isResizing = false;
    let startWidth = 0, startHeight = 0, resizeStartX = 0, resizeStartY = 0;

    resizer.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        isResizing = true;
        resizeStartX = e.clientX;
        resizeStartY = e.clientY;
        const rect = win.getBoundingClientRect();
        startWidth = rect.width;
        startHeight = rect.height;
        bringToFront(win);
    });

    document.addEventListener('mousemove', (e) => {
        if (isResizing) {
            e.preventDefault();
            const dx = e.clientX - resizeStartX;
            const dy = e.clientY - resizeStartY;

            const rect = win.getBoundingClientRect();
            const maxWidth  = window.innerWidth - rect.left;
            const maxHeight = window.innerHeight - TASKBAR_HEIGHT - rect.top;

            const newW = clamp(startWidth + dx, 560, Math.max(560, maxWidth));
            const newH = clamp(startHeight + dy, 380, Math.max(380, maxHeight));

            win.style.width = newW + 'px';
            win.style.height = newH + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        isResizing = false;
    });

    // Bring to front on click
    win.addEventListener('mousedown', () => bringToFront(win));
});

// Keep active windows inside viewport if the browser is resized
window.addEventListener('resize', () => {
    document.querySelectorAll('.window.active').forEach(clampWindowToViewport);
});

/*// ===== Projects -> Open Terminal on click =====
document.querySelectorAll('.project-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        const projectName = link.dataset.project;

        // Open terminal
        const terminal = document.getElementById('terminal-window');
        initializeWindowSizeAndPosition(terminal);
        terminal.classList.add('active');
        bringToFront(terminal);

        // Print in terminal
        const output = document.getElementById('terminal-output');
        const line = document.createElement('div');
        line.textContent = `Opening project: ${projectName}`;
        output.appendChild(line);
        scrollToBottom();

        // Focus input cursor
        focusTerminalInput();
    });
});
*/


// ===== Terminal Logic =====
const terminalBody = document.getElementById('terminal-body');
const terminalOutput = document.getElementById('terminal-output');
const terminalInput = document.getElementById('terminal-input');

// helper scroll fucntion
function scrollToBottom() {
    if (terminalOutput) {
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
}


// Focus input when terminal opens
function focusTerminalInput() {
    terminalInput.focus();
    // Move caret to end
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(terminalInput);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
}

// Handle command input
terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = terminalInput.textContent.trim();
        runCommand(cmd);
        terminalInput.textContent = '';
    }
});

// Define simple commands
function runCommand(cmd) {
    if (cmd === '') return;

    const outputLine = document.createElement('div');
    outputLine.textContent = `> ${cmd}`;
    terminalOutput.appendChild(outputLine);

    let response = '';
    switch (cmd.toLowerCase()) {
        case '--help':
            response = "Commands:\n --help\n --clear\n --projects\n --about\n";
            break;
        case '--clear':
            // wipe screen but keep banner
            terminalOutput.innerHTML = TERMINAL_BANNER;
            // jump to the top so the banner is visible at the top
            terminalOutput.scrollTop = 0;
            return;
        case '--projects':
            response = "FractionalKnapsack.java\nTaskScheduler.java\nHeapAPQ.java\nWeatherApp.py\nTerminalEmulator.c";
            break;
        case '--about':
            response = "PortfolioOS by Jack Kurth — MTU CS Student.";
            break;
        default:
            response = `Unknown command: ${cmd}`;
    }

    const respLine = document.createElement('div');
    respLine.textContent = response;
    terminalOutput.appendChild(respLine);
    scrollToBottom();

}

// Keep terminal focused even after dragging or clicking
const terminalWin = document.getElementById('terminal-window');

terminalWin.addEventListener('mousedown', () => {
    bringToFront(terminalWin);
});

terminalWin.addEventListener('mouseup', () => {
    // Re-focus input when mouse released after dragging
    setTimeout(() => focusTerminalInput(), 50);
});

// Also refocus if you click inside the terminal body itself
terminalBody.addEventListener('mousedown', () => {
    setTimeout(() => focusTerminalInput(), 50);
});

