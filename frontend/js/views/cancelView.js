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

    async function onCancel(reservation, selectedSeats) {
        const seatLabels = selectedSeats.map((seat) => seat.label).join(", ");
        if (!confirm(`Cancel seat(s) ${seatLabels} for ${reservation.movieTitle}?`)) return;

        try {
            for (const seat of selectedSeats) {
                await cancelTicket(reservation.orderNumber, seat.id, currentEmail);
            }
        } catch (error) {
            alert("One or more tickets could not be cancelled.");
        }
        await loadReservation();
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

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "confirm-booking";
    cancelButton.textContent = "Cancel tickets";
    cancelButton.disabled = true;

    const checkboxes = [];

    function updateCancelButton() {
        cancelButton.disabled = !checkboxes.some((checkbox) => checkbox.checked);
    }

    reservation.seats.forEach((seat) => {
        const seatLabel = `${String.fromCharCode(64 + seat.seatRow)}${seat.seatNumber}`;

        const item = document.createElement("li");
        const label = document.createElement("label");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = seat.id;
        checkbox.dataset.label = seatLabel;
        checkbox.disabled = blockedReason !== null;
        checkbox.addEventListener("change", updateCancelButton);
        checkboxes.push(checkbox);

        label.appendChild(checkbox);
        label.append(` Seat ${seatLabel}`);
        item.appendChild(label);
        list.appendChild(item);
    });

    cancelButton.addEventListener("click", () => {
        const selectedSeats = checkboxes
            .filter((checkbox) => checkbox.checked)
            .map((checkbox) => ({id: Number(checkbox.value), label: checkbox.dataset.label}));
        onCancel(reservation, selectedSeats);
    });

    card.appendChild(list);
    if (!blockedReason) {
        card.appendChild(cancelButton);
    }
    return card;
}