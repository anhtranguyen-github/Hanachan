import os
import psycopg2
from dotenv import load_dotenv

load_dotenv("/home/tra01/project/hanachan_v2_final/nextjs/.env")
DATABASE_URL = os.getenv("DATABASE_URL")

def get_db():
    return psycopg2.connect(DATABASE_URL)

def run():
    print("Connecting to DB...")
    conn = get_db()
    cur = conn.cursor()
    
    print("Creating sentences tables...")
    cur.execute("""
    CREATE TABLE IF NOT EXISTS public.sentences (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        japanese_raw TEXT NOT NULL,
        japanese_html TEXT,
        english_raw TEXT NOT NULL,
        english_html TEXT,
        audio_url TEXT,
        source VARCHAR(50) DEFAULT 'system',
        created_by UUID REFERENCES auth.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS public.sentence_knowledge (
        sentence_id UUID REFERENCES public.sentences(id) ON DELETE CASCADE,
        ku_id UUID REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
        position_start INT,
        position_end INT,
        PRIMARY KEY (sentence_id, ku_id)
    );
    """)
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS public.sentence_tags (
        sentence_id UUID REFERENCES public.sentences(id) ON DELETE CASCADE,
        tag_name VARCHAR(50) NOT NULL,
        user_id UUID REFERENCES auth.users(id),
        PRIMARY KEY (sentence_id, tag_name)
    );
    """)
    
    conn.commit()
    print("Tables created.")
    cur.close()
    conn.close()

if __name__ == "__main__":
    run()
