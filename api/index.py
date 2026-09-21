import sys
import os

# Add root directory to python path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from main import app
