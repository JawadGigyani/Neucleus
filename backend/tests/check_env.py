import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from dotenv import load_dotenv
load_dotenv()

for key in ["FEATHERLESS_API_KEY", "TAVILY_API_KEY", "S2_API_KEY"]:
    val = os.getenv(key, "")
    if val and "your_" not in val:
        print(f"{key}: SET (length={len(val)})")
    else:
        print(f"{key}: NOT SET or placeholder")
