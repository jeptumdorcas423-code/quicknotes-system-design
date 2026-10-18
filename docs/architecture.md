# QuickNotes System Architecture

## 1. Overview

QuickNotes is a note-taking application that allows users to create, read, update, delete, search, and organise notes.

The system initially runs on a simple application server and a database. As usage grows, it can introduce a CDN, load balancer, multiple stateless application servers, a cache, database replication, and background workers.

This architecture aims to provide fast responses, reliable data storage, secure access, and the ability to handle increasing traffic without unnecessary complexity.

## 2. Functional Requirements

The system must support the following functions:

1. Users can register and log in securely.
2. Authenticated users can create notes with a required title and an optional body.
3. Users can retrieve their notes and view individual notes.
4. Users can update and delete their own notes.
5. Users can search and filter notes by title, category, or other supported fields.
6. Users can organise notes with tags.
7. The API returns appropriate HTTP status codes and JSON responses.
8. Users can access their notes from different devices after authenticating.
9. Users cannot read, change, or delete another user's private notes.
10. Background tasks, such as sending notifications and generating note exports, can run without unnecessarily delaying the main request.

## 3. Non-Functional Requirements

### Performance

* Aim for a p95 response time below 200 ms for ordinary note-list requests under normal operating conditions.
* Use caching and database indexes to reduce response times and unnecessary database work.
* Serve static files through a CDN to reduce download times for users in different locations.

The p95 target means that 95% of measured requests should complete within the target time. It is a design goal that must be verified through testing, not a guaranteed result.

### Scalability

* Support increasing numbers of users and API requests by adding application servers.
* Keep application servers stateless so any healthy server can handle a request.
* Use a cache and read replicas to reduce the load on the primary database.
* Store lasting application data in a database or appropriate persistent storage rather than relying on an individual server's memory.

### Availability and Reliability

* Aim for 99.9% service availability, subject to the actual service-level objectives and dependencies.
* Run multiple application servers behind a load balancer.
* Use database backups and a tested recovery process.
* Monitor server health and recover from failed components.
* Ensure background jobs can be retried safely when appropriate.

### Security

* Use HTTPS to protect data in transit.
* Authenticate users and authorise access to their notes.
* Validate all user input on the server.
* Use parameterised database queries to prevent SQL injection.
* Store passwords using a suitable password-hashing algorithm, never as plain text.
* Keep access tokens and database credentials out of public source code and logs.

### Maintainability and Monitoring

* Keep the application organised into clear modules.
* Record useful errors and operational events in logs.
* Monitor latency, request volume, error rates, CPU usage, memory usage, and cache hit rates.
* Use alerts to notify operators when reliability or performance deteriorates.

## 4. Load Estimates for One Million Users

The following estimates use the assumptions provided in the system-design lecture notes.

### Assumptions

* Registered users: 1,000,000.
* Daily active users: 20% of registered users.
* Each active user creates 5 notes per day.
* Each active user loads their notes 20 times per day.
* Average stored note size, including additional fields: approximately 500 bytes.
* Seconds per day for rough calculations: approximately 100,000.
* Peak traffic is approximately 5 times the average rate.
* There are 365 days in a year.
* Storage estimates use decimal units: 1,000 bytes = 1 KB, 1,000 KB = 1 MB, and 1,000 MB = 1 GB.

These calculations are estimates intended to guide architectural decisions, not exact production measurements.

### Daily Active Users

Daily active users = 1,000,000 × 20%

Daily active users = 200,000.

### Write Traffic

Each active user creates 5 notes per day.

Daily writes = 200,000 × 5

Daily writes = 1,000,000 notes.

Average writes per second:

1,000,000 ÷ 100,000 ≈ 10 writes/second.

Peak writes per second:

10 × 5 ≈ 50 writes/second.

### Read Traffic

Each active user loads their notes 20 times per day.

Daily reads = 200,000 × 20

Daily reads = 4,000,000 requests.

Average reads per second:

4,000,000 ÷ 100,000 ≈ 40 reads/second.

Peak reads per second:

40 × 5 ≈ 200 reads/second.

### Storage per Year

Daily storage:

1,000,000 notes × 500 bytes = 500,000,000 bytes.

Daily storage ≈ 500 MB.

Yearly storage:

500 MB × 365 = 182,500 MB.

Yearly storage ≈ 182.5 GB, or approximately 180 GB using rough rounding.

This estimate covers note records only. It excludes database indexes, backups, replicated copies, logs, and other operational overhead.

### Summary of Estimates

| Measurement                     | Estimated value |
| ------------------------------- | --------------: |
| Registered users                |       1,000,000 |
| Daily active users              |         200,000 |
| Notes created per day           |       1,000,000 |
| Average writes per second       |              10 |
| Peak writes per second          |              50 |
| Note-list reads per day         |       4,000,000 |
| Average reads per second        |              40 |
| Peak reads per second           |             200 |
| Average note size               |       500 bytes |
| Approximate yearly note storage |          180 GB |

### Is QuickNotes Read-Heavy or Write-Heavy?

QuickNotes is read-heavy under these assumptions.

Daily reads = 4,000,000.

Daily writes = 1,000,000.

Read-to-write ratio = 4:1.

Users load their notes approximately four times as often as they create them. The system should therefore prioritise fast note retrieval with caching, database indexes, and read replicas, while directing writes to the primary database.

## 5. Architecture Diagram

The following diagram shows how the main components work together.

```text
                         +-------------------+
                         |       USERS       |
                         | Browser / Mobile  |
                         +---------+---------+
                                   |
                                   v
                         +-------------------+
                         |        DNS        |
                         | Resolves the name |
                         +-------------------+

    Static-file request
             |
             v
    +-------------------+
    | CDN               |
    | HTML, CSS, JS     |
    +-------------------+


    API requests over HTTPS
             |
             v
    +-------------------+
    |  LOAD BALANCER    |
    | Routes API calls  |
    +---------+---------+
              |
        +-----+------+
        |            |
        v            v
 +--------------+ +--------------+
 | APP SERVER 1 | | APP SERVER 2 |
 | Stateless API| | Stateless API|
 +------+-------+ +------+-------+
        |                |
        +--------+-------+
                 |
       +---------+----------+
       |                    |
       v                    v
 +-------------+    +-----------------+
 | CACHE       |    | PRIMARY DATABASE|
 | Redis       |    | Authoritative   |
 +------+------+    | records/writes  |
        |           +--------+--------+
        |                    |
        |             Replication
        |                    |
        |                    v
        |           +-----------------+
        |           | READ REPLICA     |
        +---------->| Read queries     |
                    +-----------------+

 +--------------+     +------------------+
 | APP SERVERS  | --> | MESSAGE QUEUE    |
 +--------------+     | Pending jobs     |
                      +---------+--------+
                                |
                                v
                      +------------------+
                      | BACKGROUND WORKER|
                      | Exports, emails  |
                      +------------------+
```

The application servers communicate with the cache, primary database, read replica, and message queue as needed. The diagram shows the principal responsibilities rather than every possible network connection.

The CDN serves static front-end files, while authenticated API requests travel through the load balancer to application servers.

## 6. Component Responsibilities

* **Client:** Provides the user interface for creating, viewing, updating, and deleting notes.
* **DNS:** Resolves the application's domain name so clients can find the service.
* **CDN:** Delivers static files from locations closer to users, reducing download time and origin-server traffic.
* **Load balancer:** Distributes API requests across healthy application servers and stops routing requests to unhealthy instances.
* **Application servers:** Authenticate requests, enforce permissions, validate input, run application logic, and coordinate access to storage.
* **Cache:** Holds frequently requested note lists so the application can answer common reads quickly without querying the database every time.
* **Primary database:** Stores the authoritative records for users, notes, tags, and their relationships, and handles writes.
* **Read replica:** Handles suitable read queries using a copy of the primary database's data, reducing read traffic on the primary.
* **Message queue:** Stores background jobs until workers can process them, allowing the application to respond without waiting for slower tasks.
* **Background worker:** Processes queued tasks such as generating exports or sending notifications.
* **Logs, metrics, and alerts:** Help operators identify errors, measure performance, and respond to unhealthy components.

## 7. Request Flow: GET /notes

When a user loads their notes, the following steps occur:

1. The client sends an HTTPS `GET /notes` request with its access token.
2. DNS resolves the application's domain if the address is not already cached.
3. The load balancer forwards the API request to a healthy application server.
4. The application server validates the token and identifies the user.
5. The server checks the cache for that user's note list, using a key such as `notes:user:1`.
6. If the cache contains the data, the server returns it promptly with `200 OK`.
7. If the cache misses, the server queries the database, using the read replica when appropriate and when slightly stale data is acceptable.
8. The server converts the returned records into a JSON response and sends them to the client.
9. The result of the database query is stored in the cache for a defined time-to-live (TTL).
10. The client displays the notes and a success message.

If the read replica is unavailable, the application may fall back to the primary database if it has sufficient capacity and the query is safe to execute there.

### Cache Invalidation

When a user creates, updates, or deletes a note, the application invalidates the corresponding cached note list after the database write succeeds. The next cache miss retrieves fresh data.

## 8. Request Flow: POST /notes

When a user creates a new note, the following steps occur:

1. The client sends `POST /notes` with its access token and a JSON body containing the title and optional body.
2. The load balancer forwards the request to a healthy application server.
3. The application server validates the access token and identifies the note's owner.
4. The server validates the note data, including the requirement that the title is not empty and does not exceed 100 characters.
5. The server writes the new note to the primary database using a parameterised query.
6. If the database write succeeds, the server invalidates the user's cached note list.
7. The server returns `201 Created` with the new note's ID and details.
8. The client displays the new note and a success message.
9. If the operation also requires a background task, such as preparing an export or sending a notification, the server adds a job to the message queue.
10. A worker processes the queued task separately. Temporary job failures can be retried according to the job's retry policy.

The database write happens before the success response, so the application does not claim that a note was saved before receiving confirmation that the write succeeded.

## 9. Scaling Strategy

### Stage 1: Single Server

At launch, the application, API, and database can begin on one machine. This is simple and inexpensive, but it creates a single point of failure and limits capacity to one machine's resources.

### Stage 2: Horizontal Application Scaling

When traffic increases, deploy multiple stateless application servers behind a load balancer. Capacity can grow by adding more instances, and the load balancer can stop routing traffic to unhealthy servers.

### Stage 3: Caching

Introduce an in-memory cache such as Redis for frequently requested note lists. This reduces repeated database queries and can lower response times, while requiring an explicit cache-expiry and invalidation strategy.

### Stage 4: Database Read Replicas

Add a read replica to handle suitable read-only queries. The primary database remains responsible for writes. Replication lag must be considered, particularly when a user expects to see a change immediately.

### Stage 5: Background Processing

Use a queue and worker for tasks that do not need to finish before the client receives its response, such as sending emails and generating exports. This prevents slow tasks from holding up ordinary API requests.

### Further Growth

Monitor traffic, query performance, storage use, and error rates before introducing more complex techniques such as sharding or microservices. A well-organised monolith with a few ordinary application servers may be sufficient at the estimated load.

## 10. Design Trade-Offs

### Trade-Off 1: Cache Speed versus Freshness

A cache reduces database load and makes repeated reads faster. However, cached data can become stale after a note changes.

QuickNotes invalidates the affected user's cache after successful writes and uses a short TTL as an additional safeguard. A read immediately after a write can use the primary database when read-your-writes consistency is required.

### Trade-Off 2: Read Performance versus Replica Consistency

Read replicas distribute database reads and can improve throughput. However, changes may take a short time to replicate.

QuickNotes uses replicas for ordinary note-list requests when slightly stale data is acceptable. Requests that require immediate visibility of a recent update can be directed to the primary database.

### Trade-Off 3: Simplicity versus Scalability

A single-server system is easier to deploy, understand, and maintain. Multiple servers improve capacity and resilience but require load balancing, monitoring, and more complex operations.

QuickNotes should start with a simple, well-structured deployment and introduce additional components as measured demand justifies them.

### Trade-Off 4: Reliability versus Cost

Multiple servers, replicas, backups, and monitoring improve resilience but increase infrastructure and operational costs.

The design should prioritise redundant components for critical paths, while matching the level of redundancy to the required availability target and budget.

## 11. Avoiding Single Points of Failure

A single point of failure is a component whose failure can make an otherwise working system unavailable.

QuickNotes reduces these risks in several ways:

1. Multiple application servers run behind a load balancer, allowing traffic to be directed away from unhealthy instances.
2. Health checks identify unavailable application servers so they can be removed from traffic.
3. The database is backed up regularly, and recovery procedures are tested.
4. A properly configured database failover arrangement can promote a healthy replica if the primary database fails.
5. The cache is treated as a performance optimisation rather than the only copy of user data. The application can fall back to the database when the cache is unavailable, provided the database can handle the additional traffic.
6. The message queue retains pending background work according to its durability settings, and workers can retry failed jobs safely.
7. Logs, metrics, alerts, and health checks help detect failures and shorten recovery time.

A read replica by itself does not guarantee automatic failover. Database promotion, connection management, and recovery procedures must be configured and tested. Similarly, the load balancer, DNS setup, and other critical dependencies need appropriate redundancy for the target availability level.

## 12. Conclusion

QuickNotes can support growth by combining stateless application servers, a load balancer, caching, database read replicas, and background processing.

The estimates suggest an average of approximately 40 reads and 10 writes per second, with peak traffic around 200 reads and 50 writes per second. These figures are manageable for a modest deployment, so the system should begin with a simple architecture and scale based on observed demand.

The design prioritises fast note retrieval while preserving a reliable source of truth in the primary database. Monitoring, backups, redundancy, and explicit recovery plans help keep the application reliable as usage grows.
