import { useState } from "react";
import Tesseract from "tesseract.js";
import { Button, Card } from "react-bootstrap";
import { FaImage } from "react-icons/fa";
import { MdSend } from "react-icons/md";
import "bootstrap/dist/css/bootstrap.min.css";

const ImageToTextConverterComponent = () => {
 const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [invoiceJson, setInvoiceJson] = useState(null);

  const handleFileChange = (event:any) => {
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
          logger: (m) => console.log(m)
        }
      );

      setExtractedText(text);
      const parsedInvoice = analyzeAndProcessText(text);
      setInvoiceJson(parsedInvoice);
    } catch (error) {
      console.error("OCR Error:", error);
    }
  };

  const analyzeAndProcessText = (text:any) => {
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

  const extractItems = (lines:any) => {
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
    < >
      {/* Header */}
      <Card className="shadow w-100" style={{ maxWidth: "100%" }}>
        <Card.Body className="d-flex justify-content-between align-items-center bg-primary text-white">
          <h1 className="h4 m-0 d-flex align-items-center gap-2">
            <FaImage /> Image to Text Converter
          </h1>
          
        </Card.Body>
        <div className="d-flex gap-2 my-2 d-flex justify-content-center">
            {/* <Button variant="primary" className="d-flex align-items-center gap-1">
              <FaImage /> Choose Image
            </Button> */}
            {/* <input type="file" accept="image/*" onChange={handleFileChange} /> */}
            <label className="btn btn-primary d-inline-flex align-items-center">
            Choose Image
            <svg xmlns="http://www.w3.org/2000/svg" className="me-2" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.5v15m7.5-7.5h-15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <input type="file" className="d-none" onChange={handleFileChange}/>
            </label>
            <Button variant="success" className="d-flex align-items-center gap-1" onClick={extractText}>
            Send <MdSend />
            </Button>
        </div>
        <div className="d-flex flex-column align-items-center bg-light">
            <Card className="w-100 my-4" style={{ maxWidth: "95%" }}>
                <Card.Body>
                <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                    <h2 className="h5 m-0 d-flex align-items-center gap-2">
                    Extracted Text:
                    </h2>
                </div>
                {extractedText &&(
                    <pre>{extractedText}</pre>
                )}
                
                </Card.Body> 
                {/* {extractedText && ( 
                    <div>
                    <h3>Extracted Text:</h3>
                    <pre>{extractedText}</pre>
                    </div>
                )} */}

                {/* <Card.Body>
                <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                    <h2 className="h5 m-0 d-flex align-items-center gap-2">
                    Converted JSON:
                    </h2>
                </div>
                Data2
                </Card.Body> */}
                <Card.Body>
                <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                    <h2 className="h5 m-0 d-flex align-items-center gap-2">
                    Converted JSON:
                    </h2>
                </div>
                {invoiceJson &&(
                    <pre>{JSON.stringify(invoiceJson, null, 2)}</pre>
                )}
                </Card.Body>
            </Card>
        </div>
      </Card>
      {/* History Section */}
    </>
  );
};

export default ImageToTextConverterComponent;
