package com.kodebutikken.kinoxp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "movie")
public class Movie {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private int durationMinutes;
    private int ageLimit;
    private String description;

    @Enumerated(EnumType.STRING)
    private MovieGenre movieGenre;

    private boolean active;

}
