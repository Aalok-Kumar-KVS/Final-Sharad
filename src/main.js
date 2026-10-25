import { featuredMovie, movies, team, searchSuggestions } from "./data/movies.js";
import { recommend } from "./lib/recommend.js";

// ---------- Tiny helpers ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const el = (tag, cls) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
};

const state = {
  page: "home",
  searchQuery: null,
  rowMovies: movies.slice(0, 10),
  rowTitle: "NEW RELEASES",
};

// ---------- Navigation ----------
function setPage(page) {
  state.page = page;
  $$(".page").forEach((p) => p.classList.remove("is-active"));
  $(`#page-${page}`).classList.add("is-active");
  $$(".nav__btn").forEach((b) => b.classList.toggle("is-active", b.dataset.nav === page));
  window.scrollTo({ top: 0, behavior: "auto" });
}

// ---------- Featured ----------
function renderFeatured() {
  const f = featuredMovie;
  $(".featured__img").src = f.poster;
  $(".featured__img").alt = f.title;
  $(".featured__title").textContent = f.title;
  $(".featured__desc").textContent = f.description;

  const meta = $(".featured__meta");
  if (meta) meta.textContent = formatMeta(f);
}

// ---------- Movie row ----------
function renderRow() {
  const scroller = $("#movie-scroller");
  scroller.innerHTML = "";
  $("#row-title").textContent = state.rowTitle;
  $("#search-context").hidden = state.searchQuery === null;

  state.rowMovies.forEach((m) => {
    const card = el("article", "card");
    card.dataset.id = String(m.id);

    const img = el("img", "card__img");
    img.src = m.poster;
    img.alt = m.title;
    img.loading = "lazy";
    card.appendChild(img);

    const overlay = el("div", "card__overlay");
    const genres = el("div", "card__genres");
    genres.textContent = (m.genres || []).slice(0, 2).join(" · ");
    overlay.appendChild(genres);
    const title = el("h3", "card__title");
    title.textContent = m.title;
    overlay.appendChild(title);
    const desc = el("p", "card__desc");
    desc.textContent = m.description;
    overlay.appendChild(desc);
    card.appendChild(overlay);

    card.addEventListener("click", () => openModal(m));
    scroller.appendChild(card);
  });
}

// ---------- Row arrows ----------
$$(".row__arrow").forEach((btn) => {
  btn.addEventListener("click", () => {
    const scroller = $("#movie-scroller");
    const dir = Number(btn.dataset.scroll);
    scroller.scrollBy({ left: dir * Math.min(scroller.clientWidth * 0.8, 720), behavior: "smooth" });
  });
});

// ---------- Modal ----------
function formatMeta(m) {
  const bits = [];
  if (m.year) bits.push(String(m.year));
  if (m.contentRating) bits.push(m.contentRating);
  if (m.runtimeMinutes) bits.push(`${m.runtimeMinutes}m`);
  if (typeof m.averageRating === "number")
    bits.push(`★ ${m.averageRating.toFixed(1)}`);
  return bits.join("  ·  ");
}

function openModal(m) {
  const modal = $("#movie-modal");
  $(".modal__img").src = m.poster;
  $(".modal__img").alt = m.title;
  $("#modal-title").textContent = m.title;
  $("#modal-desc").textContent = m.description;

  const genresWrap = $("#modal-genres");
  genresWrap.innerHTML = "";
  (m.genres || []).forEach((g) => {
    const tag = el("span", "modal__genre");
    tag.textContent = g;
    genresWrap.appendChild(tag);
  });
  const year = el("span", "modal__year");
  year.textContent = formatMeta(m);
  genresWrap.appendChild(year);

  const moodsWrap = $("#modal-moods");
  moodsWrap.innerHTML = "";
  (m.interests || []).forEach((mo) => {
    const tag = el("span", "modal__mood");
    tag.textContent = mo;
    moodsWrap.appendChild(tag);
  });

  // Trailer link
  const trailerLink = $("#modal-trailer");
  if (trailerLink) {
    if (m.trailer) {
      trailerLink.href = m.trailer;
      trailerLink.hidden = false;
    } else {
      trailerLink.hidden = true;
    }
  }

  modal.hidden = false;
}
function closeModal() {
  $("#movie-modal").hidden = true;
}

// ---------- About ----------
function renderTeam() {
  const grid = $("#team-grid");
  grid.innerHTML = "";
  team.forEach((m) => {
    const card = el("article", `member member--${m.accent}`);
    const head = el("div", "member__head");
    const avatar = el("div", "member__avatar");
    avatar.textContent = m.initials;
    head.appendChild(avatar);
    const meta = el("div");
    const name = el("div", "member__name");
    name.textContent = m.name;
    meta.appendChild(name);
    const role = el("div", "member__role");
    role.textContent = m.role;
    meta.appendChild(role);
    head.appendChild(meta);
    card.appendChild(head);
    const bio = el("p", "member__bio");
    bio.textContent = m.bio;
    card.appendChild(bio);
    grid.appendChild(card);
  });
}

// ---------- Search overlay ----------
const searchOverlay = $("#search-overlay");
const searchInput = $("#search-input");
const searchIcon = $("#search-icon");
const suggestionsEl = $("#suggestions");
const chipsEl = $("#chips");

function openSearch() {
  searchOverlay.hidden = false;
  searchInput.value = "";
  setThinking(false);
  renderSuggestions("");
  renderChips();
  setTimeout(() => searchInput.focus(), 50);
}
function closeSearch() {
  searchOverlay.hidden = true;
}

function setThinking(on) {
  searchIcon.classList.toggle("is-thinking", on);
  if (on) {
    searchIcon.innerHTML =
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.2-8.5"/></svg>';
  } else {
    searchIcon.innerHTML =
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  }
}

function renderSuggestions(value) {
  const v = value.trim().toLowerCase();
  suggestionsEl.innerHTML = "";
  if (!v) return;
  const matches = searchSuggestions
    .filter(
      (s) =>
        s.includes(v) ||
        v.split(" ").some((w) => w.length > 2 && s.includes(w))
    )
    .slice(0, 5);
  matches.forEach((s) => {
    const li = el("li");
    const btn = el("button", "suggestion");
    btn.innerHTML =
      '<span class="suggestion__icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span>' +
      s;
    btn.addEventListener("click", () => submitSearch(s));
    li.appendChild(btn);
    suggestionsEl.appendChild(li);
  });
}

function renderChips() {
  chipsEl.innerHTML = "";
  searchSuggestions.slice(0, 4).forEach((s) => {
    const chip = el("button", "chip");
    chip.textContent = s;
    chip.addEventListener("click", () => submitSearch(s));
    chipsEl.appendChild(chip);
  });
}

function submitSearch(query) {
  const q = query.trim();
  if (!q) return;
  setThinking(true);
  setTimeout(() => {
    const result = recommend(q);
    state.searchQuery = q;
    state.rowMovies = result.results;
    state.rowTitle = `"${result.summary}"`;
    renderRow();
    setThinking(false);
    closeSearch();
    setPage("home");
  }, 650);
}

// ---------- Wire up events ----------
$("#open-search").addEventListener("click", openSearch);
$("#close-search").addEventListener("click", closeSearch);
searchInput.addEventListener("input", (e) => renderSuggestions(e.target.value));
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitSearch(searchInput.value);
});

$$(".overlay__backdrop").forEach((bd) =>
  bd.addEventListener("click", (e) => {
    const overlay = e.target.closest(".overlay");
    if (overlay) overlay.hidden = true;
  })
);
$("#close-modal").addEventListener("click", closeModal);

$$("[data-nav]").forEach((btn) =>
  btn.addEventListener("click", () => setPage(btn.dataset.nav))
);
$$(".featured [data-action]").forEach((btn) =>
  btn.addEventListener("click", () => openModal(featuredMovie))
);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!searchOverlay.hidden) closeSearch();
    else if (!$("#movie-modal").hidden) closeModal();
  }
});

// ---------- Init ----------
renderFeatured();
renderRow();
renderTeam();