CREATE TABLE public.youtube_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text NOT NULL UNIQUE,
  title text,
  channel text,
  duration integer,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT youtube_videos_user_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);


CREATE TABLE public.youtube_subtitles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL,
  start_time double precision NOT NULL,
  end_time double precision NOT NULL,
  text_ja text NOT NULL,
  sentence_id uuid,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT yt_sub_video_fkey FOREIGN KEY (video_id) REFERENCES public.youtube_videos(id),
  CONSTRAINT yt_sub_sentence_fkey FOREIGN KEY (sentence_id) REFERENCES public.sentences(id)
);


CREATE TABLE public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mode text CHECK (mode IN ('chat', 'analyze', 'srs')),
  started_at timestamptz DEFAULT now(),
  CONSTRAINT chat_sessions_user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);


CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  role text CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT chat_messages_session_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id)
);


CREATE TABLE public.chat_message_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  action_type text CHECK (
    action_type IN ('ANALYZE', 'CREATE_FLASHCARD', 'START_SRS')
  ),
  target_ku_id uuid,
  target_sentence_id uuid,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT cma_message_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id),
  CONSTRAINT cma_ku_fkey FOREIGN KEY (target_ku_id) REFERENCES public.knowledge_units(id),
  CONSTRAINT cma_sentence_fkey FOREIGN KEY (target_sentence_id) REFERENCES public.sentences(id)
);
