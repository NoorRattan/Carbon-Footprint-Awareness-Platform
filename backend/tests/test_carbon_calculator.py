"""Unit tests for carbon_calculator.py.

Tests cover every calculate_carbon() code path, get_unit_label(),
and spot-checks on EMISSION_FACTORS, NATIONAL_AVERAGES, and
VALID_SUBCATEGORIES to catch any accidental data changes.
"""
import logging

import pytest

from app.services.carbon_calculator import (
    EMISSION_FACTORS,
    NATIONAL_AVERAGES,
    SUBCATEGORY_LABELS,
    VALID_SUBCATEGORIES,
    calculate_carbon,
    get_unit_label,
)

logger = logging.getLogger(__name__)


class TestCalculateCarbon:
    """Tests for the calculate_carbon() pure function."""

    def test_car_petrol_100km(self) -> None:
        """calculate_carbon returns 19.2 for 100 km in a petrol car.

        Returns:
            None
        """
        result = calculate_carbon("transport", "car_petrol", 100)
        assert result == pytest.approx(19.2, abs=1e-4)

    def test_beef_1kg(self) -> None:
        """calculate_carbon returns 27.0 for 1 kg of beef.

        Returns:
            None
        """
        result = calculate_carbon("food", "beef", 1)
        assert result == pytest.approx(27.0, abs=1e-4)

    def test_electricity_uk_100kwh(self) -> None:
        """calculate_carbon returns 20.7 for 100 kWh of UK electricity.

        Returns:
            None
        """
        result = calculate_carbon("energy", "electricity_uk", 100)
        assert result == pytest.approx(20.7, abs=1e-4)

    def test_cycling_zero_emissions(self) -> None:
        """calculate_carbon returns 0.0 for any cycling distance.

        Returns:
            None
        """
        result = calculate_carbon("transport", "cycling", 100)
        assert result == 0.0

    def test_walking_zero_emissions(self) -> None:
        """calculate_carbon returns 0.0 for any walking distance.

        Returns:
            None
        """
        result = calculate_carbon("transport", "walking", 50)
        assert result == 0.0

    def test_invalid_subcategory_raises_value_error(self) -> None:
        """calculate_carbon raises ValueError for unknown subcategory.

        Returns:
            None
        """
        with pytest.raises(ValueError, match="Invalid subcategory"):
            calculate_carbon("transport", "invalid_sub", 10)

    def test_invalid_category_raises_value_error(self) -> None:
        """calculate_carbon raises ValueError for unknown category.

        Returns:
            None
        """
        with pytest.raises(ValueError, match="Invalid category"):
            calculate_carbon("invalid_cat", "car_petrol", 10)

    def test_negative_amount_raises_value_error(self) -> None:
        """calculate_carbon raises ValueError for negative amounts.

        Returns:
            None
        """
        with pytest.raises(ValueError, match="positive"):
            calculate_carbon("transport", "car_petrol", -1)

    def test_zero_amount_raises_value_error(self) -> None:
        """calculate_carbon raises ValueError for amount=0.

        Returns:
            None
        """
        with pytest.raises(ValueError, match="positive"):
            calculate_carbon("transport", "car_petrol", 0)

    def test_result_rounded_to_4_decimal_places(self) -> None:
        """calculate_carbon result has at most 4 decimal places.

        Returns:
            None
        """
        result = calculate_carbon("transport", "car_electric", 7)
        assert result == round(result, 4)

    def test_landfill_waste(self) -> None:
        """calculate_carbon returns correct value for landfill waste.

        Returns:
            None
        """
        result = calculate_carbon("waste", "landfill", 10)
        assert result == pytest.approx(5.87, abs=1e-4)

    def test_lamb_food(self) -> None:
        """calculate_carbon returns correct value for lamb.

        Returns:
            None
        """
        result = calculate_carbon("food", "lamb", 2)
        assert result == pytest.approx(78.4, abs=1e-4)

    def test_all_categories_have_at_least_one_subcategory(self) -> None:
        """Every category in EMISSION_FACTORS has at least one subcategory.

        Returns:
            None
        """
        for cat, subcats in EMISSION_FACTORS.items():
            assert len(subcats) > 0, f"Category '{cat}' has no subcategories"

    def test_all_factors_are_non_negative(self) -> None:
        """All emission factors are non-negative floats.

        Returns:
            None
        """
        for cat, subcats in EMISSION_FACTORS.items():
            for sub, factor in subcats.items():
                assert factor >= 0, f"{cat}/{sub} has negative factor {factor}"


class TestGetUnitLabel:
    """Tests for the get_unit_label() pure function."""

    def test_transport_returns_km(self) -> None:
        """Transport category returns 'km' unit for all subcategories.

        Returns:
            None
        """
        assert get_unit_label("transport", "car_petrol") == "km"

    def test_food_dairy_milk_returns_litres(self) -> None:
        """Dairy milk subcategory returns 'litres'.

        Returns:
            None
        """
        assert get_unit_label("food", "dairy_milk") == "litres"

    def test_food_beef_returns_kg(self) -> None:
        """Non-dairy food subcategory returns 'kg'.

        Returns:
            None
        """
        assert get_unit_label("food", "beef") == "kg"

    def test_shopping_streaming_returns_hours(self) -> None:
        """streaming_hour subcategory returns 'hours'.

        Returns:
            None
        """
        assert get_unit_label("shopping", "streaming_hour") == "hours"

    def test_shopping_clothing_returns_items(self) -> None:
        """Non-streaming shopping subcategory returns 'items'.

        Returns:
            None
        """
        assert get_unit_label("shopping", "clothing_new") == "items"

    def test_energy_returns_kwh(self) -> None:
        """Energy category returns 'kWh' unit.

        Returns:
            None
        """
        assert get_unit_label("energy", "electricity_uk") == "kWh"

    def test_waste_returns_kg(self) -> None:
        """Waste category returns 'kg' unit.

        Returns:
            None
        """
        assert get_unit_label("waste", "landfill") == "kg"

    def test_invalid_category_raises_value_error(self) -> None:
        """get_unit_label raises ValueError for unknown categories.

        Returns:
            None
        """
        with pytest.raises(ValueError, match="Unknown category"):
            get_unit_label("invalid", "anything")


class TestNationalAverages:
    """Tests for NATIONAL_AVERAGES constant values."""

    def test_uk_average(self) -> None:
        """UK national average is 6.3 tonnes CO₂e per person per year.

        Returns:
            None
        """
        assert NATIONAL_AVERAGES["UK"] == pytest.approx(6.3)

    def test_us_average(self) -> None:
        """US national average is 14.5 tonnes CO₂e per person per year.

        Returns:
            None
        """
        assert NATIONAL_AVERAGES["US"] == pytest.approx(14.5)

    def test_in_average(self) -> None:
        """India national average is 1.9 tonnes CO₂e per person per year.

        Returns:
            None
        """
        assert NATIONAL_AVERAGES["IN"] == pytest.approx(1.9)

    def test_all_6_regions_present(self) -> None:
        """All 6 expected regions are present in NATIONAL_AVERAGES.

        Returns:
            None
        """
        expected = {"UK", "US", "EU", "IN", "AU", "OTHER"}
        assert expected == set(NATIONAL_AVERAGES.keys())

    def test_all_averages_are_positive(self) -> None:
        """All national average values are positive.

        Returns:
            None
        """
        for region, avg in NATIONAL_AVERAGES.items():
            assert avg > 0, f"Region '{region}' has non-positive average {avg}"


class TestValidSubcategories:
    """Tests for VALID_SUBCATEGORIES derived dict."""

    def test_transport_includes_car_petrol(self) -> None:
        """VALID_SUBCATEGORIES transport set contains 'car_petrol'.

        Returns:
            None
        """
        assert "car_petrol" in VALID_SUBCATEGORIES["transport"]

    def test_food_includes_beef(self) -> None:
        """VALID_SUBCATEGORIES food set contains 'beef'.

        Returns:
            None
        """
        assert "beef" in VALID_SUBCATEGORIES["food"]

    def test_all_categories_covered(self) -> None:
        """VALID_SUBCATEGORIES contains entries for all 5 categories.

        Returns:
            None
        """
        assert set(VALID_SUBCATEGORIES.keys()) == {
            "transport", "food", "energy", "shopping", "waste"
        }

    def test_total_subcategory_count(self) -> None:
        """Total number of subcategories across all categories is exactly 50.

        Returns:
            None
        """
        total = sum(len(subs) for subs in VALID_SUBCATEGORIES.values())
        assert total == 50


class TestSubcategoryLabels:
    """Tests for SUBCATEGORY_LABELS display names."""

    def test_car_petrol_label(self) -> None:
        """car_petrol has a non-empty display label.

        Returns:
            None
        """
        assert SUBCATEGORY_LABELS.get("car_petrol") == "Petrol car"

    def test_all_subcategories_have_labels(self) -> None:
        """Every subcategory in EMISSION_FACTORS has a label in SUBCATEGORY_LABELS.

        Returns:
            None
        """
        for cat, subcats in EMISSION_FACTORS.items():
            for sub in subcats:
                assert sub in SUBCATEGORY_LABELS, (
                    f"Subcategory '{sub}' in category '{cat}' has no label"
                )
