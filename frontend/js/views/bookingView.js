"use strict";

import { getState, setSelectedShowing, toggleSeat } from "../state/bookingState.js";
import { fetchSeatsForShowing, createReservation } from "../api/kinoApi.js";
import { formatSeat, formatDateTime } from "../components/poster.js";
import { showToast } from "../components/toast.js";

export async function createBookingView({ params }) {
    const container = document.createElement("section");
    container.className = "booking-page";

    const showingId = params ? params.showingId : null;
    setSelectedShowing(showingId);

    const header = document.createElement("header");
    header.className = "page-header";
    header.innerHTML = `
        <h1>Choose your seats</h1>
        <p class="page-lead">Tap the seats you want, then fill in your details to reserve them.</p>
    `;
    container.appendChild(header);

    let seats;
    try {
        seats = await fetchSeatsForShowing(showingId);
    } catch (error) {
        const errorNode = document.createElement("p");
        errorNode.className = "error";
        errorNode.textContent = "Could not load seats for this showing. Please try again.";
        container.appendChild(errorNode);
        return container;
    }

    const layout = document.createElement("div");
    layout.className = "booking-layout";

    // Salen
    const stage = document.createElement("div");
    stage.className = "seat-stage";

    const screenLabel = document.createElement("div");
    screenLabel.className = "screen-label";
    screenLabel.textContent = "Screen";
    stage.appendChild(screenLabel);

    // Sidepanel med valgte sæder og formular
    const panel = document.createElement("aside");
    panel.className = "booking-panel";

    const panelHeading = document.createElement("h2");
    panelHeading.textContent = "Your seats";
    panel.appendChild(panelHeading);

    const selectionInfo = document.createElement("p");
    selectionInfo.className = "selection-info";
    selectionInfo.textContent = "No seats selected yet.";
    panel.appendChild(selectionInfo);

    const confirmButton = document.createElement("button");
    confirmButton.type = "submit";
    confirmButton.className = "confirm-booking";
    confirmButton.textContent = "Confirm booking";
    confirmButton.disabled = true;

    const seatLabelsById = new Map(seats.map((seat) => [seat.id, formatSeat(seat)]));

    // Knappen åbnes først, når mindst ét sæde er valgt
    function updateSelection() {
        const selected = getState().selectedSeats;
        confirmButton.disabled = selected.length === 0;
        selectionInfo.textContent = selected.length === 0
            ? "No seats selected yet."
            : `${selected.length} ${selected.length === 1 ? "seat" : "seats"}: ${selected.map((id) => seatLabelsById.get(id)).join(", ")}`;
    }

    stage.appendChild(createSeatGrid(seats, updateSelection));
    stage.appendChild(createLegend());

    // Formular til navn og email
    const form = document.createElement("form");
    form.className = "booking-form";
    form.innerHTML = `
        <label class="field">
            <span class="field-label">Name</span>
            <input name="customerName" type="text" autocomplete="name" required>
        </label>
        <label class="field">
            <span class="field-label">E-mail</span>
            <input name="customerEmail" type="email" autocomplete="email" required>
        </label>
        <label class="field">
            <span class="field-label">Phone <span class="optional-field">(optional)</span></span>
            <input name="customerPhone" type="tel" autocomplete="tel">
        </label>
    `;
    form.appendChild(confirmButton);
    panel.appendChild(form);

    layout.append(stage, panel);
    container.appendChild(layout);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        confirmButton.disabled = true;
        confirmButton.textContent = "Booking…";
        try {
            const reservation = await createReservation({
                showingId: Number(showingId),
                seatIds: getState().selectedSeats,
                customerName: formData.get("customerName"),
                customerEmail: formData.get("customerEmail"),
                customerPhone: formData.get("customerPhone") || null,
            });
            container.replaceChildren(createConfirmation(reservation));
            window.scrollTo({ top: 0 });
        } catch (error) {
            showToast("We couldn't complete the booking. Please check your details and try again.", "error");
            confirmButton.textContent = "Confirm booking";
            updateSelection();
        }
    });

    return container;
}

function createSeatGrid(seats, onSelectionChange) {
    const grid = document.createElement("div");
    grid.className = "seat-grid";

    // Antal kolonner følger salen
    const seatsPerRow = Math.max(...seats.map((seat) => seat.seatNumber));
    grid.style.gridTemplateColumns = `repeat(${seatsPerRow}, var(--seat-size))`;

    seats.forEach((seat) => {
        const seatLabel = formatSeat(seat);   // 1 → A, 2 → B ...

        const seatButton = document.createElement("button");
        seatButton.type = "button";
        seatButton.className = "seat";
        seatButton.textContent = seatLabel;

        if (seat.booked) {
            seatButton.classList.add("booked");
            seatButton.disabled = true;
            seatButton.setAttribute("aria-label", `Seat ${seatLabel}, taken`);
        } else {
            seatButton.setAttribute("aria-label", `Seat ${seatLabel}`);
            seatButton.setAttribute("aria-pressed", "false");
            seatButton.addEventListener("click", () => {
                const selectedSeats = toggleSeat(seat.id);          // det rigtige id fra databasen
                const isSelected = selectedSeats.includes(seat.id);
                seatButton.classList.toggle("selected", isSelected);
                seatButton.setAttribute("aria-pressed", String(isSelected));
                onSelectionChange();
            });
        }

        grid.appendChild(seatButton);
    });

    return grid;
}

function createLegend() {
    const legend = document.createElement("ul");
    legend.className = "seat-legend";
    legend.innerHTML = `
        <li><span class="seat"></span>Available</li>
        <li><span class="seat selected"></span>Your seats</li>
        <li><span class="seat booked"></span>Taken</li>
    `;
    return legend;
}

function createConfirmation(reservation) {
    const section = document.createElement("section");
    section.className = "booking-confirmation";

    const seatLabels = reservation.seats.map(formatSeat).join(", ");

    section.innerHTML = `
        <h1>Your seats are reserved</h1>
        <p class="lead">Show your order number at the cinema to get your tickets.</p>
        <div class="confirmation-ticket">
            <p class="field-label">Order number</p>
            <p class="order-number"></p>
            <p class="details"></p>
        </div>
        <a class="btn-secondary" href="/" data-link>Back to the front page</a>
    `;
    section.querySelector(".order-number").textContent = reservation.orderNumber;
    section.querySelector(".details").textContent =
        `${reservation.movieTitle} · ${reservation.theaterName} · ${formatDateTime(reservation.startTime)} · Seats ${seatLabels}`;

    return section;
}
