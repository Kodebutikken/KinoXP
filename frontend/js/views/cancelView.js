import { fetchCustomerReservations, cancelTicket } from "../api/kinoApi.js";

const CANCELLATION_DEADLINE_HOURS = 24;

export async function createCancelView() {
    const container = document.createElement("section");
    container.className = "cancel-page";

    const heading = document.createElement("h1");
    heading.textContent = "Cancel tickets";
    container.appendChild(heading);

    const form = document.createElement("form");
    form.className = "booking-form";
    form.innerHTML = `
        <input name="orderNumber" type="number" placeholder="Order number" min="100000" max="999999" required>
        <input name="name" type="text" placeholder="Name" required>
        <input name="email" type="email" placeholder="Email" required>
        <button type="submit" class="confirm-booking">Find my tickets</button>
    `;
    container.appendChild(form);

    const results = document.createElement("div");
    results.className = "cancel-results";
    container.appendChild(results);

    let currentOrderNumber = null;
    let currentEmail = null;
    let currentName = null;

    async function loadReservation() {
        results.replaceChildren();
        try {
            const reservation = await fetchCustomerReservations(currentOrderNumber, currentEmail, currentName);
            results.appendChild(createReservationCard(reservation, onCancel));
        } catch (error) {
            // Også når den sidste billet er annulleret – så findes reservationen ikke længere
            const errorNode = document.createElement("p");
            errorNode.className = "error";
            errorNode.textContent = "No reservation found with this order number, name and email.";
            results.appendChild(errorNode);
        }
    }

    async function onCancel(reservation, seat, seatLabel) {
        if (!confirm(`Cancel seat ${seatLabel} for ${reservation.movieTitle}?`)) return;

        try {
            await cancelTicket(reservation.orderNumber, seat.id, currentEmail);
            await loadReservation();
        } catch (error) {
            alert("The ticket could not be cancelled.");
        }
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        currentOrderNumber = formData.get("orderNumber");
        currentName = formData.get("name");
        currentEmail = formData.get("email");
        await loadReservation();
    });

    return container;
}

function createReservationCard(reservation, onCancel) {
    const card = document.createElement("div");
    card.className = "reservation-card";

    const startTime = new Date(reservation.startTime);
    const hoursUntilStart = (startTime - new Date()) / (1000 * 60 * 60);

    // Hvorfor billetterne ikke kan annulleres (null = de kan godt)
    let blockedReason = null;
    if (reservation.isPaid) {
        blockedReason = "Paid tickets cannot be cancelled.";
    } else if (hoursUntilStart < CANCELLATION_DEADLINE_HOURS) {
        blockedReason = `Tickets can only be cancelled until ${CANCELLATION_DEADLINE_HOURS} hours before the showing.`;
    }

    const title = document.createElement("h2");
    title.textContent = reservation.movieTitle;
    card.appendChild(title);

    const info = document.createElement("p");
    info.textContent = `Order #${reservation.orderNumber} – ${reservation.theaterName} – ${startTime.toLocaleString("da-DK")}`;
    card.appendChild(info);

    if (blockedReason) {
        const note = document.createElement("p");
        note.className = "cancel-note";
        note.textContent = blockedReason;
        card.appendChild(note);
    }

    const list = document.createElement("ul");
    list.className = "ticket-list";

    reservation.seats.forEach((seat) => {
        const seatLabel = `${String.fromCharCode(64 + seat.seatRow)}${seat.seatNumber}`;

        const item = document.createElement("li");
        item.textContent = `Seat ${seatLabel} `;

        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.textContent = "Cancel";
        cancelButton.disabled = blockedReason !== null;
        cancelButton.addEventListener("click", () => onCancel(reservation, seat, seatLabel));

        item.appendChild(cancelButton);
        list.appendChild(item);
    });

    card.appendChild(list);
    return card;
}