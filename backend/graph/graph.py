"""LangGraph StateGraph definition — nodes, edges, and conditional routing."""

from langgraph.graph import StateGraph, END
from graph.state import AgentState
from graph.nodes.parse import parse_node
from graph.nodes.feedback_retrieval import feedback_retrieval_node
from graph.nodes.retrieve import retrieve_node
from graph.nodes.qc import qc_node
from graph.nodes.protocol import protocol_node
from graph.nodes.verify_protocol import verify_protocol_node
from graph.nodes.materials import materials_node
from graph.nodes.verify_materials import verify_materials_node
from graph.nodes.timeline import timeline_node
from graph.nodes.post_process import post_process_node


def should_continue_after_parse(state: AgentState) -> str:
    if state.get("parsed_hypothesis") is None:
        return "end"
    return "feedback_retrieval"


def should_continue_after_retrieve(state: AgentState) -> str:
    results = state.get("raw_search_results", [])
    if not results:
        return "end"
    return "qc"


def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    graph.add_node("parse", parse_node)
    graph.add_node("feedback_retrieval", feedback_retrieval_node)
    graph.add_node("retrieve", retrieve_node)
    graph.add_node("qc", qc_node)
    graph.add_node("protocol", protocol_node)
    graph.add_node("verify_protocol", verify_protocol_node)
    graph.add_node("materials", materials_node)
    graph.add_node("verify_materials", verify_materials_node)
    graph.add_node("timeline", timeline_node)
    graph.add_node("post_process", post_process_node)

    graph.set_entry_point("parse")

    graph.add_conditional_edges("parse", should_continue_after_parse, {
        "feedback_retrieval": "feedback_retrieval",
        "end": END,
    })
    graph.add_edge("feedback_retrieval", "retrieve")
    graph.add_conditional_edges("retrieve", should_continue_after_retrieve, {
        "qc": "qc",
        "end": END,
    })
    graph.add_edge("qc", "protocol")
    graph.add_edge("protocol", "verify_protocol")
    graph.add_edge("verify_protocol", "materials")
    graph.add_edge("materials", "verify_materials")
    graph.add_edge("verify_materials", "timeline")
    graph.add_edge("timeline", "post_process")
    graph.add_edge("post_process", END)

    return graph


def compile_graph():
    graph = build_graph()
    return graph.compile()
