import asyncio
import websockets
import json

async def test_ws():
    uri = "https://simvesto-c67n.onrender.com/ws/market-anomalies"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            while True:
                response = await websocket.recv()
                data = json.loads(response)
                print("Received:", data)
    except Exception as e:
        print("Error:", e)

asyncio.run(test_ws())
