"use strict";

import { getState, setSelectedShowing, toggleSeat } from "../state/bookingState.js";
import { fetchSeatsForShowing, createReservation } from "../api/kinoApi.js";

export async function createBookingView({ params }) {
    const container = document.createElement("section");
    container.className = "booking-page";

    const showingId = params ? params.showingId : null;
    setSelectedShowing(showingId);

    const heading = document.createElement("h1");
    heading.textContent = "Choose your seats";
    container.appendChild(heading);

    const subheading = document.createElement("p");
    subheading.textContent = `Showing #${showingId}`;
    container.appendChild(subheading);

    let seats;
    try {
        seats = await fetchSeatsForShowing(showingId);
    } catch (error) {
        const errorNode = document.createElement("p");
        errorNode.className = "error";
        errorNode.textContent = "Could not load seats for this showing.";
        container.appendChild(errorNode);
        return container;
    }
    const screenLabel = document.createElement("div");
    screenLabel.className = "screen-label";
    screenLabel.textContent = "Screen";
    container.appendChild(screenLabel);

    const confirmButton = document.createElement("button");
    confirmButton.type = "submit";
    confirmButton.className = "confirm-booking";
    confirmButton.textContent = "Confirm booking";
    confirmButton.disabled = true;

    // Knappen åbnes først, når mindst ét sæde er valgt
    function updateSelection() {
        confirmButton.disabled = getState().selectedSeats.length === 0;
    }

    const seatGrid = createSeatGrid(seats, updateSelection);
    container.appendChild(seatGrid);

    // Formular til navn og email
    const form = document.createElement("form");
    form.className = "booking-form";
    form.innerHTML = `
        <input name="customerName" type="text" placeholder="Name" required>
        <input name="customerEmail" type="email" placeholder="Email" required>
        <input name="customerPhone" type="tel" placeholder="Phone (optional)">
    `;
    form.appendChild(confirmButton);
    container.appendChild(form);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        try {
            const reservation = await createReservation({
                showingId: Number(showingId),
                seatIds: getState().selectedSeats,
                customerName: formData.get("customerName"),
                customerEmail: formData.get("customerEmail"),
                customerPhone: formData.get("customerPhone") || null,
            });
            container.replaceChildren(createConfirmation(reservation));
        } catch (error) {
            alert(`Booking failed: ${error.message}`);
        }
    });

    return container;
}

function createSeatGrid(seats, onSelectionChange) {
    const grid = document.createElement("div");
    grid.className = "seat-grid";

    // Antal kolonner følger salen
    const seatsPerRow = Math.max(...seats.map((seat) => seat.seatNumber));
    grid.style.gridTemplateColumns = `repeat(${seatsPerRow}, 1.5rem)`;

    seats.forEach((seat) => {
        const rowLabel = String.fromCharCode(64 + seat.seatRow);   // 1 → A, 2 → B ...

        const seatButton = document.createElement("button");
        seatButton.type = "button";
        seatButton.className = "seat";
        seatButton.textContent = `${rowLabel}${seat.seatNumber}`;

        if (seat.booked) {
            seatButton.classList.add("booked");
            seatButton.disabled = true;
        } else {
            seatButton.addEventListener("click", () => {
                const selectedSeats = toggleSeat(seat.id);          // det rigtige id fra databasen
                seatButton.classList.toggle("selected", selectedSeats.includes(seat.id));
                onSelectionChange();
            });
        }

        grid.appendChild(seatButton);
    });

    return grid;
}

function createConfirmation(reservation) {
    const section = document.createElement("section");
    section.className = "booking-confirmation";

    const seatLabels = reservation.seats
        .map((seat) => `${String.fromCharCode(64 + seat.seatRow)}${seat.seatNumber}`)
        .join(", ");

    section.innerHTML = `
        <h1>Booking confirmed!</h1>
        <p class="order-number"></p>
        <p class="details"></p>
        <p>Show your order number at the cinema to get your tickets.</p>
    `;
    section.querySelector(".order-number").textContent = `Order number: ${reservation.orderNumber}`;
    section.querySelector(".details").textContent =
        `${reservation.movieTitle} – ${reservation.theaterName} – Seats: ${seatLabels}`;

    return section;
}
