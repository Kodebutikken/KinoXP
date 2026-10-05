package com.kodebutikken.kinoxp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "seat")
public class Seat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "theater_id")
    private Theater theater;

    @Column(name = "seat_row", nullable = false)
    private int seatRow;

    @Column(name = "seat_number", nullable = false)
    private int seatNumber;
}
