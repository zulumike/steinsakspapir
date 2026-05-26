let game = {
    code: "",
    players: [],
    started: false,
    host: null,
    localPlayer: null,
    round: 0
};

let countdownInterval = null;

function randomCode() {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function handIcon(hand) {
    if (hand === "rock") return "👊";
    if (hand === "paper") return "✋";
    if (hand === "scissor") return "✌️";
    if (hand === "dead") return "💀";
    return "";
}

function beats(a, b) {
    return (
        (a === "rock" && b === "scissor") ||
        (a === "paper" && b === "rock") ||
        (a === "scissor" && b === "paper")
    );
}

/* ---------------- LOBBY ---------------- */

document.getElementById("createGameBtn").onclick = () => {
    const name = document.getElementById("creatorName").value.trim();
    if (!name) return alert("You must enter your name");

    game.code = randomCode();
    game.host = name;
    game.localPlayer = name;
    game.players = [];
    game.started = false;
    game.round = 0;

    game.players.push({
    name,
    left: "rock",
    right: "rock",
    leftChoice: "",
    rightChoice: "",
    leftStatus: "none",
    rightStatus: "none",
    leftArrow: "",
    rightArrow: "",
    alive: true
});

    document.getElementById("gameCode").innerText = "Game code: " + game.code;

    document.getElementById("joinSection").style.display = "none";
    document.getElementById("botControls").style.display = "block";
    document.getElementById("startGameBtn").style.display = "block";

    updatePlayerList();
};

document.getElementById("addBotsBtn").onclick = () => {
    const count = parseInt(document.getElementById("botCount").value);
    if (isNaN(count) || count < 1) return;

    for (let i = 0; i < count; i++) {
        const botName = "Bot #" + (game.players.length);
        game.players.push({
            name: botName,
            left: "rock",
            right: "rock",
            leftChoice: "",
            rightChoice: "",
            leftStatus: "none",
            rightStatus: "none",
            leftArrow: "",
            rightArrow: "",
            alive: true
        });
    }
    updatePlayerList();
};

document.getElementById("joinBtn").onclick = () => {
    const name = document.getElementById("playerName").value.trim();
    const code = document.getElementById("joinCode").value.trim();

    if (!name) return alert("You must enter your name");
    if (code !== game.code) return alert("Wrong code");
    if (game.started) return alert("Game already started");

    game.localPlayer = name;

    game.players.push({
        name,
        left: "rock",
        right: "rock",
        leftChoice: "",
        rightChoice: "",
        leftStatus: "none",
        rightStatus: "none",
        leftArrow: "",
        rightArrow: "",
        alive: true
    });

    document.getElementById("createSection").style.display = "none";

    updatePlayerList();
};

document.getElementById("startGameBtn").onclick = () => {
    if (game.localPlayer !== game.host) return;
    if (game.players.length < 2) return alert("Need at least 2 players");

    game.started = true;
    document.getElementById("lobby").style.display = "none";
    document.getElementById("game").style.display = "block";

    document.getElementById("nextRoundBtn").style.display =
        game.localPlayer === game.host ? "inline-block" : "none";

    startNewRound();
};

function updatePlayerList() {
    const div = document.getElementById("players");
    div.innerHTML = "<h3>Players:</h3>";
    game.players.forEach(p => {
        div.innerHTML += `<p>${p.name}${p.name === game.host ? " (host)" : ""}</p>`;
    });
}

/* ---------------- ROUND / TIMER ---------------- */

function startTimer(timer = 10) {
    clearInterval(countdownInterval);
    document.getElementById("timer").innerText = timer;

    countdownInterval = setInterval(() => {
        timer--;
        document.getElementById("timer").innerText = timer;
        if (timer <= 0) {
            clearInterval(countdownInterval);
            autoSubmitHands();
        }
    }, 1000);
}

function startNewRound() {
    clearInterval(countdownInterval);
    game.round++;
    document.getElementById("roundInfo").innerText = "Round " + game.round;

    const me = game.players.find(p => p.name === game.localPlayer);

    game.players.forEach(p => {
        if (!p.alive) return;

        if (p.left === null && p.right === null) {
            p.alive = false;
            return;
        }

        if (p.left === null) p.leftChoice = "dead";
        if (p.right === null) p.rightChoice = "dead";

        p.leftStatus = "none";
        p.rightStatus = "none";

        if (p.name === game.localPlayer) {
            if (p.left !== null) p.leftChoice = "";
            if (p.right !== null) p.rightChoice = "";
        }
    });

    updateChoiceUI();
    drawRing();
    startTimer();
}

function updateChoiceUI() {
    const me = game.players.find(p => p.name === game.localPlayer);
    const buttons = document.querySelectorAll(".handBtn");

    if (!me || !me.alive) {
        buttons.forEach(btn => {
            btn.classList.add("disabled");
            btn.classList.remove("selected");
        });
        return;
    }

    buttons.forEach(btn => {
        const hand = btn.getAttribute("data-hand");
        const value = btn.getAttribute("data-value");

        btn.classList.remove("disabled", "selected");

        if (hand === "left" && me.left === null) {
            btn.classList.add("disabled");
        }
        if (hand === "right" && me.right === null) {
            btn.classList.add("disabled");
        }

        if (hand === "left" && me.leftChoice === value) {
            btn.classList.add("selected");
        }
        if (hand === "right" && me.rightChoice === value) {
            btn.classList.add("selected");
        }
    });
}

document.querySelectorAll(".handBtn").forEach(btn => {
    btn.addEventListener("click", () => {
        if (btn.classList.contains("disabled")) return;

        const hand = btn.getAttribute("data-hand");
        const value = btn.getAttribute("data-value");
        const me = game.players.find(p => p.name === game.localPlayer);
        if (!me || !me.alive) return;

        if (hand === "left" && me.left !== null) {
            me.leftChoice = value;
        }
        if (hand === "right" && me.right !== null) {
            me.rightChoice = value;
        }

        updateChoiceUI();
    });
});

document.getElementById("nextRoundBtn").onclick = () => {
    if (game.localPlayer !== game.host) return;
    startNewRound();
};

/* ---------------- AUTO SUBMIT ---------------- */

function autoSubmitHands() {
    const me = game.players.find(p => p.name === game.localPlayer);

    if (me && me.alive) {
        if (!me.leftChoice || me.leftChoice === "dead") {
            me.left = null;
            me.leftStatus = "lose";
        } else {
            me.left = me.leftChoice;
        }

        if (!me.rightChoice || me.rightChoice === "dead") {
            me.right = null;
            me.rightStatus = "lose";
        } else {
            me.right = me.rightChoice;
        }
    }

    const options = ["rock", "paper", "scissor"];

    game.players.forEach(p => {
        if (p.name !== game.localPlayer && p.alive) {
            if (p.left !== null) {
                p.leftChoice = options[Math.floor(Math.random() * 3)];
                p.left = p.leftChoice;
            }
            if (p.right !== null) {
                p.rightChoice = options[Math.floor(Math.random() * 3)];
                p.right = p.rightChoice;
            }
        }
    });

    resolveRound();
}

/* ---------------- RESOLVE ---------------- */

function resolveRound() {
    const alive = game.players.filter(p => p.alive);
    const count = alive.length;

    alive.forEach((p, i) => {
        const rightOpponent = alive[(i - 1 + count) % count];
        const leftOpponent = alive[(i + 1) % count];

        p.leftStatus = "none";
        p.rightStatus = "none";

        p.leftArrow = "";   // "←" eller "→" eller ""
        p.rightArrow = "";

        if (p.left !== null && leftOpponent.right !== null) {
            p.leftArrow = "←"; // viser at denne hånden møter venstre nabo
            if (beats(p.left, leftOpponent.right)) {
                p.leftStatus = "win";
                console.log(`${p.name} wins left against ${leftOpponent.name}`);
            } else if (beats(leftOpponent.right, p.left)) {
                console.log(`${p.name} loses left against ${leftOpponent.name}`);
                p.leftStatus = "lose";
                // p.left = null;
            }
        }

        if (p.right !== null && rightOpponent.left !== null) {
            p.rightArrow = "→"; // viser at denne hånden møter høyre nabo
            if (beats(p.right, rightOpponent.left)) {
                p.rightStatus = "win";
                console.log(`${p.name} wins right against ${rightOpponent.name}`);
            } else if (beats(rightOpponent.left, p.right)) {
                console.log(`${p.name} loses right against ${rightOpponent.name}`);
                p.rightStatus = "lose";
                // p.right = null;
            }
        }

        // if (p.left === null && p.right === null) {
        //     p.alive = false;
        // }
    });

    drawRing();

    const remaining = game.players.filter(p => p.alive);
    if (remaining.length === 1) {
        alert("Winner: " + remaining[0].name);
        clearInterval(countdownInterval);
    }
}

/* ---------------- DRAW RING ---------------- */

function drawRing() {
    const ring = document.getElementById("ring");
    ring.innerHTML = "";

    const alivePlayers = game.players.filter(p => p.alive);
    const count = alivePlayers.length || 1;

    alivePlayers.forEach((p, i) => {
        const angle = (i / count) * 2 * Math.PI;
        const x = 200 + 200 * Math.cos(angle);
        const y = 200 + 200 * Math.sin(angle);

        const div = document.createElement("div");
        div.className = "player";
        div.style.left = x + "px";
        div.style.top = y + "px";

        // div.innerHTML = `
        //     <strong>${p.name}</strong><br>
        //     <span class="hand ${p.leftStatus}">${handIcon(p.leftChoice)}</span>
        //     <span class="hand ${p.rightStatus}">${handIcon(p.rightChoice)}</span>
        // `;

        div.innerHTML = `
            <strong>${p.name}</strong><br>
            <div class="handRow">
                <span class="label">L</span>
                <span class="hand ${p.leftStatus}">${handIcon(p.leftChoice)}</span>
                <span class="arrow">${p.leftArrow}</span>

                <span class="label">R</span>
                <span class="hand ${p.rightStatus}">${handIcon(p.rightChoice)}</span>
                <span class="arrow">${p.rightArrow}</span>
            </div>
        `;

        ring.appendChild(div);
    });
}