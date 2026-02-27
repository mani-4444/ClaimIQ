import logging
import sys


def setup_logger(name: str = "claimiq") -> logging.Logger:
    _logger = logging.getLogger(name)

    if _logger.handlers:
        return _logger

    _logger.setLevel(logging.INFO)

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.DEBUG)

    formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)s [%(name)s.%(funcName)s:%(lineno)d] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)
    _logger.addHandler(handler)

    return _logger


logger = setup_logger()
