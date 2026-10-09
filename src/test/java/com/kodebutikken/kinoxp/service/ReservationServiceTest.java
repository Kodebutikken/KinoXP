package com.kodebutikken.kinoxp.service;

import com.kodebutikken.kinoxp.dto.ReservationRequest;
import com.kodebutikken.kinoxp.dto.ReservationResponse;
import com.kodebutikken.kinoxp.dto.SeatAvailabilityResponse;
import com.kodebutikken.kinoxp.exception.ReservationAlreadyPaidException;
import com.kodebutikken.kinoxp.exception.ReservationNotFoundException;
import com.kodebutikken.kinoxp.exception.ShowingNotFoundException;
import com.kodebutikken.kinoxp.model.*;
import com.kodebutikken.kinoxp.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.kodebutikken.kinoxp.dto.TicketResponse;
import java.math.BigDecimal;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReservationServiceTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private ShowingRepository showingRepository;

    @Mock
    private SeatRepository seatRepository;

    @Mock
    private ReservationSeatRepository reservationSeatRepository;

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private ReservationService reservationService;

    private Theater bigTheater;
    private Theater smallTheater;
    private Showing showing;
    private Seat seatA1;
    private Seat seatA2;

    @BeforeEach
    void setUp() {
        bigTheater = new Theater(1L, "Stor sal", 25, 16, new ArrayList<>());
        smallTheater = new Theater(2L, "Lille sal", 20, 12, new ArrayList<>());

        Movie movie = new Movie();
        movie.setId(1L);
        movie.setTitle("Dune");

        showing = new Showing();
        showing.setId(10L);
        showing.setMovie(movie);
        showing.setTheater(bigTheater);
        showing.setStartTime(LocalDateTime.of(2026, 10, 6, 17, 0));

        seatA1 = new Seat(100L, bigTheater, 1, 1);
        seatA2 = new Seat(101L, bigTheater, 1, 2);
    }

    private ReservationRequest request(List<Long> seatIds) {
        return new ReservationRequest(10L, seatIds, "Mads Hansen", " Mads@Example.com ", "20304050");
    }

    private Reservation existingReservation(boolean paid) {
        Customer customer = new Customer();
        customer.setId(5L);
        customer.setName("Mads Hansen");
        customer.setEmail("mads@example.com");

        Reservation reservation = new Reservation();
        reservation.setId(42L);
        reservation.setOrderNumber(482913L);
        reservation.setShowing(showing);
        reservation.setCustomer(customer);
        reservation.setPaid(paid);
        return reservation;
    }

    @Test
    void createReservation_Success() {
        when(showingRepository.findById(10L)).thenReturn(Optional.of(showing));
        when(seatRepository.findAllById(anyCollection())).thenReturn(List.of(seatA1, seatA2));
        when(reservationSeatRepository.existsByShowingIdAndSeatIdIn(eq(10L), anyCollection())).thenReturn(false);
        when(customerRepository.findByEmail("mads@example.com")).thenReturn(Optional.empty());
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> {
            Reservation saved = invocation.getArgument(0);
            saved.setId(42L);
            return saved;
        });

        ReservationResponse response = reservationService.createReservation(request(List.of(100L, 101L)));

        // Ordrenummeret er tilfældigt, men skal ligge mellem 100000 og 999999
        assertTrue(response.orderNumber() >= 100_000 && response.orderNumber() <= 999_999);
        assertEquals("Dune", response.movieTitle());
        assertEquals("Stor sal", response.theaterName());
        assertEquals("Mads Hansen", response.customerName());
        assertFalse(response.isPaid());
        assertEquals(2, response.seats().size());

        // Et ReservationSeat pr. sæde
        verify(reservationSeatRepository, times(2)).save(any(ReservationSeat.class));
    }

    @Test
    void createReservation_shouldCreateNewCustomer_withLowercaseEmail() {
        when(showingRepository.findById(10L)).thenReturn(Optional.of(showing));
        when(seatRepository.findAllById(anyCollection())).thenReturn(List.of(seatA1));
        when(reservationSeatRepository.existsByShowingIdAndSeatIdIn(eq(10L), anyCollection())).thenReturn(false);
        when(customerRepository.findByEmail("mads@example.com")).thenReturn(Optional.empty());
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reservationService.createReservation(request(List.of(100L)));

        ArgumentCaptor<Customer> customerCaptor = ArgumentCaptor.forClass(Customer.class);
        verify(customerRepository).save(customerCaptor.capture());
        assertEquals("mads@example.com", customerCaptor.getValue().getEmail());
        assertEquals("Mads Hansen", customerCaptor.getValue().getName());
    }

    @Test
    void createReservation_shouldReuseExistingCustomer() {
        Customer existing = new Customer();
        existing.setId(5L);
        existing.setName("Mads Hansen");
        existing.setEmail("mads@example.com");

        when(showingRepository.findById(10L)).thenReturn(Optional.of(showing));
        when(seatRepository.findAllById(anyCollection())).thenReturn(List.of(seatA1));
        when(reservationSeatRepository.existsByShowingIdAndSeatIdIn(eq(10L), anyCollection())).thenReturn(false);
        when(customerRepository.findByEmail("mads@example.com")).thenReturn(Optional.of(existing));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reservationService.createReservation(request(List.of(100L)));

        // Ingen ny kunde oprettes, og reservationen kobles til den eksisterende
        verify(customerRepository, never()).save(any());
        ArgumentCaptor<Reservation> reservationCaptor = ArgumentCaptor.forClass(Reservation.class);
        verify(reservationRepository).save(reservationCaptor.capture());
        assertEquals(5L, reservationCaptor.getValue().getCustomer().getId());
    }

    @Test
    void createReservation_shouldThrow_whenShowingDoesNotExist() {
        when(showingRepository.findById(10L)).thenReturn(Optional.empty());

        assertThrows(ShowingNotFoundException.class,
                () -> reservationService.createReservation(request(List.of(100L))));

        verify(reservationRepository, never()).save(any());
    }

    @Test
    void createReservation_shouldThrow_whenSeatDoesNotExist() {
        when(showingRepository.findById(10L)).thenReturn(Optional.of(showing));
        when(seatRepository.findAllById(anyCollection())).thenReturn(List.of(seatA1));

        assertThrows(IllegalArgumentException.class,
                () -> reservationService.createReservation(request(List.of(100L, 999L))));

        verify(reservationRepository, never()).save(any());
    }

    @Test
    void createReservation_shouldThrow_whenSeatIsInAnotherTheater() {
        Seat seatInSmallTheater = new Seat(200L, smallTheater, 1, 1);

        when(showingRepository.findById(10L)).thenReturn(Optional.of(showing));
        when(seatRepository.findAllById(anyCollection())).thenReturn(List.of(seatInSmallTheater));

        assertThrows(IllegalArgumentException.class,
                () -> reservationService.createReservation(request(List.of(200L))));

        verify(reservationRepository, never()).save(any());
    }

    @Test
    void createReservation_shouldThrow_whenSeatIsAlreadyBooked() {
        when(showingRepository.findById(10L)).thenReturn(Optional.of(showing));
        when(seatRepository.findAllById(anyCollection())).thenReturn(List.of(seatA1));
        when(reservationSeatRepository.existsByShowingIdAndSeatIdIn(eq(10L), anyCollection())).thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> reservationService.createReservation(request(List.of(100L))));

        assertEquals("One or more seats are already booked for this showing.", exception.getMessage());
        verify(reservationRepository, never()).save(any());
        verify(reservationSeatRepository, never()).save(any());
    }

    //GET
    @Test
    void getReservation_shouldReturnReservationWithSeats() {
        Reservation reservation = existingReservation(false);

        when(reservationRepository.findByOrderNumber(482913L)).thenReturn(Optional.of(reservation));
        when(reservationSeatRepository.findByReservationId(42L)).thenReturn(List.of(
                new ReservationSeat(reservation, seatA1, showing),
                new ReservationSeat(reservation, seatA2, showing)));

        ReservationResponse response = reservationService.getReservation(482913L);

        assertEquals(482913L, response.orderNumber());
        assertEquals("mads@example.com", response.customerEmail());
        assertEquals(2, response.seats().size());
    }

    @Test
    void getReservation_shouldThrow_whenReservationDoesNotExist() {
        when(reservationRepository.findByOrderNumber(99L)).thenReturn(Optional.empty());

        assertThrows(ReservationNotFoundException.class, () -> reservationService.getReservation(99L));
    }

    //SEATS
    @Test
    void getSeatsForShowing_shouldMarkBookedSeats() {
        Reservation reservation = existingReservation(false);

        when(showingRepository.findById(10L)).thenReturn(Optional.of(showing));
        when(reservationSeatRepository.findByShowingId(10L)).thenReturn(List.of(
                new ReservationSeat(reservation, seatA1, showing)));
        when(seatRepository.findByTheaterIdOrderBySeatRowAscSeatNumberAsc(1L)).thenReturn(List.of(seatA1, seatA2));

        List<SeatAvailabilityResponse> seats = reservationService.getSeatsForShowing(10L);

        assertEquals(2, seats.size());
        assertTrue(seats.get(0).booked());   // A1 er booket
        assertFalse(seats.get(1).booked());  // A2 er ledig
    }

    @Test
    void getSeatsForShowing_shouldThrow_whenShowingDoesNotExist() {
        when(showingRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ShowingNotFoundException.class, () -> reservationService.getSeatsForShowing(99L));
    }

    //PAID
    @Test
    void markAsPaid_shouldSetPaidToTrue() {
        Reservation reservation = existingReservation(false);

        when(reservationRepository.findByOrderNumber(482913L)).thenReturn(Optional.of(reservation));
        when(reservationSeatRepository.findByReservationId(42L)).thenReturn(List.of());
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReservationResponse response = reservationService.markAsPaid(482913L);

        assertTrue(response.isPaid());
        assertTrue(reservation.isPaid());
    }

    @Test
    void markAsPaid_shouldThrow_whenAlreadyPaid() {
        when(reservationRepository.findByOrderNumber(482913L)).thenReturn(Optional.of(existingReservation(true)));

        assertThrows(ReservationAlreadyPaidException.class, () -> reservationService.markAsPaid(482913L));

        verify(reservationRepository, never()).save(any());
    }

    @Test
    void markAsPaid_shouldThrow_whenReservationDoesNotExist() {
        when(reservationRepository.findByOrderNumber(anyLong())).thenReturn(Optional.empty());

        assertThrows(ReservationNotFoundException.class, () -> reservationService.markAsPaid(99L));
    }

    @Test
    void cancelTicket_shouldDeleteOnlyThatTicket_whenReservationHasMoreTickets() {
        showing.setStartTime(LocalDateTime.now().plusDays(3));
        Reservation reservation = existingReservation(false);
        ReservationSeat ticketA1 = new ReservationSeat(reservation, seatA1, showing);
        ReservationSeat ticketA2 = new ReservationSeat(reservation, seatA2, showing);

        when(reservationRepository.findByOrderNumber(482913L)).thenReturn(Optional.of(reservation));
        when(reservationSeatRepository.findById(new ReservationSeat.ReservationSeatId(42L, 100L))).thenReturn(Optional.of(ticketA1));
        when(reservationSeatRepository.findByReservationId(42L)).thenReturn(List.of(ticketA2));

        reservationService.cancelTicket(482913L, 100L, "MADS@example.com");

        verify(reservationSeatRepository).delete(ticketA1);
        // Der er stadig en billet tilbage, så reservationen bliver
        verify(reservationRepository, never()).delete(any());
    }

    @Test
    void cancelTicket_shouldDeleteReservation_whenLastTicketIsCancelled() {
        showing.setStartTime(LocalDateTime.now().plusDays(3));
        Reservation reservation = existingReservation(false);
        ReservationSeat ticketA1 = new ReservationSeat(reservation, seatA1, showing);

        when(reservationRepository.findByOrderNumber(482913L)).thenReturn(Optional.of(reservation));
        when(reservationSeatRepository.findById(new ReservationSeat.ReservationSeatId(42L, 100L))).thenReturn(Optional.of(ticketA1));
        when(reservationSeatRepository.findByReservationId(42L)).thenReturn(List.of());

        reservationService.cancelTicket(482913L, 100L, "mads@example.com");

        verify(reservationSeatRepository).delete(ticketA1);
        verify(reservationRepository).delete(reservation);
    }

    @Test
    void cancelTicket_shouldThrow_whenEmailDoesNotMatch() {
        showing.setStartTime(LocalDateTime.now().plusDays(3));
        when(reservationRepository.findByOrderNumber(482913L)).thenReturn(Optional.of(existingReservation(false)));

        assertThrows(ReservationNotFoundException.class,
                () -> reservationService.cancelTicket(482913L, 100L, "someone@example.com"));

        verify(reservationSeatRepository, never()).delete(any());
    }

    @Test
    void cancelTicket_shouldThrow_whenReservationIsPaid() {
        showing.setStartTime(LocalDateTime.now().plusDays(3));
        when(reservationRepository.findByOrderNumber(482913L)).thenReturn(Optional.of(existingReservation(true)));

        assertThrows(IllegalArgumentException.class,
                () -> reservationService.cancelTicket(482913L, 100L, "mads@example.com"));

        verify(reservationSeatRepository, never()).delete(any());
    }

    @Test
    void cancelTicket_shouldThrow_whenLessThan24HoursBeforeShowing() {
        showing.setStartTime(LocalDateTime.now().plusHours(5));
        when(reservationRepository.findByOrderNumber(482913L)).thenReturn(Optional.of(existingReservation(false)));

        assertThrows(IllegalArgumentException.class,
                () -> reservationService.cancelTicket(482913L, 100L, "mads@example.com"));

        verify(reservationSeatRepository, never()).delete(any());
    }

    @Test
    void cancelTicket_shouldThrow_whenSeatIsNotInReservation() {
        showing.setStartTime(LocalDateTime.now().plusDays(3));
        when(reservationRepository.findByOrderNumber(482913L)).thenReturn(Optional.of(existingReservation(false)));
        when(reservationSeatRepository.findById(new ReservationSeat.ReservationSeatId(42L, 999L))).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> reservationService.cancelTicket(482913L, 999L, "mads@example.com"));

        verify(reservationSeatRepository, never()).delete(any());
    }

    @Test
    void cancelTicket_shouldThrow_whenReservationDoesNotExist() {
        when(reservationRepository.findByOrderNumber(99L)).thenReturn(Optional.empty());

        assertThrows(ReservationNotFoundException.class,
                () -> reservationService.cancelTicket(99L, 100L, "mads@example.com"));
    }

    //ORDER NUMBER
    @Test
    void createReservation_shouldPickNewOrderNumber_whenFirstIsAlreadyUsed() {
        when(showingRepository.findById(10L)).thenReturn(Optional.of(showing));
        when(seatRepository.findAllById(anyCollection())).thenReturn(List.of(seatA1));
        when(reservationSeatRepository.existsByShowingIdAndSeatIdIn(eq(10L), anyCollection())).thenReturn(false);
        when(customerRepository.findByEmail("mads@example.com")).thenReturn(Optional.empty());
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reservationRepository.existsByOrderNumber(anyLong())).thenReturn(true, false);

        ReservationResponse response = reservationService.createReservation(request(List.of(100L)));

        verify(reservationRepository, times(2)).existsByOrderNumber(anyLong());
        assertTrue(response.orderNumber() >= 100_000 && response.orderNumber() <= 999_999);
    }

    @Test
    void createTicket_shouldCreateOneTicketWithAllSeats_andMarkAsPaid() {
        Reservation reservation = existingReservation(false);

        when(reservationRepository.findByOrderNumber(482913L)).thenReturn(Optional.of(reservation));
        when(reservationSeatRepository.findByReservationId(42L)).thenReturn(List.of(
                new ReservationSeat(reservation, seatA1, showing),
                new ReservationSeat(reservation, seatA2, showing)));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TicketResponse ticket = reservationService.createTicket(482913L);

        assertEquals(482913L, ticket.orderNumber());
        assertEquals("Dune", ticket.movieTitle());
        assertEquals(2, ticket.seats().size());
        assertEquals(new BigDecimal("200.00"), ticket.totalPrice());

        assertTrue(reservation.isPaid());
        verify(reservationRepository).save(reservation);
    }

    @Test
    void createTicket_shouldThrow_whenTicketAlreadyCreated() {

        when(reservationRepository.findByOrderNumber(482913L)).thenReturn(Optional.of(existingReservation(true)));

        assertThrows(ReservationAlreadyPaidException.class, () -> reservationService.createTicket(482913L));

        verify(reservationRepository, never()).save(any());
    }

    @Test
    void createTicket_shouldThrow_whenReservationDoesNotExist() {
        when(reservationRepository.findByOrderNumber(99L)).thenReturn(Optional.empty());

        assertThrows(ReservationNotFoundException.class, () -> reservationService.createTicket(99L));
    }

    @Test
    void searchActiveReservations_shouldReturnAll_whenNoSearchFields() {
        Customer mads = new Customer();
        mads.setName("Mads Hansen");
        mads.setPhone("20304050");
        mads.setEmail("mads@example.com");

        Customer ida = new Customer();
        ida.setName("Ida Jensen");
        ida.setPhone("11223344");
        ida.setEmail("ida@example.com");

        Reservation madsReservation = new Reservation();
        madsReservation.setId(1L);
        madsReservation.setOrderNumber(111111L);
        madsReservation.setShowing(showing);
        madsReservation.setCustomer(mads);

        Reservation idaReservation = new Reservation();
        idaReservation.setId(2L);
        idaReservation.setOrderNumber(222222L);
        idaReservation.setShowing(showing);
        idaReservation.setCustomer(ida);

        when(reservationRepository.findByShowingStartTimeAfterOrderByShowingStartTimeAsc(any(LocalDateTime.class)))
                .thenReturn(List.of(madsReservation, idaReservation));
        when(reservationSeatRepository.findByReservationId(1L)).thenReturn(List.of());
        when(reservationSeatRepository.findByReservationId(2L)).thenReturn(List.of());

        List<ReservationResponse> result = reservationService.searchActiveReservations(null, "", " ", null);

        assertEquals(2, result.size());
    }

    @Test
    void searchActiveReservations_shouldFindByName_ignoringCaseAndSpaces() {
        Customer mads = new Customer();
        mads.setName("Mads Hansen");
        mads.setPhone("20304050");
        mads.setEmail("mads@example.com");

        Customer ida = new Customer();
        ida.setName("Ida Jensen");
        ida.setPhone("11223344");
        ida.setEmail("ida@example.com");

        Reservation madsReservation = new Reservation();
        madsReservation.setId(1L);
        madsReservation.setOrderNumber(111111L);
        madsReservation.setShowing(showing);
        madsReservation.setCustomer(mads);

        Reservation idaReservation = new Reservation();
        idaReservation.setId(2L);
        idaReservation.setOrderNumber(222222L);
        idaReservation.setShowing(showing);
        idaReservation.setCustomer(ida);

        when(reservationRepository.findByShowingStartTimeAfterOrderByShowingStartTimeAsc(any(LocalDateTime.class)))
                .thenReturn(List.of(madsReservation, idaReservation));
        when(reservationSeatRepository.findByReservationId(1L)).thenReturn(List.of());

        List<ReservationResponse> result = reservationService.searchActiveReservations(null, "  mads hansen ", null, null);

        assertEquals(1, result.size());
        assertEquals(111111L, result.get(0).orderNumber());

    }

    @Test
    void getReservationForCustomer_shouldReturnReservation_whenEmailAndNameMatch() {
        Reservation reservation = existingReservation(false);

        when(reservationRepository.findByOrderNumber(482913L)).thenReturn(Optional.of(reservation));
        when(reservationSeatRepository.findByReservationId(42L)).thenReturn(List.of(
                new ReservationSeat(reservation, seatA1, showing)));

        ReservationResponse response =
                reservationService.getReservationForCustomer(482913L, " MADS@example.com ", "  mads hansen ");

        assertEquals(482913L, response.orderNumber());
        assertEquals(1, response.seats().size());
    }

    @Test
    void getReservationForCustomer_shouldThrow_whenEmailDoesNotMatch() {
        when(reservationRepository.findByOrderNumber(482913L)).thenReturn(Optional.of(existingReservation(false)));

        assertThrows(ReservationNotFoundException.class,
                () -> reservationService.getReservationForCustomer(482913L, "someone@example.com", "Mads Hansen"));
    }

    @Test
    void getReservationForCustomer_shouldThrow_whenNameDoesNotMatch() {
        when(reservationRepository.findByOrderNumber(482913L)).thenReturn(Optional.of(existingReservation(false)));

        assertThrows(ReservationNotFoundException.class,
                () -> reservationService.getReservationForCustomer(482913L, "mads@example.com", "Ida Jensen"));
    }

    @Test
    void getReservationForCustomer_shouldThrow_whenReservationDoesNotExist() {
        when(reservationRepository.findByOrderNumber(99L)).thenReturn(Optional.empty());

        assertThrows(ReservationNotFoundException.class,
                () -> reservationService.getReservationForCustomer(99L, "mads@example.com", "Mads Hansen"));
    }


    private List<Reservation> twoActiveReservations() {
        Customer mads = new Customer();
        mads.setName("Mads Hansen");
        mads.setPhone("20304050");
        mads.setEmail("mads@example.com");

        Customer ida = new Customer();
        ida.setName("Ida Jensen");
        ida.setPhone("11223344");
        ida.setEmail("ida@example.com");

        Reservation madsReservation = new Reservation();
        madsReservation.setId(1L);
        madsReservation.setOrderNumber(111111L);
        madsReservation.setShowing(showing);
        madsReservation.setCustomer(mads);

        Reservation idaReservation = new Reservation();
        idaReservation.setId(2L);
        idaReservation.setOrderNumber(222222L);
        idaReservation.setShowing(showing);
        idaReservation.setCustomer(ida);

        return List.of(madsReservation, idaReservation);
    }

    @Test
    void searchActiveReservations_shouldFindByOrderNumber() {
        when(reservationRepository.findByShowingStartTimeAfterOrderByShowingStartTimeAsc(any(LocalDateTime.class)))
                .thenReturn(twoActiveReservations());
        when(reservationSeatRepository.findByReservationId(2L)).thenReturn(List.of());

        List<ReservationResponse> result = reservationService.searchActiveReservations(222222L, null, null, null);

        assertEquals(1, result.size());
        assertEquals(222222L, result.get(0).orderNumber());
    }

    @Test
    void searchActiveReservations_shouldFindByPhone() {
        when(reservationRepository.findByShowingStartTimeAfterOrderByShowingStartTimeAsc(any(LocalDateTime.class)))
                .thenReturn(twoActiveReservations());
        when(reservationSeatRepository.findByReservationId(1L)).thenReturn(List.of());

        List<ReservationResponse> result = reservationService.searchActiveReservations(null, null, "20304050", null);

        assertEquals(1, result.size());
        assertEquals(111111L, result.get(0).orderNumber());
    }

    @Test
    void searchActiveReservations_shouldFindByEmail_ignoringCase() {
        when(reservationRepository.findByShowingStartTimeAfterOrderByShowingStartTimeAsc(any(LocalDateTime.class)))
                .thenReturn(twoActiveReservations());
        when(reservationSeatRepository.findByReservationId(2L)).thenReturn(List.of());

        List<ReservationResponse> result = reservationService.searchActiveReservations(null, null, null, "IDA@Example.com");

        assertEquals(1, result.size());
        assertEquals(222222L, result.get(0).orderNumber());
    }

    @Test
    void searchActiveReservations_shouldRequireAllFilledFieldsToMatch() {
        when(reservationRepository.findByShowingStartTimeAfterOrderByShowingStartTimeAsc(any(LocalDateTime.class)))
                .thenReturn(twoActiveReservations());

        List<ReservationResponse> result =
                reservationService.searchActiveReservations(null, "Mads Hansen", "11223344", null);

        assertTrue(result.isEmpty());
    }

    @Test
    void searchActiveReservations_shouldReturnEmptyList_whenNothingMatches() {
        when(reservationRepository.findByShowingStartTimeAfterOrderByShowingStartTimeAsc(any(LocalDateTime.class)))
                .thenReturn(twoActiveReservations());

        List<ReservationResponse> result = reservationService.searchActiveReservations(999999L, null, null, null);

        assertTrue(result.isEmpty());
    }
}
