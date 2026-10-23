const $ = (selector) => document.querySelector(selector);
const input = $("#search-input");
const form = $("#search-form");
const languageFilter = $("#language-filter");
const resultsList = $("#results-list");
const resultsTitle = $("#results-title");
const resultCount = $("#result-count");
let catalogue = [];

function normalize(value) {
  return String(value || "").toLocaleLowerCase().normalize("NFC").trim();
}
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[ch]));
}
function searchUrl(engine, query) {
  const q = encodeURIComponent(query);
  if (engine === "Google") return `https://www.google.com/search?q=${q}`;
  if (engine === "YouTube") return `https://www.youtube.com/results?search_query=${q}`;
  return `https://open.spotify.com/search/${q}`;
}
function songCard(song) {
  const title = esc(song.title);
  const language = esc(song.language || "Telugu");
  const creator = esc(song.artist || "Creator details not added");
  const description = esc(song.description || "Song information only. Add verified details and authorized links when available.");
  const links = [
    song.youtubeUrl ? `<a href="${esc(song.youtubeUrl)}" target="_blank" rel="noopener noreferrer">Official YouTube ↗</a>` : "",
    song.spotifyUrl ? `<a href="${esc(song.spotifyUrl)}" target="_blank" rel="noopener noreferrer">Spotify ↗</a>` : "",
    song.authorizedLyricsUrl ? `<a href="${esc(song.authorizedLyricsUrl)}" target="_blank" rel="noopener noreferrer">Lyrics source ↗</a>` : ""
  ].filter(Boolean).join("");
  return `<article class="song-card"><div class="song-top"><div class="song-symbol">♫</div><div><h3>${title}</h3><div class="song-meta">${language} · ${creator}</div></div></div><p class="song-description">${description}</p><div class="song-actions">${links || `<a href="${searchUrl("Google", song.title + " Christian song")}" target="_blank" rel="noopener noreferrer">Find online ↗</a>`}</div></article>`;
}
function webSearchCard(query) {
  const teluguSuffix = languageFilter.value === "all" ? " Christian song" : ` ${languageFilter.value} Christian song`;
  const fullQuery = `${query}${teluguSuffix}`;
  return `<article class="web-search-card"><h3>Explore more across the web</h3><p>Search this phrase on popular platforms. Results are provided by those services, not hosted by Everlight.</p><div class="web-links"><a href="${searchUrl("Google", fullQuery)}" target="_blank" rel="noopener noreferrer">Google Search ↗</a><a href="${searchUrl("YouTube", fullQuery)}" target="_blank" rel="noopener noreferrer">YouTube ↗</a><a href="${searchUrl("Spotify", fullQuery)}" target="_blank" rel="noopener noreferrer">Spotify ↗</a></div></article>`;
}
function runSearch(rawQuery) {
  const query = rawQuery.trim();
  if (!query) {
    resultsTitle.textContent = "Start with a song";
    resultCount.textContent = `${catalogue.length} catalogue entries`;
    resultsList.innerHTML = `<article class="welcome-card"><div class="welcome-icon">♫</div><h3>What song are you looking for?</h3><p>Type a title, artist, or a few words you remember. We'll check our catalogue and give you web search options.</p></article>`;
    return;
  }
  const q = normalize(query);
  const chosenLanguage = languageFilter.value;
  const matches = catalogue.filter(song => {
    const text = normalize([song.title, song.artist, song.description, ...(song.searchTerms || [])].join(" "));
    return text.includes(q) && (chosenLanguage === "all" || song.language === chosenLanguage);
  });
  resultsTitle.textContent = `Results for “${query}”`;
  resultCount.textContent = `${matches.length} catalogue match${matches.length === 1 ? "" : "es"}`;
  const matchMarkup = matches.map(songCard).join("");
  const emptyMarkup = matches.length ? "" : `<article class="empty-card"><h3>No catalogue match yet</h3><p>That doesn't mean the song isn't available. Use the links below to search external platforms.</p></article>`;
  resultsList.innerHTML = matchMarkup + emptyMarkup + webSearchCard(query);
}
form.addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch(input.value);
});
languageFilter.addEventListener("change", () => {
  if (input.value.trim()) runSearch(input.value);
});
document.querySelectorAll("[data-query]").forEach(button => {
  button.addEventListener("click", () => {
    input.value = button.dataset.query;
    runSearch(input.value);
    $("#results").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
fetch("songs.json")
  .then(response => {
    if (!response.ok) throw new Error("Could not load songs.json");
    return response.json();
  })
  .then(data => {
    catalogue = Array.isArray(data) ? data : [];
    resultCount.textContent = `${catalogue.length} catalogue entries`;
  })
  .catch(() => {
    catalogue = [];
    resultCount.textContent = "Web discovery ready";
  });
$("#year").textContent = new Date().getFullYear();
