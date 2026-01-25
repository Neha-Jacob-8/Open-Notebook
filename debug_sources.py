"""Test SurrealDB record ID parameter binding solutions."""
import asyncio
import os
from dotenv import load_dotenv
load_dotenv()

from open_notebook.database.repository import repo_query, ensure_record_id

async def main():
    output = []
    
    notebook_id = "notebook:f1jodat25ruahw23qu9c"
    
    # Solution 1: Use type:record()
    output.append("Solution 1: type::record($nid)")
    try:
        r1 = await repo_query(
            "SELECT * FROM reference WHERE out = type::record($nid)",
            {"nid": notebook_id}
        )
        output.append(f"Results: {len(r1)}")
    except Exception as e:
        output.append(f"Error: {e}")
    
    # Solution 2: Use <record> cast
    output.append("\nSolution 2: <record>$nid")
    try:
        r2 = await repo_query(
            "SELECT * FROM reference WHERE out = <record>$nid",
            {"nid": notebook_id}
        )
        output.append(f"Results: {len(r2)}")
    except Exception as e:
        output.append(f"Error: {e}")
    
    # Solution 3: Use ensure_record_id
    output.append(f"\nSolution 3: ensure_record_id('{notebook_id}')")
    try:
        rec_id = ensure_record_id(notebook_id)
        output.append(f"RecordID object: {rec_id}, type: {type(rec_id)}")
        r3 = await repo_query(
            "SELECT * FROM reference WHERE out = $nid",
            {"nid": rec_id}
        )
        output.append(f"Results: {len(r3)}")
    except Exception as e:
        output.append(f"Error: {e}")
    
    with open("debug_output.txt", "w") as f:
        f.write("\n".join(output))
    print("Done - check debug_output.txt")

if __name__ == "__main__":
    asyncio.run(main())
