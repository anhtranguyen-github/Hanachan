from __future__ import annotations

from langchain_core.messages import AIMessage

from app.agents.tutor_agent.nodes.response_node import response_node


async def test_response_node_formats_study_card_deterministically():
    result = await response_node(
        {
            "messages": [
                AIMessage(
                    content=(
                        "Study card ready.\n"
                        "Mode: learn\n"
                        "Item ID: ku-1\n"
                        "Character: 猫\n"
                        "Prompt: What is the meaning of 猫?\n"
                        "Meaning: cat"
                    ),
                    name="fsrs_node",
                )
            ],
            "user_input": "i want to learn",
        }
    )

    assert "問題: What is the meaning of 猫?" in result["generation"]
    assert "答えを送ってね" in result["generation"]
    assert "cat" in result["generation"]


async def test_response_node_formats_incorrect_study_answer_deterministically():
    result = await response_node(
        {
            "messages": [
                AIMessage(
                    content=(
                        "Incorrect answer for the current meaning card.\n"
                        "Mode: learn\n"
                        "Item ID: ku-1\n"
                        "Wrong Count: 1\n"
                        "Prompt: What is the meaning of 猫?\n"
                        "Do not reveal the answer immediately unless the learner explicitly asks."
                    ),
                    name="fsrs_node",
                )
            ],
            "user_input": "dog",
        }
    )

    assert "まだ正解ではないよ" in result["generation"]
    assert "What is the meaning of 猫?" in result["generation"]


async def test_response_node_formats_correct_study_answer_deterministically():
    result = await response_node(
        {
            "messages": [
                AIMessage(
                    content=(
                        "Correct.\n"
                        "Item ID: ku-1\n"
                        "Facet: meaning\n"
                        "Accepted Answers: ['cat']\n"
                        "Canonical Answer: cat\n"
                        "FSRS Updated: {'state': 'review'}"
                    ),
                    name="fsrs_node",
                )
            ],
            "user_input": "cat",
        }
    )

    assert "正解！" in result["generation"]
    assert "cat" in result["generation"]
