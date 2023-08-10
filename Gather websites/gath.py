import requests
from requests.exceptions import SSLError

def read_websites_from_file(filename, limit=10000):
  with open(filename, 'r') as file:
    websites = [line.strip() for line in file.readlines()[:limit]]
  return websites


def categorize_websites(websites):
    hsts_enabled = []
    https_only = []
    http_only = []
    failed = 0

    for website in websites:
        https_url = f"https://{website}"
        http_url = f"http://{website}"
        
        # Attempt HTTPS connection
        try:
            response = requests.head(https_url, allow_redirects=True, timeout=5)
            # Check for HSTS
            if response.headers.get('Strict-Transport-Security'):
                hsts_enabled.append(website)
                print(f"\033[32m[+] Fetched HSTS {website}\033[0m")
            else:
                https_only.append(website)
                print(f"\033[32m[+] Fetched HTTPS {website}\033[0m")
            continue  # Skip attempting HTTP connection
        except SSLError:
            pass  # Continue to try HTTP connection
        except requests.exceptions.RequestException:
            continue  # Skip to next website

        # Attempt HTTP connection
        try:
            response = requests.head(http_url, allow_redirects=True, timeout=5)
            http_only.append(website)
            print(f"\033[32m[+] Fetched HTTP {website}\033[0m")
        except requests.exceptions.RequestException:
            print(f"\033[31m[X] Failed to fetch {website} [X]\033[0m")
            failed += 1

    return hsts_enabled, https_only, http_only, failed


def save_to_text_file(websites, filename):
  with open(filename, 'w') as file:
    for website in websites:
      file.write(website + '\n')


def main():
  websites_filename = 'websites.txt'
  top_websites = read_websites_from_file(websites_filename, limit=10000)

  if not top_websites:
    print("Failed to read websites from the file.")
    return

  hsts_enabled, https_only, http_only, failed = categorize_websites(top_websites)

  save_to_text_file(hsts_enabled, 'hsts_enabled.txt')
  save_to_text_file(https_only, 'https_only.txt')
  save_to_text_file(http_only, 'http_only.txt')

  print("Categorization and storage complete!")
  print(f"Failed to fetch {failed} websites")


if __name__ == "__main__":
  main()
