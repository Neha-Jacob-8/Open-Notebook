import asyncio
import os
import sys
import traceback
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to path
sys.path.append(os.getcwd())

async def main():
    print("Starting debug script...")
    if not os.getenv("GOOGLE_API_KEY"):
        print("GOOGLE_API_KEY not found")
        return

    print("Testing Google TTS directly...")

    try:
        # Try to import Google TTS provider directly
        print("Importing GoogleTextToSpeechModel...")
        from esperanto.providers.tts.google import GoogleTextToSpeechModel
        
        print("Instantiating GoogleTextToSpeechModel...")
        tts = GoogleTextToSpeechModel(
            model_name="gemini-1.5-flash", 
            api_key=os.getenv("GOOGLE_API_KEY")
        )
        
        output_file = Path("debug_google_tts.mp3")
        print(f"Generating audio to {output_file}...")
        
        await tts.generate_audio(
            text="Hello, this is a test of Google TTS using Gemini Flash.",
            output_file=str(output_file),
            voice_id="Puck" 
        )
        
        print(f"Successfully generated audio: {output_file}")
        
    except ImportError:
        print("Could not import esperanto.providers.tts.google")
        try:
            import esperanto
            print(f"Esperanto path: {esperanto.__file__}")
        except:
            print("Esperanto not found")
    except Exception:
        print("TTS generation failed:")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
