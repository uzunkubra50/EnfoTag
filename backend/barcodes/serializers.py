from rest_framework import serializers

from .models import Barcode, PrintPreset, Unit


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = ["id", "name", "barcode_prefix", "fields"]

    def validate_barcode_prefix(self, value):
        value = value.strip().upper()
        if not value:
            raise serializers.ValidationError("Barkod ön eki boş olamaz.")
        return value

    def validate_fields(self, value):
        if not isinstance(value, list) or not all(
            isinstance(item, str) and item.strip() for item in value
        ):
            raise serializers.ValidationError(
                'İndeks alanları metin listesi olmalıdır, ör. ["Ada", "Parsel"].'
            )
        return value


class BarcodeSerializer(serializers.ModelSerializer):
    unit_id = serializers.PrimaryKeyRelatedField(queryset=Unit.objects.all(), source="unit")
    unit_name = serializers.CharField(source="unit.name", read_only=True)
    created_by = serializers.StringRelatedField(read_only=True)
    updated_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Barcode
        fields = [
            "id", "name", "unit_id", "unit_name", "field_values",
            "is_active", "created_at", "updated_at", "created_by", "updated_by",
        ]
        read_only_fields = ["name", "created_at", "updated_at"]

    def validate_field_values(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                'Alan değerleri sözlük olmalıdır, ör. {"Ada": "4"}.'
            )
        return value

    def validate(self, attrs):
        # the unit's prefix is embedded in the name, so the unit cannot change afterwards
        if self.instance is not None and "unit" in attrs and attrs["unit"] != self.instance.unit:
            raise serializers.ValidationError(
                {"unit_id": "Mevcut bir barkodun birimi değiştirilemez."}
            )
        return attrs


class PrintPresetSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrintPreset
        fields = "__all__"
        extra_kwargs = {
            "per_row": {"min_value": 1, "max_value": 4},
            "count": {"min_value": 1},
        }
