// --- Types ---
interface Profile {
  name: string;
  age:  number;
  bio:  string;
  img:  string;
}

type Decision = "like" | "nope";

// --- Data ---
const profiles: Profile[] = [
  { name:"Aurora", age:26, bio:"Painter of dreams ✨", img:"https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=700&q=80" },
  { name:"Kai",    age:28, bio:"Surfer by day 🌊",     img:"https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=700&q=80" },
  { name:"Selene", age:24, bio:"Coffee & chemistry ☕", img:"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700&q=80" },
  { name:"Remi",   age:30, bio:"Chef-in-training 🍝",  img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=80" },
  { name:"Indigo", age:22, bio:"Poet & traveller 🗺️",  img:"https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700&q=80" },
];

// --- State ---
let deck: Profile[] = [...profiles]; // copy so reset works
let swipeHistory: { profile: Profile; decision: Decision }[] = [];
let likedCount = 0;
let nopedCount = 0;

// --- DOM refs ---
const stackEl = document.getElementById("card-stack")!;
const emptyEl = document.getElementById("empty")!;
const likedEl = document.getElementById("liked-count")!;
const nopedEl = document.getElementById("noped-count")!;

// --- Build a card element from a profile ---
function buildCard(p: Profile): HTMLElement {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <img class="card-img" src="${p.img}" alt="${p.name}" draggable="false"/>
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

// --- Render the top 3 cards into the stack ---
function renderStack(): void {
  stackEl.innerHTML = "";

  if (deck.length === 0) {
    emptyEl.classList.add("visible");
    return;
  }
  emptyEl.classList.remove("visible");

  // Reverse so the first card ends up on top (appended last = highest z-index)
  const slice = deck.slice(0, 3).reverse();

  slice.forEach((profile, i) => {
    const card = buildCard(profile);
    const frontIndex = slice.length - 1 - i; // 0 = top card

    if      (frontIndex === 0) { card.classList.add("active");   attachDrag(card); }
    else if (frontIndex === 1) { card.classList.add("behind-1"); }
    else                       { card.classList.add("behind-2"); }

    stackEl.appendChild(card);
  });
}

function attachDrag(card: HTMLElement): void {
  let startX = 0, startY = 0;
  let curX = 0, curY = 0;
  let dragging = false;

  const THRESHOLD = 90; // px to trigger a swipe
  const likeStamp = card.querySelector<HTMLElement>(".stamp.like")!;
  const nopeStamp = card.querySelector<HTMLElement>(".stamp.nope")!;

  function start(x: number, y: number): void {
    dragging = true;
    startX = x; startY = y;
    card.style.transition = "none"; // disable during drag
  }

  function move(x: number, y: number): void {
    if (!dragging) return;
    curX = x - startX;
    curY = y - startY;

    // Translate + rotate proportionally to drag
    card.style.transform = `translate(${curX}px, ${curY}px) rotate(${curX * 0.08}deg)`;

    // Reveal stamp based on how far the drag has gone (0 → 1)
    const progress = Math.min(Math.abs(curX) / THRESHOLD, 1);
    if      (curX >  10) { likeStamp.style.opacity = String(progress); nopeStamp.style.opacity = "0"; }
    else if (curX < -10) { nopeStamp.style.opacity = String(progress); likeStamp.style.opacity = "0"; }
    else                 { likeStamp.style.opacity = "0"; nopeStamp.style.opacity = "0"; }
  }

  function end(): void {
    if (!dragging) return;
    dragging = false;
    likeStamp.style.opacity = "0";
    nopeStamp.style.opacity = "0";

    if      (curX >  THRESHOLD) dismiss(card, "like");
    else if (curX < -THRESHOLD) dismiss(card, "nope");
    else {
      // Snap back with a springy ease
      card.style.transition = "transform .4s cubic-bezier(.175,.885,.32,1.275)";
      card.style.transform  = "translate(0,0) rotate(0deg)";
    }
    curX = 0; curY = 0;
  }

  // Mouse events (attach move/up to window so fast movement doesn't lose tracking)
  card.addEventListener("mousedown",   e => start(e.clientX, e.clientY));
  window.addEventListener("mousemove", e => move(e.clientX, e.clientY));
  window.addEventListener("mouseup",   () => end());

  // Touch events (mobile)
  card.addEventListener("touchstart",  e => start(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  window.addEventListener("touchmove", e => move(e.touches[0].clientX, e.touches[0].clientY),  { passive: true });
  window.addEventListener("touchend",  () => end());
}

// Floating emoji that pops up on each swipe
function spawnFlyout(emoji: string): void {
  const el = document.createElement("div");
  el.className = "flyout";
  el.textContent = emoji;

  const rect = stackEl.getBoundingClientRect();
  el.style.left = `${rect.left + rect.width  / 2 - 24}px`;
  el.style.top  = `${rect.top  + rect.height / 2 - 24}px`;

  document.body.appendChild(el);
  el.addEventListener("animationend", () => el.remove()); // clean up after animation
}

// Called when a swipe crosses the threshold (or a button is clicked)
function dismiss(card: HTMLElement, decision: Decision): void {
  const profile = deck.shift()!;                  // remove from front of deck
  swipeHistory.push({ profile, decision });       // save for undo

  const dir = decision === "like" ? 1 : -1;
  card.style.transition = "transform .45s cubic-bezier(.25,.46,.45,.94), opacity .45s";
  card.style.transform  = `translateX(${dir * 130}%) rotate(${dir * 30}deg)`; // fly off screen
  card.style.opacity    = "0";

  // Remove the card element after the animation, then re-render
  card.addEventListener("transitionend", () => {
    card.remove();
    renderStack();
  }, { once: true }); // once:true auto-removes the listener — no memory leak

  if (decision === "like") {
    likedCount++;
    likedEl.textContent = String(likedCount);
    spawnFlyout("💚");
  } else {
    nopedCount++;
    nopedEl.textContent = String(nopedCount);
    spawnFlyout("✖️");
  }
}

// Nope button
document.getElementById("btn-nope")!.addEventListener("click", () => {
  const card = stackEl.querySelector<HTMLElement>(".card.active");
  if (card) dismiss(card, "nope");
});

// Like button
document.getElementById("btn-like")!.addEventListener("click", () => {
  const card = stackEl.querySelector<HTMLElement>(".card.active");
  if (card) dismiss(card, "like");
});

// Undo — pop from history and push back to front of deck
document.getElementById("btn-rewind")!.addEventListener("click", () => {
  if (swipeHistory.length === 0) return;

  const last = swipeHistory.pop()!;
  deck.unshift(last.profile); // put the profile back at the front

  if (last.decision === "like") { likedCount = Math.max(0, likedCount - 1); likedEl.textContent = String(likedCount); }
  else                          { nopedCount = Math.max(0, nopedCount - 1); nopedEl.textContent = String(nopedCount); }

  renderStack();
});

// Reset everything
document.getElementById("btn-reset")!.addEventListener("click", () => {
  deck         = [...profiles];
  swipeHistory = [];
  likedCount   = 0; nopedCount = 0;
  likedEl.textContent = "0"; nopedEl.textContent = "0";
  renderStack();
});

// Keyboard shortcuts
window.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === "ArrowRight") document.getElementById("btn-like")!.click();
  if (e.key === "ArrowLeft")  document.getElementById("btn-nope")!.click();
  if (e.key === "ArrowUp")    document.getElementById("btn-rewind")!.click();
});

// Kick everything off!
renderStack();