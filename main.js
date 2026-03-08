// --- Data ---
const profiles = [
    { name: "Oyen", age: 3, bio: "Sunbathing expert & biscuit maker 🧡", tag: "orange" },
    { name: "Tam", age: 5, bio: "Master of hiding in dark places 🖤", tag: "black" },
    { name: "Snow", age: 2, bio: "Fluffy cloud who judges everyone ☁️", tag: "white" },
    { name: "Whiskers", age: 4, bio: "Professional zoomies at 3am 💨", tag: "cute" },
    { name: "Atan", age: 6, bio: "Too elegant for you, but swipe anyway 👑", tag: "funny" },
    { name: "Comel", age: 1, bio: "Youngest troublemaker in the house 😈", tag: "kitten" },
    { name: "Husky", age: 3, bio: "Boo 👻", tag: "Halloween" },
    { name: "Smoky", age: 5, bio: "Choclate Flavor 🍫", tag: "Chocolate" },
    { name: "Iris", age: 4, bio: "Everyday is a festive 🎉", tag: "Christmas " },
    { name: "Sire", age: 2, bio: "Well, G'day we're having today 🧐", tag: "Collar" },
    { name: "Eepy", age: 1, bio: "Don't wake me up 💤", tag: "sleepy" },
    { name: "Mario & Luigi", age: 4, bio: "Brothers in arms🫂", tag: "TwoCats" },
    { name: "Abu", age: 5, bio: "Too long in the Oven ♨", tag: "grey" },
    { name: "Oyu", age: 3, bio: "Hey, What'chu doing? 😉", tag: "blink" },
    { name: "Atai", age: 3, bio: "Sniff, Sniff", tag: "blackandwhite" },
    { name: "Grumps", age: 3, bio: "Always with an attitude (¬⤙¬ )", tag: "grumpy" },
    { name: "Nene", age: 3, bio: "Whatsapp Status: Busy 🟢", tag: "telephony" },
    { name: "Ciku", age: 1, bio: "At your Service", tag: "housemaid" },
    { name: "Mina", age: 3, bio: "You can's resist 🥹", tag: "soft" },
    { name: "Ninja", age: 3, bio: "Hiding in the shadow 🥷🏻", tag: "ninja" },
];
// --- State ---
let deck = shuffle(profiles).slice(0, 10);
let swipeHistory = [];
let likedCount = 0;
let nopedCount = 0;
// --- DOM refs ---
const stackEl = document.getElementById("card-stack");
const emptyEl = document.getElementById("empty");
const likedEl = document.getElementById("liked-count");
const nopedEl = document.getElementById("noped-count");
// --- Build a card element from a profile ---
function buildCard(p) {
    const card = document.createElement("div");
    card.className = "card";
    // Each call generates a fresh random cat image from cataas.com based on the profile's tag
    const imgUrl = `https://cataas.com/cat/${p.tag}?type=square&width=400`;
    card.innerHTML = `
    <img class="card-img" src="${imgUrl}" alt="${p.name}" draggable="false"/>
    <div class="card-overlay"></div>
    <div class="card-info">
      <h2>${p.name}, ${p.age}</h2>
      <p>${p.bio}</p>
    </div>
    <div class="stamp like">Like</div>
    <div class="stamp nope">Nope</div>
  `;
    return card;
}
function showSummary() {
    const summaryEl = document.getElementById("liked-summary");
    const liked = swipeHistory.filter(s => s.decision === "like");
    if (liked.length === 0) {
        summaryEl.innerHTML = `<p>You didn't like anyone this round 😿</p>`;
        return;
    }
    summaryEl.innerHTML = liked.map(s => `
    <div class="summary-card">
      <img src="https://cataas.com/cat/${s.profile.tag}?type=square&width=80" alt="${s.profile.name}"/>
      <div>
        <strong>${s.profile.name}, ${s.profile.age}</strong>
        <p>${s.profile.bio}</p>
      </div>
    </div>
  `).join("");
}
// --- Render the top 3 cards into the stack ---
function renderStack() {
    if (deck.length === 0) {
        stackEl.innerHTML = ""; // clear any remaining cards
        stackEl.appendChild(emptyEl); // put empty div back in
        showSummary();
        emptyEl.classList.add("visible");
        return;
    }
    emptyEl.classList.remove("visible");
    stackEl.innerHTML = "";
    const slice = deck.slice(0, 3).reverse();
    slice.forEach((profile, i) => {
        const card = buildCard(profile);
        const frontIndex = slice.length - 1 - i;
        if (frontIndex === 0) {
            card.classList.add("active");
            attachDrag(card);
        }
        else if (frontIndex === 1) {
            card.classList.add("behind-1");
        }
        else {
            card.classList.add("behind-2");
        }
        stackEl.appendChild(card);
    });
}
function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}
function attachDrag(card) {
    let startX = 0, startY = 0;
    let curX = 0, curY = 0;
    let dragging = false;
    const THRESHOLD = 90; // px to trigger a swipe
    const likeStamp = card.querySelector(".stamp.like");
    const nopeStamp = card.querySelector(".stamp.nope");
    function start(x, y) {
        dragging = true;
        startX = x;
        startY = y;
        card.style.transition = "none"; // disable during drag
    }
    function move(x, y) {
        if (!dragging)
            return;
        curX = x - startX;
        curY = y - startY;
        // Translate + rotate proportionally to drag
        card.style.transform = `translate(${curX}px, ${curY}px) rotate(${curX * 0.08}deg)`;
        // Reveal stamp based on how far the drag has gone (0 → 1)
        const progress = Math.min(Math.abs(curX) / THRESHOLD, 1);
        if (curX > 10) {
            likeStamp.style.opacity = String(progress);
            nopeStamp.style.opacity = "0";
        }
        else if (curX < -10) {
            nopeStamp.style.opacity = String(progress);
            likeStamp.style.opacity = "0";
        }
        else {
            likeStamp.style.opacity = "0";
            nopeStamp.style.opacity = "0";
        }
    }
    function end() {
        if (!dragging)
            return;
        dragging = false;
        likeStamp.style.opacity = "0";
        nopeStamp.style.opacity = "0";
        if (curX > THRESHOLD)
            dismiss(card, "like");
        else if (curX < -THRESHOLD)
            dismiss(card, "nope");
        else {
            // Snap back with a springy ease
            card.style.transition = "transform .4s cubic-bezier(.175,.885,.32,1.275)";
            card.style.transform = "translate(0,0) rotate(0deg)";
        }
        curX = 0;
        curY = 0;
    }
    // Mouse events (attach move/up to window so fast movement doesn't lose tracking)
    card.addEventListener("mousedown", e => start(e.clientX, e.clientY));
    window.addEventListener("mousemove", e => move(e.clientX, e.clientY));
    window.addEventListener("mouseup", () => end());
    // Touch events (mobile)
    card.addEventListener("touchstart", e => start(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    window.addEventListener("touchmove", e => move(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    window.addEventListener("touchend", () => end());
}
// Floating emoji that pops up on each swipe
function spawnFlyout(emoji) {
    const el = document.createElement("div");
    el.className = "flyout";
    el.textContent = emoji;
    const rect = stackEl.getBoundingClientRect();
    el.style.left = `${rect.left + rect.width / 2 - 24}px`;
    el.style.top = `${rect.top + rect.height / 2 - 24}px`;
    document.body.appendChild(el);
    el.addEventListener("animationend", () => el.remove()); // clean up after animation
}
// Called when a swipe crosses the threshold (or a button is clicked)
function dismiss(card, decision) {
    const profile = deck.shift(); // remove from front of deck
    swipeHistory.push({ profile, decision }); // save for undo
    const dir = decision === "like" ? 1 : -1;
    card.style.transition = "transform .45s cubic-bezier(.25,.46,.45,.94), opacity .45s";
    card.style.transform = `translateX(${dir * 130}%) rotate(${dir * 30}deg)`; // fly off screen
    card.style.opacity = "0";
    // Remove the card element after the animation, then re-render
    card.addEventListener("transitionend", () => {
        card.remove();
        renderStack();
    }, { once: true }); // once:true auto-removes the listener — no memory leak
    if (decision === "like") {
        likedCount++;
        likedEl.textContent = String(likedCount);
        spawnFlyout("💕");
    }
    else {
        nopedCount++;
        nopedEl.textContent = String(nopedCount);
        spawnFlyout("✖️");
    }
}
// Nope button
document.getElementById("btn-nope").addEventListener("click", () => {
    const card = stackEl.querySelector(".card.active");
    if (card)
        dismiss(card, "nope");
});
// Like button
document.getElementById("btn-like").addEventListener("click", () => {
    const card = stackEl.querySelector(".card.active");
    if (card)
        dismiss(card, "like");
});
// Undo — pop from history and push back to front of deck
document.getElementById("btn-rewind").addEventListener("click", () => {
    if (swipeHistory.length === 0)
        return;
    const last = swipeHistory.pop();
    deck.unshift(last.profile); // put the profile back at the front
    if (last.decision === "like") {
        likedCount = Math.max(0, likedCount - 1);
        likedEl.textContent = String(likedCount);
    }
    else {
        nopedCount = Math.max(0, nopedCount - 1);
        nopedEl.textContent = String(nopedCount);
    }
    renderStack();
});
// Reset everything
document.getElementById("btn-reset").addEventListener("click", () => {
    deck = shuffle(profiles).slice(0, 10); // fresh random 10 each time
    swipeHistory = [];
    likedCount = 0;
    nopedCount = 0;
    likedEl.textContent = "0";
    nopedEl.textContent = "0";
    renderStack();
});
// Keyboard shortcuts
window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight")
        document.getElementById("btn-like").click();
    if (e.key === "ArrowLeft")
        document.getElementById("btn-nope").click();
    if (e.key === "ArrowUp")
        document.getElementById("btn-rewind").click();
});
// Kick everything off!
renderStack();
