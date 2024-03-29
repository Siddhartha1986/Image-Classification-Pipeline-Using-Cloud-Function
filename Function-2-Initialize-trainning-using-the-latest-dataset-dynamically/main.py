# It is a HTTP triggered Function.
# Remeber you Already need a bucket named "YOUR_CLOUD_BUCKET_2" and a file "latest-dataset-id.txt" for this approach.

import functions_framework
from google.cloud import aiplatform, storage
import logging

@functions_framework.http
def check_and_train_model(request):
    # Initialize logging
    logging.basicConfig(level=logging.INFO)
    try:
        # Initialize connection to Vertex AI
        aiplatform.init(location='us-central1')
        logging.info("AI Platform initialized.")

        # Fetch the datasets and filter by name, then get the most recent one
        all_datasets = aiplatform.ImageDataset.list(order_by="create_time desc")
        # Filter datasets where the display_name matches 'dataset-construction'
        filtered_datasets = [ds for ds in all_datasets if ds.display_name == 'dataset-construction']       # Replace "dataset-construction" with the dataset name you used in cloud function 1.
        
        if not filtered_datasets:
            logging.error("No matching datasets found.")
            return {"message": "No matching datasets found."}, 404

        latest_dataset = filtered_datasets[0]  # Get the most recent dataset
        latest_dataset_id = latest_dataset.resource_name.split('/')[-1]
        logging.info(f"Latest dataset ID for 'dataset-construction': {latest_dataset_id}")

        # Fetch the latest dataset ID from Cloud Storage
        storage_client = storage.Client()
        bucket_name = 'YOUR_CLOUD_BUCKET_2'  # Replace with your bucket name
        blob_name = 'latest-dataset-id.txt'   # A file to store the dataset ID
        blob = storage_client.bucket(bucket_name).blob(blob_name)
        
        # Check if the blob exists to handle the case where there's no ID stored yet
        if blob.exists():
            stored_dataset_id = blob.download_as_text()
        else:
            stored_dataset_id = ""

        # Compare the latest dataset ID with the stored one
        if latest_dataset_id == stored_dataset_id:
            logging.info("The latest dataset has already been used for training.")
            return {"message": "The latest dataset has already been used for training."}
        else:
            # Store the new latest dataset ID in Cloud Storage
            blob.upload_from_string(latest_dataset_id)
            logging.info(f"New dataset ID {latest_dataset_id} has been stored in Cloud Storage.")

            # Use the latest dataset ID to get the dataset and initiate training
            dataset = aiplatform.ImageDataset(latest_dataset_id)
            display_name = 'construction-image-detection-model-1'
            prediction_type = 'classification'

            # Create the training job
            job = aiplatform.AutoMLImageTrainingJob(
                display_name=display_name,
                prediction_type=prediction_type
            )

            # Run the training job
            job.run(
                dataset=dataset,
                training_fraction_split=0.7,
                validation_fraction_split=0.15,
                test_fraction_split=0.15,
                budget_milli_node_hours=8000
            )

            logging.info("Model training initiated. Check Vertex AI, models.")
            return {"message": "Model training initiated. Check Vertex AI, models."}

    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
        return {"message": f"An error occurred: {str(e)}"}, 500
