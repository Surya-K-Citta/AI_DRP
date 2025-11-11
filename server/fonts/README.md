# Telugu Font Setup for PDF Generation

To enable proper Telugu text rendering in PDF exports, you need to download and place the Noto Sans Telugu font in this folder.

## Quick Setup

1. **Download the font:**
   - Visit: https://fonts.google.com/noto/specimen/Noto+Sans+Telugu
   - Click "Download family" or use the direct link below
   - Extract the ZIP file
   - Copy `NotoSansTelugu-Regular.ttf` to this `fonts` folder

2. **Direct Download Link:**
   ```
   https://github.com/google/fonts/raw/main/ofl/notosanstelugu/NotoSansTelugu-Regular.ttf
   ```

3. **Verify the file:**
   - The file should be named exactly: `NotoSansTelugu-Regular.ttf`
   - It should be in the `server/fonts/` directory
   - File size should be approximately 200-300 KB

## Alternative: Manual Download

If the automatic download fails:

1. Go to https://fonts.google.com/noto/specimen/Noto+Sans+Telugu
2. Click "Download family" button
3. Extract the ZIP file
4. Find `NotoSansTelugu-Regular.ttf` in the extracted folder
5. Copy it to `server/fonts/NotoSansTelugu-Regular.ttf`

## Verification

After placing the font file, restart your server. When generating a Telugu PDF, you should see in the console:
```
✅ Telugu font registered successfully
```

If you see a warning instead, the font file is not found and Telugu text may not render correctly.

## Note

Without this font, Telugu text in PDFs will appear as garbled characters. The DOCX and XLS exports work correctly without this font as they use Unicode natively.

