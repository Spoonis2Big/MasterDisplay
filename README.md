# Master Display - Showroom Vignette Database System

A complete database and display system for managing and showcasing showroom vignettes with products, images, and detailed information.

## What It Does

Master Display helps you organize and present your showroom furniture vignettes. Store all your products (sofas, chairs, loveseats, rugs, tables, lamps, decor) with images and information, group them into vignettes, and display them beautifully on showroom monitors or devices.

## Features

✨ **Product Management**
- Store detailed product information (name, category, price, dimensions, materials, etc.)
- Upload multiple images per product
- Organize by category (Sofa, Chair, Rug, Tables, Lamps, Decor, etc.)

🎨 **Vignette Management**
- Create showroom vignettes with multiple products
- Add location tags (Section A1, B2, etc.)
- Assign themes (Modern, Traditional, Coastal, etc.)
- Upload vignette photos

🖥️ **Master Display**
- Grid view for browsing all vignettes
- Slideshow mode with auto-play (perfect for showroom TVs)
- Detailed view with full product information
- Fullscreen support
- Responsive design (works on tablets, monitors, TVs)

👨‍💼 **Easy Admin Panel**
- User-friendly interface
- Drag-and-drop image upload
- Quick product-to-vignette linking
- Category filtering

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Initialize the database:**
   ```bash
   npm run init-db
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Open in browser:**
   - Admin Panel: http://localhost:3000/admin.html
   - Master Display: http://localhost:3000/display.html

## Usage

### Admin Panel
1. Create products with details and images
2. Create vignettes
3. Link products to vignettes
4. Upload vignette images

### Master Display
1. Open display.html on your showroom device
2. Choose Grid View or Slideshow mode
3. Click any vignette for detailed product information
4. Use Fullscreen button for dedicated displays

## Technology Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (portable, no server required)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Image Upload**: Multer

## File Structure

```
MasterDisplay/
├── database/           # SQLite database
├── public/            # Frontend files
│   ├── admin.html     # Admin interface
│   ├── display.html   # Master Display
│   ├── css/           # Stylesheets
│   └── js/            # JavaScript files
├── scripts/           # Database initialization
├── uploads/           # Uploaded images
└── server.js          # Express server
```

## Documentation

See [SETUP.md](SETUP.md) for detailed installation and usage instructions.

## Requirements

- Node.js 14 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)

## License

MIT

## Getting Help

For setup instructions, troubleshooting, and tips, see [SETUP.md](SETUP.md).