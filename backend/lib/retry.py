"""Retry utility for LLM calls with 429 concurrency-limit handling."""

import asyncio
from langchain_core.messages import BaseMessage
from langchain_openai import ChatOpenAI


async def invoke_with_retry(
    llm: ChatOpenAI,
    messages: list[BaseMessage],
    max_retries: int = 3,
    initial_delay: float = 5.0,
) -> str:
    """Invoke LLM with automatic retry on 429 (concurrency limit) errors.
    Returns the raw response content string."""
    for attempt in range(max_retries):
        try:
            response = await llm.ainvoke(messages)
            return response.content
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "concurrency" in error_str.lower():
                delay = initial_delay * (attempt + 1)
                print(f"  [Retry] 429 concurrency limit, waiting {delay:.0f}s (attempt {attempt + 1}/{max_retries})")
                await asyncio.sleep(delay)
            else:
                raise
    raise Exception(f"Max retries ({max_retries}) exceeded for 429 errors")
