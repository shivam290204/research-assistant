# Research Assistant

Research Assistant is a two-part project:

- A Spring Boot backend that sends selected text to the Gemini API and returns processed results.
- A Chrome extension side panel UI that lets you run actions on selected web text.

## Project Structure

- `backend/research-assistant`: Java Spring Boot backend
- `Extension`: Chrome extension (Manifest V3)

## Features

- Summarize selected text
- Suggest related topics
- Translate text to selected language
- Paraphrase/rewrite text
- Generate a short quiz
- Save local research notes in extension storage

## Prerequisites

- Java 21
- Maven (or use `mvnw` wrapper included in project)
- Google Gemini API key
- Google Chrome (or Chromium-based browser supporting side panel)

## Backend Setup

1. Open a terminal in the backend folder:

```powershell
cd backend/research-assistant
```

2. Set your Gemini API key environment variable:

```powershell
$env:GEMINI_KEY="your_api_key_here"
```

3. Start the backend:

```powershell
./mvnw spring-boot:run
```

The backend runs on `http://localhost:8080` by default.

## Extension Setup (Load Unpacked)

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `Extension` folder from this repository
5. Click the extension icon (or action button) to open the side panel

## How To Use

1. Open any webpage
2. Select text on the page
3. In the extension side panel, choose an operation:
   - Summarize
   - Suggest Topics
   - Rewrite
   - Generate Quiz
   - Translate (choose target language first)
4. View processed output in the results area
5. Optionally save notes in the notes section

## API Endpoint

- `POST /api/research/process`

Request body:

```json
{
  "content": "Text to process",
  "operation": "summarize",
  "language": "English"
}
```

- `operation` supported values: `summarize`, `suggest`, `translate`, `paraphrase`, `quiz`
- `language` is only used for `translate`

## Configuration

Backend config is in:

- `backend/research-assistant/src/main/resources/application.properties`

Current values:

- `gemini.api.url` points to Gemini generateContent endpoint
- `gemini.api.key` is read from `${GEMINI_KEY}`

## Notes

- Ensure the backend is running before using extension actions.
- Extension currently calls `http://localhost:8080/api/research/process` directly.
- CORS is enabled in the backend controller for all origins.
