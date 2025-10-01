# Number Line Duel - Development Guide

## ⚠️ IMPORTANT - ONLY THESE FILES MATTER!

### 📂 Active Files (Edit These):
- **`client/index.html`** - Main HTML file (Vite entry point)
- **`client/style.css`** - Main CSS file
- **`client/src/client.ts`** - Main TypeScript client code
- **`client/src/ui.ts`** - UI management
- **`client/src/game.ts`** - Game logic

### 🚫 DO NOT Edit (Deleted/Ignored):
- ~~`client/public/index.html`~~ - DELETED
- ~~`client/public/style.css`~~ - DELETED  
- ~~`client/simple.html`~~ - DELETED
- ~~`client/debug.html`~~ - DELETED
- `client/dist/*` - Build output (auto-generated)

## 🚀 Running the Application

From the **root** directory (`c:\source\number-line-duel`):

```bash
npm run dev
```

This starts:
- **Server** on `http://localhost:3001`
- **Client** on `http://localhost:3000` (or next available port)

## 🎨 Current State

**✅ What's Working:**
- Two-column lobby layout
- Modern gradient background
- Glassmorphism effects
- Smooth animations

**🔧 What Was Fixed:**
- Removed duplicate HTML/CSS files
- Cleared old build cache in `dist/`
- Fixed navigation menu positioning
- Proper CSS loading path

## 📍 Current URL
**http://localhost:3002/** (check terminal for actual port)

## 🐛 If Layout Still Looks Wrong

1. **Hard refresh**: `Ctrl + Shift + R` 
2. **Clear browser cache completely**
3. **Check Developer Tools** → Network tab → Verify `style.css` is loading from root, not `/assets/`
4. **Restart dev server**: Kill all node processes and run `npm run dev` again

## 💡 Key CSS Classes

- `.main-nav` - Navigation sidebar (hidden by default at `left: -350px`)
- `.lobby-container` - Two-column grid layout
- `.lobby-section` - Individual game creation/join cards
- `.menu-btn-lobby` - Hamburger menu button (top-left)

---

**Last Updated**: October 1, 2025
**Status**: Development server cleaned and restarted
