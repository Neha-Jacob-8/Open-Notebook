import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from loguru import logger

# Load environment variables
load_dotenv()

# Add current directory to path so we can import from open_notebook if needed
sys.path.append(os.getcwd())

try:
    from podcast_creator import configure, create_podcast
except ImportError:
    logger.error("podcast_creator not installed. Run 'uv pip install podcast-creator'")
    sys.exit(1)

# Mock Data
TEST_CONTENT = """
The mitochondria is the powerhouse of the cell. It generates most of the chemical energy needed to power the cell's biochemical reactions. 
Chemical energy produced by the mitochondria is stored in a small molecule called adenosine triphosphate (ATP).
"""

# 1. Define Profiles
# Using Groq as the user provided a Groq key (gsk_...)
os.environ["GROQ_API_KEY"] = "your_groq_api_key_here"
os.environ["TTS_BATCH_SIZE"] = "1"

EPISODE_PROFILE = {
    "name": "Debug Episode Profile",
    "description": "Debug profile",
    "speaker_config": "Debug Speaker Profile",
    "outline_provider": "groq",
    "outline_model": "llama-3.1-8b-instant",
    "transcript_provider": "groq",
    "transcript_model": "llama-3.1-8b-instant",
    "default_briefing": "Create a short, fun podcast about this topic.",
    "num_segments": 3
}

SPEAKER_PROFILE = {
    "name": "Debug Speaker Profile",
    "description": "Debug speakers",
    "tts_provider": "google",
    "tts_model": "gemini-1.5-flash",
    "speakers": [
        {
            "name": "Host",
            "voice_id": "Puck", 
            "backstory": "A curious host.",
            "personality": "Enthusiastic"
        },
        {
            "name": "Guest",
            "voice_id": "Kore", 
            "backstory": "A knowledgeable expert.",
            "personality": "Calm and precise"
        }
    ]
}

async def main():
    # Check keys
    if not os.getenv("GROQ_API_KEY"):
        logger.error("GROQ_API_KEY not found")
        return
    if not os.getenv("ELEVENLABS_API_KEY"):
        logger.error("ELEVENLABS_API_KEY not found in .env")
        return

    logger.info("Keys found. Configuring podcast_creator...")

    # Configure
    configure("episode_config", {"profiles": {EPISODE_PROFILE["name"]: EPISODE_PROFILE}})
    configure("speakers_config", {"profiles": {SPEAKER_PROFILE["name"]: SPEAKER_PROFILE}})

    output_dir = Path("debug_podcast_output")
    output_dir.mkdir(exist_ok=True)

    logger.info("Starting generation...")
    try:
        result = await create_podcast(
            content=TEST_CONTENT,
            briefing=EPISODE_PROFILE["default_briefing"],
            episode_name="debug_episode",
            output_dir=str(output_dir),
            speaker_config=SPEAKER_PROFILE["name"],
            episode_profile=EPISODE_PROFILE["name"]
        )
        logger.info("Generation successful!")
        logger.info(f"Result: {result}")
    except Exception as e:
        logger.exception(f"Generation failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
