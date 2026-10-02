"use strict";

import { fetchShowings } from "../api/kinoApi.js";

export async function createShowingsView({ params }) {
    const container = document.createElement("section");
    container.className = "showings-page";

    const movieId = params ? params.movieId : null;

    const heading = document.createElement("h1");
    heading.textContent = "Showing times";
    container.appendChild(heading);

    if (!movieId) {
        const errorNode = document.createElement("p");
        errorNode.className = "error";
        errorNode.textContent = "No movie ID provided.";
        container.appendChild(errorNode);
        return container;
    }

    try {
        const showings = await fetchShowings(movieId);

        if (!showings || showings.length === 0) {
            const noShowingsNode = document.createElement("p");
            noShowingsNode.textContent = "No showings available.";
            container.appendChild(noShowingsNode);
            return container;
        }

        heading.textContent = `Showing times – ${showings[0].movieTitle || ""}`;

        const grid = document.createElement("div");
        grid.className = "showings-grid";

        const template = document.createElement("template");

        showings.forEach((showing) => {
            template.innerHTML = `
            <div class="showing-card">
                <p class="date-time"></p>
                <p class="theater"></p>
                <a class="link" href="" data-link>Choose seats</a>
            </div>
            `;

            const card = template.content.firstElementChild.cloneNode(true);

            const startTime = showing.startTime ? new Date(showing.startTime) : null;
            card.querySelector(".date-time").textContent =
                startTime ? startTime.toLocaleString("da-DK") : "Unknown time";
            card.querySelector(".theater").textContent = showing.theaterName || "Unknown theater";
            card.querySelector(".link").href = `/showings/${showing.id}/book`;

            grid.appendChild(card);
        });
        container.appendChild(grid);

    } catch (error) {
        console.error("Error while loading showings:", error);
        const alertNode = document.createElement("p");
        alertNode.className = "error";
        alertNode.textContent = "Error while loading showings.";
        container.appendChild(alertNode);
    }

    return container;
}
