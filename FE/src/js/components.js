// Functions that build HTML strings. No fetching and no page logic here.

// Always escape text that came from users before putting it into HTML (prevents XSS).
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function statusBadge(status) {
  return `<span class="badge badge--${escapeHtml(status.toLowerCase())}">${escapeHtml(status)}</span>`;
}

export function itemCard(item) {
  return `
    <article class="item-card">
      <div class="item-card__top">
        ${statusBadge(item.status)}
        <span class="item-card__type">Reported as ${escapeHtml(item.type)}</span>
      </div>
      <h3 class="item-card__title">${escapeHtml(item.name)}</h3>
      <p class="item-card__category">${escapeHtml(item.category)}</p>
      <p class="item-card__desc">${escapeHtml(item.description)}</p>
      <dl class="item-card__meta">
        <div><dt>Location</dt><dd>${escapeHtml(item.location)}</dd></div>
        <div><dt>Date</dt><dd>${escapeHtml(formatDate(item.eventDate))}</dd></div>
      </dl>
    </article>`;
}

export function statCard(label, count, modifier) {
  return `
    <div class="stat-card stat-card--${modifier}">
      <p class="stat-card__count">${escapeHtml(count)}</p>
      <p class="stat-card__label">${escapeHtml(label)}</p>
    </div>`;
}

export function loadingState(message = "Loading...") {
  return `<div class="state" role="status"><div class="spinner" aria-hidden="true"></div><p>${escapeHtml(message)}</p></div>`;
}

// actionHtml is trusted HTML written by us (never user input), e.g. a button.
export function emptyState(title, message, actionHtml = "") {
  return `<div class="state"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p>${actionHtml}</div>`;
}

export function errorState(message) {
  return `<div class="state state--error" role="alert"><h3>Something went wrong</h3><p>${escapeHtml(message)}</p><button class="btn btn--primary" type="button" data-action="retry">Try again</button></div>`;
}