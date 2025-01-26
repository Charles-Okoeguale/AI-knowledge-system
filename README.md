## Installation and Setup

To get started with the project, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/Charles-Okoeguale/knowledge-system.git
   cd your-repo-name
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   MONGODB_URI=mongodb://your_mongo_uri
   ```

4. Start the application:
   - For development mode:
     ```bash
     npm run start:dev
     ```
   - For production mode:
     ```bash
     npm run start:prod
     ```

## Running with Docker

To run the application using Docker, follow these steps:

1. Build and run the application using Docker Compose:
   ```bash
   docker-compose up --build
   ```

2. Access the application at `http://localhost:3000`.

## Explanation of Architectural Choice

This project is built using the NestJS framework, which is a progressive Node.js framework for building efficient and scalable server-side applications. The architecture follows the modular design pattern, allowing for better organization of code and separation of concerns. Key architectural choices include:

- **Modularity**: Each feature is encapsulated in its own module, making it easier to manage and scale the application.
- **Dependency Injection**: Leveraging NestJS's built-in dependency injection system to manage service instances and promote loose coupling.
- **MongoDB**: Using MongoDB as the database for its flexibility and scalability, especially for handling document-based data.
- **Monolithic Architecture**: The decision to use a monolithic architecture was made to simplify the development and deployment process. This approach allows for easier management of the codebase, as all components are contained within a single application. It also reduces the complexity of inter-service communication, which can be beneficial for smaller teams or projects in the early stages of development. As the application grows, this architecture can be refactored into microservices if needed.

## API Documentation

### Upload Document
- **Endpoint**: `POST /documents/upload`
- **Description**: Uploads a document and extracts its content. Generates insights for the specific document.  - `documentId`: The ID of the document for which insights are to be generated.
- **Request Body**:
  - `file`: The document file to upload.
  - `metadata`: Additional metadata for the document.


### Query Documents
- **Endpoint**: `POST /query`
- **Description**: Processes a query against the uploaded documents.
- **Request Body**:
  - `query`: The search query string.
  - `filters`: Optional filters for date range, categories, and author.

## Assumptions and Limitations
- The application assumes that the MongoDB instance is running and accessible via the provided URI.
- The OpenAI API key must be valid and have sufficient quota for generating insights.
- The application currently supports PDF and text files for document uploads.
- There may be limitations on the size of documents that can be processed, depending on the OpenAI API constraints.
- The insights generation may not always return results if the document content is insufficient or if the API encounters issues.
