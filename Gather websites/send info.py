import requests
import math

def p(q,ep):
      return (q)/((1-q)*(math.e**ep + q))

def read_data_from_file(filename):
    with open(filename, "r") as file:
        data = file.readlines()
    return [element.strip() for element in data]

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

# Usage example:
if __name__ == "__main__":
    
    api_url = "https://costrictor-directory.obonk.repl.co/init"  # Replace "your-api-url" with the actual API endpoint URL
    hsts_data = read_data_from_file("hsts_enabled.txt")
    http_data = read_data_from_file("http_only.txt")
    
    avg_num_websites = (len(hsts_data) + len(http_data)) // 2
    payload = {
        "filterSize": 40000,  # Replace with the actual value
        "hstsData": hsts_data,  # Replace with the actual list of hstsData
        "httpData": http_data,  # Replace with the actual list of httpData
        "p": p(0.99,7),  # Replace with the actual value
        "q": 0.99,  # Replace with the actual value
        "numWebsites": avg_num_websites,  # Replace with the actual value
        "ptm": 0.045,  # Replace with the actual value
        "stm": 0.07,  # Replace with the actual value
    }

    response = post_to_api(api_url, payload)
    if response:
        print("API response:", response)