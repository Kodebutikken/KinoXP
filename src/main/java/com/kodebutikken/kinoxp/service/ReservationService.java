package com.kodebutikken.kinoxp.service;

import com.kodebutikken.kinoxp.dto.ReservationRequest;
import com.kodebutikken.kinoxp.dto.ReservationResponse;
import com.kodebutikken.kinoxp.dto.SeatAvailabilityResponse;
import com.kodebutikken.kinoxp.exception.ReservationNotFoundException;
import com.kodebutikken.kinoxp.exception.ShowingNotFoundException;
import com.kodebutikken.kinoxp.model.*;
import com.kodebutikken.kinoxp.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final ShowingRepository showingRepository;
    private final SeatRepository seatRepository;
    private final ReservationSeatRepository reservationSeatRepository;
    private final CustomerRepository customerRepository;

    public ReservationService(ReservationRepository reservationRepository,
                              ShowingRepository showingRepository,
                              SeatRepository seatRepository,
                              ReservationSeatRepository reservationSeatRepository,
                              CustomerRepository customerRepository) {
        this.reservationRepository = reservationRepository;
        this.showingRepository = showingRepository;
        this.seatRepository = seatRepository;
        this.reservationSeatRepository = reservationSeatRepository;
        this.customerRepository = customerRepository;
    }

    @Transactional
    public ReservationResponse createReservation(ReservationRequest request) {

        //Finder forestillingen
        Showing showing = showingRepository.findById(request.showingId())
                .orElseThrow(() -> new ShowingNotFoundException("Showing not found: " + request.showingId()));

        //Fjerner dubletter fra sæde-id'erne for at undgå dobbeltbooking
        Set<Long> uniqueSeatIds = new HashSet<>(request.seatIds());

        //Finder sæderne og tjekker om de findes og om de tilhører den rigtige sal
        List<Seat> seats = seatRepository.findAllById(uniqueSeatIds);
        if (seats.size() != uniqueSeatIds.size()) {
            throw new IllegalArgumentException("One or more seat don't exist.");
        }

        for (Seat seat : seats) {
            if (!seat.getTheater().getId().equals(showing.getTheater().getId())) {
                throw new IllegalArgumentException("Seat " + seat.getId() + " does not belong to the theater of the showing.");
            }
        }

        // Tjekker at ingen af sæderne allerede er booket til forestillingen
        if(reservationSeatRepository.existsByShowingIdAndSeatIdIn(showing.getId(), uniqueSeatIds)) {
            throw new IllegalArgumentException("One or more seats are already booked for this showing.");
        }

        //Finder kunden på email eller opretter en ny hvis den ikke findes
        Customer customer = findOrCreateCustomer(request);

        //Gemmer reservationen
        Reservation reservation = new Reservation();
        reservation.setShowing(showing);
        reservation.setCustomer(customer);
        reservation.setOrderNumber(generateOrderNumber());
        reservation = reservationRepository.save(reservation);

        //Gemmer et reservationSeat pr. sæde
        for (Seat seat : seats) {
            reservationSeatRepository.save(new ReservationSeat(reservation, seat, showing));
        }

        return ReservationResponse.from(reservation, seats);

    }

    @Transactional(readOnly = true)
    public ReservationResponse getReservation(Long orderNumber) {
        Reservation reservation = findByOrderNumber(orderNumber);
        return ReservationResponse.from(reservation, getSeats(reservation.getId()));
    }

    private Customer findOrCreateCustomer(ReservationRequest request) {
        String email = request.customerEmail().trim().toLowerCase();

        return customerRepository.findByEmail(email)
                .orElseGet(() -> {
                    Customer newCustomer = new Customer();
                    newCustomer.setName(request.customerName().trim());
                    newCustomer.setEmail(email);
                    newCustomer.setPhone(request.customerPhone());
                    return customerRepository.save(newCustomer);
                });
    }

    @Transactional(readOnly = true)
    public List<SeatAvailabilityResponse> getSeatsForShowing(Long showingId) {
        Showing showing = showingRepository.findById(showingId)
                .orElseThrow(() -> new ShowingNotFoundException("Showing not found: " + showingId));

        Set<Long> bookedSeatsIds = reservationSeatRepository.findByShowingId(showingId).stream()
                .map(reservationSeat -> reservationSeat.getSeat().getId())
                .collect(Collectors.toSet());

        return seatRepository.findByTheaterIdOrderBySeatRowAscSeatNumberAsc(showing.getTheater().getId()).stream()
                .map(seat -> SeatAvailabilityResponse.from(seat,
                        bookedSeatsIds.contains(seat.getId())
                ))
                .toList();
    }

    @Transactional
    public ReservationResponse markAsPaid(Long orderNumber) {
        Reservation reservation = findByOrderNumber(orderNumber);

        if (reservation.isPaid()) {
            throw new IllegalArgumentException("Reservation " + orderNumber + " is already paid");
        }

        reservation.setPaid(true);

        return ReservationResponse.from(reservationRepository.save(reservation), getSeats(reservation.getId()));
    }

    private static final int CANCELLATION_DEADLINE_HOURS = 24;

    @Transactional(readOnly = true)
    public ReservationResponse getReservationForCustomer (Long orderNumber, String email, String name) {
        Reservation reservation = findByOrderNumber(orderNumber);

        boolean emailMatches = reservation.getCustomer().getEmail().equalsIgnoreCase(email.trim());

        boolean nameMatches = reservation.getCustomer().getName().trim().equalsIgnoreCase(name.trim());

        if (!emailMatches || !nameMatches) {
            throw new ReservationNotFoundException("Reservation not found: " + orderNumber);
        }

        return ReservationResponse.from(reservation, getSeats(reservation.getId()));
    }

    @Transactional
    public void cancelTicket(Long orderNumber, Long seatId, String email){
        Reservation reservation = findByOrderNumber(orderNumber);

        if (!reservation.getCustomer().getEmail().equalsIgnoreCase(email.trim())) {
            throw new ReservationNotFoundException("Reservation not found for the provided email: " + email);
        }

        if(reservation.isPaid()) {
            throw new IllegalArgumentException("Cannot cancel a paid reservation.");
        }

        LocalDateTime deadline = reservation.getShowing().getStartTime().minusHours(CANCELLATION_DEADLINE_HOURS);
        if(LocalDateTime.now().isAfter(deadline)) {
            throw new IllegalArgumentException("Cannot cancel reservation within 24 hours of the showing.");
        }

        ReservationSeat ticket = reservationSeatRepository.findById(
                        new ReservationSeat.ReservationSeatId(reservation.getId(), seatId))
                .orElseThrow(() -> new IllegalArgumentException("Seat not found in the reservation."));

        reservationSeatRepository.delete(ticket);

        if(reservationSeatRepository.findByReservationId(reservation.getId()).isEmpty()){
            reservationRepository.delete(reservation);
        }
    }

    private List<Seat> getSeats(Long reservationId) {
        return reservationSeatRepository.findByReservationId(reservationId).stream()
                .map(ReservationSeat::getSeat)
                .toList();
    }

    private Long generateOrderNumber() {
        Long orderNumber;
        do {
            orderNumber = (long) ThreadLocalRandom.current().nextInt(100_000, 1_000_000);
        } while (reservationRepository.existsByOrderNumber(orderNumber));
        return orderNumber;
    }

    private Reservation findByOrderNumber(Long orderNumber) {
        return reservationRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ReservationNotFoundException("Reservation not found: " + orderNumber));
    }
}