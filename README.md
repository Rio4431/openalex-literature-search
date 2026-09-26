# OpenAlex Literature Search v3

A static web application for exploring literature related to a research topic through the OpenAlex Works API. It helps users review candidate papers using citation counts, publication year, Open Access status, retraction status, abstracts, and other metadata.

## Main Improvements

- Japanese / English UI switching
  - Small two-button language selector in the upper-right corner
  - Switches labels, buttons, dropdown options, placeholders, status messages, search results, and search history
  - Saves the selected language in localStorage

- Cursor-based pagination
  - Previous / Next navigation
  - 25 / 50 / 100 results per page
- Abstract display
  - Reconstructs `abstract_inverted_index` in the browser
  - Abstracts can be expanded for each paper
- Expanded search filters
  - Search scope: title, abstract, and full text / title only / title + abstract / abstract only
  - Publication year From / To
  - Minimum citation count
  - Work type
  - Open Access status
  - Retraction status
  - Abstract availability
  - Author OpenAlex ID
  - Source OpenAlex ID
- Open Access / retraction visualization
  - OA / non-OA badges
  - Retracted / normal badges
  - Retracted works are visually highlighted
- Saved search conditions
  - Saves search conditions to localStorage without the API key
  - Saved conditions can be loaded or deleted
- Search history
  - Stores up to 50 successful searches
  - Restore conditions / rerun search / delete individual entries / clear all history
- Search conditions included in CSV output
  - Saves query, search scope, sort order, page number, year range, and filters
  - Also exports abstract, Open Access status, and retraction status

## Usage

1. Obtain an OpenAlex API key.
2. Start a local HTTP server in this folder.

```bash
python -m http.server 8000
```

3. Open `http://localhost:8000` in a browser.
4. Enter the API key, search query, and any desired filters.
5. Use Previous and Next to move between result pages.
6. Save useful search conditions under a custom name when needed.
7. Export the currently displayed result page as CSV.

## Files

- `index.html` — User interface
- `styles.css` — Styling
- `app.js` — OpenAlex API search, pagination, abstract reconstruction, search history, saved conditions, and CSV export

## Data and Search Behavior

- Standard OpenAlex `search` searches across title, abstract, and full text.
- Title-only, abstract-only, and related search scopes use OpenAlex `.search` filters.
- Cursor pagination allows continued retrieval across large result sets.
- OpenAlex abstracts are returned as `abstract_inverted_index` rather than plain text, so the application reconstructs the word order in the browser.
- Author and source filters use OpenAlex IDs rather than direct author-name or journal-name matching.

## Notes

- The application consists only of static HTML, CSS, and JavaScript. It does not hide the API key on a server.
- If "Save API key in this browser" is enabled, the API key is stored in localStorage.
- Saved search conditions and search history do not include the API key.
- Citation counts from OpenAlex may differ from Google Scholar, Scopus, Web of Science, and other databases.
- CSV export includes only the currently displayed page. Bulk export of all matching results is not implemented.
