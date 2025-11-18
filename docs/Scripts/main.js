
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

    // Choose window-specific size if you want variation
    switch (win.id) {
        case 'about-window':
            win.style.width = '900px';
            win.style.height = '600px';
            break;
        case 'projects-window':
            win.style.width = '900px';
            win.style.height = '600px';
            break;
        case 'contact-window':
            win.style.width = '800px';
            win.style.height = '650px';
            break;
        case 'terminal-window':
            win.style.width = '900px';
            win.style.height = '500px';
            break;
        default:
            win.style.width = DEFAULT_W + 'px';
            win.style.height = DEFAULT_H + 'px';
    }

    // Calculate centered position dynamically based on actual size
    const rect = win.getBoundingClientRect();
    const width = parseInt(win.style.width);
    const height = parseInt(win.style.height);

    const centerX = (window.innerWidth - width) / 2;
    const centerY = (window.innerHeight - TASKBAR_HEIGHT - height) / 2;

    win.style.left = `${centerX}px`;
    win.style.top  = `${centerY}px`;

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
        win.classList.remove('active');
        // Reset to original position next time it opens
        win.dataset.initialized = ''; // clear initialization flag
        win.style.left = '';
        win.style.top = '';
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


// Contact window from about page
// --- Open Contact Window from "About" page link ---
document.addEventListener("DOMContentLoaded", () => {
  // If iframe or nested content tries to call this, use message passing
  window.addEventListener("message", (event) => {
    if (event.data === "open-contact") {
        const contactWin = document.getElementById("contact-window");
        if (contactWin) {
        initializeWindowSizeAndPosition(contactWin);
        contactWin.classList.add("active");
        clampWindowToViewport(contactWin);
        bringToFront(contactWin);
        }
    }
    });
});

// Start button in bottom left of screen
// === START MENU LOGIC ===
const startButton = document.querySelector('.start-button');
const startMenu = document.getElementById('start-menu');

startButton.addEventListener('click', (e) => {
    e.stopPropagation();
    startMenu.style.display =
    startMenu.style.display === 'block' ? 'none' : 'block';
});

// Close when clicking elsewhere
document.addEventListener('click', () => {
    startMenu.style.display = 'none';
});

// Start menu item actions
document.getElementById('start-about').addEventListener('click', () => {
    openWindow('about');
});
document.getElementById('start-projects').addEventListener('click', () => {
    openWindow('projects');
});
document.getElementById('start-contact').addEventListener('click', () => {
    openWindow('contact');
});
document.getElementById('start-sleep').addEventListener('click', () => {
    alert('System entering sleep mode...');
    startMenu.style.display = 'none';
});
document.getElementById('start-shutdown').addEventListener('click', () => {
    alert('Shutting down PortfolioOS...');
    startMenu.style.display = 'none';
});

// Helper to open any existing window by ID
function openWindow(name) {
    const win = document.getElementById(`${name}-window`);
    if (!win) return;
    initializeWindowSizeAndPosition(win);
    win.classList.add('active');
    clampWindowToViewport(win);
    bringToFront(win);
    startMenu.style.display = 'none';
}

// ===== Maximize / Restore for all windows =====
(function () {
    const desktop = document.querySelector('#desktop') || document.body;
    const taskbar = document.querySelector('.taskbar');

    function getTaskbarHeight() {
        if (!taskbar) return 0;
            const r = taskbar.getBoundingClientRect();
            return Math.round(r.height);
    }

    function saveBounds(win) {
        if (win.dataset.savedBounds) return; // already saved
        const cs = getComputedStyle(win);
        win.dataset.prevLeft = cs.left;
        win.dataset.prevTop  = cs.top;
        win.dataset.prevW    = cs.width;
        win.dataset.prevH    = cs.height;
        win.dataset.savedBounds = '1';
    }

    function restoreBounds(win) {
        if (!win.dataset.savedBounds) return;
        win.style.left   = win.dataset.prevLeft;
        win.style.top    = win.dataset.prevTop;
        win.style.width  = win.dataset.prevW;
        win.style.height = win.dataset.prevH;
        delete win.dataset.prevLeft;
        delete win.dataset.prevTop;
        delete win.dataset.prevW;
        delete win.dataset.prevH;
        delete win.dataset.savedBounds;
    }

    function maximize(win) {
        saveBounds(win);
        const dw = desktop.clientWidth || innerWidth;
        const dh = desktop.clientHeight || innerHeight;
        // align to top-left; CSS handles taskbar offset via height calc
        win.style.left = '0px';
        win.style.top = '0px';
        win.style.width = dw + 'px';
        win.style.height = (dh - getTaskbarHeight()) + 'px';
        win.classList.add('maximized');
    }

    function unmaximize(win) {
        win.classList.remove('maximized');
        restoreBounds(win);
    }

    function toggleMaximize(win) {
        if (!win) return;
        if (win.classList.contains('maximized')) unmaximize(win);
        else maximize(win);
    }

  // Click handler for every "□" button we tagged
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="maximize"]');
        if (!btn) return;
        const win = btn.closest('.window');
        toggleMaximize(win);
    });

  // Optional: double-click title bar to toggle maximize
    document.addEventListener('dblclick', (e) => {
        const tb = e.target.closest('.window .title-bar');
        if (!tb) return;
        toggleMaximize(tb.closest('.window'));
    });

  // Keep maximized windows fitted on browser resize
    window.addEventListener('resize', () => {
        document.querySelectorAll('.window.maximized').forEach(maximize);
    });
})();


// ===== Minimize to taskbar / Restore from taskbar =====
(function () {
  const itemsBar = document.querySelector('#taskbar-items');
  if (!itemsBar) {
    console.warn('No #taskbar-items found; add <div id="taskbar-items" class="taskbar-items"></div> inside .taskbar');
  }

    function getOrCreateTaskItem(win) {
        const id = win.id;
        const itemsBar = document.querySelector('#taskbar-items');
        if (!id || !itemsBar) return null;

        let item = itemsBar.querySelector(`.task-item[data-win-id="${id}"]`);
        if (item) return item;

        // NEW: prefer the clean label from data-title
        const dataTitle = win.getAttribute('data-title');

        // fallback: try a specific title element, then prettify the id
        const titleEl = win.querySelector('.title-text') || win.querySelector('.title-bar .title');
        const rawTitle = titleEl ? (titleEl.textContent || titleEl.innerText || '').trim() : '';
        const prettyFromId = (id || '')
        .replace(/-window$/i, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, m => m.toUpperCase()) || 'Window';

        const title = dataTitle || rawTitle || prettyFromId;

        const icon = win.getAttribute('data-icon') || '';

        item = document.createElement('button');
        item.className = 'task-item';
        item.setAttribute('data-win-id', id);
        item.innerHTML = `<span class="task-title">${title}</span>`;

        if (icon) item.style.setProperty('--task-icon', `url("${icon}")`);

        itemsBar.appendChild(item);
        return item;
    }



  function saveBounds(win) {
    if (win.dataset.savedMinBounds) return;
    const cs = getComputedStyle(win);
    win.dataset.minPrevLeft = cs.left;
    win.dataset.minPrevTop  = cs.top;
    win.dataset.minPrevW    = cs.width;
    win.dataset.minPrevH    = cs.height;
    win.dataset.savedMinBounds = '1';
  }

  function restoreBoundsIfSaved(win) {
    if (!win.dataset.savedMinBounds) return;
    if (!win.classList.contains('maximized')) {
      win.style.left   = win.dataset.minPrevLeft;
      win.style.top    = win.dataset.minPrevTop;
      win.style.width  = win.dataset.minPrevW;
      win.style.height = win.dataset.minPrevH;
    }
    delete win.dataset.minPrevLeft;
    delete win.dataset.minPrevTop;
    delete win.dataset.minPrevW;
    delete win.dataset.minPrevH;
    delete win.dataset.savedMinBounds;
  }

  function bringToFront(win) {
    const all = Array.from(document.querySelectorAll('.window'));
    const topZ = Math.max(100, ...all.map(w => parseInt(getComputedStyle(w).zIndex || '100', 10)));
    win.style.zIndex = topZ + 1;
  }

  function minimizeWindow(win) {
    if (!win || win.classList.contains('minimized')) return;
    win.dataset.wasMaximized = win.classList.contains('maximized') ? '1' : '';
    saveBounds(win);
    win.classList.add('minimized');
    getOrCreateTaskItem(win);
  }

  function restoreWindowFromTaskbar(win) {
    if (!win) return;
    win.classList.remove('minimized');

    if (win.dataset.wasMaximized === '1') {
      win.classList.add('maximized');
    } else {
      win.classList.remove('maximized');
      restoreBoundsIfSaved(win);
    }

    bringToFront(win);
    const item = itemsBar && itemsBar.querySelector(`.task-item[data-win-id="${win.id}"]`);
    if (item) item.remove();
  }

  // Minimize on "__" button
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="minimize"]');
    if (!btn) return;
    const win = btn.closest('.window');
    minimizeWindow(win);
  });

  // Restore on taskbar item click
  itemsBar && itemsBar.addEventListener('click', (e) => {
    const item = e.target.closest('.task-item');
    if (!item) return;
    const id = item.getAttribute('data-win-id');
    const win = id && document.getElementById(id);
    restoreWindowFromTaskbar(win);
  });
})();
