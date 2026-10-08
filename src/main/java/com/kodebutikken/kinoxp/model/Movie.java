package com.kodebutikken.kinoxp.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

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

    private String coverUrl;

    private boolean active;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "movie", cascade = CascadeType.REMOVE)
    private List<Showing> showings = new ArrayList<>();

}
