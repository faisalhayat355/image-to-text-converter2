# Image to Text Converter

A modern web application built with React, TypeScript, and Vite that converts images to text using Tesseract.js OCR engine.

## Features

- 📷 Image to text conversion using Tesseract.js
- 💾 Local storage of conversion history using JSON Server
- 🔍 Real-time search through converted texts
- 📋 Copy text and JSON data to clipboard
- ⬇️ Download extracted text as files
- 🎨 Modern UI with Bootstrap and React Bootstrap
- 📱 Responsive design for all devices
- 🔄 Real-time conversion progress tracking
- 🎯 Multiple view modes (Text/JSON)
- 🚀 Fast and efficient processing

## Tech Stack

- React 18.2.0
- TypeScript
- Vite 5.2.0
- Bootstrap 5.3.3
- React Bootstrap 2.10.2
- Tesseract.js 5.1.0
- JSON Server (for data persistence)
- React Icons
- Axios for API calls

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/image-to-text-converter.git
cd image-to-text-converter
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server and JSON server:
```bash
npm start
```

This will start:
- Frontend at http://localhost:5173
- JSON Server at http://localhost:3001

## Usage

1. Click "Choose Image" to select an image file
2. Wait for the OCR processing to complete
3. View the extracted text in real-time
4. Copy, download, or view the JSON format of the extracted text
5. Search through your conversion history
6. View, download, or delete previous conversions

## Project Structure

```
image-to-text-converter/
├── src/
│   ├── App.tsx           # Main application component
│   ├── main.tsx         # Application entry point
│   ├── index.css        # Global styles
│   └── assets/          # Static assets
├── public/              # Public assets
└── db.json             # JSON server database
```

## Available Scripts

- `npm start` - Start both frontend and backend servers
- `npm run dev` - Start frontend development server
- `npm run build` - Build for production
- `npm run server` - Start JSON server
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Tesseract.js](https://github.com/naptha/tesseract.js) for OCR functionality
- [React Bootstrap](https://react-bootstrap.github.io/) for UI components
- [JSON Server](https://github.com/typicode/json-server) for backend mock