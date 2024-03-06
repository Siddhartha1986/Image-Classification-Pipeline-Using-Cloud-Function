# It is a HTTP triggered function
# Set the Entry point as create_dataset_from_images in the cloud while setting the function.

import functions_framework
from flask import Request, jsonify
from google.cloud import storage, aiplatform
import csv
import io

BUCKET_NAME = "YOUR_CLOUD_BUCKET_1"  # Hardcoded bucket name, Replace it with your own bucket name
THRESHOLD = 100
TAG_CSV_FILE = "tag.csv"  # Fixed filename
DATASET_DISPLAY_NAME = 'dataset-construction'  # Define the dataset name
IMPORT_SCHEMA_URI = 'gs://google-cloud-aiplatform/schema/dataset/ioformat/image_classification_single_label_io_format_1.0.0.yaml'

@functions_framework.http
def create_dataset_from_images(request: Request):
    # Create a Storage client
    storage_client = storage.Client()

    # Get the list of files in the bucket
    blobs = list(storage_client.bucket(BUCKET_NAME).list_blobs())

    # Check if the number of images is greater than or equal to the threshold
    if len(blobs) >= THRESHOLD:
        # Generate tag.csv content in memory
        csv_content = generate_tag_csv_in_memory(blobs)

        # Upload the CSV content to Cloud Storage
        upload_csv_to_storage(storage_client, BUCKET_NAME, TAG_CSV_FILE, csv_content)

        # Initialize AI Platform
        aiplatform.init(location='us-central1')

        # Create the dataset inside Vertex AI using the CSV file in Cloud Storage
        create_dataset_in_vertex_ai(storage_client, BUCKET_NAME, TAG_CSV_FILE)

        # Return a success message indicating the dataset creation and CSV file storage
        return jsonify({"message": f"Dataset creation has been initiated. The 'tag.csv' file has been stored in the bucket '{BUCKET_NAME}'."})
    else:
        return jsonify({"message": "Not enough images to create a dataset"})

def generate_tag_csv_in_memory(blobs):
    csv_data = [['image_path', 'label']]
    for blob in blobs:
        image_path = f'gs://{BUCKET_NAME}/{blob.name}'
        label = extract_label_from_path(blob.name)
        csv_data.append([image_path, label])

    # Convert the CSV data into a string
    csv_content = io.StringIO()
    csv_writer = csv.writer(csv_content)
    csv_writer.writerows(csv_data)
    return csv_content.getvalue()

def upload_csv_to_storage(storage_client, bucket_name, tag_csv_file, csv_content):
    # Upload the CSV content to the Cloud Storage bucket
    storage_client.bucket(bucket_name).blob(tag_csv_file).upload_from_string(csv_content, content_type='text/csv')
    print(f"{tag_csv_file} file uploaded to gs://{bucket_name}/{tag_csv_file}")

def create_dataset_in_vertex_ai(storage_client, bucket_name, tag_csv_file):
    # Create the dataset inside Vertex AI
    dataset_path = f'gs://{bucket_name}/{tag_csv_file}'
    aiplatform.ImageDataset.create(
        display_name=DATASET_DISPLAY_NAME,
        gcs_source=dataset_path,
        import_schema_uri=IMPORT_SCHEMA_URI,
        sync=False  # This ensures the function does not wait for the dataset creation to complete
    )

def extract_label_from_path(image_path):
    path_elements = image_path.split("/")
    if len(path_elements) >= 2:
        return path_elements[-2]
    else:
        return "unknown_label"
