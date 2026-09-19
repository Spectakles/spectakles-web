import requests
api_url = "https://mw65nvsceb.execute-api.ap-south-1.amazonaws.com/generate"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "YOUR_SECRET_TEAM_KEY_HERE"
}
payload = {
    "text": "Securely generating audio files with my team's key.",
    "voice_id": "Joanna"
}
response = requests.post(api_url, json=payload, headers=headers)
print(response.status_code)
print(response.text[:200])
