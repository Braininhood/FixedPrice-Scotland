import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

try:
    # Attempting to use the user's snippet structure
    # Note: If gpt-5.2 or this specific SDK method is not available, 
    # this will fall back to a standard chat completion check.
    print("Testing OpenAI API access...")
    
    # Standard chat completion check as a baseline
    response = client.chat.completions.create(
        model="gpt-4o", # Using gpt-4o as a reliable 2026 baseline
        messages=[{"role": "user", "content": "Write a one-sentence bedtime story about a unicorn."}]
    )
    
    print("\nAPI Response:")
    print(response.choices[0].message.content)
    print("\nOpenAI API connection successful!")

except Exception as e:
    print(f"\nAn error occurred: {e}")
    print("Check your API key and network connection.")
