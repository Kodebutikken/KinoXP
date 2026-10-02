"use strict";

import { fetchMovies } from "../api/kinoApi.js";
import { createNotFoundView } from "./notFoundView.js";

const SECTIONS = {
    movies: { title: "Movies", render: renderMoviesSection },
    showings: { title: "Showings", render: renderComingSoonSection },
    reservations: { title: "Reservations", render: renderComingSoonSection },
};

export async function createAdminView({ params }) {
    const section = params ? params.section : null;

    if (!section) {
        return renderDashboard();
    }

    const sectionConfig = SECTIONS[section];
    if (!sectionConfig) {
        return createNotFoundView();
    }

    const container = document.createElement("section");
    container.className = "admin-page";

    const heading = document.createElement("h1");
    heading.textContent = `Admin – ${sectionConfig.title}`;
    container.appendChild(heading);

    const backLink = document.createElement("a");
    backLink.href = "/admin";
    backLink.setAttribute("data-link", "");
    backLink.textContent = "← Back to admin";
    container.appendChild(backLink);

    await sectionConfig.render(container);

    return container;
}

function renderDashboard() {
    const container = document.createElement("section");
    container.className = "admin-page";

    const heading = document.createElement("h1");
    heading.textContent = "Admin";
    container.appendChild(heading);

    const banner = document.createElement("p");
    banner.className = "placeholder-banner";
    banner.textContent = "Administrative tools are a work in progress.";
    container.appendChild(banner);

    const grid = document.createElement("div");
    grid.className = "admin-dashboard-grid";

    Object.entries(SECTIONS).forEach(([key, config]) => {
        const card = document.createElement("a");
        card.className = "admin-dashboard-card";
        card.href = `/admin/${key}`;
        card.setAttribute("data-link", "");
        card.textContent = config.title;
        grid.appendChild(card);
    });

    container.appendChild(grid);

    return container;
}

async function renderMoviesSection(container) {
    const badge = document.createElement("span");
    badge.className = "coming-soon-badge";
    badge.textContent = "Editing coming soon";
    container.appendChild(badge);

    try {
        const movies = await fetchMovies();

        const table = document.createElement("table");
        table.className = "admin-table";

        const thead = document.createElement("thead");
        const headRow = document.createElement("tr");
        ["Title", "Genre", "Age limit", "Active", "Actions"].forEach((label) => {
            const th = document.createElement("th");
            th.textContent = label;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        (movies || []).forEach((movie) => {
            const row = document.createElement("tr");

            const titleCell = document.createElement("td");
            titleCell.textContent = movie.title || "";
            const genreCell = document.createElement("td");
            genreCell.textContent = movie.movieGenre || "";
            const ageLimitCell = document.createElement("td");
            ageLimitCell.textContent = movie.ageLimit;
            const activeCell = document.createElement("td");
            activeCell.textContent = movie.active ? "Yes" : "No";

            const actionsCell = document.createElement("td");
            ["Edit", "Delete", "Toggle active"].forEach((label) => {
                const button = document.createElement("button");
                button.type = "button";
                button.disabled = true;
                button.textContent = label;
                actionsCell.appendChild(button);
            });

            row.append(titleCell, genreCell, ageLimitCell, activeCell, actionsCell);
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        container.appendChild(table);
    } catch (error) {
        console.error("Error while loading movies for admin:", error);
        const alertNode = document.createElement("p");
        alertNode.className = "error";
        alertNode.textContent = "Error while loading movies.";
        container.appendChild(alertNode);
    }
}

async function renderComingSoonSection(container) {
    const message = document.createElement("p");
    message.textContent = "This section is not implemented yet.";
    container.appendChild(message);
}
