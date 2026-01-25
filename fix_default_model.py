import asyncio
import sys
from dotenv import load_dotenv
from open_notebook.domain.models import DefaultModels

load_dotenv()

async def fix_defaults():
    new_model_id = "model:6v1wm5b0flugzxmrk2y9"  # gemini-1.5-flash
    
    print(f"Updating default models to: {new_model_id}")
    
    defaults = await DefaultModels.get_instance()
    defaults.default_chat_model = new_model_id
    defaults.default_tools_model = new_model_id
    defaults.default_transformation_model = new_model_id
    
    await defaults.update()
    print("Defaults updated successfully!")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(fix_defaults())
