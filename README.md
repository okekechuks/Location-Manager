# Location Manager (Lightweight Browser React Demo)

Simple zero-build demo that runs in the browser using UMD React + Babel standalone. Stores data in `localStorage` and supports add/view/edit/delete of company locations, custom fields, and CSV export for Excel.

How to run locally

1. Open `index.html` in a browser. For the best experience use a local static server (recommended):

```powershell
# from project root (Windows PowerShell)
cd "c:\Users\YourName\OneDrive\Documents\Location Manager"
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

2. Add locations via the Add tab, and view them in View.

Notes
- This is a development/demo setup that uses Babel in the browser. For production, convert to a proper build (Vite/CRA/etc.) and bundle dependencies.
- Place a `logo.png` file in the project root to show the logo in the sidebar.
