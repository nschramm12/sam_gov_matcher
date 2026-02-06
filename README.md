# SAM.gov Matcher v2.0 - Complete Search Configuration

A comprehensive web interface for configuring government contract searches with user preferences and custom rules.

## 🚀 Quick Start

### 1. Open in VS Code
```bash
cd samgov-filter-ui-v2
code .
```

### 2. Launch Website
- Right-click `index.html` → "Open with Live Server"
- Opens at `http://localhost:5500`

---

## 📋 Complete Webhook Payload Specification

When the user submits the form, the website sends this JSON payload to your Make.com webhook:

```json
{
  "company_zip": "92019",
  "naics_filter": "238220,236220",
  "psc_filter": "J041,J045,Y1JZ",
  "acceptable_set_asides": "NONE,SBA,SDVOSBC",
  "max_distance": 200,
  "min_value": 50000,
  "bid_comfort_days": 14,
  "min_days": 7,
  "include_awarded": false,
  "require_location": false,
  "special_request": "Prefer opportunities from Department of Defense. Avoid projects requiring security clearance."
}
```

---

## 📊 Field Specifications

### **Company Information Fields**

| Field | Type | Required | Format | Purpose |
|-------|------|----------|--------|---------|
| `company_zip` | String | ✅ Yes | "92019" (5 digits) | Company location |
| `naics_filter` | String | ✅ Yes | "238220,236220" (comma-separated) | NAICS codes company bids on |
| `psc_filter` | String | ⚠️ Optional | "J041,J045" (comma-separated) | Product/Service codes (empty string if not specified) |
| `acceptable_set_asides` | String | ✅ Yes | "NONE,SBA,SDVOSBC" (comma-separated) | Business qualifications |

---

### **Preference Fields**

| Field | Type | Required | Range | Default | Purpose |
|-------|------|----------|-------|---------|---------|
| `max_distance` | Number | ✅ Yes | 50-1000 | 200 | Maximum miles willing to travel |
| `min_value` | Number | ✅ Yes | 0-500000 | 50000 | Minimum contract value preference ($) |
| `bid_comfort_days` | Number | ✅ Yes | 3-60 | 14 | Days needed to prepare competitive bid |
| `min_days` | Number | ✅ Yes | 0-30 | 7 | Minimum days until deadline (filter) |

---

### **Option Fields**

| Field | Type | Required | Default | Purpose |
|-------|------|----------|---------|---------|
| `include_awarded` | Boolean | ✅ Yes | false | Include already-awarded contracts for research |
| `require_location` | Boolean | ✅ Yes | false | Only show opportunities with ZIP codes |

---

### **Custom Rules Field**

| Field | Type | Required | Max Length | Purpose |
|-------|------|----------|------------|---------|
| `special_request` | String | ⚠️ Optional | 1000 chars | Plain English custom search rules |

**Examples of special_request values:**
- "Prefer opportunities from Department of Defense or Veterans Affairs"
- "Avoid projects requiring security clearance or background checks"
- "Prioritize HVAC retrofits over new construction projects"
- "Only interested in projects with site visits in California"
- "Must include equipment procurement, not just installation"

---

## 🔧 Make.com Integration Guide

### **Step 1: Create Webhook Module**

1. Add **Webhooks → Custom Webhook** at start of scenario
2. Copy the webhook URL
3. Paste into website's "Webhook URL" field

---

### **Step 2: Access Payload Variables**

In subsequent modules, reference payload fields as:

```javascript
{{1.company_zip}}
{{1.naics_filter}}
{{1.max_distance}}
{{1.min_value}}
{{1.bid_comfort_days}}
{{1.acceptable_set_asides}}
{{1.special_request}}
// etc.
```

*(Replace `1` with your actual webhook module number)*

---

### **Step 3: Complete Scenario Flow**

```
1. Webhooks: Custom Webhook
   └─ Receives user preferences (company_zip, naics_filter, psc_filter, etc.)
   ↓
2. Google Sheets: Search Rows (CurrentOpportunities)
   └─ Get all active opportunities
   ↓
3. Return opportunities array as JSON
   └─ Client-side JavaScript handles all filtering
```

**Note:** All filtering now happens **client-side in JavaScript**:
- Deadline filtering (min_days)
- NAICS code filtering
- PSC code filtering
- Set-aside type filtering
- Award amount filtering (min_value)
- Results display with award amount and location ZIP already visible

---

## 🎯 Using Special Request Field

The `special_request` field allows users to add custom criteria in plain English. Here's how to implement it:

### **Option A: Use AI Agent to Filter**

After Python matcher, add an AI Agent module:

**System Prompt:**
```
You are filtering government contract opportunities based on custom user criteria.

User's custom rules:
{{1.special_request}}

Review this opportunity and determine if it meets the user's criteria:
- Title: {{opportunity.title}}
- Description: {{opportunity.description}}
- Agency: {{opportunity.fullParentPathName}}
- NAICS: {{opportunity.naicsCodes}}
- Set-Aside: {{opportunity.typeOfSetAside}}

Respond with ONLY "KEEP" or "REJECT" followed by a brief reason.
```

**Then add a filter:**
- Condition: AI response `contains "KEEP"`

---

### **Option B: Use AI Agent to Score**

Add a `custom_rule_score` field:

**AI Agent Output:**
```json
{
  "meets_criteria": true,
  "custom_score": 85,
  "explanation": "Matches user preference for DoD HVAC projects"
}
```

**Then update match_score:**
```javascript
{{(match_score + custom_score) / 2}}
```

---

## 📊 Expected Form Outputs

### **Scenario 1: HVAC Contractor in San Diego**

**Input:**
- ZIP: 92019
- NAICS: 238220
- PSC: J041, J045
- Set-Asides: Open + SBA
- Min Value: $50,000
- Bid Comfort: 14 days
- Min Days: 7

**Expected Output:**
- Opportunities matching all filters displayed with award amount and location
- Processing Time: ~1 second (client-side filtering)

---

### **Scenario 2: Construction Company - Nationwide**

**Input:**
- ZIP: 10001 (New York)
- NAICS: 236220, 237310
- PSC: (blank)
- Set-Asides: Open + SBA + 8(a)
- Min Value: $150,000
- Bid Comfort: 21 days
- Min Days: 14

**Expected Output:**
- Opportunities matching all filters displayed
- Processing Time: ~1 second (client-side filtering)

---

## 🔄 Data Flow Diagram

```
USER FORM
  ↓ [Submit]
  ↓
WEBHOOK PAYLOAD
  ├─ company_zip → Google Maps API (distance calc)
  ├─ naics_filter → Filter Module (NAICS match)
  ├─ psc_filter → Filter Module (PSC match)
  ├─ acceptable_set_asides → Filter Module (set-aside check)
  ├─ max_distance → Filter Module (distance limit)
  ├─ min_value → Python Matcher (value scoring)
  ├─ bid_comfort_days → Python Matcher (feasibility scoring)
  ├─ min_days → Filter Module (deadline check)
  ├─ include_awarded → Filter Module (award status)
  ├─ require_location → Filter Module (ZIP required)
  └─ special_request → AI Agent (custom rules)
  ↓
MATCHED OPPORTUNITIES
  ↓
GOOGLE SHEETS OUTPUT
```

---

## 🎨 Customization

### **Change Default Values**

Edit `script.js`:

```javascript
const DEFAULTS = {
    webhook_url: '',
    company_zip: '92019',        // Change this
    set_asides: ['NONE', 'SBA'], // Modify defaults
    naics_filter: '238220',      // Your NAICS
    psc_filter: '',
    max_distance: 200,            // Change range
    min_value: 50000,             // Change minimum
    bid_comfort_days: 14,
    min_days: 7,
    include_awarded: false,
    require_location: false,
    special_request: ''
};
```

---

### **Add More Set-Aside Options**

Edit `index.html` in the Business Type section:

```html
<label class="checkbox-label">
    <input type="checkbox" name="set_aside" value="YOUR_CODE">
    <span>YOUR_DESCRIPTION</span>
</label>
```

---

### **Adjust Slider Ranges**

Edit `index.html`:

```html
<!-- Max Distance: 50-2000 miles -->
<input type="range" min="50" max="2000" value="200" step="50">

<!-- Min Value: $0-$1M -->
<input type="range" min="0" max="1000000" value="50000" step="10000">
```

---

## 💾 LocalStorage Features

The website automatically saves:
- ✅ Webhook URL (persists across sessions)
- ✅ Company ZIP code (persists across sessions)

To clear saved data:
```javascript
localStorage.removeItem('samgov_webhook_url');
localStorage.removeItem('samgov_company_zip');
// Or clear everything:
localStorage.clear();
```

---

## 🚀 Deployment Options

### **Option 1: GitHub Pages**
1. Push to GitHub
2. Settings → Pages → Deploy from main branch
3. Live at `https://username.github.io/repo-name`

### **Option 2: Netlify**
1. Drag and drop folder to netlify.com
2. Instant deployment with custom URL

### **Option 3: Vercel**
1. Import from GitHub
2. Auto-deploy on push

---

## 📋 Testing Checklist

- [ ] Webhook URL saves to localStorage
- [ ] Company ZIP validates (5 digits only)
- [ ] NAICS codes are required
- [ ] PSC codes work when blank
- [ ] All sliders update value displays
- [ ] Set-aside checkboxes work
- [ ] Toggles function correctly
- [ ] Special request textarea accepts long text
- [ ] Form submits to Make.com successfully
- [ ] Make.com receives all payload fields
- [ ] Reset button restores all defaults
- [ ] Impact preview updates dynamically

---

## 🎯 Next Steps

1. **Test the form** - Make sure all fields submit correctly
2. **Configure Make.com** - Set up webhook and scenario flow
3. **Add Google Maps API** - For distance calculations
4. **Implement AI Agent** - For special request filtering (optional)
5. **Deploy** - Choose hosting platform and go live

---

**Version:** 2.0  
**Last Updated:** 2026-02-02  
**Features:** Complete user configuration, distance calculation, custom rules with AI