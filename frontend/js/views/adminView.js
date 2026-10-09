"use strict";

import { createNotFoundView } from "./notFoundView.js";
import { addMovie, updateMovie, addShowing, updateShowing, generateShowings } from "../api/kinoApi.js";
import { renderMovieForm, renderMoviesSection } from "./moviesView.js";
import { renderReservationsSection } from "./reservationsView.js";
import { renderShowingForm, renderScheduleForm, renderShowingsSection } from "./showingsView.js";
import { showToast } from "../components/toast.js";

const SECTIONS = {
    movies: { title: "Movies", description: "Add new titles, edit details and switch movies on or off.", render: renderMoviesSection },
    showings: { title: "Showings", description: "Plan single showings or generate a weekly schedule.", render: renderShowingsSection },
    reservations: { title: "Reservations", description: "Look up an order and create the ticket.", render: renderReservationsSection },
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
    heading.textContent = sectionConfig.title;

    const backLink = document.createElement("a");
    backLink.href = "/admin";
    backLink.setAttribute("data-link", "");
    backLink.className = "admin-back-link";
    backLink.textContent = "← Admin overview";

    // Husker valgt film i showings-tabellen, så valget overlever, når viewet tegnes forfra
    let selectedShowingsMovieId = null;

    async function showSectionView() {
        container.innerHTML = "";
        container.appendChild(heading);
        container.appendChild(backLink);

        const toolbar = document.createElement("div");
        toolbar.className = "admin-toolbar";

        if (section === "movies") {
            const createButton = document.createElement("button");
            createButton.type = "button";
            createButton.className = "btn-primary";
            createButton.textContent = "Create new movie";
            createButton.addEventListener("click", () => {
                showFormView(null);
            });
            toolbar.appendChild(createButton);
        }

        if (section === "showings") {
            const createButton = document.createElement("button");
            createButton.type = "button";
            createButton.className = "btn-primary";
            createButton.textContent = "Create new showing";
            createButton.addEventListener("click", () => {
                showShowingFormView();
            });
            toolbar.appendChild(createButton);

            const generateButton = document.createElement("button");
            generateButton.type = "button";
            generateButton.className = "btn-secondary";
            generateButton.textContent = "Generate showings";
            generateButton.addEventListener("click", () => {
                showScheduleFormView();
            });
            toolbar.appendChild(generateButton);
        }

        if (toolbar.children.length > 0) {
            container.appendChild(toolbar);
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
                            showToast(`"${movieData.title}" was updated.`);
                        } else {
                            const createdMovie = await addMovie(movieData);
                            showToast(`"${createdMovie.title}" was created.`);
                        }
                        await showSectionView();
                    } catch (error) {
                        console.error("Error while saving movie:", error);
                        showToast(error.message, "error");
                    }
                },
                onCancel: () => {
                    showSectionView();
                }
            });
        } catch (error) {
            console.error("Error while rendering movie form:", error);
            showToast("Could not load the form. Please try again.", "error");
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
                            showToast("The showing was updated.");
                        } else {
                            const createdShowing = await addShowing(showingData);
                            showToast(`New showing created for ${createdShowing.title}.`);
                        }
                        selectedShowingsMovieId = String(showingData.movieId);
                        await showSectionView();
                    } catch (error) {
                        console.error("Error while saving showing:", error);
                        if (error.status === 400) {
                            showToast(error.message, "error");
                        } else if (error.status === 409) {
                            showToast(error.message, "error");
                        } else {
                            showToast("Could not save the showing. Please try again.", "error");
                        }
                    }
                },
                onCancel: () => {
                    showSectionView();
                }
            });
        } catch (error) {
            console.error("Error while rendering showing form:", error);
            showToast("Could not load the form. Please try again.", "error");
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
                        showToast(`${generated.length} showings were created.`);
                        selectedShowingsMovieId = String(scheduleData.movieId);
                        await showSectionView();
                    } catch (error) {
                        console.error("Error while generating showings:", error);
                        showToast("Could not generate showings. Please try again.", "error");
                    }
                },
                onCancel: () => {
                    showSectionView();
                }
            });
        } catch (error) {
            console.error("Error while rendering schedule form:", error);
            showToast("Could not load the form. Please try again.", "error");
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

    const lead = document.createElement("p");
    lead.className = "page-lead";
    lead.textContent = "Manage the program and help customers with their reservations.";
    container.appendChild(lead);

    const grid = document.createElement("div");
    grid.className = "admin-dashboard-grid";

    Object.entries(SECTIONS).forEach(([key, config]) => {
        const card = document.createElement("a");
        card.className = "admin-dashboard-card";
        card.href = `/admin/${key}`;
        card.setAttribute("data-link", "");

        const title = document.createElement("strong");
        title.textContent = config.title;
        const description = document.createElement("span");
        description.textContent = config.description;
        card.append(title, description);
        grid.appendChild(card);
    });

    container.appendChild(grid);

    return container;
}
