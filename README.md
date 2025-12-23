# Training Dashboard

A Progressive Web App for managing strength and general training programs.

## Features

- **Multiple Template Types**
  - Strength training programs with exercise, sets, reps, and tempo tracking
  - Weekly training template for flexible planning

- **Dark Mode**
  - Always-on dark mode for comfortable viewing

- **Auto-Save**
  - Programs automatically save every 30 seconds
  - Data persists in browser localStorage

- **Export Options**
  - Export individual programs as PNG images
  - Export all data as JSON for backup
  - Import JSON files to restore data

- **Offline Support**
  - Works offline as a Progressive Web App
  - Service worker caches all resources

## Getting Started

1. Open `index.html` in your web browser
2. Click on a training type card to create a new program
3. Fill in your training details
4. Programs save automatically

## Usage Tips

- **Navigation**: Use the "Back to Dashboard" button to return to the home page
- **History**: View all saved programs in the History page
- **Search**: Use the search bar in History to find specific programs
- **Duplicate**: Clone existing programs to save time
- **Export**: Back up your data regularly using the Export feature

## Browser Compatibility

Works best in modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

## Data Storage

All data is stored locally in your browser's localStorage. To back up your data:
1. Go to History page
2. Click "Export All Data"
3. Save the JSON file

To restore data:
1. Go to History page
2. Click "Import Data"
3. Select your backup JSON file

## Development

Built with vanilla HTML, CSS, and JavaScript. No build process required.

Files:
- `index.html` - Main dashboard
- `strength-template.html` - Strength program template
- `weekly_training_program_template.html` - Weekly training template
- `history.html` - Program history and management
- `styles/main.css` - Global styles with dark mode
- `scripts/storage.js` - Data persistence layer
- `scripts/utils.js` - Utility functions
