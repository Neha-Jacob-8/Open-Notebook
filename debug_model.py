"""Debug script to test FULL quiz generation like the API does"""
import asyncio
import os

# Ensure API keys are loaded
from dotenv import load_dotenv
load_dotenv()

async def test_quiz_generation():
    from open_notebook.services.quiz_service import QuizGenerationService
    
    print("Testing full quiz generation...")
    
    try:
        session = await QuizGenerationService.generate_quiz(
            notebook_id="notebook:f1jodat25ruahw23qu9c",
            num_questions=3,
            difficulty="easy",
            source_ids=None,
            model_id=None
        )
        print(f"Quiz session created: {session}")
        print(f"Session ID: {session.id}")
        print(f"Question count: {session.question_count}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_quiz_generation())
