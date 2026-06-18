"""Tests for application configuration loading and validation."""
import logging

import pytest

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)


class TestSettings:
    """Tests for the Settings model and get_settings factory."""

    def test_default_environment_is_development(self) -> None:
        """Default environment resolves to 'development'.

        Returns:
            None
        """
        settings = Settings()
        assert settings.environment == "development"

    def test_invalid_environment_raises_value_error(self) -> None:
        """Settings raises ValueError for unknown environment names.

        Returns:
            None
        """
        with pytest.raises(ValueError):
            Settings(environment="staging")

    def test_rate_limit_zero_raises_value_error(self) -> None:
        """Settings raises ValueError when rate_limit_per_minute is 0.

        Returns:
            None
        """
        with pytest.raises(ValueError):
            Settings(rate_limit_per_minute=0)

    def test_rate_limit_negative_raises_value_error(self) -> None:
        """Settings raises ValueError when rate_limit_per_minute is negative.

        Returns:
            None
        """
        with pytest.raises(ValueError):
            Settings(rate_limit_per_minute=-10)

    def test_environment_is_lowercased(self) -> None:
        """Settings normalises environment to lowercase.

        Returns:
            None
        """
        settings = Settings(environment="DEVELOPMENT")
        assert settings.environment == "development"

    def test_get_settings_returns_cached_instance(self) -> None:
        """get_settings returns the same cached instance on repeated calls.

        Returns:
            None
        """
        a = get_settings()
        b = get_settings()
        assert a is b
