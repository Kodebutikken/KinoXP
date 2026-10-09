# KinoXP

## Introduktion af projektet

KinoXP er en Java Spring Boot webapplikation til en lille biograf med to sale. Systemet gør det muligt for kunder at se programmet, reservere sæder og annullere deres reservation, og for biografens administrator at styre film, forestillinger og billetsalg i en samlet applikation.

Projektet er bygget med en klassisk lagdelt struktur, hvor controllers udstiller et REST API, services indeholder forretningslogik, repositories står for databaseadgang med Spring Data JPA, og modelklasser repræsenterer systemets centrale data. Frontenden er skrevet i HTML, CSS og vanilla JavaScript og kommunikerer med backenden via API'et.

Den primære arbejdsgang i systemet er, at administratoren opretter film og planlægger forestillinger, kunden vælger en forestilling og reserverer sæder, og administratoren efterfølgende slår reservationen op og laver billetten, når kunden betaler.

## Link til Live Demo
https://kinoxp.mbserv.dk/

Log ind med følgende demo bruger:
```
Brugernavn: Bjarne -- Har rollen Administrator
Kodeord: Admin
```

## Indhold

- [Introduktion af projektet](#introduktion-af-projektet)
- [Features](#features)
- [Teknologier](#teknologier)
- [Værktøjer og services](#værktøjer-og-services)
- [Installation](#installation)
- [Brug](#brug)
- [Bidrag](#bidrag)
- [Developers](#developers)

## Features

- Oversigt over aktuelle film og kommende forestillinger
- Reservation af sæder med visning af ledige og optagne pladser
- Kunden kan slå sin reservation op med ordrenummer, navn og e-mail
- Annullering af enkelte sæder senest 24 timer før forestillingen
- Login for administrator med rollebaseret adgangsstyring
- Oprettelse, redigering, aktivering/deaktivering og sletning af film
- Oprettelse, redigering og sletning af forestillinger
- Generering af forestillinger tre måneder frem ud fra ugedage og tidspunkter
- Konflikt-tjek, så to forestillinger ikke kan overlappe i samme sal (inkl. 10 minutters buffer)
- Oversigt og søgning i aktive reservationer på ordrenummer, navn, telefon og e-mail
- Oprettelse af billet ud fra en reservation med samlet pris

## Teknologier

- Java 25
- Spring Boot 4.1.1
- Spring Web MVC
- Spring Data JPA / Hibernate
- Spring Validation
- Spring Security Crypto (BCrypt til kodeord)
- MySQL 8.4 _som runtime-database_
- H2 til tests
- JUnit 5 og Mockito
- Maven / Maven Wrapper
- Lombok
- HTML, CSS og vanilla JavaScript til frontenden
- nginx til at servere frontenden og videresende `/api` til backenden

## Værktøjer og services

Projektet bruger følgende værktøjer og services i udviklings- og deploymentflowet:

- IntelliJ IDEA som anbefalet IDE
- Maven Wrapper til build, test og lokal kørsel
- Git og GitHub til versionsstyring
- GitHub Projects til product backlog, sprint backlog og burndown chart
- GitHub Issues til user stories, tasks og bug reports
- GitHub Pull Requests til code review
- GitHub Actions til build, test og deployment
- Qodana til statisk kodeanalyse
- Docker og GitHub Container Registry til images af backend og frontend
- Coolify til deployment

## Installation

### Krav

Før projektet køres lokalt, skal følgende være installeret eller tilgængeligt:

- Java 25
- Git
- En MySQL-kompatibel database
- Docker (til frontenden)

Maven behøver ikke være installeret globalt, da projektet indeholder Maven Wrapper scripts.

### Klon repository

```bash
git clone https://github.com/Kodebutikken/KinoXP.git
cd KinoXP
```

### Database

Opret en tom database i din lokale MySQL:

```sql
CREATE DATABASE kinoxp;
```

Tabellerne oprettes automatisk af Hibernate (`spring.jpa.hibernate.ddl-auto=update`), første gang applikationen startes.

Der oprettes blandt andet tabellerne:

- `movie`
- `showing`
- `theater`
- `seat`
- `customer`
- `reservation`
- `reservation_seat`
- `employee`

Systemet har ingen side til at oprette sale og medarbejdere, så de skal indsættes direkte i databasen. Kør følgende **efter** applikationen er startet første gang:

```sql
USE kinoxp;

-- To sale
INSERT INTO theater (name, row_count, seats_per_row) VALUES
  ('Stor sal', 25, 16),
  ('Lille sal', 20, 12);

-- Et sæde for hver række og plads i hver sal
INSERT INTO seat (theater_id, seat_row, seat_number)
WITH RECURSIVE nums AS (
  SELECT 1 AS n UNION ALL SELECT n + 1 FROM nums WHERE n < 25
)
SELECT t.id, r.n, s.n
FROM theater t
JOIN nums r ON r.n <= t.row_count
JOIN nums s ON s.n <= t.seats_per_row;

-- Admin-bruger til lokal udvikling (brugernavn: admin, kodeord: admin123)
INSERT INTO employee (name, role, username, password) VALUES
  ('Administrator', 'ADMINISTRATOR', 'admin',
   '$2a$12$Xz//2MqacoEfkzfa2N7JyuZHHDp.g9S1D6OEURGGCraPJ/ZzOC62S');
```

Kodeord gemmes som BCrypt-hash. Brug ikke `admin123` i produktion.

### Miljøvariabler

Projektets aktive profil styres i `application.properties`. Den lokale udviklingskonfiguration bruger miljøvariabler fra `application-dev.properties`.

For lokal udvikling skal følgende variabler sættes:

| Variabel | Beskrivelse |
| --- | --- |
| `DEV_DATABASE_URL` | JDBC URL til development-databasen |
| `DEV_USERNAME` | Brugernavn til development-databasen |
| `DEV_PASSWORD` | Password til development-databasen |
| `CORS_ALLOWED_ORIGINS` | Valgfri. Standard er `http://localhost:5173` |

Eksempel på database-URL:

```text
jdbc:mysql://localhost:3306/kinoxp
```


Produktionsmiljøet bruger disse variabler:

| Variabel | Beskrivelse |
| --- | --- |
| `PROD_DATABASE_URL` | JDBC URL til produktionsdatabasen |
| `PROD_USERNAME` | Brugernavn til produktionsdatabasen |
| `PROD_PASSWORD` | Password til produktionsdatabasen |
| `CORS_ALLOWED_ORIGINS` | Valgfri. Standard er `https://kinoxp.mbserv.dk` |

Credentials og secrets må ikke committes til repositoryet.

## Brug

### Start backenden lokalt

På Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

På macOS/Linux:

```bash
./mvnw spring-boot:run
```

Backenden kører som standard på:

```text
http://localhost:8080
```

### Start frontenden lokalt

Frontenden kalder backenden via `/api`, så den skal serveres gennem nginx, som videresender kaldene til backenden:

```bash
docker build -t kinoxp-frontend ./frontend
docker run --rm -p 5173:80 kinoxp-frontend
```

Applikationen kan herefter åbnes på:

```text
http://localhost:5173
```

### Kør tests

På Windows PowerShell:

```powershell
.\mvnw.cmd test
```

På macOS/Linux:

```bash
./mvnw test
```

### Overordnet projektstruktur

```text
src/main/java/com/kodebutikken/kinoxp
├── components      # Interceptor til adgangskontrol på admin-endpoints
├── config          # Spring-konfiguration (CORS, interceptor, PasswordEncoder)
├── controller      # REST controllers og endpoints
├── dto             # Request- og response-objekter
├── exception       # Custom exceptions og global exception handling
├── model           # Domæne- og modelklasser (JPA-entiteter)
├── repository      # Databaseadgang med Spring Data JPA
└── service         # Forretningslogik

src/main/resources
├── application.properties
├── application-dev.properties
└── application-prod.properties

frontend
├── index.html
├── css
├── js
│   ├── api         # Kald til backendens REST API
│   ├── components  # Genbrugelige UI-komponenter
│   ├── state       # Booking-state
│   └── views       # Sider (forside, booking, admin, ...)
└── nginx           # nginx-konfiguration
```

## Bidrag

Læs [CONTRIBUTING.md](CONTRIBUTING.md) for retningslinjer omkring branch naming, coding conventions, tests, pull requests og databaseændringer.

## Developers

Projektet er udviklet af Kodebutikken som en del af KinoXP-projektet:

- Marcus Bramsen Ejlersen - [Brammern](https://github.com/brammern)
- Oswald Sandengen Carstensen - [Walterb0b](https://github.com/Walterb0b)
- Nikolaj Esberg - [NikolajEsberg](https://github.com/NikolajEsberg)
- Zander Engelstad - [Zander3-2](https://github.com/Zander3-2)
- Magnus Nyvang Hansen - [MagnusNH](https://github.com/MagnusNH)
- Tamir Hald Levi - [tamirhaldlevi](https://github.com/tamirhaldlevi)

Repository: [Kodebutikken/KinoXP](https://github.com/Kodebutikken/KinoXP)