# Installing Tesseract OCR on Windows

The Note Scanner feature requires Tesseract OCR to be installed on your system.

## Quick Install (Recommended)

### Option 1: Using Chocolatey (Easiest)
If you have Chocolatey installed:
```powershell
choco install tesseract
```

### Option 2: Manual Installation
1. Download the Tesseract installer from:
   https://github.com/UB-Mannheim/tesseract/wiki

2. Run the installer (recommended path: `C:\Program Files\Tesseract-OCR\`)

3. **Important**: During installation, make sure to:
   - Select "Add to PATH" option
   - Or note the installation path for manual configuration

4. Restart your terminal/IDE after installation

### Option 3: Using Winget
```powershell
winget install --id=UB-Mannheim.TesseractOCR -e
```

## Verify Installation

After installation, restart your terminal and run:
```powershell
tesseract --version
```

You should see output like:
```
tesseract 5.x.x
```

## Restart Backend API

After installing Tesseract, restart the backend API server:
1. Stop the current Python process (Ctrl+C in the terminal running `python run_api.py`)
2. Start it again: `python run_api.py`

The OCR service should now be available!

## Troubleshooting

### "Tesseract not found" Error

If you still see the error after installation:

1. **Check if Tesseract is in PATH**:
   ```powershell
   where tesseract
   ```

2. **Manual Path Configuration** (if not in PATH):
   
   Edit `open_notebook/services/ocr_service.py` and update line 25:
   ```python
   tesseract_path = r'C:\Path\To\Your\Tesseract-OCR\tesseract.exe'
   ```

3. **Restart the backend API** after any changes

### Still Not Working?

Make sure both:
- ✅ Python packages installed: `pytesseract` and `pillow`
- ✅ Tesseract OCR engine installed on Windows

Check the backend logs for specific error messages.

## Features Once Working

Once Tesseract is installed, you can:
- 📸 Upload images of handwritten or printed notes
- 📝 Extract text automatically
- 🤖 Get AI-powered insights about the extracted content
- 🏷️ Auto-generate tags and key points
- 💾 Save extracted notes to your notebooks

---
**Note**: The Python packages (`pytesseract` and `pillow`) are already installed.
You just need to install the Tesseract OCR engine itself.
