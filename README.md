

# Image Classification Pipeline Using Cloud Functions

This repository contains a complete pipeline for an image classification task using Google Cloud Functions and Vertex AI. The pipeline includes uploading images to a Cloud Storage bucket, creating a dataset, initializing model training, and making predictions with the trained model.
[CLICK HERE FOR DETAILED REPORT OF THE PROJECT](https://github.com/Siddhartha1986/Image-Classification-Pipeline-Using-Cloud-Function/blob/main/Internship_Project_Report.pdf)

## Structure

The repository consists of the following main components:

1. **Mini-Web-Server-To-Push-Images-To-GCP-Bucket**: A Node.js application for uploading images to a specified Google Cloud Storage bucket. Images are uploaded through a web interface and stored in folders corresponding to their names, e.g., an image `cement.jpeg` is stored in a folder named `CEMENT`.

2. **Function-1-to-create-tag.csv-Initialize-dataset-creation**: A Google Cloud Function in Python that checks if the number of images meets a specified threshold. If so, it creates a `tag.csv` file, stores it in the bucket, and uses this file to initialize the dataset creation for Vertex AI.

3. **Function-2-Initialize-training-using-the-latest-dataset-dynamically**: Another Cloud Function in Python that retrieves the latest dataset ID from Vertex AI and compares it with the ID stored in `latest-dataset-id.txt` in a GCP bucket. If they differ, the function initializes a training job.

4. **Prediction-using-the-trained-model**: Contains JavaScript code for making predictions using the trained model deployed on Vertex AI.

## Setup and Deployment

### Mini Web Server

1. Navigate to `Mini-Web-Server-To-Push-Images-To-GCP-Bucket`.
2. Install dependencies: `npm install`.
3. Start the server: `npm start`.
4. Access the web interface on `http://localhost:3000` and upload images.

### Cloud Functions

1. Navigate to each function's directory.
2. Deploy the function to Google Cloud Functions using the following command:
   ```sh
   gcloud functions deploy FUNCTION_NAME --runtime python39 --trigger-http --allow-unauthenticated
   ```
   Replace `FUNCTION_NAME` with the appropriate name for each function.

#### Alternatively:

You can also deploy the Cloud Functions directly through the Google Cloud Console:
   - Go to the Cloud Functions section in Google Cloud Console.
   - Click "Create Function".
   - Fill in the necessary information such as the function name, trigger type, and runtime.
   - Copy and paste the code from the respective function's `main.py` and `requirements.txt`.
   - Click "Deploy" to deploy your function.

### Prediction

1. Navigate to `Prediction-using-the-trained-model`.
2. Follow the instructions in `Making-Prediction.js` to make predictions using the trained model.

## Requirements

- Node.js and npm (for the web server).
- Google Cloud SDK (for deploying Cloud Functions).
- Access to Google Cloud services (Cloud Storage, Cloud Functions, Vertex AI).

## License

This project is licensed under the terms of the LICENSE file found in the repository.

---

Ensure to replace placeholder texts such as `FUNCTION_NAME` with actual values relevant to your project setup. Expand on any instructions based on your project's specific requirements and configurations.
