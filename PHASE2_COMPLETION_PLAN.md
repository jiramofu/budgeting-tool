# Phase 2 Completion Plan: Email Service Integration
**Target Duration:** 1-2 weeks  
**Status:** Backend Complete → Frontend + Email Setup Needed  
**Priority:** High (Foundation for Phase 4)

---

## 📋 Executive Summary

Phase 2 backend is **100% complete**. We now need to:
1. **Configure email service** (SendGrid) - 2-3 hours
2. **Build frontend UI** (Alerts + Email Preferences pages) - 5-6 hours
3. **Connect and test end-to-end** - 2-3 hours

**Total time: 1-2 weeks for a developer working part-time**

---

## ✅ What's Already Done (Phase 2 Backend)

### Database
- ✅ 7 new tables created:
  - `spending_alerts` - Individual alert configurations
  - `alert_preferences` - User-level alert settings
  - `email_reports` - Email report configurations
  - `email_report_schedules` - When to send reports
  - `email_preferences` - User email settings
  - `email_templates` - Email template storage
  - `alert_history` - Alert trigger history

### Backend Services
- ✅ `alertService.ts` (440 lines) - Alert detection and management
  - `checkSpendingAlerts()` - Detects overspending
  - `createAlert()` - Create new alert
  - `updateAlert()` - Modify alert
  - `deleteAlert()` - Remove alert
  - `getUserAlerts()` - Retrieve user's alerts
  - `getAlertStats()` - Alert statistics

- ✅ `emailReportService.ts` (520 lines) - Report scheduling
  - `scheduleEmailReport()` - Schedule report
  - `generateReport()` - Create report content
  - `sendReport()` - Email report to user
  - `getSchedules()` - List user's report schedules
  - `cancelSchedule()` - Remove schedule

### Scheduler Job
- ✅ `reportSchedulerJob.ts` (245 lines)
  - Runs every 10 minutes
  - Checks all alerts
  - Generates and sends reports
  - Logs execution history

### API Routes
- ✅ 10 endpoints created (`alerts.ts`, `emailReports.ts`):
  - POST/GET/PUT/DELETE alerts
  - POST/GET/PUT/DELETE email preferences
  - GET alert statistics
  - POST/GET email report schedules

---

## ❌ What's Missing (Phase 2 Frontend)

### Email Service Integration
- [ ] SendGrid account setup
- [ ] API key configuration
- [ ] Email templates (alert, report)
- [ ] SMTP configuration in backend
- [ ] Send test email verification

### Frontend Pages
- [ ] AlertsPage.tsx - View/manage alerts
- [ ] EmailPreferencesPage.tsx - Configure email settings
- [ ] AlertsModal.tsx - Create/edit alert dialog
- [ ] AlertStats.tsx - Alert statistics display

### Frontend Integration
- [ ] Add routes in App.tsx
- [ ] Add navigation links in Layout.tsx
- [ ] Wire up API calls
- [ ] Error handling and UX

---

## 🛠️ Implementation Roadmap

### Phase 2.1: Email Service Setup (2-3 hours)

#### Task 1: Create SendGrid Account
1. Go to https://sendgrid.com
2. Sign up for free account (up to 100 emails/day)
3. Complete email verification
4. Generate API key
5. Note: API key will be used in environment config

#### Task 2: Configure SMTP in Backend
File: `backend/src/services/emailService.ts` (partially done, needs completion)

```typescript
// Already exists, just needs testing:
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: true,
  auth: {
    user: config.smtpUser,
    pass: config.smtpPass,
  },
});
```

**Environment variables needed:**
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxx
FROM_EMAIL=noreply@budgetingtool.com
```

#### Task 3: Create Email Templates
File: `backend/src/templates/emailTemplates.ts` (new file)

Create templates for:
1. **Alert Email** - When user exceeds budget
   ```
   Subject: Budget Alert: [Category] Spending Warning
   Body: You've spent $X in [Category] (limit: $Y)
   ```

2. **Report Email** - Weekly/monthly summary
   ```
   Subject: Your [Weekly/Monthly] Budget Report
   Body: Spending breakdown, categories, comparison
   ```

#### Task 4: Test Email Sending
Create: `backend/testEmailService.ts`
```typescript
// Send test email to verify SendGrid works
const result = await emailService.sendTestEmail('your-email@example.com');
// Should receive test email within 1 minute
```

---

### Phase 2.2: Build Frontend UI (5-6 hours)

#### Task 1: Create AlertsPage Component
File: `frontend/src/pages/AlertsPage.tsx` (350+ lines)

**Features:**
- List all alerts with pagination
- Show alert details: category, threshold, frequency
- Create new alert button
- Edit alert button (modal)
- Delete alert button (with confirmation)
- Alert statistics (total alerts, triggered this month)
- Filter by status (active/inactive)
- Sort by category or threshold

**Component structure:**
```typescript
interface Alert {
  id: number;
  userId: number;
  categoryId: number;
  categoryName: string;
  warningThreshold: number;        // e.g., 80%
  criticalThreshold: number;       // e.g., 100%
  isActive: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
}

// Main page component
export function AlertsPage() {
  // State: alerts list, loading, selected alert
  // Load alerts on mount
  // Handle create, update, delete operations
  // Show success/error toasts
}
```

#### Task 2: Create AlertModal Component
File: `frontend/src/components/AlertModal.tsx` (200+ lines)

**Features:**
- Form for creating/editing alert
- Category dropdown
- Warning threshold input (%)
- Critical threshold input (%)
- Frequency selector (daily, weekly, monthly)
- Active/inactive toggle
- Save and Cancel buttons

#### Task 3: Create EmailPreferencesPage
File: `frontend/src/pages/EmailPreferencesPage.tsx` (300+ lines)

**Features:**
- Email address display (read-only or editable)
- Alert preferences:
  - [ ] Receive spending alerts
  - [ ] Frequency (immediate, daily digest, weekly)
  - [ ] Alert threshold (warning only, critical only, both)
- Report preferences:
  - [ ] Receive weekly report
  - [ ] Receive monthly report
  - [ ] Report day/time
- Test email button
- Email preview section (sample alert, sample report)
- Save preferences button

#### Task 4: Add Route Integration
File: `frontend/src/App.tsx`

```typescript
// Add these routes inside the ProtectedRoute section:
<Route
  path="/alerts"
  element={
    <ProtectedRoute>
      <Layout>
        <AlertsPage />
      </Layout>
    </ProtectedRoute>
  }
/>

<Route
  path="/email-preferences"
  element={
    <ProtectedRoute>
      <Layout>
        <EmailPreferencesPage />
      </Layout>
    </ProtectedRoute>
  }
/>
```

#### Task 5: Update Navigation
File: `frontend/src/components/Layout.tsx`

Add navigation links:
```typescript
<button onClick={() => navigate('/alerts')}>
  Alerts
</button>

<button onClick={() => navigate('/email-preferences')}>
  Email Preferences
</button>
```

---

### Phase 2.3: Connect Backend to Frontend (2-3 hours)

#### Task 1: Create API Service
File: `frontend/src/services/alertService.ts` (new file)

```typescript
export class AlertAPI {
  // Alerts
  static async getAlerts() { }
  static async createAlert(data) { }
  static async updateAlert(id, data) { }
  static async deleteAlert(id) { }
  
  // Email Preferences
  static async getEmailPreferences() { }
  static async updateEmailPreferences(data) { }
  static async sendTestEmail() { }
  
  // Stats
  static async getAlertStats() { }
}
```

#### Task 2: Connect Components to API
Update AlertsPage and EmailPreferencesPage to:
- Load data on component mount
- Call API when user creates/edits/deletes alert
- Show loading spinners
- Display error messages
- Show success toasts

#### Task 3: Error Handling
- Display error messages in UI
- Handle network failures gracefully
- Validation (e.g., thresholds between 0-100%)
- Confirmation dialogs for destructive actions

---

## 📁 Complete File Structure

```
budgeting-tool/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── alertService.ts (440 lines) ✅
│   │   │   ├── emailReportService.ts (520 lines) ✅
│   │   │   ├── emailService.ts (needs completion for SMTP)
│   │   │   └── [NEW] emailTemplates.ts (email content)
│   │   ├── routes/
│   │   │   ├── alerts.ts (200 lines) ✅
│   │   │   └── emailReports.ts (200 lines) ✅
│   │   ├── jobs/
│   │   │   └── reportSchedulerJob.ts (245 lines) ✅
│   │   └── [NEW] testEmailService.ts (verification)
│   ├── .env.example (add email config)
│   └── package.json (add nodemailer if needed)
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── [NEW] AlertsPage.tsx (350+ lines)
    │   │   └── [NEW] EmailPreferencesPage.tsx (300+ lines)
    │   ├── components/
    │   │   ├── [NEW] AlertModal.tsx (200+ lines)
    │   │   ├── [NEW] AlertStats.tsx (150+ lines)
    │   │   └── Layout.tsx (add nav links)
    │   ├── services/
    │   │   └── [NEW] alertService.ts (API calls)
    │   └── App.tsx (add routes)
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Alert creation validation
- [ ] Threshold calculation
- [ ] Email template rendering
- [ ] Report scheduling logic

### Integration Tests
- [ ] Create alert → Save to DB → API returns correct data
- [ ] Update alert → API updates → Frontend reflects change
- [ ] Delete alert → Removed from DB → Frontend updates
- [ ] Email preferences save and load correctly

### End-to-End Tests
- [ ] User creates alert → Hits threshold → Email sent
- [ ] User sets weekly report → Report generated and sent
- [ ] Alert shows in UI immediately after creation
- [ ] Test email button sends real email to user

### Manual Testing Checklist
- [ ] Create alert with valid thresholds
- [ ] Try invalid thresholds (>100%, <0%)
- [ ] Edit existing alert
- [ ] Delete alert (with confirmation)
- [ ] View alert statistics
- [ ] Update email preferences
- [ ] Send test email (check inbox)
- [ ] Verify email formatting
- [ ] Check dark mode compatibility
- [ ] Mobile responsive
- [ ] No console errors

---

## 📅 Weekly Timeline

### Week 1: Email Service + Basic UI
- **Days 1-2:** SendGrid setup, SMTP configuration, test emails
- **Days 3-4:** Build AlertsPage and AlertModal components
- **Day 5:** Build EmailPreferencesPage, connect to API

### Week 2: Testing & Polish
- **Days 1-2:** End-to-end testing
- **Days 3-4:** Bug fixes, UX improvements
- **Day 5:** Final testing, deployment preparation

---

## 🔧 Configuration Checklist

### Environment Variables
```env
# .env file in backend root
SENDGRID_API_KEY=SG.xxx
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxx
FROM_EMAIL=noreply@yourdomain.com
ALERT_CHECK_INTERVAL=600000  # 10 minutes
```

### Database
```sql
-- Verify all Phase 2 tables exist:
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' 
AND table_name LIKE '%alert%' OR table_name LIKE '%email%';

-- Should show: spending_alerts, alert_preferences, 
--              email_reports, email_report_schedules, 
--              email_preferences, email_templates, alert_history
```

### Dependencies
```bash
# Add if not already installed:
npm install nodemailer
npm install @types/nodemailer --save-dev

# Verify scheduler is running:
# Check backend logs for "Scheduler initialized" message
```

---

## 📊 Success Criteria

Phase 2 Completion is **complete** when:

- [ ] SendGrid configured and sending emails
- [ ] AlertsPage loads and displays user's alerts
- [ ] Can create new alert with form validation
- [ ] Can edit existing alert
- [ ] Can delete alert with confirmation
- [ ] EmailPreferencesPage loads and displays preferences
- [ ] Can update email preferences
- [ ] Test email button sends real email
- [ ] Alert statistics display correctly
- [ ] Dark mode works on both pages
- [ ] Mobile responsive (tablet/phone)
- [ ] No console errors or warnings
- [ ] API calls return correct status codes
- [ ] Email received within 1 minute of threshold hit
- [ ] Weekly/monthly reports generate and send
- [ ] Navigation links work
- [ ] Error messages display appropriately

---

## 🚀 Implementation Order (Step-by-Step)

### Session 1: Setup & Configuration (3-4 hours)
1. Create SendGrid account and get API key
2. Add environment variables to .env file
3. Verify SMTP configuration in emailService.ts
4. Create emailTemplates.ts with alert and report templates
5. Create and run testEmailService.ts to verify email sending
6. Document any issues

### Session 2: Build Alerts UI (3-4 hours)
1. Create AlertsPage.tsx component
2. Create AlertModal.tsx component
3. Create AlertStats.tsx component
4. Add routes in App.tsx
5. Add navigation in Layout.tsx
6. Test basic component rendering

### Session 3: Wire Up Alerts API (2-3 hours)
1. Create alertService.ts API client
2. Connect AlertsPage to API
3. Implement create alert flow
4. Implement edit alert flow
5. Implement delete alert flow
6. Add error handling and toast notifications

### Session 4: Build Email Preferences UI (3-4 hours)
1. Create EmailPreferencesPage.tsx
2. Add to routes and navigation
3. Create API client methods for email preferences
4. Connect component to API
5. Implement save preferences flow
6. Add test email button functionality

### Session 5: Testing & Polish (2-3 hours)
1. Test all alert CRUD operations
2. Test email sending end-to-end
3. Test email preferences saving
4. Dark mode testing
5. Mobile responsiveness
6. Bug fixes and UX improvements

### Session 6: Final Verification (1-2 hours)
1. Run comprehensive manual testing
2. Verify scheduler job is running
3. Check alert emails are sending
4. Check report emails are sending
5. Document any edge cases
6. Prepare for deployment

---

## 🐛 Common Issues & Solutions

### Email Not Sending
**Problem:** Test email not received
**Solutions:**
1. Check API key is correct in .env
2. Check SMTP settings: host=smtp.sendgrid.net, port=587
3. Check FROM_EMAIL is valid
4. Check recipient email is correct
5. Check spam folder

### Alerts Not Triggering
**Problem:** Threshold exceeded but no email sent
**Solutions:**
1. Check scheduler job is running (see backend logs)
2. Verify alert is marked active in database
3. Check alert thresholds are correct (0-100%)
4. Verify spending actually exceeded threshold
5. Check email preferences allow alerts

### UI Not Loading
**Problem:** AlertsPage or EmailPreferencesPage blank
**Solutions:**
1. Check routes are added in App.tsx
2. Check navigation links work
3. Check API calls returning data (use Network tab)
4. Check for JavaScript errors in console
5. Verify user is authenticated

### Dark Mode Issue
**Problem:** Dark mode colors wrong on new pages
**Solutions:**
1. Use consistent Tailwind dark: prefix
2. Test in browser DevTools dark mode
3. Check components use same color palette
4. Verify CSS classes match existing pages

---

## 📝 Code Templates

### AlertModal Component Template
```typescript
import React, { useState } from 'react';
import { AlertAPI } from '../services/alertService';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  alert?: Alert | null;
  categories: Category[];
}

export function AlertModal({ isOpen, onClose, onSave, alert, categories }: AlertModalProps) {
  const [formData, setFormData] = useState(alert || {
    categoryId: '',
    warningThreshold: 80,
    criticalThreshold: 100,
    frequency: 'daily',
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (alert?.id) {
        await AlertAPI.updateAlert(alert.id, formData);
      } else {
        await AlertAPI.createAlert(formData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving alert:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">{alert ? 'Edit Alert' : 'Create Alert'}</h2>
        <form onSubmit={handleSubmit}>
          {/* Form fields */}
          <div className="flex gap-2 mt-6">
            <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded">
              Save
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-300 px-4 py-2 rounded">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### AlertsPage Template
```typescript
import React, { useState, useEffect } from 'react';
import { AlertAPI } from '../services/alertService';
import { AlertModal } from '../components/AlertModal';

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await AlertAPI.getAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this alert?')) return;
    try {
      await AlertAPI.deleteAlert(id);
      setAlerts(alerts.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Spending Alerts</h1>
      
      <button 
        onClick={() => { setSelectedAlert(null); setIsModalOpen(true); }}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-6"
      >
        Create Alert
      </button>

      {loading ? (
        <div>Loading...</div>
      ) : alerts.length === 0 ? (
        <div className="text-gray-500">No alerts created yet</div>
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => (
            <div key={alert.id} className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{alert.categoryName}</h3>
                  <p className="text-sm text-gray-600">
                    Warning at {alert.warningThreshold}% | Critical at {alert.criticalThreshold}%
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setSelectedAlert(alert); setIsModalOpen(true); }}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(alert.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={loadAlerts}
        alert={selectedAlert}
        categories={[]} // Load from API
      />
    </div>
  );
}
```

---

## 🎯 Next: Phase 4 Preparation

Once Phase 2 is complete, Phase 4 (Advanced Analytics) will build on:
- Alert system (to display with trends)
- Email reports (to include analytics)
- Data collection (search patterns, spending habits)

So completing Phase 2 properly sets up for major success in Phase 4.

---

## ✅ Ready to Start?

You have:
- ✅ Complete backend already implemented
- ✅ Database schema ready
- ✅ Detailed step-by-step plan
- ✅ Code templates to copy
- ✅ Testing checklist

**Next action:** Set up SendGrid account and configure SMTP, then start building the frontend components.

Good luck! 🚀
