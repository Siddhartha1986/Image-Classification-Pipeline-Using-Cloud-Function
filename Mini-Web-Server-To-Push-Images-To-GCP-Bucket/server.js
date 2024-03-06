const express = require('express');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Ensure the 'uploads' directory exists, create it if it doesn't
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`Created directory: ${uploadsDir}`);
}

// Multer configuration to use the original file names
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir); // Use the 'uploads' directory
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Use the original file name
    }
});

const upload = multer({ storage: storage }); // Multer uses the above storage configuration

const app = express();
const port = 3000;

// Replace these values with your own
const projectId = 'YOUR_PROJECT_ID';
const keyFilename = './key_to_upload_images.json'; // Path to your service account key file
const bucketName = 'YOUR_CLOUD_BUCKET_1'; // The name of your GCS bucket

// Create a client to interact with GCS
const storageClient = new Storage({
    projectId,
    keyFilename,
});

// Function to upload an image to the corresponding folder in GCS
async function uploadImageToGCS(imagePath, originalName, mimeType) {
    console.log('Starting image upload to GCS...');
    const bucket = storageClient.bucket(bucketName);

    // Generate a unique timestamp
    const uniqueNumber = Date.now();
    // Convert the image file name to uppercase
    const imageName = originalName.toUpperCase();

    // Use the capitalized base name as the folder name
    const folderName = path.parse(imageName).name.toUpperCase();

    // Create the destination file name with the specified folder and a unique timestamp
    const newFileName = `${folderName}/${imageName}_${uniqueNumber}${path.extname(imagePath)}`;
    const imageFile = bucket.file(newFileName);

    return new Promise((resolve, reject) => {
        const stream = imageFile.createWriteStream({
            metadata: {
                contentType: mimeType, // Set the MIME type dynamically
            },
        });

        stream.on('error', (err) => {
            console.error('Error uploading image:', err);
            reject(err);
        });

        stream.on('finish', () => {
            console.log(`Image ${imageName} uploaded to GCS folder: ${folderName}`);
            console.log('Upload complete.');

            // Delete the file from the local 'uploads/' directory
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Failed to delete local image:', err);
                } else {
                    console.log(`Successfully deleted local image: ${imagePath}`);
                }
            });

            resolve();
        });

        fs.createReadStream(imagePath)
            .on('error', (err) => {
                console.error('Error reading local file:', err);
                reject(err);
            })
            .pipe(stream);
    });
}

// Endpoint to handle the file upload
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const filePath = req.file.path;
        const originalName = req.file.originalname; // Get the original file name
        const mimeType = req.file.mimetype; // Get the MIME type of the uploaded file
        await uploadImageToGCS(filePath, originalName, mimeType); // Pass the MIME type to your function
        res.send('File uploaded successfully.');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Serve the HTML file for the upload form
app.get('/', (req, res) => {
    res.sendFile('./frontend.html', { root: __dirname });
});

// Start the server
app.listen(port, () => console.log(`Server running on port ${port}`));
