# Quote Maker Pro — Evans Property Clearance

This is a complete offline-first iPhone-friendly PWA.

## Included
- Waste cost calculator with all requested waste types and rates.
- Labour rules: £60 standard, £130 soil/rubble only, £150 soil/rubble + other waste.
- Minimum £80 charge.
- Standard ×1.5, +10%, +20%, custom pricing.
- Customer view hides costs, labour and profit.
- Owner view protected by PIN.
- Saved quotes stored locally on the device.
- Quote numbering: EPC-YYYY-00001.
- Customer details, notes and payment status.
- Daily/weekly/monthly profit and weekly quoted/paid/outstanding/profit.
- Extra charges and custom labour.
- Estimated weight guide and quick item buttons.
- Offline service worker and Home Screen PWA metadata.
- WhatsApp sharing button.

## LOGO
The supplied Evans Property Clearance logo has been installed as `logo.jpg` and is used throughout the app and as the Home Screen icon.

## PIN
The initial owner PIN is `2468`. Before using the app for real customer data, change `pin:"2468"` in `app.js`.

## iPhone installation
The app must be served from HTTPS for the service worker/PWA installation to work reliably.

1. Upload the folder to an HTTPS web host.
2. Open the site in Safari on iPhone.
3. Tap Share → Add to Home Screen.
4. Open Quote Maker Pro from the Home Screen.
5. Load it once while online; after that the app shell is cached for offline use.

WhatsApp itself needs an internet connection to send a message. Quotes and calculations remain available offline.

## Security note
The owner PIN is an app-level privacy lock, not encryption. Local quote data is stored in the browser's local storage. Do not treat this as a secure database for highly sensitive information.
