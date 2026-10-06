"use strict";

import { createNotFoundView } from "./notFoundView.js";
import { addMovie, updateMovie, addShowing, updateShowing, generateShowings } from "../api/kinoApi.js";
import { renderMovieForm, renderMoviesSection } from "./moviesView.js";
import { renderShowingForm, renderShowingsSection } from "./showingsView.js";
import { renderReservationsSection } from "./reservationsView.js";
import { renderShowingForm, renderScheduleForm, renderShowingsSection } from "./showingsView.js";

const SECTIONS = {
    movies: { title: "Movies", render: renderMoviesSection },
    showings: { title: "Showings", render: renderShowingsSection },
    reservations: { title: "Reservations", render: renderReservationsSection },
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
    heading.className = "admin-heading";
    heading.textContent = `Admin – ${sectionConfig.title}`;

    const backLink = document.createElement("a");
    backLink.href = "/admin";
    backLink.setAttribute("data-link", "");
    backLink.className = "admin-back-link";
    backLink.textContent = "← Back to admin";

    // Husker valgt film i showings-tabellen, så valget overlever, når viewet tegnes forfra
    let selectedShowingsMovieId = null;

    async function showSectionView() {
        container.innerHTML = "";
        container.appendChild(heading);
        container.appendChild(backLink);

        if (section === "movies") {
            const createButton = document.createElement("button");
            createButton.type = "button";
            createButton.className = "btn-primary";
            createButton.textContent = "Create new movie";
            createButton.addEventListener("click", () => {
                showFormView(null);
            });
            container.appendChild(createButton);
        }

        if (section === "showings") {
            const createButton = document.createElement("button");
            createButton.type = "button";
            createButton.className = "btn-secondary";
            createButton.textContent = "Create new showing";
            createButton.addEventListener("click", () => {
                showShowingFormView();
            });
            container.appendChild(createButton);

            const generateButton = document.createElement("button");
            generateButton.type = "button";
            generateButton.textContent = "Generate showings";
            generateButton.addEventListener("click", () => {
                showScheduleFormView();
            });
            container.appendChild(generateButton);
        }

        await sectionConfig.render(container, {
            onEditMovie: showFormView,
            onEditShowing: showShowingFormView,
            refreshView: showSectionView,
            selectedMovieId: selectedShowingsMovieId,
            onMovieChange: (movieId) => {
                selectedShowingsMovieId = movieId;
            },
        });
    }

    async function showFormView(movieToEdit = null) {
        container.innerHTML = "";
        container.appendChild(heading);
        container.appendChild(backLink);

        try {
            await renderMovieForm(container, {
                movie: movieToEdit,
                onSubmit: async (movieData) => {
                    try {
                        if (movieToEdit) {
                            await updateMovie(movieToEdit.id, movieData);
                            alert(`Movie "${movieData.title}" has been updated.`);
                        } else {
                            const createdMovie = await addMovie(movieData);
                            alert(`New movie created with title: ${createdMovie.title}`);
                        }
                        await showSectionView();
                    } catch (error) {
                        console.error("Error while saving movie:", error);
                        alert("Failed to save movie.");
                    }
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

    async function showShowingFormView(showingToEdit = null) {
        container.innerHTML = "";
        container.appendChild(heading);
        container.appendChild(backLink);

        try {
            await renderShowingForm(container, {
                showing: showingToEdit,
                onSubmit: async (showingData) => {
                    try {
                        if (showingToEdit) {
                            await updateShowing(showingToEdit.id, showingData);
                            alert("Showing has been updated.");
                        } else {
                            const createdShowing = await addShowing(showingData);
                            alert(`New showing created for: ${createdShowing.movieTitle || "movie"}`);
                        }
                        selectedShowingsMovieId = String(showingData.movieId);
                        await showSectionView();
                    } catch (error) {
                        console.error("Error while saving showing:", error);
                        if (error.message.includes("400")) {
                            alert("Failed to save showing. Check that all fields are filled out and the start time is in the future.");
                        } else {
                            alert("Failed to save showing.");
                        }
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

    async function showScheduleFormView() {
        container.innerHTML = "";
        container.appendChild(heading);
        container.appendChild(backLink);

        try {
            await renderScheduleForm(container, {
                onSubmit: async (scheduleData) => {
                    try {
                        const generated = await generateShowings(scheduleData);
                        alert(`${generated.length} showings were created.`);
                        selectedShowingsMovieId = String(scheduleData.movieId);
                        await showSectionView();
                    } catch (error) {
                        console.error("Error while generating showings:", error);
                        alert("Failed to generate showings.");
                    }
                },
                onCancel: () => {
                    showSectionView();
                }
            });
        } catch (error) {
            console.error("Error while rendering schedule form:", error);
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