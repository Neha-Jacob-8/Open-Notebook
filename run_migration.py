"""Run migration manually to fix novel feature tables"""
import asyncio
from open_notebook.database.repository import repo_query

async def run_migration():
    print("Running migration 16 for novel feature tables...")
    
    # Read migration SQL
    with open("migrations/16.surrealql", "r") as f:
        sql = f.read()
    
    # Split into statements and run each
    statements = [s.strip() for s in sql.split(";") if s.strip() and not s.strip().startswith("--")]
    
    for stmt in statements:
        if stmt:
            try:
                print(f"Running: {stmt[:60]}...")
                await repo_query(stmt)
                print("  OK")
            except Exception as e:
                print(f"  Error: {e}")
    
    print("\nMigration complete!")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    asyncio.run(run_migration())
