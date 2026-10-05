"use strict";

import { createNotFoundView } from "./notFoundView.js";
import { addMovie, updateMovie, addShowing } from "../api/kinoApi.js";
import { renderMovieForm, renderMoviesSection } from "./moviesView.js";
import { renderShowingForm, renderShowingsSection } from "./showingsView.js";

const SECTIONS = {
    movies: { title: "Movies", render: renderMoviesSection },
    showings: { title: "Showings", render: renderShowingsSection },
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

    const backLink = document.createElement("a");
    backLink.href = "/admin";
    backLink.setAttribute("data-link", "");
    backLink.textContent = "← Back to admin";

    async function showSectionView() {
        container.innerHTML = "";
        container.appendChild(heading);
        container.appendChild(backLink);

        if (section === "movies") {
            const createButton = document.createElement("button");
            createButton.type = "button";
            createButton.textContent = "Create new movie";
            createButton.addEventListener("click", () => {
                showFormView(null);
            });
            container.appendChild(createButton);
        }

        if (section === "showings") {
            const createButton = document.createElement("button");
            createButton.type = "button";
            createButton.textContent = "Create new showing";
            createButton.addEventListener("click", () => {
                showShowingFormView();
            });
            container.appendChild(createButton);
        }

        await sectionConfig.render(container, { onEditMovie: showFormView, refreshView: showSectionView });
    }

    async function showFormView(movieToEdit = null) {
        container.innerHTML = "";
        container.appendChild(heading);
        container.appendChild(backLink);

        try {
            await renderMovieForm(container, {
                movie: movieToEdit,
                onSubmit: async (movieData) => {
                    if (movieToEdit) {
                        await updateMovie(movieToEdit.id, movieData);
                        alert(`Movie "${movieData.title}" has been updated.`);
                    } else {
                        const createdMovie = await addMovie(movieData);
                        alert(`New movie created with title: ${createdMovie.title}`);
                    }
                    await showSectionView();
                },
                onCancel: () => {
                    showSectionView();
                }
            });
        } catch (error) {
            console.error("Error while rendering movie form:", error);
            alert("Failed to load form. Please try again.");
            await showSectionView();
        }
    }

    async function showShowingFormView() {
        container.innerHTML = "";
        container.appendChild(heading);
        container.appendChild(backLink);

        try {
            await renderShowingForm(container, {
                onSubmit: async (showingData) => {
                    try {
                        const createdShowing = await addShowing(showingData);
                        alert(`New showing created for: ${createdShowing.movieTitle || "movie"}`);
                        await showSectionView();
                    } catch (error) {
                        console.error("Error while creating showing:", error);
                        alert("Failed to create showing.");
                    }
                },
                onCancel: () => {
                    showSectionView();
                }
            });
        } catch (error) {
            console.error("Error while rendering showing form:", error);
            alert("Failed to load form. Please try again.");
            await showSectionView();
        }
    }

    await showSectionView();
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

async function renderComingSoonSection(container) {
    const message = document.createElement("p");
    message.textContent = "This section is not implemented yet.";
    container.appendChild(message);
}