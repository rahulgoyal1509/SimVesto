# import requests

# url = "http://localhost:5000/api/auth/login"

# data = {
#     "email": "rahul@gmail.com",
#     "password": "Rahul@001"
# }

# response = requests.post(url, json=data)

# print("Status Code:", response.status_code)
# print("Response:", response.text)



import requests

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZGFiOTdkZmY2NTE4NmZmN2IwNjYwZCIsImlhdCI6MTc3NTk0MjA2MiwiZXhwIjoxNzc4NTM0MDYyfQ.ONw4fs8v4OLIry4aBo_RYrlL3o-uqjQyeIztQUYDA5c"

headers = {
    "Authorization": f"Bearer {token}"
}

url = "http://localhost:5000/api/protected"  # or your route

response = requests.get(url, headers=headers)

print(response.status_code)
print(response.text)