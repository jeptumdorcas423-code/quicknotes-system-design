# QuickNotes System Design

## Project Description

QuickNotes is a note-taking application that demonstrates how a web client communicates with a REST API. Users can load notes, create new notes, and delete notes through an interactive webpage.

This project uses HTML, CSS, and JavaScript for the front end and JSONPlaceholder as a practice API. It also includes documentation describing how a real QuickNotes backend, database, and scalable architecture could be designed.

The project demonstrates API requests, JSON data, error handling, input validation, relational database design, REST endpoint design, and system scaling.

## Features

* Load ten notes from the API using GET.
* Create a note using POST.
* Delete a note using DELETE.
* Display loading, success, error, and empty states.
* Validate that a note title is required and does not exceed 100 characters.
* Disable buttons while requests are running.
* Display note text safely using `textContent`.
* Document the proposed REST API, database model, and system architecture.

## Technologies Used

* **HTML5:** Provides the application structure.
* **CSS3:** Styles the interface and status messages.
* **JavaScript:** Handles user interaction and asynchronous API requests.
* **Fetch API:** Sends HTTP requests to the practice API.
* **JSONPlaceholder:** Simulates REST API operations for testing.
* **Markdown:** Documents API design, data modelling, and architecture.
* **Git and GitHub:** Track project history and share the source code.

## Project Structure

```text
quicknotes-system-design/
├── index.html
├── api.js
├── style.css
├── README.md
└── docs/
    ├── api-design.md
    ├── data-model.md
    └── architecture.md
```

## How to Run the API Client

1. Clone or download this repository.
2. Open the project folder in Visual Studio Code.
3. Open `index.html` in a browser, or serve the folder using a local static web server.
4. Make sure the browser has internet access.
5. Click **Load notes from server** to retrieve ten notes.
6. Enter a title and, optionally, a body, then select **Create note**.
7. Select **Delete** next to a note to send a deletion request.

For a local server, you can use the VS Code Live Server extension if it is installed.

The application does not require a separate backend server to run because it communicates with JSONPlaceholder.

### Important Note About JSONPlaceholder

JSONPlaceholder is a practice API, not a permanent database for this project. It simulates POST and DELETE requests but does not permanently save the changes.

A created note can appear in the current page after the API responds successfully, and a deleted note can disappear from the displayed list. However, those simulated changes may not remain when the application is reloaded.

The design documents describe how a real QuickNotes backend could provide persistent storage, authentication, and access control.

## Documentation

The `docs` folder contains the three system design documents:

* [API Design](docs/api-design.md) — Describes the proposed REST endpoints, HTTP methods, request and response examples, and error status codes.
* [Data Model](docs/data-model.md) — Describes the users, notes, tags, and note_tags tables, their relationships, SQL queries, indexes, and database choice.
* [Architecture](docs/architecture.md) — Describes functional and non-functional requirements, load estimates, system components, request flows, scaling strategies, and design trade-offs.

## What I Learned

1. **Working with REST APIs:** I learned how to use GET, POST, and DELETE requests with JavaScript's Fetch API and how to check HTTP responses for errors.
2. **Handling asynchronous operations:** I learned to use `async` and `await`, together with `try`, `catch`, and `finally`, to manage loading states, successful requests, and failures.
3. **Validating and displaying user input:** I learned to validate form fields and use `textContent` to display note text safely.
4. **Database design:** I learned how relational database tables use primary keys, foreign keys, and join tables to represent relationships between users, notes, and tags.
5. **API documentation:** I learned to describe REST endpoints, request bodies, response bodies, and appropriate HTTP status codes.
6. **System design and scaling:** I learned how caching, load balancing, read replicas, content delivery networks, and background workers can help an application handle increasing traffic.
7. **Version control:** I practised using Git commits to organise project changes and GitHub to store and share the project.

## Conclusion

This project combines a working API client with documentation for a proposed production-ready QuickNotes service. It demonstrates the foundations of API integration, database design, and system architecture while recognising the difference between a simulated practice API and a real backend with persistent storage.
