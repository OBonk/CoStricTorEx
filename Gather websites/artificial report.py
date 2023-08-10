import requests

def post_to_api(url, data):
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Failed to post data. Status code: {response.status_code}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")
        return None
    
url = "https://report-server.obonk.repl.co/report"
payload = {"dom":"tupalo.com","type":1}
payload2 = {"dom":"tupalo.com","type":2}
data = [payload]*500
for i in range(300):
    post_to_api(url,payload)
    post_to_api(url,payload2)