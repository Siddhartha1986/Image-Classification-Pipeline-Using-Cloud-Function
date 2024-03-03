// In this code, we've included both the API endpoint in the clientOptions and the keyFilename when initializing
// the PredictionServiceClient. This ensures that your code uses the custom API endpoint while also authenticating
// using the specified service account credentials.

// Note: When both the keyFilename is set in the PredictionServiceClient and the
// GOOGLE_APPLICATION_CREDENTIALS environment variable are set, the keyFilename takes precedence. Here's how the order of precedence works:
//// 1. Hardcoded path to the key JSON file for the service account
// 2. GOOGLE_APPLICATION_CREDENTIALS (set by command line: set GOOGLE_APPLICATION_CREDENTIALS="C:\Users\sidd_\Documents\AUTOML_Model\learning2112923-c6a24e3ba073.json")
// 3. ADC (created by: "gcloud auth application-default login" in Google Cloud SDK)



const filename = "C:/Users/sidd_/Downloads/wayixia/Chipboard/1695980710933.jpeg";   // path to the image
const endpointId = "5681506434206924800";  // customized Trained Model ID
const project = '543300257306';  // Project number
const location = 'europe-west4'; // Updated location to europewest4

const aiplatform = require('@google-cloud/aiplatform');
const { instance, params, prediction } = aiplatform.protos.google.cloud.aiplatform.v1.schema.predict;

// Imports the Google Cloud Prediction Service Client library
const { PredictionServiceClient } = aiplatform.v1;

// Specify the custom API endpoint and service account key file path
const clientOptions = {
  apiEndpoint: 'europe-west4-aiplatform.googleapis.com', // Updated API endpoint
};

// Initialize the PredictionServiceClient with the custom API endpoint and service account key file
const keyFilePath = "C:/Users/sidd_/Documents/AUTOML_Model/learning2112923-c6a24e3ba073.json";   // Service account key file
const predictionServiceClient = new PredictionServiceClient({
  ...clientOptions,
  keyFilename: keyFilePath,
});

async function predictImageClassification() {
  // Configure the endpoint resource
  const endpoint = `projects/${project}/locations/${location}/endpoints/${endpointId}`;

  const parametersObj = new params.ImageClassificationPredictionParams({
    confidenceThreshold: 0.5,
    maxPredictions: 5,
  });
  const parameters = parametersObj.toValue();

  const fs = require('fs');
  const image = fs.readFileSync(filename, 'base64');
  const instanceObj = new instance.ImageClassificationPredictionInstance({
    content: image,
  });
  const instanceValue = instanceObj.toValue();

  const instances = [instanceValue];

  const request = {
    endpoint,
    instances,
    parameters,
  };

  // Predict request
  const [response] = await predictionServiceClient.predict(request);

  console.log('Predict image classification response');
  console.log(`\tDeployed model id : ${response.deployedModelId}`);
  const predictions = response.predictions;
  console.log('\tPredictions :');
  for (const predictionValue of predictions) {
    const predictionResultObj =
      prediction.ClassificationPredictionResult.fromValue(predictionValue);
    for (const [i, label] of predictionResultObj.displayNames.entries()) {
      console.log(`\tDisplay name: ${label}`);
      console.log(`\tConfidences: ${predictionResultObj.confidences[i]}`);
      console.log(`\tIDs: ${predictionResultObj.ids[i]}\n\n`);
    }
  }
}

predictImageClassification();
