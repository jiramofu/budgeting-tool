# Phase 2 Completion - Quick Start Guide
**Get started in 15 minutes**

---

## 🚀 Start Here

### Step 1: Create SendGrid Account (5 minutes)
1. Go to https://sendgrid.com
2. Click "Sign up" (Free plan: 100 emails/day)
3. Complete verification
4. Click "Settings" → "API Keys" → "Create API Key"
5. Copy the key (looks like: `SG.xxxxxxxxxxxxxxxxxxxxx`)

### Step 2: Configure Environment (2 minutes)
Create/update `backend/.env`:

```env
# Add these lines:
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
```

### Step 3: Test Email Sending (3 minutes)
```bash
cd backend
npx ts-node -e "
import { emailService } from './src/services/emailService';
emailService.sendTestEmail('your-email@example.com').then(() => {
  console.log('Test email sent! Check your inbox.');
}).catch(e => console.error('Error:', e.message));
"
```

**Expected:** Email arrives in inbox within 1 minute

### Step 4: Start Next Steps (5 minutes)
Once confirmed email works, begin building frontend components:

1. **AlertsPage.tsx** - List and manage alerts
2. **EmailPreferencesPage.tsx** - Email settings
3. **AlertModal.tsx** - Create/edit alerts

See `PHASE2_COMPLETION_PLAN.md` for detailed implementation.

---

## 📋 Complete Phase 2 Checklist

### Setup (30 min)
- [ ] SendGrid account created
- [ ] API key obtained
- [ ] .env configured with email settings
- [ ] Test email sent successfully

### Frontend - Alerts (4-5 hours)
- [ ] AlertsPage.tsx created and routed
- [ ] AlertModal.tsx for create/edit
- [ ] List view with pagination
- [ ] Create alert button works
- [ ] Edit alert functionality
- [ ] Delete with confirmation
- [ ] Alert statistics display

### Frontend - Email Preferences (3-4 hours)
- [ ] EmailPreferencesPage.tsx created and routed
- [ ] Email display and preferences form
- [ ] Update preferences button
- [ ] Test email button
- [ ] Email template preview

### Integration (2-3 hours)
- [ ] API service created (alertService.ts)
- [ ] All API calls wired up
- [ ] Error handling and validation
- [ ] Success/error toasts
- [ ] Loading states

### Testing (2-3 hours)
- [ ] Manual CRUD testing for alerts
- [ ] Email sending end-to-end
- [ ] Dark mode verified
- [ ] Mobile responsive
- [ ] Console clean (no errors)

### Total Time: 1-2 weeks

---

## 🎯 What Users Will See

### Before Phase 2
- ✗ Alerts configured but no UI
- ✗ Emails not being sent
- ✗ No way to customize alerts

### After Phase 2
- ✅ Alerts page showing all alerts
- ✅ Easy to create/edit/delete alerts
- ✅ Email preferences page
- ✅ Alerts email when threshold hit
- ✅ Weekly/monthly reports in inbox
- ✅ Test email button for verification

---

## 📊 Architecture Diagram

```
User navigates to /alerts
          ↓
AlertsPage component loads
          ↓
API call: GET /api/alerts
          ↓
Backend: alertsRoutes.ts → alertService.ts
          ↓
Database: SELECT * FROM spending_alerts WHERE user_id = $1
          ↓
Return alerts to frontend
          ↓
Display in table/list
```

When alert is created:
```
User fills AlertModal form
          ↓
Clicks "Save"
          ↓
API call: POST /api/alerts (with data)
          ↓
Backend creates alert in database
          ↓
Scheduler job (runs every 10 min):
  - Checks all active alerts
  - Compares user spending to threshold
  - If exceeded: calls emailService.sendAlert()
  - Email sent via SendGrid
          ↓
User receives email notification
```

---

## 💾 Files You Need to Create

```
frontend/src/
├── pages/
│   ├── AlertsPage.tsx          (350 lines) - Main alerts list
│   └── EmailPreferencesPage.tsx (300 lines) - Email settings
├── components/
│   ├── AlertModal.tsx           (200 lines) - Create/edit form
│   └── AlertStats.tsx           (150 lines) - Statistics display
└── services/
    └── alertService.ts          (50 lines) - API client
```

That's it! The backend is already done.

---

## 🧪 Testing After Each Component

After creating each component, test it:

```bash
# 1. Component renders without errors
# Navigate to /alerts or /email-preferences in browser
# Open DevTools → Console → No errors?

# 2. API calls work
# Check Network tab when loading page
# Should see GET /api/alerts returning data

# 3. Create/Edit/Delete works
# Try creating an alert
# Refresh page
# Alert should still be there

# 4. Email sends
# Click "Send Test Email" button
# Should arrive within 1 minute
```

---

## 🔗 Important Files (Already Exist)

You don't need to create these - they're already done:

- `backend/src/services/alertService.ts` ✅ (alert logic)
- `backend/src/services/emailReportService.ts` ✅ (email logic)
- `backend/src/routes/alerts.ts` ✅ (API endpoints)
- `backend/src/routes/emailReports.ts` ✅ (email endpoints)
- `backend/src/jobs/reportSchedulerJob.ts` ✅ (scheduler)
- Database schema ✅ (tables created)

**Your job:** Build the UI that connects to this backend!

---

## 📚 Reference Code

Copy these templates to get started fast:

### AlertsPage Basic Template
```typescript
import React, { useEffect, useState } from 'react';

export function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/alerts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setAlerts(data.data || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Spending Alerts</h1>
      {alerts.map(alert => (
        <div key={alert.id} className="p-4 border rounded mb-4">
          <h3>{alert.categoryName}</h3>
          <p>Warning: {alert.warningThreshold}%</p>
        </div>
      ))}
    </div>
  );
}
```

### API Service Template
```typescript
const token = localStorage.getItem('token');

export const AlertAPI = {
  getAlerts: () => 
    fetch('/api/alerts', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()),

  createAlert: (data) =>
    fetch('/api/alerts', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(r => r.json()),

  // Similar for update, delete, etc.
};
```

---

## 🎬 Implementation Steps

### Week 1
**Day 1-2:** Email setup (SendGrid + SMTP)
```bash
# Create account, get API key, test email sending
```

**Day 3-4:** Build AlertsPage
```bash
# Create pages/AlertsPage.tsx
# Create components/AlertModal.tsx
# Add routes in App.tsx
# Wire up API calls
```

**Day 5:** Build EmailPreferencesPage
```bash
# Create pages/EmailPreferencesPage.tsx
# Add routes in App.tsx
# Wire up API calls
```

### Week 2
**Day 1-2:** Integration testing
```bash
# Test all CRUD operations
# Test email sending
# Test email preferences saving
```

**Day 3-4:** Polish & bug fixes
```bash
# Dark mode testing
# Mobile responsive
# Error handling
# UX improvements
```

**Day 5:** Final verification & deployment
```bash
# Full end-to-end testing
# Documentation
# Ready for production
```

---

## ✅ How to Know You're Done

Phase 2 is complete when users can:

1. ✅ Navigate to `/alerts` page
2. ✅ See list of their alerts
3. ✅ Create new alert with form
4. ✅ Edit existing alert
5. ✅ Delete alert (with confirmation)
6. ✅ View alert statistics
7. ✅ Navigate to `/email-preferences`
8. ✅ Update email settings
9. ✅ Click "Send Test Email" and receive it
10. ✅ Receive alert email when spending exceeds threshold
11. ✅ Receive weekly/monthly report emails
12. ✅ All features work in dark mode
13. ✅ All features responsive on mobile
14. ✅ No console errors or warnings

---

## 🐛 Troubleshooting

**Test email not arriving?**
- Check spam folder
- Verify FROM_EMAIL is set in .env
- Verify API key is correct
- Check email service logs

**API returns 401 Unauthorized?**
- Check token is in localStorage
- Check Authorization header format: "Bearer TOKEN"
- Try logging out and back in

**AlertsPage shows blank?**
- Check route is added in App.tsx
- Check Network tab - is API call happening?
- Check console for JavaScript errors
- Verify you're logged in

**Modal won't close after save?**
- Check onSave callback is called
- Check onClose callback is called
- Verify API returned success

---

## 📞 Need Help?

Refer to:
1. **PHASE2_COMPLETION_PLAN.md** - Detailed implementation guide
2. **Backend code** - alertService.ts, emailService.ts
3. **Existing components** - Copy styling from other pages
4. **API endpoints** - Check routes/alerts.ts for available endpoints

---

## 🎉 After Phase 2

Once complete, you'll be ready for **Phase 4: Advanced Analytics**

Phase 4 will add:
- Spending trends (charts showing money over time)
- Forecasting (predict spending for rest of month)
- Seasonal patterns (detect recurring patterns)
- Advanced reports (custom analytics)

And these work even better WITH Phase 2 alerts!

---

**Ready to start?** Begin with SendGrid setup (5 min), then move to building AlertsPage! 🚀
