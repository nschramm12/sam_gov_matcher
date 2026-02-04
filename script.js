// DOM Elements - Main Page
const statusDisplay = document.getElementById('statusDisplay');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const opportunitiesSection = document.getElementById('opportunitiesSection');
const opportunitiesContent = document.getElementById('opportunitiesContent');
const mainEmailInput = document.getElementById('mainEmail');
const loadOpportunitiesBtn = document.getElementById('loadOpportunitiesBtn');
const newSearchBtn = document.getElementById('newSearchBtn');
const apiCounterValue = document.getElementById('apiCounterValue');

// DOM Elements - Modal
const searchModal = document.getElementById('searchModal');
const modalOverlay = document.getElementById('modalOverlay');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const form = document.getElementById('searchForm');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');

// Slider elements
const minDaysSlider = document.getElementById('minDays');
const minDaysValue = document.getElementById('minDaysValue');
const maxDistanceSlider = document.getElementById('maxDistance');
const maxDistanceValue = document.getElementById('maxDistanceValue');
const minValueSlider = document.getElementById('minValue');
const minValueDisplay = document.getElementById('minValueDisplay');
const bidComfortSlider = document.getElementById('bidComfortDays');
const bidComfortValue = document.getElementById('bidComfortDaysValue');

// Webhook URL for search (calls SAM.gov API and returns filtered opportunities)
const SEARCH_WEBHOOK_URL = 'https://hook.us2.make.com/7yugrm1u8aoeoxy6n7mka7613kojavew';

// Webhook URL for revealing details (extracts award amount & ZIP from description)
const REVEAL_WEBHOOK_URL = 'https://hook.us2.make.com/mgc2n9nvbpwi2bnv3n4g5i4q4jvydm5g';

// API Call Counter (10 per day)
const MAX_DAILY_CALLS = 10;

// Ranking system data
const rankingItems = [
    { id: 'value', icon: '💰', title: 'Contract Value', description: 'Dollar amount of the contract', rank: 1 },
    { id: 'feasibility', icon: '⏱️', title: 'Bid Feasibility', description: 'Time available to prepare bid', rank: 2 },
    { id: 'location', icon: '📍', title: 'Location Proximity', description: 'Distance from your company', rank: 3 },
    { id: 'special', icon: '✨', title: 'Custom Rules Match', description: 'Fits your special requirements', rank: 4 },
    { id: 'effort', icon: '🔧', title: 'Effort/Complexity', description: 'Ease of bidding (fewer requirements)', rank: 5 }
];

// Default values
const DEFAULTS = {
    webhook_url: '',
    user_email: '',
    user_name: '',
    company_zip: '92019',
    set_asides: ['NONE', 'SBA'],
    naics_filter: '238220',
    psc_filter: '',
    max_distance: 200,
    min_value: 50000,
    bid_comfort_days: 14,
    min_days: 7,
    include_awarded: false,
    require_location: false,
    special_request: '',
    rankings: { value: 1, feasibility: 2, location: 3, special: 4, effort: 5 }
};

// ========== MODAL FUNCTIONS ==========

function openSearchModal() {
    searchModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Sync email from main page to modal
    if (mainEmailInput.value) {
        document.getElementById('userEmail').value = mainEmailInput.value;
    }
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

maxDistanceSlider.addEventListener('input', (e) => {
    maxDistanceValue.textContent = e.target.value.toLocaleString();
});

minValueSlider.addEventListener('input', (e) => {
    minValueDisplay.textContent = parseInt(e.target.value).toLocaleString();
});

bidComfortSlider.addEventListener('input', (e) => {
    bidComfortValue.textContent = e.target.value;
});

// ========== RESET FORM ==========

// Only add listener if reset button exists
if (resetBtn) resetBtn.addEventListener('click', () => {
    document.getElementById('companyZip').value = DEFAULTS.company_zip;
    document.getElementById('naicsCodes').value = DEFAULTS.naics_filter;
    document.getElementById('pscCodes').value = DEFAULTS.psc_filter;

    minDaysSlider.value = DEFAULTS.min_days;
    minDaysValue.textContent = DEFAULTS.min_days;

    maxDistanceSlider.value = DEFAULTS.max_distance;
    maxDistanceValue.textContent = DEFAULTS.max_distance;

    minValueSlider.value = DEFAULTS.min_value;
    minValueDisplay.textContent = DEFAULTS.min_value.toLocaleString();

    bidComfortSlider.value = DEFAULTS.bid_comfort_days;
    bidComfortValue.textContent = DEFAULTS.bid_comfort_days;

    document.querySelectorAll('input[name="set_aside"]').forEach(checkbox => {
        checkbox.checked = DEFAULTS.set_asides.includes(checkbox.value);
    });

    document.getElementById('includeAwarded').checked = DEFAULTS.include_awarded;
    document.getElementById('requireLocation').checked = DEFAULTS.require_location;
    document.getElementById('specialRequest').value = DEFAULTS.special_request;
});

// ========== LOAD OPPORTUNITIES (main page) ==========

loadOpportunitiesBtn.addEventListener('click', async () => {
    const email = mainEmailInput.value.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showStatus('error', 'Please enter a valid email address');
        return;
    }

    // Save email to localStorage
    localStorage.setItem('samgov_user_email', email);

    // Check for saved opportunities
    const savedOpportunities = localStorage.getItem(`samgov_opportunities_${email}`);

    if (savedOpportunities) {
        try {
            const opportunities = JSON.parse(savedOpportunities);
            showStatus('success', 'Opportunities loaded!');
            setTimeout(() => hideStatus(), 2000);
            displayOpportunities(opportunities);
        } catch (error) {
            showStatus('error', 'Error loading saved opportunities');
        }
    } else {
        opportunitiesContent.innerHTML = `
            <p class="empty-state">No saved opportunities found for this email. Click "New Search" to find opportunities.</p>
        `;
    }
});

// ========== LOAD SEARCH SETTINGS ==========

function loadSearchSettings(data) {
    if (data.company_zip) document.getElementById('companyZip').value = data.company_zip;
    if (data.naics_filter) document.getElementById('naicsCodes').value = data.naics_filter;
    if (data.psc_filter !== undefined) document.getElementById('pscCodes').value = data.psc_filter;

    if (data.max_distance) {
        maxDistanceSlider.value = data.max_distance;
        maxDistanceValue.textContent = data.max_distance;
    }
    if (data.min_value !== undefined) {
        minValueSlider.value = data.min_value;
        minValueDisplay.textContent = data.min_value.toLocaleString();
    }
    if (data.bid_comfort_days) {
        bidComfortSlider.value = data.bid_comfort_days;
        bidComfortValue.textContent = data.bid_comfort_days;
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
    if (data.require_location !== undefined) {
        document.getElementById('requireLocation').checked = data.require_location;
    }
    if (data.special_request !== undefined) {
        document.getElementById('specialRequest').value = data.special_request;
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

    const naicsCodes = formData.get('naics_filter').split(',').map(code => code.trim()).filter(code => code).join(',');
    const pscCodes = formData.get('psc_filter').split(',').map(code => code.trim()).filter(code => code).join(',');

    const payload = {
        search_id: searchId,
        user_email: userEmail,
        user_name: userName,
        company_zip: formData.get('company_zip').trim(),
        naics_filter: naicsCodes,
        psc_filter: pscCodes,
        acceptable_set_asides: setAsides,
        max_distance: parseInt(formData.get('max_distance')),
        min_value: parseInt(formData.get('min_value')),
        bid_comfort_days: parseInt(formData.get('bid_comfort_days')),
        min_days: parseInt(formData.get('min_days')),
        location_rank: parseInt(formData.get('location_rank')),
        value_rank: parseInt(formData.get('value_rank')),
        feasibility_rank: parseInt(formData.get('feasibility_rank')),
        effort_rank: parseInt(formData.get('effort_rank')),
        special_rank: parseInt(formData.get('special_rank')),
        include_awarded: document.getElementById('includeAwarded').checked,
        require_location: document.getElementById('requireLocation').checked,
        special_request: formData.get('special_request').trim(),
        search_timestamp: new Date().toISOString()
    };

    localStorage.setItem(`samgov_search_${userEmail}`, JSON.stringify(payload));

    return { payload, userEmail };
}

// ========== SEND TO MAKE.COM ==========

async function sendToMakecom(webhookUrl, payload) {
    try {
        console.log('Sending to webhook:', webhookUrl);
        console.log('Payload:', payload);

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get the raw text first to see what we're dealing with
        const rawText = await response.text();
        console.log('Raw response text:', rawText);

        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (e) {
            console.warn('Response is not valid JSON, treating as text');
            data = { message: rawText };
        }

        console.log('Parsed data:', data);
        return { success: true, data };
    } catch (error) {
        console.error('sendToMakecom error:', error);
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

    let html = `<p style="color: #28a745; font-weight: 600; margin-bottom: 20px;">
        Found ${opportunities.length} opportunities!
    </p>`;

    html += `<div class="opportunities-cards">`;

    opportunities.forEach((opp, index) => {
        const deadline = opp.responseDeadline ? formatDate(opp.responseDeadline) : '-';
        const posted = opp.postedDate ? formatDate(opp.postedDate) : '-';

        // Check for existing values from search results OR previously revealed
        const hasAwardAmount = opp.award_amount != null || opp.awardAmount != null || opp._awardAmount != null;
        const hasLocationZip = opp.popZIP != null || opp.location_zip != null || opp.locationZip != null || opp._locationZip != null;

        // Get the actual values
        const awardAmount = opp._awardAmount || opp.award_amount || opp.awardAmount;
        const locationZip = opp._locationZip || opp.location_zip || opp.locationZip || opp.popZIP;

        // Format award amount for display
        let awardDisplay = '--';
        let awardHasValue = false;
        if (awardAmount != null && awardAmount !== '' && awardAmount !== 'null') {
            const numAmount = typeof awardAmount === 'number' ? awardAmount : parseFloat(awardAmount);
            if (!isNaN(numAmount)) {
                awardDisplay = numAmount.toLocaleString();
                awardHasValue = true;
            } else {
                awardDisplay = awardAmount; // Keep string value
                awardHasValue = true;
            }
        }

        // Format ZIP for display
        let zipDisplay = '--';
        let zipHasValue = false;
        if (locationZip != null && locationZip !== '' && locationZip !== 'null') {
            zipDisplay = locationZip;
            zipHasValue = true;
        }

        // Determine if reveal is needed (missing at least one value)
        const needsReveal = !awardHasValue || !zipHasValue;
        const isFullyRevealed = opp._revealed === true || (awardHasValue && zipHasValue);

        html += `
            <div class="opportunity-card" data-index="${index}">
                <div class="opportunity-content">
                    <div class="opportunity-header">
                        <h3 class="opportunity-title">${escapeHtml(opp.title || 'Untitled')}</h3>
                        ${opp.typeOfSetAside
                            ? `<span class="set-aside-badge">${escapeHtml(opp.typeOfSetAside)}</span>`
                            : '<span class="set-aside-badge open">Open</span>'}
                    </div>
                    ${opp.solicitationNumber ? `<div class="opportunity-solicitation">${escapeHtml(opp.solicitationNumber)}</div>` : ''}

                    <div class="opportunity-details">
                        <div class="detail-row">
                            <span class="detail-label">Type:</span>
                            <span class="detail-value">${escapeHtml(opp.type || opp.baseType || '-')}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">NAICS:</span>
                            <span class="detail-value">${escapeHtml(opp.naicsCodes || '-')}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">PSC:</span>
                            <span class="detail-value">${escapeHtml(opp.pscCode || '-')}</span>
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
                            <span class="detail-value">${escapeHtml(opp.fullParentPathName || '-')}</span>
                        </div>
                    </div>

                    ${opp.uiLink ? `<a href="${escapeHtml(opp.uiLink)}" target="_blank" class="view-link">View on SAM.gov →</a>` : ''}
                </div>

                <div class="opportunity-actions">
                    <div class="revealed-data" id="award-${index}">
                        <span class="data-label">Award Amount</span>
                        <span class="data-value ${awardHasValue ? '' : 'pending'}" id="award-value-${index}">${awardHasValue ? '$' + awardDisplay : '--'}</span>
                    </div>
                    <div class="revealed-data" id="zip-${index}">
                        <span class="data-label">Location ZIP</span>
                        <span class="data-value ${zipHasValue ? '' : 'pending'}" id="zip-value-${index}">${zipDisplay}</span>
                    </div>
                    ${needsReveal ? `
                        <button type="button"
                                class="btn-reveal-details"
                                id="reveal-btn-${index}"
                                onclick="revealDetails(${index})">
                            🔍 Reveal Missing
                        </button>
                    ` : `
                        <div style="color: #28a745; font-size: 13px; font-weight: 600;">✓ Complete</div>
                    `}
                </div>
            </div>
        `;
    });

    html += `</div>`;
    opportunitiesContent.innerHTML = html;
}

// ========== REVEAL DETAILS ==========

async function revealDetails(index) {
    const opportunity = window.currentOpportunities[index];
    if (!opportunity) {
        console.error('Opportunity not found');
        return;
    }

    const button = document.getElementById(`reveal-btn-${index}`);
    const awardValueEl = document.getElementById(`award-value-${index}`);
    const zipValueEl = document.getElementById(`zip-value-${index}`);

    // Show loading state
    button.disabled = true;
    button.textContent = '⏳ Revealing...';

    // Build payload
    const payload = {
        action: 'reveal_details',
        timestamp: new Date().toISOString(),
        opp_noticeId: opportunity.noticeId || '',
        opp_title: opportunity.title || '',
        opp_solicitationNumber: opportunity.solicitationNumber || '',
        opp_type: opportunity.type || '',
        opp_baseType: opportunity.baseType || '',
        opp_typeOfSetAside: opportunity.typeOfSetAside || '',
        opp_naicsCodes: opportunity.naicsCodes || '',
        opp_pscCode: opportunity.pscCode || '',
        opp_popZIP: opportunity.popZIP || '',
        opp_postedDate: opportunity.postedDate || '',
        opp_responseDeadline: opportunity.responseDeadline || '',
        opp_fullParentPathName: opportunity.fullParentPathName || '',
        opp_pocFullName: opportunity.pocFullName || '',
        opp_pocEmail: opportunity.pocEmail || '',
        opp_pocPhone: opportunity.pocPhone || '',
        opp_uiLink: opportunity.uiLink || ''
    };

    try {
        const response = await fetch(REVEAL_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Update display with revealed data
        // Handle award_amount - could be a value or null (not found by AI)
        if (result.award_amount !== undefined) {
            if (result.award_amount !== null && result.award_amount !== '' && result.award_amount !== 'null') {
                const formattedAmount = typeof result.award_amount === 'number'
                    ? result.award_amount.toLocaleString()
                    : result.award_amount;
                awardValueEl.textContent = `$${formattedAmount}`;
                awardValueEl.classList.remove('pending');
                awardValueEl.classList.add('found');
                opportunity._awardAmount = formattedAmount;
            } else {
                // AI agent couldn't find it in description
                awardValueEl.textContent = 'Not found';
                awardValueEl.classList.remove('pending');
                awardValueEl.classList.add('not-found');
                opportunity._awardAmount = null;
            }
        }

        // Handle location_zip - could be a value or null (not found by AI)
        if (result.location_zip !== undefined) {
            if (result.location_zip !== null && result.location_zip !== '' && result.location_zip !== 'null') {
                zipValueEl.textContent = result.location_zip;
                zipValueEl.classList.remove('pending');
                zipValueEl.classList.add('found');
                opportunity._locationZip = result.location_zip;
            } else {
                // AI agent couldn't find it in description
                zipValueEl.textContent = 'Not found';
                zipValueEl.classList.remove('pending');
                zipValueEl.classList.add('not-found');
                opportunity._locationZip = null;
            }
        }

        // Mark as revealed (attempted)
        opportunity._revealed = true;
        button.textContent = '✓ Checked';
        button.classList.add('revealed');
        button.disabled = true;

        // Save updated opportunities to localStorage
        const userEmail = mainEmailInput.value.trim() || localStorage.getItem('samgov_user_email');
        if (userEmail) {
            localStorage.setItem(`samgov_opportunities_${userEmail}`, JSON.stringify(window.currentOpportunities));
        }

    } catch (error) {
        console.error('Reveal details error:', error);
        awardValueEl.textContent = 'Error';
        zipValueEl.textContent = 'Error';
        button.textContent = '↻ Retry';
        button.disabled = false;
    }
}

// Make revealDetails available globally
window.revealDetails = revealDetails;

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

    const zipCode = document.getElementById('companyZip').value.trim();
    if (!/^\d{5}$/.test(zipCode)) {
        showStatus('error', 'Please enter a valid 5-digit ZIP code');
        return;
    }

    const naics = document.getElementById('naicsCodes').value.trim();
    if (!naics) {
        showStatus('error', 'Please enter at least one NAICS code');
        return;
    }

    const { payload } = collectFormData();

    showStatus('loading', 'Searching SAM.gov for opportunities...');
    submitBtn.disabled = true;

    const result = await sendToMakecom(SEARCH_WEBHOOK_URL, payload);

    // Increment API call counter after search attempt
    incrementApiCallCount();

    submitBtn.disabled = false;

    // Debug: Log the full response
    console.log('Search result:', result);
    console.log('Result data:', result.data);

    if (result.success) {
        // Close modal
        closeSearchModal();

        // Sync email to main page
        mainEmailInput.value = userEmail;
        localStorage.setItem('samgov_user_email', userEmail);

        showStatus('success', 'Search completed! ✨');
        setTimeout(() => hideStatus(), 3000);

        // Debug: Log what we're looking for
        console.log('Looking for opportunities in result.data:', result.data);
        console.log('result.data.opportunities:', result.data?.opportunities);
        console.log('result.data.matches:', result.data?.matches);
        console.log('Is array?:', Array.isArray(result.data));

        // Process and display results - check multiple possible response structures
        let opportunities = null;

        // Check if data itself is an array
        if (Array.isArray(result.data)) {
            opportunities = result.data;
        }
        // Check for nested opportunities array
        else if (result.data?.opportunities && Array.isArray(result.data.opportunities)) {
            opportunities = result.data.opportunities;
        }
        // Check for matches array
        else if (result.data?.matches && Array.isArray(result.data.matches)) {
            opportunities = result.data.matches;
        }
        // Check if data is an object with a results property
        else if (result.data?.results && Array.isArray(result.data.results)) {
            opportunities = result.data.results;
        }
        // Check if data is an object with a data property (nested)
        else if (result.data?.data && Array.isArray(result.data.data)) {
            opportunities = result.data.data;
        }

        console.log('Extracted opportunities:', opportunities);

        if (opportunities && opportunities.length > 0) {
            // Save opportunities to localStorage
            localStorage.setItem(`samgov_opportunities_${userEmail}`, JSON.stringify(opportunities));
            displayOpportunities(opportunities);
        } else {
            // Debug: Show what the API returned when no opportunities found
            console.log('No opportunities array found. Full result.data:', JSON.stringify(result.data, null, 2));

            // Try to provide helpful debug info
            let debugInfo = '';
            if (result.data && typeof result.data === 'object') {
                const keys = Object.keys(result.data);
                debugInfo = `<br><small style="color: #999;">Response keys: ${keys.join(', ') || 'none'}</small>`;
            }

            opportunitiesContent.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <p style="color: #28a745; font-weight: 600; margin-bottom: 10px;">✅ Search completed!</p>
                    <p style="color: #6c757d;">${result.data?.message || 'No matching opportunities found. Try adjusting your criteria.'}</p>
                    ${debugInfo}
                    <p style="margin-top: 15px; font-size: 12px; color: #999;">Check browser console (F12) for full response data.</p>
                </div>
            `;
        }
    } else {
        console.error('Search failed:', result.error);
        showStatus('error', `Error: ${result.error}`);
    }
});

// ========== RANKING SYSTEM ==========

function initializeRanking() {
    const container = document.getElementById('rankingContainer');
    if (!container) return;

    rankingItems.sort((a, b) => a.rank - b.rank);

    rankingItems.forEach((item, index) => {
        const rankItem = document.createElement('div');
        rankItem.className = 'ranking-item';
        rankItem.draggable = true;
        rankItem.dataset.id = item.id;

        rankItem.innerHTML = `
            <div class="ranking-number">${index + 1}</div>
            <div class="ranking-icon">${item.icon}</div>
            <div class="ranking-content">
                <div class="ranking-title">${item.title}</div>
                <div class="ranking-description">${item.description}</div>
            </div>
        `;

        rankItem.addEventListener('dragstart', handleDragStart);
        rankItem.addEventListener('dragover', handleDragOver);
        rankItem.addEventListener('drop', handleDrop);
        rankItem.addEventListener('dragend', handleDragEnd);

        container.appendChild(rankItem);
    });

    updateRankingInputs();
}

let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const afterElement = getDragAfterElement(e.currentTarget.parentElement, e.clientY);
    const dragging = document.querySelector('.dragging');

    if (afterElement == null) {
        e.currentTarget.parentElement.appendChild(dragging);
    } else {
        e.currentTarget.parentElement.insertBefore(dragging, afterElement);
    }

    return false;
}

function handleDrop(e) {
    e.stopPropagation();
    updateRankingNumbers();
    updateRankingInputs();
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.ranking-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateRankingNumbers() {
    const items = document.querySelectorAll('.ranking-item');
    items.forEach((item, index) => {
        item.querySelector('.ranking-number').textContent = index + 1;
    });
}

function updateRankingInputs() {
    const items = document.querySelectorAll('.ranking-item');
    items.forEach((item, index) => {
        const id = item.dataset.id;
        const rank = index + 1;
        const input = document.getElementById(`${id}Rank`);
        if (input) input.value = rank;
    });
}

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
    initializeRanking();
    updateApiCounterDisplay();

    // Load saved user email
    const savedEmail = localStorage.getItem('samgov_user_email');
    if (savedEmail) {
        document.getElementById('userEmail').value = savedEmail;
        mainEmailInput.value = savedEmail;
    }

    // Load saved company ZIP
    const savedZip = localStorage.getItem('samgov_company_zip');
    if (savedZip) {
        document.getElementById('companyZip').value = savedZip;
    }
});
