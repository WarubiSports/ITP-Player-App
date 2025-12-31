# Debugging Guide: Wellness & Training Logs Issues

## 🔍 How to Debug the Issues

I've added comprehensive logging throughout the application. Follow these steps to diagnose the problem:

### Step 1: Clear Everything and Start Fresh

1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to **Application > Local Storage**
3. Clear all `demo_*` entries
4. **Refresh the page** (Cmd+R or F5)
5. Check console for: `✅ Demo data updated to version 2`

### Step 2: Log in as Demo Player

1. Click **"🎮 Demo Player"** button
2. Check console logs for:
   ```
   📦 New demo users: [... should include p1 with email max.finkgrafe@player.com]
   📦 New demo players: [... should include p1 with user_id: 'p1']
   ```

### Step 3: Check Dashboard Loading

After login, check console for:
```
🔄 SmartGuidance: useEffect triggered with playerId: p1
🎯 Getting next steps for player: p1 Today: 2025-12-30
📊 Wellness logs for player: [...]
```

**Expected**: Should show "Log Your Wellness" in next steps if no log for today exists

### Step 4: Complete Daily Check-In

1. Click **"Log Daily Stats"** on dashboard
2. Complete all 4 steps (sleep, soreness, mood, training)
3. Watch console logs:

```
🔍 All players: [... should include player p1]
🔍 Current profile: { id: 'p1', email: 'max.finkgrafe@player.com', ... }
🔍 Found player: { id: 'p1', user_id: 'p1', ... }
📅 Today date: 2025-12-30
💚 Creating wellness log: {...}
📊 Current wellness logs: [...]
💾 Saving to localStorage - wellnessLogs: [...]
✅ Saved! Verifying: [...]
⚽ Creating training load: {...}
✅ Training load saved: {...}
✨ Check-in complete!
```

### Step 5: Verify SmartGuidance Refresh

After closing the check-in modal:
```
🔄 Dashboard: Check-in closed, triggering SmartGuidance refresh
🔑 Dashboard: Refresh key updated: 0 -> 1
🔄 SmartGuidance: useEffect triggered with playerId: p1
🎯 Getting next steps for player: p1 Today: 2025-12-30
📊 Wellness logs for player: [... should now include today's log]
Comparing log date 2025-12-30 with today 2025-12-30: true
✅ Has logged today: true
```

**Expected**: "Log Your Wellness" should disappear from next steps

### Step 6: Check Progress Page

1. Navigate to Progress page
2. Click **"🔄 Refresh"** button
3. Check wellness logs in the chart

---

## 🐛 Common Issues & Solutions

### Issue 1: Player Not Found
**Symptom**: Console shows `❌ Player not found. Profile ID: ...`

**Cause**: Old demo data in localStorage doesn't have `user_id` field linking players to users

**Solution**:
1. Clear localStorage completely
2. Refresh page
3. Verify console shows version 2 initialized

### Issue 2: Date Mismatch
**Symptom**: Console shows `Comparing log date X with today Y: false` even though dates look same

**Cause**: Date format inconsistency or timezone issues

**Solution**: Check the exact date strings being compared - they must be in `YYYY-MM-DD` format

### Issue 3: Data Not Persisting
**Symptom**: Wellness log saves but disappears after page refresh

**Cause**: localStorage not being written correctly

**Solution**:
1. Check `💾 Saving to localStorage` log
2. Verify `✅ Saved! Verifying:` shows the new data
3. Check Application > Local Storage > `demo_wellnessLogs`

### Issue 4: SmartGuidance Not Refreshing
**Symptom**: Next steps don't update after completing check-in

**Cause**: Refresh key not triggering component remount

**Solution**: Look for these console logs in sequence:
```
🔄 Dashboard: Check-in closed, triggering SmartGuidance refresh
🔑 Dashboard: Refresh key updated: 0 -> 1
🔄 SmartGuidance: useEffect triggered with playerId: p1
```

---

## 🔬 Manual Testing Checklist

- [ ] Version 2 initialized on page load
- [ ] Player account exists with correct `user_id`
- [ ] Profile ID matches player `id` or `user_id`
- [ ] Wellness log created with today's date
- [ ] Wellness log saved to localStorage
- [ ] Training log created (if "trained" = yes)
- [ ] SmartGuidance refresh triggered after check-in
- [ ] getNextSteps finds today's wellness log
- [ ] "Log Your Wellness" disappears from next steps
- [ ] Progress page shows wellness logs
- [ ] Progress page shows training logs

---

## 📊 What to Look For

### ✅ Success Pattern:
```
Demo data v2 loaded → Player found → Log created → Data saved →
SmartGuidance refreshed → Next step removed → Progress displays data
```

### ❌ Failure Points:
1. **Demo data not v2**: Old users/players loaded
2. **Player not found**: user_id mismatch
3. **Log not saved**: localStorage write failed
4. **SmartGuidance not refreshed**: Key didn't change
5. **Date mismatch**: Date format inconsistency
6. **Progress not showing**: Data retrieval issue

---

## 🚨 If Issues Persist

If after following all steps above the issues still persist, capture:

1. **Full console log** from page load through check-in completion
2. **localStorage contents** (Application > Local Storage)
3. **Network tab** showing any failed requests
4. **Screenshots** of the issue

This will help identify the exact failure point.
