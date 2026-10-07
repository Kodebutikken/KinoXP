"use strict";


import { searchReservations, createTicket } from "../api/kinoApi.js";
import { formatSeat, formatDateTime as formatStartTime } from "../components/poster.js";


export async function renderReservationsSection(container) {
    const searchForm = document.createElement("form");
    searchForm.className = "form-filters";

    const filtersRow = document.createElement("div");
    filtersRow.className = "filters-row";
    searchForm.appendChild(filtersRow);

    const orderInput = document.createElement("input");
    orderInput.type = "number";
    orderInput.min = "1";
    orderInput.name = "orderNumber";
    orderInput.placeholder = "Order number";
    orderInput.setAttribute("aria-label", "Order number");

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.name = "name";
    nameInput.placeholder = "Name";
    nameInput.setAttribute("aria-label", "Name");

    const phoneInput = document.createElement("input");
    phoneInput.type = "tel";
    phoneInput.name = "phone";
    phoneInput.placeholder = "Phone";
    phoneInput.setAttribute("aria-label", "Phone");

    const emailInput = document.createElement("input");
    emailInput.type = "email";
    emailInput.name = "email";
    emailInput.placeholder = "Email";
    emailInput.setAttribute("aria-label", "Email");

    const searchButton = document.createElement("button");
    searchButton.type = "submit";
    searchButton.className = "btn-primary";
    searchButton.textContent = "Search";

    const showAllButton = document.createElement("button");
    showAllButton.type = "button";
    showAllButton.className = "btn-secondary clear-search";
    showAllButton.textContent = "Show all";
    showAllButton.addEventListener("click", async () => {
        searchForm.reset();
        currentSearch = {};
        await showList();
    });

    filtersRow.append(orderInput, nameInput, phoneInput, emailInput, searchButton, showAllButton);

    container.appendChild(searchForm);

    const resultContainer = document.createElement("div");
    container.appendChild(resultContainer);

    let currentSearch = {};

    async function showList() {
        resultContainer.replaceChildren();
        try {
            const reservations = await searchReservations(currentSearch);
            resultContainer.appendChild(buildReservationList(reservations, showReservation));
        } catch (error) {
            resultContainer.appendChild(createErrorNode("Error while loading reservations."));
        }
    }

    function showReservation(reservation) {
        const backButton = document.createElement("button");
        backButton.type = "button";
        backButton.textContent = "← Back to list";
        backButton.addEventListener("click", showList);

        resultContainer.replaceChildren(backButton, buildReservationDetails(reservation));
    }

    searchForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // stop browseren i at genindlæse siden
        const formData = new FormData(searchForm);
        currentSearch = {
            orderNumber: formData.get("orderNumber").trim(),
            name: formData.get("name").trim(),
            phone: formData.get("phone").trim(),
            email: formData.get("email").trim(),
        };
        await showList();
    });

    await showList();
}

function buildReservationList(reservations, onSelect) {
    if (reservations.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No active reservations found.";
        return empty;
    }

    const wrapper = document.createElement("div");

    const count = document.createElement("p");
    count.textContent = `${reservations.length} active reservation(s)`;
    wrapper.appendChild(count);

    const table = document.createElement("table");
    table.className = "admin-table reservation-table";

    const headRow = document.createElement("tr");
    ["Order no.", "Name", "Phone", "Email", "Movie", "Time", "Seats", "Status", ""].forEach((label) => {
        const th = document.createElement("th");
        th.textContent = label;
        headRow.appendChild(th);
    });
    const thead = document.createElement("thead");
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    reservations.forEach((reservation) => {
        const row = document.createElement("tr");

        // textContent bruges til data, så tekst fra kunden aldrig bliver til HTML
        [
            reservation.orderNumber,
            reservation.customerName,
            reservation.customerPhone || "–",
            reservation.customerEmail,
            `${reservation.movieTitle} (${reservation.theaterName})`,
            formatStartTime(reservation.startTime),
            reservation.seats.map(formatSeat).join(", "),
            reservation.isPaid ? "Paid" : "Not paid",
        ].forEach((value) => {
            const td = document.createElement("td");
            td.textContent = value;
            row.appendChild(td);
        });

        const actionCell = document.createElement("td");
        const viewButton = document.createElement("button");
        viewButton.type = "button";
        viewButton.textContent = "View";
        viewButton.addEventListener("click", () => onSelect(reservation));
        actionCell.appendChild(viewButton);
        row.appendChild(actionCell);

        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    // NY: tabellen kan scrolles vandret på små skærme
    const scroll = document.createElement("div");
    scroll.className = "table-scroll";
    scroll.appendChild(table);
    wrapper.appendChild(scroll);

    return wrapper;
}

function buildReservationDetails(reservation) {
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
    details.querySelector(".customer").textContent =
        `Customer: ${reservation.customerName}, ${reservation.customerPhone || "no phone"}, ${reservation.customerEmail}`;
    details.querySelector(".showing").textContent =
        `${reservation.movieTitle} · ${reservation.theaterName} · ${formatStartTime(reservation.startTime)}`;
    details.querySelector(".seats").textContent = `Seats: ${seatLabels}`;
    details.querySelector(".status").textContent = reservation.isPaid
        ? "A ticket has already been created for this reservation."
        : "Not paid yet. No ticket has been created.";

    if (!reservation.isPaid) {
        const ticketButton = document.createElement("button");
        ticketButton.type = "button";
        ticketButton.className = "confirm-booking"; // genbruger knap-stylingen fra booking-siden
        ticketButton.textContent = "Create ticket";

        ticketButton.addEventListener("click", async () => {
            ticketButton.disabled = true; // så man ikke kan klikke to gange
            try {
                const ticket = await createTicket(reservation.orderNumber);
                details.replaceWith(buildTicket(ticket));
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
    card.querySelector(".time").textContent = `${ticket.theaterName} · ${formatStartTime(ticket.startTime)}`;
    card.querySelector(".ticket-seats").textContent = `Seats: ${ticket.seats.map(formatSeat).join(", ")}`;
    card.querySelector(".price").textContent = `Total: ${Number(ticket.totalPrice).toFixed(2)} kr.`;
    card.querySelector(".order").textContent = `Order ${ticket.orderNumber} · ${ticket.customerName}`;

    wrapper.appendChild(card);
    return wrapper;
}

function createErrorNode(text) {
    const errorNode = document.createElement("p");
    errorNode.className = "error";
    errorNode.textContent = text;
    return errorNode;
}