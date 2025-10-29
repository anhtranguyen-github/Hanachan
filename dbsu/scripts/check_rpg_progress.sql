-- ---------------------------------------------------------
-- KIỂM TRA ĐỘ PHỦ RPG PROGRESS (DECK VS MASTER-SKILL)
-- ---------------------------------------------------------

-- 1. TỔNG QUAN TIẾN ĐỘ CỦA TỪNG DECK
SELECT 
    d.name as deck_name,
    COUNT(dii.ku_id) as total_tasks,
    COUNT(dii.ku_id) FILTER (WHERE dii.state = 'New') as new_tasks,
    COUNT(dii.ku_id) FILTER (WHERE dii.state = 'Mastered') as mastered_tasks,
    ROUND(COUNT(dii.ku_id) FILTER (WHERE dii.state = 'Seen') * 100.0 / NULLIF(COUNT(dii.ku_id), 0), 2) || '%' as completion_rate
FROM decks d
JOIN deck_item_interactions dii ON d.id = dii.deck_id
GROUP BY d.name;

-- 2. ĐỐI SOÁT GIỮA SKILL (GLOBAL) VÀ TASK (LOCAL)
-- Kiểm tra xem có KU nào Stability cao mà Status trong Deck vẫn là New không
SELECT 
    ku.search_key,
    uls.state as global_state,
    uls.stability as memory_stability,
    dii.state as local_progress,
    d.name as in_deck
FROM user_learning_states uls
JOIN knowledge_units ku ON uls.ku_id = ku.id
JOIN deck_item_interactions dii ON ku.id = dii.ku_id
JOIN decks d ON dii.deck_id = d.id
WHERE uls.stability > 30; -- Chỉ xem những cái đã nhớ lâu (S > 30 ngày)

-- 3. KIỂM TRA ĐỊNH DANH (INTEGRITY)
SELECT COUNT(*) as orphan_interactions 
FROM deck_item_interactions 
WHERE ku_id NOT IN (SELECT id FROM knowledge_units);
