// ============================================
// QUICKNOTES API CLIENT
// ============================================

// API endpoint
const API_URL = "https://jsonplaceholder.typicode.com/posts";

// HTML element references
const loadBtn = document.querySelector("#load-btn");
const statusText = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");
const form = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitBtn = document.querySelector("#submit-btn");

// Track requests currently running
let activeRequests = 0;

// Disable buttons while requests are running
function updateButtonStates() {
  const busy = activeRequests > 0;

  document.querySelectorAll("button").forEach((button) => {
    button.disabled = busy;
  });
}

function beginRequest() {
  activeRequests++;
  updateButtonStates();
}

function finishRequest() {
  activeRequests = Math.max(0, activeRequests - 1);
  updateButtonStates();
}

// Display status messages
function setStatus(message, type = "") {
  statusText.textContent = message;
  statusText.className = type;
}

// ============================================
// REUSABLE REQUEST FUNCTION
// ============================================

async function request(url, options = {}) {
  const response = await fetch(url, options);

  // fetch does not automatically throw for HTTP errors
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response;
}

// ============================================
// DISPLAY NOTES
// ============================================

function showNote(note, prepend = false) {
  // Remove the empty message when a note is added
  const emptyMessage = notesList.querySelector(".empty-state");

  if (emptyMessage) {
    emptyMessage.remove();
  }

  const li = document.createElement("li");
  li.classList.add("note-card");
  li.dataset.id = String(note.id);

  const title = document.createElement("h3");
  title.textContent = note.title || "Untitled note";

  const body = document.createElement("p");
  body.textContent = note.body || "";

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.classList.add("delete-btn");
  deleteBtn.dataset.id = String(note.id);
  deleteBtn.textContent = "Delete";

  li.appendChild(title);
  li.appendChild(body);
  li.appendChild(deleteBtn);

  if (prepend) {
    // Place newly created notes at the top
    notesList.prepend(li);
  } else {
    notesList.appendChild(li);
  }

  updateButtonStates();
}

function showEmptyState() {
  if (notesList.querySelector(".empty-state")) {
    return;
  }

  const li = document.createElement("li");
  li.classList.add("empty-state");
  li.textContent = "No notes yet. Create your first note!";

  notesList.appendChild(li);
}

// ============================================
// GET: LOAD TEN NOTES
// ============================================

async function loadNotes() {
  beginRequest();

  setStatus("Loading notes...", "loading");
  notesList.replaceChildren();

  try {
    const response = await request(`${API_URL}?_limit=10`);
    const notes = await response.json();

    if (notes.length === 0) {
      showEmptyState();
      setStatus("No notes were found.", "success");
      return;
    }

    notes.forEach((note) => showNote(note));

    setStatus(
      `Loaded ${notes.length} notes from the server.`,
      "success"
    );
  } catch (error) {
    setStatus(
      "Could not load notes. Please try again.",
      "error"
    );

    console.error("Load notes error:", error.message);
  } finally {
    finishRequest();
  }
}

// Connect the Load Notes button
loadBtn.addEventListener("click", loadNotes);

// ============================================
// POST: CREATE A NOTE
// ============================================

async function createNote(title, body) {
  beginRequest();

  setStatus("Creating note...", "loading");

  try {
    const response = await request(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: title,
        body: body,
        userId: 1
      })
    });

    const created = await response.json();

    // Display the created note at the top of the list
    showNote(created, true);

    setStatus(
      `Note created (status ${response.status}, id ${created.id}).`,
      "success"
    );

    // Clear the form after successful creation
    form.reset();
  } catch (error) {
    setStatus(
      "Could not create the note. Please try again.",
      "error"
    );

    console.error("Create note error:", error.message);
  } finally {
    finishRequest();
  }
}

// Handle the create-note form
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  // A title is required
  if (!title) {
    setStatus("Please enter a note title.", "error");
    titleInput.focus();
    return;
  }

  // Limit the title to 100 characters
  if (title.length > 100) {
    setStatus(
      "The title must not exceed 100 characters.",
      "error"
    );

    titleInput.focus();
    return;
  }

  await createNote(title, body);
});

// ============================================
// DELETE: REMOVE A NOTE
// ============================================

async function deleteNote(id, noteElement) {
  beginRequest();

  setStatus("Deleting note...", "loading");

  try {
    const response = await request(`${API_URL}/${id}`, {
      method: "DELETE"
    });

    // JSONPlaceholder simulates deletion but does not permanently
    // save changes. Remove the note from this page after success.
    // The note may reappear when the list is loaded again.
    noteElement.remove();

    if (!notesList.querySelector(".note-card")) {
      showEmptyState();
    }

    setStatus(
      `Note deleted (status ${response.status}).`,
      "success"
    );
  } catch (error) {
    setStatus(
      "Could not delete the note. Please try again.",
      "error"
    );

    console.error("Delete note error:", error.message);
  } finally {
    finishRequest();
  }
}

// Handle Delete button clicks
notesList.addEventListener("click", async (event) => {
  const deleteBtn = event.target.closest(".delete-btn");

  if (!deleteBtn) {
    return;
  }

  const noteElement = deleteBtn.closest(".note-card");

  if (!noteElement) {
    return;
  }

  await deleteNote(deleteBtn.dataset.id, noteElement);
});