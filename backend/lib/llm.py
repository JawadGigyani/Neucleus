"""Featherless.ai LLM instances configured for each pipeline node."""

import os
from langchain_openai import ChatOpenAI

FEATHERLESS_BASE_URL = "https://api.featherless.ai/v1"

MODELS = {
    "parse": "Qwen/Qwen2.5-7B-Instruct",
    "qc": "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
    "protocol": "deepseek-ai/DeepSeek-V3.2",
    "verify_protocol": "Qwen/Qwen2.5-14B-Instruct",
    "materials": "deepseek-ai/DeepSeek-V3.2",
    "timeline": "Qwen/Qwen3-32B",
}

FALLBACK_MODELS = {
    "deepseek-ai/DeepSeek-V3.2": "Qwen/Qwen3-32B",
    "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B": "Qwen/Qwen2.5-14B-Instruct",
    "Qwen/Qwen3-32B": "Qwen/Qwen2.5-14B-Instruct",
    "Qwen/Qwen2.5-14B-Instruct": "Qwen/Qwen2.5-7B-Instruct",
    "Qwen/Qwen2.5-7B-Instruct": "Qwen/Qwen2.5-7B-Instruct",
}


def get_llm(node_name: str, temperature: float = 0.3) -> ChatOpenAI:
    api_key = os.getenv("FEATHERLESS_API_KEY")
    if not api_key:
        raise ValueError("FEATHERLESS_API_KEY not set")

    model = MODELS.get(node_name)
    if not model:
        raise ValueError(f"No model configured for node: {node_name}")

    return ChatOpenAI(
        model=model,
        api_key=api_key,
        base_url=FEATHERLESS_BASE_URL,
        temperature=temperature,
        max_tokens=8192,
    )


def get_fallback_llm(node_name: str, temperature: float = 0.3) -> ChatOpenAI:
    api_key = os.getenv("FEATHERLESS_API_KEY")
    if not api_key:
        raise ValueError("FEATHERLESS_API_KEY not set")

    primary_model = MODELS.get(node_name, "")
    fallback_model = FALLBACK_MODELS.get(primary_model, "Qwen/Qwen2.5-7B-Instruct")

    return ChatOpenAI(
        model=fallback_model,
        api_key=api_key,
        base_url=FEATHERLESS_BASE_URL,
        temperature=temperature,
        max_tokens=8192,
    )
