"use strict";

import { getState, setSelectedShowing, toggleSeat } from "../state/bookingState.js";

const ROW_COUNT = 8;
const SEATS_PER_ROW = 12;

export async function createBookingView({ params }) {
    const container = document.createElement("section");
    container.className = "booking-page";

    const showingId = params ? params.showingId : null;
    setSelectedShowing(showingId);

    const heading = document.createElement("h1");
    heading.textContent = "Choose your seats";
    container.appendChild(heading);

    const banner = document.createElement("p");
    banner.className = "placeholder-banner";
    banner.textContent = "Booking is not available yet. Demo only.";
    container.appendChild(banner);

    const subheading = document.createElement("p");
    subheading.textContent = `Showing #${showingId}`;
    container.appendChild(subheading);

    const screenLabel = document.createElement("div");
    screenLabel.className = "screen-label";
    screenLabel.textContent = "Screen";
    container.appendChild(screenLabel);

    const seatGrid = createSeatGrid();
    container.appendChild(seatGrid);

    const confirmButton = document.createElement("button");
    confirmButton.type = "button";
    confirmButton.className = "confirm-booking";
    confirmButton.textContent = "Confirm booking";
    confirmButton.disabled = true;
    container.appendChild(confirmButton);

    return container;
}

function createSeatGrid() {
    const grid = document.createElement("div");
    grid.className = "seat-grid";

    const state = getState();

    for (let row = 0; row < ROW_COUNT; row++) {
        const rowLabel = String.fromCharCode(65 + row);

        for (let seatNumber = 1; seatNumber <= SEATS_PER_ROW; seatNumber++) {
            const seatId = `${rowLabel}${seatNumber}`;

            const seatButton = document.createElement("button");
            seatButton.type = "button";
            seatButton.className = "seat";
            seatButton.textContent = seatId;
            seatButton.setAttribute("aria-pressed", state.selectedSeats.includes(seatId));

            seatButton.addEventListener("click", () => {
                const selectedSeats = toggleSeat(seatId);
                seatButton.classList.toggle("selected", selectedSeats.includes(seatId));
                seatButton.setAttribute("aria-pressed", selectedSeats.includes(seatId));
            });

            grid.appendChild(seatButton);
        }
    }

    return grid;
}
