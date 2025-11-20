import json
import boto3
import base64
import uuid
from datetime import datetime

s3_client = boto3.client('s3')
BUCKET_NAME = 'voiceclone-audio-storage'

def handler(event, context):
    """
    Lambda function to handle audio recording uploads
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Get user ID (from Cognito later, using temp ID for now)
        user_id = body.get('user_id', str(uuid.uuid4()))
        
        # Get audio data
        recordings = body.get('recordings', [])
        
        if not recordings:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST'
                },
                'body': json.dumps({'error': 'No recordings provided'})
            }
        
        uploaded_files = []
        
        # Upload each recording to S3
        for idx, recording in enumerate(recordings):
            # Decode base64 audio data
            audio_data = base64.b64decode(recording['audio_data'])
            
            # Generate unique filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"recordings/{user_id}/{timestamp}_sample_{idx}.webm"
            
            # Upload to S3
            s3_client.put_object(
                Bucket=BUCKET_NAME,
                Key=filename,
                Body=audio_data,
                ContentType='audio/webm',
                Metadata={
                    'category': recording.get('category', 'normal'),
                    'duration': str(recording.get('duration', 0)),
                    'prompt': recording.get('prompt', '')
                }
            )
            
            uploaded_files.append({
                'filename': filename,
                's3_uri': f"s3://{BUCKET_NAME}/{filename}"
            })
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST'
            },
            'body': json.dumps({
                'message': 'Recordings uploaded successfully',
                'user_id': user_id,
                'files': uploaded_files,
                'total_samples': len(uploaded_files)
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST'
            },
            'body': json.dumps({'error': str(e)})
        }
