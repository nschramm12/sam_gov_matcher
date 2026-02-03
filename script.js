// DOM Elements
const form = document.getElementById('searchForm');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const statusDisplay = document.getElementById('statusDisplay');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const resultsSection = document.getElementById('resultsSection');
const resultsContent = document.getElementById('resultsContent');

// Slider elements
const minDaysSlider = document.getElementById('minDays');
const minDaysValue = document.getElementById('minDaysValue');
const maxDistanceSlider = document.getElementById('maxDistance');
const maxDistanceValue = document.getElementById('maxDistanceValue');
const minValueSlider = document.getElementById('minValue');
const minValueDisplay = document.getElementById('minValueDisplay');
const bidComfortSlider = document.getElementById('bidComfortDays');
const bidComfortValue = document.getElementById('bidComfortDaysValue');

// Ranking system data
const rankingItems = [
    {
        id: 'value',
        icon: '💰',
        title: 'Contract Value',
        description: 'Dollar amount of the contract',
        rank: 1
    },
    {
        id: 'feasibility',
        icon: '⏱️',
        title: 'Bid Feasibility',
        description: 'Time available to prepare bid',
        rank: 2
    },
    {
        id: 'location',
        icon: '📍',
        title: 'Location Proximity',
        description: 'Distance from your company',
        rank: 3
    },
    {
        id: 'special',
        icon: '✨',
        title: 'Custom Rules Match',
        description: 'Fits your special requirements',
        rank: 4
    },
    {
        id: 'effort',
        icon: '🔧',
        title: 'Effort/Complexity',
        description: 'Ease of bidding (fewer requirements)',
        rank: 5
    }
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
    rankings: {
        value: 1,
        feasibility: 2,
        location: 3,
        special: 4,
        effort: 5
    }
};

// Update all slider displays
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

// Reset form to defaults
resetBtn.addEventListener('click', () => {
    // Don't reset user email/name or webhook URL
    // Keep these fields as they are
    
    // Reset company info
    document.getElementById('companyZip').value = DEFAULTS.company_zip;
    document.getElementById('naicsCodes').value = DEFAULTS.naics_filter;
    document.getElementById('pscCodes').value = DEFAULTS.psc_filter;
    
    // Reset sliders
    minDaysSlider.value = DEFAULTS.min_days;
    minDaysValue.textContent = DEFAULTS.min_days;
    
    maxDistanceSlider.value = DEFAULTS.max_distance;
    maxDistanceValue.textContent = DEFAULTS.max_distance;
    
    minValueSlider.value = DEFAULTS.min_value;
    minValueDisplay.textContent = DEFAULTS.min_value.toLocaleString();
    
    bidComfortSlider.value = DEFAULTS.bid_comfort_days;
    bidComfortValue.textContent = DEFAULTS.bid_comfort_days;
    
    // Reset checkboxes
    document.querySelectorAll('input[name="set_aside"]').forEach(checkbox => {
        checkbox.checked = DEFAULTS.set_asides.includes(checkbox.value);
    });
    
    // Reset toggles
    document.getElementById('includeAwarded').checked = DEFAULTS.include_awarded;
    document.getElementById('requireLocation').checked = DEFAULTS.require_location;
    
    // Reset special request
    document.getElementById('specialRequest').value = DEFAULTS.special_request;
    
    // Hide results
    resultsSection.classList.add('hidden');
    statusDisplay.classList.add('hidden');
});

// Load Previous Search button handler
document.getElementById('loadPreviousBtn').addEventListener('click', async () => {
    const userEmail = document.getElementById('userEmail').value.trim();
    
    if (!userEmail) {
        alert('Please enter your email address first');
        return;
    }
    
    // Check localStorage first
    const savedSearch = localStorage.getItem(`samgov_search_${userEmail}`);
    
    if (savedSearch) {
        try {
            const searchData = JSON.parse(savedSearch);
            loadSearchSettings(searchData);
            showStatus('success', 'Previous search loaded successfully!');
            setTimeout(() => hideStatus(), 2000);
        } catch (error) {
            alert('Error loading saved search');
        }
    } else {
        alert('No previous search found for this email address');
    }
});

// Function to load search settings into form
function loadSearchSettings(data) {
    // Load company info
    if (data.company_zip) document.getElementById('companyZip').value = data.company_zip;
    if (data.naics_filter) document.getElementById('naicsCodes').value = data.naics_filter;
    if (data.psc_filter !== undefined) document.getElementById('pscCodes').value = data.psc_filter;
    
    // Load sliders
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
    
    // Load set-asides
    if (data.acceptable_set_asides) {
        const setAsides = data.acceptable_set_asides.split(',');
        document.querySelectorAll('input[name="set_aside"]').forEach(checkbox => {
            checkbox.checked = setAsides.includes(checkbox.value);
        });
    }
    
    // Load toggles
    if (data.include_awarded !== undefined) {
        document.getElementById('includeAwarded').checked = data.include_awarded;
    }
    if (data.require_location !== undefined) {
        document.getElementById('requireLocation').checked = data.require_location;
    }
    
    // Load special request
    if (data.special_request !== undefined) {
        document.getElementById('specialRequest').value = data.special_request;
    }
}

// Show status message
function showStatus(type, message) {
    statusDisplay.classList.remove('hidden', 'loading', 'success', 'error');
    statusDisplay.classList.add(type);
    
    const icons = {
        loading: '⏳',
        success: '✅',
        error: '❌'
    };
    
    statusIcon.textContent = icons[type] || '⏳';
    statusText.textContent = message;
}

// Hide status message
function hideStatus() {
    statusDisplay.classList.add('hidden');
}

// Collect form data
function collectFormData() {
    const formData = new FormData(form);
    
    // Get webhook URL
    const webhookUrl = formData.get('webhook_url');
    
    // Generate unique search ID (timestamp-based)
    const searchId = `SEARCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get user info
    const userEmail = formData.get('user_email').trim();
    const userName = formData.get('user_name').trim() || userEmail.split('@')[0];
    
    // Get selected set-asides
    const setAsides = Array.from(document.querySelectorAll('input[name="set_aside"]:checked'))
        .map(cb => cb.value)
        .join(',');
    
    // Clean NAICS codes
    const naicsCodes = formData.get('naics_filter')
        .split(',')
        .map(code => code.trim())
        .filter(code => code)
        .join(',');
    
    // Clean PSC codes
    const pscCodes = formData.get('psc_filter')
        .split(',')
        .map(code => code.trim())
        .filter(code => code)
        .join(',');
    
    // Build payload
    const payload = {
        // User identification
        search_id: searchId,
        user_email: userEmail,
        user_name: userName,
        
        // Company info
        company_zip: formData.get('company_zip').trim(),
        naics_filter: naicsCodes,
        psc_filter: pscCodes,
        acceptable_set_asides: setAsides,
        
        // Preferences
        max_distance: parseInt(formData.get('max_distance')),
        min_value: parseInt(formData.get('min_value')),
        bid_comfort_days: parseInt(formData.get('bid_comfort_days')),
        min_days: parseInt(formData.get('min_days')),
        
        // Score rankings (1-5, where 1 = most important)
        location_rank: parseInt(formData.get('location_rank')),
        value_rank: parseInt(formData.get('value_rank')),
        feasibility_rank: parseInt(formData.get('feasibility_rank')),
        effort_rank: parseInt(formData.get('effort_rank')),
        special_rank: parseInt(formData.get('special_rank')),
        
        // Options
        include_awarded: document.getElementById('includeAwarded').checked,
        require_location: document.getElementById('requireLocation').checked,
        
        // Custom rules
        special_request: formData.get('special_request').trim(),
        
        // Timestamp
        search_timestamp: new Date().toISOString()
    };
    
    // Save to localStorage for "Load Previous Search"
    localStorage.setItem(`samgov_search_${userEmail}`, JSON.stringify(payload));
    
    return { webhookUrl, payload };
}

// Send data to Make.com webhook
async function sendToMakecom(webhookUrl, payload) {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return { success: true, data };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Display results
function displayResults(data) {
    // Check if data has the expected structure
    if (!data) {
        resultsContent.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <p style="color: #28a745; font-weight: 600; margin-bottom: 10px;">✅ Search completed successfully!</p>
                <p style="color: #6c757d;">Matched opportunities will appear in your results sheet.</p>
                <p style="color: #6c757d; margin-top: 10px; font-size: 14px;">
                    Check Make.com scenario execution logs for details.
                </p>
            </div>
        `;
        resultsSection.classList.remove('hidden');
        return;
    }

    // Check for opportunities array (from Make.com webhook response)
    const opportunities = data.opportunities || data.matches || (Array.isArray(data) ? data : null);

    let html = '<div style="padding: 10px;">';

    if (opportunities && Array.isArray(opportunities) && opportunities.length > 0) {
        // Store opportunities globally for score calculation
        window.currentOpportunities = opportunities;

        html += `<p style="color: #28a745; font-weight: 600; margin-bottom: 15px;">
            Found ${opportunities.length} opportunities!
        </p>`;

        // Create card rows for opportunities
        html += `<div class="opportunities-cards">`;

        opportunities.forEach((opp, index) => {
            const deadline = opp.responseDeadline ? formatDate(opp.responseDeadline) : '-';
            const posted = opp.postedDate ? formatDate(opp.postedDate) : '-';

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
                                <span class="detail-label">Location:</span>
                                <span class="detail-value">${escapeHtml(opp.popZIP || '-')}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Posted:</span>
                                <span class="detail-value">${posted}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Deadline:</span>
                                <span class="detail-value deadline">${deadline}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Agency:</span>
                                <span class="detail-value">${escapeHtml(opp.fullParentPathName || '-')}</span>
                            </div>
                            ${opp.pocFullName ? `
                            <div class="detail-row">
                                <span class="detail-label">Contact:</span>
                                <span class="detail-value">
                                    ${escapeHtml(opp.pocFullName)}
                                    ${opp.pocEmail ? `<br><a href="mailto:${escapeHtml(opp.pocEmail)}">${escapeHtml(opp.pocEmail)}</a>` : ''}
                                    ${opp.pocPhone ? `<br>${escapeHtml(opp.pocPhone)}` : ''}
                                </span>
                            </div>
                            ` : ''}
                        </div>

                        ${opp.uiLink ? `<a href="${escapeHtml(opp.uiLink)}" target="_blank" class="view-link">View on SAM.gov →</a>` : ''}
                    </div>

                    <div class="opportunity-actions">
                        <div class="score-display" id="score-${index}">
                            <span class="score-label">Match Score</span>
                            <span class="score-value">--</span>
                        </div>
                        <button type="button" class="btn-calculate-score" onclick="calculateMatchScore(${index})">
                            📊 Calculate Score
                        </button>
                    </div>
                </div>
            `;
        });

        html += `</div>`;

    } else if (data.message) {
        html += `<p style="color: #667eea; font-weight: 600;">${escapeHtml(data.message)}</p>`;
    } else {
        html += `
            <p style="color: #28a745; font-weight: 600; margin-bottom: 10px;">✅ Search executed successfully!</p>
            <p style="color: #6c757d;">Results are being processed in Make.com.</p>
        `;
    }

    html += '</div>';
    resultsContent.innerHTML = html;
    resultsSection.classList.remove('hidden');
}

// Calculate match score for a single opportunity
async function calculateMatchScore(index) {
    const opportunity = window.currentOpportunities[index];
    if (!opportunity) {
        console.error('Opportunity not found');
        return;
    }

    const scoreDisplay = document.getElementById(`score-${index}`);
    const button = scoreDisplay.parentElement.querySelector('.btn-calculate-score');

    // Get the score webhook URL (can be same or different from search webhook)
    const scoreWebhookUrl = document.getElementById('webhookUrl').value.trim();
    if (!scoreWebhookUrl) {
        alert('Please enter a Make.com webhook URL');
        return;
    }

    // Show loading state
    button.disabled = true;
    button.textContent = '⏳ Calculating...';
    scoreDisplay.querySelector('.score-value').textContent = '...';

    // Get current ranking values
    const rankings = {
        location_rank: parseInt(document.getElementById('locationRank').value),
        value_rank: parseInt(document.getElementById('valueRank').value),
        feasibility_rank: parseInt(document.getElementById('feasibilityRank').value),
        effort_rank: parseInt(document.getElementById('effortRank').value),
        special_rank: parseInt(document.getElementById('specialRank').value)
    };

    // Get user preferences for scoring context
    const userPreferences = {
        company_zip: document.getElementById('companyZip').value.trim(),
        max_distance: parseInt(document.getElementById('maxDistance').value),
        min_value: parseInt(document.getElementById('minValue').value),
        bid_comfort_days: parseInt(document.getElementById('bidComfortDays').value),
        special_request: document.getElementById('specialRequest').value.trim()
    };

    // Build payload for score calculation
    const payload = {
        action: 'calculate_score',
        opportunity: opportunity,
        rankings: rankings,
        user_preferences: userPreferences,
        timestamp: new Date().toISOString()
    };

    try {
        const response = await fetch(scoreWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Update score display
        if (result.match_score !== undefined) {
            scoreDisplay.querySelector('.score-value').textContent = result.match_score;
            scoreDisplay.classList.add('has-score');

            // Color code based on score
            const scoreValue = parseFloat(result.match_score);
            if (scoreValue >= 80) {
                scoreDisplay.classList.add('score-high');
            } else if (scoreValue >= 50) {
                scoreDisplay.classList.add('score-medium');
            } else {
                scoreDisplay.classList.add('score-low');
            }
        } else {
            scoreDisplay.querySelector('.score-value').textContent = result.score || 'N/A';
        }

        button.textContent = '✓ Scored';
        button.disabled = true;

    } catch (error) {
        console.error('Score calculation error:', error);
        scoreDisplay.querySelector('.score-value').textContent = 'Error';
        button.textContent = '↻ Retry';
        button.disabled = false;
    }
}

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        return dateString;
    }
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate email
    const userEmail = document.getElementById('userEmail').value.trim();
    if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
        showStatus('error', 'Please enter a valid email address');
        return;
    }
    
    // Validate ZIP code
    const zipCode = document.getElementById('companyZip').value.trim();
    if (!/^\d{5}$/.test(zipCode)) {
        showStatus('error', 'Please enter a valid 5-digit ZIP code');
        return;
    }
    
    // Validate NAICS codes
    const naics = document.getElementById('naicsCodes').value.trim();
    if (!naics) {
        showStatus('error', 'Please enter at least one NAICS code');
        return;
    }
    
    // Collect form data
    const { webhookUrl, payload } = collectFormData();
    
    // Validate webhook URL
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
        showStatus('error', 'Please enter a valid Make.com webhook URL');
        return;
    }
    
    // Show loading state
    showStatus('loading', 'Processing your search...');
    submitBtn.disabled = true;
    resultsSection.classList.add('hidden');
    
    // Log payload for debugging
    console.log('Sending payload:', payload);
    
    // Send to Make.com
    const result = await sendToMakecom(webhookUrl, payload);
    
    // Handle response
    submitBtn.disabled = false;
    
    if (result.success) {
        showStatus('success', 'Search completed successfully! ✨');
        setTimeout(() => hideStatus(), 3000);
        displayResults(result.data);
    } else {
        showStatus('error', `Error: ${result.error}`);
    }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initializeRanking();

    // Load saved webhook URL
    const savedUrl = localStorage.getItem('samgov_webhook_url');
    if (savedUrl) {
        document.getElementById('webhookUrl').value = savedUrl;
    }
    
    // Load saved user email
    const savedEmail = localStorage.getItem('samgov_user_email');
    if (savedEmail) {
        document.getElementById('userEmail').value = savedEmail;
    }
    
    // Load saved company ZIP
    const savedZip = localStorage.getItem('samgov_company_zip');
    if (savedZip) {
        document.getElementById('companyZip').value = savedZip;
    }
});

// Initialize ranking UI
function initializeRanking() {
    const container = document.getElementById('rankingContainer');
    
    // Sort items by rank
    rankingItems.sort((a, b) => a.rank - b.rank);
    
    // Render ranking items
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
        
        // Drag events
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
    if (e.preventDefault) {
        e.preventDefault();
    }
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
    if (e.stopPropagation) {
        e.stopPropagation();
    }
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
        const numberEl = item.querySelector('.ranking-number');
        numberEl.textContent = index + 1;
    });
}

function updateRankingInputs() {
    const items = document.querySelectorAll('.ranking-item');
    items.forEach((item, index) => {
        const id = item.dataset.id;
        const rank = index + 1;
        document.getElementById(`${id}Rank`).value = rank;
    });
}

// Save webhook URL and ZIP to localStorage
document.getElementById('webhookUrl').addEventListener('blur', (e) => {
    if (e.target.value) {
        localStorage.setItem('samgov_webhook_url', e.target.value);
    }
});

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