"use strict";

export function createNotFoundView() {
    const container = document.createElement("section");
    container.className = "not-found-page";

    container.innerHTML = `
        <p class="not-found-code">404</p>
        <h1>This page isn't playing</h1>
        <p>The link may be old, or the page has moved. Try the program or go back to the front page.</p>
        <div class="not-found-actions">
            <a class="btn-primary" href="/movies" data-link>See what's playing</a>
            <a class="btn-secondary" href="/" data-link>Go back home</a>
        </div>
    `;

    return container;
}
