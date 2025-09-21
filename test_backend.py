#!/usr/bin/env python3
"""
Simple test script to verify the backend is working
"""
import requests
import json

def test_backend():
    base_url = "http://localhost:8000"
    
    print("Testing backend endpoints...")
    
    # Test health check
    try:
        response = requests.get(f"{base_url}/health")
        print(f"Health check: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Health check failed: {e}")
        return
    
    # Test projects endpoint
    try:
        response = requests.get(f"{base_url}/projects")
        print(f"Projects: {response.status_code} - {len(response.json())} projects")
    except Exception as e:
        print(f"Projects endpoint failed: {e}")
    
    # Test datasets endpoint
    try:
        response = requests.get(f"{base_url}/datasets")
        print(f"Datasets: {response.status_code} - {len(response.json())} datasets")
    except Exception as e:
        print(f"Datasets endpoint failed: {e}")
    
    print("Backend test completed!")

if __name__ == "__main__":
    test_backend()

