"""Test LLM concept extraction directly"""
import asyncio
import sys
import json
from dotenv import load_dotenv
load_dotenv()

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from open_notebook.graphs.utils import provision_langchain_model
from open_notebook.utils import clean_thinking_content


CONCEPT_EXTRACTION_PROMPT = """You are a knowledge extraction expert. Analyze the following text and extract key concepts, entities, and their relationships.

Text:
{text}

Extract the following:
1. **Concepts**: Key ideas, theories, principles mentioned
2. **People**: Named individuals (real or fictional)
3. **Events**: Historical events, occurrences, happenings
4. **Places**: Locations, geographic areas
5. **Organizations**: Companies, institutions, groups
6. **Relationships**: How these entities relate to each other

For each entity, provide:
- name: The entity name
- type: One of [concept, person, event, place, organization]
- description: Brief description (1-2 sentences)
- importance: How central is this to the text (0.0-1.0)

For relationships, identify connections like:
- is_a: X is a type of Y
- part_of: X is part of Y
- causes: X causes/leads to Y
- related_to: X is related to Y

Respond with a JSON object in this exact format:
{{
  "entities": [
    {{"name": "...", "type": "concept|person|event|place|organization", "description": "...", "importance": 0.5}}
  ],
  "relationships": [
    {{"source": "entity_name", "target": "entity_name", "relationship": "is_a|part_of|causes|related_to", "description": "..."}}
  ]
}}

Respond ONLY with valid JSON, no additional text."""


async def test_extraction():
    # Sample text from a science book
    sample_text = """
    Electrochemistry is a branch of chemistry that studies chemical reactions which take place 
    at the interface of an electrode and an ionic solution. These reactions involve electron transfer 
    between the electrode and the electrolyte. Key concepts include:
    
    1. Oxidation-Reduction (Redox) Reactions: These involve the transfer of electrons from one 
       species to another. Oxidation is the loss of electrons, while reduction is the gain of electrons.
    
    2. Electrochemical Cells: Devices that convert chemical energy into electrical energy (galvanic cells) 
       or use electrical energy to drive chemical reactions (electrolytic cells).
    
    3. Standard Electrode Potential: A measure of the tendency of a chemical species to be reduced, 
       measured in volts under standard conditions.
    
    4. Faraday's Laws of Electrolysis: These laws relate the amount of chemical change to the 
       quantity of electricity passed through an electrolyte.
    """
    
    prompt = CONCEPT_EXTRACTION_PROMPT.format(text=sample_text)
    
    print("Testing LLM concept extraction...")
    print(f"Prompt length: {len(prompt)} chars")
    
    try:
        model = await provision_langchain_model(
            prompt,
            None,
            "transformation",
            max_tokens=3000
        )
        print(f"Model created: {type(model)}")
        
        print("\nInvoking model...")
        response = await model.ainvoke(prompt)
        content = response.content if isinstance(response.content, str) else str(response.content)
        
        print(f"\nRaw response length: {len(content)} chars")
        print(f"Raw response preview:\n{content[:500]}")
        
        # Clean if needed
        content = clean_thinking_content(content)
        print(f"\nCleaned response length: {len(content)} chars")
        
        # Try to parse JSON
        try:
            result = json.loads(content)
            print(f"\nParsed JSON successfully!")
            print(f"Entities: {len(result.get('entities', []))}")
            print(f"Relationships: {len(result.get('relationships', []))}")
            
            if result.get('entities'):
                print("\nSample entities:")
                for e in result['entities'][:5]:
                    print(f"  - {e.get('name')} ({e.get('type')})")
                    
        except json.JSONDecodeError as e:
            print(f"\nFailed to parse JSON: {e}")
            print(f"Content that failed: {content[:200]}...")
            
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_extraction())
