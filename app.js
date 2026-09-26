const OPENALEX_WORKS_ENDPOINT = 'https://api.openalex.org/works';
const API_KEY_STORAGE_KEY = 'openalex_api_key';
const SAVED_SEARCHES_KEY = 'openalex_saved_searches_v2';
const SEARCH_HISTORY_KEY = 'openalex_search_history_v2';
const LANGUAGE_STORAGE_KEY = 'openalex_ui_language_v3';
const MAX_SAVED_SEARCHES = 30;
const MAX_HISTORY = 50;

const form = document.getElementById('searchForm');
const apiKeyInput = document.getElementById('apiKey');
const queryInput = document.getElementById('query');
const searchScopeInput = document.getElementById('searchScope');
const perPageInput = document.getElementById('perPage');
const sortInput = document.getElementById('sort');
const yearFromInput = document.getElementById('yearFrom');
const yearToInput = document.getElementById('yearTo');
const minCitationsInput = document.getElementById('minCitations');
const workTypeInput = document.getElementById('workType');
const oaFilterInput = document.getElementById('oaFilter');
const retractedFilterInput = document.getElementById('retractedFilter');
const abstractFilterInput = document.getElementById('abstractFilter');
const authorIdInput = document.getElementById('authorId');
const sourceIdInput = document.getElementById('sourceId');
const saveKeyInput = document.getElementById('saveKey');
const statusEl = document.getElementById('status');
const metaEl = document.getElementById('meta');
const pageMetaEl = document.getElementById('pageMeta');
const resultsBody = document.getElementById('resultsBody');
const searchButton = document.getElementById('searchButton');
const downloadCsvButton = document.getElementById('downloadCsvButton');
const clearButton = document.getElementById('clearButton');
const prevPageButton = document.getElementById('prevPageButton');
const nextPageButton = document.getElementById('nextPageButton');
const pageNumberEl = document.getElementById('pageNumber');
const savedSearchNameInput = document.getElementById('savedSearchName');
const savedSearchSelect = document.getElementById('savedSearchSelect');
const saveSearchButton = document.getElementById('saveSearchButton');
const loadSearchButton = document.getElementById('loadSearchButton');
const deleteSearchButton = document.getElementById('deleteSearchButton');
const historyList = document.getElementById('historyList');
const clearHistoryButton = document.getElementById('clearHistoryButton');
const langJaBtn = document.getElementById('langJaBtn');
const langEnBtn = document.getElementById('langEnBtn');

let currentResults = [];
let activeSearchParams = null;
let cursorStack = ['*'];
let cursorIndex = 0;
let nextCursor = null;
let currentTotalCount = null;
let currentResponseTime = null;
let uiLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'en' ? 'en' : 'ja';
let statusState = { key: 'enterConditions', type: '', vars: {} };
let resultsEmptyKey = 'noResultsYet';
let currentLoading = false;

const I18N = {
  ja: {
    pageTitle: 'OpenAlex 文献探索・被引用数検索', languageAria: '表示言語',
    appTitle: '文献探索・被引用数検索',
    lead: '検索ワードと条件でOpenAlex Worksを絞り込み、被引用数・出版年・OA・撤回情報・抄録を確認しながら文献候補を探索できます。',
    searchConditions: '検索条件', searchHint: 'APIキー以外の検索条件は保存できます。',
    apiKey: 'OpenAlex APIキー', apiKeyPlaceholder: '例: oa_...', query: '検索ワード', queryPlaceholder: '例: machine learning',
    searchScope: '検索範囲', scopeAll: 'タイトル・抄録・全文', scopeTitle: 'タイトルのみ', scopeTitleAbstract: 'タイトル＋抄録', scopeAbstract: '抄録のみ',
    perPage: '1ページの取得件数', sort: '並び順', sortCitations: '被引用数 降順', sortDate: '出版日 新しい順', sortRelevance: '関連度順',
    yearFrom: '出版年 From', yearTo: '出版年 To', yearFromPlaceholder: '例: 2020', yearToPlaceholder: '例: 2025',
    minCitations: '最低被引用数', minCitationsPlaceholder: '例: 10', workType: '論文種別', workTypePlaceholder: '例: article（空欄=すべて）',
    openAccess: 'Open Access', all: 'すべて', oaOnly: 'OAのみ', nonOaOnly: '非OAのみ', retractedStatus: '撤回状態', excludeRetracted: '撤回論文を除外', retractedOnly: '撤回論文のみ',
    abstractLabel: '抄録', abstractAvailable: '抄録あり', abstractUnavailable: '抄録なし',
    authorId: '著者 OpenAlex ID', authorIdPlaceholder: '例: A5023888391（任意）', sourceId: '掲載先 OpenAlex ID', sourceIdPlaceholder: '例: S137773608（任意）',
    saveApiKey: 'このブラウザにAPIキーを保存する', searchButton: '検索する', searchingButton: '検索中...', downloadCsv: '現在ページをCSV保存', clearInputs: '入力をクリア',
    savedHeading: '検索条件の保存', savedHint: 'APIキーは保存条件には含めません。', savedName: '保存名', savedNamePlaceholder: '例: AD RNA-seq 2020-2026', savedConditions: '保存済み条件',
    noSavedConditions: '保存済み条件なし', chooseSavedConditions: '保存済み条件を選択', saveCurrentConditions: '現在条件を保存', loadButton: '読み込む', deleteButton: '削除',
    enterConditions: '検索条件を入力してください。', resultsHeading: '検索結果', resultsHint: '抄録は「抄録を表示」から展開できます。OA・撤回状態も一覧で確認できます。',
    paginationAria: '検索結果ページ移動', previous: '前へ', next: '次へ', pageNumber: '{page}ページ目',
    citationCount: '被引用数', year: '年', titleAbstract: 'タイトル / 抄録', authors: '著者', source: '掲載先', type: '種別', retracted: '撤回',
    historyHeading: '検索履歴', historyHint: '成功した検索条件をこのブラウザに最大50件保存します。APIキーは保存しません。', clearHistory: '履歴をすべて削除',
    footer: 'データソース: OpenAlex Works API。被引用数はOpenAlexのメタデータに基づくため、Google Scholar、Web of Science、Scopus、Semantic Scholarなどと一致しない場合があります。',
    apiKeyRequired: 'OpenAlex APIキーを入力してください。', queryRequired: '検索ワードを入力してください。', yearOrderInvalid: '出版年のFromはTo以下にしてください。',
    minCitationsInvalid: '最低被引用数は0以上にしてください。', authorIdInvalid: '著者OpenAlex IDは A から始まるIDを入力してください。', sourceIdInvalid: '掲載先OpenAlex IDは S から始まるIDを入力してください。',
    fetching: 'OpenAlex APIから取得中です。', searching: '検索中です。', shown: '{count}件を表示しました。', resultsUnavailable: '検索結果を表示できませんでした。', unknownError: '不明なエラーが発生しました。',
    hitMeta: 'OpenAlex推定ヒット件数: {total}件 / API応答時間: {ms} ms', pageRange: '表示範囲: {start}–{end} / ページ {page}', unknown: '不明',
    api403: 'APIキーが無効、未入力、または権限不足の可能性があります。', api403Detail: 'APIキーが無効、未入力、または権限不足の可能性があります。 詳細: {detail}',
    api429: 'OpenAlex APIのレート制限に達しました。時間を置いて再試行してください。', api429Detail: 'OpenAlex APIのレート制限に達しました。時間を置いて再試行してください。 詳細: {detail}',
    api400: '検索条件がOpenAlex APIに受け付けられませんでした。', api400Detail: '検索条件がOpenAlex APIに受け付けられませんでした。 詳細: {detail}',
    apiGeneric: 'OpenAlex APIエラーが発生しました。HTTP {status}', apiGenericDetail: 'OpenAlex APIエラーが発生しました。HTTP {status}: {detail}',
    titleUnknown: 'タイトル不明', noMatching: '該当する文献は見つかりませんでした。', nonOA: '非OA', retractedBadge: '撤回', normal: '通常', showAbstract: '抄録を表示', noAbstract: '抄録なし', none: 'なし', noResultsYet: 'まだ検索結果はありません。',
    saveQueryFirst: '保存する前に検索ワードを入力してください。', savedSearchSaved: '検索条件「{name}」を保存しました。', chooseSavedToLoad: '読み込む保存条件を選択してください。', savedSearchLoaded: '検索条件「{name}」を読み込みました。',
    chooseSavedToDelete: '削除する保存条件を選択してください。', savedSearchDeleted: '検索条件「{name}」を削除しました。', savedSearchDeletedGeneric: '保存条件を削除しました。',
    historyEmpty: '検索履歴はまだありません。', queryMissing: '検索語なし', restoreConditions: '条件を復元', rerun: '再検索', historyDeletedOne: '選択した検索履歴を削除しました。', historyRestored: '検索履歴の条件を復元しました。', historyCleared: '検索履歴を削除しました。',
    summaryYear: '年: {from}–{to}', summaryType: '種別: {type}', summaryCitations: '引用≥{count}', summaryOaOnly: 'OAのみ', summaryNonOaOnly: '非OAのみ', summaryRetractedExcluded: '撤回除外', summaryRetractedOnly: '撤回のみ', summarySort: '並び: {sort}',
    sortCitationsShort: '被引用数', sortDateShort: '出版日', sortRelevanceShort: '関連度'
  },
  en: {
    pageTitle: 'OpenAlex Literature Search', languageAria: 'Display language',
    appTitle: 'Literature Discovery & Citation Search',
    lead: 'Search and filter OpenAlex Works, then review citation counts, publication year, open-access status, retraction status, and abstracts to identify relevant literature.',
    searchConditions: 'Search criteria', searchHint: 'Search criteria except the API key can be saved.',
    apiKey: 'OpenAlex API key', apiKeyPlaceholder: 'e.g. oa_...', query: 'Search query', queryPlaceholder: 'e.g. machine learning',
    searchScope: 'Search scope', scopeAll: 'Title, abstract, and full text', scopeTitle: 'Title only', scopeTitleAbstract: 'Title + abstract', scopeAbstract: 'Abstract only',
    perPage: 'Results per page', sort: 'Sort by', sortCitations: 'Citation count — descending', sortDate: 'Publication date — newest first', sortRelevance: 'Relevance',
    yearFrom: 'Publication year From', yearTo: 'Publication year To', yearFromPlaceholder: 'e.g. 2020', yearToPlaceholder: 'e.g. 2025',
    minCitations: 'Minimum citation count', minCitationsPlaceholder: 'e.g. 10', workType: 'Work type', workTypePlaceholder: 'e.g. article (blank = all)',
    openAccess: 'Open Access', all: 'All', oaOnly: 'Open Access only', nonOaOnly: 'Non-OA only', retractedStatus: 'Retraction status', excludeRetracted: 'Exclude retracted works', retractedOnly: 'Retracted works only',
    abstractLabel: 'Abstract', abstractAvailable: 'Has abstract', abstractUnavailable: 'No abstract',
    authorId: 'Author OpenAlex ID', authorIdPlaceholder: 'e.g. A5023888391 (optional)', sourceId: 'Source OpenAlex ID', sourceIdPlaceholder: 'e.g. S137773608 (optional)',
    saveApiKey: 'Save API key in this browser', searchButton: 'Search', searchingButton: 'Searching...', downloadCsv: 'Save current page as CSV', clearInputs: 'Clear inputs',
    savedHeading: 'Saved search criteria', savedHint: 'The API key is not included in saved criteria.', savedName: 'Saved search name', savedNamePlaceholder: 'e.g. AD RNA-seq 2020-2026', savedConditions: 'Saved criteria',
    noSavedConditions: 'No saved criteria', chooseSavedConditions: 'Select saved criteria', saveCurrentConditions: 'Save current criteria', loadButton: 'Load', deleteButton: 'Delete',
    enterConditions: 'Enter search criteria.', resultsHeading: 'Search results', resultsHint: 'Expand an abstract with “Show abstract.” Open-access and retraction status are also shown in the table.',
    paginationAria: 'Search result pagination', previous: 'Previous', next: 'Next', pageNumber: 'Page {page}',
    citationCount: 'Citations', year: 'Year', titleAbstract: 'Title / Abstract', authors: 'Authors', source: 'Source', type: 'Type', retracted: 'Retracted',
    historyHeading: 'Search history', historyHint: 'Up to 50 successful searches are stored in this browser. The API key is not stored in history.', clearHistory: 'Delete all history',
    footer: 'Data source: OpenAlex Works API. Citation counts are OpenAlex metadata and may differ from Google Scholar, Web of Science, Scopus, or Semantic Scholar.',
    apiKeyRequired: 'Enter your OpenAlex API key.', queryRequired: 'Enter a search query.', yearOrderInvalid: 'Publication year From must be less than or equal to To.',
    minCitationsInvalid: 'Minimum citation count must be 0 or greater.', authorIdInvalid: 'Enter an Author OpenAlex ID beginning with A.', sourceIdInvalid: 'Enter a Source OpenAlex ID beginning with S.',
    fetching: 'Retrieving data from the OpenAlex API.', searching: 'Searching...', shown: 'Showing {count} result(s).', resultsUnavailable: 'Search results could not be displayed.', unknownError: 'An unknown error occurred.',
    hitMeta: 'Estimated OpenAlex matches: {total} / API response time: {ms} ms', pageRange: 'Showing: {start}–{end} / Page {page}', unknown: 'Unknown',
    api403: 'The API key may be invalid, missing, or lack permission.', api403Detail: 'The API key may be invalid, missing, or lack permission. Details: {detail}',
    api429: 'The OpenAlex API rate limit has been reached. Wait and try again.', api429Detail: 'The OpenAlex API rate limit has been reached. Wait and try again. Details: {detail}',
    api400: 'The OpenAlex API rejected the search criteria.', api400Detail: 'The OpenAlex API rejected the search criteria. Details: {detail}',
    apiGeneric: 'OpenAlex API error. HTTP {status}', apiGenericDetail: 'OpenAlex API error. HTTP {status}: {detail}',
    titleUnknown: 'Title unavailable', noMatching: 'No matching literature was found.', nonOA: 'Non-OA', retractedBadge: 'Retracted', normal: 'Not retracted', showAbstract: 'Show abstract', noAbstract: 'No abstract', none: 'None', noResultsYet: 'No search results yet.',
    saveQueryFirst: 'Enter a search query before saving the criteria.', savedSearchSaved: 'Saved search criteria “{name}”.', chooseSavedToLoad: 'Select saved criteria to load.', savedSearchLoaded: 'Loaded search criteria “{name}”.',
    chooseSavedToDelete: 'Select saved criteria to delete.', savedSearchDeleted: 'Deleted search criteria “{name}”.', savedSearchDeletedGeneric: 'Deleted the saved criteria.',
    historyEmpty: 'No search history yet.', queryMissing: 'No query', restoreConditions: 'Restore criteria', rerun: 'Search again', historyDeletedOne: 'Deleted the selected search history entry.', historyRestored: 'Restored the search criteria from history.', historyCleared: 'Deleted the search history.',
    summaryYear: 'Year: {from}–{to}', summaryType: 'Type: {type}', summaryCitations: 'Citations ≥ {count}', summaryOaOnly: 'Open Access only', summaryNonOaOnly: 'Non-OA only', summaryRetractedExcluded: 'Retracted excluded', summaryRetractedOnly: 'Retracted only', summarySort: 'Sort: {sort}',
    sortCitationsShort: 'Citations', sortDateShort: 'Publication date', sortRelevanceShort: 'Relevance'
  }
};

function tr(key, vars = {}) {
  let text = I18N[uiLanguage]?.[key] ?? I18N.ja[key] ?? key;
  for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, String(value));
  return text;
}

function renderStatus() {
  statusEl.className = statusState.type === 'error' ? 'status-error' : statusState.type === 'success' ? 'status-success' : '';
  statusEl.textContent = tr(statusState.key, statusState.vars);
}

function renderLanguage() {
  document.documentElement.lang = uiLanguage;
  document.title = tr('pageTitle');
  langJaBtn.classList.toggle('active', uiLanguage === 'ja');
  langEnBtn.classList.toggle('active', uiLanguage === 'en');
  langJaBtn.setAttribute('aria-pressed', uiLanguage === 'ja' ? 'true' : 'false');
  langEnBtn.setAttribute('aria-pressed', uiLanguage === 'en' ? 'true' : 'false');

  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = tr(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = tr(el.dataset.i18nPlaceholder); });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => { el.setAttribute('aria-label', tr(el.dataset.i18nAriaLabel)); });

  renderStatus();
  updatePagination();
  updateMeta();
  renderSavedSearches();
  renderHistory();
  if (currentResults.length) renderResults(currentResults); else renderEmpty(resultsEmptyKey);
  setLoading(currentLoading);
}

function setLanguage(language) {
  uiLanguage = language === 'en' ? 'en' : 'ja';
  localStorage.setItem(LANGUAGE_STORAGE_KEY, uiLanguage);
  renderLanguage();
}

init();

function init() {
  const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
  if (savedKey) {
    apiKeyInput.value = savedKey;
    saveKeyInput.checked = true;
  }

  langJaBtn.addEventListener('click', () => setLanguage('ja'));
  langEnBtn.addEventListener('click', () => setLanguage('en'));
  form.addEventListener('submit', handleSearch);
  downloadCsvButton.addEventListener('click', downloadCsv);
  clearButton.addEventListener('click', clearInputs);
  prevPageButton.addEventListener('click', goToPreviousPage);
  nextPageButton.addEventListener('click', goToNextPage);
  saveSearchButton.addEventListener('click', saveCurrentSearch);
  loadSearchButton.addEventListener('click', loadSelectedSavedSearch);
  deleteSearchButton.addEventListener('click', deleteSelectedSavedSearch);
  clearHistoryButton.addEventListener('click', clearHistory);

  renderSavedSearches();
  renderHistory();
  updatePagination();
  renderLanguage();
}

async function handleSearch(event) {
  event.preventDefault();
  const params = collectSearchParams();
  const validationError = validateSearchParams(params);
  if (validationError) {
    setStatus(validationError, 'error');
    return;
  }

  persistApiKeyPreference();
  activeSearchParams = params;
  cursorStack = ['*'];
  cursorIndex = 0;
  nextCursor = null;
  await fetchPage({ cursor: '*', recordHistory: true });
}

function collectSearchParams() {
  return {
    query: queryInput.value.trim(),
    searchScope: searchScopeInput.value,
    perPage: Number(perPageInput.value),
    sort: sortInput.value,
    yearFrom: yearFromInput.value.trim(),
    yearTo: yearToInput.value.trim(),
    minCitations: minCitationsInput.value.trim(),
    workType: workTypeInput.value.trim(),
    oaFilter: oaFilterInput.value,
    retractedFilter: retractedFilterInput.value,
    abstractFilter: abstractFilterInput.value,
    authorId: normalizeOpenAlexEntityId(authorIdInput.value.trim(), 'A'),
    sourceId: normalizeOpenAlexEntityId(sourceIdInput.value.trim(), 'S')
  };
}

function validateSearchParams(params) {
  if (!apiKeyInput.value.trim()) return 'apiKeyRequired';
  if (!params.query) return 'queryRequired';
  if (params.yearFrom && params.yearTo && Number(params.yearFrom) > Number(params.yearTo)) {
    return 'yearOrderInvalid';
  }
  if (params.minCitations && Number(params.minCitations) < 0) {
    return 'minCitationsInvalid';
  }
  const rawAuthor = authorIdInput.value.trim();
  if (rawAuthor && !/^A\d+$/i.test(params.authorId)) {
    return 'authorIdInvalid';
  }
  const rawSource = sourceIdInput.value.trim();
  if (rawSource && !/^S\d+$/i.test(params.sourceId)) {
    return 'sourceIdInvalid';
  }
  return '';
}

function normalizeOpenAlexEntityId(value, prefix) {
  if (!value) return '';
  const trimmed = value.replace(/^https?:\/\/openalex\.org\//i, '').trim();
  return trimmed.toUpperCase().startsWith(prefix) ? trimmed.toUpperCase() : trimmed;
}

function persistApiKeyPreference() {
  const apiKey = apiKeyInput.value.trim();
  if (saveKeyInput.checked) localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  else localStorage.removeItem(API_KEY_STORAGE_KEY);
}

async function fetchPage({ cursor, recordHistory = false }) {
  if (!activeSearchParams) return;

  setLoading(true);
  setStatus('fetching', '');
  renderEmpty('searching');
  downloadCsvButton.disabled = true;
  prevPageButton.disabled = true;
  nextPageButton.disabled = true;

  try {
    const url = buildOpenAlexUrl(activeSearchParams, apiKeyInput.value.trim(), cursor);
    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    const payload = await parseJsonResponse(response);

    if (!response.ok) throw toOpenAlexErrorState(response.status, payload);

    currentResults = normalizeWorks(payload.results || []);
    nextCursor = payload.meta?.next_cursor || null;
    currentTotalCount = payload.meta?.count ?? null;
    currentResponseTime = payload.meta?.db_response_time_ms ?? null;

    renderResults(currentResults);
    downloadCsvButton.disabled = currentResults.length === 0;
    updateMeta();
    updatePagination();
    setStatus('shown', 'success', { count: currentResults.length });

    if (recordHistory) addSearchHistory(activeSearchParams);
  } catch (error) {
    currentResults = [];
    nextCursor = null;
    renderEmpty('resultsUnavailable');
    downloadCsvButton.disabled = true;
    if (error?.i18nKey) setStatus(error.i18nKey, 'error', error.vars || {});
    else setStatus('unknownError', 'error');
    updatePagination();
  } finally {
    setLoading(false);
  }
}

function buildOpenAlexUrl(params, apiKey, cursor) {
  const url = new URL(OPENALEX_WORKS_ENDPOINT);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('sort', params.sort);
  url.searchParams.set('per_page', String(params.perPage));
  url.searchParams.set('cursor', cursor || '*');
  url.searchParams.set('select', [
    'id',
    'doi',
    'title',
    'display_name',
    'publication_year',
    'publication_date',
    'type',
    'cited_by_count',
    'authorships',
    'primary_location',
    'open_access',
    'is_retracted',
    'abstract_inverted_index'
  ].join(','));

  const filters = [];

  if (params.searchScope === 'all') {
    url.searchParams.set('search', params.query);
  } else {
    const searchField = {
      title: 'title.search',
      title_abstract: 'title_and_abstract.search',
      abstract: 'abstract.search'
    }[params.searchScope];
    if (searchField) filters.push(`${searchField}:${params.query}`);
  }

  if (params.yearFrom) filters.push(`publication_year:>${Number(params.yearFrom) - 1}`);
  if (params.yearTo) filters.push(`publication_year:<${Number(params.yearTo) + 1}`);
  if (params.minCitations) filters.push(`cited_by_count:>${Math.max(0, Number(params.minCitations) - 1)}`);
  if (params.workType) filters.push(`type:${params.workType}`);
  if (params.oaFilter !== 'any') filters.push(`open_access.is_oa:${params.oaFilter}`);
  if (params.retractedFilter !== 'any') filters.push(`is_retracted:${params.retractedFilter}`);
  if (params.abstractFilter !== 'any') filters.push(`has_abstract:${params.abstractFilter}`);
  if (params.authorId) filters.push(`author.id:${params.authorId}`);
  if (params.sourceId) filters.push(`primary_location.source.id:${params.sourceId}`);
  if (filters.length) url.searchParams.set('filter', filters.join(','));

  return url;
}

async function goToNextPage() {
  if (!nextCursor || !activeSearchParams) return;
  const targetIndex = cursorIndex + 1;
  if (cursorStack[targetIndex] !== nextCursor) {
    cursorStack = cursorStack.slice(0, targetIndex);
    cursorStack.push(nextCursor);
  }
  cursorIndex = targetIndex;
  await fetchPage({ cursor: cursorStack[cursorIndex], recordHistory: false });
}

async function goToPreviousPage() {
  if (cursorIndex <= 0 || !activeSearchParams) return;
  cursorIndex -= 1;
  await fetchPage({ cursor: cursorStack[cursorIndex], recordHistory: false });
}

function updatePagination() {
  pageNumberEl.textContent = tr('pageNumber', { page: cursorIndex + 1 });
  prevPageButton.disabled = !activeSearchParams || cursorIndex <= 0;
  nextPageButton.disabled = !activeSearchParams || !nextCursor || currentResults.length === 0;
}

function updateMeta() {
  const total = currentTotalCount === null ? tr('unknown') : Number(currentTotalCount).toLocaleString(uiLanguage === 'ja' ? 'ja-JP' : 'en-US');
  const responseTime = currentResponseTime ?? tr('unknown');
  metaEl.textContent = tr('hitMeta', { total, ms: responseTime });
  if (!activeSearchParams) {
    pageMetaEl.textContent = '';
    return;
  }
  const start = cursorIndex * activeSearchParams.perPage + 1;
  const end = start + Math.max(0, currentResults.length - 1);
  pageMetaEl.textContent = currentResults.length ? tr('pageRange', { start, end, page: cursorIndex + 1 }) : '';
}

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); }
  catch { return { message: text }; }
}

function toOpenAlexErrorState(status, payload) {
  const apiMessage = payload?.message || payload?.error || payload?.detail;
  const vars = apiMessage ? { detail: apiMessage, status } : { status };
  if (status === 403) return { i18nKey: apiMessage ? 'api403Detail' : 'api403', vars };
  if (status === 429) return { i18nKey: apiMessage ? 'api429Detail' : 'api429', vars };
  if (status === 400) return { i18nKey: apiMessage ? 'api400Detail' : 'api400', vars };
  return { i18nKey: apiMessage ? 'apiGenericDetail' : 'apiGeneric', vars };
}

function normalizeWorks(works) {
  return works.map((work) => {
    const authors = Array.isArray(work.authorships)
      ? work.authorships.map((entry) => entry?.author?.display_name).filter(Boolean).slice(0, 12).join('; ')
      : '';
    const source = work.primary_location?.source?.display_name || '';
    const landingUrl = work.primary_location?.landing_page_url || work.doi || work.id || '';
    const abstract = reconstructAbstract(work.abstract_inverted_index);

    return {
      id: work.id || '',
      doi: stripDoiPrefix(work.doi || ''),
      title: work.title || work.display_name || '',
      publicationYear: work.publication_year || '',
      publicationDate: work.publication_date || '',
      type: work.type || '',
      citedByCount: Number.isFinite(work.cited_by_count) ? work.cited_by_count : 0,
      authors,
      source,
      url: landingUrl,
      openAlexUrl: work.id || '',
      isOpenAccess: Boolean(work.open_access?.is_oa),
      oaStatus: work.open_access?.oa_status || '',
      isRetracted: Boolean(work.is_retracted),
      abstract
    };
  });
}

function reconstructAbstract(invertedIndex) {
  if (!invertedIndex || typeof invertedIndex !== 'object') return '';
  const pairs = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    if (!Array.isArray(positions)) continue;
    for (const position of positions) pairs.push([Number(position), word]);
  }
  pairs.sort((a, b) => a[0] - b[0]);
  return pairs.map(([, word]) => word).join(' ');
}

function renderResults(results) {
  if (!results.length) {
    renderEmpty('noMatching');
    return;
  }

  resultsBody.innerHTML = '';
  const rankOffset = cursorIndex * (activeSearchParams?.perPage || results.length);

  results.forEach((work, index) => {
    const row = document.createElement('tr');
    if (work.isRetracted) row.classList.add('retracted-row');

    const oaBadge = work.isOpenAccess
      ? `<span class="badge badge-oa" title="${escapeAttribute(work.oaStatus || 'Open Access')}">OA${work.oaStatus ? `: ${escapeHtml(work.oaStatus)}` : ''}</span>`
      : `<span class="badge badge-closed">${escapeHtml(tr('nonOA'))}</span>`;
    const retractedBadge = work.isRetracted
      ? `<span class="badge badge-retracted">${escapeHtml(tr('retractedBadge'))}</span>`
      : `<span class="badge badge-active">${escapeHtml(tr('normal'))}</span>`;
    const abstractHtml = work.abstract
      ? `<details class="abstract-details"><summary>${escapeHtml(tr('showAbstract'))}</summary><p class="abstract-text">${escapeHtml(work.abstract)}</p></details>`
      : `<div class="muted">${escapeHtml(tr('noAbstract'))}</div>`;

    row.innerHTML = `
      <td>${rankOffset + index + 1}</td>
      <td>${formatNumber(work.citedByCount)}</td>
      <td>${escapeHtml(work.publicationYear || '')}</td>
      <td class="title-cell">
        <a href="${escapeAttribute(work.url || work.openAlexUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(work.title || tr('titleUnknown'))}</a>
        ${work.openAlexUrl ? `<div class="muted"><a href="${escapeAttribute(work.openAlexUrl)}" target="_blank" rel="noopener noreferrer">OpenAlex</a></div>` : ''}
        ${abstractHtml}
      </td>
      <td>${escapeHtml(work.authors || tr('unknown'))}</td>
      <td>${escapeHtml(work.source || tr('unknown'))}</td>
      <td>${escapeHtml(work.type || tr('unknown'))}</td>
      <td>${oaBadge}</td>
      <td>${retractedBadge}</td>
      <td>${work.doi ? `<a href="https://doi.org/${escapeAttribute(work.doi)}" target="_blank" rel="noopener noreferrer">${escapeHtml(work.doi)}</a>` : `<span class="muted">${escapeHtml(tr('none'))}</span>`}</td>
    `;
    resultsBody.appendChild(row);
  });
}

function renderEmpty(key) {
  resultsEmptyKey = key || 'noResultsYet';
  resultsBody.innerHTML = `<tr><td colspan="10" class="empty">${escapeHtml(tr(resultsEmptyKey))}</td></tr>`;
}

function downloadCsv() {
  if (!currentResults.length || !activeSearchParams) return;
  const rankOffset = cursorIndex * activeSearchParams.perPage;
  const rows = currentResults.map((work, index) => ({
    rank: rankOffset + index + 1,
    query: activeSearchParams.query,
    search_scope: activeSearchParams.searchScope,
    sort: activeSearchParams.sort,
    page_number: cursorIndex + 1,
    per_page: activeSearchParams.perPage,
    year_from: activeSearchParams.yearFrom,
    year_to: activeSearchParams.yearTo,
    min_citations: activeSearchParams.minCitations,
    work_type_filter: activeSearchParams.workType,
    oa_filter: activeSearchParams.oaFilter,
    retracted_filter: activeSearchParams.retractedFilter,
    abstract_filter: activeSearchParams.abstractFilter,
    author_openalex_id: activeSearchParams.authorId,
    source_openalex_id: activeSearchParams.sourceId,
    cited_by_count: work.citedByCount,
    publication_year: work.publicationYear,
    publication_date: work.publicationDate,
    title: work.title,
    abstract: work.abstract,
    authors: work.authors,
    source: work.source,
    type: work.type,
    doi: work.doi,
    url: work.url,
    openalex_url: work.openAlexUrl,
    is_open_access: work.isOpenAccess,
    oa_status: work.oaStatus,
    is_retracted: work.isRetracted
  }));

  const csv = toCsv(rows);
  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `openalex_literature_${slugify(activeSearchParams.query)}_p${cursorIndex + 1}_${todayString()}.csv`);
}

function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) lines.push(headers.map((header) => csvEscape(row[header])).join(','));
  return lines.join('\r\n');
}

function csvEscape(value) {
  const stringValue = value === null || value === undefined ? '' : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getSearchFormSnapshot() {
  return collectSearchParams();
}

function applySearchParams(params) {
  if (!params) return;
  queryInput.value = params.query || '';
  searchScopeInput.value = params.searchScope || 'all';
  perPageInput.value = String(params.perPage || 50);
  sortInput.value = params.sort || 'cited_by_count:desc';
  yearFromInput.value = params.yearFrom || '';
  yearToInput.value = params.yearTo || '';
  minCitationsInput.value = params.minCitations || '';
  workTypeInput.value = params.workType || '';
  oaFilterInput.value = params.oaFilter || 'any';
  retractedFilterInput.value = params.retractedFilter || 'any';
  abstractFilterInput.value = params.abstractFilter || 'any';
  authorIdInput.value = params.authorId || '';
  sourceIdInput.value = params.sourceId || '';
}

function saveCurrentSearch() {
  const params = getSearchFormSnapshot();
  if (!params.query) {
    setStatus('saveQueryFirst', 'error');
    return;
  }
  const name = savedSearchNameInput.value.trim() || `${params.query} (${todayString()})`;
  const saved = readJsonStorage(SAVED_SEARCHES_KEY, []);
  const entry = {
    id: makeId(),
    name,
    params,
    createdAt: new Date().toISOString()
  };
  saved.unshift(entry);
  localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(saved.slice(0, MAX_SAVED_SEARCHES)));
  savedSearchNameInput.value = '';
  renderSavedSearches();
  savedSearchSelect.value = entry.id;
  setStatus('savedSearchSaved', 'success', { name });
}

function loadSelectedSavedSearch() {
  const id = savedSearchSelect.value;
  if (!id) {
    setStatus('chooseSavedToLoad', 'error');
    return;
  }
  const saved = readJsonStorage(SAVED_SEARCHES_KEY, []);
  const entry = saved.find((item) => item.id === id);
  if (!entry) return;
  applySearchParams(entry.params);
  setStatus('savedSearchLoaded', 'success', { name: entry.name });
}

function deleteSelectedSavedSearch() {
  const id = savedSearchSelect.value;
  if (!id) {
    setStatus('chooseSavedToDelete', 'error');
    return;
  }
  const saved = readJsonStorage(SAVED_SEARCHES_KEY, []);
  const entry = saved.find((item) => item.id === id);
  const next = saved.filter((item) => item.id !== id);
  localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(next));
  renderSavedSearches();
  if (entry) setStatus('savedSearchDeleted', 'success', { name: entry.name });
  else setStatus('savedSearchDeletedGeneric', 'success');
}

function renderSavedSearches() {
  const saved = readJsonStorage(SAVED_SEARCHES_KEY, []);
  savedSearchSelect.innerHTML = '';
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = saved.length ? tr('chooseSavedConditions') : tr('noSavedConditions');
  savedSearchSelect.appendChild(empty);
  for (const entry of saved) {
    const option = document.createElement('option');
    option.value = entry.id;
    option.textContent = entry.name;
    savedSearchSelect.appendChild(option);
  }
}

function addSearchHistory(params) {
  const history = readJsonStorage(SEARCH_HISTORY_KEY, []);
  const entry = {
    id: makeId(),
    searchedAt: new Date().toISOString(),
    params
  };
  history.unshift(entry);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  renderHistory();
}

function renderHistory() {
  const history = readJsonStorage(SEARCH_HISTORY_KEY, []);
  historyList.innerHTML = '';
  if (!history.length) {
    historyList.innerHTML = `<div class="history-empty">${escapeHtml(tr('historyEmpty'))}</div>`;
    clearHistoryButton.disabled = true;
    return;
  }
  clearHistoryButton.disabled = false;

  for (const entry of history) {
    const item = document.createElement('div');
    item.className = 'history-item';
    const summary = summarizeSearchParams(entry.params);
    item.innerHTML = `
      <div class="history-main">
        <div class="history-query">${escapeHtml(entry.params?.query || tr('queryMissing'))}</div>
        <div class="history-meta">${escapeHtml(formatDateTime(entry.searchedAt))} / ${escapeHtml(summary)}</div>
      </div>
      <div class="history-actions">
        <button type="button" data-action="restore" data-id="${escapeAttributePlain(entry.id)}">${escapeHtml(tr('restoreConditions'))}</button>
        <button type="button" data-action="rerun" data-id="${escapeAttributePlain(entry.id)}">${escapeHtml(tr('rerun'))}</button>
        <button type="button" class="danger-soft" data-action="delete" data-id="${escapeAttributePlain(entry.id)}">${escapeHtml(tr('deleteButton'))}</button>
      </div>
    `;
    historyList.appendChild(item);
  }

  historyList.querySelectorAll('button[data-action]').forEach((button) => {
    button.addEventListener('click', () => handleHistoryAction(button.dataset.action, button.dataset.id));
  });
}

async function handleHistoryAction(action, id) {
  const history = readJsonStorage(SEARCH_HISTORY_KEY, []);
  const entry = history.find((item) => item.id === id);
  if (!entry) return;

  if (action === 'delete') {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.filter((item) => item.id !== id)));
    renderHistory();
    setStatus('historyDeletedOne', 'success');
    return;
  }

  applySearchParams(entry.params);
  if (action === 'restore') {
    setStatus('historyRestored', 'success');
    return;
  }

  const validationError = validateSearchParams(entry.params);
  if (validationError) {
    setStatus(validationError, 'error');
    return;
  }
  persistApiKeyPreference();
  activeSearchParams = collectSearchParams();
  cursorStack = ['*'];
  cursorIndex = 0;
  nextCursor = null;
  await fetchPage({ cursor: '*', recordHistory: true });
}

function clearHistory() {
  localStorage.removeItem(SEARCH_HISTORY_KEY);
  renderHistory();
  setStatus('historyCleared', 'success');
}

function summarizeSearchParams(params) {
  const parts = [];
  if (params.yearFrom || params.yearTo) parts.push(tr('summaryYear', { from: params.yearFrom || '…', to: params.yearTo || '…' }));
  if (params.workType) parts.push(tr('summaryType', { type: params.workType }));
  if (params.minCitations) parts.push(tr('summaryCitations', { count: params.minCitations }));
  if (params.oaFilter === 'true') parts.push(tr('summaryOaOnly'));
  if (params.oaFilter === 'false') parts.push(tr('summaryNonOaOnly'));
  if (params.retractedFilter === 'false') parts.push(tr('summaryRetractedExcluded'));
  if (params.retractedFilter === 'true') parts.push(tr('summaryRetractedOnly'));
  parts.push(tr('summarySort', { sort: sortLabel(params.sort) }));
  return parts.join(' / ');
}

function sortLabel(sort) {
  if (sort === 'publication_date:desc') return tr('sortDateShort');
  if (sort === 'relevance_score:desc') return tr('sortRelevanceShort');
  return tr('sortCitationsShort');
}

function clearInputs() {
  queryInput.value = '';
  searchScopeInput.value = 'all';
  perPageInput.value = '50';
  sortInput.value = 'cited_by_count:desc';
  yearFromInput.value = '';
  yearToInput.value = '';
  minCitationsInput.value = '';
  workTypeInput.value = '';
  oaFilterInput.value = 'any';
  retractedFilterInput.value = 'any';
  abstractFilterInput.value = 'any';
  authorIdInput.value = '';
  sourceIdInput.value = '';
  currentResults = [];
  activeSearchParams = null;
  cursorStack = ['*'];
  cursorIndex = 0;
  nextCursor = null;
  currentTotalCount = null;
  currentResponseTime = null;
  downloadCsvButton.disabled = true;
  renderEmpty('noResultsYet');
  setStatus('enterConditions', '');
  metaEl.textContent = '';
  pageMetaEl.textContent = '';
  updatePagination();
}

function setLoading(isLoading) {
  currentLoading = Boolean(isLoading);
  searchButton.disabled = currentLoading;
  searchButton.textContent = tr(currentLoading ? 'searchingButton' : 'searchButton');
}

function setStatus(key, type = '', vars = {}) {
  statusState = { key, type, vars };
  renderStatus();
}

function readJsonStorage(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(uiLanguage === 'ja' ? 'ja-JP' : 'en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  }).format(date);
}

function stripDoiPrefix(doi) {
  return doi.replace(/^https?:\/\/doi\.org\//i, '').trim();
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString(uiLanguage === 'ja' ? 'ja-JP' : 'en-US');
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'search';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttribute(value) {
  const stringValue = String(value || '');
  if (!/^https?:\/\//i.test(stringValue)) return '#';
  return escapeHtml(stringValue);
}

function escapeAttributePlain(value) {
  return escapeHtml(String(value || ''));
}