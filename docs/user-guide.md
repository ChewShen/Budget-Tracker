# User Guide

How to use the Budget Tracker day to day. For setting up your own copy of the app (Supabase, Vercel, migrations), see the [README](../README.md).

**Contents**

1. [Getting started](#1-getting-started)
2. [Adding expenses](#2-adding-expenses)
3. [Categories and tags](#3-categories-and-tags)
4. [Overview: reading your month](#4-overview-reading-your-month)
5. [Monthly bills](#5-monthly-bills)
6. [Budgets](#6-budgets)
7. [Goals](#7-goals)
8. [Instalments](#8-instalments)
9. [Savings](#9-savings)
10. [Reminders](#10-reminders)
11. [Automation and the Inbox](#11-automation-and-the-inbox)
12. [Transactions, export and backup](#12-transactions-export-and-backup)
13. [Your data and privacy](#13-your-data-and-privacy)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Getting started

**Signing in.** Accounts are created by the person who runs the app (there's no public sign-up). You'll get your email and a temporary password. Sign in, then change the password in **Settings → Account → Change password**.

**Just looking?** On the sign-in page, choose **Continue without an account**. You get the whole app with made-up sample data. Nothing is saved: refreshing starts over.

**Install it on your phone.** It works best as an app on your home screen:
- **iPhone:** open the site in **Safari** → **Share** → **Add to Home Screen**, then open it from the new icon. (Reminders only work from the home-screen app, not a Safari tab.)
- **Android:** Chrome → **⋮** → **Install app** / **Add to Home screen**.

**Getting around.** On a phone, the bar at the bottom has Overview, Activity (all expenses), Savings, Goals and the green **+** to add an expense. The gear at the top opens Settings; tap it again to close Settings. On a computer, the same pages are along the top.

**Which version am I on?** Settings shows it under the list of sections, with a **What's new** link.

---

## 2. Adding expenses

Tap **+** (phone) or **Add expense** (computer).

1. Type the amount on the number pad.
2. Pick a **category**, then a **tag** (the tag is what you bought, e.g. Food → Lunch). **Recent** shows your last few tags with their amounts: tap one to fill both in.
3. Optional: a **note**, a different **date**, and **One-off** for unusual purchases (a laptop, a flight). One-offs are left out of your daily average and forecast, so they don't skew them.
4. Tap **Save**, at the top of the sheet or the big button at the bottom.

**It picks the meal for you.** Around breakfast, lunch, tea time, dinner and late night, the sheet opens on that meal's tag already selected.

**Which date it starts on.** **Settings → General → Adding expenses**:
- **Today**: always today.
- **Same as last entry**: for catching up on past days in order. It stays on the date you last used until that day has a **Dinner** or **Supper** entry, then moves on to the next day (never past today).

**Edit or delete.** Tap any expense (Overview or Activity) to change it or delete it. After deleting you get a few seconds to **Undo**. If saving fails (no signal), the change is undone and you get **Retry**.

**A new tag on the spot.** In the sheet, tap **+ New tag** under the tags.

---

## 3. Categories and tags

**Settings → Categories & tags.** Tap a category or tag to rename it (and pick an icon for categories). Anything used by expenses can't be deleted, so your history stays intact; rename it instead.

**The ★ star** marks the ones the app relies on: your **food** category (for the Food & dining card) and the **meal tags** (breakfast, lunch, tea time, dinner, late night) used for meal suggestions and "Same as last entry". You can rename them freely (e.g. "Makan"); the star follows them. Deleting a starred one asks first, because that feature stops working.

---

## 4. Overview: reading your month

Use the arrows at the top to move between months.

- **Month total and forecast.** "On pace for RM 2,084 by 31 Oct": your everyday spending so far, stretched to the end of the month, plus bills still to come. Bills and one-offs aren't stretched.
- **Food & dining, daily average, biggest expense, savings rate.**
- **Budgets** (if you've set any): how each budgeted category is doing.
- **Monthly bills**: which are logged, due soon, overdue or automatic. **Log unpaid bills** adds the ones with known amounts in one tap.
- **Insights**: plain-English highlights, e.g. a tag well above usual, or a budget going over.
- **Monthly spending**: 6 months as bars. Tap a bar to open that month; the chart keeps a couple of months after it on screen. The faded part of this month's bar is the forecast.
- **Compared with usual, spending calendar, fixed vs flexible, year to date, top tags.**
- **"N expenses to confirm"** appears at the top when your Shortcuts have sent something to the Inbox (see [Automation](#11-automation-and-the-inbox)).

---

## 5. Monthly bills

Bills are tags you pay every month (Netflix, electricity, rent). **Settings → Monthly bills → Add bill**:
- **Tag**: the bill (create it in Categories & tags first if needed).
- **Expected amount** (optional): used when logging it for you. Leave empty for bills that vary (electricity); then last month's amount is used.
- **Due day** (optional): gives you "Due in 2 days" / "Overdue" and reminders.
- **Add automatically**: needs an amount and a due day. The expense is added on the due day each month, unless you've already logged it.
- **Instalment plan**: a bill that ends after a number of payments (see [Instalments](#8-instalments)).

A bill counts as paid for the month as soon as an expense with its tag is logged that month.

---

## 6. Budgets

**Settings → Budgets**: a monthly limit per category (blank = no budget). Last month's spending is shown next to each, as a guide.

On Overview, each budget shows what you've spent, where you're heading ("on pace for RM 430"), and what's left per day. It turns amber when you're **on pace to go over** and red when you **are over**. The worst one also appears in Insights. With reminders on, you get a notification once at 80% and once when you go over.

---

## 7. Goals

**Goals → New goal**: something you're saving for, with its price and optionally a target date.

- **Trading something in?** Turn on Trading something in and enter the item and its expected value; it comes off what you need to save.
- **Discounts and vouchers**: RM or % off, with an optional expiry (tap × to clear a date). Expired ones stop counting; you're reminded 3 days and 1 day before one expires.
- **Set aside money**: add (or take back) money you've put aside for the goal. The card shows progress and either "Set aside RM X/month to make it by <date>" or when you'll be ready at your current pace. Money set aside for goals isn't counted in your emergency fund.
- **Bought it**: choose **Paid in full** (logs what you paid as a one-off expense) or **Instalments** (next section).

---

## 8. Instalments

For things paid monthly: Atome, SPayLater, Shopee/Grab PayLater, 0% card plans, phone contracts.

**From a goal: Bought it → Instalments**
1. **Price**: starts at the goal's price after trade-in and vouchers.
2. **Down payment**: starts at what you'd set aside for the goal. Clear it to keep that money free instead. It's logged as a one-off expense on the date you choose.
3. **Interest / fees (%)**: total over the plan, as a % of what you borrow. Leave it at **0%** for most pay-later plans.
4. **Number of payments**, **first payment** month and **due day**, and whether to **add each payment automatically**.
5. Check the summary ("RM 181.17 × 12 · Nov 2026 to Oct 2027 … same as paying upfront") and tap **Start plan**.

The goal moves to **Paying off** ("2 of 12 paid · RM 3,749.20 left · last payment Jul 2027") and becomes Completed after the last payment.

**Without a goal:** **Settings → Monthly bills → Add bill → Instalment plan**, with the monthly amount, due day, number of payments and first payment month.

**How it counts.** Each payment is spending in the month it's paid (not the full price at once), so budgets and your savings rate follow real cash flow. The plan only appears in bills, the forecast, budgets and reminders between its first and last payment. **Savings** shows what you still owe and your **net worth after what you owe**.

---

## 9. Savings

**Set up your accounts once: Settings → Savings accounts → New account**, for each bank account, e-wallet, EPF, ASB or investment you want to track.
- **Liquid**: money you can use. Counts for your emergency fund and "free money".
- **Locked**: money you can't touch yet (EPF, fixed deposits). Counts toward net worth only.
- Closed an account? **Archive** it. It disappears from new months but stays in the months it has balances. Accounts with history can't be deleted, so past net worth never changes.

**Each month: Savings → Record <month> balances** (or **Update balances**). It starts from last month's figures, so you only change what moved. Liquid accounts can have an **interest rate** for the monthly interest estimate.

What the page shows:
- **Net worth** and each account's share; money **set aside for goals** and what's **free**; what's **still owed on instalments** and **net worth after what you owe**.
- **Emergency fund**: how many months of your average spending your free money covers, against your goal (3–12 months), and when you'll reach it.
- **Since last month**: where the change came from, account by account.
- **<Month> check**: did your liquid money grow by what you saved from salary? A big **untracked** amount usually means spending you didn't log (or income/interest you didn't record).
- **Net worth over time** and **savings rate by month**.

Your salary for these calculations is in **Settings → Salary & deductions** (EPF, SOCSO and EIS are worked out for you).

---

## 10. Reminders

Phone notifications around **8pm** (Malaysia time) when something needs you:
- a **bill** due tomorrow, or once if it's overdue (automatic bills are skipped)
- a goal's **voucher** expiring in 3 days or 1 day
- a **budget** reaching 80%, and going over (once each per month)
- optional: **nothing logged today**

**Settings → Reminders**: **Turn on** for this device (allow notifications when asked), choose which reminders you want, and **Send a test**. **Tonight** previews what your data would trigger right now.

- On **iPhone**, this only works from the **home-screen app** (iOS 16.4+), not a Safari tab.
- Turn it on on each device you want notified. Signing out turns it off on that device.
- Most nights there's nothing to send; that's normal. Each reminder is sent only once.

---

## 11. Automation and the Inbox

Let your iPhone send payments to the app instead of typing them. Everything arrives in the **Inbox** for you to confirm, so nothing goes into your spending unchecked.

**1. Create a token.** **Settings → Automation → Create token**. Copy it straight away (it's shown once). **Send a test to the Inbox** checks it works.

**2. Make the Shortcut** (the steps are also on that page):
- **TnG or any payment screen:** in the Shortcuts app, make a shortcut with **Take Screenshot** → **Extract Text from Screenshot** → **Get Contents of URL** (the URL from Settings, method POST, header `Authorization` = `Bearer <your token>`, JSON body `text` = the extracted text and `source` = `tng`) → **Show Notification**. Then set **Settings → Accessibility → Touch → Back Tap → Double Tap** to run it. After paying, double-tap the back of your phone on the success screen. The screen is read on your phone; only the text is sent.
- **Apple Pay (automatic):** Shortcuts → **Automation** → **Transaction** → your cards → Run Immediately, sending `amount`, `merchant` and `source` = `applepay`.
- **Siri:** a shortcut that asks for an amount and what it was, named e.g. "Log expense".

**3. Confirm in the Inbox.** Overview shows **"N expenses to confirm"**; tap it (or go to `/inbox`). Each item has the amount, merchant and date filled in where they could be read, and a tag if the merchant is known. Fix anything, then **Add**, or **×** to dismiss. **Add all ready** confirms every complete item. **original** shows exactly what was read.

**Works on both TnG screens:** the success screen right after you pay, and a receipt opened later from your transaction history (it uses the receipt's own date and time). **Transfers** (e.g. DuitNow Transfer to a bank account) are labelled *Transfer*: moving money to your own account isn't spending, so dismiss those; money sent to someone for something you bought, add as usual.

**Accidental double-taps are ignored.** On a screen with no amount (your home screen, a chat), nothing is added and the notification says *"Not added: no amount found on this screen"*. The same receipt sent twice is only added once, even after you've confirmed it; an Apple Pay or Siri entry with the same amount, merchant and date within 10 minutes counts as a repeat. If an Inbox item matches an expense you already have that day, it says so, so you can dismiss it.

**It learns your merchants.** With **"Next time, suggest this tag for …"** ticked, confirming "GRAB → Grab" means the next Grab payment arrives already tagged, even from another branch.

**Keep it safe.** A token can only add items to *your* Inbox; it can't read anything. If you lose your phone, **Revoke** the token in Settings → Automation.

---

## 12. Transactions, export and backup

**Activity** (Transactions) lists every expense grouped by day, newest first, 50 at a time (**Show 50 more**). Search by tag or note, filter by category, or switch between this month and all months. Day totals always include the whole day.

**Export** (Overview, top right):
- **This month** or **All expenses** as a CSV that opens in Excel or Google Sheets.
- **Savings balances**: one column per account.
- **Full backup**: everything in your account as a JSON file. Worth doing now and then.

---

## 13. Your data and privacy

- You only ever see your own data, and nobody else using the app can see yours. This is enforced by the database itself, not just the app.
- The person who runs the app (the database owner) can technically see all data, as with most apps. If you want your account and everything in it removed, ask them: deleting an account deletes all of its data.
- Guest mode uses made-up data and never touches the database.
- Automation tokens are stored only as a fingerprint (hash) and can be revoked.

---

## 14. Troubleshooting

**The app still shows the old version after an update.** Close the home-screen app completely (swipe it away) and open it again. Settings shows the version.

**I don't get reminders.**
1. Settings → Reminders: is this device **On**? Does **Send a test** arrive?
2. iPhone: are you using the **home-screen app**, and are notifications allowed for it in iPhone Settings?
3. Check **Tonight**: if it says nothing is due, there was nothing to send.

**"Send a test" works but nothing comes at 8pm.** Only the nightly job needs the server's Supabase secret key; whoever runs the app should check README → Reminders → "Check the nightly job".

**A message says "Run the latest migrations in Supabase first".** The app was updated but its database wasn't yet. Whoever runs the app needs to run the newest file in `scripts/migrations/`.

**My Shortcut says "Invalid or revoked token".** Create a new token in Settings → Automation and paste it into the Shortcut's `Authorization` header as `Bearer <token>` (with the space).

**The Inbox got the amount or merchant wrong.** Fix it before adding; tap **original** to see what was read. Payment screens differ, and parsing improves over time.

**Something's missing from my totals.** Check the month at the top of Overview, and whether the expense was saved (a failed save shows a **Retry** message). Activity → all months, then search, will find it.
