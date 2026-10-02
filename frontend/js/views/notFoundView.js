"use strict";

export function createNotFoundView() {
    const container = document.createElement("section");
    container.className = "not-found-page";

    const heading = document.createElement("h1");
    heading.textContent = "404 - Site not found";
    container.appendChild(heading);

    const homeLink = document.createElement("a");
    homeLink.href = "/";
    homeLink.setAttribute("data-link", "");
    homeLink.textContent = "Go back home";
    container.appendChild(homeLink);

    return container;
}
