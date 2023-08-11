import requests
import math
import numpy as np

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

def zipfian_sample(data, num_samples):
    # Create a Zipf distribution
    zipf = np.random.zipf(1.07, num_samples)
    sampled_data = [data[i % len(data)] for i in zipf]
    return sampled_data

if __name__ == "__main__":
    
    api_url = "https://costrictor-directory.obonk.repl.co/init"
    hsts_data = read_data_from_file("hsts_enabled.txt")
    http_data = read_data_from_file("http_only.txt")
    
    avg_num_websites = (len(hsts_data) + len(http_data)) // 2

    # Sample the data using Zipfian distribution
    hsts_sampled = zipfian_sample(hsts_data, avg_num_websites)
    http_sampled = zipfian_sample(http_data, avg_num_websites)

    # Ensure the last item in both lists is only reported once
    hsts_sampled = list(set(hsts_sampled) - {hsts_data[-1]})
    http_sampled = list(set(http_sampled) - {http_data[-1]})
    combined_sampled = hsts_sampled + http_sampled + [hsts_data[-1], http_data[-1]]

    payload = {
        "filterSize": 40000,
        "hstsData": hsts_sampled,
        "httpData": http_sampled,
        "p": p(0.99,7),
        "q": 0.99,
        "numWebsites": avg_num_websites,
        "ptm": 0.045,
        "stm": 0.07,
    }

    response = post_to_api(api_url, payload)
    if response:
        print("API response:", response)
