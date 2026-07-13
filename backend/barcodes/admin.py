from django.contrib import admin

from .models import Barcode, PrintPreset, Unit


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ("name", "barcode_prefix", "fields")
    search_fields = ("name", "barcode_prefix")


@admin.register(Barcode)
class BarcodeAdmin(admin.ModelAdmin):
    list_display = ("name", "unit", "is_active", "created_by", "created_at")
    list_filter = ("is_active", "unit")
    search_fields = ("name",)


@admin.register(PrintPreset)
class PrintPresetAdmin(admin.ModelAdmin):
    list_display = ("name", "paper_w", "paper_h", "per_row", "count")
