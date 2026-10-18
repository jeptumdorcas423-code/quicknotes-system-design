// API endpoint
const API_URL = "https://jsonplaceholder.typicode.com/posts";

// HTML element references
const loadBtn = document.querySelector("#load-btn");
const statusText = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");

// Reusable function for sending HTTP requests
async function request(url, options = {}) {
  const response = await fetch(url, options);

  // fetch does not automatically throw for HTTP errors such as 404
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response;
}

// Display one note on the page
function showNote(note) {
  const li = document.createElement("li");
  li.classList.add("note-card");

  const title = document.createElement("h3");
  title.textContent = note.title || "Untitled note";

  const body = document.createElement("p");
  body.textContent = note.body || "";

  li.appendChild(title);
  li.appendChild(body);

  notesList.appendChild(li);
}

// Display a message when there are no notes
function showEmptyState() {
  const li = document.createElement("li");
  li.textContent = "No notes yet. Load some notes or create one!";
  notesList.appendChild(li);
}

// GET: Load ten notes from the server
async function loadNotes() {
  statusText.textContent = "Loading notes...";
  statusText.className = "loading";
  loadBtn.disabled = true;
  notesList.replaceChildren();

  try {
    const response = await request(`${API_URL}?_limit=10`);
    const notes = await response.json();

    if (notes.length === 0) {
      showEmptyState();
      statusText.textContent = "No notes were found.";
      statusText.className = "success";
      return;
    }

    notes.forEach(showNote);

    statusText.textContent =
      `Loaded ${notes.length} notes from the server.`;
    statusText.className = "success";

  } catch (error) {
    statusText.textContent = "Could not load notes. Please try again.";
    statusText.className = "error";

    console.error("Error loading notes:", error.message);

  } finally {
    loadBtn.disabled = false;
  }
}

// Connect the Load Notes button to the function
loadBtn.addEventListener("click", loadNotes);