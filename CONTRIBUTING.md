# Bidrag til KinoXP

Tak fordi du vil bidrage til KinoXP. Denne fil beskriver projektets arbejdsgang, kodestandarder, testkrav og forventninger til pull requests.

## Indhold

- [Arbejdsgang](#arbejdsgang)
- [Branch naming](#branch-naming)
- [Kodestandarder](#kodestandarder)
- [Projektets lagdeling](#projektets-lagdeling)
- [Databaseændringer](#databaseændringer)
- [Tests](#tests)
- [Pull requests](#pull-requests)
- [Commits](#commits)
- [Secrets og konfiguration](#secrets-og-konfiguration)
- [Code quality](#code-quality)

## Arbejdsgang

1. Vælg eller opret et issue.
    - Brug projektets GitHub Project board til user stories, tasks og bugs.
    - Sørg for, at issuet tydeligt beskriver problemet eller den ønskede funktionalitet.

2. Opret en ny branch.
    - Branchen bør tage udgangspunkt i den nyeste `main`. Pull altid, før du starter.
    - Hold branchen fokuseret på én feature, bugfix, refaktorering eller dokumentationsændring.

3. Lav ændringer lokalt.
    - Følg projektets lagdelte struktur.
    - Hold ændringerne så små og overskuelige som muligt.

4. Kør tests.
    - Eksisterende tests må ikke fejle.
    - Tilføj eller opdater tests ved ny forretningslogik eller ændrede regler i services.

5. Opret en pull request.
    - Beskriv kort, hvad der er ændret og hvorfor.
    - Link til det relevante issue.

## Branch naming

Brug korte og beskrivende branchnavne. Anbefalede prefixes:

```text
feature/add-ticket-creation
bugfix/fix-showing-overlap
docs/update-readme
refactor/reservation-service-search
test/add-showing-service-tests
```

## Kodestandarder

- Brug engelske navne til klasser, metoder, variabler og kommentarer i kode.
- Hold controllers simple og fokuserede på HTTP requests, request-data og responses.
- Placér forretningslogik, validering og regler i services.
- Placér databaseadgang i repositories.
- Brug Spring Data JPA konsekvent i repository-klasser.
- Hold modelklasser fokuseret på domænedata.
- Brug DTO-klasser (records) til data ind og ud af API'et.
- Undgå hardcoded credentials, database-URL'er, passwords og secrets.
- Fjern ubrugte imports og død kode.
- Fjern midlertidigt debug-output såsom `System.out.println` og `console.log`.
- Undgå uforklarede TODO-kommentarer. Hvis en TODO er nødvendig, skal den forklare hvorfor.

## Projektets lagdeling

Projektet følger en klassisk Spring Boot struktur:

```text
Frontend -> Controller -> Service -> Repository -> Database
```

### Controllers

Controllers findes i:

```text
src/main/java/com/kodebutikken/kinoxp/controller
```

Controllers bør:

- Definere endpoints og request mappings under `/api`
- Håndtere sessiondata hvor det er nødvendigt
- Validere request bodies med `@Valid`
- Delegere forretningslogik til services
- Returnere `ResponseEntity` med DTOs og korrekt HTTP-statuskode

### Services

Services findes i:

```text
src/main/java/com/kodebutikken/kinoxp/service
```

Services bør:

- Indeholde forretningslogik
- Validere vigtig input
- Håndhæve regler, fx konflikt-tjek på forestillinger og annulleringsfristen på 24 timer
- Kaste egne exceptions, som håndteres i `GlobalExceptionHandler`
- Koordinere kald til repositories

### Repositories

Repositories findes i:

```text
src/main/java/com/kodebutikken/kinoxp/repository
```

Repositories bør:

- Bruge Spring Data JPA til databaseadgang
- Bruge navngivne query-metoder (fx `findByOrderNumber`) frem for egen SQL, hvor det er muligt
- Undgå web-, session- og controllerlogik

### Models og DTOs

Modelklasser findes i:

```text
src/main/java/com/kodebutikken/kinoxp/model
```

DTO-klasser findes i:

```text
src/main/java/com/kodebutikken/kinoxp/dto
```

Brug modelklasser (JPA-entiteter) til centrale domænedata og DTO-klasser til data, der sendes til og fra frontenden.

### Frontend

Frontenden findes i:

```text
frontend
```

Alle kald til backenden samles i `frontend/js/api/kinoApi.js`, og hver side har sin egen fil i `frontend/js/views`.

## Databaseændringer

Databaseskemaet oprettes og opdateres automatisk af Hibernate ud fra entiteterne i `model` (`spring.jpa.hibernate.ddl-auto=update`). Det gælder også produktionsdatabasen.

Hvis en ændring påvirker databaseskemaet, skal du:

1. Opdatere den relevante entitet i:

   ```text
   src/main/java/com/kodebutikken/kinoxp/model
   ```

2. Opdatere relevante query-metoder i repository-klasser.

3. Tilføje eller opdatere tests, hvor det er relevant.

4. Opdatere SQL-scriptet til sale, sæder og admin-bruger i [README.md](README.md), hvis `theater`, `seat` eller `employee` ændres.

5. Beskrive databaseændringen tydeligt i pull requesten.

Hibernate tilføjer nye kolonner og tabeller, men sletter eller omdøber aldrig eksisterende. Omdøbte felter giver derfor en ny kolonne, mens den gamle bliver liggende med data. Aftal sådanne ændringer med teamet først.

Runtime-databasen er MySQL, mens H2 bruges til tests. Vær derfor opmærksom på SQL-syntax, der ikke virker på tværs af begge databaser.

## Tests

Kør tests før du opretter en pull request.

På Windows PowerShell:

```powershell
.\mvnw.cmd test
```

På macOS/Linux:

```bash
./mvnw test
```

Tilføj eller opdater tests når du:

- Tilføjer ny forretningslogik
- Ændrer valideringsregler i services
- Ændrer query-metoder i repositories
- Retter en bug, som ikke bør opstå igen

Servicelaget skal have en line coverage på mindst 80 %.

Ved større ændringer bør projektet også bygges lokalt.

På Windows PowerShell:

```powershell
.\mvnw.cmd clean install
```

På macOS/Linux:

```bash
./mvnw clean install
```

## Pull requests

Før du åbner en pull request, skal du sikre at:

- Koden compiler.
- Eksisterende tests er kørt.
- Du har lavet self-review af dine ændringer.
- Debug-output og midlertidige kommentarer er fjernet.
- Dokumentation er opdateret, hvis setup, konfiguration eller adfærd ændres.
- Screenshots er vedhæftet, hvis brugergrænsefladen ændres.
- Det relevante issue er linket, fx med `Closes #issue-number`.

En pull request skal godkendes af mindst én anden udvikler, før den merges til `main`. Beskriv ændringen grundigt, så reviewers hurtigt kan forstå hvad der er ændret og hvorfor.

## Commits

Brug korte og tydelige commit messages, der beskriver ændringen.

Eksempler:

```text
Add ticket creation for reservations
Fix overlapping showings in the same theater
Update README setup instructions
Refactor reservation search
```

## Secrets og konfiguration

Commit aldrig rigtige secrets eller credentials. Projektet bruger miljøvariabler til databasekonfiguration:

- `DEV_DATABASE_URL`
- `DEV_USERNAME`
- `DEV_PASSWORD`
- `PROD_DATABASE_URL`
- `PROD_USERNAME`
- `PROD_PASSWORD`
- `CORS_ALLOWED_ORIGINS`

Produktionssecrets skal håndteres via deploymentmiljøet i Coolify eller GitHub Actions secrets.

## Code quality

Repositoryet bruger Qodana via GitHub Actions. Forsøg at løse advarsler før review, især advarsler om ubrugte imports, død kode, risikable databaseændringer eller maintainability.

## Review forventninger

Reviewers bør kontrollere at:

- Ændringen løser det relevante issue eller user story.
- Koden følger controller/service/repository-strukturen.
- Tests er tilføjet eller opdateret hvor relevant.
- Databaseændringer er dokumenteret i pull requesten.
- Den berørte UI-flow stadig fungerer.
- Der ikke er credentials, debug-output eller irrelevante ændringer med.