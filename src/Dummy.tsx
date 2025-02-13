import React, { useState } from "react";
import Tesseract from "tesseract.js";

const InvoiceOCR = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [invoiceJson, setInvoiceJson] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const extractText = async () => {
    if (!selectedFile) {
      alert("Please select an image first!");
      return;
    }

    try {
      const { data: { text } } = await Tesseract.recognize(
        selectedFile, 
        "eng", 
        {
          logger: (m) => console.log(m) // Log progress
        }
      );

      setExtractedText(text);
      const parsedInvoice = analyzeAndProcessText(text);
      setInvoiceJson(parsedInvoice);
    } catch (error) {
      console.error("OCR Error:", error);
    }
  };

  const analyzeAndProcessText = (text) => {
    const lines = text.split("\n").map(line => line.trim()).filter(line => line);
    const invoiceData = {};
    
    lines.forEach(line => {
      const match = line.match(/^(.*?):\s*(.*)$/);
      if (match) {
        const key = match[1].trim().replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        const value = match[2].trim();
        invoiceData[key] = value;
      }
    });
    
    invoiceData.items = extractItems(lines);
    return { invoice: invoiceData };
  };

  const extractItems = (lines) => {
    const items = [];
    let startIndex = lines.findIndex(line => line.includes("Sr. No.")) + 1;
    
    for (let i = startIndex; i < lines.length; i++) {
      if (!lines[i].match(/\d+/)) break;
      const parts = lines[i].split(/\s{2,}/);
      if (parts.length >= 7) {
        items.push({
          description: parts[1],
          hsn_code: parts[2],
          qty: parseInt(parts[3]),
          rate: parseFloat(parts[4]),
          taxable_value: parseFloat(parts[5]),
          igst_rate: parseFloat(parts[6]),
          igst_amount: parseFloat(parts[7]),
          total: parseFloat(parts[8]),
          grand_total: parseFloat(parts[9])
        });
      }
    }
    return items;
  };

  return (
    <div>
      <h2>Invoice OCR Converter</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={extractText}>Convert to JSON</button>

      {extractedText && (
        <div>
          <h3>Extracted Text:</h3>
          <pre>{extractedText}</pre>
        </div>
      )}

      {invoiceJson && (
        <div>
          <h3>Converted JSON:</h3>
          <pre>{JSON.stringify(invoiceJson, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default InvoiceOCR;