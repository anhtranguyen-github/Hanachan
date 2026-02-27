
import os
import sys
import uuid
import logging
from datetime import datetime, timezone

# Add the project root to sys.path so we can import from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.database import init_pool, execute_query, close_pool
from app.services.memory import episodic_memory as ep_mem
from app.services.memory import semantic_memory as sem_mem
from app.schemas.memory import KnowledgeGraph, Relationship, Node

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Sample Data
PERSONAS = {
    "test_worker_1@hanachan.test": {
        "name": "Sakura",
        "facts": [
            ("Sakura", "Person", "Loves", "Anime", "Preference"),
            ("Sakura", "Person", "Goal", "Travel to Tokyo", "Goal"),
            ("Sakura", "Person", "Interest", "Studio Ghibli", "Interest"),
            ("Sakura", "Person", "Prefers", "Romaji for now", "Preference"),
            ("Sakura", "Person", "Struggles_With", "Kanji stroke order", "Fact")
        ],
        "episodes": [
            "User introduced herself as Sakura and said she started learning Japanese because of My Neighbor Totoro.",
            "Sakura asked about the difference between 'wa' and 'ga' but got confused quickly.",
            "Sakura expressed excitement about visiting Tokyo next spring for the cherry blossoms."
        ]
    },
    "test_worker_2@hanachan.test": {
        "name": "Kenji",
        "facts": [
            ("Kenji", "Person", "Occupation", "Software Engineer", "Fact"),
            ("Kenji", "Person", "Goal", "Work in Japan", "Goal"),
            ("Kenji", "Person", "Interest", "Rust Programming", "Interest"),
            ("Kenji", "Person", "Prefers", "Technical vocabulary", "Preference"),
            ("Kenji", "Person", "Study_Focus", "JLPT N3", "Goal")
        ],
        "episodes": [
            "Kenji asked how to say 'memory leak' in Japanese.",
            "Kenji mentioned he is applying for developer jobs in Osaka.",
            "User said he prefers learning via grammar patterns rather than rote vocabulary."
        ]
    },
    "test_worker_3@hanachan.test": {
        "name": "Akari",
        "facts": [
            ("Akari", "Person", "Interest", "Classical Literature", "Interest"),
            ("Akari", "Person", "Goal", "Read Natsume Soseki in original", "Goal"),
            ("Akari", "Person", "Skill_Level", "Advanced", "Fact"),
            ("Akari", "Person", "Prefers", "Monolingual definitions", "Preference"),
            ("Akari", "Person", "Favorite_Author", "Haruki Murakami", "Interest")
        ],
        "episodes": [
            "Akari discussed the nuance of literary 'shimatta' versus 'owatta'.",
            "User expressed frustration that most apps are too easy for her current level.",
            "Akari shared that she recently finished reading 'Kokoro' and wants to discuss it."
        ]
    }
}

def seed():
    try:
        logger.info(f"Connecting to DB at {settings.db_host}:{settings.db_port} as {settings.db_user} (pw={'***' if settings.db_password else 'EMPTY'})...")
        init_pool()
        logger.info("Connection pool initialized.")

        for email, data in PERSONAS.items():
            user = execute_query("SELECT id FROM public.users WHERE id IN (SELECT id FROM auth.users WHERE email = %s)", (email,))
            if not user:
                logger.warning(f"User {email} not found in DB. Skipping.")
                continue
            
            user_id = str(user[0]["id"])
            logger.info(f"Seeding data for {data['name']} ({user_id})...")

            # 1. Seed Semantic Memory (Neo4j)
            nodes = [Node(id=n[0], type=n[1]) for n in data["facts"]]
            # To avoid duplicates and ensure connectivity, we'll build a proper KG
            relationships = []
            for s, st, r, t, tt in data["facts"]:
                relationships.append(Relationship(
                    source=Node(id=s, type=st),
                    target=Node(id=t, type=tt),
                    type=r
                ))
            
            sem_mem.add_nodes_and_relationships(user_id, [], relationships)
            logger.info(f"Added {len(relationships)} facts to Semantic Memory.")

            # 2. Seed Episodic Memory (Qdrant)
            for episode in data["episodes"]:
                ep_mem.add_episodic_memory(user_id, episode)
            logger.info(f"Added {len(data['episodes'])} episodes to Episodic Memory.")

        logger.info("Successfully seeded all sample profiles.")

    except Exception as e:
        logger.error(f"Seeding failed: {e}")
    finally:
        close_pool()

if __name__ == "__main__":
    seed()
