import React, { useState, useRef, useEffect } from "react";
import { Hourglass } from "react-loader-spinner";
import Tesseract from "tesseract.js";
import axios from "axios";
import {
  Modal,
  Button,
  Card,
  Container,
  Row,
  Col,
  Badge,
  Tooltip,
  OverlayTrigger,
} from "react-bootstrap";
import {
  FaCopy,
  FaUpload,
  FaTrash,
  FaHistory,
  FaImage,
  FaSearch,
  FaDownload,
  FaCode,
  FaAlignLeft,
  FaEye,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";

const API_BASE_URL = "http://localhost:3001";
const API_ENDPOINT = "imageToText";

interface ImageToTextData {
  id: string;
  fileName: string;
  text: string;
  timestamp: string;
  imageData: string;
}

interface ImageToTextState {
  data: ImageToTextData[];
  meta: {
    total: number;
    lastUpdated: string | null;
  };
}

interface ToastMessage {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface ImageProcessingState {
  image: string | null;
  fileName: string;
  text: string;
  isLoading: boolean;
  isUploading: boolean;
  progress: number;
}

interface UIState {
  searchTerm: string;
  viewMode: "text" | "json";
  showModal: boolean;
  showDeleteModal: boolean;
  itemToDelete: string | null;
  selectedItem: ImageToTextData | null;
}

function App() {
  const [imageToText, setImageToText] = useState<ImageToTextState>({
    data: [],
    meta: {
      total: 0,
      lastUpdated: null,
    },
  });

  const [processing, setProcessing] = useState<ImageProcessingState>({
    image: null,
    fileName: "",
    text: "",
    isLoading: false,
    isUploading: false,
    progress: 0,
  });

  const [ui, setUI] = useState<UIState>({
    searchTerm: "",
    viewMode: "text",
    showModal: false,
    showDeleteModal: false,
    itemToDelete: null,
    selectedItem: null,
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastIdCounter = useRef(0);

  const updateProcessingState = (newState: Partial<ImageProcessingState>) => {
    setProcessing((prev: ImageProcessingState) => ({ ...prev, ...newState }));
  };

  const updateUIState = (newState: Partial<UIState>) => {
    setUI((prev: UIState) => ({ ...prev, ...newState }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    toastIdCounter.current += 1;
    const newToast = {
      id: toastIdCounter.current,
      message,
      type,
    };
    setToasts((currentToasts: ToastMessage[]) => [...currentToasts, newToast]);

    setTimeout(() => {
      setToasts((currentToasts: ToastMessage[]) =>
        currentToasts.filter((toast: ToastMessage) => toast.id !== newToast.id)
      );
    }, 3000);
  };

  const fetchData = async () => {
    try {
      const response = await axios.get<ImageToTextState>(
        `${API_BASE_URL}/${API_ENDPOINT}`
      );
      setImageToText(response.data);
    } catch (error) {
      showToast("Error fetching data", "error");
    }
  };

  const saveToServer = async (
    extractedText: string,
    imageData: string,
    fileName: string
  ) => {
    try {
      const newData: ImageToTextData = {
        id: Date.now().toString(),
        fileName: fileName || "Untitled",
        text: extractedText || "",
        timestamp: new Date().toISOString(),
        imageData: imageData || "",
      };

      const updatedData = {
        data: [...imageToText.data, newData],
        meta: {
          total: imageToText.data.length + 1,
          lastUpdated: new Date().toISOString(),
        },
      };

      await axios.put(`${API_BASE_URL}/${API_ENDPOINT}`, updatedData);
      setImageToText(updatedData);
      showToast("Text saved successfully!", "success");
    } catch (error) {
      showToast("Error saving text", "error");
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const updatedData = {
        data: imageToText.data.filter((item) => item.id !== id),
        meta: {
          total: imageToText.data.length - 1,
          lastUpdated: new Date().toISOString(),
        },
      };

      await axios.put(`${API_BASE_URL}/${API_ENDPOINT}`, updatedData);
      setImageToText(updatedData);
      updateUIState({ showDeleteModal: false, itemToDelete: null });
      showToast("Item deleted successfully", "success");
    } catch (error) {
      showToast("Error deleting item", "error");
    }
  };

  const downloadText = (text: string, timestamp: string) => {
    try {
      const element = document.createElement("a");
      const file = new Blob([text], { type: "text/plain" });
      element.href = URL.createObjectURL(file);

      // Format date safely
      const date = new Date(timestamp);
      const formattedDate = date.toISOString().split("T")[0];
      element.download = `extracted-text-${formattedDate}.txt`;

      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      showToast("Error downloading text", "error");
    }
  };

  const formatExtractedText = (text: string | undefined) => {
    if (!text) return "";

    return text
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => `<p>${line}</p>`)
      .join("");
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file", "error");
      return;
    }

    try {
      updateProcessingState({ isUploading: true });
      showToast("Uploading image...", "info");

      const reader = new FileReader();
      reader.onload = async (event: ProgressEvent<FileReader>) => {
        const base64Image = event.target?.result as string;
        updateProcessingState({ image: base64Image });

        try {
          updateProcessingState({ isLoading: true, progress: 0 });
          showToast("Processing image...", "info");

          const { data } = await Tesseract.recognize(file, "eng", {
            logger: (m: { status: string; progress: number }) => {
              if (m.status === "recognizing text") {
                updateProcessingState({
                  progress: Math.round(m.progress * 100),
                });
              }
            },
          });

          const formattedText = data.blocks
            ?.map((block: { text: string }) => block.text.trim())
            .filter(Boolean)
            .join("\n");

          updateProcessingState({ text: formattedText || "" });
          await saveToServer(formattedText || "", base64Image, file.name);
          showToast("Image processed successfully!", "success");
        } catch (error) {
          showToast("Error processing image", "error");
        } finally {
          updateProcessingState({ isLoading: false, progress: 0 });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showToast("Error uploading image", "error");
    } finally {
      updateProcessingState({ isUploading: false });
    }
  };

  const handleClear = () => {
    updateProcessingState({
      image: null,
      text: "",
      progress: 0,
      fileName: "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    showToast("Content cleared", "info");
  };

  const copyToClipboard = (textToCopy: string) => {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => showToast("Text copied to clipboard!", "success"))
      .catch(() => showToast("Failed to copy text", "error"));
  };

  const getJsonData = (item: ImageToTextData | null = null): string => {
    if (!item) {
      return JSON.stringify(
        {
          id: "current",
          fileName: processing.fileName || "",
          text: processing.text || "",
          timestamp: new Date().toISOString(),
          imageData: processing.image || "",
        },
        null,
        2
      );
    }
    return JSON.stringify(item, null, 2);
  };

  const viewItemDetails = (item: ImageToTextData) => {
    updateUIState({ selectedItem: item });
    updateUIState({ showModal: true });
  };

  const filteredData = React.useMemo(() => {
    if (!ui.searchTerm) return imageToText.data;

    return imageToText.data.filter((item: ImageToTextData) => {
      const searchLower = ui.searchTerm.toLowerCase();
      return (
        item.text.toLowerCase().includes(searchLower) ||
        item.fileName.toLowerCase().includes(searchLower)
      );
    });
  }, [imageToText.data, ui.searchTerm]);

  const handleDeleteItem = (itemId: string) => {
    updateUIState({
      itemToDelete: itemId,
      showDeleteModal: true,
    });
  };

  const closeModals = () => {
    updateUIState({
      showModal: false,
      showDeleteModal: false,
      itemToDelete: null,
    });
  };

  return (
    <Container fluid className="py-4">
      <Card className="app-card">
        <Card.Header className="app-card-header bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0">
              <FaImage className="me-2" />
              Image to Text Converter
            </h3>
            {/* <a
              href="https://github.com/AltafEmpaxis/image-to-text"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white"
            >
              <FaGithub size={24} />
            </a> */}
          </div>
        </Card.Header>

        <Card.Body className="app-card-body">
          <div className="text-center mb-4">
            <div className="d-flex justify-content-center gap-3">
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Upload an image to extract text</Tooltip>}
              >
                <Button
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  className="d-flex align-items-center gap-2 px-4 py-2"
                >
                  <FaUpload /> Choose Image
                </Button>
              </OverlayTrigger>
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Clear current content</Tooltip>}
              >
                <Button
                  variant="secondary"
                  onClick={handleClear}
                  className="d-flex align-items-center gap-2 px-4 py-2"
                >
                  <FaTrash /> Clear
                </Button>
              </OverlayTrigger>
            </div>
            {processing.fileName && (
              <div className="file-name-badge">
                <FaImage className="text-primary" />
                {processing.fileName}
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            ref={fileInputRef}
            style={{ display: "none" }}
          />

          {(processing.image || processing.text) && (
            <Row className="g-4">
              <Col md={6}>
                <div className="content-container">
                  <div className="content-header">
                    <h5 className="mb-0 text-primary">Selected Image</h5>
                    <Button
                      className="action-button"
                      onClick={() => {
                        updateUIState({
                          selectedItem: {
                            id: "current",
                            text: processing.text,
                            timestamp: new Date().toISOString(),
                            imageData: processing.image!,
                            fileName: processing.fileName,
                          },
                        });
                        updateUIState({ showModal: true });
                      }}
                    >
                      <FaEye />
                    </Button>
                  </div>
                  <div className="content-body p-0">
                    <div className="image-container">
                      {processing.isUploading && (
                        <div className="loading-overlay">
                          <Hourglass
                            visible={true}
                            height="60"
                            width="60"
                            colors={["#306cce", "#72a1ed"]}
                          />
                          <div className="loading-text">Uploading image...</div>
                        </div>
                      )}
                      {processing.image && (
                        <img
                          src={processing.image}
                          alt="Selected"
                          className="image-preview"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="content-container">
                  <div className="content-header">
                    <h5 className="mb-0 text-primary">Extracted Text</h5>
                    <div className="d-flex align-items-center gap-2">
                      <OverlayTrigger
                        placement="left"
                        overlay={
                          <Tooltip>
                            {ui.viewMode === "text"
                              ? "View in db.json format"
                              : "Switch to text view"}
                          </Tooltip>
                        }
                      >
                        <Button
                          className="action-button"
                          onClick={() =>
                            updateUIState({
                              viewMode:
                                ui.viewMode === "text" ? "json" : "text",
                            })
                          }
                        >
                          {ui.viewMode === "text" ? (
                            <FaCode />
                          ) : (
                            <FaAlignLeft />
                          )}
                        </Button>
                      </OverlayTrigger>
                      <OverlayTrigger
                        placement="left"
                        overlay={<Tooltip>Copy to clipboard</Tooltip>}
                      >
                        <Button
                          className="action-button"
                          onClick={() =>
                            copyToClipboard(
                              ui.viewMode === "text"
                                ? processing.text
                                : getJsonData()
                            )
                          }
                        >
                          <FaCopy />
                        </Button>
                      </OverlayTrigger>
                    </div>
                  </div>
                  <div className="content-body">
                    {processing.isLoading ? (
                      <div className="loading-container">
                        <Hourglass
                          visible={true}
                          height="80"
                          width="80"
                          colors={["#306cce", "#72a1ed"]}
                        />
                        <div className="loading-text">Processing image...</div>
                        <div className="progress-container">
                          <div className="progress">
                            <div
                              className="progress-bar"
                              style={{ width: `${processing.progress}%` }}
                            />
                          </div>
                          <div className="progress-text">
                            {processing.progress}% complete
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={
                          ui.viewMode === "json"
                            ? "json-content"
                            : "text-content"
                        }
                      >
                        {ui.viewMode === "text" ? (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: formatExtractedText(
                                processing.text || ""
                              ),
                            }}
                          />
                        ) : (
                          <pre>{getJsonData()}</pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          )}

          {imageToText.data.length > 0 && (
            <Card className="app-card mt-4">
              <Card.Header className="app-card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 text-primary">
                    <FaHistory className="me-2" />
                    History
                  </h5>
                  <Badge bg="primary" className="badge-pill">
                    {filteredData.length} items
                  </Badge>
                </div>
                <div className="search-container">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by text or filename..."
                    value={ui.searchTerm}
                    onChange={(e) =>
                      updateUIState({ searchTerm: e.target.value })
                    }
                  />
                </div>
              </Card.Header>
              <Card.Body>
                <div className="history-list">
                  {filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <div key={item.id} className="history-item">
                        <div className="history-meta">
                          <Badge bg="info" className="badge-pill">
                            {item.fileName}
                          </Badge>
                          <small className="text-muted">
                            {new Date(item.timestamp).toLocaleString()}
                          </small>
                        </div>
                        <div className="text-content-preview">{item.text}</div>
                        <div className="d-flex gap-2 mt-3">
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>View details</Tooltip>}
                          >
                            <Button
                              className="action-button"
                              onClick={() => viewItemDetails(item)}
                            >
                              <FaEye />
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>Copy text</Tooltip>}
                          >
                            <Button
                              className="action-button"
                              onClick={() => copyToClipboard(item.text)}
                            >
                              <FaCopy />
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>Download text</Tooltip>}
                          >
                            <Button
                              className="action-button"
                              onClick={() =>
                                downloadText(item.text, item.timestamp)
                              }
                            >
                              <FaDownload />
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>Delete item</Tooltip>}
                          >
                            <Button
                              className="action-button danger"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <FaTrash />
                            </Button>
                          </OverlayTrigger>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted py-4">
                      No matching items found
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>

      {/* View Details Modal */}
      <Modal
        show={ui.showModal && ui.selectedItem !== null}
        onHide={closeModals}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <span className="text-primary">{ui.selectedItem?.fileName}</span>
            {ui.selectedItem && (
              <small className="text-muted ms-2">
                {new Date(ui.selectedItem.timestamp).toLocaleString()}
              </small>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {ui.selectedItem && (
            <>
              <div className="image-container mb-4">
                <img
                  src={ui.selectedItem.imageData}
                  alt={ui.selectedItem.fileName}
                  className="image-preview"
                />
              </div>
              <div className="mb-4">
                <h6 className="text-primary mb-2">Text Content:</h6>
                <div className="text-content">
                  {ui.selectedItem.text.split("\n").map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </div>
              <div>
                <h6 className="text-primary mb-2">JSON Data:</h6>
                <pre className="json-content">
                  {getJsonData(ui.selectedItem)}
                </pre>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() =>
              ui.selectedItem && copyToClipboard(getJsonData(ui.selectedItem))
            }
          >
            <FaCopy className="me-2" />
            Copy JSON
          </Button>
          <Button
            variant="success"
            onClick={() =>
              ui.selectedItem &&
              downloadText(ui.selectedItem.text, ui.selectedItem.timestamp)
            }
          >
            <FaDownload className="me-2" />
            Download Text
          </Button>
          <Button variant="secondary" onClick={closeModals}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={ui.showDeleteModal} onHide={closeModals} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">
            <FaExclamationTriangle className="me-2" />
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this item? This action cannot be
          undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModals}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => ui.itemToDelete && deleteItem(ui.itemToDelete)}
          >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            <div className={`toast-header bg-${toast.type} text-white`}>
              <span className="icon">
                {toast.type === "success" && <FaCheck />}
                {toast.type === "error" && <FaExclamationTriangle />}
                {toast.type === "info" && <FaImage />}
              </span>
              <strong className="me-auto">
                {toast.type === "success"
                  ? "Success"
                  : toast.type === "error"
                  ? "Error"
                  : "Information"}
              </strong>
            </div>
            <div className="toast-body">{toast.message}</div>
          </div>
        ))}
      </div>
    </Container>
  );
}

export default App;
