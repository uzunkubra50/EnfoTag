from django.contrib.auth.models import User
from django.db import models


class Unit(models.Model):
    name = models.CharField(max_length=200)            # "Proje Tasdik ve Yapı Denetim Şefliği"
    barcode_prefix = models.CharField(max_length=10)   # "PTYD"
    fields = models.JSONField(default=list)            # ["Ada", "Parsel"]

    def __str__(self):
        return f"{self.name} ({self.barcode_prefix})"


class Barcode(models.Model):
    name = models.CharField(max_length=20, unique=True)  # "PTYD-0000001"
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT)
    field_values = models.JSONField(default=dict)        # {"Ada": "4", "Parsel": "238"}
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, related_name="+", on_delete=models.PROTECT)
    updated_by = models.ForeignKey(User, related_name="+", null=True, blank=True, on_delete=models.PROTECT)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class PrintPreset(models.Model):
    name = models.CharField(max_length=100)
    paper_w = models.FloatField()    # mm
    paper_h = models.FloatField()    # mm
    per_row = models.IntegerField()  # 1-4 arası
    count = models.IntegerField()    # basılacak adet
    barcode_w = models.FloatField()  # mm
    barcode_h = models.FloatField()  # mm
    gap = models.FloatField()        # barkodlar arası boşluk (mm)
    margin_top = models.FloatField()
    margin_bottom = models.FloatField()
    margin_left = models.FloatField()
    margin_right = models.FloatField()

    def __str__(self):
        return self.name
