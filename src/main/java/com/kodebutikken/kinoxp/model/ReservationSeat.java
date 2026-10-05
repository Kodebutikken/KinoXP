package com.kodebutikken.kinoxp.model;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@IdClass(ReservationSeat.ReservationSeatId.class)
@Table(name = "reservation_seat",
        uniqueConstraints = @UniqueConstraint(columnNames = {"showing_id", "seat_id"}))
public class ReservationSeat {
    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seat_id")
    private Seat seat;

    // Gemmes her, så samme sæde ikke kan bookes to gange til samme forestilling
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "showing_id")
    private Showing showing;

    // Den sammensatte nøgle: feltnavnene skal matche felterne med @Id ovenfor
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class ReservationSeatId implements Serializable {
        private Long reservation;
        private Long seat;
    }
}
