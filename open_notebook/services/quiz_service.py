"""
Quiz Generation Service using LLM
"""

import json
import re
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from loguru import logger
from pydantic import BaseModel

from open_notebook.domain.notebook import Notebook, Source
from open_notebook.domain.quiz import Flashcard, QuizQuestion, QuizSession
from open_notebook.graphs.utils import provision_langchain_model


class GeneratedQuestion(BaseModel):
    """Model for a generated quiz question"""
    question: str
    options: List[str]
    correct_index: int
    explanation: str
    difficulty: Literal["easy", "medium", "hard"]


class QuizGenerationService:
    """Service for generating quizzes from notebook content using LLM"""

    QUIZ_GENERATION_PROMPT = """You are an expert quiz creator. Generate {num_questions} multiple choice questions based on the following content.

CONTENT:
{content}

REQUIREMENTS:
1. Each question should test understanding, not just memorization
2. Create 4 answer options for each question (labeled A, B, C, D)
3. Exactly ONE option should be correct
4. Include a brief explanation for why the correct answer is right
5. Vary the difficulty: {difficulty}
6. Questions should cover different aspects of the content

OUTPUT FORMAT (JSON array):
[
  {{
    "question": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "explanation": "Explanation of why this is correct",
    "difficulty": "easy|medium|hard"
  }}
]

Generate exactly {num_questions} questions. Return ONLY valid JSON, no other text."""

    FLASHCARD_GENERATION_PROMPT = """You are an expert at creating effective flashcards for learning. Generate {num_cards} flashcards based on the following content.

CONTENT:
{content}

REQUIREMENTS:
1. Each flashcard should have a clear, focused question/prompt (front)
2. The answer (back) should be concise but complete
3. Focus on key concepts, definitions, relationships, and important facts
4. Use the principle of "minimum information" - one fact per card
5. Vary the types: definitions, concepts, relationships, applications

OUTPUT FORMAT (JSON array):
[
  {{
    "front": "What is [concept]?",
    "back": "Concise answer here",
    "tags": ["tag1", "tag2"]
  }}
]

Generate exactly {num_cards} flashcards. Return ONLY valid JSON, no other text."""

    @staticmethod
    def _extract_json(text: str) -> str:
        """Extract JSON from LLM response"""
        # Try to find JSON array in response
        json_match = re.search(r'\[[\s\S]*\]', text)
        if json_match:
            return json_match.group()
        return text

    @classmethod
    async def generate_quiz(
        cls,
        notebook_id: str,
        num_questions: int = 10,
        difficulty: Literal["easy", "medium", "hard", "mixed"] = "mixed",
        source_ids: Optional[List[str]] = None,
        model_id: Optional[str] = None
    ) -> QuizSession:
        """Generate a quiz from notebook content"""
        try:
            # Fetch notebook and sources
            notebook = await Notebook.get(notebook_id)
            
            if source_ids:
                sources = [await Source.get(sid) for sid in source_ids]
            else:
                # get_sources() omits full_text for efficiency, so we need to fetch full sources
                source_refs = await notebook.get_sources()
                sources = [await Source.get(s.id) for s in source_refs]
            
            if not sources:
                raise ValueError("No sources available to generate quiz from")
            
            # Prepare content
            content_parts = []
            source_map = {}  # Map content sections to source IDs
            
            for source in sources:
                if source.full_text:
                    # Truncate very long content
                    text = source.full_text[:8000] if len(source.full_text) > 8000 else source.full_text
                    content_parts.append(f"--- Source: {source.title} ---\n{text}")
                    source_map[source.title] = source.id
            
            combined_content = "\n\n".join(content_parts)
            
            if not combined_content.strip():
                raise ValueError("No content available in sources to generate quiz from")
            
            # Determine difficulty instruction
            difficulty_instruction = {
                "easy": "All questions should be EASY (basic recall and understanding)",
                "medium": "All questions should be MEDIUM (application and analysis)",
                "hard": "All questions should be HARD (synthesis and evaluation)",
                "mixed": "Mix of EASY (30%), MEDIUM (50%), and HARD (20%) questions"
            }.get(difficulty, "Mix of difficulties")
            
            # Generate prompt
            prompt = cls.QUIZ_GENERATION_PROMPT.format(
                num_questions=num_questions,
                content=combined_content,
                difficulty=difficulty_instruction
            )
            
            # Get LLM model
            model = await provision_langchain_model(
                prompt,
                model_id,
                "transformation",
                max_tokens=4096
            )
            
            # Generate questions
            response = model.invoke(prompt)
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            # Parse JSON response
            json_text = cls._extract_json(response_text)
            questions_data = json.loads(json_text)
            
            # Create quiz session
            session = QuizSession(
                notebook_id=notebook_id,
                title=f"Quiz: {notebook.name}",
                question_count=len(questions_data),
                difficulty=difficulty,
                status="in_progress",
                started_at=datetime.now()
            )
            await session.save()
            
            # Create questions
            for q_data in questions_data:
                question = QuizQuestion(
                    quiz_session_id=session.id,
                    question=q_data["question"],
                    options=q_data["options"],
                    correct_index=q_data["correct_index"],
                    explanation=q_data["explanation"],
                    difficulty=q_data.get("difficulty", "medium"),
                    question_type="mcq"
                )
                await question.save()
            
            logger.info(f"Generated quiz with {len(questions_data)} questions for notebook {notebook_id}")
            return session
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse quiz JSON: {str(e)}")
            raise ValueError(f"Failed to parse quiz generation response: {str(e)}")
        except Exception as e:
            logger.error(f"Error generating quiz: {str(e)}")
            raise

    @classmethod
    async def generate_flashcards(
        cls,
        notebook_id: str,
        num_cards: int = 20,
        source_ids: Optional[List[str]] = None,
        model_id: Optional[str] = None
    ) -> List[Flashcard]:
        """Generate flashcards from notebook content"""
        try:
            # Fetch notebook and sources
            notebook = await Notebook.get(notebook_id)
            
            if source_ids:
                sources = [await Source.get(sid) for sid in source_ids]
            else:
                # get_sources() omits full_text for efficiency, so we need to fetch full sources
                source_refs = await notebook.get_sources()
                sources = [await Source.get(s.id) for s in source_refs]
            
            if not sources:
                raise ValueError("No sources available to generate flashcards from")
            
            # Prepare content
            content_parts = []
            for source in sources:
                if source.full_text:
                    text = source.full_text[:8000] if len(source.full_text) > 8000 else source.full_text
                    content_parts.append(f"--- Source: {source.title} ---\n{text}")
            
            combined_content = "\n\n".join(content_parts)
            
            if not combined_content.strip():
                raise ValueError("No content available in sources to generate flashcards from")
            
            # Generate prompt
            prompt = cls.FLASHCARD_GENERATION_PROMPT.format(
                num_cards=num_cards,
                content=combined_content
            )
            
            # Get LLM model
            model = await provision_langchain_model(
                prompt,
                model_id,
                "transformation",
                max_tokens=4096
            )
            
            # Generate flashcards
            response = await model.ainvoke(prompt)
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            # Parse JSON response
            json_text = cls._extract_json(response_text)
            cards_data = json.loads(json_text)
            
            # Create flashcards
            created_cards = []
            for card_data in cards_data:
                flashcard = Flashcard(
                    notebook_id=notebook_id,
                    front=card_data["front"],
                    back=card_data["back"],
                    tags=card_data.get("tags", [])
                )
                await flashcard.save()
                created_cards.append(flashcard)
            
            logger.info(f"Generated {len(created_cards)} flashcards for notebook {notebook_id}")
            return created_cards
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse flashcards JSON: {str(e)}")
            raise ValueError(f"Failed to parse flashcard generation response: {str(e)}")
        except Exception as e:
            logger.error(f"Error generating flashcards: {str(e)}")
            raise

    @classmethod
    async def create_flashcard_from_question(
        cls,
        question: QuizQuestion,
        notebook_id: str
    ) -> Flashcard:
        """Convert a quiz question into a flashcard for spaced repetition"""
        correct_answer = question.options[question.correct_index]
        
        flashcard = Flashcard(
            notebook_id=notebook_id,
            source_id=question.source_id,
            front=question.question,
            back=f"{correct_answer}\n\n{question.explanation}",
            tags=[question.difficulty, "from_quiz"]
        )
        await flashcard.save()
        
        return flashcard
