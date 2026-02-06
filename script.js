// DOM Elements - Main Page
const statusDisplay = document.getElementById('statusDisplay');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const opportunitiesSection = document.getElementById('opportunitiesSection');
const opportunitiesContent = document.getElementById('opportunitiesContent');
const searchHistoryDropdown = document.getElementById('searchHistory');
const loadSearchBtn = document.getElementById('loadSearchBtn');
const deleteSearchBtn = document.getElementById('deleteSearchBtn');
const newSearchBtn = document.getElementById('newSearchBtn');
const dailyAlertBtn = document.getElementById('dailyAlertBtn');
const apiCounterValue = document.getElementById('apiCounterValue');

// DOM Elements - Daily Alert Modal
const dailyAlertModal = document.getElementById('dailyAlertModal');
const dailyAlertOverlay = document.getElementById('dailyAlertOverlay');
const dailyAlertCloseBtn = document.getElementById('dailyAlertCloseBtn');
const alertEmail = document.getElementById('alertEmail');
const alertSearchTemplate = document.getElementById('alertSearchTemplate');
const alertStatus = document.getElementById('alertStatus');
const toggleAlertBtn = document.getElementById('toggleAlertBtn');

// Max saved searches
const MAX_SAVED_SEARCHES = 10;

// DOM Elements - Welcome Modal
const welcomeModal = document.getElementById('welcomeModal');
const welcomeOverlay = document.getElementById('welcomeOverlay');
const welcomeCloseBtn = document.getElementById('welcomeCloseBtn');
const dontShowAgainCheckbox = document.getElementById('dontShowAgain');

// DOM Elements - Modal
const searchModal = document.getElementById('searchModal');
const modalOverlay = document.getElementById('modalOverlay');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const form = document.getElementById('searchForm');
const submitBtn = document.getElementById('submitBtn');

// Slider elements
const minDaysSlider = document.getElementById('minDays');
const minDaysValue = document.getElementById('minDaysValue');
const minValueSlider = document.getElementById('minValue');
const minValueDisplay = document.getElementById('minValueDisplay');

// Webhook URL for search (returns ALL opportunities as CSV)
const SEARCH_WEBHOOK_URL = 'https://hook.us2.make.com/f99gee1v61qkaipf3qydt668lvh5qsb7';

// API Call Counter (10 per day)
const MAX_DAILY_CALLS = 10;

// Default values
const DEFAULTS = {
    user_email: '',
    user_name: '',
    keywords: '',
    company_zip: '',
    set_asides: ['NONE'],
    naics_filter: '',
    min_value: 0,
    min_days: 0,
    include_awarded: false
};

// ========== WELCOME MODAL FUNCTIONS ==========

function showWelcomeModal() {
    welcomeModal.classList.remove('hidden');
    welcomeOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function hideWelcomeModal() {
    // Check if "don't show again" is checked
    if (dontShowAgainCheckbox && dontShowAgainCheckbox.checked) {
        localStorage.setItem('samgov_hide_welcome', 'true');
    }
    welcomeModal.classList.add('hidden');
    welcomeOverlay.classList.add('hidden');
    document.body.style.overflow = '';
}

function checkShowWelcome() {
    const hideWelcome = localStorage.getItem('samgov_hide_welcome');
    if (hideWelcome !== 'true') {
        showWelcomeModal();
    } else {
        welcomeModal.classList.add('hidden');
        welcomeOverlay.classList.add('hidden');
    }
}

// Welcome modal event listeners
if (welcomeCloseBtn) welcomeCloseBtn.addEventListener('click', hideWelcomeModal);
if (welcomeOverlay) welcomeOverlay.addEventListener('click', hideWelcomeModal);

// Help button to show welcome modal again
const showHelpBtn = document.getElementById('showHelpBtn');
if (showHelpBtn) showHelpBtn.addEventListener('click', showWelcomeModal);

// ========== SEARCH HISTORY FUNCTIONS ==========

function getSavedSearches() {
    try {
        const searches = JSON.parse(localStorage.getItem('samgov_search_history') || '[]');
        return Array.isArray(searches) ? searches : [];
    } catch (e) {
        return [];
    }
}

function saveSearch(searchData) {
    const searches = getSavedSearches();

    // Create search entry with metadata
    const searchEntry = {
        id: `search_${Date.now()}`,
        timestamp: new Date().toISOString(),
        label: createSearchLabel(searchData.criteria),
        criteria: searchData.criteria,
        opportunities: searchData.opportunities
    };

    // Add to beginning of array
    searches.unshift(searchEntry);

    // Keep only the last MAX_SAVED_SEARCHES
    if (searches.length > MAX_SAVED_SEARCHES) {
        searches.splice(MAX_SAVED_SEARCHES);
    }

    localStorage.setItem('samgov_search_history', JSON.stringify(searches));
    populateSearchDropdown();

    return searchEntry.id;
}

function createSearchLabel(criteria) {
    const date = new Date();
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    // Build a descriptive label
    const parts = [];
    if (criteria.keywords) {
        const firstKeyword = criteria.keywords.split(',')[0].trim();
        parts.push(`"${firstKeyword}"`);
    }
    if (criteria.naics_filter) {
        const naics = criteria.naics_filter.split(',')[0].trim();
        parts.push(`NAICS: ${naics}`);
    }

    const description = parts.length > 0 ? parts.join(' - ') : 'Search';
    return `${dateStr} ${timeStr} - ${description}`;
}

function populateSearchDropdown() {
    const searches = getSavedSearches();

    // Clear existing options except the placeholder
    searchHistoryDropdown.innerHTML = '<option value="">-- Select a previous search --</option>';

    if (searches.length === 0) {
        searchHistoryDropdown.disabled = true;
        loadSearchBtn.disabled = true;
        deleteSearchBtn.disabled = true;
        return;
    }

    searchHistoryDropdown.disabled = false;

    searches.forEach(search => {
        const option = document.createElement('option');
        option.value = search.id;
        const oppCount = search.opportunities ? search.opportunities.length : 0;
        option.textContent = `${search.label} (${oppCount} results)`;
        searchHistoryDropdown.appendChild(option);
    });
}

function loadSelectedSearch() {
    const selectedId = searchHistoryDropdown.value;
    if (!selectedId) {
        showStatus('error', 'Please select a search to load');
        return;
    }

    const searches = getSavedSearches();
    const search = searches.find(s => s.id === selectedId);

    if (!search) {
        showStatus('error', 'Search not found');
        return;
    }

    if (search.opportunities && search.opportunities.length > 0) {
        displayOpportunities(search.opportunities);
        showStatus('success', `Loaded ${search.opportunities.length} opportunities`);
        setTimeout(() => hideStatus(), 2000);
    } else {
        opportunitiesContent.innerHTML = `
            <p class="empty-state">This search returned no opportunities.</p>
        `;
    }
}

function deleteSelectedSearch() {
    const selectedId = searchHistoryDropdown.value;
    if (!selectedId) {
        showStatus('error', 'Please select a search to delete');
        return;
    }

    if (!confirm('Delete this saved search?')) {
        return;
    }

    let searches = getSavedSearches();
    searches = searches.filter(s => s.id !== selectedId);
    localStorage.setItem('samgov_search_history', JSON.stringify(searches));

    populateSearchDropdown();
    opportunitiesContent.innerHTML = `
        <p class="empty-state">Select a previous search or click "New Search" to find opportunities.</p>
    `;
    showStatus('success', 'Search deleted');
    setTimeout(() => hideStatus(), 2000);
}

function updateCurrentSearchOpportunities(opportunities) {
    // Update the most recent search (or currently selected) with new opportunity data
    const selectedId = searchHistoryDropdown.value;
    let searches = getSavedSearches();

    if (selectedId) {
        // Update the selected search
        const index = searches.findIndex(s => s.id === selectedId);
        if (index !== -1) {
            searches[index].opportunities = opportunities;
            localStorage.setItem('samgov_search_history', JSON.stringify(searches));
        }
    } else if (searches.length > 0) {
        // Update the most recent search
        searches[0].opportunities = opportunities;
        localStorage.setItem('samgov_search_history', JSON.stringify(searches));
    }
}

// Search history event listeners
if (loadSearchBtn) loadSearchBtn.addEventListener('click', loadSelectedSearch);
if (deleteSearchBtn) deleteSearchBtn.addEventListener('click', deleteSelectedSearch);

// Enable/disable buttons based on dropdown selection
if (searchHistoryDropdown) {
    searchHistoryDropdown.addEventListener('change', () => {
        const hasSelection = searchHistoryDropdown.value !== '';
        loadSearchBtn.disabled = !hasSelection;
        deleteSearchBtn.disabled = !hasSelection;
    });
}

// ========== DAILY ALERT FUNCTIONS ==========

function getDailyAlertSettings() {
    try {
        return JSON.parse(localStorage.getItem('samgov_daily_alert') || '{}');
    } catch (e) {
        return {};
    }
}

function saveDailyAlertSettings(settings) {
    localStorage.setItem('samgov_daily_alert', JSON.stringify(settings));
}

function openDailyAlertModal() {
    dailyAlertModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Populate search template dropdown
    populateAlertSearchDropdown();

    // Load existing settings
    const settings = getDailyAlertSettings();
    if (settings.email) {
        alertEmail.value = settings.email;
    }
    if (settings.searchId) {
        alertSearchTemplate.value = settings.searchId;
    }

    updateAlertStatusDisplay(settings.enabled || false);
}

function closeDailyAlertModal() {
    dailyAlertModal.classList.add('hidden');
    document.body.style.overflow = '';
}

function populateAlertSearchDropdown() {
    const searches = getSavedSearches();
    alertSearchTemplate.innerHTML = '<option value="">-- Select a previous search --</option>';

    searches.forEach(search => {
        const option = document.createElement('option');
        option.value = search.id;
        option.textContent = search.label;
        alertSearchTemplate.appendChild(option);
    });
}

function updateAlertStatusDisplay(isEnabled) {
    const indicator = alertStatus.querySelector('.status-indicator');
    const text = alertStatus.querySelector('.status-text');

    if (isEnabled) {
        indicator.classList.remove('off');
        indicator.classList.add('on');
        text.innerHTML = 'Daily alerts are currently <strong style="color: #28a745;">ON</strong>';
        toggleAlertBtn.textContent = '🔕 Disable Daily Alerts';
        toggleAlertBtn.classList.add('active');
        dailyAlertBtn.textContent = '🔔 Daily Alert: ON';
        dailyAlertBtn.classList.add('active');
    } else {
        indicator.classList.remove('on');
        indicator.classList.add('off');
        text.innerHTML = 'Daily alerts are currently <strong>OFF</strong>';
        toggleAlertBtn.textContent = '🔔 Enable Daily Alerts';
        toggleAlertBtn.classList.remove('active');
        dailyAlertBtn.textContent = '🔔 Daily Alert: OFF';
        dailyAlertBtn.classList.remove('active');
    }
}

async function toggleDailyAlert() {
    const settings = getDailyAlertSettings();
    const isCurrentlyEnabled = settings.enabled || false;

    // Validate inputs if enabling
    if (!isCurrentlyEnabled) {
        const email = alertEmail.value.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showStatus('error', 'Please enter a valid email address');
            return;
        }

        const searchId = alertSearchTemplate.value;
        if (!searchId) {
            showStatus('error', 'Please select a search to use as template');
            return;
        }

        // Get the search criteria
        const searches = getSavedSearches();
        const selectedSearch = searches.find(s => s.id === searchId);
        if (!selectedSearch) {
            showStatus('error', 'Selected search not found');
            return;
        }

        // Save settings and enable
        const newSettings = {
            enabled: true,
            email: email,
            searchId: searchId,
            criteria: selectedSearch.criteria,
            enabledAt: new Date().toISOString()
        };

        // Send to webhook to enable daily alerts
        toggleAlertBtn.disabled = true;
        toggleAlertBtn.textContent = '⏳ Enabling...';

        try {
            const response = await fetch(SEARCH_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'enable_daily_alert',
                    email: email,
                    criteria: selectedSearch.criteria,
                    searchLabel: selectedSearch.label
                })
            });

            if (!response.ok) {
                throw new Error('Failed to enable daily alerts');
            }

            saveDailyAlertSettings(newSettings);
            updateAlertStatusDisplay(true);
            showStatus('success', 'Daily alerts enabled! You\'ll receive emails for new opportunities.');
            setTimeout(() => hideStatus(), 3000);

        } catch (error) {
            console.error('Enable alert error:', error);
            showStatus('error', 'Failed to enable alerts. Please try again.');
        } finally {
            toggleAlertBtn.disabled = false;
        }

    } else {
        // Disable alerts
        toggleAlertBtn.disabled = true;
        toggleAlertBtn.textContent = '⏳ Disabling...';

        try {
            const response = await fetch(SEARCH_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'disable_daily_alert',
                    email: settings.email
                })
            });

            if (!response.ok) {
                throw new Error('Failed to disable daily alerts');
            }

            saveDailyAlertSettings({ ...settings, enabled: false });
            updateAlertStatusDisplay(false);
            showStatus('success', 'Daily alerts disabled.');
            setTimeout(() => hideStatus(), 2000);

        } catch (error) {
            console.error('Disable alert error:', error);
            showStatus('error', 'Failed to disable alerts. Please try again.');
        } finally {
            toggleAlertBtn.disabled = false;
        }
    }
}

// Daily Alert event listeners
if (dailyAlertBtn) dailyAlertBtn.addEventListener('click', openDailyAlertModal);
if (dailyAlertCloseBtn) dailyAlertCloseBtn.addEventListener('click', closeDailyAlertModal);
if (dailyAlertOverlay) dailyAlertOverlay.addEventListener('click', closeDailyAlertModal);
if (toggleAlertBtn) toggleAlertBtn.addEventListener('click', toggleDailyAlert);

// ========== SEARCH MODAL FUNCTIONS ==========

function openSearchModal() {
    searchModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeSearchModal() {
    searchModal.classList.add('hidden');
    document.body.style.overflow = '';
}

// Modal event listeners
newSearchBtn.addEventListener('click', openSearchModal);
modalCloseBtn.addEventListener('click', closeSearchModal);
modalOverlay.addEventListener('click', closeSearchModal);

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !searchModal.classList.contains('hidden')) {
        closeSearchModal();
    }
});

// ========== API COUNTER FUNCTIONS ==========

function getApiCallCount() {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('samgov_api_calls_date');
    const savedCount = parseInt(localStorage.getItem('samgov_api_calls_count') || '0');

    // Reset if it's a new day
    if (savedDate !== today) {
        localStorage.setItem('samgov_api_calls_date', today);
        localStorage.setItem('samgov_api_calls_count', '0');
        return 0;
    }

    return savedCount;
}

function incrementApiCallCount() {
    const today = new Date().toDateString();
    localStorage.setItem('samgov_api_calls_date', today);
    const currentCount = getApiCallCount();
    const newCount = currentCount + 1;
    localStorage.setItem('samgov_api_calls_count', newCount.toString());
    updateApiCounterDisplay();
    return newCount;
}

function updateApiCounterDisplay() {
    const usedCalls = getApiCallCount();
    const remaining = MAX_DAILY_CALLS - usedCalls;
    apiCounterValue.textContent = `${remaining}/${MAX_DAILY_CALLS}`;

    // Change color based on remaining
    if (remaining <= 2) {
        apiCounterValue.style.color = '#dc3545';
    } else if (remaining <= 5) {
        apiCounterValue.style.color = '#ffc107';
    } else {
        apiCounterValue.style.color = '#856404';
    }
}

function canMakeApiCall() {
    return getApiCallCount() < MAX_DAILY_CALLS;
}

// ========== SLIDER EVENT LISTENERS ==========

minDaysSlider.addEventListener('input', (e) => {
    minDaysValue.textContent = e.target.value;
});

minValueSlider.addEventListener('input', (e) => {
    minValueDisplay.textContent = parseInt(e.target.value).toLocaleString();
});

// ========== LOAD SEARCH SETTINGS ==========

function loadSearchSettings(data) {
    if (data.keywords) document.getElementById('searchKeywords').value = data.keywords;
    if (data.company_zip) document.getElementById('companyZip').value = data.company_zip;
    if (data.naics_filter) document.getElementById('naicsCodes').value = data.naics_filter;

    if (data.min_value !== undefined) {
        minValueSlider.value = data.min_value;
        minValueDisplay.textContent = data.min_value.toLocaleString();
    }
    if (data.min_days !== undefined) {
        minDaysSlider.value = data.min_days;
        minDaysValue.textContent = data.min_days;
    }

    if (data.acceptable_set_asides) {
        const setAsides = data.acceptable_set_asides.split(',');
        document.querySelectorAll('input[name="set_aside"]').forEach(checkbox => {
            checkbox.checked = setAsides.includes(checkbox.value);
        });
    }

    if (data.include_awarded !== undefined) {
        document.getElementById('includeAwarded').checked = data.include_awarded;
    }
}

// ========== STATUS DISPLAY ==========

function showStatus(type, message) {
    statusDisplay.classList.remove('hidden', 'loading', 'success', 'error');
    statusDisplay.classList.add(type);

    const icons = { loading: '⏳', success: '✅', error: '❌' };
    statusIcon.textContent = icons[type] || '⏳';
    statusText.textContent = message;
}

function hideStatus() {
    statusDisplay.classList.add('hidden');
}

// ========== COLLECT FORM DATA ==========

function collectFormData() {
    const formData = new FormData(form);
    const searchId = `SEARCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const userEmail = formData.get('user_email').trim();
    const userName = formData.get('user_name').trim() || userEmail.split('@')[0];

    const setAsides = Array.from(document.querySelectorAll('input[name="set_aside"]:checked'))
        .map(cb => cb.value).join(',');

    // Get keywords
    const keywords = formData.get('keywords') ? formData.get('keywords').trim() : '';
    
    // Get NAICS codes (optional)
    const naicsCodes = formData.get('naics_filter') 
        ? formData.get('naics_filter').split(',').map(code => code.trim()).filter(code => code).join(',')
        : '';

    const payload = {
        search_id: searchId,
        user_email: userEmail,
        user_name: userName,
        keywords: keywords,
        company_zip: formData.get('company_zip').trim(),
        naics_filter: naicsCodes,
        acceptable_set_asides: setAsides,
        min_value: parseInt(formData.get('min_value')) || 0,
        min_days: parseInt(formData.get('min_days')) || 0,
        include_awarded: document.getElementById('includeAwarded').checked,
        search_timestamp: new Date().toISOString()
    };

    localStorage.setItem(`samgov_search_${userEmail}`, JSON.stringify(payload));

    return { payload, userEmail };
}

// ========== FETCH ALL OPPORTUNITIES ==========

async function fetchAllOpportunities() {
    try {
        console.log('Fetching all opportunities from webhook:', SEARCH_WEBHOOK_URL);

        const response = await fetch(SEARCH_WEBHOOK_URL, {
            method: 'GET'
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get the CSV text
        const csvText = await response.text();
        console.log('Received CSV data, length:', csvText.length);

        // Parse CSV into opportunities array
        const opportunities = parseCSV(csvText);
        console.log('Parsed opportunities count:', opportunities.length);

        return { success: true, data: opportunities };
    } catch (error) {
        console.error('fetchAllOpportunities error:', error);
        return { success: false, error: error.message };
    }
}

// ========== DISPLAY OPPORTUNITIES ==========

function displayOpportunities(opportunities) {
    if (!opportunities || !Array.isArray(opportunities) || opportunities.length === 0) {
        opportunitiesContent.innerHTML = `
            <p class="empty-state">No opportunities found. Try adjusting your search criteria.</p>
        `;
        return;
    }

    // Store globally for reveal functionality
    window.currentOpportunities = opportunities;

    let html = `
        <p style="color: #28a745; font-weight: 600; margin-bottom: 10px;">
            Found ${opportunities.length} opportunities!
        </p>
        <p style="color: #6c757d; font-size: 13px; margin-bottom: 20px;">
            ℹ️ Fields marked as "Unknown" automatically pass filters - review these opportunities manually
        </p>
    `;

    html += `<div class="opportunities-cards">`;

    opportunities.forEach((opp, index) => {
        // Helper to format values with Unknown fallback
        const formatValue = (value, fallback = 'Unknown ⚠️') => {
            if (value === null || value === undefined || value === '' || value === 'null') {
                return `<span class="unknown-value">${fallback}</span>`;
            }
            return escapeHtml(value);
        };

        const deadline = opp.response_deadline ? formatDate(opp.response_deadline) : formatValue(null);
        const posted = opp.posted_date ? formatDate(opp.posted_date) : formatValue(null);

        // Format award amount for display
        let awardDisplay = formatValue(null);
        if (opp.award_amount != null && opp.award_amount !== '' && opp.award_amount !== 'null') {
            const numAmount = typeof opp.award_amount === 'number' ? opp.award_amount : parseFloat(opp.award_amount);
            if (!isNaN(numAmount)) {
                awardDisplay = '$' + numAmount.toLocaleString();
            }
        }

        html += `
            <div class="opportunity-card" data-index="${index}">
                <div class="opportunity-content">
                    <div class="opportunity-header">
                        <h3 class="opportunity-title">${formatValue(opp.title, 'Untitled')}</h3>
                        ${opp.type_of_set_aside_description
                            ? `<span class="set-aside-badge">${escapeHtml(opp.type_of_set_aside_description)}</span>`
                            : '<span class="set-aside-badge open">Open Competition</span>'}
                    </div>
                    ${opp.solicitation_number ? `<div class="opportunity-solicitation">${escapeHtml(opp.solicitation_number)}</div>` : ''}

                    <div class="opportunity-details">
                        <div class="detail-row">
                            <span class="detail-label">Type:</span>
                            <span class="detail-value">${formatValue(opp.type || opp.base_type)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">NAICS:</span>
                            <span class="detail-value">${formatValue(opp.naics_codes)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">PSC:</span>
                            <span class="detail-value">${formatValue(opp.classification_code)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Posted:</span>
                            <span class="detail-value">${posted}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Deadline:</span>
                            <span class="detail-value deadline">${deadline}</span>
                        </div>
                        <div class="detail-row" style="grid-column: span 2;">
                            <span class="detail-label">Agency:</span>
                            <span class="detail-value">${formatValue(opp.full_parent_path_name || opp.department_name || opp.agency_name)}</span>
                        </div>
                    </div>

                    <div class="detail-row" style="margin-top: 15px;">
                        <span class="detail-label">Award Amount:</span>
                        <span class="detail-value">${awardDisplay}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Location:</span>
                        <span class="detail-value">${formatValue(opp.place_of_performance_zip || opp.place_of_performance_city)}</span>
                    </div>

                    ${opp.ui_link ? `<a href="${escapeHtml(opp.ui_link)}" target="_blank" class="view-link">View on SAM.gov →</a>` : ''}
                </div>
            </div>
        `;
    });

    html += `</div>`;
    opportunitiesContent.innerHTML = html;
}

// ========== CLIENT-SIDE FILTERING ==========

function filterOpportunitiesByPreferences(opportunities, criteria) {
    /*
    Filter opportunities based on user preferences
    Missing data is treated as "Unknown" and automatically passes filters
    */
    
    if (!opportunities || !Array.isArray(opportunities)) {
        return [];
    }

    // Parse search keywords (simple text search)
    const keywords = criteria.keywords
        ? criteria.keywords.toLowerCase().split(',').map(k => k.trim()).filter(k => k)
        : [];
    
    // Parse NAICS codes (optional)
    const naicsList = criteria.naics_filter
        ? criteria.naics_filter.split(',').map(n => n.trim()).filter(n => n)
        : [];
    
    // Parse set-asides
    const setAsidesList = criteria.acceptable_set_asides
        ? criteria.acceptable_set_asides.split(',').map(s => s.trim())
        : ['NONE', 'SBA'];
    
    const minValue = parseInt(criteria.min_value) || 0;
    const minDaysUntilDeadline = parseInt(criteria.min_days) || 0;
    
    const now = new Date();
    const deadlineThreshold = new Date(now.getTime() + minDaysUntilDeadline * 24 * 60 * 60 * 1000);

    return opportunities.filter(opp => {
        // Check deadline (if available, auto-pass if missing)
        if (opp.response_deadline) {
            try {
                const deadline = new Date(opp.response_deadline);
                if (!isNaN(deadline.getTime()) && deadline < deadlineThreshold) {
                    return false; // Too soon
                }
            } catch (e) {
                // Invalid date format - auto-pass
            }
        }

        // Check keywords (search in title and description, auto-pass if no keywords specified)
        if (keywords.length > 0) {
            const title = (opp.title || '').toLowerCase();
            const description = (opp.description || '').toLowerCase();
            const combinedText = title + ' ' + description;
            
            const hasKeywordMatch = keywords.some(keyword => combinedText.includes(keyword));
            if (!hasKeywordMatch) return false;
        }

        // Check NAICS codes (auto-pass if not specified or if opp has no NAICS)
        if (naicsList.length > 0 && opp.naics_codes) {
            const oppNaics = opp.naics_codes.split(',').map(n => n.trim());
            const hasMatch = oppNaics.some(n => naicsList.includes(n));
            if (!hasMatch) return false;
        }

        // Check set-asides (auto-pass if opp has no set-aside info)
        if (opp.type_of_set_aside) {
            const setAside = opp.type_of_set_aside.trim();
            if (!setAsidesList.includes(setAside) && !setAsidesList.includes('NONE')) {
                return false;
            }
        }

        // Check award amount (auto-pass if not specified or if opp has no amount)
        if (minValue > 0 && opp.award_amount) {
            const amount = parseFloat(opp.award_amount);
            if (!isNaN(amount) && amount < minValue) return false;
        }

        return true;
    });
}

// ========== CSV PARSING ==========

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const opportunities = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Handle quoted fields with commas
        const values = [];
        let currentValue = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim().replace(/^"|"$/g, ''));
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim().replace(/^"|"$/g, ''));

        const opportunity = {};
        headers.forEach((header, index) => {
            const value = values[index] || '';
            opportunity[header] = value === '' || value.toLowerCase() === 'null' ? null : value;
        });

        opportunities.push(opportunity);
    }

    return opportunities;
}

// ========== HELPER FUNCTIONS ==========

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        return dateString;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== FORM SUBMISSION ==========

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Check API call limit first
    if (!canMakeApiCall()) {
        showStatus('error', 'You have used all 10 daily searches. Please try again tomorrow.');
        return;
    }

    const userEmail = document.getElementById('userEmail').value.trim();
    if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
        showStatus('error', 'Please enter a valid email address');
        return;
    }

    // At least one search criteria required
    const keywords = document.getElementById('searchKeywords').value.trim();
    const naics = document.getElementById('naicsCodes').value.trim();
    
    if (!keywords && !naics) {
        showStatus('error', 'Please enter either keywords or NAICS codes to search');
        return;
    }

    const { payload } = collectFormData();

    showStatus('loading', 'Fetching all opportunities from SAM.gov...');
    submitBtn.disabled = true;

    // Fetch all opportunities from webhook
    const result = await fetchAllOpportunities();

    // Increment API call counter after search attempt
    incrementApiCallCount();

    submitBtn.disabled = false;

    if (result.success) {
        // Close modal
        closeSearchModal();

        const allOpportunities = result.data;
        console.log('Total opportunities fetched:', allOpportunities.length);

        showStatus('loading', 'Filtering opportunities based on your criteria...');

        // Apply client-side filtering based on user preferences
        const filteredOpportunities = filterOpportunitiesByPreferences(allOpportunities, payload);
        console.log('Filtered opportunities:', filteredOpportunities.length);

        // Save search to history
        saveSearch({
            criteria: payload,
            opportunities: filteredOpportunities
        });

        if (filteredOpportunities.length > 0) {
            showStatus('success', `Found ${filteredOpportunities.length} matching opportunities!`);
            setTimeout(() => hideStatus(), 3000);
            displayOpportunities(filteredOpportunities);
        } else {
            showStatus('error', 'No opportunities match your criteria. Try broader search terms.');
            setTimeout(() => hideStatus(), 5000);
            opportunitiesContent.innerHTML = `
                <p class="empty-state">No opportunities match your criteria. Try adjusting your search terms or removing some filters.</p>
            `;
        }
    } else {
        console.error('Fetch failed:', result.error);
        showStatus('error', `Error fetching opportunities: ${result.error}`);
    }
});

// ========== SAVE TO LOCALSTORAGE ==========

document.getElementById('userEmail').addEventListener('blur', (e) => {
    if (e.target.value) {
        localStorage.setItem('samgov_user_email', e.target.value);
    }
});

document.getElementById('companyZip').addEventListener('blur', (e) => {
    if (e.target.value) {
        localStorage.setItem('samgov_company_zip', e.target.value);
    }
});

// ========== INITIALIZE ON LOAD ==========

document.addEventListener('DOMContentLoaded', () => {
    updateApiCounterDisplay();
    populateSearchDropdown();

    // Initialize daily alert button state
    const alertSettings = getDailyAlertSettings();
    if (alertSettings.enabled) {
        dailyAlertBtn.textContent = '🔔 Daily Alert: ON';
        dailyAlertBtn.classList.add('active');
    }

    // Show welcome modal if first visit
    checkShowWelcome();

    // Load saved user email into search modal and alert modal
    const savedEmail = localStorage.getItem('samgov_user_email');
    if (savedEmail) {
        document.getElementById('userEmail').value = savedEmail;
        if (alertEmail) alertEmail.value = savedEmail;
    }

    // Load saved company ZIP
    const savedZip = localStorage.getItem('samgov_company_zip');
    if (savedZip) {
        document.getElementById('companyZip').value = savedZip;
    }

    // Set default slider values
    minValueSlider.value = DEFAULTS.min_value;
    minValueDisplay.textContent = DEFAULTS.min_value.toLocaleString();
    minDaysSlider.value = DEFAULTS.min_days;
    minDaysValue.textContent = DEFAULTS.min_days;
});
