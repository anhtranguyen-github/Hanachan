INSERT INTO users (id, email, display_name) VALUES ('00000000-0000-0000-0000-000000000000', 'system@hanachan.local', 'System User') ON CONFLICT DO NOTHING;
INSERT INTO decks (name, type) VALUES ('System Grammar', 'system') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('009fba17-c28e-40bf-aa5b-ae0540797d6a', 'grammar', 'grammar/かな', 20, 'かな') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'かな', 'I wonder', '{"tokens":[{"type":"emphasis","text":"Originally a mixture of the sentence ending particles か, and な, かな evolved over time to become its own (singular) sentence ending particle, which roughly translates as 'I wonder if (A)?'.\nAs it is a sentence ending particle, かな can be added to the end of almost any sentence. However, in the case of な-adjectives, both だ and です will usually be omitted, with かな simply following the word stem itself.\n\n\n\n\nCombining the meanings か and な, we can see where かな gets its original meaning. か presents questions (usually to other people), while な shows that a statement is related purely to the speaker's own thoughts/opinions. In this way, かな expresses that the speaker's own thoughts are being questioned.\nFun Fact\nIn the past, かな was thought of as being a fairly feminine way to express 'I wonder', and males tended to use phrases like だろうか to express the same type of statement. However, in modern day Japanese, かな is used by both men and women equally.\n\n\n"}],"text_only":"Originally a mixture of the sentence ending particles か, and な, かな evolved over time to become its own (singular) sentence ending particle, which roughly translates as 'I wonder if (A)?'.\nAs it is a sentence ending particle, かな can be added to the end of almost any sentence. However, in the case of な-adjectives, both だ and です will usually be omitted, with かな simply following the word stem itself.\n\n\n\n\nCombining the meanings か and な, we can see where かな gets its original meaning. か presents questions (usually to other people), while な shows that a statement is related purely to the speaker's own thoughts/opinions. In this way, かな expresses that the speaker's own thoughts are being questioned.\nFun Fact\nIn the past, かな was thought of as being a fairly feminine way to express 'I wonder', and males tended to use phrases like だろうか to express the same type of statement. However, in modern day Japanese, かな is used by both men and women equally.\n\n\n"}', '{"patterns":["Sentence + かな"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"Sentence + かな"}],"text_only":"StructureSentence + かな"}}'
                FROM knowledge_units WHERE slug = 'grammar/かな' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/かな' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('00aac019-713f-4faf-baee-b6e302f968b2', 'grammar', 'grammar/上で', 38, '上で') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, '上で', 'After', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Verb［た］+ 上（うえ）でNoun + の + 上（うえ）で"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"Verb［た］+ 上(うえ)でNoun + の + 上(うえ)で"}],"text_only":"StructureVerb［た］+ 上(うえ)でNoun + の + 上(うえ)で"}}'
                FROM knowledge_units WHERE slug = 'grammar/上で' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/上で' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('00bda48a-e212-410a-b1b9-40383258508e', 'grammar', 'grammar/次第だ-次第で', 50, '次第だ・次第で') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, '次第だ・次第で', 'Depending on', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Noun + 次第（しだい） + だNoun + 次第（しだい）で","Noun + 次第（しだい） + ですNoun + 次第（しだい）で"],"formula":{"tokens":[{"type":"text","text":"StructureStandardPolite"},{"type":"emphasis","text":"Noun + 次第(しだい) + だNoun + 次第(しだい)で"}],"text_only":"StructureStandardPoliteNoun + 次第(しだい) + だNoun + 次第(しだい)で"}}'
                FROM knowledge_units WHERE slug = 'grammar/次第だ-次第で' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/次第だ-次第で' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('00bf66c9-d285-4c41-a7f7-5435ef43b5bc', 'grammar', 'grammar/１-りとも-ない', 60, '１～たりとも～ない') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, '１～たりとも～ない', 'Not even one', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["1 + Counter + たりとも + Phrase［ない］(1)(1) Verb［な］"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"1 + Counter + たりとも + Phrase［ない］(1)(1) Verb［な］"}],"text_only":"Structure1 + Counter + たりとも + Phrase［ない］(1)(1) Verb［な］"}}'
                FROM knowledge_units WHERE slug = 'grammar/１-りとも-ない' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/１-りとも-ない' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('00fc31a0-4a4a-461f-ac86-59c50ec8ab9e', 'grammar', 'grammar/はずだ', 26, 'はずだ') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'はずだ', 'Bound to (be)', '{"tokens":[{"type":"emphasis","text":"はず, coming from the kanji 筈(はず), is a word in Japanese that is very similar to 'bound' in English. This means that it expresses something that the speaker is 'quite sure is true', but cannot confirm. The most common translations of はず are 'bound to be (A)', and 'should be (A)'.\nAs はず is a noun, it may be used in any place that a noun would usually be used. It will often be followed by だ, or です.\n\n\n\n\n\n\nCaution\nDespite はず sometimes being translated as 'should', this is only when you think that something 'should be true', and cannot be used when making suggestions/giving advice. Due to this, 'bound' is the more accurate translation of 筈(はず), in almost all situations.\nFun Fact\nThe だ (or です) in はずだ  may be omitted. This usually makes はず sound a little less certain, like 'bound to be (A)... probably'. In the same way, speakers may sometimes add はず to the end of their sentences in a similar way to 多分(たぶん), in order to show that they are not 100% certain about whether what they just said is accurate or not.\n\n\n"}],"text_only":"はず, coming from the kanji 筈(はず), is a word in Japanese that is very similar to 'bound' in English. This means that it expresses something that the speaker is 'quite sure is true', but cannot confirm. The most common translations of はず are 'bound to be (A)', and 'should be (A)'.\nAs はず is a noun, it may be used in any place that a noun would usually be used. It will often be followed by だ, or です.\n\n\n\n\n\n\nCaution\nDespite はず sometimes being translated as 'should', this is only when you think that something 'should be true', and cannot be used when making suggestions/giving advice. Due to this, 'bound' is the more accurate translation of 筈(はず), in almost all situations.\nFun Fact\nThe だ (or です) in はずだ  may be omitted. This usually makes はず sound a little less certain, like 'bound to be (A)... probably'. In the same way, speakers may sometimes add はず to the end of their sentences in a similar way to 多分(たぶん), in order to show that they are not 100% certain about whether what they just said is accurate or not.\n\n\n"}', '{"patterns":["Verb + はず + だ［い］Adjective + はず + だ［な］Adjective + な + はず + だNoun + の + はず + だ","Verb + はず + です［い］Adjective + はず + です［な］Adjective + な + はず + ですNoun + の + はず + です"],"formula":{"tokens":[{"type":"text","text":"StructureStandardPolite"},{"type":"emphasis","text":"Verb + はず + だ［い］Adjective + はず + だ［な］Adjective + な + はず + だNoun + の + はず + だ"}],"text_only":"StructureStandardPoliteVerb + はず + だ［い］Adjective + はず + だ［な］Adjective + な + はず + だNoun + の + はず + だ"}}'
                FROM knowledge_units WHERE slug = 'grammar/はずだ' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/はずだ' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('0113b60d-751f-4999-bbce-f58f7e0b29cf', 'grammar', 'grammar/を余儀なくされる', 58, 'を余儀なくされる') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'を余儀なくされる', 'To be forced to do something', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Noun + を余儀（よぎ）なくされる","Noun + を余儀（よぎ）なくされます"],"formula":{"tokens":[{"type":"text","text":"StructureStandardPolite"},{"type":"emphasis","text":"Noun + を余儀(よぎ)なくされる"}],"text_only":"StructureStandardPoliteNoun + を余儀(よぎ)なくされる"}}'
                FROM knowledge_units WHERE slug = 'grammar/を余儀なくされる' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/を余儀なくされる' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('011cfe39-2bef-4a30-8898-05cd0743837b', 'grammar', 'grammar/要するに', 50, '要するに') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, '要するに', 'To sum up', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["要（よう）するに + Phrase"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"要(よう)するに + Phrase"}],"text_only":"Structure要(よう)するに + Phrase"}}'
                FROM knowledge_units WHERE slug = 'grammar/要するに' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/要するに' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('019adb75-c651-4c34-b1a7-d294d2ae930a', 'grammar', 'grammar/おおよそ', 40, 'おおよそ') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'おおよそ', 'Approximately', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["おおよそ(1) + Noun(1)およそ"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"おおよそ(1) + Noun(1)およそ"}],"text_only":"Structureおおよそ(1) + Noun(1)およそ"}}'
                FROM knowledge_units WHERE slug = 'grammar/おおよそ' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/おおよそ' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('01a012ca-1f55-4348-aa35-050bef1701fb', 'grammar', 'grammar/ねばならない', 46, 'ねばならない') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'ねばならない', 'Must', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Verb［ない］+ ねばならないExceptions:する ￫ せねばならない","Verb［ない］+ ねばなりませんExceptions:する ￫ せねばなりません"],"formula":{"tokens":[{"type":"text","text":"StructureStandardPolite"},{"type":"emphasis","text":"Verb［ない］+ ねばならないExceptions:する ￫ せねばならない"}],"text_only":"StructureStandardPoliteVerb［ない］+ ねばならないExceptions:する ￫ せねばならない"}}'
                FROM knowledge_units WHERE slug = 'grammar/ねばならない' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/ねばならない' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('01c0361a-139d-45b7-9945-83d5d5500c62', 'grammar', 'grammar/らしい1', 27, 'らしい ①') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'らしい ①', 'Seems like', '{"tokens":[{"type":"emphasis","text":"The auxiliary verb らしい is very similar to the auxiliary verbs そうだ and ようだ, in that it expresses something that the speaker 'thinks' is true. This use is known as 推定(すいてい) (presumption) in Japanese. However, despite being a presumption/assumption, らしい usually sounds relatively confident.\nらしい is regularly translated as 'it seems like (A)', or 'I heard that (A)'.\nTo use らしい, attach it to end of any (non-polite) verb, adjective, or noun.\n\n\n\n\n\nIn these examples, らしい indicates that the speaker has some reason to believe that (A) is true. This could be that they heard, saw, or read something, but are still not 100% sure whether their understanding is correct or not. In this way, it sounds very similar to 'it appears as though (A)' in English.\n\nCaution\nThere are 2 main forms of らしい in Japanese. The auxiliary verb usage mentioned above, and the 形容詞(けいようし)の一部(いちぶ) (auxiliary adjective), a type of adjective that must be attached to another word for it to have any meaning usage. らしい has the meaning of something that is 'typical of (A)', when used as an auxiliary adjective.\n\n\n\nThis い-Adjective use of らしい will be covered more in our second らしい lesson."}],"text_only":"The auxiliary verb らしい is very similar to the auxiliary verbs そうだ and ようだ, in that it expresses something that the speaker 'thinks' is true. This use is known as 推定(すいてい) (presumption) in Japanese. However, despite being a presumption/assumption, らしい usually sounds relatively confident.\nらしい is regularly translated as 'it seems like (A)', or 'I heard that (A)'.\nTo use らしい, attach it to end of any (non-polite) verb, adjective, or noun.\n\n\n\n\n\nIn these examples, らしい indicates that the speaker has some reason to believe that (A) is true. This could be that they heard, saw, or read something, but are still not 100% sure whether their understanding is correct or not. In this way, it sounds very similar to 'it appears as though (A)' in English.\n\nCaution\nThere are 2 main forms of らしい in Japanese. The auxiliary verb usage mentioned above, and the 形容詞(けいようし)の一部(いちぶ) (auxiliary adjective), a type of adjective that must be attached to another word for it to have any meaning usage. らしい has the meaning of something that is 'typical of (A)', when used as an auxiliary adjective.\n\n\n\nThis い-Adjective use of らしい will be covered more in our second らしい lesson."}', '{"patterns":["Verb + らしい［い］Adjective + らしい［な］Adjective + らしいNoun + らしい","Verb + らしい + です［い］Adjective + らしい + です［な］Adjective + らしい + ですNoun + らしい + です"],"formula":{"tokens":[{"type":"text","text":"StructureStandardPolite"},{"type":"emphasis","text":"Verb + らしい［い］Adjective + らしい［な］Adjective + らしいNoun + らしい"}],"text_only":"StructureStandardPoliteVerb + らしい［い］Adjective + らしい［な］Adjective + らしいNoun + らしい"}}'
                FROM knowledge_units WHERE slug = 'grammar/らしい1' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/らしい1' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('01ec87ed-8238-46bb-9371-6a2bbd899e7f', 'grammar', 'grammar/ものとする', 58, 'ものとする') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'ものとする', 'Shall', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Verb + ものとする","Verb + ものとします"],"formula":{"tokens":[{"type":"text","text":"StructureStandardPolite"},{"type":"emphasis","text":"    Verb + ものとする "}],"text_only":"StructureStandardPolite    Verb + ものとする "}}'
                FROM knowledge_units WHERE slug = 'grammar/ものとする' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/ものとする' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('0225c065-deac-4e6f-811f-5244673171c3', 'grammar', 'grammar/ようになる', 27, 'ようになる') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'ようになる', 'To reach the point that', '{"tokens":[{"type":"emphasis","text":"When combined with the particle に, and the う-Verb なる, よう expresses that a particular action has reached the point of being completed/able to be completed. Because of this, ようになる is regularly translated as 'to reach the point that (A)', or 'to turn into (A)'.\nTo use ようになる, it will need to be added to the plain-potential, non-past form of a verb.\n\n\n\n\nCaution\nWhen using this grammar construction, we will need to remember that する does not have a potential form. Therefore, できる will be used with words that usually act as する verbs.\n\n\n\nHowever, ようになる is not limited to being used in affirmative sentences, and may also be used after a verb with ない. This shows that something has reached the point of 'not' being able to be completed.\n\n\n\n"}],"text_only":"When combined with the particle に, and the う-Verb なる, よう expresses that a particular action has reached the point of being completed/able to be completed. Because of this, ようになる is regularly translated as 'to reach the point that (A)', or 'to turn into (A)'.\nTo use ようになる, it will need to be added to the plain-potential, non-past form of a verb.\n\n\n\n\nCaution\nWhen using this grammar construction, we will need to remember that する does not have a potential form. Therefore, できる will be used with words that usually act as する verbs.\n\n\n\nHowever, ようになる is not limited to being used in affirmative sentences, and may also be used after a verb with ない. This shows that something has reached the point of 'not' being able to be completed.\n\n\n\n"}', '{"patterns":["Verb［できる］(1) + ように + なる(1) Verb［ない］、Verb［る］","Verb［できる］(1) + ように + なります(1) Verb［ない］、Verb［る］"],"formula":{"tokens":[{"type":"text","text":"StructureStandardPolite"},{"type":"emphasis","text":"Verb［できる］(1) + ように + なる(1) Verb［ない］、Verb［る］"}],"text_only":"StructureStandardPoliteVerb［できる］(1) + ように + なる(1) Verb［ない］、Verb［る］"}}'
                FROM knowledge_units WHERE slug = 'grammar/ようになる' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/ようになる' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('0237e1c8-3501-4cd9-a742-2e72cb5582f6', 'grammar', 'grammar/たがる', 22, 'たがる') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'たがる', 'To want to (Third person)', '{"tokens":[{"type":"emphasis","text":"As we explored in our lesson about がる, this verb can be used with adjectives, to express the way in which people are acting. However, it can also be partnered with the auxiliary verb たい, to form たがる. This grammar construction is used when expressing that someone is acting like they 'want' to do something.\nTo use this structure, attach たい to the ます stem form of any verb, then replace the い in たい with がる.\n\n\n\n\nCaution\nたがる is in contrast to てほしい which means 'to want someone to do (A)'. These differences will need to be practiced, and memorized.\n\n\n\nThis is also in contrast to the い-Adjective 欲(ほ)しい 'to want (A)'. To describe that someone seems like they want something (rather than that they want to 'do' something), がる will be paired with this adjective.\n"}],"text_only":"As we explored in our lesson about がる, this verb can be used with adjectives, to express the way in which people are acting. However, it can also be partnered with the auxiliary verb たい, to form たがる. This grammar construction is used when expressing that someone is acting like they 'want' to do something.\nTo use this structure, attach たい to the ます stem form of any verb, then replace the い in たい with がる.\n\n\n\n\nCaution\nたがる is in contrast to てほしい which means 'to want someone to do (A)'. These differences will need to be practiced, and memorized.\n\n\n\nThis is also in contrast to the い-Adjective 欲(ほ)しい 'to want (A)'. To describe that someone seems like they want something (rather than that they want to 'do' something), がる will be paired with this adjective.\n"}', '{"patterns":["Verb［たい］+ がる","Verb［たい］+ がります"],"formula":{"tokens":[{"type":"text","text":"StructureStandardPolite"},{"type":"emphasis","text":"Verb［たい］+ がる"}],"text_only":"StructureStandardPoliteVerb［たい］+ がる"}}'
                FROM knowledge_units WHERE slug = 'grammar/たがる' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/たがる' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('023bdef5-aa8b-48d8-8a3b-6887d42bfe43', 'grammar', 'grammar/だの', 53, 'だの') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'だの', 'Things like', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["A(1) + だの + B(1) + だのA(1) + だの + 何（なん）だの(1) Noun、Quotation"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"A(1) + だの + B(1) + だのA(1) + だの + 何(なん)だの(1) Noun、Quotation"}],"text_only":"StructureA(1) + だの + B(1) + だのA(1) + だの + 何(なん)だの(1) Noun、Quotation"}}'
                FROM knowledge_units WHERE slug = 'grammar/だの' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/だの' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('02cdd02f-7976-40ff-bdc7-836f330a1d6e', 'grammar', 'grammar/ばいい', 36, 'ばいい') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'ばいい', 'Can', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Verb［ば］+ いい","Verb［ば］+ いい + です"],"formula":{"tokens":[{"type":"text","text":"StructureStandardPolite"},{"type":"emphasis","text":"Verb［ば］+ いい"}],"text_only":"StructureStandardPoliteVerb［ば］+ いい"}}'
                FROM knowledge_units WHERE slug = 'grammar/ばいい' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/ばいい' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('02d68761-29f5-4999-85ba-194413780bea', 'grammar', 'grammar/一応1', 48, '一応 ①') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, '一応 ①', 'Just in case', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["一応（いちおう） + Phrase"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"一応(いちおう) + Phrase"}],"text_only":"Structure一応(いちおう) + Phrase"}}'
                FROM knowledge_units WHERE slug = 'grammar/一応1' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/一応1' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('037c63c4-761b-4f6a-b7e7-54a1ccdb9dec', 'grammar', 'grammar/に照らして・に照らすと', 56, 'に照らして・に照らすと') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'に照らして・に照らすと', 'In light of', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Noun + に照（て）らして(1)Noun (A) + に照（て）らした + Noun (B)(1)に照（て）らすと"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"Noun + に照(て)らして(1)Noun (A) + に照(て)らした + Noun (B)(1)に照(て)らすと"}],"text_only":"StructureNoun + に照(て)らして(1)Noun (A) + に照(て)らした + Noun (B)(1)に照(て)らすと"}}'
                FROM knowledge_units WHERE slug = 'grammar/に照らして・に照らすと' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/に照らして・に照らすと' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('037cf4d7-2a3a-4f59-a202-f25834b204c8', 'grammar', 'grammar/すこしも-ない', 21, 'すこしも～ない') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'すこしも～ない', 'Not even a little', '{"tokens":[{"type":"emphasis","text":"Coming from the word 少(すこ)し (a little bit), すこしも～ない is an expression which translates almost exactly to 'not even a little bit (A)' in English. Due to this, it indicates that there is 'no (A)', '(A) never happens', or 'not (A) at all', depending on whether a verb or an adjective is the word that is being negated. すこしも can come at the beginning of the sentence, or directly before the word/statement it is referring to.\n\n\n\n\n\nFun Fact\nThis construction is another example of how the も particle expresses that the word before it is surprising in some way, or unexpected. This was briefly discussed in the Number + も grammar point.\n\nHere we can see that も is highlighting 少(すこ)し as being 'surprising'. This is where the 'not even!' meaning comes from."}],"text_only":"Coming from the word 少(すこ)し (a little bit), すこしも～ない is an expression which translates almost exactly to 'not even a little bit (A)' in English. Due to this, it indicates that there is 'no (A)', '(A) never happens', or 'not (A) at all', depending on whether a verb or an adjective is the word that is being negated. すこしも can come at the beginning of the sentence, or directly before the word/statement it is referring to.\n\n\n\n\n\nFun Fact\nThis construction is another example of how the も particle expresses that the word before it is surprising in some way, or unexpected. This was briefly discussed in the Number + も grammar point.\n\nHere we can see that も is highlighting 少(すこ)し as being 'surprising'. This is where the 'not even!' meaning comes from."}', '{"patterns":["すこしも + Verb［ない］すこしも + ［い］Adjective［ない］すこしも + ［な］Adjective + ではない(1)(1) じゃない"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"すこしも + Verb［ない］すこしも + ［い］Adjective［ない］すこしも + ［な］Adjective + ではない(1)(1) じゃない"}],"text_only":"Structureすこしも + Verb［ない］すこしも + ［い］Adjective［ない］すこしも + ［な］Adjective + ではない(1)(1) じゃない"}}'
                FROM knowledge_units WHERE slug = 'grammar/すこしも-ない' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/すこしも-ない' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('03baed10-66f2-4386-9d1e-fe29c93916b2', 'grammar', 'grammar/だ', 11, 'だ') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'だ', 'To be', '{"tokens":[{"type":"emphasis","text":"For the most part, だ is the equivalent of 'is' in English. Its role is to strongly express determination or assertion. It is a casual grammar structure, which means that you won't see it in polite sentences.\nTechnically, だ is an auxiliary verb, a group of words that attach themselves to other words to give them meaning. です has the same role as だ, but です is the one that will be used in polite sentences, and is also one of the first Japanese grammar patterns many people are exposed to.\nだ will always follow nouns, or words that behave like nouns, such as な-Adjectives.\n\n\n\n\n\nCaution\nAlthough です, the polite equivalent of だ, can be seen following い-Adjectives, だ itself will never be used directly after an い-Adjective.\n\n\n\nCaution\nWhile だ is often thought of as the 'casual form' of です, that is actually not entirely true. です is a polite speech word. The official 'formal version' of だ is である. We will learn this grammar point a bit later. である can often be seen in articles, and formal writing, while です is more common in polite speech."}],"text_only":"For the most part, だ is the equivalent of 'is' in English. Its role is to strongly express determination or assertion. It is a casual grammar structure, which means that you won't see it in polite sentences.\nTechnically, だ is an auxiliary verb, a group of words that attach themselves to other words to give them meaning. です has the same role as だ, but です is the one that will be used in polite sentences, and is also one of the first Japanese grammar patterns many people are exposed to.\nだ will always follow nouns, or words that behave like nouns, such as な-Adjectives.\n\n\n\n\n\nCaution\nAlthough です, the polite equivalent of だ, can be seen following い-Adjectives, だ itself will never be used directly after an い-Adjective.\n\n\n\nCaution\nWhile だ is often thought of as the 'casual form' of です, that is actually not entirely true. です is a polite speech word. The official 'formal version' of だ is である. We will learn this grammar point a bit later. である can often be seen in articles, and formal writing, while です is more common in polite speech."}', '{"patterns":["Noun + だ［な］Adjective + だ"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"Noun + だ［な］Adjective  + だ"}],"text_only":"StructureNoun + だ［な］Adjective  + だ"}}'
                FROM knowledge_units WHERE slug = 'grammar/だ' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/だ' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('03c74a54-7b30-4ff6-9b4b-5d848e8df4e2', 'grammar', 'grammar/ないことはない', 34, 'ないことはない') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'ないことはない', 'Is not impossible', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Verb［ない］+ ことはない(1)［い］Adjective［ない］+ ことはない(1)［な］Adjective + ではない(2) + ことはない(1)(1) こともない(2) じゃない","Verb［ない］+ ことはありません(1)［い］Adjective［ない］+ ことはありません(1)［な］Adjective + ではない(2) + ことはありません(1)(1) こともありません(2) じゃない"],"formula":{"tokens":[{"type":"text","text":"StructureStandardPolite"},{"type":"emphasis","text":"Verb［ない］+ ことはない(1)［い］Adjective［ない］+ ことはない(1)［な］Adjective + ではない(2) + ことはない(1)(1) こともない(2) じゃない"}],"text_only":"StructureStandardPoliteVerb［ない］+ ことはない(1)［い］Adjective［ない］+ ことはない(1)［な］Adjective + ではない(2) + ことはない(1)(1) こともない(2) じゃない"}}'
                FROM knowledge_units WHERE slug = 'grammar/ないことはない' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/ないことはない' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('04187327-958c-4c12-987b-65670d6974f8', 'grammar', 'grammar/さて', 30, 'さて') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'さて', 'Well', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["さて + (New Topic) Phrase"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"さて + (New Topic) Phrase"}],"text_only":"Structureさて + (New Topic) Phrase"}}'
                FROM knowledge_units WHERE slug = 'grammar/さて' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/さて' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('04653201-7063-40e8-a920-d5269112f38a', 'grammar', 'grammar/あげく', 40, 'あげく') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'あげく', 'After', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Verb［た］+ あげく + (に) + (Past Tense) (Result)Verb［た］+ あげく + の + NounNoun + の possession + あげく + (に) + (Past Tense) (Result)"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"Verb［た］+ あげく + (に)  + (Past Tense) (Result)Verb［た］+ あげく + の + NounNoun + の possession + あげく + (に)  + (Past Tense) (Result)"}],"text_only":"StructureVerb［た］+ あげく + (に)  + (Past Tense) (Result)Verb［た］+ あげく + の + NounNoun + の possession + あげく + (に)  + (Past Tense) (Result)"}}'
                FROM knowledge_units WHERE slug = 'grammar/あげく' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/あげく' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('05167c66-8613-4860-9f97-b6655e4c41da', 'grammar', 'grammar/ときたら1', 54, 'ときたら') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'ときたら', 'When it comes to', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Noun + ときたら"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"Noun + ときたら"}],"text_only":"StructureNoun + ときたら"}}'
                FROM knowledge_units WHERE slug = 'grammar/ときたら1' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/ときたら1' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('0543518c-23e8-4482-b94f-5e7a9ed48237', 'grammar', 'grammar/とは言うものの', 54, 'とは言うものの') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'とは言うものの', 'Although', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Verb + とは言（い）うものの + Phrase［い］Adjective + とは言う（い）ものの + Phrase［な］Adjective + （だ）+ とは言（い）うものの + PhraseNoun + （だ）+ とは言（い）うものの + PhrasePhrase (A)。とは言（い）うものの + Phrase (B)"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"Verb + とは言(い)うものの + Phrase［い］Adjective + とは言う(い)ものの + Phrase［な］Adjective + （だ）+ とは言(い)うものの +  PhraseNoun + （だ）+ とは言(い)うものの + PhrasePhrase (A)。とは言(い)うものの + Phrase (B)"}],"text_only":"StructureVerb + とは言(い)うものの + Phrase［い］Adjective + とは言う(い)ものの + Phrase［な］Adjective + （だ）+ とは言(い)うものの +  PhraseNoun + （だ）+ とは言(い)うものの + PhrasePhrase (A)。とは言(い)うものの + Phrase (B)"}}'
                FROM knowledge_units WHERE slug = 'grammar/とは言うものの' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/とは言うものの' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('05890480-b710-46dd-b9b5-dc807295a473', 'grammar', 'grammar/げ', 41, 'げ') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'げ', 'Seemingly', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Verb［stem］+ げ + に(1)［い］Adjective［い］+ げ + に(1)［な］Adjective + げ + に(1)(1) な + Noun"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"Verb［stem］+ げ + に(1)［い］Adjective［い］+ げ + に(1)［な］Adjective + げ + に(1)(1) な + Noun"}],"text_only":"StructureVerb［stem］+ げ + に(1)［い］Adjective［い］+ げ + に(1)［な］Adjective + げ + に(1)(1) な + Noun"}}'
                FROM knowledge_units WHERE slug = 'grammar/げ' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/げ' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('05d66e45-55f4-49cc-9a4f-dfb4b6186046', 'grammar', 'grammar/よりほかない', 48, 'よりほかない') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'よりほかない', 'To have no choice but', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Verb + より + ほか + （は(1)）+ ない(1) に、には"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"Verb + より + ほか + （は(1)）+ ない(1) に、には"}],"text_only":"StructureVerb + より + ほか + （は(1)）+ ない(1) に、には"}}'
                FROM knowledge_units WHERE slug = 'grammar/よりほかない' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/よりほかない' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('05ef5b76-a724-4a35-9968-85fa88715564', 'grammar', 'grammar/ないでもない', 55, 'ないでもない') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'ないでもない', 'Kind of', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Verb［ない］+ （もの）+ でも(1) + ない(1)では"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"Verb［ない］+ （もの）+ でも(1) + ない(1)では"}],"text_only":"StructureVerb［ない］+ （もの）+ でも(1) + ない(1)では"}}'
                FROM knowledge_units WHERE slug = 'grammar/ないでもない' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/ないでもない' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('06019e96-1373-4f99-85bd-c9adc4a5d3ef', 'grammar', 'grammar/からといって', 41, 'からといって') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'からといって', 'Just because', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Verb + からといって［い］Adjective + からといって［な］Adjective + だからといってNoun + だからといって"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"Verb + からといって［い］Adjective + からといって［な］Adjective + だからといってNoun + だからといって"}],"text_only":"StructureVerb + からといって［い］Adjective + からといって［な］Adjective + だからといってNoun + だからといって"}}'
                FROM knowledge_units WHERE slug = 'grammar/からといって' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/からといって' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('0768d01a-b39e-4d1f-be14-8ac79d1d65cf', 'grammar', 'grammar/てはならない', 43, 'てはならない') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'てはならない', 'Must not', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Verb［て］+ はならない","Verb［て］+ はなりません"],"formula":{"tokens":[{"type":"text","text":"StructureStandardPolite"},{"type":"emphasis","text":"Verb［て］+ はならない"}],"text_only":"StructureStandardPoliteVerb［て］+ はならない"}}'
                FROM knowledge_units WHERE slug = 'grammar/てはならない' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/てはならない' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('07b9c3f2-bc75-44ab-89e0-d3e5ce3be8c9', 'grammar', 'grammar/も-ば-も', 48, 'も～ば～も') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'も～ば～も', '…And…', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Noun (A)も + Verb［ば］+ Noun (B)もNoun (A)も + ［い］Adjective［ば］+ Noun (B)もNoun (A)も + ［な］Adjective + なら + Noun (B)もNoun (A)も + Noun + なら + Noun (B)も"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"Noun (A)も + Verb［ば］+ Noun (B)もNoun (A)も + ［い］Adjective［ば］+ Noun (B)もNoun (A)も + ［な］Adjective + なら + Noun (B)もNoun (A)も + Noun + なら + Noun (B)も"}],"text_only":"StructureNoun (A)も + Verb［ば］+ Noun (B)もNoun (A)も + ［い］Adjective［ば］+ Noun (B)もNoun (A)も + ［な］Adjective + なら + Noun (B)もNoun (A)も + Noun + なら + Noun (B)も"}}'
                FROM knowledge_units WHERE slug = 'grammar/も-ば-も' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/も-ば-も' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('07d4e2b1-e53f-4c72-b1e6-2576c6749ab8', 'grammar', 'grammar/ことか', 30, 'ことか') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'ことか', 'How…', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Verb + ことか［い］Adjective + ことか［な］Adjective + な + ことかNoun + である + ことか"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"Verb + ことか［い］Adjective + ことか［な］Adjective + な + ことかNoun + である + ことか"}],"text_only":"StructureVerb + ことか［い］Adjective + ことか［な］Adjective + な + ことかNoun + である + ことか"}}'
                FROM knowledge_units WHERE slug = 'grammar/ことか' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/ことか' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('0823575b-ea17-4dc6-83fc-337b42a1c2b1', 'grammar', 'grammar/とはいえ', 54, 'とはいえ') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'とはいえ', 'Though', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Verb + とはいえ + Phrase［い］Adjective + とはいえ + PhraseNoun + （だ）+ とはいえ + Phrase［な］Adjective + （だ）+ とはいえ + PhrasePhrase (A)。とはいえ + Phrase (B)"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"Verb + とはいえ + Phrase［い］Adjective + とはいえ + PhraseNoun + （だ）+ とはいえ + Phrase［な］Adjective + （だ）+ とはいえ + PhrasePhrase (A)。とはいえ + Phrase (B)"}],"text_only":"StructureVerb + とはいえ + Phrase［い］Adjective + とはいえ + PhraseNoun + （だ）+ とはいえ + Phrase［な］Adjective + （だ）+ とはいえ + PhrasePhrase (A)。とはいえ + Phrase (B)"}}'
                FROM knowledge_units WHERE slug = 'grammar/とはいえ' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/とはいえ' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('0850a8be-ba1f-4b29-b84d-76824f1b60f1', 'grammar', 'grammar/に関する-に関して', 36, 'に関する・に関して') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'に関する・に関して', 'Related to', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Noun + に関（かん）してNoun + に関（かん）する + Noun"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"Noun + に関(かん)してNoun + に関(かん)する +  Noun"}],"text_only":"StructureNoun + に関(かん)してNoun + に関(かん)する +  Noun"}}'
                FROM knowledge_units WHERE slug = 'grammar/に関する-に関して' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/に関する-に関して' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('089edad7-e9f0-438e-a081-7d5582ac72a0', 'grammar', 'grammar/いい', 7, 'いい') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'いい', 'い-Adjective meaning ''good''', '{"tokens":[{"type":"emphasis","text":"いい is an adjective that means 'good' in Japanese. It can be a little bit difficult to use at first, as it conjugates differently to other い-Adjectives.\n\n\n\n\n\nIn these sentences, we can see that the first い in いい changes to よ, depending on the form. This is unique to いい, and does not happen with other adjectives.\nいい can sometimes be seen as 良(よ)い, in these cases, the kanji is likely to be read as よい, and not いい. There is technically no difference between these two meanings, but よい does sound more formal/old-fashioned.\n\n\n\nCaution\nWhen used as an adverb, よく should not be confused as a conjugation of いい. よく has several possible kanji that it may stem from, and means frequently/often/well."}],"text_only":"いい is an adjective that means 'good' in Japanese. It can be a little bit difficult to use at first, as it conjugates differently to other い-Adjectives.\n\n\n\n\n\nIn these sentences, we can see that the first い in いい changes to よ, depending on the form. This is unique to いい, and does not happen with other adjectives.\nいい can sometimes be seen as 良(よ)い, in these cases, the kanji is likely to be read as よい, and not いい. There is technically no difference between these two meanings, but よい does sound more formal/old-fashioned.\n\n\n\nCaution\nWhen used as an adverb, よく should not be confused as a conjugation of いい. よく has several possible kanji that it may stem from, and means frequently/often/well."}', '{"patterns":["Non-Past Form: いいNon-Past Negative Form: よくないPast Form: よかったPast Negative Form: よくなかった","Polite Non-Past Form: いい＋ですPolite Non-Past Negative Form: よくない＋ですPolite Past Form: よかった＋ですPolite Past Negative Form: よくなかった＋です"],"formula":{"tokens":[{"type":"text","text":"StructureStandardPolite"},{"type":"emphasis","text":"Non-Past Form: いいNon-Past Negative Form: よくないPast Form: よかったPast Negative Form: よくなかった"}],"text_only":"StructureStandardPoliteNon-Past Form: いいNon-Past Negative Form: よくないPast Form: よかったPast Negative Form: よくなかった"}}'
                FROM knowledge_units WHERE slug = 'grammar/いい' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/いい' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('08a3ce18-8efa-40a4-941a-2b1f4bb1f632', 'grammar', 'grammar/だけでなく', 22, 'だけでなく') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'だけでなく', 'Not only… but also', '{"tokens":[{"type":"emphasis","text":"だけでなく (an abbreviation of だけではなく) is a common construction in Japanese which translates to 'not only (A), but also (B)'. Sometimes the (B) statement may be left unsaid. This expression may connect to any (A) phrase that だけ would usually be able to connect to.\n\n\n\n\n\n\nCaution\nThe で in では is not the particle で, but the auxiliary verb だ in its conjunctive form. は is regularly dropped from では expressions, or it may also be changed to じゃ, for ease of pronunciation.\n\n\nThe conjunction particle て should follow なく, as it is the conjunctive form of the い-Adjective ない. However, the て in this particular construction is very often omitted.\n\nCaution\nIn writing, if there is no comma (known as a 読点(とうてん) in Japanese) after なく, the full なくて construction will be required. When a comma is present, both forms are grammatically correct.\n\n"}],"text_only":"だけでなく (an abbreviation of だけではなく) is a common construction in Japanese which translates to 'not only (A), but also (B)'. Sometimes the (B) statement may be left unsaid. This expression may connect to any (A) phrase that だけ would usually be able to connect to.\n\n\n\n\n\n\nCaution\nThe で in では is not the particle で, but the auxiliary verb だ in its conjunctive form. は is regularly dropped from では expressions, or it may also be changed to じゃ, for ease of pronunciation.\n\n\nThe conjunction particle て should follow なく, as it is the conjunctive form of the い-Adjective ない. However, the て in this particular construction is very often omitted.\n\nCaution\nIn writing, if there is no comma (known as a 読点(とうてん) in Japanese) after なく, the full なくて construction will be required. When a comma is present, both forms are grammatically correct.\n\n"}', '{"patterns":["Verb + だけ + でなく(1)［い］Adjective + だけ + でなく(1)［な］Adjective + な + だけ + でなく(1)Noun + だけ + でなく(1)(1) ではなく（て）、じゃなく（て）"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"Verb + だけ + でなく(1)［い］Adjective + だけ + でなく(1)［な］Adjective + な + だけ + でなく(1)Noun + だけ + でなく(1)(1) ではなく（て）、じゃなく（て）"}],"text_only":"StructureVerb + だけ + でなく(1)［い］Adjective + だけ + でなく(1)［な］Adjective + な + だけ + でなく(1)Noun + だけ + でなく(1)(1) ではなく（て）、じゃなく（て）"}}'
                FROM knowledge_units WHERE slug = 'grammar/だけでなく' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/だけでなく' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('08f34893-faca-4eb2-ae1b-55fdeb371965', 'grammar', 'grammar/まま', 37, 'まま(に)') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'まま(に)', 'As is', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Verb［た］(1) + まま［い］Adjective + まま［な］Adjective + な + ままNoun + の + まま(1) Verb［ない］"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"Verb［た］(1) + まま［い］Adjective + まま［な］Adjective + な + ままNoun + の + まま(1) Verb［ない］"}],"text_only":"StructureVerb［た］(1) + まま［い］Adjective + まま［な］Adjective + な + ままNoun + の + まま(1) Verb［ない］"}}'
                FROM knowledge_units WHERE slug = 'grammar/まま' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/まま' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('0936af2d-6a2b-47aa-a458-c1f2525a9853', 'grammar', 'grammar/というのは事実だ', 40, '～というのは事実だ') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, '～というのは事実だ', 'It is a fact that ~', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Phrase + (という) + のは事実（じじつ） + だ","Phrase + (という) + のは事実（じじつ） + です"],"formula":{"tokens":[{"type":"text","text":"StructureStandardPolite"},{"type":"emphasis","text":"Phrase + (という) + のは事実(じじつ) + だ"}],"text_only":"StructureStandardPolitePhrase + (という) + のは事実(じじつ) + だ"}}'
                FROM knowledge_units WHERE slug = 'grammar/というのは事実だ' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/というのは事実だ' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('09b566de-97e2-46a9-80e7-6f8419e646f7', 'grammar', 'grammar/がる', 20, 'がる') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'がる', 'To feel', '{"tokens":[{"type":"emphasis","text":"がる is a う-Verb that is primarily used as a suffix in Japanese. When used in this way, it means 'to act like (A)', or 'to show signs of being (A)', where (A) is the word that it is attached to.\nTo use がる, you will need to link it to the stem form of an い-Adjective (simply remove the い), or to the stem form of a な-Adjective (do not include the な).\n\n\n\n\nがる is a verb which means 'to give the impression of (A)', or 'to act like (A)'. This is very important in Japanese, as you would not usually say how somebody else feels, unless they told you directly and you are simply repeating what you heard (in which case you would use the quotation particle と).\n\nWhen you want to express the way you 'think' that someone else feels, but don't have any direct information about it, that is when がる would be natural to use. For example, if you see someone shivering in the cold, you would say something like the following.\n\nThe main difference between がる, and がっている, is that がる will be used when a person usually/always acts a certain way, whereas がっている is more about the way someone/something is acting in any specific moment.\n\n\n\n\nCaution\nがる may also be used to describe yourself (in the third person). This is when you want to express the way you think that you act/are acting, or a way you assume other people view your behavior.\n\n\n\nFun Fact\nThe use of がっている to express an 'in the moment' way that someone is acting, is slowly becoming less and less common in modern Japanese. Regularly, そう will be used instead, to express that someone (or something) 'seems' a certain way.\n\n\n"}],"text_only":"がる is a う-Verb that is primarily used as a suffix in Japanese. When used in this way, it means 'to act like (A)', or 'to show signs of being (A)', where (A) is the word that it is attached to.\nTo use がる, you will need to link it to the stem form of an い-Adjective (simply remove the い), or to the stem form of a な-Adjective (do not include the な).\n\n\n\n\nがる is a verb which means 'to give the impression of (A)', or 'to act like (A)'. This is very important in Japanese, as you would not usually say how somebody else feels, unless they told you directly and you are simply repeating what you heard (in which case you would use the quotation particle と).\n\nWhen you want to express the way you 'think' that someone else feels, but don't have any direct information about it, that is when がる would be natural to use. For example, if you see someone shivering in the cold, you would say something like the following.\n\nThe main difference between がる, and がっている, is that がる will be used when a person usually/always acts a certain way, whereas がっている is more about the way someone/something is acting in any specific moment.\n\n\n\n\nCaution\nがる may also be used to describe yourself (in the third person). This is when you want to express the way you think that you act/are acting, or a way you assume other people view your behavior.\n\n\n\nFun Fact\nThe use of がっている to express an 'in the moment' way that someone is acting, is slowly becoming less and less common in modern Japanese. Regularly, そう will be used instead, to express that someone (or something) 'seems' a certain way.\n\n\n"}', '{"patterns":["［い］Adjective［い］+ がる［な］Adjective + がる","［い］Adjective［い］+ がります［な］Adjective + がります"],"formula":{"tokens":[{"type":"text","text":"StructureStandardPolite"},{"type":"emphasis","text":"［い］Adjective［い］+ がる［な］Adjective + がる"}],"text_only":"StructureStandardPolite［い］Adjective［い］+ がる［な］Adjective + がる"}}'
                FROM knowledge_units WHERE slug = 'grammar/がる' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/がる' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('09be9dc9-b564-44ad-bd56-fbf4f75df9e1', 'grammar', 'grammar/なお2', 45, 'なお②') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'なお②', 'In addition', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Phrase. なお、+ Phrase"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"Phrase. なお、+ Phrase"}],"text_only":"StructurePhrase. なお、+ Phrase"}}'
                FROM knowledge_units WHERE slug = 'grammar/なお2' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/なお2' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('0a01748c-ef3c-48d5-b67c-b0634c413630', 'grammar', 'grammar/にひきかえ', 56, 'にひきかえ') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'にひきかえ', 'In stark contrast', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Noun＋にひきかえ［な］Adjective＋な・である＋の＋にひきかえ［い］Adjective＋の＋にひきかえVerb＋の＋にひきかえPhrase (A)。それにひきかえ、Noun は＋Phrase (B)"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"Noun＋にひきかえ［な］Adjective＋な・である＋の＋にひきかえ［い］Adjective＋の＋にひきかえVerb＋の＋にひきかえPhrase (A)。それにひきかえ、Noun は＋Phrase (B)\n"}],"text_only":"StructureNoun＋にひきかえ［な］Adjective＋な・である＋の＋にひきかえ［い］Adjective＋の＋にひきかえVerb＋の＋にひきかえPhrase (A)。それにひきかえ、Noun は＋Phrase (B)\n"}}'
                FROM knowledge_units WHERE slug = 'grammar/にひきかえ' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/にひきかえ' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('0a0ef14f-5f58-4f6d-80b6-eb1e5ac2503a', 'grammar', 'grammar/向け', 39, '向け') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, '向け', 'Intended for', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Noun + 向（む）け（に）Noun + 向け + の + Noun"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"Noun + 向(む)け（に）Noun + 向け + の + Noun"}],"text_only":"StructureNoun + 向(む)け（に）Noun + 向け + の + Noun"}}'
                FROM knowledge_units WHERE slug = 'grammar/向け' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/向け' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('0a1a8dc5-2a76-4d08-9ef0-77aaecc38a00', 'grammar', 'grammar/もしも～なら・もしも～でも', 37, 'もしも～なら・もしも～でも') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'もしも～なら・もしも～でも', 'If', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["もしも + Phrase［なら］(1)(1) Phrase［ば］、Phrase［と］、Phrase［ても］"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"もしも + Phrase［なら］(1)(1) Phrase［ば］、Phrase［と］、Phrase［ても］"}],"text_only":"Structureもしも + Phrase［なら］(1)(1) Phrase［ば］、Phrase［と］、Phrase［ても］"}}'
                FROM knowledge_units WHERE slug = 'grammar/もしも～なら・もしも～でも' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/もしも～なら・もしも～でも' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('0a283a3b-217d-4718-b292-050fa4d74c99', 'grammar', 'grammar/ね', 14, 'ね') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'ね', 'Isn''t it?', '{"tokens":[{"type":"emphasis","text":"ね is classified as a sentence ending particle in Japanese. It may also be pronounced as ねえ. ね is used when the speaker is looking for agreement from someone, or wants confirmation about something. Due to this, it is often translated as 'right?', or 'isn't it?'. To use ね, simply add it to the end of almost any sentence.\n\n\n\n\n\nAs we will cover in our lesson about the sentence ending particle な, ね can almost be thought of as the opposite. ね is used when expressing a shared opinion, a shared thought, or generally something you think will be agreed with by the listener. However, な focuses almost exclusively on the speaker, and their own thoughts.\n\n\n\nFun Fact\nよ and ね are very frequently combined together to make the sentence ender よね. This is used purely when you expect the listener will agree with you.\n\n\nCaution\nね is much weaker than でしょう or だろう, and is sometimes said purely out of habit, without much nuance of 'right' at all."}],"text_only":"ね is classified as a sentence ending particle in Japanese. It may also be pronounced as ねえ. ね is used when the speaker is looking for agreement from someone, or wants confirmation about something. Due to this, it is often translated as 'right?', or 'isn't it?'. To use ね, simply add it to the end of almost any sentence.\n\n\n\n\n\nAs we will cover in our lesson about the sentence ending particle な, ね can almost be thought of as the opposite. ね is used when expressing a shared opinion, a shared thought, or generally something you think will be agreed with by the listener. However, な focuses almost exclusively on the speaker, and their own thoughts.\n\n\n\nFun Fact\nよ and ね are very frequently combined together to make the sentence ender よね. This is used purely when you expect the listener will agree with you.\n\n\nCaution\nね is much weaker than でしょう or だろう, and is sometimes said purely out of habit, without much nuance of 'right' at all."}', '{"patterns":["Sentence + ね"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"Sentence + ね"}],"text_only":"StructureSentence + ね"}}'
                FROM knowledge_units WHERE slug = 'grammar/ね' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/ね' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('0a453d3c-c98f-4956-9baf-afb732d71eb9', 'grammar', 'grammar/てくれる', 23, 'てくれる') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'てくれる', 'To do something for someone (usually you)', '{"tokens":[{"type":"emphasis","text":"The verb 呉(く)れる in Japanese, is very similar to 与(あた)える (to bestow). The primary difference is that 呉(く)れる (primarily written in hiragana) means to 'bestow to the speaker' (or someone in the speakers inner circle).\nIn this way, てくれる is the opposite of てあげる, which conveys that someone (usually the speaker) gives (an action) to another person that is outside of their inner circle. てくれる is commonly translated as 'would you do (A) for me', as a question, or 'someone did (A) for me', as a statement.\n\n\n\n\n\nWhen asking for a favor, てくれる can be shortened to てくれ. However, this is very casual, and should not be used with strangers (or anyone that you do not know well). As an English equivalent, てくれ sounds similar to phrases like 'would ya do (A)', or 'could ya do (A)?'\n\nFun Fact\nてくれる is one of the most casual ways to ask for a favor, with てもらう being slightly more polite. ていただく (the humble speech variation of てくれる) is even more polite than either of these!\n\n\n\n"}],"text_only":"The verb 呉(く)れる in Japanese, is very similar to 与(あた)える (to bestow). The primary difference is that 呉(く)れる (primarily written in hiragana) means to 'bestow to the speaker' (or someone in the speakers inner circle).\nIn this way, てくれる is the opposite of てあげる, which conveys that someone (usually the speaker) gives (an action) to another person that is outside of their inner circle. てくれる is commonly translated as 'would you do (A) for me', as a question, or 'someone did (A) for me', as a statement.\n\n\n\n\n\nWhen asking for a favor, てくれる can be shortened to てくれ. However, this is very casual, and should not be used with strangers (or anyone that you do not know well). As an English equivalent, てくれ sounds similar to phrases like 'would ya do (A)', or 'could ya do (A)?'\n\nFun Fact\nてくれる is one of the most casual ways to ask for a favor, with てもらう being slightly more polite. ていただく (the humble speech variation of てくれる) is even more polite than either of these!\n\n\n\n"}', '{"patterns":["Verb［て］+ くれるVerb［ないで］+ くれるPoliteness Levels","Verb［て］+ くれますかVerb［ないで］+ くれますかPoliteness Levels"],"formula":{"tokens":[{"type":"text","text":"StructureStandardPolite"},{"type":"emphasis","text":"Verb［て］+ くれるVerb［ないで］+ くれるPoliteness Levels"}],"text_only":"StructureStandardPoliteVerb［て］+ くれるVerb［ないで］+ くれるPoliteness Levels"}}'
                FROM knowledge_units WHERE slug = 'grammar/てくれる' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/てくれる' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('0a77c045-409b-4dce-8d82-32fc9eb6f2dd', 'grammar', 'grammar/やら-やら', 48, 'やら～やら') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'やら～やら', 'Whether or', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["A(1) + やら + B(1) + やら(1) Verb［る］、Noun、［い］Adjective"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"A(1) + やら + B(1) + やら(1) Verb［る］、Noun、［い］Adjective"}],"text_only":"StructureA(1) + やら + B(1) + やら(1) Verb［る］、Noun、［い］Adjective"}}'
                FROM knowledge_units WHERE slug = 'grammar/やら-やら' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/やら-やら' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('0a821684-177f-4958-af18-69e9d739f7f8', 'grammar', 'grammar/でもなんでもない', 53, 'でもなんでもない') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'でもなんでもない', 'Not at all', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Noun + でもなんでもない［な］Adjective + でもなんでもない","Noun + でもなんでもないです［な］Adjective + でもなんでもないです"],"formula":{"tokens":[{"type":"text","text":"StructureStandardPolite"},{"type":"emphasis","text":"Noun + でもなんでもない［な］Adjective + でもなんでもない"}],"text_only":"StructureStandardPoliteNoun + でもなんでもない［な］Adjective + でもなんでもない"}}'
                FROM knowledge_units WHERE slug = 'grammar/でもなんでもない' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/でもなんでもない' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('0aba0e8d-fea8-406c-8591-050ff89a612f', 'grammar', 'grammar/が気になる', 41, 'が気になる') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'が気になる', 'To be interested in', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Noun + が気（き）になるVerb + こと(1) + が気（き）になる(1) の","Noun + が気（き）になりますVerb + こと(1) + が気（き）になります(1) の"],"formula":{"tokens":[{"type":"text","text":"StructureStandardPolite"},{"type":"emphasis","text":"Noun + が気(き)になるVerb + こと(1) + が気(き)になる(1) の"}],"text_only":"StructureStandardPoliteNoun + が気(き)になるVerb + こと(1) + が気(き)になる(1) の"}}'
                FROM knowledge_units WHERE slug = 'grammar/が気になる' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/が気になる' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('0ac82b5c-031d-4d5e-8dc6-f47ffbf40916', 'grammar', 'grammar/ない-はない', 28, '～ない～はない') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, '～ない～はない', 'There is not ~ that is not/does not', '{"tokens":[{"type":"emphasis","text":"～ない～はない is an example of a double negative in Japanese, and is a grammar construction that requires careful attention in order not to incorrectly interpret. Both the い-Adjective (形容詞(けいようし)), and auxiliary verb forms of ない may be used in this construction, depending on what type of word is being negated. Let's take a look at a few examples.\n\n\n\n\n\nLiterally, this grammar pattern is very similar to 'there isn't an (A) that doesn't (B)' in English.\nCaution\nThis term is not to to be confused with なくはない, a more advanced grammar pattern which means 'It's not that it isn't (A)'.\n\n\n"}],"text_only":"～ない～はない is an example of a double negative in Japanese, and is a grammar construction that requires careful attention in order not to incorrectly interpret. Both the い-Adjective (形容詞(けいようし)), and auxiliary verb forms of ない may be used in this construction, depending on what type of word is being negated. Let's take a look at a few examples.\n\n\n\n\n\nLiterally, this grammar pattern is very similar to 'there isn't an (A) that doesn't (B)' in English.\nCaution\nThis term is not to to be confused with なくはない, a more advanced grammar pattern which means 'It's not that it isn't (A)'.\n\n\n"}', '{"patterns":["Verb［ない］+ Noun + は + ない［い］Adjective［ない］+ Noun + は + Verb［ない］［な］Adjective + じゃない(1) + Noun + は + Verb［ない］(1) ではない"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"Verb［ない］+ Noun + は + ない［い］Adjective［ない］+ Noun + は + Verb［ない］［な］Adjective + じゃない(1) + Noun + は + Verb［ない］(1) ではない"}],"text_only":"StructureVerb［ない］+ Noun + は + ない［い］Adjective［ない］+ Noun + は + Verb［ない］［な］Adjective + じゃない(1) + Noun + は + Verb［ない］(1) ではない"}}'
                FROM knowledge_units WHERE slug = 'grammar/ない-はない' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/ない-はない' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('0b6a7e21-9bbb-4e5b-be6e-a019c8ce4d40', 'grammar', 'grammar/お-ください', 19, 'お～ください ') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'お～ください ', 'Please do (Honorific)', '{"tokens":[{"type":"emphasis","text":"お～ください is an honorific language expression in Japanese which is used in a similar way to なさい.  It is the imperative form of くださる, which itself is the honorific language equivalent of くれる. In this way, it conveys 'please do (A) for me'.\n\n\n\n\nお～ください is more polite than なさい, and may be used when making requests to almost anybody, regardless of if they are higher, or lower status than you.\n\n\n\n\nCaution\nご～ください will only be used as part of the humble speech expression, ご～する (or お〜する). In these cases, it becomes ご～してください."}],"text_only":"お～ください is an honorific language expression in Japanese which is used in a similar way to なさい.  It is the imperative form of くださる, which itself is the honorific language equivalent of くれる. In this way, it conveys 'please do (A) for me'.\n\n\n\n\nお～ください is more polite than なさい, and may be used when making requests to almost anybody, regardless of if they are higher, or lower status than you.\n\n\n\n\nCaution\nご～ください will only be used as part of the humble speech expression, ご～する (or お〜する). In these cases, it becomes ご～してください."}', '{"patterns":["お + Verb［stem］+ ください"],"formula":{"tokens":[{"type":"text","text":"Structure"},{"type":"emphasis","text":"お + Verb［stem］+ ください"}],"text_only":"Structureお + Verb［stem］+ ください"}}'
                FROM knowledge_units WHERE slug = 'grammar/お-ください' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/お-ください' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('0b6fd46a-c304-4f93-bcb9-8a2675bf4838', 'grammar', 'grammar/ことはない', 30, 'ことはない') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;
INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, 'ことはない', 'There is no need to', '{"tokens":[{"type":"text","text":"EnglishJapanese"}],"text_only":"EnglishJapanese"}', '{"patterns":["Verb + ことはない","Verb + ことはありません"],"formula":{"tokens":[{"type":"text","text":"StructureStandardPolite"},{"type":"emphasis","text":"Verb + ことはない"}],"text_only":"StructureStandardPoliteVerb + ことはない"}}'
                FROM knowledge_units WHERE slug = 'grammar/ことはない' ON CONFLICT (ku_id) DO NOTHING;
INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = 'grammar/ことはない' ON CONFLICT DO NOTHING;
