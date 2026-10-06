"use strict";


import { getReservation, createTicket } from "../api/kinoApi.js"; // NY: funktionerne fra fil 7

export async function renderReservationsSection(container) {
    const searchForm = document.createElement("form");
    searchForm.className = "reservation-search";

    const orderInput = document.createElement("input");
    orderInput.type = "number";
    orderInput.min = "1";
    orderInput.name = "orderNumber";
    orderInput.placeholder = "Order number";
    orderInput.required = true;

    const searchButton = document.createElement("button");
    searchButton.type = "submit";
    searchButton.textContent = "Find reservation";

    searchForm.append(orderInput, searchButton);
    container.appendChild(searchForm);

    const resultContainer = document.createElement("div");
    container.appendChild(resultContainer);

    searchForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // stop browseren i at genindlæse siden
        resultContainer.replaceChildren(); // ryd det gamle resultat

        try {
            const reservation = await getReservation(orderInput.value);
            resultContainer.appendChild(buildReservationDetails(reservation, resultContainer));
        } catch (error) {
            resultContainer.appendChild(createErrorNode(
                error.message.includes("404")
                    ? `No reservation with order number ${orderInput.value}.`
                    : "Error while loading the reservation."
            ));
        }
    });
}

function buildReservationDetails(reservation, resultContainer) {
    const details = document.createElement("div");
    details.className = "reservation-details";

    const seatLabels = reservation.seats.map(formatSeat).join(", ");

    details.innerHTML = `
        <h2 class="title"></h2>
        <p class="customer"></p>
        <p class="showing"></p>
        <p class="seats"></p>
        <p class="status"></p>
    `;
    details.querySelector(".title").textContent = `Order number ${reservation.orderNumber}`;
    details.querySelector(".customer").textContent = `Customer: ${reservation.customerName} (${reservation.customerEmail})`;
    details.querySelector(".showing").textContent =
        `${reservation.movieTitle} – ${reservation.theaterName} – ${formatStartTime(reservation.startTime)}`;
    details.querySelector(".seats").textContent = `Seats: ${seatLabels}`;
    details.querySelector(".status").textContent = reservation.isPaid
        ? "A ticket has already been created for this reservation."
        : "Not paid – no ticket yet.";

    if (!reservation.isPaid) {
        const ticketButton = document.createElement("button");
        ticketButton.type = "button";
        ticketButton.className = "confirm-booking"; // genbruger knap-stylingen fra booking-siden
        ticketButton.textContent = "Create ticket";

        ticketButton.addEventListener("click", async () => {
            ticketButton.disabled = true; // så man ikke kan klikke to gange
            try {
                const ticket = await createTicket(reservation.orderNumber);
                // Erstatter reservationen med billetten
                resultContainer.replaceChildren(buildTicket(ticket));
            } catch (error) {
                ticketButton.disabled = false;
                // 400 = ReservationAlreadyPaidException fra backend
                details.appendChild(createErrorNode(
                    error.message.includes("400")
                        ? "A ticket has already been created for this reservation."
                        : "Failed to create the ticket."
                ));
            }
        });

        details.appendChild(ticketButton);
    }

    return details;
}

function buildTicket(ticket) {
    const wrapper = document.createElement("div");

    const heading = document.createElement("h2");
    heading.textContent = "Ticket created";
    wrapper.appendChild(heading);

    const template = document.createElement("template");
    template.innerHTML = `
        <div class="ticket-card">
            <p class="movie"></p>
            <p class="time"></p>
            <p class="ticket-seats"></p>
            <p class="price"></p>
            <p class="order"></p>
        </div>
    `;

    const card = template.content.firstElementChild.cloneNode(true);

    card.querySelector(".movie").textContent = ticket.movieTitle;
    card.querySelector(".time").textContent = `${ticket.theaterName} – ${formatStartTime(ticket.startTime)}`;
    card.querySelector(".ticket-seats").textContent = `Seats: ${ticket.seats.map(formatSeat).join(", ")}`;
    card.querySelector(".price").textContent = `Total: ${Number(ticket.totalPrice).toFixed(2)} kr.`;
    card.querySelector(".order").textContent = `Order ${ticket.orderNumber} – ${ticket.customerName}`;

    wrapper.appendChild(card);
    return wrapper;
}

function formatSeat(seat) {
    return `${String.fromCharCode(64 + seat.seatRow)}${seat.seatNumber}`;
}

function formatStartTime(startTime) {
    return startTime ? new Date(startTime).toLocaleString("da-DK") : "Unknown time";
}

function createErrorNode(text) {
    const errorNode = document.createElement("p");
    errorNode.className = "error";
    errorNode.textContent = text;
    return errorNode;
}