"""Update default transformation model to use Gemini"""
import asyncio
from dotenv import load_dotenv
load_dotenv()

from open_notebook.database.repository import repo


async def update_default():
    # Use gemini-2.5-flash for transformation (knowledge graph)
    gemini_model_id = "model:aq4cv05dsk9lbe992nco"  # gemini-2.5-flash
    
    print(f"Updating default_transformation_model to {gemini_model_id}...")
    
    result = await repo.query(
        "UPDATE open_notebook:default_models SET default_transformation_model = $model_id",
        {"model_id": gemini_model_id}
    )
    print(f"Update result: {result}")
    
    # Verify
    defaults = await repo.query("SELECT * FROM open_notebook:default_models")
    if defaults:
        print(f"\nNew default transformation: {defaults[0].get('default_transformation_model')}")


if __name__ == "__main__":
    asyncio.run(update_default())
