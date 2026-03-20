"""
Kafka Consumer for Graph Engine
Reads from the `fraud.signals.raw` topic and writes each signal into Neo4j.
"""
from __future__ import annotations
import asyncio
import json
import logging
import os

from aiokafka import AIOKafkaConsumer

from app.graph.schema import merge_signal_into_graph

logger = logging.getLogger(__name__)

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
KAFKA_TOPIC = "fraud.signals.raw"
KAFKA_GROUP = "graph-engine-group"


async def start_consumer() -> None:
    """
    Long-running coroutine — connects to Kafka and processes each signal message.
    """
    consumer = AIOKafkaConsumer(
        KAFKA_TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP,
        group_id=KAFKA_GROUP,
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        auto_offset_reset="earliest",
        enable_auto_commit=True,
    )

    retry_delay = 5
    while True:
        try:
            await consumer.start()
            logger.info("Graph Engine Kafka consumer started — topic: %s", KAFKA_TOPIC)
            break
        except Exception as exc:
            logger.warning("Kafka not ready (%s), retrying in %ds…", exc, retry_delay)
            await asyncio.sleep(retry_delay)

    try:
        async for msg in consumer:
            signal: dict = msg.value
            logger.debug("Received signal from partition=%d offset=%d", msg.partition, msg.offset)
            try:
                await merge_signal_into_graph(signal)
            except Exception as exc:
                logger.error("Failed to merge signal into graph: %s", exc, exc_info=True)
    except asyncio.CancelledError:
        logger.info("Kafka consumer shutting down…")
    finally:
        await consumer.stop()
