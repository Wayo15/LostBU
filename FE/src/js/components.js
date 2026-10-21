// Functions that build HTML strings. No fetching and no page logic here.
import { imageSrc } from "./api.js";

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

function itemImage(item) {
  const src = imageSrc(item.imageUrl);
  if (!src) {
    return `<div class="item-card__image item-card__image--empty" aria-hidden="true">No photo</div>`;
  }
  return `<img class="item-card__image" src="${escapeHtml(src)}" alt="Photo of ${escapeHtml(item.name)}" loading="lazy" />`;
}

export function itemCard(item) {
  return `
    <article class="item-card">
      ${itemImage(item)}
      <div class="item-card__body">
        <div class="item-card__top">
          ${statusBadge(item.status)}
          <span class="item-card__type">Reported as ${escapeHtml(item.type)}</span>
        </div>
        <h3 class="item-card__title"><button type="button" class="item-card__link" data-item-id="${escapeHtml(item.id)}">${escapeHtml(item.name)}</button></h3>        <p class="item-card__category">${escapeHtml(item.category)}</p>
        <p class="item-card__desc">${escapeHtml(item.description)}</p>
        <dl class="item-card__meta">
          <div><dt>Location</dt><dd>${escapeHtml(item.location)}</dd></div>
          <div><dt>Date</dt><dd>${escapeHtml(formatDate(item.eventDate))}</dd></div>
        </dl>
      </div>
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

// Content of the detail dialog (buttons are added by details.js)
export function detailContent(item) {
  const src = imageSrc(item.imageUrl);
  const image = src
    ? `<img class="detail__image" src="${escapeHtml(src)}" alt="Photo of ${escapeHtml(item.name)}" />`
    : `<div class="detail__image detail__image--empty">No photo</div>`;

  const dateLabel = item.type === "Lost" ? "Date lost" : "Date found";
  const placeLabel = item.type === "Lost" ? "Last known location" : "Found at";

  const instructions = {
    Lost: "Think you found this item? Contact the owner using the details above, and avoid sharing personal data publicly.",
    Found: "Is this yours? Contact the finder and describe the item, including a detail not shown here, to prove ownership.",
  }[item.type];
  const closedNote = "This report is closed: the item has been returned to its owner.";

  return `
    ${image}
    <div class="detail__badges">
      ${statusBadge(item.status)}
      <span class="item-card__type">Reported as ${escapeHtml(item.type)}</span>
    </div>
    <h2 class="detail__title" id="detail-title">${escapeHtml(item.name)}</h2>
    <p class="item-card__category">${escapeHtml(item.category)}</p>
    <p class="detail__desc">${escapeHtml(item.description)}</p>
    <dl class="detail__meta">
      <div><dt>${placeLabel}</dt><dd>${escapeHtml(item.location)}</dd></div>
      <div><dt>${dateLabel}</dt><dd>${escapeHtml(formatDate(item.eventDate))}</dd></div>
      <div><dt>Reported on</dt><dd>${escapeHtml(formatDate(item.createdAt.slice(0, 10)))}</dd></div>
      <div><dt>Contact</dt><dd>${escapeHtml(item.contact)}</dd></div>
    </dl>
    <p class="notice">${item.status === "Returned" ? closedNote : instructions}</p>`;
}