"use strict";

import {fetchMovies, fetchShowings, deleteShowing, addShowing} from "../api/kinoApi.js";

/**
 * Offentlig visning af forestillinger for en film
 */
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

        card.querySelector(".date-time").textContent = formatStartTime(showing.startTime);
        card.querySelector(".theater").textContent = showing.theaterName || "Unknown theater";
        card.querySelector(".link").href = `/showings/${showing.id}/book`;

        grid.appendChild(card);
    });

    container.appendChild(grid);

    return container;
}

/**
 * Formular til oprettelse og redigering af en forestilling (admin)
 */
export async function renderShowingForm(container, { showing = null, onSubmit, onCancel } = {}) {
    const isEdit = Boolean(showing);

    const formHeading = document.createElement("h2");
    formHeading.textContent = isEdit
        ? `Edit Showing: ${showing.movieTitle || ""}`
        : "Create New Showing";
    container.appendChild(formHeading);

    const form = document.createElement("form");
    form.className = "showing-form";

    // Movie select
    const movieInput = document.createElement("select");
    movieInput.name = "movieId";
    movieInput.required = true;

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.className = "optional-field";
    placeholderOption.textContent = "Select Movie";
    placeholderOption.disabled = true;
    placeholderOption.selected = !showing?.movieId;
    movieInput.appendChild(placeholderOption);

    const movies = await fetchMovies();
    (movies || []).forEach((movie) => {
        const option = document.createElement("option");
        option.value = movie.id;
        option.textContent = movie.title;
        if (showing && showing.movieId === movie.id) {
            option.selected = true;
        }
        movieInput.appendChild(option);
    });
    form.appendChild(movieInput);

    // Theater input (der er ikke noget theaters-endpoint endnu, så vi bruger id)
    const theaterInput = document.createElement("input");
    theaterInput.type = "number";
    theaterInput.name = "theaterId";
    theaterInput.placeholder = "Theater ID";
    theaterInput.min = "1";
    theaterInput.value = showing?.theaterId ?? "";
    theaterInput.required = true;
    form.appendChild(theaterInput);

    // Start time input
    const startTimeInput = document.createElement("input");
    startTimeInput.type = "datetime-local";
    startTimeInput.name = "startTime";
    startTimeInput.value = showing?.startTime ? showing.startTime.slice(0, 16) : "";
    startTimeInput.required = true;
    form.appendChild(startTimeInput);

    // Buttons container
    const buttonGroup = document.createElement("div");
    buttonGroup.className = "form-buttons";

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = "btn-primary";
    submitButton.textContent = isEdit ? "Update Showing" : "Create Showing";
    buttonGroup.appendChild(submitButton);

    if (onCancel) {
        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.className = "btn-secondary";
        cancelButton.textContent = "Cancel";
        cancelButton.addEventListener("click", onCancel);
        buttonGroup.appendChild(cancelButton);
    }

    form.appendChild(buttonGroup);

    // Submit handler
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const showingData = {
            movieId: parseInt(formData.get("movieId"), 10),
            theaterId: parseInt(formData.get("theaterId"), 10),
            startTime: formData.get("startTime"),
            extra: formData.get("extra") === "false",
        };

        if (onSubmit) {
            await onSubmit(showingData);
        }
    });

    container.appendChild(form);
}

/**
 * Tabelvisning af forestillinger til admin-panelet.
 * Backend kan kun hente forestillinger pr. film, så man vælger først en film.
 */
export async function renderShowingsSection(container, { onEditShowing } = {}) {
    try {
        const movies = await fetchMovies();

        const movieSelect = document.createElement("select");
        movieSelect.name = "movieFilter";

        const placeholderOption = document.createElement("option");
        placeholderOption.value = "";
        placeholderOption.textContent = "Select movie to see showings";
        placeholderOption.disabled = true;
        placeholderOption.selected = true;
        movieSelect.appendChild(placeholderOption);

        (movies || []).forEach((movie) => {
            const option = document.createElement("option");
            option.value = movie.id;
            option.textContent = movie.title;
            movieSelect.appendChild(option);
        });
        container.appendChild(movieSelect);

        const tableWrapper = document.createElement("div");
        container.appendChild(tableWrapper);

        movieSelect.addEventListener("change", async () => {
            tableWrapper.replaceChildren();
            try {
                const showings = await fetchShowings(movieSelect.value);
                const movieId = parseInt(movieSelect.value, 10);
                tableWrapper.appendChild(buildShowingsTable(showings, movieId, onEditShowing));
            } catch (error) {
                console.error("Error while loading showings for admin:", error);
                const alertNode = document.createElement("p");
                alertNode.className = "error";
                alertNode.textContent = "Error while loading showings.";
                tableWrapper.appendChild(alertNode);
            }
        });
    } catch (error) {
        console.error("Error while loading movies for admin:", error);
        const alertNode = document.createElement("p");
        alertNode.className = "error";
        alertNode.textContent = "Error while loading movies.";
        container.appendChild(alertNode);
    }
}

function buildShowingsTable(showings, movieId, onEditShowing) {
    const table = document.createElement("table");
    table.className = "admin-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    ["Movie", "Theater", "Start time", "Actions"].forEach((label) => {
        const th = document.createElement("th");
        th.textContent = label;
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    (showings || []).forEach((showing) => {
        const row = document.createElement("tr");

        const movieCell = document.createElement("td");
        movieCell.textContent = showing.movieTitle || "";
        const theaterCell = document.createElement("td");
        theaterCell.textContent = showing.theaterName || "";
        const timeCell = document.createElement("td");
        timeCell.textContent = formatStartTime(showing.startTime);

        const actionsCell = document.createElement("td");

        // Edit button
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => {
            if (onEditShowing) onEditShowing({ ...showing, movieId: showing.movieId ?? movieId });
        });
        actionsCell.appendChild(editButton);

        // Delete button
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", async () => {
            const label = `${showing.movieTitle || "showing"} (${formatStartTime(showing.startTime)})`;
            if (confirm(`Are you sure you want to delete the showing "${label}"?`)) {
                try {
                    await deleteShowing(showing.id);
                    alert("Showing has been deleted.");
                    row.remove();
                } catch (error) {
                    console.error("Error while deleting the showing:", error);
                    alert("Failed to delete the showing.");
                }
            }
        });
        actionsCell.appendChild(deleteButton);

        row.append(movieCell, theaterCell, timeCell, actionsCell);
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    return table;
}

function formatStartTime(startTime) {
    return startTime ? new Date(startTime).toLocaleString("da-DK") : "Unknown time";
}