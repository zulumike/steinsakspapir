(function loadMessageBoxCSS() {
    const existing = document.querySelector('link[data-uiutils="messagebox"]');
    if (existing) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./helpers/uiutils.css";   // endre sti hvis nødvendig
    link.dataset.uiutils = "messagebox";
    document.head.appendChild(link);
})();

(function initMessageBox() {
    // Backdrop
    let backdrop = document.getElementById("message-backdrop");
    if (!backdrop) {
        backdrop = document.createElement("div");
        backdrop.id = "message-backdrop";
        backdrop.hidden = true;
        document.body.appendChild(backdrop);
    }

    // Message box
    let box = document.getElementById("message-box");
    if (!box) {
        box = document.createElement("div");
        box.id = "message-box";
        box.hidden = true;
        document.body.appendChild(box);
    }
})();

let loadingInterval = null;
let messageTimeout = null;

/**
 * Displays a message box overlay in the UI.
 *
 * @param {string} message 
 *        The text content to display inside the message box.
 *
 * @param {'info'|'success'|'warning'|'error'|'confirm'|'loading'|'quit'} type 
 *        Defines the behavior and appearance of the message box:
 *        - "info" / "success" / "warning" / "error": 
 *              Shows a temporary message that auto-closes after the given duration.
 *        - "confirm": 
 *              Shows a modal dialog with OK/Cancel buttons and returns a Promise<boolean>.
 *        - "loading": 
 *              Shows a loading indicator with animated dots. Does not auto-close.
 *        - "quit": 
 *              Stops an active loading indicator and hides the message box.
 *
 * @param {number} duration 
 *        How long the message should remain visible (in milliseconds).
 *        Ignored for "confirm" and "loading".
 *
 * @returns {Promise<boolean>|void}
 *        - For "confirm": returns a Promise that resolves to true (OK) or false (Cancel).
 *        - For all other types: returns nothing.
 */
export function showMessageBox(message, type = 'info', duration = 3000) {
    const backdrop = document.getElementById('message-backdrop');
    const messageBox = document.getElementById('message-box');

    if (messageTimeout) {
        clearTimeout(messageTimeout);
        messageTimeout = null;
    }

    if (!messageBox) {
        console.warn('Message box element not found');
        return;
    }
    if (!message || typeof message !== 'string') {
        console.warn('Invalid message provided');
        return;
    }

    // Rydd opp før bruk
    messageBox.hidden = false;
    messageBox.className = 'message-box'; // reset
    messageBox.classList.add(type, 'show');
    messageBox.innerHTML = ''; // fjern alt innhold

    // Lag tekst-element
    const textEl = document.createElement('span');
    textEl.textContent = message;
    messageBox.appendChild(textEl);

    // CONFIRM
    if (type === 'confirm') {
        backdrop.hidden = false;
        requestAnimationFrame(() => backdrop.classList.add("show"));
        return new Promise(resolve => {
            const okButton = document.createElement('button');
            const cancelButton = document.createElement('button');

            okButton.textContent = 'OK';
            cancelButton.textContent = 'Avbryt';

            okButton.onclick = () => {
                cleanup();
                resolve(true);
            };
            cancelButton.onclick = () => {
                cleanup();
                resolve(false);
            };

            messageBox.appendChild(okButton);
            messageBox.appendChild(cancelButton);

            function cleanup() {
                messageBox.hidden = true;
                messageBox.innerHTML = '';
                backdrop.classList.remove("show");
                setTimeout(() => backdrop.hidden = true, 200);
            }
        });
    }

    // LOADING
    if (type === 'loading') {
        backdrop.hidden = false;
        requestAnimationFrame(() => backdrop.classList.add("show"));

        let dotCount = 0;

        loadingInterval = setInterval(() => {
            dotCount = (dotCount + 1) % 4;
            textEl.textContent = message + '.'.repeat(dotCount);
        }, 500);

        return; // loading skal ikke auto-close
    }

    // QUIT LOADING
    if (type === 'quit') {
        clearInterval(loadingInterval);
        loadingInterval = null;

        messageTimeout = setTimeout(() => {
            messageBox.hidden = true;
            messageBox.innerHTML = '';
            backdrop.classList.remove("show");
            setTimeout(() => backdrop.hidden = true, 200);
            messageTimeout = null;
        }, duration);

        return;
    }

    // INFO / ERROR / WARNING
    messageTimeout = setTimeout(() => {
        messageBox.hidden = true;
        messageBox.innerHTML = '';
        backdrop.classList.remove("show");
        setTimeout(() => backdrop.hidden = true, 200);
        messageTimeout = null;
    }, duration);
}
