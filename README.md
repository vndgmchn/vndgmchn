# VNDG MCHN v1 Walking Skeleton

This is the initial walking skeleton for VNDG MCHN v1.
It implements Supabase authentication, Expo Router layout auth guards, and a 4-tab bottom navigation pane.

## Run & Test Checklist

- [ ] Open a terminal in this directory (`vndgmchn`).
- [ ] Run `npx expo start`.
- [ ] Scan the QR code with Expo Go on your mobile device, or press `i`/`a` to open in your simulator.
- [ ] **Test Auth Guard**: You should be presented with the Sign In / Sign Up screen initially since you are logged out.
- [ ] **Test Sign Up**: Enter a valid email and password, then tap **Sign up**. If email confirmations are enabled in Supabase, check your inbox. Otherwise, the session will start.
- [ ] **Test Sign In**: Enter your credentials and tap **Sign in**. The app should route you to the Home tab.
- [ ] **Test Tabs**: Verify that there are 4 tabs at the bottom: Home, Inventory, Calculator, and Marketplace. Tap through each tab and verify the screen changes appropriately.
- [ ] **Test Session Persistence**: Reload the app (`r` in console) or force close Expo Go. When the app reopens, verify you are still authenticated and routed directly to the Home tab.
- [ ] **Test Sign Out**: On the Home tab, tap the **Sign Out** button. You should be instantly routed back to the Sign In screen.
