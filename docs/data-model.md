# QuickNotes Data Model

## 1. Overview

QuickNotes uses a relational database to store user accounts, notes, and tags. The database maintains relationships between these entities using primary keys and foreign keys.

The four tables are:

* `users`: Stores registered users.
* `notes`: Stores notes created by users.
* `tags`: Stores unique labels used to organise notes.
* `note_tags`: Connects notes to tags through a many-to-many relationship.

## 2. Tables and Columns

### Users

The `users` table stores information about people registered with QuickNotes.

| Column       | Type    | Constraints                 | Description            |
| ------------ | ------- | --------------------------- | ---------------------- |
| `id`         | INTEGER | Primary key, auto-increment | Unique user identifier |
| `name`       | TEXT    | NOT NULL                    | User's name            |
| `email`      | TEXT    | NOT NULL, UNIQUE            | User's email address   |
| `created_at` | TEXT    | Default timestamp           | Account creation time  |

### Notes

The `notes` table stores notes belonging to users.

| Column       | Type    | Constraints                      | Description            |
| ------------ | ------- | -------------------------------- | ---------------------- |
| `id`         | INTEGER | Primary key, auto-increment      | Unique note identifier |
| `user_id`    | INTEGER | NOT NULL, foreign key            | Owner of the note      |
| `title`      | TEXT    | NOT NULL, maximum 100 characters | Note title             |
| `body`       | TEXT    | NOT NULL, default empty string   | Note content           |
| `category`   | TEXT    | NOT NULL, default 'personal'     | Note category          |
| `created_at` | TEXT    | Default timestamp                | Creation time          |
| `updated_at` | TEXT    | Default timestamp                | Last update time       |

The `user_id` foreign key references `users.id`.

### Tags

The `tags` table stores unique labels that can be attached to notes.

| Column       | Type    | Constraints                 | Description           |
| ------------ | ------- | --------------------------- | --------------------- |
| `id`         | INTEGER | Primary key, auto-increment | Unique tag identifier |
| `name`       | TEXT    | NOT NULL, UNIQUE            | Tag name              |
| `created_at` | TEXT    | Default timestamp           | Tag creation time     |

The UNIQUE constraint prevents duplicate tag names.

### Note Tags

The `note_tags` table connects notes to tags.

| Column    | Type    | Constraints                        | Description    |
| --------- | ------- | ---------------------------------- | -------------- |
| `note_id` | INTEGER | Primary key component, foreign key | Connected note |
| `tag_id`  | INTEGER | Primary key component, foreign key | Connected tag  |

The combination of `note_id` and `tag_id` forms a composite primary key. It prevents the same tag from being attached to the same note more than once.

## 3. Relationships

### One-to-many: Users and Notes

One user can create many notes, but each note belongs to one user.

The `notes.user_id` foreign key references `users.id`.

For example, user 1 can own notes 10, 11, and 12 without repeating the user's name and email in every note.

### Many-to-many: Notes and Tags

A note can have multiple tags, and the same tag can be attached to multiple notes.

For example, a note called "Revise HTTP" might have the tags `study` and `urgent`. Another note could also use the `urgent` tag.

The `note_tags` join table represents this relationship using `note_id` and `tag_id`.

A join table is necessary because a relational database should not store multiple tag identifiers in one comma-separated column. Separate relationships make searching, adding, and removing tags easier and help maintain data integrity.

## 4. SQL Table Definitions

The following statements create all four tables in SQLite.

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL
        CHECK (length(trim(title)) BETWEEN 1 AND 100),
    body TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'personal',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE note_tags (
    note_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id)
        REFERENCES notes(id)
        ON DELETE CASCADE,
    FOREIGN KEY (tag_id)
        REFERENCES tags(id)
        ON DELETE CASCADE
);
```

### Important constraints

* `PRIMARY KEY` uniquely identifies a row.
* `FOREIGN KEY` connects related records and prevents invalid references when foreign key enforcement is enabled.
* `NOT NULL` requires a value.
* `UNIQUE` prevents duplicate values in a column.
* `CHECK` enforces the rule that a note title must contain between 1 and 100 non-whitespace characters.
* `DEFAULT` supplies a value when one is not provided.
* `ON DELETE CASCADE` automatically removes dependent notes or tag links when their parent record is deleted.

The application must also validate titles before sending them to the database.

## 5. Example SQL Queries

### Query 1: Retrieve all notes belonging to one user

This query returns user 1's notes, newest first.

```sql
SELECT id, title, body, category, created_at
FROM notes
WHERE user_id = ?
ORDER BY created_at DESC;
```

The `?` is a parameter placeholder. The application supplies the authenticated user's ID separately rather than combining user input directly into the SQL string.

### Query 2: Retrieve notes and their tags

This query uses JOINs to list note titles alongside their tags.

```sql
SELECT notes.title, tags.name AS tag
FROM notes
JOIN note_tags ON note_tags.note_id = notes.id
JOIN tags ON tags.id = note_tags.tag_id
ORDER BY notes.title;
```

The query joins `notes` to `note_tags`, then joins `note_tags` to `tags`.

### Query 3: Count the notes belonging to each user

```sql
SELECT users.id, users.name, COUNT(notes.id) AS note_count
FROM users
LEFT JOIN notes ON notes.user_id = users.id
GROUP BY users.id, users.name
ORDER BY users.name;
```

`COUNT(notes.id)` counts each user's notes. `LEFT JOIN` ensures users with zero notes also appear.

### Query 4: Find all notes tagged "urgent"

```sql
SELECT DISTINCT notes.id, notes.title
FROM notes
JOIN note_tags ON note_tags.note_id = notes.id
JOIN tags ON tags.id = note_tags.tag_id
WHERE tags.name = 'urgent';
```

This query uses two JOIN operations to find notes associated with the `urgent` tag.

### Query 5: Update a note's title

```sql
UPDATE notes
SET title = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ? AND user_id = ?;
```

The application supplies the new title, note ID, and authenticated user's ID as parameters. Including the owner ID prevents a user from updating another user's note.

## 6. Indexing

An index allows the database to locate matching records without always scanning an entire table.

For QuickNotes, an index on the combination of `user_id` and `created_at` is useful because the application frequently retrieves a user's notes in date order.

```sql
CREATE INDEX idx_notes_user_created
ON notes(user_id, created_at DESC);
```

This index can help the database find a user's notes and retrieve them in creation-date order more efficiently.

The trade-off is that indexes use additional storage and must be maintained when records are inserted, updated, or deleted.

Primary keys and UNIQUE constraints already create supporting indexes in SQLite, so additional indexes should be added for demonstrated query needs rather than for every column.

## 7. SQL Versus NoSQL

SQL is a good choice for QuickNotes because users, notes, and tags have clear relationships and predictable structures. A relational database supports JOIN queries, foreign keys, uniqueness constraints, and transactions that help preserve data integrity.

A document-oriented NoSQL database, such as MongoDB or Firestore, could be appropriate if the data structure changed frequently or if the application needed to store highly flexible documents. However, QuickNotes relies on relationships between users, notes, and tags, making a relational database such as PostgreSQL or SQLite a suitable choice.

## 8. Conclusion

The QuickNotes data model separates users, notes, and tags into related tables. Primary keys identify records, foreign keys enforce relationships, and the `note_tags` join table implements the many-to-many relationship between notes and tags.

Constraints, indexes, and parameterised queries help maintain data integrity, improve query performance, and reduce the risk of SQL injection.
