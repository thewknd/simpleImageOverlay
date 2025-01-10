let currentText = "";
let uploadedImages = [];
let drawings = [];
let currentImageIndex = 0;
let isDragging = false;
let selectedDrawingIndex = null; // Index des ausgewählten Elements
let startX = 0, startY = 0, currentX = 0, currentY = 0;

// image settings
let downloadImageHeight = 1200;
let barHeight = 20;
let redLineHeight = 3;
let imageFont = "12px Courier";

// Klick auf den sichtbaren Button löst das unsichtbare Datei-Input aus
document.getElementById("customUploadButton").addEventListener("click", () => {
    const uploadInput = document.getElementById("uploadImage");
    uploadInput.value = ""; // Rücksetzen, um denselben Dateinamen erneut zu laden
    uploadInput.click();   // Datei-Dialog öffnen
});

// Event: Dateien hochladen
document.getElementById("uploadImage").addEventListener("change", (event) => {
    const files = event.target.files;

    if (files.length > 0) {
        for (const file of files) {
            const img = new Image();
            img.onload = () => {
                uploadedImages.push(img);
                if (uploadedImages.length === 1) {
                    currentImageIndex = 0; // Zeige das erste Bild direkt an
                }
                drawCanvas();       // Canvas aktualisieren
                updateThumbnailBar(); // Thumbnail-Leiste aktualisieren
            };
            img.src = URL.createObjectURL(file); // Lokale Bildvorschau laden
        }
    }
});

// Funktion: Canvas zeichnen
function drawCanvas() {
    if (uploadedImages.length === 0) return;

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    const uploadedImage = uploadedImages[currentImageIndex];
    const currentCounter = currentImageIndex + 1;

    const margin = 150;
    const targetHeight = window.innerHeight - barHeight - redLineHeight - margin;

    const aspectRatio = uploadedImage.width / uploadedImage.height;
    const targetWidth = targetHeight * aspectRatio;

    canvas.width = targetWidth;
    canvas.height = targetHeight + barHeight + redLineHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(uploadedImage, 0, 0, canvas.width, targetHeight);

    ctx.fillStyle = "red";
    ctx.fillRect(0, targetHeight, canvas.width, redLineHeight);

    ctx.fillStyle = "white";
    ctx.fillRect(0, targetHeight + redLineHeight, canvas.width, barHeight);

    ctx.fillStyle = "black";
    ctx.font = imageFont;
    ctx.textAlign = "left";
    ctx.fillText(`${currentText}-${currentCounter}`, 10, targetHeight + redLineHeight + barHeight / 2 + 5);

    const date = formatDate(new Date());
    ctx.textAlign = "right";
    ctx.fillText(date, canvas.width - 10, targetHeight + redLineHeight + barHeight / 2 + 5);

    // Zeichne den vertikalen Strich neben dem Datum
    const dateWidth = ctx.measureText(date).width;
    const separatorX = canvas.width - dateWidth - 20;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(separatorX, targetHeight + redLineHeight);
    ctx.lineTo(separatorX, targetHeight + redLineHeight + barHeight);
    ctx.stroke();
}

// Funktion: Text aus LocalStorage laden
document.addEventListener("DOMContentLoaded", () => {
    currentText = localStorage.getItem("textInput") || "";
    document.getElementById("textInput").value = currentText;
    drawCanvas(); // Aktualisiere Canvas nach Laden
});

// Event: Text im Eingabefeld speichern und auf allen Bildern aktualisieren
document.getElementById("textInput").addEventListener("input", (event) => {
    currentText = event.target.value;
    localStorage.setItem("textInput", currentText);
    drawCanvas(); // Aktualisiere Canvas für das aktuelle Bild
});

// Event: Scrollen durch Bilder
document.getElementById("canvas").addEventListener("wheel", (event) => {
    if (uploadedImages.length === 0) return;

    if (event.deltaY > 0) {
        currentImageIndex = (currentImageIndex + 1) % uploadedImages.length;
    } else if (event.deltaY < 0) {
        currentImageIndex = (currentImageIndex - 1 + uploadedImages.length) % uploadedImages.length;
    }

    drawCanvas();
});

// Event: Bild löschen erweitern
document.getElementById("deleteImage").addEventListener("click", () => {
    if (uploadedImages.length === 0) {
        alert("Keine Bilder vorhanden, die gelöscht werden können.");
        return;
    }

    // Bild entfernen
    uploadedImages.splice(currentImageIndex, 1);

    // Index anpassen
    if (currentImageIndex >= uploadedImages.length) {
        currentImageIndex = uploadedImages.length - 1;
    }

    if (uploadedImages.length === 0) {
        // Keine Bilder mehr: Canvas leeren
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        alert("Alle Bilder wurden gelöscht.");
    } else {
        // Nächstes oder vorheriges Bild anzeigen
        drawCanvas();
    }

    updateThumbnailBar(); // Miniaturansichten aktualisieren
});

function updateThumbnailBar() {
    const thumbnailBar = document.getElementById("thumbnailBar");
    thumbnailBar.innerHTML = ""; // Leere die aktuelle Leiste

    uploadedImages.forEach((image, index) => {
        const thumbnail = document.createElement("img");
        thumbnail.src = image.src;

        // CSS-Klassen für Stil und Hervorhebung
        thumbnail.classList.add("thumbnail");
        if (index === currentImageIndex) {
            thumbnail.classList.add("selected");
        }

        // Event: Miniaturbild klicken
        thumbnail.addEventListener("click", () => {
            currentImageIndex = index;
            drawCanvas();
            updateThumbnailBar(); // Aktualisiere Hervorhebung
        });

        thumbnailBar.appendChild(thumbnail);
    });
}

// Funktion: Datum formatieren
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

// Funktion: Bild speichern
document.getElementById("downloadImage").addEventListener("click", () => {
    const sanitizedText = currentText.replace(/[^a-zA-Z0-9-_]/g, "_");
    const fileName = `${sanitizedText}-${currentImageIndex + 1}.jpg`;

    const link = document.createElement("a");

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const originalImage = uploadedImages[currentImageIndex];
    const aspectRatio = originalImage.width / originalImage.height;
    const newHeight = downloadImageHeight - barHeight - redLineHeight; // Zielhöhe
    const newWidth = Math.round(newHeight * aspectRatio);

    // Canvas-Größe setzen
    canvas.width = newWidth;
    canvas.height = newHeight + barHeight + redLineHeight;

    // Bild auf das Canvas zeichnen
    ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);

    ctx.fillStyle = "red";
    ctx.fillRect(0, newHeight, canvas.width, redLineHeight);

    ctx.fillStyle = "white";
    ctx.fillRect(0, newHeight + redLineHeight, canvas.width, barHeight);

    ctx.fillStyle = "black";
    ctx.font = imageFont;
    ctx.textAlign = "left";
    ctx.fillText(`${currentText}-${currentImageIndex + 1}`, 10, newHeight + redLineHeight + barHeight / 2 + 5);

    const date = formatDate(new Date());
    ctx.textAlign = "right";
    ctx.fillText(date, canvas.width - 10, newHeight + redLineHeight + barHeight / 2 + 5);

    // Zeichne den vertikalen Strich neben dem Datum
    const dateWidth = ctx.measureText(date).width;
    const separatorX = canvas.width - dateWidth - 20;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(separatorX, newHeight + redLineHeight);
    ctx.lineTo(separatorX, newHeight + redLineHeight + barHeight);
    ctx.stroke();

    link.download = fileName;
    link.href = canvas.toDataURL("image/jpeg", 0.9);
    link.click();
});

// Funktion: Set herunterladen
document.getElementById("downloadSet").addEventListener("click", async () => {
    const zip = new JSZip();
    const textInput = document.getElementById("textInput").value || "image";

    for (let i = 0; i < uploadedImages.length; i++) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const originalImage = uploadedImages[i];
        const aspectRatio = originalImage.width / originalImage.height;
        const newHeight = downloadImageHeight - barHeight - redLineHeight; // Zielhöhe
        const newWidth = Math.round(newHeight * aspectRatio);

        // Canvas-Größe setzen
        canvas.width = newWidth;
        canvas.height = newHeight + barHeight + redLineHeight;

        // Bild auf das Canvas zeichnen
        ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);

        ctx.fillStyle = "red";
        ctx.fillRect(0, newHeight, canvas.width, redLineHeight);

        ctx.fillStyle = "white";
        ctx.fillRect(0, newHeight + redLineHeight, canvas.width, barHeight);

        ctx.fillStyle = "black";
        ctx.font = imageFont;
        ctx.textAlign = "left";
        ctx.fillText(`${currentText}-${i + 1}`, 10, newHeight + redLineHeight + barHeight / 2 + 5);

        const date = formatDate(new Date());
        ctx.textAlign = "right";
        ctx.fillText(date, canvas.width - 10, newHeight + redLineHeight + barHeight / 2 + 5);

        // Zeichne den vertikalen Strich neben dem Datum
        const dateWidth = ctx.measureText(date).width;
        const separatorX = canvas.width - dateWidth - 20;
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(separatorX, newHeight + redLineHeight);
        ctx.lineTo(separatorX, newHeight + redLineHeight + barHeight);
        ctx.stroke();

        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        zip.file(`${textInput}-${i + 1}.jpg`, dataUrl.split(",")[1], { base64: true });
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipBlob);
    link.download = `${textInput}.zip`;
    link.click();
});
